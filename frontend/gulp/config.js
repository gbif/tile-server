var dest = "../src/main/webapp/mapBuild",
    src = './src';

module.exports = {
    src: src,
    dest: dest,
    markup: {
        src: src + "/html/**/*.html",
        srcProd: [src + "/html/**/*.html", "!" + src + "/html/**/*-test.html"],
        dest: dest
    },
    javascript: {
        main: src + "/js/script.js",
        src: [src + "/js/**/*.js", '!' + src + '/js/ie8.js', '!' + src + '/js/vendor/**/*.*', '!' + src + '/js/map-events.js'],
        folder: src + "/js/**/*.*",
        dest: dest
    },
    sass: {
        src: src + "/sass/**/*.{sass,scss}",
        dest: dest + '/css'
    },
    browserSync: {
        server: {
            // Serve up our build folder
            baseDir: dest
        }
    },
    inject: {
        cssSrc: dest + '/**/*.css',
        jsMain: [dest + '/script.js'],
        jsIE: dest + '/**/ie/**/*.js',
        dest: dest,
        ignore: dest
    },
    clean: {
        all: [dest + '/**/*.*'],
        css: [dest + '/**/*.css'],
        iejs: [dest + '/ie/*.js']
    },
    ie: {
        src: [src + '/js/ie8.js'],
        dest: dest + '/ie'
    },
    mapevents: {
        src: [src + '/js/map-events.js'],
        dest: dest + '/'
    },
    images: {
        src: [src + '/images/**/*.*'],
        dest: dest + '/images'
    }
};
