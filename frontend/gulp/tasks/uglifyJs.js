var gulp = require('gulp');
var uglify = require('gulp-uglify');
var config = require('../config');
var hash = require('gulp-hash-filename');
var rename = require('gulp-rename');
var inject = require('gulp-inject');

gulp.task('uglifyJs', function () {
    var jsStream = gulp.src(config.inject.jsMain)
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.basename += ".min";
        }))
        .pipe(hash({ "format": "{name}-{hash}{ext}" }))
        .pipe(gulp.dest(config.inject.dest));
    
        return gulp.src(config.markup.dest + '/**/*.html')
            .pipe(inject(jsStream, {read: false, ignorePath: config.inject.ignore, addRootSlash: false}))
            .pipe(gulp.dest(config.dest));
});