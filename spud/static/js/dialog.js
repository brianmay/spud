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
// * DIALOG BOXES *
// ****************

// define input_field
function input_field(title, required) {
    this.title = title
    this.required = Boolean(required)
}

input_field.prototype.to_html = function(id) {
    var html = this.create(id)

    var th = $("<th/>")
    $("<label/>")
        .attr("for", "id_" + id)
        .html(escapeHTML(this.title + ":"))
        .appendTo(th)
        .toggleClass("required", this.required)

    this.errors = $("<div></div>")

    var td = $("<td/>")
        .append(html)
        .append(this.errors)


    this.tr = $("<tr/>")
        .append(th)
        .append(td)

    return this.tr
}

input_field.prototype.get = function() {
    return this.input.val().trim()
}

input_field.prototype.validate = function() {
    var value = this.input.val().trim()
    if (this.required && !value) {
        return "This value is required"
    }
    return null
}

input_field.prototype.set_error = function(error) {
    this.tr.toggleClass("errors", Boolean(error))
    this.errors.toggleClass("errornote", Boolean(error))
    if (this.input) {
        this.input.toggleClass("errors", Boolean(error))
        this.input.find("input").toggleClass("errors", Boolean(error))
    }
    if (error) {
        this.errors.text(error)
    } else {
        this.errors.text("")
    }
}

input_field.prototype.clear_error = function(error) {
    this.set_error(null)
}

input_field.prototype.destroy = function() {
    this.tr.remove()
}

// define text_input_field
function text_input_field(title, required) {
    input_field.call(this, title, required)
}

text_input_field.prototype = new input_field()
text_input_field.constructor = text_input_field
text_input_field.prototype.create = function(id) {
    return this.input = $('<input />')
        .attr('type', "text")
        .attr('name', id)
        .attr('id', "id_" + id)
}

text_input_field.prototype.set = function(value) {
    this.input.val(value)
}

// define datetime_input_field
function datetime_input_field(title, required) {
    input_field.call(this, title, required)
}

datetime_input_field.prototype = new input_field()
datetime_input_field.constructor = datetime_input_field
datetime_input_field.prototype.create = function(id) {
    this.date = $('<input />')
        .attr('id', "id_" + id + "_date")
        .datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
        })

    this.time = $('<input />')
        .attr('type', "text")
        .attr('id', "id_" + id + "_time")

    this.timezone = $('<input />')
        .attr('type', "text")
        .attr('id', "id_" + id + "_timezonetime")

    return $("<span></span>")
        .append(this.date)
        .append(this.time)
        .append(this.timezone)
}

datetime_input_field.prototype.set = function(value) {
    if (value != null) {
        this.date.val(value.date)
        this.time.val(value.time)
        this.timezone.val(value.timezone)
    } else {
        this.date.val("")
        this.time.val("")
        this.timezone.val("")
    }
}

datetime_input_field.prototype.validate = function() {
    var date = this.date.val().trim()
    var time = this.time.val().trim()
    var timezone = this.timezone.val().trim()

    if (date != "") {
        if (!/^\d\d\d\d-\d\d-\d\d$/.test(date)) {
            return "date format not yyyy-mm-dd"
        }

        var a = date.split("-")
        if (Number(a[1]) < 1 || Number(a[1]) > 12) {
            return "Month must be between 1 and 12"
        }
        if (Number(a[2]) < 1 || Number(a[2]) > 31) {
            return "date must be between 1 and 31"
        }
    }

    if (time != "") {
        if (!/^\d\d:\d\d+(:\d\d+)?$/.test(time)) {
            return "date format not hh:mm[:ss]"
        }

        if (!/^\d\d:\d\d+(:\d\d+)?$/.test(time)) {
            return "time format not hh:mm[:ss]"
        }

        if (date == "") {
            return "date must be given if time is given"
        }

        var a = time.split(":")
        if (Number(a[0]) < 0 || Number(a[0]) > 23) {
            return "Hour must be between 0 and 23"
        }
        if (Number(a[1]) < 0 || Number(a[1]) > 59) {
            return "Minutes must be between 0 and 59"
        }
        if (Number(a[2]) < 0 || Number(a[2]) > 59) {
            return "Seconds must be between 0 and 59"
        }
    }

    if (timezone != "") {
        if (date == "") {
            return "Specifying timezone without date wrong"
        }
        if (/\s/.test(timezone)) {
            return "Timezone must not have whitespace"
        }
    }

    return null
}

