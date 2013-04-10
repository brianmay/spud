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

        this._setInitial()

        var options = this.options
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

    _setInitial: function() {
        var options = this.options
        if (options.item != null) {
            options.initial = [ options.item.repr, options.item.pk ]
            this.input.attr("value", options.item.pk)
            this._addKiller(options.item)
            delete options.item
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
    _setInitial: function() {
        var options = this.options
        if (options.items != null) {
            if (options.items.length > 0) {
                var value = $.map(options.items, function(v){ return v.pk });
                this.input.val("|" + value.join("|") + "|")
            } else {
                this.input.val("|")
            }
            var mythis = this
            $.each(options.items, function(i, v) {
                mythis._addKiller(v)
            });
        } else {
            this.input.attr("value", "|")
        }
        delete options.items
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
        $("<h2></h2")
            .text(this.options.title)
            .appendTo(this.element)

        this.dl = $("<dl></dl>")
            .appendTo(this.element)

        this.fields = {}

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
        this.fields[id] = dd
        return dd
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
        this.load()
    },

    load: function() {
        this.element.empty()
        this.add_item(album_a({id: 1}, "Albums"))
        this.add_item(category_a({id: 1}, "Categories"))
        this.add_item(place_a({id: 1}, "Places"))
        this.add_item(person_search_results_a({}, 0))
        this.add_item(search_results_a({}, 0))
    },
})

$.widget('ui.selection_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        this.load(this.options.selection)
    },

    load: function(selection) {
        this.element.empty()
        if (selection.length > 0) {
            this.add_item(search_results_a(search, 0, "Show"))
            this.add_item(
                $("<a href='#'>Clear</a>")
                .on("click", function() { set_selection([]); reload_page(); return false; })
            )
        }
    },
})
