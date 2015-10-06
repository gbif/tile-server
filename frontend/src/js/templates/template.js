var fs = require('fs'),
    src = fs.readFileSync('./src/js/templates/stdmap.html', 'utf8');
module.exports = {
    html: src
};
