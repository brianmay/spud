/// <reference path="globals.ts" />
/// <reference path="generic.ts" />
/// <reference path="urls.ts" />
/// <reference path="DefinitelyTyped/jquery.d.ts" />
/// <reference path="DefinitelyTyped/jqueryui.d.ts" />
/// <reference path="DefinitelyTyped/showdown.d.ts" />
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


// ****************
// * COMMON STUFF *
// ****************

$(document)
    .tooltip({
        items: "a",
        content: () => {
            let photo = $(this).data('photo')
            if (photo != null) {
                let div = $("<div></div>")
                let image = new ImageWidget({
                    size: 'thumb',
                    photo: photo,
                    do_video: false,
                    include_link: false,
                })
                image.show(div)
                return div
            }
            return null
        },
    })

$.fn.conditional_append = function(condition, content) {
    if (condition) {
        this.append(content)
    }
    return this
}

$.fn.p = function(text){
    if (!text) {
        this.empty()
        return this
    }
    var converter = new Showdown.converter()
    text = converter.makeHtml(text)
    this.html(text)
    return this
}

$.fn.set_widget = function(widget : Widget){
    widget.show(this)
    return this
}

$.fn.append_csv = function(list){
    if (list.length === 0) {
        return this
    }

    var sep = ""
    $.each(list, (i, item) => {
        this.append(sep)
        this.append(item)
        sep = ", "
    })

    return this
}

function get_streamable(streamable : PostStreamable, key : string) : PostStreamableType {
    if (streamable == null) {
        return null
    }
    return streamable[key]
}

function streamable_to_number(value : PostStreamableType) : number {
    if (typeof value === "string") {
        return parseInt(value, 10)
    } else if (typeof value === "number") {
        return value
    } else {
        return null
    }
}

function streamable_to_string(value : PostStreamableType) : string {
    if (typeof value === "string") {
        return value
    } else if (typeof value === "number") {
        return value + ""
    } else if (typeof value === "boolean") {
        return value + ""
    } else {
        return null
    }
}

function streamable_to_boolean(value : PostStreamableType) : boolean {
    if (typeof value === "string") {
        if (value.toLowerCase()=="true") {
            return true
        } else if (value.toLowerCase()=="false") {
            return false
        } else {
            return null
        }
    } else if (typeof value === "number") {
        return (value)?true:false
    } else if (typeof value === "boolean") {
        return value
    } else {
        return null
    }
}

function streamable_to_datetimezone(value : PostStreamableType, offset : number) : DateTimeZone {
    if (typeof value === "string") {
        return [
            moment.utc(value),
            offset,
        ]
    } else {
        return null
    }
}

function streamable_to_number_array(value : PostStreamableType) : Array<number> {
    if (typeof value === "string") {
        let str_array : Array<string> = value.split(",")
        return $.map(str_array, (item : string) => { return parseInt(item, 10); })
    } else {
        return null
    }
}

function streamable_to_array(value : PostStreamableType) : Array<PostStreamableType> {
    if (value instanceof Array) {
        return value
    } else {
        return []
    }
}

function streamable_to_string_array(value : PostStreamableType) : StringArray<PostStreamableType> {
    if (value instanceof Object) {
        return value as StringArray<PostStreamableType>
    } else {
        return {}
    }
}


function streamable_to_object(value : PostStreamableType) : PostStreamable {
    if (value instanceof Object) {
        return value as PostStreamable
    } else {
        return null
    }
}

function get_streamable_number(streamable : PostStreamable, key : string) : number {
    let value = get_streamable(streamable, key)
    return streamable_to_number(value)
}

function get_streamable_string(streamable : PostStreamable, key : string) : string {
    let value = get_streamable(streamable, key)
    return streamable_to_string(value)
}

function get_streamable_boolean(streamable : PostStreamable, key : string) : boolean {
    let value = get_streamable(streamable, key)
    return streamable_to_boolean(value)
}

function get_streamable_datetimezone(streamable : PostStreamable, key : string, offset : number) : DateTimeZone {
    let value = get_streamable(streamable, key)
    return streamable_to_datetimezone(value, offset)
}

function get_streamable_number_array(streamable : PostStreamable, key : string) : Array<number> {
    let value = get_streamable(streamable, key)
    return streamable_to_number_array(value)
}

function get_streamable_array(streamable : PostStreamable, key : string) : Array<PostStreamableType> {
    let value = get_streamable(streamable, key)
    return streamable_to_array(value)
}

function get_streamable_string_array(streamable : PostStreamable, key : string) : StringArray<PostStreamableType> {
    let value = get_streamable(streamable, key)
    return streamable_to_string_array(value)
}

function get_streamable_object(streamable : PostStreamable, key : string) : PostStreamable {
    let value = get_streamable(streamable, key)
    return streamable_to_object(value)
}

function set_streamable_value(streamable : Streamable, key : string, value : string | number | boolean) : void {
    if (value != null) {
        streamable[key] = value
    }
}

