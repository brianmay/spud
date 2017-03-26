/// <reference path="signals.ts" />)
/// <reference path="globals.ts" />
/// <reference path="base.ts" />
/// <reference path="urls.ts" />
/// <reference path="dialog.ts" />
/// <reference path="widgets.ts" />
/// <reference path="session.ts" />
/// <reference path="state.ts" />
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
"use strict"



///////////////////////////////////////
// object_loader
///////////////////////////////////////
class ObjectLoader<U extends SpudObject, ObjectCriteria extends Criteria> {
    private obj_type : ObjectType<U, ObjectCriteria>
    private obj_id : number
    private obj : U
    private loading : boolean
    private finished : boolean
    loaded_item : Signal<U>
    on_error : Signal<string>
    private page : number
    private xhr : JQueryXHR

    constructor(obj_type : ObjectType<U, ObjectCriteria>, obj_id : number | U) {
        this.obj_type = obj_type
        this.loaded_item = new Signal<U>()
        this.on_error = new Signal<string>()

        if (typeof obj_id == "number") {
            this.obj_id = obj_id
            this.obj = null
            this.loading = false
            this.finished = false
        } else {
            this.obj = obj_id
            this.obj_id = obj_id.id
            this.loading = false
            this.finished = true
            this.loaded_item.disable(this.obj)
            this.on_error.disable(null)
        }
    }

    load() : void {
        let type = this.obj_type.get_type()

        if (this.loading) {
            return
        }
        if (this.finished) {
            return
        }

        //var criteria = this.criteria
        var page = this.page
        //var params = $.extend({}, criteria, { 'page': page })
        let params : PostStreamable = { 'page': page }

        console.log("loading object", type, this.obj_id)
        this.loading = true
        this.obj = null

        this.xhr = ajax({
                url: window.__api_prefix + "api/" + type + "/" + this.obj_id + "/",
                data: params,
            },
            (data : PostStreamable) => {
                console.log("got object", type, this.obj_id)
                this.loading = false
                this.finished = true

                this.obj = this.obj_type.object_from_streamable(data)
                this.got_item(this.obj)

                this.on_error.disable(null)
            },
            (message : string, data : any) => {
                console.log("error loading", type, this.obj_id, message)
                this.loading = false
                this.finished = true
                this.obj = null

                this.loaded_item.disable(null)

                this.on_error.trigger(message)
                this.on_error.disable(message)
            }
        )
    }

    abort() : void {
        if (this.loading) {
            this.xhr.abort()
            this.loading = false
            this.finished = true
            this.obj = null
            this.loaded_item.disable(null)
            this.on_error.disable("aborted")
        }
    }

    got_item(obj : U) : void {
        this.loaded_item.trigger(obj)
        this.loaded_item.disable(obj)
    }

    check_for_listeners() : void {
        if (this.loaded_item.is_any_listeners()) {
            return
        }
        this.abort()
    }

    get_obj() : U {
        if (this.finished) {
            return this.obj
        } else {
            return null
        }
    }

    get_obj_id() : number {
        if (this.obj != null) {
            return this.obj.id
        } else {
            return null
        }
    }

    get_obj_type() : string {
        return this.obj_type.get_type()
    }
}

///////////////////////////////////////
// object_list_loader
///////////////////////////////////////
interface ObjectListNotification<U extends SpudObject> {
    list : Array<U>
    count : number
}

class IdMap {
    next : number
    prev : number
}

class ObjectListLoader<U extends SpudObject, ObjectCriteria extends Criteria> {
    private obj_type : ObjectType<U, ObjectCriteria>
    private obj_array : Array<U>
    private criteria : ObjectCriteria
    private page : number
    private n : number
    private loading : boolean
    private finished : boolean
    // loaded_item : Signal<ObjectNotification<U>>
    loaded_list : Signal<ObjectListNotification<U>>
    on_error : Signal<string>
    private xhr : JQueryXHR
    private last_id : number
    private idmap : NumberArray<IdMap>

    constructor(obj_type : ObjectType<U, ObjectCriteria>, criteria : ObjectCriteria) {
        this.obj_type = obj_type
        this.obj_array = []
        this.criteria = criteria
        this.page = 1
        this.n = 0
        this.loading = false
        this.finished = false
        // this.loaded_item = new Signal<ObjectNotification<U>>()
        // this.loaded_item.on_no_listeners = () => { this.check_for_listeners() }
        this.loaded_list = new Signal<ObjectListNotification<U>>()
        this.loaded_list.on_no_listeners = () => { this.check_for_listeners() }
        this.on_error = new Signal<string>()
        this.last_id = null
        this.idmap = {}
    }

