var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('development', function(callback) {
    runSequence(
        //['clean-all'],//to use clean either force delete outside folder or change dist 
        ['markup', 'images', 'ie', 'mapevents', 'lint', 'codestyle'],
        ['browserify', 'sass', 'watch'],
        callback);
});