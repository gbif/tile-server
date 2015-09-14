var sightglass = require('sightglass'),
    rivets = require('rivets');

/**
add an rv_index property to the list, starting at the index specified (defaults to 0)
*/
rivets.formatters.indexList = function (obj, startAtIndex) {
    return (function () {
        if (!startAtIndex) {
            startAtIndex = 0;
        }
        return obj.slice(startAtIndex).map(function (e, index) {
            e.rv_index = index + startAtIndex;
            return e;
        });
    })();
};

/**
Example usage:
rv-each-option="filters.evidence.options | objectList 'id'"
Will turn the object into a list adding the key as 'id'
So {a: {test: 5}} will become [{test: 5, id: a}]
*/
rivets.formatters.objectList = function (obj, id) {
    return (function () {
        var list = [],
            element, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                element = obj[key];
                element[id] = key;
                list.push(element);
            }
        }
        return list;
    })();
};

/**
Set the attribute index to the specified value
Example
rv-index="option.myindexvalue"
*/
rivets.binders.index = function (el, value) {
    el.setAttribute('index', value);
};

module.exports = rivets;