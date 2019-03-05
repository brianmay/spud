#!/usr/bin/env python

# spud - keep track of photos
# Copyright (C) 2008-2013 Brian May
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import sys
import os

from setuptools import setup
from setuptools import Command


VERSION='2.1.0'

def fullsplit(path, result=None):
    """
    Split a pathname into components (the opposite of os.path.join) in a
    platform-neutral way.
    """
    if result is None:
        result = []
    head, tail = os.path.split(path)
    if head == '':
        return [tail] + result
    if head == path:
        return result
    return fullsplit(head, [tail] + result)


packages = []
for dirpath, dirnames, filenames in os.walk("spud"):
    # Ignore dirnames that start with '.'
    for i, dirname in enumerate(dirnames):
        if dirname.startswith('.'):
            del dirnames[i]
    if filenames:
        packages.append('.'.join(fullsplit(dirpath)))


class VerifyVersionCommand(Command):
    """Custom command to verify that the git tag matches our version"""
    description = 'verify that the git tag matches our version'
    user_options = [
      ('version=', None, 'expected version'),
    ]

    def initialize_options(self):
        self.version = None

    def finalize_options(self):
        pass

    def run(self):
        version = self.version

        if version != VERSION:
            info = "{0} does not match the version of this app: {1}".format(
                version, VERSION
            )
            sys.exit(info)

setup(
    name="spud",
    version=VERSION,
    url='https://github.com/brianmay/spud',
    author='Brian May',
    author_email='brian@microcomaustralia.com.au',
    description='SPUD is a Sortable Photo album Using a '
    'Django based database.',
    packages=packages,
    license="GPL3+",
    long_description=open('README.rst').read(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Framework :: Django",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: "
            "GNU General Public License v3 or later (GPLv3+)",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3.3",
        "Programming Language :: Python :: 3.4",
        "Programming Language :: Python :: 3.5",
    ],
    keywords="photo database",
    package_data={
        '': [
            '*.css', '*.html', '*.js',
            '*.jpg', '*.png', '*.gif', '*.map', '*.txt'],
    },
    scripts=[
        'scripts/start.sh',
        'bin/spud',
        'bin/spud_set_secret_key',
        'bin/spud_migrate_south',
    ],
    tests_require=[
        'mock',
        'django-environ',
        'pytest',
        'pytest-runner',
    ],
    install_requires=[
        "Django >= 1.8",
        "django-pipeline",
        "djangorestframework >= 3.0.5",
        "python-dateutil",
        "Pillow",
        "six",
        "pytz",
        "cssmin",
        "slimit>=0.8.1",
        "django-cors-headers",
        "django-environ",
    ],
    cmdclass={
        'verify': VerifyVersionCommand,
    }
)
