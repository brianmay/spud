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

// function generic() {
//     this.has_ancestors = true
//     this.has_children = true
//     this.has_photos = true
// }
//
// generic.prototype.setup_user_tools = function(session) {
//     var ut = $("#user-tools")
//
//     ut.empty()
//     ut.append("Welcome, ")
//
//     if (session.user) {
//         var user = session.user
//          $("<strong></strong")
//              .text(user.first_name + " " + user.last_name)
//              .appendTo(ut)
//     } else {
//          $("<strong></strong")
//              .text("guest")
//              .appendTo(ut)
//     }
// }
//
// generic.prototype.setup_menu = function(session) {
//     var menu = $("<ul/>")
//
//     menu.empty()
//
//     $('<li/>')
//         .on('click', function() { alert("meow") })
//         .text("Albums")
//         .appendTo(menu)
//
//     $('<li/>')
//         .on('click', function() { alert("meow") })
//         .text("Categorys")
//         .appendTo(menu)
//
//     $('<li/>')
//         .on('click', function() { alert("meow") })
//         .text("People")
//         .appendTo(menu)
//
//     menu.menu()
//     $("#menu").append(menu)
// }
//
// generic.prototype.setup_page = function(session) {
//     this.setup_user_tools(session)
//     this.setup_menu(session)
// }
//
// generic.prototype.add_screen = function(screen_class, pararms) {
//     var cm = $("#content-main")
//     var div = $("<div/>").appendTo(cm)
//     screen_class(params, div)
//     return div
// }
//
// generic.prototype.do_list = function(session, search) {
//     this.setup_page(session)
//
//     var params = {
//         'search': search,
//     }
//     this.add_screen($.spud.album_list_screen, params)
// }
//
// -------------------------------

function setup_user_tools(session) {
    var ut = $("#user-tools")

    ut.empty()
    ut.append("Welcome, ")

    if (session.user) {
        var user = session.user
         $("<strong></strong")
             .text(user.first_name + " " + user.last_name)
             .appendTo(ut)
    } else {
         $("<strong></strong")
             .text("guest")
             .appendTo(ut)
    }
}

