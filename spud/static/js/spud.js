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

// *********
// * LINKS *
// *********

function root_a(title) {
    if (title == null) {
        title = "Home"
    }
    var a = $('<a/>')
        .attr('href', root_url())
        .on('click', function() { do_root(); return false; })
        .text(title)
    return a
}


function login_a(title) {
    if (title == null) {
        title = "Login"
    }
    var a = $('<a/>')
        .attr('href', login_url())
        .on('click', function() { do_login(); return false; })
        .text(title)
    return a
}


function logout_a(title) {
    if (title == null) {
        title = "Logout"
    }
    var a = $('<a/>')
        .attr('href', logout_url())
        .on('click', function() { do_logout(); return false; })
        .text(title)
    return a
}


function photo_a(photo, search, title) {
    search_defaults(search)
    if (photo == null) {
        return ""
    }
    if (title == null) {
        title = photo.title
    }
    var a = $('<a/>')
        .attr('href', photo_url(photo, search))
        .on('click', function() { do_photo(photo.id, search); return false; })
        .data('photo', photo)
        .text(title)
    return a
}


function photo_change_a(photo, fn, title) {
    if (photo == null) {
        return ""
    }
    if (title == null) {
        title = "Change "+photo.title
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { fn(photo, { photos: photo.id }, 1); return false; })
        .text(title)
    return a
}


