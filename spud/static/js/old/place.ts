/// <reference path="globals.ts" />
/// <reference path="base.ts" />
/// <reference path="dialog.ts" />
/// <reference path="infobox.ts" />
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

window._place_created = new Signal()
window._place_changed = new Signal()
window._place_deleted = new Signal()

class Place extends SpudObject {
    _type_place : void
}

interface PlaceCriteria extends Criteria {
}


///////////////////////////////////////
// place dialogs
///////////////////////////////////////

$.widget('spud.place_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Place", "places", false)],
            ["mode", new SelectInputField("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new booleanInputField("Root only", false)],
        ]
        this.options.title = "Search places"
        this.options.description = "Please search for an place."
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

$.widget('spud.place_change_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new TextInputField("Title", true)],
            ["cover_photo_pk", new PhotoSelectField("Photo", false)],
            ["address", new TextInputField("Address", false)],
            ["address2", new TextInputField("Address(ctd)", false)],
            ["city", new TextInputField("City", false)],
            ["state", new TextInputField("State", false)],
            ["country", new TextInputField("Country", false)],
            ["postcode", new TextInputField("Postcode", false)],
            ["url", new TextInputField("URL", false)],
            ["urldesc", new TextInputField("URL desc", false)],
            ["notes", new PInputField("Notes", false)],
            ["parent", new AjaxSelectField("Parent", "places", false)],
        ]

        this.options.title = "Change place"
        this.options.button = "Save"

        this._type = "places"
        this._super();
    },

    _set: function(place) {
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

    _save_success: function(data) {
        if (this.obj_id != null) {
            window._place_changed.trigger(data)
        } else {
            window._place_created.trigger(data)
        }
        this._super(data);
    },
})


$.widget('spud.place_delete_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Delete place"
        this.options.button = "Delete"

        this._type = "places"
        this._super();
    },

    _set: function(place) {
        this.obj_id = place.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            place.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        void values
        this._save("DELETE", this.obj_id, {})
    },

    _save_success: function(data) {
        window._place_deleted.trigger(this.obj_id)
        this._super(data);
    }
})


///////////////////////////////////////
// place widgets
///////////////////////////////////////

$.widget('spud.place_criteria', $.spud.object_criteria, {
    _create: function() {
        this._type = "places"
        this._type_name = "Place"

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
                if (mythis.options.disabled) {
                    return false
                }
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        let viewport : PlaceDetailViewport = child.data('widget')
                        viewport.enable()
                        viewport.set(place)
                        viewport.set_loader(place_list_loader)
                        return false
                    }
                }

                var params : ObjectDetailViewportOptions = {
                    id: child_id,
                    obj: place,
                    obj_id : null,
                    object_list_loader: place_list_loader,
                }
                let viewport : PlaceDetailViewport
                viewport = new PlaceDetailViewport(params)
                child = add_viewport(viewport)
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
            ["address", new TextOutputField("Address")],
            ["address2", new TextOutputField("Address(ctd)")],
            ["city", new TextOutputField("City")],
            ["state", new TextOutputField("State")],
            ["postcode", new TextOutputField("Postcode")],
            ["country", new TextOutputField("Country")],
            // FIXME
            // ["url", new HtmlOutputField("URL")],
            ["home_of", new LinkListOutputField("Home of", "places")],
            ["work_of", new LinkListOutputField("Work of", "places")],
            ["notes", new POutputField("notes")],
            ["ascendants", new LinkListOutputField("Ascendants", "places")],
        ]
        this.loader = null

        this.img = $("<div></div>")
        $.spud.image({size: "mid", include_link: true}, this.img)
        this.img.appendTo(this.element)

        this._super();
    },

    _set: function(place) {
        this.element.removeClass("error")
        this._super(place)
        this.options.obj = place
        this.options.obj_id = place.id
        this.img.image("set", place.cover_photo)
    },
})


///////////////////////////////////////
// place viewports
///////////////////////////////////////

class PlaceListViewport extends ObjectListViewport {
    constructor(options : ObjectListViewportOptions, element? : JQuery) {
        this.type = "places"
        this.type_name = "Place"
        super(options, element)
    }

    protected object_list(options : any, element : JQuery) : void {
        $.spud.place_list(options, element)
    }

    protected object_criteria(options : any, element : JQuery) : void {
        $.spud.place_criteria(options, element)
    }

    protected object_search_dialog(options : any, element : JQuery) : void {
        $.spud.place_search_dialog(options, element)
    }
}


class PlaceDetailViewport extends ObjectDetailViewport {
    constructor(options : ObjectDetailViewportOptions, element? : JQuery) {
        this.type = "places"
        this.type_name = "Place"
        super(options, element)
    }

    create(element : JQuery) : void {
        super.create(element)

        var mythis = this

        window._place_changed.add_listener(this, function(obj : Place) {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._place_deleted.add_listener(this, function(obj_id : number) {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return {
            'place': this.options.obj_id,
            'place_descendants': true,
        }
    }

    object_list(options : any, element : JQuery) {
        $.spud.place_list(options, element)
    }

    object_detail(options : any, element : JQuery) {
        $.spud.place_detail(options, element)
    }

    protected get_object_list_viewport(options : ObjectListViewportOptions) : PlaceListViewport {
        return new PlaceListViewport(options)
    }

    object_change_dialog(options : any, element : JQuery) {
        $.spud.place_change_dialog(options, element)
    }

    object_delete_dialog(options : any, element : JQuery) {
        $.spud.place_delete_dialog(options, element)
    }
}
