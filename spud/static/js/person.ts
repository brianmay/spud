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


class PersonStreamable extends ObjectStreamable {
    first_name : string
    middle_name : string
    last_name : string
    called : string
    sex : string
    email : string
    dob : string
    dod : string
    notes : string

    work : PlaceStreamable
    home : PlaceStreamable
    mother : PersonStreamable
    father : PersonStreamable
    spouse : PersonStreamable

    grandparents : Array<PersonStreamable>
    uncles_aunts : Array<PersonStreamable>
    parents : Array<PersonStreamable>
    siblings : Array<PersonStreamable>
    cousins : Array<PersonStreamable>
    children : Array<PersonStreamable>
    nephews_nieces : Array<PersonStreamable>
    grandchildren : Array<PersonStreamable>

    work_pk: number
    home_pk: number
    mother_pk: number
    father_pk: number
    spouse_pk: number
}

class Person extends SpudObject {
    static type : string = "persons"
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

    constructor(streamable : PersonStreamable) {
        super(streamable)
        this.first_name = parse_string(streamable.first_name)
        this.middle_name = parse_string(streamable.middle_name)
        this.last_name = parse_string(streamable.last_name)
        this.called = parse_string(streamable.called)
        this.sex = parse_string(streamable.sex)
        this.email = parse_string(streamable.email)
        this.dob = parse_string(streamable.dob)
        this.dod = parse_string(streamable.dod)
        this.notes = parse_string(streamable.notes)

        if (streamable.work != null) {
            this.work = new Place(streamable.work)
        } else {
            this.work = null
        }

        if (streamable.home != null) {
            this.home = new Place(streamable.home)
        } else {
            this.home = null
        }

        if (streamable.mother != null) {
            this.mother = new Person(streamable.mother)
        } else {
            this.mother = null
        }

        if (streamable.father != null) {
            this.father = new Person(streamable.father)
        } else {
            this.father = null
        }

        if (streamable.spouse != null) {
            this.spouse = new Person(streamable.spouse)
        } else {
            this.spouse = null
        }

        if (streamable.grandparents != null) {
            this.grandparents = []
            for (let i=0; i<streamable.grandparents.length; i++) {
                this.grandparents.push(new Person(streamable.grandparents[i]))
            }
        }

        if (streamable.uncles_aunts != null) {
            this.uncles_aunts = []
            for (let i=0; i<streamable.uncles_aunts.length; i++) {
                this.uncles_aunts.push(new Person(streamable.uncles_aunts[i]))
            }
        }

        if (streamable.parents != null) {
            this.parents = []
            for (let i=0; i<streamable.parents.length; i++) {
                this.parents.push(new Person(streamable.parents[i]))
            }
        }

        if (streamable.siblings != null) {
            this.siblings = []
            for (let i=0; i<streamable.siblings.length; i++) {
                this.siblings.push(new Person(streamable.siblings[i]))
            }
        }

        if (streamable.cousins != null) {
            this.cousins = []
            for (let i=0; i<streamable.cousins.length; i++) {
                this.cousins.push(new Person(streamable.cousins[i]))
            }
        }

        if (streamable.children != null) {
            this.children = []
            for (let i=0; i<streamable.children.length; i++) {
                this.children.push(new Person(streamable.children[i]))
            }
        }

        if (streamable.nephews_nieces != null) {
            this.nephews_nieces = []
            for (let i=0; i<streamable.nephews_nieces.length; i++) {
                this.nephews_nieces.push(new Person(streamable.nephews_nieces[i]))
            }
        }

        if (streamable.grandchildren != null) {
            this.grandchildren = []
            for (let i=0; i<streamable.grandchildren.length; i++) {
                this.grandchildren.push(new Person(streamable.grandchildren[i]))
            }
        }
    }

    to_streamable() : PersonStreamable {
        let streamable : PersonStreamable = <PersonStreamable>super.to_streamable()
        streamable.first_name = this.first_name
        streamable.middle_name = this.middle_name
        streamable.last_name = this.last_name
        streamable.called = this.called
        streamable.sex = this.sex
        streamable.email = this.email
        streamable.dob = this.dob
        streamable.dod = this.dod
        streamable.notes = this.notes

        if (this.work != null) {
            streamable.work_pk = this.work.id
        } else {
            streamable.work_pk = null
        }

        if (this.home != null) {
            streamable.home_pk = this.home.id
        } else {
            streamable.home_pk = null
        }

        if (this.mother != null) {
            streamable.mother_pk = this.mother.id
        } else {
            streamable.mother_pk = null
        }

        if (this.father != null) {
            streamable.father_pk = this.father.id
        } else {
            streamable.father_pk = null
        }

        if (this.spouse != null) {
            streamable.spouse_pk = this.spouse.id
        } else {
            streamable.spouse_pk = null
        }

        return streamable
    }
}

interface PersonCriteria extends Criteria {
    mode? : string
    root_only? : boolean
    instance? : number
    q? : string
}

///////////////////////////////////////
// person dialogs
///////////////////////////////////////

