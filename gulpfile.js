"use strict";

//Load Plugins
const autoprefixer = require("gulp-autoprefixer"),
    browsersync = require("browser-sync"),
    cleanCSS = require("gulp-clean-css"),
    del = require("del"),
    fileinclude = require("gulp-file-include"),
    gulp = require("gulp"),
    header = require("gulp-header"),
    merge = require("merge-stream"),
    plumber = require("gulp-plumber"),
    rename = require("gulp-rename"),
    sass = require('gulp-sass')(require('sass')),
    uglify = require("gulp-uglify");

//Load package.json
const pkg = require('./package.json');

//Set the banner content
const banner = ['/*!\n',
  ' * HIC Front - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2021-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' */\n',
  '\n'
].join('');

//BrowserSync
function browserSync(done){
    browsersync.init({
        server: {
            baseDir: "./dist"
        },
        port: 3000
    });
    done();
}

//Clean Vendor
function clean(){
    return del(["./vendor"]);
}

//Bring thrird party dependencies from node_modules into vendor directory
function modules(){
    //Bootstrap
    var bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
        .pipe(gulp.dest('./src/vendor/bootstrap'))
        .pipe(gulp.dest('./dist/vendor/bootstrap'));
    
    //Bootstrap-Icons
    var bootstrapIcons = gulp.src('./node_modules/bootstrap-icons/font/**/*')
        .pipe(gulp.dest('./src/vendor/bootstrap-icons/'))
        .pipe(gulp.dest('./dist/vendor/bootstrap-icons/'));


    //jQuery
    var jquery = gulp.src([
        './node_modules/jquery/dist/*',
        '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./src/vendor/jquery'))
    .pipe(gulp.dest('./dist/vendor/jquery'));


    //Popper
    var popper = gulp.src(
        './node_modules/@popperjs/core/dist/cjs/popper.js'
    )
    .pipe(gulp.dest('./src/vendor/popper.js'))
    .pipe(gulp.dest('./dist/vendor/popper.js'));

    return merge(bootstrap, jquery, popper, bootstrapIcons);

}

//CSS Task
function css() {
    return gulp
    .src("./src/scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({
        outputStyle: "expanded",
        includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
        cascade: false
    }))
    .pipe(header(banner,{
        pkg: pkg
    }))
    .pipe(gulp.dest("./dist/css"))
    .pipe(rename({
        suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./dist/css"))
    .pipe(browsersync.stream());
}

//JS Task
function js() {
    return gulp
    .src([
        './src/js/*.js',
        '!./src/js/*.min.js'
    ])
    .pipe(uglify())
    .pipe(header(banner, {
        pkg: pkg
    }))
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browsersync.stream());
}

//HTML Task
function HTMLTask() {
    return gulp.src(["src/**/*.html", "!src/partials/*.html"])
      .pipe(
        fileinclude({
          prefix: "@@",
          basepath: "@file",
        })
      )
      .pipe(gulp.dest("dist"))
      .pipe(browsersync.stream());
  }

// Image tasks
function imgTask() {
    return gulp.src("src/images/**/*")
      .pipe(gulp.dest("dist/images"))
      .pipe(browsersync.stream());
  }
  
//Watch Files
function watchFiles() {
    gulp.watch("./src/scss/**/*", css).on("change", browsersync.reload);
    gulp.watch(["./src/js/**/*", "!./js/**/.min.js"], js).on("change", browsersync.reload);
    gulp.watch("./src/**/*.html",HTMLTask).on("change", browsersync.reload);
    gulp.watch("./src/images/**/*", imgTask).on("change", browsersync.reload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(clean,vendor, gulp.parallel(css, js, HTMLTask, imgTask));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.HTMLTask = HTMLTask;
exports.vendor = vendor;
exports.imgTask = imgTask;
exports.watch = watch;
exports.clean = clean;
exports.build = build;
exports.default = gulp.series(
    gulp.parallel(modules, css, js, HTMLTask)
  );