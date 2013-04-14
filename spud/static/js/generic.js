function generic_doer() {
}

input_field.prototype.get = function(input, id) {
    return input.val().trim()
}

input_field.prototype.destroy = function(input) {
}


generic_doer.prototype.search_results_url = function(search, page) {
    var params = jQuery.extend({}, search.criteria, {
        page: page
    })
    return "/b/"+ this.type + "/?" + jQuery.param(params)
}

generic_doer.prototype.url = function(object) {
   return "/b/" + this.type + "/" + object.id + "/"
}


generic_doer.prototype.load_search_form = function(criteria, success, error) {
    ajax({
        url: "/a/" + this.type + "/form/",
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
        url: "/a/" + this.type + "/results/",
        data: params,
        success: success,
        error: error,
    });
}

generic_doer.prototype.load = function(object_id, success, error) {
    ajax({
        url: "/a/" + this.type + "/" + object_id + "/",
        success: success,
        error: error,
    })
}

generic_doer.prototype.load_change = function(object_id, updates, success, error) {
    var url = "/a/" + this.type + "/add/"
    if (object_id != null) {
        url = "/a/" + this.type + "/"+object_id+"/"
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
        url: "/a/" + this.type + "/" + object_id + "/delete/",
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
        .on('click', function() { mythis.do_search_form(criteria, true); return false; })
        .text(title)
    return a
}

generic_doer.prototype.search_results_a = function(search, page, title) {
    var mythis = this
    if (title == null) {
        title = this.display_plural
    }
    var a = $('<a/>')
        .attr('href', this.search_results_url(search, page))
        .on('click', function() { mythis.do_search_results(search, page, true); return false; })
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
        .on('click', function() { mythis.do_change(object.id, true); return false; })
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
        .on('click', function() { mythis.do_add(parent, true); return false; })
        .data('photo', parent.cover_photo)
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
        .on('click', function() { mythis.do_delete(object.id, true); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.display_search_form = function(criteria) {
    var dialog = $("<div id='dialog'></div>")
    this.search_dialog(criteria, dialog)
}

generic_doer.prototype.display_search_results = function(search, results) {
    var mythis = this

    reset_display()
    var cm = $("#content-main")
    cm.html("")

    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.ceil(results.number_results / search.results_per_page) - 1

    document.title = this.display_type + " list " + (page+1) + "/" + (last_page+1) + " | " + this.display_type + " | Spud"

    $("<h1></h1>")
        .text(this.display_type + " list " + escapeHTML(page+1) + "/" + escapeHTML(last_page+1))
        .appendTo(cm)


    var html_page = function(page, text) {
        return mythis.search_results_a(search, page, text)
    }

    var div = $("<div/>").appendTo(cm)
    this.search_details(results.criteria, div)

    var div = $("<div/>").appendTo(cm)
    this.list(this.get_objects(results), page, last_page, html_page, div)

    var ul = $('<ul class="menu"/>')
    this.list_menu(search, ul)

    append_action_links(ul)

    append_jump(this.type, this.type,
        function(ev, item) {
            mythis.do(item.pk, true)
        }
    )

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › " + this.display_plural)
}


generic_doer.prototype.display = function(object) {
    reset_display()
    var cm = $("#content-main")
    cm.html("")

    document.title = object.title + " | " + this.display_type + " | Spud"
    cm.append("<h1>" + escapeHTML(object.title) +  "</h1>")

    var div = $("<div/>").appendTo(cm)
    this.details(object, div)

    var mythis = this

    if (this.has_children) {
        var al = $("<div class='children' />")
            .appendTo(cm)

        this.list(
            null, null, null,
            function(page, text) {
                    return $("<a/>")
                        .text(text)
                        .attr("href", "#")
                        .on("click", function() { mythis.display_children(al, object, page); return false; })
                },
            al)
        this.display_children(al, object, 0);
    }


    var pl = $("<div/>")
    pl
        .photo_list({ html_page:
            function(page, text) {
                return $("<a/>")
                    .text(text)
                    .attr("href", "#")
                    .on("click", function() { mythis.display_photos(pl, object, page); return false; })
            }
        })
        .appendTo(cm)
     this.display_photos(pl, object, 0);

    var ul = $('<ul class="menu"/>')

    this.menu(object, ul)

    append_action_links(ul)

    var mythis = this
    append_jump(this.type, this.type,
        function(ev, item) {
            mythis.do_object(item.pk, true)
        }
    )

    var bc = $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(this.search_results_a({}, 0, null))

    if (this.has_children) {
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
        criteria: { parent: object.id },
    }
    var mythis = this
    this.load_search_results(search, page,
        function(data) {
            var last_page = Math.ceil(data.number_results / search.results_per_page) - 1
            element[mythis.list_type]("set", mythis.get_objects(data))
            element[mythis.list_type]("set_paginator", page, last_page)
        },
        function(message) {
            // FIXME
        }
    )
}


generic_doer.prototype.display_photos = function(element, object, page) {
    var search = {
        results_per_page: get_settings().items_per_page,
        criteria: this.get_criteria(object)
    }
    load_photo_search_results(search, page,
        function(data) {
            var last_page = Math.ceil(data.number_results / search.results_per_page) - 1
            element.photo_list("set", search, data)
            element.photo_list("set_paginator", page, last_page)
        },
        function(message) {
            // FIXME
        }
    )
}


generic_doer.prototype.display_change = function(object) {
    var dialog = $("<div id='dialog'></div>")
    this.change_dialog(object, dialog)
}


generic_doer.prototype.display_delete = function(object, dialog) {
    var dialog = $("<div id='dialog'></div>")
    this.delete_dialog(object, dialog)
}


generic_doer.prototype.do_search_form = function(criteria, push_history) {
    var mythis = this
    display_loading()
    this.load_search_form(criteria,
        function(data) {
            hide_loading()
            mythis.display_search_form(data.criteria)
        },

        display_error
    )
}

generic_doer.prototype.do_search_results = function(search, page, push_history) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().items_per_page

    var mythis = this
    display_loading()
    this.load_search_results(search, page,
        function(data) {
            hide_loading()
            replace_links()
            update_history(push_history,
                mythis.search_results_url(search, page), {
                    type: "display_search_results",
                    object_type: mythis.type,
                    search: search,
                    page: page,
                });
            mythis.display_search_results(search, data)
        },

        display_error
    )
}


generic_doer.prototype.do = function(object_id, push_history) {
    var mythis = this
    display_loading()
    this.load(object_id,
        function(data) {
            hide_loading()
            replace_links()
            var object = mythis.get_object(data)
            update_history(
                push_history,
                mythis.url(object), {
                    type: "display",
                    object_type: mythis.type,
                    object_id: mythis.get_object(data).id,
                }
            );
            mythis.display(mythis.get_object(data))
        },

        display_error
    )
}


generic_doer.prototype.do_change = function(object_id, push_history) {
    var mythis = this
    display_loading()
    this.load(object_id,
        function(data) {
            hide_loading()
            mythis.display_change(mythis.get_object(data))
        },

        display_error
    )
}


generic_doer.prototype.do_add = function(parent, push_history) {
    this.display_change(
        this.get_new_object(parent)
    )
}


generic_doer.prototype.do_delete = function(object_id, push_history) {
    var mythis = this
    display_loading()
    this.load(object_id,
        function(data) {
            hide_loading()
            this.display_delete(get_object(data))
        },

        display_error
    )
}






