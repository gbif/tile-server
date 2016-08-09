# standard-map
A basic map for usage on gbif.org

##Tile-server
When building (either production or default) the destination is `dist`.
Content of the folder is deleted before build.

Destination can be configured in `frontend/gulp/config.js`
```
var dest = "./src/main/webapp/map"
```

##Install
`npm install`

##Build
Build with gulp for production `node_modules/.bin/gulp production`

Or for development `node_modules/.bin/gulp`

##Parameters

key|values|Comment|Example
---|------|--------|------
type|TAXON, COUNTRY, DATASET|Always used together with a 'key'|
key|[int], [iso-abbr], [dataset-id] ||  ?type=TAXON&key=12
resolution|1,2,4,8||?resolution=8
style|classic, dark, ocean, satellite, light, grey-blue|| ?style=grey-blue
zoom|[integer]||?zoom=10
lat,lng|[float]|Only used when zoom is defined|?lat=56.5&lng=12.1&zoom=6
cat|all,sp,obs,oth,fossil,living,none|comma seperated list|?cat=sp,obs
point|[float],[float]|comma separated lat,lng|?point=62,24.6
geojson|encoded geojson|Experimental and only reads Points and LineStrings|

###Examples
* `?style=grey-blue&point=62,24.6&lat=62&lng=24.6&zoom=8`
* `?type=COUNTRY&key=AF`
* `?type=DATASET&key=75018539-6328-41de-b875-7c2e61dc1635&style=classic&resolution=4`
* `?type=TAXON&key=312&cat=sp,oth,fossil`

##iFrame communication
To push geojson to the iframe:

```
var cw = document.getElementById(iframeId).contentWindow;
var geojson = {geojson: { "type": "FeatureCollection",

"features": [
    {"id": "14618","type":"Feature","geometry":{"type":"Point","coordinates":[-122.477241,37.780437]}},
    {"id": "14610","type":"Feature","geometry":{"type":"Point","coordinates":[-122.45424,37.772879]}},
    { "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [ [50,50], [50,-50], [-50,-50], [-50,50], [50,50] ]
            ]
        }
    }
   ]
 }};
 
cw.postMessage(geojson, "*");
```
