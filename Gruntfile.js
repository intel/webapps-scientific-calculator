module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadTasks('tools/grunt-tasks');

  grunt.initConfig({
    packageInfo: grunt.file.readJSON('package.json'),
    chromeInfo: grunt.file.readJSON('manifest.json'),

    clean: ['build'],

    // minify and concat JS
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

    // minify and concat CSS
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

    // copy assets and the index.html file to build/app/;
    // NB we rewrite index.html during copy to point at the
    // minified/concated js file all.js and minified/concated CSS file
    // all.css
    copy: {
      common: {
        files: [
          { expand: true, cwd: '.', src: ['README.txt'], dest: 'build/app/' },
          { expand: true, cwd: '.', src: ['app/**.html'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/audio/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/fonts/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/images/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/lib/**'], dest: 'build/' },
          { expand: true, cwd: '.', src: ['app/_locales/**'], dest: 'build/' }
        ],
        options: {
          // this rewrites the <script> tag in the index.html file
          // to point at the minified/concated js file all.js;
          // and the stylesheet tags to point at all.css;
          // it additionally strips out as much space and as many newlines
          // as possible from HTML files (NB this may be dangerous if
          // files are space-sensitive, but most HTML shouldn't be)
          processContent: function (content) {
            if (content.match(/DOCTYPE/)) {
              // remove comments
              content = content.replace(/.+\/\/.+?\n/g, '');
              content = content.replace(/<!--[\s\S]+?-->/g, '');

              // whitespace reduction
              content = content.replace(/[ ]{2,}/g, ' ');
              content = content.replace(/\n{2,}/g, '\n');
            }

            return content;
          },

          // if you have other resources which you don't want to have
          // treated as text, add them here
          processContentExclude: [
            'app/images/**',
            'app/audio/**',
            'app/_locales/**',
            'app/fonts/**',
            'app/lib/**',
            '*.png',
            'README.txt'
          ]
        }
      },
      wgt: {
        files: [
          { expand: true, cwd: 'build/app', src: ['**'], dest: 'build/wgt/' },
          { expand: true, cwd: '.', src: ['config.xml'], dest: 'build/wgt/' },
          { expand: true, cwd: '.', src: ['icon_128.png'], dest: 'build/wgt/' }
        ]
      },
      crx: {
        files: [
          { expand: true, cwd: 'build/app', src: ['**'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['manifest.json'], dest: 'build/crx/' },
          { expand: true, cwd: '.', src: ['icon_*.png'], dest: 'build/crx/' }
        ]
      }
    },

    // make wgt and crx packages in build/ directory
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
      crx: {
        appName: '<%= chromeInfo.name %>',
        version: '<%= chromeInfo.version %>',
        files: 'build/crx/**',
        stripPrefix: 'build/crx/',
        outDir: 'build',
        suffix: '.crx',
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
    }
  });

  grunt.registerTask('dist', ['clean', 'cssmin:dist', 'uglify:dist', 'copy:common']);
  grunt.registerTask('wgt', ['dist', 'copy:wgt', 'package:wgt']);
  grunt.registerTask('crx', ['dist', 'copy:crx', 'package:crx']);

  grunt.registerTask('reinstall', [
    'wgt',
    'sdb:prepare',
    'sdb:pushwgt',
    'sdb:stop',
    'sdb:uninstall',
    'sdb:install',
    'sdb:debug'
  ]);
  grunt.registerTask('install', ['wgt', 'sdb:prepare', 'sdb:pushwgt', 'sdb:install', 'sdb:debug']);
  grunt.registerTask('restart', ['sdb:stop', 'sdb:start']);
  grunt.registerTask('default', 'wgt');
};
