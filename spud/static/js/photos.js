$.widget('ui.myselectable', $.ui.selectable, {
    _mouseStart: function(event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            this._super( event );
        }
    },
});

$.widget('ui.quickautocomplete', $.ui.autocomplete, {
    _renderItem: function( ul, item ) {
        return $( "<li>" )
            .append( "<a>" + item.label + "<br/>" + item.desc + "</a>" )
            .appendTo( ul );
    },
    _suggest: function( items ) {
        if (items.length != 1) {
            this._super( items );
            return
        }
        var item = items[0]
        if ( false !== this._trigger( "select", null, { item: item } ) ) {
            this._value( item.value );
        }
        // reset the term after the select event
        // this allows custom select handling to work properly
        this.term = this._value();

        this.close();
        this.selectedItem = item;
    }
});

$.widget('ui.autocompletehtml', $.ui.autocomplete, {
    _create: function(){
        this._super();
        this.sizeul = true
    },

    _renderItem: function(ul, item) {
        if (this.sizeul) {
            if(ul.css('max-width')=='none') ul.css('max-width',this.outerWidth());
            this.sizeul = false
        }
        return $("<li></li>")
            .data("item.autocomplete", item)
            .append("<a>" + item.match + "</a>")
            .appendTo(ul);
    },
});

$.widget('ui.ajaxautocomplete',  $.ui.autocompletehtml, {
    options: {
    },

    _create: function(){
        this.id = this.element.id
        var name = this.element.attr("name")

        this.input = $('<input type="hidden"/>')
            .attr("name", name)

        this.deck = $('<div class="results_on_deck"></div>')

        this.text = this.element
            .addClass("ui-autocomplete-input")
            .removeAttr("name")
            .attr("type", "text")
            .attr("autocomplete", "off")
            .attr("role", "textbox")
            .attr("aria-autocomplete", "list")
            .attr("aria-haspopup", "true")
            .wrap("<span></span>")

        this.uidiv = this.text
            .parent()
            .append(this.input)
            .append(this.deck)
            .append("<p class='help'>Enter text to search.</p>")

        this._setInitial()

        var options = this.options
        if (options.type != null) {
            options.source =  "/ajax/ajax_lookup/" + options.type
            delete options.type
        }
        this.element.on(
            this.widgetEventPrefix + "select",
            $.proxy(this._receiveResult, this)
        )
        this._super();
    },

    _setInitial: function() {
        var options = this.options
        if (options.item != null) {
            options.initial = [ options.item.repr, options.item.pk ]
            this.input.attr("value", options.item.pk)
            this._addKiller(options.item)
            delete options.item
        }
    },

    _receiveResult: function(ev, ui) {
        if (this.input.val()) {
            this._kill();
        }
        this.input.val(ui.item.pk);
        this.text.val('');
        this._addKiller(ui.item);
        this._trigger("added", ev, ui.item);
        return false;
    },

    _addKiller: function(item) {
        var killButton = $('<span class="ui-icon ui-icon-trash">X</span> ');
        var div = $("<div></div>")
            .attr("id", this.id+'_on_deck_'+item.pk)
            .append(killButton)
            .append(item.repr)
            .appendTo(this.deck)
        killButton.on("click", $.proxy(
            function(ev) {
                this._kill(item, div);
                return this._trigger("killed", ev, item)
            },
            this))
    },

    _kill: function(item, div) {
        this.input.val('');
        this.deck.children().fadeOut(1.0).remove();
    },

    widget: function() {
        return this.uidiv
    },
})

$.widget('ui.ajaxautocompletemultiple',  $.ui.ajaxautocomplete, {
    _setInitial: function() {
        var options = this.options
        if (options.items != null) {
            if (options.items.length > 0) {
                var value = $.map(options.items, function(v){ return v.pk });
                this.input.val("|" + value.join("|") + "|")
            } else {
                this.input.val("|")
            }
            var mythis = this
            $.each(options.items, function(i, v) {
                mythis._addKiller(v)
            });
        } else {
            this.input.attr("value", "|")
        }
        delete options.items
    },

    _receiveResult: function(ev, ui) {
        prev = this.input.val();

        if (prev.indexOf("|"+ui.item.pk+"|") == -1) {
                this.input.val((prev ? prev : "|") + ui.item.pk + "|");
                this.text.val('');
                this._addKiller(ui.item);
                this._trigger("added",  ev, ui.item);
        }

        return false;
    },

    _kill: function(item, div) {
        this.input.val(this.input.val().replace("|" + item.pk + "|", "|"));
        div.fadeOut().remove();
    },
})

// ********
// * URLS *
// ********
function media_url(file) {
   return media_prefix + file
}


function root_url() {
   return "/b/"
}


function login_url() {
   return "/b/login/"
}


function logout_url() {
   return "/b/logout/"
}


function photo_url(photo) {
   return "/b/photo/"+photo.id+"/"
}


function album_url(album) {
   return "/b/album/"+album.id+"/"
}


function category_url(category) {
   return "/b/category/"+category.id+"/"
}


function place_url(place) {
   return "/b/place/"+place.id+"/"
}


function person_search_url(search) {
    params = {}
    if (search.params != null) {
        params = search.params
    }
    return "/b/person/?" + jQuery.param(params)
}


function person_search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/person/?" + jQuery.param(params)
}


function person_url(person) {
   return "/b/person/"+person.id+"/"
}


function date_url(dt) {
   return "/b/date/"+dt.date+dt.timezone+"/"
}


function search_url(search) {
    params = {}
    if (search.params != null) {
        params = search.params
    }
    return "/b/search/?" + jQuery.param(params)
}


function search_results_url(search, page) {
    var params = jQuery.extend({}, search.params, {
        page: page
    })
    return "/b/search/?" + jQuery.param(params)
}


function search_photo_url(search, n, photo) {
    var params = jQuery.extend({}, search.params, {
        n: n
    })
    id = 0
    if (photo != null) {
        id = photo.id
    }
    return "/b/photo/" + id + "/?" + jQuery.param(params)
}


function settings_url(dt) {
   return "#"
}


// ****************
// * AJAX LOADERS *
// ****************

function load_login(username, password, success, error) {
    $.ajax({
        url: '/a/login/',
        type: "POST",
        dataType : 'json',
        cache: false,
        data: {
            username: username,
            password: password,
        },
        success: success,
        error: error,
    })
}

