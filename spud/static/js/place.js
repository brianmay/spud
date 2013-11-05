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

$.widget('spud.place_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Place", "place", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ])],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search places"
        this.options.description = "Please search for an place."
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
        places.do_search_results(search, 0, function() { mythis.close() })
    },
})


$.widget('spud.place_search_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["instance", new link_output_field("Place")],
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



$.widget('spud.place_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["address", new text_output_field("Address")],
            ["address2", new text_output_field("Address(ctd)")],
            ["city", new text_output_field("City")],
            ["state", new text_output_field("State")],
            ["postcode", new text_output_field("Postcode")],
            ["country", new text_output_field("Country")],
            ["url", new html_output_field("URL")],
            ["home_of", new link_list_output_field("Home of")],
            ["work_of", new link_list_output_field("Work of")],
            ["notes", new p_output_field("notes")],
        ]

        this.img = $("<div></div>")
            .image({size: get_settings().view_size, include_link: true})
            .appendTo(this.element)

        this._super();

        if (this.options.place != null) {
            this.set(this.options.place, this.options.rights)
        }
    },

    set: function(place, rights) {
        this.img.image("set", place.cover_photo)
        this._super(place)
        if (place.url) {
            this.set_value("url", $("<a></a>")
                .attr("href", place.url)
                .text(place.urldesc))
        } else {
            this.set_value("url", null)
        }
        if (place.cover_photo != null) {
            this.element.removeClass("hidden")
        }
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('spud.place_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()
        if (this.options.places != null) {
            this.set(this.options.places, this.options.rights)
        }
    },

    set: function(place_list, rights) {
        var mythis = this
        this.empty()
        this.element.toggleClass("hidden", place_list.length == 0)
        $.each(place_list, function(j, place) {
            var photo = place.cover_photo
            var details = []
            if  (place.sort_order || place.sort_name) {
                details.push($("<div/>").text(place.sort_name + " " + place.sort_order))
            }
            mythis.append_photo(photo, place.title, details, place.notes, places.a(place, null))
        })
        return this
    }
})


$.widget('spud.place_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.place != null) {
            this.set(this.options.place, this.options.rights)
        }
    },

    set: function(place, rights) {
        this.element.empty()

        var criteria = { place: place.id }

        this.add_item(photo_search_results_a({ criteria: criteria }, 0, "Show photos"))

        if (place.number_photos > 0) {
            this.add_item(
                $("<a href=''>Slideshow</a>")
                .attr("href", photo_search_item_url({ criteria: criteria }, 0, null))
                .on("click", function() {
                    do_photo_search_item({ criteria: criteria, photo_mode: "slideshow" }, 0, null);
                    return false;
                }))
        }

        this.add_item(photo_search_form_a(criteria))
        this.add_item(places.search_form_a({ instance: place.id }))

        if (rights.can_add) {
            this.add_item(places.add_a(place))
        }

        if (rights.can_change) {
            this.add_item(places.change_a(place))
        }

        if (rights.can_delete) {
            this.add_item(places.delete_a(place))
        }

        return this
    },
})


$.widget('spud.place_list_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.rights, this.options.search, this.options.results)
        }
    },

    set: function(rights, search, results) {
        this.element.empty()
        this.add_item(places.search_form_a(search.criteria))

        if (rights.can_add) {
            this.add_item(places.add_a(null))
        }

        return this
    },
})


$.widget('spud.place_change_dialog',  $.spud.form_dialog, {
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
            ["parent", new ajax_select_field("Parent", "place", false)],
        ]

        this.options.title = "Change place"
        this.options.button = "Save"
        this._super();

        if (this.options.place != null) {
            this.set(this.options.place, this.options.rights)
        }
    },

    set: function(place, rights) {
        this.place_id = place.id
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
        var mythis = this
        display_loading()
        places.load_change(
            this.place_id,
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


$.widget('spud.place_delete_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Delete place"
        this.options.button = "Delete"
        this._super();

        if (this.options.place != null) {
            this.set(this.options.place)
        }
    },

    set: function(place) {
        this.place_id = place.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            place.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this.close()
        display_loading()
        places.load_delete(
            this.place_id,
            function(data) {
                hide_loading()
                window.history.go(-1)
            },
            popup_error
        )
    },
})


function place_doer() {
    this.type = "place"
    this.display_type = "place"
    this.display_plural = "places"
    this.menu_type = "place_menu"
    this.list_menu_type = "place_list_menu"
    this.details_type = "place_details"
    this.search_details_type = "place_search_details"
    this.list_type = "place_list"
    generic_doer.call(this)
}

place_doer.prototype = new generic_doer()
place_doer.constructor = place_doer

place_doer.prototype.get_criteria = function(place) {
    return { place: place.id }
}

place_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "place",
        parent: parent,
    }
}

place_doer.prototype.get_object = function(results) {
    return results.place
}

place_doer.prototype.get_objects = function(results) {
    return results.places
}

place_doer.prototype.details = function(div) {
    $.spud.place_details({}, div)
}

place_doer.prototype.list_menu = function(div) {
    $.spud.place_list_menu({}, div)
}

place_doer.prototype.menu = function(div) {
    $.spud.place_menu({}, div)
}

place_doer.prototype.list = function(div) {
    $.spud.place_list({}, div)
}

place_doer.prototype.search_dialog = function(criteria, rights, dialog) {
    $.spud.place_search_dialog({ criteria: criteria, rights: rights }, dialog)
}

place_doer.prototype.search_details = function(dialog) {
    $.spud.place_search_details({}, dialog)
}

place_doer.prototype.change_dialog = function(place, rights, dialog) {
    $.spud.place_change_dialog({ place: place, rights: rights }, dialog)
}

place_doer.prototype.delete_dialog = function(place, dialog) {
    $.spud.place_delete_dialog({ place: place }, dialog)
}

var places = new place_doer()
