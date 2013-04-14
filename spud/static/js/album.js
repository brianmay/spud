/*
spud - keep track of computers and licenses
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

$.widget('ui.album_search_dialog',  $.ui.form_dialog, {
    fields: {
        q: new text_input_field("Search for", false),
        parent: new ajax_select_field("Parent album", "album", false),
    },

    _create: function() {
        this.options.title = "Search albums"
        this.options.description = "Please search for an album."
        this.options.button = "Search"
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },

    _submit_values: function(values) {
        criteria = {}

        var v = values.q
        if (v) { criteria.q = v }

        var v = values.parent
        if (v) { criteria.parent = v }

        var search = {
            criteria: criteria
        }

        albums.do_search_results(search, 0, true)
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

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
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
            this.set(this.options.albums)
        }
    },

    set: function(album_list) {
        var mythis = this
        this.empty()
        $.each(album_list, function(j, album) {
            var photo = album.cover_photo
            var sort=""
            if  (album.sortorder || album.sortname) {
                sort = album.sortname + " " + album.sortorder
            }
            mythis.append_photo(photo, album.title, sort, album.description, albums.a(album, null))
        })
        return this
    }
})


$.widget('ui.album_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.album != null) {
            this.set(this.options.album)
        }
    },

    set: function(album) {
        this.element.empty()

        var criteria = { album: album.id }

        this.add_item(photo_search_results_a({ criteria: criteria }, 0, "Show photos"))
        this.add_item(photo_search_form_a(criteria))
        this.add_item(albums.search_form_a({}))

        if (album.can_add) {
            this.add_item(albums.add_a(album))
        }

        if (album.can_change) {
            this.add_item(albums.change_a(album))
        }

        if (album.can_delete) {
            this.add_item(albums.delete_a(album))
        }

        return this
    },
})


$.widget('ui.album_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search)
        }
    },

    set: function(search) {
        this.element.empty()
        this.add_item(albums.search_form_a(search.criteria))
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
        this.options.title = "Change album"
        this.options.button = "Save"
        this._super();

        if (this.options.album != null) {
            this.set(this.options.album)
        }
    },

    set: function(album) {
        this.album_id = album.id
        if (album.id != null) {
            this.set_title("Change album")
            this.set_description("Change album " + album.title)
        } else {
            this.set_title("Add new album")
            this.set_description("Add new album")
        }
        return this._super(album);
    },

    _submit_values: function(values) {
        var mythis = this
        display_loading()
        albums.load_change(
            this.album_id,
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


$.widget('ui.album_delete_dialog',  $.ui.form_dialog, {
    fields: {
    },

    _create: function() {
        this.options.title = "Delete album"
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
        albums.load_delete(
            this.album_id,
            function(data) {
                hide_loading()
                reload_page()
            },
            display_error
        )
    },
})


function album_doer() {
    this.type = "album"
    this.display_type = "album"
    this.display_plural = "albums"
    this.list_type = "album_list"
    this.has_children = true
    generic_doer.call(this)
}

album_doer.prototype = new generic_doer()
album_doer.constructor = album_doer

album_doer.prototype.get_criteria = function(album) {
    return { album: album.id }
}

album_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "album",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parent: parent,
        children: [],
    }
}

album_doer.prototype.get_object = function(results) {
    return results.album
}

album_doer.prototype.get_objects = function(results) {
    return results.albums
}

album_doer.prototype.details = function(album, div) {
    $.ui.album_details({album: album}, div)
}

album_doer.prototype.list_menu = function(search, div) {
    $.ui.album_list_menu({search: search}, div)
}


album_doer.prototype.menu = function(album, div) {
    $.ui.album_menu({album: album}, div)
}

album_doer.prototype.list = function(albums, page, last_page, html_page, div) {
    $.ui.album_list({
        albums: albums,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

album_doer.prototype.search_dialog = function(criteria, dialog) {
    $.ui.album_search_dialog({ criteria: criteria }, dialog)
}

album_doer.prototype.search_details = function(criteria, dialog) {
    $.ui.album_search_details({ criteria: criteria }, dialog)
}

album_doer.prototype.change_dialog = function(album, dialog) {
    $.ui.album_change_dialog({ album: album }, dialog)
}

album_doer.prototype.delete_dialog = function(album, dialog) {
    $.ui.album_delete_dialog({ album: album }, dialog)
}

albums = new album_doer()
