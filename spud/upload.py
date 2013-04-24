# imports

# for HTTP response
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
# for os manipulations
import os

import datetime
import shutil
import pytz
import json

from django.conf import settings
from django.db import transaction

from spud import models, media
import spud.ajax


def timezone(name):
    if name[0:4] == 'UTC+' or name[0:4] == 'UTC-':
        offset = int(name[3:])*60
        return pytz.FixedOffset(offset)
    else:
        return pytz.timezone(name)


def set_album_list(photo, album_list):
    for album in album_list:
        models.photo_album.objects.create(photo=photo, album=album)


def set_category_list(photo, category_list):
    for category in category_list:
        models.photo_category.objects.create(photo=photo, category=category)


@transaction.commit_on_success
def import_photo(file, d, options):
    print

    # check source file
    if not os.path.exists(file):
        raise RuntimeError("source photo doesn't exist at %s" % (file))
    m = media.get_media(file)

    # set everything without commiting anything
    photo = models.photo()
    photo.title = ''
    if 'photographer' in d:
        photo.photographer = d['photographer']
    if 'location' in d:
        photo.location = d['location']
    photo.view = ''
    photo.rating = None
    photo.description = ''
    photo.comment = ""
    photo.level = 1
    if 'action' in options:
        photo.action = options['action']
    photo.timestamp = datetime.datetime.now()

    photo.update_from_source(media=m)

    # get album
    albums = d['albums']
    if 'parse_name'in d and d['parse_name']:
        assert len(albums) == 1
        album = albums[0]

        # remove initial .. components
        split = file.split("/")
        while split[0] == "..":
            split.pop(0)

        # remove filename componenent
        split.pop()

        for i in split:
            album, c = album.children.get_or_create(album=i)
        albums = [album]

    # get time
    dt = m.get_datetime()
    print dt

    # adjust time for source timezone
    if photo.camera_model in settings.DEFAULT_TIMEZONE:
        src_timezone = settings.DEFAULT_TIMEZONE[photo.camera_model]
        src_timezone = timezone(src_timezone)
    else:
        if 'src_timezone' in d:
            src_timezone = d['src_timezone']
        else:
            src_timezone = pytz.timezone(settings.TIME_ZONE)

    dt = src_timezone.localize(dt)
    print dt

    # adjust time for destination timezone
    if 'dst_timezone' in d:
        dst_timezone = d['dst_timezone']
    else:
        dst_timezone = pytz.timezone(settings.TIME_ZONE)

    dt = dt.astimezone(dst_timezone)
    print dt

    # add manual offsets
    if 'offset' in d:
        dt += d['offset']
    if photo.camera_model in settings.DEFAULT_DTOFFSET:
        dt += settings.DEFAULT_DTOFFSET[photo.camera_model]
    print dt

    # save the time
    photo.utc_offset = dt.utcoffset().total_seconds() / 60
    photo.datetime = dt.astimezone(pytz.utc).replace(tzinfo=None)

    # determine the destination path
    path = "%04d/%02d/%02d" % (dt.year, dt.month, dt.day)
    name = os.path.basename(file)
    if 'filename' in options:
        name = options['filename']
    path, name = models.photo.get_new_name(file, path, name)
    photo.path = path
    photo.name = name
    dst = photo.get_orig_path()

    # don't do anything in dryrun mode
    if options['dryrun']:
        print "would import %s to %s/%s (%s)" % (file, path, name, dt)
        return photo

    # Go ahead and do stuff
    print "importing %s to %s/%s" % (file, path, name)

    umask = os.umask(0022)
    if not os.path.lexists(os.path.dirname(dst)):
        os.makedirs(os.path.dirname(dst), 0755)
    shutil.copyfile(file, dst)

    photo.save()
    set_album_list(photo, albums)
    set_category_list(photo, d['categorys'])

    os.umask(umask)

    print "imported  %s to %s/%s as %d" % (file, path, name, photo.pk)

    return photo


