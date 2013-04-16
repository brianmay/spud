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

// ****************
// * STATE SAVING *
// ****************

function get_selection() {
    var selection = []
    if (localStorage.selection != null)
        if (localStorage.selection != "")
            selection = localStorage.selection.split(",")
    selection = $.map(selection, function(n){ return Number(n) });
    return selection
}


function set_selection(selection) {
    localStorage.selection = selection.join(",")
    update_selection()
}


function add_selection(photo) {
    var selection = get_selection()
    if (selection.indexOf(photo.id) == -1) {
        selection.push(photo.id)
    }
    set_selection(selection)
}


function del_selection(photo) {
    var selection = get_selection()
    var index = selection.indexOf(photo.id)
    if (index != -1) {
        selection.splice(index, 1);
    }
    set_selection(selection)
}


function is_photo_selected(photo) {
    var selection = get_selection()
    var index = selection.indexOf(photo.id)
    return index != -1
}


function set_slideshow_mode() {
    $(document).data("photo_mode", "slideshow")
}

function set_article_mode() {
    $(document).data("photo_mode", "article")
}

function get_photo_mode() {
    if ($(document).data("photo_mode") == null) {
        return "article"
    } else {
        return $(document).data("photo_mode")
    }
}

// ****************
// * COMMON STUFF *
// ****************

$.fn.conditional_append = function(condition, content) {
    if (condition) {
        this.append(content)
    }
    return this
}


$.fn.p = function(text){
    if (!text) {
        return this
    }
    var converter = new Showdown.converter()
    var text = converter.makeHtml(text)
    this.append(text)
    return this
}


$.fn.append_csv = function(list){
    if (list.length == 0) {
        return this
    }

    var sep = ""
    var mythis = this
    $.each(list, function(i, item){
        mythis.append(sep)
        mythis.append(item)
        sep = ", "
    })

    return this
}


// ****************
// * BASE WIDGETS *
// ****************

$.widget('ui.myselectable', $.ui.selectable, {
    _mouseStart: function(event) {
        if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
            this._super( event );
        }
    },
});


$.widget('ui.autocompletehtml', $.ui.autocomplete, {
    _create: function(){
        this._super();
        this.sizeul = true
    },

    _renderItem: function(ul, item) {
        if (this.sizeul) {
            if(ul.css('max-width')=='none') ul.css('max-width',this.outerWidth());
            this.sizeul = false
        }
        return $("<li></li>")
            .data("item.autocomplete", item)
            .append("<a>" + item.match + "</a>")
            .appendTo(ul);
    },
});


$.widget('ui.ajaxautocomplete',  $.ui.autocompletehtml, {
    options: {
    },

    _create: function(){
        this.id = this.element.attr("id")
        this.name = this.element.attr("name")

        this.text = $('<input/>')
            .attr("id", this.id)
            .attr("type", "text")

        this.input = $('<input type="hidden"/>')
            .attr("name", this.name)

        this.deck = $('<div class="results_on_deck"></div>')

        this.element
            .removeAttr("id")
            .removeAttr("name")
            .append(this.text)
            .append(this.input)
            .append(this.deck)
            .append("<p class='help'>Enter text to search.</p>")

        this.uidiv = this.element
        this.element = this.text

        var options = this.options
        if (options.initial != null) {
            this.set(options.initial)
            delete options.initial
        }

        if (options.type != null) {
            options.source =  "/ajax/ajax_lookup/" + options.type
            delete options.type
        }

        this.element.on(
            this.widgetEventPrefix + "select",
            $.proxy(this._receiveResult, this)
        )
        this._super();
    },

    _destroy: function() {
        this.element.empty()
        this._super();
    },

    set: function(item) {
        this.deck.children().remove();
        if (item != null) {
            this.input.val(item.pk)
            this._addKiller(item)
        }
    },

    get: function() {
        return this.input.val()
    },

    _receiveResult: function(ev, ui) {
        if (this.input.val()) {
            this._kill();
        }
        this.input.val(ui.item.pk);
        this.text.val('');
        this._addKiller(ui.item);
        this._trigger("added", ev, ui.item);
        return false;
    },

    _addKiller: function(item) {
        var killButton = $('<span class="ui-icon ui-icon-trash">X</span> ');
        var div = $("<div></div>")
            .attr("id", this.id+'_on_deck_'+item.pk)
            .append(killButton)
            .append(item.repr)
            .appendTo(this.deck)
        killButton.on("click", $.proxy(
            function(ev) {
                this._kill(item, div);
                return this._trigger("killed", ev, item)
            },
            this))
    },

    _kill: function(item, div) {
        this.input.val('');
        this.deck.children().fadeOut(1.0).remove();
    },

    widget: function() {
        return this.uidiv
    },
})


