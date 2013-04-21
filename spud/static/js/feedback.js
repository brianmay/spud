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

function _feedback_html(feedback, children) {
    if (feedback == null) {
        return null;
    }
    var user=feedback.user || feedback.user_name

    var div = $("<div></div>")
        .addClass("feedback_item")

    var datetime = feedbacks.a(feedback, "")
        .text(feedback.submit_datetime.title)

    div.append($("<div></div>")
        .addClass("title")
        .text("Response by " + user + " at ")
        .append(datetime)
    )

    div.append($("<div></div>")
        .text("Rating: "+ feedback.rating))

    div.append($("<div></div>")
        .p(feedback.comment)
    )

    div.append(feedbacks.add_a(feedback.photo, feedback, "Reply"))

    if (children && feedback.children.length > 0) {
        var ul = $("<ul></ul>")
            .addClass("feedback_ul")

        $.each(feedback.children, function(j, child) {
            $("<li></li>")
                .append(_feedback_html(child, true))
                .appendTo(ul)
        })

       div.append(ul)
    }

    return div
}

$.widget('ui.feedback_search_dialog',  $.ui.form_dialog, {

    _create: function() {
        this.options.fields = [
            ["q", new text_input_field("Search for", false)],
            ["photo", new photo_select_field("Photo", false)],
            ["instance", new ajax_select_field("Feedback", "feedback", false)],
            ["mode", new select_input_field("Mode",
                [ ["children", "Children"], ["descendants","Descendants"], ["ascendants","Ascendants"] ])],
            ["root_only", new boolean_input_field("Root only", false)],
        ]
        this.options.title = "Search feedbacks"
        this.options.description = "Please search for an feedback."
        this.options.button = "Search"
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },

    _submit_values: function(values) {
        criteria = {}

        var v = values.q
        if (v) { criteria.q = v }

        var v = values.photo
        if (v) { criteria.photo = v }

        var v = values.instance
        if (v) { criteria.instance = v }

        var v = values.mode
        if (v) { criteria.mode = v }

        var v = values.root_only
        if (v) { criteria.root_only = v }

        var search = {
            criteria: criteria
        }

        var mythis = this
        feedbacks.do_search_results(search, 0, true, function() { mythis.close() })
    },
})


$.widget('ui.feedback_search_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["photo", new photo_output_field("Photo", get_settings().view_size)],
            ["instance", new link_output_field("Feedback")],
            ["mode", new text_output_field("Mode")],
            ["root_only", new text_output_field("Root Only")],
        ]
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },
})



$.widget('ui.feedback_details',  $.ui.infobox, {
    _create: function() {
        this.options.fields = [
            ["photo", new photo_output_field("Photo", get_settings().view_size, true)],
            ["rating", new integer_output_field("Rating")],
            ["user", new text_output_field("Name (verified)")],
            ["user_name", new text_output_field("Name (unverified)")],
            ["user_email", new text_output_field("E-Mail (unverified)")],
            ["user_url", new text_output_field("URL (unverified)")],
            ["parent", new html_output_field("In response to")],
            ["comment", new p_output_field("Response")],
            ["is_public", new boolean_output_field("Is public")],
            ["is_removed", new boolean_output_field("Is removed")],
        ]
        this._super();

        if (this.options.feedback != null) {
            this.set(this.options.feedback)
        }
    },

    set: function(initial) {
        this._super(initial);
        this.set_value("parent", _feedback_html(initial.parent, false))
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('ui.feedback_list', $.ui.list_base, {
    _create: function() {
        this.element.addClass("feedback_list")
        this._super()
        this.ul.addClass("feedback_ul")
        if (this.options.feedbacks != null) {
            this.set(this.options.feedbacks)
        }
    },

    _destroy: function() {
        this.element.removeClass("feedback_list")
        this._super()
    },

    set: function(feedback_list) {
        var mythis = this
        this.empty()
        $.each(feedback_list, function(j, feedback) {
            mythis.append_item(_feedback_html(feedback, true))
        })
        return this
    }
})


$.widget('ui.feedback_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.feedback != null) {
            this.set(this.options.feedback)
        }
    },

    set: function(feedback) {
        this.element.empty()

        var criteria = { feedbacks: feedback.id }

        this.add_item(photo_search_results_a({ criteria: criteria }, 0, "Show photos"))

        this.add_item(
            $("<a href=''>Slideshow</a>")
            .attr("href", photo_search_item_url({ criteria: criteria }, 0, null))
            .on("click", function() {
                set_slideshow_mode()
                do_photo_search_item({ criteria: criteria }, 0, null, true);
                return false;
            }))

        this.add_item(photo_search_form_a(criteria))
        this.add_item(feedbacks.search_form_a({ instance: feedback.id }))

        if (feedback.can_add) {
            this.add_item(feedbacks.add_a(feedback.photo, feedback, "Reply"))
        }

        if (feedback.can_change) {
            this.add_item(feedbacks.change_a(feedback))
        }

        if (feedback.can_delete) {
            this.add_item(feedbacks.delete_a(feedback))
        }

        return this
    },
})


