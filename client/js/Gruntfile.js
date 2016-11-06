module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		myCustom : grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: "\n", //add a new line after each file
				banner: "", //added before everything
				footer: "" //added after everything
			},
			cordova: {
				files: {
		        	'libs.js': [
		   				'fastClick.js',
						'jquery-1.10.2.min.js',
						'jquery.mobile.mobileinit.js',
						'jquery.mobile-1.4.5.min.js',
						'jquery.browser.min.0.1.0.js',
						'jquery.picedit-1.0.0.js',
						'jquery.emojipicker.js',
						'jquery.emojipicker.tw.js',
						'jquery.debouncedresize.js',
						'twemoji.min.js',
						'log4javascript-1.4.13.js',
						'photoswipe.min.js',
						'photoswipe-ui-default.min.js',
						'jsrsasign-4.1.4-all-min.js',
						'json-sans-eval-min.js',
						'jws-3.0.min.js',						
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
 						'easyrtc-1.0.15.js',
						'forge.bundle-0.7.0.js',
						'leaflet-1.0.1.js',
    	             	'config.js'
		        	]
		      	}
			}
		},
		uglify: {
			options: {
				banner: "",
		        sourceMap: true,
		        sourceMapName: 'sourcemap.map',
		        mangle: false
			},
			cordova: {
				files: {
					'libs.min.js': ['libs.js'],
					'app.min.js': ['app.js']
				}
			},
			web: {
				files: {
	   				'fastClick.min.js' : 'fastClick.js',
					'jquery-1.10.2.min.js': 'jquery-1.10.2.min.js',
					'jquery.mobile.mobileinit.min.js': 'jquery.mobile.mobileinit.js',					
					'jquery.mobile-1.4.5.min.js': 'jquery.mobile-1.4.5.min.js',
					'jquery.browser.min.0.1.0.js': 'jquery.browser.min.0.1.0.js',
					'jquery.picedit-1.0.0.min.js':'jquery.picedit-1.0.0.js',
					'jquery.emojipicker.min.js':'jquery.emojipicker.js',
					'jquery.emojipicker.tw.min.js':'jquery.emojipicker.tw.js',
					'jquery.debouncedresize.min.js':'jquery.debouncedresize.js',	        
					'twemoji.min.js':'twemoji.min.js',
					'log4javascript-1.4.13.min.js':'log4javascript-1.4.13.js',
					'photoswipe.min.js':'photoswipe.min.js',
					'photoswipe-ui-default.min.js':'photoswipe-ui-default.min.js',
					'jsrsasign-4.1.4-all-min.js': 'jsrsasign-4.1.4-all-min.js',
					'json-sans-eval-min.js':'json-sans-eval-min.js',
					'jws-3.0.min.js':'jws-3.0.min.js',        
					'indexeddbshim.min-2.2.1.js':	'indexeddbshim.min-2.2.1.js',
					'cldr-0.4.3.min.js':'cldr-0.4.3.js',
					'./cldr/event.min.js':'./cldr/event.js',
					'./cldr/supplemental.min.js': './cldr/supplemental.js',
					'globalize-1.1.0.min.js':'globalize-1.1.0.js',
					'./globalize/date_number.min.js': './globalize/date_number.min.js',
					'socket.io-1.3.5.min.js':'socket.io-1.3.5.js',
					'pickadate.js-3.5.6/picker.min.js': 	'pickadate.js-3.5.6/picker.js',
					'pickadate.js-3.5.6/picker.date.min.js':	'pickadate.js-3.5.6/picker.date.js',
					'pickadate.js-3.5.6/picker.time.min.js':	'pickadate.js-3.5.6/picker.time.js',
					'pickadate.js-3.5.6/legacy.min.js':	'pickadate.js-3.5.6/legacy.js',
					'easyrtc-1.0.15.min.js': 'easyrtc-1.0.15.js',
					'forge.bundle-0.7.0.min.js':'forge.bundle-0.7.0.js',
					'leaflet-1.0.1.min.js': 'leaflet-1.0.1.js',
					'config.min.js': 'config.js',
					'app.min.js': 'app.js'
				}
			},
			
		},
		clean: {
			cordova: {
				src: ['libs.js']
			}
		},		
		cssmin: {
			cordova: {
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
						'../css/leaflet-1.0.1.css',
						'../css/application.css',
						'../css/photoswipe-4.0.8.css',
						'../css/default-skin/default-skin-4.0.8.css',
						'../css/pickadate.js-3.5.6/default.css',
						'../css/pickadate.js-3.5.6/default.time.css',
						'../css/pickadate.js-3.5.6/default.date.css'
					]
				}
			},
			web: {
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
						'../css/leaflet-1.0.1.css',
						'../css/application.css',
						'../css/photoswipe-4.0.8.css',
						'../css/default-skin/default-skin-4.0.8.css',
						'../css/pickadate.js-3.5.6/default.css',
						'../css/pickadate.js-3.5.6/default.time.css',
						'../css/pickadate.js-3.5.6/default.date.css'
					]
				}
			}
		},
	    htmlbuild: {
	        web: {
	            src: '../htm/index.html',
	            dest: '../index.html',
	            options: {
	                beautify: true,
	                relative: true,
	                basePath: false,
	                scripts: {
	                    bundle: [
         	   				'fastClick.min.js' ,
        					'jquery-1.10.2.min.js',
        					'jquery.mobile.mobileinit.min.js',					
        					'jquery.mobile-1.4.5.min.js',
        					'jquery.browser.min.0.1.0.js',
        					'jquery.picedit-1.0.0.min.js',
        					'jquery.emojipicker.min.js',
        					'jquery.emojipicker.tw.min.js',
        					'jquery.debouncedresize.min.js',	        
        					'twemoji.min.js',
        					'log4javascript-1.4.13.min.js',
        					'photoswipe.min.js',
        					'photoswipe-ui-default.min.js',
        					'jsrsasign-4.1.4-all-min.js',
        					'json-sans-eval-min.js',
        					'jws-3.0.min.js',        
        					'indexeddbshim.min-2.2.1.js',
        					'cldr-0.4.3.min.js',
        					'./cldr/event.min.js',
        					'./cldr/supplemental.min.js',
        					'globalize-1.1.0.min.js',
        					'./globalize/date_number.min.js',
        					'socket.io-1.3.5.min.js',
        					'pickadate.js-3.5.6/picker.min.js',
        					'pickadate.js-3.5.6/picker.date.min.js',
        					'pickadate.js-3.5.6/picker.time.min.js',
        					'pickadate.js-3.5.6/legacy.min.js',
        					'easyrtc-1.0.15.min.js',
        					'forge.bundle-0.7.0.min.js',
        					'leaflet-1.0.1.min.js',
        					'config.min.js',
        					'app.min.js'
	                    ],
	                    cordova: [  ]
	                },
	                styles: {
	                    bundle: []
	                },	                
	                data: {
	                    // Data to pass to templates 
	                    version: "0.1.0",
	                    title: "test",
	                },
	            }
	        },
	        cordova: {
	            src: '../htm/index.html',
	            dest: '../index.html',
	            options: {
	                beautify: true,
	                relative: true,
	                basePath: false,
	                scripts: {
	                    bundle: [
         					'libs.min.js',
        					'app.min.js'
	                    ],
	                    cordova: [
	           				'cordova.js'
	  	                ]
	                },
	                styles: {
	                    bundle: []
	                },	                
	                data: {
	                    // Data to pass to templates 
	                    version: "0.1.0",
	                    title: "test",
	                },
	            }
	        }
	    }
	});	

	//load the packages
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-html-build');


	//register the task
	grunt.registerTask('build_web', ['cssmin:web','uglify:web','htmlbuild:web']);
	grunt.registerTask('build_cordova', ['concat:cordova', 'cssmin:cordova','uglify:cordova','clean:cordova','htmlbuild:cordova']);
};