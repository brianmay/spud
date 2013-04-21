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

function get_photo_action(action) {
    if (action == null)
        r = "None"
    else if (action == 'D')
        r = 'delete'
    else if (action == 'S')
        r = 'regenerate size'
    else if (action == 'R')
        r = 'regenerate thumbnails'
    else if (action == 'M')
        r = 'move photo'
    else if (action == 'auto')
        r = 'rotate automatic'
    else if (action == '90')
        r = 'rotate 90 degrees clockwise'
    else if (action == '180')
        r = 'rotate 180 degrees clockwise'
    else if (action == '270')
        r = 'rotate 270 degrees clockwise'
    else
        r = 'unknown'

    return r
}


function get_photo_style(data) {
    if (data.action==null)
        return ""
    else if (data.action=="D")
        return "photo-D"
    else if (data.action=="R"
            || data.action=="M"
            || data.action=="auto"
            || data.action=="90" || data.action=="180" || data.action=="270")
        return "photo-R"
    return ""
}


$.widget('ui.photo_search_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.title = "Photo search"
        this.options.description = "Please search for a photo."
        this.options.button = "Search"
        this._super();

        var old_table = this.table

        var tabs = $("<div></div>")

        $("<ul></ul>")
            .append("<li><a href='#photo'>Photo</a></li>")
            .append("<li><a href='#connections'>Connections</a></li>")
            .append("<li><a href='#camera'>Camera</a></li>")
            .appendTo(tabs)

        var table = $("<table />")
        this.table = table

        this.add_field("first_date", new datetime_input_field("First date", false))
        this.add_field("last_date", new datetime_input_field("Last date", false))
        this.add_field("lower_rating", new integer_input_field("Upper rating", false))
        this.add_field("upper_rating", new integer_input_field("Lower rating", false))
        this.add_field("title", new text_input_field("Title", false))
        this.add_field("photographer", new ajax_select_field("Photographer", "person", false))
        this.add_field("path", new text_input_field("Path", false))
        this.add_field("name", new text_input_field("Name", false))
        this.add_field("first_id", new integer_input_field("First id", false))
        this.add_field("last_id", new integer_input_field("Last id", false))

        $("<div id='photo'></div>")
            .append(table)
            .appendTo(tabs)

        var table = $("<table />")
        this.table = table

        this.add_field("person", new ajax_select_multiple_field("People", "person", false))
        this.add_field("person_none", new boolean_input_field("No people", false))
        this.add_field("person_descendants", new boolean_input_field("Descend people", false))

        this.add_field("place", new ajax_select_field("Place", "place", false))
        this.add_field("place_descendants", new boolean_input_field("Descend places", false))
        this.add_field("place_none", new boolean_input_field("No places", false))

        this.add_field("album", new ajax_select_multiple_field("Albums", "album", false))
        this.add_field("album_descendants", new boolean_input_field("Descend albums", false))
        this.add_field("album_none", new boolean_input_field("No albums", false))

        this.add_field("category", new ajax_select_multiple_field("Categories", "category", false))
        this.add_field("category_descendants", new boolean_input_field("Descend categories", false))
        this.add_field("category_none", new boolean_input_field("No categories", false))

        $("<div id='connections'></div>")
            .append(table)
            .appendTo(tabs)

        var table = $("<table />")
        this.table = table

        this.add_field("camera_make", new text_input_field("Camera Make", false))
        this.add_field("camera_model", new text_input_field("Camera Model", false))

        $("<div id='camera'></div>")
            .append(table)
            .appendTo(tabs)

        tabs.tabs()

        old_table.replaceWith(tabs)

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },

    set: function(values) {
        if (values.photo) {
            this.photos = values.photo
        }
        this._super(values);
    },

    _submit_values: function(values) {
        var criteria = { }

        if (this.photos) {
            criteria['photo'] = this.photos
        }

        if (values.first_date) {
            criteria['first_date'] = values.first_date
        }

        if (values.last_date) {
            criteria['last_date'] = values.last_date
        }

        if (values.lower_rating) {
            criteria['lower_rating'] = values.lower_rating
        }

        if (values.upper_rating) {
            criteria['upper_rating'] = values.upper_rating
        }

        if (values.title) {
            criteria['title'] = values.title
        }

        if (values.photographer) {
            criteria['photographer'] = values.photographer
        }

        if (values.person.length > 0) {
            criteria['person'] = values.person.join(".")
        }

        if (values.person_none) {
            criteria['person_none'] = "true"
        }

        if (values.person_descendants) {
            criteria['person_descendants'] = "true"
        }

        if (values.place) {
            criteria['place'] = values.place
        }

        if (values.place_descendants) {
            criteria['place_descendants'] = "true"
        }

        if (values.place_none) {
            criteria['place_none'] = "true"
        }

        if (values.album.length > 0) {
            criteria['album'] = values.album.join(".")
        }

        if (values.album_descendants) {
            criteria['album_descendants'] = "true"
        }

        if (values.album_none) {
            criteria['album_none'] = "true"
        }

        if (values.category.length > 0) {
            criteria['category'] = values.category.join(".")
        }

        if (values.category_descendants) {
            criteria['category_descendants'] = "true"
        }

        if (values.category_none) {
            criteria['category_none'] = "true"
        }

        if (values.path) {
            criteria['path'] = values.path
        }

        if (values.name) {
            criteria['name'] = values.name
        }

        if (values.camera_make) {
            criteria['camera_make'] = values.camera_make
        }

        if (values.camera_model) {
            criteria['camera_model'] = values.camera_model
        }

        if (values.first_id) {
            criteria['first_id'] = values.first_id
        }

        if (values.last_id) {
            criteria['last_id'] = values.last_id
        }

        var search = {
            criteria: criteria,
        }

        var mythis = this
        do_photo_search_results(search, 0, true, function() { mythis.close() })
    },
})


