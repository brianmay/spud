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

window._category_created = new signal()
window._category_changed = new signal()
window._category_deleted = new signal()


///////////////////////////////////////
// category dialogs
///////////////////////////////////////

$.widget('spud.category_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Category", "categorys", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ],
                false)],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search categorys"
        this.options.description = "Please search for an category."
        this.options.button = "Search"
        this._super();
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

        var mythis = this
        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.category_change_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["description", new p_input_field("Description", false)],
            ["cover_photo", new photo_select_field("Photo", false)],
            ["sort_name", new text_input_field("Sort Name", false)],
            ["sort_order", new text_input_field("Sort Order", false)],
            ["parent", new ajax_select_field("Parent", "categorys", false)],
        ]

        this.options.title = "Change category"
        this.options.button = "Save"

        this._type = "categorys"
        this._super();
    },

    set: function(category) {
        this.obj_id = category.id
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
        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values)
        } else {
            this._save("POST", null, values)
        }
    },

    _done: function(data) {
        if (this.obj_id != null) {
            window._category_changed.trigger(data)
        } else {
            window._category_created.trigger(data)
        }
    },
})


$.widget('spud.category_delete_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.title = "Delete category"
        this.options.button = "Delete"

        this._type = "categorys"
        this._super();
    },

    set: function(category) {
        this.obj_id = category.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            category.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        window._category_deleted.trigger(this.obj_id)
    }
})


///////////////////////////////////////
// category widgets
///////////////////////////////////////

$.widget('spud.category_criteria', $.spud.object_criteria, {
    set: function(criteria) {
        this._type = "categorys"
        this._type_name = "Category"

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


$.widget('spud.category_list', $.spud.object_list, {
    _create: function() {
        this._type = "categorys"
        this._type_name = "Category"

        this._super()

        window._category_changed.add_listener(this, function(category) {
            var li = this._create_li(category)
            this._get_item(category.id).replaceWith(li)
        })
        window._category_deleted.add_listener(this, function(category_id) {
            this._get_item(category_id).remove()
            this._load_if_required()
        })
    },

    _category_a: function(category) {
        var mythis = this
        var category_list_loader = this.loader

        var title = category.title
        var a = $('<a/>')
            .attr('href', root_url() + "categorys/" + category.id + "/")
            .on('click', function() {
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.category_detail_screen("set", category)
                        child.category_detail_screen("set_loader", category_list_loader)
                        child.category_detail_screen("enable")
                        return false
                    }
                }

                var params = {
                    id: child_id,
                    obj: category,
                    object_list_loader: category_list_loader,
                }
                child = add_screen($.spud.category_detail_screen, params)
                return false;
            })
            .data('photo', category.cover_photo)
            .text(title)
        return a
    },

    _create_li: function(category) {
        var photo = category.cover_photo
        var details = []
        if  (category.sort_order || category.sort_name) {
            details.push($("<div/>").text(category.sort_name + " " + category.sort_order))
        }
        var a = this._category_a(category)
        var li = this._super(photo, category.title, details, category.description, a)
        li.attr('data-id', category.id)
        return li
    },

})


$.widget('spud.category_detail',  $.spud.object_detail, {
    _create: function() {
        this._type = "categorys"
        this._type_name = "Category"

        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["sort_name", new text_output_field("Sort Name")],
            ["sort_order", new text_output_field("Sort Order")],
            ["description", new p_output_field("Description")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    set: function(category) {
        this.element.removeClass("error")
        this._super(category)
        this.options.obj = category
        this.options.obj_id = category.id
        this.img.image("set", category.cover_photo)
        if (this.options.on_update) {
            this.options.on_update(category)
        }
    },
})


///////////////////////////////////////
// category screens
///////////////////////////////////////

$.widget('spud.category_list_screen', $.spud.object_list_screen, {
    _create: function() {
        this._type = "categorys"
        this._type_name = "Category"

        this._super()
    },

    _object_list: $.proxy($.spud.category_list, window),
    _object_criteria: $.proxy($.spud.category_criteria, window),
    _object_search_dialog: $.proxy($.spud.category_search_dialog, window),
})


$.widget('spud.category_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "categorys"
        this._type_name = "Category"

        this._super()

        var mythis = this

        window._category_changed.add_listener(this, function(obj) {
            if (obj.id == this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._category_deleted.add_listener(this, function(obj_id) {
            if (obj_id == this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _get_photo_criteria: function() {
        return {
            'category': this.options.obj_id,
        }
    },

    _object_list: $.proxy($.spud.category_list, window),
    _object_detail: $.proxy($.spud.category_detail, window),
    _object_list_screen: $.proxy($.spud.category_list_screen, window),
    _object_change_dialog: $.proxy($.spud.category_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud._object_delete_dialog, window),
})
