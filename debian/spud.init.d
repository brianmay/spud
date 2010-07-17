#! /bin/sh
### BEGIN INIT INFO
# Provides:          FastCGI servers for Django
# Required-Start:    $network, $remote_fs
# Required-Stop:     $network, $remote_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start FastCGI servers with Django.
# Description:       Django, in order to operate with FastCGI, must be started
#                    in a very specific way with manage.py. This must be done
#                    for each DJango web server that has to run.
### END INIT INFO
#
# Author:  Guillermo Fernandez Castellanos
#          <guillermo.fernandez.castellanos AT gmail.com>.
#
# Version: @(#)fastcgi 0.1 11-Jan-2007 guillermo.fernandez.castellanos AT gmail.com
#

#### SERVER SPECIFIC CONFIGURATION
DJANGO_SITES="photos"
RUN_AS=www-data
#### DO NOT CHANGE ANYTHING AFTER THIS LINE!

set -e

PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
DESC="SPUD photo album"
NAME=$0

if [ -f "/etc/default/spud" ]
then
    . /etc/default/spud
fi

if [ -z "$START" ]
then
    exit 0
fi

running()
{
    local pidfile="$1"
    local binpath="$2"

    # No pidfile, probably no daemon present
    #
    if [ ! -f $pidfile ]
    then
        return 1
    fi

    local pid=`cat $pidfile`

    # No pid, probably no daemon present
    #
    if [ -z "$pid" ]
    then
        return 1
    fi

    if [ ! -d /proc/$pid ]
    then
        return 1
    fi

    local cmd=`cat /proc/$pid/cmdline | tr "\000" "\n"|head -n 1`

    # No syslogd?
    #
    if [ "$cmd" != "$binpath" ]
    then
        return 1
    fi

    return 0
}

#
#       Function that starts the daemon/service.
#
d_start()
{
    # Starting all Django FastCGI processes
    for SITE in $DJANGO_SITES
    do
        echo -n "$SEP$SITE"
        SEP=", "
        if running "/var/run/$SITE.pid" "python"; then
            echo -n " already running"
        else
            rm -f /var/run/$SITE.pid
            start-stop-daemon --start --quiet \
                       --pidfile /var/run/$SITE.pid \
                       --chuid $RUN_AS --exec /usr/bin/env -- python \
                       spud runfcgi \
                       socket=/var/run/$SITE.socket \
                       pidfile=/var/run/$SITE.pid \
                       errlog=/var/log/$SITE.log \
                       outlog=/var/log/$SITE.log 
            chmod 400 /var/run/$SITE.pid
        fi
    done
}

#
#       Function that stops the daemon/service.
#
d_stop() {
    # Killing all Django FastCGI processes running
    for SITE in $DJANGO_SITES
    do
        echo -n "$SEP$SITE"
        SEP=", "
        if ! running "/var/run/$SITE.pid" "python"; then
                echo -n " not running"
        else
                start-stop-daemon --stop --quiet --pidfile /var/run/$SITE.pid \
                                  || echo -n " not running"
                if [ -f /var/run/$SITE.pid ]; then
                   rm /var/run/$SITE.pid
                fi
        fi
    done
}

ACTION="$1"
SEP=""
case "$ACTION" in
    start)
        echo -n "Starting $DESC: "
        d_start
        echo "."
        ;;

    stop)
        echo -n "Stopping $DESC: "
        d_stop
        echo "."
        ;;

    restart|force-reload)
        echo -n "Restarting $DESC: "
        d_stop
        sleep 1
        d_start
        echo "."
        ;;

    *)
        echo "Usage: $NAME {start|stop|restart|force-reload}" >&2
        exit 3
        ;;
esac

exit 0
