var baselayers = require('../config/baselayers.js'),
    resolution = require('../config/resolution.js'),
    helper = require('./helper.js'),
    docCookies = require('./cookie.js'),
    NO_TOUCH = false,
    TOUCH = true;

module.exports = function (options) {
    /**
    Returns either the basemap key stored in a cookie or if none,
    the default one descibed in the baseLayers configuration
    */
    function getDefaultMapId() {
        var cookieSettings;
        if (docCookies.hasItem('settings')) {
            cookieSettings = JSON.parse(docCookies.getItem('settings'));
            if (baselayers.options[cookieSettings.baseMapId]) {
                return cookieSettings.baseMapId;
            }
        }
        return baselayers.defaultOption;
    }
    
    function selectMap(event, context) {
        if (typeof ga !== 'undefined') {
            ga('send', 'event', 'map_basemap', 'select', context.option.id);
        }
        context.styling.maps.selectedValue = context.option.id;
        context.map.setBaseMap(context.option);
        docCookies.setItem('settings', JSON.stringify({baseMapId: context.option.id}));//save the prefered basemap in a cookie
        context.shared.updateOverlay(); //since the baselayer defines the color scheme of the overlay
    }
    
    function selectResolution(event, context) {
        if (typeof ga !== 'undefined') {
            ga('send', 'event', 'map_resolution', 'select', context.option.name, context.option.resolution);
        }
        context.styling.size.selectedValue = context.option.resolution;
        context.shared.updateOverlay();
    }

    function toggleOverlay(event, context) {
        context.styling.information.options.geojson.active = !context.styling.information.options.geojson.active;
        context.shared.toggleGeoJsonOverlay();
    }

    var styling = {
        maps: {
            options: baselayers.options,
            selectedValue: baselayers.options[options.style] ? options.style : getDefaultMapId(),
            select: selectMap
        },
        size: {
            options: resolution.options,
            selectedValue: options.resolution || resolution.options[resolution.defaultOption].resolution,
            select: selectResolution
        },
        information: {
            show: false,
            options: {
                geojson: {
                    active: true,
                    click: helper.ghostClickWrap(toggleOverlay, NO_TOUCH),
                    touch: helper.ghostClickWrap(toggleOverlay, TOUCH)
                }
            }
        }
    };
    return styling;
};
