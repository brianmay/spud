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
    _photo_created : Signal<Photo>;
    _photo_changed : Signal<Photo>;
    _photo_deleted : Signal<number>;
}

window._photo_created = new Signal<Photo>()
window._photo_changed = new Signal<Photo>()
window._photo_deleted = new Signal<number>()


class PhotoThumbStreamable extends Streamable {
    width : number
    height : number
    url : string
}

class PhotoVideoStreamable extends Streamable {
    width : number
    height : number
    url : string
    format : string
}

class PriorityPhotoVideoStreamable {
    0: number
    1: PhotoVideoStreamable
}

class PhotoStreamable extends ObjectStreamable {
    action : string
    datetime : string
    datetime_utc_offset : number
    description : string
    camera_make : string
    camera_model : string
    flash_used : string
    focal_length : string
    exposure : string
    aperture : string
    iso_equiv : string
    metering_mode : string

    albums : Array<AlbumStreamable>
    categorys : Array<CategoryStreamable>
    persons : Array<PersonStreamable>
    photographer : PersonStreamable
    place : PlaceStreamable

    albums_pk : Array<number>
    categorys_pk : Array<number>
    persons_pk : Array<number>
    photographer_pk : number
    place_pk : number

    orig_url : string
    thumbs : StringArray<PhotoThumbStreamable>
    videos : StringArray<Array<PriorityPhotoVideoStreamable>>
}

class PhotoThumb {
    width : number
    height : number
    url : string
}

class PhotoVideo {
    width : number
    height : number
    url : string
    format : string
}

class PriorityPhotoVideo {
    0: number
    1: PhotoVideo
}

class Photo extends SpudObject {
    action : string
    datetime : DateTimeZone
    description : string
    camera_make : string
    camera_model : string
    flash_used : string
    focal_length : string
    exposure : string
    aperture : string
    iso_equiv : string
    metering_mode : string

    albums : Array<Album>
    categorys : Array<Category>
    persons : Array<Person>
    photographer : Person
    place : Place

    orig_url : string
    thumbs : StringArray<PhotoThumb>
    videos : StringArray<Array<PriorityPhotoVideo>>
    _type_photo : boolean

    constructor(streamable : PhotoStreamable) {
        super(streamable)
        this.action = parse_string(streamable.action)
        this.datetime = parse_datetimezone(streamable.datetime, streamable.datetime_utc_offset)
        this.description = parse_string(streamable.description)
        this.camera_make = parse_string(streamable.camera_make)
        this.camera_model = parse_string(streamable.camera_model)
        this.flash_used = parse_string(streamable.flash_used)
        this.focal_length = parse_string(streamable.focal_length)
        this.exposure = parse_string(streamable.exposure)
        this.aperture = parse_string(streamable.aperture)
        this.iso_equiv = parse_string(streamable.iso_equiv)
        this.metering_mode = parse_string(streamable.metering_mode)

        if (streamable.albums != null) {
            this.albums = []
            for (let i=0; i<streamable.albums.length; i++) {
                let album = streamable.albums[i]
                this.albums.push(new Album(album))
            }
        }
        if (streamable.categorys != null) {
            this.categorys = []
            for (let i=0; i<streamable.categorys.length; i++) {
                let category = streamable.categorys[i]
                this.categorys.push(new Category(category))
            }
        }
        if (streamable.persons != null) {
            this.persons = []
            for (let i=0; i<streamable.persons.length; i++) {
                let person = streamable.persons[i]
                this.persons.push(new Person(person))
            }
        }
        if (streamable.photographer != null) {
            this.photographer = new Person(streamable.photographer)
        }
        if (streamable.place != null) {
            this.place = new Place(streamable.place)
        }
        this.orig_url = streamable.orig_url
        this.thumbs = {}
        for (let size in streamable.thumbs) {
            let thumb : PhotoThumb = new PhotoThumb()
            thumb.width = parse_number(streamable.thumbs[size].width)
            thumb.height = parse_number(streamable.thumbs[size].height)
            thumb.url = parse_string(streamable.thumbs[size].url)
            this.thumbs[size] = thumb
        }
        this.videos = {}
        for (let size in streamable.videos) {
            this.videos[size] = []
            for (let i=0; i<streamable.videos[size].length; i++) {
                let pv = streamable.videos[size][i]

                let priority : number = parse_number(pv[0])
                let svideo : PhotoVideoStreamable = pv[1]

                let video : PhotoVideo = new PhotoVideo()
                video.width = parse_number(svideo.width)
                video.height = parse_number(svideo.height)
                video.url = parse_string(svideo.url)
                video.format = parse_string(svideo.format)

                this.videos[size].push( [priority, video] )
            }
        }
    }

