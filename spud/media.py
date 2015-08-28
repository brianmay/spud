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
from __future__ import print_function

import six
import tempfile
import subprocess
import os
from PIL import Image
import spud.exif
import datetime


class UnknownMediaType(Exception):
    pass


class media:
    def __init__(self, fp):
        self._fp = fp
        self._tmp_file = None

    def get_fp(self):
        if not isinstance(self._fp, six.string_types):
            self._fp.seek(0)
        return self._fp

    def get_path(self):
        if isinstance(self._fp, six.string_types):
            return self._fp

        if self._tmp_file is None:
            tmp_file = tempfile.NamedTemporaryFile(delete=False)
            print("creating temp file %s" % tmp_file)

            for chunk in self._fp.chunks():
                tmp_file.write(chunk)
            del chunk

            tmp_file.flush()
            self._tmp_file = tmp_file.name

        return self._tmp_file

    def __del__(self):
        if self._tmp_file is not None:
            print("removing temp file %s" % self._tmp_file)
            os.unlink(self._tmp_file)
            self._tmp_file = None

    def get_size(self):
        fp = self.get_fp()
        im = Image.open(fp)
        return im.size

    def get_exif(self):
        path = self.get_path()
        with spud.exif.ExifTool() as e:
            exif = e.get_metadata(path)
        return exif

    def get_datetime(self):
        exif = self.get_exif()
        dt = None

        value = exif.get('EXIF:DateTimeOriginal', None)
        if value == '    :  :     :  :  ':
            value = None

        if value is None:
            value = exif.get('EXIF:DateTimeDigitized', None)
        if value == '    :  :     :  :  ':
            value = None

        if value is None:
            value = exif.get('EXIF:CreateDate', None)
        if value == '    :  :     :  :  ':
            value = None

        if value is not None:
            dt = datetime.datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
        del value

        return dt

    def create_thumbnail(self, dst_path, max_size):
        fp = self.get_fp()
        image = Image.open(fp)
        return self._create_thumbnail(dst_path, max_size, image)

    def _create_thumbnail(self, dst_path, max_size, image):
        (width, height) = image.size

        if width > max_size['size'] or height > max_size['size']:
            thumb_width = max_size['size']
            thumb_height = max_size['size']

            if width > height:
                thumb_height = int(max_size['size']*1.0/width * height)
            else:
                thumb_width = int(max_size['size']*1.0/height * width)

            if max_size['draft']:
                image.thumbnail(
                    (thumb_width, thumb_height), Image.ANTIALIAS)
            else:
                image = image.resize(
                    (thumb_width, thumb_height), Image.ANTIALIAS)
            thumb_width, thumb_height = image.size
        else:
            thumb_width = width
            thumb_height = height

        image.save(dst_path)

        return (thumb_width, thumb_height)

    def rotate(self, amount):
        raise NotImplementedError("rotate not implemented")

    def is_video(self):
        return False

    def get_normalized_exif(self):
        r = {}
        exif = self.get_exif()

        try:
            r['camera_make'] = exif['EXIF:Make']
        except KeyError:
            pass

        try:
            r['camera_model'] = exif['EXIF:Model']
        except KeyError:
            pass

        try:
            if int(exif['EXIF:Flash']) & 1:
                r['flash_used'] = 'Y'
            else:
                r['flash_used'] = 'N'
        except KeyError:
            pass

        try:
            r['focal_length'] = exif['EXIF:FocalLength']
        except KeyError:
            pass

        try:
            r['exposure'] = exif['EXIF:ExposureTime']
        except KeyError:
            pass

        # try:
        #     r['compression'] = ""
        # except KeyError:
        #     pass

        try:
            fnumber = exif['EXIF:FNumber']
            r['aperture'] = "F%.1f" % (fnumber)
        except KeyError:
            pass

        try:
            r['iso_equiv'] = exif['EXIF:ISO']
        except KeyError:
            pass

        try:
            value = int(exif['EXIF:MeteringMode'])
            if value == 0:
                r['metering_mode'] = "unknown"
            elif value == 1:
                r['metering_mode'] = "average"
            elif value == 2:
                r['metering_mode'] = "center weighted average"
            elif value == 3:
                r['metering_mode'] = "spot"
            elif value == 4:
                r['metering_mode'] = "multi spot"
            elif value == 5:
                r['metering_mode'] = "pattern"
            elif value == 6:
                r['metering_mode'] = "partial"
            elif value == 255:
                r['metering_mode'] = "other"
            else:
                r['metering_mode'] = "reserved"
        except KeyError:
            pass

        try:
            r['focus_dist'] = exif['Composite:HyperfocalDistance']
        except KeyError:
            pass

        # try:
        #     r['ccd_width'] = ""
        # except KeyError:
        #     pass

        return r


