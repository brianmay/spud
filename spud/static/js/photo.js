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

window._photo_created = new signal()
window._photo_changed = new signal()
window._photo_deleted = new signal()


///////////////////////////////////////
// photo dialogs
///////////////////////////////////////

$.widget('spud.photo_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["first_date", new datetime_input_field("First date", false)],
                ["last_date", new datetime_input_field("Last date", false)],
                ["lower_rating", new integer_input_field("Upper rating", false)],
                ["upper_rating", new integer_input_field("Lower rating", false)],
                ["title", new text_input_field("Title", false)],
                ["photographer", new ajax_select_field("Photographer", "persons", false)],
                ["path", new text_input_field("Path", false)],
                ["name", new text_input_field("Name", false)],
                ["first_id", new integer_input_field("First id", false)],
                ["last_id", new integer_input_field("Last id", false)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["person_none", new boolean_input_field("No people", false)],
                ["person_descendants", new boolean_input_field("Descend people", false)],

                ["place", new ajax_select_field("Place", "places", false)],
                ["place_descendants", new boolean_input_field("Descend places", false)],
                ["place_none", new boolean_input_field("No places", false)],

                ["album", new ajax_select_field("Album", "albums", false)],
                ["album_descendants", new boolean_input_field("Descend albums", false)],
                ["album_none", new boolean_input_field("No albums", false)],

                ["category", new ajax_select_field("Category", "categorys", false)],
                ["category_descendants", new boolean_input_field("Descend categories", false)],
                ["category_none", new boolean_input_field("No categories", false)],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new text_input_field("Camera Make", false)],
                ["camera_model", new text_input_field("Camera Model", false)],
            ]},
        ]
        this.options.title = "Search photos"
        this.options.description = "Please search for an photo."
        this.options.button = "Search"
        this._super();
    },

    _submit_values: function(values) {
        var criteria = {}
        
        $.each(values, function (key, el) {
            if (el) { criteria[key] = el }
        });

        var mythis = this
        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.photo_change_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["datetime", new datetime_input_field("Date", true)],
                ["title", new text_input_field("Title", true)],
                ["photographer_pk", new ajax_select_field("Photographer", "persons", false)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["place_pk", new ajax_select_field("Place", "places", false)],
//                ["album", new ajax_select_field("Album", "albums", false)],
//                ["category", new ajax_select_field("Category", "categorys", false)],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new text_input_field("Camera Make", false)],
                ["camera_model", new text_input_field("Camera Model", false)],
            ]},
        ]

        this.options.title = "Change photo"
        this.options.button = "Save"

        this._type = "photos"
        this._super();
    },

    set: function(photo) {
        this.obj_id = photo.id
        if (photo.id != null) {
            this.set_title("Change photo")
            this.set_description("Please change photo " + photo.title + ".")
        } else {
            this.set_title("Add new photo")
            this.set_description("Please add new photo.")
        }
        return this._super(photo);
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
            window._photo_changed.trigger(data)
        } else {
            window._photo_created.trigger(data)
        }
    },
})


$.widget('spud.photo_delete_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.title = "Delete photo"
        this.options.button = "Delete"

        this._type = "photos"
        this._super();
    },

    set: function(photo) {
        this.obj_id = photo.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            photo.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        window._photo_deleted.trigger(this.obj_id)
    }
})


///////////////////////////////////////
// photo widgets
///////////////////////////////////////

