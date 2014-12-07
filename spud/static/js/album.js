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

$.widget('spud.album_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Album", "album", false)],
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
        this._load()
        var mythis = this
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
        var a = album_a(album, this.cache, this)
        this.append_photo(photo, album.title, details, album.description, a)

        if (this.last_id) {
            this.idmap[this.last_id].next = album.album_id
        }
        this.idmap[album.album_id] = Object()
        this.idmap[album.album_id].prev = this.last_id
        this.last_id = album.album_id
        return this
    },

    _add_list: function(album_list) {
        var mythis = this
        this.element.toggleClass("hidden", album_list.length == 0)
        $.each(album_list, function(j, album) {
            mythis._add_item(album)
        })
        if (this.event_update) {
            this.event_update()
        }
        return this
    },

    _load: function() {
        if (this.loading) {
            return
        }

        var mythis = this
        var criteria = this.options.criteria
        var page = this.page
        var params = jQuery.extend({}, criteria, { 'page': page })
        console.log("loading", page)
        this.loading = true
        ajax({
            url: window.__root_prefix + "api/albums/",
            data: params,
            success: function(data) {
                console.log("got", page)
                mythis._add_list(data.results)
                mythis.page = page + 1
                mythis.loading = false
                mythis._load_if_required()
            },
            error: function(status, message) {
                mythis.loading = false
                if (status != 404) {
                    alert(message)
                }
            },
        });
    },

    _load_if_required: function() {
        if (this.is_enabled()) {
            if (this.element.find("ul").height() <
                    this.element.scrollTop() + this.element.height() + 200) {
                this._load()
            }
        }
    },

    _filter: function(value) {
        if (this.loading) {
            return
        }
        this.options.criteria = value
        this.empty()
        this._load()
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

    is_enabled: function() {
        return !this.element.hasClass("disabled")
    },

    empty: function() {
        if (this.loading) {
            return
        }
        this.page = 1
        this.idmap = {}
        this.last_id = null
        this._super()
        if (this.event_update) {
            this.event_update()
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

    get_next_id: function(obj_id) {
        if (!this.idmap[obj_id]) {
            return null
        }
        if (!this.idmap[obj_id].next && !this.loading) {
            this._load()
        }
        return this.idmap[obj_id].next
    },

    close: function() {
        if (this.event_close) {
            this.event_close()
        }
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
})


$.widget('spud.album_detail',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["title", new text_output_field("Title")],
            ["sort_name", new text_output_field("Sort Name")],
            ["sort_order", new text_output_field("Sort Order")],
            ["revised", new datetime_output_field("Revised")],
        ]

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
        if (this.loading) {
            return
        }

        var mythis = this
        var params = {}
        this.loading = true
        ajax({
            url: window.__root_prefix + "api/albums/" + obj_id + "/",
            data: params,
            success: function(data) {
                mythis.set(data)
                mythis.loading = false
            },
            error: function(status, message) {
                alert(message)
            },
        });
    },

    _setOption: function( key, value ) {
        if ( key === "obj_id" ) {
            this.load(value)
        } else {
            this._super( key, value );
        }
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

        if (this.options.controller) {
            var controller = this.options.controller
            controller.event_update = function() {
                mythis._setup_buttons()
            }
            controller.event_close = function() {
                mythis.options.controller = null
                this.prev_button.button("disable")
                this.next_button.button("disable")
            }
            this.prev_button = $("<input/>")
                .attr('type', 'submit')
                .attr('value', '<<')
                .click(function() {
                    var obj_id = controller.get_prev_id(mythis.options.obj_id)
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
                    var obj_id = controller.get_next_id(mythis.options.obj_id)
                    if (obj_id) {
                        mythis.load(obj_id)
                    }
                })
                .button()
                .appendTo(this.div)
            this._setup_buttons()
        }

        var params = {
            'obj_id': this.options.obj_id,
            'album': this.options.album,
            'event_update': function(album) {
                mythis.options.obj_id = album.album_id
                mythis._setup_buttons()
                mythis._set_title("Album "+album.title)
            },
        }

        this.ad = $("<div/>").appendTo(this.div)
        $.spud.album_detail(params, this.ad)
    },

    _setup_buttons: function() {
        if (this.options.controller) {
            var controller = this.options.controller
            var prev_id = controller.get_prev_id(this.options.obj_id)
            var next_id = controller.get_next_id(this.options.obj_id)

            if (prev_id) {
                this.prev_button.button("enable")
            } else {
                this.prev_button.button("disable")
            }
            if (next_id) {
                this.next_button.button("enable")
            } else {
                this.next_button.button("disable")
            }
        }
    },

    set: function(album) {
        this.ad.album_detail('set', album)
        this.options.obj_id = album.album_id
        this._setup_buttons()
        this._set_title("Album "+album.title)
    },

    load: function(obj_id) {
        this.ad.album_detail('load', obj_id)
    },

    close: function() {
        if (this.options.controller) {
            var controller = this.options.controller
            controller.event_update = null
            controller.event_close = null
        }
        this.ad.album_detail('option', 'event_update', null)
        this._super()
    },
})
