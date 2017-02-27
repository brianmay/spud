/// <reference path="signals.ts" />
/// <reference path="globals.ts" />
/// <reference path="base.ts" />
/// <reference path="dialog.ts" />
/// <reference path="infobox.ts" />
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

interface Window {
    _album_created : Signal<Album>;
    _album_changed : Signal<Album>;
    _album_deleted : Signal<number>;
}

window._album_created = new Signal<Album>()
window._album_changed = new Signal<Album>()
window._album_deleted = new Signal<number>()

window._album_created.add_listener(null, () => {
    window._reload_all.trigger(null);
})

class Album extends SpudObject {
    static type : string = 'albums'
    revised : DateTimeZone
    description : string
    sort_order : string
    sort_name : string
    ascendants : Array<Album>
    parent : Album
    _type_album : boolean

    constructor(streamable? : PostStreamable) {
        super(Album.type, streamable)
    }

    set_streamable(streamable : PostStreamable) {
        super.set_streamable(streamable)

        this.description = get_streamable_string(streamable, 'description')
        this.sort_order = get_streamable_string(streamable, 'sort_order')
        this.sort_name = get_streamable_string(streamable, 'sort_name')
        let utc_offset : number = get_streamable_number(streamable, 'revised_utc_offset')
        this.revised = get_streamable_datetimezone(streamable, 'revised', utc_offset)

        let ascendants = get_streamable_array(streamable, 'ascendants')
        this.ascendants = []
        for (let i=0; i<ascendants.length; i++) {
            let item : PostStreamable = streamable_to_object(ascendants[i])
            this.ascendants.push(new Album(item))
        }
        if (ascendants.length > 0) {
            let item : PostStreamable = streamable_to_object(ascendants[0])
            this.parent = new Album(item)
        } else {
            this.parent = null
        }
    }

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()
        streamable['description'] = this.description
        streamable['sort_order'] = this.sort_order
        streamable['sort_name'] = this.sort_name
        streamable['revised_utc_offset'] = streamable_datetimezone_offset(this.revised)
        streamable['revised'] = streamable_datetimezone_datetime(this.revised)
        if (this.parent != null) {
            streamable['parent'] = this.parent.id
        } else {
            streamable['parent'] = null
        }
        return streamable
    }
}

class AlbumCriteria extends Criteria {
    mode : string
    root_only : boolean
    instance : Album
    q : string
    needs_revision : boolean

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()

        let criteria : AlbumCriteria = this
        set_streamable_value(streamable, 'mode', criteria.mode)
        set_streamable_value(streamable, 'root_only', criteria.root_only)
        if (criteria.instance != null) {
            set_streamable_value(streamable, 'instance', criteria.instance.id)
        }
        set_streamable_value(streamable, 'q', criteria.q)
        set_streamable_value(streamable, 'needs_revision', criteria.needs_revision)
        return streamable
    }

    get_title() : string {
        let criteria : AlbumCriteria = this
        let title : string = null
        let mode = criteria.mode || 'children'

        if (criteria.instance != null) {
            title = criteria.instance.title + " / " + mode
        }

        else if (criteria.q != null) {
            title = "search " + criteria.q
        }

        else if (criteria.root_only) {
            title = "root only"
        }

        else if (criteria.needs_revision) {
            title = "needs revision"
        }

        else {
            title = "All"
        }

        return title
    }

    get_items() : Array<CriteriaItem> {
        let criteria : AlbumCriteria = this
        let result : Array<CriteriaItem> = []

        result.push(new CriteriaItemObject(
            "instance", "Album",
            criteria.instance, new AlbumType()))
        result.push(new CriteriaItemSelect(
            "mode", "Mode",
            criteria.mode, [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ]))
        result.push(new CriteriaItemBoolean(
            "root_only", "Root Only",
            criteria.root_only))
        result.push(new CriteriaItemString(
            "q", "Search for",
            criteria.q))
        result.push(new CriteriaItemBoolean(
            "needs_revision", "Needs revision",
            criteria.needs_revision))
        return result
    }
}

class AlbumType extends ObjectType<Album, AlbumCriteria> {
    constructor() {
        super(Album.type, "album")
    }

    object_from_streamable(streamable : PostStreamable) : Album {
        let obj = new Album()
        obj.set_streamable(streamable)
        return obj
    }

    criteria_from_streamable(streamable : PostStreamable, on_load : (object : AlbumCriteria) => void) : void {
        let criteria = new AlbumCriteria()

        criteria.mode = get_streamable_string(streamable, 'mode')
        criteria.root_only = get_streamable_boolean(streamable, 'root_only')
        criteria.q = get_streamable_string(streamable, 'q')
        criteria.needs_revision = get_streamable_boolean(streamable, 'needs_revision')

        let id = get_streamable_number(streamable, 'instance')
        if (id != null) {
            let obj_type = new AlbumType()
            let loader = obj_type.load(id)
            loader.loaded_item.add_listener(this, (object : Album) => {
                criteria.instance = object
                on_load(criteria)
            })
            loader.on_error.add_listener(this, (message : string) => {
                console.log(message)
                criteria.instance = new Album()
                on_load(criteria)
            })
        } else {
            criteria.instance = null
            on_load(criteria)
        }
    }

