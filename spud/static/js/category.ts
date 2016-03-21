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

class CategoryStreamable extends ObjectStreamable {
    description : string
    sort_order : string
    sort_name : string
    ascendants : Array <CategoryStreamable>
    parent : number
}

class Category extends SpudObject {
    static type : string = "categorys"
    description : string
    sort_order : string
    sort_name : string
    ascendants : Array<Category>
    parent : Category
    _type_category : boolean

    constructor(streamable : CategoryStreamable) {
        super(streamable)
        this.description = parse_string(streamable.description)
        this.sort_order = parse_string(streamable.sort_order)
        this.sort_name = parse_string(streamable.sort_name)
        if (streamable.ascendants != null) {
            this.ascendants = []
            for (let i=0; i<streamable.ascendants.length; i++) {
                this.ascendants.push(new Category(streamable.ascendants[i]))
            }
            if (streamable.ascendants.length > 0) {
                this.parent = this.ascendants[0]
            } else {
                this.parent = null
            }
        }
    }

    to_streamable() : CategoryStreamable {
        let streamable : CategoryStreamable = <CategoryStreamable>super.to_streamable()
        streamable.description = this.description
        streamable.sort_order = this.sort_order
        streamable.sort_name = this.sort_name
        if (this.parent != null) {
            streamable.parent = this.parent.id
        } else {
            streamable.parent = null
        }
        return streamable
    }
}

interface CategoryCriteria extends Criteria {
    mode? : string
    root_only? : boolean
    instance? : number
    q? : string
}

///////////////////////////////////////
// category dialogs
///////////////////////////////////////

interface CategorySearchDialogOptions extends ObjectSearchDialogOptions {
    on_success(criteria : CategoryCriteria) : boolean
}

class CategorySearchDialog extends ObjectSearchDialog {
    protected options : CategorySearchDialogOptions

    constructor(options : CategorySearchDialogOptions) {
        super(options)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Category", "categorys", false)],
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

interface CategoryChangeDialogOptions extends ObjectChangeDialogOptions {
}

class CategoryChangeDialog extends ObjectChangeDialog {
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
            ["parent", new AjaxSelectField("Parent", "categorys", false)],
        ]

        this.options.title = "Change category"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : CategoryStreamable) {
        let category : Category = new Category(data)
        if (this.obj.id != null) {
            window._category_changed.trigger(category)
        } else {
            window._category_created.trigger(category)
        }
        super.save_success(data)
    }
}

interface CategoryDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class CategoryDeleteDialog extends ObjectDeleteDialog {
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

interface CategoryCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions {
}

class CategoryCriteriaWidget extends ObjectCriteriaWidget {
    protected options : CategoryCriteriaWidgetOptions
    protected type : string

    constructor(options : CategoryCriteriaWidgetOptions) {
        super(options)
        this.type = "categorys"
    }

    set(input_criteria : CategoryCriteria) {
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


interface CategoryListWidgetOptions extends ObjectListWidgetOptions {
}

class CategoryListWidget extends ObjectListWidget<CategoryStreamable, Category> {
    protected options : CategoryListWidgetOptions

    constructor(options : CategoryListWidgetOptions) {
        super(options)
        this.type = "categorys"
    }

    protected to_object(streamable : CategoryStreamable) : Category {
        return new Category(streamable)
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
            obj: null,
            obj_id: null,
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

interface CategoryDetailInfoboxOptions extends InfoboxOptions {
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
            ["ascendants", new LinkListOutputField("Ascendants", "categorys")],
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
        this.img.set(category.cover_photo)
    }
}


///////////////////////////////////////
// category viewports
///////////////////////////////////////

interface CategoryListViewportOptions extends ObjectListViewportOptions {
}

class CategoryListViewport extends ObjectListViewport<CategoryStreamable, Category> {
    protected options : CategoryListViewportOptions

    constructor(options : CategoryListViewportOptions) {
        super(options)
        this.type = "categorys"
        this.type_name = "Category"
    }

    protected create_object_list_widget(options : CategoryListWidgetOptions) : CategoryListWidget {
        return new CategoryListWidget(options)
    }

    protected create_object_criteria_widget(options : CategoryCriteriaWidgetOptions) : CategoryCriteriaWidget {
        return new CategoryCriteriaWidget(options)
    }

    protected create_object_search_dialog(options : CategorySearchDialogOptions) : CategorySearchDialog {
        return new CategorySearchDialog(options)
    }
}


interface CategoryDetailViewportOptions extends ObjectDetailViewportOptions<CategoryStreamable> {
}

class CategoryDetailViewport extends ObjectDetailViewport<CategoryStreamable, Category> {
    constructor(options : CategoryDetailViewportOptions) {
        super(options)
        this.type = "categorys"
        this.type_name = "Category"
    }

    protected to_object(streamable : CategoryStreamable) : Category {
        return new Category(streamable)
    }

    show(element : JQuery) : void {
        super.show(element)

        var mythis = this

        window._category_changed.add_listener(this, (obj : Category) => {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._category_deleted.add_listener(this, (obj_id : number) => {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return {
            'category': this.options.obj_id,
            'category_descendants': true,
        }
    }

    protected create_object_list_widget(options : CategoryListWidgetOptions) : CategoryListWidget {
        return new CategoryListWidget(options)
    }

    protected create_object_detail_infobox(options : CategoryDetailInfoboxOptions) : CategoryDetailInfobox {
        return new CategoryDetailInfobox(options)
    }

    protected create_object_list_viewport(options : CategoryListViewportOptions) : CategoryListViewport {
        return new CategoryListViewport(options)
    }

    protected create_object_change_dialog(options : CategoryChangeDialogOptions) : CategoryChangeDialog {
        return new CategoryChangeDialog(options)
    }

    protected create_object_delete_dialog(options : CategoryDeleteDialogOptions) : CategoryDeleteDialog {
        return new CategoryDeleteDialog(options)
    }
}
