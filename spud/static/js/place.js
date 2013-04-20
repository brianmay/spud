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

$.widget('ui.place_search_dialog',  $.ui.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Place", "place", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ])],
        ]
        this.options.title = "Search places"
        this.options.description = "Please search for an place."
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
        places.do_search_results(search, 0, true, function() { mythis.close() })
    },
})


$.widget('ui.place_search_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["instance", new link_output_field("Place")],
            ["mode", new text_output_field("Mode")],
        ]
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },
})



$.widget('ui.place_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["cover_photo", new photo_output_field("Photo", get_settings().view_size)],
            ["address", new text_output_field("Address")],
            ["address2", new text_output_field("Address(ctd)")],
            ["city", new text_output_field("City")],
            ["state", new text_output_field("State")],
            ["zip", new text_output_field("zip")],
            ["url", new html_output_field("URL")],
            ["home_of", new link_list_output_field("Home of")],
            ["work_of", new link_list_output_field("Work of")],
            ["notes", new p_output_field("notes")],
        ]
        this._super();

        if (this.options.place != null) {
            this.set(this.options.place)
        }
    },

    set: function(initial) {
        this._super(initial)
        if (url) {
            this.set_value("url", $("<a></a>")
                .attr("href", initial.url)
                .text(initial.urldesc))
        } else {
            this.set_value("url", null)
        }
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('ui.place_list', $.ui.photo_list_base, {
    _create: function() {
        this._super()
        if (this.options.places != null) {
            this.set(this.options.places)
        }
    },

    set: function(place_list) {
        var mythis = this
        this.empty()
        $.each(place_list, function(j, place) {
            var photo = place.cover_photo
            var sort=""
            if  (place.sortorder || place.sortname) {
                sort = place.sortname + " " + place.sortorder
            }
            mythis.append_photo(photo, place.title, sort, place.notes, places.a(place, null))
        })
        return this
    }
})


$.widget('ui.place_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.place != null) {
            this.set(this.options.place)
        }
    },

    set: function(place) {
        this.element.empty()

        var criteria = { place: place.id }

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
        this.add_item(places.search_form_a({ instance: place.id }))

        if (place.can_add) {
            this.add_item(places.add_a(place))
        }

        if (place.can_change) {
            this.add_item(places.change_a(place))
        }

        if (place.can_delete) {
            this.add_item(places.delete_a(place))
        }

        return this
    },
})


$.widget('ui.place_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search, this.options.results)
        }
    },

    set: function(search, results) {
        this.element.empty()
        this.add_item(places.search_form_a(search.criteria))
        return this
    },
})


$.widget('ui.place_change_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["cover_photo", new photo_select_field("Photo", false)],
            ["address", new text_input_field("Address", false)],
            ["address2", new text_input_field("Address(ctd)", false)],
            ["city", new text_input_field("City", false)],
            ["state", new text_input_field("State", false)],
            ["zip", new text_input_field("Zip", false)],
            ["url", new text_input_field("URL", false)],
            ["urldesc", new text_input_field("URL desc", false)],
            ["notes", new p_input_field("Notes", false)],
            ["parent", new ajax_select_field("Parent", "place", false)],
        ]

        this.options.title = "Change place"
        this.options.button = "Save"
        this._super();

        if (this.options.place != null) {
            this.set(this.options.place)
        }
    },

    set: function(place) {
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
            display_error
        )
    },
})


$.widget('ui.place_delete_dialog',  $.ui.form_dialog, {
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
                reload_page()
            },
            display_error
        )
    },
})


function place_doer() {
    this.type = "place"
    this.display_type = "place"
    this.display_plural = "places"
    this.list_type = "place_list"
    this.has_children = true
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

place_doer.prototype.details = function(place, div) {
    $.ui.place_details({place: place}, div)
}

place_doer.prototype.list_menu = function(search, results, div) {
    $.ui.place_list_menu({search: search, results: results}, div)
}


place_doer.prototype.menu = function(place, div) {
    $.ui.place_menu({place: place}, div)
}

place_doer.prototype.list = function(places, page, last_page, html_page, div) {
    $.ui.place_list({
        places: places,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

place_doer.prototype.search_dialog = function(criteria, dialog) {
    $.ui.place_search_dialog({ criteria: criteria }, dialog)
}

place_doer.prototype.search_details = function(criteria, dialog) {
    $.ui.place_search_details({ criteria: criteria }, dialog)
}

place_doer.prototype.change_dialog = function(place, dialog) {
    $.ui.place_change_dialog({ place: place }, dialog)
}

place_doer.prototype.delete_dialog = function(place, dialog) {
    $.ui.place_delete_dialog({ place: place }, dialog)
}

places = new place_doer()
