/// <reference path="photo.ts" />

type GetStreamableType = string|boolean|number;
type PostStreamableType = GetStreamableType|PostStreamable|Array<GetStreamableType|PostStreamable>

class Streamable {
}

class GetStreamable extends Streamable {
    [ index : string ] : GetStreamableType
}

class PostStreamable extends Streamable {
    [ index : string ] : PostStreamableType
}

//class ListStreamable<T extends ObjectStreamable> extends PostStreamable {
//    // results : Array<T>
//    // count : string
//}

//class ObjectStreamable extends PostStreamable {
//}

class SpudObject {
    static type : string = null
    private obj_type : string
    id : number
    title : string
    cover_photo : Photo

    constructor(obj_type : string, streamable? : PostStreamable) {
        this.obj_type = obj_type
        if (streamable != null) {
            this.set_streamable(streamable)
        }
    }

    set_streamable(streamable : PostStreamable) {
        this.id = get_streamable_number(streamable, "id")
        this.title = get_streamable_string(streamable, "title")

        let streamable_cover_photo = get_streamable_object(streamable, 'cover_photo')
        if (streamable_cover_photo != null) {
            this.cover_photo = new Photo(streamable_cover_photo)
        }
    }

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = new PostStreamable
        streamable['id'] = this.id
        streamable['title'] = this.title
        if (this.cover_photo != null) {
            streamable['cover_photo_pk'] = this.cover_photo.id
        }
        return streamable
    }
}

abstract class Criteria {
    get_streamable() : PostStreamable {
        let streamable : PostStreamable = {}
        return streamable
    }

    abstract get_title() : string;
    abstract get_items() : Array<CriteriaItem>;

    get_idinputfields() : Array<IdInputField> {
        let items : Array<CriteriaItem> = this.get_items()
        let result : Array<IdInputField> = []
        for (let i=0; i<items.length; i++) {
            result.push(items[i].get_idinputfield())
        }
        return result
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

interface UiAjaxAutoCompleteOptions<U extends SpudObject, ObjectCriteria extends Criteria> extends UiAutoCompleteHtmlOptions {
    obj_type : ObjectType<U,ObjectCriteria>
}

interface UiAjaxAutoCompleteMultipleOptions<U extends SpudObject, ObjectCriteria extends Criteria> extends UiAjaxAutoCompleteOptions<U, ObjectCriteria> {
}

interface UiAjaxAutoCompleteSortedOptions<U extends SpudObject, ObjectCriteria extends Criteria> extends UiAjaxAutoCompleteOptions<U, ObjectCriteria> {
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
    ajaxautocomplete<U extends SpudObject, ObjectCriteria extends Criteria>(options: UiAjaxAutoCompleteOptions<U, ObjectCriteria>, div: JQuery): JQuery;
    ajaxautocompletemultiple<U extends SpudObject, ObjectCriteria extends Criteria>(options: UiAjaxAutoCompleteMultipleOptions<U, ObjectCriteria>, div: JQuery): JQuery;
    ajaxautocompletesorted<U extends SpudObject, ObjectCriteria extends Criteria>(options: UiAjaxAutoCompleteSortedOptions<U, ObjectCriteria>, div: JQuery): JQuery;
    photo_select(options: UiPhotoSelectOptions, div: JQuery): JQuery;
    myselectable(options: UiMySelectableOptions, div: JQuery): JQuery;
}

interface JQueryStatic {
    spud : SPUD
}

interface JQuery {
    ajaxautocomplete(methodName: 'destroy'): void;
    ajaxautocomplete<U extends SpudObject>(methodName: 'get'): U;
    ajaxautocomplete(methodName: string): any;
    ajaxautocomplete(methodName: 'set', obj: SpudObject, obj_pk: number): void;
    ajaxautocomplete(methodName: string, obj: SpudObject, obj_pk: number): void;

    ajaxautocompletemultiple(methodName: 'destroy'): void;
    ajaxautocompletemultiple<U extends SpudObject>(methodName: 'get'): Array<U>;
    ajaxautocompletemultiple(methodName: string): any;
    ajaxautocompletemultiple(methodName: 'set', obj: Array<SpudObject>, obj_pk: number): void;
    ajaxautocompletemultiple(methodName: string, obj: Array<SpudObject>, obj_pk: number): void;

    ajaxautocompletesorted(methodName: 'destroy'): void;
    ajaxautocompletesorted<U extends SpudObject>(methodName: 'get'): Array<U>;
    ajaxautocompletesorted(methodName: string): any;
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