function photo_relation_change_a(photo_relation, title) {
    if (photo_relation == null) {
        return ""
    }
    if (title == null) {
        title = "Change photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_change_photo_relation(photo_relation.id); return false; })
        .data('photo', photo_relation.cover_photo)
        .text(title)
    return a
}


function photo_relation_add_a(photo, title) {
    if (title == null) {
        title = "Add photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_photo_relation_add(photo); return false; })
        .text(title)
    return a
}


function photo_relation_delete_a(photo_relation, title) {
    if (title == null) {
        title = "Delete photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_photo_relation_delete(photo_relation.id); return false; })
        .data('photo', photo_relation.cover_photo)
        .text(title)
    return a
}


function photo_search_form_a(criteria, title) {
    if (title == null) {
        title = "Photo search"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { do_photo_search_form(criteria); return false; })
        .text(title)
    return a
}


function photo_search_results_a(search, page, title) {
    search_defaults(search)
    if (title == null) {
        title = "Photos"
    }
    var a = $('<a/>')
        .attr('href', photo_search_results_url(search, page))
        .on('click', function() { do_photo_search_results(search, page); return false; })
        .text(title)
    return a
}


function photo_search_item_a(search, n, photo, title) {
    search_defaults(search)
    if (title == null) {
        title = "Photo "+n
    }
    var id = null
    if (photo != null) {
        id = photo.id
    }

    var a = $('<a/>')
        .attr('href', photo_search_item_url(search, n, photo))
        .on('click', function() { do_photo_search_item(search, n, id); return false; })
        .data('photo', photo)
        .text(title)

    return a
}


function settings_a(title) {
    if (title == null) {
        title = "Settings"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { do_settings_form(); return false; })
        .text(title)
    return a
}


function datetime_a(dt) {
    if (dt == null) {
        return null
    }
    var search = {
        criteria: {
            first_date: dt.date + " 00:00 " + dt.timezone,
            last_date: dt.date + " nextday " + dt.timezone,
        }
    }
    return photo_search_results_a(search, 0, dt.date + " " + dt.time + " " + dt.timezone)
}


function upload_form_a(title) {
    if (title == null) {
        title = "Home"
    }
    var a = $('<a/>')
        .attr('href', upload_url())
        .on('click', function() { do_upload(); return false; })
        .text(title)
    return a
}


// ***********
// * HELPERS *
// ***********

function update_history(url, state) {
    if (window.history.state != null && !is_equal_objects(window.history.state, state)) {
        // if state has changed, push new state
        window.history.pushState(state, document.title, url);
    } else if (window.history.state==null) {
        // otherwise just update if state wasn't set before
        window.history.replaceState(state, document.title, url);
    }
}


function parse_form_string(string) {
    return jQuery.trim(string)
}


// ***************
// * EVENTS, ETC *
// ***************

function get_doer(type) {
    if (type == "album") {
        return albums
    } else if (type == "category") {
        return categorys
    } else if (type == "place") {
        return places
    } else if (type == "person") {
        return persons
    } else if (type == "feedback") {
        return feedbacks
    } else {
        return null
    }
}

function close_all_dialog() {
    var close = $("#dialog").data("close")
    if (close != null) {
        close()
    }
}

window.onpopstate = function(event) {
    var state=event.state
    close_all_dialog()
    if (state != null) {
//        alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
        if (state.type == 'display_root') {
            do_root()
        } else if (state.type == 'display_photo') {
            do_photo(state.photo_id, state.search)
        } else if (state.type == 'display_search_results') {
            var doer = get_doer(state.object_type)
            if (doer != null) {
                doer.do_search_results(state.search, state.page)
            } else {
                display_error("doer not found")
            }
        } else if (state.type == 'display') {
            var doer = get_doer(state.object_type)
            if (doer != null) {
                doer.do(state.object_id, false)
            } else {
                display_error("doer not found")
            }
        } else if (state.type == 'display_album_search_results') {
            do_album_search_results(state.search, state.page)
        } else if (state.type == 'display_album') {
            do_album(state.album_id)
        } else if (state.type == 'display_category_search_results') {
            do_category_search_results(state.search, state.page)
        } else if (state.type == 'display_category') {
            do_category(state.category_id)
        } else if (state.type == 'display_place_search_results') {
            do_place_search_results(state.search, state.page)
        } else if (state.type == 'display_place') {
            do_place(state.place_id)
        } else if (state.type == 'display_person_search_results') {
            do_person_search_results(state.search, state.page)
        } else if (state.type == 'display_person') {
            do_person(state.person_id)
        } else if (state.type == 'display_photo_search_item') {
            do_photo_search_item(state.search, state.n, state.photo_id)
        } else if (state.type == 'display_photo_search_results') {
            do_photo_search_results(state.search, state.page)
        } else if (state.type == 'display_upload_form') {
            do_upload_form()
        } else if (state.type == 'display_error') {
            display_error(state.message)
        } else {
            display_error("We don't understand our state")
        }
    }
};


$(document)
        .tooltip({
            items: "a",
            content: function() {
                var photo = $(this).data('photo')
                if (photo != null) {
                    return $("<div></div>")
                        .image({size: get_settings().list_size, photo: photo})
                }
                return null
            },
        })


function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}


function search_defaults(search) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().photos_per_page
    if (search.photo_mode == null)
        search.photo_mode = "article"
}


// ****************
// * HTML helpers *
// ****************

// List of HTML entities for escaping.
var htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

// Regex containing the keys listed immediately above.
var htmlEscaper = /[&<>"'\/]/g;

// Escape a string for HTML interpolation.
function escapeHTML(string) {
    return ('' + string).replace(htmlEscaper, function(match) {
        return htmlEscapes[match];
    });
};


function display_loading() {
    cancel_keyboard()

    var message = $("<div></div>")

    $("<img/>")
        .attr('src', media_url("img/ajax-loader.gif"))
        .appendTo(message)

    message.append("<br/>Loading. Please Wait.<br/>")

    $.blockUI({ message: message })
}


function popup_error(data) {
    var message = $("<div></div>")

    $("<img/>")
        .attr('src', media_url("img/error.png"))
        .appendTo(message)

    $("<p></p>")
        .text(data)
        .appendTo(message)

    $("<input type='button' value='Acknowledge' />")
        .click(function() { $.unblockUI() })
        .appendTo(message)

    $.blockUI({ message: message })
}


function hide_loading()
{
    $.unblockUI()
}


function reload_page()
{
    window.onpopstate({state: window.history.state})
}


function replace_links() {
    $("#content-related").html("")

    var ul = $('<ul class="menu"/>')
        .main_menu()

    $('<div class="module main_menu"/>')
        .append("<h2>Spud</h2>")
        .append(ul)
        .appendTo("#content-related")

    $('<div id="selection" class="module selection_menu"/>')
        .appendTo("#content-related")
    update_selection()
}


function update_selection() {
    var selection = get_selection()

    var ul = $('<ul class="menu"/>')
        .selection_menu({ selection: selection })

    $('#selection')
        .empty()
        .append("<h2>Selection</h2>")
        .append(escapeHTML(selection.length + " photos selected"))
        .append(ul)
}


function append_action_links(ul) {
    $('<div class="module"/>')
        .append("<h2>Actions</h2>")
        .append(ul)
        .appendTo("#content-related")
}


function append_jump(id, type, on_jump) {
    var f = $("<form method='get' />")

    var ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .appendTo(f)
        .ajaxautocomplete({ type: type })
        .on('ajaxautocompleteadded', function(ev, item) {
            ac.ajaxautocomplete("set", null)
            on_jump(ev, item)
        })

    var module = $('<div class="module"/>')
        .append("<h2>Jump</h2>")
        .append(f)
        .appendTo("#content-related")
}


// *******************
// * HTML generators *
// *******************

function display_error(message) {
    window.spud_type = "display_error"

    update_history(root_url(), { type: 'display_error', message: message })

    popup_error(message)
    var img = $("<div></div>")
        .image()
        .image("set_error")
    var cm = $("#content-main")
        .html(img)
}


function reset_display() {
    $("#content").removeClass("slideshow")
    $("#header").removeClass("slideshow")
    $("#footer").removeClass("slideshow")
    $("#breadcrumbs").removeClass("slideshow")
    $("body").css("overflow", "auto");
    $(window).off("resize")
}

function display_root() {
    update_history(root_url(), {
        type: 'display_root',
    });
    replace_links()
    $("#content-main")
        .html("")

    $("#breadcrumbs")
        .html("")
        .append("Home")
}


function setup_photo(photo_mode) {
    var elem = document.body
    if (photo_mode == "slideshow") {
        if (elem.requestFullscreen) {
              elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
              elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
              elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullScreen) {
              document.exitFullScreen();
        } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
              document.webkitCancelFullScreen();
        }
    }

    if (window.spud_type == "display_photo" && window.spud_mode == photo_mode) {
        // nothing to do, exit
        return
    }
    window.spud_type = "display_photo"
    window.spud_mode = photo_mode

    replace_links()
    reset_display()
    var cm = $("#content-main")
    cm.html("")

    document.title = "Loading | Photo | Spud"
    cm.append("<h1 id='title'>Loading</h1>")

    var size = get_settings().view_size
    if (photo_mode == "slideshow")
        size = get_settings().slideshow_size

    var pa = $("<div id='photo_article'></div>")
        .photo_article({ enlarge: photo_mode == "slideshow", photo_size: size})
        .appendTo(cm)

    var paginator = $("<p id='paginator'></p>")
        .paginator()
        .appendTo(pa)

    $("#breadcrumbs")
        .html("")
        .append(root_a())

    var ul = $("<ul id='photo_menu'/>")
        .photo_menu()
    append_action_links(ul)

    if (photo_mode == "slideshow") {
        $("#content").addClass("slideshow")
        $("#header").addClass("slideshow")
        $("#footer").addClass("slideshow")
        $("#breadcrumbs").addClass("slideshow")
        $("body").css("overflow", "hidden");
    } else {
        var pl = $("<div id='feedback_list'/>")
            .feedback_list({
                include_children: true,
            })
            .appendTo(cm)
    }
}


function display_photo(photo, rights, search, results, n) {
    if (n == null) {
        update_history(
            photo_url(photo, search), {
                type: 'display_photo',
                photo_id: photo.id,
                search: search,
            }
        );
    } else {
        update_history(
            photo_search_item_url(search, n, photo), {
                type: 'display_photo_search_item',
                search: search,
                n: n,
                photo_id: photo.id,
            }
        );
    }

    setup_photo(search.photo_mode)

    var prefix = ""
    if (rights.can_change && is_edit_mode()) {
        prefix = "Edit "
    }

    var last_page = -1
    if (results != null) {
        last_page = results.number_results-1
    }

    document.title = prefix + photo.title + " | Photo | Spud"
    $("#title").text(prefix + photo.title)


    $("#photo_article").photo_article("set", photo, rights)
    $("#paginator")
        .paginator("option", "page_a",
            function(page, text) {
                return $("<a></a>")
                    .text(text)
                    .attr("href",  photo_search_item_url(search, page, null))
                    .on("click", function() {
                        do_photo_search_item(search, page, null)
                        return false;
                    })
            }
        )
        .paginator("set", n, last_page)
    $("#photo_menu").photo_menu("set", photo, rights, search, results, n)

    if (search !=null && n != null) {
        var page = Math.floor(n / search.results_per_page)
        $("#breadcrumbs")
            .html("")
            .append(root_a())
            .append(" › ")
            .append(photo_search_results_a(search, page, null))
            .append(" › ")
            .append(escapeHTML(photo.title))
    } else {
        $("#breadcrumbs")
            .html("")
            .append(root_a())
            .append(" › ")
            .append(escapeHTML(photo.title))
    }

    if (rights.can_change && is_edit_mode()) {
        photo_change_keyboard(photo, { photos: photo.id }, 1)
    }

    if (results != null) {
        // preload next/prev photos
        if (results.prev_photo) {
            var size = $("#photo_article").photo_article("option", "photo_size")
            var image = results.prev_photo.thumb[size]
            if (image) {
                var img = new Image()
                img.src = image.url
            }
        }
        if (results.next_photo) {
            var image = results.next_photo.thumb[size]
            if (image) {
                var img = new Image()
                img.src = image.url
            }
        }
    }

    if (search.photo_mode != "slideshow") {
        var fl = $("#feedback_list")
        fl.feedback_list("option", "page_a",
            function(page, text) {
                return $("<a/>")
                    .text(text)
                    .attr("href", "#")
                    .on("click", function() { display_feedback(fl, photo, page); return false; })
            }
        )
        display_feedback(fl, photo, 0);
    }
}


function display_feedback(element, photo, page) {
    var search = {
        results_per_page: get_settings().items_per_page,
        criteria: {
            photo: photo.id,
            root_only: true,
        }
    }
    element.feedback_list("display_loading")
    feedbacks.load_search_results(search, page,
        function(data) {
            var last_page = Math.ceil(data.number_results / search.results_per_page) - 1
            element.feedback_list("clear_status")
            element.feedback_list("set", data.feedbacks, data.rights)
            element.feedback_list("set_paginator", page, last_page)
        },
        function(message) {
            element.feedback_list("display_error")
        }
    )
}


function cancel_keyboard() {
    $(document).off("keydown")
}


function photo_change_keyboard(photo, search_criteria, number_results) {
    $(document).off("keydown")
    $(document).on("keydown", function(ev) { photo_change_keyboard_event(ev, photo, search_criteria, number_results) })
}


function photo_change_keyboard_event(ev, photo, criteria, number_results) {
    var key = String.fromCharCode(ev.which)

    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey)
        return true

    if (key <'A' || key > 'Z')
        return true

    if ($("#dialog").length > 0)
        return true

    display_change_photo(photo, criteria, number_results)
    return false
}


