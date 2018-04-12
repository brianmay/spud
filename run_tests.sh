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
echo "ISORT"
echo "############################"
isort -rc --check --diff spud
if [ "$?" -ne 0 ]
then
    exit 1
fi

echo ""
echo "FLAKE8"
echo "############################"
flake8 spud
if [ "$?" -ne 0 ]
then
    exit 1
fi

echo ""
echo "STATIC FILES"
echo "############################"
./manage.py makemigrations --settings=spud.tests.settings --check --dry-run
if [ ! $? -eq 0 ]
then
    RETURN=1
fi
./manage.py collectstatic --settings=spud.tests.settings -v 2 --noinput
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