datetime_input_field.prototype.get = function() {
    var date = this.date.val().trim()
    var time = this.time.val().trim()
    var timezone = this.timezone.val().trim()

    var result = []
    if (date != "") {
        result.push(date)
    }
    if (time != "") {
        result.push(time)
    }
    if (timezone != "") {
        result.push(timezone)
    }
    return result.join(" ")
}


// define password_input_field
function password_input_field(title, required) {
    text_input_field.call(this, title, required)
}

password_input_field.prototype = new text_input_field()
password_input_field.constructor = password_input_field
password_input_field.prototype.create = function(id) {
    return this.input = $('<input />')
        .attr('type', "password")
        .attr('name', id)
        .attr('id', "id_" + id)
}


// define date_input_field
function date_input_field(title, required) {
    text_input_field.call(this, title, required)
}

date_input_field.prototype = new text_input_field()
date_input_field.constructor = date_input_field
date_input_field.prototype.create = function(id) {
    return this.input = $('<input />')
        .attr('id', "id_" + id)
        .datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
        })
}

date_input_field.prototype.validate = function() {
    var date = this.input.val().trim()

    if (date != "") {
        if (!/^\d\d\d\d-\d\d-\d\d$/.test(date)) {
            return "date format not yyyy-mm-dd"
        }

        var a = date.split("-")
        if (Number(a[1]) < 1 || Number(a[1]) > 12) {
            return "Month must be between 1 and 12"
        }
        if (Number(a[2]) < 1 || Number(a[2]) > 31) {
            return "date must be between 1 and 31"
        }
    }
    return null
}


// define p_input_field
function p_input_field(title, required) {
    text_input_field.call(this, title, required)
}

p_input_field.prototype = new text_input_field()
p_input_field.constructor = p_input_field
p_input_field.prototype.create = function(id) {
    return this.input = $('<textarea />')
        .attr('rows', 10)
        .attr('cols', 40)
        .attr('name', id)
        .attr('id', "id_" + id)
}


// define integer_input_field
function integer_input_field(title, required) {
    text_input_field.call(this, title, required)
}

integer_input_field.prototype = new text_input_field()
integer_input_field.constructor = integer_input_field

integer_input_field.prototype.validate = function() {
    var value = this.input.val().trim()
    var intRegex = /^\d+$/;
    if (value && !intRegex.test(value)) {
        return "Value must be integer"
    }
    return text_input_field.prototype.validate.call(this, value)
}

// define select_input_field
function select_input_field(title, options, required) {
    this.options_list = options
    input_field.call(this, title, required)
}

select_input_field.prototype = new input_field()
select_input_field.constructor = select_input_field
select_input_field.prototype.create = function(id) {
    this.input = $('<select />')
        .attr('name', id)
        .attr('id', "id_" + id)

    this.set_options(this.options_list)
    return this.input
}

select_input_field.prototype.set_options = function(options) {
    this.input.empty()
    this.options = {}
    var mythis = this
    $.each(options, function(id, v){
        var id = v[0]
        var value = v[1]
        mythis.options[id] = $('<option />')
            .attr('value', id)
            .text(value)
            .appendTo(mythis.input)
    })
    this.options_list = options
}

select_input_field.prototype.set = function(value) {
    var mythis = this
    this.input.val(value)
}


// define boolean_input_field
function boolean_input_field(title, options, required) {
    this.options_list = options
    input_field.call(this, title, required)
}

boolean_input_field.prototype = new input_field()
boolean_input_field.constructor = boolean_input_field
boolean_input_field.prototype.create = function(id) {
    return this.input = $('<input />')
        .attr('type', 'checkbox')
        .attr('name', id)
        .attr('id', "id_" + id)
}

boolean_input_field.prototype.set = function(value) {
    var mythis = this
    if (value) {
        mythis.input.attr('checked','checked')
    } else {
        mythis.input.removeAttr('checked')
    }
}

boolean_input_field.prototype.get = function() {
    return this.input.is(":checked")
}

// define ajax_select_field
function ajax_select_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_field.prototype = new input_field()
ajax_select_field.constructor = ajax_select_field
ajax_select_field.prototype.create = function(id) {
    return this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocomplete({type: this.type})
}

ajax_select_field.prototype.destroy = function() {
    this.input.ajaxautocomplete("destroy")
}

ajax_select_field.prototype.set = function(value) {
    var item = null
    if (value != null) {
        item = {
            pk: value.id,
            repr: value.title,
        }
    }
    this.input.ajaxautocomplete("set", item)
}

ajax_select_field.prototype.get = function() {
    return this.input.ajaxautocomplete("get")
}


// define quick_select_field
function quick_select_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

quick_select_field.prototype = new input_field()
quick_select_field.constructor = quick_select_field
quick_select_field.prototype.create = function(id) {
    return this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .quickautocomplete({type: this.type})
}

