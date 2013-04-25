# INITIAL SET UP

To run the build, you'll need to install some node modules.
Run the following in the top-level directory of the project:

    npm install

grunt requires that you install grunt-cli globally
to be able to use grunt from the command line. To install
grunt-cli do:

    npm install -g grunt-cli

You also need bower to install the client-side dependencies:

  npm install -g bower

You should then install the client-side dependencies into lib/:

  bower install

Note that if you want to install the application to a Tizen device
as a wgt file, you will also need to install the sdb tool first.
This is available for various platforms from
http://download.tizen.org/tools/latest-release/.

Configure your package manager to use the appropriate repo from the
ones available and install sdb, e.g. for Fedora 17:

    $ REPO=http://download.tizen.org/tools/latest-release/Fedora_17/tools.repo
    $ sudo yum-config-manager --add-repo $REPO
    $ sudo yum install sdb

# WHERE'S THE APP?

There are a few options for running the application:

*   Open app/index.html in a browser (there's no requirement to
    run a build before you can run the app).

*   Serve the app from a standard web server. First, run:

        grunt dist

    Then copy the content of the build/app/ directory to a web folder
    for your server (e.g. an Apache htdocs directory).

*   Run the app using the built-in local server:

        grunt server

    This builds the dist version of the app and runs it on a server
    accessible at http://localhost:30303/. This is useful for testing the
    app in a mobile device: just navigate to the server hosting
    the app, using the phone's browser.

*   Install/reinstall to an attached Tizen device via sdb by running:

        grunt wgt-install

    This installs an optimised version of the app (minified HTML,
    minified and concatenated CSS and JS).

*   Install an SDK-specific version of the app (no minification or
    concatenation) with:

        grunt sdk-install

*   Build the files for the Chrome extension with:

        grunt crx

    then load the build/crx directory as an unpacked extension in Chrome
    developer mode. (The build can't currently make full .crx packages.)

*   On Linux, use make to install the app to /usr/share/. If you are
    using the Chromium browser, you can use the Makefile as is; if not, edit the
    Makefile so the BROWSER= variable is set to the name of your Chrome
    binary (e.g. google-chrome instead of chromium-browser).

    Then do

        sudo make install

    to install the application. On Linux desktops which support the
    freedesktop.org specs, this will add the application to the standard
    application launcher.

# PACKAGING

The application can be packaged into a wgt (zip) file using the grunt
command:

    grunt wgt

This will generate a package in the build/ directory.

It can also be packaged into an SDK wgt file (with uncompressed JS,
CSS, and HTML) using:

    grunt sdk

Note that in both cases, the files comprising the packages are
first copied into the build/wgt and build/sdk directories respectively.