    load_next_page() : boolean {
        let type = this.obj_type.get_type()

        if (this.loading) {
            return true
        }
        if (this.finished) {
            return false
        }

        let criteria = this.criteria
        let page = this.page
        let params = $.extend({}, criteria.get_streamable(), { 'page': page })

        console.log("loading list", type, criteria, page)
        this.loading = true
        this.obj_array = []

        this.xhr = ajax({
                url: window.__api_prefix + "api/" + type + "/",
                data: params,
            },
            (data : PostStreamable) => {
                console.log("got list", type, criteria, page)
                this.loading = false
                this.page = page + 1
                if (!data['next']) {
                    console.log("finished list", type, criteria, page)
                    this.finished = true
                }

                let page_list : Array<U> = []
                let list : Array<PostStreamableType> = get_streamable_array(data, 'results')
                for (let i=0; i<list.length; i++) {
                    let streamable : PostStreamable = streamable_to_object(list[i])
                    let obj : U = this.obj_type.object_from_streamable(streamable)

                    page_list.push(obj)
                    this.obj_array.push(obj)
                }

                let count : number = get_streamable_number(data, 'count')
                this.got_list(page_list, count, this.finished)
            },
            (message : string, data : any) => {
                this.loading = false
                this.finished = true
                console.log("error loading", this.obj_type.get_type(), criteria, message)

                this.loaded_list.disable(null)

                this.on_error.trigger(message)
                this.on_error.disable(message)
            }
        );

        return true
    }

    abort() : void {
        if (this.loading) {
            this.xhr.abort()
        }
    }

    private got_list(object_list : Array<U>, count : number, last_page : boolean) {
        for (let i=0; i<object_list.length; i++) {
            let obj : U = object_list[i]
            this.got_item(obj, count, this.n)
            this.n = this.n + 1
        }

        // we trigger the object_list *after* all objects have been processed.
        let page_notification : ObjectListNotification<U> = {
            list: object_list,
            count: count,
        }
        this.loaded_list.trigger(page_notification)

        // immediate dispatch for all objects
        let all_notification : ObjectListNotification<U> = {
            list: this.obj_array,
            count: count,
        }

        if (last_page) {
            this.loaded_list.disable(all_notification)
            this.on_error.disable(null)
        } else {
            this.loaded_list.set_immediate_dispatch(all_notification)
        }
    }

    protected got_item(obj : U, count : number, n : number) : void {
        let id = obj.id
        if (id != null) {
            this.idmap[id] = Object()
            if (this.last_id) {
                this.idmap[this.last_id].next = id
                this.idmap[id].prev = this.last_id
            }
            this.last_id = id
        }
    }

    get_meta(obj_id : number) : IdMap {
        var meta = this.idmap[obj_id]
        if (!meta) {
            return null
        }
        if (!meta.next) {
            this.load_next_page()
        }
        return meta
    }

    check_for_listeners() : void {
        if (this.loaded_list.is_any_listeners()) {
            return
        }
        // if (this.loaded_item.is_any_listeners()) {
        //     return
        // }
        this.abort()
    }
}


abstract class ObjectType<U extends SpudObject, ObjectCriteria extends Criteria> {
    private type : string
    private type_name : string

    constructor(type : string, type_name : string) {
        this.type = type
        this.type_name = type_name
    }

    get_type() : string { return this.type }
    get_type_name() : string { return this.type_name }

    get_loader_for_object(obj : U) : ObjectLoader<U, ObjectCriteria> {
        let loader = new ObjectLoader(this, obj)
        return loader
    }

    load(id : number) : ObjectLoader<U, ObjectCriteria> {
        let loader = new ObjectLoader(this, id)
        loader.load()
        return loader
    }

    load_list(criteria : ObjectCriteria) : ObjectListLoader<U, ObjectCriteria> {
        let loader = new ObjectListLoader(this, criteria)
        loader.load_next_page()
        return loader
    }

    abstract object_from_streamable(streamable : PostStreamable) : U
    abstract criteria_from_streamable(streamable : PostStreamable, on_load : (criteria : ObjectCriteria) => void) : void