quick_select_field.prototype.destroy = function() {
    this.input.quickautocomplete("destroy")
}

quick_select_field.prototype.set = function(value) {
    var item = null
    if (value != null) {
        item = {
            pk: value.id,
            repr: value.title,
        }
    }
    this.input.quickautocomplete("set", item)
}

quick_select_field.prototype.get = function() {
    return this.input.quickautocomplete("get")
}


// define ajax_select_multiple_field
function ajax_select_multiple_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_multiple_field.prototype = new input_field()
ajax_select_multiple_field.constructor = ajax_select_multiple_field
ajax_select_multiple_field.prototype.create = function(id) {
    return this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletemultiple({type: this.type})
}

ajax_select_multiple_field.prototype.destroy = function() {
    this.input.ajaxautocompletemultiple("destroy")
}

ajax_select_multiple_field.prototype.set = function(value) {
    var value_arr = []
    if (value != null) {
        var value_arr = $.map(value,
            function(v){ return { pk: v.id, repr: v.title, } }
        );
    }
    this.input.ajaxautocompletemultiple("set", value_arr)
}

ajax_select_multiple_field.prototype.get = function() {
    return this.input.ajaxautocompletemultiple("get")
}


// define ajax_select_sorted_field
function ajax_select_sorted_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_sorted_field.prototype = new input_field()
ajax_select_sorted_field.constructor = ajax_select_sorted_field
ajax_select_sorted_field.prototype.create = function(id) {
    return this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletesorted({type: this.type})
}

ajax_select_sorted_field.prototype.destroy = function() {
    this.input.ajaxautocompletesorted("destroy")
}

ajax_select_sorted_field.prototype.set = function(value) {
    var value_arr = []
    if (value != null) {
        var value_arr = $.map(value,
            function(value){ return { pk: value.id, repr: value.title, } }
        );
    }
    this.input.ajaxautocompletesorted("set", value_arr)
}

ajax_select_sorted_field.prototype.get = function() {
    return this.input.ajaxautocompletesorted("get")
}


// define photo_select_field
function photo_select_field(title, required) {
    input_field.call(this, title, required)
}

photo_select_field.prototype = new input_field()
photo_select_field.constructor = photo_select_field
photo_select_field.prototype.create = function(id) {
    return this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .photo_select()
}

photo_select_field.prototype.destroy = function() {
    this.input.photo_select("destroy")
}

photo_select_field.prototype.set = function(value) {
    this.input.photo_select("set", value)
}

photo_select_field.prototype.get = function() {
    return this.input.photo_select("get")
}

photo_select_field.prototype.validate = function() {
    var value = this.input.photo_select("get")
    if (this.required && !value) {
        return "This value is required"
    }
    return null
}


// define dialog
$.widget('spud.form_dialog',  $.ui.dialog, {
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
            mythis._check_submit()
        }
        options.buttons['Cancel'] = function() {
            mythis.close()
        }

        this.fields = {}
        if (options.fields != null) {
            this.add_fields(options.fields)
            delete options.fields
        }

        if (options.initial != null) {
            this.set(options.initial)
            delete options.initial
        }

        options.width = 400

        this._super()

        this.element.on(
            "keypress",
            function(ev) {
                if (ev.which == 13 && !ev.shiftKey) {
                    mythis._check_submit()
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

    _check_submit: function() {
        var mythis = this
        var allok = true
        $.each(mythis.fields, function(id, field) {
            var error = field.validate()
            if (error) {
                field.set_error(error)
                allok = false;
            } else {
                field.clear_error()
            }
        })
        if (allok) {
            this._submit()
        }
    },

    _submit: function() {
        var mythis = this
        var values = {}
        $.each(mythis.fields, function(id, field) {
            values[id] = mythis.get_value(id)
        })
        this._submit_values(values)
    },

    _submit_values: function(values) {
    },

    set: function(values) {
        var mythis = this
        $.each(mythis.fields, function(id, field) {
            mythis.set_value(id, values[id])
        })
    },

    _destroy: function() {
        var mythis = this
        $.each(this.fields, function(id, field) {
            field.destroy()
        })
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

    add_field: function(id, field) {
        this.remove_field(id, field)
        var html = field.to_html(id)
        this.table.append(html)
        this.fields[id] = field
        return this
    },

    add_fields: function(fields) {
        var mythis = this
        $.each(fields, function(i, v){
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

    set_error: function(id, message) {
        this.fields[id].set_error(message)
        return this
    },

    get_value: function(id) {
        return this.fields[id].get()
    },
})
