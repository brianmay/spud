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

function get_settings() {
    var a = []
    if (localStorage.settings != null)
        if (localStorage.settings != "")
            a = localStorage.settings.split(",")

    var settings
    if (a.length < 5) {
        settings = {
            photos_per_page: 10,
            items_per_page: 10,
            list_size: "thumb",
            view_size: "mid",
            slideshow_size: "large",
        }
    } else {
        settings = {
            photos_per_page: Number(a[0]),
            items_per_page: Number(a[1]),
            list_size: a[2],
            view_size: a[3],
            slideshow_size: a[4],
        }
    }
    return settings
}


function set_settings(settings) {
    var a = [
        settings.photos_per_page,
        settings.items_per_page,
        settings.list_size,
        settings.view_size,
        settings.slideshow_size,
    ]
    localStorage.settings = a.join(",")
}


function set_edit_mode() {
    $(document).data("mode", "edit")
}

function set_normal_mode() {
    $(document).data("mode", null)
}

function is_edit_mode() {
    return ($(document).data("mode") == "edit")
}

var list_sizes = [
    ["thumb", "Thumb"]
]

var view_sizes = [
    ["thumb", "Thumb"],
    ["mid", "Medium"],
    ["large", "Large"],
]

var slideshow_sizes = [
    ["mid", "Medium"],
    ["large", "Large"],
]


$.widget('spud.settings_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["photos_per_page", new integer_input_field("Photos per page", true)],
            ["items_per_page", new integer_input_field("Items per page", true)],
            ["list_size", new select_input_field("List size", list_sizes, true)],
            ["view_size", new select_input_field("View size", view_sizes, true)],
            ["slideshow_size", new select_input_field("Slideshow size", slideshow_sizes, true)],
        ]

        if (this.options.initial == null) {
            this.options.initial = get_settings()
        }
        this.options.title = "Change settings"
        this.options.description = "Please change your settings."
        this.options.button = "Save"
        this._super();
    },

    _submit_values: function(values) {
        var settings = get_settings()

        settings.photos_per_page = Number(values.photos_per_page)
        settings.items_per_page = Number(values.items_per_page)
        settings.list_size = values.list_size
        settings.view_size = values.view_size
        settings.slideshow_size = values.slideshow_size

        set_settings(settings)

        // force page to be redrawn
        window.spud_type = null

        this.close()
        reload_page()
    },
})


$.widget('spud.login_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["username", new text_input_field("Username", true)],
            ["password", new password_input_field("Password", true)],
        ],

        this.options.title = "Login"
        this.options.description = "Please login by typing in your username and password below."
        this.options.button = "Login"
        this._super();
    },

    _submit_values: function(values) {
        var mythis = this
        display_loading()
        load_login(
            values.username,
            values.password,
            function(data) {
                hide_loading()
                mythis.close()
                if (window.history.state==null) {
                    do_root()
                } else {
                    reload_page()
                }
            },
            popup_error
        )
    },
})


function update_session(session) {
    var ut = $("#user-tools")
        .html("")

    ut.append("Welcome, ")

    if (session.is_authenticated) {
        $("<strong></strong")
            .text(session.first_name + " " + session.last_name)
            .appendTo(ut)

        ut.append(" / ")
        ut.append(logout_a())

        ut.append(" / ")

        if (is_edit_mode()) {
            $("<a href='#'>Edit mode</a>")
                .on("click", function() {
                    set_normal_mode()
                    reload_page()
                    return false;
                })
                .appendTo(ut)
        } else {
            $("<a href='#'>View mode</a>")
                .on("click", function() {
                    set_edit_mode()
                    reload_page()
                    return false;
                })
                .appendTo(ut)
        }
    } else {
        ut.append("<strong>guest</strong>")
        ut.append(" / ")
        ut.append(login_a())
    }
    ut.append(" / ")
    ut.append(settings_a())
}