$.widget('ui.ajaxautocompletemultiple',  $.ui.ajaxautocomplete, {
    set: function(initial) {
        if (initial.length > 0) {
            var value = $.map(initial, function(v){ return v.pk });
            this.input.val("|" + value.join("|") + "|")
        } else {
            this.input.val("|")
        }
        this.deck.children().remove();
        var mythis = this
        $.each(initial, function(i, v) {
            mythis._addKiller(v)
        });
    },

    get: function() {
        var value = this.input.val().slice(1,-1)
        if (value != "") {
            return value.split("|")
        } else {
            return []
        }
    },

    _receiveResult: function(ev, ui) {
        prev = this.input.val();

        if (prev.indexOf("|"+ui.item.pk+"|") == -1) {
                this.input.val((prev ? prev : "|") + ui.item.pk + "|");
                this.text.val('');
                this._addKiller(ui.item);
                this._trigger("added",  ev, ui.item);
        }

        return false;
    },

    _kill: function(item, div) {
        this.input.val(this.input.val().replace("|" + item.pk + "|", "|"));
        div.fadeOut().remove();
    },
})


$.widget('ui.quickautocomplete', $.ui.ajaxautocomplete, {
    _create: function(){
        delete this.options.type
        this.options.source = operations,
        this._super();
    },

    _renderItem: function( ul, item ) {
        return $( "<li>" )
            .append( "<a>" + item.label + "<br/>" + item.desc + "</a>" )
            .appendTo( ul );
    },

    _receiveResult: function(ev, ui) {
        // same as _super() but this.text isn't cleared
        if (this.input.val()) {
            this._kill();
        }
        this.input.val(ui.item.pk);
        this._addKiller(ui.item);
        this._trigger("added", ev, ui.item);
        return true;
    },

    _addKiller: function(item) {
        // same as _super() but uses item.desc instead of item.repr
        var killButton = $('<span class="ui-icon ui-icon-trash">X</span> ');
        var div = $("<div></div>")
            .attr("id", this.id+'_on_deck_'+item.pk)
            .append(killButton)
            .append(item.desc)
            .appendTo(this.deck)
        killButton.on("click", $.proxy(
            function(ev) {
                this._kill(item, div);
                return this._trigger("killed", ev, item)
            },
            this))
    },

    _suggest: function( items ) {
        if (items.length != 1) {
            this._super( items );
            return
        }
        var item = items[0]
        if ( false !== this._trigger( "select", null, { item: item } ) ) {
            this._value( item.value );
        }
        // reset the term after the select event
        // this allows custom select handling to work properly
        this.term = this._value();

        this.close();
        this.selectedItem = item;
    }
});


$.widget('ui.photo_select',  $.ui.ajaxautocomplete, {
    _create: function(){
        this.img = $("<img></img>")
            .image({size: get_settings().list_size})
            .appendTo(this.element)

        this.options.type = "photo"
        this._super();
    },

    _destroy: function() {
        this.img.image("destroy")
        this._super();
    },

    set: function(photo) {
        this.img.image("set", photo)
        item = null
        if (photo != null) {
            var item = { pk: photo.id, repr: photo.title }
        }
        this._super(item);
    },

    _receiveResult: function(ev, ui) {
        this._super(ev, ui);
        var mythis = this
        this.img.image("set_loading")
        load_photo(ui.item.pk,
            function(data) {
                mythis.img.image("set", data.photo)
            },
            function(message) {
                mythis.img.image("set_error")
            }
        )
        return false
    }
})


