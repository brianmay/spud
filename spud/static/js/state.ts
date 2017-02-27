/// <reference path="session.ts" />
/// <reference path="album.ts" />
/// <reference path="category.ts" />
/// <reference path="place.ts" />
/// <reference path="person.ts" />
/// <reference path="photo.ts" />
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

///////////////////////////////////////
// state
///////////////////////////////////////
interface ViewportClass {
    (options : ViewportOptions) : void
}

interface ViewportState {
    state : GetStreamable
    class_name : string
}

var _viewport_class_dict = {
    "album_list": AlbumListViewport,
    "album_detail": AlbumDetailViewport,
    "category_list": CategoryListViewport,
    "category_detail": CategoryDetailViewport,
    "place_list": PlaceListViewport,
    "place_detail": PlaceDetailViewport,
    "person_list": PersonListViewport,
    "person_detail": PersonDetailViewport,
    "photo_list": PhotoListViewport,
    "photo_detail": PhotoDetailViewport,
}

function get_state() {
    var results : Array<ViewportState> = []
    $.each($(".viewport"), (i : number, el : Element) => {
        var viewport : Viewport = $(el).data('widget')
        var class_name : string

        for (let name in _viewport_class_dict) {
            let view_port_class : ViewportClass = _viewport_class_dict[name];
            if (viewport.constructor == view_port_class) {
                class_name = name
                break
            }
        }

        if (class_name) {
            let state : GetStreamable = viewport.get_streamable_state()
            results[i] = {
                state: state,
                class_name: class_name,
            }
        }
    })
    return results
}

function put_state(state : Array<ViewportState>) {
    window._dont_push = true

    $("#content").empty()
    for (let viewport_state of state) {
        let name : string = viewport_state.class_name
        let state : GetStreamable = viewport_state.state
        let viewport_class : ViewportClass = _viewport_class_dict[name];
        let viewport : Viewport = new viewport_class({})
        viewport.set_streamable_state(state)
        add_viewport(viewport)
    }

    window._dont_push = false
}

function _get_page() {
    var title = "SPUD"
    var url = root_url()
    var active_viewport : Viewport = $(".viewport:not(.disabled)").data("widget")
    if (active_viewport != null) {
        title = active_viewport.get_title()
        url = active_viewport.get_url()
    }
    return { title: title, url: url }
}

function push_state(do_replace? : boolean) {
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

