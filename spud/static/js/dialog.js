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
        .text(this.title + ":")
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
    var value = this.input.val()
    if (value) {
        value = value.trim()
    } else {
        value = null
    }
    return value
}

input_field.prototype.validate = function() {
    var value = this.input.val()
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

input_field.prototype.clear_error = function() {
    this.set_error(null)
}

input_field.prototype.destroy = function() {
    this.tr.remove()
}

input_field.prototype.enable = function() {
    this.input.attr('disabled', null)
}

input_field.prototype.disable = function() {
    this.input.attr('disabled', true)
}

// define text_input_field
function text_input_field(title, required) {
    input_field.call(this, title, required)
}

text_input_field.prototype = new input_field()
text_input_field.constructor = text_input_field
text_input_field.prototype.create = function(id) {
    this.input = $('<input />')
        .attr('type', "text")
        .attr('name', id)
        .attr('id', "id_" + id)
    return this.input
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
        .attr('placeholder', 'YYYY-MM-DD')
        .datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
        })

    this.time = $('<input />')
        .attr('type', "text")
        .attr('placeholder', 'HH:MM:SS')
        .attr('id', "id_" + id + "_time")

    this.timezone = $('<input />')
        .attr('type', "text")
        .attr('placeholder', 'timezone')
        .attr('id', "id_" + id + "_timezonetime")

    return $("<span></span>")
        .append(this.date)
        .append(this.time)
        .append(this.timezone)
}

datetime_input_field.prototype.set = function(value) {
    if (value != null) {
        var datetime = new moment.utc(value[0])
        var utc_offset = value[1]
        datetime = datetime.zone(-utc_offset)
        this.date.datepicker("setDate", datetime.format("YYYY-MM-dd"))
        this.date.val(datetime.format("YYYY-MM-DD"))
        this.time.val(datetime.format("HH:mm:ss"))

        var hours = Math.floor(utc_offset / 60);
        var minutes = utc_offset - (hours * 60);

        if (hours < 10) {hours = "0" + hours;}
        if (minutes < 10) {minutes = "0" + minutes;}

        this.timezone.val(hours + ":" + minutes)
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
    var a

    if (date !== "") {
        if (!/^\d\d\d\d-\d\d-\d\d$/.test(date)) {
            return "date format not yyyy-mm-dd"
        }

        a = date.split("-")
        if (Number(a[1]) < 1 || Number(a[1]) > 12) {
            return "Month must be between 1 and 12"
        }
        if (Number(a[2]) < 1 || Number(a[2]) > 31) {
            return "date must be between 1 and 31"
        }
        if (a[3] != null) {
            return "Too many components in date"
        }
    }

    if (time !== "") {
        if (!/^\d\d:\d\d+(:\d\d+)?$/.test(time)) {
            return "date format not hh:mm[:ss]"
        }

        if (!/^\d\d:\d\d+(:\d\d+)?$/.test(time)) {
            return "time format not hh:mm[:ss]"
        }

        if (date === "") {
            return "date must be given if time is given"
        }

        a = time.split(":")
        if (Number(a[0]) < 0 || Number(a[0]) > 23) {
            return "Hour must be between 0 and 23"
        }
        if (Number(a[1]) < 0 || Number(a[1]) > 59) {
            return "Minutes must be between 0 and 59"
        }
        if (Number(a[2]) < 0 || Number(a[2]) > 59) {
            return "Seconds must be between 0 and 59"
        }
        if (a[3] != null) {
            return "Too many components in time"
        }
    }

    if (timezone !== "") {
        a = timezone.split(":")
        if (a.length > 1) {
            if (Number(a[0]) < -12 || Number(a[0]) > 12) {
                return "Hour must be between -12 and 12"
            }
            if (Number(a[1]) < 0 || Number(a[1]) > 59) {
                return "Minutes must be between 0 and 59"
            }
            if (a[2] != null) {
                return "Too many components in timezone"
            }
            if (date === "") {
                return "Specifying timezone without date wrong"
            }
        } else {
            if (moment.tz.zone(timezone) == null) {
                return "Unknown timezone"
            }
        }
    }

    return null
}

datetime_input_field.prototype.get = function() {
    var date = this.date.val().trim()
    var time = this.time.val().trim()
    var timezone = this.timezone.val().trim()

    if (date === "") {
        return null
    }

    var result = date
    if (time !== "") {
        result = result + " " + time
    }


    var datetime
    var utc_offset
    if (timezone !== "") {
        var a = timezone.split(":")
        if (a.length > 1) {
            utc_offset = Number(a[0]) * 60 + Number(a[1])
            datetime = moment.tz(result, "YYYY-MM-DD HH:mm:ss", "UTC")
            datetime.subtract(utc_offset, 'minutes')
        } else {
            datetime = moment.tz(result, "YYYY-MM-DD HH:mm:ss", timezone)
            utc_offset = -datetime.zone()
            datetime.utc()
        }
    } else {
        datetime = moment(result, "YYYY-MM-DD HH:mm:ss")
        utc_offset = -datetime.zone()
        datetime.utc()
    }

    console.log(datetime.toISOString(), utc_offset)

    return [ datetime.toISOString(), utc_offset ]
}

datetime_input_field.prototype.enable = function() {
    this.date.attr('disabled', null)
    this.time.attr('disabled', null)
    this.timezone.attr('disabled', null)
}

datetime_input_field.prototype.disable = function() {
    this.date.attr('disabled', true)
    this.time.attr('disabled', true)
    this.timezone.attr('disabled', true)
}



// define password_input_field
function password_input_field(title, required) {
    text_input_field.call(this, title, required)
}

password_input_field.prototype = new text_input_field()
password_input_field.constructor = password_input_field
password_input_field.prototype.create = function(id) {
    this.input = $('<input />')
        .attr('type', "password")
        .attr('name', id)
        .attr('id', "id_" + id)
    return this.input
}


// define date_input_field
function date_input_field(title, required) {
    text_input_field.call(this, title, required)
}

date_input_field.prototype = new text_input_field()
date_input_field.constructor = date_input_field
date_input_field.prototype.create = function(id) {
    this.input = $('<input />')
        .attr('id', "id_" + id)
        .datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
        })
    return this.input
}

