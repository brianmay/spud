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
class ObjectLoader<T extends Streamable> {
    private type : string
    private obj_id : number
    private loading : boolean
    private finished : boolean
    loaded_item : Signal<T>
    on_error : Signal<void>
    private criteria : Criteria
    private page : number
    private xhr : JQueryXHR

    constructor(type : string, obj_id : number) {
        this.type = type
        this.obj_id = obj_id
        this.loading = false
        this.finished = false
        this.loaded_item = new Signal<T>()
        this.on_error = new Signal<void>()
    }

    load() : void {
        if (this.loading) {
            return
        }
        if (this.finished) {
            return
        }

        var mythis = this
        var criteria = this.criteria
        var page = this.page
        var params = $.extend({}, criteria, { 'page': page })

        console.log("loading object", this.type, this.obj_id)
        this.loading = true

        this.xhr = ajax({
                url: window.__api_prefix + "api/" + this.type + "/" + this.obj_id + "/",
                data: params,
            },
            (data : T) => {
                console.log("got object", mythis.type, mythis.obj_id)
                this.loading = false
                this.finished = true

                mythis.got_item(data)
            },
            (message : string, data : any) => {
                this.loading = false
                console.log("error loading", mythis.type, mythis.obj_id, message)
                this.on_error.trigger(null)
            }
        )
    }

    abort() : void {
        if (this.loading) {
            this.xhr.abort()
        }
    }

    got_item(obj : T) : void {
        this.loaded_item.trigger(obj)
    }

    check_for_listeners() : void {
        if (this.loaded_item.is_any_listeners()) {
            return
        }
        this.abort()
    }
}

function create_object_loader<T extends Streamable>(type, obj_id) : ObjectLoader<T> {
    return new ObjectLoader(type, obj_id)
}

///////////////////////////////////////
// object_list_loader
///////////////////////////////////////
interface ObjectNotification<T extends Streamable> {
    obj : T
    count : number
    i : number
}

interface ObjectListNotification<T extends Streamable> {
    list : Array<T>
    count : number
}

class ObjectListLoader<T extends Streamable> {
    private type : string
    private criteria : Criteria
    private page : number
    private n : number
    private loading : boolean
    private finished : boolean
    loaded_item : Signal<ObjectNotification<T>>
    loaded_list : Signal<ObjectListNotification<T>>
    on_error : Signal<void>
    private xhr : JQueryXHR

    constructor(type : string, criteria : Criteria) {
        this.type = type
        this.criteria = criteria
        this.page = 1
        this.n = 0
        this.loading = false
        this.finished = false
        this.loaded_item = new Signal<ObjectNotification<T>>()
        this.loaded_item.on_no_listeners = () => { this.check_for_listeners() }
        this.loaded_list = new Signal<ObjectListNotification<T>>()
        this.loaded_list.on_no_listeners = () => { this.check_for_listeners() }
        this.on_error = new Signal<void>()
    }

    load_next_page() : boolean {
        if (this.loading) {
            return true
        }
        if (this.finished) {
            return false
        }

        var mythis = this
        var criteria = this.criteria
        var page = this.page
        var params = $.extend({}, criteria, { 'page': page })

        console.log("loading list", this.type, criteria, page)
        this.loading = true

        this.xhr = ajax({
                url: window.__api_prefix + "api/" + this.type + "/",
                data: params,
            },
            (data : T) => {
                console.log("got list", mythis.type, criteria, page)
                this.loading = false
                this.page = page + 1
                if (!data['next']) {
                    console.log("finished list", mythis.type, criteria, page)
                    mythis.finished = true
                }

                this.got_list(data['results'], parse_number(data['count']))
            },
            (message : string, data : any) => {
                this.loading = false
                console.log("error loading", mythis.type, criteria, message)
                this.on_error.trigger(null)
            }
        );

        return true
    }

    abort() : void {
        if (this.loading) {
            this.xhr.abort()
        }
    }

    private got_list(object_list : Array<T>, count : number) {
        for (let obj of object_list) {
            this.got_item(obj, count, this.n)
            this.n = this.n + 1
        }

        // we trigger the object_list *after* all objects have been processed.
        let notification : ObjectListNotification<T> = {
            list: object_list,
            count: count,
        }
        this.loaded_list.trigger(notification)
    }

    protected got_item(obj : T, count : number, i : number) : void {
        let notification : ObjectNotification<T> = {
            obj: obj,
            count: count,
            i: i
        }
        this.loaded_item.trigger(notification)
    }

