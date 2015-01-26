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

// **************
// * INFO BOXES *
// **************

// define output_field
function output_field(title) {
    this.title = title
}

output_field.prototype = {
    to_html: function(id) {
        var html = this.create(id)

        this.dt = $("<div class='term'/>")
            .text(this.title)
        this.dd = $("<div class='definition'/>")
            .append(html)

        this.item = $("<div class='item'/>")
            .append(this.dt)
            .append(this.dd)

        this.visible = true

        return this.item
    },

    create: function(id) {
        void id
        this.output = $('<span />')
        return this.output
    },

    destroy: function() {
        this.item.remove()
    },

    set_edit_value: function(html) {
        html.addClass("edit")
        var edit = this.dd.find(".edit")
        if (edit.length > 0) {
            edit.replaceWith(html)
        } else {
            this.dd.append(" ")
            this.dd.append(html)
        }
    },

    toggle: function(show) {
        this.item.toggleClass("hidden", !show)
        this.visible = show
    },

    hide: function() {
        this.item.addClass("hidden")
        this.visible = false
    },

    show: function() {
        this.item.removeClass("hidden")
        this.visible = true
    },
}


// define text_output_field
function text_output_field(title) {
    output_field.call(this, title)
}

text_output_field.prototype = {
    set: function(value) {
        if (value != null) {
            this.output.text(value)
        } else {
            this.output.text("None")
        }
        this.toggle(Boolean(value))
    },
}

extend(output_field, text_output_field)


// define select_input_field
function select_output_field(title, options) {
    this.options = {}
    var mythis = this
    $.each(options, function(i, v){
        var id = v[0]
        var value = v[1]
        mythis.options[id] = value
    })
    output_field.call(this, title)
}

select_output_field.prototype = {
    set: function(value) {
        value = this.options[value]
        this.output.text(value)
    },
}

extend(output_field, select_output_field)


// define boolean_outbooleanut_field
function boolean_output_field(title) {
    output_field.call(this, title)
}

boolean_output_field.prototype = {
    set: function(value) {
        this.output.text(value ? "True" : " False")
        this.toggle(value != null)
    },
}

extend(output_field, boolean_output_field)


// define integer_outintegerut_field
function integer_output_field(title) {
    output_field.call(this, title)
}

integer_output_field.prototype = {
    set: function(value) {
        this.output.text(value)
        this.toggle(value != null)
    },
}

extend(output_field, integer_output_field)


// define p_output_field
function p_output_field(title) {
    output_field.call(this, title)
}

p_output_field.prototype = {
    set: function(value) {
        this.output.p(value)
        this.toggle(Boolean(value))
    },
}

extend(output_field, p_output_field)


// define datetime_output_field
function datetime_output_field(title) {
    output_field.call(this, title)
}

datetime_output_field.prototype = {
    create: function(id) {
        void id

        this.datetime = null

        var mythis = this

        var div = $('<div/>')

        this.output = $('<div />').appendTo(div)

        this.timezone = "local"

        $('<select />')
            .append(
                $('<option />')
                    .attr('value', "UTC")
                    .text("utc")
            )
            .append(
                $('<option />')
                    .attr('value', "source")
                    .text("source")
            )
            .append(
                $('<option />')
                    .attr('value', "local")
                    .text("local")
            )
            .val(this.timezone)
            .on("change", function(ev) {
                void ev
                mythis.timezone = $(this).val()
                mythis.set(mythis.value)
            })
            .appendTo(div)

        return div
    },

    set: function(value) {
        this.value = value

        this.output.empty()

        if (value != null) {
            var datetime = new moment.utc(value[0])
            var utc_offset = value[1]
            if (this.timezone === "local") {
                datetime.local()
            } else if (this.timezone === "source") {
                datetime.zone(-utc_offset)
            } else {
                datetime = datetime.tz(this.timezone)
            }

            if (datetime != null) {
                datetime = datetime.format("dddd, MMMM Do YYYY, h:mm:ss a")
            } else {
                datetime = "N/A"
            }

            this.output
                .append( $("<p/>").text(datetime + " " + this.timezone) )

            this.show()
        } else {
            this.hide()
        }
    },
}

extend(output_field, datetime_output_field)


// define link_output_field
function link_output_field(title, type) {
    this.type = type
    output_field.call(this, title)
}

link_output_field.prototype = {
    set: function(value) {
        this.toggle(value != null)
        if (value == null) {
            this.output.text("")
            return
        }

        var a = object_a(this.type, value)
        this.output.html(a)
    },
}

extend(output_field, link_output_field)

