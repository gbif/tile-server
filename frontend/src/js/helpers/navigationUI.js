var helper = require('./helper.js'),
    NO_TOUCH = false,
    TOUCH = true;

module.exports = function (options) {
    
    function toggleEvidence(event, context) {
        context.navigation.evidence = !context.navigation.evidence;
    }
    
    var nav = {
        supportsTouch: helper.supportsTouch,
        displayFilters: options.displayFilters,
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
