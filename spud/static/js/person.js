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

$.widget('spud.person_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Person", "person", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"]])],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search persons"
        this.options.description = "Please search for an person."
        this.options.button = "Search"
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria, this.options.feedback)
        }
    },

    set: function(criteria, rights) {
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

        var search = {
            criteria: criteria
        }

        var mythis = this
        persons.do_search_results(search, 0, function() { mythis.close() })
    },
})


$.widget('spud.person_search_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["instance", new link_output_field("Person")],
            ["mode", new text_output_field("Mode")],
            ["root_only", new boolean_output_field("Root Only")],
        ]
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria, this.options.rights)
        }
    },

    set: function(criteria, rights) {
        this._super(criteria)
    },
})



$.widget('spud.person_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["first_name", new text_output_field("First name")],
            ["middle_name", new text_output_field("Middle name")],
            ["last_name", new text_output_field("Last name")],
            ["called", new text_output_field("Called")],
            ["gender", new text_output_field("Gender")],
            ["email", new text_output_field("E-Mail")],
            ["dob", new text_output_field("Date of birth")],
            ["dod", new text_output_field("Date of death")],
            ["work", new link_output_field("Work")],
            ["home", new link_output_field("Home")],
            ["spouses", new link_list_output_field("Spouses")],
            ["notes", new p_output_field("Notes")],
            ["grandparents", new link_list_output_field("Grand Parents")],
            ["uncles_aunts", new link_list_output_field("Uncles and Aunts")],
            ["parents", new link_list_output_field("Parents")],
            ["siblings", new link_list_output_field("Siblings")],
            ["cousins", new link_list_output_field("Cousins")],
            ["children", new link_list_output_field("Children")],
            ["nephews_nieces", new link_list_output_field("Nephews and Nieces")],
            ["grandchildren", new link_list_output_field("Grand children")],
        ]

        this.img = $("<div></div>")
            .image({size: get_settings().view_size, include_link: true})
            .appendTo(this.element)

        this._super();

        if (this.options.person != null) {
            this.set(this.options.person, this.options.rights)
        }
    },

    set: function(person, rights) {
        this._super(person)
        this.img.image("set", person.cover_photo)
        if (person.gender == "1") {
            this.set_value("gender", "Male")
        } else if (person.gender == "2") {
            this.set_value("gender", "Female")
        }
        if (person.cover_photo != null) {
            this.element.removeClass("hidden")
        }
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('spud.person_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()
        if (this.options.persons != null) {
            this.set(this.options.persons, this.options.rights)
        }
    },

    set: function(person_list, rights) {
        var mythis = this
        this.empty()
        this.element.toggleClass("hidden", person_list.length == 0)
        $.each(person_list, function(j, person) {
            var photo = person.cover_photo
            var details = null
            mythis.append_photo(photo, person.title, details, person.notes, persons.a(person, null))
        })
        return this
    }
})


$.widget('spud.person_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.person != null) {
            this.set(this.options.person, this.options.rights)
        }
    },

    set: function(person, rights) {
        this.element.empty()

        var criteria = { persons: person.id }

        this.add_item(photo_search_results_a({ criteria: criteria }, 0, "Show photos"))

        if (person.number_photos > 0) {
            this.add_item(
                $("<a href=''>Slideshow</a>")
                .attr("href", photo_search_item_url({ criteria: criteria }, 0, null))
                .on("click", function() {
                    do_photo_search_item({ criteria: criteria, photo_mode: "slideshow" }, 0, null);
                    return false;
                }))
        }

        this.add_item(photo_search_form_a(criteria))
        this.add_item(persons.search_form_a({ instance: person.id }))

        if (rights.can_add) {
            this.add_item(persons.add_a(person))
        }

        if (rights.can_change) {
            this.add_item(persons.change_a(person))
        }

        if (rights.can_delete) {
            this.add_item(persons.delete_a(person))
        }

        return this
    },
})


$.widget('spud.person_list_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.rights, this.options.search, this.options.results)
        }
    },

    set: function(rights, search, results) {
        this.element.empty()
        this.add_item(persons.search_form_a(search.criteria))

        if (rights.can_add) {
            this.add_item(persons.add_a(null))
        }

        return this
    },
})