var operations = [
    {
        pk: "title",
        label: "Change title",
        desc: "Change the photo's title",
        fn: display_change_photo_title,
    },
    {
        pk: "description",
        label: "Change description",
        desc: "Change the photo's description",
        fn: display_change_photo_description,
    },
    {
        pk: "view",
        label: "Change view",
        desc: "Change the photo's view",
        fn: display_change_photo_view,
    },
    {
        pk: "comments",
        label: "Change comments",
        desc: "Change the photo's comments",
        fn: display_change_photo_comment,
    },
    {
        pk: "datetime",
        label: "Change datetime",
        desc: "Change the photo's date/time",
        fn: display_change_photo_datetime,
    },
    {
        pk: "datetime_offset",
        label: "Change datetime offset",
        desc: "Change the photo's date/time by offset",
        fn: display_change_photo_datetime_offset,
    },
    {
        pk: "timezone",
        label: "Change timezone",
        desc: "Change the photo's timezone",
        fn: display_change_photo_timezone,
    },
    {
        pk: "action",
        label: "Change action",
        desc: "Change the photo's action",
        fn: display_change_photo_action,
    },
    {
        pk: "photographer",
        label: "Change photographer",
        desc: "Change the photo's photographer",
        fn: display_change_photo_photographer,
    },
    {
        pk: "place",
        label: "Change place",
        desc: "Change the photo's place",
        fn: display_change_photo_place,
    },
    {
        pk: "album",
        label: "Change albums",
        desc: "Add/remove albums from photo",
        fn: display_change_photo_albums,
    },
    {
        pk: "category",
        label: "Change categories",
        desc: "Add/remove categories from photo",
        fn: display_change_photo_categorys,
    },
    {
        pk: "person",
        label: "Change persons",
        desc: "Add/remove people from photo",
        fn: display_change_photo_persons,
    },
];


