module.exports = function (grunt) {
  var exec = require('child_process').exec;
  var command = "webtizen";

  /**
   * grunt webtizen:* task
   * Wrappers for webtizen command.
   *
   * Caveats: it will probably fail miserably if you try to have
   * multiple Tizen devices attached at the same time.
   *
   * DEPENDENCIES: grunt
   * (install with npm)
   *
   * PROPERTIES:
   * cwd: the directory in which to run the webtizen command
   *      (it is important for some commands, eg signing)
   * args: the arguments to the webtizen command
   *
   * To be able to use this task, you should first set up a
   * task and target in your Gruntfile.js.
   * Configure in grunt.initConfig() like this (the example creates
   * a grunt sdb:prepare task which pushes the tizen-app.sh control
   * script to /opt/home/developer):
   *
   *   webtizen: {
   *     sign: {
   *       cwd: 'build/wgt',
   *       args: 'signing --nocheck -p '+process.env.TIZENSDKPROFILE
   *     },
   *     ...
   *   }
   *
   * You have to then set the TIZENSDKPROFILE environment variable to
   * point to where your profile is located.
   *
   * Then call with grunt like this:
   *
   *   grunt webtizen:sign
   *
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
