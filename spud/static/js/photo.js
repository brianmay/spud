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


function resize_photo(img, width, height, enlarge) {
    // delete me
}


$.widget('ui.image', {
    _create: function() {
        this.load(this.options.photo, this.options.size)
    },

    load: function(photo, size) {
        var image = null
        if (photo != null) {
            var style = get_photo_style(photo)
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
                .removeAttr("class")
                .removeAttr("src")
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

$.widget('ui.photo_image',  {
    _create: function() {
        this.element
            .addClass("photo_image_block")

        this._super();

        this.img = $("<img id='photo' />")
            .image()
            .appendTo(this.element)

        this.title = $("<div class='title'></div>")
            .appendTo(this.element)

        this.persons = $("<div class='persons'></div>")
            .appendTo(this.element)

        this.description = $("<div class='description'></div>")
            .appendTo(this.element)

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.can_change)
        }
    },

    load: function(photo, can_change) {
        var img = this.img

        img.image("load", photo, get_settings().view_size)
        img.resize(false)

        $(window).off("resize")
        $(window).on("resize", function() { img.resize(false) })

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
        $(window).off("resize")
        this._super();
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
            this.load(this.options.photo, this.options.can_change)
        }
    },

    load: function(photo, can_change) {
        this.fields.title
            .empty()
            .text(photo.title)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_title, "[edit]"))

        this.fields.description
            .empty()
            .p(photo.description)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_description, "[edit]"))

        this.fields.view
            .empty()
            .text(photo.view)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_view, "[edit]"))

        this.fields.comment
            .empty()
            .p(photo.comment)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_comment, "[edit]"))

        this.fields.name
            .empty()
            .text(photo.name)

        this.fields.place
            .empty()
            .html(place_a(photo.place))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_place, "[edit]"))

        this.fields.albums
            .empty()
            .append_list($.map(photo.albums, function(album) { return album_a(album); } ))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_albums, "[edit]"))

        this.fields.categorys
            .empty()
            .append_list($.map(photo.categorys, function(category) { return category_a(category); } ))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_categorys, "[edit]"))

        this.fields.datetime
            .empty()
            .append(datetime_a(photo.utctime))
            .append("<br />")
            .append(datetime_a(photo.localtime))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_datetime, "[edit]"))

        this.fields.photographer
            .empty()
            .html(person_a(photo.photographer))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_photographer, "[edit]"))

        this.fields.rating
            .empty()
            .text(photo.rating ? photo.rating : "None")

        this.fields.related
            .empty()
            .append_list($.map(photo.related, function(r) {
                return [[
                    photo_a(r.photo, r.title),
                    can_change ? change_photo_relation_a({ id: r.id }, "[edit]") : null,
                    can_change ? delete_photo_relation_a({ id: r.id }, "[del]") : null,
                ]]
             }))
            .conditional_append(can_change, add_photo_relation_a(photo, "[add]"))

        this.fields.action
            .empty()
            .append(get_photo_action(photo.action))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_action, "[edit]"))
    }
})


$.widget('ui.camera_details',  $.ui.infobox, {
    _create: function() {
        this.element
            .addClass("camera_details_block")
        this.options.title = "Camera details"

        this._super();

        this.add_field("camera_make", "Camera make")
        this.add_field("camera_model", "Camera model")
        this.add_field("flash_used", "Flash")
        this.add_field("focal_length", "Focal Length")
        this.add_field("exposure", "Exposure")
        this.add_field("aperture", "Aperture")
        this.add_field("iso_equiv", "ISO")
        this.add_field("metering_mode", "Metering mode")

        if (this.options.photo != null) {
            this.load(this.options.photo, this.options.can_change)
        }
    },

    load: function(photo, can_change) {
        this.fields.camera_make
            .empty()
            .text(photo.camera_make)
        this.fields.camera_model
            .empty()
            .text(photo.camera_model)
        this.fields.flash_used
            .empty()
            .text(photo.flash_used)
        this.fields.focal_length
            .empty()
            .text(photo.focal_length)
        this.fields.exposure
            .empty()
            .text(photo.exposure)
        this.fields.aperture
            .empty()
            .text(photo.aperture)
        this.fields.iso_equiv
            .empty()
            .text(photo.iso_equiv)
        this.fields.metering_mode
            .empty()
            .text(photo.metering_mode)
        return this
    },
})