$.widget('ui.photo_search_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["first_id", new text_output_field("id >=")],
            ["last_id", new text_output_field("id <")],
            ["first_date", new datetime_output_field("date >=")],
            ["last_date", new datetime_output_field("date <")],
            ["lower_rating", new text_output_field("rating >=")],
            ["upper_rating", new text_output_field("rating <=")],
            ["title", new text_output_field("title contains")],
            ["camera_make", new text_output_field("camera model")],
            ["camera_model", new text_output_field("camera model")],
            ["photographer", new link_output_field("photographer")],
            ["place", new link_output_field("place")],
            ["person", new link_list_output_field("people")],
            ["album", new link_list_output_field("albums")],
            ["category", new link_list_output_field("categories")],
            ["photo", new link_list_output_field("photos")],
            ["person_none", new text_output_field("no people")],
            ["person_descendants", new text_output_field("descend people")],
            ["place_descendants", new text_output_field("descend places")],
            ["album_descendants", new text_output_field("descend albums")],
            ["category_descendants", new text_output_field("descend categories")],
            ["place_none", new text_output_field("no place")],
            ["album_none", new text_output_field("no albums")],
            ["category_none", new text_output_field("no categories")],
            ["action", new text_output_field("action")],
            ["path", new text_output_field("path")],
            ["name", new text_output_field("name")],
        ]

        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },
})


$.widget('ui.photo_summary',  {
    _create: function() {
        this.element
            .addClass("photo_summary")

        this._super();

        this.title = $("<div class='title'></div>")
            .appendTo(this.element)

        this.persons = $("<div class='persons'></div>")
            .appendTo(this.element)

        this.description = $("<div class='description'></div>")
            .appendTo(this.element)

        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },

    set: function(photo) {
        var can_change = is_edit_mode() && photo.can_change

        this.title
            .empty()
            .text(photo.title)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_title, "[edit title]"))

        this.persons
            .append_csv($.map(photo.persons, function(person) { return persons.a(person); } ))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_persons, "[edit people]"))

        this.description
            .empty()
            .p(photo.description)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_description, "[edit description]"))
    },

    _destroy: function() {
        this.element
            .removeClass("photo_summary")
            .empty()
        this._super()
    },
})


