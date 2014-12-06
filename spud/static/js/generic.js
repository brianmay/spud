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

function generic() {
    this.has_ancestors = true
    this.has_children = true
    this.has_photos = true
}

generic.prototype.setup_user_tools = function(session) {
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

generic.prototype.setup_menu = function(session) {
    var menu = $("<ul/>")

    menu.empty()

    $('<li/>')
        .on('click', function() { alert("meow") })
        .text("Albums")
        .appendTo(menu)

    $('<li/>')
        .on('click', function() { alert("meow") })
        .text("Categorys")
        .appendTo(menu)

    $('<li/>')
        .on('click', function() { alert("meow") })
        .text("People")
        .appendTo(menu)

    menu.menu()
    $("#menu").append(menu)
}

generic.prototype.setup_header = function(session) {
    this.setup_user_tools(session)
    this.setup_menu(session)
}

generic.prototype.setup_content = function(session, search, scroll) {
    var cm = $("#content-main")
    cm.empty()

    var params = {
        'search': search,
        'scroll': scroll,
    }
    var div = $("<div id='search_details'/>").appendTo(cm)
    $.spud.album_list(params, div)
}

generic.prototype.do_list = function(session, search, scroll) {
    this.setup_header(session)
    this.setup_content(session, search, scroll)
    $("#breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › " + this.display_plural)
}
