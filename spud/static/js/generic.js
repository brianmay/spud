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
"use strict"

$(document)
    .tooltip({
        items: "a",
        content: function() {
            var photo = $(this).data('photo')
            if (photo != null) {
                return $("<div></div>")
                    .image({size: 'thumb', photo: photo})
            }
            return null
        },
    })

// function generic() {
//     this.has_ancestors = true
//     this.has_children = true
//     this.has_photos = true
// }
//
// generic.prototype.setup_user_tools = function(session) {
//     var ut = $("#user-tools")
//
//     ut.empty()
//     ut.append("Welcome, ")
//
//     if (session.user) {
//         var user = session.user
//          $("<strong></strong")
//              .text(user.first_name + " " + user.last_name)
//              .appendTo(ut)
//     } else {
//          $("<strong></strong")
//              .text("guest")
//              .appendTo(ut)
//     }
// }
//
// generic.prototype.setup_menu = function(session) {
//     var menu = $("<ul/>")
//
//     menu.empty()
//
//     $('<li/>')
//         .on('click', function() { alert("meow") })
//         .text("Albums")
//         .appendTo(menu)
//
//     $('<li/>')
//         .on('click', function() { alert("meow") })
//         .text("Categorys")
//         .appendTo(menu)
//
//     $('<li/>')
//         .on('click', function() { alert("meow") })
//         .text("People")
//         .appendTo(menu)
//
//     menu.menu()
//     $("#menu").append(menu)
// }
//
// generic.prototype.setup_page = function(session) {
//     this.setup_user_tools(session)
//     this.setup_menu(session)
// }
//
// generic.prototype.add_screen = function(screen_class, pararms) {
//     var cm = $("#content-main")
//     var div = $("<div/>").appendTo(cm)
//     screen_class(params, div)
//     return div
// }
//
// generic.prototype.do_list = function(session, search) {
//     this.setup_page(session)
//
//     var params = {
//         'search': search,
//     }
//     this.add_screen($.spud.album_list_screen, params)
// }
//
// -------------------------------

///////////////////////////////////////
// signals
///////////////////////////////////////

window._listeners = {}

function remove_all_listeners(obj) {
    var key = "null"
    if (obj != null) {
        key = obj.get_uuid()
    }

    if (window._listeners[key] != null) {
        $.each(window._listeners[key], function(i, listener) {
            if (listener != null) {
                listener.remove_listener(obj)
            }
        })
    }

    delete window._listeners[key]
}
void remove_all_listeners

function signal() {
    this.on_no_listeners = null
    this.listeners = {}
    this.objects = {}
}

signal.prototype = {
    add_listener: function(obj, listener) {
        var key = "null"
        if (obj != null) {
            key = obj.get_uuid()
        }
        if (this.listeners[key]) {
            this.remove_listener(key)
        }
        this.listeners[key] = listener
        this.objects[key] = obj

        if (window._listeners[key] == null) {
            window._listeners[key] = []
        }
        window._listeners[key].push(this)
    },

    remove_listener: function(obj) {
        var key = "null"
        if (obj != null) {
            key = obj.get_uuid()
        }
        delete this.listeners[key]
        delete this.objects[key]

        if (window._listeners[key] == null) {
            var index = window._listeners[key].indexOf(this)
            if (index !== -1) {
                // Don't do this; is called from within loop in
                // remove_all_listeners
                // window._listeners[key].splice(index, 1)
                delete window._listeners[key]
            }
        }

        if (!this.is_any_listeners()) {
            if (this.on_no_listeners != null) {
                this.on_no_listeners()
            }
        }
    },

    is_any_listeners: function() {
        return !$.isEmptyObject(this.listeners)
    },

    trigger: function() {
        var mythis = this
        var fight = arguments
        $.each(this.listeners, function(uuid, listener) {
            var obj = null
            if (uuid !== "null") {
                obj = mythis.objects[uuid]
            }
            listener.apply(obj, fight)
        })
    }
}

window._reload_all = new signal()
window._perms_changed = new signal()
window._session_changed = new signal()


