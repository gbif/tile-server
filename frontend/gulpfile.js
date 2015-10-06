/*
  gulpfile.js
  ===========
  Rather than manage one giant configuration file responsible
  for creating multiple tasks, each task has been broken out into
  its own file in gulp/tasks. Any files in that directory get
  automatically required below.
  To add a new task, simply add a new task file in the tasks directory.
  gulp/tasks/default.js specifies the default set of tasks to run
  when you run `gulp`.
*/

var gulp = require('gulp');
var requireDir = require('require-dir');
var gutil = require('gulp-util');
var helper = require('./gulp/util/helper');

// Require all tasks in gulp/tasks, including subfolders
requireDir('./gulp/tasks', { recurse: true });

var isProduction = helper.isProduction();

// Default Task
if (isProduction)
    gulp.task('default', ['production']);
else
    gulp.task('default', ['development']);