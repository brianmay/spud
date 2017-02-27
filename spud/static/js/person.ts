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
    _person_created : Signal<Person>;
    _person_changed : Signal<Person>;
    _person_deleted : Signal<number>;
}

window._person_created = new Signal<Person>()
window._person_changed = new Signal<Person>()
window._person_deleted = new Signal<number>()

window._person_created.add_listener(null, () => {
    window._reload_all.trigger(null);
})


class Person extends SpudObject {
    static type : string = 'persons'
    first_name : string
    middle_name : string
    last_name : string
    called : string
    sex : string
    email : string
    dob : string
    dod : string
    notes : string
    work : Place
    home : Place
    mother : Person
    father : Person
    spouse : Person
    grandparents : Array<Person>
    uncles_aunts : Array<Person>
    parents : Array<Person>
    siblings : Array<Person>
    cousins : Array<Person>
    children : Array<Person>
    nephews_nieces : Array<Person>
    grandchildren : Array<Person>
    _type_person : boolean

    constructor(streamable? : PostStreamable) {
        super(Person.type, streamable)
    }

    set_streamable(streamable : PostStreamable) {
        super.set_streamable(streamable)

        this.first_name = get_streamable_string(streamable, 'first_name')
        this.middle_name = get_streamable_string(streamable, 'middle_name')
        this.last_name = get_streamable_string(streamable, 'last_name')
        this.called = get_streamable_string(streamable, 'called')
        this.sex = get_streamable_string(streamable, 'sex')
        this.email = get_streamable_string(streamable, 'email')
        this.dob = get_streamable_string(streamable, 'dob')
        this.dod = get_streamable_string(streamable, 'dod')
        this.notes = get_streamable_string(streamable, 'notes')

        let streamable_work = get_streamable_object(streamable, 'work')
        if (streamable_work != null) {
            this.work = new Place(streamable_work)
        } else {
            this.work = null
        }

        let streamable_home = get_streamable_object(streamable, 'home')
        if (streamable_home != null) {
            this.home = new Place(streamable_home)
        } else {
            this.home = null
        }

        let streamable_mother = get_streamable_object(streamable, 'mother')
        if (streamable_mother != null) {
            this.mother = new Person(streamable_mother)
        } else {
            this.mother = null
        }

        let streamable_father = get_streamable_object(streamable, 'father')
        if (streamable_father != null) {
            this.father = new Person(streamable_father)
        } else {
            this.father = null
        }

        let streamable_spouse = get_streamable_object(streamable, 'spouse')
        if (streamable_spouse != null) {
            this.spouse = new Person(streamable_spouse)
        } else {
            this.spouse = null
        }

        let streamable_grandparents = get_streamable_array(streamable, 'grandparents')
        this.grandparents = []
        for (let i=0; i<streamable_grandparents.length; i++) {
            let item = streamable_to_object(streamable_grandparents[i])
            this.grandparents.push(new Person(item))
        }

        let streamable_uncles_aunts = get_streamable_array(streamable, 'uncles_aunts')
        this.uncles_aunts = []
        for (let i=0; i<streamable_uncles_aunts.length; i++) {
            let item = streamable_to_object(streamable_uncles_aunts[i])
            this.uncles_aunts.push(new Person(item))
        }

        let streamable_parents = get_streamable_array(streamable, 'parents')
        this.parents = []
        for (let i=0; i<streamable_parents.length; i++) {
            let item = streamable_to_object(streamable_parents[i])
            this.parents.push(new Person(item))
        }

        let streamable_siblings = get_streamable_array(streamable, 'siblings')
        this.siblings = []
        for (let i=0; i<streamable_siblings.length; i++) {
            let item = streamable_to_object(streamable_siblings[i])
            this.siblings.push(new Person(item))
        }

        let streamable_cousins = get_streamable_array(streamable, 'cousins')
        this.cousins = []
        for (let i=0; i<streamable_cousins.length; i++) {
            let item = streamable_to_object(streamable_cousins[i])
            this.cousins.push(new Person(item))
        }

        let streamable_children = get_streamable_array(streamable, 'children')
        this.children = []
        for (let i=0; i<streamable_children.length; i++) {
            let item = streamable_to_object(streamable_children[i])
            this.children.push(new Person(item))
        }

        let streamable_nephews_nieces = get_streamable_array(streamable, 'nephews_nieces')
        this.nephews_nieces = []
        for (let i=0; i<streamable_nephews_nieces.length; i++) {
            let item = streamable_to_object(streamable_nephews_nieces[i])
            this.nephews_nieces.push(new Person(item))
        }

        let streamable_grandchildren = get_streamable_array(streamable, 'grandchildren')
        this.grandchildren = []
        for (let i=0; i<streamable_grandchildren.length; i++) {
            let item = streamable_to_object(streamable_grandchildren[i])
            this.grandchildren.push(new Person(item))
        }
    }

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = <PostStreamable>super.get_streamable()
        streamable['first_name'] = this.first_name
        streamable['middle_name'] = this.middle_name
        streamable['last_name'] = this.last_name
        streamable['called'] = this.called
        streamable['sex'] = this.sex
        streamable['email'] = this.email
        streamable['dob'] = this.dob
        streamable['dod'] = this.dod
        streamable['notes'] = this.notes

