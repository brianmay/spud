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
        this.load(this.options.photo, this.options.size)
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

    load: function(photo, size) {
        var image = null
        if (photo != null) {
            var image = photo.thumb[size]
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
            .image()
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
            .image("load", photo, get_settings().view_size)
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
    _create: function() {
        this.element
            .addClass("photo_details_block")
        this.options.title = "Photo details"

        this._super();

        this.add_field("title", "Title")
        this.add_field("description", "Description")
        this.add_field("view", "View")
        this.add_field("comment", "Comment")
        this.add_field("name", "File")
        this.add_field("place", "Place")
        this.add_field("albums", "Albums")
        this.add_field("categorys", "Categories")
        this.add_field("datetime", "Date & time")
        this.add_field("photographer", "Photographer")
        this.add_field("rating", "Rating")
        this.add_field("related", "Related photos")
        this.add_field("action", "Action")

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

        this.get_field("title")
            .empty()
            .text(photo.title)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_title, "[edit]"))

        this.get_field("description")
            .empty()
            .p(photo.description)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_description, "[edit]"))

        this.get_field("view")
            .empty()
            .text(photo.view)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_view, "[edit]"))

        this.toggle_field("comment", photo.comment != null)
        this.get_field("comment")
            .empty()
            .p(photo.comment)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_comment, "[edit]"))

        this.get_field("name")
            .empty()
            .text(photo.name)

        this.get_field("place")
            .empty()
            .html(place_a(photo.place))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_place, "[edit]"))

        this.get_field("albums")
            .empty()
            .append_list($.map(photo.albums, function(album) { return album_a(album); } ))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_albums, "[edit]"))

        this.get_field("categorys")
            .empty()
            .append_list($.map(photo.categorys, function(category) { return category_a(category); } ))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_categorys, "[edit]"))

        this.get_field("datetime")
            .empty()
            .append(datetime_a(photo.utctime))
            .append("<br />")
            .append(datetime_a(photo.localtime))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_datetime, "[edit]"))

        this.get_field("photographer")
            .empty()
            .html(person_a(photo.photographer))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_photographer, "[edit]"))

        this.get_field("rating")
            .empty()
            .text(photo.rating ? photo.rating : "None")

        this.get_field("related")
            .empty()
            .append_list($.map(photo.related, function(r) {
                return [[
                    photo_a(r.photo, r.title),
                    can_change ? photo_relation_change_a({ id: r.id }, "[edit]") : null,
                    can_change ? photo_relation_delete_a({ id: r.id }, "[del]") : null,
                ]]
             }))
            .conditional_append(can_change, photo_relation_add_a(photo, "[add]"))

        this.get_field("action")
            .empty()
            .append(get_photo_action(photo.action))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_action, "[edit]"))
    },

})


$.widget('ui.camera_details',  $.ui.infobox, {
    _create: function() {
        this.element
            .addClass("camera_details_block")
        this.options.title = "Camera details"

        this._super()

        this.add_field("camera_make", "Camera make")
        this.add_field("camera_model", "Camera model")
        this.add_field("flash_used", "Flash")
        this.add_field("focal_length", "Focal Length")
        this.add_field("exposure", "Exposure")
        this.add_field("aperture", "Aperture")
        this.add_field("iso_equiv", "ISO")
        this.add_field("metering_mode", "Metering mode")

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.change_mode)
        }
    },

    load: function(photo, change_mode) {
        var can_change = change_mode && photo.can_change

        this.get_field("camera_make")
            .empty()
            .text(photo.camera_make)
        this.get_field("camera_model")
            .empty()
            .text(photo.camera_model)
        this.get_field("flash_used")
            .empty()
            .text(photo.flash_used)
        this.get_field("focal_length")
            .empty()
            .text(photo.focal_length)
        this.get_field("exposure")
            .empty()
            .text(photo.exposure)
        this.get_field("aperture")
            .empty()
            .text(photo.aperture)
        this.get_field("iso_equiv")
            .empty()
            .text(photo.iso_equiv)
        this.get_field("metering_mode")
            .empty()
            .text(photo.metering_mode)
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
    },
})


$.widget('ui.photo_list',  {
    _create: function() {
        this.element
                .addClass("photo_list")
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
            .appendTo(this.element)

        return li
    },

    _destroy: function() {
        this.element.find("img")
            .image("destroy")

        this.element
            .removeAttr("photo_list")
            .empty()

        this._super()
    },
})


