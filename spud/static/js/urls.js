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


function photo_search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/photo/?" + jQuery.param(params)
}


function photo_search_item_url(search, n, photo) {
    var params = jQuery.extend({}, search.params, {
        n: n
    })
    if (photo != null) {
        return "/b/photo/" + photo.id + "/?" + jQuery.param(params)
    } else {
        return "/b/photo/?" + jQuery.param(params)
    }
}


function photo_url(photo) {
   return "/b/photo/"+photo.id+"/"
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


function load_album_change(album_id, updates, success) {
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


function load_album_delete(album_id, success) {
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


function load_category_change(category_id, updates, success) {
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


function load_category_delete(category_id, success) {
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


function load_place_change(place_id, updates, success) {
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


function load_place_delete(place_id, success) {
    ajax({
        url: '/a/place/'+place_id+'/delete/',
        success: success,
        type: "POST",
    })
}


function load_person_search_form(search, success) {
    ajax({
        url: '/a/person/form/',
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


function load_person_change(person_id, updates, success) {
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


function load_person_delete(person_id, success) {
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


function load_photo_relation_change(photo_relation_id, updates, success) {
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


function load_photo_relation_delete(photo_relation_id, success) {
    ajax({
        url: '/a/relation/'+photo_relation_id+'/delete/',
        success: success,
        type: "POST",
    })
}


function load_photo_search_form(search, success) {
    ajax({
        url: '/a/photo/form/',
        data: search.params,
        success: success,
    })
    return
}


function load_photo_search_results(search, page, success) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    ajax({
        url: '/a/photo/results/',
        data: params,
        success: success,
    });
}


function load_photo_search_item(search, n, success) {
    var params = jQuery.extend({}, search.params, { number: n })
    ajax({
        url: '/a/photo/results/',
        data: params,
        success: success,
    })
    return
}


function load_photo_search_change(search, updates, number_results, success) {
    var params = jQuery.extend({}, search.params, updates, { number_results: number_results })

    ajax({
        url: '/a/photo/change/',
        data: params,
        success: success,
        type: "POST",
    });
}


function load_photo(photo_id, success) {
    ajax({
        url: '/a/photo/'+photo_id+'/',
        success: success,
    })
}


function load_settings(success) {
    ajax({
        url: '/a/settings',
        success: success,
    })
}
