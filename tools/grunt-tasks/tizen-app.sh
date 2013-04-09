# combined installer/launcher script for Tizen apps;
# intended for installation on a Tizen handset

# uninstall a Tizen app
uninstall () {
  APP_ID=$2

  if [[ $APP_ID = "" ]] ; then
    echo "Usage: $0 $1 <app ID>"
    exit 1
  fi

  # check whether app is installed
  APP_EXISTS=`wrt-launcher -l | grep $APP_ID`

  # uninstall
  if [ "x$APP_EXISTS" != "x" ] ; then
    wrt-installer -ug $APP_ID
  else
    echo "app with ID $APP_ID is not installed" 1>&2
    exit 1
  fi
}

# install a Tizen app
install () {
  PACKAGE=$2

  if [[ $PACKAGE = "" ]] ; then
    echo "Usage: $0 $1 <path to .wgt package>"
    exit 1
  fi

  wrt-installer -i $PACKAGE
}

# start a Tizen app
start () {
  APP_ID=$2

  if [[ $APP_ID = "" ]] ; then
    echo "Usage: $0 $1 <app ID>"
    exit 1
  fi

  # only start if not running
  IS_RUNNING=`wrt-launcher -r $APP_ID`
  if [[ "$IS_RUNNING" = "result: running" ]] ; then
    echo "app with ID $APP_ID is already running" 1>&2
    exit 1
  else
    wrt-launcher -s $APP_ID
    exit 0
  fi
}

# properly stop a Tizen app
stop () {
  APP_ID=$2

  if [[ $APP_ID = "" ]] ; then
    echo "Usage: $0 $1 <app ID>"
    exit 1
  fi

  # check whether app is installed
  APP_EXISTS=`wrt-launcher -l | grep $APP_ID`

  NOT_RUNNING=

  # stop
  # this is a workaround for wrt-launcher reporting that an app
  # has been killed when it is actually still in a state where
  # it can't be uninstalled
  if [ "x$APP_EXISTS" != "x" ] ; then
    while [ "x$NOT_RUNNING" = "x" ] ; do
      RESULT=`wrt-launcher -k $APP_ID | grep "App isn't running"`

      if [ "x" != "x$RESULT" ] ; then
        NOT_RUNNING=true
      else
        echo "$APP_ID is still alive"
        sleep 0.25
      fi
    done

    echo "$APP_ID really is dead"
  else
    echo "WARNING: App with ID $APP_ID does not exist, so not killing or uninstalling"
  fi
}

# debug a Tizen app
# kill, uninstall, install and debug start a Tizen app;
# intended for installation on a Tizen handset
debug () {
  APP_ID=$2

  if [[ $APP_ID = "" ]] ; then
    echo "Usage: $0 $1 <app ID>"
    exit 1
  fi

  # run under debug, capturing the port
  # only start if not running
  IS_RUNNING=`wrt-launcher -r $APP_ID`
  if [[ "$IS_RUNNING" = "result: running" ]] ; then
    echo "app with ID $APP_ID is already running" 1>&2
    exit 1
  else
    PORT=`wrt-launcher -d -s $APP_ID | grep port | awk -F": " '{print $2}'`
    if [ "x$PORT" = "x" ] ; then
      echo "No debug port available; resolve by ensuring phone screen is not locked"
    else
      echo "PORT $PORT"
    fi

    exit 0
  fi
}

# main
if [[ "x$1" = "x" ]] ; then
  echo "Usage: $0 <command> <arguments>"
fi

$1 $*