    to_streamable() : PhotoStreamable {
        let streamable : PhotoStreamable = <PhotoStreamable>super.to_streamable()
        streamable.action = this.action
        streamable.datetime_utc_offset = streamable_datetimezone_offset(this.datetime)
        streamable.datetime = streamable_datetimezone_datetime(this.datetime)
        streamable.description = this.description
        streamable.camera_make = this.camera_make
        streamable.camera_model = this.camera_model
        streamable.flash_used = this.flash_used
        streamable.focal_length = this.focal_length
        streamable.exposure = this.exposure
        streamable.aperture = this.aperture
        streamable.iso_equiv = this.iso_equiv
        streamable.metering_mode = this.metering_mode

        streamable.albums_pk = []
        for (let i=0; i<this.albums.length; i++) {
            streamable.albums_pk.push(this.albums[i].id)
        }

        streamable.categorys_pk = []
        for (let i=0; i<this.categorys.length; i++) {
            streamable.categorys_pk.push(this.categorys[i].id)
        }

        streamable.persons_pk = []
        for (let i=0; i<this.persons.length; i++) {
            streamable.persons_pk.push(this.persons[i].id)
        }

        streamable.photographer_pk = null
        if (this.photographer != null) {
            streamable.photographer_pk = this.photographer.id
        }

        streamable.place_pk = null
        if (this.place != null) {
            streamable.place_pk = this.place.id
        }

        return streamable
    }
}

interface PhotoCriteria extends Criteria {
    photos? : Array<number>

    first_datetime? : DateTimeZone
    last_datetime? : DateTimeZone
    action? : string
    mode? : string
    instance? : number
    q? : string

    album? : number
    category? : number
    place? : number
    person? : number

    album_descendants? : boolean
    category_descendants? : boolean
    place_descendants? : boolean
    person_descendants? : boolean
}

interface PhotoUpdates {
    title? : string
    action? : string
    datetime? : Date
    utc_offset? : number
    photographer_pk? : number
    place_pk? : number
    camera_make? : string
    camera_model? : string
    add_albums_pk? : Array<number>
    rem_albums_pk? : Array<number>
    add_categorys_pk? : Array<number>
    rem_categorys_pk? : Array<number>
    add_persons_pk? : Array<number>
    rem_persons_pk? : Array<number>
}


///////////////////////////////////////
// photo dialogs
///////////////////////////////////////

interface PhotoSearchDialogOptions extends ObjectSearchDialogOptions {
    on_success(criteria : PhotoCriteria) : boolean
}

class PhotoSearchDialog extends ObjectSearchDialog {
    protected options : PhotoSearchDialogOptions

