#!/bin/sh
set -e

if ! test -d /var/lib/spud/static
then
    mkdir /var/lib/spud/static
    chown www-data:root -R /var/lib/spud/static
    sudo -u www-data python3 manage.py collectstatic --noinput
    chown root:root -R /var/lib/spud/static
fi

sudo -u www-data ./scripts/start.sh
