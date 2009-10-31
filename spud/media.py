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
        exif = pyexiv2.Image(self.src_full)
        exif.readMetadata()
        return exif

    def get_datetime(self,src_timezone,dst_timezone):
        exif = self.get_exif()
        try:
            value = exif['Exif.Photo.DateTimeOriginal']
        except KeyError:
            value = datetime.datetime.fromtimestamp(os.path.getmtime(self.src_full))

        value = src_timezone.localize(value)
        return value.astimezone(dst_timezone)

    def create_thumbnail(self, dst_path, max_size):
        im = Image.open(self.src_full)
        (width,height) = im.size

        if width > max_size or height > max_size:
            thumb_width = max_size
            thumb_height = max_size

            if width > height:
                thumb_height = int(max_size*1.0/width * height)
            else:
                thumb_width = int(max_size*1.0/height * width)

        im.thumbnail((thumb_width,thumb_height),Image.ANTIALIAS)
        im.save(dst_path)

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
            raise RuntimeError("rotate mount %s unknown"%(rotate))

        subprocess.check_call(["exiftran","-i",arg,self.get_path()])

def get_media(file):
    (root,extension) = os.path.splitext(file)
    extension = extension.lower()
    if extension == ".jpg":
        return media_jpeg(file)
    elif extension == ".cr2" or extension == ".png":
        return media(file)
    else:
        raise RuntimeError("unknown media type for %s"%(file))
