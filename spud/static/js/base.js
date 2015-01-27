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


$.fn.append_csv = function(list){
    if (list.length === 0) {
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


function extend(base, sub) {
  // Avoid instantiating the base class just to setup inheritance
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
  // for a polyfill
  // Also, do a recursive merge of two prototypes, so we don't overwrite
  // the existing prototype, but still maintain the inheritance chain
  // Thanks to @ccnokes
  var origProto = sub.prototype;
  sub.prototype = Object.create(base.prototype);
  for (var key in origProto)  {
     sub.prototype[key] = origProto[key];
  }
  // Remember the constructor property was set wrong, let's fix it
  sub.prototype.constructor = sub;
  // In ECMAScript5+ (all modern browsers), you can make the constructor property
  // non-enumerable if you define it like this instead
  Object.defineProperty(sub.prototype, 'constructor', {
    enumerable: false,
    value: sub
  });
}

void extend


// function is_equal_objects(x, y)
// {
//   var p;
//   if (x == null) {
//       return false;
//   }
//   for(p in x) {
//       if(typeof(y[p])=='undefined') {return false;}
//   }
//   if (y == null) {
//       return false;
//   }
//   for(p in y) {
//       if(typeof(x[p])=='undefined') {return false;}
//   }
//
//   for(p in y) {
//       if (y[p]) {
//           switch(typeof(y[p])) {
//               case 'object':
//                   if (!is_equal_objects(x[p], y[p])) { return false; } break;
//               case 'function':
//                   break;
//               default:
//                   if (y[p] != x[p]) { return false; }
//           }
//       } else {
//           if (x[p])
//               return false;
//       }
//   }
//
//   return true;
// }


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

// define dialog
$.widget('spud.base_dialog',  $.ui.dialog, {
    _create: function() {
        var mythis = this
        var options = this.options

        this.description = $("<p/>")
            .appendTo(this.element)

        this.element.data('dialog', this)

        if (options.description != null) {
            this.description
                .text(options.description)
        }

        var submit = "Continue"
        if (options.button != null) {
            submit = options.button
        }

        options.buttons = {}
        options.buttons[submit] = function() {
            mythis._check_submit()
        }
        options.buttons.Cancel = function() {
            mythis.close()
        }

        options.width = 400

        this._super()

        this.element.on(
            "keypress",
            function(ev) {
                if (ev.which === 13 && !ev.shiftKey) {
                    mythis._check_submit()
                    return false
                    }
            }
        )
        this.element.on(
            this.widgetEventPrefix + "close",
            function( ev, ui ) {
                void ev
                void ui
                mythis.destroy()
            }
        )

        if (this.options.obj != null) {
            this._set(this.options.obj)
        }
    },

    _check_submit: function() {
        this.disable()
        this._submit()
    },

    _submit: function() {
    },

    set: function(obj) {
        this._setOption("obj", obj)
    },

    _set: function(values) {
        void values
    },

    _disable: function() {
        this.uiDialogButtonPane.find(".ui-button").button("disable")
    },

    _enable: function() {
        this.uiDialogButtonPane.find(".ui-button").button("enable")
    },

    _setOption: function( key, value ) {
        if (key === "obj") {
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

    _destroy: function() {
        remove_all_listeners(this)
        this.element
            .empty()
        this._super()
    },

    set_title: function(title) {
        this.element.parent().find(".ui-dialog-title").html(title)
        return this
    },

    set_description: function(description) {
        this.description.text(description)
        return this
    },

    get_uuid: function() {
        return this.widgetName + "." + this.uuid
    },

    enable: function() {
        return this._setOptions({ disabled: false });
    },

    disable: function() {
        return this._setOptions({ disabled: true });
    },

    _save: function(http_type, oject_id, values) {
        var mythis = this
        var type = this._type
        this._loading = true
        var url
        if (oject_id != null) {
            url = window.__root_prefix + "api/" + type + "/" + oject_id + "/"
        } else {
            url = window.__root_prefix + "api/" + type + "/"
        }
        this.xhr = ajax({
            url: url,
            data: values,
            type: http_type,
            success: function(data) {
                mythis._loading = false
                mythis._save_success(data)
            },
            error: function(message, data) {
                mythis._loading = false
                mythis._save_error(message, data)
            },
        });
    },

    _save_success: function(data) {
        void data
        this.close()
    },

    _save_error: function(message, data) {
        void data
        alert("Error: " + message)
        this.enable()
    },
})

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
        }
    },

    get: function() {
        var children = this.deck.children()

        var value = $.map(children, function(child) {
            var id = $(child).attr('id')
            return parseInt(id.match(/(.+)[\-=_](.+)/)[2])
        })

        if (value.length >= 1) {
            return value[0]
        } else {
            return null
        }
    },

    _initSource: function() {
        var mythis = this
        this.source = function( request, response ) {
            if (mythis.loader != null) {
                mythis.loader.abort()
            }
            mythis.loader = get_object_list_loader(this.options.type, request)
            mythis.loader.loaded_list.add_listener(this, function(object_list) {
                mythis.loader = null
                response(object_list);
            })
            mythis.loader.on_error.add_listener(this, function() {
            })
            mythis.loader.load_next_page()
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
            .append(killButton)
            .append(repr)
            .appendTo(this.deck)

        if (obj != null || obj_pk == null) {
            this._loaded_killer(repr, obj)
        } else {
            var kill_loader = get_object_loader(this.options.type, obj_pk)
            kill_loader.loaded_item.add_listener(this, function(killer_obj) {
                this._loaded_killer(repr, killer_obj)
            })
            kill_loader.on_error.add_listener(this, function() {
                repr.text("error")
                    .addClass("error")
            })
            kill_loader.load()
        }

        killButton.on("click", $.proxy(
            function(ev) {
                this._kill(obj_pk, div);
                return this._trigger("killed", ev, obj)
            },
            this))
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
        var mythis = this
        var response = $.map( objs, function( obj ) {
            return mythis._normalize_item(obj)
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
        var mythis = this

        this.deck.children().remove();

        if (obj_list != null) {
            pk_list = $.map(obj_list, function(v){ return v.pk });
            $.each(obj_list, function(i, v) {
                mythis._addKiller(v, null)
            });
        } else {
            $.each(pk_list, function(i, v) {
                mythis._addKiller(null, v)
            });
        }
    },

    get: function() {
        var children = this.deck.children()

        var value = $.map(children, function(child) {
            var id = $(child).attr('id')
            return parseInt(id.match(/(.+)[\-=_](.+)/)[2])
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


// $.widget('spud.quickautocomplete', $.spud.ajaxautocomplete, {
//     _create: function(){
//         delete this.options.type
//         this.options.source = operations,
//         this._super();
//     },
//
//     _renderItem: function( ul, item ) {
//         return $( "<li>" )
//             .append( "<a>" + item.label + "<br/>" + item.desc + "</a>" )
//             .appendTo( ul );
//     },
//
//     _receiveResult: function(ev, ui) {
//         // same as _super() but this.text isn't cleared
//         if (this.input.val()) {
//             this._kill();
//         }
//         this.input.val(ui.item.pk);
//         this._addKiller(ui.item);
//         this._trigger("added", ev, ui.item);
//         return true;
//     },
//
//     _addKiller: function(item) {
//         // same as _super() but uses item.desc instead of item.repr
//         var killButton = $('<span class="ui-icon ui-icon-trash">X</span> ');
//         var div = $("<div></div>")
//             .attr("id", this.id+'_on_deck_'+item.pk)
//             .append(killButton)
//             .append(item.desc)
//             .appendTo(this.deck)
//         killButton.on("click", $.proxy(
//             function(ev) {
//                 this._kill(item, div);
//                 return this._trigger("killed", ev, item)
//             },
//             this))
//     },
//
//     _suggest: function( items ) {
//         if (items.length != 1) {
//             this._super( items );
//             return
//         }
//         var item = items[0]
//         if ( false !== this._trigger( "select", null, { item: item } ) ) {
//             this._value( item.value );
//         }
//         // reset the term after the select event
//         // this allows custom select handling to work properly
//         this.term = this._value();
//
//         this.close();
//         this.selectedItem = item;
//     }
// });


$.widget('spud.photo_select',  $.spud.ajaxautocomplete, {
    _create: function(){
        this.img = $("<div></div>")
            .image({size: 'thumb'})
            .appendTo(this.element)

        this.options.type = "photos"
        this._super();
    },

    _loaded_killer: function(repr, photo) {
        this._super(repr, photo)
        this.img.image("set", photo)
    },

    _kill: function(obj_pk, div) {
        this._super(obj_pk, div);
        this.img.image("set_none")
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


// $.widget('spud.spud_menu', $.ui.menu, {
//     _create: function() {
//
//         this.element
//             .addClass("menu")
//
//         this._super()
//     },
//
//     _destroy: function() {
//         this.element
//             .empty()
//             .removeClass("menu")
//         this._super()
//     },
//
//     add_item: function(a) {
//         var li = $("<li/>")
//             .addClass("ui-menu-item")
//             .html(a)
//             .on("click", function(ev) { a.trigger('click'); })
//             .appendTo(this.element)
//         return this
//     },
// })
//
//
// $.widget('spud.main_menu', $.spud.spud_menu, {
//     _create: function() {
//         this._super()
//         this.set()
//     },
//
//     set: function() {
//         var search = { criteria: { root_only: true} }
//         this.element.empty()
//         this.add_item(albums.search_results_a(search, 0, "Albums"))
//         this.add_item(categorys.search_results_a(search, 0, "Categories"))
//         this.add_item(places.search_results_a(search, 0, "Places"))
//
//         var search = { criteria: { root_only: false} }
//         this.add_item(persons.search_results_a(search, 0, "People"))
//         this.add_item(feedbacks.search_results_a(search, 0, "Feedback"))
//         this.add_item(photo_search_results_a({}, 0))
//     },
// })
//
//
// $.widget('spud.selection_menu', $.spud.spud_menu, {
//     _create: function() {
//         this._super()
//         if (this.options.selection != null) {
//             this.set(this.options.selection)
//         }
//     },
//
//     set: function(selection) {
//         this.element.empty()
//         if (selection.length > 0) {
//             var search = {
//                 criteria: {
//                     photos: selection.join(".")
//                 }
//             }
//
//             this.add_item(photo_search_results_a(search, 0, "Show"))
//             this.add_item(
//                 $("<a href='#'>Clear</a>")
//                 .on("click", function() { set_selection([]); reload_page(); return false; })
//             )
//         }
//     },
// })

// $.widget('spud.paginator', {
//     _create: function() {
//         this.element
//             .addClass("paginator")
//
//         if (this.options.page != null) {
//             this.set(this.options.page, this.options.last_page)
//         }
//     },
//
//     _destroy: function() {
//         this.element
//             .empty()
//             .removeClass("paginator")
//         this._super()
//     },
//
//      _range: function(page, first, last) {
//         var page_a = this.options.page_a
//         for (var i=first; i<=last; i++) {
//             if (i == page) {
//                 this.element.append('<span class="this-page">' + escapeHTML(i+1) + '</span>')
//             } else {
//                 page_a(i, i+1)
//                     .addClass("page")
//                     .appendTo(this.element)
//             }
//             this.element.append(" ")
//         }
//     },
//
//     set: function(page, last_page) {
//         var page_a = this.options.page_a
//
//         this.element.empty()
//
//         if (page > 0) {
//             page_a(page-1, "")
//                 .addClass("prevslide")
//                 .appendTo(this.element)
//         }
//
//         if (page < last_page) {
//             page_a(page+1, "")
//                 .addClass("nextslide")
//                 .appendTo(this.element)
//         }
//
//         if (page > 0) {
//             page_a(page-1, '<')
//                 .attr("accesskey", "p")
//                 .addClass("page")
//                 .appendTo(this.element)
//             this.element.append(" ")
//         }
//         if (page < last_page) {
//             page_a(page+1, '>')
//                 .attr("accesskey", "n")
//                 .addClass("page")
//                 .appendTo(this.element)
//             this.element.append(" ")
//         }
//
//         var ON_EACH_SIDE = 3
//         var ON_ENDS = 2
//
//         // If there are 10 or fewer pages, display links to every page.
//         // Otherwise, do some fancy
//         if (last_page <= 10) {
//             this._range(page, 0, last_page)
//         } else {
//             // Insert "smart" pagination links, so that there are always ON_ENDS
//             // links at either end of the list of pages, and there are always
//             // ON_EACH_SIDE links at either end of the "current page" link.
//             if (page > (ON_EACH_SIDE + ON_ENDS)) {
//                 this._range(page, 0, ON_ENDS-1)
//                 this.element.append('<span class="dots">...</span>')
//                 this._range(page, page - ON_EACH_SIDE, page-1)
//             } else {
//                 this._range(page, 0, page-1)
//             }
//
//             if (page < (last_page - ON_EACH_SIDE - ON_ENDS)) {
//                 this._range(page, page, page + ON_EACH_SIDE)
//                 this.element.append('<span class="dots">...</span>')
//                 this._range(page, last_page - ON_ENDS + 1, last_page)
//             } else {
//                 this._range(page, page, last_page)
//             }
//         }
//     },
// })


$.widget('spud.image', $.spud.widget, {
    _create: function() {
        this.element.addClass("image")

        if (this.options.photo != null) {
            this._set(this.options.photo)
        } else {
            this.set_none()
        }
    },

    _clear: function() {
        this.element.empty()
    },

    set: function(photo) {
        this._setOption("photo", photo)
    },

    _set: function(photo) {
        this._clear()

        if (this.options.do_video && !$.isEmptyObject(photo.videos)) {
            var img = $("<video controls='controls'/>")

            var size = "320"
            $.each(photo.videos[size], function(priority, video){
                img
                    .attr("width", video.width)
                    .attr("height", video.height)

                $("<source/>")
                    .attr("src", video.url)
                    .attr("type", video.format)
                    .appendTo(img)
            })

            img.appendTo(this.element)

            this.img = img

        } else {

            var image = null
            if (photo != null) {
                image = photo.thumbs[this.options.size]
            }

            if (image != null) {
                this.img = $("<img></img>")
                    .attr('src', image.url)
                    .attr('width', image.width)
                    .attr('height', image.height)
                    .attr('alt', photo.title)

                if (this.options.include_link) {
                    this.a = photo_a(photo)
                        .html(this.img)
                        .appendTo(this.element)
                } else {
                    this.img.appendTo(this.element)
                }


                this.width = image.width
                this.height = image.height
            } else {
                this.set_none()
            }
        }
    },

    _setOption: function( key, value ) {
        if (key === "photo") {
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

    set_error: function() {
        this._clear()
        $("<img></img>")
            .attr("src", static_url("img/error.png"))
            .appendTo(this.element)
    },

    set_none: function() {
        this._clear()
        this.img = $("<img></img>")
            .attr('width', 120)
            .attr("src", static_url("img/none.jpg"))
            .appendTo(this.element)
        this.width = 227
        this.height = 222
    },

    set_loading: function() {
        this._clear()
        $("<img></img>")
            .attr("src", static_url("img/ajax-loader.gif"))
            .appendTo(this.element)
    },

    resize: function(enlarge) {
        var width = this.width
        var height = this.height

        var img = this.img
        var aspect = width / height

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
            img.css("padding-top", (window.innerHeight - height) / 2 + "px")
            img.css("padding-bottom", (window.innerHeight - height) / 2 + "px")
            img.css("padding-left", (window.innerWidth - width) / 2 + "px")
            img.css("padding-right", (window.innerWidth - width) / 2 + "px")
        }
        img.attr('width', width)
        img.attr('height', height)
    },
})


$.widget('spud.list_base', $.spud.widget, {
    _create: function() {
        this.ul = $("<ul></ul>")
            .appendTo(this.element)

        this.p = $("<p></p>")
            .appendTo(this.element)
    },

    empty: function() {
        this.ul.empty()
        this.element.removeClass("errors")
        return this
    },

    append_item: function(html) {
        var li = $("<li />")
            .append(html)
            .appendTo(this.ul)
        return li
    },

    clear_status: function() {
        this.element.removeClass("errors")
        return this
    },

    display_error: function() {
        this.empty()
        this.element.addClass("errors")
        return this
    },
})


$.widget('spud.photo_list_base',  $.spud.list_base, {
    _create: function() {
        this.element
            .addClass("photo_list")
        this._super()
    },

    empty: function() {
        this.element.find(".image")
            .image("destroy")
        this._super()
    },

    _create_li: function(photo, title, details, description, a) {
        a
                .data("photo", null)
                .empty()

        $("<div />")
            .image({ photo: photo, size: "thumb" })
            .appendTo(a)

        $("<div class='title'></div>")
            .text(title)
            .appendTo(a)

        if (details && details.length > 0) {
            $("<div class='details'></div>")
                .html(details)
                .appendTo(a)
        }
        if (description) {
            $("<div class='desc'></div>")
                .p(description)
                .appendTo(a)
        }

        var li = $("<li />")
            .attr('class', "photo_item")
            .append(a)
            .on("click", function(ev) {
                void ev
                a.trigger('click');
            })

        return li
    },

    append_photo: function(photo, title, details, description, a) {
        var li = this._create_li(photo, title, details, description, a)
            .appendTo(this.ul)
        return li
    },
})

$.widget('spud.screen', $.spud.widget, {
    _create: function() {
        var mythis = this

        if (this.options.id == null) {
            this.options.id = this.get_uuid()
        }
        this.element.attr("id", this.options.id)

        var header = $("<div/>")
            .addClass("screen_header")
            .appendTo(this.element)

        $("<div/>")
            .addClass("close_button")
            .text("[X]")
            .on("click", function(ev) {
                void ev
                mythis.close()
                return false;
            })
            .appendTo(header)

        this.h1 = $("<h1/>")
            .on("click", function(ev) {
                void ev
                mythis.toggle()
            })
            .appendTo(header)

        this._set_title(this.options.title)

        this.element.data('screen', this)
        this.element.addClass("screen")

        if (this.options.disabled) {
            this.disable()
        } else {
            this.enable()
        }

        this.div = $("<div/>")
            .addClass("screen_content")
            .appendTo(this.element)
    },

    toggle: function() {
        if (this.options.disabled) {
            this.disable()
        } else {
            this.enable()
        }
    },

    _enable: function() {
        this.element.removeClass("disabled")
        return this
    },

    _disable: function() {
        this.element.addClass("disabled")
        return this
    },

    _disable_all: function() {
        $(".screen:not(.disabled)").each(function() {
            var screen = $(this).data('screen')
            screen._disable()
        })
        return this
    },

    disable_all: function() {
        this._disable_all()
        push_state()
        return this
    },

    close: function() {
        this._disable()
        this.element.remove()
        var last_screen = $(".screen:last")
        if (last_screen.length > 0) {
            var screen = last_screen.data('screen')
            screen.enable()
        } else {
            push_state()
        }
    },

    _set_title: function(title) {
        this.h1.text(title)
        this.options.title = title
        if (!this.options.disabled) {
            push_state(true)
        }
    },

    _setOption: function( key, value ) {
        if ( key === "title" ) {
            this._set_title(value)
        } else if (key === "disabled") {
            if (!value) {
                this._disable_all()
                this._enable()
                push_state()
            } else {
                this._disable()
                push_state()
            }
        } else if (key === "id") {
            this.element.attr("id", value)
            this.options.id = value
        }
        this._super( key, value );
    },

    get_url: function() {
        throw Error("get_url not implemented")
    },

    get_streamable_options: function() {
        var options = $.extend({}, this.options) // clone options so we can modify
        return options
    },
})