$.widget('spud.photo_criteria', $.spud.object_criteria, {
    set: function(criteria) {
        this._type = "photos"
        this._type_name = "Photo"

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


$.widget('spud.photo_list', $.spud.object_list, {
    _create: function() {
        this._type = "photos"
        this._type_name = "Photo"

        this._super()

        window._photo_changed.add_listener(this, function(photo) {
            var li = this._create_li(photo)
            this._get_item(photo.id).replaceWith(li)
        })
        window._photo_deleted.add_listener(this, function(photo_id) {
            this._get_item(photo_id).remove()
            this._load_if_required()
        })
    },

    _photo_a: function(photo) {
        var mythis = this
        var photo_list_loader = this.loader

        var title = photo.title
        var a = $('<a/>')
            .attr('href', root_url() + "photos/" + photo.id + "/")
            .on('click', function() {
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.photo_detail_screen("set", photo)
                        child.photo_detail_screen("set_loader", photo_list_loader)
                        child.photo_detail_screen("enable")
                        return false
                    }
                }

                var params = {
                    id: child_id,
                    obj: photo,
                    object_list_loader: photo_list_loader,
                }
                child = add_screen($.spud.photo_detail_screen, params)
                return false;
            })
            .data('photo', photo.cover_photo)
            .text(title)
        return a
    },

    _create_li: function(photo) {
        var details = []
        details.push($("<div/>").text(photo.datetime))
        if (photo.place != null) {
            details.push($("<div/>").text(photo.place.title))
        }
        if (photo.persons.length > 0) {
            var persons = $.map(photo.persons, function(person) { return person.title })
            details.push($("<div/>").text(persons.join(", ")))
        }
        var a = this._photo_a(photo)
        var li = this._super(photo, photo.relation || photo.title, details, photo.description, a)
        li.attr('data-id', photo.id)
        return li
    },

})


$.widget('spud.photo_detail',  $.spud.object_detail, {
    _create: function() {
        this._type = "photos"
        this._type_name = "Photo"

        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["title", new text_output_field("Title")],
                ["description", new p_output_field("Description")],
                ["view", new p_output_field("View")],
                ["comment", new p_output_field("Comment")],
                ["name", new text_output_field("File")],
                ["place", new link_output_field("Place", "places")],
                ["albums", new link_list_output_field("Albums", "albums")],
                ["categorys", new link_list_output_field("Categories", "categorys")],
                ["utctime", new link_output_field("Date & time")],
                ["localtime", new link_output_field("Date & time")],
                ["photographer", new link_output_field("Photographer", "persons")],
                ["rating", new text_output_field("Rating")],
//                ["videos", new html_output_field("Videos")],
//                ["related", new html_list_output_field("Related")],
                ["action", new text_output_field("Action")],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new text_output_field("Camera make")],
                ["camera_model", new text_output_field("Camera model")],
                ["flash_used", new text_output_field("Flash")],
                ["focal_length", new text_output_field("Focal Length")],
                ["exposure", new text_output_field("Exposure")],
                ["aperture", new text_output_field("Aperture")],
                ["iso_equiv", new text_output_field("ISO")],
                ["metering_mode", new text_output_field("Metering mode")],
            ]},
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    set: function(photo) {
        this.element.removeClass("error")
        this._super(photo)
        this.options.obj = photo
        this.options.obj_id = photo.id
        this.img.image("set", photo)
        if (this.options.on_update) {
            this.options.on_update(photo)
        }
    },
})


///////////////////////////////////////
// photo screens
///////////////////////////////////////

$.widget('spud.photo_list_screen', $.spud.object_list_screen, {
    _create: function() {
        this._type = "photos"
        this._type_name = "Photo"

        this._super()
    },

    _object_list: $.proxy($.spud.photo_list, window),
    _object_criteria: $.proxy($.spud.photo_criteria, window),
    _object_search_dialog: $.proxy($.spud.photo_search_dialog, window),
})


$.widget('spud.photo_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "photos"
        this._type_name = "Photo"

        this._super()

        var mythis = this

        window._photo_changed.add_listener(this, function(obj) {
            if (obj.id == this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._photo_deleted.add_listener(this, function(obj_id) {
            if (obj_id == this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _get_children_criteria: function() {
        return {
            'instance': this.options.obj_id,
        }
    },

    _photo_list_screen: null,
    _object_list: $.proxy($.spud.photo_list, window),
    _object_detail: $.proxy($.spud.photo_detail, window),
    _object_list_screen: $.proxy($.spud.photo_list_screen, window),
    _object_change_dialog: $.proxy($.spud.photo_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud._object_delete_dialog, window),
})
