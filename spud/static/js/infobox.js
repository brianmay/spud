/*
spud - keep track of computers and licenses
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

// **************
// * INFO BOXES *
// **************

// define output_field
function output_field(title) {
    this.title = title
}

output_field.prototype.show = function(value) {
    return Boolean(value)
}

output_field.prototype.create = function(id) {
    return $('<span />')
}

output_field.prototype.destroy = function(output) {
}


// define text_output_field
function text_output_field(title) {
    output_field.call(this, title)
}

text_output_field.prototype = new output_field()
text_output_field.constructor = text_output_field

text_output_field.prototype.set = function(output, value) {
    output.text(value)
}

// define p_output_field
function p_output_field(title) {
    output_field.call(this, title)
}

p_output_field.prototype = new output_field()
p_output_field.constructor = p_output_field

p_output_field.prototype.set = function(output, value) {
    output.p(value)
}

// define link_output_field
function link_output_field(title) {
    output_field.call(this, title)
}

link_output_field.prototype = new output_field()
link_output_field.constructor = link_output_field

link_output_field.prototype.set = function(output, value) {
    output.html(object_a(value))
}

// define html_output_field
function html_output_field(title) {
    output_field.call(this, title)
}

html_output_field.prototype = new output_field()
html_output_field.constructor = html_output_field

html_output_field.prototype.set = function(output, value) {
    output.html(value)
}

// define html_list_output_field
function html_list_output_field(title) {
    output_field.call(this, title)
}


html_list_output_field.prototype = new output_field()
html_list_output_field.constructor = html_list_output_field

html_list_output_field.prototype.create = function(id) {
    return $('<ul />')
}

html_list_output_field.prototype.set = function(output, value) {
    output.empty()

    if (value==null) {
        return
    }

    $.each(value, function(i, item){
        $("<li></li>")
            .append(item)
            .appendTo(output)
    })
}

// define link_list_output_field
function link_list_output_field(title) {
    output_field.call(this, title)
}


link_list_output_field.prototype = new output_field()
link_list_output_field.constructor = link_list_output_field

link_list_output_field.prototype.create = function(id) {
    return $('<ul />')
}

link_list_output_field.prototype.set = function(output, value) {
    output.empty()

    if (value==null) {
        return
    }

    $.each(value, function(i, item){
        $("<li></li>")
            .append(object_a(item))
            .appendTo(output)
    })
}

// define photo_output_field
function photo_output_field(title, size) {
    this.size = size
    output_field.call(this, title)
}

photo_output_field.prototype = new output_field()
photo_output_field.constructor = photo_output_field

photo_output_field.prototype.create = function(id) {
    return $('<img />').image({ size: this.size })
}

photo_output_field.prototype.set = function(output, value) {
    output.image('set', value)
}

photo_output_field.prototype.destroy = function(output) {
    output.image('destroy')
}

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
        this.output = {}

        var mythis = this
        this.input = {}
        $.each(this.fields, function(id, field){
            mythis.add_field(id, field)
        })

        this._super()
    },

    _destroy: function() {
        var mythis = this
        $.each(this.fields, function(id, field) {
            var output = mythis.output[id]
            field.destroy(output)
        })
        this.element.empty()
        this._super()
    },

    set: function(values) {
        var mythis = this
        $.each(mythis.fields, function(id, field){
            values[id] = mythis.set_field(id, values[id])
        })
    },

    add_field: function(id, field) {
        var output = field.create(id)

        var dt = $("<dt/>")
            .text(field.title)
            .appendTo(this.dl)
        var dd = $("<dd/>")
            .append(output)
            .appendTo(this.dl)

        this.dt[id] = dt
        this.dd[id] = dd
        this.output[id] = output
        this.fields[id] = field
        return dd
    },

    set_field: function(id, value) {
        var output = this.output[id]
        this.dt[id].toggle(this.fields[id].show(value))
        this.dd[id].toggle(this.fields[id].show(value))
        this.fields[id].set(output, value)
    },

    toggle_field: function(id, show) {
        this.dt[id].toggle(show)
        this.dd[id].toggle(show)
    },

    set_edit_field: function(id, value, can_change, a) {
        this.set_field(id, value)
        if (can_change) {
            this.dt[id].show()
            this.dd[id].show()
            this.dd[id].append(" ")
            this.dd[id].append(a)
        }
    },
})



