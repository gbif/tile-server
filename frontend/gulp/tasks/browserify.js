var gulp = require('gulp');
var browserSync = require('browser-sync');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var notify = require('gulp-notify');
var config = require('../config').javascript;

gulp.task('browserify', function () {
    return browserify(config.main)
        .bundle()
        .on("error", notify.onError(function (error) {
            return error.message;
        }))
        .pipe(source('script.js'))
        .pipe(gulp.dest(config.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});

/*
var g_browserify = require('gulp-browserify');
gulp.task('browserify2', function () {
    gulp.src(config.main)
        .pipe(g_browserify({
            debug: true, //TODO use env.variable instead
            shim: {
                sightglass: {
                    path: './node_modules/sightglass/index.js',
                    exports: 'sightglass'
                },
                rivets: {
                    path: './node_modules/rivets/dist/rivets.js',
                    deps: ['sightglass'],
                    exports: 'rivets'
                },
                modestmaps: {
                    path: './node_modules/modestmaps/modestmaps.min.js',
                    exports: 'MM'
                }
            }
        }))
        .on("error", notify.onError(function (error) {
            return error.message;
        }))
        .pipe(gulp.dest(config.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});
*/