$.widget('spud.person_change_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields2 = [
        ]

        this.options.title = "Change person"
        this.options.button = "Save"
        this._super();

        var old_table = this.table

        var tabs = $("<div></div>")

        $("<ul></ul>")
            .append("<li><a href='#name'>Name</a></li>")
            .append("<li><a href='#connections'>Connections</a></li>")
            .append("<li><a href='#other'>Other</a></li>")
            .appendTo(tabs)

        var table = $("<table />")
        this.table = table

        this.add_field("cover_photo", new photo_select_field("Photo", false))
        this.add_field("first_name", new text_input_field("First name", false))
        this.add_field("middle_name", new text_input_field("Middle name", false))
        this.add_field("last_name", new text_input_field("Last name", false))
        this.add_field("called", new text_input_field("Called", false))
        this.add_field("gender", new select_input_field("Gender", [ ["1","Male"], ["2","Female"] ], true))

        $("<div id='name'></div>")
            .append(table)
            .appendTo(tabs)

        var table = $("<table />")
        this.table = table

        this.add_field("work", new ajax_select_field("Work", "place", false))
        this.add_field("home", new ajax_select_field("Home", "place", false))
        this.add_field("mother", new ajax_select_field("Mother", "person", false))
        this.add_field("father", new ajax_select_field("Father", "person", false))
        this.add_field("spouse", new ajax_select_field("Spouse", "person", false))

        $("<div id='connections'></div>")
            .append(table)
            .appendTo(tabs)

        var table = $("<table />")
        this.table = table

        this.add_field("email", new text_input_field("E-Mail", false))
        this.add_field("dob", new date_input_field("Date of birth", false))
        this.add_field("dod", new date_input_field("Date of death", false))
        this.add_field("notes", new p_input_field("Notes", false))

        $("<div id='other'></div>")
            .append(table)
            .appendTo(tabs)

        tabs.tabs()

        old_table.replaceWith(tabs)
        if (this.options.person != null) {
            this.set(this.options.person, this.options.rights)
        }
    },

    set: function(person, rights) {
        this.person_id = person.id
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
        var mythis = this
        display_loading()
        persons.load_change(
            this.person_id,
            values,
            function(data) {
                hide_loading()
                mythis.close()
                reload_page()
            },
            popup_error
        )
    },
})


$.widget('spud.person_delete_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Delete person"
        this.options.button = "Delete"
        this._super();

        if (this.options.person != null) {
            this.set(this.options.person)
        }
    },

    set: function(person) {
        this.person_id = person.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            person.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this.close()
        display_loading()
        persons.load_delete(
            this.person_id,
            function(data) {
                hide_loading()
                window.history.go(-1)
            },
            popup_error
        )
    },
})


function person_doer() {
    this.type = "person"
    this.display_type = "person"
    this.display_plural = "persons"
    this.menu_type = "person_menu"
    this.list_menu_type = "person_list_menu"
    this.details_type = "person_details"
    this.search_details_type = "person_search_details"
    this.list_type = "person_list"
    generic_doer.call(this)
    this.has_ancestors = false
}

person_doer.prototype = new generic_doer()
person_doer.constructor = person_doer

person_doer.prototype.get_criteria = function(person) {
    return { persons: person.id }
}

person_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "person",
    }
}

person_doer.prototype.get_object = function(results) {
    return results.person
}

person_doer.prototype.get_objects = function(results) {
    return results.persons
}

person_doer.prototype.details = function(div) {
    $.spud.person_details({}, div)
}

person_doer.prototype.list_menu = function(div) {
    $.spud.person_list_menu({}, div)
}

person_doer.prototype.menu = function(div) {
    $.spud.person_menu({}, div)
}

person_doer.prototype.list = function(div) {
    $.spud.person_list({}, div)
}

person_doer.prototype.search_dialog = function(criteria, rights, dialog) {
    $.spud.person_search_dialog({ criteria: criteria, rights: rights }, dialog)
}

person_doer.prototype.search_details = function(dialog) {
    $.spud.person_search_details({}, dialog)
}

person_doer.prototype.change_dialog = function(person, rights, dialog) {
    $.spud.person_change_dialog({ person: person, rights: rights }, dialog)
}

person_doer.prototype.delete_dialog = function(person, dialog) {
    $.spud.person_delete_dialog({ person: person }, dialog)
}

var persons = new person_doer()
