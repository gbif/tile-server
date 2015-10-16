var helper = require('./helper.js'),
    dates = require('../config/dates.js'),
    evidence = require('../config/evidence.js'),
    NO_TOUCH = false,
    TOUCH = true;

module.exports = function (options, shared) {
    
    function dragStart(e, c) {
        var diffStart = c.index - filters.dates.start,
            diffEnd = filters.dates.end - c.index;
        filters.dates.drag.dragging = true;

        if (filters.dates.start > filters.dates.end) {
            c.filters.dates.start = c.index;
            c.filters.dates.end = c.index;
            updateActiveDates(filters);
            return true;
        }

        e.preventDefault();

        filters.dates.drag.draggingStart = false;
        filters.dates.drag.draggingBoth = false;
        if (c.index == filters.dates.start && filters.dates.start == filters.dates.end) {
            filters.dates.end = c.index - 1;
        } else if (Math.abs(diffStart) == Math.abs(diffEnd)) {
            if (diffStart < 0) {
                filters.dates.start = c.index;
                filters.dates.drag.draggingStart = true;
            } else {
                filters.dates.end = c.index;
            }
        } else if (Math.abs(diffStart) < Math.abs(diffEnd)) {
            filters.dates.drag.draggingStart = true;
            if (diffStart === 0) {
                filters.dates.start = c.index + 1;
            } else {
                filters.dates.start = c.index;
            }
        } else {
            if (diffEnd === 0) {
                filters.dates.end = c.index - 1;
            } else {
                filters.dates.end = c.index;
            }
        }

        updateActiveDates(filters);
    }
    
    function touchmove(event, context) {
        var d = filters.dates.drag,
            element,
            index;
        if (d.dragging) {
            element = document.elementFromPoint(event.touches[0].pageX, event.touches[0].pageY);
            index = parseInt(element.getAttribute('index'));
            mouseenter(event, {index: index});
        }
    }
    
    function mouseenter(e, c) {
        var d = filters.dates.drag,
            diffStart,
            diffEnd;
        if (d.dragging) {
            diffStart = c.index - filters.dates.start;
            diffEnd = filters.dates.end - c.index;

            if (filters.dates.drag.draggingBoth) {
                filters.dates.start = c.index;
                filters.dates.end = c.index;
            } else if (filters.dates.drag.draggingStart) {
                filters.dates.start = Math.min(filters.dates.end, c.index);
            } else {
                filters.dates.end = Math.max(c.index, filters.dates.start);
            }

            updateActiveDates(filters);
        }
    }
    
    function mouseup(event) {
        var d = filters.dates.drag;
        if (d.dragging) {
            d.dragging = false;
            shared.updateOverlay();
            if (typeof ga !== 'undefined') {
                ga('send', 'event', 'map_dates', filters.dates.start, filters.dates.end - filters.dates.start);
            }
        }
    }
    helper.addEventListener(window, 'mouseup', mouseup);
    helper.addEventListener(window, 'touchend', mouseup);
    
    function updateActiveDates(filters) {
        var options = filters.dates.options,
            i;
        for (i = 0; i < options.length; i++) {
            if (i < filters.dates.start) {
                options[i].active = false;
            }else if (i > filters.dates.end) {
                options[i].active = false;
            }else {
                options[i].active = true;
            }

            if (i == filters.dates.start) {
                options[i].endpoint = true;
            } else if (i == filters.dates.end) {
                options[i].endpoint = true;
            }else {
                options[i].endpoint = false;
            }
        }
    }
    
    function selectEvidence(event, context) {
        if (typeof ga !== 'undefined') {
            var act = context.option.active ? 'deselect' : 'select';
            ga('send', 'event', 'map_evidence', act, context.option.abbr);
        }
        context.option.active = !context.option.active;
        context.shared.updateOverlay();
    }
    
    function toggleUndated(event, context) {
        if (typeof ga !== 'undefined') {
            var act = context.filters.dates.undated.active ? 'deselect' : 'select';
            ga('send', 'event', 'map_evidence', act, 'show undated');
        }
        context.filters.dates.undated.active = !context.filters.dates.undated.active;
        context.shared.updateOverlay();
    }
    
    function toggleEvidenceUndatedDesc(event, context) {
        context.filters.undated.showDescription = !context.filters.undated.showDescription;
        return false;
    }
    
    function getActiveEvidenceAsArray() {
        return helper.filterObjToArray(filters.evidence.options, function (e) {
            return e.active;
        });
    }
    
    filters = {
        undated: {
            toggleUndatedMouse: helper.ghostClickWrap(toggleUndated, NO_TOUCH),
            toggleUndatedTouch: helper.ghostClickWrap(toggleUndated, TOUCH),
            showDescription: false,
            toggleVisibilityMouse: helper.ghostClickWrap(toggleEvidenceUndatedDesc, NO_TOUCH),
            toggleVisibilityTouch: helper.ghostClickWrap(toggleEvidenceUndatedDesc, TOUCH)
        },
        dates: {
            undated: dates.undated,
            start: dates.start,
            end: dates.end,
            options: dates.options,
            mouseDragStart: helper.ghostClickWrap(dragStart, NO_TOUCH),
            touchDragStart: helper.ghostClickWrap(dragStart, TOUCH),
            mouseup: mouseup,
            mouseenter: mouseenter,
            touchmove: touchmove,
            drag: {
                dragging: false
            },
            showDates: true
        },
        evidence: {
            options: evidence.options,
            selectMouse: helper.ghostClickWrap(selectEvidence, NO_TOUCH),
            selectTouch: helper.ghostClickWrap(selectEvidence, TOUCH),
            getActiveEvidenceAsArray: getActiveEvidenceAsArray
        }
    };
    updateActiveDates(filters);
    return filters;
};
