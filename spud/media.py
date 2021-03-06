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
from __future__ import absolute_import, print_function, unicode_literals

import datetime
import hashlib
import os
import subprocess
import tempfile
from typing import BinaryIO, Optional, Tuple

import six
from PIL import Image

import spud.exif


def _round(x, base):
    return base * round(x/base)


class UnknownMediaType(Exception):
    pass


class media:
    def __init__(self, fp) -> None:
        self._fp = fp
        self._tmp_file = None

    def get_fp(self) -> BinaryIO:
        if not isinstance(self._fp, six.string_types):
            self._fp.seek(0)
        return self._fp

    def get_path(self) -> str:
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

    def __del__(self) -> None:
        if self._tmp_file is not None:
            print("removing temp file %s" % self._tmp_file)
            os.unlink(self._tmp_file)
            self._tmp_file = None

    def get_size(self) -> Tuple[int, int]:
        fp = self.get_fp()
        im = Image.open(fp)
        return im.size

    def get_new_size(self, size: dict) -> Tuple[int, int]:
        width, height = self.get_size()

        max_height = size.get('max_height')
        max_width = size.get('max_width')

        if max_height is not None:
            if height > max_height:
                width = max_height * width/height
                height = max_height

        if max_width is not None:
            if width > max_width:
                height = max_width * height/width
                width = max_width

        width = _round(width, 2)
        height = _round(height, 2)

        return width, height

    def get_exif(self) -> dict:
        path = self.get_path()
        with spud.exif.ExifTool() as e:
            exif = e.get_metadata(path)
        return exif

    def get_datetime(self) -> datetime.datetime:
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

    def get_sha256_hash(self) -> bytes:
        filename = self.get_path()
        sha256_hash = hashlib.sha256()
        with open(filename, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.digest()

    def get_num_bytes(self) -> int:
        return os.path.getsize(self.get_fp())

    def create_thumbnail(self, dst_path: str, max_size: dict) -> Tuple[int, int]:
        fp = self.get_fp()
        image = Image.open(fp)
        return self._create_thumbnail(dst_path, max_size, image)

    def _create_thumbnail(self, dst_path: str, max_size: dict, image: Image) -> Tuple[int, int]:
        width, height = self.get_new_size(max_size)

        if max_size['draft']:
            image.thumbnail((width, height), Image.ANTIALIAS)
        else:
            image = image.resize((width, height), Image.ANTIALIAS)

        image.save(dst_path)

        return image.size

    def rotate(self, amount: int) -> None:
        raise NotImplementedError("rotate not implemented")

    def is_video(self) -> bool:
        return False

    def get_normalized_exif(self) -> dict:
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
    def rotate(self, amount: int) -> None:
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

    def _get_ffprobe_vs(self) -> dict:
        path = self.get_path()
        videometadata = spud.exif.ffprobe(path)

        vs = []
        for stream in videometadata['streams']:
            if stream['codec_type'] == "video":
                vs.append(stream)

        assert len(vs) == 1
        return vs[0]

    def create_thumbnail(self, dst_path: str, max_size: dict) -> Tuple[int, int]:
        path = self.get_path()

        with tempfile.NamedTemporaryFile() as tmp_file:
            cmd = [
                "ffmpeg", "-v", "quiet", "-y", "-ss", "0",
                "-i",  path, "-vframes",  "1", "-f", "image2", tmp_file.name
            ]
            print(cmd)
            subprocess.check_call(cmd)

            image = Image.open(tmp_file.name)
            rc = self._create_thumbnail(dst_path, max_size, image)

        return rc

    def create_video(self, dst_path: str, size: dict, format: str) -> Optional[Tuple[int, int]]:
        width, height = self.get_new_size(size)

        cmd = [
            "ffmpeg", "-y", "-i", self.get_path(),
            "-b:v", "400k", "-max_muxing_queue_size", "1024",
            "-filter:v", f"scale={width}:{height}"
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
            return width, height
        except subprocess.CalledProcessError:
            os.unlink(dst_path)
            return None

    def get_size(self) -> Tuple[int, int]:
        vs = self._get_ffprobe_vs()
        width = int(vs['width'])
        height = int(vs['height'])
        return width, height

    def is_video(self) -> bool:
        return True


class media_raw(media):

    def create_thumbnail(self, dst_path: str, max_size: dict) -> Tuple[int, int]:
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

    def get_size(self) -> None:
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


def get_media(filename: str, fp: BinaryIO = None) -> media:
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