    // DIALOGS

    create_dialog(parent : Album) : AlbumChangeDialog {
        let obj : Album = new Album()
        obj.parent = parent

        let params : AlbumChangeDialogOptions = {
            obj: obj,
        }

        let dialog : AlbumChangeDialog = new AlbumChangeDialog(params)
        return dialog
    }

    change_dialog(obj : Album) : AlbumChangeDialog {
        let params : AlbumChangeDialogOptions = {
            obj: obj,
        }

        let dialog : AlbumChangeDialog = new AlbumChangeDialog(params)
        return dialog
    }

    delete_dialog(obj : Album) : AlbumDeleteDialog {
        let params : AlbumDeleteDialogOptions = {
            obj: obj,
        }

        let dialog : AlbumDeleteDialog = new AlbumDeleteDialog(params)
        return dialog
    }

    search_dialog(criteria : AlbumCriteria, on_success : on_success_function<AlbumCriteria>) : AlbumSearchDialog {
        let params : AlbumSearchDialogOptions = {
            obj: criteria,
            on_success: on_success,
        }

        let dialog : AlbumSearchDialog = new AlbumSearchDialog(params)
        return dialog
    }

    // WIDGETS

    criteria_widget(criteria : AlbumCriteria) : AlbumCriteriaWidget {
        let params : AlbumCriteriaWidgetOptions = {
            obj: criteria,
        }

        let widget : AlbumCriteriaWidget = new AlbumCriteriaWidget(params)
        return widget
    }

    list_widget(child_id : string, criteria : AlbumCriteria, disabled : boolean) : AlbumListWidget {
        let params : AlbumListWidgetOptions = {
            child_id: child_id,
            criteria: criteria,
            disabled: disabled,
        }

        let widget : AlbumListWidget = new AlbumListWidget(params)
        return widget
    }

    detail_infobox() : Infobox {
        let params : InfoboxOptions = {}
        let widget : Infobox = new AlbumDetailInfobox(params)
        return widget
    }

    // VIEWPORTS

    detail_viewport(object_loader : ObjectLoader<Album, AlbumCriteria>, state : GetStreamable) : AlbumDetailViewport {
        let params : AlbumDetailViewportOptions = {
            object_loader: object_loader,
            object_list_loader: null,
        }

        let viewport : AlbumDetailViewport = new AlbumDetailViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }

    list_viewport(criteria : AlbumCriteria, state : GetStreamable) : AlbumListViewport {
        let params : AlbumListViewportOptions = {
            criteria: criteria
        }
        let viewport : AlbumListViewport = new AlbumListViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }
}

///////////////////////////////////////
// album dialogs
///////////////////////////////////////

class AlbumSearchDialogOptions extends ObjectSearchDialogOptions<AlbumCriteria> {
}

class AlbumSearchDialog extends ObjectSearchDialog<AlbumCriteria> {
    protected options : AlbumSearchDialogOptions

    constructor(options : AlbumSearchDialogOptions) {
        super(options)
    }

    protected new_criteria() : AlbumCriteria {
        return new AlbumCriteria()
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Album", new AlbumType(), false)],
            ["mode", new SelectInputField("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new booleanInputField("Root only", false)],
            ["needs_revision", new booleanInputField("Needs revision", false)],
        ]
        this.options.title = "Search albums"
        this.options.description = "Please search for an album."
        this.options.button = "Search"
        super.show(element)
    }
}

class AlbumChangeDialogOptions extends ObjectChangeDialogOptions {
}

class AlbumChangeDialog extends ObjectChangeDialog<Album> {
    protected options : AlbumChangeDialogOptions

    constructor(options : AlbumChangeDialogOptions) {
        super(options)
        this.type = "albums"
        this.type_name = "album"
    }

    show(element : JQuery) {
        this.options.fields = [
            ["title", new TextInputField("Title", true)],
            ["description", new PInputField("Description", false)],
            ["cover_photo", new PhotoSelectField("Photo", false)],
            ["sort_name", new TextInputField("Sort Name", false)],
            ["sort_order", new TextInputField("Sort Order", false)],
            ["parent", new AjaxSelectField("Parent", new AlbumType(), false)],
            ["revised", new DateTimeInputField("Revised", false)],
        ]

        this.options.title = "Change album"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : PostStreamable) {
        let album : Album = new Album()
        album.set_streamable(data)
        if (this.obj.id != null) {
            window._album_changed.trigger(album)
        } else {
            window._album_created.trigger(album)
        }
        super.save_success(data)
    }
}

class AlbumDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class AlbumDeleteDialog extends ObjectDeleteDialog<Album> {
    constructor(options : AlbumDeleteDialogOptions) {
        super(options)
        this.type = "albums"
        this.type_name = "album"
    }

