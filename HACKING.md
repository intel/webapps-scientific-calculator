# INITIAL SET UP

To run the build, you'll need to install some node modules.
Run the following in the top-level directory of the project:

  npm install

Rather annoyingly, grunt now requires that you install
grunt-cli globally to be able to use grunt from the
command line. Note that the build will still use the
version of grunt associated with this application
(in node_modules/).

To install grunt-cli do:

  npm install -g grunt-cli

# WHERE'S THE APP?

Open app/index.html in a browser (there's no requirement to run
a build before you can run the app).

Or you could also serve the app from a standard web server by running

  grunt dist

then copying the content of the build/app/ directory to a web folder.

Alternatively, run:

  grunt server

to build the deployment version of the app and run it on a server,
accessible via http://localhost:30303/. This is useful for testing the
app in a mobile device's browser.

Or you can install to an attached Tizen device via sdb by running:

  grunt install

then

  grunt reinstall

to reinstall the package after you've been working on the code.

Or you can build the files required for a crx deployment with:

  grunt crx

(NB you will have to load this as an unpacked extension in Chrome
developer mode, as the grunt build doesn't make .crx files.)

# PACKAGING

The application can be packaged into a wgt (zip) file using the grunt
command:

  ./grunt wgt

This will generate a package in the build/ directory.

See grunt.js for more details of how this works.
