module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		myConfig : grunt.file.readJSON('../server/lib/config.json'),
		concat: {
			options: {
				separator: "\n", //add a new line after each file
				banner: "", //added before everything
				footer: "" //added after everything
			},
			cordova: {
				files: {
		        	'../client/js/libs.js': [
		   				'../client/js/fastClick.js',
						'../client/js/jquery-1.10.2.min.js',
						'../client/js/jquery.mobile.mobileinit.js',
						'../client/js/jquery.mobile-1.4.5.min.js',
						'../client/js/jquery.browser.min.0.1.0.js',
						'../client/js/jquery.picedit-1.0.0.js',
						'../client/js/jquery.emojipicker.js',
						'../client/js/jquery.emojipicker.tw.js',
						'../client/js/jquery.debouncedresize.js',
						'../client/js/twemoji.min.js',
						'../client/js/log4javascript-1.4.13.js',
						'../client/js/photoswipe.min.js',
						'../client/js/photoswipe-ui-default.min.js',
						'../client/js/jsrsasign-4.1.4-all-min.js',
						'../client/js/json-sans-eval-min.js',
						'../client/js/jws-3.0.min.js',
						'../client/js/IndexedDBShim.old.js',
						'../client/js/cldr-0.4.3.js',
						'../client/js/./cldr/event.js',
						'../client/js/./cldr/supplemental.js',
						'../client/js/globalize-1.1.0.js',
						'../client/js/./globalize/date_number.min.js',
						'../client/js/socket.io-1.3.5.js',
 						'../client/js/pickadate.js-3.5.6/picker.js',
 						'../client/js/pickadate.js-3.5.6/picker.date.js',
 						'../client/js/pickadate.js-3.5.6/picker.time.js',
 						'../client/js/pickadate.js-3.5.6/legacy.js',
 						'../client/js/easyrtc-1.0.15.js',
						'../client/js/forge.bundle-0.7.0.js',
						'../client/js/leaflet-1.0.1.js',
    	             	'../client/js/config.js'
		        	]
		      	}
			}
		},
		uglify: {
			options: {
				banner: "",
		        sourceMap: true,
		        sourceMapName: '../client/js/sourcemap.map',
		        mangle: false
			},
			cordova: {
				files: {
	   				'../client/js/fastClick.min.js' : '../client/js/fastClick.js',
					'../client/js/jquery-1.10.2.min.js': '../client/js/jquery-1.10.2.min.js',
					'../client/js/jquery.mobile.mobileinit.min.js': '../client/js/jquery.mobile.mobileinit.js',
					'../client/js/jquery.browser.min.0.1.0.js': '../client/js/jquery.browser.min.0.1.0.js',
					'../client/js/jquery.mobile-1.4.5.min.js': '../client/js/jquery.mobile-1.4.5.min.js',
					'../client/js/jquery.picedit-1.0.0.min.js':'../client/js/jquery.picedit-1.0.0.js',
					'../client/js/jquery.emojipicker.min.js':'../client/js/jquery.emojipicker.js',
					'../client/js/jquery.emojipicker.tw.min.js':'../client/js/jquery.emojipicker.tw.js',
					'../client/js/jquery.debouncedresize.min.js':'../client/js/jquery.debouncedresize.js',	        
					'../client/js/twemoji.min.js':'../client/js/twemoji.min.js',
					'../client/js/log4javascript-1.4.13.min.js':'../client/js/log4javascript-1.4.13.js',
					'../client/js/photoswipe.min.js':'../client/js/photoswipe.min.js',
					'../client/js/photoswipe-ui-default.min.js':'../client/js/photoswipe-ui-default.min.js',
					'../client/js/jsrsasign-4.1.4-all-min.js': '../client/js/jsrsasign-4.1.4-all-min.js',
					'../client/js/json-sans-eval-min.js':'../client/js/json-sans-eval-min.js',
					'../client/js/jws-3.0.min.js':'../client/js/jws-3.0.min.js',        
					'../client/js/indexeddbshim.min-2.2.1.js':	'../client/js/indexeddbshim.min-2.2.1.js',
					'../client/js/cldr-0.4.3.min.js':'../client/js/cldr-0.4.3.js',
					'../client/js/cldr/event.min.js':'../client/js/cldr/event.js',
					'../client/js/cldr/supplemental.min.js': '../client/js/cldr/supplemental.js',
					'../client/js/globalize-1.1.0.min.js':'../client/js/globalize-1.1.0.js',
					'../client/js/globalize/date_number.min.js': '../client/js/globalize/date_number.min.js',
					'../client/js/socket.io-1.3.5.min.js':'../client/js/socket.io-1.3.5.js',
					'../client/js/pickadate.js-3.5.6/picker.min.js': 	'../client/js/pickadate.js-3.5.6/picker.js',
					'../client/js/pickadate.js-3.5.6/picker.date.min.js':	'../client/js/pickadate.js-3.5.6/picker.date.js',
					'../client/js/pickadate.js-3.5.6/picker.time.min.js':	'../client/js/pickadate.js-3.5.6/picker.time.js',
					'../client/js/pickadate.js-3.5.6/legacy.min.js':	'../client/js/pickadate.js-3.5.6/legacy.js',
					'../client/js/easyrtc-1.0.15.min.js': '../client/js/easyrtc-1.0.15.js',
					'../client/js/forge.bundle-0.7.0.min.js':'../client/js/forge.bundle-0.7.0.js',
					'../client/js/leaflet-1.0.1.min.js': '../client/js/leaflet-1.0.1.js',
					'../client/js/config.min.js': '../client/js/config.js',
					'../client/js/app.min.js': '../client/js/app.js'
				}
			},
			web: {
				files: {
	   				'../client/js/fastClick.min.js' : '../client/js/fastClick.js',
					'../client/js/jquery-1.10.2.min.js': '../client/js/jquery-1.10.2.min.js',
					'../client/js/jquery.mobile.mobileinit.min.js': '../client/js/jquery.mobile.mobileinit.js',
					'../client/js/jquery.browser.min.0.1.0.js': '../client/js/jquery.browser.min.0.1.0.js',
					'../client/js/jquery.mobile-1.4.5.min.js': '../client/js/jquery.mobile-1.4.5.min.js',
					'../client/js/jquery.picedit-1.0.0.min.js':'../client/js/jquery.picedit-1.0.0.js',
					'../client/js/jquery.emojipicker.min.js':'../client/js/jquery.emojipicker.js',
					'../client/js/jquery.emojipicker.tw.min.js':'../client/js/jquery.emojipicker.tw.js',
					'../client/js/jquery.debouncedresize.min.js':'../client/js/jquery.debouncedresize.js',	        
					'../client/js/twemoji.min.js':'../client/js/twemoji.min.js',
					'../client/js/log4javascript-1.4.13.min.js':'../client/js/log4javascript-1.4.13.js',
					'../client/js/photoswipe.min.js':'../client/js/photoswipe.min.js',
					'../client/js/photoswipe-ui-default.min.js':'../client/js/photoswipe-ui-default.min.js',
					'../client/js/jsrsasign-4.1.4-all-min.js': '../client/js/jsrsasign-4.1.4-all-min.js',
					'../client/js/json-sans-eval-min.js':'../client/js/json-sans-eval-min.js',
					'../client/js/jws-3.0.min.js':'../client/js/jws-3.0.min.js',        
					'../client/js/indexeddbshim.min-2.2.1.js':	'../client/js/indexeddbshim.min-2.2.1.js',
					'../client/js/cldr-0.4.3.min.js':'../client/js/cldr-0.4.3.js',
					'../client/js/cldr/event.min.js':'../client/js/cldr/event.js',
					'../client/js/cldr/supplemental.min.js': '../client/js/cldr/supplemental.js',
					'../client/js/globalize-1.1.0.min.js':'../client/js/globalize-1.1.0.js',
					'../client/js/globalize/date_number.min.js': '../client/js/globalize/date_number.min.js',
					'../client/js/socket.io-1.3.5.min.js':'../client/js/socket.io-1.3.5.js',
					'../client/js/pickadate.js-3.5.6/picker.min.js': 	'../client/js/pickadate.js-3.5.6/picker.js',
					'../client/js/pickadate.js-3.5.6/picker.date.min.js':	'../client/js/pickadate.js-3.5.6/picker.date.js',
					'../client/js/pickadate.js-3.5.6/picker.time.min.js':	'../client/js/pickadate.js-3.5.6/picker.time.js',
					'../client/js/pickadate.js-3.5.6/legacy.min.js':	'../client/js/pickadate.js-3.5.6/legacy.js',
					'../client/js/easyrtc-1.0.15.min.js': '../client/js/easyrtc-1.0.15.js',
					'../client/js/forge.bundle-0.7.0.min.js':'../client/js/forge.bundle-0.7.0.js',
					'../client/js/leaflet-1.0.1.min.js': '../client/js/leaflet-1.0.1.js',
					'../client/js/config.min.js': '../client/js/config.js',
					'../client/js/app.min.js': '../client/js/app.js'
				}
			},
			
		},
		clean: {
			cordova: {
				src: ['../client/js/libs.js']
			}
		},		
		cssmin: {
			cordova: {
				options: {
					banner: ''
				},
				files: {
					'../client/css/style.min.css': [
						'../client/css/jquery.style.1.4.2.css',
						'../client/css/jquery.mobile.icons.min.css',
						'../client/css/jquery.mobile.structure-1.4.2.css',
						'../client/css/jquery.emojipicker.css',
						'../client/css/picedit.css',
						'../client/css/leaflet-1.0.1.css',
						'../client/css/application.css',
						'../client/css/photoswipe-4.0.8.css',
						'../client/css/photoswipe-skin-4.0.8.css',
						'../client/css/pickadate.js-3.5.6/default.css',
						'../client/css/pickadate.js-3.5.6/default.time.css',
						'../client/css/pickadate.js-3.5.6/default.date.css'
					]
				}
			},
			web: {
				options: {
					banner: ''
				},
				files: {
					'../client/css/style.min.css': [
						'../client/css/jquery.style.1.4.2.css',
						'../client/css/jquery.mobile.icons.min.css',
						'../client/css/jquery.mobile.structure-1.4.2.css',
						'../client/css/jquery.emojipicker.css',
						'../client/css/picedit.css',
						'../client/css/leaflet-1.0.1.css',
						'../client/css/application.css',
						'../client/css/photoswipe-4.0.8.css',
						'../client/css/photoswipe-skin-4.0.8.css',
						'../client/css/pickadate.js-3.5.6/default.css',
						'../client/css/pickadate.js-3.5.6/default.time.css',
						'../client/css/pickadate.js-3.5.6/default.date.css'
					]
				}
			}
		},
	    htmlbuild: {
	        web: {
	            src: '../client/htm/index.html',
	            dest: '../client/index.html',
	            options: {
	                beautify: true,
	                relative: true,
	                basePath: false,
	                scripts: {
	                    bundle: [
         	   				'../client/js/fastClick.min.js' ,
        					'../client/js/jquery-1.10.2.min.js',
        					'../client/js/jquery.mobile.mobileinit.min.js',					
        					'../client/js/jquery.mobile-1.4.5.min.js',
        					'../client/js/jquery.browser.min.0.1.0.js',
        					'../client/js/jquery.picedit-1.0.0.min.js',
        					'../client/js/jquery.emojipicker.min.js',
        					'../client/js/jquery.emojipicker.tw.min.js',
        					'../client/js/jquery.debouncedresize.min.js',	        
        					'../client/js/twemoji.min.js',
        					'../client/js/log4javascript-1.4.13.min.js',
        					'../client/js/photoswipe.min.js',
        					'../client/js/photoswipe-ui-default.min.js',
        					'../client/js/jsrsasign-4.1.4-all-min.js',
        					'../client/js/json-sans-eval-min.js',
        					'../client/js/jws-3.0.min.js',        
        					'../client/js/indexeddbshim.min-2.2.1.js',
        					'../client/js/cldr-0.4.3.min.js',
        					'../client/js/cldr/event.min.js',
        					'../client/js/cldr/supplemental.min.js',
        					'../client/js/globalize-1.1.0.min.js',
        					'../client/js/globalize/date_number.min.js',
        					'../client/js/socket.io-1.3.5.min.js',
        					'../client/js/pickadate.js-3.5.6/picker.min.js',
        					'../client/js/pickadate.js-3.5.6/picker.date.min.js',
        					'../client/js/pickadate.js-3.5.6/picker.time.min.js',
        					'../client/js/pickadate.js-3.5.6/legacy.min.js',
        					'../client/js/easyrtc-1.0.15.min.js',
        					'../client/js/forge.bundle-0.7.0.min.js',
        					'../client/js/leaflet-1.0.1.min.js',
        					'../client/js/config.min.js',
        					'../client/js/app.js'
	                    ]
	                },
	                styles: {
	                	bundle: ['../client/css/style.min.css']
	                }
	            }
	        },
	        cordova: {
	            src: '../client/htm/index.html',
	            dest: '../client/index.html',
	            options: {
	                beautify: true,
	                relative: true,
	                basePath: false,
	                scripts: {
	                    bundle: [
        	   				'../client/js/fastClick.min.js' ,
        					'../client/js/jquery-1.10.2.min.js',
        					'../client/js/jquery.mobile.mobileinit.min.js',					
        					'../client/js/jquery.mobile-1.4.5.min.js',
        					'../client/js/jquery.browser.min.0.1.0.js',
        					'../client/js/jquery.emojipicker.min.js',
        					'../client/js/jquery.emojipicker.tw.min.js',
        					'../client/js/jquery.debouncedresize.min.js',
        					'../client/js/jquery.picedit-1.0.0.min.js',
        					'../client/js/twemoji.min.js',
        					'../client/js/log4javascript-1.4.13.min.js',
        					'../client/js/photoswipe.min.js',
        					'../client/js/photoswipe-ui-default.min.js',
        					'../client/js/jsrsasign-4.1.4-all-min.js',
        					'../client/js/json-sans-eval-min.js',
        					'../client/js/jws-3.0.min.js',        
        					'../client/js/indexeddbshim.min-2.2.1.js',
        					'../client/js/cldr-0.4.3.min.js',
        					'../client/js/cldr/event.min.js',
        					'../client/js/cldr/supplemental.min.js',
        					'../client/js/globalize-1.1.0.min.js',
        					'../client/js/globalize/date_number.min.js',
        					'../client/js/socket.io-1.3.5.min.js',
        					'../client/js/pickadate.js-3.5.6/picker.min.js',
        					'../client/js/pickadate.js-3.5.6/picker.date.min.js',
        					'../client/js/pickadate.js-3.5.6/picker.time.min.js',
        					'../client/js/pickadate.js-3.5.6/legacy.min.js',
        					'../client/js/easyrtc-1.0.15.min.js',
        					'../client/js/forge.bundle-0.7.0.min.js',
        					'../client/js/leaflet-1.0.1.min.js',
        					'../client/js/config.min.js',
        					'../client/js/app.min.js'
	                    ]
	                },
	                styles: {
	                    bundle: ['../client/css/style.min.css']
	                }
	            }
	        },
	        dev: {
	            src: '../client/htm/index.html',
	            dest: '../client/index.html',
	            options: {
	                beautify: true,
	                relative: true,
	                basePath: false,
	                scripts: {
	                    bundle: [
         	   				'../client/js/fastClick.js',
        					'../client/js/jquery-1.10.2.min.js',
        					'../client/js/jquery.mobile.mobileinit.js',
        					'../client/js/jquery.browser.min.0.1.0.js',
        					'../client/js/jquery.mobile-1.4.5.min.js',
        					'../client/js/jquery.picedit-1.0.0.js',
        					'../client/js/jquery.emojipicker.js',
        					'../client/js/jquery.emojipicker.tw.js',
        					'../client/js/jquery.debouncedresize.js',	        
        					'../client/js/twemoji.min.js',
        					'../client/js/log4javascript-1.4.13.js',
        					'../client/js/photoswipe.min.js',
        					'../client/js/photoswipe-ui-default.min.js',
        					'../client/js/jsrsasign-4.1.4-all-min.js',
        					'../client/js/json-sans-eval-min.js',
        					'../client/js/jws-3.0.min.js',        
        					'../client/js/indexeddbshim.min-2.2.1.js',
        					'../client/js/cldr-0.4.3.js',
        					'../client/js/cldr/event.js',
        					'../client/js/cldr/supplemental.js',
        					'../client/js/globalize-1.1.0.js',
        					'../client/js/globalize/date_number.min.js',
        					'../client/js/socket.io-1.3.5.js',
        					'../client/js/pickadate.js-3.5.6/picker.js',
        					'../client/js/pickadate.js-3.5.6/picker.date.js',
        					'../client/js/pickadate.js-3.5.6/picker.time.js',
        					'../client/js/pickadate.js-3.5.6/legacy.js',
        					'../client/js/easyrtc-1.0.15.js',
        					'../client/js/forge.bundle-0.7.0.js',
        					'../client/js/leaflet-1.0.1.js',
        					'../client/js/config.js',
        					'../client/js/app.js'
	                    ]
	                },
	                styles: {
	                	bundle: [
            	         	'../client/css/jquery.style.1.4.2.css',
    						'../client/css/jquery.mobile.icons.min.css',
    						'../client/css/jquery.mobile.structure-1.4.2.css',
    						'../client/css/jquery.emojipicker.css',
    						'../client/css/picedit.css',
    						'../client/css/leaflet-1.0.1.css',
    						'../client/css/application.css',
    						'../client/css/photoswipe-4.0.8.css',
    						'../client/css/photoswipe-skin-4.0.8.css',
    						'../client/css/pickadate.js-3.5.6/default.css',
    						'../client/css/pickadate.js-3.5.6/default.time.css',
    						'../client/css/pickadate.js-3.5.6/default.date.css'
    					]
	                }
	            }
	        }
	    },
	    'string-replace': {
	    	any: {
	    		files: {
    				'../client/js/config.js': '../client/js/config.template.js'
	    	    },
	    	    options: {
	    	      replacements: [{
	    	        pattern: /#TO_BE_REPLACED_BY_GRUNT_server_name/ig,
	    	        replacement: '<%= myConfig.listOfServerSockets[0].ipServerSockets %>'
	    	      }]
	    	    }
	    	  },
	    	cordova: {
	    		files: {
    				'../client/index.html': '../client/index.html'
	    	    },
	    	    options: {
	    	      replacements: [{
	    	        pattern: /<!-- htmlreplace:cordova -->/ig,
	    	        replacement: '<script type="text/javascript" src="cordova.js"></script>'
	    	      }]
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
	grunt.loadNpmTasks('grunt-string-replace');

	//register the task
	grunt.registerTask('build:web', ['string-replace:any','cssmin:web','uglify:web','htmlbuild:web']);
	grunt.registerTask('build:cordova', ['string-replace:any', 'htmlbuild:cordova','string-replace:cordova']);
	grunt.registerTask('build:dev', ['string-replace:any', 'htmlbuild:dev']);

};