    abstract create_dialog(parent : U) : ObjectChangeDialog<U>
    abstract change_dialog(obj : U) : ObjectChangeDialog<U>
    abstract delete_dialog(obj : U) : ObjectDeleteDialog<U>
    abstract search_dialog(criteria : ObjectCriteria, on_success : on_success_function<ObjectCriteria>) : ObjectSearchDialog<ObjectCriteria>

    abstract criteria_widget(criteria : ObjectCriteria) : ObjectCriteriaWidget<U, ObjectCriteria>
    abstract list_widget(child_id : string, criteria : ObjectCriteria, disabled : boolean) : ObjectListWidget<U, ObjectCriteria>
    abstract detail_infobox() : Infobox

    abstract detail_viewport(object_loader : ObjectLoader<U, ObjectCriteria>, state : GetStreamable) : ObjectDetailViewport<U, ObjectCriteria>
    abstract list_viewport(criteria : ObjectCriteria, state : GetStreamable) : ObjectListViewport<U, ObjectCriteria>
}

///////////////////////////////////////
// generic widgets
///////////////////////////////////////
type on_success_function<ObjectCriteria> = (criteria : ObjectCriteria) => boolean;

class ObjectSearchDialogOptions<ObjectCriteria extends Criteria> extends FormDialogOptions {
    on_success : on_success_function<ObjectCriteria>
}

abstract class ObjectSearchDialog<ObjectCriteria extends Criteria> extends FormDialog {
    protected options : ObjectSearchDialogOptions<ObjectCriteria>

    constructor(options : ObjectSearchDialogOptions<ObjectCriteria>) {
        super(options)
    }

    protected abstract new_criteria() : ObjectCriteria;

    protected submit_values(values : DialogValues) : void {
        let criteria : ObjectCriteria = this.new_criteria()
        for (let key in values) {
            let value = values[key]
            if (value != null && value !== false) {
                criteria[key] = value
            }
        }
        if (this.options.on_success(criteria)) {
            this.remove()
        }
    }
}

class ObjectChangeDialogOptions extends FormDialogOptions {
}

class ObjectChangeDialog<U extends SpudObject> extends FormDialog {
    protected options : ObjectChangeDialogOptions
    protected type_name : string
    protected obj : SpudObject

    constructor(options : ObjectChangeDialogOptions) {
        super(options)
    }

    set(obj : U) : void {
        this.obj = obj
        if (obj.id != null) {
            this.set_title("Change " + this.type_name)
            this.set_description("Please change " + this.type_name + " " + obj.title + ".")
        } else {
            this.set_title("Add new album")
            this.set_description("Please add new album.")
        }
        super.set(obj)
    }

    protected submit_values(values : DialogValues) {
        for (let key in values) {
            this.obj[key] = values[key]
        }
        let updates : Streamable = this.obj.get_streamable()
        if (this.obj.id != null) {
            this.save('PATCH', this.obj.id, updates)
        } else {
            this.save('POST', null, updates)
        }
    }
}

class ObjectDeleteDialogOptions extends FormDialogOptions {
}

class ObjectDeleteDialog<U extends SpudObject> extends FormDialog {
    protected options : ObjectDeleteDialogOptions
    protected type_name : string
    protected obj_id : number

    constructor(options : ObjectDeleteDialogOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.title = "Delete " + this.type_name
        this.options.button = "Delete"
        super.show(element)
    }

    set(obj : U) : void {
        this.obj_id = obj.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            obj.title + "? Go ahead join the dark side. There are cookies.")
    }

    protected submit_values(values : {}) : void {
        this.save('DELETE', this.obj_id, {})
    }
}


type on_load_function<ObjectCriteria> = (criteria : ObjectCriteria, title : string) => void

class ObjectCriteriaWidgetOptions<ObjectCriteria extends Criteria> extends WidgetOptions {
    obj : ObjectCriteria
}

abstract class CriteriaItem {
    constructor(readonly key: string, readonly title: string) {}
    abstract render() : JQuery;
    abstract get_idinputfield() : IdInputField;
}

class CriteriaItemString extends CriteriaItem {
    constructor(readonly key: string, readonly title: string, readonly value: string) { super(key, title); }

    render() : JQuery {
        if (this.value == null) {
            return null
        }
        return $('<li>').text(`${this.title} == ${this.value}`)
    }

    get_idinputfield() : IdInputField {
        return [this.key, new TextInputField(this.title, false)]
    }
}

class CriteriaItemBoolean extends CriteriaItem {
    constructor(readonly key: string, readonly title: string, readonly value: boolean) { super(key, title); }