class media_jpeg(media):
    def rotate(self, amount):
        if amount == "auto":
            arg = "-a"
        elif amount == "0":
            return
        elif amount == "90":
            arg = "-9"
        elif amount == "180":
            arg = "-1"
        elif amount == "270":
            arg = "-2"
        else:
            raise RuntimeError("rotate amount %s unknown" % (amount))

        with open("/dev/null", "w") as null:
            subprocess.check_call(
                ["exiftran", "-i", arg, self.get_path()], stderr=null)


class media_video(media):

    def _get_ffprobe_vs(self):
        path = self.get_path()
        videometadata = spud.exif.ffprobe(path)

        vs = []
        for stream in videometadata['streams']:
            if stream['codec_type'] == "video":
                vs.append(stream)

        assert len(vs) == 1
        return vs[0]

    def create_thumbnail(self, dst_path, max_size):
        path = self.get_path()

        with tempfile.NamedTemporaryFile() as tmp_file:
            subprocess.check_call([
                "avconv", "-v", "quiet", "-y", "-ss", "0",
                "-i",  path, "-vframes",  "1", "-f", "image2", tmp_file.name])

            image = Image.open(tmp_file.name)
            rc = self._create_thumbnail(dst_path, max_size, image)

        return rc

    def create_video(self, dst_path, size, format):
        width, height = self.get_size()

        if height > size['size']:
            subst = {
                'w': size['size'] * width/height,
                'h': size['size'],
            }
        else:
            subst = {
                'w': width,
                'h': height,
            }

        cmd = [
            "avconv", "-y", "-i", self.get_path(),
            "-b:v", "400k",
            "-filter:v", "scale=%(w)s:%(h)s" % subst
        ]

        if format == "video/ogg":
            cmd.extend(["-f", "ogg"])
            cmd.extend(["-codec:a", "libvorbis"])
        elif format == "video/mp4":
            cmd.extend(["-f", "mp4"])
            cmd.extend(["-strict", "experimental"])
        elif format == "video/webm":
            cmd.extend(["-f", "webm"])
        else:
            raise RuntimeError("Unknown format %s" % format)

        cmd.append(dst_path)

        print(cmd)
        try:
            subprocess.check_call(cmd)
            return subst['w'], subst['h']
        except subprocess.CalledProcessError:
            os.unlink(dst_path)
            return None

    def get_size(self):
        vs = self._get_ffprobe_vs()
        width = int(vs['width'])
        height = int(vs['height'])
        return width, height

    def is_video(self):
        return True


class media_raw(media):

    def create_thumbnail(self, dst_path, max_size):
        path = self.get_path()
        cmd = ["dcraw", "-T", "-c", path]
        t = tempfile.TemporaryFile()
        p = subprocess.Popen(cmd, stdout=t)
        rc = p.wait()
        if rc != 0:
            raise subprocess.CalledProcessError(rc, cmd)

        t.seek(0)
        image = Image.open(t)
        xysize = self._create_thumbnail(dst_path, max_size, image)
        t.close()
        return xysize

    def get_size(self):
        path = self.get_path()
        cmd = ["dcraw", "-T", "-c", path]
        t = tempfile.TemporaryFile()
        p = subprocess.Popen(cmd, stdout=t)
        rc = p.wait()
        if rc != 0:
            raise subprocess.CalledProcessError(rc, cmd)

        t.seek(0)
        image = Image.open(t)
        t.close()
        return image.size


def get_media(filename, fp=None):
    if fp is None:
        fp = filename

    (_, extension) = os.path.splitext(filename)
    extension = extension.lower()
    if extension == ".jpg" or extension == ".tif":
        return media_jpeg(fp)
    elif extension == ".avi" or extension == ".mov" \
            or extension == ".ogv" or extension == ".webm" \
            or extension == ".mp4":
        return media_video(fp)
    elif extension == ".png":
        return media(fp)
    elif extension == ".cr2":
        return media_raw(fp)
    else:
        raise UnknownMediaType("unknown media type for %s" % (fp))
