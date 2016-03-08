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
    _feedback_created : Signal<Feedback>;
    _feedback_changed : Signal<Feedback>;
    _feedback_deleted : Signal<number>;
}

window._feedback_created = new Signal<Feedback>()
window._feedback_changed = new Signal<Feedback>()
window._feedback_deleted = new Signal<number>()


class FeedbackStreamable extends ObjectStreamable {
}

class Feedback extends SpudObject {
    static type : string = "feedbacks"
    _type_feedback : boolean

    constructor(streamable : FeedbackStreamable) {
        super(streamable)
    }

    to_streamable() : FeedbackStreamable {
        let streamable : FeedbackStreamable = <FeedbackStreamable>super.to_streamable()
        return streamable
    }
}

interface FeedbackCriteria extends Criteria {
}

///////////////////////////////////////
// feedback dialogs
///////////////////////////////////////

interface FeedbackSearchDialogOptions extends ObjectSearchDialogOptions {
    on_success(criteria : FeedbackCriteria) : boolean
}

class FeedbackSearchDialog extends ObjectSearchDialog {
    protected options : FeedbackSearchDialogOptions

    constructor(options : FeedbackSearchDialogOptions, element? : JQuery) {
        super(options, element)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Feedback", "feedbacks", false)],
            ["mode", new SelectInputField("Mode",
                [ ["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"] ],
                false)],
            ["root_only", new booleanInputField("Root only", false)],
        ]
        this.options.title = "Search feedbacks"
        this.options.description = "Please search for an feedback."
        this.options.button = "Search"
        super.show(element)
    }
}

interface FeedbackChangeDialogOptions extends ObjectChangeDialogOptions {
}

class FeedbackChangeDialog extends ObjectChangeDialog {
    protected options : FeedbackChangeDialogOptions

    constructor(options : FeedbackChangeDialogOptions, element? : JQuery) {
        this.type = "feedbacks"
        this.type_name = "feedback"
        super(options, element)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["rating", new SelectInputField("Rating", [
                ["5", "5: Acceptable"],
                ["6", "6: Good"],
                ["7", "7: Excellent"],
                ["8", "8: Perfect"],
                ["9", "9: Sell it"],

                ["0", "0: Delete it"],
                ["1", "1: Think about deleting"],
                ["2", "2: Has some value"],
                ["3", "3: Barely acceptable"],
                ["4", "4: Can't decide"],
            ], true)],
            ["user_name", new TextInputField("Name", true)],
            ["user_email", new TextInputField("E-Mail", false)],
            ["user_url", new TextInputField("URL", false)],
            ["comment", new PInputField("Comment", true)],
        ]

        this.options.title = "Change feedback"
        this.options.button = "Save"

        super.show(element)
    }

    protected save_success(data : FeedbackStreamable) {
        let feedback : Feedback = new Feedback(data)
        if (this.obj.id != null) {
            window._feedback_changed.trigger(feedback)
        } else {
            window._feedback_created.trigger(feedback)
        }
        super.save_success(data)
    }
}

interface FeedbackDeleteDialogOptions extends ObjectDeleteDialogOptions {
}

class FeedbackDeleteDialog extends ObjectDeleteDialog {
    constructor(options : FeedbackDeleteDialogOptions, element? : JQuery) {
        this.type = "feedbacks"
        this.type_name = "feedback"
        super(options, element)
    }

    protected save_success(data : Streamable) {
        window._feedback_deleted.trigger(this.obj_id)
        super.save_success(data)
    }
}


///////////////////////////////////////
// feedback widgets
///////////////////////////////////////

interface FeedbackCriteriaWidgetOptions extends ObjectCriteriaWidgetOptions {
}

class FeedbackCriteriaWidget extends ObjectCriteriaWidget {
    protected options : FeedbackCriteriaWidgetOptions
    protected type : string

    constructor(options : FeedbackCriteriaWidgetOptions, element? : JQuery) {
        this.type = "feedbacks"
        super(options, element)
    }

