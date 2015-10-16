window.GBIF = window.GBIF || {};
GBIF.basicMap = require('./basicMap.js');

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || ['', ''])[1].replace(/\+/g, '%20')) || null;
}

/** Parse url and generate a configuration object for the map and interface */
function getQuery() {
    //var route = window.location.hash.toUpperCase().slice(1).split('/'); //for hash routing
    var cat = getURLParameter('cat'),
        simplifyInterface = getURLParameter('simplifyInterface'),
        geojson = getURLParameter('geojson'),
        point = getURLParameter('point');
    
    cat = cat ? cat.split(',') : undefined;
    geojson = geojson ? JSON.parse(geojson) : undefined;
    //if a point is supplied it will override the geojson at this point
    if (point) {
        point = point.split(',');
        simplifyInterface = simplifyInterface === null ? true : simplifyInterface; //when showing a point the default is to simplify the interface
        cat = cat || 'none';
        //geojson expects lon,lat
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {"type": "Feature", "geometry": {"type": "Point", "coordinates": [parseFloat(point[1]), parseFloat(point[0])]}}
            ]
        };
    }

    simplifyInterface = simplifyInterface !== null ? simplifyInterface : false;

    return {
        type: getURLParameter('type') || 'TAXON',
        key: getURLParameter('key') || 1,
        resolution: getURLParameter('resolution'),
        lat: getURLParameter('lat'),
        lng: getURLParameter('lng'),
        zoom: getURLParameter('zoom') || getURLParameter('default_zoom'),
        style: getURLParameter('style'),
        geoJson: geojson,
        simplifyInterface: simplifyInterface,
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



// listen for messages from the parent (in case of embedded in iframe) and listen for instructions to add geojson layer.
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



//Prevent scroll on body element, used when embeded as iframe and we do not want to scroll parent page ever.
function preventscroll(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.returnValue = false;
    return false;
}

//The joys of browser inconsistencies
var scrollElement = document.querySelector('.gbifBasicMap_mapComponent');

scrollElement.addEventListener('scroll', preventscroll);
scrollElement.addEventListener('mousewheel', preventscroll);
scrollElement.addEventListener('DOMMouseScroll', preventscroll);
scrollElement.addEventListener('MozMousePixelScroll', preventscroll);

