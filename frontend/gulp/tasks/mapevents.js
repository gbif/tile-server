var gulp = require('gulp');
var uglify = require('gulp-uglify');
var config = require('../config').mapevents;

gulp.task('mapevents', function () {
    return gulp.src(config.src)
        .pipe(uglify())
        .pipe(gulp.dest(config.dest));
});