var gulp = require('gulp');
var browserSync  = require('browser-sync');
var runSequence = require('run-sequence');
var config = require('../config').markup;


gulp.task('markup', function () {
    return gulp.src(config.src)
        .pipe(gulp.dest(config.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('markupProd', function () {
    return gulp.src(config.srcProd)
        .pipe(gulp.dest(config.dest));
});

