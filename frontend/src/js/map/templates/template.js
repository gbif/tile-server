var fs = require('fs'),
    attributionHtml = fs.readFileSync('./src/js/map/templates/attribution.html', 'utf8');
module.exports = {
    attribution: attributionHtml
};