$.widget('ui.ajaxautocompletesorted',  $.ui.ajaxautocompletemultiple, {
    _create: function(){
        this._super()
        this.deck
            .sortable()
            .on("sortstop", $.proxy(
                function() {
                    var value = this.deck.sortable( "toArray" )
                    value = $.map(value, function(id) {
                        return id.match(/(.+)[\-=_](.+)/)[2]
                    })
                    if (value.length > 0) {
                        this.input.val("|" + value.join("|") + "|")
                    } else {
                        this.input.val("|")
                    }
                },
                this)
            )
    }
})


$.widget('ui.spud_menu', {
    _create: function() {

        this.element
            .addClass("menu")

        this._super()
    },

    _destroy: function() {
        this.element
            .empty()
            .removeClass("menu")
        this._super()
    },

    add_item: function(a) {
        var li = $("<li/>")
            .html(a)
            .on("click", function(ev) { a.trigger('click'); })
            .appendTo(this.element)
        return this
    },
})


$.widget('ui.main_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        this.set()
    },

    set: function() {
        this.element.empty()
        this.add_item(albums.a({id: 1}, "Albums"))
        this.add_item(categorys.a({id: 1}, "Categories"))
        this.add_item(places.a({id: 1}, "Places"))
        this.add_item(persons.search_results_a({}, 0))
        this.add_item(photo_search_results_a({}, 0))
    },
})


$.widget('ui.selection_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.selection != null) {
            this.set(this.options.selection)
        }
    },

    set: function(selection) {
        this.element.empty()
        if (selection.length > 0) {
            var search = {
                criteria: {
                    photos: selection.join(".")
                }
            }

            this.add_item(photo_search_results_a(search, 0, "Show"))
            this.add_item(
                $("<a href='#'>Clear</a>")
                .on("click", function() { set_selection([]); reload_page(); return false; })
            )
        }
    },
})

$.widget('ui.paginator', {
    _create: function() {
        this.element
            .addClass("paginator")

        if (this.options.page != null) {
            this.set(this.options.page, this.options.last_page)
        }
    },

    _destroy: function() {
        this.element
            .empty()
            .removeClass("paginator")
        this._super()
    },

     _range: function(page, first, last) {
        var html_page = this.options.html_page
        for (var i=first; i<=last; i++) {
            if (i == page)
                this.element.append('<span class="this-page">' + escapeHTML(i+1) + '</span>')
            else
                this.element.append(html_page(i, i+1))
            this.element.append(" ")
        }
    },

    set: function(page, last_page) {
        var html_page = this.options.html_page

        this.element.empty()

        if (page > 0) {
            this.element.append(html_page(page-1, '<').attr("accesskey", "p"))
            this.element.append(" ")
        }
        if (page < last_page) {
            this.element.append(html_page(page+1, '>').attr("accesskey", "n"))
            this.element.append(" ")
        }

        var ON_EACH_SIDE = 3
        var ON_ENDS = 2

        // If there are 10 or fewer pages, display links to every page.
        // Otherwise, do some fancy
        if (last_page <= 10) {
            this._range(page, 0, last_page)
        } else {
            // Insert "smart" pagination links, so that there are always ON_ENDS
            // links at either end of the list of pages, and there are always
            // ON_EACH_SIDE links at either end of the "current page" link.
            if (page > (ON_EACH_SIDE + ON_ENDS)) {
                this._range(0, ON_ENDS-1)
                this.element.append('<span class="dots">...</span>')
                this._range(page, page - ON_EACH_SIDE, page-1)
            } else {
                this._range(page, 0, page-1)
            }

            if (page < (last_page - ON_EACH_SIDE - ON_ENDS)) {
                this._range(page, page, page + ON_EACH_SIDE)
                this.element.append('<span class="dots">...</span>')
                this._range(page, last_page - ON_ENDS + 1, last_page)
            } else {
                this._range(page, page, last_page)
            }
        }
    },
})


