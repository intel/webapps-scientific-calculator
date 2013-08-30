module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
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
          'build/app/js/license.js': ['app/js/license.js'],
          'build/app/js/help.js': ['app/js/help.js'],
          'build/app/js/localizer.js': ['app/js/localizer.js'],
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
          { expand: true, cwd: '.', src: ['app/lib/q/q.min.js'], dest: 'build/' },
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
          { expand: true, cwd: '.', src: ['config.xml'], dest: 'build/wgt/' },
          { expand: true, cwd: '.', src: ['scientific-calculator-icon_128.png'], dest: 'build/wgt/' }
        ]
      },
      crx: {
        files: [
          { expand: true, cwd: 'build/app/', src: ['**'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['manifest.json'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['scientific-calculator-icon*.png'], dest: 'build/crx/' }
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
          { expand: true, cwd: '.', src: ['config.xml'], dest: 'build/sdk/' },
          { expand: true, cwd: '.', src: ['scientific-calculator-icon.png'], dest: 'build/sdk/' }
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

    webtizen: {
      sign: {
        cwd: "build/wgt",
        args: "signing --nocheck -p "
         + (process.env.TIZENSDKPROFILE||"test:"+process.env.HOME+"/tizen-sdk/tools/ide/sample/profiles.xml")
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

      pushdumpscript: {
        action: 'push',
        localFiles: 'tools/dump-localStorage.sh',
        remoteDestDir: '/home/developer/',
        chmod: '+x',
        overwrite: true
      },

      dumplocalstorage: {
        action: 'script',
        remoteScript: '/home/developer/dump-localStorage.sh'
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

    inline: {
      script: 'build/save-perf-data.min.js',
      htmlFile: 'build/app/index.html'
    },

    simple_server: {
      port: 30303,
      dir: 'build/app/'
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
  grunt.registerTask('wgt', ['dist', 'copy:wgt', 'webtizen:sign', 'package:wgt']);

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
    'sdb:prepare',
    'sdb:pushwgt',
    'sdb:stop',
    'sdb:uninstall',
    'sdb:install',
    'sdb:start'
  ]);

  grunt.registerTask('wait', function () {
    var done = this.async();
    setTimeout(function () {
      done();
    }, 10000);
  });

  grunt.registerTask('perf-test', function () {
    var tasks = ['sdb:pushdumpscript', 'perf', 'install', 'sdb:stop'];

    for (var i = 0; i < 11; i++) {
      tasks.push('sdb:start', 'wait', 'sdb:stop');
    }

    tasks.push('sdb:dumplocalstorage')

    grunt.task.run(tasks);
  });

  grunt.registerTask('restart', ['sdb:stop', 'sdb:start']);

  grunt.registerTask('server', ['dist', 'simple_server']);

  grunt.registerTask('wgt-install', ['wgt', 'install']);
  grunt.registerTask('sdk-install', ['sdk', 'install']);

  grunt.registerTask('default', 'wgt');
};
