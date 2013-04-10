$.widget('ui.album_details',  $.ui.infobox, {
    _create: function() {
        this.element.addClass("infobox")

        this.options.title = "Album details"

        this._super();

        this.img = $("<img/>")
            .image()

        this.add_field("title", "Title")
        this.add_field("photo", "Photo")
            .append(this.img)
        this.add_field("sort", "Sort")
        this.add_field("description", "Description")



        if (this.options.album != null) {
            this.load(this.options.album, this.options.change_mode)
        }
    },

    load: function(album, change_mode) {
        var can_change = change_mode && album.can_change

        this.img.image("load", album.cover_photo, get_settings().view_size)

        this.get_field("title")
            .empty()
            .text(album.title)

        this.get_field("sort")
            .empty()
            .text(album.sortname + " " + album.sortorder)

        this.get_field("description")
            .empty()
            .text(album.description)
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


