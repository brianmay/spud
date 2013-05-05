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

import tempfile
import subprocess
import os
import pyexiv2
import Image
import datetime

class media:
    def __init__(self,src_full):
        self.src_full = src_full

    def get_path(self):
        return self.src_full

    def get_size(self):
        im = Image.open(self.src_full)
        return im.size

    def get_bytes(self):
        return os.path.getsize(self.src_full)

    def get_exif(self):
        exif = pyexiv2.ImageMetadata(self.src_full)
        exif.read()
        return exif

    def get_datetime(self):
        exif = self.get_exif()
        try:
            value = exif['Exif.Photo.DateTimeOriginal'].value
            if isinstance(value, str):
                value = exif['Exif.Photo.DateTimeDigitized'].value
            if isinstance(value, str):
                value = None
        except KeyError:
            value = None

        if value is None:
            value = datetime.datetime.fromtimestamp(os.path.getmtime(self.src_full))

        return value

    def create_thumbnail(self, dst_path, max_size):
        image = Image.open(self.src_full)
        return self._create_thumbnail(dst_path, max_size, image)

    def _create_thumbnail(self, dst_path, max_size, image):
        (width,height) = image.size

        if width > max_size['size'] or height > max_size['size']:
            thumb_width = max_size['size']
            thumb_height = max_size['size']

            if width > height:
                thumb_height = int(max_size['size']*1.0/width * height)
            else:
                thumb_width = int(max_size['size']*1.0/height * width)

            if max_size['draft']:
                image.thumbnail((thumb_width,thumb_height),Image.ANTIALIAS)
            else:
                image = image.resize((thumb_width,thumb_height),Image.ANTIALIAS)
            thumb_width, thumb_height = image.size
        else:
            thumb_width = width
            thumb_height = height

        image.save(dst_path)

        return (thumb_width,thumb_height)

    def rotate(self,amount):
        raise RuntimeError("rotate not implemented")

class media_jpeg(media):
    def rotate(self,amount):
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
            raise RuntimeError("rotate amount %s unknown"%(amount))

        subprocess.check_call(["exiftran","-i",arg,self.get_path()])

class media_video(media):

    def create_thumbnail(self, dst_path, max_size):
        import pyffmpeg
        mp=pyffmpeg.FFMpegReader()
        mp.open(self.src_full,track_selector=pyffmpeg.TS_VIDEO_PIL)
        video = mp.get_tracks()[0]
        image = video.get_current_frame()[2]
        return self._create_thumbnail(dst_path, max_size, image)

class media_raw(media):

    def create_thumbnail(self, dst_path, max_size):
        cmd = ["dcraw","-T","-c",self.src_full]
        t = tempfile.TemporaryFile()
        p = subprocess.Popen(cmd,stdout=t)
        rc = p.wait()
        if rc != 0:
            raise subprocess.CalledProcessError(rc,cmd)

        t.seek(0)
        image = Image.open(t)
        xysize = self._create_thumbnail(dst_path, max_size, image)
        t.close()
        return xysize

    def get_size(self):
        cmd = ["dcraw","-T","-c",self.src_full]
        t = tempfile.TemporaryFile()
        p = subprocess.Popen(cmd,stdout=t)
        rc = p.wait()
        if rc != 0:
            raise subprocess.CalledProcessError(rc,cmd)

        t.seek(0)
        image = Image.open(t)
        t.close()
        return image.size

def get_media(file):
    (_,extension) = os.path.splitext(file)
    extension = extension.lower()
    if extension == ".jpg" or extension == ".tif":
        return media_jpeg(file)
    elif extension == ".avi":
        return media_video(file)
    elif extension == ".png":
        return media(file)
    elif extension == ".cr2":
        return media_raw(file)
    else:
        raise RuntimeError("unknown media type for %s"%(file))
