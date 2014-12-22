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

window._place_created = new signal()
window._place_changed = new signal()
window._place_deleted = new signal()


///////////////////////////////////////
// place dialogs
///////////////////////////////////////

$.widget('spud.place_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Place", "places", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ],
                false)],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search places"
        this.options.description = "Please search for an place."
        this.options.button = "Search"
        this._super();
    },

    _submit_values: function(values) {
        var criteria = {}

        $.each(values, function (key, el) {
            if (el != null) { criteria[key] = el }
        });

        var mythis = this
        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.place_change_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["cover_photo", new photo_select_field("Photo", false)],
            ["address", new text_input_field("Address", false)],
            ["address2", new text_input_field("Address(ctd)", false)],
            ["city", new text_input_field("City", false)],
            ["state", new text_input_field("State", false)],
            ["country", new text_input_field("Country", false)],
            ["postcode", new text_input_field("Postcode", false)],
            ["url", new text_input_field("URL", false)],
            ["urldesc", new text_input_field("URL desc", false)],
            ["notes", new p_input_field("Notes", false)],
            ["parent", new ajax_select_field("Parent", "places", false)],
        ]

        this.options.title = "Change place"
        this.options.button = "Save"

        this._type = "places"
        this._super();
    },

    set: function(place) {
        this.obj_id = place.id
        if (place.id != null) {
            this.set_title("Change place")
            this.set_description("Please change place " + place.title + ".")
        } else {
            this.set_title("Add new place")
            this.set_description("Please add new place.")
        }
        return this._super(place);
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
            window._place_changed.trigger(data)
        } else {
            window._place_created.trigger(data)
        }
    },
})


$.widget('spud.place_delete_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.title = "Delete place"
        this.options.button = "Delete"

        this._type = "places"
        this._super();
    },

    set: function(place) {
        this.obj_id = place.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            place.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        window._place_deleted.trigger(this.obj_id)
    }
})


///////////////////////////////////////
// place widgets
///////////////////////////////////////

$.widget('spud.place_criteria', $.spud.object_criteria, {
    set: function(criteria) {
        this._type = "places"
        this._type_name = "Place"

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


$.widget('spud.place_list', $.spud.object_list, {
    _create: function() {
        this._type = "places"
        this._type_name = "Place"

        this._super()

        window._place_changed.add_listener(this, function(place) {
            var li = this._create_li(place)
            this._get_item(place.id).replaceWith(li)
        })
        window._place_deleted.add_listener(this, function(place_id) {
            this._get_item(place_id).remove()
            this._load_if_required()
        })
    },

    _place_a: function(place) {
        var mythis = this
        var place_list_loader = this.loader

        var title = place.title
        var a = $('<a/>')
            .attr('href', root_url() + "places/" + place.id + "/")
            .on('click', function() {
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.place_detail_screen("set", place)
                        child.place_detail_screen("set_loader", place_list_loader)
                        child.place_detail_screen("enable")
                        return false
                    }
                }

                var params = {
                    id: child_id,
                    obj: place,
                    object_list_loader: place_list_loader,
                }
                child = add_screen($.spud.place_detail_screen, params)
                return false;
            })
            .data('photo', place.cover_photo)
            .text(title)
        return a
    },

    _create_li: function(place) {
        var photo = place.cover_photo
        var details = []
        if  (place.sort_order || place.sort_name) {
            details.push($("<div/>").text(place.sort_name + " " + place.sort_order))
        }
        var a = this._place_a(place)
        var li = this._super(photo, place.title, details, place.description, a)
        li.attr('data-id', place.id)
        return li
    },

})


$.widget('spud.place_detail',  $.spud.object_detail, {
    _create: function() {
        this._type = "places"
        this._type_name = "Place"

        this.options.fields = [
            ["address", new text_output_field("Address")],
            ["address2", new text_output_field("Address(ctd)")],
            ["city", new text_output_field("City")],
            ["state", new text_output_field("State")],
            ["postcode", new text_output_field("Postcode")],
            ["country", new text_output_field("Country")],
            ["url", new html_output_field("URL")],
            ["home_of", new link_list_output_field("Home of", "places")],
            ["work_of", new link_list_output_field("Work of", "places")],
            ["notes", new p_output_field("notes")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    set: function(place) {
        this.element.removeClass("error")
        this._super(place)
        this.options.obj = place
        this.options.obj_id = place.id
        this.img.image("set", place.cover_photo)
        if (this.options.on_update) {
            this.options.on_update(place)
        }
    },
})


///////////////////////////////////////
// place screens
///////////////////////////////////////

$.widget('spud.place_list_screen', $.spud.object_list_screen, {
    _create: function() {
        this._type = "places"
        this._type_name = "Place"

        this._super()
    },

    _object_list: $.proxy($.spud.place_list, window),
    _object_criteria: $.proxy($.spud.place_criteria, window),
    _object_search_dialog: $.proxy($.spud.place_search_dialog, window),
})


$.widget('spud.place_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "places"
        this._type_name = "Place"

        this._super()

        var mythis = this

        window._place_changed.add_listener(this, function(obj) {
            if (obj.id == this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._place_deleted.add_listener(this, function(obj_id) {
            if (obj_id == this.options.obj_id) {
                mythis.close()
            }
        })
    },


    _get_photo_criteria: function() {
        return {
            'place': this.options.obj_id,
        }
    },

    _object_list: $.proxy($.spud.place_list, window),
    _object_detail: $.proxy($.spud.place_detail, window),
    _object_list_screen: $.proxy($.spud.place_list_screen, window),
    _object_change_dialog: $.proxy($.spud.place_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud._object_delete_dialog, window),
})