    render() : JQuery {
        if (this.value == null) {
            return null
        }
        return $('<li>').text(`${this.title} == ${this.value}`)
    }

    get_idinputfield() : IdInputField {
        return [this.key, new booleanInputField(this.title, false)]
    }
}

class CriteriaItemNumber extends CriteriaItem {
    constructor(readonly key: string, readonly title: string, readonly value: number) { super(key, title); }

    render() : JQuery {
        if (this.value == null) {
            return null
        }
        return $('<li>').text(`${this.title} == ${this.value}`)
    }

    get_idinputfield() : IdInputField {
        return [this.key, new IntegerInputField(this.title, false)]
    }
}

class CriteriaItemDateTimeZone extends CriteriaItem {
    constructor(readonly key: string, readonly title: string, readonly value: DateTimeZone) { super(key, title); }

    render() : JQuery {
        if (this.value == null) {
            return null
        }
        let datetime : moment.Moment = moment(this.value[0])
        let utc_offset = this.value[1]
        datetime.local()

        let datetime_str : string
        datetime_str = datetime.format("dddd, MMMM Do YYYY, h:mm:ss a")

        return $('<li>').text(`${this.title} == ${datetime_str}`)
    }

    get_idinputfield() : IdInputField {
        return [this.key, new IntegerInputField(this.title, false)]
    }
}


class CriteriaItemObject<U extends SpudObject, ObjectCriteria extends Criteria> extends CriteriaItem {
    constructor(readonly key: string, readonly title: string, readonly value: U, readonly obj_type: ObjectType<U, ObjectCriteria>) { super(key, title); }

    render() : JQuery {
        if (this.value == null) {
            return null
        }
        return $('<li>').text(`${this.title} == ${this.value.title}`)
    }

    get_idinputfield() : IdInputField {
        return [this.key, new AjaxSelectField(this.title, this.obj_type, false)]
    }
}

class CriteriaItemSelect extends CriteriaItem {
    constructor(readonly key: string, readonly title: string, readonly value: string, readonly options : Array<OptionKeyValue>) { super(key, title); }

    render() : JQuery {
        if (this.value == null) {
            return null
        }
        return $('<li>').text(`${this.title} == ${this.value}`)
    }

    get_idinputfield() : IdInputField {
        return [this.key, new SelectInputField(this.title, this.options, false)]
    }
}


abstract class ObjectCriteriaWidget<U extends SpudObject, ObjectCriteria extends Criteria> extends Widget {
    protected options : ObjectCriteriaWidgetOptions<ObjectCriteria>
    // protected obj_type : ObjectType<U, ObjectCriteria> 
    private loaders : Array<ObjectLoader<U, ObjectCriteria>>
    protected criteria : JQuery

    constructor(options : ObjectCriteriaWidgetOptions<ObjectCriteria>) {
        super(options)
        // this.obj_type = obj_type
    }

    show(element : JQuery) : void {
        super.show(element)
        this.element.data('object_criteria', this)

        this.loaders = []

        this.criteria = $("<ul/>")
            .addClass("criteria")
            .appendTo(this.element)

        if (this.options.obj) {
            this.set(this.options.obj)
        }
    }

    set(criteria : ObjectCriteria) {
        this.options.obj = criteria

        this.element.removeClass("error")

        let ul = this.criteria
        ul.empty()

        let items : Array<CriteriaItem> = criteria.get_items()

        for (let i=0; i<items.length; i++) {
            let item = items[i].render()
            if (item != null) {
                item.appendTo(ul)
            }
        }
    }

    set_error() : void {
        this.element.addClass("error")
    }

    cancel_loaders() : void {
        remove_all_listeners(this)
    }
}


class ObjectListWidgetOptions<ObjectCriteria extends Criteria> extends ImageListWidgetOptions {
    criteria? : ObjectCriteria
    child_id? : string
}


abstract class ObjectListWidget<U extends SpudObject, ObjectCriteria extends Criteria> extends ImageListWidget {
    protected options : ObjectListWidgetOptions<ObjectCriteria>
    protected obj_type : ObjectType<U, ObjectCriteria>
    private page : number
    protected loader : ObjectListLoader<U, ObjectCriteria>

    constructor(options : ObjectListWidgetOptions<ObjectCriteria>, obj_type : ObjectType<U, ObjectCriteria>) {
        super(options)
        this.obj_type = obj_type
    }

