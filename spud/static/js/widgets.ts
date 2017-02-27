/// <reference path="generic.ts" />
/// <reference path="DefinitelyTyped/jquery.d.ts" />

class WidgetOptions {
    disabled? : boolean
}

var widget_uuid : number = 0

class Widget {
    protected element : JQuery
    protected options : WidgetOptions
    protected uuid : number
    // static class_name : string

    constructor(options : WidgetOptions) {
        this.options = options
        this.uuid = widget_uuid
        widget_uuid = widget_uuid + 1
    }

    protected get_uuid() : string {
        return this.uuid.toString()
    }

    show(element : JQuery) : void {
        this.element = element
        this.element.data('widget', this)
    }

    enable() : void {
        this.options.disabled = false
    }

    disable() : void {
        this.options.disabled = true
    }

    toggle() {
        if (this.options.disabled) {
            this.enable()
        } else {
            this.disable()
        }
    }

    hide() : void {
        this.element.find(":data(widget)").each((key : number, el : Element) => {
            let widget : Widget = $(el).data("widget")
            if (widget != null) {
                widget.destroy()
            }
        })
        this.destroy()
    }

    remove() : void {
        this.hide()
        this.element.remove()
    }

    protected destroy() : void {
        remove_all_listeners(this)
        this.disable()
        this.element.empty()
        this.element.removeData('widget')
    }
}

class ViewportOptions extends WidgetOptions {
    id? : string
    title? : string
}

abstract class Viewport extends Widget {
    protected options : ViewportOptions
    private maximize_button : JQuery
    private unmaximize_button : JQuery
    private h1 : JQuery
    protected div : JQuery

    constructor(options : ViewportOptions) {
        super(options)
    }

    show(element : JQuery) : void {
        super.show(element)

        if (this.options.id == null) {
            this.options.id = this.get_uuid()
        }
        this.set_id(this.options.id)

        let header = $("<div/>")
            .addClass("viewport_header")
            .appendTo(this.element)

        this.maximize_button = $("<div/>")
            .addClass("button")
            .addClass("maximize_button")
            .text("[M]")
            .click((ev) => {
                this.maximize()
            })
            .appendTo(header)

        this.unmaximize_button = $("<div/>")
            .addClass("button")
            .addClass("unmaximize_button")
            .text("[R]")
            .on("click", (ev) => {
                this.unmaximize()
            })
            .appendTo(header)

        this.set_maximize_button()

        $("<div/>")
            .addClass("button")
            .addClass("close_button")
            .text("[X]")
            .on("click", (ev) => {
                this.remove()
                return false;
            })
            .appendTo(header)

        this.h1 = $("<h1/>")
            .on("click", (ev) => {
                this.toggle()
            })
            .appendTo(header)

        this.element.addClass("viewport")

        if (this.options.disabled) {
            this.disable()
        } else {
            this.enable()
        }

        // We must set title after enabling widget, so we push new state to
        // history first.
        this.set_title(this.options.title)

        this.div = $("<div/>")
            .addClass("viewport_content")
            .appendTo(this.element)
    }

    private set_maximize_button() : void {
        let maximize = $("#content").hasClass("maximize")
        this.maximize_button.toggle(!maximize)
        this.unmaximize_button.toggle(maximize)
    }

    maximize() : void {
        this.enable()
        $("#content").addClass("maximize")
        this.set_maximize_button()
    }

    unmaximize() : void {
        this.enable()
        $("#content").removeClass("maximize")
        this.set_maximize_button()
    }

    protected _enable() : void {
        super.enable()
        this.element.removeClass("disabled")
    }

    protected _disable() : void {
        super.disable()
        this.element.addClass("disabled")
    }

    private _disable_all() : void {
        $(".viewport:not(.disabled)").each((key : number, el : Element) => {
            let viewport : Viewport = $(el).data('widget')
            viewport._disable()
        })
    }

    disable_all() : void {
        this._disable_all()
        push_state()
    }

    enable() : void {
        this._disable_all()
        this._enable()
        push_state()
    }

    disable() : void {
        this.unmaximize()
        this._disable()
        push_state()
    }

    remove() : void {
        super.remove()
        let last_viewport = $(".viewport:last")
        if (last_viewport.length > 0) {
            let viewport : Viewport = last_viewport.data('widget')
            viewport.enable()
        } else {
            push_state()
        }
    }

