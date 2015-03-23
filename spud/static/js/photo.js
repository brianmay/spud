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
                ["q", new text_input_field("Search for", false)],
                ["first_datetime", new datetime_input_field("First date", false)],
                ["last_datetime", new datetime_input_field("Last date", false)],
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
                ["album", new ajax_select_field("Album", "albums", false)],
                ["album_descendants", new boolean_input_field("Descend albums", false)],
                ["album_none", new boolean_input_field("No albums", false)],

                ["category", new ajax_select_field("Category", "categorys", false)],
                ["category_descendants", new boolean_input_field("Descend categories", false)],
                ["category_none", new boolean_input_field("No categories", false)],

                ["place", new ajax_select_field("Place", "places", false)],
                ["place_descendants", new boolean_input_field("Descend places", false)],
                ["place_none", new boolean_input_field("No places", false)],

                ["person", new ajax_select_field("Person", "persons", false)],
                ["person_none", new boolean_input_field("No people", false)],
                ["person_descendants", new boolean_input_field("Descend people", false)],
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

    _set: function(criteria) {
        var clone = $.extend({}, criteria)

        if (clone.first_datetime != null) {
            clone.first_datetime = [ clone.first_datetime, 0 ]
        }

        if (clone.last_datetime != null) {
            clone.last_datetime = [ clone.last_datetime, 0 ]
        }

        this._super(clone)
    },

    _submit_values: function(values) {
        var criteria = {}

        $.each(values, function (key, el) {
            if (el != null && el !== false) { criteria[key] = el }
        });

        if (values.first_datetime != null) {
            criteria.first_datetime = values.first_datetime[0]
        }
        if (values.last_datetime != null) {
            criteria.last_datetime = values.last_datetime[0]
        }

        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.photo_change_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["datetime", new datetime_input_field("Date", true)],
                ["title", new text_input_field("Title", true)],
                ["photographer_pk", new ajax_select_field("Photographer", "persons", false)],
                ["action", new select_input_field("Action", [
                    ["", "no action"],
                    ["D", "delete"],
                    ["R", "regenerate thumbnails & video"],
                    ["M", "move photo"],
                    ["auto", "rotate automatic"],
                    ["90", "rotate 90 degrees clockwise"],
                    ["180", "rotate 180 degrees clockwise"],
                    ["270", "rotate 270 degrees clockwise"],
                ], false)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["albums_pk", new ajax_select_multiple_field("Album", "albums", false)],
                ["categorys_pk", new ajax_select_multiple_field("Category", "categorys", false)],
                ["place_pk", new ajax_select_field("Place", "places", false)],
                ["persons_pk", new ajax_select_sorted_field("Person", "persons", false)],
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

    _set: function(photo) {
        this.obj_id = photo.id
        if (photo.id != null) {
            this.set_title("Change photo")
            this.set_description("Please change photo " + photo.title + ".")
        } else {
            this.set_title("Add new photo")
            this.set_description("Please add new photo.")
        }

        var clone = $.extend({}, photo)
        clone.datetime = [ clone.datetime, clone.utc_offset ]
        return this._super(clone);
    },

    _submit_values: function(values) {
        values.utc_offset = values.datetime[1]
        values.datetime = values.datetime[0]

        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values)
        } else {
            this._save("POST", null, values)
        }
    },

    _save_success: function(data) {
        if (this.obj_id != null) {
            window._photo_changed.trigger(data)
        } else {
            window._photo_created.trigger(data)
        }
        this._super(data);
    },
})