    show(element : JQuery) : void {
        super.show(element)

        this.element.data('object_list', this)

        this.page = 1

        if (this.options.disabled) {
            this.element.addClass("disabled")
        }

        if (this.options.criteria != null) {
            this.filter(this.options.criteria)
        }

        this.element.scroll(() => {
            this.load_if_required()
        })

        window._reload_all.add_listener(this, () => {
            this.empty()
            this.filter(this.options.criteria)
        })
    }

    protected get_item(obj_id : number) : JQuery {
        return this.ul.find("[data-id=" + obj_id + "]")
    }

    private add_item(obj : U) : void {
        var li : JQuery = this.create_li_for_obj(obj)
        li.appendTo(this.ul)
    }

    private add_list(notification : ObjectListNotification<U>) : void {
        for (let i=0; i<notification.list.length; i++) {
            let obj : U = notification.list[i]
            this.add_item(obj)
        }

        this.element.toggleClass("hidden", notification.count === 0)
        this.load_if_required()
    }

    protected load_if_required() : void {
        // if element is not displayed, we can't tell the scroll position,
        // so we must wait for element to be displayed before we can continue
        // loading
        if (!this.options.disabled && this.loader) {
            if (this.element.prop('scrollHeight') <
                    this.element.scrollTop() + this.element.height() + 200) {
                this.loader.load_next_page()
            }
        }
    }

    filter(criteria : ObjectCriteria) : void {
        this.options.criteria = criteria

        if (this.element == null) {
            return
        }

        this.empty()

        let old_loader = this.loader
        if (old_loader != null) {
            old_loader.loaded_list.remove_listener(this)
            old_loader.on_error.remove_listener(this)
        }

        this.loader = new ObjectListLoader(this.obj_type, criteria)
        this.loader.loaded_list.add_listener(this, this.add_list)
        this.loader.on_error.add_listener(this, (message: string) => {
            console.log(message)
            this.element.addClass("error")
        })
        this.loader.load_next_page()
    }

    empty() : void {
        this.page = 1
        super.empty()
        this.element.removeClass("error")
        if (this.loader) {
            this.loader.loaded_list.remove_listener(this)
            this.loader.on_error.remove_listener(this)
            this.loader = null
        }
    }

    enable() : void {
        this.element.removeClass("disabled")
        this.load_if_required()
        super.enable()
    }

    disable() : void {
        this.element.addClass("disabled")
        super.disable()
    }

    protected get_child_viewport() : ObjectDetailViewport<U, ObjectCriteria> {
        var child_id : string = this.options.child_id
        if (child_id != null) {
            var child : JQuery = $(document.getElementById(child_id))
            if (child.length > 0) {
                let viewport : ObjectDetailViewport<U, ObjectCriteria> = child.data('widget')
                return viewport
            }
        }
        return null
    }

    protected abstract create_child_viewport() : ObjectDetailViewport<U, ObjectCriteria>

    protected get_or_create_child_viewport() : ObjectDetailViewport<U, ObjectCriteria> {
        let viewport : ObjectDetailViewport<U, ObjectCriteria> = this.get_child_viewport()
        if (viewport != null) {
            return viewport
        }
        viewport = this.create_child_viewport()
        return viewport
    }

    protected obj_a(obj : U) {
        let mythis = this
        let album_list_loader = this.loader

        let title = obj.title
        let a = $('<a/>')
            .attr('href', root_url() + this.obj_type.get_type() + "/" + obj.id + "/")
            .on('click', () => {
                if (mythis.options.disabled) {
                    return false
                }

                let viewport : ObjectDetailViewport<U, ObjectCriteria> = this.get_or_create_child_viewport()
                viewport.set_list_loader(album_list_loader)
                // We cannot use set(obj) here as required attributes may be
                // missing from list view for detail view
                viewport.load(obj.id)
                return false

            })
            .data('photo', obj.cover_photo)
            .text(title)
        return a
    }

    protected get_photo(obj : U) : Photo {
        return obj.cover_photo
    }

    protected get_details(obj : U) : Array<JQuery> {
        var details : Array<JQuery> = []
        return details
    }

    protected get_description(obj : U) : string {
        return null
    }

    protected create_li_for_obj(obj : U) : JQuery {
        var photo : Photo = this.get_photo(obj)
        var details : Array<JQuery> = this.get_details(obj)
        var description : string = this.get_description(obj)
        var a = this.obj_a(obj)
        var li = this.create_li(photo, obj.title, details, description, a)
        li.attr('data-id', obj.id)
        return li
    }
}


