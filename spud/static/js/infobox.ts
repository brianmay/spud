/// <reference path="globals.ts" />
/// <reference path="generic.ts" />
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

// **************
// * INFO BOXES *
// **************

interface InfoboxValues {
    [ id : string ] : any
}

interface IdOutputField {
    0 : string
    1 : OutputField
}

interface OutputPage {
    name : string
    title : string
    fields : Array<IdOutputField>
}

// define output_field
class OutputField {
    title :  string
    dt : JQuery
    dd : JQuery
    item : JQuery
    output : JQuery
    visible : boolean

    constructor(title : string) {
        this.title = title
    }

    to_html(id : string) : JQuery {
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

    create(id : string) : JQuery {
        this.output = $('<span />')
        return this.output
    }

    destroy() : void {
        this.item.remove()
    }

    set(value : any) {
    }

    set_edit_value(html : JQuery) : void {
        html.addClass("edit")
        var edit = this.dd.find(".edit")
        if (edit.length > 0) {
            edit.replaceWith(html)
        } else {
            this.dd.append(" ")
            this.dd.append(html)
        }
    }

    toggle(show : boolean) : void {
        this.item.toggleClass("hidden", !show)
        this.visible = show
    }

    hide() : void {
        this.item.addClass("hidden")
        this.visible = false
    }

    show() : void {
        this.item.removeClass("hidden")
        this.visible = true
    }
}

// define text_output_field
class TextOutputField extends OutputField {
    constructor(title : string) {
        super(title)
    }

    set(value : string) {
        if (value != null) {
            this.output.text(value)
        } else {
            this.output.text("None")
        }
        this.toggle(Boolean(value))
    }
}

// define select_input_field
class SelectOutputField extends OutputField {
    options : StringArray<string>

    constructor(title : string, options : Array<OptionKeyValue>) {
        super(title)
        this.options = {}
        for (let option of options) {
            var id : string = option[0]
            var value : string = option[1]
            this.options[id] = value
        }
    }

    set(value : string) : void {
        value = this.options[value]
        this.output.text(value)
        this.toggle(value != null)
    }
}

// define boolean_outbooleanut_field
class booleanOutputField extends OutputField {
    constructor(title : string) {
        super(title)
    }

    set(value : boolean) : void {
        this.output.text(value ? "True" : " False")
        this.toggle(value != null)
    }
}

// define integer_outintegerut_field
class IntegerOutputField extends OutputField {
    constructor(title : string) {
        super(title)
    }

    set(value : number) : void {
        this.output.text(value)
        this.toggle(value != null)
    }
}

// define p_output_field
class POutputField extends OutputField {
    constructor(title : string) {
        super(title)
    }

    set(value : string) : void {
        this.output.p(value)
        this.toggle(Boolean(value))
    }
}

// define datetime_output_field
class DateTimeOutputField extends OutputField {
    datetime : JQuery
    output : JQuery
    timezone :  string
    value : DateTimeZone

    constructor(title : string) {
        super(title)
        this.timezone = "local"
    }

    create(id : string) : JQuery {
        void id

        this.datetime = null

        var mythis = this

        var div = $('<div/>')

        this.output = $('<div />').appendTo(div)

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
    }

    set(value : DateTimeZone) : void {
        this.value = value

        this.output.empty()

        if (value != null) {
            var datetime : moment.Moment = moment(value[0])
            var utc_offset = value[1]
            if (this.timezone === "local") {
                datetime.local()
            } else if (this.timezone === "source") {
                datetime.zone(-utc_offset)
            } else {
                datetime = datetime.tz(this.timezone)
            }

            var datetime_str : string
            if (datetime != null) {
                datetime_str = datetime.format("dddd, MMMM Do YYYY, h:mm:ss a")
            } else {
                datetime_str = "N/A"
            }

            this.output
                .append( $("<p/>").text(datetime_str + " " + this.timezone) )

            this.show()
        } else {
            this.hide()
        }
    }
}

// define link_output_field
class LinkOutputField extends OutputField {
    type : string

    constructor(title : string, type : string) {
        super(title)
        this.type = type
    }

    set(value) : void {
        this.toggle(value != null)
        if (value == null) {
            this.output.text("")
            return
        }

        var a = object_a(this.type, value)
        this.output.empty()
        this.output.append(a)
    }
}

// define link_list_output_field
class LinkListOutputField extends OutputField {
    type : string

    constructor(title : string, type : string) {
        super(title)
        this.type = type
    }

