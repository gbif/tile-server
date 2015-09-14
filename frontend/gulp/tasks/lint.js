var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require('gulp-notify');
var config = require('../config').javascript;

var onError = function (err) {
    console.log(err);
}

//TODO consider adding a notification on failure
gulp.task('lint', function () {
    return gulp.src(config.src)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
        .on("error", notify.onError(function (error) {
            return error.message;
        }));
});