///////////////////////////////////////
// generic viewports
///////////////////////////////////////
class ObjectListViewportOptions<ObjectCriteria extends Criteria> extends ViewportOptions {
    criteria : ObjectCriteria
    // object_list_options : ObjectListWidgetOptions
}

abstract class ObjectListViewport<U extends SpudObject, ObjectCriteria extends Criteria> extends Viewport {
    protected options : ObjectListViewportOptions<ObjectCriteria>
    protected obj_type : ObjectType<U, ObjectCriteria>
    // protected type : string
    // protected type_name : string
    private create_item : JQuery
    private criteria : JQuery
    protected oc : ObjectCriteriaWidget<U, ObjectCriteria>
    protected ol : ObjectListWidget<U, ObjectCriteria>

    constructor(options : ObjectListViewportOptions<ObjectCriteria>, obj_type : ObjectType<U, ObjectCriteria>) {
        super(options)
        this.obj_type = obj_type
    }

    protected setup_menu(menu : JQuery) : void {
        menu.append(
            $("<li/>")
                .text("Filter")
                .on("click", (ev) => {
                    let on_success : on_success_function<ObjectCriteria> =
                        (criteria : ObjectCriteria) => {
                            this.filter(criteria)
                            push_state()
                            return true
                        }
                    let dialog : ObjectSearchDialog<ObjectCriteria> =
                        this.obj_type.search_dialog(this.options.criteria, on_success)

                    let div = $("<div/>")
                    dialog.show(div)
                })
        )

        this.create_item = $("<li/>")
            .text("Create")
            .on("click", (ev) => {
                void ev
                let dialog : ObjectChangeDialog<U>
                    = this.obj_type.create_dialog(null)

                let div = $("<div/>")
                dialog.show(div)
            })
            .appendTo(menu)
    }

    show(element : JQuery) : void {
        this.options.title = this.obj_type.get_type_name() + " list"
        super.show(element)

        // create menu
        var menu = $("<ul/>")
            .addClass("menubar")

        this.setup_menu(menu)

        menu.menu()
            .appendTo(this.div)

        // create ObjectCriteriaWidget
        this.oc = this.obj_type.criteria_widget(this.options.criteria)
        this.set_title(this.obj_type.get_type_name() + " list: " + this.options.criteria.get_title())

        this.criteria = $("<div/>").appendTo(this.div)
        this.oc.show(this.criteria)

        // create ObjectListWidget
        this.ol = this.obj_type.list_widget(
            this.options.id + ".child",
            this.options.criteria,
            this.options.disabled,
        )

        $("<div/>")
            .set_widget(this.ol)
            .appendTo(this.div)

        // setup permissions
        this.setup_perms(window._perms)
        window._perms_changed.add_listener(this, (perms : Perms) => {
            this.setup_perms(perms)
            this.filter(this.options.criteria)
        })
    }

    private setup_perms(perms : Perms) : void {
        let can_create = false
        let type : string = this.obj_type.get_type()

        if (perms[type] != null) {
            var perms_for_type = perms[type]
            can_create = perms_for_type.can_create
        }

        this.create_item.toggle(can_create)
    }

    filter(value : ObjectCriteria) : void {
        this.options.criteria = value

        if (this.element == null) {
            return
        }

        this.oc.set(value)
        this.set_title(this.obj_type.get_type_name() + " list: " + this.options.criteria.get_title())
        this.ol.filter(value)
    }

    _enable() : void {
        super._enable()
        if (this.ol != null) {
            this.ol.enable()
        }
    }

    _disable() : void {
        super._disable()
        if (this.ol != null) {
            this.ol.disable()
        }
    }

    get_url() : string {
        let params = $.param(this.get_streamable_state())
        let type : string = this.obj_type.get_type()
        if (params != "") {
            return root_url() + type + "/?" + params
        } else {
            return root_url() + type + "/"
        }
    }

    get_streamable_state() : GetStreamable {
        let streamable : GetStreamable = super.get_streamable_state()
        if (this.options.criteria != null) {
            $.extend(streamable, this.options.criteria.get_streamable())
        }
        return streamable
    }

    set_streamable_state(streamable : GetStreamable) : void {
        // load streamable state, must be called before show() is called.
        super.set_streamable_state(streamable)
        this.obj_type.criteria_from_streamable(streamable, (criteria : ObjectCriteria) : void => {
            this.filter(criteria)
        })
    }
}