// FIXME: check if this is required
// define html_output_field
// function html_output_field(title) {
//     output_field.call(this, title)
// }
//
// html_output_field.prototype = new output_field()
// html_output_field.constructor = html_output_field
//
// html_output_field.prototype.set = function(value) {
//     this.output.html(value)
//     this.toggle(value != null)
// }
//
// define html_list_output_field
// function html_list_output_field(title) {
//     output_field.call(this, title)
// }
//
//
// html_list_output_field.prototype = new output_field()
// html_list_output_field.constructor = html_list_output_field
//
// html_list_output_field.prototype.create = function(id) {
//     return this.output = $('<ul />')
// }
//
// html_list_output_field.prototype.set = function(value) {
//     this.output.empty()
//
//     if (value==null) {
//         this.hide()
//         return
//     }
//
//     var mythis = this
//     $.each(value, function(i, item){
//         $("<li></li>")
//             .append(item)
//             .appendTo(mythis.output)
//     })
//     this.toggle(value.length > 0)
// }


// define link_list_output_field
function link_list_output_field(title, type) {
    this.type = type
    output_field.call(this, title)
}

link_list_output_field.prototype = {
    set: function(value) {
        this.output.empty()

        if (value == null || value.length === 0) {
            this.hide()
            return
        }

        var mythis = this
        var sep = ""
        $.each(value, function(i, item){
            mythis.output.append(sep)
            if (item != null) {
                mythis.output.append(object_a(mythis.type, item))
            } else {
                mythis.output.append("Unknown")
            }
            sep = ", "
        })
        mythis.output.append(".")
        this.toggle(value.length > 0)
    },
}

extend(output_field, link_list_output_field)


// define photo_output_field
function photo_output_field(title, size, do_link) {
    this.size = size
    this.do_link = do_link
    output_field.call(this, title)
}

photo_output_field.prototype = {
    create: function(id) {
        void id
        this.output = $('<div />').image({ size: this.size, include_link: this.do_link })
        return this.output
    },

    set: function(value) {
        this.output.image('set', value)
        this.toggle(value != null)
    },

    destroy: function() {
        this.output.image('destroy')
        output_field.prototype.destroy.call(this)
    },
}

extend(output_field, photo_output_field)


// define infobox widget

$.widget('spud.infobox', $.spud.widget, {
    _create: function(){
        var mythis = this
        var options = this.options

        this.element.addClass("infobox")

        if (options.title != null) {
            $("<h2></h2")
                .text(this.options.title)
                .appendTo(this.element)
        }

        this.fields = {}
        if (this.options.pages) {
            this.page = {}
            this.tabs = $("<div/>")
                .addClass("fields")
                .appendTo(this.element)

            var ul = $("<ul></ul>").appendTo(this.tabs)

            $.each(mythis.options.pages, function(id, page) {
                var name = page.name
                var title = page.title
                $("<li/>")
                    .append(
                        $("<a/>")
                            .attr("href", '#' + name)
                            .text(title)
                    )
                    .appendTo(ul)

                mythis.page[name] = $("<div/>")
                    .addClass("def_list")
                    .attr('id', name)
                    .appendTo(mythis.tabs)

                mythis._create_fields(name, page.fields)
            })

            mythis.tabs.tabs()
        } else {
            this.dl = $("<div/>")
                .addClass("fields")
                .addClass("def_list")
                .appendTo(this.element)
            this._create_fields(null, this.options.fields)
        }
        this._super()

        if (this.options.obj != null) {
            this._set(this.options.obj)
        }
    },

    _destroy: function() {
        this.element.removeClass("infobox")
        $.each(this.fields, function(id, field) {
            field.destroy()
        })
        this._super()
    },


    _create_fields: function(page, fields) {
        if (fields != null) {
            this.add_fields(page, fields)
        }
    },

    set: function(obj) {
        this._setOption("obj", obj)
    },

    _set: function(values) {
        var mythis = this
        var visible = false
        $.each(mythis.fields, function(id, field) {
            mythis.set_value(id, values[id])
            if (field.visible) {
                visible = true
            }
        })

        this.element.toggleClass("hidden", !visible)
        return this
    },

    add_field: function(page, id, field) {
        this.remove_field(id, field)
        var html = field.to_html(id)
        if (page == null) {
            this.dl.append(html)
        } else {
            this.page[page].append(html)
        }
        this.fields[id] = field
        return this
    },

    add_fields: function(page, fields) {
        var mythis = this
        $.each(fields, function(i, v) {
            var id = v[0]
            var field = v[1]
            mythis.add_field(page, id, field)
        })
        return this
    },

    remove_field: function(id) {
        var field = this.fields[id]
        if (field == null) {
            return this
        }
        field.destroy()
        delete this.fields[id]
        return this
    },

    remove_all_fields: function() {
        var mythis = this
        $.each(this.fields, function(i, v) {
            void v
            mythis.remove_field(i)
        })
        return this
    },

    set_value: function(id, value) {
        this.fields[id].set(value)
        return this
    },

    set_edit_value: function(id, value, can_change, a) {
        this.fields[id].set(value)
        if (can_change) {
            this.fields[id].show()
            this.fields[id].set_edit_value(a)
        }
    },

    _enable: function() {
    },

    _disable: function() {
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
})