date_input_field.prototype.validate = function() {
    var date = this.get()

    if (date != null) {
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
    this.input = $('<textarea />')
        .attr('rows', 10)
        .attr('cols', 40)
        .attr('name', id)
        .attr('id', "id_" + id)
    return this.input
}


// define integer_input_field
function integer_input_field(title, required) {
    text_input_field.call(this, title, required)
}

integer_input_field.prototype = new text_input_field()
integer_input_field.constructor = integer_input_field

integer_input_field.prototype.validate = function() {
    var value = this.get()
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
    if (!this.required) {
        mythis.options[""] = $('<option />')
            .attr('value', "")
            .text("-----")
            .appendTo(mythis.input)
    }
    $.each(options, function(i, v){
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
    this.input.val(value)
}

select_input_field.prototype.validate = function() {
    var value = this.get()
    if (value == null) {
        value = ""
    }
    if (this.options[value] == null) {
        return value + " is not valid option"
    }
    return null
}


// define boolean_input_field
function boolean_input_field(title, options, required) {
    this.options_list = options
    input_field.call(this, title, required)
}

boolean_input_field.prototype = new input_field()
boolean_input_field.constructor = boolean_input_field
boolean_input_field.prototype.create = function(id) {
    this.input = $('<input />')
        .attr('type', 'checkbox')
        .attr('name', id)
        .attr('id', "id_" + id)
    return this.input
}

boolean_input_field.prototype.set = function(value) {
    if (value) {
        this.input.attr('checked', 'checked')
    } else {
        this.input.removeAttr('checked')
    }
}

boolean_input_field.prototype.get = function() {
    var value = this.input.is(":checked")
    return value
}

// define ajax_select_field
function ajax_select_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_field.prototype = new input_field()
ajax_select_field.constructor = ajax_select_field
ajax_select_field.prototype.create = function(id) {
    this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocomplete({type: this.type})
    return this.input
}

ajax_select_field.prototype.destroy = function() {
    this.input.ajaxautocomplete("destroy")
}

ajax_select_field.prototype.set = function(value) {
    this.input.ajaxautocomplete("set", null, value)
}

ajax_select_field.prototype.get = function() {
    return this.input.ajaxautocomplete("get")
}

ajax_select_field.prototype.enable = function() {
    this.input.ajaxautocomplete("enable")
}

ajax_select_field.prototype.disable = function() {
    this.input.ajaxautocomplete("disable")
}



// define quick_select_field
// function quick_select_field(title, type, required) {
//     input_field.call(this, title, required)
//     this.type = type
// }
//
// quick_select_field.prototype = new input_field()
// quick_select_field.constructor = quick_select_field
// quick_select_field.prototype.create = function(id) {
//     return this.input = $("<span/>")
//         .attr("name", id)
//         .attr("id", "id_" + id)
//         .quickautocomplete({type: this.type})
// }
//
// quick_select_field.prototype.destroy = function() {
//     this.input.quickautocomplete("destroy")
// }
//
// quick_select_field.prototype.set = function(value) {
//     var item = null
//     if (value != null) {
//         item = {
//             pk: value.id,
//             repr: value.title,
//         }
//     }
//     this.input.quickautocomplete("set", item)
// }
//
// quick_select_field.prototype.get = function() {
//     return this.input.quickautocomplete("get")
// }


// define ajax_select_multiple_field
function ajax_select_multiple_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_multiple_field.prototype = new input_field()
ajax_select_multiple_field.constructor = ajax_select_multiple_field
ajax_select_multiple_field.prototype.create = function(id) {
    this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletemultiple({type: this.type})
    return this.input
}

ajax_select_multiple_field.prototype.destroy = function() {
    this.input.ajaxautocompletemultiple("destroy")
}

ajax_select_multiple_field.prototype.set = function(value) {
    this.input.ajaxautocompletemultiple("set", null, value)
}

ajax_select_multiple_field.prototype.get = function() {
    return this.input.ajaxautocompletemultiple("get")
}

ajax_select_multiple_field.prototype.enable = function() {
    this.input.ajaxautocompletemultiple("enable")
}

ajax_select_multiple_field.prototype.disable = function() {
    this.input.ajaxautocompletemultiple("disable")
}


// define ajax_select_sorted_field
function ajax_select_sorted_field(title, type, required) {
    input_field.call(this, title, required)
    this.type = type
}

ajax_select_sorted_field.prototype = new input_field()
ajax_select_sorted_field.constructor = ajax_select_sorted_field
ajax_select_sorted_field.prototype.create = function(id) {
    this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletesorted({type: this.type})
    return this.input
}

ajax_select_sorted_field.prototype.destroy = function() {
    this.input.ajaxautocompletesorted("destroy")
}

ajax_select_sorted_field.prototype.set = function(value) {
    this.input.ajaxautocompletesorted("set", null, value)
}

ajax_select_sorted_field.prototype.get = function() {
    return this.input.ajaxautocompletesorted("get")
}

ajax_select_sorted_field.prototype.enable = function() {
    this.input.ajaxautocompletesorted("enable")
}

ajax_select_sorted_field.prototype.disable = function() {
    this.input.ajaxautocompletesorted("disable")
}


// define photo_select_field
function photo_select_field(title, required) {
    input_field.call(this, title, required)
}

photo_select_field.prototype = new input_field()
photo_select_field.constructor = photo_select_field
photo_select_field.prototype.create = function(id) {
    this.input = $("<span/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .photo_select()
    return this.input
}

photo_select_field.prototype.destroy = function() {
    this.input.photo_select("destroy")
}

photo_select_field.prototype.set = function(value) {
    this.input.photo_select("set", null, value)
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

photo_select_field.prototype.enable = function() {
    this.input.photo_select("enable")
}

photo_select_field.prototype.disable = function() {
    this.input.photo_select("disable")
}




// define dialog
$.widget('spud.form_dialog',  $.spud.base_dialog, {
    _create: function() {
        var mythis = this

        this.f = $("<form method='get' />")
            .appendTo(this.element)

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

                mythis.page[name] = $("<table/>")
                    .attr('id', name)
                    .appendTo(mythis.tabs)

                mythis._create_fields(name, page.fields)
            })

            mythis.tabs.tabs()
        } else {
            this.table = $("<table/>")
                .addClass("fields")
                .appendTo(this.f)
            this._create_fields(null, this.options.fields)
        }

        this._super()
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
            this.disable()
            this._submit()
        }
    },

    _create_fields: function(page, fields) {
        if (fields != null) {
            this.add_fields(page, fields)
        }
    },

    _submit: function() {
        var mythis = this
        var values = {}
        $.each(this.fields, function(id, field) {
            void field
            values[id] = mythis.get_value(id)
        })
        this._submit_values(values)
    },

    _disable: function() {
        $.each(this.fields, function(id, field) {
            field.disable()
        })
        this._super()
    },

    _enable: function() {
        $.each(this.fields, function(id, field) {
            field.enable()
        })
        this._super()
    },

    _submit_values: function(values) {
        void values
    },

    _set: function(values) {
        var mythis = this
        $.each(mythis.fields, function(id, field) {
            void field
            mythis.set_value(id, values[id])
        })
    },

    add_field: function(page, id, field) {
        this.remove_field(id, field)
        var html = field.to_html(id)
        if (page == null) {
            this.table.append(html)
        } else {
            this.page[page].append(html)
        }
        this.fields[id] = field
        return this
    },

    add_fields: function(page, fields) {
        var mythis = this
        $.each(fields, function(i, v){
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

    set_error: function(id, message) {
        this.fields[id].set_error(message)
        return this
    },

    get_value: function(id) {
        return this.fields[id].get()
    },

    _destroy: function() {
        $.each(this.fields, function(id, field) {
            field.destroy()
        })
        this._super()
    },
})
