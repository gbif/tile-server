gbif
====

```
python -m SimpleHTTPServer
```

Compile the project's sass files into css ```compass compile``` or watch the project for changes and compile whenever it does ```compass watch```

The map is acessible in the next URL:

```
http://vizzuality.github.io/index.html
```

Passing parameters to the url can modify the state of the map (type, latlng, zoom, style, cat). The parameters can be combined.

```
http://vizzuality.github.io/gbif/index.html?type=TAXON&key=1 // default
http://vizzuality.github.io/gbif/index.html?type=COUNTRY&key=ES
http://vizzuality.github.io/gbif/index.html?lat=39.407856289405856&lng=-0.361511299999961
http://vizzuality.github.io/gbif/index.html?zoom=11
http://vizzuality.github.io/gbif/index.html?style=satellite
http://vizzuality.github.io/gbif/index.html?cat=all
```

A tile version of the map is accessible for non-Torque-compatible browsers:

```
http://vizzuality.github.io/gbif/index.html?type=TAXON&key=1&layertype=png
```

To embed the map in a page you only have to place an iframe with one of the URLs:

```
<iframe id="iframe1" name="iframe1" src="http://vizzuality.github.io/gbif/index.html?type=TAXON&key=1" allowfullscreen height="423" width="627" frameborder="0" /></iframe>
```

When modifying the state of the map (latlng, zoom, style, records) an object will be returned to the parent page in the same form:

```
{
  origin: "iframe8",
  records: 19578339,
  url: "type=TAXON&key=1&layer=dark&cat=sp&lat=39.407856289405856&lng=-0.361511299999961&zoom=11"
}
```
