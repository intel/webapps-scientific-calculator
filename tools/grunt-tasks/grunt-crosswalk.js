module.exports = function (grunt) {
  var path = require('path');
  var which = require('which');
  var fs = require('fs');
  var semver = require('semver');

  var Api = require('crosswalk-apk-generator');

  var generate_apk = function(data,done) {
    var outDir = data.outDir || '.';
    var appConfig = {};
    var envConfig = {};

    // copy user-supplied parameters into envConfig or appConfig
    var envProperties = Object.keys(Api.Env.CONFIG_DEFAULTS);
    Object.keys(data).forEach(function(property){
      if (envProperties.indexOf(property)!=-1) {
        envConfig[property] = data[property];
      } else {
        appConfig[property] = data[property];
      }
    });

    // automatically find androidSDKDir from 'android' command in PATH
    if (!envConfig.androidSDKDir) {
      var androidPath = which.sync('android');
      // up two directories
      envConfig.androidSDKDir = path.dirname(path.dirname(androidPath));
    }

    if (!envConfig.xwalkAndroidDir) {
      var fromEnvVar = process.env.XWALK_APP_TEMPLATE;
      if (fromEnvVar) {
        envConfig.xwalkAndroidDir = fromEnvVar;
      } else {
        grunt.log.error('No xwalk app template specified. Use xwalkAndroidDir in Gruntfile.js or XWALK_APP_TEMPLATE.');
        done(false);
      }
    }

    // determine arch from xwalkAndroidDir/native_libs/
    if (envConfig.xwalkAndroidDir) {
      var nativeLibs = path.join(envConfig.xwalkAndroidDir,'native_libs');
      var arches = fs.readdirSync(nativeLibs);

      if (envConfig.arch) {
        // check it matches
        var foundArch = arches[0].slice(0,3);
        var specified = envConfig.arch.slice(0,3);
        if (foundArch!=specified) {
          grunt.log.error('\'arch\' property set to ('+specified+') in Gruntfile.js, but no app template for that architecture found.');
          grunt.log.error('architectures found :', arches);
          grunt.log.error('have you set xwalkAndroidDir property or XWALK_APP_TEMPLATE correctly?');
          grunt.log.error('XWALK_APP_TEMPLATE: ', process.env.XWALK_APP_TEMPLATE);
          done(false);
        }
      } else {
        // use the one in native_libs, if only one
        if (arches.length==0) {
          grunt.log.error('no architectures found in '+nativeLibs);
          done(false);
        } else
        if (arches.length>1) {
          grunt.log.error('multiple architectures found in '+nativeLibs);
          grunt.log.error('please specify using the \'arch\' property in your Gruntfile.js');
          done(false);
        }

        // use discovered
        envConfig.arch = arches[0];
      }
    }

    if (!envConfig.androidAPIVersion) {
      // get the api latest version from androidSDK/build-tools
      var buildToolsDir = path.join(envConfig.androidSDKDir,"build-tools");
      var files = fs.readdirSync(buildToolsDir);
      var androidAPIVersions = files.sort(semver.compare);
      var length = androidAPIVersions.length;
      var latest = androidAPIVersions[length-1];
      envConfig.androidAPIVersion = latest;
    }

    var logger = grunt.log;
    logger.log = logger.write; // Api.CommandRunner calls logger.log()

    var commandRunner = Api.CommandRunner(data.verbose, logger);

    // create a promise for a configured Env object
    var envPromise = Api.Env(envConfig, {commandRunner: commandRunner});

    // create a promise for a configured App object
    var appPromise = Api.App(appConfig);

    // use the Q promises library to synchronise the promises, so we
    // can create the objects in "parallel"
    Api.Q.all([envPromise, appPromise])
    .then(
      function (objects) {
        // once the App and Env are constructed, use the Env instance
        // to do a build for the App instance
        var env = objects[0];
        var app = objects[1];

        // create a Locations object for this App instance
        var locations = Api.Locations(app.sanitisedName, app.pkg, env.arch, outDir);

        // run the build
        return env.build(app, locations);
      }
    )
    .done(
      // success
      function (finalApk) {
        grunt.log.writeln('\n*** DONE\n    output apk path is ' + finalApk);
        done();
      },

      // error handler
      function (err) {
        grunt.log.error('!!! ERROR');
        grunt.log.error(err.stack);
        done(false);
      }
    );
  };

  /**
  * Build an apk
  *
  * Deps: 
  *
  * Configuration options:
  *
  *   appName - the name of the application; used as the base filename
  *   outDir - output directory to put the zipfile into
  *   version - application version
  *
  */
  grunt.registerMultiTask('crosswalk', 'Tasks for generating apk packages for crosswalk on Android', function (identifier) {
    var done = this.async();

    generate_apk(this.data, done);
  });

};

