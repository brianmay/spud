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

function signal() {
    this.on_no_listeners = null
    this.listeners = {}
    this.objects = {}
}

signal.prototype.add_listener = function(obj, listener) {
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
}

signal.prototype.remove_listener = function(obj) {
    var key = "null"
    if (obj != null) {
        key = obj.get_uuid()
    }
    delete this.listeners[key]
    delete this.objects[key]

    if (window._listeners[key] == null) {
        var index = window._listeners[key].indexOf(this)
        if (index != -1) {
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
}

signal.prototype.is_any_listeners = function() {
    return ! $.isEmptyObject(this.listeners)
}

signal.prototype.trigger = function() {
    var mythis = this
    var fight = arguments
    $.each(this.listeners, function(uuid, listener) {
        var obj = null
        if (uuid != "null") {
            obj = mythis.objects[uuid]
        }
        listener.apply(obj, fight)
    })
}

window._reload_all = new signal()
window._perms_changed = new signal()
window._session_changed = new signal()


///////////////////////////////////////
// save_dialog
///////////////////////////////////////
$.widget('spud.save_dialog',  $.spud.form_dialog, {
    _save: function(http_type, oject_id, values) {
        var mythis = this
        var type = this._type
        this._loading = true
        this.uiDialogButtonPane.find(".ui-button").button("disable")
        var url
        if (oject_id != null) {
            url = window.__root_prefix + "api/" + type + "/" + oject_id + "/"
        } else {
            url = window.__root_prefix + "api/" + type + "/"
        }
        this.xhr = ajax({
            url: url,
            data: values,
            type: http_type,
            success: function(data) {
                mythis._loading = false
                mythis._done(data)
                mythis.close()
            },
            error: function(message) {
                mythis._loading = false
                alert("Error: " + message)
                mythis.uiDialogButtonPane.find(".ui-button").button("enable")
            },
        });
    },

    _done: function(data) {
    },

})

///////////////////////////////////////
// sessions
///////////////////////////////////////
$.widget('spud.login_dialog',  $.spud.save_dialog, {
    _create: function() {
        this.options.fields = [
            ["username", new text_input_field("Username", true)],
            ["password", new password_input_field("Password", true)],
        ],

        this.options.title = "Login"
        this.options.description = "Please login by typing in your username and password below."
        this.options.button = "Login"
        this._type = "session"
        this._super();
    },

    _submit_values: function(values) {
        this._save("POST", "login", values)
    },

    _done: function(session) {
        window._session_changed.trigger(session)
    },
})

$.widget('spud.logout_dialog',  $.spud.save_dialog, {
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

    _done: function(session) {
        window._session_changed.trigger(session)
    },
})

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
                var div = $("<div/>")
                $.spud.login_dialog({}, div)
            })
            .appendTo(ut)
    }
}

