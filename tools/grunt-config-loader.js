/*
 * Copyright (c) 2013, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

/*
 * Load path data from a JSON file
 *
 * The paths in the file should take the format:
 *
 * {cwd: <dir>, src: <glob>}
 *
 * where dir is a directory and src an array of grunt file globs;
 * the destination path for a file is relative to cwd. All src glob
 * paths are expanded to give the file path.
 *
 * This loader will append the correct destination to the files in the
 * config and return an object with all the required path sets for use
 * in Gruntfile.js.
 */
module.exports = function (jsonFile) {
  var _ = require('lodash');
  var grunt = require('grunt');

  // custom build information for this build
  var buildInfo = grunt.file.readJSON(jsonFile);

  // defaults
  _.defaults(buildInfo, {
    wgtConfig: 'config.xml',
    wgtRemoteDir: '/home/developer',
    commonAssets: [],
    libs: [],
    htmlFiles: [],
    templateFiles: [],
    cssFiles: [],
    jsFiles: [],
    serverPort: 30303,
    sdbCmd: 'sdb'
  });

  // remove trailing slash
  buildInfo.wgtRemoteDir = buildInfo.wgtRemoteDir.replace(/\/$/, '');

  // add a dest property and expand:true to each file element in array arr
  var addDest = function (arr, dest) {
    return _.map(arr, function (f) {
      var fileSpec = _.clone(f);
      fileSpec.dest = dest;
      fileSpec.expand = true;
      return fileSpec;
    });
  };

  // expands all the files returned by the file spec patterns in the
  // array arr, appending them to dest; this is used to get an array
  // of CSS files to be combined together to produce the single
  // minified CSS file (and also exclude directories);
  // NB cssmin is the only task which requires
  // one destination file to many origin files: imagemin and htmlmin
  // map one origin file to one destination file
  var expandPatterns = function (arr, dest) {
    var paths = [];

    for (var i = 0; i < arr.length; i++) {
      var fileSpec = arr[i];

      var opts = {cwd: fileSpec.cwd, filter: 'isFile'};

      for (var j = 0; j < fileSpec.src.length; j++) {
        var matches = grunt.file.expand(opts, fileSpec.src[j]);
        matches = _.map(matches, function (m) {
          return fileSpec.cwd.replace(/\/$/, '') + '/' + m;
        });
        paths = paths.concat(matches);
      }
    }

    return paths;
  };

  var commonFiles = addDest(buildInfo.common, 'build/dist/');

  var libFilesUnminified = addDest(buildInfo.libs, 'build/dist/');

  var htmlFilesUnminified = addDest(buildInfo.html, 'build/dist/');
  var htmlFilesMinified = addDest(buildInfo.html, 'build/minified/');

  var templateFilesUnminified = addDest(buildInfo.templates, 'build/dist/');

  var cssFilesUnminified = addDest(buildInfo.css, 'build/dist/');
  var cssFilesMinified = expandPatterns(buildInfo.css);

  var jsFilesUnminified = addDest(buildInfo.js, 'build/dist/');

  var imageFilesUnminified = addDest(buildInfo.images, 'build/dist/');
  var imageFilesMinified = addDest(buildInfo.images, 'build/minified/');

  // expand the paths given for amd.include
  var amdBaseUrl = buildInfo.amd.baseUrl;
  var amdInclude = _.reduce(buildInfo.amd.include, function (memo, glob) {
    var files = grunt.file.expand({cwd: amdBaseUrl, filter: 'isFile'}, glob);

    // not a glob, so no files came back; use as-is instead
    if (files.length === 0) {
      files = [glob];
    }

    return memo.concat(files);
  }, []);

  buildInfo.amd.include = _.map(amdInclude, function (path) {
    return path.replace('.js', '');
  });

  _.extend(buildInfo, {
    commonFiles: commonFiles,
    libFilesUnminified: libFilesUnminified,
    htmlFilesUnminified: htmlFilesUnminified,
    htmlFilesMinified: htmlFilesMinified,
    templateFilesUnminified: templateFilesUnminified,
    cssFilesUnminified: cssFilesUnminified,
    cssFilesMinified: cssFilesMinified,
    jsFilesUnminified: jsFilesUnminified,
    imageFilesUnminified: imageFilesUnminified,
    imageFilesMinified: imageFilesMinified
  });

  return buildInfo;
};