    check_for_listeners() : void {
        if (this.loaded_list.is_any_listeners()) {
            return
        }
        if (this.loaded_item.is_any_listeners()) {
            return
        }
        this.abort()
    }
}

function create_object_list_loader<T>(type : string, criteria : Criteria) : ObjectListLoader<T> {
    return new ObjectListLoader(type, criteria)
}

///////////////////////////////////////
// tracked_object_list_loader
///////////////////////////////////////
interface IdMap {
    next : number
    prev : number
}

class TrackedObjectListLoader<T extends Streamable> extends ObjectListLoader<T> {
    private _last_id : number
    private _idmap : NumberArray<IdMap>

    constructor(type : string, criteria : Criteria) {
        super(type, criteria)
        this._last_id = null
        this._idmap = {}
    }

    protected got_item(obj : any, count : number, n : number) : void {
        super.got_item(obj, count, n)

        var id = obj.id
        if (id != null) {
            this._idmap[id] = Object()
            if (this._last_id) {
                this._idmap[this._last_id].next = id
                this._idmap[id].prev = this._last_id
            }
            this._last_id = id
        }
    }

    get_meta(obj_id : number) : IdMap {
        var meta = this._idmap[obj_id]
        if (!meta) {
            return null
        }
        if (!meta.next) {
            this.load_next_page()
        }
        return meta
    }
}

function create_tracked_object_list_loader<T extends Streamable>(type : string, criteria : Criteria) : TrackedObjectListLoader<T> {
    return new TrackedObjectListLoader(type, criteria)
}


///////////////////////////////////////
// generic widgets
///////////////////////////////////////
interface ObjectSearchDialogOptions extends FormDialogOptions {
    on_success(criteria : Criteria) : boolean
}

class ObjectSearchDialog extends FormDialog {
    protected options : ObjectSearchDialogOptions

    constructor(options : ObjectSearchDialogOptions) {
        super(options)
    }

    protected submit_values(values : DialogValues) : void {
        var criteria = {}

        $.each(values, (key, el) => {
            if (el != null && el !== false) { criteria[key] = el }
        });

        if (this.options.on_success(criteria)) {
            this.remove()
        }
    }
}

interface ObjectChangeDialogOptions extends FormDialogOptions {
}

class ObjectChangeDialog extends FormDialog {
    protected options : ObjectChangeDialogOptions
    protected type_name : string
    protected obj : SpudObject

    constructor(options : ObjectChangeDialogOptions) {
        super(options)
    }

    set(obj : SpudObject) : void {
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
        let updates : Streamable = this.obj.to_streamable()
        if (this.obj.id != null) {
            this.save("PATCH", this.obj.id, updates)
        } else {
            this.save("POST", null, updates)
        }
    }

}

interface ObjectDeleteDialogOptions extends FormDialogOptions {
}

class ObjectDeleteDialog extends FormDialog {
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

    set(obj : SpudObject) : void {
        this.obj_id = obj.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            obj.title + "? Go ahead join the dark side. There are cookies.")
    }

    protected submit_values(values : {}) : void {
        this.save("DELETE", this.obj_id, {})
    }
}


interface ObjectCriteriaWidgetOptions extends WidgetOptions {
    obj : Criteria
    on_load : (criteria : Criteria, title : string) => void
}

interface LoadAttributes {
    name : string
    type : string
}

abstract class ObjectCriteriaWidget extends Widget {
    protected options : ObjectCriteriaWidgetOptions
    protected type : string
    private loaders : Array<ObjectLoader<ObjectStreamable>>
    protected criteria : JQuery
    protected load_attributes : Array<LoadAttributes>

    constructor(options : ObjectCriteriaWidgetOptions) {
        super(options)
    }

    show(element : JQuery) : void {
        if (this.load_attributes == null) {
            this.load_attributes = [
                { name: 'instance', type: this.type }
            ]
        }

        super.show(element)
        this.element.data('object_criteria', this)

        this.loaders = []

        this.criteria = $("<ul/>")
            .addClass("criteria")
            .appendTo(this.element)

        if (this.options.obj) {
            this.load(this.options.obj)
        }
    }

    protected finalize(criteria : Criteria, title : string) : void {
        if (this.options.on_load != null) {
            this.options.on_load(criteria, title)
        }
    }

    abstract set(criteria : Criteria) : void;

    cancel_loaders() : void {
        var mythis = this

        $.each(this.loaders, (i, loader) => {
            loader.loaded_item.remove_listener(mythis)
            loader.on_error.remove_listener(mythis)
        })
    }

