#!/bin/bash
set -e

spud collectstatic --noinput
spud manage.py migrate --noinput

# Start Gunicorn processes
echo Starting Gunicorn.
exec gunicorn spud.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3