$.widget('ui.photo_image',  {
    _create: function() {
        this.element
            .addClass("photo_image_block")

        this._super();

        this.img = $("<img id='photo' />")
            .image({ size: get_settings().view_size })
            .appendTo(this.element)

        this.summary = $("<div></div>")
            .photo_summary()
            .appendTo(this.element)

        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },

    set: function(photo) {
        var img = this.img

        var can_change = is_edit_mode() && photo.can_change

        img
            .image("set", photo)
            .image("resize", false)

        $(window).off("resize")
        $(window).on("resize", function() { img.image("resize", false) })

        this.summary
            .photo_summary("set", photo)
    },

    _destroy: function() {
        $(window).off("resize")
        this.img.image("destroy")
        this.summary.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('ui.photo_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["description", new p_output_field("Description")],
            ["view", new p_output_field("View")],
            ["comment", new p_output_field("Comment")],
            ["name", new text_output_field("File")],
            ["place", new link_output_field("Place")],
            ["albums", new link_list_output_field("Albums")],
            ["categorys", new link_list_output_field("Categories")],
            ["utctime", new link_output_field("Date & time")],
            ["localtime", new link_output_field("Date & time")],
            ["photographer", new link_output_field("Photographer")],
            ["rating", new text_output_field("Rating")],
            ["related", new html_list_output_field("Related")],
            ["action", new text_output_field("Action")],
        ],

        this.element
            .addClass("photo_details_block")
        this.options.title = "Photo details"

        this._super();
        this.element.removeClass("infobox")

        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },

    set: function(photo) {
        var can_change = is_edit_mode() && photo.can_change

        this.set_edit_value(
            "title", photo.title,
            can_change, photo_change_a(photo, display_change_photo_title, "[edit]")
        )

        this.set_edit_value(
            "description", photo.description,
            can_change, photo_change_a(photo, display_change_photo_description, "[edit]")
        )

        this.set_edit_value(
            "view", photo.view,
            can_change, photo_change_a(photo, display_change_photo_view, "[edit]")
        )

        this.set_edit_value(
            "comment", photo.comment,
            can_change, photo_change_a(photo, display_change_photo_comment, "[edit]")
        )

        this.set_value("name", photo.name)

        this.set_edit_value(
            "place", photo.place,
            can_change, photo_change_a(photo, display_change_photo_place, "[edit]")
        )

        this.set_edit_value(
            "albums", photo.albums,
            can_change, photo_change_a(photo, display_change_photo_albums, "[edit]")
        )

        this.set_edit_value(
            "categorys", photo.categorys,
            can_change, photo_change_a(photo, display_change_photo_categorys, "[edit]")
        )

        this.set_edit_value(
            "utctime", photo.utctime,
            can_change, photo_change_a(photo, display_change_photo_datetime, "[edit]")
        )

        this.set_edit_value(
            "localtime", photo.localtime,
            can_change, photo_change_a(photo, display_change_photo_datetime, "[edit]")
        )

        this.set_edit_value(
            "photographer", photo.photographer,
            can_change, photo_change_a(photo, display_change_photo_photographer, "[edit]")
        )

        this.set_value("rating", photo.rating ? photo.rating : "None")

        this.set_edit_value(
            "related", $.map(photo.related, function(r) {
                return [[
                    photo_a(r.photo, r.title),
                    can_change ? photo_relation_change_a({ id: r.id }, "[edit]") : null,
                    can_change ? photo_relation_delete_a({ id: r.id }, "[del]") : null,
                ]]
             }),
             can_change, photo_relation_add_a(photo, "[add]")
        )

        this.set_edit_value(
            "action", get_photo_action(photo.action),
            can_change, photo_change_a(photo, display_change_photo_action, "[edit]")
        )
        return this
    },

})


$.widget('ui.camera_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["camera_make", new text_output_field("Camera make")],
            ["camera_model", new text_output_field("Camera model")],
            ["flash_used", new text_output_field("Flash")],
            ["focal_length", new text_output_field("Focal Length")],
            ["exposure", new text_output_field("Exposure")],
            ["aperture", new text_output_field("Aperture")],
            ["iso_equiv", new text_output_field("ISO")],
            ["metering_mode", new text_output_field("Metering mode")],
        ]

        this.element
            .addClass("camera_details_block")
        this.options.title = "Camera details"

        this._super()
        this.element.removeClass("infobox")

        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },
})


