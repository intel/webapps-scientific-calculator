module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadTasks('tools/grunt-tasks');

  grunt.initConfig({
    packageInfo: grunt.file.readJSON('package.json'),
    chromeInfo: grunt.file.readJSON('manifest.json'),

    clean: ['build'],

    // minify JS
    uglify: {
      dist: {
        files: {
          'build/app/js/calc.js': ['app/js/calc.js'],
          'build/app/js/help.js': ['app/js/help.js'],
          'build/app/js/iscroll.js': ['app/js/iscroll.js'],
          'build/app/js/jquery-1.7.2.min.js': ['app/js/jquery-1.7.2.min.js'],
          'build/app/js/license.js': ['app/js/license.js'],
          'build/app/js/localizer.js': ['app/js/localizer.js'],
          'build/app/js/peg-0.6.2.min.js': ['app/js/peg-0.6.2.min.js']
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

    // copy files required for the wgt package
    copy: {
      common: {
        files: [
          //{ expand: true, cwd: '.', src: ['app/js/calc.js'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/audio/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/fonts/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/js/peg-code.txt'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['README.txt'], dest: 'build/app/' }
        ]
      },
      wgt: {
        files: [
          { expand: true, cwd: 'build/app/', src: ['**'], dest: 'build/wgt/' },
          { expand: true, cwd: '.', src: ['config.xml'], dest: 'build/wgt/' },
          { expand: true, cwd: '.', src: ['scientific-calculator-icon.png'], dest: 'build/wgt/' }
        ]
      },
      crx: {
        files: [
          { expand: true, cwd: 'build/app/', src: ['**'], dest: 'build/crx/' },
          { expand: true, cwd: 'app/_locales', src: ['**'], dest: 'build/crx/_locales' },
          { expand: true, cwd: '.', src: ['manifest.json'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['scientific-calculator-icon*.png'], dest: 'build/crx/' }
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
          removeCommentsFromCDATA: true,
          removeCDATASectionsFromCDATA: true,
          removeEmptyAttributes: true
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
      }
    },

    sdb: {
      prepare: {
        action: 'push',
        localFiles: './tools/grunt-tasks/tizen-app.sh',
        remoteDestDir: '/home/developer/',
        chmod: '+x',
        overwrite: true
      },

      pushwgt: {
        action: 'push',
        localFiles: {
          pattern: 'build/*.wgt',
          filter: 'latest'
        },
        remoteDestDir: '/home/developer/'
      },

      stop: {
        action: 'stop',
        remoteScript: '/home/developer/tizen-app.sh'
      },

      uninstall: {
        action: 'uninstall',
        remoteScript: '/home/developer/tizen-app.sh'
      },

      install: {
        action: 'install',
        remoteFiles: {
          pattern: '/home/developer/*.wgt',
          filter: 'latest'
        },
        remoteScript: '/home/developer/tizen-app.sh'
      },

      debug: {
        action: 'debug',
        remoteScript: '/home/developer/tizen-app.sh',
        localPort: '8888',
        openBrowser: 'google-chrome %URL%'
      },

      start: {
        action: 'start',
        remoteScript: '/home/developer/tizen-app.sh'
      }
    },

    simple_server: {
      port: 30303,
      dir: 'build/app/'
    }
  });

  grunt.registerTask('dist', [
    'clean',
    'copy:common',
    'imagemin:dist',
    'uglify:dist',
    'cssmin:dist',
    'htmlmin:dist'
  ]);

  grunt.registerTask('wgt', ['dist', 'copy:wgt', 'package:wgt']);
  grunt.registerTask('crx', ['dist', 'copy:crx']);

  grunt.registerTask('install', [
    'wgt',
    'sdb:prepare',
    'sdb:pushwgt',
    'sdb:install',
    'sdb:start'
  ]);

  grunt.registerTask('reinstall', [
    'wgt',
    'sdb:prepare',
    'sdb:pushwgt',
    'sdb:stop',
    'sdb:uninstall',
    'sdb:install',
    'sdb:start'
  ]);

  grunt.registerTask('restart', ['sdb:stop', 'sdb:start']);

  grunt.registerTask('server', ['dist', 'simple_server']);

  grunt.registerTask('default', 'wgt');
};
