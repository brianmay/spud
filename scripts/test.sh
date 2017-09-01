#!/bin/sh
set -e

/usr/bin/docker run -ti --name spud \
  --rm \
  --net=host \
  -p 8000:8000 \
  -v /etc/passwd:/etc/passwd \
  -v /etc/group:/etc/group \
  -v $PWD/local/settings:/etc/spud \
  -v $PWD/local/log:/var/log/spud \
  brianmay/spud "$@"
