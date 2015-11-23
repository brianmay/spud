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
from __future__ import absolute_import
from __future__ import unicode_literals

import subprocess
import os
import json


class ExifTool(object):

    sentinel = b"{ready}\n"

    def __init__(self, executable="/usr/bin/exiftool"):
        self.executable = executable

    def __enter__(self):
        self.process = subprocess.Popen(
            [self.executable, "-stay_open", "True",  "-@", "-"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.process.stdin.write(b"-stay_open\nFalse\n")
        self.process.stdin.flush()

    def execute(self, *args):
        args = args + ("-execute",)
        args = [arg.encode("UTF8") for arg in args]
        self.process.stdin.write(bytes.join(b"\n", args) + b"\n")
        self.process.stdin.flush()
        output = b""
        fd = self.process.stdout.fileno()
        while not output.endswith(self.sentinel):
            output += os.read(fd, 4096)
        return output[:-len(self.sentinel)].decode("UTF8")

    def get_metadata(self, *filenames):
        exif = json.loads(self.execute("-G", "-j", "-n", *filenames))
        assert len(exif) == 1

        new_exif = {}
        for key, value in exif[0].items():
            if value != "undef":
                new_exif[key] = value

        return new_exif


def ffprobe(filename):
    process = subprocess.Popen([
        "avprobe", "-v", "quiet", "-of", "json",
        "-show_format", "-show_streams", filename],
        stdout=subprocess.PIPE)
    (stdout, stderr) = process.communicate()
    rc = process.wait()
    if rc != 0:
        raise RuntimeError("avprobe failed with %d" % rc)
    videometadata = json.loads(stdout.decode("UTF8"))
    return videometadata
