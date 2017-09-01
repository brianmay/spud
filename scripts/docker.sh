#!/bin/sh
set -e

if ! test -d /var/lib/spud/static
then
    mkdir /var/lib/spud/static
    python3 manage.py collectstatic --noinput
fi

sudo -u www-data ./scripts/start.sh
