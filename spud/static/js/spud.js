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

// *********
// * LINKS *
// *********

function root_a(title) {
    if (title == null) {
        title = "Home"
    }
    var a = $('<a/>')
        .attr('href', root_url())
        .on('click', function() { do_root(true); return false; })
        .text(title)
    return a
}


function login_a(title) {
    if (title == null) {
        title = "Login"
    }
    var a = $('<a/>')
        .attr('href', login_url())
        .on('click', function() { do_login(true); return false; })
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


function photo_a(photo, title) {
    if (photo == null) {
        return ""
    }
    if (title == null) {
        title = photo.title
    }
    var a = $('<a/>')
        .attr('href', photo_url(photo))
        .on('click', function() { do_photo(photo.id, true); return false; })
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
        .attr('href', photo_url(photo))
        .on('click', function() { fn(photo, { photo: photo.id }, 1); return false; })
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
        .on('click', function() { do_change_photo_relation(photo_relation.id, true); return false; })
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
        .on('click', function() { do_photo_relation_add(photo, true); return false; })
        .text(title)
    return a
}


function photo_relation_delete_a(photo_relation, title) {
    if (title == null) {
        title = "Delete photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_photo_relation_delete(photo_relation.id, true); return false; })
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
        .on('click', function() { do_photo_search_form(criteria, true); return false; })
        .text(title)
    return a
}


function photo_search_results_a(search, page, title) {
    if (title == null) {
        title = "Photos"
    }
    var a = $('<a/>')
        .attr('href', photo_search_results_url(search, page))
        .on('click', function() { do_photo_search_results(search, page, true); return false; })
        .text(title)
    return a
}


function photo_search_item_a(search, n, photo, title, accesskey) {
    if (title == null) {
        title = "Photo "+n
    }
    var id = null
    if (photo != null) {
        id = photo.id
    }

    var a = $('<a/>')
        .attr('href', photo_search_item_url(search, n, photo))
        .on('click', function() { do_photo_search_item(search, n, id, true); return false; })
        .data('photo', photo)
        .text(title)

    if (accesskey != null) {
        a.attr('accesskey', accesskey)
    }
    return a
}


function settings_a(title) {
    if (title == null) {
        title = "Settings"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { do_settings_form(true); return false; })
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


// ***********
// * HELPERS *
// ***********

function update_history(push_history, url, state) {
    if (push_history) {
        window.history.pushState(state, document.title, url);
    } else {
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
        return catgorys
    } else if (type == "place") {
        return places
    } else if (type == "persons") {
        return persons
    } else {
        display_error("We stuffed up")
        return null
    }
}

function close_all_dialog() {
    close = $("#dialog").data("close")
    if (close != null) {
        close()
    }
}

window.onpopstate = function(event) {
    var state=event.state
    close_all_dialog()
    if (state != null) {
//        alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
        if (state.type == 'root') {
            do_root(false)
        } else if (state.type == 'display_photo') {
            do_photo(state.photo_id, false)
        } else if (state.type == 'display_search_results') {
            get_doer(state.object_type).do_search_results(state.search, state.page, false)
        } else if (state.type == 'display') {
            get_doer(state.object_type).do(state.object_id, false)
        } else if (state.type == 'display_album_search_results') {
            do_album_search_results(state.search, state.page, false)
        } else if (state.type == 'display_album') {
            do_album(state.album_id, false)
        } else if (state.type == 'display_category_search_results') {
            do_category_search_results(state.search, state.page, false)
        } else if (state.type == 'display_category') {
            do_category(state.category_id, false)
        } else if (state.type == 'display_place_search_results') {
            do_place_search_results(state.search, state.page, false)
        } else if (state.type == 'display_place') {
            do_place(state.place_id, false)
        } else if (state.type == 'display_person_search_results') {
            do_person_search_results(state.search, state.page, false)
        } else if (state.type == 'display_person') {
            do_person(state.person_id, false)
        } else if (state.type == 'display_photo_search_item') {
            do_photo_search_item(state.search, state.n, state.photo_id, false)
        } else if (state.type == 'display_photo_search_results') {
            do_photo_search_results(state.search, state.page, false)
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
                var image = null
                if (photo != null) {
                    var size = get_settings().list_size
                    var style = get_photo_style(photo)
                    var image = photo.thumb[size]
                }
                if (image != null) {
                    return $("<img />")
                        .attr("class", style)
                        .attr("src", image.url)
                        .attr("alt", photo.title)
                        .attr("width", image.width)
                        .attr("height", image.height)
                }
                return null
            },
        })


function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
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


function display_error(data) {
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

    $('<div class="module"/>')
        .append("<h2>Quick links</h2>")
        .append(ul)
        .appendTo("#content-related")

    $('<div id="selection" class="module"/>')
        .appendTo("#content-related")
    update_selection()
}


function update_selection() {
    selection = get_selection()

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


function append_jump(id, type, onadded) {
    var f = $("<form method='get' />")

    var ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .appendTo(f)
        .ajaxautocomplete({ type: type })
        .on('ajaxautocompleteadded', onadded)

    var module = $('<div class="module"/>')
        .append("<h2>Jump</h2>")
        .append(f)
        .appendTo("#content-related")
}


function update_session(session) {
    ut = $("#user-tools")
        .html("")

    ut.append("Welcome, ")

    if (session.is_authenticated) {
        $("<strong></strong")
            .text(session.first_name + " " + session.last_name)
            .appendTo(ut)

        ut.append(" / ")
        ut.append(logout_a())
    } else {
        ut.append("<strong>guest</strong>")
        ut.append(" / ")
        ut.append(login_a())
    }
    ut.append(" / ")
    ut.append(settings_a())
}


function dt_dd(dl, title, value) {
    dl.append($("<dt/>").html(escapeHTML(title)))
    dd = $("<dd/>").html(escapeHTML(value))
    dl.append(dd)
    return dd
}


// *********************
// * HTML form helpers *
// *********************

function append_field(table, id, title) {
    var th = $("<th/>")

    $("<label/>")
        .attr("for", "id_" + id)
        .html(escapeHTML(title + ":"))
        .appendTo(th)

    var td = $("<td/>")

    $("<tr/>")
        .append(th)
        .append(td)
        .appendTo(table)

    return td
}


function get_input_element(id, value, type) {
//    if (value == null) {
//       value = ""
//    }

    return $('<input />')
        .attr('type', type)
        .attr('name', id)
        .attr('id', "id_" + id)
        .attr('value', value)
}


function get_input_textarea(id, rows, cols, value) {
//    if (value == null) {
//       value = ""
//    }

    return $('<textarea />')
        .attr('name', id)
        .attr('rows', rows)
        .attr('cols', cols)
        .attr('id', "id_" + id)
        .text(value)
}


function get_input_checkbox(id, value) {
    cb = $('<input />')
        .attr('type', 'checkbox')
        .attr('name', id)
        .attr('id', "id_" + id)

    if (value) {
        cb.attr('checked','checked')
    }

    return cb
}


function get_input_select(id, values, selected) {
    select = $('<select />')
        .attr('name', id)
        .attr('id', "id_" + id)

    for (i in values) {
        var v = values[i]
        var option = $('<option />')
            .attr('value', v[0])
            .text(v[1])
            .appendTo(select)

        if (v[0] == selected) {
            option.attr('selected' ,'selected')
        }
    }

    return select
}


function get_ajax_select(id, type, value, onadded, onkilled) {

    var params = {
        "type": type,
    }

    if (value != null) {
        params.initial = {
            pk: value.id,
            repr: value.title,
        }
    }

    var ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocomplete(params)

    if (onadded != null) {
        ac.on("ajaxautocompleteadded", function(ev, pk, repr) {
            onadded(pk, repr)
        })
    }

    if (onkilled != null) {
        ac.on("ajaxautocompletekilled", function(ev, pk, repr) {
            onkilled(pk, repr)
        })
    }

    return ac
}


function get_ajax_multiple_select(id, type, values, sorted, onadded, onkilled) {
    var value_arr = []
    if (values != null) {
        var value_arr = $.map(values,
            function(value){ return { pk: value.id, repr: value.title, } }
        );
    }

    var params = {
        "type": type,
        "initial": value_arr,
    }

    var ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)

    var widget
    if (sorted) {
        ac.ajaxautocompletesorted(params)
    } else {
        ac.ajaxautocompletemultiple(params)
    }

    if (onadded != null) {
        ac.on("added", function(ev, pk, repr) {
            onadded(pk, repr)
        })
    }

    if (onkilled != null) {
        ac.on("killed", function(ev, pk, repr) {
            onkilled(pk, repr)
        })
    }

    return ac
}



// *******************
// * HTML generators *
// *******************

function reset_display() {
    $("#content-related").removeClass("overlapped")
    $("body").css("overflow", "auto");
    $(window).off("resize")
}

function display_root() {
    $("#content-main")
        .html("")

    $(".breadcrumbs")
        .html("")
        .append("Home")
}


function display_photo(photo, search, results, n) {
    reset_display()
    var mode = get_photo_mode()

    if (mode == "slideshow") {
        display_photo_slideshow(photo, search, results, n)
    } else if (mode == "article") {
        display_photo_article(photo, search, results, n)
    }
}


function display_photo_article(photo, search, results, n) {
    var cm = $("#content-main")
    cm.html("")

    var prefix = ""
    if (photo.can_change && is_edit_mode()) {
        prefix = "Edit "
    }
    document.title = prefix + photo.title + " | Album | Spud"
    cm.append("<h1>" + escapeHTML(prefix + photo.title) +  "</h1>")

    $("<div></div>")
        .photo_article({ photo: photo, change_mode: is_edit_mode(), })
        .appendTo(cm)

    if (photo.can_change && is_edit_mode()) {
        photo_change_keyboard(photo, { photo: photo.id }, 1)
    }

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(escapeHTML(photo.title))

    if (search != null) {
        var last_page = results.number_results-1

        var html_page = function(page, text) {
            var photo = null
            if (page == n-1) {
                photo = results.prev_photo
            } else if (page == n) {
                photo = results.photo
            } else if (page == n+1) {
                photo = results.next_photo
            }
            return photo_search_item_a(search, page, photo, text)
        }

        $("<p></p>")
            .paginator({
                page: n,
                last_page: last_page,
                html_page: html_page,
            })
            .appendTo("#content-main")

        if (n > 0) {
            photo_search_item_a(search, n-1, results.prev_photo, "", null)
                .addClass("prevslide")
                .appendTo(cm)
        }

        if (n < results.number_results-1) {
            photo_search_item_a(search, n+1, results.next_photo, "", null)
                .addClass("nextslide")
                .appendTo(cm)
        }
    }

    var ul = $('<ul/>')
        .photo_menu({ photo: photo, search: search, change_mode: is_edit_mode(), })
    append_action_links(ul)
}


function display_photo_slideshow(photo, search, results, n) {
    $("<div></div>")
        .photo_slideshow({ photo: photo, change_mode: is_edit_mode(), })
        .appendTo("#content-main")

    if (search != null) {
        if (n > 0) {
            photo_search_item_a(search, n-1, results.prev_photo, "", "p")
                .addClass("prevslide")
                .appendTo("#content-main")
        }

        if (n < results.number_results-1) {
            photo_search_item_a(search, n+1, results.next_photo, "", "n")
                .addClass("nextslide")
                .appendTo("#content-main")
        }
    }

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(escapeHTML(photo.title))

    var ul = $('<ul/>')
        .photo_menu({ photo: photo, search: search, change_mode: is_edit_mode(), })
    append_action_links(ul)

    pdp = $('<div class="module"/>')
        .append("<h2>Photo Details</h2>")

    $("<div></div>")
        .photo_summary({ photo: photo, change_mode: is_edit_mode(), })
        .appendTo(pdp)

    $("#content-related")
        .append(pdp)
        .addClass("overlapped")

    $("body").css("overflow", "hidden");
}


function display_photo_search_item(search, results, n) {
    display_photo(results.photo, search, results, n)

    var page = Math.floor(n / search.results_per_page)

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(photo_search_results_a(search, page, null))
        .append(" › ")
        .append(escapeHTML(results.photo.title))
}


var operations = [
    {
        value: "title",
        label: "Change title",
        desc: "Change the photo's title",
        fn: display_change_photo_title,
    },
    {
        value: "description",
        label: "Change description",
        desc: "Change the photo's description",
        fn: display_change_photo_description,
    },
    {
        value: "view",
        label: "Change view",
        desc: "Change the photo's view",
        fn: display_change_photo_view,
    },
    {
        value: "comments",
        label: "Change comments",
        desc: "Change the photo's comments",
        fn: display_change_photo_comment,
    },
    {
        value: "datetime",
        label: "Change datetime",
        desc: "Change the photo's date/time",
        fn: display_change_photo_datetime,
    },
    {
        value: "action",
        label: "Change action",
        desc: "Change the photo's action",
        fn: display_change_photo_action,
    },
    {
        value: "photographer",
        label: "Change photographer",
        desc: "Change the photo's photographer",
        fn: display_change_photo_photographer,
    },
    {
        value: "place",
        label: "Change place",
        desc: "Change the photo's place",
        fn: display_change_photo_place,
    },
    {
        value: "album",
        label: "Change albums",
        desc: "Add/remove albums from photo",
        fn: display_change_photo_albums,
    },
    {
        value: "category",
        label: "Change categories",
        desc: "Add/remove categories from photo",
        fn: display_change_photo_categorys,
    },
    {
        value: "person",
        label: "Change persons",
        desc: "Add/remove people from photo",
        fn: display_change_photo_persons,
    },
];


function cancel_keyboard() {
    $(document).off("keydown")
}


function photo_change_keyboard(photo, search_criteria, number_results) {
    $(document).off("keydown")
    $(document).on("keydown", function(ev) { photo_change_keyboard_event(ev, photo, search_criteria, number_results) })
}


function photo_change_keyboard_event(ev, photo, search_criteria, number_results) {
    var key = String.fromCharCode(ev.which)

    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey)
        return true

    if (key <'A' || key > 'Z')
        return true

    if ($("#dialog").length > 0)
        return true

    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Choose operation")

    var ac = $('<input id="project" />')
        .quickautocomplete({
      minLength: 0,
      source: operations,
      select: function( event, ui ) {
        dialog.dialog( "close" )
        ui.item.fn(photo, search_criteria, number_results)
        return false;
      }
    })


    var f = $("<form method='get' />")
        .append(ac)

    dialog
        .append("<p>" + escapeHTML(number_results) + " photos will be changed.</p>")
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
    return false
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


function display_change_photo_attribute(title, table, get_updates, search_criteria, number_results, options) {
    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Change photo " + title)

    var f = $("<form method='get' />")
        .append(table)

    dialog
        .append("<p>" + escapeHTML(number_results) + " photos will be changed.</p>")
        .append(f)
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_photo_attribute(search_criteria, get_updates(f[0]), number_results, $( this ))
                return false
            }
        })
        .dialog(jQuery.extend(options, {
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Save: function() {
                    submit_change_photo_attribute(search_criteria, get_updates(f[0]), number_results, $( this ))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        }))
}


function submit_change_photo_attribute(search_criteria, updates, number_results, dialog) {
    display_loading()
    load_photo_search_change(
        criteria,
        updates,
        number_results,
        function(data) {
            hide_loading()
            dialog.dialog("close")
            reload_page()
        },

        display_error
    )

    return false
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

    return

    var f = $("<form method='get' />")

    photo_ids = "|"
    if (criteria.photo != null) {
        photo_ids = $.map(criteria.photo, function(photo){ return photo.id });
        photo_ids = "|" + photo_ids.join("|") + "|"
    }
    f.append(get_input_element("photo", photo_ids, "hidden"))
    photo_ids = null

    var tabs = $("<div></div>")

    $("<ul></ul>")
        .append("<li><a href='#photo'>Photo</a></li>")
        .append("<li><a href='#connections'>Connections</a></li>")
        .append("<li><a href='#camera'>Camera</a></li>")
        .appendTo(tabs)

    var table = $("<table />")

    append_field(table, "first_date", "First Date")
        .append(get_input_element("first_date", criteria.first_date, "text"))

    append_field(table, "last_date", "Last Date")
        .append(get_input_element("last_date", criteria.last_date, "text"))

    append_field(table, "lower_rating", "Lower Rating")
        .append(get_input_element("lower_rating", criteria.lower_rating, "text"))

    append_field(table, "upper_rating", "Upper Rating")
        .append(get_input_element("upper_rating", criteria.upper_rating, "text"))

    append_field(table, "title", "Title")
        .append(get_input_element("title", criteria.title, "text"))

    append_field(table, "photographer_text", "Photographer")
        .append(get_ajax_select("photographer", 'person', criteria.photographer))

    append_field(table, "path", "Path")
        .append(get_input_element("path", criteria.path, "text"))

    append_field(table, "name", "Name")
        .append(get_input_element("name", criteria.name, "text"))

    append_field(table, "first_id", "First id")
        .append(get_input_element("first_id", criteria.first_id, "text"))

    append_field(table, "last_id", "Last id")
        .append(get_input_element("last_id", criteria.last_id, "text"))

    $("<div id='photo'></div>")
        .append(table)
        .appendTo(tabs)

    var table = $("<table />")

    append_field(table, "person_text", "Person")
        .append(get_ajax_multiple_select("person", 'person', criteria.person, false))

    append_field(table, "person_none", "Person none")
        .append(get_input_checkbox("person_none", criteria.person_none))

    append_field(table, "place_text", "Place")
        .append(get_ajax_select("place", 'place', criteria.place))

    append_field(table, "place_descendants", "Place descendants")
        .append(get_input_checkbox("place_descendants", criteria.place_none))

    append_field(table, "place_none", "Place none")
        .append(get_input_checkbox("place_none", criteria.place_none))

    append_field(table, "album_text", "Album")
        .append(get_ajax_multiple_select("album", 'album', criteria.album, false))

    append_field(table, "album_descendants", "Album descendants")
        .append(get_input_checkbox("album_descendants", criteria.album_descendants))

    append_field(table, "album_none", "Album none")
        .append(get_input_checkbox("album_none", criteria.album_none))

    append_field(table, "category_text", "Category")
        .append(get_ajax_multiple_select("category", 'category', criteria.category, false))

    append_field(table, "category_descendants", "Category descendants")
        .append(get_input_checkbox("category_descendants", criteria.category_none))

    append_field(table, "category_none", "Category none")
        .append(get_input_checkbox("category_none", criteria.category_none))

    $("<div id='connections'></div>")
        .append(table)
        .appendTo(tabs)

    var table = $("<table />")

    append_field(table, "camera_make", "Camera Make")
        .append(get_input_element("camera_make", criteria.camera_make, "text"))

    append_field(table, "camera_model", "Camera Model")
        .append(get_input_element("camera_model", criteria.camera_model, "text"))

    $("<div id='camera'></div>")
        .append(table)
        .appendTo(tabs)

    tabs.tabs()

    f.append(tabs)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_photo_search_form($( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Search: function() {
                    submit_photo_search_form($( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_photo_search_form(dialog, form) {

    var criteria = { }

    if (form.photo.value != "|") {
        var photo = form.photo.value.slice(1,-1).split("|")
        criteria['photo'] = photo.join(".")
    }

    if (form.first_date.value) {
        criteria['first_date'] = form.first_date.value
    }

    if (form.last_date.value) {
        criteria['last_date'] = form.last_date.value
    }

    if (form.lower_rating.value) {
        criteria['lower_rating'] = form.lower_rating.value
    }

    if (form.upper_rating.value) {
        criteria['upper_rating'] = form.upper_rating.value
    }

    if (form.title.value) {
        criteria['title'] = form.title.value
    }

    if (form.photographer.value) {
        criteria['photographer'] = form.photographer.value
    }

    if (form.person.value != "|") {
        var person = form.person.value.slice(1,-1).split("|")
        criteria['person'] = person.join(".")
    }

    if (form.person_none.checked) {
        criteria['person_none'] = "true"
    }

    if (form.place.value) {
        criteria['place'] = form.place.value
    }

    if (form.place_descendants.checked) {
        criteria['place_descendants'] = "true"
    }

    if (form.place_none.checked) {
        criteria['place_none'] = "true"
    }

    if (form.album.value != "|") {
        var album = form.album.value.slice(1,-1).split("|")
        criteria['album'] = album.join(".")
    }

    if (form.album_descendants.checked) {
        criteria['album_descendants'] = "true"
    }

    if (form.album_none.checked) {
        criteria['album_none'] = "true"
    }

    if (form.category.value != "|") {
        var category = form.category.value.slice(1,-1).split("|")
        criteria['category'] = category.join(".")
    }

    if (form.category_descendants.checked) {
        criteria['category_descendants'] = "true"
    }

    if (form.category_none.checked) {
        criteria['category_none'] = "true"
    }

    if (form.path.value) {
        criteria['path'] = form.path.value
    }

    if (form.name.value) {
        criteria['name'] = form.name.value
    }

    if (form.camera_make.value) {
        criteria['camera_make'] = form.camera_make.value
    }

    if (form.camera_model.value) {
        criteria['camera_model'] = form.camera_model.value
    }

    if (form.first_id.value) {
        criteria['first_id'] = form.first_id.value
    }

    if (form.last_id.value) {
        criteria['last_id'] = form.last_id.value
    }

    var search = {
        criteria: criteria,
    }

    do_photo_search_results(search, 0, true)

    dialog.dialog( "close" )

    return false
}


function display_photo_search_results(search, results) {
    reset_display()
    var cm = $("#content-main")
    cm.html("")

    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.ceil(results.number_results / search.results_per_page) - 1

    document.title = "Photo List " + (page+1) + "/" + (last_page+1) + " | Photos | Spud"
    cm.append("<h1>Photo List " + escapeHTML(page+1) + "/" + escapeHTML(last_page+1) + "</h1>")

    $("<div/>")
        .photo_search_details({ criteria: results.criteria })
        .appendTo(cm)

    var html_page = function(page, text) {
        return photo_search_results_a(search, page, text)
    }

    $("<div/>")
        .photo_list({
            search: search,
            results: results,
            change_mode: is_edit_mode(),
            html_page: html_page,
            page: page,
            last_page: last_page,
        })
        .appendTo(cm)

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(photo_search_form_a(search.criteria))
        .appendTo(ul)

    append_action_links(ul)

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › Photos")

    if (results.number_results > 0 && results.photos[0].can_change) {
        if (is_edit_mode()) {
            $("<li>")
                .on("click", function() {
                    set_normal_mode()
                    reload_page()
                    return false;
                })
                .html("<a href='#'>View</a>")
                .appendTo(ul)
            photo_change_keyboard(null, search.criteria, results.number_results)
        } else {
            $("<li>")
                .on("click", function() {
                    set_edit_mode()
                    reload_page()
                    return false;
                })
                .html("<a href='#'>Edit</a>")
                .appendTo(ul)
        }
    }
}


function display_settings(data) {
    var dialog = $("<div id='dialog'></div>")
        .settings_dialog()
}


function display_login(push_history) {
    var dialog = $("<div></div>")
        .login_dialog()
}


// ********************
// * LOAD AND DISPLAY *
// ********************


function do_root(push_history) {
    replace_links()
    update_history(push_history, root_url(), {
        type: 'do_root',
    });
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
                do_root(false)
            } else {
                reload_page()
            }
        },

        display_error
    )
}


function do_photo(photo_id, push_history) {
    display_loading()
    load_photo(photo_id,
        function(data) {
            hide_loading()
            replace_links()
            update_history(push_history, photo_url(data.photo), {
                type: 'display_photo',
                photo_id: data.photo.id,
            });
            display_photo(data.photo)
        },

        display_error
    )
}


function do_change_photo_relation(photo_relation_id, push_history) {
    display_loading()
    load_photo_relation(photo_relation_id,
        function(data) {
            hide_loading()
            display_change_photo_relation(data.photo_relation)
        },

        display_error
    )
}


function do_photo_relation_add(photo, push_history) {
    display_change_photo_relation({
        id: null,
        type: "photo_relation",
        photo_1: photo,
        photo_2: null,
        desc_1: photo.title,
        desc_2: "",
    })
}


function do_photo_relation_delete(photo_relation_id, push_history) {
    display_loading()
    load_photo_relation(photo_relation_id,
        function(data) {
            hide_loading()
            display_photo_relation_delete(data.photo_relation)
        },

        display_error
    )
}


function do_photo_search_form(criteria, push_history) {
    close_all_dialog()

    display_loading()
    load_photo_search_form(criteria,
        function(data) {
            hide_loading()
            display_photo_search_form(data.criteria)
        },

        display_error
    )
}


function do_photo_search_results(search, page, push_history, success) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().photos_per_page

    display_loading()
    load_photo_search_results(search, page,
        function(data) {
            hide_loading()
            replace_links()
            update_history(push_history,
                photo_search_results_url(search, page), {
                    type: 'display_photo_search_results',
                    search: search,
                    page: page,
                }
            );
            display_photo_search_results(search, data)
            if (success) { success() }
        },

        display_error
    )
}


function do_photo_search_item(search, n, photo_id, push_history) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().photos_per_page

    display_loading()
    load_photo_search_item(search, n,
        function(data) {
            hide_loading()
            if (photo_id == null || data.photo.id == photo_id) {
                replace_links()
                update_history(push_history,
                    photo_search_item_url(search, n, data.photo), {
                        type: 'display_photo_search_item',
                        search: search,
                        n: n,
                        photo_id: photo_id,
                    }
                );
                display_photo_search_item(search, data, n)
            } else {
                do_photo(photo_id, push_history)
            }
        },

        display_error
    )
}

function do_settings_form(push_history) {
    close_all_dialog()
    display_settings()
}