function set_streamable_array_as_string(streamable : Streamable, key : string, array : Array<string | number | boolean>) : void {
    if (array != null) {
        streamable[key] = array.join(",")
    }
}

function set_streamable_array_as_array(streamable : PostStreamable, key : string, array : Array<string | number | boolean>) : void {
    if (array != null) {
        streamable[key] = array
    }
}

function set_streamable_datetimezone_datetime(streamable : Streamable, key : string, value : DateTimeZone) : void {
    if (value != null) {
        streamable[key] = value[0].toISOString()
    }
}

function set_streamable_datetimezone_offset(streamable : Streamable, key : string, value : DateTimeZone) : void {
    if (value != null) {
        streamable[key] = value[1]
    }
}

function streamable_datetimezone_datetime(value : DateTimeZone) : string {
    if (value != null) {
        return value[0].toISOString()
    } else {
        return null
    }
}

function streamable_datetimezone_offset(value : DateTimeZone) : number {
    if (value != null) {
        return value[1]
    } else {
        return null
    }
}


// ****************
// * BASE WIDGETS *
// ****************

$.widget('spud.widget', {
    get_uuid: function() {
        return this.widgetName + "." + this.uuid
    },

    _destroy: function() {
        remove_all_listeners(this)
        this._super()
    },

    _enable: function() {
    },

    _disable: function() {
    },

    _setOption: function( key, value ) {
        if (key === "disabled") {
            if (!value) {
                this._enable()
            } else {
                this._disable()
            }
        }
        this._super( key, value );
    },

});

$.widget('spud.myselectable', $.ui.selectable, {
    _mouseStart: function(event) {
        if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
            this._super( event );
        }
    },

    _disable: function() {
    },

    _enable: function() {
    },

    _setOption: function( key, value ) {
        if (key === "disabled") {
            if (!value) {
                this._enable()
            } else {
                this._disable()
            }
        }
        this._super( key, value );
    },
});


$.widget('spud.autocompletehtml', $.ui.autocomplete, {
    _create: function(){
        this._super();
        this.sizeul = true
    },

    _renderItem: function(ul, item) {
        if (this.sizeul) {
            if (ul.css('max-width') === 'none') {
                ul.css('max-width', this.outerWidth());
            }
            this.sizeul = false
        }
        return $("<li></li>")
            .data("item.autocomplete", item)
            .append( $("<a/>").html(item.label) )
            .appendTo(ul);
    },

    get_uuid: function() {
        return this.widgetName + "." + this.uuid
    },

    _destroy: function() {
        remove_all_listeners(this)
        this._super()
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

        this.deck = $('<div class="results_on_deck"></div>')

        this.element
            .removeAttr("id")
            .removeAttr("name")
            .append(this.text)
            .append(this.deck)
            .append("<p class='help'>Enter text to search.</p>")

        this.uidiv = this.element
        this.element = this.text

        var options = this.options
        if (options.initial != null) {
            this._set(options.initial)
            delete options.initial
        }

        if (options.type != null) {
            options.source = "/api/" + options.type
        }

        this.element.on(
            this.widgetEventPrefix + "select",
            $.proxy(this._receiveResult, this)
        )
        this._super();
    },

    _enable: function() {
        this.text.attr('disabled', null)
    },

    _disable: function() {
        this.text.attr('disabled', true)
    },

    _setOption: function( key, value ) {
        if (key === "initial") {
            this._set(value)
        } else if (key === "disabled") {
            if (!value) {
                this._enable()
            } else {
                this._disable()
            }
        }
        this._super( key, value );
    },

    set: function(obj, obj_pk) {
        this._set(obj, obj_pk)
    },

    _set: function(obj, obj_pk) {
        this.deck.children().remove();
        if (obj != null) {
            this._addKiller(obj, null)
        } else if (obj_pk != null) {
            this._addKiller(null, obj_pk)
        } else {
            // FIXME - we should remove any current selections
        }
    },

    get: function() {
        var children = this.deck.children()

        var value = $.map(children, (child : Element) => {
            var obj = $(child).data('obj')
            return obj
        })

        if (value.length >= 1) {
            return value[0]
        } else {
            return null
        }
    },

    _initSource: function() {
        this.source = ( request, response ) => {
            let obj_type = this.options.obj_type

            if (this.loader != null) {
                this.loader.remove_listener(this)
            }

            obj_type.criteria_from_streamable(request, (criteria) => {
                let loader = obj_type.load_list(criteria)
                loader.loaded_list.add_listener(this, (notification) => {
                    this.loader = null
                    let list : Array<Photo> = []
                    for (let i=0; i<notification.list.length; i++) {
                        let obj : Photo = notification.list[i]
                        list.push(obj)
                    }
                    response(list);
                })
                loader.on_error.add_listener(this, () => {
                })
                loader.load_next_page()

                this.loader = loader
            })
        };
    },

    _receiveResult: function(ev, ui) {
        this.deck.empty()
        this.text.val('');
        this._addKiller(ui.item.obj, null);
        this._trigger("added", ev, ui.item.obj);
        return false;
    },

    _loaded_killer: function(repr, obj) {
        var item = this._normalize_item(obj)
        repr.text(item.repr)
    },

    _addKiller: function(obj, obj_pk) {
        if (obj != null) {
            obj_pk = obj.id
        }

        var killButton = $('<span class="ui-icon ui-icon-trash">X</span> ');
        var repr = $("<div></div>").text("loading")
        var div = $("<div></div>")
            .attr("id", this.id + '_on_deck_' + obj_pk)
            .data("obj", obj)
            .append(killButton)
            .append(repr)
            .appendTo(this.deck)

        if (obj != null || obj_pk == null) {
            this._loaded_killer(repr, obj)
        } else {
            let obj_type = this.options.obj_type
            let loader = obj_type.load(obj_pk)
            loader.loaded_item.add_listener(this, (killer_obj : SpudObject) => {
                this._loaded_killer(repr, killer_obj)
            })
            loader.on_error.add_listener(this, (message : string) => {
                console.log(message)
                repr.text("error")
                    .addClass("error")
            })
        }

        killButton.on("click", (ev) => {
            this._kill(obj_pk, div);
            return this._trigger("killed", ev, obj)
        })
    },

    _kill: function(obj_pk, div) {
        void div
        this.deck.children().fadeOut(1.0).remove();
    },

    widget: function() {
        return this.uidiv
    },

    _search: function( value ) {
        this.pending++;
        this.element.addClass( "ui-autocomplete-loading" );
        this.cancelSearch = false;
        this.source( { q: value }, this._response() );
    },

    _normalize_item: function( obj ) {
        var div = $("<div/>")

        var photo

        if (obj.cover_photo && obj.cover_photo.thumbs.thumb) {
            photo = obj.cover_photo.thumbs.thumb
            $("<img/>")
                .attr("src", photo.url)
                .attr("alt", "")
                .appendTo(div)
        } else if (obj.thumbs != null && obj.thumbs.thumb) {
            photo = obj.thumbs.thumb
            $("<img/>")
                .attr("src", photo.url)
                .attr("alt", "")
                .appendTo(div)
        }

        if (obj.title) {
            $("<div/>")
                .addClass("title")
                .text(obj.title)
                .appendTo(div)
        }

        if (obj.description) {
            $("<div/>")
                .addClass("desc")
                .p(obj.description)
                .appendTo(div)
        }

        $("<div/>")
            .addClass("clear")
            .appendTo(div)

        return {
            label: div,
            obj: obj,
            repr: obj.title,
            pk: obj.id,
            }
    },

    _normalize: function( objs ) {
        var response = $.map( objs, ( obj ) => {
            return this._normalize_item(obj)
         })
         return response
    },
})