def ajax(request):
    """
    
    ## View for file uploads ##

    It does the following actions:
        - displays a template if no action have been specified
        - upload a file into unique temporary directory
                unique directory for an upload session
                    meaning when user opens up an upload page, all upload actions
                    while being on that page will be uploaded to unique directory.
                    as soon as user will reload, files will be uploaded to a different
                    unique directory
        - delete an uploaded file

    ## How Single View Multi-functions ##

    If the user just goes to a the upload url (e.g. '/upload/'), the request.method will be "GET"
        Or you can think of it as request.method will NOT be "POST"
    Therefore the view will always return the upload template

    If on the other side the method is POST, that means some sort of upload action
    has to be done. That could be either uploading a file or deleting a file

    For deleting files, there is the same url (e.g. '/upload/'), except it has an
    extra query parameter. Meaning the url will have '?' in it.
    In this implementation the query will simply be '?f=filename_of_the_file_to_be_removed'

    If the request has no query parameters, file is being uploaded.

    """

    # used to generate random unique id
    import uuid

    # settings for the file upload
    #   you can define other parameters here
    #   and check validity late in the code
    options = {
        # the maximum file size (must be in bytes)
        "maxfilesize": 10 * 2 ** 20, # 10 Mb
        # the minimum file size (must be in bytes)
        "minfilesize": 1 * 2 ** 10, # 1 Kb
        # the file types which are going to be allowed for upload
        #   must be a mimetype
        "acceptedformats": (
            "image/jpeg",
            "image/png",
            )
    }


    # POST request
    #   meaning user has triggered an upload action
    if request.method == 'POST':
        # figure out the path where files will be uploaded to
        # PROJECT_ROOT is from the settings file
        temp_path = "/tmp/spud"

        if not request.user.has_perm('spud.add_photo'):
            return HttpResponseForbidden('You do not have rights to upload files')

        # if 'f' query parameter is not specified
        # file is being uploaded
        if not ("f" in request.GET.keys()): # upload file

            # make sure some files have been uploaded
            if not request.FILES:
                return HttpResponseBadRequest('Must upload a file')

            # make sure unique id is specified - VERY IMPORTANT
            # this is necessary because of the following:
            #       we want users to upload to a unique directory
            #       however the uploader will make independent requests to the server
            #       to upload each file, so there has to be a method for all these files
            #       to be recognized as a single batch of files
            #       a unique id for each session will do the job
            if "uid" not in request.POST:
                return HttpResponseBadRequest("UID not specified.")
                # if here, uid has been specified, so record it
            uid = request.POST[u"uid"]

            # update the temporary path by creating a sub-folder within
            # the upload folder with the uid name
            temp_path = os.path.join(temp_path, uid)

            # get the uploaded file
            file = request.FILES[u'files[]']

            # initialize the error
            # If error occurs, this will have the string error message so
            # uploader can display the appropriate message
            error = False

            # check against options for errors

            # file size
            if file.size > options["maxfilesize"]:
                error = "maxFileSize"
            if file.size < options["minfilesize"]:
                error = "minFileSize"
                # allowed file type
            if file.content_type not in options["acceptedformats"]:
                error = "acceptFileTypes"


            # the response data which will be returned to the uploader as json
            response_data = {
                "name": file.name,
                "size": file.size,
                "type": file.content_type
            }

            # if there was an error, add error message to response_data and return
            if error:
                # append error message
                response_data["error"] = error
                # generate json
                response_data = json.dumps({'files': [response_data]})
                # return response to uploader with error
                # so it can display error message
                return HttpResponse(response_data, mimetype='application/json')


            # make temporary dir if not exists already
            if not os.path.exists(temp_path):
                os.makedirs(temp_path)

            # get the absolute path of where the uploaded file will be saved
            # all add some random data to the filename in order to avoid conflicts
            # when user tries to upload two files with same filename
            filename = os.path.join(temp_path, str(uuid.uuid4()) + file.name)
            # open the file handler with write binary mode
            destination = open(filename, "wb+")
            # save file data into the disk
            # use the chunk method in case the file is too big
            # in order not to clutter the system memory
            for chunk in file.chunks():
                destination.write(chunk)
                # close the file
            destination.close()

            try:
                album, _ = models.album.objects.get_or_create(album="Uploads")
    #            album, _ = album.children.get_or_create(album=uid)
                photo = import_photo(
                    filename,
                    {'albums': [album]},
                    {'filename': file.name, 'dryrun': True}
                )
                photo.generate_thumbnails(overwrite=False)
                response_data['photo'] = spud.ajax._json_photo(request.user, photo)
            finally:
                os.unlink(filename)

            # here you can add the file to a database,
            #                           move it around,
            #                           do anything,
            #                           or do nothing and enjoy the demo
            # just make sure if you do move the file around,
            # then make sure to update the delete_url which will be send to the server
            # or not include that information at all in the response...

            # generate the json data
            response_data = json.dumps({'files': [response_data]})
            # response type
            response_type = "application/json"

            # QUIRK HERE
            # in jQuey uploader, when it falls back to uploading using iFrames
            # the response content type has to be text/html
            # if json will be send, error will occur
            # if iframe is sending the request, it's headers are a little different compared
            # to the jQuery ajax request
            # they have different set of HTTP_ACCEPT values
            # so if the text/html is present, file was uploaded using jFrame because
            # that value is not in the set when uploaded by XHR
            if "text/html" in request.META["HTTP_ACCEPT"]:
                response_type = "text/html"

            # return the data to the uploading plugin
            return HttpResponse(response_data, mimetype=response_type)

        else: # file has to be deleted
            return HttpResponseBadRequest('Delete not supported')

    else: #GET
        return HttpResponseBadRequest('Must be a POST request')
