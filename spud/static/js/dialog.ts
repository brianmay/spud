/// <reference path="globals.ts" />
/// <reference path="generic.ts" />
/// <reference path="DefinitelyTyped/moment.d.ts" />
/// <reference path="DefinitelyTyped/moment-timezone.d.ts" />
/// <reference path="DefinitelyTyped/jquery.d.ts" />
/// <reference path="DefinitelyTyped/jqueryui.d.ts" />
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

interface DialogValues {
    [ id : string ] : any
}

interface IdInputField {
    0 : string
    1 : InputField
}

interface InputPage {
    name : string
    title : string
    fields : Array<IdInputField>
}

// define input_field
abstract class InputField {

    title : string
    required : boolean
    input : JQuery
    errors : JQuery
    tr : JQuery

    constructor(title : string, required : boolean) {
        this.title = title
        this.required = Boolean(required)
    }

    abstract create(id : string) : JQuery;

    to_html(id : string) : JQuery {
        var html = this.create(id)

        var th = $("<th/>")
        $("<label/>")
            .attr("for", "id_" + id)
            .text(this.title + ":")
            .appendTo(th)
            .toggleClass("required", this.required.toString())

        this.errors = $("<div></div>")

        var td = $("<td/>")
            .append(html)
            .append(this.errors)


        this.tr = $("<tr/>")
            .append(th)
            .append(td)

        return this.tr
    }

    abstract set(value : any) : void;

    get() : any {
        var value = this.input.val()
        if (value) {
            value = value.trim()
        } else {
            value = null
        }
        return value
    }

    validate() : string {
        var value = this.input.val()
        if (this.required && !value) {
            return "This value is required"
        }
        return null
    }

    set_error(error : string) : void {
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

    clear_error() : void {
        this.set_error(null)
    }

    destroy() : void {
        this.tr.remove()
    }

    enable() : void {
        this.input.attr('disabled', null)
    }

    disable() : void {
        this.input.attr('disabled', 'true')
    }
}


// define text_input_field
class TextInputField extends InputField {
    constructor(title : string, required : boolean) {
        super(title, required)
    }

    create(id : string) : JQuery {
        this.input = $('<input />')
            .attr('type', "text")
            .attr('name', id)
            .attr('id', "id_" + id)
        return this.input
    }

    set(value : string) : void {
        this.input.val(value)
    }
}

// define datetime_input_field
class DateTimeInputField extends InputField {
    date : JQuery
    time : JQuery
    timezone : JQuery

    constructor(title : string, required : boolean) {
        super(title, required)
    }