    private set_id(id) : void {
        this.options.id = id
        this.element.attr("id", id)
    }

    get_id() : string {
        return this.options.id
    }

    set_title(title) : void {
        this.h1.text(title)
        this.options.title = title
        if (!this.options.disabled) {
            push_state(true)
        }
    }

    get_title() : string {
        return this.options.title
    }

    abstract get_url() : string;

    set_streamable_state(streamable : GetStreamable) : void {
        //if (state['disabled']) {
        //    this.options.disabled = true
        //} else {
        //    this.options.disabled = false
        //}
        //this.options.title = parse_string(state['title'] + "")
        //this.options.id = parse_string(state['id'] + "")
    }

    get_streamable_state() : GetStreamable {
        let streamable : GetStreamable = {}
        //state['disabled'] = this.options.disabled
        //state['title'] = this.options.title
        //state['id'] = this.options.id
        return streamable
    }
}

// define dialog
class BaseDialogOptions extends WidgetOptions {
    title? : any
    description? : string
    button? : string
}

abstract class BaseDialog extends Widget {
    protected options : BaseDialogOptions
    private description : JQuery
    protected type : string
    private loading : boolean
    private xhr : JQueryXHR

    constructor(options : BaseDialogOptions) {
        super(options)
        this.loading = false
    }

    show(element : JQuery) : void {
        $.each($(".autoclose"), (i : number, dialog : Element) => {
            let widget : Widget = $(dialog).data("widget")
            widget.remove()
        })

        super.show(element)

        this.element.addClass("autoclose")

        let options = this.options

        this.description = $("<p/>")
            .appendTo(this.element)

        this.element.data('dialog', this)

        if (options.description != null) {
            this.description
                .text(options.description)
        }

        let submit = "Continue"
        if (options.button != null) {
            submit = options.button
        }

        let doptions : JQueryUI.DialogOptions = {}
        doptions.buttons = {}
        doptions.buttons[submit] = () => {
            this.check_submit()
        }
        doptions.buttons['Cancel'] = () => {
            this.remove()
        }

        doptions.title = options.title
        doptions.width = 400

        this.element.on(
            "keypress",
            (ev) => {
                if (ev.which === 13 && !ev.shiftKey) {
                    this.check_submit()
                    return false
                    }
            }
        )

        doptions.close = ( ev, ui ) => {
            this.remove()
        }

        this.element.dialog(doptions)
    }

    protected check_submit() : void {
        this.disable()
        this.submit()
    }

    protected submit() : void {
    }

    set(values : any) : void {
    }

    disable() : void {
        this.element.dialog("disable")
        super.disable()
    }

    enable() : void {
        this.element.dialog("enable")
        super.enable()
    }

    protected destroy() : void {
        this.element.removeClass('autoclose')
        super.destroy()
    }

    set_title(title) : void {
        this.element.parent().find(".ui-dialog-title").html(title)
    }

    set_description(description) : void {
        this.description.text(description)
    }

    protected _save(http_type : string, oject_id : string, values : Streamable) : void {
        let type = this.type
        this.loading = true
        let url
        if (oject_id != null) {
            url = window.__api_prefix + "api/" + type + "/" + oject_id + "/"
        } else {
            url = window.__api_prefix + "api/" + type + "/"
        }
        this.xhr = ajax({
                url: url,
                data: values,
                type: http_type,
            },
            (data : Streamable) => {
                this.loading = false
                this.save_success(data)
            },
            (message : string, data : Streamable) => {
                this.loading = false
                this.save_error(message, data)
            }
        );
    }

    protected save(http_type : string, object_id : number, values : Streamable) : void {
        let str_object_id = null
        if (object_id != null) {
            str_object_id = object_id.toString()
        }
        this._save(http_type, str_object_id, values)
    }

    protected save_action(http_type : string, what : string, values : Streamable) : void {
        this._save(http_type, what, values)
    }

    protected save_success(data : Streamable) {
        this.remove()
    }

    protected save_error(message : string, data : Streamable) {
        alert("Error: " + message)
        this.enable()
    }

}


class ImageWidgetOptions extends WidgetOptions {
    photo? : Photo
    size : string
    do_video? : boolean
    include_link? : boolean
}