    constructor(options : PhotoSearchDialogOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["q", new TextInputField("Search for", false)],
                ["first_datetime", new DateTimeInputField("First date", false)],
                ["last_datetime", new DateTimeInputField("Last date", false)],
                ["lower_rating", new IntegerInputField("Upper rating", false)],
                ["upper_rating", new IntegerInputField("Lower rating", false)],
                ["title", new TextInputField("Title", false)],
                ["photographer", new AjaxSelectField("Photographer", "persons", false)],
                ["path", new TextInputField("Path", false)],
                ["name", new TextInputField("Name", false)],
                ["first_id", new IntegerInputField("First id", false)],
                ["last_id", new IntegerInputField("Last id", false)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["album", new AjaxSelectField("Album", "albums", false)],
                ["album_descendants", new booleanInputField("Descend albums", false)],
                ["album_none", new booleanInputField("No albums", false)],

                ["category", new AjaxSelectField("Category", "categorys", false)],
                ["category_descendants", new booleanInputField("Descend categories", false)],
                ["category_none", new booleanInputField("No categories", false)],

                ["place", new AjaxSelectField("Place", "places", false)],
                ["place_descendants", new booleanInputField("Descend places", false)],
                ["place_none", new booleanInputField("No places", false)],

                ["person", new AjaxSelectField("Person", "persons", false)],
                ["person_none", new booleanInputField("No people", false)],
                ["person_descendants", new booleanInputField("Descend people", false)],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new TextInputField("Camera Make", false)],
                ["camera_model", new TextInputField("Camera Model", false)],
            ]},
        ]
        this.options.title = "Search photos"
        this.options.description = "Please search for an photo."
        this.options.button = "Search"
        super.show(element)
    }
}

interface PhotoChangeDialogOptions extends ObjectChangeDialogOptions {
}

class PhotoChangeDialog extends ObjectChangeDialog {
    protected options : PhotoChangeDialogOptions

    constructor(options : PhotoChangeDialogOptions) {
        super(options)
        this.type = "photos"
        this.type_name = "photo"
    }

    show(element : JQuery) {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["datetime", new DateTimeInputField("Date", true)],
                ["title", new TextInputField("Title", true)],
                ["photographer", new AjaxSelectField("Photographer", "persons", false)],
                ["action", new SelectInputField("Action", [
                    ["", "no action"],
                    ["D", "delete"],
                    ["R", "regenerate thumbnails & video"],
                    ["M", "move photo"],
                    ["auto", "rotate automatic"],
                    ["90", "rotate 90 degrees clockwise"],
                    ["180", "rotate 180 degrees clockwise"],
                    ["270", "rotate 270 degrees clockwise"],
                ], false)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["albums", new AjaxSelectMultipleField("Album", "albums", false)],
                ["categorys", new AjaxSelectMultipleField("Category", "categorys", false)],
                ["place", new AjaxSelectField("Place", "places", false)],
                ["persons", new AjaxSelectSortedField("Person", "persons", false)],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new TextInputField("Camera Make", false)],
                ["camera_model", new TextInputField("Camera Model", false)],
            ]},
        ]

        this.options.title = "Change photo"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : PhotoStreamable) {
        let photo : Photo = new Photo(data)
        if (this.obj.id != null) {
            window._photo_changed.trigger(photo)
        } else {
            window._photo_created.trigger(photo)
        }
        super.save_success(data)
    }
}

interface PhotoBulkUpdateDialogOptions extends FormDialogOptions {
    criteria : PhotoCriteria
}


class PhotoBulkUpdateDialog extends FormDialog {
    protected options : PhotoBulkUpdateDialogOptions
    protected data : PhotoUpdates

    constructor(options : PhotoBulkUpdateDialogOptions) {
        super(options)
        this.type = "photos"
    }