    create(id : string) : JQuery {
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

    set(value : DateTimeZone) : void {
        if (value != null) {
            var datetime : moment.Moment = moment(value[0])
            var utc_offset : number = value[1]
            datetime = datetime.zone(-utc_offset)
            this.date.datepicker("setDate", datetime.format("YYYY-MM-dd"))
            this.date.val(datetime.format("YYYY-MM-DD"))
            this.time.val(datetime.format("HH:mm:ss"))

            var hours = Math.floor(utc_offset / 60);
            var minutes = utc_offset - (hours * 60);

            var str_hours = hours.toString()
            var str_minutes = minutes.toString()

            if (hours < 10) {str_hours = "0" +  str_hours;}
            if (minutes < 10) {str_minutes = "0" +  str_minutes;}

            this.timezone.val(hours + ":" + minutes)
        } else {
            this.date.val("")
            this.time.val("")
            this.timezone.val("")
        }
    }

    validate() : string {
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

    get() : DateTimeZone {
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

        console.log(datetime, utc_offset)

        return [ datetime, utc_offset ]
    }

    enable() : void {
        this.date.attr('disabled', null)
        this.time.attr('disabled', null)
        this.timezone.attr('disabled', null)
    }

    disable() : void {
        this.date.attr('disabled', "true")
        this.time.attr('disabled', "true")
        this.timezone.attr('disabled', "true")
    }
}

// define password_input_field
class PasswordInputField extends TextInputField {

    constructor(title, required) {
        super(title, required)
    }

    create(id : string) : JQuery {
        this.input = $('<input />')
            .attr('type', "password")
            .attr('name', id)
            .attr('id', "id_" + id)
        return this.input
    }
}

// define date_input_field
class DateInputField extends TextInputField {
    constructor(title : string, required : boolean) {
        super(title, required)
    }

    create(id : string) : JQuery {
        this.input = $('<input />')
            .attr('id', "id_" + id)
            .datepicker({
                changeMonth: true,
                changeYear: true,
                dateFormat: "yy-mm-dd",
            })
        return this.input
    }

    validate() : string {
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
}


// define p_input_field
class PInputField extends TextInputField {
    constructor(title : string, required : boolean) {
        super(title, required)
    }

    create(id : string) : JQuery {
        this.input = $('<textarea />')
            .attr('rows', 10)
            .attr('cols', 40)
            .attr('name', id)
            .attr('id', "id_" + id)
        return this.input
    }
}


// define integer_input_field
class IntegerInputField extends TextInputField {
    constructor(title : string, required : boolean) {
        super(title, required)
    }

    validate() : string {
        var value = this.get()
        var intRegex = /^\d+$/;
        if (value && !intRegex.test(value)) {
            return "Value must be integer"
        }
        return super.validate()
    }
}

// define select_input_field
class SelectInputField extends InputField {
    options_list : Array<OptionKeyValue>
    options : StringArray<JQuery>

    constructor(title : string, options : Array<OptionKeyValue>, required : boolean) {
        super(title, required)
        this.options_list = options
    }

    create(id : string) : JQuery {
        this.input = $('<select />')
            .attr('name', id)
            .attr('id', "id_" + id)

        this.set_options(this.options_list)
        return this.input
    }

    set_options(options : Array<OptionKeyValue>) : void {
        this.input.empty()
        this.options = {}
        var null_option = "-----"

        for (let option of options) {
            let id : string = option[0]
            let value : string = option[1]
            if (typeof value != 'undefined') {
                this.options[id] = $('<option />')
                    .attr('value', id)
                    .text(value)
                    .appendTo(this.input)
            } else {
                null_option = value
            }
        }
        if (!this.required) {
            this.options[""] = $('<option />')
                .attr('value', "")
                .text(null_option)
                .prependTo(this.input)
        }
        this.options_list = options
    }

    set(value : string) : void {
        this.input.val(value)
    }

    validate() : string {
        var value = this.get()
        if (value == null) {
            value = ""
        }
        if (this.options[value] == null) {
            return value + " is not valid option"
        }
        return null
    }
}

// define boolean_input_field
class booleanInputField extends InputField {
    constructor(title : string, required : boolean) {
        super(title, required)
    }

    create(id : string) : JQuery {
        this.input = $('<input />')
            .attr('type', 'checkbox')
            .attr('name', id)
            .attr('id', "id_" + id)
        return this.input
    }

    set(value : boolean) : void {
        if (value) {
            this.input.attr('checked', 'checked')
        } else {
            this.input.removeAttr('checked')
        }
    }

    get() : boolean {
        var value = this.input.is(":checked")
        return value
    }
}

// define ajax_select_field
class AjaxSelectField extends InputField {
    type : string

    constructor(title : string, type : string, required : boolean) {
        super(title, required)
        this.type = type
    }

    create(id : string) : JQuery {
        this.input = $("<span/>")
            .attr("name", id)
            .attr("id", "id_" + id)
        $.spud.ajaxautocomplete({type: this.type}, this.input)
        return this.input
    }

    destroy() : void {
        this.input.ajaxautocomplete("destroy")
    }

    set(value : SpudObject) : void {
        this.input.ajaxautocomplete("set", value, null)
    }

    get() : SpudObject {
        return this.input.ajaxautocomplete("get")
    }

    enable() : void {
        this.input.ajaxautocomplete("enable")
    }

    disable() : void {
        this.input.ajaxautocomplete("disable")
    }
}

// define ajax_select_multiple_field
class AjaxSelectMultipleField extends InputField {
    type : string

    constructor(title : string, type : string, required : boolean) {
        super(title, required)
        this.type = type
    }

    create(id : string) : JQuery {
        this.input = $("<span/>")
            .attr("name", id)
            .attr("id", "id_" + id)
        $.spud.ajaxautocompletemultiple({type: this.type}, this.input)
        return this.input
    }

    destroy() : void {
        this.input.ajaxautocompletemultiple("destroy")
    }

    set(value : Array<SpudObject>) : void {
        this.input.ajaxautocompletemultiple("set", value, null)
    }

    get() : Array<SpudObject> {
        return this.input.ajaxautocompletemultiple("get")
    }

    enable() : void {
        this.input.ajaxautocompletemultiple("enable")
    }

    disable() : void {
        this.input.ajaxautocompletemultiple("disable")
    }
}

// define ajax_select_sorted_field
class AjaxSelectSortedField extends InputField {
    type : string

    constructor(title : string, type : string, required : boolean) {
        super(title, required)
        this.type = type
    }

    create(id : string) : JQuery {
        this.input = $("<span/>")
            .attr("name", id)
            .attr("id", "id_" + id)
        $.spud.ajaxautocompletesorted({type: this.type}, this.input)
        return this.input
    }

    destroy() : void {
        this.input.ajaxautocompletesorted("destroy")
    }

    set(value : Array<SpudObject>) : void {
        this.input.ajaxautocompletesorted("set", value, null)
    }

    get() : Array<SpudObject> {
        return this.input.ajaxautocompletesorted("get")
    }

    enable() : void {
        this.input.ajaxautocompletesorted("enable")
    }

    disable() : void {
        this.input.ajaxautocompletesorted("disable")
    }
}


// define photo_select_field
class PhotoSelectField extends InputField {
    constructor(title : string, required : boolean) {
        super(title, required)
    }

    create(id : string) : JQuery {
        this.input = $("<span/>")
            .attr("name", id)
            .attr("id", "id_" + id)
        $.spud.photo_select({}, this.input)
        return this.input
    }

    destroy() : void {
        this.input.photo_select("destroy")
    }

    set(value : Photo) : void {
        if (value != null) {
            this.input.photo_select("set", value, null)
        } else {
            this.input.photo_select("set", null, null)
        }
    }

    get() : Photo {
        return this.input.photo_select("get")
    }

    validate() : string {
        var value : Photo = this.input.photo_select("get")
        if (this.required && !value) {
            return "This value is required"
        }
        return null
    }

    enable() : void {
        this.input.photo_select("enable")
    }

    disable() {
        this.input.photo_select("disable")
    }
}

// define dialog
interface FormDialogOptions extends BaseDialogOptions {
    pages? : Array<InputPage>
    fields? : Array<IdInputField>
    obj? : any
}

abstract class FormDialog extends BaseDialog {
    protected options : FormDialogOptions
    private f : JQuery
    private fields : StringArray<InputField>
    private page : StringArray<JQuery>
    private tabs : JQuery
    private table : JQuery

    constructor(options : FormDialogOptions) {
        super(options)
    }

    show(element : JQuery) : void {
        super.show(element)

        this.f = $("<form method='get' />")
            .appendTo(this.element)

        this.fields = {}
        if (this.options.pages) {
            this.page = {}
            this.tabs = $("<div/>")
                .addClass("fields")
                .appendTo(this.f)

            var ul = $("<ul></ul>").appendTo(this.tabs)

            for (let i=0; i<this.options.pages.length; i++) {
                let page : InputPage = this.options.pages[i]
                let name = page.name
                let title = page.title
                $("<li/>")
                    .append(
                        $("<a/>")
                            .attr("href", '#' + name)
                            .text(title)
                    )
                    .appendTo(ul)

                this.page[name] = $("<table/>")
                    .attr('id', name)
                    .appendTo(this.tabs)

                this.create_fields(name, page.fields)
            }

            this.tabs.tabs()
        } else {
            this.table = $("<table/>")
                .addClass("fields")
                .appendTo(this.f)
            this.create_fields(null, this.options.fields)
        }

        if (this.options.obj != null) {
            this.set(this.options.obj)
        }
    }

    protected check_submit() : void {
        var allok = true
        for (let id in this.fields) {
            let field : InputField = this.fields[id]
            var error = field.validate()
            if (error) {
                field.set_error(error)
                allok = false;
            } else {
                field.clear_error()
            }
        }
        if (allok) {
            this.disable()
            this.submit()
        }
    }

    private create_fields(page : string, fields : Array<IdInputField>) {
        if (fields != null) {
            this.add_fields(page, fields)
        }
    }

    protected submit() {
        var values : DialogValues = {}
        for (let id in this.fields) {
            let field : InputField = this.fields[id]
            values[id] = this.get_value(id)
        }
        this.submit_values(values)
    }

    disable() : void {
        for (let id in this.fields) {
            let field : InputField = this.fields[id]
            field.disable()
        }
        super.disable()
    }

    enable() : void {
        for (let id in this.fields) {
            let field : InputField = this.fields[id]
            field.enable()
        }
        super.enable()
    }

    protected submit_values(values : DialogValues) : void {
    }

    set(values : DialogValues) : void {
        for (let id in this.fields) {
            this.set_value(id, values[id])
        }
    }

    add_field(page : string, id : string, field : InputField) : void {
        this.remove_field(id)
        var html = field.to_html(id)
        if (page == null) {
            this.table.append(html)
        } else {
            this.page[page].append(html)
        }
        this.fields[id] = field
    }

    add_fields(page : string, fields : Array<IdInputField>) : void {
        for (let item of fields) {
            let id : string = item[0]
            let field : InputField = item[1]
            this.add_field(page, id, field)
        }
    }

    remove_field(id : string) : void {
        var field = this.fields[id]
        if (field != null) {
            field.destroy()
            delete this.fields[id]
        }
    }

    remove_all_fields() : void {
        for (let id in this.fields) {
            this.remove_field(id)
        }
    }

    set_value(id : string, value : any) : void {
        let field : InputField = this.fields[id]
        field.set(value)
    }

    set_error(id : string, message : string) : void {
        let field : InputField = this.fields[id]
        field.set_error(message)
    }

    get_value(id : string) {
        let field : InputField = this.fields[id]
        return field.get()
    }

    destroy() : void {
        for (let id in this.fields) {
            let field : InputField = this.fields[id]
            field.destroy()
        }
        super.destroy()
    }

    protected save_error(message : string, data : StringArray<string>) : void {
        if (data != null) {
            for (let id in data) {
                let error : string = data[id]
                if (this.fields[id] != null) {
                    this.fields[id].set_error(error)
                }
            }
        }
        super.save_error(message, data)
    }
}
