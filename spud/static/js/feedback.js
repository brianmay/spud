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

function _change_feedback(feedback, updates) {
    display_loading()
    feedbacks.load_change(
        feedback.id,
        updates,
        function(data) {
            hide_loading()
            reload_page()
        },
        popup_error
    )
}

function _feedback_html(feedback, rights, include_children, include_photo, include_links) {
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

    if (feedback.is_removed && !rights.can_moderate) {
        $("<p></p>")
            .text(" feedback was deleted.")
            .prepend(feedbacks.a(feedback, "This"))
            .appendTo(div)

    } else {
        var datetime
        if (include_links) {
            datetime = feedbacks.a(feedback, "")
        } else {
            datetime = $("<span></span>")
        }
        datetime.text(feedback.submit_datetime.title)

        if (include_photo) {
            $("<div />")
                .image({ photo: feedback.photo, size: get_settings().list_size, include_link: true })
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
                .append(_feedback_html(child, rights, include_children, include_photo, include_links))
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
            this.set(this.options.criteria, this.options.rights)
        }
    },

    set: function(criteria, rights) {
        if (rights.can_moderate) {
            this.add_field("is_public",
                new select_input_field("Is public", [ ["","Don't care"], ["true", "Yes"], ["false", "No" ] ], false))
            this.add_field("is_removed",
                new select_input_field("Is removed", [ ["","Don't care"], ["true", "Yes"], ["false", "No" ] ], false))
        } else {
            this.remove_field("is_public")
            this.remove_field("is_removed")
        }

        this._super(criteria);
    },

    _submit_values: function(values) {
        var criteria = {}

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
        feedbacks.do_search_results(search, 0, function() { mythis.close() })
    },
})


$.widget('spud.feedback_search_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["q", new text_output_field("Search for")],
            ["photo", new photo_output_field("Photo", get_settings().list_size, true)],
            ["instance", new link_output_field("Feedback")],
            ["mode", new text_output_field("Mode")],
            ["root_only", new boolean_output_field("Root Only")],
            ["is_public", new boolean_output_field("Is public")],
            ["is_removed", new boolean_output_field("Is removed")],
        ]
        this._super();

        if (this.options.criteria != null) {
            this.set(this.options.criteria, this.options.rights)
        }
    },

    set: function(criteria, rights) {
        this._super(criteria);
    },

})



$.widget('spud.feedback_details',  $.spud.infobox, {
    _create: function() {
        this.options.fields = [
            ["photo", new photo_output_field("Photo", get_settings().view_size, true)],
            ["rating", new integer_output_field("Rating")],
            ["user", new text_output_field("Name (verified)")],
            ["user_name", new text_output_field("Name (unverified)")],
            ["user_email", new text_output_field("E-Mail (unverified)")],
            ["user_url", new text_output_field("URL (unverified)")],
            ["parent", new html_output_field("In response to")],
            ["ip_address", new text_output_field("IP Address")],
            ["is_public", new boolean_output_field("Is public")],
            ["is_removed", new boolean_output_field("Is removed")],
        ]
        this._super();
        this.feedback_node = $("<div></div>")
            .appendTo(this.element)

        if (this.options.feedback != null) {
            this.set(this.options.feedback, this.options.rights)
        }
    },

    set: function(feedback, rights) {
        this._super(feedback);
        this.set_value("parent", _feedback_html(feedback.parent, rights, false, false, false))
        this.feedback_node.html(_feedback_html(feedback, rights, false, false, true))
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
            this.set(this.options.feedbacks, this.options.rights)
        }
    },

    _destroy: function() {
        this.element.removeClass("feedback_list")
        this.element.find("img")
            .image("destroy")
        this._super()
    },

    set: function(feedback_list, rights) {
        var mythis = this
        this.empty()
        this.element.toggleClass("hidden", feedback_list.length == 0)
        $.each(feedback_list, function(j, feedback) {
            mythis.append_item(_feedback_html(feedback, rights, mythis.options.include_children, true, true))
        })
        return this
    }
})


$.widget('spud.feedback_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.feedback != null) {
            this.set(this.options.feedback, this.options.rights)
        }
    },

    set: function(feedback, rights) {
        this.element.empty()

        var criteria = {
            instance: feedback.id,
        }
        this.add_item(feedbacks.search_form_a(criteria))

        if (rights.can_add) {
            this.add_item(feedbacks.add_a(feedback.photo, feedback, "Reply"))
        }

        if (rights.can_change) {
            this.add_item(feedbacks.change_a(feedback))
        }

        if (rights.can_delete) {
            this.add_item(feedbacks.delete_a(feedback))
        }

        return this
    },
})


$.widget('spud.feedback_list_menu', $.spud.spud_menu, {
    _create: function() {
        this._super()
        if (this.options.search != null) {
            this.set(this.options.rights, this.options.search, this.options.results)
        }
    },

    set: function(rights, search, results) {
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
        this._super();

        this.details = $("<div></div>")
            .insertAfter(this.description)

        if (this.options.feedback != null) {
            this.set(this.options.feedback, this.options.rights)
        }
    },

    _destroy: function() {
        this.details.remove()
        this._super()
    },

    set: function(feedback, rights) {
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
        if (feedback.parent != null) {
            this.details.html("<div>You are responding to the following message:</div>")
            this.details.append(_feedback_html(feedback.parent, rights, false, false, false))
        } else {
            this.details.empty()
        }
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
                if (data.feedback==null) {
                    alert("You feedback has been submitted for moderation. Thank you for your contribution.")
                } else {
                    reload_page()
                }
            },
            popup_error
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
            popup_error
        )
    },
})


function feedback_doer() {
    this.type = "feedback"
    this.display_type = "feedback"
    this.display_plural = "feedbacks"
    this.menu_type = "feedback_menu"
    this.list_menu_type = "feedback_list_menu"
    this.details_type = "feedback_details"
    this.search_details_type = "feedback_search_details"
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

feedback_doer.prototype.do_add = function(photo, parent) {
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
        .on('click', function() { mythis.do_add(photo, parent); return false; })
        .text(title)
    return a
}

feedback_doer.prototype.get_object = function(results) {
    return results.feedback
}

feedback_doer.prototype.get_objects = function(results) {
    return results.feedbacks
}

feedback_doer.prototype.details = function(div) {
    $.spud.feedback_details({}, div)
}

feedback_doer.prototype.list_menu = function(div) {
    $.spud.feedback_list_menu({}, div)
}


feedback_doer.prototype.menu = function(div) {
    $.spud.feedback_menu({}, div)
}

feedback_doer.prototype.list = function(div) {
    $.spud.feedback_list({}, div)
}

feedback_doer.prototype.list_children = function(div) {
    $.spud.feedback_list({
        include_children: true,
    }, div)
}

feedback_doer.prototype.search_dialog = function(criteria, rights, dialog) {
    $.spud.feedback_search_dialog({ criteria: criteria, rights: rights }, dialog)
}

feedback_doer.prototype.search_details = function(dialog) {
    $.spud.feedback_search_details({}, dialog)
}

feedback_doer.prototype.change_dialog = function(feedback, rights, dialog) {
    $.spud.feedback_change_dialog({ feedback: feedback, rights: rights }, dialog)
}

feedback_doer.prototype.delete_dialog = function(feedback, dialog) {
    $.spud.feedback_delete_dialog({ feedback: feedback }, dialog)
}

var feedbacks = new feedback_doer()