$.widget('ui.image', {
    _create: function() {
        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },

    _clear: function() {
        this.element
            .removeClass("photo-D")
            .removeClass("photo-R")
            .removeAttr("id")
            .removeAttr("class")
            .removeAttr("alt")
            .removeAttr("width")
            .removeAttr("height")
    },

    _destroy: function() {
        this._clear()
    },

    set: function(photo) {
        var image = null
        if (photo != null) {
            var image = photo.thumb[this.options.size]
        }

        if (image != null) {
            this.element
                .attr('id', photo)
                .attr('src', image.url)
                .attr('width', image.width)
                .attr('height', image.height)
                .attr('alt', photo.title)
            this.width = image.width
            this.height = image.height
        } else {
            this._clear()
            this.element.attr("src", media_url("img/none.jpg"))
            this.width = null
            this.height = null
        }
    },

    set_error: function() {
        this._clear()
        this.element.attr("src", media_url("img/error.png"))
    },

    set_loading: function() {
        this._clear()
        this.element.attr("src", media_url("img/ajax-loader.gif"))
    },

    resize: function(enlarge) {
        var width = this.width
        var height = this.height

        var img = this.element
        var aspect = width/height

        var innerWidth = window.innerWidth
        var innerHeight = window.innerHeight

        if (enlarge) {
            width = innerWidth
            height = width / aspect
        }

        if (width > innerWidth) {
            width = innerWidth
            height = width / aspect
        }

        if (height > innerHeight) {
            height = innerHeight
            width = height * aspect
        }

        if (enlarge) {
            img.css("padding-top", (window.innerHeight-height)/2 + "px")
            img.css("padding-bottom", (window.innerHeight-height)/2 + "px")
            img.css("padding-left", (window.innerWidth-width)/2 + "px")
            img.css("padding-right", (window.innerWidth-width)/2 + "px")
        }
        img.attr('width', width)
        img.attr('height', height)
    },
})


$.widget('ui.photo_list_base',  {
    _create: function() {
        this.element
            .addClass("photo_list")

        this.ul = $("<ul></ul")
            .appendTo(this.element)

        this.p = $("<p></p>")
            .paginator({
                html_page: this.options.html_page
            })
            .appendTo(this.element)

        if (this.options.page != null) {
            this.set_paginator(this.options.page, this.options.last_page)
        }
    },

    set_paginator: function(page, last_page) {
        this.p.paginator("set", page, last_page)
    },

    empty: function() {
        this.ul.empty()
    },

    append_photo: function(photo, title, sort, description, a) {
        a
                .data("photo", null)
                .empty()

        if (photo != null) {
            var style = get_photo_style(photo)
            $("<img />")
                .image({ photo: photo, size: get_settings().list_size })
                .appendTo(a)
        }

        $("<div class='title'></div>")
            .text(title)
            .appendTo(a)

        if (sort) {
            $("<div class='sort'></div>")
                .text(sort)
                .appendTo(a)
        }
        if (description) {
            $("<div class='desc'></div>")
                .p(description)
                .appendTo(a)
        }

        li = $("<li />")
            .attr('class', "photo_list_item")
            .addClass(style)
            .append(a)
            .on("click", function(ev) { a.trigger('click'); })
            .appendTo(this.ul)

        return li
    },

    _destroy: function() {
        this.p
            .paginator("destroy")

        this.element.find("img")
            .image("destroy")

        this.element
            .removeAttr("photo_list")
            .empty()

        this._super()
    },
})


function object_a(object) {
    if (object == null) {
        return $("<span>None</span>")
    } else if (object.type == "photo") {
        return photo_a(object)
    } else if (object.type == "album") {
        return albums.a(object)
    } else if (object.type == "category") {
        return categorys.a(object)
    } else if (object.type == "place") {
        return places.a(object)
    } else if (object.type == "person") {
        return persons.a(object)
    } else if (object.type == "datetime") {
        return datetime_a(object)
    } else {
        return $("<span></span>")
            .text(object.title + " (" + object.type + ")")
    }
}