$.widget('spud.photo_bulk_update_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["datetime", new datetime_input_field("Date", false)],
                ["title", new text_input_field("Title", false)],
                ["photographer_pk", new ajax_select_field("Photographer", "persons", false)],
                ["place_pk", new ajax_select_field("Place", "places", false)],
                ["action", new select_input_field("Action", [
                    ["none", "no action"],
                    ["D", "delete"],
                    ["R", "regenerate thumbnails & video"],
                    ["M", "move photo"],
                    ["auto", "rotate automatic"],
                    ["90", "rotate 90 degrees clockwise"],
                    ["180", "rotate 180 degrees clockwise"],
                    ["270", "rotate 270 degrees clockwise"],
                ], false)],
            ]},
            {name: 'add', title: 'Add', fields: [
                ["add_albums_pk", new ajax_select_multiple_field("Album", "albums", false)],
                ["add_categorys_pk", new ajax_select_multiple_field("Category", "categorys", false)],
                ["add_persons_pk", new ajax_select_sorted_field("Person", "persons", false)],
            ]},
            {name: 'rem', title: 'Remove', fields: [
                ["rem_albums_pk", new ajax_select_multiple_field("Album", "albums", false)],
                ["rem_categorys_pk", new ajax_select_multiple_field("Category", "categorys", false)],
                ["rem_persons_pk", new ajax_select_sorted_field("Person", "persons", false)],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new text_input_field("Camera Make", false)],
                ["camera_model", new text_input_field("Camera Model", false)],
            ]},
        ]

        this.options.title = "Bulk photo update"
        this.options.button = "Save"

        this._super();
    },

    _set: function(photo) {
        var clone = $.extend({}, photo)
        clone.set_datetime = [ clone.set_datetime, clone.set_utc_offset ]
        return this._super(clone);
    },

    _submit_values: function(values) {
        var data = {}

        $.each(values, function (key, el) {
            if (el != null && el !== false) { data[key] = el }
        });

        if (data.action === "none") {
            data.action = null
        }

        if (data.set_datetime != null) {
            data.set_utc_offset = data.set_datetime[1]
            data.set_datetime = data.set_datetime[0]
        }

        console.log(data)
        this._data = data
        this.element.hide()

        var params = {
            criteria: this.options.criteria,
            obj: data,
            on_proceed: $.proxy(this._proceed, this),
            on_cancel: $.proxy(this._cancel, this),
        }
        var div = $("<div/>")
        $.spud.photo_bulk_confirm_dialog(params, div)
    },

    _proceed: function() {
        this.close()

        var params = {
            criteria: this.options.criteria,
            obj: this._data,
        }
        var div = $("<div/>")
        $.spud.photo_bulk_proceed_dialog(params, div)
    },

    _cancel: function() {
        this.element.show()
        this.enable()
    },
})


$.widget('spud.photo_bulk_confirm_dialog',  $.spud.base_dialog, {
    _create: function() {
        this._proceed = false

        this.options.title = "Confirm bulk update"
        this.options.button = "Confirm"

        // this._type = "photos"

        this._ul = $("<ul/>").appendTo(this.element)

        this._ol = $("<div/>").appendTo(this.element)
        $.spud.photo_list({}, this._ol)

        this._super();
    },

    _set: function(values) {
        var mythis = this
        this._ul.empty()
        $.each(values, function(key, value) {
            $("<li/>").text(key + " = " + value)
                .appendTo(mythis._ul)
        })
        var instance = this._ol.data("object_list")
        instance.option("criteria", this.options.criteria)
    },

    _disable: function() {
        var instance = this._ol.data("object_list")
        instance.disable()
        this._super()
    },

    _enable: function() {
        var instance = this._ol.data("object_list")
        instance.enable()
        this._super()
    },

    _submit: function() {
        this._proceed = true
        this.close()
    },

    _destroy: function() {
        this._super()
        if (this._proceed) {
            this.options.on_proceed()
        } else {
            this.options.on_cancel()
        }
    },

})


