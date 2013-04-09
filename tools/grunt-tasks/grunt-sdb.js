module.exports = function (grunt) {
  var path = require('path');
  var fs = require('fs');
  var exec = require('child_process').exec;

  var _ = require('lodash');
  var async = require('async');
  var parser = new (require('xml2js').Parser)();

  // cb() receives true if file exists, false otherwise
  var remote_fileExists = function (sdbCmd, localFile, remoteDir, cb) {
    var basename = path.basename(localFile);
    var remoteLs = '"ls ' + remoteDir + ' | grep ' + basename + '"';
    var cmd = sdbCmd + ' shell ' + remoteLs;

    exec(cmd, function (error, stdout, stderr) {
      if (stdout === '') {
        cb(false);
      }
      else if (error) {
        grunt.log.error('could not ls remote ' + remoteDir);
        grunt.log.error(stderr);
        cb(true);
      }
      else {
        cb(true);
      }
    });
  };

  var sdbPush = function (sdbCmd, localFile, remoteDir, done) {
    var cmd = sdbCmd + ' push ' + localFile + ' ' + remoteDir;

    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        grunt.log.error('could not push file to device');
        grunt.log.error(stderr);
        done(err);
      }
      else {
        grunt.log.ok('pushed local:' + localFile + ' to remote:' + remoteDir);
        done();
      }
    });
  };

  var pushOneFile = function (sdbCmd, localFile, remoteDir, overwrite, chmod, done) {
    var basename = path.basename(localFile);
    var target = path.join(remoteDir, basename);

    var cb = done;
    if (chmod) {
      cb = function () {
        // run chmod on the file after pushing it
        var cmd = sdbCmd + ' shell "chmod ' + chmod + ' ' + target + '"';

        exec(cmd, function (error, stdout, stderr) {
          if (error) {
            grunt.log.warn('could not chmod ' + target);
          }
          else {
            grunt.log.ok('did chmod ' + chmod + ' on ' + target);
          }

          done();
        });
      };
    }

    if (overwrite) {
      sdbPush(sdbCmd, localFile, remoteDir, cb);
    }
    else {
      remote_fileExists(sdbCmd, localFile, remoteDir, function (result) {
        if (result) {
          grunt.log.warn('not pushing ' + localFile + ' as it exists remotely and overwrite == false');
        }
        else {
          sdbPush(sdbCmd, localFile, remoteDir, cb);
        }
      });
    }
  };

  // glob: a pattern to pass to the ls command
  // cb(err, files): if err is null, no error occurred;
  // files is an array of matching files, newest at the top
  var remote_ls = function (sdbCmd, glob, cb) {
    // ls -1 -c returns newest file at the top of a list of filenames
    // separated by newlines
    var cmd = sdbCmd + ' shell "ls -1 -c ' + glob + '"';

    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        cb(err);
      }
      else {
        // this cleans up stdout so it contains no blank lines
        // and can be easily split
        stdout = stdout.replace(/\r/g, '');
        stdout = stdout.replace(/\n$/, '');

        cb(null, stdout.split('\n'));
      }
    });
  };

  // stat the files in filePaths and return the latest (NB this
  // uses node to process the directory, not ls)
  var getLatest = function (filePaths) {
    if (filePaths.length > 1) {
      // sort so latest file is first in the list
      var sortFn = function(a, b) {
        var aTime = fs.statSync(a).mtime.getTime();
        var bTime = fs.statSync(b).mtime.getTime();
        return bTime - aTime;
      }

      filePaths = filePaths.sort(sortFn);
    }

    return filePaths[0];
  };

  var installOneFile = function (sdbCmd, installScript, wgtFilePath, done) {
    var cmd = sdbCmd + ' shell "' + installScript + ' install ' + wgtFilePath + '"';
    grunt.log.writeln(cmd);
    exec(cmd, function (err, stdout, stderr) {
      grunt.log.write(stdout);

      if (err || stdout.match('installation has failed')) {
        grunt.log.error('error installing package ' + wgtFilePath);
        grunt.log.error(stderr);
        done(new Error('installation failed'));
      }
      else {
        grunt.log.ok('installed package ' + wgtFilePath);
        done();
      }
    });
  };

  var getId = function (configXml, cb) {
    var file = grunt.file.expand(configXml)[0];

    if (file) {
      fs.readFile(file, function (err, xml) {
        parser.parseString(xml, function (err, result) {
          if (err) {
            cb(err);
          }
          else {
            var id = result.widget.$.id;
            cb(null, id);
          }
        });
      });
    }
    else {
      cb(new Error('could not read file ' + configXml));
    }
  };

  // ACTIONS

  /* push: proxy for sdb push <local> <remote>
   *
   * config.sdbCmd: path to sdb (default='sdb')
   * config.remoteDestDir: remote directory to push to; the absolute
   * path to the destination file is the basename of the local file
   * appended to this directory
   * config.chmod: chmod command to apply to pushed files, e.g. '+x';
   * this is passed as an argument to chmod directly, e.g.
   * '+x' would run "chmod +x <files>" (optional)
   * config.overwrite: (default=true) if false and the file exists,
   * it isn't pushed again
   * config.localFiles: single filename as a string, an array of
   * filenames, or an object with form {pattern: 'xxx', filter: 'yyy'},
   * where 'xxx' is a file glob and 'yyy' is a filter ('latest' is
   * the only valid value, which will sort the matched files and get
   * the one which was last modified)
   */
  var push = function (config, done) {
    if (!config.localFiles) {
      grunt.fatal('sdb:push needs localFiles property');
    }
    if (!config.remoteDestDir) {
      grunt.fatal('sdb:push needs remoteDestDir property');
    }
    if (!config.sdbCmd) {
      grunt.fatal('sdb:push needs sdbCmd property');
    }

    // get variables from config and set defaults
    var overwrite = (config.overwrite === false ? false : true);
    var chmod = config.chmod || null;
    var remoteDir = config.remoteDestDir;
    var sdbCmd = config.sdbCmd;

    // what are we pushing?
    var filesToPush = [];
    if (_.isString(config.localFiles)) {
      filesToPush.push(config.localFiles);
    }
    else if (_.isObject(config.localFiles)) {
      // we get a list of files and apply a filter
      var glob = config.localFiles.pattern;
      var files = grunt.file.expand(glob);

      // apply filters
      if (config.localFiles.filter === 'latest') {
        filesToPush.push(getLatest(files));
      }
      else {
        filesToPush = files;
      }
    }
    else {
      filesToPush = config.localFiles;
    }

    // push files in parallel
    async.each(
      filesToPush,

      function (fileToPush, asyncCb) {
        pushOneFile(sdbCmd, fileToPush, remoteDir, overwrite, chmod, asyncCb);
      },

      function (err) {
        if (err) {
          grunt.fatal('error while pushing files');
          grunt.log.error(err);
        }
        else {
          grunt.log.ok('all files pushed');
        }

        done();
      }
    );
  };

  /* install: proxy for wrt-installer -i
   *
   * config.remoteScript: the tizen-app.sh script location on the device
   * config.remoteFiles: full path to a file, array of full paths to
   * files, or a {pattern: xxx, filter: yyy} object, where xxx is a file
   * glob for the remote filesystem and yyy can be set to 'latest' (to
   * retrieve the last modified file retrieved by the glob); this defines the
   * remote files which will be installed
   * config.sdbCmd: the sdb binary path (default='sdb')
   * done: function with signature done(err), where err is set to
   * a non-null value if an error occurs
   */
  var install = function (config, done) {
    var sdbCmd = config.sdbCmd;
    var remoteScript = config.remoteScript;
    var remoteFiles = config.remoteFiles;

    var installFiles = function (filesToInstall, cb) {
      async.each(
        filesToInstall,

        function (fileToInstall, asyncCb) {
          installOneFile(sdbCmd, remoteScript, fileToInstall, asyncCb);
        },

        function (err) {
          if (err) {
            grunt.fatal('error while installing package');
            grunt.log.error(err);
          }
          else if (!filesToInstall.length) {
            grunt.log.warn('no packages to install');
          }
          else {
            grunt.log.ok('all packages installed');
          }

          cb();
        }
      );
    };

    // which files to install (may need ls on the device to find them)
    if (_.isString(config.remoteFiles)) {
      installFiles([config.remoteFiles], done);
    }
    else if (_.isObject(config.remoteFiles)) {
      var glob = config.remoteFiles.pattern;

      remote_ls(sdbCmd, glob, function (err, files) {
        if (err) {
          grunt.log.error('could not run ls on device');
          grunt.log.error(err);
          done(err);
        }
        else if (config.remoteFiles.filter === 'latest') {
          installFiles([files[0]], done);
        }
        else {
          installFiles(files, done);
        }
      });
    }
    else {
      installFiles(config.localFiles, done);
    }
  };

  /* uninstall: proxy for wrt-installer -ug
   *
   * config.remoteScript: the tizen-app.sh script location on the device
   * config.config: location of config.xml (default='config.xml'); this
   * is used to retrieve the app ID (the URI in widget[@id])
   * config.sdbCmd: the sdb binary path (default='sdb')
   * done: function with signature done(err), where err is set to
   * a non-null value if an error occurs
   */
  var uninstall = function (config, done) {
    var configXml = config.config;
    var sdbCmd = config.sdbCmd;
    var remoteScript = config.remoteScript;

    getId(configXml, function (err, id) {
      var cmd = sdbCmd + ' shell "' + remoteScript +
                ' uninstall ' + id + '"';

      console.log(cmd);

      exec(cmd, function (err, stdout, stderr) {
        grunt.log.write(stdout);

        if (err || stdout.match('not installed|failed')) {
          done(new Error('package with id ' + id + ' could not be uninstalled'));
        }
        else {
          grunt.log.ok('package with id ' + id + ' uninstalled');
          done();
        }
      });
    });
  };

  /* launch: proxy for wrt-launcher -s (normal start), -k (kill),
   * -d -s (start with debugger)
   *
   * config.remoteScript: the tizen-app.sh script location on the device
   * config.config: location of config.xml (default='config.xml')
   * config.sdbCmd: the sdb binary path (default='sdb')
   * config.localPort: local port which is forwarded to the debug port
   * for this app on the device (default=8888)
   * config.openBrowser: command to open the browser at the debug URL;
   * use '%URL%' to pass the URL of the debug page into the browser
   * command line, e.g. 'google-chrome %URL%'
   * subcommand: 'stop', 'start', 'debug'
   * done: function with signature done(err), where err is set to
   * a non-null value if an error occurs
   */
  var launch = function (config, subcommand, done) {
    var configXml = config.config;
    var sdbCmd = config.sdbCmd;
    var remoteScript = config.remoteScript;
    var localPort = config.localPort || '8888';
    var openBrowser = config.openBrowser || null;

    var cb = done;
    if (subcommand === 'debug') {
      cb = function (err, result) {
        if (!err) {
          var remotePort = result.match(/PORT (\d+)/)[1];
          var cmd = sdbCmd + ' forward tcp:' + localPort + ' tcp:' + remotePort;

          exec(cmd, function (err, stdout, stderr) {
            if (err) {
              grunt.log.error('could not forward local port to remote port');
              done(err);
            }
            else {
              var url = 'http://localhost:' + localPort + '/inspector.html?page=1';
              grunt.log.ok('ready for debugging at \n' + url);

              if (openBrowser) {
                exec(openBrowser.replace('%URL%', url));
              }

              done();
            }
          });
        }
      };
    }

    var actionDone = (subcommand === 'stop' ? 'stopped' : 'launched');

    getId(configXml, function (err, id) {
      var cmd = sdbCmd + ' shell "' + remoteScript +
                ' ' + subcommand + ' ' + id + '"';

      console.log(cmd);

      exec(cmd, function (err, stdout, stderr) {
        grunt.log.write(stdout);

        if (err || stdout.match('running')) {
          grunt.log.error('could not start app with ID ' + id);
          cb(new Error('app with id ' + id + ' could not be launched'));
        }
        else {
          grunt.log.ok('app with id ' + id + ' ' + actionDone);
          cb(null, stdout);
        }
      });
    });
  };

  /**
   * grunt sdb:* task
   * Wrappers for sdb commands for the whole development lifecycle,
   * including pushing wgt files to a device and
   * wrapping the wrt-installer and wrt-launcher commands;
   * also makes it easy to set up remote debugging for an app.
   *
   * Caveats: it will probably fail miserably if you try to have
   * multiple Tizen devices attached at the same time.
   *
   * DEPENDENCIES: grunt, lodash, xml2js, async
   * (install with npm)
   *
   * The actions available are:
   *
   *   push
   *   install
   *   uninstall
   *   start (see launch())
   *   stop (see launch())
   *   debug (see launch())
   *
   * To be able to use these actions, you should first set up a
   * push action to send the tizen-app.sh script to the device.
   * Configure in grunt.initConfig() like this (the example creates
   * a grunt sdb:prepare task which pushes the tizen-app.sh control
   * script to /opt/home/developer):
   *
   *   sdb: {
   *     prepare: {
   *       action: 'push',
   *       localFiles: './tools/grunt-tasks/tizen-app.sh',
   *       remoteDestDir: '/opt/home/developer/',
   *       chmod: '+x',
   *       overwrite: true
   *     },
   *     ...
   *   }
   *
   * Then call with grunt like this:
   *
   *   grunt sdb:prepare
   *
   * Once the tizen-app.sh script is in place, you can configure the
   * other tasks to make use of it, e.g.
   *
   * sdb: {
   *   prepare: { ... see above ... },
   *
   *   pushwgt: {
   *     action: 'push',
   *     localFiles: {
   *       pattern: 'build/*.wgt',
   *       filter: 'latest'
   *     },
   *     remoteDestDir: '/opt/home/developer/'
   *   },
   *
   *   install: {
   *     action: 'install',
   *     remoteFiles: {
   *       pattern: '/opt/home/developer/*.wgt',
   *       filter: 'latest'
   *     },
   *     remoteScript: '/opt/home/developer/tizen-app.sh'
   *   }
   * }
   *
   * See the documentation for push(), install(), uninstall()
   * and launch() for the valid configuration options for each task.
   *
   * Note that the wrt-launcher commands use the <widget> element's
   * id attribute to determine the ID of the app, by default derived from
   * the config.xml file in the root of the project.
   */
  grunt.registerMultiTask('sdb', 'use Tizen sdb', function () {
    this.data.sdbCmd = this.data.sdbCmd || 'sdb';
    this.data.config = this.data.config || 'config.xml';
    var action = this.data.action;

    if (!action) {
      grunt.fatal('sdb task requires action argument');
    }

    var done = this.async();

    if (action === 'push') {
      push(this.data, done);
    }
    else if (action === 'install') {
      install(this.data, done);
    }
    else if (action === 'uninstall') {
      uninstall(this.data, done);
    }
    // stop, start, debug
    else {
      launch(this.data, action, done);
    }
  });
};
