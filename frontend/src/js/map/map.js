var MM = require('maplib'),
    geoJsonOverlay = require('./geojsonOverlay.js');

module.exports = (function () {
    //MODEST MAPS
    //documentation is a bit scathered
    //https://github.com/modestmaps/modestmaps-js
    //http://code.modestmaps.com/v3.3.4/doc/#Map.getLayers
    //http://modestmaps.com/
    var templates = require('./templates/template.js'),
        map,
        overlay,
        geoJsonOverlays = [],
        mapParent,
        libAttribution = templates.attribution,
        eventlisteners = {extentChanges: []},
        changeTimer;
    function initMap(options) {
        var basemap = options.basemap,
            mapElement,
            baselayer;
        mapParent = options.parentElement;
        mapElement = mapParent.querySelector('.gbifMapComponent_map');
        
        //create map
        baselayer = new MM.TemplatedLayer(basemap.url, basemap.subdomains);
        map = new MM.Map(mapElement, baselayer, null, [
            MM.DragHandler(),
            MM.DoubleClickHandler(),
            MM.MouseWheelHandler(), // MM.MouseWheelHandler(),.precise(true), //for continuous zoom, but seems slow on firefox
            MM.TouchHandler()
        ]);
        
        map.setCenterZoom(new MM.Location(options.lat || 0, options.lng || 0), options.zoom || 1);
        map.setZoomRange(0, 14);
        
        //add handlers
        updateAttribution(basemap.attribution);
        addZoomButtonHandlers();
        addExtentListeners();
        
        
        overlay = new MM.TemplatedLayer('');
        map.insertLayerAt(1, overlay);
        if (options.geoJson) {
            addGeoJson(options.geoJson, typeof options.zoom === 'undefined');
        }
    }
    
    function addZoomButtonHandlers() {
        MM.addEvent(mapParent.querySelector('.gbifMapComponent_zoom-in'), "click", function (e) {
            map.zoomIn();
            return MM.cancelEvent(e);
        });
        
        MM.addEvent(mapParent.querySelector('.gbifMapComponent_zoom-out'), "click", function (e) {
            map.zoomOut();
            return MM.cancelEvent(e);
        });
    }
    
    function addExtentListeners() {
        map.addCallback("panned", mapExtentChange);
        map.addCallback("zoomed", mapExtentChange);
        map.addCallback("resized", mapExtentChange);
        map.addCallback("extentset", mapExtentChange);
    }
    
    function updateAttribution(att) {
        mapParent.querySelector('.attribution>span').innerHTML = libAttribution + att;
    }
    
    function setBaseMap(basemap) {
        var layer = new MM.TemplatedLayer(basemap.url, basemap.subdomains);
        if (!map.getLayerAt(0)) {
            map.insertLayerAt(0, layer);
        }else {
            map.setLayerAt(0, layer);
        }
        updateAttribution(basemap.attribution);
    }

    function setOverlay(templ) {
        overlay = new MM.TemplatedLayer(templ);
        if (!map.getLayerAt(1)) {
            map.insertLayerAt(1, overlay);
        }else {
            map.setLayerAt(1, overlay);
        }
    }
    
    function removeOverlay() {
        if (overlay) {
            overlay.disable();
        }
    }

    function hasOverlay() {
        if (overlay && overlay.enabled) {
            return true;
        }
        return false;
    }
    
    function getExtent() {
        return map.getExtent();
    }
    
    function setExtent(ext) {
        var zoom,
            extent = new MM.Extent(
            new MM.Location(ext.minimumLatitude, ext.minimumLongitude),
            new MM.Location(ext.maximumLatitude, ext.maximumLongitude)
        );
        map.setExtent(extent, false);
        zoom = Math.max(Math.min(map.getZoom(), 6), 1);
        map.setZoom(zoom);
    }
    
    function mapExtentChange(map, change) {
        if (changeTimer) {
            clearTimeout (changeTimer);
        }
        changeTimer = setTimeout(function () {
            notifyListeners(eventlisteners.extentChanges);
        }, 300);
    }

    function notifyListeners(listeners) {
        for (var i = 0; i < listeners.length; i++) {
            listeners[i](map.getExtent());
        }
    }

    function addExtentChangeListener(cb) {
        eventlisteners.extentChanges.push(cb);
    }

    function addGeoJson(collection, zoomToExtent) {
        var features = collection.features,
            len = features.length,
            points, poly;
        
        //contains supported feature types?
        points = features.filter(function (e) {
            return e.geometry.type == 'Point';
        });
        poly = features.filter(function (e) {
            return e.geometry.type == 'Polygon' || e.geometry.type == 'LineString';
        });
        
        //if so add them
        if (poly.length > 0) {
            var polyOverlay = geoJsonOverlay.createPolyOverlay(map);
            geoJsonOverlays.push(polyOverlay);
            polyOverlay.add(collection);
            if (zoomToExtent) {
                polyOverlay.fitExtent();
            }
        }
        if (points.length > 0) {
            var markerOverlay = geoJsonOverlay.createMarkerOverlay(map);
            geoJsonOverlays.push(markerOverlay);
            markerOverlay.add(collection);
            if (zoomToExtent) {
                markerOverlay.fitExtent();
            }
        }
        
    }

    function toggleGeoJsonOverlay() {
        geoJsonOverlays.forEach(function (e) {
            e.toggle();
        });
    }

    return {
        init: initMap,
        setBaseMap: setBaseMap,
        setOverlay: setOverlay,
        removeOverlay: removeOverlay,
        hasOverlay: hasOverlay,
        getExtent: getExtent,
        setExtent: setExtent,
        addExtentChangeListener: addExtentChangeListener,
        addGeoJson: addGeoJson,
        toggleGeoJsonOverlay: toggleGeoJsonOverlay
    };
})();
