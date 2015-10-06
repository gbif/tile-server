var gulp = require('gulp');
var config = require('../config');

gulp.task('watch', ['browserSync'], function () {
    gulp.watch(config.markup.src, ['markup']);
    gulp.watch(config.sass.src, ['sass']);
    gulp.watch(config.javascript.folder, ['lint', 'codestyle', 'browserify']);
});