$.widget('spud.ajaxautocompletemultiple',  $.spud.ajaxautocomplete, {
    _create: function(){
        if (this.options.allow_duplicates == null) {
            this.options.allow_duplicates = false
        }
        this._super();
    },

    _set: function(obj_list, pk_list) {
        this.deck.children().remove();

        if (obj_list != null) {
            pk_list = $.map(obj_list, (v) => { return v.pk });
            $.each(obj_list, (i, v) => {
                this._addKiller(v, null)
            });
        } else {
            $.each(pk_list, (i, v) => {
                this._addKiller(null, v)
            });
        }
    },

    get: function() {
        var children = this.deck.children()

        var value = $.map(children, (child : Element) => {
            var obj = $(child).data('obj')
            return obj
        })

        return value
    },

    _receiveResult: function(ev, ui) {
        var prev = this.get()

        if ($.inArray(ui.item.pk, prev) === -1 || this.options.allow_duplicates) {
                this.text.val('');
                this._addKiller(ui.item.obj, null);
                this._trigger("added",  ev, ui.item.obj);
        }

        return false;
    },

    _kill: function(obj_pk, div) {
        div.fadeOut().remove();
    },
})


$.widget('spud.photo_select',  $.spud.ajaxautocomplete, {
    _create: function(){
        this.img = new ImageWidget({size: 'thumb'})
        $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
        this.options.obj_type = new PhotoType()
        this._super();
    },

    _loaded_killer: function(repr, photo) {
        this._super(repr, photo)
        let img : ImageWidget = this.img
        img.set(photo)
    },

    _kill: function(obj_pk, div) {
        this._super(obj_pk, div);
        let img : ImageWidget = this.img
        img.set_none()
    },
})


$.widget('spud.ajaxautocompletesorted',  $.spud.ajaxautocompletemultiple, {
    _create: function(){
        if (this.options.allow_duplicates == null) {
            this.options.allow_duplicates = true
        }
        this._super()
        this.deck
            .sortable()
    },
})