    set(value : Array<SpudObject>) : void {
        this.output.empty()

        if (value == null || value.length === 0) {
            this.hide()
            return
        }

        var sep = ""
        for (let item of value) {
            this.output.append(sep)
            if (item != null) {
                this.output.append(object_a(this.type, item))
            } else {
                this.output.append("Unknown")
            }
            sep = ", "
        }
        this.output.append(".")
        this.toggle(value.length > 0)
    }
}

// define photo_output_field
class PhotoOutputField extends OutputField {
    size : string
    do_link : boolean
    private img : ImageWidget

    constructor(title : string, size : string, do_link : boolean) {
        super(title)
        this.size = size
        this.do_link = do_link
    }

    create(id : string) : JQuery {
        this.output = $('<div />')
        this.img = new ImageWidget({ size: this.size, include_link: this.do_link })
        this.img.show(this.output)
        return this.output
    }

    set(value : Photo) : void {
        this.img.set(value)
        this.toggle(value != null)
    }

    destroy() : void {
        this.img.remove()
        super.destroy()
    }
}

// define infobox widget

interface InfoboxOptions extends WidgetOptions {
    title? : string
    pages? : Array<OutputPage>
    fields? : Array<IdOutputField>
    obj? : any
}

abstract class Infobox extends Widget {
    protected options : InfoboxOptions
    // private f : JQuery
    private fields : StringArray<OutputField>
    private page : StringArray<JQuery>
    private tabs : JQuery
    // private table : JQuery
    private dl : JQuery

    constructor(options : InfoboxOptions) {
        super(options)
    }

    show(element : JQuery){
        var mythis = this
        var options = this.options

        super.show(element)

        this.element.addClass("infobox")

        if (options.title != null) {
            $("<h2></h2")
                .text(this.options.title)
                .appendTo(this.element)
        }

        this.fields = {}
        if (this.options.pages != null) {
            this.page = {}
            this.tabs = $("<div/>")
                .addClass("fields")
                .appendTo(this.element)

            var ul = $("<ul></ul>").appendTo(this.tabs)

            for (let i=0; i<this.options.pages.length; i++) {
                let page : OutputPage = this.options.pages[i]
                var name = page.name
                var title = page.title

                $("<li/>")
                    .append(
                        $("<a/>")
                            .attr("href", '#' + name)
                            .text(title)
                    )
                    .appendTo(ul)

                this.page[name] = $("<div/>")
                    .addClass("def_list")
                    .attr('id', name)
                    .appendTo(mythis.tabs)

                this.create_fields(name, page.fields)
            }

            this.tabs.tabs()
        } else {
            this.dl = $("<div/>")
                .addClass("fields")
                .addClass("def_list")
                .appendTo(this.element)
            this.create_fields(null, this.options.fields)
        }

        if (this.options.obj != null) {
            this.set(this.options.obj)
        }
    }

    destroy() : void {
        this.element.removeClass("infobox")
        for (let id in this.fields) {
            let field : OutputField = this.fields[id]
            field.destroy()
        }
        super.destroy()
    }

    create_fields(page : string, fields : Array<IdOutputField>) : void {
        if (fields != null) {
            this.add_fields(page, fields)
        }
    }

    set(values : InfoboxValues) : void {
        var visible = false
        for (let id in this.fields) {
            let field : OutputField = this.fields[id]
            this.set_value(id, values[id])
            if (field.visible) {
                visible = true
            }
        }

        if (this.tabs != null) {
            this.tabs.toggleClass("hidden", !visible)
        }

        if (this.dl != null) {
            this.dl.toggleClass("hidden", !visible)
        }
    }

    add_field(page : string, id : string, field : OutputField) : void {
        this.remove_field(id)
        var html = field.to_html(id)
        if (page == null) {
            this.dl.append(html)
        } else {
            this.page[page].append(html)
        }
        this.fields[id] = field
    }

    add_fields(page : string, fields : Array<IdOutputField>) : void {
        for (let item of fields) {
            var id : string = item[0]
            var field : OutputField = item[1]
            this.add_field(page, id, field)
        }
    }

    remove_field(id : string) : void {
        var field : OutputField = this.fields[id]
        if (field != null) {
            field.destroy()
            delete this.fields[id]
        }
    }

    remove_all_fields() : void {
        for (let id in this.fields) {
            let field : OutputField = this.fields[id]
            this.remove_field(id)
        }
    }

    set_value(id : string, value : any) : void {
        this.fields[id].set(value)
    }

    set_edit_value(id : string, value : any, can_change : boolean, a : JQuery) : void {
        this.fields[id].set(value)
        if (can_change) {
            this.fields[id].show()
            this.fields[id].set_edit_value(a)
        }
    }
}
