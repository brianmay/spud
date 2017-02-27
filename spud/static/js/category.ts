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
    _category_created : Signal<Category>;
    _category_changed : Signal<Category>;
    _category_deleted : Signal<number>;
}

window._category_created = new Signal<Category>()
window._category_changed = new Signal<Category>()
window._category_deleted = new Signal<number>()

window._category_created.add_listener(null, () => {
    window._reload_all.trigger(null);
})

class Category extends SpudObject {
    static type : string = 'categorys'
    description : string
    sort_order : string
    sort_name : string
    ascendants : Array<Category>
    parent : Category
    _type_category : boolean

    constructor(streamable? : PostStreamable) {
        super(Category.type, streamable)
    }

    set_streamable(streamable : PostStreamable) : void {
        super.set_streamable(streamable)

        this.description = get_streamable_string(streamable, 'description')
        this.sort_order = get_streamable_string(streamable, 'sort_order')
        this.sort_name = get_streamable_string(streamable, 'sort_name')

        let ascendants = get_streamable_array(streamable, 'ascendants')
        this.ascendants = []
        for (let i=0; i<ascendants.length; i++) {
            let item : PostStreamable = streamable_to_object(ascendants[i])
            this.ascendants.push(new Category(item))
        }
        if (ascendants.length > 0) {
            let item : PostStreamable = streamable_to_object(ascendants[0])
            this.parent = new Category(item)
        } else {
            this.parent = null
        }
    }

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()
        streamable['description'] = this.description
        streamable['sort_order'] = this.sort_order
        streamable['sort_name'] = this.sort_name
        if (this.parent != null) {
            streamable['parent'] = this.parent.id
        } else {
            streamable['parent'] = null
        }
        return streamable
    }
}

class CategoryCriteria extends Criteria {
    mode : string
    root_only : boolean
    instance : Category
    q : string

    get_streamable() : PostStreamable {
        let streamable : PostStreamable = super.get_streamable()

        let criteria : CategoryCriteria = this
        set_streamable_value(streamable, 'mode', criteria.mode)
        set_streamable_value(streamable, 'root_only', criteria.root_only)
        if (criteria.instance != null) {
            set_streamable_value(streamable, 'instance', criteria.instance.id)
        }
        set_streamable_value(streamable, 'q', criteria.q)
        return streamable
    }

