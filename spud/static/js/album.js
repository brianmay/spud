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

    _submit_values: function(values) {
        params = {}

        var v = values.q
        if (v) { params.q = v }

        var v = values.parent
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
        'parent': new link_output_field("Album parent"),
    },

    _create: function() {
        this.element.addClass("infobox")
        this._super();

        if (this.options.results != null) {
            this.set(this.options.results)
        }
    },
})



$.widget('ui.album_details',  $.ui.infobox, {
    fields: {
        'title': new text_output_field("Title"),
        'cover_photo': new photo_output_field("Photo", get_settings().view_size),
        'sortname': new text_output_field("Sort Name"),
        'sortorder': new text_output_field("Sort Order"),
        'description': new p_output_field("Description"),
    },

    _create: function() {
        this.element.addClass("infobox")
        this._super();

        if (this.options.album != null) {
            this.set(this.options.album)
        }
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
            mythis.append_photo(photo, album.title, sort, album.description, album_a(album, null))
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


$.widget('ui.album_change_dialog',  $.ui.form_dialog, {
    fields: {
        title: new text_input_field("Title", true),
        description: new p_input_field("Description", false),
        cover_photo: new photo_select_field("Cover Photo", false),
        sortname: new text_input_field("Sort Name", false),
        sortorder: new text_input_field("Sort Order", false),
        parent: new ajax_select_field("Parent", "album", false),
    },

    _create: function() {
        this.options.title = "Album change"
        this.options.button = "Save"
        this._super();

        if (this.options.album != null) {
            this.set(this.options.album)
        }
    },

    set: function(album) {
        this.album_id = album.id
        if (album.id != null) {
            this.set_description("Change " + album.title)
        } else {
            this.set_description("Add new album")
        }
        return this._super(album);
    },

    _submit_values: function(values) {
        display_loading()
        load_album_change(
            this.album_id,
            values,
            function(data) {
                hide_loading()
                this.close()
                reload_page()
            },
            display_error
        )
    },
})


$.widget('ui.album_delete_dialog',  $.ui.form_dialog, {
    fields: {
    },

    _create: function() {
        this.options.title = "Album delete"
        this.options.button = "Delete"
        this._super();

        if (this.options.album != null) {
            this.set(this.options.album)
        }
    },

    set: function(album) {
        this.album_id = album.id
        this.set_description("Are you absolutely positively sure you really want to delete "
            + album.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this.close()
        display_loading()
        load_album_delete(
            this.album_id,
            function(data) {
                hide_loading()
                reload_page()
            },
            display_error
        )
    },
})