///////////////////////////////////////
// sessions
///////////////////////////////////////
$.widget('spud.login_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.fields = [
            ["username", new text_input_field("Username", true)],
            ["password", new password_input_field("Password", true)],
        ]

        this.options.title = "Login"
        this.options.description = "Please login by typing in your username and password below."
        this.options.button = "Login"
        this._type = "session"
        this._super();
    },

    _submit_values: function(values) {
        this._save("POST", "login", values)
    },

    _save_success: function(session) {
        window._session_changed.trigger(session)
        this._super(session);
    },
})

$.widget('spud.logout_dialog',  $.spud.form_dialog, {
    _create: function() {
        this.options.title = "Logout"
        this.options.description = "Are you sure you want to logout?"
        this.options.button = "Logout"
        this._type = "session"
        this._super();
    },

    _submit_values: function(values) {
        this._save("POST", "logout", values)
    },

    _save_success: function(session) {
        window._session_changed.trigger(session)
        this._super(session);
    },
})

function add_screen(screen_class, params) {
    var cm = $("#content")
    var div = $("<div/>").appendTo(cm)
    screen_class(params, div)
    return div
}

function setup_user_tools(session) {
    var ut = $("#user-tools")

    ut.empty()
    ut.append("Welcome, ")

    if (session.user) {
        var user = session.user
        $("<strong></strong")
            .text(user.first_name + " " + user.last_name)
            .appendTo(ut)

        ut.append(" / ")

        $("<a/>")
            .text("logout")
            .on("click", function(ev) {
                void ev
                var div = $("<div/>")
                $.spud.logout_dialog({}, div)
            })
            .appendTo(ut)
    } else {
        $("<strong></strong")
            .text("guest")
            .appendTo(ut)

        ut.append(" / ")

        $("<a/>")
            .text("login")
            .on("click", function(ev) {
                void ev
                var div = $("<div/>")
                $.spud.login_dialog({}, div)
            })
            .appendTo(ut)
    }
}