function display_change_photo(photo, criteria, number_results) {
    close_all_dialog()

    $("<div id='dialog'></div>")
        .change_photos_dialog({
            photo: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_title(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_title_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_description(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_description_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_view(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_view_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_comment(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_comment_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_datetime(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_datetime_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_datetime_offset(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_datetime_offset_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_timezone(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_timezone_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_action(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_action_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_photographer(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_photographer_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_place(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_place_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_albums(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_albums_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_categorys(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_categorys_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_persons(photo, criteria, number_results) {
    $("<div id='dialog'></div>")
        .change_photo_persons_dialog({
            initial: photo,
            criteria: criteria,
            number_results: number_results
        })
}


function display_change_photo_relation(photo_relation) {
    $("<div id='dialog'></div>")
        .change_photo_relation_dialog({
            initial: photo_relation,
        })
}


function display_photo_relation_delete(photo_relation) {
    $("<div id='dialog'></div>")
        .delete_photo_relation_dialog({
            initial: photo_relation,
        })
}


function display_photo_search_form(criteria) {
    var dialog = $("<div id='dialog'></div>")
        .photo_search_dialog({ criteria: criteria })
}


function setup_photo_search_results() {
    if (window.spud_type == "display_photo_search_results") {
        // nothing to do, exit
        return
    }
    window.spud_type = "display_photo_search_results"

    replace_links()
    reset_display()
    var cm = $("#content-main")
    cm.html("")

    cm.append("<h1 id='title'></h1>")

    $("<div id='photo_search_details'/>")
        .photo_search_details()
        .appendTo(cm)

    $("<div id='photo_list'/>")
        .photo_list()
        .appendTo(cm)

    var ul = $("<ul id='photo_list_menu'/>")
        .photo_list_menu()
    append_action_links(ul)

    $("#breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › Photos")
}

function display_photo_search_results(rights, search, results) {
    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.ceil(results.number_results / search.results_per_page) - 1

    update_history(
        photo_search_results_url(search, page), {
            type: 'display_photo_search_results',
            search: search,
            page: page,
        }
    );

    setup_photo_search_results()

    document.title = "Photo List " + (page+1) + "/" + (last_page+1) + " | Photos | Spud"
    $("#title").text("Photo List " + escapeHTML(page+1) + "/" + escapeHTML(last_page+1))

    $("#photo_search_details").photo_search_details("set", results.criteria)

    var page_a = function(page, text) {
        return photo_search_results_a(search, page, text)
    }

    if (rights.can_change && is_edit_mode()) {
        photo_change_keyboard(null, search.criteria, results.number_results)
    }

    $("#photo_list")
        .photo_list("option", "page_a", page_a)
        .photo_list("set_paginator", page, last_page)
        .photo_list("set", rights, search, results)

    $("#photo_list_menu").photo_list_menu("set", rights, search, results)
}


function display_settings(data) {
    var dialog = $("<div id='dialog'></div>")
        .settings_dialog()
}


function display_login() {
    var dialog = $("<div id='dialog'></div>")
        .login_dialog()
}


// ********************
// * LOAD AND DISPLAY *
// ********************


function do_root() {
    display_root()
}


function do_login() {
    display_login()
}


function do_logout() {
    display_loading()
    load_logout(
        function(data) {
            hide_loading()
            if (window.history.state==null) {
                do_root()
            } else {
                reload_page()
            }
        },

        function(message) {
            display_error(message)
        }
    )
}


function do_photo(photo_id, search) {
    search_defaults(search)

    display_loading()
    load_photo(photo_id,
        function(data) {
            hide_loading()
            display_photo(data.photo, data.rights, search, null, null)
        },

        function(message) {
            display_error(message)
        }
    )
}


function do_change_photo_relation(photo_relation_id) {
    display_loading()
    load_photo_relation(photo_relation_id,
        function(data) {
            hide_loading()
            display_change_photo_relation(data.photo_relation)
        },

        function(message) {
            display_error(message)
        }
    )
}


function do_photo_relation_add(photo) {
    display_change_photo_relation({
        id: null,
        type: "photo_relation",
        photo_1: photo,
        photo_2: null,
        desc_1: photo.title,
        desc_2: "",
    })
}


function do_photo_relation_delete(photo_relation_id) {
    display_loading()
    load_photo_relation(photo_relation_id,
        function(data) {
            hide_loading()
            display_photo_relation_delete(data.photo_relation)
        },

        function(message) {
            display_error(message)
        }
    )
}


function do_photo_search_form(criteria) {
    close_all_dialog()

    display_loading()
    load_photo_search_form(criteria,
        function(data) {
            hide_loading()
            display_photo_search_form(data.criteria)
        },

        function(message) {
            display_error(message)
        }
    )
}


function do_photo_search_results(search, page, success) {
    search_defaults(search)

    display_loading()
    load_photo_search_results(search, page,
        function(data) {
            hide_loading()
            display_photo_search_results(data.rights, search, data)
            if (success) { success() }
        },

        function(message) {
            display_error(message)
        }
    )
}


function do_photo_search_item(search, n, photo_id) {
    if (n==null) {
        return do_photo(photo_id, search)
    }

    search_defaults(search)

    display_loading()
    load_photo_search_item(search, n,
        function(data) {
            hide_loading()
            if (photo_id == null || data.photo.id == photo_id) {
                display_photo(data.photo, data.rights, search, data, n)
            } else {
                do_photo(photo_id, search)
            }
        },

        function(message) {
            if (photo_id != null) {
                do_photo(photo_id, search)
            } else {
                display_error(message)
            }
        }
    )
}

function do_settings_form() {
    close_all_dialog()
    display_settings()
}


function do_upload_form() {
    display_loading()
    load_upload_form(
        function(data) {
            hide_loading()
            display_upload_form(data)
        },

        function(message) {
            display_error(message)
        }
    )
}

