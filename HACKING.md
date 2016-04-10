# INITIAL SET UP

To run the build, you'll need to install some node modules.
Run the following in the top-level directory of the project:

    npm install

grunt requires that you install grunt-cli globally
to be able to use grunt from the command line. To install
grunt-cli do:

    npm install -g grunt-cli

You should then install the client-side dependencies into app/lib/:

    npm install -g bower
    bower install

# WHERE'S THE APP?

*   Serve the app from a standard web server. First, run:

        grunt dist

    Then copy the content of the build/app/ directory to a web folder
    for your server (e.g. an Apache htdocs directory).

*   Run the app using the built-in local server:

        grunt connect

    This builds the dist version of the app and runs it on a server
    accessible at http://localhost:8000/.

    Follow
    [these](https://developer.chrome.com/devtools/docs/remote-debugging)
    instructions to debug it on your Android phone.

*   Note that this app uses a Service Worker and they will only work
    when the app is served from an HTTPS connection, with the exception
    of localhost where it only works with HTTP (this also works with an
    Android phone via USB).
