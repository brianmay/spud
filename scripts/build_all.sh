#!/bin/sh
set -e

docker build \
    --file "Dockerfile" \
    --tag "brianmay/spud" \
    .
