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


function album() {
    this.type = "album"
    generic.call(this)
}

album.prototype = new generic()
album.constructor = album

var albums = new album()


$.widget('spud.album_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()
        this.page = 1
        if (this.options.search == null) {
            this.options.search = {}
        }
        if (this.options.scroll) {
            $("<div/>")
                //.css('float', 'left')
                .css('position', 'relative')
                .css('top', -this.element.height())
                .css('left', 0)
                .css('background', '#0f0')
                .css('z-index', '-1')
                .height(this.options.scroll + this.element.height())
                .width("100%")
                .appendTo(this.element)

            this.element.animate({scrollTop: this.options.scroll}, 0)
            // this.element.animate({scrollTop: 500})
        } else {
            this.load()
        }
        var mythis = this
        this.element.scroll(function() { mythis.load_if_required(mythis.options.search) })
    },

    add_item: function(album) {
        var photo = album.cover_photo
        var details = []
        if  (album.sort_order || album.sort_name) {
            details.push($("<div/>").text(album.sort_name + " " + album.sort_order))
        }
        var a = root_a()
        this.append_photo(photo, album.title, details, album.description, a)
        return this
    },

    add_list: function(album_list) {
        var mythis = this
        this.element.toggleClass("hidden", album_list.length == 0)
        $.each(album_list, function(j, album) {
            mythis.add_item(album)
        })
        return this
    },

    load: function() {
        if (this.loading) {
            return
        }

        var mythis = this
        var search = this.options.search
        var page = this.page
        var params = jQuery.extend({}, search, { 'page': page })
        console.log("loading", page)
        this.loading = true
        ajax({
            url: window.__root_prefix + "api/albums/",
            data: params,
            success: function(data) {
                console.log("got", page)
                mythis.add_list(data.results)
                mythis.page = page + 1
                mythis.loading = false
                mythis.load_if_required()
            },
            error: function(message) {
                mythis.loading = false
                alert(message)
            },
        });
    },

    load_if_required: function() {
        if (this.element.find("ul").height() <
                this.element.scrollTop() + this.element.height() + 200) {
            // var r = confirm("Press a button");
            // if (r) {
                this.load()
            // }
        }
    },
})

