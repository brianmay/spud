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

window._feedback_created = new signal()
window._feedback_changed = new signal()
window._feedback_deleted = new signal()


function _feedback_html(feedback, feedback_a, include_children, include_photo, include_links) {
    if (feedback == null) {
        return null;
    }
    var user=null
    if (feedback.user) {
       user = feedback.user + " (verified)"
    } else {
       user = feedback.user_name + " (unverified)"
    }

    var div = $("<div></div>")
        .addClass("feedback_item")
        .addClass(feedback.is_removed ? "removed" : "")
        .addClass(feedback.is_public ? "public" : "")

    var rights = {
        can_moderate: true,
        cad_add: true,
    }

    if (feedback.is_removed && !rights.can_moderate) {
        $("<p></p>")
            .text(" feedback was deleted.")
            .prepend(feedback_a(feedback))
            .appendTo(div)

    } else {
        var datetime
        if (include_links) {
            datetime = feedback_a(feedback)
        } else {
            datetime = $("<span></span>")
        }
        datetime.text("datetime" + feedback.submit_datetime.title)

        if (include_photo) {
            $("<div />")
                .image({ photo: feedback.photo, size: "thumb", include_link: true })
                .appendTo(div)
        }

        $("<div></div>")
            .addClass("title")
            .text("Response by " + user + " at ")
            .append(datetime)
            .appendTo(div)

        $("<div></div>")
            .text("Rating: "+ feedback.rating)
            .appendTo(div)

        $("<div></div>")
            .p(feedback.comment)
            .appendTo(div)
    }

    if (false && include_links) {
        if (rights.can_add) {
            div
                .append(feedbacks.add_a(feedback.photo, feedback, "Reply"))
                .append(" / ")
        }
        if (rights.can_moderate) {
            if (feedback.is_public) {
                $("<a></a>")
                    .attr("href", "#")
                    .on("click", function() { _change_feedback(feedback, { is_public: false }); return false; })
                    .text("Set private")
                    .appendTo(div)
            } else {
                $("<a></a>")
                    .attr("href", "#")
                    .on("click", function() { _change_feedback(feedback, { is_public: true }); return false; })
                    .text("Set public")
                    .appendTo(div)
            }
            div.append(" / ")
            if (feedback.is_removed) {
                $("<a></a>")
                    .attr("href", "#")
                    .on("click", function() { _change_feedback(feedback, { is_removed: false }); return false; })
                    .text("Undelete")
                    .appendTo(div)
            } else {
                $("<a></a>")
                    .attr("href", "#")
                    .on("click", function() { _change_feedback(feedback, { is_removed: true }); return false; })
                    .text("Delete")
                    .appendTo(div)
            }
            div.append(" / ")
        }

        div
            .append(photo_a(feedback.photo, {}, "Goto photo"))
    }

    if (include_children && feedback.children.length > 0) {
        var ul = $("<ul></ul>")
            .addClass("clear")
            .addClass("feedback_ul")

        $.each(feedback.children, function(j, child) {
            $("<li></li>")
                .append(_feedback_html(child, null, include_children, include_photo, include_links))
                .appendTo(ul)
        })

       div.append(ul)
    }

    $("<div></div>")
        .addClass("clear")
        .appendTo(div)

    return div
}


///////////////////////////////////////
// feedback dialogs
///////////////////////////////////////

$.widget('spud.feedback_search_dialog',  $.spud.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["instance", new ajax_select_field("Feedback", "feedbacks", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ],
                false)],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search feedbacks"
        this.options.description = "Please search for an feedback."
        this.options.button = "Search"
        this._super();
    },

    _submit_values: function(values) {
        var criteria = {}

        $.each(values, function (key, el) {
            if (el != null) { criteria[key] = el }
        });

        var mythis = this
        if (this.options.on_success(criteria)) {
            this.close()
        }
    },
})

$.widget('spud.feedback_change_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.fields = [
            ["rating", new select_input_field("Rating", [
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
            ])],
            ["user_name", new text_input_field("Name", true)],
            ["user_email", new text_input_field("E-Mail", false)],
            ["user_url", new text_input_field("URL", false)],
            ["comment", new p_input_field("Comment", true)],
        ]

        this.options.title = "Change feedback"
        this.options.button = "Save"

        this._type = "feedbacks"
        this._super();
    },

    set: function(feedback) {
        this.obj_id = feedback.id
        if (feedback.id != null) {
            this.set_title("Change feedback")
            this.set_description("Please change feedback " + feedback.title + ".")
        } else {
            this.set_title("Add new feedback")
            this.set_description("Please add new feedback.")
        }

        return this._super(feedback);
    },

    _submit_values: function(values) {
        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values)
        } else {
            this._save("POST", null, values)
        }
    },

    _done: function(data) {
        if (this.obj_id != null) {
            window._feedback_changed.trigger(data)
        } else {
            window._feedback_created.trigger(data)
        }
    },
})


$.widget('spud.feedback_delete_dialog',  $.spud.ajax_dialog, {
    _create: function() {
        this.options.title = "Delete feedback"
        this.options.button = "Delete"

        this._type = "feedbacks"
        this._super();
    },

    set: function(feedback) {
        this.obj_id = feedback.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            feedback.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this._save("DELETE", this.obj_id, {})
    },

    _done: function(data) {
        window._feedback_deleted.trigger(this.obj_id)
    }
})


///////////////////////////////////////
// feedback widgets
///////////////////////////////////////

