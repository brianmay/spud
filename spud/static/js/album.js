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
"use strict";


// function album() {
//     this.type = "album"
//     generic.call(this)
// }
//
// album.prototype = new generic()
// album.constructor = album
//
// var albums = new album()


function album_loader(obj_id) {
    object_loader.call(this, "albums", obj_id)
}

album_loader.prototype = new object_loader()
album_loader.constructor = album_loader



function album_list_loader(criteria) {
    object_list_loader.call(this, "albums", criteria)
}

object_list_loader.prototype._get_object_id = function(obj) {
    return obj.album_id
}

album_list_loader.prototype = new object_list_loader()
album_list_loader.constructor = album_list_loader

$.widget('spud.album_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Album", "albums", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ])],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search albums"
        this.options.description = "Please search for an album."
        this.options.button = "Search"
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },

    set: function(criteria) {
        if (true) {
            this.add_field("needs_revision",
                new boolean_input_field("Needs revision"))
        } else {
            this.remove_field("needs_revision")
        }
        this._super(criteria)
    },

    _submit_values: function(values) {
        var criteria = {}

        var v = values.q
        if (v) { criteria.q = v }

        var v = values.instance
        if (v) { criteria.instance = v }

        var v = values.mode
        if (v) { criteria.mode = v }

        var v = values.root_only
        if (v) { criteria.root_only = v }

        var v = values.needs_revision
        if (v) { criteria.needs_revision = v }

        var mythis = this
        if (this.options.success(criteria)) {
            this.close()
        }
    },
})


$.widget('spud.album_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()

        var mythis = this
        if (this.options.criteria == null) {
            this.options.criteria = {}
        }
        this.empty()
        this.cache = {}
        if (this.options.disabled) {
            this.disable()
        } else {
            this.enable()
        }

        this._filter(this.options.criteria)

        this.element.scroll(function() {
            mythis._load_if_required(mythis.options.criteria)
        })
    },

    _add_item: function(album) {
        var photo = album.cover_photo
        var details = []
        if  (album.sort_order || album.sort_name) {
            details.push($("<div/>").text(album.sort_name + " " + album.sort_order))
        }
        var a = album_a(album, this.cache, this.loader)
        this.append_photo(photo, album.title, details, album.description, a)
        return this
    },

    _add_list: function(album_list) {
        var mythis = this
        this.element.toggleClass("hidden", album_list.length == 0)
        $.each(album_list, function(j, album) {
            mythis._add_item(album)
        })
        this._load_if_required()
        return this
    },

    _load_if_required: function() {
        // if element is not displayed, we can't tell the scroll position,
        // so we must wait for element to be displayed before we can continue
        // loading
        if (this.is_enabled() && this.loader) {
            if (this.element.find("ul").height() <
                    this.element.scrollTop() + this.element.height() + 200) {
                this.loader.load_next_page()
            }
        }
    },

    _filter: function(criteria) {
        var mythis = this
        this.empty()
        this.loader = new album_list_loader(criteria)
        this.loader.loaded_list.add_listener(this, function(album_list) {
            mythis._add_list(album_list)
        })
        this.loader.load_next_page()
    },

    _setOption: function( key, value ) {
        if ( key === "criteria" ) {
            this._filter(value)
            this.options.criteria = value
        } else if (key === "disabled") {
            if (value) {
                this.enable()
            } else {
                this.disable()
            }
        } else {
            this._super( key, value );
        }
    },

    is_enabled: function() {
        return !this.element.hasClass("disabled")
    },

    empty: function() {
        this.page = 1
        this.idmap = {}
        this.last_id = null
        this._super()
        if (this.loader) {
            this.loader.loaded_list.remove_listener(this)
            this.loader = null
        }
    },

    enable: function() {
        this.element.removeClass("disabled")
        this._load_if_required()
    },

    disable: function() {
        this.element.addClass("disabled")
    },

    get_prev_id: function(obj_id) {
        if (!this.idmap[obj_id]) {
            return null
        }
        return this.idmap[obj_id].prev
    },

    close: function() {
        if (this.loader) {
            this.loader.loaded_list.remove_listener(this)
        }
        // No super to call
        // this._super()
    },
})

$.widget('spud.album_list_screen', $.spud.screen, {
    _create: function() {
        var mythis = this

        if (!this.options.criteria) {
            this.options.criteria = {}
        }

        this.options.title = "Album List"
        this._super()

        var menu = $("<ul/>")
            .addClass("menubar")
            .append(
                $("<li/>")
                    .text("Filter")
                    .on("click", function(ev) {
                        var params = {
                            criteria: mythis.options.criteria,
                            success: function(criteria) {
                                mythis._filter(criteria)
                                return true
                            }
                        }
                        var div = $("<div/>")
                        $.spud.album_search_dialog(params, div)
                    })
            )
            .menu()
            .appendTo(this.div)

        this.criteria = $("<ul/>")
            .addClass("criteria")
            .appendTo(this.div)
        this._update_criteria(this.options.criteria)

        var params = {
            'criteria': this.options.criteria,
            'disabled': this.options.disabled,
        }
        this.al = $("<div/>").appendTo(this.div)
        $.spud.album_list(params, this.al)
    },

    _update_criteria: function(criteria) {
        var ul = this.criteria
        this.criteria.empty()
        $.each(criteria, function( index, value ) {
            $("<li/>")
                .text(index + " = " + value)
                .appendTo(ul)
        })
    },

    _filter: function(value) {
        if (this.loading) {
            return
        }
        this.options.criteria = value
        this._update_criteria(value)
        this.al.album_list("option", "criteria", value)
    },

    _setOption: function( key, value ) {
        if ( key === "criteria" ) {
            this._filter(value)
        } else if (key === "disabled") {
            if (value) {
                this.enable()
            } else {
                this.disable()
            }
        } else {
            this._super( key, value );
        }
    },

    enable: function() {
        this._super()
        if (this.al) {
            this.al.album_list('enable')
        }
    },

    disable: function() {
        this._super()
        if (this.al) {
            this.al.album_list('disable')
        }
    },

    close: function() {
        this.al.album_list("close")
        this._super()
    },
})


