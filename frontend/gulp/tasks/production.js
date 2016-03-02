var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('production', function (callback) {
    runSequence(
        ['clean-all'],//to use clean either force delete outside folder or change dist 
        ['markupProd', 'images', 'ie', 'mapevents', 'lint', 'codestyle'],
        ['sass', 'browserify'], 
        ['minifyCss'],
        ['uglifyJs'],
        callback);
});
