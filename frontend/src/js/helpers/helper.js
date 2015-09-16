module.exports = (function () {
    var url = require('../config/overlay.js').jsonUrlTemplate,
        scale = 2,
        supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    function callAjax(url, callback) {
        try {
            var xmlhttp;
            // compatible with IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
                    callback(xmlhttp.responseText);
                }
            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        } catch (err) {
            console.error('Could not get meta data from server.');
        }
    }

    function addEventListener(element, eventType, func) {
        try {
            element.addEventListener(eventType, func);
        }
        catch (err) {
            console.error('Not supported in legacy browsers');
        }
    }

    function getEstimatedResolution(metaData) {
        if (metaData.count === 0) {
            return 1;
        }
        var width = metaData.maximumLatitude - metaData.minimumLatitude,
            height = metaData.maximumLongitude - metaData.minimumLongitude,
            density = width * height / metaData.count,
            concentration = 3 - 3 / (1 + density / scale),
            res = Math.pow(2, Math.round(concentration));
        return res;
    }

    function extend(a, b) {
        for (var attrname in b) {
            if (b.hasOwnProperty(attrname) && typeof b[attrname] !== 'undefined' && b[attrname] !== null) {
                a[attrname] = b[attrname];
            }
        }
        return a;
    }

    function getMetaData(settings, cb) {
        url = url
            .replace('{key}', settings.key)
            .replace('{type}', settings.type);
        callAjax(url, function (response) {
            var data = JSON.parse(response);
            data.minimumLatitude = Math.max(-90, data.minimumLatitude - 2);
            data.minimumLongitude = Math.max(-180, data.minimumLongitude - 2);
            data.maximumLatitude = Math.min(90, data.maximumLatitude + 2);
            data.maximumLongitude = Math.min(180, data.maximumLongitude + 2);
            if (!settings.resolution) {
                data.resolution = getEstimatedResolution(data);
            }
            cb(data);
        });
    }

    function filterObjToArray(obj, predicate) {
        var result = [], key;
        for (key in obj) {
            if (obj.hasOwnProperty(key) && predicate(obj[key])) {
                result.push(obj[key]);
            }
        }
        return result;
    }
    
    function setFlag(settings) {
        var key;
        for (key in settings.obj) {
            if (settings.obj.hasOwnProperty(key)) {
                settings.obj[key][settings.property] = settings.keys.indexOf(key) > -1;
            }
        }
        return settings.obj;
    }
    
    /**
    Simple wrapper to prevent ghost clicks
    */
    function ghostClickWrap(func, isTouchEvent) {
        return function () {
            if (isTouchEvent ? !supportsTouch : supportsTouch) {
                return;
            }
            func.apply(this, arguments);
        };
    }
    
    function serialiseObject(obj, encode) {
        var pairs = [];

        function addParam(prop, val) {
            val = encode ? encodeURIComponent(val) : val;
            pairs.push(prop + '=' + val);
        }
        for (var prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
                continue;
            }
            if (Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                for (var i = 0; i < obj[prop].length; i++) {
                    addParam(prop, obj[prop][i]);
                }
            } else {
                addParam(prop, obj[prop]);
            }
        }
        return pairs.join('&');
    }

    function apiTranslate(type) {
        switch (type) {
            case 'TAXON':
                return 'TAXON_KEY';
            case 'DATASET':
                return 'DATASET_KEY';
            default:
                return type;
        }
    }

    /**
     * Builds the geometry from the visible extents of the map, suitable for use in the GBIF search.
     */
    function buildVisibleGeometry(n, s, e, w) {
        function normalize(c) {
            c = Math.round(c * 100) / 100;
            while (c < -180) {
                c += 360;
            }
            while (c > 180) {
                c -= 360;
            }
            return c;
        }
        e = normalize(e);
        w = normalize(w);
        n = normalize(n);
        s = normalize(s);
        var tmpl = '{w} {s},{w} {n},{e} {n},{e} {s},{w} {s}',
            res = tmpl.replace(/{n}/g, n)
            .replace(/{e}/g, e)
            .replace(/{s}/g, s)
            .replace(/{w}/g, w);
        return res;
    }

    return {
        extend: extend,
        getMetaData: getMetaData,
        serialiseObject: serialiseObject,
        apiTranslate: apiTranslate,
        buildVisibleGeometry: buildVisibleGeometry,
        addEventListener: addEventListener,
        filterObjToArray: filterObjToArray,
        setFlag: setFlag,
        ghostClickWrap: ghostClickWrap,
        supportsTouch: supportsTouch
    };
})();