$.widget('spud.photo_bulk_proceed_dialog',  $.spud.base_dialog, {
    _create: function() {
        this.options.title = "Bulk update"
        this.options.button = "Retry"

        this._type = "photos"

        this._pb = $("<div/>").appendTo(this.element)
        $.ui.progressbar({value: false}, this._pb)

        this._status = $("<div/>")
            .text("Please wait")
            .appendTo(this.element)

        this._super()
    },

    _set: function(values) {
        this._values = values
        this._check_submit()
    },

    _submit: function() {
        var data = {
            'criteria': this.options.criteria,
            'values': this._values
        }
        this._save("PATCH", null, data)
    },

    _save_success: function(data) {
        void data
//        $.each(data.results, function(photo) {
//            window._photo_changed.trigger(photo)
//        })
        window._reload_all.trigger()
        this._super()
    },

    _destroy: function() {
        this._super()
    }
})

$.widget('spud.photo_delete_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Delete photo"
        this.options.button = "Delete"

        this._type = "photos"
        this._super();
    },

    _set: function(photo) {
        this.obj_id = photo.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            photo.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        void values
        this._save("DELETE", this.obj_id, {})
    },

    _save_success: function(data) {
        window._photo_deleted.trigger(this.obj_id)
        this._super(data);
    }
})


///////////////////////////////////////
// photo widgets
///////////////////////////////////////

