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


function album_search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/album/?" + jQuery.param(params)
}


function album_url(album) {
   return "/b/album/"+album.id+"/"
}


function category_search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/category/?" + jQuery.param(params)
}


function category_url(category) {
   return "/b/category/"+category.id+"/"
}


function place_search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/place/?" + jQuery.param(params)
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
        bark_loudly_like_a_dog()
    }

    if (error==null) {
        bark_loudly_like_a_dog()
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
                error(textStatus + " " + textStatus)
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
        url: '/a/login/',
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
        url: '/a/logout/',
        type: "POST",
        success: success,
        error: error,
    })
}

function load_album_search_form(search, success, error) {
    ajax({
        url: '/a/album/form/',
        data: search.params,
        success: success,
        error: error,
    })
}


function load_album_search_results(search, page, success, error) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    ajax({
        url: '/a/album/results/',
        data: params,
        success: success,
        error: error,
    });
}


function load_album(album_id, success, error) {
    ajax({
        url: '/a/album/'+album_id+'/',
        success: success,
        error: error,
    })
}


function load_album_change(album_id, updates, success, error) {
    var url = '/a/album/add/'
    if (album_id != null) {
        url = '/a/album/'+album_id+'/'
    }
    ajax({
        url: url,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_album_delete(album_id, success, error) {
    ajax({
        url: '/a/album/'+album_id+'/delete/',
        success: success,
        error: error,
        type: "POST",
    })
}


function load_category_search_form(search, success, error) {
    ajax({
        url: '/a/category/form/',
        data: search.params,
        success: success,
        error: error,
    })
}


function load_category_search_results(search, page, success, error) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    ajax({
        url: '/a/category/results/',
        data: params,
        success: success,
        error: error,
    });
}


function load_category(category_id, success, error) {
    ajax({
        url: '/a/category/'+category_id+'/',
        success: success,
        error: error,
    })
}


function load_category_change(category_id, updates, success, error) {
    var url = '/a/category/add/'
    if (category_id != null) {
        url = '/a/category/'+category_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
        error: error,
    })
}


function load_category_delete(category_id, success, error) {
    ajax({
        url: '/a/category/'+category_id+'/delete/',
        success: success,
        type: "POST",
        error: error,
    })
}


function load_place_search_form(search, success, error) {
    ajax({
        url: '/a/place/form/',
        data: search.params,
        success: success,
        error: error,
    })
}


function load_place_search_results(search, page, success, error) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    ajax({
        url: '/a/place/results/',
        data: params,
        success: success,
        error: error,
    });
}


function load_place(place_id, success, error) {
    ajax({
        url: '/a/place/'+place_id+'/',
        success: success,
        error: error,
    })
}


function load_place_change(place_id, updates, success, error) {
    var url = '/a/place/add/'
    if (place_id != null) {
        url = '/a/place/'+place_id+'/'
    }
    ajax({
        url: url,
        success: success,
        type: "POST",
        data: updates,
        error: error,
    })
}


function load_place_delete(place_id, success, error) {
    ajax({
        url: '/a/place/'+place_id+'/delete/',
        success: success,
        type: "POST",
        error: error,
    })
}


function load_person_search_form(search, success, error) {
    ajax({
        url: '/a/person/form/',
        data: search.params,
        success: success,
        error: error,
    })
}


function load_person_search_results(search, page, success, error) {
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
        error: error,
    });
}


function load_person(place_id, success, error) {
    ajax({
        url: '/a/person/'+place_id+'/',
        success: success,
        error: error,
    })
}


function load_person_change(person_id, updates, success, error) {
    var url = '/a/person/add/'
    if (person_id != null) {
        url = '/a/person/'+person_id+'/'
    }
    ajax({
        url: url,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_person_delete(person_id, success, error) {
    ajax({
        url: '/a/person/'+person_id+'/delete/',
        success: success,
        error: error,
        type: "POST",
    })
}


function load_photo_relation(place_id, success, error) {
    ajax({
        url: '/a/relation/'+place_id+'/',
        success: success,
        error: error,
    })
}


function load_photo_relation_change(photo_relation_id, updates, success, error) {
    var url = '/a/relation/add/'
    if (photo_relation_id != null) {
        url = '/a/relation/'+photo_relation_id+'/'
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
        url: '/a/relation/'+photo_relation_id+'/delete/',
        success: success,
        error: error,
        type: "POST",
    })
}


function load_photo_search_form(search, success, error) {
    ajax({
        url: '/a/photo/form/',
        data: search.params,
        success: success,
        error: error,
    })
    return
}


function load_photo_search_results(search, page, success, error) {
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
        error: error,
    });
}


function load_photo_search_item(search, n, success, error) {
    var params = jQuery.extend({}, search.params, { number: n })
    ajax({
        url: '/a/photo/results/',
        data: params,
        success: success,
        error: error,
    })
    return
}


function load_photo_search_change(search, updates, number_results, success, error) {
    var params = jQuery.extend({}, search.params, updates, { number_results: number_results })

    ajax({
        url: '/a/photo/change/',
        data: params,
        success: success,
        error: error,
        type: "POST",
    });
}


function load_photo(photo_id, success, error) {
    ajax({
        url: '/a/photo/'+photo_id+'/',
        success: success,
        error: error,
    })
}


function load_settings(success, error) {
    ajax({
        url: '/a/settings',
        success: success,
        error: error,
    })
}
