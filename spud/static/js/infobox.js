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

// **************
// * INFO BOXES *
// **************

// define output_field
function output_field(title) {
    this.title = title
}

output_field.prototype.to_html = function(id) {
    this.output = this.create(id)

    this.dt = $("<dt/>")
        .text(this.title)
    this.dd = $("<dd/>")
        .append(this.output)

    return [this.dt, this.dd]
}

output_field.prototype.create = function(id) {
    return $('<span />')
}

output_field.prototype.destroy = function() {
}

output_field.prototype.append_a = function(html) {
    this.dd.append(" ")
    this.dd.append(html)
}

output_field.prototype.toggle = function(show) {
    this.dt.toggle(show)
    this.dd.toggle(show)
}

output_field.prototype.hide = function() {
    this.dt.hide()
    this.dd.hide()
}

output_field.prototype.show = function() {
    this.dt.show()
    this.dd.show()
}

// define text_output_field
function text_output_field(title) {
    output_field.call(this, title)
}

text_output_field.prototype = new output_field()
text_output_field.constructor = text_output_field

text_output_field.prototype.set = function(value) {
    this.output.text(value)
}

// define p_output_field
function p_output_field(title) {
    output_field.call(this, title)
}

p_output_field.prototype = new output_field()
p_output_field.constructor = p_output_field

p_output_field.prototype.set = function(value) {
    this.output.p(value)
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
    } else {
        this.output.text("")
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
}

// define html_output_field
function html_output_field(title) {
    output_field.call(this, title)
}

html_output_field.prototype = new output_field()
html_output_field.constructor = html_output_field

html_output_field.prototype.set = function(value) {
    this.output.html(value)
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

html_list_output_field.prototype.set = function(value) {
    this.output.empty()

    if (value==null) {
        return
    }

    $.each(value, function(i, item){
        $("<li></li>")
            .append(item)
            .appendTo(this.output)
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

link_list_output_field.prototype.set = function(value) {
    this.output.empty()

    if (value==null) {
        return
    }

    var mythis = this
    $.each(value, function(i, item){
        $("<li></li>")
            .append(object_a(item))
            .appendTo(mythis.output)
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

photo_output_field.prototype.set = function(value) {
    this.output.image('set', value)
}

photo_output_field.prototype.destroy = function() {
    this.output.image('destroy')
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

        var mythis = this
        $.each(this.fields, function(id, field){
            mythis.add_field(id, field)
        })

        this._super()
    },

    _destroy: function() {
        var mythis = this
        $.each(this.fields, function(id, field) {
            field.destroy()
        })
        this.element.empty()
        this._super()
    },

    set: function(values) {
        var mythis = this
        $.each(mythis.fields, function(id, field){
            values[id] = mythis.set_value(id, values[id])
        })
    },

    add_field: function(id, field) {
        var html = field.to_html(id)
        this.dl.append(html)
        this.fields[id] = field
    },

    set_value: function(id, value) {
        this.fields[id].toggle(Boolean(value))
        this.fields[id].set(value)
    },

    set_edit_value: function(id, value, can_change, a) {
        this.fields[id].set(value)
        if (can_change) {
            this.fields[id].show()
            this.fields[id].append_a(a)
        } else {
            this.fields[id].toggle(Boolean(value))
        }
    },
})
