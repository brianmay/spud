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
    _place_created : Signal<Place>;
    _place_changed : Signal<Place>;
    _place_deleted : Signal<number>;
}

window._place_created = new Signal<Place>()
window._place_changed = new Signal<Place>()
window._place_deleted = new Signal<number>()

window._place_created.add_listener(null, () => {
    window._reload_all.trigger(null);
})

class Place extends SpudObject {
    static type : string = 'place'
    address : string
    address2 : string
    city : string
    state : string
    country : string
    postcode : string
    url : string
    urldesc : string
    notes : string
    ascendants : Array<Place>
    parent : Place
    _type_place : boolean

    constructor(streamable? : PostStreamable) {
        super(Place.type, streamable)
    }

    set_streamable(streamable? : PostStreamable) {
        super.set_streamable(streamable)

        this.address = get_streamable_string(streamable, 'address')
        this.address2 = get_streamable_string(streamable, 'address2')
        this.city = get_streamable_string(streamable, 'city')
        this.state = get_streamable_string(streamable, 'state')
        this.country = get_streamable_string(streamable, 'country')
        this.postcode = get_streamable_string(streamable, 'postcode')
        this.url = get_streamable_string(streamable, 'url')
        this.urldesc = get_streamable_string(streamable, 'urldesc')
        this.notes = get_streamable_string(streamable, 'notes')

        let ascendants = get_streamable_array(streamable, 'ascendants')
        this.ascendants = []
        for (let i=0; i<ascendants.length; i++) {
            let item : PostStreamable = streamable_to_object(ascendants[i])
            this.ascendants.push(new Place(item))
        }
        if (ascendants.length > 0) {
            let item : PostStreamable = streamable_to_object(ascendants[0])
            this.parent = new Place(item)
        } else {
            this.parent = null
        }
    }

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()
        streamable['address'] = this.address
        streamable['address2'] = this.address2
        streamable['city'] = this.city
        streamable['state'] = this.state
        streamable['country'] = this.country
        streamable['postcode'] = this.postcode
        streamable['url'] = this.url
        streamable['urldesc'] = this.urldesc
        streamable['notes'] = this.notes
        if (this.parent != null) {
            streamable['parent'] = this.parent.id
        } else {
            streamable['parent'] = null
        }
        return streamable
    }
}

class PlaceCriteria extends Criteria {
    mode : string
    root_only : boolean
    instance : Place
    q : string

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()

        let criteria : PlaceCriteria = this
        set_streamable_value(streamable, 'mode', criteria.mode)
        set_streamable_value(streamable, 'root_only', criteria.root_only)
        if (criteria.instance != null) {
            set_streamable_value(streamable, 'instance', criteria.instance.id)
        }
        set_streamable_value(streamable, 'q', criteria.q)
        return streamable
    }

    get_title() : string {
        let criteria : PlaceCriteria = this
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

        else {
            title = "All"
        }

        return title
    }

    get_items() : Array<CriteriaItem> {
        let criteria : PlaceCriteria = this
        let result : Array<CriteriaItem> = []

        result.push(new CriteriaItemObject(
            "instance", "Place",
            criteria.instance, new PlaceType()))
        result.push(new CriteriaItemSelect(
            "mode", "Mode",
            criteria.mode, [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ]))
        result.push(new CriteriaItemBoolean(
            "root_only", "Root Only",
            criteria.root_only))
        result.push(new CriteriaItemString(
            "q", "Search for",
            criteria.q))
        return result
    }
}

class PlaceType extends ObjectType<Place, PlaceCriteria> {
    constructor() {
        super(Place.type, "place")
    }

    object_from_streamable(streamable : PostStreamable) : Place {
        let obj = new Place()
        obj.set_streamable(streamable)
        return obj
    }

    criteria_from_streamable(streamable : PostStreamable, on_load : (object : PlaceCriteria) => void) : void {
        let criteria = new PlaceCriteria()

        criteria.mode = get_streamable_string(streamable, 'mode')
        criteria.root_only = get_streamable_boolean(streamable, 'root_only')
        criteria.q = get_streamable_string(streamable, 'q')

        let id = get_streamable_number(streamable, 'instance')
        if (id != null) {
            let obj_type = new PlaceType()
            let loader = obj_type.load(id)
            loader.loaded_item.add_listener(this, (object : Place) => {
                criteria.instance = object
                on_load(criteria)
            })
            loader.on_error.add_listener(this, (message : string) => {
                console.log(message)
                criteria.instance = new Place()
                on_load(criteria)
            })
        } else {
            criteria.instance = null
            on_load(criteria)
        }
    }

    // DIALOGS

