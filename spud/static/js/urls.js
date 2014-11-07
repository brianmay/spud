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
function media_url(file) {
   return window.__media_prefix + file
}


function root_url() {
   return window.__root_prefix
}


function login_url() {
   return window.__root_prefix + "login/"
}


function logout_url() {
   return window.__root_prefix + "logout/"
}


function photo_search_results_url(search, page) {
    var params = jQuery.extend({}, search.criteria, {
        page: page
    })
    return window.__root_prefix + "photo/?" + jQuery.param(params)
}


function photo_search_item_url(search, n, photo) {
    var params = jQuery.extend({}, search.criteria, {
        n: n
    })
    if (photo != null) {
        return window.__root_prefix + "photo/" + photo.id + "/?" + jQuery.param(params)
    } else {
        return window.__root_prefix + "photo/?" + jQuery.param(params)
    }
}


function photo_url(photo, search) {
    var params = jQuery.extend({}, search.criteria)
   return window.__root_prefix + "photo/"+photo.id+"/?" + jQuery.param(params)
}


function upload_form_url() {
   return window.__root_prefix + "upload/"
}


// ****************
// * AJAX LOADERS *
// ****************

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
                update_session(data.session)
                if (data.type == "error") {
                    error(data.message)
                } else {
                    success(data)
                }
            }
        )
        .fail(
            function(jqXHR, textStatus, errorThrown) {
                error(errorThrown)
            }
        )
}


$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", $.jCookie("csrftoken"));
        }
    }
});


function load_login(username, password, success, error) {
    ajax({
        url: window.__root_prefix + 'a/login/',
        type: "POST",
        success: success,
        error: error,
        data: {
            username: username,
            password: password,
        },
    })
}


function load_logout(success, error) {
    ajax({
        url: window.__root_prefix + 'a/logout/',
        type: "POST",
        success: success,
        error: error,
    })
}


function load_photo_relation(place_id, success, error) {
    ajax({
        url: window.__root_prefix + 'a/relation/'+place_id+'/',
        success: success,
        error: error,
    })
}


function load_photo_relation_change(photo_relation_id, updates, success, error) {
    var url = window.__root_prefix + 'a/relation/add/'
    if (photo_relation_id != null) {
        url = window.__root_prefix + 'a/relation/'+photo_relation_id+'/'
    }
    ajax({
        url: url,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_photo_relation_delete(photo_relation_id, success, error) {
    ajax({
        url: window.__root_prefix + 'a/relation/'+photo_relation_id+'/delete/',
        success: success,
        error: error,
        type: "POST",
    })
}


function load_photo_search_form(criteria, success, error) {
    ajax({
        url: window.__root_prefix + 'a/photo/form/',
        data: criteria,
        success: success,
        error: error,
    })
    return
}


function load_photo_search_results(search, page, success, error) {
    var first = page * search.results_per_page

    var params = jQuery.extend({}, search.criteria, {
        count: search.results_per_page,
        first: first,
    })

    ajax({
        url: window.__root_prefix + 'a/photo/results/',
        data: params,
        success: success,
        error: error,
    });
}


function load_photo_search_item(search, n, success, error) {
    var params = jQuery.extend({}, search.criteria, { number: n })
    ajax({
        url: window.__root_prefix + 'a/photo/results/',
        data: params,
        success: success,
        error: error,
    })
    return
}


function load_photo_search_change(criteria, updates, number_results, success, error) {
    var params = jQuery.extend({}, criteria, updates, { number_results: number_results })

    ajax({
        url: window.__root_prefix + 'a/photo/change/',
        data: params,
        success: success,
        error: error,
        type: "POST",
    });
}


function load_photo(photo_id, success, error) {
    ajax({
        url: window.__root_prefix + 'a/photo/'+photo_id+'/',
        success: success,
        error: error,
    })
}

function load_upload_form(success, error) {
    ajax({
        url: window.__root_prefix + 'a/upload/form/',
        type: "POST",
        success: success,
        error: error,
    })
}
