window.GBIF = window.GBIF || {};
GBIF.basicMap = require('./basicMap.js');

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || ['', ''])[1].replace(/\+/g, '%20')) || null;
}

/** Parse url and generate a configuration object for the map and interface */
function getQuery() {
    //var route = window.location.hash.toUpperCase().slice(1).split('/'); //for hash routing
    var cat = getURLParameter('cat'),
        displayFilters = getURLParameter('displayfilters'),
        geojson = getURLParameter('geojson'),
        point = getURLParameter('point');
    
    cat = cat ? cat.split(',') : undefined;
    geojson = geojson ? JSON.parse(geojson) : undefined;
    //if a point is supplied it will override the geojson at this point
    if (point) {
        point = point.split(',');
        displayFilters = displayFilters || 'false'; //when showing a point the default is to hide the filters
        cat = cat || 'none';
        //geojson expects lon,lat
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {"type": "Feature", "geometry": {"type": "Point", "coordinates": [parseFloat(point[1]), parseFloat(point[0])]}}
            ]
        };
    }
    
    displayFilters = displayFilters == 'false' ? false : true;

    return {
        type: getURLParameter('type') || 'TAXON',
        key: getURLParameter('key') || 1,
        resolution: getURLParameter('resolution'),
        lat: getURLParameter('lat'),
        lng: getURLParameter('lng'),
        zoom: getURLParameter('zoom') || getURLParameter('default_zoom'),
        style: getURLParameter('style'),
        geoJson: geojson,
        displayFilters: displayFilters,
        cat: cat
    };
}
var settings = getQuery();

GBIF.basicMap.createMap(document.body, settings);

// Listen for changes in the map and notify the iframe parent
GBIF.basicMap.setStateListener(function (state) {
    //the post back message is not in the format descirbed in the current documentation,
    //but the one that seems to be used in the current production version.
    parent.postMessage({
        origin: window.name,
        url: window.location.origin,
        searchUrl: state
    }, '*');
});



/**
Listen to messages from parent when in iframe
Example usage:
var cw = document.getElementById(iframeId).contentWindow;
cw.postMessage({geojson: { "type": "FeatureCollection",
    "features": [
        {"id": "14614","type":"Feature","geometry":{"type":"Point","coordinates":[-122.412483,37.770631]}},
        {"id": "43151","type":"Feature","geometry":{"type":"Point","coordinates":[-122.434025,37.750259]}},
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
     }}, "*");
*/
function addGeoJson(evt) {
    if (evt.data.geojson) {
        GBIF.basicMap.addGeoJson(evt.data.geojson);
    }
}

if (window.addEventListener) {
    // For standards-compliant web browsers
    window.addEventListener("message", addGeoJson, false);
} else {
    window.attachEvent("onmessage", addGeoJson);
}