class ObjectDetailViewportOptions<U extends SpudObject, ObjectCriteria extends Criteria> extends ViewportOptions {
    object_loader : ObjectLoader<U, ObjectCriteria>
    object_list_loader : ObjectListLoader<U, ObjectCriteria>
}

abstract class ObjectDetailViewport<U extends SpudObject, ObjectCriteria extends Criteria> extends Viewport {
    protected options : ObjectDetailViewportOptions<U, ObjectCriteria>
    protected obj_type : ObjectType<U, ObjectCriteria>
    // protected type : string
    // protected type_name : string
    protected display_photo_list_link : boolean
    private create_item : JQuery
    private change_item : JQuery
    private delete_item : JQuery
    private prev_button : JQuery
    private next_button : JQuery
    private od : Infobox
    protected ol : ObjectListWidget<U, ObjectCriteria>

    constructor(options : ObjectDetailViewportOptions<U, ObjectCriteria>, obj_type : ObjectType<U, ObjectCriteria>) {
        super(options)
        this.obj_type = obj_type
        this.display_photo_list_link = true
    }

    protected get_obj() : U {
        if (this.options.object_loader != null) {
            return this.options.object_loader.get_obj()
        } else {
            return null
        }
    }

    protected get_obj_id() : number {
        if (this.options.object_loader != null) {
            return this.options.object_loader.get_obj_id()
        } else {
            return null
        }
    }

    protected abstract get_photo_criteria() : PhotoCriteria
    protected abstract get_children_criteria() : ObjectCriteria;

    protected setup_menu(menu : JQuery) : void {
        menu.append(
            $("<li/>")
                .text("Children")
                .on("click", (ev) => {
                    let children_criteria : ObjectCriteria = this.get_children_criteria()
                    let viewport : ObjectListViewport<U, ObjectCriteria> =
                        this.obj_type.list_viewport(children_criteria, null)
                    add_viewport(viewport)
                })
        )

        if (this.display_photo_list_link) {
            menu.append(
                $("<li/>")
                    .text("Photos")
                    .on("click", (ev) => {
                        let children_criteria : PhotoCriteria = this.get_photo_criteria()
                        let options : PhotoListViewportOptions = {
                            criteria: children_criteria,
                        }
                        let viewport : PhotoListViewport = new PhotoListViewport(options)
                        add_viewport(viewport)
                    })
            )
        }

        this.create_item = $("<li/>")
            .text("Create")
            .on("click", (ev) => {
                void ev
                let obj : U = this.get_obj()
                if (obj != null) {
                    let dialog : ObjectChangeDialog<U> =
                        this.obj_type.create_dialog(obj)

                    let div = $("<div/>")
                    dialog.show(div)
                }
            })
            .appendTo(menu)

        this.change_item = $("<li/>")
            .text("Change")
            .on("click", (ev) => {
                let obj : U = this.get_obj()
                if (obj != null) {
                    let dialog : ObjectChangeDialog<U> =
                        this.obj_type.change_dialog(obj)

                    let div = $("<div/>")
                    dialog.show(div)
                }
            })
            .appendTo(menu)

        this.delete_item = $("<li/>")
            .text("Delete")
            .on("click", (ev) => {
                let obj : U = this.get_obj()
                if (obj != null) {
                    let dialog : ObjectDeleteDialog<U> =
                        this.obj_type.delete_dialog(obj)

                    var div = $("<div/>")
                    dialog.show(div)
                }
            })
            .appendTo(menu)
    }

