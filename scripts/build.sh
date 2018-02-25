#!/bin/sh
set -e

docker build \
    --file "Dockerfile" \
    --tag "brianmay/spud" \
    --build-arg "BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`" \
    --build-arg "VCS_REF=`git rev-parse --short HEAD`" \
    .
