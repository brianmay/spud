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
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ],
                false)],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search albums"
        this.options.description = "Please search for an album."
        this.options.button = "Search"
        this._super();
    },

    set: function(criteria) {
        if (true) {
            this.add_field(null, "needs_revision",
                new boolean_input_field("Needs revision"))
        } else {
            this.remove_field("needs_revision")
        }
        this._super(criteria)
    },

    _submit_values: function(values) {
        var criteria = {}

        var v = values.q
        if (v) { criteria.q = v }

        var v = values.instance
        if (v) { criteria.instance = v }

        var v = values.mode
        if (v) { criteria.mode = v }

        var v = values.root_only
        if (v) { criteria.root_only = v }

        var v = values.needs_revision
        if (v) { criteria.needs_revision = v }

        var mythis = this
        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.album_change_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["description", new p_input_field("Description", false)],
            ["cover_photo", new photo_select_field("Photo", false)],
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

    set: function(album) {
        this.obj_id = album.id
        if (album.id != null) {
            this.set_title("Change album")
            this.set_description("Please change album " + album.title + ".")
        } else {
            this.set_title("Add new album")
            this.set_description("Please add new album.")
        }
        return this._super(album);
    },

    _submit_values: function(values) {
        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values)
        } else {
            this._save("POST", null, values)
        }
    },

    _done: function(data) {
        if (this.obj_id != null) {
            window._album_changed.trigger(data)
        } else {
            window._album_created.trigger(data)
        }
    },
})


$.widget('spud.album_delete_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.title = "Delete album"
        this.options.button = "Delete"

        this._type = "albums"
        this._super();
    },

    set: function(album) {
        this.obj_id = album.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            album.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        window._album_deleted.trigger(this.obj_id)
    }
})


///////////////////////////////////////
// album widgets
///////////////////////////////////////

$.widget('spud.album_criteria', $.spud.object_criteria, {
    set: function(criteria) {
        this._type = "albums"
        this._type_name = "Album"

        var mythis = this
        mythis.element.removeClass("error")

        this.options.criteria = criteria
        var ul = this.criteria
        this.criteria.empty()

        criteria = $.extend({}, criteria)

        var title = null

        var mode = criteria['mode'] || 'children'
        delete criteria['mode']

        if (criteria['instance'] != null) {
            var instance = criteria['instance']
            title = instance + " / " + mode

            $("<li/>")
                .text("instance" + " = " + instance + " (" + mode + ")")
                .appendTo(ul)

            delete criteria['instance']
        }

        else if (criteria['q'] != null) {
            title = "search " + criteria['q']
        }

        else if (criteria['root_only']) {
            title = "root only"
        }

        else if (criteria['needs_revision']) {
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
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.album_detail_screen("set", album)
                        child.album_detail_screen("set_loader", album_list_loader)
                        child.album_detail_screen("enable")
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
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    set: function(album) {
        this.element.removeClass("error")
        this._super(album)
        this.options.obj = album
        this.options.obj_id = album.id
        this.img.image("set", album.cover_photo)
        if (this.options.on_update) {
            this.options.on_update(album)
        }
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
    _get_object_list_instance: function(ol) {
        return ol.album_list("instance")
    },


    _object_criteria: $.proxy($.spud.album_criteria, window),
    _get_object_criteria_instance: function(oc) {
        return oc.album_criteria("instance")
    },

    _object_search_dialog: $.proxy($.spud.album_search_dialog, window),
})


$.widget('spud.album_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "albums"
        this._type_name = "Album"

        this._super()

        var mythis = this

        window._album_changed.add_listener(this, function(obj) {
            if (obj.id == this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._album_deleted.add_listener(this, function(obj_id) {
            if (obj_id == this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _object_list: $.proxy($.spud.album_list, window),
    _get_object_list_instance: function(ol) {
        return ol.album_list("instance")
    },

    _object_detail: $.proxy($.spud.album_detail, window),
    _get_object_detail_instance: function(od) {
        return od.album_detail("instance")
    },

    _object_list_screen: $.proxy($.spud.album_list_screen, window),
    _object_change_dialog: $.proxy($.spud.album_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud._object_delete_dialog, window),
})
