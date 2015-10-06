var gulp = require('gulp');
var uglify = require('gulp-uglify');
var config = require('../config').ie;

gulp.task('ie', function () {
    return gulp.src(config.src)
        .pipe(uglify())
        .pipe(gulp.dest(config.dest));
});