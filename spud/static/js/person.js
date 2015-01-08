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

window._person_created = new signal()
window._person_changed = new signal()
window._person_deleted = new signal()


///////////////////////////////////////
// person dialogs
///////////////////////////////////////

$.widget('spud.person_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Person", "persons", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search persons"
        this.options.description = "Please search for an person."
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

$.widget('spud.person_change_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["cover_photo_pk", new photo_select_field("Photo", false)],
                ["first_name", new text_input_field("First name", true)],
                ["middle_name", new text_input_field("Middle name", false)],
                ["last_name", new text_input_field("Last name", false)],
                ["called", new text_input_field("Called", false)],
                ["sex", new select_input_field("Sex", [ ["1", "Male"], ["2", "Female"] ], true)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["work_pk", new ajax_select_field("Work", "places", false)],
                ["home_pk", new ajax_select_field("Home", "places", false)],
                ["mother_pk", new ajax_select_field("Mother", "persons", false)],
                ["father_pk", new ajax_select_field("Father", "persons", false)],
                ["spouse_pk", new ajax_select_field("Spouse", "persons", false)],
            ]},
            {name: 'other', title: 'Other', fields: [
                ["email", new text_input_field("E-Mail", false)],
                ["dob", new date_input_field("Date of birth", false)],
                ["dod", new date_input_field("Date of death", false)],
                ["notes", new p_input_field("Notes", false)],
            ]},
        ]

        this.options.title = "Change person"
        this.options.button = "Save"

        this._type = "persons"
        this._super();
    },

    _set: function(person) {
        this.obj_id = person.id
        if (person.id != null) {
            this.set_title("Change person")
            this.set_description("Please change person " + person.title + ".")
        } else {
            this.set_title("Add new person")
            this.set_description("Please add new person.")
        }
        return this._super(person);
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
            window._person_changed.trigger(data)
        } else {
            window._person_created.trigger(data)
        }
    },
})


$.widget('spud.person_delete_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.title = "Delete person"
        this.options.button = "Delete"

        this._type = "persons"
        this._super();
    },

    _set: function(person) {
        this.obj_id = person.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            person.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        void values
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        void data
        window._person_deleted.trigger(this.obj_id)
    }
})


///////////////////////////////////////
// person widgets
///////////////////////////////////////

$.widget('spud.person_criteria', $.spud.object_criteria, {
    _create: function() {
        this._type = "persons"
        this._type_name = "Person"

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


$.widget('spud.person_list', $.spud.object_list, {
    _create: function() {
        this._type = "persons"
        this._type_name = "Person"

        this._super()

        window._person_changed.add_listener(this, function(person) {
            var li = this._create_li(person)
            this._get_item(person.id).replaceWith(li)
        })
        window._person_deleted.add_listener(this, function(person_id) {
            this._get_item(person_id).remove()
            this._load_if_required()
        })
    },

    _person_a: function(person) {
        var mythis = this
        var person_list_loader = this.loader

        var title = person.title
        var a = $('<a/>')
            .attr('href', root_url() + "persons/" + person.id + "/")
            .on('click', function() {
                if (mythis.options.disabled) {
                    return false
                }
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.person_detail_screen("set", person)
                        child.person_detail_screen("set_loader", person_list_loader)
                        child.person_detail_screen("enable")
                        return false
                    }
                }

                var params = {
                    id: child_id,
                    obj: person,
                    object_list_loader: person_list_loader,
                }
                child = add_screen($.spud.person_detail_screen, params)
                return false;
            })
            .data('photo', person.cover_photo)
            .text(title)
        return a
    },

    _create_li: function(person) {
        var photo = person.cover_photo
        var details = []
        if  (person.sort_order || person.sort_name) {
            details.push($("<div/>").text(person.sort_name + " " + person.sort_order))
        }
        var a = this._person_a(person)
        var li = this._super(photo, person.title, details, person.description, a)
        li.attr('data-id', person.id)
        return li
    },

})


$.widget('spud.person_detail',  $.spud.object_detail, {
    _create: function() {
        this._type = "persons"
        this._type_name = "Person"

        this.options.fields = [
            ["first_name", new text_output_field("First name")],
            ["middle_name", new text_output_field("Middle name")],
            ["last_name", new text_output_field("Last name")],
            ["called", new text_output_field("Called")],
            ["sex", new select_output_field("Sex", [ ["1", "Male"], ["2", "Female"] ]) ],
            ["email", new text_output_field("E-Mail")],
            ["dob", new text_output_field("Date of birth")],
            ["dod", new text_output_field("Date of death")],
            ["work", new link_output_field("Work", "places")],
            ["home", new link_output_field("Home", "places")],
            ["spouses", new link_list_output_field("Spouses", "persons")],
            ["notes", new p_output_field("Notes")],
            ["grandparents", new link_list_output_field("Grand Parents", "persons")],
            ["uncles_aunts", new link_list_output_field("Uncles and Aunts", "persons")],
            ["parents", new link_list_output_field("Parents", "persons")],
            ["siblings", new link_list_output_field("Siblings", "persons")],
            ["cousins", new link_list_output_field("Cousins", "persons")],
            ["children", new link_list_output_field("Children", "persons")],
            ["nephews_nieces", new link_list_output_field("Nephews and Nieces", "persons")],
            ["grandchildren", new link_list_output_field("Grand children", "persons")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    _set: function(person) {
        this.element.removeClass("error")
        this._super(person)
        this.options.obj = person
        this.options.obj_id = person.id
        this.img.image("set", person.cover_photo)
        if (this.options.on_update) {
            this.options.on_update(person)
        }
    },
})


///////////////////////////////////////
// person screens
///////////////////////////////////////

$.widget('spud.person_list_screen', $.spud.object_list_screen, {
    _create: function() {
        this._type = "persons"
        this._type_name = "Person"

        this._super()
    },

    _object_list: $.proxy($.spud.person_list, window),
    _object_criteria: $.proxy($.spud.person_criteria, window),
    _object_search_dialog: $.proxy($.spud.person_search_dialog, window),
})


$.widget('spud.person_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "persons"
        this._type_name = "Person"

        this._super()

        var mythis = this

        window._person_changed.add_listener(this, function(obj) {
            if (obj.id === this.options.obj_id) {
                mythis._set(obj)
            }
        })
        window._person_deleted.add_listener(this, function(obj_id) {
            if (obj_id === this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _get_photo_criteria: function() {
        return {
            'person': this.options.obj_id,
        }
    },

    _object_list: $.proxy($.spud.person_list, window),
    _object_detail: $.proxy($.spud.person_detail, window),
    _object_list_screen: $.proxy($.spud.person_list_screen, window),
    _object_change_dialog: $.proxy($.spud.person_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud._object_delete_dialog, window),
})
