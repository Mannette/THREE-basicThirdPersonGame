/**
 * Module Dependencies
 */

var gulp        = require('gulp'),
    jshint      = require('gulp-jshint'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload,
    nodemon     = require('gulp-nodemon'),
    babel       = require('gulp-babel'),
    eslint      = require('gulp-eslint'),
    sass        = require('gulp-sass');

/**
 * Config
 */

var paths = {
  styles: [
    './client/css/*.css'
  ],
  scripts: [
    './client/js/*.js'
  ],
  server: [
    './server/bin/www'
  ],
  es6: [
    './client/js/es6/*.js'
  ],
  sass: [
    './client/scss/*.scss'
  ]
};

var nodemonConfig = {
  script: paths.server,
  ext: 'html js css',
  ignore: ['node_modules']
};


/**
 * Gulp Tasks
 */

gulp.task('lint', function() {
  return gulp.src(paths.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('browser-sync', ['nodemon'], function(done) {
  browserSync({
    proxy: "localhost:3000",  // local node app address
    port: 5000,  // use *different* port than above
    notify: true
  }, done);
});

gulp.task('nodemon', function(cb) {
  var called = false;
  return nodemon(nodemonConfig)
  .on('start', function () {
    if (!called) {
      called = true;
      cb();
    }
  })
  .on('restart', function() {
    setTimeout(function() {
      reload({ stream: false });
    }, 1000);
  });
});

gulp.task('transpile', function() {
  return gulp.src('./client/js/es6/background.js')
    .pipe(babel({
      presets: ['es2015']
    }))
      // .on('error', function(error) {
      // console.error('*****ERROR*****', '\n', error.name, '\n', error.message);
      // })
    .pipe(gulp.dest('./client/js/homepage'));
});

gulp.task('sass', function() {
  return gulp.src(paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./client/css'));
})

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['lint']);
  gulp.watch(paths.sass,    ['sass']);
  gulp.watch(paths.es6,     ['transpile']);
});

gulp.task('default', ['browser-sync', 'watch'], function(){});
