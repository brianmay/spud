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

        this.toggle_field("photo", album.photo != null)

        this.toggle_field("sort", album.sortname != "" && album.sortorder != "")
        this.get_field("sort")
            .empty()
            .text(album.sortname + " " + album.sortorder)

        this.toggle_field("description", album.description != "")
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


$.widget('ui.album_child_list', $.ui.photo_list, {
    _create: function() {
        this._super()
        if (this.options.album != null) {
            this.load(this.options.album, this.options.change_mode)
        }
    },

    load: function(album, change_mode) {
        var mythis = this
        $.each(album.children, function(j, child) {
            var photo = child.cover_photo
            var sort=""
            if  (child.sortorder || child.sortname) {
                sort = child.sortname + " " + child.sortorder
            }
            mythis.append_photo(photo, child.title, sort, child.description, album_a(child, null), false)
        })
    }
})

$.widget('ui.album_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.album != null) {
            this.load(this.options.album, this.options.change_mode)
        }
    },

    load: function(album, change_mode) {
        this.element.empty()

        var search = { params: { album: album.id }}

        this.add_item(search_results_a(search, 0, "Show Photos"))
        this.add_item(search_a(search))

        if (change_mode) {
            if (album.can_add) {
                this.add_item(add_album_a(album))
            }

            if (album.can_change) {
                this.add_item(change_album_a(album))
            }

            if (album.can_delete) {
                this.add_item(delete_album_a(album))
            }
        }
    },
})



