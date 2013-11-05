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

$.widget('spud.category_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Category", "category", false)],
            ["mode", new select_input_field("Mode",
                                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ])],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search categories"
        this.options.description = "Please search for an category."
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
        categorys.do_search_results(search, 0, function() { mythis.close() })
    },
})


$.widget('spud.category_search_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["instance", new link_output_field("Category")],
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



$.widget('spud.category_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["sort_name", new text_output_field("Sort Name")],
            ["sort_order", new text_output_field("Sort Order")],
        ]

        this.img = $("<div></div>")
            .image({size: get_settings().view_size, include_link: true})
            .appendTo(this.element)

        this._super();

        this.description = $("<p></p>")
            .appendTo(this.element)

        if (this.options.category != null) {
            this.set(this.options.category, this.options.rights)
        }
    },

    set: function(category, rights) {
        this._super(category)
        this.description.p(category.description)
        this.img.image("set", category.cover_photo)
        if (category.cover_photo != null || category.description != "") {
            this.element.removeClass("hidden")
        }
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('spud.category_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()
        if (this.options.categorys != null) {
            this.set(this.options.categorys, this.options.rights)
        }
    },

    set: function(category_list, rights) {
        var mythis = this
        this.empty()
        this.element.toggleClass("hidden", category_list.length == 0)
        $.each(category_list, function(j, category) {
            var photo = category.cover_photo
            var details = []
            if  (category.sort_order || category.sort_name) {
                details.push($("<div/>").text(category.sort_name + " " + category.sort_order))
            }
            mythis.append_photo(photo, category.title, details, category.description, categorys.a(category, null))
        })
        return this
    }
})


$.widget('spud.category_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.category != null) {
            this.set(this.options.category, this.options.rights)
        }
    },

    set: function(category, rights) {
        this.element.empty()

        var criteria = { categorys: category.id }

        this.add_item(photo_search_results_a({ criteria: criteria }, 0, "Show photos"))

        if (category.number_photos > 0) {
            this.add_item(
                $("<a href=''>Slideshow</a>")
                .attr("href", photo_search_item_url({ criteria: criteria }, 0, null))
                .on("click", function() {
                    do_photo_search_item({ criteria: criteria, photo_mode: "slideshow" }, 0, null);
                    return false;
                }))
        }

        this.add_item(photo_search_form_a(criteria))
        this.add_item(categorys.search_form_a({ instance: category.id }))

        if (rights.can_add) {
            this.add_item(categorys.add_a(category))
        }

        if (rights.can_change) {
            this.add_item(categorys.change_a(category))
        }

        if (rights.can_delete) {
            this.add_item(categorys.delete_a(category))
        }

        return this
    },
})


$.widget('spud.category_list_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.rights, this.options.search, this.options.results)
        }
    },

    set: function(rights, search, results) {
        this.element.empty()
        this.add_item(categorys.search_form_a(search.criteria))

        if (rights.can_add) {
            this.add_item(categorys.add_a(null))
        }

        return this
    },
})


$.widget('spud.category_change_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["description", new p_input_field("Description", false)],
            ["cover_photo", new photo_select_field("Photo", false)],
            ["sort_name", new text_input_field("Sort Name", false)],
            ["sort_order", new text_input_field("Sort Order", false)],
            ["parent", new ajax_select_field("Parent", "category", false)],
        ]

        this.options.title = "Change category"
        this.options.button = "Save"
        this._super();

        if (this.options.category != null) {
            this.set(this.options.category, this.options.rights)
        }
    },

    set: function(category, rights) {
        this.category_id = category.id
        if (category.id != null) {
            this.set_title("Change category")
            this.set_description("Please change category " + category.title + ".")
        } else {
            this.set_title("Add new category")
            this.set_description("Please add new category.")
        }
        return this._super(category);
    },

    _submit_values: function(values) {
        var mythis = this
        display_loading()
        categorys.load_change(
            this.category_id,
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


$.widget('spud.category_delete_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Delete category"
        this.options.button = "Delete"
        this._super();

        if (this.options.category != null) {
            this.set(this.options.category)
        }
    },

    set: function(category) {
        this.category_id = category.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            category.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this.close()
        display_loading()
        categorys.load_delete(
            this.category_id,
            function(data) {
                hide_loading()
                window.history.go(-1)
            },
            popup_error
        )
    },
})


function category_doer() {
    this.type = "category"
    this.display_type = "category"
    this.display_plural = "categories"
    this.menu_type = "category_menu"
    this.list_menu_type = "category_list_menu"
    this.details_type = "category_details"
    this.search_details_type = "category_search_details"
    this.list_type = "category_list"
    generic_doer.call(this)
}

category_doer.prototype = new generic_doer()
category_doer.constructor = category_doer

category_doer.prototype.get_criteria = function(category) {
    return { categorys: category.id }
}

category_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "category",
        parent: parent,
    }
}

category_doer.prototype.get_object = function(results) {
    return results.category
}

category_doer.prototype.get_objects = function(results) {
    return results.categorys
}

category_doer.prototype.details = function(div) {
    $.spud.category_details({}, div)
}

category_doer.prototype.list_menu = function(div) {
    $.spud.category_list_menu({}, div)
}

category_doer.prototype.menu = function(div) {
    $.spud.category_menu({}, div)
}

category_doer.prototype.list = function(div) {
    $.spud.category_list({}, div)
}

category_doer.prototype.search_dialog = function(criteria, rights, dialog) {
    $.spud.category_search_dialog({ criteria: criteria, rights: rights }, dialog)
}

category_doer.prototype.search_details = function(dialog) {
    $.spud.category_search_details({}, dialog)
}

category_doer.prototype.change_dialog = function(category, rights, dialog) {
    $.spud.category_change_dialog({ category: category, rights: rights }, dialog)
}

category_doer.prototype.delete_dialog = function(category, dialog) {
    $.spud.category_delete_dialog({ category: category }, dialog)
}

var categorys = new category_doer()
