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

window._photo_created.add_listener(null, () => {
    window._reload_all.trigger(null);
})

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
    static type : string = 'photos'
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

    constructor(streamable? : PostStreamable) {
        super(Photo.type, streamable)
    }

    set_streamable(streamable : PostStreamable) {
        super.set_streamable(streamable)

        this.action = get_streamable_string(streamable, 'action')
        let utc_offset : number = get_streamable_number(streamable, 'datetime_utc_offset')
        this.datetime = get_streamable_datetimezone(streamable, 'datetime', utc_offset)
        this.description = get_streamable_string(streamable, 'description')
        this.camera_make = get_streamable_string(streamable, 'camera_make')
        this.camera_model = get_streamable_string(streamable, 'camera_model')
        this.flash_used = get_streamable_string(streamable, 'flash_used')
        this.focal_length = get_streamable_string(streamable, 'focal_length')
        this.exposure = get_streamable_string(streamable, 'exposure')
        this.aperture = get_streamable_string(streamable, 'aperture')
        this.iso_equiv = get_streamable_string(streamable, 'iso_equiv')
        this.metering_mode = get_streamable_string(streamable, 'metering_mode')
        this.orig_url = get_streamable_string(streamable, 'orig_url')

        let streamable_albums = get_streamable_array(streamable, 'albums')
        this.albums = []
        for (let i=0; i<streamable_albums.length; i++) {
            let item = streamable_to_object(streamable_albums[i])
            this.albums.push(new Album(item))
        }

        let streamable_categorys = get_streamable_array(streamable, 'categorys')
        this.categorys = []
        for (let i=0; i<streamable_categorys.length; i++) {
            let item = streamable_to_object(streamable_categorys[i])
            this.categorys.push(new Category(item))
        }

        let streamable_persons = get_streamable_array(streamable, 'persons')
        this.persons = []
        for (let i=0; i<streamable_persons.length; i++) {
            let item = streamable_to_object(streamable_persons[i])
            this.persons.push(new Person(item))
        }

        let streamable_photographer = get_streamable_object(streamable, 'photographer')
        if (streamable_photographer != null) {
            this.photographer = new Person(streamable_photographer)
        }

        let streamable_place = get_streamable_object(streamable, 'place')
        if (streamable_place != null) {
            this.place = new Place(streamable_place)
        }

        let streamable_thumbs = get_streamable_string_array(streamable, 'thumbs')
        this.thumbs = {}
        for (let size in streamable_thumbs) {
            let item = streamable_to_object(streamable_thumbs[size])
            let thumb : PhotoThumb = new PhotoThumb()
            thumb.width = get_streamable_number(item, 'width')
            thumb.height = get_streamable_number(item, 'height')
            thumb.url = get_streamable_string(item, 'url')
            this.thumbs[size] = thumb
        }

        let streamable_videos = get_streamable_string_array(streamable, 'videos')
        this.videos = {}
        for (let size in streamable_videos) {
            let item = streamable_to_object(streamable_videos[size])

            this.videos[size] = []
            let streamable_array = streamable_to_array(item)
            for (let i=0; i<streamable_array.length; i++) {
                let array_item = streamable_to_array(streamable_array[i])

                if (array_item.length != 2) {
                    continue
                }

                let priority : number = streamable_to_number(array_item[0])
                let svideo : PostStreamable = streamable_to_object(array_item[1])

                let video : PhotoVideo = new PhotoVideo()
                video.width = get_streamable_number(svideo, 'width')
                video.height = get_streamable_number(svideo, 'height')
                video.url = get_streamable_string(svideo, 'url')
                video.format = get_streamable_string(svideo, 'format')

                this.videos[size].push( [priority, video] )
            }
        }
    }

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()

        streamable['action'] = this.action
        streamable['datetime_utc_offset'] = streamable_datetimezone_offset(this.datetime)
        streamable['datetime'] = streamable_datetimezone_datetime(this.datetime)
        streamable['description'] = this.description
        streamable['camera_make'] = this.camera_make
        streamable['camera_model'] = this.camera_model
        streamable['flash_used'] = this.flash_used
        streamable['focal_length'] = this.focal_length
        streamable['exposure'] = this.exposure
        streamable['aperture'] = this.aperture
        streamable['iso_equiv'] = this.iso_equiv
        streamable['metering_mode'] = this.metering_mode

        let streamable_albums : PostStreamableType = []
        for (let i=0; i<this.albums.length; i++) {
            streamable_albums.push(this.albums[i].id)
        }
        streamable['albums_pk'] = streamable_albums

        let streamable_categorys : PostStreamableType = []
        for (let i=0; i<this.categorys.length; i++) {
            streamable_categorys.push(this.categorys[i].id)
        }
        streamable['categorys_pk'] = streamable_categorys

        let streamable_persons : PostStreamableType = []
        for (let i=0; i<this.persons.length; i++) {
            streamable_persons.push(this.persons[i].id)
        }
        streamable['persons_pk'] = streamable_persons

        streamable['photographer_pk'] = null
        if (this.photographer != null) {
            streamable['photographer_pk'] = this.photographer.id
        }

        streamable['place_pk'] = null
        if (this.place != null) {
            streamable['place_pk'] = this.place.id
        }

        return streamable
    }
}

