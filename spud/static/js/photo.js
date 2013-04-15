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
    elif (data.action=="D")
        return "photo-D"
    elif (data.action=="R"
            || data.action=="M"
            || data.action=="auto"
            || data.action=="90" || data.action=="180" || data.action=="270")
        return "photo-R"
    return ""
}


$.widget('ui.photo_search_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.title = "Photo search"
        this.options.description = "Please search for an photo."
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

        this.close()
        do_photo_search_results(search, 0, true)
    },
})


$.widget('ui.photo_search_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = {
            first_id: new text_output_field("id >="),
            last_id: new text_output_field("id <"),
            first_date: new datetime_output_field("date >="),
            last_date: new datetime_output_field("date <"),
            lower_rating: new text_output_field("rating >="),
            upper_rating: new text_output_field("rating <="),
            title: new text_output_field("title contains"),
            camera_make: new text_output_field("camera model"),
            camera_model: new text_output_field("camera model"),
            photographer: new link_output_field("photographer"),
            place: new link_output_field("place"),
            person: new link_list_output_field("people"),
            album: new link_list_output_field("albums"),
            category: new link_list_output_field("categories"),
            photo: new link_list_output_field("photos"),
            person_none: new text_output_field("no people"),
            place_descendants: new text_output_field("descend places"),
            album_descendants: new text_output_field("descend albums"),
            category_descendants: new text_output_field("descend categories"),
            place_none: new text_output_field("no place"),
            album_none: new text_output_field("no albums"),
            category_none: new text_output_field("no categories"),
            action: new text_output_field("action"),
            path: new text_output_field("path"),
            name: new text_output_field("name"),
        }

        this.element.addClass("infobox")
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
            this.set(this.options.photo, this.options.change_mode)
        }
    },

    set: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

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
            this.set(this.options.photo, this.options.change_mode)
        }
    },

    set: function(photo, change_mode) {
        var img = this.img

        var can_change = change_mode && photo.can_change

        img
            .image("set", photo)
            .image("resize", false)

        $(window).off("resize")
        $(window).on("resize", function() { img.image("resize", false) })

        this.summary
            .photo_summary("set", photo, change_mode)
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
        this.options.fields = {
            title: new text_output_field("Title"),
            description: new p_output_field("Description"),
            view: new p_output_field("View"),
            comment: new p_output_field("Comment"),
            name: new text_output_field("File"),
            place: new link_output_field("Place"),
            albums: new link_list_output_field("Albums"),
            categorys: new link_list_output_field("Categories"),
            utctime: new link_output_field("Date & time"),
            localtime: new link_output_field("Date & time"),
            photographer: new link_output_field("Photographer"),
            rating: new text_output_field("Rating"),
            related: new html_list_output_field("Related"),
            action: new text_output_field("Action"),
        },

        this.element
            .addClass("photo_details_block")
        this.options.title = "Photo details"

        this._super();

        if (this.options.photo != null) {
            this.set(this.options.photo, this.options.change_mode)
        }
    },

    set: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

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
        this.options.fields = {
            camera_make: new text_output_field("Camera make"),
            camera_model: new text_output_field("Camera model"),
            flash_used: new text_output_field("Flash"),
            focal_length: new text_output_field("Focal Length"),
            exposure: new text_output_field("Exposure"),
            aperture: new text_output_field("Aperture"),
            iso_equiv: new text_output_field("ISO"),
            metering_mode: new text_output_field("Metering mode"),
        }

        this.element
            .addClass("camera_details_block")
        this.options.title = "Camera details"

        this._super()

        if (this.options.photo != null) {
            this.set(this.options.photo, this.options.change_mode)
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
            this.set(this.options.photo, this.options.change_mode)
        }
    },

    set: function(photo, change_mode) {
        var style = get_photo_style(photo)

        this.element
            .removeClass("photo-D")
            .removeClass("photo-R")
            .addClass(style)
            .toggleClass("photo-selected", is_photo_selected(photo))

        this.pi.photo_image("set", photo, change_mode)
        this.pd.photo_details("set", photo, change_mode)
        this.cd.camera_details("set", photo, change_mode)
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
            this.set(this.options.photo, this.options.change_mode)
        }
    },

    set: function(photo, change_mode) {
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
            this.set(this.options.photo, this.options.seach, this.options.change_mode)
        }
    },

    set: function(photo, search, change_mode) {
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
            if (change_mode) {
                this.add_item(
                    $("<a href='#'>View</a>")
                    .on("click", function() {
                        set_normal_mode()
                        reload_page()
                        return false;
                    }))
            } else {
                this.add_item(
                    $("<a href='#'>Edit</a>")
                    .on("click", function() {
                        set_edit_mode()
                        reload_page()
                        return false;
                    }))
            }
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
            search = {}
        }

        this.add_item(photo_search_form_a(search))
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
            this.set(this.options.search, this.options.results, this.options.change_mode)
        }
    },

    _destroy: function() {
        this.ul
            .myselectable("destroy")
        this._super()
    },

    set: function(search, results, change_mode) {
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


$.widget('ui.change_photo_attribute_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.title = "Change photo "+this.options.title
        this.options.description = "Please change photo's " + this.options.title + "."
        this.options.button = "Save"
        this._super();
    },

    _submit_values: function(values) {
        this.close()
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
        this.options.fields = {
            title: new text_input_field("Title", false)
        }
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
        this.options.fields = {
            description: new p_input_field("Description", false)
        }
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
        this.options.fields = {
            view: new p_input_field("View", false)
        }
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
        this.options.fields = {
            comment: new p_input_field("Comment", false)
        }
        this._super();
    },

    _submit_values: function(values) {
        values = { set_comment: values.comment }
        this._super(values);
    },
})
