/**
 * This is a copy of the density app, just to do point maps that use the same layer selector.
 */
var loaded        = false,
    map           = {},
    baseMap       = {},
    GOD           = {},
    mainLayer     = {};

function loadGBIF(callback) {
  GOD = new gbif.ui.view.GOD();
  window.GOD = GOD;

  var lat = getURLParameter("lat"),
      lng = getURLParameter("lng"),
      center = new L.LatLng(config.MAP.lat, config.MAP.lng);

  // http://vizzuality.github.io/gbif/index.html?lat=39.407856289405856&lng=-0.361511299999961
  if(lat && lng) {
    center = new L.LatLng(lat, lng);

    config.MAP.lat = lat;
    config.MAP.lng = lng;
  }

  // http://vizzuality.github.io/gbif/index.html?zoom=11
  if(getURLParameter("zoom")) {
    config.MAP.zoom = getURLParameter("zoom");
  }

  map = new L.Map('map', {
    center: center,
    zoom: config.MAP.zoom
  });

  if(getURLParameter("resolution")) {
    config.MAP.resolution = parseInt(getURLParameter("resolution"), 10);
  }

  if(getURLParameter("style")) {
    config.MAP.layer = getURLParameter("style");
  }

  var layerUrl = layers[config.MAP.layer]['url'];

  var layerOptions = {
    attribution: layers[config.MAP.layer]['attribution']
  }

  baseMap = new L.tileLayer(layerUrl, layerOptions);

  baseMap.addTo(map);

	// mock the main layer which the layer selector will call back  
  mainLayer = new Object();
  mainLayer.setStyle = function(mock){};

  // Layer selector
  layerSelector = new gbif.ui.view.LayerSelector({ map: map });
  $(".selectors").append(layerSelector.render());
  
  if(getURLParameter("point")) {
    var point = getURLParameter("point"); // comma separated as lat,lng
    L.marker(point.split(",")).addTo(map);
  }
}

/**
 * This adds an array of bounding boxes to the map to support GBIF dataset maps.
 */
function addBboxes(bboxes) {
    // draw the bounding boxes should they exist (for example from a geographic coverage in the dataset)
    if (typeof bboxes !== "undefined") {
      // bboxes have minLat,maxLat,minLng,maxLng
      $.each(bboxes, function(index, box) {
        alert(box);
        // handle boxes that are really points
        if (box[0]==box[1] && box[2]==box[3]) {
        L.marker([box[0], box[2]]).addTo(map);
        } else {
        var bounds = [[box[0], box[2]], [box[1], box[3]]];
          L.rectangle(bounds, {color: "#ff7800", weight: 2}).addTo(map);
          // Some small boxes don't show, so provide a marker
          L.marker([box[0] + ((box[1]-box[0])/2), box[2] + ((box[3]-box[2])/2)]).addTo(map);
        }
      });
    }
}

$(function() {
  loadGBIF();
});
