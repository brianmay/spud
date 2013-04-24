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

function _change_feedback(feedback, updates) {
    display_loading()
    feedbacks.load_change(
        feedback.id,
        updates,
        function(data) {
            hide_loading()
            reload_page()
        },
        display_error
    )
}

function _feedback_html(feedback, include_children, include_photo, include_links) {
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
        .addClass(feedback.is_removed ? "removed" : "not_removed")
        .addClass(feedback.is_public ? "public" : "not_public")

    if (feedback.is_removed && !feedback.can_moderate) {
        $("<p></p>")
            .text(" feedback was deleted.")
            .prepend(feedbacks.a(feedback, "This"))
            .appendTo(div)

    } else {
        var datetime = feedbacks.a(feedback, "")
            .text(feedback.submit_datetime.title)

        if (include_photo) {
            var img = $("<img />")
                .image({ photo: feedback.photo, size: get_settings().list_size })
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

    if (include_links) {
        if (feedback.can_add) {
            div
                .append(feedbacks.add_a(feedback.photo, feedback, "Reply"))
                .append(" / ")
        }
        if (feedback.can_moderate) {
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
                .append(_feedback_html(child, include_children, include_photo, include_links))
                .appendTo(ul)
        })

       div.append(ul)
    }

    $("<div></div>")
        .addClass("clear")
        .appendTo(div)

    return div
}

$.widget('spud.feedback_search_dialog',  $.spud.form_dialog, {

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

    set: function(initial) {
        if (initial.is_public != null) {
            this.add_field("is_public",
                new select_input_field("Is public", [ ["","Don't care"], ["true", "Yes"], ["false", "No" ] ], false))
        } else {
            this.remove_field("is_public")
        }
        if (initial.is_removed != null) {
            this.add_field("is_removed",
                new select_input_field("Is removed", [ ["","Don't care"], ["true", "Yes"], ["false", "No" ] ], false))
        } else {
            this.remove_field("is_removed")
        }

        this._super(initial);

        if (initial.is_public != null) {
            this.set_value("is_public", initial.is_public ? "true" : "false")
        }
        if (initial.is_removed != null) {
            this.set_value("is_removed", initial.is_removed ? "true" : "false")
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

        var v = values.is_public
        if (v) { criteria.is_public = v }

        var v = values.is_removed
        if (v) { criteria.is_removed = v }

        var search = {
            criteria: criteria
        }

        var mythis = this
        feedbacks.do_search_results(search, 0, true, function() { mythis.close() })
    },
})


$.widget('spud.feedback_search_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["photo", new photo_output_field("Photo", get_settings().view_size)],
            ["instance", new link_output_field("Feedback")],
            ["mode", new text_output_field("Mode")],
            ["root_only", new boolean_output_field("Root Only")],
            ["is_public", new boolean_output_field("Is public")],
            ["is_removed", new boolean_output_field("Is removed")],
        ]
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria)
        }
    },
})



$.widget('spud.feedback_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["photo", new photo_output_field("Photo", get_settings().list_size, true)],
            ["rating", new integer_output_field("Rating")],
            ["user", new text_output_field("Name (verified)")],
            ["user_name", new text_output_field("Name (unverified)")],
            ["user_email", new text_output_field("E-Mail (unverified)")],
            ["user_url", new text_output_field("URL (unverified)")],
            ["parent", new html_output_field("In response to")],
            ["comment", new p_output_field("Response")],
            ["ip_address", new text_output_field("IP Address")],
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
        this.set_value("parent", _feedback_html(initial.parent, false, false, false))
    },

    _destroy: function() {
        this.img.image("destroy")
        this.element.empty()
        this._super()
    },
})


$.widget('spud.feedback_list', $.spud.list_base, {
    options: {
        include_children: false,
    },

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
        this.element.find("img")
            .image("destroy")
        this._super()
    },

    set: function(feedback_list) {
        var mythis = this
        this.empty()
        this.element.toggle(feedback_list.length > 0)
        $.each(feedback_list, function(j, feedback) {
            mythis.append_item(_feedback_html(feedback, mythis.options.include_children, true, true))
        })
        return this
    }
})


$.widget('spud.feedback_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.feedback != null) {
            this.set(this.options.feedback)
        }
    },

    set: function(feedback) {
        this.element.empty()

        if (feedback.can_moderate) {
            var criteria = {
                instance: feedback.id,
                is_public: true,
                is_removed: false,
            }
            this.add_item(feedbacks.search_form_a(criteria, "Extended search"))
        } else {
            var criteria = {
                instance: feedback.id,
            }
            this.add_item(feedbacks.search_form_a(criteria))
        }

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


$.widget('spud.feedback_list_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.search, this.options.results)
        }
    },

    set: function(search, results) {
        this.element.empty()
        if (results.can_moderate) {
            var criteria = $.extend({}, {
                is_public: true,
                is_removed: false,
            }, search.criteria)
            this.add_item(feedbacks.search_form_a(criteria, "Extended search"))
        } else {
            this.add_item(feedbacks.search_form_a(search.criteria))
        }
        return this
    },
})


$.widget('spud.feedback_change_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["rating", new select_input_field("Rating", [
                ["5", "Acceptable"],
                ["6", "Good"],
                ["7", "Excellent"],
                ["8", "Sell it"],
                ["9", "Perfect"],

                ["0", "Delete it"],
                ["1", "Disgusting"],
                ["2", "Very bad"],
                ["3", "Bad"],
                ["4", "Not acceptable"],
            ])],
            ["user_name", new text_input_field("Name", true)],
            ["user_email", new text_input_field("E-Mail", false)],
            ["user_url", new text_input_field("URL", false)],
            ["comment", new p_input_field("Comment", true)],
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
        if (this.feedback.can_moderate) {
            this.add_field("is_public",
                new boolean_input_field("Is public", false))
            this.add_field("is_removed",
                new boolean_input_field("Is removed", false))
        } else {
            this.remove_field("is_public")
            this.remove_field("is_removed")
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


$.widget('spud.feedback_delete_dialog',  $.spud.form_dialog, {
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
    $.spud.feedback_details({feedback: feedback}, div)
}

feedback_doer.prototype.list_menu = function(search, results, div) {
    $.spud.feedback_list_menu({search: search, results: results}, div)
}


feedback_doer.prototype.menu = function(feedback, div) {
    $.spud.feedback_menu({feedback: feedback}, div)
}

feedback_doer.prototype.list = function(feedbacks, page, last_page, html_page, div) {
    $.spud.feedback_list({
        feedbacks: feedbacks,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

feedback_doer.prototype.list_children = function(feedbacks, page, last_page, html_page, div) {
    $.spud.feedback_list({
        feedbacks: feedbacks,
        page: page,
        last_page: last_page,
        html_page: html_page,
        include_children: true,
    }, div)
}

feedback_doer.prototype.search_dialog = function(criteria, dialog) {
    $.spud.feedback_search_dialog({ criteria: criteria }, dialog)
}

feedback_doer.prototype.search_details = function(criteria, dialog) {
    $.spud.feedback_search_details({ criteria: criteria }, dialog)
}

feedback_doer.prototype.change_dialog = function(feedback, dialog) {
    $.spud.feedback_change_dialog({ feedback: feedback }, dialog)
}

feedback_doer.prototype.delete_dialog = function(feedback, dialog) {
    $.spud.feedback_delete_dialog({ feedback: feedback }, dialog)
}

feedbacks = new feedback_doer()