    show(element : JQuery) : void {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["datetime", new DateTimeInputField("Date", false)],
                ["title", new TextInputField("Title", false)],
                ["photographer", new AjaxSelectField("Photographer", "persons", false)],
                ["place", new AjaxSelectField("Place", "places", false)],
                ["action", new SelectInputField("Action", [
                    ["none", "no action"],
                    ["D", "delete"],
                    ["R", "regenerate thumbnails & video"],
                    ["M", "move photo"],
                    ["auto", "rotate automatic"],
                    ["90", "rotate 90 degrees clockwise"],
                    ["180", "rotate 180 degrees clockwise"],
                    ["270", "rotate 270 degrees clockwise"],
                ], false)],
            ]},
            {name: 'add', title: 'Add', fields: [
                ["add_albums", new AjaxSelectMultipleField("Album", "albums", false)],
                ["add_categorys", new AjaxSelectMultipleField("Category", "categorys", false)],
                ["add_persons", new AjaxSelectSortedField("Person", "persons", false)],
            ]},
            {name: 'rem', title: 'Remove', fields: [
                ["rem_albums", new AjaxSelectMultipleField("Album", "albums", false)],
                ["rem_categorys", new AjaxSelectMultipleField("Category", "categorys", false)],
                ["rem_persons", new AjaxSelectSortedField("Person", "persons", false)],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new TextInputField("Camera Make", false)],
                ["camera_model", new TextInputField("Camera Model", false)],
            ]},
        ]

        this.options.title = "Bulk photo update"
        this.options.button = "Save"

        super.show(element)
    }

    set(photo : Photo) : void {
        super.set(photo)
    }

    protected submit_values(values : DialogValues) : void {
        var data : PhotoUpdates = {}

        if (values["datetime"] != null) {
            data.datetime = values["datetime"]
        }

        if (values["title"] != null) {
            data.title = values["title"]
        }

        if (values["photographer"] != null) {
            data.photographer_pk = values["photographer"].id
        }

        if (values["place"] != null) {
            data.place_pk = values["place"].id
        }

        if (values["action"] != null) {
            data.action = null
            if (values["action"] != "none") {
                data.action = values["action"]
            }
        }

        data.add_albums_pk = []
        for (let i=0; i<values["add_albums"].length; i++) {
            data.add_albums_pk.push(values["add_albums"][i].id)
        }

        data.rem_albums_pk = []
        for (let i=0; i<values["rem_albums"].length; i++) {
            data.rem_albums_pk.push(values["rem_albums"][i].id)
        }

        data.add_categorys_pk = []
        for (let i=0; i<values["add_categorys"].length; i++) {
            data.add_categorys_pk.push(values["add_categorys"][i].id)
        }

        data.rem_categorys_pk = []
        for (let i=0; i<values["rem_categorys"].length; i++) {
            data.rem_categorys_pk.push(values["rem_categorys"][i].id)
        }

        data.add_persons_pk = []
        for (let i=0; i<values["add_persons"].length; i++) {
            data.add_persons_pk.push(values["add_persons"][i].id)
        }

        data.rem_persons_pk = []
        for (let i=0; i<values["rem_persons"].length; i++) {
            data.rem_persons_pk.push(values["rem_persons"][i].id)
        }

        if (values["camera_make"] != null) {
            data.camera_make = values["camera_make"]
        }

        if (values["camera_model"] != null) {
            data.camera_model = values["camera_model"]
        }

        this.data = data
        this.element.hide()

        let params = {
            criteria: this.options.criteria,
            obj: data,
            on_proceed: $.proxy(this.proceed, this),
            on_cancel: $.proxy(this.cancel, this),
        }
        let div = $("<div/>")
        let dialog = new PhotoBulkConfirmDialog(params)
        dialog.show(div)
    }

    protected proceed() : void {
        this.remove()

        let params : PhotoBulkProceedDialogOptions = {
            criteria: this.options.criteria,
            obj: this.data,
        }
        let div = $("<div/>")
        let dialog = new PhotoBulkProceedDialog(params)
        dialog.show(div)
    }

    protected cancel() : void {
        this.element.show()
        this.enable()
    }
}

interface PhotoBulkConfirmDialogOptions extends BaseDialogOptions {
    on_proceed() : void
    on_cancel() : void
    criteria : PhotoCriteria
}

class PhotoBulkConfirmDialog extends BaseDialog {
    private photo_list : PhotoListWidget
    private proceed : boolean
    private ol : JQuery
    private ul : JQuery
    protected options : PhotoBulkConfirmDialogOptions

    constructor(options : PhotoBulkConfirmDialogOptions) {
        options.title = "Confirm bulk update"
        options.button = "Confirm"

        super(options)

        this.proceed = false
        this.type = "photos"
    }

    show(element : JQuery) : void {
        super.show(element)

        this.ul = $("<ul/>").appendTo(this.element)

        this.ol = $("<div/>").appendTo(this.element)

        let options : PhotoListWidgetOptions = {
        }

        this.photo_list = new PhotoListWidget(options)
        this.photo_list.show(this.ol)
        this.set(this.options.criteria)
    }

    set(values) : void {
        this.ul.empty()
        $.each(values, (key, value) => {
            $("<li/>").text(key + " = " + value)
                .appendTo(this.ul)
        })
        this.photo_list.filter(this.options.criteria)
    }