$.widget('ui.photo_article',  {
    _create: function() {
        this.element
                .addClass("photo_article")

        this.pi = $("<div class='photo_block' />")
            .photo_image()
            .appendTo(this.element)

        this.pd = $("<div class='photo_block' />")
            .photo_details()
            .appendTo(this.element)

        this.cd = $("<div class='photo_block' />")
            .camera_details()
            .appendTo(this.element)

        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },

    set: function(photo) {
        var style = get_photo_style(photo)

        this.element
            .removeClass("photo-D")
            .removeClass("photo-R")
            .addClass(style)
            .toggleClass("photo-selected", is_photo_selected(photo))

        this.pi.photo_image("set", photo)
        this.pd.photo_details("set", photo)
        this.cd.camera_details("set", photo)
        return this
    },

    _destroy: function() {
        this.pi.photo_image("destroy")
        this.pd.photo_details("destroy")
        this.cd.camera_details("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('ui.photo_slideshow',  {
    _create: function() {
        this.element
                .addClass("slideshow")

        this.pd = $("<div class='photo'></div>")
            .appendTo(this.element)

        this.img = $("<img />")
            .image({size: get_settings().click_size})
            .appendTo(this.pd)

        if (this.options.photo != null) {
            this.set(this.options.photo, this.options)
        }
    },

    set: function(photo) {
        var style = get_photo_style(photo)

        this.pd
            .removeClass("photo-D")
            .removeClass("photo-R")
            .addClass(style)
            .toggleClass("photo-selected", is_photo_selected(photo))

        var img = this.img
        img
            .image("set", photo)
            .image("resize", true)

        $(window).off("resize")
        $(window).on("resize", function() { img.image("resize", true) })
        return this
    },

    _destroy: function() {
        $(window).off("resize")
        this.img.image("destroy")
        this.element
            .removeAttr("slideshow")
            .empty()
        this._super()
    },
})


$.widget('ui.photo_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.photo != null) {
            this.set(this.options.photo, this.options.search)
        }
    },

    set: function(photo, search) {
        this.element.empty()

        var photo_mode = get_photo_mode()
        if (photo_mode != "slideshow") {
            this.add_item(
                $("<a href='#'>Slideshow</a>")
                .on("click", function() {
                    set_slideshow_mode()
                    reload_page()
                    return false;
                }))
        }

        if (photo_mode != "article") {
            this.add_item(
                $("<a href='#'>Article</a>")
                .on("click", function() {
                    set_article_mode()
                    reload_page()
                    return false;
                }))
        }

        if (photo.can_change) {
            this.add_item(
                $("<a href='#'>Change photo</a>")
                .on("click", function() {
                    display_change_photo(photo, { photos: photo.id }, 1)
                    return false;
                }))
        }

        if (is_photo_selected(photo)) {
            this.add_item(
                $("<a href='#'>Unselect</a>")
                .on("click", function() {
                    del_selection(photo)
                    reload_page()
                    return false;
                }))
        } else {
            this.add_item(
                $("<a href='#'>Select</a>")
                .on("click", function() {
                    add_selection(photo)
                    reload_page()
                    return false;
                }))
        }

        if (search == null) {
            criteria = { }
        } else {
            criteria = search.criteria
        }

        this.add_item(photo_search_form_a(criteria))

        if (photo.can_add_feedback) {
            this.add_item(feedbacks.add_a(photo, null, null))
        }

        if (photo.orig != null) {
            this.add_item($("<a>Original photo</a>")
                .attr("href", photo.orig)
                .on("click", function() { parent.location=photo.orig; return false; })
            )
        }
        return this
    },
})


$.widget('ui.photo_list', $.ui.photo_list_base, {
    _create: function() {
        this._super()
        this.ul.myselectable({
            filter: "li",
            selected: function( event, ui ) {
                add_selection( $(ui.selected).data('photo') ); },
            unselected: function( event, ui ) {
                del_selection( $(ui.unselected).data('photo') ); },
        })
        if (this.options.search != null && this.options.results != null) {
            this.set(this.options.search, this.options.results)
        }
    },

    _destroy: function() {
        this.ul
            .myselectable("destroy")
        this._super()
    },

    set: function(search, results) {
        var mythis = this
        this.empty()
        $.each(results.photos, function(j, photo) {
            var n = results.first + Number(j)
            mythis.append_photo(
                photo, photo.title, photo.localtime.date + " " + photo.localtime.time,
                photo.description, photo_search_item_a(search, n, photo))
                .data("photo", photo)
                .toggleClass("ui-selected", is_photo_selected(photo))
        })
        return this
    }
})


