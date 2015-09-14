var MM = require('modestmaps');

module.exports = (function () {
    function createPolyOverlay(map) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            geometries = [],
            points = [];
        
        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.width = map.dimensions.x;
        canvas.height = map.dimensions.y;
        map.parent.appendChild(canvas);
        
        function getAsLocation(point) {
            return new MM.Location(point[0], point[1]);
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
            ctx.strokeStyle = 'deepskyblue';
            ctx.shadowColor = 'deepskyblue';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
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
                        var point = new MM.Location(coordinates[j][1], coordinates[j][0]);
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
        
        return {
            add: add,
            clear: clear,
            fitExtent: fitExtent
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
        
        return {
            add: addMarkers,
            fitExtent: fitExtent
        };
    }
    
    return {
        createPolyOverlay: createPolyOverlay,
        createMarkerOverlay: createMarkerOverlay
    };
})();
