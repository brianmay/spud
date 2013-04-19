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

$.widget('ui.person_search_dialog',  $.ui.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Person", "person", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"]])],
        ]
        this.options.title = "Search persons"
        this.options.description = "Please search for an person."
        this.options.button = "Search"
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },

    _submit_values: function(values) {
        criteria = {}

        var v = values.q
        if (v) { criteria.q = v }

        var v = values.instance
        if (v) { criteria.instance = v }

        var v = values.mode
        if (v) { criteria.mode = v }

        var search = {
            criteria: criteria
        }

        var mythis = this
        persons.do_search_results(search, 0, true, function() { mythis.close() })
    },
})


$.widget('ui.person_search_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["instance", new link_output_field("Person")],
            ["mode", new text_output_field("Mode")],
        ]
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },
})



$.widget('ui.person_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["cover_photo", new photo_output_field("Photo", get_settings().view_size)],
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
        this._super();

        if (this.options.person != null) {
            this.set(this.options.person)
        }
    },

    set: function(initial) {
        this._super(initial)
        if (initial.gender == "1") {
            this.set_value("gender", "Male")
        } else if (initial.gender == "2") {
            this.set_value("gender", "Female")
        }
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('ui.person_list', $.ui.photo_list_base, {
    _create: function() {
        this._super()
        if (this.options.persons != null) {
            this.set(this.options.persons)
        }
    },

    set: function(person_list) {
        var mythis = this
        this.empty()
        $.each(person_list, function(j, person) {
            var photo = person.cover_photo
            var sort=""
            if  (person.sortorder || person.sortname) {
                sort = person.sortname + " " + person.sortorder
            }
            mythis.append_photo(photo, person.title, sort, person.notes, persons.a(person, null))
        })
        return this
    }
})


$.widget('ui.person_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.person != null) {
            this.set(this.options.person)
        }
    },

    set: function(person) {
        this.element.empty()

        var criteria = { person: person.id }

        this.add_item(photo_search_results_a({ criteria: criteria }, 0, "Show photos"))

        this.add_item(
            $("<a href=''>Slideshow</a>")
            .attr("href", photo_search_item_url({ criteria: criteria }, 0, null))
            .on("click", function() {
                set_slideshow_mode()
                do_photo_search_item({ criteria: criteria }, 0, null, true);
                return false;
            }))

        this.add_item(photo_search_form_a(criteria))
        this.add_item(persons.search_form_a({ instance: person.id }))

        if (person.can_add) {
            this.add_item(persons.add_a(person))
        }

        if (person.can_change) {
            this.add_item(persons.change_a(person))
        }

        if (person.can_delete) {
            this.add_item(persons.delete_a(person))
        }

        return this
    },
})


$.widget('ui.person_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search, this.options.results)
        }
    },

    set: function(search, results) {
        this.element.empty()
        this.add_item(persons.search_form_a(search.criteria))
        return this
    },
})


$.widget('ui.person_change_dialog',  $.ui.form_dialog, {
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
            this.set(this.options.person)
        }
    },

    set: function(person) {
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
            display_error
        )
    },
})


$.widget('ui.person_delete_dialog',  $.ui.form_dialog, {
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
                reload_page()
            },
            display_error
        )
    },
})


function person_doer() {
    this.type = "person"
    this.display_type = "person"
    this.display_plural = "persons"
    this.list_type = "person_list"
    this.has_children = true
    generic_doer.call(this)
}

person_doer.prototype = new generic_doer()
person_doer.constructor = person_doer

person_doer.prototype.get_criteria = function(person) {
    return { person: person.id }
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

person_doer.prototype.details = function(person, div) {
    $.ui.person_details({person: person}, div)
}

person_doer.prototype.list_menu = function(search, results, div) {
    $.ui.person_list_menu({search: search, results: results}, div)
}


person_doer.prototype.menu = function(person, div) {
    $.ui.person_menu({person: person}, div)
}

person_doer.prototype.list = function(persons, page, last_page, html_page, div) {
    $.ui.person_list({
        persons: persons,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

person_doer.prototype.search_dialog = function(criteria, dialog) {
    $.ui.person_search_dialog({ criteria: criteria }, dialog)
}

person_doer.prototype.search_details = function(criteria, dialog) {
    $.ui.person_search_details({ criteria: criteria }, dialog)
}

person_doer.prototype.change_dialog = function(person, dialog) {
    $.ui.person_change_dialog({ person: person }, dialog)
}

person_doer.prototype.delete_dialog = function(person, dialog) {
    $.ui.person_delete_dialog({ person: person }, dialog)
}

persons = new person_doer()
