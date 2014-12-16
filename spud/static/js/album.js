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

window._album_created = new signal()
window._album_changed = new signal()
window._album_deleted = new signal()

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
        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.album_change_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.fields = [
            ["title", new text_input_field("Title", true)],
            ["description", new p_input_field("Description", false)],
            ["cover_photo", new photo_select_field("Photo", false)],
            ["sort_name", new text_input_field("Sort Name", false)],
            ["sort_order", new text_input_field("Sort Order", false)],
            ["parent", new ajax_select_field("Parent", "albums", false)],
            ["revised", new datetime_input_field("Revised", false)],
        ]

        this.options.title = "Change album"
        this.options.button = "Save"

        this._type = "albums"
        this._super();
    },

    set: function(album) {
        this.obj_id = album.id
        if (album.id != null) {
            this.set_title("Change album")
            this.set_description("Please change album " + album.title + ".")
        } else {
            this.set_title("Add new album")
            this.set_description("Please add new album.")
        }
        return this._super(album);
    },

    _submit_values: function(values) {
        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values)
        } else {
            this._save("POST", null, values)
        }
    },

    _done: function(data) {
        if (this.obj_id != null) {
            window._album_changed.trigger(data)
        } else {
            window._album_created.trigger(data)
        }
    },
})


$.widget('spud.album_delete_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.title = "Delete album"
        this.options.button = "Delete"

        this._type = "albums"
        this._super();
    },

    set: function(album) {
        this.obj_id = album.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            album.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        window._album_deleted.trigger(this.obj_id)
    }
})


$.widget('spud.album_criteria', {
    _create: function() {
        this.loader = null
        this.album = null

        this.criteria = $("<ul/>")
            .addClass("criteria")
            .appendTo(this.element)

        if (this.options.obj) {
            this.load(this.options.obj)
        }
    },

    set: function(criteria) {
        var mythis = this
        mythis.element.removeClass("error")

        this.options.criteria = criteria
        var ul = this.criteria
        this.criteria.empty()

        criteria = $.extend({}, criteria)

        var title = null

        var mode = criteria['mode'] || 'children'
        delete criteria['mode']

        if (criteria['instance'] != null) {
            var instance = criteria['instance']
            title = instance + " " + mode

            $("<li/>")
                .text("instance" + " = " + instance + " (" + mode + ")")
                .appendTo(ul)

            delete criteria['instance']
        }

        else if (criteria['q'] != null) {
            title = "search " + criteria['q']
        }

        else if (criteria['root_only']) {
            title = "root only"
        }

        else if (criteria['needs_revision']) {
            title = "needs revision"
        }

        else {
            title = "All"
        }

        $.each(criteria, function( index, value ) {
            $("<li/>")
                .text(index + " = " + value)
                .appendTo(ul)
        })

        if (this.options.on_load != null) {
            this.options.on_load(criteria, title)
        }
    },

    load: function(criteria) {
        var mythis = this
        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
            this.loader = null
        }
        this.album = null
        this.set(criteria)
        if (criteria.instance == null) {
            return
        }
        this.loader = new album_loader(criteria.instance)
        this.loader.loaded_item.add_listener(this, function(album) {
            criteria = $.extend({}, criteria)
            criteria.instance = album.title
            mythis.set(criteria)
            mythis.loader = null
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
        })
        this.loader.load()
    },

    _destroy: function() {
        remove_all_listeners(this)
    },

    _setOption: function( key, value ) {
        if ( key === "obj" ) {
            this.load(value)
        } else {
            this._super( key, value );
        }
    },

    get_uuid: function() {
        return this.widgetName + ":" + this.uuid
    },
})

