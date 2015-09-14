var rivets = require('./vendor/rivets.js'),
    evidence = require('./config/evidence.js'),
    dates = require('./config/dates.js'),
    interfaceText = require('./config/interface-text.js'),
    map = require('./map/map.js'),
    overlayUrl = require('./config/overlay.js').overlayUrl,
    templ = require('./templates/template.js'),
    helper = require('./helpers/helper.js'),
    fullscreen = require('./helpers/fullscreen.js'),
    stylingUI = require('./helpers/styleUI.js'),
    navigationUI = require('./helpers/navigationUI.js'),
    filtersUI = require('./helpers/filtersUI.js'),
    moduleElement,
    stateListener,
    navigation,
    filters,
    styling,
    shared,
    options = {
        type: 'TAXON',
        key: '1'
    };
    
module.exports = (function () {
    "use strict";
    
    function createMap(moduleElement, settings) {
        var mapParentElement,
            mapElement,
            baseMap;
        helper.extend(options, settings);
        createModels();
        
        //set evidence to math params or default
        if (options.cat == 'all') {
            options.cat = evidence.all;
        }
        //set active evidence based on options or defaults
        helper.setFlag({
            obj: filters.evidence.options,
            keys: options.cat ? options.cat : evidence.defaultOptions,
            property: 'active'
        });

        moduleElement.innerHTML = moduleElement.innerHTML + templ.html;
        mapParentElement = moduleElement.querySelector('.gbifBasicMap_mapComponent');
        mapElement = mapParentElement.querySelector('.gbifMapComponent_map');
        try {
            rivets.bind(moduleElement, {
                filters: filters,
                styling: styling,
                shared: shared,
                navigation: navigation,
                lang: interfaceText,
                map: map
            });
        }
        catch (err) {
            console.error(JSON.stringify(err.message));
        }

        //all interaction woth the map should close side navigation overlays
        helper.addEventListener(mapElement, 'click', navigation.hideAll);
        helper.addEventListener(mapElement, 'touchstart', navigation.hideAll);

        baseMap = styling.maps.options[styling.maps.selectedValue];
        map.init({
            basemap: baseMap,
            parentElement: mapParentElement,
            lat: options.lat,
            lng: options.lng,
            zoom: options.zoom,
            geoJson: options.geoJson
        });
        updateOverlay();
        map.addExtentChangeListener(function (extent) {
            navigation.hideAll();
            notifyListener(extent);
        });

        //if no zoom has been set and there is no geojson configured, then zoom and pan to a sensible zoom level
        if (!options.zoom && !options.geoJson) {
            helper.getMetaData(settings, updateExtendAndResolution);
        }

        fullscreen.addFullScreenButton({
            widget: moduleElement.querySelector('.gbifBasicMap'),
            button: moduleElement.querySelector('.fullscreen')
        });
    }

    /**
    Build the searchurl with the state of the map. To be used by the iframe parent
    */
    function notifyListener() {
        var extent,
            state;

        if (!stateListener) {
            return;
        }
        //Examples
        //TAXON_KEY=1459&HAS_GEOSPATIAL_ISSUE=false&GEOMETRY=-180+-89%2C-180+90%2C180+90%2C180+-89%2C-180+-89&YEAR=*%2C2020
        //DATASET_KEY=75018539-6328-41de-b875-7c2e61dc1635&HAS_GEOSPATIAL_ISSUE=false&GEOMETRY=-180+-82%2C-180+82%2C180+82%2C180+-82%2C-180+-82&BASIS_OF_RECORD=OBSERVATION&YEAR=*%2C2020
        extent = map.getExtent();
        state = {
            HAS_GEOSPATIAL_ISSUE: false,
            BASIS_OF_RECORD: filters.evidence.getActiveEvidenceAsArray().map(function (e) {
                return e.filterAbbr;
            }),
            GEOMETRY: helper.buildVisibleGeometry(extent.north, extent.south, extent.east, extent.west)
        };
        if (!filters.dates.options[0].active) {
            state.YEAR =   filters.dates.options[filters.dates.start].filterAbbr.start + ',' +
                            filters.dates.options[filters.dates.end].filterAbbr.end;
        }
        state[helper.apiTranslate(options.type)] = options.key;//the different APIs use different names. Trnalsate to match
        stateListener(helper.serialiseObject(state, true));
    }

    function updateExtendAndResolution(data) {
        if (data.count > 0) {
            setExtent(data);
        }
        if (data.resolution) {
            styling.size.selectedValue = data.resolution;
            updateOverlay();
        }
    }
    
    /**
    Stitch together settings for new overlay
    */
    function updateOverlay() {
        if (filters.evidence.getActiveEvidenceAsArray().length === 0) {
            map.removeOverlay();
        }else {
            var colors = styling.maps.options[styling.maps.selectedValue]["png-render-style"],
                params = helper.serialiseObject({
                    key: options.key,
                    layer: createFilter(filters),
                    type: options.type,
                    resolution: styling.size.selectedValue
                });
            map.setOverlay(overlayUrl + '?x={X}&y={Y}&z={Z}&' + colors + '&' + params);
        }
        filters.dates.showDates = isDatedEvidence(filters);
        notifyListener();
    }

    /**
    Creates layers based on a combination of Basis of Record (evidence) and Dates
    */
    function createFilter(filters) {
        var evidence,
            years,
            layer = [];
        //get active evidence and years
        evidence = filters.evidence.getActiveEvidenceAsArray();
        years = filters.dates.options.filter(function (e) {
            return e.active;
        });
        if (filters.dates.undated.active) {
            years.push(filters.dates.undated);
        }
        
        //combine to create layer anmes used by tile service
        evidence.forEach(function (e) {
            if (e.dated) {
                years.forEach(function (d) {
                    layer.push(e.abbr + '_' + d.abbr);
                });
            } else {
                layer.push(e.abbr);
            }
        });
        return layer;
    }

    function isDatedEvidence(filters) {
        var list = helper.filterObjToArray(filters.evidence.options, function (e) {
            return e.active && e.dated;
        });
        return list.length !== 0;
    }

    function createModels() {
        shared = {
            updateOverlay: updateOverlay
        };
        filters = filtersUI(options, shared);
        styling = stylingUI(options);
        navigation = navigationUI(options);
    }

    function setExtent(extent) {
        map.setExtent(extent);
    }
    
    function setStateListener(cb) {
        stateListener = cb;
    }
    
    function addGeoJson(collection) {
        map.addGeoJson(collection);
    }
    
    return {
        createMap: createMap,
        setStateListener: setStateListener,
        setExtent: setExtent,
        addGeoJson: addGeoJson
    };
})();
