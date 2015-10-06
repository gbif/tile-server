module.exports = (function () {
    var baseUrlForTesting = document.baseUrlForTesting || '';

    return {
        overlayUrl: baseUrlForTesting + 'density/tile.png',
        jsonUrlTemplate: baseUrlForTesting + 'density/tile.json?key={key}&resolution=1&x=0&y=0&z=0&type={type}'
    };
})();