    disable() : void {
        this.photo_list.disable()
        super.disable()
    }

    enable() : void {
        this.photo_list.enable()
        super.enable()
    }

    submit() : void {
        this.proceed = true
        this.remove()
    }

    protected destroy() {
        super.destroy()
        if (this.proceed) {
            this.options.on_proceed()
        } else {
            this.options.on_cancel()
        }
    }
}

interface PhotoBulkProceedDialogOptions extends BaseDialogOptions {
    criteria : PhotoCriteria
    obj : PhotoUpdates
}

class PhotoBulkProceedDialog extends BaseDialog {
    private pb : JQuery
    private status : JQuery
    protected options : PhotoBulkProceedDialogOptions
    protected values : PhotoUpdates

    constructor(options : PhotoBulkProceedDialogOptions) {
        options.title = "Bulk update"
        options.button = "Retry"

        super(options)

        this.type = "photos"
    }

    show(element: JQuery) : void {
        super.show(element)

        this.pb = $("<div/>").appendTo(this.element)
        this.pb.progressbar({value: false})

        this.status = $("<div/>")
            .text("Please wait")
            .appendTo(this.element)
        this.set(this.options.obj)
    }

    set(values) : void {
        this.values = values
        this.check_submit()
    }

    protected submit() : void {
        var data = {
            'criteria': this.options.criteria,
            'values': this.values
        }
        this._save("PATCH", null, data)
    }

    protected save_success(data) {
//        $.each(data.results, function(photo) {
//            window._photo_changed.trigger(photo)
//        })
        window._reload_all.trigger(null)
        super.save_success(data)
    }

    protected destroy() {
        super.destroy()
    }
}

interface PhotoDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class PhotoDeleteDialog extends ObjectDeleteDialog {
    constructor(options : PhotoDeleteDialogOptions) {
        super(options)
        this.type = "photos"
        this.type_name = "photo"
    }

    protected save_success(data : Streamable) {
        window._photo_deleted.trigger(this.obj_id)
        super.save_success(data)
    }
}


///////////////////////////////////////
// photo widgets
///////////////////////////////////////

interface PhotoCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions {
}

class PhotoCriteriaWidget extends ObjectCriteriaWidget {
    protected options : PhotoCriteriaWidgetOptions
    protected type : string

    constructor(options : PhotoCriteriaWidgetOptions) {
        super(options)
        this.type = "photos"
        this.load_attributes = [
            { name: 'album', type: 'albums' },
            { name: 'category', type: 'categorys' },
            { name: 'place', type: 'places' },
            { name: 'person', type: 'persons' },
            { name: 'instance', type: 'photos' },
        ]
    }