$.widget('spud.album_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()

        var mythis = this
        this.empty()
        this.cache = {}
        if (this.options.disabled) {
            this.disable()
        } else {
            this.enable()
        }

        if (this.options.criteria != null) {
            this._filter(this.options.criteria)
        }

        this.element.scroll(function() {
            mythis._load_if_required(mythis.options.criteria)
        })

        window._reload_all.add_listener(this, function() {
            this._filter(this.options.criteria)
        })
        window._album_changed.add_listener(this, function(album) {
            var li = this._create_li(album)
            this.ul.find("[data-id="+album.id+"]").replaceWith(li)
        })
        window._album_deleted.add_listener(this, function(album_pk) {
            this.ul.find("[data-id="+album_pk+"]").remove()
            this._load_if_required()
        })
    },

    _create_li: function(album) {
        var photo = album.cover_photo
        var details = []
        if  (album.sort_order || album.sort_name) {
            details.push($("<div/>").text(album.sort_name + " " + album.sort_order))
        }
        var a = album_a(album, this.cache, this.loader)
        var li = this._super(photo, album.title, details, album.description, a)
        li.attr('data-id', album.id)
        return li
    },

    _add_item: function(album) {
        var li = this._create_li(album)
            .appendTo(this.ul)
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
        if (this.loader != null) {
            this.loader.loaded_list.remove_listener(this)
            this.loader = null
        }
        this.empty()
        this.loader = new album_list_loader(criteria)
        this.loader.loaded_list.add_listener(this, function(album_list) {
            mythis._add_list(album_list)
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
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
        this.last_id = null
        this._super()
        this.element.removeClass("error")
        if (this.loader) {
            this.loader.loaded_list.remove_listener(this)
            this.loader.on_error.remove_listener(this)
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

    _destroy: function() {
        remove_all_listeners(this)
        this._super()
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
                            obj: mythis.options.criteria,
                            on_success: function(criteria) {
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

        var params = {
            'obj': this.options.criteria,
            'on_load': function(criteria_dummy, title) {
                mythis._set_title("Album List: " + title)
            }
        }
        this.criteria = $("<div/>").appendTo(this.div)
        $.spud.album_criteria(params, this.criteria)

        var params = {
            'criteria': this.options.criteria,
            'disabled': this.options.disabled,
        }
        this.al = $("<div/>").appendTo(this.div)
        $.spud.album_list(params, this.al)
    },

    _filter: function(value) {
        this.options.criteria = value
        push_state()
        this.criteria.album_criteria("load", value)
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

    get_url: function() {
        var params = ""
        if (!$.isEmptyObject(this.options.criteria)) {
            params = "?" + $.param(this.options.criteria)
        }
        return root_url() + "albums/" + params
    }
})


$.widget('spud.album_detail',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["sort_name", new text_output_field("Sort Name")],
            ["sort_order", new text_output_field("Sort Order")],
            ["revised", new datetime_output_field("Revised")],
            ["description", new p_output_field("Description")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();

        if (this.options.obj != null) {
            this.options.obj_id = this.options.obj.id
        } else if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }
    },

    _create_fields: function() {
        this._super();
    },


    set: function(album) {
        this.element.removeClass("error")
        this._super(album)
        this.options.obj = album
        this.options.obj_id = album.id
        this.img.image("set", album.cover_photo)
        if (this.options.on_update) {
            this.options.on_update(album)
        }
    },

    load: function(obj_id) {
        var mythis = this

        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
        }

        this.loader = new album_loader(obj_id)
        this.loader.loaded_item.add_listener(this, function(album) {
            mythis.set(album)
            mythis.loader = null
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
            mythis.loader = null
            if (mythis.options.on_error) {
                mythis.options.on_error()
            }
        })
        this.loader.load()
    },

    _setOption: function( key, value ) {
        if ( key === "obj" ) {
            this.set(value)
        } else if ( key === "obj_id" ) {
            this.load(value)
        } else {
            this._super( key, value );
        }
    },

    _destroy: function() {
        remove_all_listeners(this)
    },
})


$.widget('spud.album_detail_screen', $.spud.screen, {
    _create: function() {
        var mythis = this

        this.options.title = "Album Detail"

        if (this.options.obj != null) {
            var album = this.options.obj
            this.options.obj_id = album.id
            this.options.title = "Album: "+album.title
        }

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

        this.create_item = $("<li/>")
            .text("Create")
            .on("click", function(ev) {
                if (mythis.options.obj != null) {
                    var album = {
                        parent: mythis.options.obj.id,
                    }
                    var params = {
                        obj: album,
                    }
                    var div = $("<div/>")
                    $.spud.album_change_dialog(params, div)
                }
            })
            .appendTo(menu)

        this.change_item = $("<li/>")
            .text("Change")
            .on("click", function(ev) {
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    $.spud.album_change_dialog(params, div)
                }
            })
            .appendTo(menu)

        this.delete_item = $("<li/>")
            .text("Delete")
            .on("click", function(ev) {
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    $.spud.album_delete_dialog(params, div)
                }
            })
            .appendTo(menu)

        menu
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
                push_state()
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
                push_state()
            })
            .button()
            .appendTo(this.div)

        this._setup_loader()
        this._setup_buttons()

        this.al = null
        var params = {
            'on_update': function(album) {
                mythis.element.removeClass("error")
                mythis.options.obj = album
                mythis.options.obj_id = album.id
                mythis._set_title("Album: "+album.title)
                mythis._setup_buttons()
                mythis.al.album_list("option", "criteria", {
                    'instance': album.id,
                    'mode': 'children',
                })
            },
            'on_error': function() {
                mythis.element.addClass("error")
            },
        }

        this.ad = $("<div/>").appendTo(this.div)
        $.spud.album_detail(params, this.ad)

        var params = {
            'disabled': this.options.disabled,
        }
        this.al = $("<div/>").appendTo(this.div)
        $.spud.album_list(params, this.al)

        if (this.options.obj != null) {
            this.ad.album_detail('set', this.options.obj)
        } else if (this.options.obj_id != null) {
            this.ad.album_detail('load', this.options.obj_id)
        }

        this._setup_perms(window._perms)
        window._perms_changed.add_listener(this, this._setup_perms)

        window._reload_all.add_listener(this, function() {
            mythis.load(this.options.obj_id)
        })
        window._album_changed.add_listener(this, function(album) {
            if (album.id == this.options.obj_id) {
                mythis.set_album(album)
            }
        })
        window._album_deleted.add_listener(this, function(id) {
            if (id == this.options.obj_id) {
                mythis.close()
            }
        })
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

    _setup_perms: function(perms) {
        if (perms.can_create) {
            this.create_item.show()
        } else {
            this.create_item.hide()
        }
        if (perms.can_change) {
            this.change_item.show()
        } else {
            this.change_item.hide()
        }
        if (perms.can_delete) {
            this.delete_item.show()
        } else {
            this.delete_item.hide()
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

        // above function will call on_update where the following
        // will be done
        // this._setup_buttons()
        // this._set_title("Album "+album.title)
        // this.options.obj = album
        // this.options.obj_id = album.id
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
        this.options.obj = null
        this.options.obj_id = obj_id
        this.ad.album_detail('load', obj_id)
    },

    _destroy: function() {
        this.ad.album_detail('option', 'on_update', null)
        remove_all_listeners(this)
        this._super()
    },

    get_url: function() {
        return root_url() + "albums/" + this.options.obj_id + "/"
    },

    get_streamable_options: function() {
        var options = this._super()
        options = $.extend({}, options) // clone options so we can modify
        delete options['album_list_loader']
        return options
    },
})