    show(element : JQuery) : void {
        let type_name : string = this.obj_type.get_type_name()

        this.options.title = type_name + " Detail"

        super.show(element)

        var menu = $("<ul/>")
            .addClass("menubar")

        this.setup_menu(menu)

        menu
            .menu()
            .appendTo(this.div)

        var button_div = $("<div/>").appendTo(this.div)

        this.prev_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '<<')
            .click(() => {
                let oll = this.options.object_list_loader
                let meta = oll.get_meta(this.get_obj_id())
                let obj_id = meta.prev
                if (obj_id) {
                    this.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(button_div)

        this.next_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '>>')
            .click(() => {
                var oll = this.options.object_list_loader
                var meta = oll.get_meta(this.get_obj_id())
                var obj_id = meta.next
                if (obj_id) {
                    this.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(button_div)

        this.setup_buttons()

        this.od = this.obj_type.detail_infobox()
        $("<div/>")
            .set_widget(this.od)
            .appendTo(this.div)

        this.ol = this.obj_type.list_widget(
            this.options.id + ".child",
            null,
            this.options.disabled,
        )
        $("<div/>")
            .set_widget(this.ol)
            .appendTo(this.div)

        if (this.options.object_loader != null) {
            this.set(this.options.object_loader)
        }

        this.setup_perms(window._perms)
        window._perms_changed.add_listener(this, (perms : Perms) => {
            this.setup_perms(perms)
            this.load(this.get_obj_id())
        })

        window._reload_all.add_listener(this, () => {
            this.load(this.get_obj_id())
        })

        if (this.options.object_loader != null) {
            this.set(this.options.object_loader)
        }
    }

    private setup_perms(perms : Perms) : void {
        let can_create : boolean = false
        let can_change : boolean = false
        let can_delete : boolean = false
        let type : string = this.obj_type.get_type()

        if (perms[type] != null) {
            var perms_for_type = perms[type]
            can_create = perms_for_type.can_create
            can_change = perms_for_type.can_change
            can_delete = perms_for_type.can_delete
        }

        this.create_item.toggle(can_create)
        this.change_item.toggle(can_change)
        this.delete_item.toggle(can_delete)

    }

    protected setup_buttons() : void {
        if (this.options.object_list_loader) {
            var oll = this.options.object_list_loader
            var meta = null
            let obj_id : number = this.get_obj_id()
            if (obj_id) {
                meta = oll.get_meta(obj_id)
            }

            this.prev_button.show()
            this.next_button.show()

            if (meta != null && meta.prev) {
                this.prev_button.button("enable")
            } else {
                this.prev_button.button("disable")
            }
            if (meta && meta.next) {
                this.next_button.button("enable")
            } else {
                this.next_button.button("disable")
            }
        } else {
            this.prev_button.hide()
            this.next_button.hide()
        }
    }

    set(loader : ObjectLoader<U, ObjectCriteria>) : void {
        let old_loader = this.options.object_loader
        if (old_loader != null) {
            old_loader.loaded_item.remove_listener(this)
            old_loader.on_error.remove_listener(this)
        }
        this.loaded(null)
        this.options.object_loader = loader

        if (loader != null) {
            loader.loaded_item.add_listener(this, (obj : U) => {
                this.loaded(obj)
            })
            loader.on_error.add_listener(this, (message : string) => {
                this.loaded_error(message)
            })
        }
    }

    set_list_loader(object_list_loader : ObjectListLoader<U, ObjectCriteria>) : void {
        if (this.options.object_list_loader != null) {
            this.options.object_list_loader.loaded_list.remove_listener(this)
        }

        if (object_list_loader != null) {
            object_list_loader.loaded_list.add_listener(this, (notification : ObjectListNotification<U>) => {
                this.setup_buttons()
            })
        }
    }

    load(obj_id : number) : void {
        this.set(this.obj_type.load(obj_id))
    }

    reload() : void {
        this.load(this.get_obj_id())
    }

    protected loaded(obj : U) : void {
        let type : string = this.obj_type.get_type()

        if (this.element == null) {
            return
        }

        if (obj == null) {
            this.set_title(type + ": loading")
            this.od.set(null)
        } else {
            this.set_title(type + ": " + obj.title)
            this.od.set(obj)
        }

        this.ol.filter(this.get_children_criteria())
        this.element.removeClass("error")
        this.setup_buttons()
    }

    protected loaded_error(message : string) : void {
        console.log(message)
        this.element.addClass("error")
    }

    protected _enable() : void {
        super._enable()
        if (this.ol) {
            this.ol.enable()
        }
    }

    protected _disable() : void {
        super._disable()
        if (this.ol) {
            this.ol.disable()
        }
    }

    get_url() : string {
        let state = this.get_streamable_state()
        delete state['obj_id']
        let params = $.param(state)

        let type : string = this.obj_type.get_type()
        if (params != "") {
            return root_url() + type + "/" + this.get_obj_id() + "/?" + params
        } else {
            return root_url() + type + "/" + this.get_obj_id() + "/"
        }
    }

    get_streamable_state() : GetStreamable {
        let streamable : GetStreamable = super.get_streamable_state()
        streamable['obj_id'] = this.get_obj_id()
        return streamable
    }

    set_streamable_state(streamable : GetStreamable) : void {
        // load streamable state, must be called before show() is called.
        super.set_streamable_state(streamable)
        if (streamable['obj_id'] != null) {
            let obj_id : number = get_streamable_number(streamable,'obj_id')
            this.load(obj_id)
        }
    }
}
