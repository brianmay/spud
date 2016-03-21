#!/bin/bash
DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

RETURN=0
cd $DIR

if [ -n "$*" ]; then
    TESTS="$@"
else
    TESTS="spud"
fi

echo ""
echo "FLAKE8"
echo "############################"
flake8 --ignore=E501 --filename="south_migrations" spud
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

flake8 --ignore=E501 --filename="migrations" spud
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

flake8 --exclude="south_migrations,migrations" spud
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

echo ""
echo "STATIC FILES"
echo "############################"
./manage.py collectstatic --settings=spud.tests.settings -v 2 --noinput
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

tsc spud/static/js/*.ts
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

echo ""
echo "TESTS - Python 2"
echo "############################"
python2 -m pytest
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

echo ""
echo "TESTS - Python 3"
echo "############################"
python3 -m pytest
if [ ! $? -eq 0 ]
then
    RETURN=1
fi

exit $RETURN
