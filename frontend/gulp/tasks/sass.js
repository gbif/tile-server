var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var notify = require('gulp-notify');
var autoprefixer = require('gulp-autoprefixer');
var inject = require('gulp-inject');
var config = require('../config');

gulp.task('sass', function () {
    var cssStream = gulp.src(config.sass.src)
        .pipe(sass())
        .on("error", notify.onError(function (error) {
            return error.message;
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 version']
        }))
        .pipe(gulp.dest(config.sass.dest));
    
    return gulp.src(config.markup.dest + '/**/*.html')
        .pipe(inject(cssStream, {read: false, ignorePath: config.inject.ignore, addRootSlash: false, name: 'style'}))
        .pipe(gulp.dest(config.markup.dest)).pipe(browserSync.reload({
            stream: true
        }));
});