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

        this.input = $('<input type="hidden"/>')
            .attr("name", this.name)

        this.deck = $('<div class="results_on_deck"></div>')

        this.text = this.element
            .removeAttr("name")
            .attr("type", "text")
            .wrap("<span></span>")

        this.uidiv = this.text
            .parent()
            .append(this.input)
            .append(this.deck)
            .append("<p class='help'>Enter text to search.</p>")

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
        var input = this.text
            .attr("name", this.name)
            .removeAttr("type")
            .detach()
        this.uidiv
            .replaceWith(input)
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



