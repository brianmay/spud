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


$.widget('ui.image', {
    _create: function() {
        if (this.options.photo != null) {
            this.load(this.options.photo)
        }
    },

    _destroy: function() {
        this.element
            .removeClass("photo-D")
            .removeClass("photo-R")
            .removeAttr("id")
            .removeAttr("class")
            .removeAttr("alt")
            .removeAttr("width")
            .removeAttr("height")
            .attr("src", media_url("img/none.jpg"))
    },

    load: function(photo) {
        var image = null
        if (photo != null) {
            var image = photo.thumb[this.options.size]
        }

        if (image != null) {
            this.element
                .attr('id', photo)
                .attr('src', image.url)
                .attr('width', image.width)
                .attr('height', image.height)
                .attr('alt', photo.title)
            this.width = image.width
            this.height = image.height
        } else {
            this.element
                .removeAttr("id")
                .removeAttr("class")
                .removeAttr("alt")
                .removeAttr("width")
                .removeAttr("height")
                .attr("src", media_url("img/none.jpg"))
            this.width = null
            this.height = null
        }
   },

   resize: function(enlarge) {
        var width = this.width
        var height = this.height

        var img = this.element
        var aspect = width/height

        var innerWidth = window.innerWidth
        var innerHeight = window.innerHeight

        if (enlarge) {
            width = innerWidth
            height = width / aspect
        }

        if (width > innerWidth) {
            width = innerWidth
            height = width / aspect
        }

        if (height > innerHeight) {
            height = innerHeight
            width = height * aspect
        }

        if (enlarge) {
            img.css("padding-top", (window.innerHeight-height)/2 + "px")
            img.css("padding-bottom", (window.innerHeight-height)/2 + "px")
            img.css("padding-left", (window.innerWidth-width)/2 + "px")
            img.css("padding-right", (window.innerWidth-width)/2 + "px")
        }
        img.attr('width', width)
        img.attr('height', height)
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
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

        this.title
            .empty()
            .text(photo.title)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_title, "[edit title]"))

        this.persons
            .append_csv($.map(photo.persons, function(person) { return person_a(person); } ))
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
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var img = this.img

        var can_change = change_mode && photo.can_change

        img
            .image("load", photo)
            .image("resize", false)

        $(window).off("resize")
        $(window).on("resize", function() { img.image("resize", false) })

        this.summary
            .photo_summary("load", photo, change_mode)
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
    fields: {
        title: new text_output_field("Title"),
        description: new p_output_field("Description"),
        view: new p_output_field("View"),
        comment: new p_output_field("Comment"),
        name: new text_output_field("File"),
        place: new html_output_field("Place"),
        albums: new html_list_output_field("Albums"),
        categorys: new html_list_output_field("Categories"),
        datetime: new html_output_field("Date & time"),
        photographer: new html_output_field("Photographer"),
        rating: new text_output_field("Rating"),
        related: new text_output_field("Related"),
        action: new text_output_field("Action"),
    },

    _create: function() {
        this.element
            .addClass("photo_details_block")
        this.options.title = "Photo details"

        this._super();

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

        this.set_edit_field(
            "title", photo.title,
            can_change, photo_change_a(photo, display_change_photo_title, "[edit]")
        )

        this.set_edit_field(
            "description", photo.description,
            can_change, photo_change_a(photo, display_change_photo_description, "[edit]")
        )

        this.set_edit_field(
            "view", photo.view,
            can_change, photo_change_a(photo, display_change_photo_view, "[edit]")
        )

        this.set_edit_field(
            "comment", photo.comment,
            can_change, photo_change_a(photo, display_change_photo_comment, "[edit]")
        )

        this.set_field("name", photo.name)

        this.set_edit_field(
            "place", place_a(photo.place),
            can_change, photo_change_a(photo, display_change_photo_place, "[edit]")
        )

        this.set_edit_field(
            "albums", $.map(photo.albums, function(album) { return album_a(album); } ),
            can_change, photo_change_a(photo, display_change_photo_albums, "[edit]")
        )

        this.set_edit_field(
            "categorys", $.map(photo.categorys, function(category) { return category_a(category); } ),
            can_change, photo_change_a(photo, display_change_photo_categorys, "[edit]")
        )

        this.set_edit_field(
            "datetime", [ datetime_a(photo.utctime), " ", "<br />", datetime_a(photo.localtime)],
            can_change, photo_change_a(photo, display_change_photo_datetime, "[edit]")
        )

        this.set_edit_field(
            "photographer", person_a(photo.photographer),
            can_change, photo_change_a(photo, display_change_photo_photographer, "[edit]")
        )

        this.set_field("rating", photo.rating ? photo.rating : "None")

        this.set_edit_field(
            "related", $.map(photo.related, function(r) {
                return [[
                    photo_a(r.photo, r.title),
                    can_change ? photo_relation_change_a({ id: r.id }, "[edit]") : null,
                    can_change ? photo_relation_delete_a({ id: r.id }, "[del]") : null,
                ]]
             }),
             can_change, photo_relation_add_a(photo, "[add]")
        )

        this.set_edit_field(
            "action", get_photo_action(photo.action),
            can_change, photo_change_a(photo, display_change_photo_action, "[edit]")
        )
        return this
    },

})