$.widget('spud.album_detail',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["sort_name", new text_output_field("Sort Name")],
            ["sort_order", new text_output_field("Sort Order")],
            ["revised", new datetime_output_field("Revised")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();

        this.description = $("<p></p>")
            .appendTo(this.element)

        if (this.options.album != null) {
            this.set(this.options.album)
        } else if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }
    },

    set: function(album) {
        this._super(album)
        this.options.obj_id = album.album_id
        this.description.p(album.description)
        this.img.image("set", album.cover_photo)
        if (album.cover_photo != null || album.description != "") {
            this.element.removeClass("hidden")
        }
        if (this.options.event_update) {
            this.options.event_update(album)
        }
    },

    load: function(obj_id) {
        var mythis = this

        if (this.loader != null) {
            return
        }

        this.loader = new album_loader(obj_id)
        this.loader.loaded_item.add_listener(this, function(album) {
            mythis.set(album)
            mythis.loader = null
        })
        this.loader.load()
    },

    _setOption: function( key, value ) {
        if ( key === "obj_id" ) {
            this.load(value)
        } else {
            this._super( key, value );
        }
    },

    close: function() {
        this._super()
    },

    _destroy: function() {
        this.img.image("destroy")
        this._super()
    },
})


$.widget('spud.album_detail_screen', $.spud.screen, {
    _create: function() {
        var mythis = this

        this.options.title = "Album Detail"
        this._super()

        var menu = $("<ul/>")
            .addClass("menubar")
            .append(
                $("<li/>")
                    .text("Children")
                    .on("click", function(ev) {
                        var screen_class = $.spud.album_list_screen
                        params = {
                            criteria: {
                                instance: mythis.options.obj_id,
                                mode: "children",
                            }
                        }
                        add_screen(screen_class, params)
                    })
            )
            .menu()
            .appendTo(this.div)

        this.prev_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '<<')
            .click(function() {
                var album_list_loader = mythis.options.album_list_loader
                var meta = album_list_loader.get_meta(mythis.options.obj_id)
                var obj_id = meta.prev
                if (obj_id) {
                    mythis.load(obj_id)
                }
            })
            .button()
            .appendTo(this.div)

        this.next_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '>>')
            .click(function() {
                var album_list_loader = mythis.options.album_list_loader
                var meta = album_list_loader.get_meta(mythis.options.obj_id)
                var obj_id = meta.next
                if (obj_id) {
                    mythis.load(obj_id)
                }
            })
            .button()
            .appendTo(this.div)

        if (this.options.album != null) {
            var album = this.options.album
            this.options.obj_id = album.album_id
            mythis._set_title("Album "+album.title)
        }
        this._setup_loader()
        this._setup_buttons()

        var params = {
            'obj_id': this.options.obj_id,
            'album': this.options.album,
            'event_update': function(album) {
                mythis.options.obj_id = album.album_id
                mythis._set_title("Album "+album.title)
                mythis._setup_buttons()
            },
        }

        this.ad = $("<div/>").appendTo(this.div)
        $.spud.album_detail(params, this.ad)
    },

    _setup_loader: function() {
        var mythis = this
        if (this.options.album_list_loader != null) {
            var album_list_loader = this.options.album_list_loader
            album_list_loader.loaded_list.add_listener(this, function(album_list) {
                mythis._setup_buttons()
            })
        }
    },

    _setup_buttons: function() {
        if (this.options.album_list_loader) {
            var album_list_loader = this.options.album_list_loader
            var meta = null
            if (this.options.obj_id) {
                meta = album_list_loader.get_meta(this.options.obj_id)
            }

            this.prev_button.show()
            this.next_button.show()

            if (meta != null && meta.prev) {
                this.prev_button.button("enable")
            } else {
                this.prev_button.button("disable")
            }
            if (meta && meta.next) {
                this.next_button.button("enable")
            } else {
                this.next_button.button("disable")
            }
        } else {
            this.prev_button.hide()
            this.next_button.hide()
        }
    },

    set_album: function(album) {
        var old_loader = this.options.album_list_loader
        if (old_loader != null) {
            old_loader.loaded_list.remove_listener(this)
            this.options.album_list_loader = null
        }

        this.ad.album_detail('set', album)
        this._setup_buttons()
        this._set_title("Album "+album.title)

        this.options.album = album
        this.options.obj_id = album.album_id
    },

    set_loader: function(album_list_loader) {
        var old_loader = this.options.album_list_loader
        if (old_loader != null) {
            old_loader.loaded_list.remove_listener(this)
        }
        this.options.album_list_loader = album_list_loader

        this._setup_loader()
        this._setup_buttons()
    },

    _setOption: function( key, value ) {
        if ( key === "album" ) {
            this.set_album(value)
        } else if ( key === "album_list_loader" ) {
            this.set_loader(value)
        } else {
            this._super( key, value );
        }
    },

    load: function(obj_id) {
        this.ad.album_detail('load', obj_id)
    },

    close: function() {
        if (this.options.album_list_loader) {
            var controller = this.options.controller
            controller.event_update = null
            controller.event_close = null
        }
        this.ad.album_detail('option', 'event_update', null)
        this.ad.album_detail('close')

        var album_list_loader = this.options.album_list_loader
        album_list_loader.loaded_list.remove_listener(this)

        this._super()
    },
})
