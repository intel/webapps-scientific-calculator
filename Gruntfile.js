module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-tizen');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadTasks('tools/grunt-tasks');

  grunt.initConfig({
    packageInfo: grunt.file.readJSON('package.json'),
    chromeInfo: grunt.file.readJSON('data/manifest.json'),

    clean: ['build'],

    tizen_configuration: {
      // location on the device to install the tizen-app.sh script to
      // (default: '/tmp')
      tizenAppScriptDir: '/home/developer/',

      // path to the config.xml file for the Tizen wgt file
      // (default: 'config.xml')
      configFile: 'data/config.xml',

      // path to the sdb command (default: process.env.SDB or 'sdb')
      sdbCmd: 'sdb'
    },

    // minify JS
    uglify: {
      dist: {
        files: {
          'build/app/js/calc.js': ['app/js/calc.js'],
          'build/app/js/help.js': ['app/js/help.js'],
          'build/app/js/license.js': ['app/js/license.js'],
          'build/app/js/localizer.js': ['app/js/localizer.js'],
          'build/app/lib/q/q.js': ['app/lib/q/q.js'],
        }
      }
    },

    // minify CSS
    cssmin: {
      dist: {
        files: {
          'build/app/css/calc.css': ['app/css/calc.css'],
          'build/app/css/calc_portrait.css': ['app/css/calc_portrait.css'],
          'build/app/css/lazy.css': ['app/css/lazy.css'],
          'build/app/css/lazy_portrait.css': ['app/css/lazy_portrait.css'],
          'build/app/css/jquery.jscrollpane.css': ['app/css/jquery.jscrollpane.css']
        }
      }
    },

    copy: {
      common: {
        files: [
          { expand: true, cwd: '.', src: ['app/lib/intel-appframework/appframework.min.js'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/peg-0.7.0.min/index.js'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/iscroll/dist/iscroll-min.js'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/pegjs/src/parser.pegjs'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/open-sans/OpenSans-Light.ttf'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/open-sans/OpenSans-Regular.ttf'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/open-sans/OpenSans-Semibold.ttf'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/audio/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/js/peg-code.txt'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/README.txt'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['LICENSE'], dest: 'build/app/' },
          { expand: true, cwd: '.', src: ['app/_locales/**'], dest: 'build/' }
        ]
      },
      wgt: {
        files: [
          { expand: true, cwd: 'build/app/', src: ['**'], dest: 'build/wgt/' },
          { expand: true, cwd: 'data/', src: ['config.xml'], dest: 'build/wgt/' },
          { expand: true, cwd: '.', src: ['icon_128.png'], dest: 'build/wgt/' }
        ]
      },
      crx: {
        files: [
          { expand: true, cwd: 'build/app/', src: ['**'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['manifest.json'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['icon*.png'], dest: 'build/crx/' }
        ]
      },
      sdk: {
        files: [
          { expand: true, cwd: 'build/app/', src: ['**'], dest: 'build/sdk/' },
          { expand: true, cwd: '.', src: ['app/css/calc*.css'], dest: 'build/sdk/css/' },
          { expand: true, cwd: '.', src: ['app/css/lazy*.css'], dest: 'build/sdk/css/' },
          { expand: true, cwd: '.', src: ['app/js/calc.js'], dest: 'build/sdk/js/' },
          { expand: true, cwd: '.', src: ['app/js/lazy.js'], dest: 'build/sdk/js/' },
          { expand: true, cwd: '.', src: ['app/js/help.js'], dest: 'build/sdk/js/' },
          { expand: true, cwd: '.', src: ['app/js/license.js'], dest: 'build/sdk/js/' },
          { expand: true, cwd: '.', src: ['app/*.html'], dest: 'build/sdk/' },
          { expand: true, cwd: 'data/', src: ['config.xml'], dest: 'build/sdk/' },
          { expand: true, cwd: '.', src: ['icon*.png'], dest: 'build/sdk/' }
        ]
      }
    },

    htmlmin: {
      dist: {
        files: [
          { expand: true, cwd: '.', src: ['app/*.html'], dest: 'build/' }
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
          { expand: true, cwd: '.', src: ['app/images/**'], dest: 'build/' }
        ]
      }
    },

    // make wgt package in build/ directory
    package: {
      wgt: {
        appName: '<%= packageInfo.name %>',
        version: '<%= packageInfo.version %>',
        files: 'build/wgt/**',
        stripPrefix: 'build/wgt/',
        outDir: 'build',
        suffix: '.wgt',
        addGitCommitId: false
      },
      sdk: {
        appName: '<%= packageInfo.name %>',
        version: '<%= packageInfo.version %>',
        files: 'build/sdk/**',
        stripPrefix: 'build/sdk/',
        outDir: 'build',
        suffix: '.wgt',
      }
    },

    simple_server: {
      port: 30303,
      dir: 'build/app/'
    },

    tizen: {
      push: {
        action: 'push',
        localFiles: {
          pattern: 'build/*.wgt',
          filter: 'latest'
        },
        remoteDir: '/home/developer/'
      },

      install: {
        action: 'install',
        remoteFiles: {
          pattern: '/home/developer/Calculator*.wgt',
          filter: 'latest'
        }
      },

      uninstall: {
        action: 'uninstall'
      },

      start: {
        action: 'start',
        stopOnFailure: true
      },

      stop: {
        action: 'stop',
        stopOnFailure: false
      },

      debug: {
        action: 'debug',
        browserCmd: 'google-chrome %URL%',
        localPort: 9090,
        stopOnFailure: true
      }
    }
  });

  grunt.registerTask('dist', [
    'clean',
    'imagemin:dist',
    'uglify:dist',
    'cssmin:dist',
    'htmlmin:dist',
    'copy:common'
  ]);

  grunt.registerTask('crx', ['dist', 'copy:crx']);
  grunt.registerTask('wgt', ['dist', 'copy:wgt', 'package:wgt']);

  grunt.registerTask('sdk', [
    'clean',
    'imagemin:dist',
    'copy:common',
    'copy:sdk',
    'package:sdk'
  ]);

  grunt.registerTask('perf', [
    'dist',
    'uglify:perf',
    'inline',
    'copy:wgt',
    'package:wgt'
  ]);

  grunt.registerTask('install', [
    'tizen:push',
    'tizen:stop',
    'tizen:uninstall',
    'tizen:install',
    'tizen:start'
  ]);

  grunt.registerTask('wait', function () {
    var done = this.async();
    setTimeout(function () {
      done();
    }, 10000);
  });

  grunt.registerTask('restart', ['tizen:stop', 'tizen:start']);

  grunt.registerTask('server', ['dist', 'simple_server']);

  grunt.registerTask('wgt-install', ['wgt', 'install']);
  grunt.registerTask('sdk-install', ['sdk', 'install']);

  grunt.registerTask('default', 'wgt');
};