class ImageWidget extends Widget {
    protected options : ImageWidgetOptions
    private width : number
    private height : number
    private img : JQuery
    private a : JQuery

    constructor(options : ImageWidgetOptions) {
        super(options)
    }

    show(element : JQuery) {
        super.show(element)

        this.element.addClass("image")

        if (this.options.photo != null) {
            this.set(this.options.photo)
        } else {
            this.set_none()
        }
    }

    private clear() : void {
        this.element.empty()
    }

    set(photo : Photo) : void {
        this.clear()

        if (this.options.do_video && !$.isEmptyObject(photo.videos)) {
            let img = $("<video controls='controls'/>")

            let size = "320"
            for (let i=0; i<photo.videos[size].length; i++) {
                let pv : PriorityPhotoVideo = photo.videos[size][i]
                let priority : number = pv[0]
                let video : PhotoVideo = pv[1]

                img
                    .attr("width", video.width)
                    .attr("height", video.height)

                $("<source/>")
                    .attr("src", video.url)
                    .attr("type", video.format)
                    .appendTo(img)
            }

            img.appendTo(this.element)

            this.img = img

        } else {

            let image : PhotoThumb = null
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
                        .empty()
                        .append(this.img)
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
    }

    set_error() : void {
        this.clear()
        $("<img></img>")
            .attr("src", static_url("img/error.png"))
            .appendTo(this.element)
    }

    set_none() : void {
        this.clear()
        this.img = $("<img></img>")
            .attr('width', 120)
            .attr("src", static_url("img/none.jpg"))
            .appendTo(this.element)
        this.width = 227
        this.height = 222
    }

    set_loading() : void {
        this.clear()
        $("<img></img>")
            .attr("src", static_url("img/ajax-loader.gif"))
            .appendTo(this.element)
    }

    resize(enlarge : boolean) : void {
        let width = this.width
        let height = this.height

        let img = this.img
        let aspect = width / height

        let innerWidth = window.innerWidth
        let innerHeight = window.innerHeight

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
    }
}

class ListWidgetOptions extends WidgetOptions {
}


class ListWidget extends Widget {
    protected options : ListWidgetOptions
    protected ul : JQuery

    constructor(options : ListWidgetOptions) {
        super(options)
    }

    show(element : JQuery) : void {
        super.show(element)

        this.ul = $("<ul></ul>")
            .appendTo(this.element)
    }

    empty() : void {
        this.ul.empty()
        this.element.removeClass("errors")
    }

    append_item(html : JQuery) : JQuery {
        let li = $("<li />")
            .append(html)
            .appendTo(this.ul)
        return li
    }

    clear_status() : void {
        this.element.removeClass("errors")
    }

    display_error() : void {
        this.empty()
        this.element.addClass("errors")
    }
}

class ImageListWidgetOptions extends ListWidgetOptions {
}

class ImageListWidget extends ListWidget {
    protected options : ImageListWidgetOptions
    // private images : Array<ImageWidget>

    constructor(options : ImageListWidgetOptions) {
        super(options)
    }

    show(element : JQuery) {
        super.show(element)
        this.element
            .addClass("photo_list")
    }

    empty() {
        // for (let image of this.images) {
        //     image.remove()
        // }
        super.empty()
    }

    protected create_li(photo : Photo, title : string,
                      details : Array<JQuery>, description : string, a : JQuery) {
        a
                .data("photo", null)
                .empty()

        let div = $("<div />")

        let image = new ImageWidget({
            photo: photo,
            size: "thumb",
            do_video: false,
            include_link: false,
        })
        image.show(div)
        // this.images.push(image)
        div.appendTo(a)

        $("<div class='title'></div>")
            .text(title)
            .appendTo(a)

        if (details && details.length > 0) {
            $("<div class='details'></div>")
                .append(details)
                .appendTo(a)
        }

        let li = $("<li />")
            .attr('class', "photo_item")
            .append(a)
            .on("click", (ev) => {
                a.trigger('click');
            })

        return li
    }

    // can this get deleted?
    append_photo_deleteme(photo : Photo, title : string,
                 details : Array<JQuery>, description : string, a : JQuery) {
        let li = this.create_li(photo, title, details, description, a)
            .appendTo(this.ul)
        return li
    }
}