    protected save_success(data : Streamable) {
        window._album_deleted.trigger(this.obj_id)
        super.save_success(data)
    }
}


///////////////////////////////////////
// album widgets
///////////////////////////////////////

class AlbumCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions<AlbumCriteria> {
}

class AlbumCriteriaWidget extends ObjectCriteriaWidget<Album, AlbumCriteria> {
    protected options : AlbumCriteriaWidgetOptions
    protected type : string

    constructor(options : AlbumCriteriaWidgetOptions) {
        super(options)
        this.type = "albums"
    }
}


class AlbumListWidgetOptions extends ObjectListWidgetOptions<AlbumCriteria> {
}

class AlbumListWidget extends ObjectListWidget<Album, AlbumCriteria> {
    protected options : AlbumListWidgetOptions

    constructor(options : AlbumListWidgetOptions) {
        super(options, new AlbumType())
    }

    show(element : JQuery) {
        super.show(element)

        window._album_changed.add_listener(this, (album) => {
            var li = this.create_li_for_obj(album)
            this.get_item(album.id).replaceWith(li)
        })
        window._album_deleted.add_listener(this, (album_id) => {
            this.get_item(album_id).remove()
            this.load_if_required()
        })
    }

    protected create_child_viewport() : AlbumDetailViewport {
        var child_id : string = this.options.child_id
        var params : AlbumDetailViewportOptions = {
            id: child_id,
            object_loader: null,
            object_list_loader: null,
        }
        let viewport : AlbumDetailViewport
        viewport = new AlbumDetailViewport(params)
        add_viewport(viewport)
        return viewport;
    }

    protected get_details(obj : Album) : Array<JQuery> {
        var details : Array<JQuery> = super.get_details(obj)
        if  (obj.sort_order || obj.sort_name) {
            details.push($("<div/>").text(obj.sort_name + " " + obj.sort_order))
        }
        return details
    }

    protected get_description(obj : Album) : string {
        return obj.description
    }
}

class AlbumDetailInfoboxOptions extends InfoboxOptions {
}

class AlbumDetailInfobox extends Infobox {
    protected options : AlbumDetailInfoboxOptions
    private img : ImageWidget

    constructor(options : AlbumDetailInfoboxOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["title", new TextOutputField("Title")],
            ["sort_name", new TextOutputField("Sort Name")],
            ["sort_order", new TextOutputField("Sort Order")],
            ["revised", new DateTimeOutputField("Revised")],
            ["description", new POutputField("Description")],
            ["ascendants", new LinkListOutputField("Ascendants", new AlbumType())],
        ]

        super.show(element);

        this.img = new ImageWidget({size: "mid", include_link: true})

        let e = $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
    }

    set(album : Album) {
        this.element.removeClass("error")

        super.set(album)

        this.options.obj = album
        if (album != null) {
            this.img.set(album.cover_photo)
        } else {
            this.img.set(null)
        }
    }
}


///////////////////////////////////////
// album viewports
///////////////////////////////////////

class AlbumListViewportOptions extends ObjectListViewportOptions<AlbumCriteria> {
}

class AlbumListViewport extends ObjectListViewport<Album, AlbumCriteria> {
    protected options : AlbumListViewportOptions

    constructor(options : AlbumListViewportOptions) {
        super(options, new AlbumType())
    }

    get_streamable_state() : GetStreamable {
        let streamable : GetStreamable = super.get_streamable_state()
        return streamable
    }

    set_streamable_state(streamable : GetStreamable) : void {
        // load streamable state, must be called before show() is called.
        super.set_streamable_state(streamable)
    }
}


class AlbumDetailViewportOptions extends ObjectDetailViewportOptions<Album, AlbumCriteria> {
}

class AlbumDetailViewport extends ObjectDetailViewport<Album, AlbumCriteria> {
    constructor(options : AlbumDetailViewportOptions) {
        super(options, new AlbumType())
    }

    show(element : JQuery) : void {
        super.show(element)

        window._album_changed.add_listener(this, (obj : Album) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj.id === this_obj_id) {
                this.set(this.obj_type.load(obj.id))
            }
        })
        window._album_deleted.add_listener(this, (obj_id : number) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj_id === this_obj_id) {
                this.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        let criteria : PhotoCriteria = new PhotoCriteria()
        criteria.album = this.get_obj_id()
        criteria.album_descendants = true
        return criteria
    }

    protected get_children_criteria() : AlbumCriteria {
        let criteria : AlbumCriteria = new AlbumCriteria()
        criteria.instance = this.get_obj()
        criteria.mode = 'children'
        return criteria
    }
}
