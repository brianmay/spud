/// <reference path="photo.ts" />

interface Criteria {
}

class Streamable {
}

class GenericStreamable {
    [ index : string ] : string|boolean|number|Streamable
}

class StreamableList {
    results: Array<ObjectStreamable>
    count : number
}

class ObjectStreamable extends Streamable {
    id : number
    title : string
    cover_photo : PhotoStreamable
    cover_photo_pk : number
}

class SpudObject {
    static type : string = null
    id : number
    title : string
    cover_photo : Photo

    constructor(streamable : ObjectStreamable) {
        this.id = parse_number(streamable.id)
        this.title = parse_string(streamable.title)
        if (streamable.cover_photo != null) {
            this.cover_photo = new Photo(streamable.cover_photo)
        }
    }

    to_streamable() : ObjectStreamable {
        let streamable : ObjectStreamable = new ObjectStreamable
        streamable['id'] = this.id
        streamable['title'] = this.title
        if (this.cover_photo != null) {
            streamable['cover_photo_pk'] = this.cover_photo.id
        }
        return streamable
    }
}

interface DateTimeZone {
    0 : moment.Moment
    1 : number
}

interface UiWidgetOptions extends JQueryUI.WidgetOptions {
}

interface UiAutoCompleteOptions extends UiWidgetOptions {
}

interface UiAutoCompleteHtmlOptions extends UiAutoCompleteOptions {
}

interface UiAjaxAutoCompleteOptions extends UiAutoCompleteHtmlOptions {
    type : string
}

interface UiAjaxAutoCompleteMultipleOptions extends UiAjaxAutoCompleteOptions {
}

interface UiAjaxAutoCompleteSortedOptions extends UiAjaxAutoCompleteOptions {
}

// this inherits from UiAutoCompleteHtmlOptions not UiAjaxAutoCompleteOptions, as
// type parameter is not used
interface UiPhotoSelectOptions extends UiAutoCompleteHtmlOptions {
}

interface UiMySelectableOptions extends UiWidgetOptions {
    filter : string
    selected(event : Event, ui : { selected?: Element; }) : void
    unselected(event : Event, ui : { unselected?: Element; }) : void
}


declare module JQueryUI {
    interface UI {
        selectable(options : any, div : JQuery) : JQuery
    }
}

interface TypePerms {
    can_change : boolean
    can_delete : boolean
    can_create : boolean
}

interface Perms {
    categorys : TypePerms
    places : TypePerms
    photos : TypePerms
    persons : TypePerms
    albums : TypePerms
    feedbacks : TypePerms
}

interface SPUD {
    widget(options: UiWidgetOptions, div: JQuery): JQuery;

    autocompletehtml(options: UiAutoCompleteHtmlOptions, div: JQuery): JQuery;
    ajaxautocomplete(options: UiAjaxAutoCompleteOptions, div: JQuery): JQuery;
    ajaxautocompletemultiple(options: UiAjaxAutoCompleteMultipleOptions, div: JQuery): JQuery;
    ajaxautocompletesorted(options: UiAjaxAutoCompleteSortedOptions, div: JQuery): JQuery;
    photo_select(options: UiPhotoSelectOptions, div: JQuery): JQuery;
    myselectable(options: UiMySelectableOptions, div: JQuery): JQuery;
}

interface JQueryStatic {
    spud : SPUD
}

interface JQuery {
    ajaxautocomplete(methodName: 'destroy'): void;
    ajaxautocomplete(methodName: 'get'): SpudObject;
    ajaxautocomplete(methodName: string): any;
    ajaxautocomplete(methodName: 'set', obj: SpudObject, obj_pk: number): void;
    ajaxautocomplete(methodName: string, obj: SpudObject, obj_pk: number): void;

    ajaxautocompletemultiple(methodName: 'destroy'): void;
    ajaxautocompletemultiple(methodName: 'get'): Array<SpudObject>;
    ajaxautocompletemultiple(methodName: string): Array<SpudObject>;
    ajaxautocompletemultiple(methodName: 'set', obj: Array<SpudObject>, obj_pk: number): void;
    ajaxautocompletemultiple(methodName: string, obj: Array<SpudObject>, obj_pk: number): void;

    ajaxautocompletesorted(methodName: 'destroy'): void;
    ajaxautocompletesorted(methodName: 'get'): Array<SpudObject>;
    ajaxautocompletesorted(methodName: string): Array<SpudObject>;
    ajaxautocompletesorted(methodName: 'set', obj: Array<SpudObject>, obj_pk: number): void;
    ajaxautocompletesorted(methodName: string, obj: Array<SpudObject>, obj_pk: number): void;

    photo_select(methodName: 'destroy'): void;
    photo_select(methodName: 'get'): Photo;
    photo_select(methodName: string): any;
    photo_select(methodName: 'set', obj: Photo, obj_pk: number): void;
    photo_select(methodName: string, obj: Photo, obj_pk: number): void;

    p(text : string): JQuery;
    set_widget(widget : Widget): JQuery;
}

interface OptionKeyValue {
    0: string
    1: string
}

interface NumberArray<T> {
    [key: number]: T
}

interface StringArray<T> {
    [key: string]: T
}

interface Window {
    __api_prefix : string
    __root_prefix : string
    __static_prefix : string

    do_root(session : Session, params : {}) : void
    do_list(obj_type : string, session : Session, criteria : StringArray<string>) : void
    do_detail(obj_type : string, obj_id : number, session : Session, params : {}) : void

    _dont_push : boolean
    _do_replace : boolean

    _perms : Perms
}