function load_logout(success, error) {
    $.ajax({
        url: '/a/logout/',
        type: "POST",
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}

function load_photo(photo_id, success, error) {
    $.ajax({
        url: '/a/photo/'+photo_id+'/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


function load_album(album_id, success, error) {
    $.ajax({
        url: '/a/album/'+album_id+'/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


function load_change_album(album_id, updates, success, error) {
    var url = '/a/album/add/'
    if (album_id != null) {
        url = '/a/album/'+album_id+'/'
    }
    $.ajax({
        url: url,
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_delete_album(album_id, success, error) {
    $.ajax({
        url: '/a/album/'+album_id+'/delete/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
    })
}


function load_category(category_id, success, error) {
    $.ajax({
        url: '/a/category/'+category_id+'/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


function load_change_category(category_id, updates, success, error) {
    var url = '/a/category/add/'
    if (category_id != null) {
        url = '/a/category/'+category_id+'/'
    }
    $.ajax({
        url: url,
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_delete_category(category_id, success, error) {
    $.ajax({
        url: '/a/category/'+category_id+'/delete/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
    })
}


function load_place(place_id, success, error) {
    $.ajax({
        url: '/a/place/'+place_id+'/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


function load_change_place(place_id, updates, success, error) {
    var url = '/a/place/add/'
    if (place_id != null) {
        url = '/a/place/'+place_id+'/'
    }
    $.ajax({
        url: url,
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_delete_place(place_id, success, error) {
    $.ajax({
        url: '/a/place/'+place_id+'/delete/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
    })
}


function load_person_search(search, success, error) {
    $.ajax({
        url: '/a/person/',
        dataType : 'json',
        cache: false,
        data: search.params,
        success: success,
        error: error,
    })
    return
}


function load_person_search_results(search, page, success, error) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    $.ajax({
        url: '/a/person/results/',
        dataType : 'json',
        cache: false,
        data: params,
        success: success,
        error: error,
    });
}


function load_person(place_id, success, error) {
    $.ajax({
        url: '/a/person/'+place_id+'/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


function load_change_person(person_id, updates, success, error) {
    var url = '/a/person/add/'
    if (person_id != null) {
        url = '/a/person/'+person_id+'/'
    }
    $.ajax({
        url: url,
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_delete_person(person_id, success, error) {
    $.ajax({
        url: '/a/person/'+person_id+'/delete/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
    })
}


function load_photo_relation(place_id, success, error) {
    $.ajax({
        url: '/a/relation/'+place_id+'/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


function load_change_photo_relation(photo_relation_id, updates, success, error) {
    var url = '/a/relation/add/'
    if (photo_relation_id != null) {
        url = '/a/relation/'+photo_relation_id+'/'
    }
    $.ajax({
        url: url,
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
        data: updates,
    })
}


function load_delete_photo_relation(photo_relation_id, success, error) {
    $.ajax({
        url: '/a/relation/'+photo_relation_id+'/delete/',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
        type: "POST",
    })
}


function load_search(search, success, error) {
    $.ajax({
        url: '/a/search/',
        dataType : 'json',
        cache: false,
        data: search.params,
        success: success,
        error: error,
    })
    return
}


function load_search_results(search, page, success, error) {
    var first = page * search.results_per_page

    var add_params = {
        count: search.results_per_page,
        first: first,
    }
    var params = jQuery.extend({}, search.params, add_params)

    $.ajax({
        url: '/a/search/results/',
        dataType : 'json',
        cache: false,
        data: params,
        success: success,
        error: error,
    });
}


function change_search(search, updates, success, error) {
    var params = jQuery.extend({}, search.params, updates)

    $.ajax({
        url: '/a/search/change/',
        dataType : 'json',
        cache: false,
        data: params,
        success: success,
        error: error,
        type: "POST",
    });
}


function load_search_photo(search, n, success, error) {
    $.ajax({
        url: '/a/search/'+n+'/',
        dataType : 'json',
        cache: false,
        data: search.params,
        success: success,
        error: error,
    })
    return
}


function load_settings(success, error) {
    $.ajax({
        url: '/a/settings',
        dataType : 'json',
        cache: false,
        success: success,
        error: error,
    })
}


// *********
// * LINKS *
// *********

function root_a(title) {
    if (title == null) {
        title = "Home"
    }
    var a = $('<a/>')
        .attr('href', root_url())
        .on('click', function() { do_root(true); return false; })
        .text(title)
    return a
}


function login_a(title) {
    if (title == null) {
        title = "Login"
    }
    var a = $('<a/>')
        .attr('href', login_url())
        .on('click', function() { do_login(true); return false; })
        .text(title)
    return a
}


function logout_a(title) {
    if (title == null) {
        title = "Logout"
    }
    var a = $('<a/>')
        .attr('href', logout_url())
        .on('click', function() { do_logout(); return false; })
        .text(title)
    return a
}


function photo_a(photo, title) {
    if (photo == null) {
        return ""
    }
    if (title == null) {
        title = photo.title
    }
    var a = $('<a/>')
        .attr('href', photo_url(photo))
        .on('click', function() { do_photo(photo.id, true); return false; })
        .data('photo', photo)
        .text(title)
    return a
}


function photo_change_a(photo, fn, title) {
    if (photo == null) {
        return ""
    }
    if (title == null) {
        title = "Change "+photo.title
    }
    var a = $('<a/>')
        .attr('href', photo_url(photo))
        .on('click', function() { fn(photo, { photo: photo.id }, 1); return false; })
        .text(title)
    return a
}

function album_a(album, title) {
    if (album == null) {
        return ""
    }
    if (title == null) {
        title = album.title
    }
    var a = $('<a/>')
        .attr('href', album_url(album))
        .on('click', function() { do_album(album.id, true); return false; })
        .data('photo', album.cover_photo)
        .text(title)
    return a
}


function change_album_a(album, title) {
    if (album == null) {
        return ""
    }
    if (title == null) {
        title = "Change album"
    }
    var a = $('<a/>')
        .attr('href', album_url(album))
        .on('click', function() { do_change_album(album.id, true); return false; })
        .data('photo', album.cover_photo)
        .text(title)
    return a
}


function add_album_a(parent, title) {
    if (title == null) {
        title = "Add album"
    }
    var a = $('<a/>')
        .attr('href', album_url(parent))
        .on('click', function() { do_add_album(parent, true); return false; })
        .data('photo', parent.cover_photo)
        .text(title)
    return a
}


function delete_album_a(album, title) {
    if (title == null) {
        title = "Delete album"
    }
    var a = $('<a/>')
        .attr('href', album_url(album))
        .on('click', function() { do_delete_album(album.id, true); return false; })
        .data('photo', album.cover_photo)
        .text(title)
    return a
}


function category_a(category, title) {
    if (category == null) {
        return ""
    }
    if (title == null) {
        title = category.title
    }
    var a = $('<a/>')
        .attr('href', category_url(category))
        .on('click', function() { do_category(category.id, true); return false; })
        .data('photo', category.cover_photo)
        .text(title)
    return a
}


function change_category_a(category, title) {
    if (category == null) {
        return ""
    }
    if (title == null) {
        title = "Change category"
    }
    var a = $('<a/>')
        .attr('href', category_url(category))
        .on('click', function() { do_change_category(category.id, true); return false; })
        .data('photo', category.cover_photo)
        .text(title)
    return a
}


function add_category_a(parent, title) {
    if (title == null) {
        title = "Add category"
    }
    var a = $('<a/>')
        .attr('href', category_url(parent))
        .on('click', function() { do_add_category(parent, true); return false; })
        .data('photo', parent.cover_photo)
        .text(title)
    return a
}


function delete_category_a(category, title) {
    if (title == null) {
        title = "Delete category"
    }
    var a = $('<a/>')
        .attr('href', category_url(category))
        .on('click', function() { do_delete_category(category.id, true); return false; })
        .data('photo', category.cover_photo)
        .text(title)
    return a
}


function place_a(place, title) {
    if (place == null) {
        return ""
    }
    if (title == null) {
        title = place.title
    }
    var a = $('<a/>')
        .attr('href', place_url(place))
        .on('click', function() { do_place(place.id, true); return false; })
        .data('photo', place.cover_photo)
        .text(title)
    return a
}


function change_place_a(place, title) {
    if (place == null) {
        return ""
    }
    if (title == null) {
        title = "Change place"
    }
    var a = $('<a/>')
        .attr('href', place_url(place))
        .on('click', function() { do_change_place(place.id, true); return false; })
        .data('photo', place.cover_photo)
        .text(title)
    return a
}


function add_place_a(parent, title) {
    if (title == null) {
        title = "Add place"
    }
    var a = $('<a/>')
        .attr('href', place_url(parent))
        .on('click', function() { do_add_place(parent, true); return false; })
        .data('photo', parent.cover_photo)
        .text(title)
    return a
}


function delete_place_a(place, title) {
    if (title == null) {
        title = "Delete place"
    }
    var a = $('<a/>')
        .attr('href', place_url(place))
        .on('click', function() { do_delete_place(place.id, true); return false; })
        .data('photo', place.cover_photo)
        .text(title)
    return a
}


function person_search_a(search, title) {
    if (title == null) {
        title = "Person search"
    }
    var a = $('<a/>')
        .attr('href', person_search_url(search))
        .on('click', function() { do_person_search(search, true); return false; })
        .text(title)
    return a
}


function person_search_results_a(search, page, title, accesskey) {
    if (title == null) {
        title = "People"
    }
    var a = $('<a/>')
        .attr('href', person_search_results_url(search, page))
        .on('click', function() { do_person_search_results(search, page, true); return false; })
        .text(title)

    if (accesskey != null) {
        a.attr('accesskey', accesskey)
    }
    return a
}


function person_a(person, title) {
    if (person == null) {
        return ""
    }
    if (title == null) {
        title = person.title
    }
    var a = $('<a/>')
        .attr('href', person_url(person))
        .on('click', function() { do_person(person.id, true); return false; })
        .data('photo', person.cover_photo)
        .text(title)
    return a
}


function change_person_a(person, title) {
    if (person == null) {
        return ""
    }
    if (title == null) {
        title = "Change person"
    }
    var a = $('<a/>')
        .attr('href', person_url(person))
        .on('click', function() { do_change_person(person.id, true); return false; })
        .data('photo', person.cover_photo)
        .text(title)
    return a
}


function add_person_a(title) {
    if (title == null) {
        title = "Add person"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_add_person(true); return false; })
        .text(title)
    return a
}


function delete_person_a(person, title) {
    if (title == null) {
        title = "Delete person"
    }
    var a = $('<a/>')
        .attr('href', person_url(person))
        .on('click', function() { do_delete_person(person.id, true); return false; })
        .data('photo', person.cover_photo)
        .text(title)
    return a
}


function change_photo_relation_a(photo_relation, title) {
    if (photo_relation == null) {
        return ""
    }
    if (title == null) {
        title = "Change photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_change_photo_relation(photo_relation.id, true); return false; })
        .data('photo', photo_relation.cover_photo)
        .text(title)
    return a
}


function add_photo_relation_a(photo, title) {
    if (title == null) {
        title = "Add photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_add_photo_relation(photo, true); return false; })
        .text(title)
    return a
}


function delete_photo_relation_a(photo_relation, title) {
    if (title == null) {
        title = "Delete photo_relation"
    }
    var a = $('<a/>')
        .attr('href', '#')
        .on('click', function() { do_delete_photo_relation(photo_relation.id, true); return false; })
        .data('photo', photo_relation.cover_photo)
        .text(title)
    return a
}


function search_a(search, title) {
    if (title == null) {
        title = "Photo search"
    }
    var a = $('<a/>')
        .attr('href', search_url(search))
        .on('click', function() { do_search(search, true); return false; })
        .text(title)
    return a
}


function search_results_a(search, page, title, accesskey) {
    if (title == null) {
        title = "Photos"
    }
    var a = $('<a/>')
        .attr('href', search_results_url(search, page))
        .on('click', function() { do_search_results(search, page, true); return false; })
        .text(title)

    if (accesskey != null) {
        a.attr('accesskey', accesskey)
    }
    return a
}


function search_photo_a(search, n, photo, title, accesskey) {
    if (title == null) {
        title = "Photo "+n
    }
    var a = $('<a/>')
        .attr('href', search_photo_url(search, n, photo))
        .on('click', function() { do_search_photo(search, n, photo.id, true); return false; })
        .data('photo', photo)
        .text(title)

    if (accesskey != null) {
        a.attr('accesskey', accesskey)
    }
    return a
}


function settings_a(title) {
    if (title == null) {
        title = "Settings"
    }
    var a = $('<a/>')
        .attr('href', settings_url())
        .on('click', function() { do_settings(true); return false; })
        .text(title)
    return a
}


function datetime_a(dt) {
    if (dt == null) {
        return null
    }
    var a = $('<a/>')
        .attr('href', date_url(dt))
        .on('click', function() { do_search(search, true); return false; })
        .text(dt.date + " " + dt.time + " " + dt.timezone)
    return a
}


// ***********
// * HELPERS *
// ***********

function get_settings() {
    var a = []
    if (localStorage.settings != null)
        if (localStorage.settings != "")
            a = localStorage.settings.split(",")

    var settings
    if (a.length < 5) {
        settings = {
            photos_per_page: 10,
            persons_per_page: 10,
            list_size: "thumb",
            view_size: "mid",
            click_size: "large",
        }
    } else {
        settings = {
            photos_per_page: Number(a[0]),
            persons_per_page: Number(a[1]),
            list_size: a[2],
            view_size: a[3],
            click_size: a[4],
        }
    }
    return settings
}


function set_settings(settings) {
    var a = [
        settings.photos_per_page,
        settings.persons_per_page,
        settings.list_size,
        settings.view_size,
        settings.click_size,
    ]
    localStorage.settings = a.join(",")
}


function get_selection() {
    var selection = []
    if (localStorage.selection != null)
        if (localStorage.selection != "")
            selection = localStorage.selection.split(",")
    selection = $.map(selection, function(n){ return Number(n) });
    return selection
}


function set_selection(selection) {
    localStorage.selection = selection.join(",")
    update_selection()
}


function add_selection(photo) {
    var selection = get_selection()
    if (selection.indexOf(photo.id) == -1) {
        selection.push(photo.id)
    }
    set_selection(selection)
}


function del_selection(photo) {
    var selection = get_selection()
    var index = selection.indexOf(photo.id)
    if (index != -1) {
        selection.splice(index, 1);
    }
    set_selection(selection)
}


function is_photo_selected(photo) {
    var selection = get_selection()
    var index = selection.indexOf(photo.id)
    return index != -1
}


function set_edit_mode() {
    $(document).data("mode", "edit")
}

function set_normal_mode() {
    $(document).data("mode", null)
}

function is_edit_mode() {
    return ($(document).data("mode") == "edit")
}

function update_history(push_history, url, state) {
    if (push_history) {
        window.history.pushState(state, document.title, url);
    } else {
        window.history.replaceState(state, document.title, url);
    }
}


function get_photo_style(data) {
    if (data.action==null)
        return ""
    elif (data.action=="D")
        return "photo-D"
    elif (data.action=="R"
            || data.action=="M"
            || data.action=="auto"
            || data.action=="90" || data.action=="180" || data.action=="270")
        return "photo-R"
    return ""
}


function resize_photo(img, width, height) {
    width = width || img.naturalWidth
    height = height || img.naturalHeight
    var aspect = width/height

    var subWidth = 80
    if (window.innerWidth <= 700) {
        subWidth = 0
    }
    if (width > window.innerWidth-subWidth) {
        width = window.innerWidth-subWidth
        height = width / aspect
    }

    if (height > window.innerHeight) {
        height = window.innerHeight
        width = height * aspect
    }

    if (window.innerWidth <= 700) {
        img.style.marginLeft = ((window.innerWidth-width)/2) + "px"
    } else {
        img.style.marginLeft = "0px"
    }

    img.width = width
    img.height = height
}


function parse_form_string(string) {
    return jQuery.trim(string)
}


// ***************
// * EVENTS, ETC *
// ***************

window.onpopstate = function(event) {
    var state=event.state
    if (state != null) {
//        alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
        if (state.type == 'root') {
            do_root(false)
        } else if (state.type == 'display_photo') {
            do_photo(state.photo_id, false)
        } else if (state.type == 'display_album') {
            do_album(state.album_id, false)
        } else if (state.type == 'display_category') {
            do_category(state.category_id, false)
        } else if (state.type == 'display_place') {
            do_place(state.place_id, false)
        } else if (state.type == 'display_person_search_results') {
            do_person_search_results(state.search, state.page, false)
        } else if (state.type == 'display_person') {
            do_person(state.person_id, false)
        } else if (state.type == 'display_search_photo') {
            do_search_photo(state.search, state.n, state.photo_id, false)
        } else if (state.type == 'display_search_results') {
            do_search_results(state.search, state.page, false)
        } else if (state.type == 'settings') {
            do_settings(false)
        }
    }
};


$(document)
        .tooltip({
            items: "a",
            content: function() {
                var photo = $(this).data('photo')
                var image = null
                if (photo != null) {
                    var size = get_settings().list_size
                    var style = get_photo_style(photo)
                    var image = photo.thumb[size]
                }
                if (image != null) {
                    return $("<img />")
                        .attr("class", style)
                        .attr("src", image.url)
                        .attr("alt", photo.title)
                        .attr("width", image.width)
                        .attr("height", image.height)
                }
                return null
            },
        })


function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", $.jCookie("csrftoken"));
        }
    }
});


// ****************
// * HTML helpers *
// ****************

// List of HTML entities for escaping.
var htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

// Regex containing the keys listed immediately above.
var htmlEscaper = /[&<>"'\/]/g;

// Escape a string for HTML interpolation.
function escapeHTML(string) {
    return ('' + string).replace(htmlEscaper, function(match) {
        return htmlEscapes[match];
    });
};

function p(text){
    var lines = text.split(/\n\n/);
    var htmls = [];
    for (var i = 0 ; i < lines.length ; i++) {
        var p = $("<p></p>")
            .html(escapeHTML(lines[i]).replace(/[\r\n]+/, "<br/>"))
        htmls.push(p)
    }
    return htmls;
}


function display_loading() {
    cancel_keyboard()

    var message = $("<div></div>")

    $("<img/>")
        .attr('src', media_url("img/ajax-loader.gif"))
        .appendTo(message)

    message.append("<br/>Loading. Please Wait.<br/>")

    $.blockUI({ message: message })
}


function display_error() {
    var message = $("<div></div>")

    $("<img/>")
        .attr('src', media_url("img/error.png"))
        .appendTo(message)

    message.append("<br/>An error occured.<br/>")

    $("<input type='button' value='Acknowledge' />")
        .click(function() { $.unblockUI() })
        .appendTo(message)

    $.blockUI({ message: message })
}


function hide_status()
{
    $.unblockUI()
}


function reload_page()
{
    window.onpopstate({state: window.history.state})
}

function replace_links() {
    $("#content-related").html("")

    var ul = $('<ul class="menu"/>')

    $("<li>")
        .on("click", function() { do_album(1, true); return false; })
        .append(album_a({id: 1}, "Albums"))
        .appendTo(ul)

    $("<li>")
        .on("click", function() { do_category(1, true); return false; })
        .append(category_a({id: 1}, "Categories"))
        .appendTo(ul)

    $("<li>")
        .on("click", function() { do_place(1, true); return false; })
        .append(place_a({id: 1}, "Places"))
        .appendTo(ul)

    $("<li>")
        .on("click", function() { load_person_search({}, true); return false; })
        .append(person_search_results_a({}, 0))
        .appendTo(ul)

    $("<li>")
        .on("click", function() { do_search({}, true); return false; })
        .append(search_results_a({}, 0))
        .appendTo(ul)

    $('<div class="module"/>')
        .append("<h2>Quick links</h2>")
        .append(ul)
        .appendTo("#content-related")

    $('<div id="selection" class="module"/>')
        .appendTo("#content-related")
    update_selection()
}

function update_selection() {
    selection = get_selection()

    var search = {
        params: {
            photo: selection.join(".")
        }
    }

    var ul = $('<ul class="menu"/>')

    if (selection.length > 0) {
        $("<li>")
            .on("click", function() { do_search_results(search, true); return false; })
            .append(search_results_a(search, 0, "Show"))
            .appendTo(ul)

        $("<li>")
            .on("click", function() { set_selection([]); reload_page(); return false; })
            .html("<a href='#'>Clear</a>")
            .appendTo(ul)
    }

    $('#selection')
        .empty()
        .append("<h2>Selection</h2>")
        .append(escapeHTML(selection.length + " photos selected"))
        .append(ul)
}

function append_action_links(ul) {
    $('<div class="module"/>')
        .append("<h2>Actions</h2>")
        .append(ul)
        .appendTo("#content-related")
}


function append_jump(id, type, onadded) {
    var f = $("<form method='get' />")

    var ac = $("<input/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .appendTo(f)
        .ajaxautocomplete({ type: type })
        .on('ajaxautocompleteadded', onadded)

    var module = $('<div class="module"/>')
        .append("<h2>Jump</h2>")
        .append(f)
        .appendTo("#content-related")
}


function update_session(session) {
    ut = $("#user-tools")
        .html("")

    ut.append("Welcome, ")

    if (session.is_authenticated) {
        ut.append("<strong>" + escapeHTML(session.first_name + " " + session.last_name) + "</strong> ")
        ut.append(logout_a())
    } else {
        ut.append("<strong>" + escapeHTML("guest") + "</strong> ")
        ut.append(login_a())
    }
    ut.append(" ")
    ut.append(settings_a())
}


function append_persons(tag, persons) {
    if (persons.length==0) {
        return ""
    }
    div = $("<div class='people' />")
    var text = ""
    var sep = ""
    for (var i in persons) {
        var person = persons[i]
        tag.append(sep)
        tag.append(person_a(person))
        sep = ", "
    }
    tag.append(div)
    return tag
}


function append_albums(tag, albums) {
    if (albums.length == 0) {
        return tag
    }
    var ul = $("<ul/>")
    for (var i in albums) {
        var a = albums[i]
        $("<li/>")
            .append(album_a(a))
            .appendTo(ul)
    }
    tag.append(ul)
    return tag
}


function append_categorys(tag, categorys) {
    if (categorys.length == 0) {
        return tag
    }
    var ul = $("<ul/>")
    for (var i in categorys) {
        var a = categorys[i]
        $("<li/>")
            .append(category_a(a))
            .appendTo(ul)
    }
    tag.append(ul)
    return tag
}

function append_related(tag, related, can_change) {
    if (related.length == 0) {
        return tag
    }
    var ul = $("<ul/>")
    for (var i in related) {
        var r = related[i]
        $("<li/>")
            .append(photo_a(r.photo, r.title))
            .appendTo(ul)
            .conditional_append(can_change, change_photo_relation_a({ id: r.id }, "[edit]"))
            .conditional_append(can_change, delete_photo_relation_a({ id: r.id }, "[del]"))
    }
    tag.append(ul)
    return tag
}


function get_photo_action(action) {
    if (action == null)
        r = "None"
    else if (action == 'D')
        r = 'delete'
    else if (action == 'S')
        r = 'regenerate size'
    else if (action == 'R')
        r = 'regenerate thumbnails'
    else if (action == 'M')
        r = 'move photo'
    else if (action == 'auto')
        r = 'rotate automatic'
    else if (action == '90')
        r = 'rotate 90 degrees clockwise'
    else if (action == '180')
        r = 'rotate 180 degrees clockwise'
    else if (action == '270')
        r = 'rotate 270 degrees clockwise'
    else
        r = 'unknown'

    return r
}


function dt_dd(dl, title, value) {
    dl.append($("<dt/>").html(escapeHTML(title)))
    dd = $("<dd/>").html(escapeHTML(value))
    dl.append(dd)
    return dd
}


function photo_thumb(photo, title, sort, description, url, selectable, onclick) {
    var style = ""
    var image = null
    if (photo != null) {
        var size = get_settings().list_size
        var style = get_photo_style(photo)
        var image = photo.thumb[size]
    }

    li = $("<li />")
        .attr('class', "photo_list_item")
        .on("click", onclick)
        .data('photo', photo)

    li.addClass(style)
    if (selectable && is_photo_selected(photo)) {
        li.addClass("ui-selected")
    }


    a = $("<a />")
    a.attr("href", url)

    if (image != null) {
        $("<img />")
        .attr("src", image.url)
        .attr("alt", title)
        .attr("width", image.width)
        .attr("height", image.height)
        .appendTo(a)
    }

    $("<div class='title'></div>")
        .text(title)
        .appendTo(a)

    if (sort) {
        $("<div class='sort'></div>")
            .text(sort)
            .appendTo(a)
    }
    if (description) {
        $("<div class='desc'></div>")
            .append(p(description))
            .appendTo(a)
    }

    li.append(a)

    return li
}


function generic_paginator(page, last_page, html_page) {

    var p = $("<p class='paginator'/>")

    if (page > 0) {
        p.append(html_page(page-1, '<', 'p'))
    }
    if (page < last_page) {
        p.append(html_page(page+1, '>', 'n'))
    }
    var range = function(first, last) {
        for (var i=first; i<=last; i++) {
            if (i == page)
                p.append('<span class="this-page">' + escapeHTML(i+1) + '</span>')
            else
                p.append(html_page(i, i+1, null))
            p.append(" ")
        }
    }

    var ON_EACH_SIDE = 3
    var ON_ENDS = 2

    // If there are 10 or fewer pages, display links to every page.
    // Otherwise, do some fancy
    if (last_page <= 10) {
        range(0, last_page)
    } else {
        // Insert "smart" pagination links, so that there are always ON_ENDS
        // links at either end of the list of pages, and there are always
        // ON_EACH_SIDE links at either end of the "current page" link.
        if (page > (ON_EACH_SIDE + ON_ENDS)) {
            range(0, ON_ENDS-1)
            p.append('<span class="dots">...</span>')
            range(page - ON_EACH_SIDE, page-1)
        } else {
            range(0, page-1)
        }

        if (page < (last_page - ON_EACH_SIDE - ON_ENDS)) {
            range(page, page + ON_EACH_SIDE)
            p.append('<span class="dots">...</span>')
            range(last_page - ON_ENDS + 1, last_page)
        } else {
            range(page, last_page)
        }
    }

    return p
}


$.fn.conditional_append = function(condition, content) {
    if (condition) {
        this.append(content)
    }
    return this
}


// *********************
// * HTML form helpers *
// *********************

function append_field(table, id, title) {
    var th = $("<th/>")

    $("<label/>")
        .attr("for", "id_" + id)
        .html(escapeHTML(title + ":"))
        .appendTo(th)

    var td = $("<td/>")

    $("<tr/>")
        .append(th)
        .append(td)
        .appendTo(table)

    return td
}


function get_input_element(id, value, type) {
//    if (value == null) {
//       value = ""
//    }

    return $('<input />')
        .attr('type', type)
        .attr('name', id)
        .attr('id', "id_" + id)
        .attr('value', value)
}


function get_input_textarea(id, rows, cols, value) {
//    if (value == null) {
//       value = ""
//    }

    return $('<textarea />')
        .attr('name', id)
        .attr('rows', rows)
        .attr('cols', cols)
        .attr('id', "id_" + id)
        .text(value)
}


function get_input_checkbox(id, value) {
    cb = $('<input />')
        .attr('type', 'checkbox')
        .attr('name', id)
        .attr('id', "id_" + id)

    if (value) {
        cb.attr('checked','checked')
    }

    return cb
}


function get_input_select(id, values, selected) {
    select = $('<select />')
        .attr('name', id)
        .attr('id', "id_" + id)

    for (i in values) {
        var v = values[i]
        var option = $('<option />')
            .attr('value', v[0])
            .text(v[1])
            .appendTo(select)

        if (v[0] == selected) {
            option.attr('selected' ,'selected')
        }
    }

    return select
}


function get_input_photo(id, photo) {

    var photo_id=null
    if (photo != null) {
        var size = get_settings().list_size
        var style = get_photo_style(photo)
        var image = photo.thumb[size]
        photo_id = photo.id
    }

    var div = get_ajax_select(id, "photo", photo,

        // onadded
        function(id, repr) {
            img
                .removeAttr("class")
                .removeAttr("alt")
                .removeAttr("width")
                .removeAttr("height")
                .attr("src", media_url("img/none.jpg"))

            load_photo(id,
                // onsuccess
                function(data) {
                    var photo = data.photo
                    if (photo != null) {
                        var size = get_settings().list_size
                        var style = get_photo_style(photo)
                        var image = photo.thumb[size]
                        photo_id = photo.id
                    }
                    if (image != null) {
                        img
                            .attr("class", style)
                            .attr("src", image.url)
                            .attr("alt", photo.title)
                            .attr("width", image.width)
                            .attr("height", image.height)
                    } else {
                        img.attr("src", media_url("img/error.png"))
                    }

                },

                // onerror
                function() {
                    img.attr("src", media_url("img/error.png"))
                })
        },

        // onkilled
        function(id, repr) {
            img
                .removeAttr("class")
                .removeAttr("src")
                .removeAttr("alt")
                .removeAttr("width")
                .removeAttr("height")
                .attr("src", media_url("img/none.jpg"))
        }
    )

    var img=$("<img/>")
        .prependTo(div)

    if (image != null) {
        img
            .attr("class", style)
            .attr("src", image.url)
            .attr("alt", photo.title)
            .attr("width", image.width)
            .attr("height", image.height)
    } else {
        img.attr("src", media_url("img/none.jpg"))
    }

    return div
}


function get_ajax_select(id, type, value, onadded, onkilled) {

    var params = {
        "type": type,
    }

    if (value != null) {
        params.item = {
            pk: value.id,
            repr: value.title,
        }
    }

    var ac = $("<input/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocomplete(params)

    if (onadded != null) {
        ac.on("added", function(ev, pk, repr) {
            onadded(pk, repr)
        })
    }

    if (onkilled != null) {
        ac.on("killed", function(ev, pk, repr) {
            onkilled(pk, repr)
        })
    }

    return ac.ajaxautocomplete('widget')
}


function get_ajax_multiple_select(id, type, values, onadded, onkilled) {
    var value_arr = []
    if (values != null) {
        var value_arr = $.map(values,
            function(value){ return { pk: value.id, repr: value.title, } }
        );
    }

    var params = {
        "type": type,
        "items": value_arr,
    }

    var ac = $("<input/>")
        .attr("name", id)
        .attr("id", "id_" + id)
        .ajaxautocompletemultiple(params)

    if (onadded != null) {
        ac.on("added", function(ev, pk, repr) {
            onadded(pk, repr)
        })
    }

    if (onkilled != null) {
        ac.on("killed", function(ev, pk, repr) {
            onkilled(pk, repr)
        })
    }

    return ac.ajaxautocompletemultiple('widget')
}



// *******************
// * HTML generators *
// *******************

function display_root() {
    $("#content-main")
        .html("")

    $(".breadcrumbs")
        .html("")
        .append("Home")
}


function display_photo(photo) {
    var size = get_settings().view_size
    var style = get_photo_style(photo)
    var image = photo.thumb[size]

    var cm = $("#content-main")
    cm.html("")

    var prefix = ""
    var can_change = false
    if (photo.can_change && is_edit_mode()) {
        prefix = "Edit "
        can_change = true
    }
    document.title = prefix + photo.title + " | Album | Spud"
    cm.append("<h1>" + escapeHTML(prefix + photo.title) +  "</h1>")

    var pd = $("<div class='photo_container photo_detail " + escapeHTML(style) + "' />")
    if (is_photo_selected(photo)) {
        pd.addClass("photo-selected")
    }

    var pdp = $("<div class='photo_block photo_detail_photo' />")

    if (image) {
        $("<img id='photo' />")
            .attr('src', image.url)
            .attr('width', image.width)
            .attr('height', image.height)
            .attr('alt', photo.title)
            .appendTo(pdp)
    }

    if (photo.title || can_change) {
        $("<div class='title'></div>")
            .text(photo.title)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_title, "[edit title]"))
            .appendTo(pdp)
    }

    if (photo.persons.length > 0 || can_change) {
        var tag = $("<div class='persons'></div>")
        append_persons(tag, photo.persons)
        tag.conditional_append(can_change, photo_change_a(photo, display_change_photo_persons, "[edit people]"))
        tag.appendTo(pdp)
    }

    if (photo.description || can_change) {
        $("<div class='description'></div>")
            .html(p(photo.description))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_description, "[edit description]"))
            .appendTo(pdp)
    }
    pd.append(pdp)

    var pdd = $("<div class='photo_block photo_detail_photo_detail' />")
    pdd.append("<h2>Photo Details</h2>")

    var search_params = {
        photo: photo.id,
    }

    var dl = $("<dl\>")
    var title = dt_dd(dl, "Title", photo.title)
        .conditional_append(can_change, photo_change_a(photo, display_change_photo_title, "[edit]"))

    if (image) {
        title.append(escapeHTML(" (" + image.width + "x" + image.height + ")"))
    }

    if (photo.description || can_change) {
        dt_dd(dl, "Description", "")
            .append(p(photo.description))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_description, "[edit]"))
    }

    if (photo.view || can_change) {
        dt_dd(dl, "View", photo.view)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_view, "[edit]"))
    }

    if (photo.comments || can_change) {
        dt_dd(dl, "Comments", photo.comment)
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_comments, "[edit]"))
    }

    dt_dd(dl, "File", photo.name)
    dt_dd(dl, "Place", "")
        .html(place_a(photo.place))
        .conditional_append(can_change, photo_change_a(photo, display_change_photo_place, "[edit]"))

    if (photo.albums.length > 0 || can_change) {
        var tag = dt_dd(dl, "Albums", "")
        append_albums(tag, photo.albums)
        tag.conditional_append(can_change, photo_change_a(photo, display_change_photo_albums, "[edit]"))
    }

    if (photo.categorys.length > 0 || can_change) {
        var tag = dt_dd(dl, "Categories", "")
        append_categorys(tag, photo.categorys)
        tag.conditional_append(can_change, photo_change_a(photo, display_change_photo_categorys, "[edit]"))
    }

    dt_dd(dl, "Date & time", "")
        .append(datetime_a(photo.utctime))
        .append("<br />")
        .append(datetime_a(photo.localtime))
        .conditional_append(can_change, photo_change_a(photo, display_change_photo_datetime, "[edit]"))

    if (photo.photographer > 0 || can_change) {
        dt_dd(dl, "Photographer", "")
            .html(person_a(photo.photographer))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_photographer, "[edit]"))
    }

    if (photo.rating) {
        dt_dd(dl, "Rating", photo.rating)
    }

    if (photo.related.length > 0 || can_change) {
        var tag = dt_dd(dl, "Related photos", "")
        append_related(tag, photo.related, can_change)
        tag.conditional_append(can_change, add_photo_relation_a(photo, "[add]"))
    }

    if (photo.action || can_change) {
        dt_dd(dl, "Action", "")
            .append(get_photo_action(photo.action))
            .conditional_append(can_change, photo_change_a(photo, display_change_photo_action, "[edit]"))
    }

    pdd.append(dl)

    pd.append(pdd)

    var pdc = $("<div class='photo_block photo_detail_camera_detail' />")
    pdc.append("<h2>Camera Details</h2>")

    var dl = $("<dl\>")

    tag = dt_dd(dl, "Camera", photo.camera_make + " " + photo.camera_model)
    tag = dt_dd(dl, "Flash", photo.flash_used)
    tag = dt_dd(dl, "Focal Length", photo.focal_length)
    tag = dt_dd(dl, "Exposure", photo.exposure)
    tag = dt_dd(dl, "Aperture", photo.aperture)
    tag = dt_dd(dl, "ISO", photo.iso_equiv)
    tag = dt_dd(dl, "Metering Mode", photo.metering_mode)

    pdc.append(dl)

    pd.append(pdc)

    cm.append(pd)

    if (photo.can_change && is_edit_mode()) {
        photo_change_keyboard(photo, { photo: photo.id }, 1)
    }

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(escapeHTML(photo.title))

    return
}


var operations = [
    {
        value: "title",
        label: "Change title",
        desc: "Change the photo's title",
        fn: display_change_photo_title,
    },
    {
        value: "description",
        label: "Change description",
        desc: "Change the photo's description",
        fn: display_change_photo_description,
    },
    {
        value: "view",
        label: "Change view",
        desc: "Change the photo's view",
        fn: display_change_photo_view,
    },
    {
        value: "comments",
        label: "Change comments",
        desc: "Change the photo's comments",
        fn: display_change_photo_comments,
    },
    {
        value: "datetime",
        label: "Change datetime",
        desc: "Change the photo's date/time",
        fn: display_change_photo_datetime,
    },
    {
        value: "action",
        label: "Change action",
        desc: "Change the photo's action",
        fn: display_change_photo_action,
    },
    {
        value: "photographer",
        label: "Change photographer",
        desc: "Change the photo's photographer",
        fn: display_change_photo_photographer,
    },
    {
        value: "place",
        label: "Change place",
        desc: "Change the photo's place",
        fn: display_change_photo_place,
    },
    {
        value: "album",
        label: "Change albums",
        desc: "Add/remove albums from photo",
        fn: display_change_photo_albums,
    },
    {
        value: "category",
        label: "Change categories",
        desc: "Add/remove categories from photo",
        fn: display_change_photo_categorys,
    },
    {
        value: "person",
        label: "Change persons",
        desc: "Add/remove people from photo",
        fn: display_change_photo_persons,
    },
];


function cancel_keyboard() {
    $(document).off("keydown")
}


function photo_change_keyboard(photo, search_params, number_results) {
    $(document).off("keydown")
    $(document).on("keydown", function(ev) { photo_change_keyboard_event(ev, photo, search_params, number_results) })
}


function photo_change_keyboard_event(ev, photo, search_params, number_results) {
    var key = String.fromCharCode(ev.which)
    if ($("#dialog").length == 0) {
        var dialog = $("<div id='dialog'></div>")
            .attr('title', "Choose operation")

        var ac = $('<input id="project" />')
            .quickautocomplete({
          minLength: 0,
          source: operations,
          select: function( event, ui ) {
            dialog.dialog( "close" )
            ui.item.fn(photo, search_params, number_results)
            return false;
          }
        })


        var f = $("<form method='get' />")
            .append(ac)

        dialog
            .append("<p>" + escapeHTML(number_results) + " photos will be changed.</p>")
            .append(f)
            .dialog({
                modal: true,
                close: function( event, ui ) { $(this).dialog("destroy") },
                buttons: {
                    Cancel: function() {
                        $( this ).dialog( "close" )
                    },
                },
            })
    }
    return true
}


function display_change_photo_title(photo, search_params, number_results) {
    var title=""
    if (photo != null) {
        title = photo.title
    }
    var table = $("<table />")
    append_field(table, "title", "Title")
        .append(get_input_element("title", title, "text"))
    var get_updates = function(form) {
        return {
            set_title: form.title.value,
        }
    }
    display_change_photo_attribute("title", table, get_updates, search_params, number_results)
}


function display_change_photo_description(photo, search_params, number_results) {
    var description=""
    if (photo != null) {
        description = photo.description
    }
    var table = $("<table />")
    append_field(table, "description", "Description")
        .append(get_input_textarea("description", 10, 40, description))
    var get_updates = function(form) {
        return {
            set_description: form.description.value,
        }
    }
    display_change_photo_attribute("description", table, get_updates, search_params, number_results, { width: 400, })
}


function display_change_photo_view(photo, search_params, number_results) {
    var view=""
    if (photo != null) {
        view = photo.view
    }
    var table = $("<table />")
    append_field(table, "view", "View")
        .append(get_input_textarea("view", 10, 40, view))
    var get_updates = function(form) {
        return {
            set_view: form.view.value,
        }
    }
    display_change_photo_attribute("view", table, get_updates, search_params, number_results, { width: 400, })
}


function display_change_photo_comments(photo, search_params, number_results) {
    var comments=""
    if (photo != null) {
        comments = photo.comments
    }
    var table = $("<table />")
    append_field(table, "comments", "Comments")
        .append(get_input_textarea("comments", 10, 40, comments))
    var get_updates = function(form) {
        return {
            set_comments: form.comments.value,
        }
    }
    display_change_photo_attribute("comments", table, get_updates, search_params, number_results, { width: 400, } )
}


function display_change_photo_datetime(photo, search_params, number_results) {
    var datetime=""
    if (photo != null) {
        datetime = photo.localtime.date + " " + photo.localtime.time + " " + photo.localtime.timezone
    }
    var table = $("<table />")
    append_field(table, "datetime", "Date/Time")
        .append(get_input_element("datetime", datetime, "text"))
    var get_updates = function(form) {
        return {
            set_datetime: form.datetime.value,
        }
    }
    display_change_photo_attribute("datetime", table, get_updates, search_params, number_results, { } )
}


function display_change_photo_action(photo, search_params, number_results) {
    var action=""
    if (photo != null) {
        action = photo.action
    }
    var table = $("<table />")
    append_field(table, "action", "Action")
        .append(get_input_select("action", [
            ['', 'no action'],
            ['D', 'delete'],
            ['S', 'regenerate size'],
            ['R', 'regenerate thumbnails'],
            ['M', 'move photo'],
            ['auto', 'rotate automatic'],
            ['90', 'rotate 90 degrees clockwise'],
            ['180', 'rotate 180 degrees clockwise'],
            ['270', 'rotate 270 degrees clockwise'],
            ], action))
    var get_updates = function(form) {
        return {
            set_action: form.action.value,
        }
    }
    display_change_photo_attribute("action", table, get_updates, search_params, number_results, { width: 400, } )
}


function display_change_photo_photographer(photo, search_params, number_results) {
    var photographer=""
    if (photo != null) {
        photographer = photo.photographer
    }
    var table = $("<table />")
    append_field(table, "photographer_text", "Photographer")
        .append(get_ajax_select("photographer", 'person', photographer))
    var get_updates = function(form) {
        return {
            set_photographer: form.photographer.value,
        }
    }
    display_change_photo_attribute("photographer", table, get_updates, search_params, number_results, { } )
}


function display_change_photo_place(photo, search_params, number_results) {
    var place=""
    if (photo != null) {
        place = photo.place
    }
    var table = $("<table />")
    append_field(table, "place_text", "Place")
        .append(get_ajax_select("place", 'place', place))
    var get_updates = function(form) {
        return {
            set_place: form.place.value,
        }
    }
    display_change_photo_attribute("place", table, get_updates, search_params, number_results, { } )
}


function display_change_photo_albums(photo, search_params, number_results) {
    var table = $("<table />")

    if (photo != null) {
        var table = $("<table />")
        append_field(table, "albums_text", "Albums")
            .append(get_ajax_multiple_select("albums", 'album', photo.albums))
        var get_updates = function(form) {
            var set = []
            if (form.albums.value != "|") {
                set = form.albums.value.slice(1,-1).split("|")
            }
            return {
                set_albums: set.join("."),
            }
        }
    } else {
        append_field(table, "add_album_text", "Add Album")
            .append(get_ajax_multiple_select("add_album", 'album', []))
        append_field(table, "del_album_text", "Delete Album")
            .append(get_ajax_multiple_select("del_album", 'album', []))
        var get_updates = function(form) {
            var add = []
            if (form.add_album.value != "|") {
                add = form.add_album.value.slice(1,-1).split("|")
            }
            var del = []
            if (form.del_album.value != "|") {
                del = form.del_album.value.slice(1,-1).split("|")
            }
            return {
                add_albums: add.join("."),
                del_albums: del.join("."),
            }
        }
    }
    display_change_photo_attribute("album", table, get_updates, search_params, number_results, { } )
}


function display_change_photo_categorys(photo, search_params, number_results) {
    var table = $("<table />")

    if (photo != null) {
        var table = $("<table />")
        append_field(table, "categorys_text", "Categories")
            .append(get_ajax_multiple_select("categorys", 'category', photo.categorys))
        var get_updates = function(form) {
            var set = []
            if (form.categorys.value != "|") {
                set = form.categorys.value.slice(1,-1).split("|")
            }
            return {
                set_categorys: set.join("."),
            }
        }
    } else {
        append_field(table, "add_category_text", "Add Category")
            .append(get_ajax_multiple_select("add_category", 'category', []))
        append_field(table, "del_category_text", "Delete Category")
            .append(get_ajax_multiple_select("del_category", 'category', []))
        var get_updates = function(form) {
            var add = []
            if (form.add_category.value != "|") {
                add = form.add_category.value.slice(1,-1).split("|")
            }
            var del = []
            if (form.del_category.value != "|") {
                del = form.del_category.value.slice(1,-1).split("|")
            }
            return {
                add_categorys: add.join("."),
                del_categorys: del.join("."),
            }
        }
    }
    display_change_photo_attribute("category", table, get_updates, search_params, number_results, { } )
}


function display_change_photo_persons(photo, search_params, number_results) {
    var table = $("<table />")

    if (photo != null) {
        var table = $("<table />")
        append_field(table, "persons_text", "Persons")
            .append(get_ajax_multiple_select("persons", 'person', photo.persons))
        var get_updates = function(form) {
            var set = []
            if (form.persons.value != "|") {
                set = form.persons.value.slice(1,-1).split("|")
            }
            return {
                set_persons: set.join("."),
            }
        }
    } else {
        append_field(table, "add_person_text", "Add Person")
            .append(get_ajax_multiple_select("add_person", 'person', []))
        append_field(table, "del_person_text", "Delete Person")
            .append(get_ajax_multiple_select("del_person", 'person', []))
        var get_updates = function(form) {
            var add = []
            if (form.add_person.value != "|") {
                add = form.add_person.value.slice(1,-1).split("|")
            }
            var del = []
            if (form.del_person.value != "|") {
                del = form.del_person.value.slice(1,-1).split("|")
            }
            return {
                add_persons: add.join("."),
                del_persons: del.join("."),
            }
        }
    }
    display_change_photo_attribute("person", table, get_updates, search_params, number_results, { } )
}


/* OLD CODE DO NOT EAT
function display_change_photo_persons2(photo, search_params, number_results) {
    var persons=""
    if (photo != null) {
        persons = photo.persons
    }
    var table = $("<table />")

    if (persons != null) {
        ul = $("<ul></ul>")
            .sortable()
            .disableSelection()
        for (var i in persons) {
            $("<li></li>")
                .attr("id", "#id_person_"+persons[i].id)
                .text(persons[i].title)
                .appendTo(ul)
        }
        append_field(table, "persons", "Current Persons")
            .append(ul)
    }
    append_field(table, "add_person_text", "Add Person")
        .append(get_ajax_multiple_select("add_person", 'person', [],
            function(pk, repr) {
                $("<li></li>")
                    .attr("id", "id_person_"+pk)
                    .text(repr)
                    .appendTo(ul)
            },
            function(pk, repr) {
                $("#id_person_"+pk).remove()
            }
            ))
    append_field(table, "del_person_text", "Delete Person")
        .append(get_ajax_multiple_select("del_person", 'person', [],
            function(pk, repr) {
                $("#id_person_"+pk).remove()
            },
            function(pk, repr) {
                $("<li></li>")
                    .attr("id", "id_person_"+pk)
                    .text(repr)
                    .appendTo(ul)
            }
            ))
    var get_updates = function(form) {
        var add = []
        if (form.add_person.value != "|") {
            add = form.add_person.value.slice(1,-1).split("|")
            add = $.map(add, function(id){ return "+"+id });
        }
        var del = []
        if (form.del_person.value != "|") {
            del = form.del_person.value.slice(1,-1).split("|")
            del = $.map(del, function(id){ return "-"+id });
        }

        var order = ul.sortable( "toArray" )
        order = $.map(order, function(id) {
            return id.match(/(.+)[\-=_](.+)/)[2]
        })

        return {
            set_person: add.concat(del).join("."),
            set_person_order: order.join("."),
        }
    }
    display_change_photo_attribute("person", table, get_updates, search_params, number_results, { } )
}
*/

function display_change_photo_attribute(title, table, get_updates, search_params, number_results, options) {
    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Change photo " + title)

    var f = $("<form method='get' />")
        .append(table)

    dialog
        .append("<p>" + escapeHTML(number_results) + " photos will be changed.</p>")
        .append(f)
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_photo_attribute(search_params, get_updates(f[0]), $( this ))
                return false
            }
        })
        .dialog(jQuery.extend(options, {
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Save: function() {
                    submit_change_photo_attribute(search_params, get_updates(f[0]), $( this ))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        }))
}


function submit_change_photo_attribute(search_params, updates, dialog) {
    var search = {
        params: search_params
    }

    display_loading()
    change_search(
            search,
            updates,
            function(data) {
                hide_status()
                dialog.dialog("close")
                reload_page()
            },
            function() {
                hide_status()
                alert("An error occured trying to update the photos")
            })

    return false
}

function display_album(album) {
    var cm = $("#content-main")
    cm.html("")

    document.title = album.title + " | Album | Spud"
    cm.append("<h1>" + escapeHTML(album.title) +  "</h1>")

    var dl = $("<dl/>")
    dt_dd(dl, "Title", album.title)

    if (album.cover_photo != null) {
        var size = get_settings().view_size
        var photo = album.cover_photo
        var image = photo.thumb[size]
        if (image) {
            var img = $("<img />")
            .attr("src", image.url)
            .attr("alt", photo.title)
            .attr("width", image.width)
            .attr("height", image.height)
            dt_dd(dl, "Photo", "")
                .append(img)
        }
    }
    if (album.sortname || album.sortorder) {
        dt_dd(dl, "Sort", album.sortname + " " + album.sortorder)
    }
    if (album.description) {
        dt_dd(dl, "Description", "")
            .append(p(album.description))
    }

    $("<div class='infobox'/>")
        .append(dl)
        .appendTo(cm)

    if (album.children.length > 0) {
        pl = $("<ul class='photo_list' />")
        for (var i in album.children) {
            var child = album.children[i]
            var photo = child.cover_photo

            var sort=null
            if  (child.sortorder || child.sortname) {
                sort = child.sortname + " " + child.sortorder
            }

            var li = photo_thumb(photo, child.title, sort, child.description,
                album_url(album),
                false,
                function(album) {
                    return function() {
                        do_album(album.id, true)
                        return false
                    }
            }(child))
            pl.append(li)
        }

        c = $("<div class='children' />")
        c.append(pl)

        cm.append(c)
    }

    var search = { params: { album: album.id }}

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(search_results_a(search, 0, "Show Photos"))
        .appendTo(ul)

    $("<li/>")
        .append(search_a(search))
        .appendTo(ul)

    if (album.can_add) {
        $("<li/>")
            .append(add_album_a(album))
            .appendTo(ul)
    }

    if (album.can_change) {
        $("<li/>")
            .append(change_album_a(album))
            .appendTo(ul)
    }

    if (album.can_delete) {
        $("<li/>")
            .append(delete_album_a(album))
            .appendTo(ul)
    }

    append_action_links(ul)

    append_jump("album", "album",
        function(ev, item) {
            do_album(item.pk, true)
        }
    )

    bc = $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")

    var sep = ""
    for (var i in album.parents) {
        var a = album.parents[i]
        bc.append(sep)
        bc.append(album_a(a))
        sep = " › "
    }
    bc.append(sep + escapeHTML(album.title))
}


function display_change_album(album) {
    var dialog = $("<div id='dialog'></div>")

    if (album.id != null) {
        dialog.attr('title', "Change " + album.title)
    } else {
        dialog.attr('title', "Add album")
    }

    var f = $("<form method='get' />")

    var table = $("<table />")

    settings = get_settings()

    append_field(table, "title", "Title")
        .append(get_input_element("title", album.title, "text"))

    append_field(table, "description", "Description")
        .append(get_input_textarea("description", 10, 40, album.description))

    append_field(table, "cover_photo", "Cover Photo")
        .append(get_input_photo("cover_photo", album.cover_photo))

    append_field(table, "sortname", "Sort Name")
        .append(get_input_element("sortname", album.sortname, "text"))

    append_field(table, "sortorder", "Sort Order")
        .append(get_input_element("sortorder", album.sortorder, "text"))

    var parent = null
    if (album.parents.length > 0) {
        parent = album.parents[0]
    }
    append_field(table, "parent_text", "Parent")
        .append(get_ajax_select("parent", 'album', parent))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_album(album, $( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            width: 400,
            buttons: {
                Save: function() {
                    submit_change_album(album, $( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_change_album(album, dialog, form) {
    var updates = {
        title: parse_form_string(form.title.value),
        description: parse_form_string(form.description.value),
        cover_photo: parse_form_string(form.cover_photo.value),
        sortname: parse_form_string(form.sortname.value),
        sortorder: parse_form_string(form.sortorder.value),
        parent: parse_form_string(form.parent.value),
    }

    display_loading()
    load_change_album(
            album.id,
            updates,
            function(data) {
                hide_status()
                dialog.dialog("close")
                replace_links()
                update_session(data.session)
                if (window.history.state==null) {
                    display_album(data.album)
                    update_history(false, album_url(data.album), {
                        type: 'display_album',
                        album_id: data.album.id,
                    });
                } else if (album.id==null) {
                    display_album(data.album)
                    update_history(true, album_url(data.album), {
                        type: 'display_album',
                        album_id: data.album.id,
                    });
                } else if (window.history.state.type=='display_album' && window.history.state.album_id==data.album.id) {
                    display_album(data.album)
                } else {
                    reload_page()
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to update the album")
            })

    return false
}


function display_delete_album(album) {
    var dialog = $("<div id='dialog'><p>Are you sure you want to delete album '"+escapeHTML(album.title)+"'?</p></div>")
        .attr('title', "Delete " + album.title)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Delete: function() {
                    submit_delete_album(album, $(this))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_delete_album(album, dialog) {
    display_loading()
    load_delete_album(
            album.id,
            function(data) {
                update_session(data.session)
                if (data.status == 'success') {
                    hide_status()
                    dialog.dialog("close")
                    window.history.go(-1)
                } else if (data.status == 'errors') {
                    hide_status()
                    dialog.dialog("close")
                    for (var i in data.errors) {
                        alert(data.errors[i])
                    }
                } else {
                    alert("Unknown error")
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to delete the album")
            })

    return false
}

function display_category(category) {
    var cm = $("#content-main")
    cm.html("")

    document.title = category.title + " | Category | Spud"
    cm.append("<h1>" + escapeHTML(category.title) +  "</h1>")

    var dl = $("<dl/>")
    dt_dd(dl, "Title", category.title)

    if (category.cover_photo != null) {
        var size = get_settings().view_size
        var photo = category.cover_photo
        var image = photo.thumb[size]
        if (image) {
            var img = $("<img />")
            .attr("src", image.url)
            .attr("alt", photo.title)
            .attr("width", image.width)
            .attr("height", image.height)
            dt_dd(dl, "Photo", "")
                .append(img)
        }
    }
    if (category.sortname || category.sortorder) {
        dt_dd(dl, "Sort", category.sortname + " " + category.sortorder)
    }
    if (category.description) {
        dt_dd(dl, "Description", "")
            .append(p(category.description))
    }

    $("<div class='infobox'/>")
        .append(dl)
        .appendTo(cm)

    if (category.children.length > 0) {
        pl = $("<ul class='photo_list' />")
        for (var i in category.children) {
            child = category.children[i]
            photo = child.cover_photo

            sort=null
            if  (child.sortorder || child.sortname) {
                sort = child.sortname + " " + child.sortorder
            }

            li = photo_thumb(photo, child.title, sort, child.description,
                category_url(category),
                false,
                function(category) {
                    return function() {
                        do_category(category.id, true)
                        return false
                    }
            }(child))
            pl.append(li)
        }

        c = $("<div class='children' />")
        c.append(pl)

        cm.append(c)
    }

    var search = { params: { category: category.id }}

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(search_results_a(search, 0, "Show Photos"))
        .appendTo(ul)

    $("<li/>")
        .append(search_a(search))
        .appendTo(ul)

    if (category.can_add) {
        $("<li/>")
            .append(add_category_a(category))
            .appendTo(ul)
    }

    if (category.can_change) {
        $("<li/>")
            .append(change_category_a(category))
            .appendTo(ul)
    }

    if (category.can_delete) {
        $("<li/>")
            .append(delete_category_a(category))
            .appendTo(ul)
    }

    append_action_links(ul)

    append_jump("category", "category",
        function(ev, item) {
            do_category(item.pk, true)
        }
    )

    bc = $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")

    var sep = ""
    for (var i in category.parents) {
        var a = category.parents[i]
        bc.append(sep)
        bc.append(category_a(a))
        sep = " › "
    }
    bc.append(sep + escapeHTML(category.title))
}


function display_change_category(category) {
    var dialog = $("<div id='dialog'></div>")

    if (category.id != null) {
        dialog.attr('title', "Change " + category.title)
    } else {
        dialog.attr('title', "Add category")
    }

    var f = $("<form method='get' />")

    var table = $("<table />")

    settings = get_settings()

    append_field(table, "title", "Title")
        .append(get_input_element("title", category.title, "text"))

    append_field(table, "description", "Description")
        .append(get_input_textarea("description", 10, 40, category.description))

    append_field(table, "cover_photo", "Cover Photo")
        .append(get_input_photo("cover_photo", category.cover_photo))

    append_field(table, "sortname", "Sort Name")
        .append(get_input_element("sortname", category.sortname, "text"))

    append_field(table, "sortorder", "Sort Order")
        .append(get_input_element("sortorder", category.sortorder, "text"))

    var parent = null
    if (category.parents.length > 0) {
        parent = category.parents[0]
    }
    append_field(table, "parent_text", "Parent")
        .append(get_ajax_select("parent", 'category', parent))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_category(category, $( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            width: 400,
            buttons: {
                Save: function() {
                    submit_change_category(category, $( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_change_category(category, dialog, form) {
    var updates = {
        title: parse_form_string(form.title.value),
        description: parse_form_string(form.description.value),
        cover_photo: parse_form_string(form.cover_photo.value),
        sortname: parse_form_string(form.sortname.value),
        sortorder: parse_form_string(form.sortorder.value),
        parent: parse_form_string(form.parent.value),
    }

    display_loading()
    load_change_category(
            category.id,
            updates,
            function(data) {
                hide_status()
                dialog.dialog("close")
                replace_links()
                update_session(data.session)
                if (window.history.state==null) {
                    display_category(data.category)
                    update_history(false, category_url(data.category), {
                        type: 'display_category',
                        category_id: data.category.id,
                    });
                } else if (category.id==null) {
                    display_category(data.category)
                    update_history(true, category_url(data.category), {
                        type: 'display_category',
                        category_id: data.category.id,
                    });
                } else if (window.history.state.type=='display_category' && window.history.state.category_id==data.category.id) {
                    display_category(data.category)
                } else {
                    reload_page()
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to update the category")
            })

    return false
}


function display_delete_category(category) {
    var dialog = $("<div id='dialog'><p>Are you sure you want to delete category '"+escapeHTML(category.title)+"'?</p></div>")
        .attr('title', "Delete " + category.title)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Delete: function() {
                    submit_delete_category(category, $(this))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_delete_category(category, dialog) {
    display_loading()
    load_delete_category(
            category.id,
            function(data) {
                update_session(data.session)
                if (data.status == 'success') {
                    hide_status()
                    dialog.dialog("close")
                    window.history.go(-1)
                } else if (data.status == 'errors') {
                    for (var i in data.errors) {
                        alert(data.errors[i])
                    }
                    hide_status()
                    dialog.dialog("close")
                } else {
                    alert("Unknown error")
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to delete the category")
            })

    return false
}


function display_place(place) {
    var cm = $("#content-main")
    cm.html("")

    document.title = place.title + " | Place | Spud"
    cm.append("<h1>" + escapeHTML(place.title) +  "</h1>")

    var dl = $("<dl/>")
    dt_dd(dl, "Title", place.title)

    if (place.cover_photo != null) {
        var size = get_settings().view_size
        var photo = place.cover_photo
        var image = photo.thumb[size]
        if (image) {
            var img = $("<img />")
            .attr("src", image.url)
            .attr("alt", photo.title)
            .attr("width", image.width)
            .attr("height", image.height)
            dt_dd(dl, "Photo", "")
                .append(img)
        }
    }

    var text = ""
    if (place.address) {
        text += escapeHTML(place.address) + "<br/>"
    }
    if (place.address2) {
        text += escapeHTML(place.address2) + "<br/>"
    }
    if (place.city || place.state || place.zip) {
        text += escapeHTML(place.city + " " + place.state + " " + place.zip) + "<br/>"
    }
    if (place.country) {
        text += escapeHTML(place.country) + "<br/>"
    }
    if (text) {
        dt_dd(dl, "Address", "")
            .html(text)
    }

    if (place.url) {
        link = place.urldesc || "link"
        a = $("<a/>")
            .attr("href", place.url)
            .text(link)
        dt_dd(dl, "url", "")
            .html(a)
    }

    if (place.notes) {
        dt_dd(dl, "Notes", "")
            .append(p(place.notes))
    }

    $("<div class='infobox'/>")
        .append(dl)
        .appendTo(cm)

    if (place.children.length > 0) {
        pl = $("<ul class='photo_list' />")
        for (var i in place.children) {
            child = place.children[i]
            photo = child.cover_photo

            sort=null
            if  (child.sortorder || child.sortname) {
                sort = child.sortname + " " + child.sortorder
            }

            li = photo_thumb(photo, child.title, sort, child.description,
                place_url(place),
                false,
                function(place) {
                    return function() {
                        do_place(place.id, true)
                        return false
                    }
            }(child))
            pl.append(li)
        }

        c = $("<div class='children' />")
        c.append(pl)

        cm.append(c)
    }

    var search = { params: { place: place.id }}

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(search_results_a(search, 0, "Show Photos"))
        .appendTo(ul)

    $("<li/>")
        .append(search_a(search))
        .appendTo(ul)

    if (place.can_add) {
        $("<li/>")
            .append(add_place_a(place))
            .appendTo(ul)
    }

    if (place.can_change) {
        $("<li/>")
            .append(change_place_a(place))
            .appendTo(ul)
    }

    if (place.can_delete) {
        $("<li/>")
            .append(delete_place_a(place))
            .appendTo(ul)
    }

    append_action_links(ul)

    append_jump("place", "place",
        function(ev, item) {
            do_place(item.pk, true)
        }
    )

    bc = $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")

    var sep = ""
    for (var i in place.parents) {
        var a = place.parents[i]
        bc.append(sep)
        bc.append(place_a(a))
        sep = " › "
    }
    bc.append(sep + escapeHTML(place.title))
}


function display_change_place(place) {
    var dialog = $("<div id='dialog'></div>")

    if (place.id != null) {
        dialog.attr('title', "Change " + place.title)
    } else {
        dialog.attr('title', "Add place")
    }

    var f = $("<form method='get' />")

    var table = $("<table />")

    settings = get_settings()

    append_field(table, "title", "Title")
        .append(get_input_element("title", place.title, "text"))

    append_field(table, "address", "Address")
        .append(get_input_element("address", place.address, "address"))

    append_field(table, "address2", "Address (ctd)")
        .append(get_input_element("address2", place.address2, "address2"))

    append_field(table, "city", "City")
        .append(get_input_element("city", place.city, "city"))

    append_field(table, "state", "State")
        .append(get_input_element("state", place.state, "text"))

    append_field(table, "zip", "Zip")
        .append(get_input_element("zip", place.zip, "text"))

    append_field(table, "country", "Country")
        .append(get_input_element("country", place.country, "text"))

    append_field(table, "url", "URL")
        .append(get_input_element("url", place.url, "text"))

    append_field(table, "urldesc", "URL Title")
        .append(get_input_element("urldesc", place.urldesc, "text"))

    append_field(table, "notes", "Notes")
        .append(get_input_textarea("notes", 10, 40, place.notes))

    append_field(table, "cover_photo", "Cover Photo")
        .append(get_input_photo("cover_photo", place.cover_photo))

    var parent = null
    if (place.parents.length > 0) {
        parent = place.parents[0]
    }
    append_field(table, "parent_text", "Parent")
        .append(get_ajax_select("parent", 'place', parent))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_place(place, $( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            width: 400,
            buttons: {
                Save: function() {
                    submit_change_place(place, $( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_change_place(place, dialog, form) {
    var updates = {
        title: parse_form_string(form.title.value),
        address: parse_form_string(form.address.value),
        address2: parse_form_string(form.address2.value),
        city: parse_form_string(form.city.value),
        state: parse_form_string(form.state.value),
        zip: parse_form_string(form.zip.value),
        country: parse_form_string(form.country.value),
        url: parse_form_string(form.url.value),
        urldesc: parse_form_string(form.urldesc.value),
        notes: parse_form_string(form.notes.value),
        cover_photo: parse_form_string(form.cover_photo.value),
        parent: parse_form_string(form.parent.value),
    }

    display_loading()
    load_change_place(
            place.id,
            updates,
            function(data) {
                hide_status()
                dialog.dialog("close")
                replace_links()
                update_session(data.session)
                if (window.history.state==null) {
                    display_place(data.place)
                    update_history(false, place_url(data.place), {
                        type: 'display_place',
                        place_id: data.place.id,
                    });
                } else if (place.id==null) {
                    display_place(data.place)
                    update_history(true, place_url(data.place), {
                        type: 'display_place',
                        place_id: data.place.id,
                    });
                } else if (window.history.state.type=='display_place' && window.history.state.place_id==data.place.id) {
                    display_place(data.place)
                } else {
                    reload_page()
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to update the place")
            })

    return false
}


function display_delete_place(place) {
    var dialog = $("<div id='dialog'><p>Are you sure you want to delete place '"+escapeHTML(place.title)+"'?</p></div>")
        .attr('title', "Delete " + place.title)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Delete: function() {
                    submit_delete_place(place, $(this))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_delete_place(place, dialog) {
    display_loading()
    load_delete_place(
            place.id,
            function(data) {
                update_session(data.session)
                if (data.status == 'success') {
                    hide_status()
                    dialog.dialog("close")
                    window.history.go(-1)
                } else if (data.status == 'errors') {
                    for (var i in data.errors) {
                        alert(data.errors[i])
                    }
                    hide_status()
                    dialog.dialog("close")
                } else {
                    alert("Unknown error")
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to delete the place")
            })

    return false
}

function display_person_search(search, data) {
    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Search people")


    var f = $("<form method='get' />")

    var table = $("<table />")

    append_field(table, "q", "Search for")
        .append(get_input_element("q", data.q, "text"))
    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_person_search($( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Search: function() {
                    submit_person_search($( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_person_search(dialog, form) {

    var params = { }

    if (form.q.value) {
        params['q'] = form.q.value
    }
    var search = {
        params: params,
    }
    do_person_search_results(search, 0, true)

    dialog.dialog( "close" )
    return false
}


function display_person_search_results(search, results) {
    var cm = $("#content-main")
    cm.html("")

    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.floor(results.number_results / search.results_per_page)

    document.title = "Person List " + (page+1) + "/" + (last_page+1) + " | Photos | Spud"
    cm.append("<h1>Person List " + escapeHTML(page+1) + "/" + escapeHTML(last_page+1) + "</h1>")


    if (results.q) {
        var dl = $("<dl/>")
        dt_dd(dl, "Search text", results.q)
        $("<div class='infobox'/>")
            .append(dl)
            .appendTo(cm)
    }


    table = $("<table/>")

    tr = $("<tr/>")
        .append("<th>Photo</th>")
        .append("<th>Called</th>")
        .append("<th>First Name</th>")
        .append("<th>Middle Name</th>")
        .append("<th>Last Name</th>")
        .append("<th>Links</th>")
        .appendTo(table)

    for (i in results.persons) {
        person = results.persons[i]

        img = $("<td/>")
        if (person.cover_photo != null) {
            var size = get_settings().list_size
            var photo = person.cover_photo
            var image = photo.thumb[size]
            if (image) {
                $("<img />")
                .attr("src", image.url)
                .attr("alt", photo.title)
                .attr("width", image.width)
                .attr("height", image.height)
                .appendTo(img)
            }
        }

        links = $("<td/>")
            .append(person_a(person, "Person"))
            .append(", ")
            .append(search_results_a({ params: { person: person.id } }, 0, "Photos"))

        tr = $("<tr/>")
            .append(img)
            .append("<td>" + escapeHTML(person.called) + "</td>")
            .append("<td>" + escapeHTML(person.first_name) + "</td>")
            .append("<td>" + escapeHTML(person.middle_name) + "</td>")
            .append("<td>" + escapeHTML(person.last_name) + "</td>")
            .append(links)
            .appendTo(table)
    }

    cm.append(table)

    var html_page = function(page, text, key) {
        return person_search_results_a(search, page, text, key)
    }

    cm.append(generic_paginator(page, last_page, html_page))

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(person_search_a(search))
        .appendTo(ul)

    if (results.can_add) {
        $("<li/>")
            .append(add_person_a())
            .appendTo(ul)
    }

    append_action_links(ul)

    append_jump("person", "person",
        function(ev, item) {
            do_person(item.pk, true)
        }
    )

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › People")
}


function display_person(person) {
    var cm = $("#content-main")
    cm.html("")

    document.title = person.title + " | Person | Spud"
    cm.append("<h1>" + escapeHTML(person.title) +  "</h1>")

    var dl = $("<dl/>")
    dt_dd(dl, "Title", person.title)

    if (person.cover_photo != null) {
        var size = get_settings().view_size
        var photo = person.cover_photo
        var image = photo.thumb[size]
        if (image) {
            var img = $("<img />")
            .attr("src", image.url)
            .attr("alt", photo.title)
            .attr("width", image.width)
            .attr("height", image.height)
            dt_dd(dl, "Photo", "")
                .append(img)
        }
    }

    var text = ""
    if (person.called) {
        dt_dd(dl, "Called", person.called)
    }

    if (person.first_name) {
        dt_dd(dl, "First Name", person.first_name)
    }

    if (person.middle_name) {
        dt_dd(dl, "Middle Name", person.middle_name)
    }

    if (person.last_name) {
        dt_dd(dl, "Last Name", person.last_name)
    }

    if (person.notes) {
        dt_dd(dl, "Notes", person.notes)
    }

    if (person.gender) {
        if (person.gender == "1")
            dt_dd(dl, "Gender", "male")
        else if (person.gender == "2")
            dt_dd(dl, "Gender", "female")
        else
            dt_dd(dl, "Gender", "unknown")
    }

    if (person.dob) {
        dt_dd(dl, "Date of Birth", person.dob)
    }

    if (person.dod) {
        dt_dd(dl, "Date of Death", person.dod)
    }

    if (person.home) {
        dt_dd(dl, "Home", "")
            .append(place_a(person.home))
    }

    if (person.work) {
        dt_dd(dl, "Work", "")
            .append(place_a(person.work))
    }

    if (person.mother) {
        dt_dd(dl, "Mother", "")
            .append(person_a(person.mother))
    }

    if (person.father) {
        dt_dd(dl, "Father", "")
            .append(person_a(person.father))
    }

    if (person.spouses && person.spouses.length > 0) {
        var dd = dt_dd(dl, "Spouse", "")
        append_persons(dd, person.spouses)
    }

    if (person.grandparents && person.grandparents.length > 0) {
        var dd = dt_dd(dl, "Grandparents", "")
        append_persons(dd, person.grandparents)
    }

    if (person.uncles && person.uncles_aunts.length > 0) {
        var dd = dt_dd(dl, "Uncles/Aunts", "")
        append_persons(dd, person.uncles_aunts)
    }

    if (person.parents && person.parents.length > 0) {
        var dd = dt_dd(dl, "Parents", "")
        append_persons(dd, person.parents)
    }

    if (person.siblings && person.siblings.length > 0) {
        var dd = dt_dd(dl, "Siblings", "")
        append_persons(dd, person.siblings)
    }

    if (person.cousins && person.cousins.length > 0) {
        var dd = dt_dd(dl, "Cousins", "")
        append_persons(dd, person.cousins)
    }

    if (person.children && person.children.length > 0) {
        var dd = dt_dd(dl, "Children", "")
        append_persons(dd, person.children)
    }

    if (person.nephews_nieces && person.nephews_nieces.length > 0) {
        var dd = dt_dd(dl, "Nephews/Nieces", "")
        append_persons(dd, person.nephews_nieces)
    }

    if (person.grandchildren && person.grandchildren.length > 0) {
        var dd = dt_dd(dl, "Grand children", "")
        append_persons(dd, person.grandchildren)
    }

    if (person.notes) {
        dt_dd(dl, "Notes", person.notes)
    }

    if (person.email) {
        dt_dd(dl, "E-Mail", person.email)
    }


    $("<div class='infobox'/>")
        .append(dl)
        .appendTo(cm)


    var search = { params: { person: person.id }}

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(search_results_a(search, 0, "Show Photos"))
        .appendTo(ul)

    $("<li/>")
        .append(person_search_a({}))
        .appendTo(ul)

    if (person.can_add) {
        $("<li/>")
            .append(add_person_a())
            .appendTo(ul)
    }

    if (person.can_change) {
        $("<li/>")
            .append(change_person_a(person))
            .appendTo(ul)
    }

    if (person.can_delete) {
        $("<li/>")
            .append(delete_person_a(person))
            .appendTo(ul)
    }

    append_action_links(ul)

    bc = $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(person_search_a({}))
        .append("  › " + escapeHTML(person.title))
}


function display_change_person(person) {
    var dialog = $("<div id='dialog'></div>")

    if (person.id != null) {
        dialog.attr('title', "Change " + person.title)
    } else {
        dialog.attr('title', "Add person")
    }

    var f = $("<form method='get' />")

    var table = $("<table />")

    settings = get_settings()

    append_field(table, "first_name", "First name")
        .append(get_input_element("first_name", person.first_name, "text"))

    append_field(table, "middle_name", "Middle name")
        .append(get_input_element("middle_name", person.middle_name, "text"))

    append_field(table, "last_name", "Last name")
        .append(get_input_element("last_name", person.last_name, "text"))

    append_field(table, "called", "Called")
        .append(get_input_element("called", person.called, "text"))

    append_field(table, "gender", "Gender")
        .append(get_input_select("gender", [ ['1', 'Male'], ['2', 'Female'] ], person.gender))

    append_field(table, "dob", "Date of birth")
        .append(get_input_element("dob", person.dob, "text"))

    append_field(table, "dod", "Date of death")
        .append(get_input_element("dod", person.dod, "text"))

    append_field(table, "email", "E-Mail")
        .append(get_input_element("email", person.called, "text"))

    append_field(table, "notes", "Notes")
        .append(get_input_textarea("notes", 10, 40, person.notes))

    append_field(table, "cover_photo", "Cover Photo")
        .append(get_input_photo("cover_photo", person.cover_photo))

    append_field(table, "work_text", "Work")
        .append(get_ajax_select("work", 'place', person.work))

    append_field(table, "home_text", "Home")
        .append(get_ajax_select("home", 'place', person.home))

    append_field(table, "mother_text", "Mother")
        .append(get_ajax_select("mother", 'person', person.mother))

    append_field(table, "father_text", "Father")
        .append(get_ajax_select("father", 'person', person.father))

    var spouse = null
    if (person.spouses.length > 0) {
        spouse = person.spouses[0]
    }
    append_field(table, "spouse_text", "Spouse")
        .append(get_ajax_select("spouse", 'person', spouse))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_person(person, $( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            width: 400,
            buttons: {
                Save: function() {
                    submit_change_person(person, $( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_change_person(person, dialog, form) {
    var updates = {
        first_name: parse_form_string(form.first_name.value),
        middle_name: parse_form_string(form.middle_name.value),
        last_name: parse_form_string(form.last_name.value),
        called: parse_form_string(form.called.value),
        gender: parse_form_string(form.gender.value),
        dob: parse_form_string(form.dob.value),
        dod: parse_form_string(form.dod.value),
        email: parse_form_string(form.email.value),
        notes: parse_form_string(form.notes.value),
        cover_photo: parse_form_string(form.cover_photo.value),
        work: parse_form_string(form.work.value),
        home: parse_form_string(form.home.value),
        mother: parse_form_string(form.mother.value),
        father: parse_form_string(form.father.value),
        spouse: parse_form_string(form.spouse.value),
    }

    display_loading()
    load_change_person(
            person.id,
            updates,
            function(data) {
                hide_status()
                dialog.dialog("close")
                replace_links()
                update_session(data.session)
                if (window.history.state==null) {
                    display_person(data.person)
                    update_history(false, person_url(data.person), {
                        type: 'display_person',
                        person_id: data.person.id,
                    });
                } else if (person.id==null) {
                    display_person(data.person)
                    update_history(true, person_url(data.person), {
                        type: 'display_person',
                        person_id: data.person.id,
                    });
                } else if (window.history.state.type=='display_person' && window.history.state.person_id==data.person.id) {
                    display_person(data.person)
                } else {
                    reload_page()
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to update the person")
            })

    return false
}


function display_delete_person(person) {
    var dialog = $("<div id='dialog'><p>Are you sure you want to delete person '"+escapeHTML(person.title)+"'?</p></div>")
        .attr('title', "Delete " + person.title)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Delete: function() {
                    submit_delete_person(person, $(this))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_delete_person(person, dialog) {
    display_loading()
    load_delete_person(
            person.id,
            function(data) {
                update_session(data.session)
                if (data.status == 'success') {
                    hide_status()
                    dialog.dialog("close")
                    window.history.go(-1)
                } else if (data.status == 'errors') {
                    for (var i in data.errors) {
                        alert(data.errors[i])
                    }
                    hide_status()
                    dialog.dialog("close")
                } else {
                    alert("Unknown error")
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to delete the person")
            })

    return false
}


function display_change_photo_relation(photo_relation) {
    var dialog = $("<div id='dialog'></div>")

    if (photo_relation.id != null) {
        dialog.attr('title', "Change " + photo_relation.photo_1.title + "/" + photo_relation.photo_2.title + " relationship")
    } else {
        dialog.attr('title', "Add photo_relation")
    }

    var f = $("<form method='get' />")

    var table = $("<table />")

    settings = get_settings()

    append_field(table, "photo_1", "Photo")
        .append(get_input_photo("photo_1", photo_relation.photo_1))

    append_field(table, "desc_1", "Description")
        .append(get_input_element("desc_1", photo_relation.desc_1, "desc_1"))

    append_field(table, "photo_2", "Photo")
        .append(get_input_photo("photo_2", photo_relation.photo_2))

    append_field(table, "desc_2", "Description")
        .append(get_input_element("desc_2", photo_relation.desc_2, "desc_2"))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_change_photo_relation(photo_relation, $( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            width: 400,
            buttons: {
                Save: function() {
                    submit_change_photo_relation(photo_relation, $( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_change_photo_relation(photo_relation, dialog, form) {
    var updates = {
        desc_1: parse_form_string(form.desc_1.value),
        desc_2: parse_form_string(form.desc_2.value),
        photo_1: parse_form_string(form.photo_1.value),
        photo_2: parse_form_string(form.photo_2.value),
    }

    display_loading()
    load_change_photo_relation(
            photo_relation.id,
            updates,
            function(data) {
                hide_status()
                dialog.dialog("close")
                reload_page()
            },
            function() {
                hide_status()
                alert("An error occured trying to update the photo_relation")
            })

    return false
}


function display_delete_photo_relation(photo_relation) {
    var p = $("<p></p>").text("Are you sure you want to delete the photo relation between "
            + photo_relation.photo_1.title + " and " + photo_relation.photo_2.title + "?")
    var dialog = $("<div id='dialog'></div>")
        .append(p)
        .attr('title', "Delete " + photo_relation.title)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Delete: function() {
                    submit_delete_photo_relation(photo_relation, $(this))
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_delete_photo_relation(photo_relation, dialog) {
    display_loading()
    load_delete_photo_relation(
            photo_relation.id,
            function(data) {
                update_session(data.session)
                if (data.status == 'success') {
                    hide_status()
                    dialog.dialog("close")
                    window.history.go(-1)
                } else if (data.status == 'errors') {
                    for (var i in data.errors) {
                        alert(data.errors[i])
                    }
                    dialog.dialog("close")
                    hide_status()
                } else {
                    alert("Unknown error")
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to delete the photo_relation")
            })

    return false
}


function display_search(search, data) {
    var params = search.params

    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Search photos")

    var f = $("<form method='get' />")

    photo_ids = "|"
    if (data.photo != null) {
        photo_ids = $.map(data.photo, function(photo){ return photo.id });
        photo_ids = "|" + photo_ids.join("|") + "|"
    }
    f.append(get_input_element("photo", photo_ids, "hidden"))
    photo_ids = null

    var tabs = $("<div></div>")

    $("<ul></ul>")
        .append("<li><a href='#photo'>Photo</a></li>")
        .append("<li><a href='#connections'>Connections</a></li>")
        .append("<li><a href='#camera'>Camera</a></li>")
        .appendTo(tabs)

    var table = $("<table />")

    append_field(table, "first_date", "First Date")
        .append(get_input_element("first_date", data.first_date, "text"))

    append_field(table, "last_date", "Last Date")
        .append(get_input_element("last_date", data.last_date, "text"))

    append_field(table, "lower_rating", "Lower Rating")
        .append(get_input_element("lower_rating", data.lower_rating, "text"))

    append_field(table, "upper_rating", "Upper Rating")
        .append(get_input_element("upper_rating", data.upper_rating, "text"))

    append_field(table, "title", "Title")
        .append(get_input_element("title", data.title, "text"))

    append_field(table, "photographer_text", "Photographer")
        .append(get_ajax_select("photographer", 'person', data.photographer))

    append_field(table, "path", "Path")
        .append(get_input_element("path", data.path, "text"))

    append_field(table, "name", "Name")
        .append(get_input_element("name", data.name, "text"))

    append_field(table, "first_id", "First id")
        .append(get_input_element("first_id", data.first_id, "text"))

    append_field(table, "last_id", "Last id")
        .append(get_input_element("last_id", data.last_id, "text"))

    $("<div id='photo'></div>")
        .append(table)
        .appendTo(tabs)

    var table = $("<table />")

    append_field(table, "person_text", "Person")
        .append(get_ajax_multiple_select("person", 'person', data.person))

    append_field(table, "person_none", "Person none")
        .append(get_input_checkbox("person_none", data.person_none))

    append_field(table, "place_text", "Place")
        .append(get_ajax_select("place", 'place', data.place))

    append_field(table, "place_descendants", "Place descendants")
        .append(get_input_checkbox("place_descendants", data.place_none))

    append_field(table, "place_none", "Place none")
        .append(get_input_checkbox("place_none", data.place_none))

    append_field(table, "album_text", "Album")
        .append(get_ajax_multiple_select("album", 'album', data.album))

    append_field(table, "album_descendants", "Album descendants")
        .append(get_input_checkbox("album_descendants", data.album_descendants))

    append_field(table, "album_none", "Album none")
        .append(get_input_checkbox("album_none", data.album_none))

    append_field(table, "category_text", "Category")
        .append(get_ajax_multiple_select("category", 'category', data.category))

    append_field(table, "category_descendants", "Category descendants")
        .append(get_input_checkbox("category_descendants", data.category_none))

    append_field(table, "category_none", "Category none")
        .append(get_input_checkbox("category_none", data.category_none))

    $("<div id='connections'></div>")
        .append(table)
        .appendTo(tabs)

    var table = $("<table />")

    append_field(table, "camera_make", "Camera Make")
        .append(get_input_element("camera_make", data.camera_make, "text"))

    append_field(table, "camera_model", "Camera Model")
        .append(get_input_element("camera_model", data.camera_model, "text"))

    $("<div id='camera'></div>")
        .append(table)
        .appendTo(tabs)

    tabs.tabs()

    f.append(tabs)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_search($( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Search: function() {
                    submit_search($( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_search(dialog, form) {

    var params = { }

    if (form.photo.value != "|") {
        var photo = form.photo.value.slice(1,-1).split("|")
        params['photo'] = photo.join(".")
    }

    if (form.first_date.value) {
        params['first_date'] = form.first_date.value
    }

    if (form.last_date.value) {
        params['last_date'] = form.last_date.value
    }

    if (form.lower_rating.value) {
        params['lower_rating'] = form.lower_rating.value
    }

    if (form.upper_rating.value) {
        params['upper_rating'] = form.upper_rating.value
    }

    if (form.title.value) {
        params['title'] = form.title.value
    }

    if (form.photographer.value) {
        params['photographer'] = form.photographer.value
    }

    if (form.person.value != "|") {
        var person = form.person.value.slice(1,-1).split("|")
        params['person'] = person.join(".")
    }

    if (form.person_none.checked) {
        params['person_none'] = "true"
    }

    if (form.place.value) {
        params['place'] = form.place.value
    }

    if (form.place_descendants.checked) {
        params['place_descendants'] = "true"
    }

    if (form.place_none.checked) {
        params['place_none'] = "true"
    }

    if (form.album.value != "|") {
        var album = form.album.value.slice(1,-1).split("|")
        params['album'] = album.join(".")
    }

    if (form.album_descendants.checked) {
        params['album_descendants'] = "true"
    }

    if (form.album_none.checked) {
        params['album_none'] = "true"
    }

    if (form.category.value != "|") {
        var category = form.category.value.slice(1,-1).split("|")
        params['category'] = category.join(".")
    }

    if (form.category_descendants.checked) {
        params['category_descendants'] = "true"
    }

    if (form.category_none.checked) {
        params['category_none'] = "true"
    }

    if (form.path.value) {
        params['path'] = form.path.value
    }

    if (form.name.value) {
        params['name'] = form.name.value
    }

    if (form.camera_make.value) {
        params['camera_make'] = form.camera_make.value
    }

    if (form.camera_model.value) {
        params['camera_model'] = form.camera_model.value
    }

    if (form.first_id.value) {
        params['first_id'] = form.first_id.value
    }

    if (form.last_id.value) {
        params['last_id'] = form.last_id.value
    }

    var search = {
        params: params,
    }

    do_search_results(search, 0, true)

    dialog.dialog( "close" )

    return false
}


function display_search_results(search, results) {
    var cm = $("#content-main")
    cm.html("")

    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.floor(results.number_results / search.results_per_page)

    document.title = "Photo List " + (page+1) + "/" + (last_page+1) + " | Photos | Spud"
    cm.append("<h1>Photo List " + escapeHTML(page+1) + "/" + escapeHTML(last_page+1) + "</h1>")

    cm.append(search_infobox(search, results))
    cm.append(search_photo_list(search, results))
    cm.append(search_paginator(search, results))

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(search_a(search))
        .appendTo(ul)

    append_action_links(ul)

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › Photos")

    if (results.number_results > 0 && results.photos[0].can_change) {
        if (is_edit_mode()) {
            $("<li>")
                .on("click", function() {
                    set_normal_mode()
                    reload_page()
                    return false;
                })
                .html("<a href='#'>View</a>")
                .appendTo(ul)
            photo_change_keyboard(null, search.params, results.number_results)
        } else {
            $("<li>")
                .on("click", function() {
                    set_edit_mode()
                    reload_page()
                    return false;
                })
                .html("<a href='#'>Edit</a>")
                .appendTo(ul)
        }
    }
}


function search_infobox(search, results) {
    var dl = $("<dl/>")

    for (var i in results.criteria) {
        c = results.criteria[i]

        dd = dt_dd(dl, c.key, "")
        $("<dt/>")

        dd
        .append(c.condition)
        .append(" ")

        var type = c.value.type
        if (type == 'album') {
            dd.append(album_a(c.value))
        } else if (type == 'category') {
            dd.append(category_a(c.value))
        } else if (type == 'place') {
            dd.append(place_a(c.value))
        } else if (type == 'person') {
            dd.append(person_a(c.value))
        } else if (type == 'datetime') {
            dd.append(datetime_a(c.value))
        } else if (type == 'photos') {
            var sep=""
            $.each(c.value.value, function(j, photo){ dd.append(sep); dd.append(photo_a(photo, photo.id)); sep=", " });
        } else {
            dd.append(escapeHTML(c.value.value))
        }

        if (c.post_text != null) {
            dd.append(" ")
            dd.append(escapeHTML(c.post_text))
        }
    }

    ib = $("<div class='infobox'/>")
    ib.append(dl)
    return ib
}


function search_photo_list(search, results) {
    var pl = $("<ul class='photo_list'/>")

    for (var i in results.photos) {
        photo = results.photos[i]
        n = results.first + Number(i)

        li = photo_thumb(photo, photo.title, photo.localtime.date + " " + photo.localtime.time, photo.description,
            search_photo_url(search, n, photo),
            true,
            function(photo, n) {
                return function() {
                    do_search_photo(search, n, null, true)
                    return false
                }
            }(photo, n))
        pl.append(li)
    }
    pl.myselectable({
        filter: "li",
        selected: function( event, ui ) {
            add_selection( $(ui.selected).data('photo') ); },
        unselected: function( event, ui ) {
            del_selection( $(ui.unselected).data('photo') ); },
    })
    update_selection()
    return pl
}


function search_paginator(search, results) {
    var page = Math.floor(results.first / search.results_per_page)
    var last_page = Math.floor((results.number_results-1) / search.results_per_page)

    var html_page = function(page, text, key) {
        return search_results_a(search, page, text, key)
    }

    return generic_paginator(page, last_page, html_page)
}


function display_search_photo(search, results, n) {
    display_photo(results.photo)
    $("#content-main").append(photo_paginator(search, results, n))

    var page = Math.floor(n / search.results_per_page)

    var ul = $('<ul class="menu"/>')

    $("<li/>")
        .append(search_a(search))
        .appendTo(ul)

    if (results.photo.can_change) {
        if (is_edit_mode()) {
            $("<li>")
                .on("click", function() {
                    set_normal_mode()
                    reload_page()
                    return false;
                })
                .html("<a href='#'>View</a>")
                .appendTo(ul)
        } else {
            $("<li>")
                .on("click", function() {
                    set_edit_mode()
                    reload_page()
                    return false;
                })
                .html("<a href='#'>Edit</a>")
                .appendTo(ul)
        }
    }

    if (is_photo_selected(results.photo)) {
        $("<li>")
            .on("click", function() {
                del_selection(results.photo)
                reload_page()
                return false;
            })
            .html("<a href='#'>Unselect</a>")
            .appendTo(ul)
    } else {
        $("<li>")
            .on("click", function() {
                add_selection(results.photo);
                reload_page()
                return false;
            })
            .html("<a href='#'>Select</a>")
            .appendTo(ul)
    }

    append_action_links(ul)

    $(".breadcrumbs")
        .html("")
        .append(root_a())
        .append(" › ")
        .append(search_a(search))
        .append(" › ")
        .append(search_results_a(search, page))
        .append(" › ")
        .append(escapeHTML(results.photo.title))
}


function photo_paginator(search, results, n) {
    var page = n
    var last_page = results.number_results-1

    var html_page = function(page, text, key) {
        return search_photo_a(search, page, null, text, key)
    }

    return generic_paginator(page, last_page, html_page)
}


function display_settings(data) {
    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Login")

    var f = $("<form method='get' />")

    var table = $("<table />")

    settings = get_settings()

    append_field(table, "photos_per_page", "Photos per page")
        .append(get_input_element("photos_per_page", settings.photos_per_page, "text"))

    append_field(table, "persons_per_page", "Persons per page")
        .append(get_input_element("persons_per_page", settings.persons_per_page, "text"))

    append_field(table, "list_size", "List size")
        .append(get_input_select("list_size", data.list_sizes, settings.list_size))

    append_field(table, "view_size", "View size")
        .append(get_input_select("view_size", data.view_sizes, settings.view_size))

    append_field(table, "click_size", "Click size")
        .append(get_input_select("click_size", data.click_sizes, settings.click_size))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_settings($( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Save: function() {
                    submit_settings($( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_settings(dialog, form) {
    settings = get_settings()

    if (form.photos_per_page.value) {
        settings.photos_per_page = Number(form.photos_per_page.value)
    }

    if (form.persons_per_page.value) {
        settings.persons_per_page = Number(form.persons_per_page.value)
    }

    settings.list_size = form.list_size.value
    settings.view_size = form.view_size.value
    settings.click_size = form.click_size.value

    set_settings(settings)

    dialog.dialog( "close" )

    reload_page()
    return false
}


function display_login(push_history) {
    var dialog = $("<div id='dialog'></div>")
        .attr('title', "Login")

    var f = $("<form method='get' />")

    var table = $("<table />")

    append_field(table, "username", "Username")
        .append(get_input_element("username", "", "text"))

    append_field(table, "password", "Password")
        .append(get_input_element("password", "", "password"))

    f.append(table)

    dialog
        .keypress(function(ev) {
            if (ev.which == 13 && !ev.shiftKey) {
                submit_login($( this ), f[0])
                return false
            }
        })
        .append(f)
        .dialog({
            modal: true,
            close: function( event, ui ) { $(this).dialog("destroy") },
            buttons: {
                Login: function() {
                    submit_login($( this ), f[0])
                },
                Cancel: function() {
                    $( this ).dialog( "close" )
                },
            },
        })
}


function submit_login(dialog, form) {
    display_loading()
    load_login(
            form.username.value,
            form.password.value,
            function(data) {
                if (data.status == 'success') {
                    hide_status()
                    dialog.dialog("close")
                    if (window.history.state==null) {
                        do_root(false)
                    } else {
                        reload_page()
                    }
                } else if (data.status == 'account_disabled') {
                    hide_status()
                    alert("Account is disabled")
                } else if (data.status == 'invalid_login') {
                    hide_status()
                    alert("Invalid login")
                } else {
                    hide_status()
                    alert("Unknown error")
                }
            },
            function() {
                hide_status()
                alert("An error occured trying to login")
            })

    return false
}



// ********************
// * LOAD AND DISPLAY *
// ********************


function do_root(push_history) {
    replace_links()
    update_history(push_history, root_url(), {
        type: 'do_root',
    });
    display_root()
}


function do_login() {
    display_login()
}


function do_logout() {
    display_loading()
    load_logout(
        function(data) {
        if (data.status == 'success') {
            if (window.history.state==null) {
                do_root(false)
            } else {
                reload_page()
            }
        } else {
            display_error();
            alert("Unknown error")
        }
    },
    function() {
        display_error();
        alert("An error occured trying to do_logout")
    })
}


function do_photo(photo_id, push_history) {
    display_loading()
    load_photo(photo_id, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history, photo_url(data.photo), {
            type: 'display_photo',
            photo_id: data.photo.id,
        });
        display_photo(data.photo)
    }, display_error)
}


function do_album(album_id, push_history) {
    display_loading()
    load_album(album_id, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history, album_url(data.album), {
            type: 'display_album',
            album_id: data.album.id,
        });
        display_album(data.album)
    }, display_error)
}


function do_change_album(album_id, push_history) {
    display_loading()
    load_album(album_id, function(data) {
        hide_status()
        update_session(data.session)
        display_album(data.album)
        display_change_album(data.album)
    }, display_error)
}


function do_add_album(parent_album, push_history) {
    display_change_album({
        id: null,
        type: "album",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parents: [ parent_album ],
        children: [],
    })
}


function do_delete_album(album_id, push_history) {
    display_loading()
    load_album(album_id, function(data) {
        hide_status()
        update_session(data.session)
        display_album(data.album)
        display_delete_album(data.album)
    }, display_error)
}


function do_category(category_id, push_history) {
    display_loading()
    load_category(category_id, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history, category_url(data.category), {
            type: 'display_category',
            category_id: data.category.id,
        });
        display_category(data.category)
    }, display_error)
}


function do_change_category(category_id, push_history) {
    display_loading()
    load_category(category_id, function(data) {
        hide_status()
        update_session(data.session)
        display_category(data.category)
        display_change_category(data.category)
    }, display_error)
}


function do_add_category(parent_category, push_history) {
    display_change_category({
        id: null,
        type: "category",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parents: [ parent_category ],
        children: [],
    })
}


function do_delete_category(category_id, push_history) {
    display_loading()
    load_category(category_id, function(data) {
        hide_status()
        update_session(data.session)
        display_category(data.category)
        display_delete_category(data.category)
    }, display_error)
}


function do_place(place_id, push_history) {
    display_loading()
    load_place(place_id, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history, place_url(data.place), {
            type: 'display_place',
            place_id: data.place.id,
        });
        display_place(data.place)
    }, display_error)
}


function do_change_place(place_id, push_history) {
    display_loading()
    load_place(place_id, function(data) {
        hide_status()
        update_session(data.session)
        display_place(data.place)
        display_change_place(data.place)
    }, display_error)
}


function do_add_place(parent_place, push_history) {
    display_change_place({
        id: null,
        type: "place",
        title: "",
        address: "",
        address2: "",
        city: "",
        zip: "",
        country: "",
        url: "",
        urldesc: "",
        notes: "",
        parents: [ parent_place ],
        children: [],
    })
}


function do_delete_place(place_id, push_history) {
    display_loading()
    load_place(place_id, function(data) {
        hide_status()
        update_session(data.session)
        display_place(data.place)
        display_delete_place(data.place)
    }, display_error)
}


function do_person_search(search, push_history) {
    if (search.params == null) {
        search.params = {}
    }

    display_loading()
    load_person_search(search, function(data) {
        hide_status()
        update_session(data.session)
        display_person_search(search, data)
    }, display_error)
}


function do_person_search_results(search, page, push_history) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().persons_per_page

    display_loading()
    load_person_search_results(search, page, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history,
            person_search_results_url(search, page), {
                type: 'display_person_search_results',
                search: search,
                page: page,
            });
        display_person_search_results(search, data)
    }, display_error)
}


function do_person(person_id, push_history) {
    display_loading()
    load_person(person_id, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history, person_url(data.person), {
            type: 'display_person',
            person_id: data.person.id,
        });
        display_person(data.person)
    }, display_error)
}


function do_change_person(person_id, push_history) {
    display_loading()
    load_person(person_id, function(data) {
        hide_status()
        update_session(data.session)
        display_person(data.person)
        display_change_person(data.person)
    }, display_error)
}


function do_add_person(push_history) {
    display_change_person({
        id: null,
        type: "person",
        title: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        called: "",
        cover_photo: null,
        gender: null,
        dob: "",
        dod: "",
        home: null,
        work: null,
        father: null,
        mother: null,
        spouses: [],
        grandparents: [],
        uncles_aunts: [],
        parents: [],
        siblings: [],
        cousins: [],
        children: [],
        nephews_nieces: [],
        grandchildren: [],
        notes: "",
        email: "",
    })
}


function do_delete_person(person_id, push_history) {
    display_loading()
    load_person(person_id, function(data) {
        hide_status()
        update_session(data.session)
        display_person(data.person)
        display_delete_person(data.person)
    }, display_error)
}


function do_change_photo_relation(photo_relation_id, push_history) {
    display_loading()
    load_photo_relation(photo_relation_id, function(data) {
        hide_status()
        update_session(data.session)
        display_change_photo_relation(data.photo_relation)
    }, display_error)
}


function do_add_photo_relation(photo, push_history) {
    display_change_photo_relation({
        id: null,
        type: "photo_relation",
        photo_1: photo,
        photo_2: null,
        desc_1: photo.title,
        desc_2: "",
    })
}


function do_delete_photo_relation(photo_relation_id, push_history) {
    display_loading()
    load_photo_relation(photo_relation_id, function(data) {
        hide_status()
        update_session(data.session)
        display_delete_photo_relation(data.photo_relation)
    }, display_error)
}


function do_search(search, push_history) {
    if (search.params == null) {
        search.params = {}
    }

    display_loading()
    load_search(search, function(data) {
        hide_status()
        update_session(data.session)
        display_search(search, data)
    }, display_error)
}


function do_search_results(search, page, push_history) {
    if (search.results_per_page == null)
        search.results_per_page = get_settings().photos_per_page

    display_loading()
    load_search_results(search, page, function(data) {
        hide_status()
        replace_links()
        update_session(data.session)
        update_history(push_history,
            search_results_url(search, page), {
                type: 'display_search_results',
                search: search,
                page: page,
            });
        display_search_results(search, data)
    }, display_error)
}


function do_search_photo(search, n, photo_id, push_history) {
    display_loading()
    load_search_photo(search, n, function(data) {
        if (photo_id == null || photo_id == 0 || data.photo.id == photo_id) {
            hide_status()
            replace_links()
            update_session(data.session)
            update_history(push_history, search_photo_url(search, n, data.photo), {
                type: 'display_search_photo',
                search: search,
                n: n,
                photo_id: photo_id,
            });
            display_search_photo(search, data, n)
        } else {
            do_photo(photo_id, push_history)
        }
    }, display_error)
}

function do_settings(push_history) {
    display_loading()
    load_settings(function(data) {
        hide_status()
        update_session(data.session)
        display_settings(data)
    }, display_error)
}
