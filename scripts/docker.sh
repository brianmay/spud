#!/bin/sh
set -e

python3 manage.py collectstatic --noinput
sudo -u www-data ./scripts/start.sh