$.widget('spud.photo_criteria', $.spud.object_criteria, {
    _create: function() {
        this._type = "photos"
        this._type_name = "Photo"

        this.load_attributes = [
            { name: 'album', type: 'albums' },
            { name: 'category', type: 'categorys' },
            { name: 'place', type: 'places' },
            { name: 'person', type: 'persons' },
            { name: 'instance', type: 'photos' },
        ]

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

        else if (criteria.album != null) {
            title = "album " + criteria.album
        }
        else if (criteria.category != null) {
            title = "category " + criteria.category
        }
        else if (criteria.place != null) {
            title = "place " + criteria.place
        }
        else if (criteria.person != null) {
            title = "person " + criteria.person
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
    _add_selection: function(photo) {
        var selection = this.options.selection
        if (selection.indexOf(photo.id) === -1) {
            selection.push(photo.id)
            push_state(true)
        }
    },

    _del_selection: function(photo) {
        var selection = this.options.selection
        var index = selection.indexOf(photo.id)
        if (index !== -1) {
            selection.splice(index, 1);
            push_state(true)
        }
    },

    _is_photo_selected: function(photo) {
        var selection = this.options.selection
        var index = selection.indexOf(photo.id)
        return index !== -1
    },

    _create: function() {
        var mythis = this

        this._type = "photos"
        this._type_name = "Photo"

        if (this.options.selection == null) {
            this.options.selection = []
        }
        this._super()

        this.ul.myselectable({
            filter: "li",
            selected: function( event, ui ) {
                mythis._add_selection( $(ui.selected).data('photo') );
            },
            unselected: function( event, ui ) {
                mythis._del_selection( $(ui.unselected).data('photo') );
            },
        })

        window._photo_changed.add_listener(this, function(photo) {
            var li = this._create_li(photo)
            this._get_item(photo.id).replaceWith(li)
        })
        window._photo_deleted.add_listener(this, function(photo_id) {
            this._get_item(photo_id).remove()
            this._load_if_required()
        })
    },

    disable: function() {
        this.ul.myselectable("disable")
        this._super()
    },

    enable: function() {
        this.ul.myselectable("enable")
        this._super()
    },

    empty: function() {
        this.options.selection = []
        this._super()
    },

    _photo_a: function(photo) {
        var mythis = this
        var photo_list_loader = this.loader

        var title = photo.title
        var a = $('<a/>')
            .attr('href', root_url() + "photos/" + photo.id + "/")
            .on('click', function() {
                if (mythis.options.disabled) {
                    return false
                }
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.photo_detail_screen("enable")
                        child.photo_detail_screen("set", photo)
                        child.photo_detail_screen("set_loader", photo_list_loader)
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
            var persons = $.map(photo.persons, function(person) {
                if (person != null) {
                    return person.title
                } else {
                    return "Unknown"
                }
            })
            details.push($("<div/>").text(persons.join(", ")))
        }
        var a = this._photo_a(photo)
        var li = this._super(photo, photo.relation || photo.title, details, photo.description, a)
        // li.attr('data-id', photo.id)
        li.data('photo', photo)
        li.data('id', photo.id)
        li.toggleClass("removed", photo.action === "D")
        li.toggleClass("regenerate", photo.action != null && photo.action !== "D")
        li.toggleClass("ui-selected", this._is_photo_selected(photo))
        return li
    },

    bulk_update: function() {
        var criteria = this.options.criteria
        if (this.options.selection.length > 0) {
            criteria = $.extend({}, criteria)
            criteria.photos = this.options.selection
        }
        var params = {
            criteria: criteria,
        }
        var div = $("<div/>")
        $.spud.photo_bulk_update_dialog(params, div)
    }
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
                ["albums", new link_list_output_field("Albums", "albums")],
                ["categorys", new link_list_output_field("Categories", "categorys")],
                ["place", new link_output_field("Place", "places")],
                ["persons", new link_list_output_field("People", "persons")],
                ["datetime", new datetime_output_field("Date & time")],
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
            .addClass('subject')
            .image({size: "mid", do_video: true, include_link: false})
            .appendTo(this.element)

        this._super();
    },

    _set: function(photo) {
        this.element.removeClass("error")

        var clone = $.extend({}, photo)
        clone.datetime = [ clone.datetime, clone.utc_offset ]
        this._super(clone)

        this.options.obj = photo
        this.options.obj_id = photo.id
        this.img.image("set", photo)
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

    _setup_menu: function(menu) {
        this._super(menu)

        var mythis = this
        menu.append(
            $("<li/>")
                .text("Update")
                .on("click", function(ev) {
                    void ev
                    var instance = mythis._ol.data('object_list')
                    instance.bulk_update()
                })
        )
    },

    get_streamable_options: function() {
        var options = this._super()
        if (this._ol != null) {
            var instance = this._ol.data('object_list')
            options.object_list_options = {
                selection: instance.options.selection
            }
        }
        return options
    },

    _object_list: $.proxy($.spud.photo_list, window),
    _object_criteria: $.proxy($.spud.photo_criteria, window),
    _object_search_dialog: $.proxy($.spud.photo_search_dialog, window),
})


$.widget('spud.photo_detail_screen', $.spud.object_detail_screen, {
    _setup_menu: function(menu) {
        var mythis = this

        this._super(menu)

        this._orig = $("<li/>")
            .text("Original")
            .on("click", function(ev) {
                void ev
                if (mythis.options.obj.orig_url != null) {
                    window.open(mythis.options.obj.orig_url)
                }

            })
            .hide()
            .appendTo(menu)
    },

    _create: function() {
        this._type = "photos"
        this._type_name = "Photo"

        this._super()

        var mythis = this

        window._photo_changed.add_listener(this, function(obj) {
            if (obj.id === this.options.obj_id) {
                mythis._set(obj)
            }
        })
        window._photo_deleted.add_listener(this, function(obj_id) {
            if (obj_id === this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _get_children_criteria: function() {
        return {
            'instance': this.options.obj_id,
        }
    },

    _loaded: function(obj) {
        this._orig.toggle(obj.orig_url != null)
        this.div
            .toggleClass("removed", obj.action === "D")
            .toggleClass("regenerate", obj.action != null && obj.action !== "D")
        this._super(obj);
    },

    _photo_list_screen: null,
    _object_list: $.proxy($.spud.photo_list, window),
    _object_detail: $.proxy($.spud.photo_detail, window),
    _object_list_screen: $.proxy($.spud.photo_list_screen, window),
    _object_change_dialog: $.proxy($.spud.photo_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud.photo_delete_dialog, window),
})
