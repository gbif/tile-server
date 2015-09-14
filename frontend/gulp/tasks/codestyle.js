var gulp = require('gulp');
var jscs = require('gulp-jscs');
var stylish = require('gulp-jscs-stylish');
var noop = function () {};
var config = require('../config').javascript;

gulp.task('codestyle', function () {
    return gulp.src(config.src)
        .pipe(jscs({
            configPath: './.jscs.json'
        }))
        .on('error', noop)
        .pipe(stylish());
});
