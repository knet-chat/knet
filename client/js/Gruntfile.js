module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: "\n", //add a new line after each file
				banner: "", //added before everything
				footer: "" //added after everything
			},
			build: {
				files: {
		        	'lib-1.js': [
		   				'fastClick.js',
						'jquery-1.10.2.min.js',
						'jquery.mobile.mobileinit.js',
						'jquery.mobile-1.4.5.min.js',
						'jquery.browser.min.0.1.0.js',
						'jquery.picedit-1.0.0.js',
						'jquery.emojipicker.js',
						'jquery.emojipicker.tw.js',
						'jquery.debouncedresize.js'
		        	],
		        	'lib-2.js': [
						'twemoji.min.js',
						'log4javascript-1.4.13.js',
						'photoswipe.min.js',
						'photoswipe-ui-default.min.js',
						'jsrsasign-4.1.4-all-min.js',
						'json-sans-eval-min.js',
						'jws-3.0.min.js'						
					],
		        	'lib-3.js': [
 						'indexeddbshim.min-2.2.1.js',
						'cldr-0.4.3.js',
						'./cldr/event.js',
						'./cldr/supplemental.js',
						'globalize-1.1.0.js',
						'./globalize/date_number.min.js',
						'socket.io-1.3.5.js',
 						'pickadate.js-3.5.6/picker.js',
 						'pickadate.js-3.5.6/picker.date.js',
 						'pickadate.js-3.5.6/picker.time.js',
 						'pickadate.js-3.5.6/legacy.js',
 						'easyrtc-1.0.15.js'
 		        	],
		        	'lib-4.js': [ 
        	              'forge.bundle-0.7.0.js'
		        	]
		      	}
			}
		},
		uglify: {
			options: {
				banner: "",
		        sourceMap: true,
		        sourceMapName: 'sourcemap.map'
			},
			build: {
				files: {
					'lib-1.min.js': ['lib-1.js'],
					'lib-2.min.js': ['lib-2.js'],
					'lib-3.min.js': ['lib-3.js'],
					'lib-4.min.js': ['lib-4.js'],
					'config.min.js': ['config.js'],
					'app.min.js': ['app.js']
				}
			}
		},
		clean: {
		  build: {
		    src: ['lib-1.js', 'lib-2.js','lib-3.js', 'lib-4.js']
		  }
		},		
		cssmin: {
			build: {
				options: {
					banner: ''
				},
				files: {
					'../css/style.min.css': [
						'../css/jquery.style.1.4.2.css',
						'../css/jquery.mobile.icons.min.css',
						'../css/jquery.mobile.structure-1.4.2.css',
						'../css/jquery.emojipicker.css',
						'../css/picedit.css',
						'../css/application.css',
						'../css/photoswipe-4.0.8.css',
						'../css/default-skin/default-skin-4.0.8.css',
						'../css/pickadate.js-3.5.6/default.css',
						'../css/pickadate.js-3.5.6/default.time.css',
						'../css/pickadate.js-3.5.6/default.date.css'
					]
				}
			}
		}
	});	

	//load the packages
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');


	//register the task
	grunt.registerTask('build', ['concat', 'cssmin','uglify','clean']);
};