    load(criteria : Criteria) : void {
        var mythis = this
        this.cancel_loaders()
        this.set(criteria)
        var clone = $.extend({}, criteria)
        for (let id in this.load_attributes) {
            var value = this.load_attributes[id]
            if (criteria[value.name] == null) {
                continue
            }
            var loader = create_object_loader(value.type, criteria[value.name])
            loader.loaded_item.add_listener(mythis, (obj : ObjectStreamable) => {
                clone[value.name] = obj.title
                this.set(clone)
            })
            loader.on_error.add_listener(this, () => {
                this.element.addClass("error")
            })
            loader.load()
            this.loaders.push(loader)
        }
    }
}


interface ObjectListWidgetOptions extends ImageListWidgetOptions {
    criteria? : Criteria
    child_id? : string
}


abstract class ObjectListWidget<T extends ObjectStreamable, U extends SpudObject> extends ImageListWidget {
    protected options : ObjectListWidgetOptions
    protected type : string
    private page : number
    protected loader : TrackedObjectListLoader<T>

    constructor(options : ObjectListWidgetOptions) {
        super(options)
    }

    protected abstract to_object(streamable : T) : U

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

    private add_item(notification : ObjectNotification<T>) : void {
        let obj : U = this.to_object(notification.obj)
        var li : JQuery = this.create_li_for_obj(obj)
        li.appendTo(this.ul)
    }

