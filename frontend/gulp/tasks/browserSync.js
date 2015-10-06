var gulp        = require('gulp');
var browserSync = require('browser-sync');
var config      = require('../config').browserSync;

// Static server
gulp.task('browserSync', function() {
    browserSync(config);
});