    get_title() : string {
        let criteria : CategoryCriteria = this
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
        let criteria : CategoryCriteria = this
        let result : Array<CriteriaItem> = []

        result.push(new CriteriaItemObject(
            "instance", "Category",
            criteria.instance, new CategoryType()))
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

class CategoryType extends ObjectType<Category, CategoryCriteria> {
    constructor() {
        super(Category.type, "category")
    }

    object_from_streamable(streamable : PostStreamable) : Category {
        let obj = new Category()
        obj.set_streamable(streamable)
        return obj
    }

    criteria_from_streamable(streamable : PostStreamable, on_load : (object : CategoryCriteria) => void) : void {
        let criteria = new CategoryCriteria()

        criteria.mode = get_streamable_string(streamable, 'mode')
        criteria.root_only = get_streamable_boolean(streamable, 'root_only')
        criteria.q = get_streamable_string(streamable, 'q')

        let id = get_streamable_number(streamable, 'instance')
        if (id != null) {
            let obj_type = new CategoryType()
            let loader = obj_type.load(id)
            loader.loaded_item.add_listener(this, (object : Category) => {
                criteria.instance = object
                on_load(criteria)
            })
            loader.on_error.add_listener(this, (message : string) => {
                console.log(message)
                criteria.instance = new Category()
                on_load(criteria)
            })
        } else {
            criteria.instance = null
            on_load(criteria)
        }
    }

    // DIALOGS

    create_dialog(parent : Category) : CategoryChangeDialog {
        let obj : Category = new Category()
        obj.parent = parent

        let params : CategoryChangeDialogOptions = {
            obj: obj,
        }

        let dialog : CategoryChangeDialog = new CategoryChangeDialog(params)
        return dialog
    }

    change_dialog(obj : Category) : CategoryChangeDialog {
        let params : CategoryChangeDialogOptions = {
            obj: obj,
        }

        let dialog : CategoryChangeDialog = new CategoryChangeDialog(params)
        return dialog
    }

    delete_dialog(obj : Category) : CategoryDeleteDialog {
        let params : CategoryDeleteDialogOptions = {
            obj: obj,
        }

        let dialog : CategoryDeleteDialog = new CategoryDeleteDialog(params)
        return dialog
    }

    search_dialog(criteria : CategoryCriteria, on_success : on_success_function<CategoryCriteria>) : CategorySearchDialog {
        let params : CategorySearchDialogOptions = {
            obj: criteria,
            on_success: on_success,
        }

        let dialog : CategorySearchDialog = new CategorySearchDialog(params)
        return dialog
    }

    // WIDGETS

    criteria_widget(criteria : CategoryCriteria) : CategoryCriteriaWidget {
        let params : CategoryCriteriaWidgetOptions = {
            obj: criteria,
        }

        let widget : CategoryCriteriaWidget = new CategoryCriteriaWidget(params)
        return widget
    }

    list_widget(child_id : string, criteria : CategoryCriteria, disabled : boolean) : CategoryListWidget {
        let params : CategoryListWidgetOptions = {
            child_id: child_id,
            criteria: criteria,
            disabled: disabled,
        }

        let widget : CategoryListWidget = new CategoryListWidget(params)
        return widget
    }

    detail_infobox() : Infobox {
        let params : InfoboxOptions = {}
        let widget : Infobox = new CategoryDetailInfobox(params)
        return widget
    }

    // VIEWPORTS

    detail_viewport(object_loader : ObjectLoader<Category, CategoryCriteria>, state : GetStreamable) : CategoryDetailViewport {
        let params : CategoryDetailViewportOptions = {
            object_loader: object_loader,
            object_list_loader: null,
        }

        let viewport : CategoryDetailViewport = new CategoryDetailViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }

    list_viewport(criteria : CategoryCriteria, state : GetStreamable) : CategoryListViewport {
        let params : CategoryListViewportOptions = {
            criteria: criteria
        }
        let viewport : CategoryListViewport = new CategoryListViewport(params)
        if (state != null) {
            viewport.set_streamable_state(state)
        }
        return viewport
    }
}

///////////////////////////////////////
// category dialogs
///////////////////////////////////////

class CategorySearchDialogOptions extends ObjectSearchDialogOptions<CategoryCriteria> {
}

class CategorySearchDialog extends ObjectSearchDialog<CategoryCriteria> {
    protected options : CategorySearchDialogOptions

    constructor(options : CategorySearchDialogOptions) {
        super(options)
    }

    protected new_criteria() : CategoryCriteria {
        return new CategoryCriteria()
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Category", new CategoryType(), false)],
            ["mode", new SelectInputField("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new booleanInputField("Root only", false)],
        ]
        this.options.title = "Search categories"
        this.options.description = "Please search for an category."
        this.options.button = "Search"
        super.show(element)
    }
}

class CategoryChangeDialogOptions extends ObjectChangeDialogOptions {
}

class CategoryChangeDialog extends ObjectChangeDialog<Category> {
    protected options : CategoryChangeDialogOptions

    constructor(options : CategoryChangeDialogOptions) {
        super(options)
        this.type = "categorys"
        this.type_name = "category"
    }

    show(element : JQuery) {
        this.options.fields = [
            ["title", new TextInputField("Title", true)],
            ["description", new PInputField("Description", false)],
            ["cover_photo", new PhotoSelectField("Photo", false)],
            ["sort_name", new TextInputField("Sort Name", false)],
            ["sort_order", new TextInputField("Sort Order", false)],
            ["parent", new AjaxSelectField("Parent", new CategoryType(), false)],
        ]

        this.options.title = "Change category"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : PostStreamable) {
        let category : Category = new Category()
        category.set_streamable(data)
        if (this.obj.id != null) {
            window._category_changed.trigger(category)
        } else {
            window._category_created.trigger(category)
        }
        super.save_success(data)
    }
}

class CategoryDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class CategoryDeleteDialog extends ObjectDeleteDialog<Category> {
    constructor(options : CategoryDeleteDialogOptions) {
        super(options)
        this.type = "categorys"
        this.type_name = "category"
    }

    protected save_success(data : Streamable) {
        window._category_deleted.trigger(this.obj_id)
        super.save_success(data)
    }
}


///////////////////////////////////////
// category widgets
///////////////////////////////////////

class CategoryCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions<CategoryCriteria> {
}

class CategoryCriteriaWidget extends ObjectCriteriaWidget<Category, CategoryCriteria> {
    protected options : CategoryCriteriaWidgetOptions

    constructor(options : CategoryCriteriaWidgetOptions) {
        super(options)
    }
}


class CategoryListWidgetOptions extends ObjectListWidgetOptions<CategoryCriteria> {
}

class CategoryListWidget extends ObjectListWidget<Category, CategoryCriteria> {
    protected options : CategoryListWidgetOptions

    constructor(options : CategoryListWidgetOptions) {
        super(options, new CategoryType())
    }

    show(element : JQuery) {
        super.show(element)

        window._category_changed.add_listener(this, (category) => {
            var li = this.create_li_for_obj(category)
            this.get_item(category.id).replaceWith(li)
        })
        window._category_deleted.add_listener(this, (category_id) => {
            this.get_item(category_id).remove()
            this.load_if_required()
        })
    }

    protected create_child_viewport() : CategoryDetailViewport {
        var child_id : string = this.options.child_id
        var params : CategoryDetailViewportOptions = {
            id: child_id,
            object_loader: null,
            object_list_loader: null,
        }
        let viewport : CategoryDetailViewport
        viewport = new CategoryDetailViewport(params)
        add_viewport(viewport)
        return viewport;
    }

    protected get_details(obj : Category) : Array<JQuery> {
        var details : Array<JQuery> = super.get_details(obj)
        if  (obj.sort_order || obj.sort_name) {
            details.push($("<div/>").text(obj.sort_name + " " + obj.sort_order))
        }
        return details
    }

    protected get_description(obj : Category) : string {
        return obj.description
    }
}

class CategoryDetailInfoboxOptions extends InfoboxOptions {
}

class CategoryDetailInfobox extends Infobox {
    protected options : CategoryDetailInfoboxOptions
    private img : ImageWidget

    constructor(options : CategoryDetailInfoboxOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["title", new TextOutputField("Title")],
            ["sort_name", new TextOutputField("Sort Name")],
            ["sort_order", new TextOutputField("Sort Order")],
            ["description", new POutputField("Description")],
            ["ascendants", new LinkListOutputField("Ascendants", new CategoryType())],
        ]

        super.show(element);

        this.img = new ImageWidget({size: "mid", include_link: true})

        let e = $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
    }

    set(category : Category) {
        this.element.removeClass("error")

        super.set(category)

        this.options.obj = category
        if (category != null) {
            this.img.set(category.cover_photo)
        } else {
            this.img.set(null)
        }
    }
}


///////////////////////////////////////
// category viewports
///////////////////////////////////////

class CategoryListViewportOptions extends ObjectListViewportOptions<CategoryCriteria> {
}

class CategoryListViewport extends ObjectListViewport<Category, CategoryCriteria> {
    protected options : CategoryListViewportOptions

    constructor(options : CategoryListViewportOptions) {
        super(options, new CategoryType())
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


class CategoryDetailViewportOptions extends ObjectDetailViewportOptions<Category, CategoryCriteria> {
}

class CategoryDetailViewport extends ObjectDetailViewport<Category, CategoryCriteria> {
    constructor(options : CategoryDetailViewportOptions) {
        super(options, new CategoryType())
    }

    show(element : JQuery) : void {
        super.show(element)

        window._category_changed.add_listener(this, (obj : Category) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj.id === this_obj_id) {
                this.set(this.obj_type.load(obj.id))
            }
        })
        window._category_deleted.add_listener(this, (obj_id : number) => {
            let this_obj_id : number = this.get_obj_id()
            if (obj_id === this_obj_id) {
                this.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        let criteria : PhotoCriteria = new PhotoCriteria()
        criteria.category = this.get_obj_id()
        criteria.category_descendants = true
        return criteria
    }

    protected get_children_criteria() : CategoryCriteria {
        let criteria : CategoryCriteria = new CategoryCriteria()
        criteria.instance = this.get_obj()
        criteria.mode = 'children'
        return criteria
    }
}
