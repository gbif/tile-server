var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var gutil = require('gulp-util');
var hash = require('gulp-hash-filename');
var rename = require('gulp-rename');
var inject = require('gulp-inject');
var config = require('../config');
//var isProduction = require('../util/helper').isProduction();

gulp.task('minifyCss', function () {
    var cssStream = gulp.src(config.inject.cssSrc)
        .pipe(minifyCSS())
        .pipe(rename(function (path) {
            path.basename += ".min";
        }))
        .pipe(hash({ "format": "{name}-{hash}{ext}" }))
        .pipe(gulp.dest(config.inject.dest));
    
    return gulp.src(config.markup.dest + '/**/*.html')
        .pipe(inject(cssStream, {read: false, ignorePath: config.inject.ignore, addRootSlash: false, name: 'style'}))
        .pipe(gulp.dest(config.dest));
});
