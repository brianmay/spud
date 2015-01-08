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

void static_url

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

void root_a

function object_a(type, value) {
    var screen

    if (type === "albums") {
        screen = $.spud.album_detail_screen
    } else if (type === "categorys") {
        screen = $.spud.category_detail_screen
    } else if (type === "places") {
        screen = $.spud.place_detail_screen
    } else if (type === "persons") {
        screen = $.spud.person_detail_screen
    } else if (type === "photos") {
        screen = $.spud.photo_detail_screen
    } else if (type === "feedbacks") {
        screen = $.spud.feedback_detail_screen
    } else {
        return null
    }

    var a = $('<a/>')
        .attr('href', root_url() + type + "/" + value.id + "/")
        .on('click', function() {
            var params = {}
            // force a reload
            params.obj = null
            params.obj_id = value.id
            add_screen(screen, params)
            return false;
        })
        .data('photo', value.cover_photo)
        .text(value.title)

    return a
}

function photo_a(photo) {
    return object_a("photos", photo)
}

void photo_a


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
    settings = $.extend({
        dataType: 'json',
        cache: false,
    }, settings)

    if (settings.type != null && settings.type !== "GET") {
        settings.data = JSON.stringify(settings.data)
        settings.contentType = 'application/json; charset=UTF-8'
    }

    var success = settings.success
    delete settings.success

    var error = settings.error
    delete settings.error

    if (success == null) {
        throw new Error("success is not defined")
    }

    if (error == null) {
        throw new Error("error is not defined")
    }

    var xhr = $.ajax(settings)
        .done(
            function(data, textStatus, jqXHR) {
                void jqXHR
                success(data)
            }
        )
        .fail(
            function(jqXHR, textStatus, errorThrown) {
                if (textStatus === "abort") {
                    return
                }
                if (jqXHR.responseJSON != null) {
                    var message = jqXHR.responseJSON.detail
                    if (message == null) {
                        message = errorThrown
                    }
                    error(message, jqXHR.responseJSON)
                } else {
                    error(jqXHR.status + " " + errorThrown, null)
                }
            }
        )

    return xhr
}

void ajax
