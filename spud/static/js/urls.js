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


function photo_search_results_url(search, page) {
    var params = jQuery.extend({}, search.criteria, {
        page: page
    })
    return "/b/photo/?" + jQuery.param(params)
}


function photo_search_item_url(search, n, photo) {
    var params = jQuery.extend({}, search.criteria, {
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


function load_photo_search_form(criteria, success, error) {
    ajax({
        url: '/a/photo/form/',
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
        url: '/a/photo/results/',
        data: params,
        success: success,
        error: error,
    });
}


function load_photo_search_item(search, n, success, error) {
    var params = jQuery.extend({}, search.criteria, { number: n })
    ajax({
        url: '/a/photo/results/',
        data: params,
        success: success,
        error: error,
    })
    return
}


function load_photo_search_change(search, updates, number_results, success, error) {
    var params = jQuery.extend({}, search.criteria, updates, { number_results: number_results })

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
