/// <reference path="dialog.ts" />
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
"use strict"

///////////////////////////////////////
// sessions
///////////////////////////////////////
class Session extends Streamable {
    perms : Perms
}

class LoginDialog extends FormDialog {
    show(element : JQuery) {
        this.options.fields = [
            ["username", new TextInputField("Username", true)],
            ["password", new PasswordInputField("Password", true)],
        ]

        this.options.title = "Login"
        this.options.description = "Please login by typing in your username and password below."
        this.options.button = "Login"
        this.type = "session"
        super.show(element)
    }

    submit_values(values : StringArray<any>) : void {
        this.save_action("POST", "login", values)
    }

    protected save_success(session : Session) : void {
        window._session_changed.trigger(session)
        super.save_success(session)
    }
}

class LogoutDialog extends FormDialog {
    show(element : JQuery) {
        this.options.title = "Logout"
        this.options.description = "Are you sure you want to logout?"
        this.options.button = "Logout"
        this.type = "session"
        super.show(element)
    }

    protected submit_values(values : StringArray<any>) : void {
        this.save_action("POST", "logout", values)
    }

    protected save_success(session : Session) : void {
        window._session_changed.trigger(session)
        super.save_success(session)
    }
}

function add_viewport(viewport : Viewport) {
    var cm : JQuery = $("#content")
    var div : JQuery = $("<div/>").appendTo(cm)
    viewport.show(div)
    return div
}

function setup_user_tools(session) {
    var ut = $("#user-tools")

    ut.empty()
    ut.append("Welcome, ")

    if (session.user) {
        var user = session.user
        $("<strong></strong")
            .text(user.first_name + " " + user.last_name)
            .appendTo(ut)

        ut.append(" / ")

        $("<a/>")
            .text("logout")
            .on("click", (ev) => {
                let div = $("<div/>")
                let dialog = new LogoutDialog({})
                dialog.show(div)
            })
            .appendTo(ut)
    } else {
        $("<strong></strong")
            .text("guest")
            .appendTo(ut)

        ut.append(" / ")

        $("<a/>")
            .text("login")
            .on("click", (ev) => {
                void ev
                let div = $("<div/>")
                let dialog = new LoginDialog({})
                dialog.show(div)
            })
            .appendTo(ut)
    }
}

function setup_menu(session) {
    var menu = $("<ul/>")
        .addClass("menubar")
        .empty()

    $('<li/>')
        .text("Albums")
        .on('click', (ev) => {
            let criteria : AlbumCriteria = new AlbumCriteria()
            criteria.root_only = true
            let viewport = new AlbumListViewport({criteria: criteria})
            add_viewport(viewport)
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Categories")
        .on('click', (ev) => {
            let criteria : CategoryCriteria = new CategoryCriteria()
            criteria.root_only = true
            let viewport = new CategoryListViewport({criteria: criteria})
            add_viewport(viewport)
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Places")
        .on('click', (ev) => {
            let criteria : PlaceCriteria = new PlaceCriteria()
            criteria.root_only = true
            let viewport = new PlaceListViewport({criteria: criteria})
            add_viewport(viewport)
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("People")
        .on('click', (ev) => {
            let criteria : PersonCriteria = new PersonCriteria()
            criteria.root_only = true
            let viewport = new PersonListViewport({criteria: criteria})
            add_viewport(viewport)
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Photos")
        .on('click', (ev) => {
            let criteria : PhotoCriteria = new PhotoCriteria()
            let viewport = new PhotoListViewport({criteria: criteria})
            add_viewport(viewport)
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Reload")
        .on('click', (ev) => {
            window._reload_all.trigger(null)
            return false
        })
        .appendTo(menu)
    menu.menu()

    $("#menu")
        .empty()
        .append(menu)
}

window._session_changed.add_listener(null, (session) => {
    window._perms = session.perms
    window._perms_changed.trigger(session.perms)
    setup_user_tools(session)
    setup_menu(session)
})

function setup_page(session) {
    window._session_changed.trigger(session)
    $("body").attr("onload", null)
}
