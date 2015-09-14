var gutil = require('gulp-util');
module.exports = {
  isProduction: function() {
    return !!gutil.env.production;
  }
};