    private add_list(notification : ObjectListNotification<T>) : void {
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

    filter(criteria : Criteria) : void {
        this.empty()

        this.options.criteria = criteria
        this.loader = create_tracked_object_list_loader(this.type, criteria)
        this.loader.loaded_item.add_listener(this, this.add_item)
        this.loader.loaded_list.add_listener(this, this.add_list)
        this.loader.on_error.add_listener(this, () => {
            this.element.addClass("error")
        })
        this.loader.load_next_page()
    }

    empty() : void {
        this.page = 1
        super.empty()
        this.element.removeClass("error")
        if (this.loader) {
            this.loader.loaded_item.remove_listener(this)
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

    protected get_child_viewport() : ObjectDetailViewport<T, U> {
        var child_id : string = this.options.child_id
        if (child_id != null) {
            var child : JQuery = $(document.getElementById(child_id))
            if (child.length > 0) {
                let viewport : ObjectDetailViewport<T, U> = child.data('widget')
                return viewport
            }
        }
        return null
    }

    protected abstract create_child_viewport() : ObjectDetailViewport<T, U>

    protected get_or_create_child_viewport() : ObjectDetailViewport<T, U> {
        let viewport : ObjectDetailViewport<T, U> = this.get_child_viewport()
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
            .attr('href', root_url() + this.type + "/" + obj.id + "/")
            .on('click', () => {
                if (mythis.options.disabled) {
                    return false
                }

                let viewport : ObjectDetailViewport<T, U> = this.get_or_create_child_viewport()
                viewport.set_loader(album_list_loader)
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
interface ObjectListViewportOptions extends ViewportOptions {
    criteria : Criteria
    object_list_options? : ObjectListWidgetOptions
}

abstract class ObjectListViewport<T extends ObjectStreamable, U extends SpudObject> extends Viewport {
    protected options : ObjectListViewportOptions
    protected type : string
    protected type_name : string
    private criteria : JQuery
    protected ol : ObjectListWidget<T, U>

    constructor(options : ObjectListViewportOptions) {
        super(options)
    }

    protected abstract create_object_search_dialog(options : ObjectSearchDialogOptions) : ObjectSearchDialog
    protected abstract create_object_criteria_widget(options : ObjectCriteriaWidgetOptions) : ObjectCriteriaWidget
    protected abstract create_object_list_widget(options : ObjectListWidgetOptions) : ObjectListWidget<T, U>

    protected setup_menu(menu : JQuery) : void {
        var mythis = this

        menu.append(
            $("<li/>")
                .text("Filter")
                .on("click", (ev) => {
                    void ev
                    var params : ObjectSearchDialogOptions = {
                        obj: mythis.options.criteria,
                        on_success: (criteria) => {
                            mythis.filter(criteria)
                            return true
                        }
                    }
                    var div = $("<div/>")
                    var dialog : ObjectSearchDialog = this.create_object_search_dialog(params)
                    dialog.show(div)
                })
        )
    }

    show(element : JQuery) : void {
        var mythis = this

        if (!this.options.criteria) {
            this.options.criteria = {}
        }

        this.options.title = this.type_name + " list"
        super.show(element)

        var menu = $("<ul/>")
            .addClass("menubar")

        this.setup_menu(menu)

        menu.menu()
            .appendTo(this.div)

        let oc_params : ObjectCriteriaWidgetOptions = {
            'obj': this.options.criteria,
            'on_load': (criteria : Criteria, title : string) => {
                mythis.set_title(mythis.type_name + " list: " + title)
            }
        }
        this.criteria = $("<div/>").appendTo(this.div)
        let oc : ObjectCriteriaWidget = this.create_object_criteria_widget(oc_params)
        oc.show(this.criteria)

        var ol_params : ObjectListWidgetOptions = {
            'child_id': this.options.id + ".child",
            'criteria': this.options.criteria,
            'disabled': this.options.disabled,
        }
        if (this.options.object_list_options != null) {
            ol_params = $.extend({}, this.options.object_list_options, ol_params)
        }
        this.ol = this.create_object_list_widget(ol_params)
        $("<div/>")
            .set_widget(this.ol)
            .appendTo(this.div)
    }

    filter(value : Criteria) : void {
        this.options.criteria = value
        push_state()

        var instance = this.criteria.data('object_criteria')
        instance.load(value)

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
        var params = ""
        if (!$.isEmptyObject(this.options.criteria)) {
            params = "?" + $.param(this.options.criteria)
        }
        return root_url() + this.type + "/" + params
    }

    get_streamable_options() : GenericStreamable {
        let streamable : GenericStreamable = super.get_streamable_options()
        streamable['criteria'] = this.options.criteria
        return streamable
    };
}

interface ObjectDetailViewportOptions<T> extends ViewportOptions {
    obj : SpudObject
    obj_id : number
    object_list_loader? : TrackedObjectListLoader<T>
}

abstract class ObjectDetailViewport<T extends ObjectStreamable, U extends SpudObject> extends Viewport {
    protected options : ObjectDetailViewportOptions<T>
    protected type : string
    protected type_name : string
    protected display_photo_list_link : boolean
    private create_item : JQuery
    private change_item : JQuery
    private delete_item : JQuery
    private prev_button : JQuery
    private next_button : JQuery
    private od : Infobox
    private ol : ObjectListWidget<T, U>
    private loader : ObjectLoader<T>

    constructor(options : ObjectDetailViewportOptions<T>) {
        super(options)
        this.display_photo_list_link = true
    }

    protected abstract to_object(streamable : T) : U

    protected abstract get_photo_criteria() : PhotoCriteria
    protected abstract create_object_change_dialog(options : ObjectChangeDialogOptions) : ObjectChangeDialog
    protected abstract create_object_delete_dialog(options : ObjectDeleteDialogOptions) : ObjectDeleteDialog
    protected abstract create_object_list_viewport(options : ObjectListViewportOptions) : ObjectListViewport<T, U>
    protected abstract create_object_list_widget(options : ObjectListWidgetOptions) : ObjectListWidget<T, U>
    protected abstract create_object_detail_infobox(options : InfoboxOptions) : Infobox

    protected setup_menu(menu : JQuery) : void {
        var mythis = this

        menu.append(
            $("<li/>")
                .text("Children")
                .on("click", (ev) => {
                    let options = {
                        criteria: mythis.get_children_criteria(),
                    }
                    let viewport = mythis.create_object_list_viewport(options)
                    add_viewport(viewport)
                })
        )

        if (this.display_photo_list_link) {
            menu.append(
                $("<li/>")
                    .text("Photos")
                    .on("click", (ev) => {
                        let options : PhotoListViewportOptions = {
                            criteria: mythis.get_photo_criteria(),
                        }
                        let viewport = mythis.get_photo_list_viewport(options)
                        add_viewport(viewport)
                    })
            )
        }

        this.create_item = $("<li/>")
            .text("Create")
            .on("click", (ev) => {
                void ev
                if (mythis.options.obj != null) {
                    var obj = {
                        parent: mythis.options.obj.id,
                    }
                    var params = {
                        obj: obj,
                    }
                    var div = $("<div/>")
                    var dialog = this.create_object_change_dialog(params)
                    dialog.show(div)
                }
            })
            .appendTo(menu)

        this.change_item = $("<li/>")
            .text("Change")
            .on("click", (ev) => {
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    var dialog = this.create_object_change_dialog(params)
                    dialog.show(div)
                }
            })
            .appendTo(menu)

        this.delete_item = $("<li/>")
            .text("Delete")
            .on("click", (ev) => {
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    var dialog = this.create_object_delete_dialog(params)
                    dialog.show(div)
                }
            })
            .appendTo(menu)
    }

    show(element : JQuery) : void {
        var mythis = this

        this.options.title = this.type_name + " Detail"

        if (this.options.obj != null) {
            var tmp_obj = this.options.obj
            this.options.obj_id = tmp_obj.id
            this.options.title = this.type_name + ": " + tmp_obj.title
        }

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
                var oll = mythis.options.object_list_loader
                var meta = oll.get_meta(mythis.options.obj_id)
                var obj_id = meta.prev
                if (obj_id) {
                    mythis.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(button_div)

        this.next_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '>>')
            .click(() => {
                var oll = mythis.options.object_list_loader
                var meta = oll.get_meta(mythis.options.obj_id)
                var obj_id = meta.next
                if (obj_id) {
                    mythis.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(button_div)

        this.setup_loader()
        this.setup_buttons()

        this.od = this.create_object_detail_infobox({})
        $("<div/>")
            .set_widget(this.od)
            .appendTo(this.div)

        var params : ObjectListWidgetOptions = {
            'criteria': {},
            'child_id': this.options.id + ".child",
            'disabled': this.options.disabled,
        }
        this.ol = this.create_object_list_widget(params)
        $("<div/>")
            .set_widget(this.ol)
            .appendTo(this.div)

        if (this.options.obj != null) {
            this.set(this.options.obj)
        } else if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }

        this.setup_perms(window._perms)
        window._perms_changed.add_listener(this, this.setup_perms)

        window._reload_all.add_listener(this, () => {
            mythis.load(this.options.obj_id)
        })
    }

    protected get_children_criteria() : Criteria {
        return {
            'instance': this.options.obj_id,
            'mode': 'children',
        }
    }

    private setup_loader() : void {
        var mythis = this
        if (this.options.object_list_loader != null) {
            var oll = this.options.object_list_loader
            oll.loaded_list.add_listener(this, (notification : ObjectListNotification<T>) => {
                mythis.setup_buttons()
            })
        }
    }

    private setup_perms(perms : Perms) : void {
        var can_create = false
        var can_change = false
        var can_delete = false

        if (perms[this.type] != null) {
            var perms_for_type = perms[this.type]
            can_create = perms_for_type.can_create
            can_change = perms_for_type.can_change
            can_delete = perms_for_type.can_delete
        }

        this.create_item.toggle(can_create)
        this.change_item.toggle(can_change)
        this.delete_item.toggle(can_delete)

        if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }
    }

    protected setup_buttons() : void {
        if (this.options.object_list_loader) {
            var oll = this.options.object_list_loader
            var meta = null
            if (this.options.obj_id) {
                meta = oll.get_meta(this.options.obj_id)
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

    set(obj : any) : void {
        this.options.obj = obj
        this.options.obj_id = obj.id
        this.od.set(obj)
        this.loaded(obj)
    }

    load(obj_id : number) : void {
        this.options.obj = null
        this.options.obj_id = obj_id

        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
        }

        this.loader = create_object_loader(this.type, obj_id)
        this.loader.loaded_item.add_listener(this, (obj : T) => {
            this.loader = null
            this.loaded(this.to_object(obj))
        })
        this.loader.on_error.add_listener(this, () => {
            this.element.addClass("error")
            this.loader = null
            this.loaded_error()
        })
        this.loader.load()
    }

    protected loaded(obj : U) : void {
        this.element.removeClass("error")
        this.options.obj = obj
        this.options.obj_id = obj.id
        this.set_title(this.type + ": " + obj.title)
        this.setup_buttons()

        this.od.set(obj)
        this.ol.filter(this.get_children_criteria())
    }

    protected loaded_error() : void {
        this.element.addClass("error")
    }

    set_loader(oll : TrackedObjectListLoader<T>) : void {
        var old_loader = this.options.object_list_loader
        if (old_loader != null) {
            old_loader.loaded_list.remove_listener(this)
        }
        this.options.object_list_loader = oll

        this.setup_loader()
        this.setup_buttons()
    }

    _enable() : void {
        super._enable()
        if (this.ol) {
            this.ol.enable()
        }
    }

    _disable() : void {
        super._disable()
        if (this.ol) {
            this.ol.disable()
        }
    }

    get_url() : string {
        return root_url() + this.type + "/" + this.options.obj_id + "/"
    }

    get_photo_list_viewport(options : PhotoListViewportOptions) : PhotoListViewport {
        return new PhotoListViewport(options)
    }

    get_streamable_options() : GenericStreamable {
        let streamable : GenericStreamable = super.get_streamable_options()
        streamable['obj_id'] = this.options.obj_id
        return streamable
    };
}
