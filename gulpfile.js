var gulp = require('gulp');
var gutil = require('gulp-util');


/* *************
	CSS
************* */

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var scss = require('postcss-scss');
var autoprefixer = require('autoprefixer');

var postcssProcessors = [
	autoprefixer( {
		browsers: ['last 2 versions']
	} )
];

var sassMainFile = 'src/css/main.scss';
var sassFiles = 'src/css/**/*.scss';

gulp.task('css', function() {
	gulp.src(sassMainFile)
		.pipe(
			postcss(postcssProcessors, {syntax: scss})
		)
		.pipe(
			sass({ outputStyle: 'compressed' })
			.on('error', gutil.log)
		)
		.pipe(gulp.dest('public/css'));
});



/* *************
	JS
************* */

var concat = require('gulp-concat');
var order = require("gulp-order");
var uglify = require('gulp-uglifyjs');
var babel = require('gulp-babel');
var jsFiles = 'src/js/**/*.js';


gulp.task('preJS-lib', function() {
	return gulp.src('src/js/lib/*.js')
		.pipe(uglify())
		.pipe(concat('1_lib.js'))
		.pipe(gulp.dest('tmp/'));
})
gulp.task('preJS-utils', function() {
	return gulp.src('src/js/utils/*.js')
		.pipe(
			babel({ presets: ['es2015'] })
				.on('error', gutil.log)
		)
		.pipe(uglify())
		.pipe(concat('2_utils.js'))
		.pipe(gulp.dest('tmp/'));
})
gulp.task('preJS-main', function() {
	return gulp.src('src/js/main/main.js')
		.pipe(
			babel({ presets: ['es2015'] })
				.on('error', gutil.log)
		)
		.pipe(uglify())
		.pipe(concat('4_main.js'))
		.pipe(gulp.dest('tmp/'));
})

gulp.task('js', ['preJS-lib', 'preJS-utils', 'templates', 'preJS-main'], function() {
	gulp.src('tmp/*.js')
		.pipe(concat('bundle.js'))
		.pipe(gulp.dest('public/js/'));
	gulp.src(['src/js/main/article.js', 'src/js/main/home.js', 'src/js/main/latest.js', 'src/js/main/saved.js'])
		.pipe(
			babel({ presets: ['es2015'] })
				.on('error', gutil.log)
		)
		.pipe(gulp.dest('public/js'));
	gulp.src('src/js/sw/*.js')
		.pipe(gulp.dest('public'));
});





/* *************
	HTML
************* */

var minifyHTML = require('gulp-minify-html');
var htmlreplace = require('gulp-html-replace');
var htmlFiles = 'src/*.html';

gulp.task('html', function() {
	return gulp.src(htmlFiles)
		.pipe(htmlreplace({
			'js': './js/bundle.js'
		}))
		.pipe(minifyHTML({ empty: true }))
		.pipe(gulp.dest('public'));
});


var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');

var templateFiles = 'src/templates/*.hbs';

gulp.task('templates', function () {
	return gulp.src(templateFiles)
		.pipe(handlebars())
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			namespace: 'MyApp.templates',
			noRedeclare: true, // Avoid duplicate declarations
		}))
		.pipe(concat('3_templates.js'))
		.pipe(gulp.dest('tmp/'));
});



/* *************
	SERVER
************* */

var connect = require('gulp-connect');

gulp.task('connect', function() {
	connect.server({
		port: 7230
	});
});




/* *************
	WATCH
************* */

gulp.task('watch', function() {
	gulp.watch(sassFiles,['css']);
	gulp.watch(jsFiles,['js']);
	gulp.watch(htmlFiles,['html']);
	gulp.watch(templateFiles, ['js'])
});



/* *************
	DEFAULT
************* */

gulp.task('default', ['connect', 'css', 'js', 'html', 'templates', 'watch']);