interface PersonSearchDialogOptions extends ObjectSearchDialogOptions {
    on_success(criteria : PersonCriteria) : boolean
}

class PersonSearchDialog extends ObjectSearchDialog {
    protected options : PersonSearchDialogOptions

    constructor(options : PersonSearchDialogOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Person", "persons", false)],
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

interface PersonChangeDialogOptions extends ObjectChangeDialogOptions {
}

class PersonChangeDialog extends ObjectChangeDialog {
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
                ["work", new AjaxSelectField("Work", "places", false)],
                ["home", new AjaxSelectField("Home", "places", false)],
                ["mother", new AjaxSelectField("Mother", "persons", false)],
                ["father", new AjaxSelectField("Father", "persons", false)],
                ["spouse", new AjaxSelectField("Spouse", "persons", false)],
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

    protected save_success(data : PersonStreamable) {
        let person : Person = new Person(data)
        if (this.obj.id != null) {
            window._person_changed.trigger(person)
        } else {
            window._person_created.trigger(person)
        }
        super.save_success(data)
    }
}

interface PersonDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class PersonDeleteDialog extends ObjectDeleteDialog {
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

interface PersonCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions {
}

class PersonCriteriaWidget extends ObjectCriteriaWidget {
    protected options : PersonCriteriaWidgetOptions
    protected type : string

    constructor(options : PersonCriteriaWidgetOptions) {
        super(options)
        this.type = "persons"
    }

    set(input_criteria : PersonCriteria) {
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


interface PersonListWidgetOptions extends ObjectListWidgetOptions {
}

class PersonListWidget extends ObjectListWidget<PersonStreamable, Person> {
    protected options : PersonListWidgetOptions

    constructor(options : PersonListWidgetOptions) {
        super(options)
        this.type = "persons"
    }

    protected to_object(streamable : PersonStreamable) : Person {
        return new Person(streamable)
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
            obj: null,
            obj_id: null,
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

interface PersonDetailInfoboxOptions extends InfoboxOptions {
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
            ["work", new LinkOutputField("Work", "places")],
            ["home", new LinkOutputField("Home", "places")],
            ["spouses", new LinkListOutputField("Spouses", "persons")],
            ["notes", new POutputField("Notes")],
            ["grandparents", new LinkListOutputField("Grand Parents", "persons")],
            ["uncles_aunts", new LinkListOutputField("Uncles and Aunts", "persons")],
            ["parents", new LinkListOutputField("Parents", "persons")],
            ["siblings", new LinkListOutputField("Siblings", "persons")],
            ["cousins", new LinkListOutputField("Cousins", "persons")],
            ["children", new LinkListOutputField("Children", "persons")],
            ["nephews_nieces", new LinkListOutputField("Nephews and Nieces", "persons")],
            ["grandchildren", new LinkListOutputField("Grand children", "persons")],
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
        this.img.set(person.cover_photo)
    }
}


///////////////////////////////////////
// person viewports
///////////////////////////////////////

interface PersonListViewportOptions extends ObjectListViewportOptions {
}

class PersonListViewport extends ObjectListViewport<PersonStreamable, Person> {
    protected options : PersonListViewportOptions

    constructor(options : PersonListViewportOptions) {
        super(options)
        this.type = "persons"
        this.type_name = "Person"
    }

    protected create_object_list_widget(options : PersonListWidgetOptions) : PersonListWidget {
        return new PersonListWidget(options)
    }

    protected create_object_criteria_widget(options : PersonCriteriaWidgetOptions) : PersonCriteriaWidget {
        return new PersonCriteriaWidget(options)
    }

    protected create_object_search_dialog(options : PersonSearchDialogOptions) : PersonSearchDialog {
        return new PersonSearchDialog(options)
    }
}


interface PersonDetailViewportOptions extends ObjectDetailViewportOptions<PersonStreamable> {
}

class PersonDetailViewport extends ObjectDetailViewport<PersonStreamable, Person> {
    constructor(options : PersonDetailViewportOptions) {
        super(options)
        this.type = "persons"
        this.type_name = "Person"
    }

    protected to_object(streamable : PersonStreamable) : Person {
        return new Person(streamable)
    }

    show(element : JQuery) : void {
        super.show(element)

        var mythis = this

        window._person_changed.add_listener(this, (obj : Person) => {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._person_deleted.add_listener(this, (obj_id : number) => {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return {
            'person': this.options.obj_id,
        }
    }

    protected create_object_list_widget(options : PersonListWidgetOptions) : PersonListWidget {
        return new PersonListWidget(options)
    }

    protected create_object_detail_infobox(options : PersonDetailInfoboxOptions) : PersonDetailInfobox {
        return new PersonDetailInfobox(options)
    }

    protected create_object_list_viewport(options : PersonListViewportOptions) : PersonListViewport {
        return new PersonListViewport(options)
    }

    protected create_object_change_dialog(options : PersonChangeDialogOptions) : PersonChangeDialog {
        return new PersonChangeDialog(options)
    }

    protected create_object_delete_dialog(options : PersonDeleteDialogOptions) : PersonDeleteDialog {
        return new PersonDeleteDialog(options)
    }
}