    set(input_criteria : PhotoCriteria) {
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

        else if (criteria.album != null) {
            title = "album " + criteria.album
        }
        else if (criteria.category != null) {
            title = "category " + criteria.category
        }
        else if (criteria.place != null) {
            title = "place " + criteria.place
        }
        else if (criteria.person != null) {
            title = "person " + criteria.person
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


interface PhotoListWidgetOptions extends ObjectListWidgetOptions {
    selection? : Array<number>
    criteria? : PhotoCriteria
}

class PhotoListWidget extends ObjectListWidget<PhotoStreamable, Photo> {
    protected options : PhotoListWidgetOptions

    constructor(options : PhotoListWidgetOptions) {
        super(options)
        this.type = "photos"
    }

    protected add_selection(photo) {
        var selection = this.options.selection
        if (selection.indexOf(photo.id) === -1) {
            selection.push(photo.id)
            push_state(true)
        }
    }

    protected del_selection(photo) {
        var selection = this.options.selection
        var index = selection.indexOf(photo.id)
        if (index !== -1) {
            selection.splice(index, 1);
            push_state(true)
        }
    }

    get_selection() : Array<number> {
        return this.options.selection
    }

    protected is_photo_selected(photo) {
        var selection = this.options.selection
        var index = selection.indexOf(photo.id)
        return index !== -1
    }

    protected to_object(streamable : PhotoStreamable) : Photo {
        return new Photo(streamable)
    }

    show(element : JQuery) {

        if (this.options.selection == null) {
            this.options.selection = []
        }

        super.show(element)

        let options : UiMySelectableOptions = {
            filter: "li",
            selected: ( event, ui ) => {
                this.add_selection( $(ui.selected).data('item') );
            },
            unselected: ( event, ui ) => {
                this.del_selection( $(ui.unselected).data('item') );
            },
        }

        $.spud.myselectable(options, this.ul)

        window._photo_changed.add_listener(this, (photo) => {
            var li = this.create_li_for_obj(photo)
            this.get_item(photo.id).replaceWith(li)
        })
        window._photo_deleted.add_listener(this, (photo_id) => {
            this.get_item(photo_id).remove()
            this.load_if_required()
        })
    }

    protected create_child_viewport() : PhotoDetailViewport {
        var child_id : string = this.options.child_id
        var params : PhotoDetailViewportOptions = {
            id: child_id,
            obj: null,
            obj_id: null,
        }
        let viewport : PhotoDetailViewport
        viewport = new PhotoDetailViewport(params)
        add_viewport(viewport)
        return viewport;
    }

    protected get_photo(obj : Photo) : Photo {
        return obj
    }

    protected get_details(obj : Photo) : Array<JQuery> {
        var details : Array<JQuery> = super.get_details(obj)

        var datetime = moment(obj.datetime[0])
        datetime.zone(-obj.datetime[1])
        var datetime_str = datetime.format("YYYY-MM-DD hh:mm")

        details.push($("<div/>").text(datetime_str))

        if (obj.place != null) {
            details.push($("<div/>").text(obj.place.title))
        }

        return details
    }

    protected get_description(obj : Photo) : string {
        return obj.description
    }

    protected create_li(photo : Photo, title : string,
                      details : Array<JQuery>, description : string, a : JQuery) {
        let li : JQuery = super.create_li(photo, title, details, description, a)
        li.data("item", photo)
        li.toggleClass("removed", photo.action === "D")
        li.toggleClass("regenerate", photo.action != null && photo.action !== "D")
        li.toggleClass("ui-selected", this.is_photo_selected(photo))
        return li
    }

    bulk_update() {
        let criteria = this.options.criteria
        if (this.options.selection.length > 0) {
            criteria = $.extend({}, criteria)
            criteria.photos = this.options.selection
        }
        let params = {
            criteria: criteria,
        }
        let div = $("<div/>")
        let dialog = new PhotoBulkUpdateDialog(params)
        dialog.show(div)
    }
}

interface PhotoDetailInfoboxOptions extends InfoboxOptions {
}

class PhotoDetailInfobox extends Infobox {
    protected options : PhotoDetailInfoboxOptions
    private img : ImageWidget

    constructor(options : PhotoDetailInfoboxOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["title", new TextOutputField("Title")],
                ["description", new POutputField("Description")],
                ["view", new POutputField("View")],
                ["comment", new POutputField("Comment")],
                ["name", new TextOutputField("File")],
                ["albums", new LinkListOutputField("Albums", "albums")],
                ["categorys", new LinkListOutputField("Categories", "categorys")],
                ["place", new LinkOutputField("Place", "places")],
                ["persons", new LinkListOutputField("People", "persons")],
                ["datetime", new DateTimeOutputField("Date & time")],
                ["photographer", new LinkOutputField("Photographer", "persons")],
                ["rating", new TextOutputField("Rating")],
//                ["videos", new HtmlOutputField("Videos")],
//                ["related", new HtmlListOutputField("Related")],
                ["action", new TextOutputField("Action")],
            ]},
            {name: 'camera', title: 'Camera', fields: [
                ["camera_make", new TextOutputField("Camera make")],
                ["camera_model", new TextOutputField("Camera model")],
                ["flash_used", new TextOutputField("Flash")],
                ["focal_length", new TextOutputField("Focal Length")],
                ["exposure", new TextOutputField("Exposure")],
                ["aperture", new TextOutputField("Aperture")],
                ["iso_equiv", new TextOutputField("ISO")],
                ["metering_mode", new TextOutputField("Metering mode")],
            ]},
        ]

        super.show(element);

        this.img = new ImageWidget({size: "mid", include_link: false})

        let e = $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
    }

