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


class PlaceStreamable extends ObjectStreamable {
    address : string
    address2 : string
    city : string
    state : string
    country : string
    postcode : string
    url : string
    urldesc : string
    notes : string
    ascendants : Array <PlaceStreamable>
    parent : number
}

class Place extends SpudObject {
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

    constructor(streamable : PlaceStreamable) {
        super(streamable)
        this.address = parse_string(streamable.address)
        this.address2 = parse_string(streamable.address2)
        this.city = parse_string(streamable.city)
        this.state = parse_string(streamable.state)
        this.country = parse_string(streamable.country)
        this.postcode = parse_string(streamable.postcode)
        this.url = parse_string(streamable.url)
        this.urldesc = parse_string(streamable.urldesc)
        this.notes = parse_string(streamable.notes)
        if (streamable.ascendants != null) {
            this.ascendants = []
            for (let i=0; i<streamable.ascendants.length; i++) {
                this.ascendants.push(new Place(streamable.ascendants[i]))
            }
            if (streamable.ascendants.length > 0) {
                this.parent = this.ascendants[0]
            } else {
                this.parent = null
            }
        }
    }

    to_streamable() : PlaceStreamable {
        let streamable : PlaceStreamable = <PlaceStreamable>super.to_streamable()
        streamable.address = this.address
        streamable.address2 = this.address2
        streamable.city = this.city
        streamable.state = this.state
        streamable.country = this.country
        streamable.postcode = this.postcode
        streamable.url = this.url
        streamable.urldesc = this.urldesc
        streamable.notes = this.notes
        if (this.parent != null) {
            streamable.parent = this.parent.id
        } else {
            streamable.parent = null
        }
        return streamable
    }
}

interface PlaceCriteria extends Criteria {
    mode? : string
    root_only? : boolean
    instance? : number
    q? : string
}

///////////////////////////////////////
// place dialogs
///////////////////////////////////////

interface PlaceSearchDialogOptions extends ObjectSearchDialogOptions {
    on_success(criteria : PlaceCriteria) : boolean
}

class PlaceSearchDialog extends ObjectSearchDialog {
    protected options : PlaceSearchDialogOptions

    constructor(options : PlaceSearchDialogOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Place", "places", false)],
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

interface PlaceChangeDialogOptions extends ObjectChangeDialogOptions {
}

class PlaceChangeDialog extends ObjectChangeDialog {
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
            ["parent", new AjaxSelectField("Parent", "places", false)],
        ]

        this.options.title = "Change place"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : PlaceStreamable) {
        let place : Place = new Place(data)
        if (this.obj.id != null) {
            window._place_changed.trigger(place)
        } else {
            window._place_created.trigger(place)
        }
        super.save_success(data)
    }
}

interface PlaceDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class PlaceDeleteDialog extends ObjectDeleteDialog {
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

interface PlaceCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions {
}

class PlaceCriteriaWidget extends ObjectCriteriaWidget {
    protected options : PlaceCriteriaWidgetOptions
    protected type : string

    constructor(options : PlaceCriteriaWidgetOptions) {
        super(options)
        this.type = "places"
    }

    set(input_criteria : PlaceCriteria) {
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


interface PlaceListWidgetOptions extends ObjectListWidgetOptions {
}

class PlaceListWidget extends ObjectListWidget<PlaceStreamable, Place> {
    protected options : PlaceListWidgetOptions

    constructor(options : PlaceListWidgetOptions) {
        super(options)
        this.type = "places"
    }

    protected to_object(streamable : PlaceStreamable) : Place {
        return new Place(streamable)
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
            obj: null,
            obj_id: null,
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

interface PlaceDetailInfoboxOptions extends InfoboxOptions {
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
            ["home_of", new LinkListOutputField("Home of", "places")],
            ["work_of", new LinkListOutputField("Work of", "places")],
            ["notes", new POutputField("notes")],
            ["ascendants", new LinkListOutputField("Ascendants", "places")],
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
        this.img.set(place.cover_photo)
    }
}


///////////////////////////////////////
// place viewports
///////////////////////////////////////

interface PlaceListViewportOptions extends ObjectListViewportOptions {
}

class PlaceListViewport extends ObjectListViewport<PlaceStreamable, Place> {
    protected options : PlaceListViewportOptions

    constructor(options : PlaceListViewportOptions) {
        super(options)
        this.type = "places"
        this.type_name = "Place"
    }

    protected to_object(streamable : PlaceStreamable) : Place {
        return new Place(streamable)
    }

    protected create_object_list_widget(options : PlaceListWidgetOptions) : PlaceListWidget {
        return new PlaceListWidget(options)
    }

    protected create_object_criteria_widget(options : PlaceCriteriaWidgetOptions) : PlaceCriteriaWidget {
        return new PlaceCriteriaWidget(options)
    }

    protected create_object_search_dialog(options : PlaceSearchDialogOptions) : PlaceSearchDialog {
        return new PlaceSearchDialog(options)
    }
}


interface PlaceDetailViewportOptions extends ObjectDetailViewportOptions<PlaceStreamable> {
}

class PlaceDetailViewport extends ObjectDetailViewport<PlaceStreamable, Place> {
    constructor(options : PlaceDetailViewportOptions) {
        super(options)
        this.type = "places"
        this.type_name = "Place"
    }

    protected to_object(streamable : PlaceStreamable) : Place {
        return new Place(streamable)
    }

    show(element : JQuery) : void {
        super.show(element)

        var mythis = this

        window._place_changed.add_listener(this, (obj : Place) => {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._place_deleted.add_listener(this, (obj_id : number) => {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return {
            'place': this.options.obj_id,
            'place_descendants': true,
        }
    }

    protected create_object_list_widget(options : PlaceListWidgetOptions) : PlaceListWidget {
        return new PlaceListWidget(options)
    }

    protected create_object_detail_infobox(options : PlaceDetailInfoboxOptions) : PlaceDetailInfobox {
        return new PlaceDetailInfobox(options)
    }

    protected create_object_list_viewport(options : PlaceListViewportOptions) : PlaceListViewport {
        return new PlaceListViewport(options)
    }

    protected create_object_change_dialog(options : PlaceChangeDialogOptions) : PlaceChangeDialog {
        return new PlaceChangeDialog(options)
    }

    protected create_object_delete_dialog(options : PlaceDeleteDialogOptions) : PlaceDeleteDialog {
        return new PlaceDeleteDialog(options)
    }
}
