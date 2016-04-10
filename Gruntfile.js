
module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.initConfig({
    clean: ['babel/', 'build/'],

	  babel: {
		  options: {
			  sourceMaps: true,
			  presets: ['babel-preset-es2015']
		  },
		  dist: {
			  files: [{
				  "expand": true,
				  "cwd": ".",
				  "src": ["app/js/*.js"],
				  "dest": "babel/",
				  "ext": ".js"
			  }]
		  }
	  },

    postcss: {
      dist: {
        options: {
          map: true, // inline sourcemaps
          processors: [
            //require('stylelint')({"extends": "stylelint-config-standard"}),
            require('postcss-cssnext')({warnForDuplicates: false}), // cssnano also includes autoprefixer
            require('cssnano')(), // minify the result
            require('postcss-reporter')({clearMessages: true})
          ]
        },
        files: [
          { expand: true, cwd: '.', src: 'app/css/*.css', dest: 'build/' }
        ]
      },
      debug: {
        options: {
          map: true, // inline sourcemaps
          processors: [
            //require('stylelint')({"extends": "stylelint-config-standard"}),
            require('postcss-cssnext')(),
            require('postcss-reporter')({clearMessages: true})
          ]
        },
        files: [
          { expand: true, cwd: '.', src: 'app/css/*.css', dest: 'build/' }
        ]
      }
    },


    eslint: {
      /* see .eslintrc */
      target: ['app/js/*.js']
    },

    // minify JS
    uglify: {
      options: {
        sourceMap: true
      },
      dist: {
        files: [
          { expand: true, cwd: 'babel', src: 'app/js/*.js', dest: 'build/' }
        ]
      }
    },

    copy: {
      common: {
        files: [
          { expand: true, cwd: '.', src: ['app/manifest.json'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/sw-import.js'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/audio/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/data/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['LICENSE'], dest: 'build/app/' },
          { expand: true, cwd: '.', src: ['app/README.txt'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/locales/**'], dest: 'build/' }
        ]
      },

      babel_js: {
        files: [
          { expand: true, cwd: 'babel', src: ['app/js/*'], dest: 'build/' },
        ],
      },

      image: {
       files: [
         { expand: true, cwd: '.', src: ['app/images/**'], dest: 'build/' },
         { expand: true, cwd: '.', src: ['app/css/images/**'], dest: 'build/' }
       ]
      },
      html: {
        files: [
          { expand: true, cwd: '.', src: ['app/*.html'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/html/*.html'], dest: 'build/' }
        ],
      },
      css: {
        files: [
          { expand: true, cwd: '.', src: ['app/css/**'], dest: 'build/' }
        ]
      },
      js: {
        files: [
          { expand: true, cwd: '.', src: ['app/js/**'], dest: 'build/' }
        ]
      },

    },

    htmlmin: {
      dist: {
        files: [
          { expand: true, cwd: '.', src: ['app/*.html'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/html/*.html'], dest: 'build/' }
        ],
        options: {
          removeComments: true,
          collapseWhitespace: true,
          removeCommentsFromCDATA: false,
          removeCDATASectionsFromCDATA: false,
          removeEmptyAttributes: true,
          removeEmptyElements: false
        }
      }
    },

    imagemin: {
      dist: {
        options: {
          optimizationLevel: 3,
          progressive: true
        },
        files: [
          { expand: true, cwd: '.', src: ['app/images/**/*'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/css/images/**/*'], dest: 'build/' }
        ]
      }
    },

    connect: {
      server: {
        options: {
          protocol: 'http',
          // you will need to change these to your own settings
          //hostname: 'maxw-xps-8300.isw.intel.com',
          base: 'build/app/',
          //key: grunt.file.read('/home/maxw/.intel-certs/maxw-xps-8300.isw.intel.com.key').toString(),
          //cert: grunt.file.read('/home/maxw/.intel-certs/Intel_SSL_Internal_Certificate_for_maxw-xps-8300_isw_intel_com.cer').toString(),
          keepalive: true
        }
      }
    },

  });

  grunt.registerTask('dist', [
    'clean', // clean babel/ and build/
    'babel', // babelify app/js -> babel/app/js
    'uglify:dist', // uglify babel/app/js -> build/app/js
    'imagemin:dist', // minify app/images -> build/app/images
    'postcss:dist', // preprocess css build/app/css -> build/app/css
    'htmlmin:dist', // minify app/html -> build/app/html
    'copy:common' // copy other stuff
  ]);

  grunt.registerTask('dist:debug', [
    'clean', // clean babel/ and build/
    'babel', // babelify app/js -> babel/app/js
    'copy:babel_js', // copy babel/app/js -> build/app/js
    'copy:image', // copy app/images -> build/app/images
    'postcss:debug', // preprocess css build/app/css -> build/app/css
    'copy:html', // copy app/html -> build/app/html
    'copy:common' // copy other stuff
  ]);

  grunt.registerTask('pwa', ['dist']);

  grunt.registerTask('server', ['pwa', 'connect']);

  grunt.registerTask('default', 'pwa');
};