    set(input_criteria : FeedbackCriteria) {
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


interface FeedbackListWidgetOptions extends ObjectListWidgetOptions {
}

class FeedbackListWidget extends ObjectListWidget<FeedbackStreamable, Feedback> {
    protected options : FeedbackListWidgetOptions

    constructor(options : FeedbackListWidgetOptions, element? : JQuery) {
        this.type = "feedbacks"
        super(options, element)
    }

    protected to_object(streamable : FeedbackStreamable) : Feedback {
        return new Feedback(streamable)
    }

    show(element : JQuery) {
        super.show(element)

        window._feedback_changed.add_listener(this, (feedback) => {
            var li = this.create_li_for_obj(feedback)
            this.get_item(feedback.id).replaceWith(li)
        })
        window._feedback_deleted.add_listener(this, (feedback_id) => {
            this.get_item(feedback_id).remove()
            this.load_if_required()
        })
    }

    protected create_child_viewport() : FeedbackDetailViewport {
        var child_id : string = this.options.child_id
        var params : FeedbackDetailViewportOptions = {
            id: child_id,
            obj: null,
            obj_id: null,
        }
        let viewport : FeedbackDetailViewport
        viewport = new FeedbackDetailViewport(params)
        add_viewport(viewport)
        return viewport;
    }

    protected get_details(obj : Feedback) : Array<JQuery> {
        var details : Array<JQuery> = super.get_details(obj)
        return details
    }

    protected get_description(obj : Feedback) : string {
        return super.get_description(obj)
    }
}

interface FeedbackDetailInfoboxOptions extends InfoboxOptions {
}

class FeedbackDetailInfobox extends Infobox {
    protected options : FeedbackDetailInfoboxOptions
    private img : ImageWidget

    constructor(options : FeedbackDetailInfoboxOptions, element? : JQuery) {
        super(options, element)
    }

    show(element : JQuery) {
        this.options.fields = [
            ["rating", new IntegerOutputField("Rating")],
            ["user", new TextOutputField("Name (verified)")],
            ["user_name", new TextOutputField("Name (unverified)")],
            ["user_email", new TextOutputField("E-Mail (unverified)")],
            ["user_url", new TextOutputField("URL (unverified)")],
            ["parent", new LinkOutputField("In response to", "feedbacks")],
            ["ip_address", new TextOutputField("IP Address")],
            ["is_public", new booleanOutputField("Is public")],
            ["is_removed", new booleanOutputField("Is removed")],
            ["submit_datetime", new DateTimeOutputField("Submit Date/Time")],
            ["comment", new POutputField("Comment")],
        ]

        super.show(element);

        this.img = new ImageWidget({size: "mid", include_link: true})

        let e = $("<div></div>")
            .set_widget(this.img)
            .appendTo(this.element)
    }

    set(feedback : Feedback) {
        this.element.removeClass("error")

        super.set(feedback)

        this.options.obj = feedback
        this.img.set(feedback.cover_photo)
    }
}


///////////////////////////////////////
// feedback viewports
///////////////////////////////////////

interface FeedbackListViewportOptions extends ObjectListViewportOptions {
}

class FeedbackListViewport extends ObjectListViewport<FeedbackStreamable, Feedback> {
    protected options : FeedbackListViewportOptions

    constructor(options : FeedbackListViewportOptions, element? : JQuery) {
        this.type = "feedbacks"
        this.type_name = "Feedback"
        super(options, element)
    }

    protected create_object_list_widget(options : FeedbackListWidgetOptions) : FeedbackListWidget {
        return new FeedbackListWidget(options)
    }

    protected create_object_criteria_widget(options : FeedbackCriteriaWidgetOptions) : FeedbackCriteriaWidget {
        return new FeedbackCriteriaWidget(options)
    }

    protected create_object_search_dialog(options : FeedbackSearchDialogOptions) : FeedbackSearchDialog {
        return new FeedbackSearchDialog(options)
    }
}


interface FeedbackDetailViewportOptions extends ObjectDetailViewportOptions<FeedbackStreamable> {
}

class FeedbackDetailViewport extends ObjectDetailViewport<FeedbackStreamable, Feedback> {
    constructor(options : FeedbackDetailViewportOptions, element? : JQuery) {
        this.type = "feedbacks"
        this.type_name = "Feedback"
        super(options, element)
    }

    protected to_object(streamable : FeedbackStreamable) : Feedback {
        return new Feedback(streamable)
    }

    show(element : JQuery) : void {
        super.show(element)

        var mythis = this

        window._feedback_changed.add_listener(this, (obj : Feedback) => {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._feedback_deleted.add_listener(this, (obj_id : number) => {
            if (obj_id === this.options.obj_id) {
                mythis.remove()
            }
        })
    }

    protected get_photo_criteria() : PhotoCriteria {
        return null
    }

    protected create_object_list_widget(options : FeedbackListWidgetOptions) : FeedbackListWidget {
        return new FeedbackListWidget(options)
    }

    protected create_object_detail_infobox(options : FeedbackDetailInfoboxOptions) : FeedbackDetailInfobox {
        return new FeedbackDetailInfobox(options)
    }

    protected create_object_list_viewport(options : FeedbackListViewportOptions) : FeedbackListViewport {
        return new FeedbackListViewport(options)
    }

    protected create_object_change_dialog(options : FeedbackChangeDialogOptions) : FeedbackChangeDialog {
        return new FeedbackChangeDialog(options)
    }

    protected create_object_delete_dialog(options : FeedbackDeleteDialogOptions) : FeedbackDeleteDialog {
        return new FeedbackDeleteDialog(options)
    }
}
