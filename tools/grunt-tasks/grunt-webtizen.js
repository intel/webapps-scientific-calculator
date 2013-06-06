module.exports = function (grunt) {
  var exec = require('child_process').exec;
  var command = "webtizen";

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
  grunt.registerMultiTask('webtizen', 'use Tizen webtizen', function () {
    var commandline=[ command, this.data.args ].join(" ");
    exec(commandline, { cwd: this.data.cwd }, function (err, stdout, stderr) {
      if (err) {
        grunt.log.error(commandline+":failed");
      }
      else {
        grunt.log.ok('successfully signed');
      }
    });
  });
};
