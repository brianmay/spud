// ********
// * URLS *
// ********
function media_url(file) {
   return media_prefix + file
}


function root_url() {
   return "/b/"
}


function login_url() {
   return "/b/login/"
}


function logout_url() {
   return "/b/logout/"
}


function album_url(album) {
   return "/b/album/"+album.id+"/"
}


function category_url(category) {
   return "/b/category/"+category.id+"/"
}


function place_url(place) {
   return "/b/place/"+place.id+"/"
}


function person_search_url(search) {
    params = {}
    if (search.params != null) {
        params = search.params
    }
    return "/b/person/?" + jQuery.param(params)
}


function person_search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/person/?" + jQuery.param(params)
}


function person_url(person) {
   return "/b/person/"+person.id+"/"
}


function date_url(dt) {
   return "/b/date/"+dt.date+dt.timezone+"/"
}


function search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/search/?" + jQuery.param(params)
}


function photo_url(photo) {
   return "/b/photo/"+photo.id+"/"
}


function search_photo_url(search, n, photo) {
    var params = jQuery.extend({}, search.params, {
        n: n
    })
    if (photo != null) {
        return "/b/photo/" + photo.id + "/?" + jQuery.param(params)
    } else {
        return "/b/search/?" + jQuery.param(params)
    }
}


function settings_url(dt) {
   return "#"
}


// ****************
// * AJAX LOADERS *
// ****************

function ajax(settings, success) {
    display_loading()

    settings = jQuery.extend({
        dataType : 'json',
        cache: false,
    }, settings)

    success = settings.success
    delete settings.success

    $.ajax(settings)
        .done(
            function(data, textStatus, jqXHR) {
                update_session(data.session)
                hide_loading()
                if (data.type == "error") {
                    display_error(data)
                } else {
                    success(data)
                }
            }
        )
        .fail(
            function(jqXHR, textStatus, errorThrown) {
                hide_loading()
                display_error(textStatus + " " + textStatus)
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


function load_login(username, password, success) {
    ajax({
        url: '/a/login/',
        type: "POST",
        success: success,
        data: {
            username: username,
            password: password,
        },
    })
}

function load_logout(success) {
    ajax({
        url: '/a/logout/',
        type: "POST",
        success: success,
    })
}

function load_album(album_id, success) {
    ajax({
        url: '/a/album/'+album_id+'/',
        success: success,
    })
}


function load_change_album(album_id, updates, success) {
    var url = '/a/album/add/'
    if (album_id != null) {
        url = '/a/album/'+album_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
    })
}


function load_delete_album(album_id, success) {
    ajax({
        url: '/a/album/'+album_id+'/delete/',
        dataType : 'json',
        cache: false,
        success: success,
        type: "POST",
    })
}


function load_category(category_id, success) {
    ajax({
        url: '/a/category/'+category_id+'/',
        success: success,
    })
}


function load_change_category(category_id, updates, success) {
    var url = '/a/category/add/'
    if (category_id != null) {
        url = '/a/category/'+category_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
    })
}


function load_delete_category(category_id, success) {
    ajax({
        url: '/a/category/'+category_id+'/delete/',
        success: success,
        type: "POST",
    })
}


function load_place(place_id, success) {
    ajax({
        url: '/a/place/'+place_id+'/',
        success: success,
    })
}


function load_change_place(place_id, updates, success) {
    var url = '/a/place/add/'
    if (place_id != null) {
        url = '/a/place/'+place_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
    })
}


function load_delete_place(place_id, success) {
    ajax({
        url: '/a/place/'+place_id+'/delete/',
        success: success,
        type: "POST",
    })
}


function load_person_search(search, success) {
    ajax({
        url: '/a/person/',
        data: search.params,
        success: success,
    })
}


function load_person_search_results(search, page, success) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    ajax({
        url: '/a/person/results/',
        data: params,
        success: success,
    });
}


function load_person(place_id, success) {
    ajax({
        url: '/a/person/'+place_id+'/',
        success: success,
    })
}


function load_change_person(person_id, updates, success) {
    var url = '/a/person/add/'
    if (person_id != null) {
        url = '/a/person/'+person_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
    })
}


function load_delete_person(person_id, success) {
    ajax({
        url: '/a/person/'+person_id+'/delete/',
        success: success,
        type: "POST",
    })
}


function load_photo_relation(place_id, success) {
    ajax({
        url: '/a/relation/'+place_id+'/',
        success: success,
    })
}


function load_change_photo_relation(photo_relation_id, updates, success) {
    var url = '/a/relation/add/'
    if (photo_relation_id != null) {
        url = '/a/relation/'+photo_relation_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
    })
}


function load_delete_photo_relation(photo_relation_id, success) {
    ajax({
        url: '/a/relation/'+photo_relation_id+'/delete/',
        success: success,
        type: "POST",
    })
}


function load_search(search, success) {
    ajax({
        url: '/a/search/',
        data: search.params,
        success: success,
    })
    return
}


function load_search_results(search, page, success) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    ajax({
        url: '/a/search/results/',
        data: params,
        success: success,
    });
}


function load_photo(photo_id, success) {
    ajax({
        url: '/a/photo/'+photo_id+'/',
        success: success,
    })
}


function change_search(search, updates, number_results, success) {
    var params = jQuery.extend({}, search.params, updates, { number_results: number_results })

    ajax({
        url: '/a/search/change/',
        data: params,
        success: success,
        type: "POST",
    });
}


function load_search_photo(search, n, success) {
    ajax({
        url: '/a/search/'+n+'/',
        data: search.params,
        success: success,
    })
    return
}


function load_settings(success) {
    ajax({
        url: '/a/settings',
        success: success,
    })
}
