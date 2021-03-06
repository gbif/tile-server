var MM = require('modestmaps');

module.exports = (function () {
    function createPolyOverlay(map) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            geometries = [],
            points = [],
            hidden;
        
        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.width = map.dimensions.x;
        canvas.height = map.dimensions.y;
        map.parent.appendChild(canvas);
        
        function getAsLocation(point) {
            var lat = Math.max(Math.min(85.0511, point[1]), -85.0511),
                lng = Math.max(Math.min(180, point[0]), -180);
            return new MM.Location(lat, lng);
        }
        
        function drawGeometry(ctx, geom) {
            var p = map.locationPoint(geom[0]),
                i;
            ctx.moveTo(p.x, p.y);
            for (i = 1; i < geom.length; i++) {
                p = map.locationPoint(geom[i]);
                ctx.lineTo(p.x, p.y);
            }
            //ctx.closePath();
            //ctx.fill();
            ctx.stroke();
        }
        
        function clear() {
            geometries = [];
            redraw();
        }
        
        function redraw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (hidden) {
                return;
            }
            ctx.strokeStyle = 'deepskyblue';
            ctx.shadowColor = 'deepskyblue';
            ctx.shadowBlur = 2;
            ctx.lineWidth = 1;
            //ctx.fillStyle = 'transparent';
            ctx.beginPath();
            for (var i = 0; i < geometries.length; i++) {
                drawGeometry(ctx, geometries[i]);
            }
        }
        
        function add(collection) {
            var features = collection.features,
                len = features.length;

            for (var i = 0; i < len; i++) {
                var feature = features[i],
                    geom = [];
                if (feature.type == 'Feature') {
                    var type = feature.geometry.type,
                        coordinates;
                    if (type == 'Polygon') {
                        coordinates = feature.geometry.coordinates[0];
                    }else if (type == 'LineString') {
                        coordinates = feature.geometry.coordinates;
                    }else {
                        continue;
                    }
                    for (var j = 0; j < coordinates.length; j++) {
                        var point = getAsLocation(coordinates[j]);
                        geom.push(point);
                        points.push(point);
                    }
                    geometries.push(geom);
                }
            }
            redraw();
        }
        
        function fitExtent() {
            map.setExtent(points);
            redraw();
        }
        
        map.addCallback('drawn', redraw);
        map.addCallback('resized', function () {
            canvas.width = map.dimensions.x;
            canvas.height = map.dimensions.y;
            redraw();
        });

        function toggle() {
            console.log('toggle geojson overlay poly');
            hidden = !hidden;
            redraw();
        }
        
        return {
            add: add,
            clear: clear,
            fitExtent: fitExtent,
            toggle: toggle
        };
    }
    
    function createMarkerOverlay(map) {
        var markers = new MM.MarkerLayer(),
            extent;
        map.addLayer(markers);
        
        function addMarkers(collection) {
            var features = collection.features,
                len = features.length;
            extent = [];
            for (var i = 0; i < len; i++) {
                var feature = features[i],
                    marker;
                if (feature.geometry.type != 'Point') {
                    continue;
                }
                marker = document.createElement("div");
                marker.setAttribute("class", "gbifBasicMapMarker");
                var img = marker.appendChild(document.createElement("img"));
                img.setAttribute("src", "images/marker-icon.png");

                markers.addMarker(marker, feature);
                extent.push(marker.location);
            }
        }
        
        function fitExtent() {
            map.setExtent(extent);
        }

        function toggle() {
            console.log('Marker toggle is not implemented');
        }
        
        return {
            add: addMarkers,
            fitExtent: fitExtent,
            toggle: toggle
        };
    }
    
    return {
        createPolyOverlay: createPolyOverlay,
        createMarkerOverlay: createMarkerOverlay
    };
})();