class PhotoCriteria extends Criteria {
    photos : Array<number>

    first_datetime : DateTimeZone
    last_datetime : DateTimeZone
    action : string
    mode : string
    instance : Photo
    q : string

    album : number
    category : number
    place : number
    person : number

    album_descendants : boolean
    category_descendants : boolean
    place_descendants : boolean
    person_descendants : boolean

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()

        let criteria : PhotoCriteria = this
        set_streamable_array_as_string(streamable, 'photos', criteria.photos)
        set_streamable_datetimezone_datetime(streamable, 'first_datetime', criteria.first_datetime)
        //set_streamable_datetimezone_offset(streamable, 'first_datetime_utc_offset', criteria.first_datetime)
        set_streamable_datetimezone_datetime(streamable, 'last_datetime', criteria.last_datetime)
        //set_streamable_datetimezone_offset(streamable, 'last_datetime_utc_offset', criteria.last_datetime)
        set_streamable_value(streamable, 'action', criteria.action)
        set_streamable_value(streamable, 'mode', criteria.mode)
        if (criteria.instance != null) {
            set_streamable_value(streamable, 'instance', criteria.instance.id)
        }
        set_streamable_value(streamable, 'q', criteria.q)

        set_streamable_value(streamable, 'album', criteria.album)
        set_streamable_value(streamable, 'category', criteria.category)
        set_streamable_value(streamable, 'place', criteria.place)
        set_streamable_value(streamable, 'person', criteria.person)

