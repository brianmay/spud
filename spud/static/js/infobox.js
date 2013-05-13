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

output_field.prototype.to_html = function(id) {
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
}

output_field.prototype.create = function(id) {
    return this.output = $('<span />')
}

output_field.prototype.destroy = function() {
    this.item.remove()
}

output_field.prototype.set_edit_value = function(html) {
    html.addClass("edit")
    var edit = this.dd.find(".edit")
    if (edit.length > 0) {
        edit.replaceWith(html)
    } else {
        this.dd.append(" ")
        this.dd.append(html)
    }
}

output_field.prototype.toggle = function(show) {
    this.item.toggleClass("hidden", !show)
    this.visible = show
}

output_field.prototype.hide = function() {
    this.item.addClass("hidden")
    this.visible = false
}

output_field.prototype.show = function() {
    this.item.removeClass("hidden")
    this.visible = true
}

// define text_output_field
function text_output_field(title) {
    output_field.call(this, title)
}

text_output_field.prototype = new output_field()
text_output_field.constructor = text_output_field

text_output_field.prototype.set = function(value) {
    if (value != null) {
        this.output.text(value)
    } else {
        this.output.text("None")
    }
    this.toggle(Boolean(value))
}

// define boolean_outbooleanut_field
function boolean_output_field(title) {
    output_field.call(this, title)
}

boolean_output_field.prototype = new output_field()
boolean_output_field.constructor = boolean_output_field

boolean_output_field.prototype.set = function(value) {
    this.output.text(value ? "True" : " False")
    this.toggle(value != null)
}


// define integer_outintegerut_field
function integer_output_field(title) {
    output_field.call(this, title)
}

integer_output_field.prototype = new output_field()
integer_output_field.constructor = integer_output_field

integer_output_field.prototype.set = function(value) {
    this.output.text(value)
    this.toggle(value != null)
}


// define p_output_field
function p_output_field(title) {
    output_field.call(this, title)
}

p_output_field.prototype = new output_field()
p_output_field.constructor = p_output_field

p_output_field.prototype.set = function(value) {
    this.output.p(value)
    this.toggle(Boolean(value))
}


// define datetime_output_field
function datetime_output_field(title) {
    output_field.call(this, title)
}

datetime_output_field.prototype = new output_field()
datetime_output_field.constructor = datetime_output_field

datetime_output_field.prototype.set = function(value) {
    if (value != null) {
        this.output.text(value.title)
        this.show()
    } else {
        this.output.text("")
        this.hide()
    }
}


// define link_output_field
function link_output_field(title) {
    output_field.call(this, title)
}

link_output_field.prototype = new output_field()
link_output_field.constructor = link_output_field

link_output_field.prototype.set = function(value) {
    this.output.html(object_a(value))
    this.toggle(value != null)
}

// define html_output_field
function html_output_field(title) {
    output_field.call(this, title)
}

html_output_field.prototype = new output_field()
html_output_field.constructor = html_output_field

html_output_field.prototype.set = function(value) {
    this.output.html(value)
    this.toggle(value != null)
}

// define html_list_output_field
function html_list_output_field(title) {
    output_field.call(this, title)
}


html_list_output_field.prototype = new output_field()
html_list_output_field.constructor = html_list_output_field

html_list_output_field.prototype.create = function(id) {
    return this.output = $('<ul />')
}

html_list_output_field.prototype.set = function(value) {
    this.output.empty()

    if (value==null) {
        this.hide()
        return
    }

    var mythis = this
    $.each(value, function(i, item){
        $("<li></li>")
            .append(item)
            .appendTo(mythis.output)
    })
    this.toggle(value.length > 0)
}

// define link_list_output_field
function link_list_output_field(title) {
    output_field.call(this, title)
}


link_list_output_field.prototype = new output_field()
link_list_output_field.constructor = link_list_output_field

link_list_output_field.prototype.create = function(id) {
    return this.output = $('<span />')
}

link_list_output_field.prototype.set = function(value) {
    this.output.empty()

    if (value==null || value.length==0) {
        this.hide()
        return
    }

    var mythis = this
    var sep = ""
    $.each(value, function(i, item){
        mythis.output
            .append(sep)
            .append(object_a(item))
        sep = ", "
    })
    mythis.output.append(".")
    this.toggle(value.length > 0)
}

// define photo_output_field
function photo_output_field(title, size, do_link) {
    this.size = size
    this.do_link = do_link
    output_field.call(this, title)
}

photo_output_field.prototype = new output_field()
photo_output_field.constructor = photo_output_field

photo_output_field.prototype.create = function(id) {
    this.output = $('<div />').image({ size: this.size, include_link: this.do_link })
    return this.output
}

photo_output_field.prototype.set = function(value) {
    this.output.image('set', value)
    this.toggle(value != null)
}

photo_output_field.prototype.destroy = function() {
    this.output.image('destroy')
    output_field.prototype.destroy.call(this)
}

$.widget('spud.infobox', {
    _create: function(){
        var options = this.options

        this.element.addClass("infobox")

        if (options.title != null) {
            $("<h2></h2")
                .text(this.options.title)
                .appendTo(this.element)
        }

        this.dl = $("<div class='def_list'></div>")
            .appendTo(this.element)

        $("<div class='clear'></div>")
            .appendTo(this.element)

        this.fields = {}
        if (options.fields != null) {
            this.add_fields(options.fields)
            delete options.fields
        }

        if (options.initial != null) {
            this.set(options.initial)
            delete options.initial
        }

        this._super()
    },

    _destroy: function() {
        var mythis = this
        this.element.removeClass("infobox")
        $.each(this.fields, function(id, field) {
            field.destroy()
        })
        this.element.empty()
        this._super()
    },

    set: function(values) {
        var mythis = this
        var visible = false
        $.each(mythis.fields, function(id, field) {
            mythis.set_value(id, values[id])
            if (field.visible) visible = true
        })

        this.element.toggleClass("hidden", !visible)
        return this
    },

    add_field: function(id, field) {
        this.remove_field(id, field)
        var html = field.to_html(id)
        this.dl.append(html)
        this.fields[id] = field
        return this
    },

    add_fields: function(fields) {
        var mythis = this
        $.each(fields, function(i, v) {
            var id = v[0]
            var field = v[1]
            mythis.add_field(id, field)
        })
        return this
    },

    remove_field: function(id) {
        var field = this.fields[id]
        if (field == null) return this
        field.destroy()
        delete this.fields[id]
        return this
    },

    remove_all_fields: function() {
        var mythis = this
        $.each(this.fields, function(i, v) {
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
})
