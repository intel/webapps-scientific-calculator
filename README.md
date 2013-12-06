# INTRODUCTION
A scientific calculator implemented with HTML5/Javascipt technology.

It has been tested on the following browsers/platforms:
* Tizen/WRT
* Tizen/Crosswalk
* Android/Crosswalk
* Tizen IDE
* Chrome/file
* Chrome/extension

This application is distributed under [Apache2.0](http://www.apache.org/licenses/LICENSE-2.0.html) license.

See [HACKING.md](https://github.com/01org/webapps-scientific-calculator/blob/master/HACKING.md) for more details about how to use and extend this project.

# AUTHORS
* Author: Carl Wong <carl.wong@intel.com>
* Owner: Carl Wong <carl.wong@intel.com>

# DEPENDENCIES
Run-time dependencies (note that these are installed using bower and not distributed with the project):

* intel-appframework<br/>
http://app-framework-software.intel.com/

* Q<br/>
http://github.com/kriskowal/q

* PEG.js<br/>
http://pegjs.majda.cz/

* iScroll<br/>
http://cubiq.org/iscroll-4

Build-time dependencies are detailed in the package.json file.<br/>
These are installed using npm and not distributed with the application.

# FONTS
This project uses the following fonts:

* Open Sans<br/>
Author: Steve Matteson<br/>
License: Apache License, version 2.0<br/>
Homepage: http://www.google.com/webfonts/specimen/Open+Sans

# IMAGES
All images are created by Intel Corp.<br/>
They are licensed under the Creative Commons Attribution 3.0 license.<br/>
http://creativecommons.org/licenses/by/3.0/us/

# SOUNDS
Credits for the sounds in the `app/audio` directory are as follows:

* EqualitySign_R2.ogg, GeneralButtonPress_R2.ogg<br/>
These files were created by Intel Corp. and are licensed under the creative Commons Attribution 3.0 license<br/>
http://creativecommons.org/licenses/by/3.0/us/

# KNOWN ISSUES
1) Using the Nth Root function will place the result in both the main entry and current formula areas. The result itself is correct.
