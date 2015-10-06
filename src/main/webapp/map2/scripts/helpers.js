function getURLParameter(name) {
  return decodeURI(
    (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,""])[1]
  );
}

/**
 * Builds the geometry from the visible extents of the map, suitable for use in the GBIF search.
 */
function buildVisibleGeometry(map) {
  var bounds=map.getBounds();
  var sw=bounds.getSouthWest(); 
  var ne=bounds.getNorthEast();
  var se=bounds.getSouthEast();
  var nw=bounds.getNorthWest();
      
  // limit bounds to be valid casting to decimal
  sw.lng = Math.floor(sw.lng<-180 ? -180 : sw.lng);
  sw.lat = Math.floor(sw.lat<-90 ? -90 : sw.lat);
  nw.lng = Math.floor(nw.lng<-180 ? -180 : nw.lng);
  nw.lat = Math.ceil(nw.lat>90 ? 90 : nw.lat);
  ne.lng = Math.ceil(ne.lng>180 ? 180 : ne.lng);
  ne.lat = Math.ceil(ne.lat>90 ? 90 : ne.lat);
  se.lng = Math.ceil(se.lng>180 ? 180 : se.lng);
  se.lat = Math.floor(se.lat<-90 ? -90 : se.lat);  
  
  // in the format needed by GBIF search
  return sw.lng + " " + sw.lat + ","
    + nw.lng + " " + nw.lat + ","
    + ne.lng + " " + ne.lat + ","
    + se.lng + " " + se.lat + ","
    + sw.lng + " " + sw.lat;
}

var layers = {
  "classic" : {
    "name": "classic",
    "url": "http://{s}.tiles.mapbox.com/v3/timrobertson100.map-x2mlizjd/{z}/{x}/{y}.png",
    "attribution": "Mapbox, <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
    "png-render-style": "palette=yellows_reds",
  },
  "dark": {
    "name": "dark",
    "url": "http://{s}.tiles.mapbox.com/v3/timrobertson100.map-c9rscfra/{z}/{x}/{y}.png",
    "attribution": "Mapbox, <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
    "png-render-style": "saturation=true"
  },
  "ocean": {
    "name": "ocean",
    "url": "http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}.png",
    "attribution": "Esri, DeLorme, FAO, USGS, NOAA, GEBCO, IHO-IOC GEBCO, NGS, NIWA",
    "png-render-style": "palette=yellows_reds"
  },
  "satellite": {
    "name": "satellite",
    "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
    "attribution": "Esri, DeLorme, FAO, NOAA, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community",
    "png-render-style": "palette=yellows_reds"
  },
  "light": {
    "name": "light",
    "url": "http://{s}.tiles.mapbox.com/v3/timrobertson100.map-s9fg80cf/{z}/{x}/{y}.png",
    "attribution": "Mapbox, <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
    "png-render-style": "colors=%2C%2C%23CC0000FF"
  },
  "grey-blue": {
    "name": "grey-blue",
    "url": "http://2.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?app_id=_peU-uCkp-j8ovkzFGNU&app_code=gBoUkAMoxoqIWfxWA5DuMQ",
    "attribution": "Nokia",
    "png-render-style": "palette=yellows_reds"
  }
}

var resolutions = {
  "res1" : {
    "name" : "res1",
    "resolution" : 1
  },
  "res2" : {
    "name" : "res2",
    "resolution" : 2
  },
  "res4" : {
    "name" : "res4",
    "resolution" : 4
  },
  "res8" : {
    "name" : "res8",
    "resolution" : 8
  }
}; // 16, 32

var cats = {
  "sp": {
    "name": "sp",
    "title": "Preserved Specimens",
    "years": {
      "no":   0,
      "pre":  1,
      "1900": 2,
      "1910": 3,
      "1920": 4,
      "1930": 5,
      "1940": 6,
      "1950": 7,
      "1960": 8,
      "1970": 9,
      "1980": 10,
      "1990": 11,
      "2000": 12,
      "2010": 13
    }
  },
  "obs": {
    "name": "obs",
    "title": "Observations",
    "years": {
      "no":   14,
      "pre":  15,
      "1900": 16,
      "1910": 17,
      "1920": 18,
      "1930": 19,
      "1940": 20,
      "1950": 21,
      "1960": 22,
      "1970": 23,
      "1980": 24,
      "1990": 25,
      "2000": 26,
      "2010": 27
    }
  },
  "oth": {
    "name": "oth",
    "title": "Unknown evidence",
    "years": {
      "no":   30,
      "pre":  31,
      "1900": 32,
      "1910": 33,
      "1920": 34,
      "1930": 35,
      "1940": 36,
      "1950": 37,
      "1960": 38,
      "1970": 39,
      "1980": 40,
      "1990": 41,
      "2000": 42,
      "2010": 43
    }
  },
  "living": {
    "name": "living",
    "title": "Living Specimens",
    "key": 28
  },
  "fossil": {
    "name": "fossil",
    "title": "Fossils",
    "key": 29
  },
  "all": {
    "name": "all",
    "title": "Everything",
    "years": {
      "no":   [0, 14, 30, 28, 29],
      "pre":  [1, 15, 31],
      "1900": [2, 16, 32],
      "1910": [3, 17, 33],
      "1920": [4, 18, 34],
      "1930": [5, 19, 35],
      "1940": [6, 20, 36],
      "1950": [7, 21, 37],
      "1960": [8, 22, 38],
      "1970": [9, 23, 39],
      "1980": [10, 24, 40],
      "1990": [11, 25, 41],
      "2000": [12, 26, 42],
      "2010": [13, 27, 43]
    }
  }
};

var config = {
  CDN: "d30ugvnferw5sg.cloudfront.net",
  GBIF_URL: "http://d30ugvnferw5sg.cloudfront.net/map/density/tile/density/tile.tcjson?key=1&x={x}&y={y}&z={z}&type=TAXON",
  GRAPH_MARGIN: 10,
  GRAPH_H: 40,
  GRAPH_W: 444,
  ANALYSIS_OVERLAY_STYLE: {
    allowIntersection: false,
    shapeOptions: {
      color: '#DA6D64',
      opacity: 1
    }
  },
  TORQUE_LAYER_CARTOCSS: [
    '#layer {',
    '  polygon-fill: #FFFF00;',
    '  [value > 10] { polygon-fill: #FFCC00; }',
    '  [value > 100] { polygon-fill: #FF9900; }',
    '  [value > 1000] { polygon-fill: #FF6600; }',
    '  [value > 10000] { polygon-fill: #FF3300; }',
    '  [value > 100000] { polygon-fill: #CC0000; }',
    '}'
  ].join('\n'),
  LAYERTYPE: "png",
  MAP: {
    type: "ALL",
    key: 1,
    layer: "classic",
    resolution: 1,
    cat: "all",
    lat: 0,
    lng: 0,
    zoom: 1
  },
  SEARCH: {}
};
