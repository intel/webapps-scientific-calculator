#! /bin/bash -f

# you can use a global install of bower :
# $ sudo npm install --global bower
# $ bower install
#
# but that doesn't allow you to specify a version.
# You can install a local version of bower which
# means npm will use the version specified in the
# package.json file.
#
# $ npm install bower
# $ ./node_modules/bower/bin/bower install
#
# or you can run this file :
#
# ./bower install


./node_modules/bower/bin/bower $*