function setup_menu(session) {
    void session
    var menu = $("<ul/>")
        .addClass("menubar")
        .empty()

    $('<li/>')
        .text("Albums")
        .on('click', function(ev) {
            void ev
            var criteria = {root_only: true}
            add_screen($.spud.album_list_screen, {criteria: criteria})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Categories")
        .on('click', function(ev) {
            void ev
            var criteria = {root_only: true}
            add_screen($.spud.category_list_screen, {criteria: criteria})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Places")
        .on('click', function(ev) {
            void ev
            var criteria = {root_only: true}
            add_screen($.spud.place_list_screen, {criteria: criteria})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("People")
        .on('click', function(ev) {
            void ev
            var criteria = {}
            add_screen($.spud.person_list_screen, {criteria: criteria})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Photos")
        .on('click', function(ev) {
            void ev
            var criteria = {}
            add_screen($.spud.photo_list_screen, {criteria: criteria})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Feedback")
        .on('click', function(ev) {
            void ev
            var criteria = {}
            add_screen($.spud.feedback_list_screen, {criteria: criteria})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Reload")
        .on('click', function(ev) {
            void ev
            window._reload_all.trigger()
            return false
        })
        .appendTo(menu)
    menu.menu()

    $("#menu")
        .empty()
        .append(menu)
}

window._session_changed.add_listener(null, function(session) {
    window._perms = session.perms
    window._perms_changed.trigger(session.perms)
    setup_user_tools(session)
    setup_menu(session)
})

function setup_page(session) {
    window._session_changed.trigger(session)
    $("body").attr("onload", null)
}

void setup_page

///////////////////////////////////////
// state
///////////////////////////////////////
function get_state() {
    var results = []
    $.each($(".screen"), function(i, obj) {
        var screen = $(obj).data('screen')
        results[i] = {
            options: screen.get_streamable_options(),
            namespace: screen.namespace,
            widgetName: screen.widgetName,
        }
    })
    return results
}

function put_state(state) {
    window._dont_push = true

    $("#content").empty()
    $.each(state, function(i, screen_state) {
        var constructor = $[screen_state.namespace][screen_state.widgetName]
        add_screen(constructor, screen_state.options)
    })

    window._dont_push = false
}

function _get_page() {
    var title = "SPUD"
    var url = root_url()
    var active_screen = $(".screen:not(.disabled)").data("screen")
    if (active_screen != null) {
        title = active_screen.options.title
        url = active_screen.get_url()
    }
    return { title: title, url: url }
}

function push_state(do_replace) {
    if (window._dont_push) {
        return
    }

    var state = get_state()
    var page = _get_page()
    var title = page.title
    var url = page.url

    if (window._do_replace || do_replace) {
        console.log("replace state", JSON.stringify(state), title, url)
        history.replaceState(state, title, url)
    } else {
        console.log("push state", JSON.stringify(state), title, url)
        history.pushState(state, title, url)
    }

    $("head title").text(title)
}

window.onpopstate = function(ev) {
    console.log("pop state", JSON.stringify(ev.state))
    if (ev.state != null) {
        put_state(ev.state)
    } else {
        put_state([])
    }

    var page = _get_page()
    var title = page.title
    $("head title").text(title)
}

///////////////////////////////////////
// object_loader
///////////////////////////////////////
function object_loader(type, obj_id) {
    this._type = type
    this._obj_id = obj_id
    this._loading = false
    this._finished = false
    this.loaded_item = new signal()
    this.on_error = new signal()
}


object_loader.prototype = {
    load: function() {
        if (this._loading) {
            return
        }
        if (this._finished) {
            return
        }

        var mythis = this
        var criteria = this._criteria
        var page = this._page
        var params = $.extend({}, criteria, { 'page': page })

        console.log("loading object", this._type, this._obj_id)
        this._loading = true

        this.xhr = ajax({
            url: window.__root_prefix + "api/" + this._type + "/" + this._obj_id + "/",
            data: params,
            success: function(data) {
                console.log("got object", mythis._type, mythis._obj_id)
                mythis._loading = false
                mythis._finished = true

                mythis._got_item(data)
            },
            error: function(message) {
                mythis._loading = false
                console.log("error loading", mythis._type, mythis._obj_id, message)
                mythis.on_error.trigger()
            },
        });
    },

    abort: function() {
        if (this._loading) {
            this.xhr.abort()
        }
    },

    _got_item: function(obj) {
        this.loaded_item.trigger(obj)
    },

    check_for_listeners: function() {
        if (this.loaded_item.is_any_listeners()) {
            return
        }
        this.abort()
    },
}

function get_object_loader(type, obj_id) {
    return new object_loader(type, obj_id)
}

///////////////////////////////////////
// object_list_loader
///////////////////////////////////////
function object_list_loader(type, criteria) {
    var mythis = this
    this._type = type
    this._criteria = criteria
    this._page = 1
    this._n = 0
    this._loading = false
    this._finished = false
    this.loaded_item = new signal()
    this.loaded_item.on_no_listeners = function() { mythis.check_for_listeners() }
    this.loaded_list = new signal()
    this.loaded_list.on_no_listeners = function() { mythis.check_for_listeners() }
    this.on_error = new signal()
}


object_list_loader.prototype = {

    load_next_page: function() {
        if (this._loading) {
            return true
        }
        if (this._finished) {
            return false
        }

        var mythis = this
        var criteria = this._criteria
        var page = this._page
        var params = $.extend({}, criteria, { 'page': page })

        console.log("loading list", this._type, criteria, page)
        this._loading = true

        this.xhr = ajax({
            url: window.__root_prefix + "api/" + this._type + "/",
            data: params,
            success: function(data) {
                console.log("got list", mythis._type, criteria, page)
                mythis._loading = false
                mythis._page = page + 1
                if (!data.next) {
                    mythis._finished = true
                }

                mythis._got_list(data.results, data.count)
            },
            error: function(message) {
                mythis._loading = false
                console.log("error loading", mythis._type, criteria, message)
                mythis.on_error.trigger()
            },
        });

        return true
    },

    abort: function() {
        if (this._loading) {
            this.xhr.abort()
        }
    },

    _got_list: function(object_list, count) {
        var mythis = this
        $.each(object_list, function(j, obj) {
            mythis._got_item(obj, count, mythis._n)
            mythis._n = mythis._n + 1
        })

        // we trigger the object_list *after* all objects have been processed.
        this.loaded_list.trigger(object_list, count)
    },

    _got_item: function(obj, count, i) {
        this.loaded_item.trigger(obj, count, i)
    },

    check_for_listeners: function() {
        if (this.loaded_list.is_any_listeners()) {
            return
        }
        if (this.loaded_item.is_any_listeners()) {
            return
        }
        this.abort()
    },
}

function get_object_list_loader(type, criteria) {
    return new object_list_loader(type, criteria)
}
void get_object_list_loader

///////////////////////////////////////
// tracked_object_list_loader
///////////////////////////////////////
function tracked_object_list_loader(type, criteria) {
    object_list_loader.call(this, type, criteria)
    this._last_id = null
    this._idmap = {}
}

tracked_object_list_loader.prototype = {
    _got_item: function(obj, count, n) {
        object_list_loader.prototype._got_item.call(this, obj, count, n)

        var id = obj.id
        if (id != null) {
            this._idmap[id] = Object()
            if (this._last_id) {
                this._idmap[this._last_id].next = id
                this._idmap[id].prev = this._last_id
            }
            this._last_id = id
        }
    },

    get_meta: function(obj_id) {
        var meta = this._idmap[obj_id]
        if (!meta) {
            return null
        }
        if (!meta.next) {
            this.load_next_page()
        }
        return meta
    },
}

extend(object_list_loader, tracked_object_list_loader)


function get_tracked_object_list_loader(type, criteria) {
    return new tracked_object_list_loader(type, criteria)
}


///////////////////////////////////////
// generic widgets
///////////////////////////////////////
$.widget('spud.object_criteria', $.spud.widget, {
    _create: function() {
        if (this.load_attributes == null) {
            this.load_attributes = [
                { name: 'instance', type: this._type }
            ]
        }

        this._super()
        this.element.data('object_criteria', this)

        this.loaders = []

        this.criteria = $("<ul/>")
            .addClass("criteria")
            .appendTo(this.element)

        if (this.options.obj) {
            this.load(this.options.obj)
        }
    },

    _set: function(criteria) {
        void criteria
    },

    cancel_loaders: function() {
        var mythis = this

        $.each(this.loaders, function(i, loader) {
            loader.loaded_item.remove_listener(mythis)
            loader.on_error.remove_listener(mythis)
        })
    },

    load: function(criteria) {
        this._setOption("obj", criteria)
    },

    _load: function(criteria) {
        var mythis = this
        this.cancel_loaders()
        this._set(criteria)
        var clone = $.extend({}, criteria)
        $.each(this.load_attributes, function(i, value) {
            if (criteria[value.name] == null) {
                return
            }
            var loader = get_object_loader(value.type, criteria[value.name])
            loader.loaded_item.add_listener(mythis, function(obj) {
                clone[value.name] = obj.title
                mythis._set(clone)
                mythis.loader = null
            })
            loader.on_error.add_listener(mythis, function() {
                mythis.element.addClass("error")
            })
            loader.load()
            mythis.loaders.push(loader)
        })
    },

    _setOption: function(key, value ) {
        if ( key === "obj" ) {
            this._load(value)
        }
        this._super( key, value );
    },
})


$.widget('spud.object_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()
        this.element.data('object_list', this)

        var mythis = this
        this.page = 1

        if (this.options.disabled) {
            this.element.addClass("disabled")
        }

        if (this.options.criteria != null) {
            this._filter(this.options.criteria)
        }

        this.element.scroll(function() {
            mythis._load_if_required(mythis.options.criteria)
        })

        window._reload_all.add_listener(this, function() {
            this.empty()
            this._filter(this.options.criteria)
        })
    },

    _get_item: function(obj_id) {
        return this.ul.find("[data-id=" + obj_id + "]")
    },

    _add_item: function(obj, count, n) {
        void n
        this._create_li(obj)
            .appendTo(this.ul)
        return this
    },

    _add_list: function(obj_list, count) {
        this.element.toggleClass("hidden", count === 0)
        this._load_if_required()
        return this
    },

    _load_if_required: function() {
        // if element is not displayed, we can't tell the scroll position,
        // so we must wait for element to be displayed before we can continue
        // loading
        if (!this.options.disabled && this.loader) {
            if (this.element.find("ul").height() <
                    this.element.scrollTop() + this.element.height() + 200) {
                this.loader.load_next_page()
            }
        }
    },

    _filter: function(criteria) {
        var mythis = this
        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
            this.loader.loaded_list.remove_listener(this)
            this.loader = null
        }
        this.options.criteria = criteria
        this.loader = get_tracked_object_list_loader(this._type, criteria)
        this.loader.loaded_item.add_listener(this, this._add_item)
        this.loader.loaded_list.add_listener(this, this._add_list)
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
        })
        this.loader.load_next_page()
    },

    _setOption: function( key, value ) {
        if ( key === "criteria" ) {
            this.empty()
            this._filter(value)
        } else if (key === "disabled") {
            if (!value) {
                this._enable()
            } else {
                this._disable()
            }
        }
        this._super( key, value );
    },

    empty: function() {
        this.page = 1
        this._super()
        this.element.removeClass("error")
        if (this.loader) {
            this.loader.loaded_item.remove_listener(this)
            this.loader.loaded_list.remove_listener(this)
            this.loader.on_error.remove_listener(this)
            this.loader = null
        }
    },

    _enable: function() {
        this.element.removeClass("disabled")
        this._load_if_required()
    },

    _disable: function() {
        this.element.addClass("disabled")
    },
})


$.widget('spud.object_detail',  $.spud.infobox, {
    _create: function() {
        this._super()
        this.element.data('object_detail', this)

        if (this.options.obj != null) {
            this.options.obj_id = this.options.obj.id
        } else if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }
    },

    load: function(obj_id) {
        this._setOption("obj_id", obj_id)
    },

    _load: function(obj_id) {
        var mythis = this

        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
        }

        this.loader = get_object_loader(this._type, obj_id)
        this.loader.loaded_item.add_listener(this, function(obj) {
            mythis.set(obj)
            mythis.loader = null
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
            mythis.loader = null
        })
        this.loader.load()
    },

    _setOption: function( key, value ) {
        if ( key === "obj_id" ) {
            this._load(value)
        }
        this._super( key, value );
    },
})

///////////////////////////////////////
// generic screens
///////////////////////////////////////
$.widget('spud.object_list_screen', $.spud.screen, {
    _setup_menu: function(menu) {
        var mythis = this

        menu.append(
            $("<li/>")
                .text("Filter")
                .on("click", function(ev) {
                    void ev
                    var params = {
                        obj: mythis.options.criteria,
                        on_success: function(criteria) {
                            mythis._filter(criteria)
                            return true
                        }
                    }
                    var div = $("<div/>")
                    mythis._object_search_dialog(params, div)
                })
        )
    },

    _create: function() {
        var mythis = this

        if (!this.options.criteria) {
            this.options.criteria = {}
        }

        this.options.title = this._type_name + " list"
        this._super()

        var menu = $("<ul/>")
            .addClass("menubar")

        this._setup_menu(menu)

        menu.menu()
            .appendTo(this.div)

        var params = {
            'obj': this.options.criteria,
            'on_load': function(criteria_dummy, title) {
                mythis._set_title(mythis._type_name + " list: " + title)
            }
        }
        this.criteria = $("<div/>").appendTo(this.div)
        this._object_criteria(params, this.criteria)

        params = {
            'child_id': this.options.id + ".child",
            'criteria': this.options.criteria,
            'disabled': this.options.disabled,
        }
        if (this.options.object_list_options != null) {
            params = $.extend({}, this.options.object_list_options, params)
        }
        this._ol = $("<div/>").appendTo(this.div)
        this._object_list(params, this._ol)
    },

    _filter: function(value) {
        this.options.criteria = value
        push_state()

        var instance = this.criteria.data('object_criteria')
        instance.load(value)

        instance = this._ol.data('object_list')
        instance.option("criteria", value)
    },

    _setOption: function( key, value ) {
        if ( key === "criteria" ) {
            this._filter(value)
        }
        this._super( key, value );
    },

    _enable: function() {
        this._super()
        if (this._ol != null) {
            var instance = this._ol.data('object_list')
            instance.enable()
        }
    },

    _disable: function() {
        this._super()
        if (this._ol != null) {
            var instance = this._ol.data('object_list')
            instance.disable()
        }
    },

    get_url: function() {
        var params = ""
        if (!$.isEmptyObject(this.options.criteria)) {
            params = "?" + $.param(this.options.criteria)
        }
        return root_url() + this._type + "/" + params
    },
})


$.widget('spud.object_detail_screen', $.spud.screen, {
    _setup_menu: function(menu) {
        var mythis = this

        menu.append(
            $("<li/>")
                .text("Children")
                .on("click", function(ev) {
                    void ev
                    var screen_class = mythis._object_list_screen
                    var params = {
                        criteria: mythis._get_children_criteria(),
                    }
                    add_screen(screen_class, params)
                })
        )

        if (this._photo_list_screen != null) {
            menu.append(
                $("<li/>")
                    .text("Photos")
                    .on("click", function(ev) {
                        void ev
                        var screen_class = mythis._photo_list_screen
                        var params = {
                            criteria: mythis._get_photo_criteria(),
                        }
                        add_screen(screen_class, params)
                    })
            )
        }

        this.create_item = $("<li/>")
            .text("Create")
            .on("click", function(ev) {
                void ev
                if (mythis.options.obj != null) {
                    var obj = {
                        parent: mythis.options.obj.id,
                    }
                    var params = {
                        obj: obj,
                    }
                    var div = $("<div/>")
                    mythis._object_change_dialog(params, div)
                }
            })
            .appendTo(menu)

        this.change_item = $("<li/>")
            .text("Change")
            .on("click", function(ev) {
                void ev
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    mythis._object_change_dialog(params, div)
                }
            })
            .appendTo(menu)

        this.delete_item = $("<li/>")
            .text("Delete")
            .on("click", function(ev) {
                void ev
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    mythis._object_delete_dialog(params, div)
                }
            })
            .appendTo(menu)
    },

    _create: function() {
        var mythis = this

        this.options.title = this._type_name + " Detail"

        if (this.options.obj != null) {
            var tmp_obj = this.options.obj
            this.options.obj_id = tmp_obj.id
            this.options.title = this._type_name + ": " + tmp_obj.title
        }

        this._super()

        var menu = $("<ul/>")
            .addClass("menubar")

        this._setup_menu(menu)

        menu
            .menu()
            .appendTo(this.div)

        var button_div = $("<div/>").appendTo(this.div)

        this.prev_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '<<')
            .click(function() {
                var oll = mythis.options.object_list_loader
                var meta = oll.get_meta(mythis.options.obj_id)
                var obj_id = meta.prev
                if (obj_id) {
                    mythis.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(button_div)

        this.next_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '>>')
            .click(function() {
                var oll = mythis.options.object_list_loader
                var meta = oll.get_meta(mythis.options.obj_id)
                var obj_id = meta.next
                if (obj_id) {
                    mythis.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(button_div)

        this._setup_loader()
        this._setup_buttons()

        this._od = $("<div/>").appendTo(this.div)
        this._object_detail({}, this._od)

        var params = {
            'child_id': this.options.id + ".child",
            'disabled': this.options.disabled,
        }
        this._ol = $("<div/>").appendTo(this.div)
        this._object_list(params, this._ol)

        if (this.options.obj != null) {
            this.set(this.options.obj)
        } else if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }

        this._setup_perms(window._perms)
        window._perms_changed.add_listener(this, this._setup_perms)

        window._reload_all.add_listener(this, function() {
            mythis.load(this.options.obj_id)
        })
    },

    _get_children_criteria: function() {
        return {
            'instance': this.options.obj_id,
            'mode': 'children',
        }
    },

    _setup_loader: function() {
        var mythis = this
        if (this.options.object_list_loader != null) {
            var oll = this.options.object_list_loader
            oll.loaded_list.add_listener(this, function(object_list, count) {
                void count
                mythis._setup_buttons()
            })
        }
    },

    _setup_perms: function(perms) {
        var can_create = false
        var can_change = false
        var can_delete = false

        if (perms[this._type] != null) {
            var perms_for_type = perms[this._type]
            can_create = perms_for_type.can_create
            can_change = perms_for_type.can_change
            can_delete = perms_for_type.can_delete
        }

        this.create_item.toggle(can_create)
        this.change_item.toggle(can_change)
        this.delete_item.toggle(can_delete)

        if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }
    },

    _setup_buttons: function() {
        if (this.options.object_list_loader) {
            var oll = this.options.object_list_loader
            var meta = null
            if (this.options.obj_id) {
                meta = oll.get_meta(this.options.obj_id)
            }

            this.prev_button.show()
            this.next_button.show()

            if (meta != null && meta.prev) {
                this.prev_button.button("enable")
            } else {
                this.prev_button.button("disable")
            }
            if (meta && meta.next) {
                this.next_button.button("enable")
            } else {
                this.next_button.button("disable")
            }
        } else {
            this.prev_button.hide()
            this.next_button.hide()
        }
    },

    set: function(obj) {
        this._setOption("obj", obj)
    },

    _set: function(obj) {
        this.options.obj = obj
        this.options.obj_id = obj.id
        var instance = this._od.data('object_detail')
        instance.set(obj)

        this._loaded(obj)
    },

    load: function(obj_id) {
        this._setOption("obj_id", obj_id)
    },

    _load: function(obj_id) {
        this.options.obj = null
        this.options.obj_id = obj_id

        var mythis = this

        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
        }

        this.loader = get_object_loader(this._type, obj_id)
        this.loader.loaded_item.add_listener(this, function(obj) {
            mythis.loader = null
            mythis._loaded(obj)
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
            mythis.loader = null
            mythis._loaded_error()
        })
        this.loader.load()
    },

    _loaded: function(obj) {
        this.element.removeClass("error")
        this.options.obj = obj
        this.options.obj_id = obj.id
        this._set_title(this._type_name + ": " + obj.title)
        this._setup_buttons()

        var instance = this._od.data('object_detail')
        instance.set(obj)

        instance = this._ol.data('object_list')
        instance.option("criteria", this._get_children_criteria())
    },

    _loaded_error: function() {
        this.element.addClass("error")
    },

    set_loader: function(oll) {
        this._setOption("object_list_loader", oll)
    },

    _set_loader: function(oll) {
        var old_loader = this.options.object_list_loader
        if (old_loader != null) {
            old_loader.loaded_list.remove_listener(this)
        }
        this.options.object_list_loader = oll

        this._setup_loader()
        this._setup_buttons()
    },

    _enable: function() {
        this._super()
        if (this._ol) {
            var instance = this._ol.data('object_list')
            instance.enable()
        }
    },

    _disable: function() {
        this._super()
        if (this._ol) {
            var instance = this._ol.data('object_list')
            instance.disable()
        }
    },

    _setOption: function( key, value ) {
        if ( key === "obj" ) {
            this._set(value)
        } else if ( key === "obj_id" ) {
            this._load(value)
        } else if ( key === "object_list_loader" ) {
            this._set_loader(value)
        }
        this._super( key, value );
    },

    get_url: function() {
        return root_url() + this._type + "/" + this.options.obj_id + "/"
    },

    get_streamable_options: function() {
        var options = this._super()
        delete options.object_list_loader
        return options
    },

    _photo_list_screen: function(params, div) {
        return $.spud.photo_list_screen(params, div)
    },
})
