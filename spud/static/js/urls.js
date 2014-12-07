/*
spud - keep track of photos
Copyright (C) 2008-2013 Brian May

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
"use strict";


// ********
// * URLS *
// ********
function root_url() {
    return window.__root_prefix
}

function static_url(file) {
   return window.__static_prefix + file
}


// *********
// * LINKS *
// *********
function root_a() {
    var title = "Home"
    var a = $('<a/>')
        .attr('href', root_url())
        .on('click', function() { do_root(); return false; })
        .text(title)
    return a
}

function photo_a(photo) {
    var title = photo.title
    var a = $('<a/>')
        .attr('href', root_url() + "photo/" + photo.id + "/")
        .on('click', function() { do_photo(photo.id); return false; })
        .data('photo', photo)
        .text(title)
    return a
}

function album_a(album, cache, controller) {
    if (!cache) {
        cache = {}
    }

    var title = album.title
    var a = $('<a/>')
        .attr('href', root_url() + "albums/" + album.album_id + "/")
        .on('click', function() {
            if (!cache.ads || cache.ads.parents().length == 0) {
                var params = {
                    album: album,
                    controller: controller,
                }
                cache.ads = add_screen($.spud.album_detail_screen, params)
            } else {
                cache.ads.album_detail_screen("set", album)
                cache.ads.album_detail_screen("enable")
            }
            return false;
        })
        .data('photo', album.cover_photo)
        .text(title)
    return a
}

// ***************
// * AJAX COMMON *
// ***************
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}


$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", $.jCookie("csrftoken"));
        }
    }
});


function ajax(settings) {
    var settings = jQuery.extend({
        dataType : 'json',
        cache: false,
    }, settings)

    var success = settings.success
    delete settings.success

    var error = settings.error
    delete settings.error

    if (success==null) {
        throw new Error("success is not defined")
    }

    if (error==null) {
        throw new Error("error is not defined")
    }

    $.ajax(settings)
        .done(
            function(data, textStatus, jqXHR) {
                if (data.type == "error") {
                    error(data.message)
                } else {
                    success(data)
                }
            }
        )
        .fail(
            function(jqXHR, textStatus, errorThrown) {
                error(jqXHR.status, errorThrown)
            }
        )
}


// ****************
// * AJAX METHODS *
// ****************
function load_albums(success, error) {
    ajax({
        url: window.__root_prefix + 'api/album/',
        success: success,
        error: error,
    })
}