function setup_menu(session) {
    var menu = $("<ul/>")
        .addClass("menubar")
        .empty()

    $('<li/>')
        .text("Albums")
        .on('click', function(ev) {
            add_screen($.spud.album_list_screen, {})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Categorys")
        .on('click', function(ev) {
            alert("meow")
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("People")
        .on('click', function(ev){
            alert("meow")
            return false
        })
        .appendTo(menu)

    menu.menu()
    $("#menu").append(menu)
}

function setup_page(session) {
    window.__perms = session.perms
    setup_user_tools(session)
    setup_menu(session)
}

function add_screen(screen_class, params) {
    var cm = $("#content")
    var div = $("<div/>").appendTo(cm)
    screen_class(params, div)
    return div
}

function do_root(session, params) {
    setup_page(session)
}

function do_list(obj_type, session, params) {
    var screen_class
    setup_page(session)
    if (obj_type == "albums") {
        screen_class = $.spud.album_list_screen
    }
    if (screen_class) {
        params = {
            criteria: params,
        }
        add_screen(screen_class, params)
    }
}

function do_detail(obj_type, obj_id, session, params) {
    setup_page(session)
    var screen_class
    if (obj_type == "albums") {
        screen_class = $.spud.album_detail_screen
    }
    if (screen_class) {
        params = {
            obj_id: obj_id,
        }
        add_screen(screen_class, params)
    }
}

///////////////////////////////////////
// ACTIONS
///////////////////////////////////////
function action() {
    this.listeners = {}
    this.objects = {}
}

action.prototype.add_listener = function(obj, listener) {
    var key = obj.get_uuid()
    if (this.listeners[key]) {
        this.remove_listener(key)
    }
    this.listeners[key] = listener
    this.objects[key] = obj
}

action.prototype.remove_listener = function(obj) {
    var key = obj.get_uuid()
    delete this.listeners[key]
}

action.prototype.trigger = function() {
    var mythis = this
    var fight = arguments
    $.each(this.listeners, function(uuid, listener) {
        var obj = mythis.objects[uuid]
        listener.apply(obj, fight)
    })
}


///////////////////////////////////////
// object_loader
///////////////////////////////////////
function object_loader(type, obj_id) {
    this._type = type
    this._obj_id = obj_id
    this._loading = false
    this._finished = false
    this.loaded_item = new action()
}


object_loader.prototype.load = function() {
    if (this._loading) {
        return
    }
    if (this._finished) {
        return
    }

    var mythis = this
    var criteria = this._criteria
    var page = this._page
    var params = jQuery.extend({}, criteria, { 'page': page })

    console.log("loading object", this._type, this._obj_id)
    this._loading = true

    this.xhr = ajax({
        url: window.__root_prefix + "api/" + this._type + "/" + this._obj_id + "/", 
        data: params,
        success: function(data) {
            console.log("got object", mythis._type, mythis._obj_id)
            mythis._loading = false
            mythis._finished = true

            mythis._got_item(data)
        },
        error: function(status, message) {
            mythis._loading = false
            alert("Error " + status + " " + message)
        },
    });
}

object_loader.prototype.abort = function() {
    if (this._loading) {
        this.xhr.abort()
    }
}

object_loader.prototype._got_item = function(obj) {
    this.loaded_item.trigger(obj)
}


///////////////////////////////////////
// object_list_loader
///////////////////////////////////////
function object_list_loader(type, criteria) {
    this._type = type
    this._criteria = criteria
    this._page = 1
    this._loading = false
    this._last_id = null
    this._idmap = {}
    this._finished = false
    this.loaded_list = new action()
    this.loaded_item = new action()
}


object_list_loader.prototype.load_next_page = function() {
    if (this._loading) {
        return
    }
    if (this._finished) {
        return
    }

    var mythis = this
    var criteria = this._criteria
    var page = this._page
    var params = jQuery.extend({}, criteria, { 'page': page })

    console.log("loading list", this._type, criteria, page)
    this._loading = true

    this.xhr = ajax({
        url: window.__root_prefix + "api/" + this._type + "/",
        data: params,
        success: function(data) {
            console.log("got list", mythis._type, criteria, page)
            mythis._loading = false
            mythis._page = page + 1
            if (!data.next) {
                mythis._finished = true
            }

            mythis._got_list(data.results)
        },
        error: function(status, message) {
            mythis._loading = false
            alert("Error " + status + " " + message)
        },
    });
}

object_list_loader.prototype.abort = function() {
    if (this._loading) {
        this.xhr.abort()
    }
}

object_list_loader.prototype._get_object_id = function(obj) {
    return null
}

object_list_loader.prototype._got_list = function(object_list) {
    var mythis = this
    $.each(object_list, function(j, obj) {
        mythis._got_item(obj)
    })
    this.loaded_list.trigger(object_list)
}

object_list_loader.prototype._got_item = function(obj) {
    var id = this._get_object_id(obj)
    if (id != null) {
        this._idmap[id] = Object()
        if (this._last_id) {
            this._idmap[this._last_id].next = id
            this._idmap[id].prev = this._last_id
        }
        this._last_id = id
    }
    this.loaded_item.trigger(obj)
}

object_list_loader.prototype.get_meta = function(obj_id) {
    var meta = this._idmap[obj_id]
    if (!meta) {
        return null
    }
    if (!meta.next) {
        this.load_next_page()
    }
    return meta
}

///////////////////////////////////////
// save_dialog
///////////////////////////////////////
$.widget('spud.save_dialog',  $.spud.form_dialog, {
    _save: function(http_type, oject_id, values) {
        var mythis = this
        var type = this._type
        this._loading = true
        this.uiDialogButtonPane.find(".ui-button").button("disable")
        var url
        if (oject_id != null) {
            url = window.__root_prefix + "api/" + type + "/" + oject_id + "/"
        } else {
            url = window.__root_prefix + "api/" + type + "/"
        }
        this.xhr = ajax({
            url: url,
            data: values,
            type: http_type,
            success: function(data) {
                mythis._loading = false
                mythis.close()
            },
            error: function(status, message) {
                mythis._loading = false
                alert("Error " + status + " " + message)
                mythis.uiDialogButtonPane.find(".ui-button").button("enable")
            },
        });
    }
})

