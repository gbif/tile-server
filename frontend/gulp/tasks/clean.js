var gulp = require('gulp');
var del = require('del');
var config = require('../config').clean;

gulp.task('clean-all', function (cb) {
    del(config.all, {force: true}, cb);
});
gulp.task('clean-css', function (cb) {
    del(config.css, cb);
});

gulp.task('clean-js-ie', function (cb) {
    del(config.iejs, cb);
});