function generic_doer() {
}

input_field.prototype.get = function(input, id) {
    return input.val().trim()
}

input_field.prototype.destroy = function(input) {
}


generic_doer.prototype.search_results_url = function(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/"+ this.type + "/?" + jQuery.param(params)
}

generic_doer.prototype.url = function(object) {
   return "/b/" + this.type + "/" + object.id + "/"
}


generic_doer.prototype.load_search_form = function(search, success, error) {
    ajax({
        url: "/a/" + this.type + "/form/",
        data: search.params,
        success: success,
        error: error,
    })
}

generic_doer.prototype.load_search_results = function(search, page, success, error) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

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


generic_doer.prototype.search_form_a = function(search, title) {
    if (title == null) {
        title = this.display_type + " search"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { this.do_search_form(search, true); return false; })
        .text(title)
    return a
}

generic_doer.prototype.search_results_a = function(search, page, title) {
    if (title == null) {
        title = this.display_plural
    }
    var a = $('<a/>')
        .attr('href', this.search_results_url(search, page))
        .on('click', function() { this.do_search_results(search, page, true); return false; })
        .text(title)
    return a
}

generic_doer.prototype.a = function(object, title) {
    if (object == null) {
        return ""
    }
    if (title == null) {
        title = object.title
    }
    var a = $('<a/>')
        .attr('href', this.url(object))
        .on('click', function() { this.do(object.id, true); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.change_a = function(object, title) {
    if (object == null) {
        return ""
    }
    if (title == null) {
        title = this.display_type + " change"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { this.do_change(object.id, true); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.add_a = function(parent, title) {
    if (title == null) {
        title = this.display_type + " add"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { this.do_add(parent, true); return false; })
        .data('photo', parent.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.delete_a = function(object, title) {
    if (title == null) {
        title = this.display_type + " delete"
    }
    var a = $('<a/>')
        .attr('href', "#")
        .on('click', function() { this.do_delete(object.id, true); return false; })
        .data('photo', object.cover_photo)
        .text(title)
    return a
}

generic_doer.prototype.display_search_form = function(search, results) {
    var dialog = $("<div id='dialog'></div>")
    this.search_dialog(results, dialog)
}

generic_doer.prototype.display_search_results = function(search, results) {
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
        return this.search_results_a(search, page, text)
    }

    var div = $("<div/>").appendTo(cm)
    this.search_details(search, results, div)

    var div = $("<div/>").appendTo(cm)
    this.list(this.get_objects(results), page, last_page, html_page, div)

    var ul = $('<ul class="menu"/>')
    this.list_menu(search, ul)

    append_action_links(ul)

    var mythis = this
    append_jump(object.type, object_a,
        function(ev, item) {
            this.do_object(item.pk, true)
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

    var search = this.get_search(object)

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
        if (object.parent) {
            bc.append(" › ")
            bc.append(this.a(object.parent))
        }
    }

    bc.append(" › ")
    bc.append(escapeHTML(object.title))
}


generic_doer.prototype.display_children = function(element, object, page) {
    var search = {
        results_per_page: get_settings().items_per_page,
        params: { parent: object.id },
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
    var search = this.get_search(object)
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


generic_doer.prototype.do_search_form = function(search, push_history) {
    if (search.params == null) {
        search.params = {}
    }

    var mythis = this
    display_loading()
    this.load_search_form(search,
        function(data) {
            hide_loading()
            mythis.display_search_form(search, data)
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






function album_doer() {
    this.type = "album"
    this.display_type = "Album"
    this.display_plural = "Albums"
    this.list_type = "album_list"
    this.has_children = true
    generic_doer.call(this)
}

album_doer.prototype = new generic_doer()
album_doer.constructor = album_doer

album_doer.prototype.get_search = function(album) {
    return {
        results_per_page: get_settings().items_per_page,
        params: { album: album.id },
    }
}

album_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "album",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parent: parent_album,
        children: [],
    }
}

album_doer.prototype.get_object = function(results) {
    return results.album
}

album_doer.prototype.get_objects = function(results) {
    return results.albums
}

album_doer.prototype.details = function(album, div) {
    $.ui.album_details({album: album}, div)
}

album_doer.prototype.list_menu = function(search, div) {
    $.ui.album_list_menu(search, div)
}


album_doer.prototype.menu = function(album, div) {
    $.ui.album_menu({album: album}, div)
}

album_doer.prototype.list = function(albums, page, last_page, html_page, div) {
    $.ui.album_list({
        albums: albums,
        change_mode: true,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

album_doer.prototype.search_dialog = function(search, dialog) {
    $.ui.album_search_dialog({ search: search }, dialog)
}

album_doer.prototype.search_details = function(search, results, dialog) {
    $.ui.album_search_details({ search: search, results: results }, dialog)
}

album_doer.prototype.change_dialog = function(album, dialog) {
    $.ui.album_change_dialog({ album: album }, dialog)
}

album_doer.prototype.delete_dialog = function(album, dialog) {
    $.ui.album_delete_dialog({ album: album }, dialog)
}

albums = new album_doer()
