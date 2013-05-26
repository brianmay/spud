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

function generic_doer() {
    this.has_ancestors = true
    this.has_children = true
    this.has_photos = true
}

generic_doer.prototype.search_results_url = function(search, page) {
    var params = jQuery.extend({}, search.criteria, {
        page: page
    })
    return window.__root_prefix + this.type + "/?" + jQuery.param(params)
}

generic_doer.prototype.url = function(object) {
   return window.__root_prefix + this.type + "/" + object.id + "/"
}


generic_doer.prototype.load_search_form = function(criteria, success, error) {
    ajax({
        url: window.__root_prefix + "a/" + this.type + "/form/",
        data: criteria,
        success: success,
        error: error,
    })
}

generic_doer.prototype.load_search_results = function(search, page, success, error) {
    var first = page * search.results_per_page

    var params = jQuery.extend({}, search.criteria, {
        count: search.results_per_page,
        first: first,
    })

    ajax({
        url: window.__root_prefix + "a/" + this.type + "/results/",
        data: params,
        success: success,
        error: error,
    });
}

generic_doer.prototype.load = function(object_id, success, error) {
    ajax({
        url: window.__root_prefix + "a/" + this.type + "/" + object_id + "/",
        success: success,
        error: error,
    })
}

generic_doer.prototype.load_change = function(object_id, updates, success, error) {
    var url = window.__root_prefix + "a/" + this.type + "/add/"
    if (object_id != null) {
        url = window.__root_prefix + "a/" + this.type + "/"+object_id+"/"
    }
    ajax({
        url: url,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}

generic_doer.prototype.load_delete = function(object_id, success, error) {
    ajax({
        url: window.__root_prefix + "a/" + this.type + "/" + object_id + "/delete/",
        success: success,
        error: error,
        type: "POST",
    })
}


generic_doer.prototype.search_form_a = function(criteria, title) {
    var mythis = this
    if (title == null) {
        title = "Search "+this.display_plural
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { mythis.do_search_form(criteria); return false; })
        .text(title)
    return a
}

generic_doer.prototype.search_results_a = function(search, page, title) {
    var mythis = this
    if (title == null) {
        title = "List "+this.display_plural
    }
    var a = $('<a/>')
        .attr('href', this.search_results_url(search, page))
        .on('click', function() { mythis.do_search_results(search, page); return false; })
        .text(title)
    return a
}

generic_doer.prototype.a = function(object, title) {
    var mythis = this
    if (object == null) {
        return ""
    }
    if (title == null) {
        title = object.title
    }
    var a = $('<a/>')
        .attr('href', this.url(object))
        .on('click', function() { mythis.do(object.id, true); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.change_a = function(object, title) {
    var mythis = this
    if (object == null) {
        return ""
    }
    if (title == null) {
        title = "Change " + this.display_type
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { mythis.do_change(object.id); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.add_a = function(parent, title) {
    var mythis = this
    if (title == null) {
        title = "Add " + this.display_type
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { mythis.do_add(parent); return false; })
        .text(title)
    return a
}

generic_doer.prototype.delete_a = function(object, title) {
    var mythis = this
    if (title == null) {
        title = "Delete " + this.display_type
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { mythis.do_delete(object.id); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.list_results = function(div) {
    this.list(div)
}

generic_doer.prototype.list_children = function(div) {
    this.list(div)
}

generic_doer.prototype.display_search_form = function(criteria, rights) {
    var dialog = $("<div id='dialog'></div>")
    this.search_dialog(criteria, rights, dialog)
}

generic_doer.prototype.setup_search_results = function() {
    if (window.spud_type == this.type+"_search_results") {
        // nothing to do, exit
        return
    }
    window.spud_type = this.type+"_search_results"

    var mythis = this

    replace_links()
    reset_display()
    var cm = $("#content-main")
    cm.html("")

    document.title = "Loading | " + this.display_type + " | Spud"
    cm.append("<h1 id='title'>Loading</h1>")

    var div = $("<div id='search_details'/>").appendTo(cm)
    this.search_details(div)

    var div = $("<div id='list_results'/>").appendTo(cm)
    this.list_results(div)

    var ul = $("<ul id='menu' class='menu'/>")
    this.list_menu(ul)
    append_action_links(ul)

    append_jump(this.type, this.type,
        function(ev, item) {
            mythis.do(item.pk, true)
        }
    )

    $("#breadcrumbs")
        .html("")
        .append(root_a())
}

generic_doer.prototype.display_search_results = function(rights, search, results) {
    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.ceil(results.number_results / search.results_per_page) - 1

    update_history(
        this.search_results_url(search, page), {
            type: "display_search_results",
            object_type: this.type,
            search: search,
            page: page,
        });

    this.setup_search_results()

    var mythis = this


    document.title = this.display_type + " list " + (page+1) + "/" + (last_page+1) + " | " + this.display_type + " | Spud"
    $("#title").text(this.display_type + " list " + escapeHTML(page+1) + "/" + escapeHTML(last_page+1))

    var page_a = function(page, text) {
        return mythis.search_results_a(search, page, text)
    }

    $("#search_details")[this.search_details_type]("set", results.criteria, rights)

    $("#list_results")[mythis.list_type]("option", "page_a", page_a)
    $("#list_results")[mythis.list_type]("set", this.get_objects(results), rights)
    $("#list_results")[mythis.list_type]("set_paginator", page, last_page)

    $("#menu")[this.list_menu_type]("set", rights, search, results)

    $("#breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › " + this.display_plural)
}


generic_doer.prototype.setup = function() {
    if (window.spud_type == this.type+"_display") {
        // nothing to do, exit
        return
    }
    window.spud_type = this.type+"_display"

    replace_links()
    reset_display()
    var cm = $("#content-main")
    cm.html("")

    document.title = "Loading | " + this.display_type + " | Spud"
    cm.append("<h1 id='title'>Loading</h1>")

    var div = $("<div id='details'/>").appendTo(cm)
    this.details(div)

    var mythis = this

    if (this.has_children) {
        var node = $("<div id='children' class='children' />")
            .appendTo(cm)
        this.list_children(node)
    }

    if (this.has_photos) {
        $("<div id='photos'/>")
            .photo_list()
            .appendTo(cm)
    }

    var ul = $("<ul id='menu' class='menu'/>")
    this.menu(ul)
    append_action_links(ul)

    var mythis = this
    append_jump(this.type, this.type,
        function(ev, item) {
            mythis.do(item.pk, true)
        }
    )

    var bc = $("#breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(this.search_results_a({}, 0, null))
}

generic_doer.prototype.display = function(object, rights) {
    update_history(
        this.url(object), {
            type: "display",
            object_type: this.type,
            object_id: object.id,
        }
    );

    this.setup()

    document.title = object.title + " | " + this.display_type + " | Spud"
    $("#title").text(object.title)

    $("#details")[this.details_type]("set", object, rights)

    if (this.has_children) {
        var mythis = this
        var children_node = $("#children")
        children_node[this.list_type](
            "option", "page_a",
            function(page, text) {
                    return $("<a/>")
                        .text(text)
                        .attr("href", "#")
                        .on("click", function() { mythis.display_children(children_node, object, page); return false; })
                }
            )
        this.display_children(children_node, object, 0);
    }

    if (this.has_photos) {
        var mythis = this
        var photos_node = $("#photos")
            .photo_list("option", "page_a",
                function(page, text) {
                    return $("<a/>")
                        .text(text)
                        .attr("href", "#")
                        .on("click", function() { mythis.display_photos(photos_node, object, page); return false; })
                }
            )
         this.display_photos(photos_node, object, 0);
    }

    $("#menu")[this.menu_type]("set", object, rights)

    var bc = $("#breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(this.search_results_a({}, 0, null))

    if (this.has_ancestors) {
        for (var i in object.ancestors) {
            var a = object.ancestors[i]
            bc.append(" › ")
            bc.append(this.a(a))
        }
    }

    bc.append(" › ")
    bc.append(escapeHTML(object.title))
}


generic_doer.prototype.display_children = function(element, object, page) {
    var search = {
        results_per_page: get_settings().items_per_page,
        criteria: { instance: object.id, mode: "children", },
    }
    var mythis = this
    element[this.list_type]("display_loading")
    this.load_search_results(search, page,
        function(data) {
            element[mythis.list_type]("clear_status")
            var last_page = Math.ceil(data.number_results / search.results_per_page) - 1
            element[mythis.list_type]("set", mythis.get_objects(data), data.rights)
            element[mythis.list_type]("set_paginator", page, last_page)
        },
        function(message) {
            element[mythis.list_type]("display_error")
        }
    )
}


generic_doer.prototype.display_photos = function(element, object, page) {
    var search = {
        results_per_page: get_settings().items_per_page,
        criteria: this.get_criteria(object)
    }
    element.photo_list("display_loading")
    load_photo_search_results(search, page,
        function(data) {
            element.photo_list("clear_status")
            var last_page = Math.ceil(data.number_results / search.results_per_page) - 1
            element.photo_list("set", data.rights, search, data)
            element.photo_list("set_paginator", page, last_page)

            cancel_keyboard()
            if (data.rights.can_change && is_edit_mode()) {
                photo_change_keyboard(null, search.criteria, data.number_results)
            }
        },
        function(message) {
            cancel_keyboard()
            element.photo_list("display_error")
        }
    )
}


generic_doer.prototype.display_change = function(object, rights) {
    var dialog = $("<div id='dialog'></div>")
    this.change_dialog(object, rights, dialog)
}


generic_doer.prototype.display_delete = function(object, dialog) {
    var dialog = $("<div id='dialog'></div>")
    this.delete_dialog(object, dialog)
}


generic_doer.prototype.do_search_form = function(criteria) {
    var mythis = this
    close_all_dialog()

    display_loading()
    this.load_search_form(criteria,
        function(data) {
            hide_loading()
            mythis.display_search_form(data.criteria, data.rights)
        },

        function(message) {
            display_error(message)
        }
    )
}

generic_doer.prototype.do_search_results = function(search, page, success) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().items_per_page

    var mythis = this
    display_loading()
    this.load_search_results(search, page,
        function(data) {
            hide_loading()
            mythis.display_search_results(data.rights, search, data)
            if (success) { success() }
        },

        function(message) {
            display_error(message)
        }
    )
}


generic_doer.prototype.do = function(object_id) {
    var mythis = this
    display_loading()
    this.load(object_id,
        function(data) {
            hide_loading()
            var object = mythis.get_object(data)
            mythis.display(mythis.get_object(data), data.rights)
        },

        function(message) {
            display_error(message)
        }
    )
}


generic_doer.prototype.do_change = function(object_id) {
    var mythis = this
    close_all_dialog()

    display_loading()
    this.load(object_id,
        function(data) {
            hide_loading()
            mythis.display_change(mythis.get_object(data), data.rights)
        },

        function(message) {
            display_error(message)
        }
    )
}


generic_doer.prototype.do_add = function(parent) {
    close_all_dialog()

    this.display_change(
        this.get_new_object(parent),
        // FIXME rights
        {}
    )
}


generic_doer.prototype.do_delete = function(object_id) {
    close_all_dialog()

    var mythis = this
    display_loading()
    this.load(object_id,
        function(data) {
            hide_loading()
            mythis.display_delete(mythis.get_object(data))
        },

        function(message) {
            display_error(message)
        }
    )
}






