var gulp = require('gulp');
var browserSync  = require('browser-sync');
var runSequence = require('run-sequence');
var config = require('../config').markup;

/*
Consider creating a task for refreshing markup and subsequently sass and js inject. Currently it depends on the css and js to be hardcoded in the src html
Regenerating the html will remove the injected css and js
Something along the lines of:
*/
/*
gulp.task('markupRefresh', function (callback) {
    runSequence(
        'markup',
        'browserify',
        'sass',
        'BROWSER SYNC RELOAD TASK?',
        callback);
});*/

gulp.task('markup', function () {
    return gulp.src(config.src)
        .pipe(gulp.dest(config.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});