$.widget('spud.feedback_criteria', $.spud.object_criteria, {
    set: function(criteria) {
        this._type = "feedbacks"
        this._type_name = "Feedback"

        var mythis = this
        mythis.element.removeClass("error")

        this.options.criteria = criteria
        var ul = this.criteria
        this.criteria.empty()

        criteria = $.extend({}, criteria)

        var title = null

        var mode = criteria['mode'] || 'children'
        delete criteria['mode']

        if (criteria['instance'] != null) {
            var instance = criteria['instance']
            title = instance + " / " + mode

            $("<li/>")
                .text("instance" + " = " + instance + " (" + mode + ")")
                .appendTo(ul)

            delete criteria['instance']
        }

        else if (criteria['q'] != null) {
            title = "search " + criteria['q']
        }

        else if (criteria['root_only']) {
            title = "root only"
        }

        else {
            title = "All"
        }

        $.each(criteria, function( index, value ) {
            $("<li/>")
                .text(index + " = " + value)
                .appendTo(ul)
        })

        this._super(criteria)

        if (this.options.on_load != null) {
            this.options.on_load(criteria, title)
        }
    },
})


$.widget('spud.feedback_list', $.spud.object_list, {
    _create: function() {
        this._type = "feedbacks"
        this._type_name = "Feedback"

        this._super()
        this.element
            .removeClass("photo_list")
            .addClass("feedback_list")

        this.ul.addClass("feedback_ul")

        window._feedback_changed.add_listener(this, function(feedback) {
            var li = this._create_li(feedback)
            this._get_item(feedback.id).replaceWith(li)
        })
        window._feedback_deleted.add_listener(this, function(feedback_id) {
            this._get_item(feedback_id).remove()
            this._load_if_required()
        })
    },

    _feedback_a: function(feedback) {
        var mythis = this
        var feedback_list_loader = this.loader

        var title = feedback.title
        var a = $('<a/>')
            .attr('href', root_url() + "feedbacks/" + feedback.id + "/")
            .on('click', function() {
                var child_id = mythis.options.child_id
                if (child_id != null) {
                    var child = $(document.getElementById(child_id))
                    if (child.length > 0) {
                        child.feedback_detail_screen("set", feedback)
                        child.feedback_detail_screen("set_loader", feedback_list_loader)
                        child.feedback_detail_screen("enable")
                        return false
                    }
                }

                var params = {
                    id: child_id,
                    obj: feedback,
                    object_list_loader: feedback_list_loader,
                }
                child = add_screen($.spud.feedback_detail_screen, params)
                return false;
            })
            .data('photo', feedback.photo)
            .text(title)
        return a
    },

    _create_li: function(feedback) {
        var details = []
        if  (feedback.sort_order || feedback.sort_name) {
            details.push($("<div/>").text(feedback.sort_name + " " + feedback.sort_order))
        }
        var li = $("<li/>")
            .append(_feedback_html(
                feedback, $.proxy(this._feedback_a, this), false, true, true))
            .attr('data-id', feedback.id)
        return li
    },

})


$.widget('spud.feedback_detail',  $.spud.object_detail, {
    _create: function() {
        this._type = "feedbacks"
        this._type_name = "Feedback"

        this.options.fields = [
            ["rating", new integer_output_field("Rating")],
            ["user", new text_output_field("Name (verified)")],
            ["user_name", new text_output_field("Name (unverified)")],
            ["user_email", new text_output_field("E-Mail (unverified)")],
            ["user_url", new text_output_field("URL (unverified)")],
            ["parent", new html_output_field("In response to")],
            ["ip_address", new text_output_field("IP Address")],
            ["is_public", new boolean_output_field("Is public")],
            ["is_removed", new boolean_output_field("Is removed")],
            ["submit_datetime", new datetime_output_field("Submit Date/Time")],
            ["comment", new p_output_field("Comment")],
        ]
        this.loader = null

        this.img = $("<div></div>")
            .image({size: "mid", include_link: true})
            .appendTo(this.element)

        this._super();
    },

    set: function(feedback) {
        this.element.removeClass("error")

        var clone = $.extend({}, feedback)
        clone.submit_datetime = [ clone.submit_datetime, clone.utc_offset ]
        this._super(clone)

        this.options.obj = feedback
        this.options.obj_id = feedback.id
        this.img.image("set", feedback.photo)
        if (this.options.on_update) {
            this.options.on_update(feedback)
        }
    },
})


///////////////////////////////////////
// feedback screens
///////////////////////////////////////

$.widget('spud.feedback_list_screen', $.spud.object_list_screen, {
    _create: function() {
        this._type = "feedbacks"
        this._type_name = "Feedback"

        this._super()
    },

    _object_list: $.proxy($.spud.feedback_list, window),
    _object_criteria: $.proxy($.spud.feedback_criteria, window),
    _object_search_dialog: $.proxy($.spud.feedback_search_dialog, window),
})


$.widget('spud.feedback_detail_screen', $.spud.object_detail_screen, {
    _create: function() {
        this._type = "feedbacks"
        this._type_name = "Feedback"

        this._super()

        var mythis = this

        window._feedback_changed.add_listener(this, function(obj) {
            if (obj.id == this.options.obj_id) {
                mythis.set(obj)
            }
        })
        window._feedback_deleted.add_listener(this, function(obj_id) {
            if (obj_id == this.options.obj_id) {
                mythis.close()
            }
        })
    },

    _get_photo_criteria: function() {
        return {
        }
    },

    _object_list: $.proxy($.spud.feedback_list, window),
    _object_detail: $.proxy($.spud.feedback_detail, window),
    _object_list_screen: $.proxy($.spud.feedback_list_screen, window),
    _object_change_dialog: $.proxy($.spud.feedback_change_dialog, window),
    _object_delete_dialog: $.proxy($.spud._object_delete_dialog, window),
})