        if (this.work != null) {
            streamable['work_pk'] = this.work.id
        } else {
            streamable['work_pk'] = null
        }

        if (this.home != null) {
            streamable['home_pk'] = this.home.id
        } else {
            streamable['home_pk'] = null
        }

        if (this.mother != null) {
            streamable['mother_pk'] = this.mother.id
        } else {
            streamable['mother_pk'] = null
        }

        if (this.father != null) {
            streamable['father_pk'] = this.father.id
        } else {
            streamable['father_pk'] = null
        }

        if (this.spouse != null) {
            streamable['spouse_pk'] = this.spouse.id
        } else {
            streamable['spouse_pk'] = null
        }

        return streamable
    }
}

class PersonCriteria extends Criteria {
    mode : string
    root_only : boolean
    instance : Person
    q : string

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()

        let criteria : PersonCriteria = this
        set_streamable_value(streamable, 'mode', criteria.mode)
        set_streamable_value(streamable, 'root_only', criteria.root_only)
        if (criteria.instance != null) {
            set_streamable_value(streamable, 'instance', criteria.instance.id)
        }
        set_streamable_value(streamable, 'q', criteria.q)
        return streamable
    }

    get_title() : string {
        let criteria : PersonCriteria = this
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
        let criteria : PersonCriteria = this
        let result : Array<CriteriaItem> = []

        result.push(new CriteriaItemObject(
            "instance", "Person",
            criteria.instance, new PersonType()))
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

class PersonType extends ObjectType<Person, PersonCriteria> {
    constructor() {
        super(Person.type, "person")
    }

    object_from_streamable(streamable : PostStreamable) : Person {
        let obj = new Person()
        obj.set_streamable(streamable)
        return obj
    }

    criteria_from_streamable(streamable : PostStreamable, on_load : (object : PersonCriteria) => void) : void {
        let criteria = new PersonCriteria()

        criteria.mode = get_streamable_string(streamable, 'mode')
        criteria.root_only = get_streamable_boolean(streamable, 'root_only')
        criteria.q = get_streamable_string(streamable, 'q')

        let id = get_streamable_number(streamable, 'instance')
        if (id != null) {
            let obj_type = new PersonType()
            let loader = obj_type.load(id)
            loader.loaded_item.add_listener(this, (object : Person) => {
                criteria.instance = object
                on_load(criteria)
            })
            loader.on_error.add_listener(this, (message : string) => {
                console.log(message)
                criteria.instance = new Person()
                on_load(criteria)
            })
        } else {
            criteria.instance = null
            on_load(criteria)
        }
    }

    // DIALOGS

    create_dialog(parent : Person) : PersonChangeDialog {
        let obj : Person = new Person()

        if (parent != null) {
            if (parent.sex === "1") {
                obj.father = parent
            } else if (parent.sex === "2") {
                obj.mother = parent
            }
        }

        let params : PersonChangeDialogOptions = {
            obj: obj,
        }

        let dialog : PersonChangeDialog = new PersonChangeDialog(params)
        return dialog
    }

    change_dialog(obj : Person) : PersonChangeDialog {
        let params : PersonChangeDialogOptions = {
            obj: obj,
        }

        let dialog : PersonChangeDialog = new PersonChangeDialog(params)
        return dialog
    }

    delete_dialog(obj : Person) : PersonDeleteDialog {
        let params : PersonDeleteDialogOptions = {
            obj: obj,
        }

        let dialog : PersonDeleteDialog = new PersonDeleteDialog(params)
        return dialog
    }

    search_dialog(criteria : PersonCriteria, on_success : on_success_function<PersonCriteria>) : PersonSearchDialog {
        let params : PersonSearchDialogOptions = {
            obj: criteria,
            on_success: on_success,
        }

        let dialog : PersonSearchDialog = new PersonSearchDialog(params)
        return dialog
    }

    // WIDGETS

    criteria_widget(criteria : PersonCriteria) : PersonCriteriaWidget {
        let params : PersonCriteriaWidgetOptions = {
            obj: criteria,
        }

        let widget : PersonCriteriaWidget = new PersonCriteriaWidget(params)
        return widget
    }

    list_widget(child_id : string, criteria : PersonCriteria, disabled : boolean) : PersonListWidget {
        let params : PersonListWidgetOptions = {
            child_id: child_id,
            criteria: criteria,
            disabled: disabled,
        }

        let widget : PersonListWidget = new PersonListWidget(params)
        return widget
    }

    detail_infobox() : Infobox {
        let params : InfoboxOptions = {}
        let widget : Infobox = new PersonDetailInfobox(params)
        return widget
    }

    // VIEWPORTS

    detail_viewport(object_loader : ObjectLoader<Person, PersonCriteria>, state : GetStreamable) : PersonDetailViewport {
        let params : PersonDetailViewportOptions = {
            object_loader: object_loader,
            object_list_loader: null,
        }

        let viewport : PersonDetailViewport = new PersonDetailViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }

    list_viewport(criteria : PersonCriteria, state : GetStreamable) : PersonListViewport {
        let params : PersonListViewportOptions = {
            criteria: criteria
        }
        let viewport : PersonListViewport = new PersonListViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }
}

///////////////////////////////////////
// person dialogs
///////////////////////////////////////

class PersonSearchDialogOptions extends ObjectSearchDialogOptions<PersonCriteria> {
}

class PersonSearchDialog extends ObjectSearchDialog<PersonCriteria> {
    protected options : PersonSearchDialogOptions

    constructor(options : PersonSearchDialogOptions) {
        super(options)
    }

    protected new_criteria() : PersonCriteria {
        return new PersonCriteria()
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Person", new PersonType(), false)],
            ["mode", new SelectInputField("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new booleanInputField("Root only", false)],
        ]
        this.options.title = "Search persons"
        this.options.description = "Please search for an person."
        this.options.button = "Search"
        super.show(element)
    }
}

class PersonChangeDialogOptions extends ObjectChangeDialogOptions {
}

class PersonChangeDialog extends ObjectChangeDialog<Person> {
    protected options : PersonChangeDialogOptions

    constructor(options : PersonChangeDialogOptions) {
        super(options)
        this.type = "persons"
        this.type_name = "person"
    }

    show(element : JQuery) {
        this.options.pages = [
            {name: 'basic', title: 'Basics', fields: [
                ["cover_photo", new PhotoSelectField("Photo", false)],
                ["first_name", new TextInputField("First name", true)],
                ["middle_name", new TextInputField("Middle name", false)],
                ["last_name", new TextInputField("Last name", false)],
                ["called", new TextInputField("Called", false)],
                ["sex", new SelectInputField("Sex", [ ["1", "Male"], ["2", "Female"] ], true)],
            ]},
            {name: 'connections', title: 'Connections', fields: [
                ["work", new AjaxSelectField("Work", new PlaceType(), false)],
                ["home", new AjaxSelectField("Home", new PlaceType(), false)],
                ["mother", new AjaxSelectField("Mother", new PersonType(), false)],
                ["father", new AjaxSelectField("Father", new PersonType(), false)],
                ["spouse", new AjaxSelectField("Spouse", new PersonType(), false)],
            ]},
            {name: 'other', title: 'Other', fields: [
                ["email", new TextInputField("E-Mail", false)],
                ["dob", new DateInputField("Date of birth", false)],
                ["dod", new DateInputField("Date of death", false)],
                ["notes", new PInputField("Notes", false)],
            ]},
        ]

        this.options.title = "Change person"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : PostStreamable) {
        let person : Person = new Person()
        person.set_streamable(data)
        if (this.obj.id != null) {
            window._person_changed.trigger(person)
        } else {
            window._person_created.trigger(person)
        }
        super.save_success(data)
    }
}

class PersonDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class PersonDeleteDialog extends ObjectDeleteDialog<Person> {
    constructor(options : PersonDeleteDialogOptions) {
        super(options)
        this.type = "persons"
        this.type_name = "person"
    }

    protected save_success(data : Streamable) {
        window._person_deleted.trigger(this.obj_id)
        super.save_success(data)
    }
}


///////////////////////////////////////
// person widgets
///////////////////////////////////////

class PersonCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions<PersonCriteria> {
}

class PersonCriteriaWidget extends ObjectCriteriaWidget<Person, PersonCriteria> {
    protected options : PersonCriteriaWidgetOptions

    constructor(options : PersonCriteriaWidgetOptions) {
        super(options)
    }
}


class PersonListWidgetOptions extends ObjectListWidgetOptions<PersonCriteria> {
}

class PersonListWidget extends ObjectListWidget<Person, PersonCriteria> {
    protected options : PersonListWidgetOptions

    constructor(options : PersonListWidgetOptions) {
        super(options, new PersonType())
    }

    show(element : JQuery) {
        super.show(element)

        window._person_changed.add_listener(this, (person) => {
            var li = this.create_li_for_obj(person)
            this.get_item(person.id).replaceWith(li)
        })
        window._person_deleted.add_listener(this, (person_id) => {
            this.get_item(person_id).remove()
            this.load_if_required()
        })
    }

    protected create_child_viewport() : PersonDetailViewport {
        var child_id : string = this.options.child_id
        var params : PersonDetailViewportOptions = {
            id: child_id,
            object_loader: null,
            object_list_loader: null,
        }
        let viewport : PersonDetailViewport
        viewport = new PersonDetailViewport(params)
        add_viewport(viewport)
        return viewport;
    }

    protected get_details(obj : Person) : Array<JQuery> {
        var details : Array<JQuery> = super.get_details(obj)
        return details
    }

    protected get_description(obj : Person) : string {
        return super.get_description(obj)
    }
}

class PersonDetailInfoboxOptions extends InfoboxOptions {
}

class PersonDetailInfobox extends Infobox {
    protected options : PersonDetailInfoboxOptions
    private img : ImageWidget

    constructor(options : PersonDetailInfoboxOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["middle_name", new TextOutputField("Middle name")],
            ["last_name", new TextOutputField("Last name")],
            ["called", new TextOutputField("Called")],
            ["sex", new SelectOutputField("Sex", [ ["1", "Male"], ["2", "Female"] ]) ],
            ["email", new TextOutputField("E-Mail")],
            ["dob", new TextOutputField("Date of birth")],
            ["dod", new TextOutputField("Date of death")],
            ["work", new LinkOutputField("Work", new PlaceType())],
            ["home", new LinkOutputField("Home", new PlaceType())],
            ["spouses", new LinkListOutputField("Spouses", new PersonType())],
            ["notes", new POutputField("Notes")],
            ["grandparents", new LinkListOutputField("Grand Parents", new PersonType())],
            ["uncles_aunts", new LinkListOutputField("Uncles and Aunts", new PersonType())],
            ["parents", new LinkListOutputField("Parents", new PersonType())],
            ["siblings", new LinkListOutputField("Siblings", new PersonType())],
            ["cousins", new LinkListOutputField("Cousins", new PersonType())],
            ["children", new LinkListOutputField("Children", new PersonType())],
            ["nephews_nieces", new LinkListOutputField("Nephews and Nieces", new PersonType())],
            ["grandchildren", new LinkListOutputField("Grand children", new PersonType())],
        ]

        super.show(element);

        this.img = new ImageWidget({size: "mid", include_link: true})

        let e = $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
    }

    set(person : Person) {
        this.element.removeClass("error")

        super.set(person)

        this.options.obj = person
        if (person != null) {
            this.img.set(person.cover_photo)
        } else {
            this.img.set(null)
        }
    }
}


///////////////////////////////////////
// person viewports
///////////////////////////////////////

class PersonListViewportOptions extends ObjectListViewportOptions<PersonCriteria> {
}

class PersonListViewport extends ObjectListViewport<Person, PersonCriteria> {
    protected options : PersonListViewportOptions

    constructor(options : PersonListViewportOptions) {
        super(options, new PersonType())
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


class PersonDetailViewportOptions extends ObjectDetailViewportOptions<Person, PersonCriteria> {
}

class PersonDetailViewport extends ObjectDetailViewport<Person, PersonCriteria> {
    constructor(options : PersonDetailViewportOptions) {
        super(options, new PersonType())
    }

    show(element : JQuery) : void {
        super.show(element)

        window._person_changed.add_listener(this, (obj : Person) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj.id === this_obj_id) {
                this.set(this.obj_type.load(obj.id))
            }
        })
        window._person_deleted.add_listener(this, (obj_id : number) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj_id === this_obj_id) {
                this.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        let criteria : PhotoCriteria = new PhotoCriteria()
        criteria.person = this.get_obj_id()
        return criteria
    }

    protected get_children_criteria() : PersonCriteria {
        let criteria : PersonCriteria = new PersonCriteria()
        criteria.instance = this.get_obj()
        criteria.mode = 'children'
        return criteria
    }
}
