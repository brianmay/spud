$.widget('ui.album_search_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.title = "Album search"
        this.options.description = "Please search for an album."
        this._super();

        this.add_input_field("q", "Search for", "text")

        if (this.options.params != null) {
            this.load(this.options.params)
        }
    },

    load: function(params) {
        this.set_input_field("q", params.q)
    },

    _submit: function() {
        search = {
            params: {
                q: this.get_field("q")
            }
        }
        do_album_search_results(search, 0, true)
        this.close()
    },
})


$.widget('ui.album_search_details',  $.ui.infobox, {
    _create: function() {
        this.element.addClass("infobox")
        this._super();

        this.add_field("q", "Search for")

        if (this.options.params != null) {
            this.load(this.options.params)
        }
    },

    load: function(params) {
        this.get_field("q")
            .empty()
            .text(params.q)
    },
})



$.widget('ui.album_details',  $.ui.infobox, {
    _create: function() {
        this.element.addClass("infobox")
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


$.widget('ui.album_list', $.ui.photo_list, {
    _create: function() {
        this._super()
        if (this.options.albums != null) {
            this.load(this.options.albums, this.options.change_mode)
        }
    },

    load: function(albums, change_mode) {
        var mythis = this
        $.each(albums, function(j, album) {
            var photo = album.cover_photo
            var sort=""
            if  (album.sortorder || album.sortname) {
                sort = album.sortname + " " + album.sortorder
            }
            mythis.append_photo(photo, album.title, sort, album.description, album_a(album, null), false)
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

        this.add_item(photo_search_results_a(search, 0, "Show Photos"))
        this.add_item(photo_search_form_a(search))

        if (change_mode) {
            if (album.can_add) {
                this.add_item(album_add_a(album))
            }

            if (album.can_change) {
                this.add_item(album_change_a(album))
            }

            if (album.can_delete) {
                this.add_item(album_delete_a(album))
            }
        }
    },
})


$.widget('ui.album_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.load(this.options.search, this.options.change_mode)
        }
    },

    load: function(search, change_mode) {
        this.element.empty()
        this.add_item(album_search_form_a(search))
    },
})