function setup_menu(session) {
    var menu = $("<ul/>")
        .addClass("menubar")
        .empty()

    $('<li/>')
        .text("Albums")
        .on('click', function(ev) {
            add_screen($.spud.album_list_screen, {})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Categories")
        .on('click', function(ev) {
            add_screen($.spud.category_list_screen, {})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Places")
        .on('click', function(ev) {
            add_screen($.spud.place_list_screen, {})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("People")
        .on('click', function(ev) {
            add_screen($.spud.person_list_screen, {})
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Photos")
        .on('click', function(ev) {
            alert("meow")
            return false
        })
        .appendTo(menu)

    $('<li/>')
        .text("Reload")
        .on('click', function(ev) {
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

function add_screen(screen_class, params) {
    var cm = $("#content")
    var div = $("<div/>").appendTo(cm)
    screen_class(params, div)
    return div
}


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

function push_state(do_replace) {
    if (window._dont_push) {
        return
    }

    var state = get_state()
    var active_screen = $(".screen:not(.disabled)").data("screen")

    var title = "SPUD"
    var url = root_url()
    if (active_screen != null) {
        title = active_screen.options.title
        url = active_screen.get_url()
    }

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


object_loader.prototype.load = function() {
    if (this._loading) {
        return
    }
    if (this._finished) {
        return
    }

    var mythis = this
    var criteria = this._criteria
    var page = this._page
    var params = jQuery.extend({}, criteria, { 'page': page })

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
}

object_loader.prototype.abort = function() {
    if (this._loading) {
        this.xhr.abort()
    }
}

object_loader.prototype._got_item = function(obj) {
    this.loaded_item.trigger(obj)
}

object_loader.prototype.check_for_listeners = function() {
    if (this.loaded_item.is_any_listeners()) {
        return
    }
    this.abort()
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
    this._loading = false
    this._last_id = null
    this._idmap = {}
    this._finished = false
    this.loaded_list = new signal()
    this.loaded_list.on_no_listeners = function() { mythis.check_for_listeners() }
    this.loaded_item = new signal()
    this.loaded_item.on_no_listeners = function() { mythis.check_for_listeners() }
    this.on_error = new signal()
}


object_list_loader.prototype.load_next_page = function() {
    if (this._loading) {
        return
    }
    if (this._finished) {
        return
    }

    var mythis = this
    var criteria = this._criteria
    var page = this._page
    var params = jQuery.extend({}, criteria, { 'page': page })

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

            mythis._got_list(data.results)
        },
        error: function(message) {
            mythis._loading = false
            console.log("error loading", mythis._type, criteria, message)
            mythis.on_error.trigger()
        },
    });
}

object_list_loader.prototype.abort = function() {
    if (this._loading) {
        this.xhr.abort()
    }
}

object_list_loader.prototype._got_list = function(object_list) {
    var mythis = this
    $.each(object_list, function(j, obj) {
        mythis._got_item(obj)
    })
    this.loaded_list.trigger(object_list)
}

object_list_loader.prototype._got_item = function(obj) {
    var id = obj.id
    if (id != null) {
        this._idmap[id] = Object()
        if (this._last_id) {
            this._idmap[this._last_id].next = id
            this._idmap[id].prev = this._last_id
        }
        this._last_id = id
    }
    this.loaded_item.trigger(obj)
}

object_list_loader.prototype.get_meta = function(obj_id) {
    var meta = this._idmap[obj_id]
    if (!meta) {
        return null
    }
    if (!meta.next) {
        this.load_next_page()
    }
    return meta
}

object_list_loader.prototype.check_for_listeners = function() {
    if (this.loaded_list.is_any_listeners()) {
        return
    }
    if (this.loaded_item.is_any_listeners()) {
        return
    }
    this.abort()
}

function get_object_list_loader(type, criteria) {
    return new object_list_loader(type, criteria)
}

///////////////////////////////////////
// generic widgets
///////////////////////////////////////
$.widget('spud.object_criteria', $.spud.widget, {
    _create: function() {
        this.loader = null
        this.album = null

        this.criteria = $("<ul/>")
            .addClass("criteria")
            .appendTo(this.element)

        if (this.options.obj) {
            this.load(this.options.obj)
        }
    },

    set: function(criteria) {
    },

    load: function(criteria) {
        var mythis = this
        if (this.loader != null) {
            this.loader.loaded_item.remove_listener(this)
            this.loader = null
        }
        this.album = null
        this.set(criteria)
        if (criteria.instance == null) {
            return
        }
        this.loader = get_object_loader(this._type, criteria.instance)
        this.loader.loaded_item.add_listener(this, function(album) {
            criteria = $.extend({}, criteria)
            criteria.instance = album.title
            mythis.set(criteria)
            mythis.loader = null
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
        })
        this.loader.load()
    },

    _setOption: function( key, value ) {
        if ( key === "obj" ) {
            this.load(value)
        } else {
            this._super( key, value );
        }
    },
})


$.widget('spud.object_list', $.spud.photo_list_base, {
    _create: function() {
        this._super()

        var mythis = this
        this.empty()
        if (this.options.disabled) {
            this.disable()
        } else {
            this.enable()
        }

        if (this.options.criteria != null) {
            this._filter(this.options.criteria)
        }

        this.element.scroll(function() {
            mythis._load_if_required(mythis.options.criteria)
        })

        window._reload_all.add_listener(this, function() {
            this._filter(this.options.criteria)
        })
    },

    _get_item: function(obj_id) {
        return this.ul.find("[data-id="+obj_id+"]")
    },

    _add_item: function(obj) {
        var li = this._create_li(obj)
            .appendTo(this.ul)
        return this
    },

    _add_list: function(obj_list) {
        var mythis = this
        this.element.toggleClass("hidden", obj_list.length == 0)
        $.each(obj_list, function(j, obj) {
            mythis._add_item(obj)
        })
        this._load_if_required()
        return this
    },

    _load_if_required: function() {
        // if element is not displayed, we can't tell the scroll position,
        // so we must wait for element to be displayed before we can continue
        // loading
        if (this.is_enabled() && this.loader) {
            if (this.element.find("ul").height() <
                    this.element.scrollTop() + this.element.height() + 200) {
                this.loader.load_next_page()
            }
        }
    },

    _filter: function(criteria) {
        var mythis = this
        if (this.loader != null) {
            this.loader.loaded_list.remove_listener(this)
            this.loader = null
        }
        this.empty()
        this.options.criteria = criteria
        this.loader = get_object_list_loader(this._type, criteria)
        this.loader.loaded_list.add_listener(this, function(obj_list) {
            mythis._add_list(obj_list)
        })
        this.loader.on_error.add_listener(this, function() {
            mythis.element.addClass("error")
        })
        this.loader.load_next_page()
    },

    _setOption: function( key, value ) {
        if ( key === "criteria" ) {
            this._filter(value)
        } else if (key === "disabled") {
            if (value) {
                this.enable()
            } else {
                this.disable()
            }
        } else {
            this._super( key, value );
        }
    },

    is_enabled: function() {
        return !this.element.hasClass("disabled")
    },

    empty: function() {
        this.page = 1
        this.last_id = null
        this._super()
        this.element.removeClass("error")
        if (this.loader) {
            this.loader.loaded_list.remove_listener(this)
            this.loader.on_error.remove_listener(this)
            this.loader = null
        }
    },

    enable: function() {
        this.element.removeClass("disabled")
        this._load_if_required()
    },

    disable: function() {
        this.element.addClass("disabled")
    },
})


$.widget('spud.object_detail',  $.spud.infobox, {
    _create: function() {
        this._super()
        if (this.options.obj != null) {
            this.options.obj_id = this.options.obj.id
        } else if (this.options.obj_id != null) {
            this.load(this.options.obj_id)
        }
    },

    load: function(obj_id) {
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
            if (mythis.options.on_error) {
                mythis.options.on_error()
            }
        })
        this.loader.load()
    },

    _setOption: function( key, value ) {
        if ( key === "obj" ) {
            this.set(value)
        } else if ( key === "obj_id" ) {
            this.load(value)
        } else {
            this._super( key, value );
        }
    },
})

///////////////////////////////////////
// generic screens
///////////////////////////////////////
$.widget('spud.object_list_screen', $.spud.screen, {
    _create: function() {
        var mythis = this

        if (!this.options.criteria) {
            this.options.criteria = {}
        }

        this.options.title = this._type_name + " list"
        this._super()

        var menu = $("<ul/>")
            .addClass("menubar")
            .append(
                $("<li/>")
                    .text("Filter")
                    .on("click", function(ev) {
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
            .menu()
            .appendTo(this.div)

        var params = {
            'obj': this.options.criteria,
            'on_load': function(criteria_dummy, title) {
                mythis._set_title(mythis._type_name + " list: " + title)
            }
        }
        this.criteria = $("<div/>").appendTo(this.div)
        this._object_criteria(params, this.criteria)

        var params = {
            'child_id': this.options.id + ".child",
            'criteria': this.options.criteria,
            'disabled': this.options.disabled,
        }
        this.al = $("<div/>").appendTo(this.div)
        this._object_list(params, this.al)
    },

    _filter: function(value) {
        this.options.criteria = value
        push_state()

        var instance = this._get_object_criteria_instance(this.criteria)
        instance.load(value)

        var instance = this._get_object_list_instance(this.al)
        instance.option("criteria", value)
    },

    _setOption: function( key, value ) {
        if ( key === "criteria" ) {
            this._filter(value)
        } else if (key === "disabled") {
            if (value) {
                this.enable()
            } else {
                this.disable()
            }
        } else {
            this._super( key, value );
        }
    },

    enable: function() {
        this._super()
        if (this.al) {
            var instance = this._get_object_list_instance(this.al)
            instance.enable()
        }
    },

    disable: function() {
        this._super()
        if (this.al) {
            var instance = this._get_object_list_instance(this.al)
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
    _create: function() {
        var mythis = this

        this.options.title = this._type_name+" Detail"

        if (this.options.obj != null) {
            var obj = this.options.obj
            this.options.obj_id = obj.id
            this.options.title = this._type_name+": "+obj.title
        }

        this._super()

        var menu = $("<ul/>")
            .addClass("menubar")
            .append(
                $("<li/>")
                    .text("Children")
                    .on("click", function(ev) {
                        var screen_class = mythis._object_list_screen
                        params = {
                            criteria: {
                                instance: mythis.options.obj_id,
                                mode: "children",
                            }
                        }
                        add_screen(screen_class, params)
                    })
            )

        this.create_item = $("<li/>")
            .text("Create")
            .on("click", function(ev) {
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
                if (mythis.options.obj != null) {
                    var params = {
                        obj: mythis.options.obj,
                    }
                    var div = $("<div/>")
                    mythis._object_delete_dialog(params, div)
                }
            })
            .appendTo(menu)

        menu
            .menu()
            .appendTo(this.div)

        this.prev_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '<<')
            .click(function() {
                var object_list_loader = mythis.options.object_list_loader
                var meta = object_list_loader.get_meta(mythis.options.obj_id)
                var obj_id = meta.prev
                if (obj_id) {
                    mythis.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(this.div)

        this.next_button = $("<input/>")
            .attr('type', 'submit')
            .attr('value', '>>')
            .click(function() {
                var object_list_loader = mythis.options.object_list_loader
                var meta = object_list_loader.get_meta(mythis.options.obj_id)
                var obj_id = meta.next
                if (obj_id) {
                    mythis.load(obj_id)
                }
                push_state()
            })
            .button()
            .appendTo(this.div)

        this._setup_loader()
        this._setup_buttons()

        this._ol = null
        var params = {
            'on_update': function(obj) {
                mythis.element.removeClass("error")
                mythis.options.obj = obj
                mythis.options.obj_id = obj.id
                mythis._set_title(mythis._type_name + ": "+obj.title)
                mythis._setup_buttons()
                var instance = mythis._get_object_list_instance(mythis._ol)
                instance.option("criteria", {
                    'instance': obj.id,
                    'mode': 'children',
                })
            },
            'on_error': function() {
                mythis.element.addClass("error")
            },
        }

        this._od = $("<div/>").appendTo(this.div)
        this._object_detail(params, this._od)

        var params = {
            'child_id': this.options.id + ".child",
            'disabled': this.options.disabled,
        }
        this._ol = $("<div/>").appendTo(this.div)
        this._object_list(params, this._ol)

        var instance = this._get_object_detail_instance(this._od)
        if (this.options.obj != null) {
            instance.set(this.options.obj)
        } else if (this.options.obj_id != null) {
            instance.load(this.options.obj_id)
        }

        this._setup_perms(window._perms)
        window._perms_changed.add_listener(this, this._setup_perms)

        window._reload_all.add_listener(this, function() {
            mythis.load(this.options.obj_id)
        })
    },

    _setup_loader: function() {
        var mythis = this
        if (this.options.object_list_loader != null) {
            var object_list_loader = this.options.object_list_loader
            object_list_loader.loaded_list.add_listener(this, function(object_list) {
                mythis._setup_buttons()
            })
        }
    },

    _setup_perms: function(perms) {
        if (perms.can_create) {
            this.create_item.show()
        } else {
            this.create_item.hide()
        }
        if (perms.can_change) {
            this.change_item.show()
        } else {
            this.change_item.hide()
        }
        if (perms.can_delete) {
            this.delete_item.show()
        } else {
            this.delete_item.hide()
        }
    },

    _setup_buttons: function() {
        if (this.options.object_list_loader) {
            var object_list_loader = this.options.object_list_loader
            var meta = null
            if (this.options.obj_id) {
                meta = object_list_loader.get_meta(this.options.obj_id)
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
        this.options.obj = obj
        this.options.obj_id = obj.id
        var instance = this._get_object_detail_instance(this._od)
        instance.set(obj)

        // above function will call on_update where the following
        // will be done
        // this._setup_buttons()
        // this._set_title(this._type_name+": "+obj.title)
        // this.options.obj = obj
        // this.options.obj_id = obj.id
    },

    load: function(obj_id) {
        this.options.obj = null
        this.options.obj_id = obj_id
        var instance = this._get_object_detail_instance(this._od)
        instance.load(obj_id)
    },

    set_loader: function(object_list_loader) {
        var old_loader = this.options.object_list_loader
        if (old_loader != null) {
            old_loader.loaded_list.remove_listener(this)
        }
        this.options.object_list_loader = object_list_loader

        this._setup_loader()
        this._setup_buttons()
    },

    enable: function() {
        this._super()
        if (this._ol) {
            var instance = this._get_object_list_instance(this._ol)
            instance.enable()
        }
    },

    disable: function() {
        this._super()
        if (this._ol) {
            var instance = this._get_object_list_instance(this._ol)
            instance.disable()
        }
    },

    _setOption: function( key, value ) {
        if ( key === "obj" ) {
            this.set(value)
        } else if ( key === "obj_id" ) {
            this.load(value)
        } else if ( key === "object_list_loader" ) {
            this.set_loader(value)
        } else {
            this._super( key, value );
        }
    },

    get_url: function() {
        return root_url() + this._type + "/" + this.options.obj_id + "/"
    },

    get_streamable_options: function() {
        var options = this._super()
        options = $.extend({}, options) // clone options so we can modify
        delete options['object_list_loader']
        return options
    },
})