    create_dialog(parent : Place) : PlaceChangeDialog {
        let obj : Place = new Place()
        obj.parent = parent

        let params : PlaceChangeDialogOptions = {
            obj: obj,
        }

        let dialog : PlaceChangeDialog = new PlaceChangeDialog(params)
        return dialog
    }

    change_dialog(obj : Place) : PlaceChangeDialog {
        let params : PlaceChangeDialogOptions = {
            obj: obj,
        }

        let dialog : PlaceChangeDialog = new PlaceChangeDialog(params)
        return dialog
    }

    delete_dialog(obj : Place) : PlaceDeleteDialog {
        let params : PlaceDeleteDialogOptions = {
            obj: obj,
        }

        let dialog : PlaceDeleteDialog = new PlaceDeleteDialog(params)
        return dialog
    }

    search_dialog(criteria : PlaceCriteria, on_success : on_success_function<PlaceCriteria>) : PlaceSearchDialog {
        let params : PlaceSearchDialogOptions = {
            obj: criteria,
            on_success: on_success,
        }

        let dialog : PlaceSearchDialog = new PlaceSearchDialog(params)
        return dialog
    }

    // WIDGETS

    criteria_widget(criteria : PlaceCriteria) : PlaceCriteriaWidget {
        let params : PlaceCriteriaWidgetOptions = {
            obj: criteria,
        }

        let widget : PlaceCriteriaWidget = new PlaceCriteriaWidget(params)
        return widget
    }

    list_widget(child_id : string, criteria : PlaceCriteria, disabled : boolean) : PlaceListWidget {
        let params : PlaceListWidgetOptions = {
            child_id: child_id,
            criteria: criteria,
            disabled: disabled,
        }

        let widget : PlaceListWidget = new PlaceListWidget(params)
        return widget
    }

    detail_infobox() : Infobox {
        let params : InfoboxOptions = {}
        let widget : Infobox = new PlaceDetailInfobox(params)
        return widget
    }

    // VIEWPORTS

    detail_viewport(object_loader : ObjectLoader<Place, PlaceCriteria>, state : GetStreamable) : PlaceDetailViewport {
        let params : PlaceDetailViewportOptions = {
            object_loader: object_loader,
            object_list_loader: null,
        }

        let viewport : PlaceDetailViewport = new PlaceDetailViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }

    list_viewport(criteria : PlaceCriteria, state : GetStreamable) : PlaceListViewport {
        let params : PlaceListViewportOptions = {
            criteria: criteria
        }
        let viewport : PlaceListViewport = new PlaceListViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }
}

///////////////////////////////////////
// place dialogs
///////////////////////////////////////

class PlaceSearchDialogOptions extends ObjectSearchDialogOptions<PlaceCriteria> {
}

class PlaceSearchDialog extends ObjectSearchDialog<PlaceCriteria> {
    protected options : PlaceSearchDialogOptions

    constructor(options : PlaceSearchDialogOptions) {
        super(options)
    }

    protected new_criteria() : PlaceCriteria {
        return new PlaceCriteria()
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Place", new PlaceType(), false)],
            ["mode", new SelectInputField("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new booleanInputField("Root only", false)],
        ]
        this.options.title = "Search places"
        this.options.description = "Please search for an place."
        this.options.button = "Search"
        super.show(element)
    }
}

class PlaceChangeDialogOptions extends ObjectChangeDialogOptions {
}

class PlaceChangeDialog extends ObjectChangeDialog<Place> {
    protected options : PlaceChangeDialogOptions

    constructor(options : PlaceChangeDialogOptions) {
        super(options)
        this.type = "places"
        this.type_name = "place"
    }

    show(element : JQuery) {
        this.options.fields = [
            ["title", new TextInputField("Title", true)],
            ["cover_photo", new PhotoSelectField("Photo", false)],
            ["address", new TextInputField("Address", false)],
            ["address2", new TextInputField("Address(ctd)", false)],
            ["city", new TextInputField("City", false)],
            ["state", new TextInputField("State", false)],
            ["country", new TextInputField("Country", false)],
            ["postcode", new TextInputField("Postcode", false)],
            ["url", new TextInputField("URL", false)],
            ["urldesc", new TextInputField("URL desc", false)],
            ["notes", new PInputField("Notes", false)],
            ["parent", new AjaxSelectField("Parent", new PlaceType(), false)],
        ]

        this.options.title = "Change place"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : PostStreamable) {
        let place : Place = new Place()
        place.set_streamable(data)
        if (this.obj.id != null) {
            window._place_changed.trigger(place)
        } else {
            window._place_created.trigger(place)
        }
        super.save_success(data)
    }
}

class PlaceDeleteDialogOptions extends ObjectDeleteDialogOptions{
}

class PlaceDeleteDialog extends ObjectDeleteDialog<Place> {
    constructor(options : PlaceDeleteDialogOptions) {
        super(options)
        this.type = "places"
        this.type_name = "place"
    }