    set(photo : Photo) {
        this.element.removeClass("error")

        super.set(photo)

        this.options.obj = photo
        this.img.set(photo)
    }
}


///////////////////////////////////////
// photo viewports
///////////////////////////////////////

interface PhotoListViewportOptions extends ObjectListViewportOptions {
}

class PhotoListViewport extends ObjectListViewport<PhotoStreamable, Photo> {
    protected options : PhotoListViewportOptions
    protected ol : PhotoListWidget

    constructor(options : PhotoListViewportOptions) {
        super(options)
        this.type = "photos"
        this.type_name = "Photo"
    }

    protected setup_menu(menu : JQuery) : void {
        super.setup_menu(menu)

        var mythis = this
        menu.append(
            $("<li/>")
                .text("Update")
                .on("click", function(ev) {
                    void ev
                    var instance : PhotoListWidget = mythis.ol
                    instance.bulk_update()
                })
        )
    }

    get_streamable_options() : GenericStreamable {
        var options = super.get_streamable_options()
        if (this.ol != null) {
            var instance : PhotoListWidget = this.ol
            options['object_list_options'] = {
                selection: instance.get_selection()
            }
        }
        return options
    }

    protected create_object_list_widget(options : PhotoListWidgetOptions) : PhotoListWidget {
        return new PhotoListWidget(options)
    }

    protected create_object_criteria_widget(options : PhotoCriteriaWidgetOptions) : PhotoCriteriaWidget {
        return new PhotoCriteriaWidget(options)
    }

    protected create_object_search_dialog(options : PhotoSearchDialogOptions) : PhotoSearchDialog {
        return new PhotoSearchDialog(options)
    }
}


interface PhotoDetailViewportOptions extends ObjectDetailViewportOptions<PhotoStreamable> {
    obj : Photo
}

class PhotoDetailViewport extends ObjectDetailViewport<PhotoStreamable, Photo> {
    options : PhotoDetailViewportOptions
    orig : JQuery

    constructor(options : PhotoDetailViewportOptions) {
        super(options)
        this.type = "photos"
        this.type_name = "Photo"
    }

    protected setup_menu(menu : JQuery) : void {
        super.setup_menu(menu)

        this.orig = $("<li/>")
            .text("Original")
            .on("click", (ev) => {
                void ev
                if (this.options.obj.orig_url != null) {
                    window.open(this.options.obj.orig_url)
                }

            })
            .hide()
            .appendTo(menu)
    }


    protected to_object(streamable : PhotoStreamable) : Photo {
        return new Photo(streamable)
    }

    protected loaded(obj : Photo) : void {
        this.orig.toggle(obj.orig_url != null)
        this.div
            .toggleClass("removed", obj.action === "D")
            .toggleClass("regenerate", obj.action != null && obj.action !== "D")
        super.loaded(obj)
    }

    show(element : JQuery) : void {
        super.show(element)

        var mythis = this

        window._photo_changed.add_listener(this, (obj : Photo) => {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._photo_deleted.add_listener(this, (obj_id : number) => {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return null
    }

    protected create_object_list_widget(options : PhotoListWidgetOptions) : PhotoListWidget {
        return new PhotoListWidget(options)
    }

    protected create_object_detail_infobox(options : PhotoDetailInfoboxOptions) : PhotoDetailInfobox {
        return new PhotoDetailInfobox(options)
    }

    protected create_object_list_viewport(options : PhotoListViewportOptions) : PhotoListViewport {
        return new PhotoListViewport(options)
    }

    protected create_object_change_dialog(options : PhotoChangeDialogOptions) : PhotoChangeDialog {
        return new PhotoChangeDialog(options)
    }

    protected create_object_delete_dialog(options : PhotoDeleteDialogOptions) : PhotoDeleteDialog {
        return new PhotoDeleteDialog(options)
    }
}