$.widget('ui.camera_details',  $.ui.infobox, {
    fields: {
        camera_make: new text_output_field("Camera make"),
        camera_model: new text_output_field("Camera model"),
        flash_used: new text_output_field("Flash"),
        focal_length: new text_output_field("Focal Length"),
        exposure: new text_output_field("Exposure"),
        aperture: new text_output_field("Aperture"),
        iso_equiv: new text_output_field("ISO"),
        metering_mode: new text_output_field("Metering mode"),
    },

    _create: function() {
        this.element
            .addClass("camera_details_block")
        this.options.title = "Camera details"

        this._super()

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

        this.set_field("camera_make", photo.camera_make)
        this.set_field("camera_model", photo.camera_model)
        this.set_field("flash_used", photo.flash_used)
        this.set_field("focal_length", photo.focal_length)
        this.set_field("exposure", photo.exposure)
        this.set_field("aperture", photo.aperture)
        this.set_field("iso_equiv", photo.iso_equiv)
        this.set_field("metering_mode", photo.metering_mode)
        return this
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
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var style = get_photo_style(photo)

        this.element
            .removeClass("photo-D")
            .removeClass("photo-R")
            .addClass(style)
            .toggleClass("photo-selected", is_photo_selected(photo))

        this.pi.photo_image("load", photo, change_mode)
        this.pd.photo_details("load", photo, change_mode)
        this.cd.camera_details("load", photo, change_mode)
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
            .image()
            .appendTo(this.pd)

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var style = get_photo_style(photo)

        this.pd
            .removeClass("photo-D")
            .removeClass("photo-R")
            .addClass(style)
            .toggleClass("photo-selected", is_photo_selected(photo))

        var img = this.img
        img
            .image("load", photo, get_settings().click_size)
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
            this.load(this.options.photo, this.options.seach, this.options.change_mode)
        }
    },

    load: function(photo, search, change_mode) {
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


$.widget('ui.photo_list_base',  {
    _create: function() {
        this.element
            .addClass("photo_list")

        this.ul = $("<ul></ul")
            .appendTo(this.element)

        this.p = $("<p></p>")
            .paginator({
                html_page: this.options.html_page
            })
            .appendTo(this.element)

        if (this.options.page != null) {
            this.load_paginator(this.options.page, this.options.last_page)
        }
    },

    load_paginator: function(page, last_page) {
        this.p.paginator("load", page, last_page)
    },

    empty: function() {
        this.ul.empty()
    },

    append_photo: function(photo, title, sort, description, a, selectable) {
        a
                .data("photo", null)
                .empty()

        if (photo != null) {
            var style = get_photo_style(photo)
            $("<img />")
                .image({ photo: photo, size: get_settings().list_size })
                .appendTo(a)
        }

        $("<div class='title'></div>")
            .text(title)
            .appendTo(a)

        if (sort) {
            $("<div class='sort'></div>")
                .text(sort)
                .appendTo(a)
        }
        if (description) {
            $("<div class='desc'></div>")
                .p(description)
                .appendTo(a)
        }

        li = $("<li />")
            .attr('class', "photo_list_item")
            .addClass(style)
            .append(a)
            .on("click", function(ev) { a.trigger('click'); })
            .toggleClass("ui-selected", selectable && is_photo_selected(photo))
            .appendTo(this.ul)

        return li
    },

    _destroy: function() {
        this.p
            .paginator("destroy")

        this.element.find("img")
            .image("destroy")

        this.element
            .removeAttr("photo_list")
            .empty()

        this._super()
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
            this.load(this.options.search, this.options.results, this.options.change_mode)
        }
    },

    _destroy: function() {
        this.ul
            .myselectable("destroy")
        this._super()
    },

    load: function(search, results, change_mode) {
        var mythis = this
        this.empty()
        $.each(results.photos, function(j, photo) {
            n = results.first + Number(j)
            mythis.append_photo(
                photo, photo.title, photo.localtime.date + " " + photo.localtime.time,
                photo.description, photo_search_item_a(search, n, photo), true)
        })
        return this
    }
})


