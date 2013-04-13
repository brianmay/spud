$.widget('ui.album_search_dialog',  $.ui.form_dialog, {
    fields: {
        q: new text_input_field("Search for", false),
        parent: new ajax_select_field("Parent album", "album", false),
    },

    _create: function() {
        this.options.title = "Album search"
        this.options.description = "Please search for an album."
        this.options.button = "Search"
        this._super();

        if (this.options.results != null) {
            this.set(this.options.results)
        }
    },

    set: function(results) {
        this.set_field("q", results.q)
        this.set_field("parent", results.parent)
        return this
    },

    _submit: function() {
        params = {}

        var v = this.get_field("q")
        if (v) { params.q = v }

        var v = this.get_field("parent")
        if (v) { params.parent = v }

        var search = {
            params: params
        }

        do_album_search_results(search, 0, true)
        this.close()
    },
})


$.widget('ui.album_search_details',  $.ui.infobox, {
    fields: {
        'q': new text_output_field("Search for"),
        'parent': new html_output_field("Album parent"),
    },

    _create: function() {
        this.element.addClass("infobox")
        this._super();

        if (this.options.results != null) {
            this.set(this.options.results)
        }
    },

    set: function(results) {
        this.set_field("q", results.q)
        this.set_field("parent", album_a(results.parent))
        return this
    },
})



$.widget('ui.album_details',  $.ui.infobox, {
    fields: {
        'title': new text_output_field("Title"),
        'photo': new photo_output_field("Photo", get_settings().view_size),
        'sort': new text_output_field("Sort"),
        'description': new text_output_field("Description"),
    },

    _create: function() {
        this.element.addClass("infobox")
        this._super();

        if (this.options.album != null) {
            this.set(this.options.album)
        }
    },

    set: function(album) {
        this.set_field("title", album.title)
        this.set_field("photo", album.cover_photo)
        this.set_field("sort", album.sortname + " " + album.sortorder)
        this.set_field("description", album.description)
        return this
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('ui.album_list', $.ui.photo_list_base, {
    _create: function() {
        this._super()
        if (this.options.albums != null) {
            this.set(this.options.albums, this.options.change_mode)
        }
    },

    set: function(albums, change_mode) {
        var mythis = this
        this.empty()
        $.each(albums, function(j, album) {
            var photo = album.cover_photo
            var sort=""
            if  (album.sortorder || album.sortname) {
                sort = album.sortname + " " + album.sortorder
            }
            mythis.append_photo(photo, album.title, sort, album.description, album_a(album, null), false)
        })
        return this
    }
})


$.widget('ui.album_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.album != null) {
            this.set(this.options.album, this.options.change_mode)
        }
    },

    set: function(album, change_mode) {
        this.element.empty()

        var search = { params: { album: album.id }}

        this.add_item(photo_search_results_a(search, 0, "Show Photos"))
        this.add_item(photo_search_form_a(search))
        this.add_item(album_search_form_a({}))

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
        return this
    },
})


$.widget('ui.album_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search, this.options.change_mode)
        }
    },

    set: function(search, change_mode) {
        this.element.empty()
        this.add_item(album_search_form_a(search))
        return this
    },
})
