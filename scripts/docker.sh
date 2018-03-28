#!/bin/sh
set -e

python3 manage.py collectstatic --noinput
sudo -u www-data -E ./scripts/start.sh "$@"
