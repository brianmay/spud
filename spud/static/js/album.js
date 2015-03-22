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

window._album_created = new signal()
window._album_changed = new signal()
window._album_deleted = new signal()


///////////////////////////////////////
// album dialogs
///////////////////////////////////////

$.widget('spud.album_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Album", "albums", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new boolean_input_field("Root only", false)],
            ["needs_revision", new boolean_input_field("Needs revision")],
        ]
        this.options.title = "Search albums"
        this.options.description = "Please search for an album."
        this.options.button = "Search"
        this._super();
    },

    _submit_values: function(values) {
        var criteria = {}

        $.each(values, function (key, el) {
            if (el != null && el !== false) { criteria[key] = el }
        });

        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.album_change_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["description", new p_input_field("Description", false)],
            ["cover_photo_pk", new photo_select_field("Photo", false)],
            ["sort_name", new text_input_field("Sort Name", false)],
            ["sort_order", new text_input_field("Sort Order", false)],
            ["parent", new ajax_select_field("Parent", "albums", false)],
            ["revised", new datetime_input_field("Revised", false)],
        ]

        this.options.title = "Change album"
        this.options.button = "Save"

        this._type = "albums"
        this._super();
    },

    _set: function(album) {
        this.obj_id = album.id
        if (album.id != null) {
            this.set_title("Change album")
            this.set_description("Please change album " + album.title + ".")
        } else {
            this.set_title("Add new album")
            this.set_description("Please add new album.")
        }

        var clone = $.extend({}, album)
        if (clone.revised != null) {
            clone.revised = [ clone.revised, clone.revised_utc_offset ]
        } else {
            clone.revised = null
        }
        return this._super(clone);
    },

    _submit_values: function(values) {
        if (values.revised != null) {
            values.revised_utc_offset = values.revised[1]
            values.revised = values.revised[0]
        } else {
            values.revised_utc_offset = null
            values.revised = null
        }

        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values)
        } else {
            this._save("POST", null, values)
        }
    },

    _save_success: function(data) {
        if (this.obj_id != null) {
            window._album_changed.trigger(data)
        } else {
            window._album_created.trigger(data)
        }
        this._super(data);
    },
})


$.widget('spud.album_delete_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Delete album"
        this.options.button = "Delete"

        this._type = "albums"
        this._super();
    },

    _set: function(album) {
        this.obj_id = album.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            album.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        void values
        this._save("DELETE", this.obj_id, {})
    },

    _save_success: function(data) {
        window._album_deleted.trigger(this.obj_id)
        this._super(data);
    }
})


///////////////////////////////////////
// album widgets
///////////////////////////////////////

$.widget('spud.album_criteria', $.spud.object_criteria, {
    _create: function() {
        this._type = "albums"
        this._type_name = "Album"

        this._super()
    },

    _set: function(criteria) {
        var mythis = this
        mythis.element.removeClass("error")

        this.options.criteria = criteria
        var ul = this.criteria
        this.criteria.empty()

        criteria = $.extend({}, criteria)

        var title = null

        var mode = criteria.mode || 'children'
        delete criteria.mode

        if (criteria.instance != null) {
            var instance = criteria.instance
            title = instance + " / " + mode

            $("<li/>")
                .text("instance" + " = " + instance + " (" + mode + ")")
                .appendTo(ul)

            delete criteria.instance
        }

        else if (criteria.q != null) {
            title = "search " + criteria.q
        }

        else if (criteria.root_only) {
            title = "root only"
        }

        else if (criteria.needs_revision) {
            title = "needs revision"
        }

        else {
            title = "All"
        }

        $.each(criteria, function( index, value ) {
            $("<li/>")
                .text(index + " = " + value)
                .appendTo(ul)
        })

        this._super(criteria)

        if (this.options.on_load != null) {
            this.options.on_load(criteria, title)
        }
    },
})


$.widget('spud.album_list', $.spud.object_list, {
    _create: function() {
        this._type = "albums"
        this._type_name = "Album"

        this._super()

        window._album_changed.add_listener(this, function(album) {
            var li = this._create_li(album)
            this._get_item(album.id).replaceWith(li)
        })
        window._album_deleted.add_listener(this, function(album_id) {
            this._get_item(album_id).remove()
            this._load_if_required()
        })
    },

    _album_a: function(album) {
        var mythis = this
        var album_list_loader = this.loader

        var title = album.title
        var a = $('<a/>')
            .attr('href', root_url() + "albums/" + album.id + "/")
            .on('click', function() {
                if (mythis.options.disabled) {
                    return false
                }
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.album_detail_screen("enable")
                        child.album_detail_screen("set", album)
                        child.album_detail_screen("set_loader", album_list_loader)
                        return false
                    }
                }

                var params = {
                    id: child_id,
                    obj: album,
                    object_list_loader: album_list_loader,
                }
                child = add_screen($.spud.album_detail_screen, params)
                return false;
            })
            .data('photo', album.cover_photo)
            .text(title)
        return a
    },

    _create_li: function(album) {
        var photo = album.cover_photo
        var details = []
        if  (album.sort_order || album.sort_name) {
            details.push($("<div/>").text(album.sort_name + " " + album.sort_order))
        }
        var a = this._album_a(album)
        var li = this._super(photo, album.title, details, album.description, a)
        li.attr('data-id', album.id)
        return li
    },

})


$.widget('spud.album_detail',  $.spud.object_detail, {
    _create: function() {
        this._type = "albums"
        this._type_name = "Album"

        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["sort_name", new text_output_field("Sort Name")],
            ["sort_order", new text_output_field("Sort Order")],
            ["revised", new datetime_output_field("Revised")],
            ["description", new p_output_field("Description")],
            ["ascendants", new link_list_output_field("Ascendants", "albums")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    _set: function(album) {
        this.element.removeClass("error")

        var clone = $.extend({}, album)
        if (clone.revised != null) {
            clone.revised = [ clone.revised, clone.revised_utc_offset ]
        } else {
            clone.revised = null
        }
        this._super(clone)

        this.options.obj = album
        this.options.obj_id = album.id
        this.img.image("set", album.cover_photo)
    },
})


///////////////////////////////////////
// album screens
///////////////////////////////////////

$.widget('spud.album_list_screen', $.spud.object_list_screen, {
    _create: function() {
        this._type = "albums"
        this._type_name = "Album"

        this._super()
    },

    _object_list: $.proxy($.spud.album_list, window),
    _object_criteria: $.proxy($.spud.album_criteria, window),
    _object_search_dialog: $.proxy($.spud.album_search_dialog, window),
})


$.widget('spud.album_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "albums"
        this._type_name = "Album"

        this._super()

        var mythis = this

        window._album_changed.add_listener(this, function(obj) {
            if (obj.id === this.options.obj_id) {
                mythis._set(obj)
            }
        })
        window._album_deleted.add_listener(this, function(obj_id) {
            if (obj_id === this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _get_photo_criteria: function() {
        return {
            'album': this.options.obj_id,
            'album_descendants': true,
        }
    },

    _object_list: $.proxy($.spud.album_list, window),
    _object_detail: $.proxy($.spud.album_detail, window),
    _object_list_screen: $.proxy($.spud.album_list_screen, window),
    _object_change_dialog: $.proxy($.spud.album_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud.album_delete_dialog, window),
})