$.widget('ui.photo_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search, this.options.results)
        }
    },

    set: function(search, results) {
        this.element.empty()

        this.add_item(
            $("<a href=''>Slideshow</a>")
            .attr("href", photo_search_item_url(search, 0, null))
            .on("click", function() {
                set_slideshow_mode()
                do_photo_search_item(search, 0, null, true);
                return false;
            }))

        if (results.can_change) {
            this.add_item(
                $("<a href='#'>Change listed photos</a>")
                .on("click", function() {
                    display_change_photo(null, search.criteria, results.number_results)
                    return false;
                }))
        }

        this.add_item(photo_search_form_a(search.criteria))
        return this
    },
})

$.widget('ui.change_photo_attribute_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.description = "Please change the " + this.options.title + ". " +
            this.options.number_results + " photos will be altered."
        this.options.title = "Change photo "+this.options.title
        this.options.button = "Save"
        this._super();
    },

    _submit_values: function(values) {
        var mythis = this
        display_loading()
        load_photo_search_change(
            this.options.criteria,
            values,
            this.options.number_results,
            function(data) {
                hide_loading()
                mythis.close()
                reload_page()
            },

            display_error
        )
    },
})



$.widget('ui.change_photo_title_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "title"
        this.options.fields = [
            ["title", new text_input_field("Title", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_title: values.title }
        this._super(values);
    },
})


$.widget('ui.change_photo_description_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "description"
        this.options.fields = [
            ["description", new p_input_field("Description", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_description: values.description }
        this._super(values);
    },
})

$.widget('ui.change_photo_view_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "view"
        this.options.fields = [
            ["view", new p_input_field("View", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_view: values.view }
        this._super(values);
    },
})


$.widget('ui.change_photo_comment_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "comment"
        this.options.fields = [
            ["comment", new p_input_field("Comment", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_comment: values.comment }
        this._super(values);
    },
})


$.widget('ui.change_photo_datetime_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "datetime"
        this.options.fields = [
            ["localtime", new datetime_input_field("date/time", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_datetime: values.datetime }
        this._super(values);
    },
})


$.widget('ui.change_photo_action_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "action"
        this.options.fields = [
            ["action", new select_input_field("Action", [
                ["", "no action"],
                ["D", "delete"],
                ["S", "regenerate size"],
                ["R", "regenerate thumbnails"],
                ["M", "move photo"],
                ["auto", "rotate automatic"],
                ["90", "rotate 90 degrees clockwise"],
                ["180", "rotate 180 degrees clockwise"],
                ["270", "rotate 270 degrees clockwise"],
            ], false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_action: values.action }
        this._super(values);
    },
})


$.widget('ui.change_photo_photographer_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "photographer"
        this.options.fields = [
            ["photographer", new ajax_select_field("Photographer", "person", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_photographer: values.photographer }
        this._super(values);
    },
})


$.widget('ui.change_photo_place_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "place"
        this.options.fields = [
            ["place", new ajax_select_field("Place", "place", false)],
        ]
        this._super();
    },

    _submit_values: function(values) {
        values = { set_place: values.place }
        this._super(values);
    },
})


$.widget('ui.change_photo_albums_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "album"
        var initial = this.options.initial
        delete this.options.initial
        this._super();
        this.set(initial)
    },

    set: function(values) {
        if (values != null) {
            this.add_field("albums", new ajax_select_multiple_field("Albums", "album", false))
            this._super(values);
        } else {
            this.add_field("add_albums", new ajax_select_multiple_field("Add albums", "album", false))
            this.add_field("del_albums", new ajax_select_multiple_field("Remove albums", "album", false))
            // do not call super as add_albums and del_albums don't exist in values
        }
    },

    _submit_values: function(values) {
        if (values.albums != null) {
            values = { set_albums: values.albums.join(".") }
        } else {
            var seen = {}
            var dups = false
            $.each(values.add_albums, function(j, id) { seen[id] = true; })
            $.each(values.del_albums, function(j, id) { if (seen[id]) dups = true; })
            if (dups) {
                this.set_error("del_albums", "Trying to add and delete the same album")
                return
            }

            values = {
                add_albums: values.add_albums.join("."),
                del_albums: values.del_albums.join("."),
            }
        }
        this._super(values);
    },
})