        set_streamable_value(streamable, 'album_descendants', criteria.album_descendants)
        set_streamable_value(streamable, 'category_descendants', criteria.category_descendants)
        set_streamable_value(streamable, 'place_descendants', criteria.place_descendants)
        set_streamable_value(streamable, 'person_descendants', criteria.person_descendants)
        return streamable
    }

    get_title() : string {
        let criteria : PhotoCriteria = this
        let title : string = null
        let mode = criteria.mode || 'children'

        if (criteria.instance != null) {
            title = criteria.instance.title + " / " + mode
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

        return title
    }

    get_items() : Array<CriteriaItem> {
        let criteria : PhotoCriteria = this
        let result : Array<CriteriaItem> = []
        let mode = criteria.mode || 'children'

        result.push(new CriteriaItemObject(
            "instance", "Photo",
            criteria.instance, new PhotoType()))

        result.push(new CriteriaItemSelect(
            "mode", "Mode",
            criteria.mode, [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ]))

        //result.push("photos = " + criteria.photos)

        result.push(new CriteriaItemDateTimeZone(
            "first_datetime", "First Date Time",
            criteria.first_datetime))
        result.push(new CriteriaItemDateTimeZone(
            "last_datetime", "Last Date Time",
            criteria.last_datetime))

        result.push(new CriteriaItemSelect(
            "action", "Action",
            criteria.action, [
                ["", "no action"],
                ["D", "delete"],
                ["R", "regenerate thumbnails & video"],
                ["M", "move photo"],
                ["auto", "rotate automatic"],
                ["90", "rotate 90 degrees clockwise"],
                ["180", "rotate 180 degrees clockwise"],
                ["270", "rotate 270 degrees clockwise"],
            ]))

        result.push(new CriteriaItemString(
            "q", "Search for",
            criteria.q))

        result.push(new CriteriaItemNumber(
            "album", "Album",
            criteria.album))
        result.push(new CriteriaItemNumber(
            "category", "Category",
            criteria.category))
        result.push(new CriteriaItemNumber(
            "place", "Place",
            criteria.place))
        result.push(new CriteriaItemNumber(
            "person", "Person",
            criteria.person))

        result.push(new CriteriaItemBoolean(
            "album_descendants", "Album Descendants",
            criteria.album_descendants))
        result.push(new CriteriaItemBoolean(
            "category_descendants", "Category Descendants",
            criteria.category_descendants))
        result.push(new CriteriaItemBoolean(
            "place_descendants", "Place Descendants",
            criteria.place_descendants))
        result.push(new CriteriaItemBoolean(
            "person_descendants", "Person Descendants",
            criteria.person_descendants))

        return result
    }
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

class PhotoType extends ObjectType<Photo, PhotoCriteria> {
    constructor() {
        super(Photo.type, "photo")
    }

    object_from_streamable(streamable : PostStreamable) : Photo {
        let obj = new Photo()
        obj.set_streamable(streamable)
        return obj
    }

    criteria_from_streamable(streamable : PostStreamable, on_load : (object : PhotoCriteria) => void) : void {
        let criteria = new PhotoCriteria()

        criteria.photos = get_streamable_number_array(streamable, 'photos')
        let first_datetime_offset = get_streamable_number(streamable, 'first_datetime_utc_offset')
        criteria.first_datetime = get_streamable_datetimezone(streamable, 'first_datetime', first_datetime_offset)
        let last_datetime_offset = get_streamable_number(streamable, 'last_datetime_utc_offset')
        criteria.last_datetime = get_streamable_datetimezone(streamable, 'last_datetime', last_datetime_offset)
        criteria.action = get_streamable_string(streamable, 'action')
        criteria.q = get_streamable_string(streamable, 'q')

        criteria.album = get_streamable_number(streamable, 'album')
        criteria.category = get_streamable_number(streamable, 'category')
        criteria.place = get_streamable_number(streamable, 'place')
        criteria.person = get_streamable_number(streamable, 'person')

        criteria.album_descendants = get_streamable_boolean(streamable, 'album_descendants')
        criteria.category_descendants = get_streamable_boolean(streamable, 'category_descendants')
        criteria.place_descendants = get_streamable_boolean(streamable, 'place_descendants')
        criteria.person_descendants = get_streamable_boolean(streamable, 'person_descendants')

        let id = get_streamable_number(streamable, 'instance')
        if (id != null) {
            let obj_type = new PhotoType()
            let loader = obj_type.load(id)
            loader.loaded_item.add_listener(this, (object : Photo) => {
                criteria.instance = object
                on_load(criteria)
            })
            loader.on_error.add_listener(this, (message : string) => {
                console.log(message)
                criteria.instance = new Photo()
                on_load(criteria)
            })
        } else {
            criteria.instance = null
            on_load(criteria)
        }
    }

    // DIALOGS

    create_dialog(parent : Photo) : PhotoChangeDialog {
        let obj : Photo = new Photo()

        let params : PhotoChangeDialogOptions = {
            obj: obj,
        }

        let dialog : PhotoChangeDialog = new PhotoChangeDialog(params)
        return dialog
    }

    change_dialog(obj : Photo) : PhotoChangeDialog {
        let params : PhotoChangeDialogOptions = {
            obj: obj,
        }

        let dialog : PhotoChangeDialog = new PhotoChangeDialog(params)
        return dialog
    }

    delete_dialog(obj : Photo) : PhotoDeleteDialog {
        let params : PhotoDeleteDialogOptions = {
            obj: obj,
        }

        let dialog : PhotoDeleteDialog = new PhotoDeleteDialog(params)
        return dialog
    }

    search_dialog(criteria : PhotoCriteria, on_success : on_success_function<PhotoCriteria>) : PhotoSearchDialog {
        let params : PhotoSearchDialogOptions = {
            obj: criteria,
            on_success: on_success,
        }

        let dialog : PhotoSearchDialog = new PhotoSearchDialog(params)
        return dialog
    }

    // WIDGETS

    criteria_widget(criteria : PhotoCriteria) : PhotoCriteriaWidget {
        let params : PhotoCriteriaWidgetOptions = {
            obj: criteria,
        }

        let widget : PhotoCriteriaWidget = new PhotoCriteriaWidget(params)
        return widget
    }

    list_widget(child_id : string, criteria : PhotoCriteria, disabled : boolean) : PhotoListWidget {
        let params : PhotoListWidgetOptions = {
            child_id: child_id,
            criteria: criteria,
            disabled: disabled,
        }

        let widget : PhotoListWidget = new PhotoListWidget(params)
        return widget
    }

    detail_infobox() : Infobox {
        let params : InfoboxOptions = {}
        let widget : Infobox = new PhotoDetailInfobox(params)
        return widget
    }

    // VIEWPORTS

    detail_viewport(object_loader : ObjectLoader<Photo, PhotoCriteria>, state : GetStreamable) : PhotoDetailViewport {
        let params : PhotoDetailViewportOptions = {
            object_loader: object_loader,
            object_list_loader: null,
        }

        let viewport : PhotoDetailViewport = new PhotoDetailViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }

    list_viewport(criteria : PhotoCriteria, state : GetStreamable) : PhotoListViewport {
        let params : PhotoListViewportOptions = {
            criteria: criteria
        }
        let viewport : PhotoListViewport = new PhotoListViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }
}

///////////////////////////////////////
// photo dialogs
///////////////////////////////////////

class PhotoSearchDialogOptions extends ObjectSearchDialogOptions<PhotoCriteria> {
}

class PhotoSearchDialog extends ObjectSearchDialog<PhotoCriteria> {
    protected options : PhotoSearchDialogOptions

    constructor(options : PhotoSearchDialogOptions) {
        super(options)
    }

    protected new_criteria() : PhotoCriteria {
        return new PhotoCriteria()
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
                ["photographer", new AjaxSelectField("Photographer", new PersonType(), false)],
                ["path", new TextInputField("Path", false)],
                ["name", new TextInputField("Name", false)],
                ["first_id", new IntegerInputField("First id", false)],
                ["last_id", new IntegerInputField("Last id", false)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                // ["album", new AjaxSelectField("Album", new AlbumType(), false)],
                ["album", new IntegerInputField("Album ID", false)],
                ["album_descendants", new booleanInputField("Descend albums", false)],
                ["album_none", new booleanInputField("No albums", false)],

                // ["category", new AjaxSelectField("Category", new CategoryType(), false)],
                ["category", new IntegerInputField("Category ID", false)],
                ["category_descendants", new booleanInputField("Descend categories", false)],
                ["category_none", new booleanInputField("No categories", false)],

                // ["place", new AjaxSelectField("Place", new PlaceType(), false)],
                ["place", new IntegerInputField("Place ID", false)],
                ["place_descendants", new booleanInputField("Descend places", false)],
                ["place_none", new booleanInputField("No places", false)],

                // ["person", new AjaxSelectField("Person", new PersonType(), false)],
                ["person", new IntegerInputField("Person ID", false)],
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

class PhotoChangeDialogOptions extends ObjectChangeDialogOptions {
}

class PhotoChangeDialog extends ObjectChangeDialog<Photo> {
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
                ["photographer", new AjaxSelectField("Photographer", new PersonType(), false)],
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
                ["albums", new AjaxSelectMultipleField("Album", new AlbumType(), false)],
                ["categorys", new AjaxSelectMultipleField("Category", new CategoryType(), false)],
                ["place", new AjaxSelectField("Place", new PlaceType(), false)],
                ["persons", new AjaxSelectSortedField("Person", new PersonType(), false)],
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

    protected save_success(data : PostStreamable) {
        let photo : Photo = new Photo()
        photo.set_streamable(data)
        if (this.obj.id != null) {
            window._photo_changed.trigger(photo)
        } else {
            window._photo_created.trigger(photo)
        }
        super.save_success(data)
    }
}

class PhotoBulkUpdateDialogOptions extends FormDialogOptions {
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
                ["photographer", new AjaxSelectField("Photographer", new PersonType(), false)],
                ["place", new AjaxSelectField("Place", new PlaceType(), false)],
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
                ["add_albums", new AjaxSelectMultipleField("Album", new AlbumType(), false)],
                ["add_categorys", new AjaxSelectMultipleField("Category", new CategoryType(), false)],
                ["add_persons", new AjaxSelectSortedField("Person", new PersonType(), false)],
            ]},
            {name: 'rem', title: 'Remove', fields: [
                ["rem_albums", new AjaxSelectMultipleField("Album", new AlbumType(), false)],
                ["rem_categorys", new AjaxSelectMultipleField("Category", new CategoryType(), false)],
                ["rem_persons", new AjaxSelectSortedField("Person", new PersonType(), false)],
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

type on_proceed_function = () => void
type on_cancel_function = () => void

class PhotoBulkConfirmDialogOptions extends BaseDialogOptions {
    on_proceed : on_proceed_function
    on_cancel : on_cancel_function
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

class PhotoBulkProceedDialogOptions extends BaseDialogOptions {
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

class PhotoDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class PhotoDeleteDialog extends ObjectDeleteDialog<Photo> {
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

class PhotoCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions<PhotoCriteria> {
}

class PhotoCriteriaWidget extends ObjectCriteriaWidget<Photo, PhotoCriteria> {
    protected options : PhotoCriteriaWidgetOptions

    constructor(options : PhotoCriteriaWidgetOptions) {
        super(options)
    }
}


class PhotoListWidgetOptions extends ObjectListWidgetOptions<PhotoCriteria> {
    selection? : Array<number>
    criteria? : PhotoCriteria
}

class PhotoListWidget extends ObjectListWidget<Photo, PhotoCriteria> {
    protected options : PhotoListWidgetOptions

    constructor(options : PhotoListWidgetOptions) {
        super(options, new PhotoType())
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

    set_selection(selection : Array<number>) : void {
        this.options.selection = selection
    }

    get_selection() : Array<number> {
        return this.options.selection
    }

    protected is_photo_selected(photo) {
        var selection = this.options.selection
        var index = selection.indexOf(photo.id)
        return index !== -1
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
            object_loader: null,
            object_list_loader: null,
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

class PhotoDetailInfoboxOptions extends InfoboxOptions {
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
                ["albums", new LinkListOutputField("Albums", new AlbumType())],
                ["categorys", new LinkListOutputField("Categories", new CategoryType())],
                ["place", new LinkOutputField("Place", new PlaceType())],
                ["persons", new LinkListOutputField("People", new PersonType())],
                ["datetime", new DateTimeOutputField("Date & time")],
                ["photographer", new LinkOutputField("Photographer", new PersonType())],
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

class PhotoListViewportOptions extends ObjectListViewportOptions<PhotoCriteria> {
}

class PhotoListViewport extends ObjectListViewport<Photo, PhotoCriteria> {
    protected options : PhotoListViewportOptions
    protected ol : PhotoListWidget
    private selection : Array<number>

    constructor(options : PhotoListViewportOptions) {
        super(options, new PhotoType())
    }

    protected setup_menu(menu : JQuery) : void {
        super.setup_menu(menu)

        menu.append(
            $("<li/>")
                .text("Update")
                .on("click", function(ev) {
                    void ev
                    var instance : PhotoListWidget = this.ol
                    instance.bulk_update()
                })
        )
    }

    get_streamable_state() : GetStreamable {
        let streamable : GetStreamable = super.get_streamable_state()

        if (this.ol != null) {
            let instance : PhotoListWidget = this.ol
            let selection : Array<number> = instance.get_selection()
            if (selection.length > 0) {
                set_streamable_array_as_string(streamable, 'selection', selection)
            }
        }

        return streamable
    }

    set_streamable_state(streamable : GetStreamable) : void {
        // load streamable state, must be called before show() is called.
        super.set_streamable_state(streamable)

        let object_list_options : PhotoListWidgetOptions = {}
        let selection = get_streamable_number_array(streamable, 'selection')
        // FIXME
        if (this.element != null) {
            this.ol.set_selection(selection)
        } else {
            this.selection = selection
        }
    }

    filter(value : PhotoCriteria) : void {
        super.filter(value)
        if (this.element != null) {
            this.ol.set_selection(null)
            this.selection = null
        }
    }
}


class PhotoDetailViewportOptions extends ObjectDetailViewportOptions<Photo, PhotoCriteria> {
}

class PhotoDetailViewport extends ObjectDetailViewport<Photo, PhotoCriteria> {
    options : PhotoDetailViewportOptions
    orig : JQuery

    constructor(options : PhotoDetailViewportOptions) {
        super(options, new PhotoType())
    }

    protected setup_menu(menu : JQuery) : void {
        super.setup_menu(menu)

        this.orig = $("<li/>")
            .text("Original")
            .on("click", (ev) => {
                void ev
                let obj : Photo = this.get_obj()
                if (obj.orig_url != null) {
                    window.open(obj.orig_url)
                }

            })
            .hide()
            .appendTo(menu)
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

        window._photo_changed.add_listener(this, (obj : Photo) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj.id === this_obj_id) {
                this.set(this.obj_type.load(obj.id))
            }
        })
        window._photo_deleted.add_listener(this, (obj_id : number) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj_id === this_obj_id) {
                this.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return null
    }

    protected get_children_criteria() : PhotoCriteria {
        let criteria : PhotoCriteria = new PhotoCriteria()
        criteria.instance = this.get_obj()
        criteria.mode = 'children'
        return criteria
    }
}
