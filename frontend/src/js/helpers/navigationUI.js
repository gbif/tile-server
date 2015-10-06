var helper = require('./helper.js'),
    NO_TOUCH = false,
    TOUCH = true;

module.exports = function (options) {
    
    function toggleEvidence(event, context) {
        context.navigation.evidence = !context.navigation.evidence;
    }
    
    function supportsFullscreen() {
        var device = {};
        device.ie9 = /MSIE 9/i.test(navigator.userAgent);
        device.ie10 = /MSIE 10/i.test(navigator.userAgent);
        device.ie11 = /rv:11.0/i.test(navigator.userAgent);
        return !(device.ie9 || device.ie10 || device.ie11);
    }
    
    var nav = {
        supportsTouch: helper.supportsTouch,
        simplifyInterface: options.simplifyInterface,
        hideFullScreenButton: options.simplifyInterface || !supportsFullscreen(),
        filters: false,
        styling: false,
        evidence: false,
        showFilters: function (event, context) {
            context.navigation.filters = true;
            context.navigation.styling = false;
        },
        showStyling: function (event, context) {
            context.navigation.filters = false;
            context.navigation.styling = true;
        },
        toggleEvidenceTouch: helper.ghostClickWrap(toggleEvidence, TOUCH),
        toggleEvidenceMouse: helper.ghostClickWrap(toggleEvidence, NO_TOUCH)
    };

    function hideAll() {
        nav.filters = false;
        nav.styling = false;
    }
    nav.hideAll = hideAll;
    return nav;
};
