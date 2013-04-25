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

$.widget('spud.myselectable', $.ui.selectable, {
    _mouseStart: function(event) {
        if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
            this._super( event );
        }
    },
});


$.widget('spud.autocompletehtml', $.ui.autocomplete, {
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


$.widget('spud.ajaxautocomplete',  $.spud.autocompletehtml, {
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


$.widget('spud.ajaxautocompletemultiple',  $.spud.ajaxautocomplete, {
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


$.widget('spud.quickautocomplete', $.spud.ajaxautocomplete, {
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


$.widget('spud.photo_select',  $.spud.ajaxautocomplete, {
    _create: function(){
        this.img = $("<div></div>")
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


$.widget('spud.ajaxautocompletesorted',  $.spud.ajaxautocompletemultiple, {
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


$.widget('spud.spud_menu', {
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


$.widget('spud.main_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        this.set()
    },

    set: function() {
        search = { criteria: { root_only: true} }
        this.element.empty()
        this.add_item(albums.search_results_a(search, 0, "Albums"))
        this.add_item(categorys.search_results_a(search, 0, "Categories"))
        this.add_item(places.search_results_a(search, 0, "Places"))

        search = { criteria: { root_only: false} }
        this.add_item(persons.search_results_a(search, 0, "People"))
        this.add_item(feedbacks.search_results_a(search, 0, "Feedback"))
        this.add_item(photo_search_results_a({}, 0))
    },
})


$.widget('spud.selection_menu', $.spud.spud_menu, {
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

$.widget('spud.paginator', {
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
                this._range(page, 0, ON_ENDS-1)
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


$.widget('spud.image', {
    _create: function() {
        this.element.addClass("image")

        this.img = $("<img></img>")

        if (this.options.include_link) {
            this.a = $("<a></a>")
                .html(this.img)
                .appendTo(this.element)
        } else {
            this.img.appendTo(this.element)
        }

        if (this.options.photo != null) {
            this.set(this.options.photo)
        }
    },

    _clear: function() {
        this.img
            .removeAttr("src")
            .removeAttr("class")
            .removeAttr("alt")
            .removeAttr("width")
            .removeAttr("height")
        if (this.a) {
            this.a
                .removeAttr("href")
                .off("click")
        }
    },

    _destroy: function() {
        this.element.removeClass("image")
        this._clear()
    },

    set: function(photo) {
        var image = null
        if (photo != null) {
            var image = photo.thumb[this.options.size]
        }

        if (image != null) {
            this._clear()
            this.img
                .attr('src', image.url)
                .attr('width', image.width)
                .attr('height', image.height)
                .attr('alt', photo.title)
            if (this.a != null) {
                this.a
                    .attr('href', photo_url(photo, {}))
                    .off('click')
                    .on('click', function() { do_photo(photo.id, {}, true); return false; })
            }
            this.width = image.width
            this.height = image.height
        } else {
            this._clear()
            this.img
                .attr('width', 120)
                .attr("src", media_url("img/none.jpg"))
            this.width = 227
            this.height = 222
        }
    },

    set_error: function() {
        this._clear()
        this.img.attr("src", media_url("img/error.png"))
    },

    set_loading: function() {
        this._clear()
        this.img.attr("src", media_url("img/ajax-loader.gif"))
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


$.widget('spud.list_base',  {
    _create: function() {
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
        this.element.removeClass("loading")
        this.element.removeClass("errors")
    },

    append_item: function(html) {
        li = $("<li />")
            .append(html)
            .appendTo(this.ul)
        return li
    },

    clear_status: function() {
        this.element.removeClass("loading")
        this.element.removeClass("errors")
    },

    display_loading: function() {
        this.element.addClass("loading")
    },

    display_error: function() {
        this.empty()
        this.element.addClass("errors")
    },

    _destroy: function() {
        this.p
            .paginator("destroy")
        this.empty()
        this._super()
    },
})


$.widget('spud.photo_list_base',  $.spud.list_base, {
    _create: function() {
        this.element
            .addClass("photo_list")
        this._super()
    },

    empty: function() {
        this.element.find("img")
            .image("destroy")
        this._super()
    },

    append_photo: function(photo, title, sort, description, a) {
        a
                .data("photo", null)
                .empty()

        if (photo != null) {
            var style = get_photo_style(photo)
            $("<div />")
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
            .attr('class', "photo_item")
            .addClass(style)
            .append(a)
            .on("click", function(ev) { a.trigger('click'); })
            .appendTo(this.ul)

        return li
    },

    clear_status: function() {
        this.element.removeClass("loading")
        this.element.removeClass("errors")
    },

    _destroy: function() {
        this.element
            .removeAttr("photo_list")
        this._super()
    },
})


function object_a(object) {
    if (object == null) {
        return $("<span>None</span>")
    } else if (object.type == "photo") {
        return photo_a(object, {})
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

