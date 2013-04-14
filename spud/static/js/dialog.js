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
// * DIALOG BOXES *
// ****************

// define input_field
function input_field(title, required) {
    this.title = title
    this.required = required
}

input_field.prototype.get = function(input, id) {
    return input.val().trim()
}

input_field.prototype.destroy = function(input) {
}


// define text_input_field
function text_input_field(title, required) {
    input_field.call(this, title, required)
}

text_input_field.prototype = new input_field()
text_input_field.constructor = text_input_field
text_input_field.prototype.create = function(id) {
    return $('<input />')
        .attr('type', "text")
        .attr('name', id)
        .attr('id', "id_" + id)
}

text_input_field.prototype.set = function(input, value) {
    input.val(value)
}


// define p_input_field
function p_input_field(title, required) {
    text_input_field.call(this, title, required)
}

p_input_field.prototype = new text_input_field()
p_input_field.constructor = p_input_field
p_input_field.prototype.create = function(id) {
    return $('<textarea />')
        .attr('rows', 10)
        .attr('cols', 40)
        .attr('name', id)
        .attr('id', "id_" + id)
}

// define ajax_select_field
function ajax_select_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_field.prototype = new input_field()
ajax_select_field.constructor = ajax_select_field
ajax_select_field.prototype.create = function(id) {
    return ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocomplete({type: this.type})
}

ajax_select_field.prototype.destroy = function(input) {
    input.ajaxautocomplete("destroy")
}

ajax_select_field.prototype.set = function(input, value) {
    var item = null
    if (value != null) {
        item = {
            pk: value.id,
            repr: value.title,
        }
    }
    input.ajaxautocomplete("set", item)
}

ajax_select_field.prototype.get = function(input) {
    return input.ajaxautocomplete("get")
}


// define ajax_select_multiple_field
function ajax_select_multiple_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_multiple_field.prototype = new input_field()
ajax_select_multiple_field.constructor = ajax_select_multiple_field
ajax_select_multiple_field.prototype.create = function(id) {
    return ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletemultiple({type: this.type})
}

ajax_select_multiple_field.prototype.destroy = function(input) {
    input.ajaxautocompletemultiple("destroy")
}

ajax_select_multiple_field.prototype.set = function(input, value) {
    var value_arr = []
    if (value != null) {
        var value_arr = $.map(value,
            function(value){ return { pk: value.id, repr: value.title, } }
        );
    }
    input.ajaxautocompletemultiple("set", value_arr)
}

ajax_select_multiple_field.prototype.get = function(input) {
    return input.ajaxautocompletemultiple("get")
}


// define ajax_select_sorted_field
function ajax_select_sorted_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_sorted_field.prototype = new input_field()
ajax_select_sorted_field.constructor = ajax_select_sorted_field
ajax_select_sorted_field.prototype.create = function(id) {
    return ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletesorted({type: this.type})
}

ajax_select_sorted_field.prototype.destroy = function(input) {
    input.ajaxautocompletesorted("destroy")
}

ajax_select_sorted_field.prototype.set = function(input, value) {
    var value_arr = []
    if (value != null) {
        var value_arr = $.map(value,
            function(value){ return { pk: value.id, repr: value.title, } }
        );
    }
    input.ajaxautocompletesorted("set", value_arr)
}

ajax_select_sorted_field.prototype.get = function(input) {
    return input.ajaxautocompletesorted("get")
}


// define photo_select_field
function photo_select_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

photo_select_field.prototype = new input_field()
photo_select_field.constructor = photo_select_field
photo_select_field.prototype.create = function(id) {
    return ac = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .photo_select()
}

photo_select_field.prototype.destroy = function(input) {
    input.photo_select("destroy")
}

photo_select_field.prototype.set = function(input, value) {
    input.photo_select("set", value)
}

photo_select_field.prototype.get = function(input) {
    return input.photo_select("get")
}


// define dialog
$.widget('ui.form_dialog',  $.ui.dialog, {
    _create: function() {
        var mythis = this
        var options = this.options

        this.element.data("close", function() { mythis.close() })

        this.description = $("<p/>")
            .appendTo(this.element)

        if (options.description != null) {
            this.description
                .text(options.description)
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

        var mythis = this
        this.input = {}
        $.each(this.fields, function(id, field){
            mythis.add_field(id, field)
        })

        options.width = 400

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
        var mythis = this
        var values = {}
        $.each(mythis.fields, function(id, field){
            values[id] = mythis.get_field(id)
        })
        this._submit_values(values)
    },

    _submit_values: function(values) {
    },

    set: function(values) {
        var mythis = this
        $.each(mythis.fields, function(id, field){
            values[id] = mythis.set_field(id, values[id])
        })
    },

    _destroy: function() {
        var mythis = this
        $.each(this.fields, function(id, field) {
            var input = mythis.input[id]
            field.destroy(input)
        })
        this.element
            .empty()
        this._super()
    },

    set_title: function(title) {
        this.element.parent().find(".ui-dialog-title").html(title)
    },

    set_description: function(description) {
        this.description.text(description)
    },

    add_field: function(id, field) {
        var input = field.create(id)

        var th = $("<th/>")
        $("<label/>")
            .attr("for", "id_" + id)
            .html(escapeHTML(field.title + ":"))
            .appendTo(th)

        var td = $("<td/>")
            .append(input)

        $("<tr/>")
            .append(th)
            .append(td)
            .appendTo(this.table)

        this.fields[id] = field
        this.input[id] = input
    },

    set_field: function(id, value) {
        var input = this.input[id]
        this.fields[id].set(input, value)
    },

    get_field: function(id) {
        var input = this.input[id]
        return this.fields[id].get(input)
    },
})
