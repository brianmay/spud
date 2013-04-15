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
            click_size: "large",
        }
    } else {
        settings = {
            photos_per_page: Number(a[0]),
            items_per_page: Number(a[1]),
            list_size: a[2],
            view_size: a[3],
            click_size: a[4],
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
        settings.click_size,
    ]
    localStorage.settings = a.join(",")
}


$.widget('ui.settings_dialog',  $.ui.form_dialog, {
    fields: {
        photos_per_page: new integer_input_field("Photos per page", true),
        items_per_page: new integer_input_field("Items per page", true),
        list_size: new select_input_field("List size", "album", true),
        view_size: new select_input_field("View size", "album", true),
        click_size: new select_input_field("Click size", "album", true),
    },

    _create: function() {
        this.options.title = "Change settings"
        this.options.description = "Please change your settings."
        this.options.button = "Save"
        this._super();
    },

    _set: function(values) {
        this.fields["list_size"].set_options(data.list_sizes)
        this.fields["view_size"].set_options(data.view_sizes)
        this.fields["click_size"].set_options(data.click_sizes)
        this._super(values);
    },

    _submit_values: function(values) {
        settings = get_settings()

        if (form.photos_per_page.value) {
            settings.photos_per_page = Number(form.photos_per_page.value)
        }

        if (form.items_per_page.value) {
            settings.items_per_page = Number(form.items_per_page.value)
        }

        settings.list_size = form.list_size.value
        settings.view_size = form.view_size.value
        settings.click_size = form.click_size.value

        set_settings(settings)

        this.close()
        reload_page()
    },
})


$.widget('ui.login_dialog',  $.ui.form_dialog, {
    fields: {
        username: new text_input_field("Username", true),
        password: new text_input_field("Password", true),
    },

    _create: function() {
        this.options.title = "Login"
        this.options.description = "Please login by typing in your username and password below."
        this.options.button = "Login"
        this._super();
    },

    _submit_values: function(values) {
        display_loading()
        load_login(
            values.username,
            values.password,
            function(data) {
                hide_loading()
                dialog.dialog("close")
                if (window.history.state==null) {
                    do_root(false)
                } else {
                    reload_page()
                }
            },
            display_error
        )
        this.close()
        reload_page()
    },
})


