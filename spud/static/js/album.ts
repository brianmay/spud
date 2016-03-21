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

class AlbumStreamable extends ObjectStreamable {
    revised : string
    revised_utc_offset : number
    description : string
    sort_order : string
    sort_name : string
    ascendants : Array <AlbumStreamable>
    parent : number
}

class Album extends SpudObject {
    static type : string = "albums"
    revised : DateTimeZone
    description : string
    sort_order : string
    sort_name : string
    ascendants : Array<Album>
    parent : Album
    _type_album : boolean

    constructor(streamable : AlbumStreamable) {
        super(streamable)
        this.description = parse_string(streamable.description)
        this.sort_order = parse_string(streamable.sort_order)
        this.sort_name = parse_string(streamable.sort_name)
        this.revised = parse_datetimezone(streamable.revised, streamable.revised_utc_offset)
        if (streamable.ascendants != null) {
            this.ascendants = []
            for (let i=0; i<streamable.ascendants.length; i++) {
                this.ascendants.push(new Album(streamable.ascendants[i]))
            }
            if (streamable.ascendants.length > 0) {
                this.parent = this.ascendants[0]
            } else {
                this.parent = null
            }
        }
    }

    to_streamable() : AlbumStreamable {
        let streamable : AlbumStreamable = <AlbumStreamable>super.to_streamable()
        streamable.description = this.description
        streamable.sort_order = this.sort_order
        streamable.sort_name = this.sort_name
        streamable.revised_utc_offset = streamable_datetimezone_offset(this.revised)
        streamable.revised = streamable_datetimezone_datetime(this.revised)
        if (this.parent != null) {
            streamable.parent = this.parent.id
        } else {
            streamable.parent = null
        }
        return streamable
    }
}

interface AlbumCriteria extends Criteria {
    mode? : string
    root_only? : boolean
    instance? : number
    q? : string
    needs_revision? : boolean
}

///////////////////////////////////////
// album dialogs
///////////////////////////////////////

interface AlbumSearchDialogOptions extends ObjectSearchDialogOptions {
    on_success(criteria : AlbumCriteria) : boolean
}

class AlbumSearchDialog extends ObjectSearchDialog {
    protected options : AlbumSearchDialogOptions

    constructor(options : AlbumSearchDialogOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Album", "albums", false)],
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

interface AlbumChangeDialogOptions extends ObjectChangeDialogOptions {
}

class AlbumChangeDialog extends ObjectChangeDialog {
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
            ["parent", new AjaxSelectField("Parent", "albums", false)],
            ["revised", new DateTimeInputField("Revised", false)],
        ]

        this.options.title = "Change album"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : AlbumStreamable) {
        let album : Album = new Album(data)
        if (this.obj.id != null) {
            window._album_changed.trigger(album)
        } else {
            window._album_created.trigger(album)
        }
        super.save_success(data)
    }
}

interface AlbumDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class AlbumDeleteDialog extends ObjectDeleteDialog {
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

interface AlbumCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions {
}

class AlbumCriteriaWidget extends ObjectCriteriaWidget {
    protected options : AlbumCriteriaWidgetOptions
    protected type : string

    constructor(options : AlbumCriteriaWidgetOptions) {
        super(options)
        this.type = "albums"
    }

    set(input_criteria : AlbumCriteria) {
        var mythis = this
        mythis.element.removeClass("error")

        // this.options.criteria = criteria
        var ul = this.criteria
        this.criteria.empty()

        let criteria = $.extend({}, input_criteria)

        var title = null

        var mode = criteria.mode || 'children'
        delete criteria.mode

        if (criteria.instance != null) {
            var instance = criteria.instance
            title = instance + " / " + mode

            $("<li/>")
                .text("instance" + " = " + instance + " (" + mode + ")")
                .appendTo(ul)

            delete criteria.instance
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

        $.each(criteria, ( index, value ) => {
            $("<li/>")
                .text(index + " = " + value)
                .appendTo(ul)
        })

        this.finalize(input_criteria, title)
    }
}


interface AlbumListWidgetOptions extends ObjectListWidgetOptions {
}

class AlbumListWidget extends ObjectListWidget<AlbumStreamable, Album> {
    protected options : AlbumListWidgetOptions

    constructor(options : AlbumListWidgetOptions) {
        super(options)
        this.type = "albums"
    }

    protected to_object(streamable : AlbumStreamable) : Album {
        return new Album(streamable)
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
            obj: null,
            obj_id: null,
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

interface AlbumDetailInfoboxOptions extends InfoboxOptions {
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
            ["ascendants", new LinkListOutputField("Ascendants", "albums")],
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
        this.img.set(album.cover_photo)
    }
}


///////////////////////////////////////
// album viewports
///////////////////////////////////////

interface AlbumListViewportOptions extends ObjectListViewportOptions {
}

class AlbumListViewport extends ObjectListViewport<AlbumStreamable, Album> {
    protected options : AlbumListViewportOptions

    constructor(options : AlbumListViewportOptions) {
        super(options)
        this.type = "albums"
        this.type_name = "Album"
    }

    protected create_object_list_widget(options : AlbumListWidgetOptions) : AlbumListWidget {
        return new AlbumListWidget(options)
    }

    protected create_object_criteria_widget(options : AlbumCriteriaWidgetOptions) : AlbumCriteriaWidget {
        return new AlbumCriteriaWidget(options)
    }

    protected create_object_search_dialog(options : AlbumSearchDialogOptions) : AlbumSearchDialog {
        return new AlbumSearchDialog(options)
    }
}


interface AlbumDetailViewportOptions extends ObjectDetailViewportOptions<AlbumStreamable> {
}

class AlbumDetailViewport extends ObjectDetailViewport<AlbumStreamable, Album> {
    constructor(options : AlbumDetailViewportOptions) {
        super(options)
        this.type = "albums"
        this.type_name = "Album"
    }

    protected to_object(streamable : AlbumStreamable) : Album {
        return new Album(streamable)
    }

    show(element : JQuery) : void {
        super.show(element)

        var mythis = this

        window._album_changed.add_listener(this, (obj : Album) => {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._album_deleted.add_listener(this, (obj_id : number) => {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return {
            'album': this.options.obj_id,
            'album_descendants': true,
        }
    }

    protected create_object_list_widget(options : AlbumListWidgetOptions) : AlbumListWidget {
        return new AlbumListWidget(options)
    }

    protected create_object_detail_infobox(options : AlbumDetailInfoboxOptions) : AlbumDetailInfobox {
        return new AlbumDetailInfobox(options)
    }

    protected create_object_list_viewport(options : AlbumListViewportOptions) : AlbumListViewport {
        return new AlbumListViewport(options)
    }

    protected create_object_change_dialog(options : AlbumChangeDialogOptions) : AlbumChangeDialog {
        return new AlbumChangeDialog(options)
    }

    protected create_object_delete_dialog(options : AlbumDeleteDialogOptions) : AlbumDeleteDialog {
        return new AlbumDeleteDialog(options)
    }
}