$.widget('ui.feedback_list_menu', $.ui.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search, this.options.results)
        }
    },

    set: function(search, results) {
        this.element.empty()
        this.add_item(feedbacks.search_form_a(search.criteria))
        return this
    },
})


$.widget('ui.feedback_change_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["rating", new select_input_field("Rating", [
                ["0", "Delete it"],
                ["1", "Disgusting"],
                ["2", "Very bad"],
                ["3", "Bad"],
                ["4", "Not acceptable"],

                ["5", "Acceptable"],
                ["6", "Good"],
                ["7", "Excellent"],
                ["8", "Sell it"],
                ["9", "Perfect"],
            ])],
            ["user_name", new text_input_field("Name", false)],
            ["user_email", new text_input_field("E-Mail", false)],
            ["user_url", new text_input_field("URL", false)],
            ["comment", new p_input_field("Description", false)],
        ]

        this.options.title = "Change feedback"
        this.options.button = "Save"
        this._super();

        this.details = $("<div></div>")
            .feedback_details()
            .insertAfter(this.description)

        if (this.options.feedback != null) {
            this.set(this.options.feedback)
        }
    },

    _destroy: function() {
        this.details.remove()
        this._super()
    },

    set: function(feedback) {
        this.feedback = feedback
        if (feedback.id != null) {
            this.set_title("Change feedback")
            this.set_description("Please change feedback " + feedback.title + ".")
        } else {
            this.set_title("Add new feedback")
            this.set_description("Please add new feedback.")
        }
        if (this.feedback.photo == null) {
            error_require_photo()
        }
        this.details.feedback_details("set", feedback)
        return this._super(feedback);
    },

    _submit_values: function(values) {
        var mythis = this
        values = $.extend({}, values, { photo: this.feedback.photo.id })
        if (this.feedback.parent != null) {
            values.parent = this.feedback.parent.id
        }
        display_loading()
        feedbacks.load_change(
            this.feedback.id,
            values,
            function(data) {
                hide_loading()
                mythis.close()
                reload_page()
            },
            display_error
        )
    },
})


$.widget('ui.feedback_delete_dialog',  $.ui.form_dialog, {
    _create: function() {
        this.options.title = "Delete feedback"
        this.options.button = "Delete"
        this._super();

        if (this.options.feedback != null) {
            this.set(this.options.feedback)
        }
    },

    set: function(feedback) {
        this.feedback_id = feedback.id
        this.set_description("Are you absolutely positively sure you really want to delete " +
            feedback.title + "? Go ahead join the dark side. There are cookies.")
    },

    _submit_values: function(values) {
        this.close()
        display_loading()
        feedbacks.load_delete(
            this.feedback_id,
            function(data) {
                hide_loading()
                window.history.go(-1)
            },
            display_error
        )
    },
})


function feedback_doer() {
    this.type = "feedback"
    this.display_type = "feedback"
    this.display_plural = "feedbacks"
    this.list_type = "feedback_list"
    generic_doer.call(this)
    this.has_photos = false
}

feedback_doer.prototype = new generic_doer()
feedback_doer.constructor = feedback_doer

feedback_doer.prototype.get_criteria = function(feedback) {
    return { feedbacks: feedback.id }
}

feedback_doer.prototype.get_new_object = function(photo, parent) {
    return {
        type: "feedback",
        photo: photo,
        parent: parent,
    }
}

feedback_doer.prototype.do_add = function(photo, parent, push_history) {
    close_all_dialog()

    this.display_change(
        this.get_new_object(photo, parent)
    )
}

feedback_doer.prototype.add_a = function(photo, parent, title) {
    var mythis = this
    if (title == null) {
        title = "Add " + this.display_type
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { mythis.do_add(photo, parent, true); return false; })
        .text(title)
    return a
}

feedback_doer.prototype.get_object = function(results) {
    return results.feedback
}

feedback_doer.prototype.get_objects = function(results) {
    return results.feedbacks
}

feedback_doer.prototype.details = function(feedback, div) {
    $.ui.feedback_details({feedback: feedback}, div)
}

feedback_doer.prototype.list_menu = function(search, results, div) {
    $.ui.feedback_list_menu({search: search, results: results}, div)
}


feedback_doer.prototype.menu = function(feedback, div) {
    $.ui.feedback_menu({feedback: feedback}, div)
}

feedback_doer.prototype.list = function(feedbacks, page, last_page, html_page, div) {
    $.ui.feedback_list({
        feedbacks: feedbacks,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

feedback_doer.prototype.search_dialog = function(criteria, dialog) {
    $.ui.feedback_search_dialog({ criteria: criteria }, dialog)
}

feedback_doer.prototype.search_details = function(criteria, dialog) {
    $.ui.feedback_search_details({ criteria: criteria }, dialog)
}

feedback_doer.prototype.change_dialog = function(feedback, dialog) {
    $.ui.feedback_change_dialog({ feedback: feedback }, dialog)
}

feedback_doer.prototype.delete_dialog = function(feedback, dialog) {
    $.ui.feedback_delete_dialog({ feedback: feedback }, dialog)
}

feedbacks = new feedback_doer()