$.widget('ui.change_photo_categorys_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "category"
        var initial = this.options.initial
        delete this.options.initial
        this._super();
        this.set(initial)
    },

    set: function(values) {
        if (values != null) {
            this.add_field("categorys", new ajax_select_multiple_field("Categories", "category", false))
            this._super(values);
        } else {
            this.add_field("add_categorys", new ajax_select_multiple_field("Add categories", "category", false))
            this.add_field("del_categorys", new ajax_select_multiple_field("Remove categories", "category", false))
            // do not call super as add_categorys and del_categorys don't exist in values
        }
    },

    _submit_values: function(values) {
        if (values.categorys != null) {
            values = { set_categorys: values.categorys.join(".") }
        } else {
            var seen = {}
            var dups = false
            $.each(values.add_categorys, function(j, id) { seen[id] = true; })
            $.each(values.del_categorys, function(j, id) { if (seen[id]) dups = true; })
            if (dups) {
                this.set_error("del_categorys", "Trying to add and delete the same category")
                return
            }

            values = {
                add_categorys: values.add_categorys.join("."),
                del_categorys: values.del_categorys.join("."),
            }
        }
        this._super(values);
    },
})

$.widget('ui.change_photo_persons_dialog',  $.ui.change_photo_attribute_dialog, {
    _create: function() {
        this.options.title = "person"
        var initial = this.options.initial
        delete this.options.initial
        this._super();
        this.set(initial)
    },

    set: function(values) {
        if (values != null) {
            this.description.append(" You may change the order of the people by moving them around below.")
            this.add_field("persons", new ajax_select_sorted_field("People", "person", false))
            this._super(values);
        } else {
            this.add_field("add_persons", new ajax_select_multiple_field("Add people", "person", false))
            this.add_field("del_persons", new ajax_select_multiple_field("Remove people", "person", false))
            // do not call super as add_persons and del_persons don't exist in values
        }
    },

    _submit_values: function(values) {
        if (values.persons != null) {
            values = { set_persons: values.persons.join(".") }
        } else {
            var seen = {}
            var dups = false
            $.each(values.add_persons, function(j, id) { seen[id] = true; })
            $.each(values.del_persons, function(j, id) { if (seen[id]) dups = true; })
            if (dups) {
                this.set_error("del_persons", "Trying to add and delete the same person")
                return
            }

            values = {
                add_persons: values.add_persons.join("."),
                del_persons: values.del_persons.join("."),
            }
        }
        this._super(values);
    },
})

$.widget('ui.change_photo_relation_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["photo_1", new photo_select_field("Photo", true)],
            ["desc_1", new text_input_field("Description", true)],
            ["photo_2", new photo_select_field("Photo", true)],
            ["desc_2", new text_input_field("Description", true)],
        ]

        this.options.title = "Change relationship"
        this.options.button = "Save"
        this._super();
    },

    set: function(initial) {
        this.initial_id = initial.id
        if (initial != null) {
            this.set_title("Change relationship")
            this.set_description("Change relationship")
        } else {
            this.set_title("Add new relationship")
            this.set_description("Please add new relationship.")
        }
        return this._super(initial);
    },

    _submit_values: function(values) {
        var mythis = this
        display_loading()
        load_photo_relation_change(
            this.initial_id,
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


$.widget('ui.delete_photo_relation_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.title = "Delete relationship"
        this.options.button = "Delete"
        this._super();
    },

    set: function(initial) {
        this.initial_id = initial.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            "the relationship between " + initial.photo_1.title + " and " + initial.photo_2.title +
            "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        var mythis = this
        this.close()
        display_loading()
        load_photo_relation_delete(
            this.initial_id,
            function(data) {
                hide_loading()
                mythis.close()
                reload_page()
            },
            display_error
        )
    },
})


$.widget('ui.change_photos_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["action", new quick_select_field("Action")],
        ]
        this.options.description = "Please specify the attribute to change. " +
            this.options.number_results + " photos will be altered."
        this.options.title = "Change photo"
        this.options.button = "Go"
        this._super();
    },

    _submit_values: function(values) {
        var mythis = this
        $.each(operations, function(j, op) {
            if (op.pk == values.action) {
                mythis.close()
                op.fn(
                    mythis.options.photo,
                    mythis.options.criteria,
                    mythis.options.number_results
                )
                return false
            }
        })
    },
})

