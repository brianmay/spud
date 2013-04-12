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


$.fn.append_list = function(list){
    if (list.length == 0) {
        return this
    }

    var ul = $("<ul></ul>")

    $.each(list, function(i, item){
        $("<li></li>")
            .append(item)
            .appendTo(ul)
    })

    ul.appendTo(this)
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


$.widget('ui.quickautocomplete', $.ui.autocomplete, {
    _renderItem: function( ul, item ) {
        return $( "<li>" )
            .append( "<a>" + item.label + "<br/>" + item.desc + "</a>" )
            .appendTo( ul );
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
            this.load(options.initial)
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

    load: function(item) {
        if (item != null) {
            this.input.val(item.pk)
            this._addKiller(item)
        } else {
            this._kill();
        }
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
    load: function(initial) {
        if (initial.length > 0) {
            var value = $.map(initial, function(v){ return v.pk });
            this.input.val("|" + value.join("|") + "|")
        } else {
            this.input.val("|")
        }
        var mythis = this
        $.each(initial, function(i, v) {
            mythis._addKiller(v)
        });
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


$.widget('ui.infobox', {
    _create: function(){
        if (this.options.title != null) {
            $("<h2></h2")
                .text(this.options.title)
                .appendTo(this.element)
        }

        this.dl = $("<dl></dl>")
            .appendTo(this.element)

        this.dt = {}
        this.dd = {}

        this._super()
    },

    _destroy: function() {
        this.element.empty()
        this._super()
    },

    add_field: function(id, title) {
        var dt = $("<dt/>")
            .text(title)
            .appendTo(this.dl)
        var dd = $("<dd/>")
            .appendTo(this.dl)
        this.dt[id] = dt
        this.dd[id] = dd
        return dd
    },

    get_field: function(id) {
        return this.dd[id]
    },

    toggle_field: function(id, showOrHide) {
        this.dt[id].toggle(showOrHide)
        this.dd[id].toggle(showOrHide)
    },
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
        this.load()
    },

    load: function() {
        this.element.empty()
        this.add_item(album_a({id: 1}, "Albums"))
        this.add_item(category_a({id: 1}, "Categories"))
        this.add_item(place_a({id: 1}, "Places"))
        this.add_item(person_search_results_a({}, 0))
        this.add_item(photo_search_results_a({}, 0))
    },
})


$.widget('ui.selection_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.selection != null) {
            this.load(this.options.selection)
        }
    },

    load: function(selection) {
        this.element.empty()
        if (selection.length > 0) {
            var search = {
                params: {
                    photo: selection.join(".")
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

$.widget('ui.form_dialog',  $.ui.dialog, {
    _create: function() {
        var mythis = this
        var options = this.options

        if (options.description != null) {
            $("<p/>")
                .text(options.description)
                .appendTo(this.element)
            delete options.description
        }

        var submit = "Continue"
        if (options.button != null) {
            submit = options.button
            delete options.button
        }

        this.f = $("<form method='get' />")
            .appendTo(this.element)

        this.table = $("<table />")
            .appendTo(this.f)

        options.buttons = {}
        options.buttons[submit] = function() {
            mythis._submit()
        }
        options.buttons['Cancel'] = function() {
            mythis.close()
        }

        this.input = {}

        this._super()

        this.element.on(
            "keypress",
            function(ev) {
                if (ev.which == 13 && !ev.shiftKey) {
                    mythis._submit()
                    return false
                    }
            }
        )
        this.element.on(
            this.widgetEventPrefix + "close",
            function( ev, ui ) {
                mythis.destroy()
            }
        )
    },

    _submit: function() {
    },

    _destroy: function() {
        this.element
            .empty()
            .removeClass("menu")
        this._super()
    },

    _add_field: function(id, title) {
        var th = $("<th/>")

        $("<label/>")
            .attr("for", "id_" + id)
            .html(escapeHTML(title + ":"))
            .appendTo(th)


        var td = $("<td/>")

        $("<tr/>")
            .append(th)
            .append(td)
            .appendTo(this.table)

        return td
    },

    _add_ajax_select_field: function(id, title, type) {
        var params = {
            "type": type,
        }

        this.input[id] = $("<span/>")
            .attr("name", id)
            .attr("id", "id_" + id)
            .ajaxautocomplete(params)

        this._add_field(id, title)
            .append(this.input[id])
    },

    _set_ajax_select_field: function(id, value) {
        var item = null
        if (value != null) {
            item = {
                pk: value.id,
                repr: value.title,
            }
        }
        this.input[id].ajaxautocomplete("load", item)
    },

    add_text_field: function(id, title, required) {
        this.input[id] = $('<input />')
            .attr('type', "text")
            .attr('name', id)
            .attr('id', "id_" + id)
        this._add_field(id, title)
            .append(this.input[id])
    },

    add_album_field: function(id, title, required) {
        this._add_ajax_select_field(id, title, "album")
    },

    set_album_field: function(id, value) {
        this._set_ajax_select_field(id, value)
    },

    set_text_field: function(id, value) {
        this.input[id].val(value)
    },



    get_field: function(id) {
        var form = this.f[0]
        return form[id].value.trim()
    },
})


$.widget('ui.paginator', {
    _create: function() {
        this.element
            .addClass("paginator")

        if (this.options.page != null) {
            this.load(this.options.page, this.options.last_page)
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

    load: function(page, last_page) {
        var html_page = this.options.html_page

        this.element.empty()

        if (page > 0) {
            this.element.append(html_page(page-1, '<').attr("accesskey", "p"))
        }
        if (page < last_page) {
            this.element.append(html_page(page+1, '>').attr("accesskey", "n"))
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
                range(0, ON_ENDS-1)
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