    protected save_success(data : Streamable) {
        window._place_deleted.trigger(this.obj_id)
        super.save_success(data)
    }
}


///////////////////////////////////////
// place widgets
///////////////////////////////////////

class PlaceCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions<PlaceCriteria> {
}

class PlaceCriteriaWidget extends ObjectCriteriaWidget<Place, PlaceCriteria> {
    protected options : PlaceCriteriaWidgetOptions

    constructor(options : PlaceCriteriaWidgetOptions) {
        super(options)
    }
}


class PlaceListWidgetOptions extends ObjectListWidgetOptions<PlaceCriteria> {
}

class PlaceListWidget extends ObjectListWidget<Place, PlaceCriteria> {
    protected options : PlaceListWidgetOptions

    constructor(options : PlaceListWidgetOptions) {
        super(options, new PlaceType())
    }

    show(element : JQuery) {
        super.show(element)

        window._place_changed.add_listener(this, (place) => {
            var li = this.create_li_for_obj(place)
            this.get_item(place.id).replaceWith(li)
        })
        window._place_deleted.add_listener(this, (place_id) => {
            this.get_item(place_id).remove()
            this.load_if_required()
        })
    }

    protected create_child_viewport() : PlaceDetailViewport {
        var child_id : string = this.options.child_id
        var params : PlaceDetailViewportOptions = {
            id: child_id,
            object_loader: null,
            object_list_loader: null,
        }
        let viewport : PlaceDetailViewport
        viewport = new PlaceDetailViewport(params)
        add_viewport(viewport)
        return viewport;
    }

    protected get_details(obj : Place) : Array<JQuery> {
        var details : Array<JQuery> = super.get_details(obj)
        return details
    }

    protected get_description(obj : Place) : string {
        return obj.city
    }
}

class PlaceDetailInfoboxOptions extends InfoboxOptions {
}

class PlaceDetailInfobox extends Infobox {
    protected options : PlaceDetailInfoboxOptions
    private img : ImageWidget

    constructor(options : PlaceDetailInfoboxOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["address", new TextOutputField("Address")],
            ["address2", new TextOutputField("Address(ctd)")],
            ["city", new TextOutputField("City")],
            ["state", new TextOutputField("State")],
            ["postcode", new TextOutputField("Postcode")],
            ["country", new TextOutputField("Country")],
            // FIXME
            // ["url", new HtmlOutputField("URL")],
            ["home_of", new LinkListOutputField("Home of", new PlaceType())],
            ["work_of", new LinkListOutputField("Work of", new PlaceType())],
            ["notes", new POutputField("notes")],
            ["ascendants", new LinkListOutputField("Ascendants", new PlaceType())],
        ]

        super.show(element);

        this.img = new ImageWidget({size: "mid", include_link: true})

        let e = $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
    }

    set(place : Place) {
        this.element.removeClass("error")

        super.set(place)

        this.options.obj = place
        if (place != null) {
            this.img.set(place.cover_photo)
        } else {
            this.img.set(null)
        }
    }
}


///////////////////////////////////////
// place viewports
///////////////////////////////////////

class PlaceListViewportOptions extends ObjectListViewportOptions<PlaceCriteria> {
}

class PlaceListViewport extends ObjectListViewport<Place, PlaceCriteria> {
    protected options : PlaceListViewportOptions

    constructor(options : PlaceListViewportOptions) {
        super(options, new PlaceType())
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


class PlaceDetailViewportOptions extends ObjectDetailViewportOptions<Place, PlaceCriteria> {
}

class PlaceDetailViewport extends ObjectDetailViewport<Place, PlaceCriteria> {
    constructor(options : PlaceDetailViewportOptions) {
        super(options, new PlaceType())
    }

    show(element : JQuery) : void {
        super.show(element)

        window._place_changed.add_listener(this, (obj : Place) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj.id === this_obj_id) {
                this.set(this.obj_type.load(obj.id))
            }
        })
        window._place_deleted.add_listener(this, (obj_id : number) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj_id === this_obj_id) {
                this.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        let criteria : PhotoCriteria = new PhotoCriteria()
        criteria.place = this.get_obj_id()
        criteria.place_descendants = true
        return criteria
    }

    protected get_children_criteria() : PlaceCriteria {
        let criteria : PlaceCriteria = new PlaceCriteria()
        criteria.instance = this.get_obj()
        criteria.mode = 'children'
        return criteria
    }
}
