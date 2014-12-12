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
