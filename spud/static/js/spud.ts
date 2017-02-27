/// <reference path="globals.ts" />
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

window.do_root = function(session : Session, params : GetStreamable) : void {
    setup_page(session)
}

window.do_list = function(type : string, session : Session, state : GetStreamable) : void {
    setup_page(session)

    let viewport : Viewport = null

    if (type === "albums") {
        let obj_type = new AlbumType()
        viewport = obj_type.list_viewport(null, state)
    } else if (type === "categorys") {
        let obj_type = new CategoryType()
        viewport = obj_type.list_viewport(null, state)
    } else if (type === "places") {
        let obj_type = new PlaceType()
        viewport = obj_type.list_viewport(null, state)
    } else if (type === "persons") {
        let obj_type = new PersonType()
        viewport = obj_type.list_viewport(null, state)
    } else if (type === "photos") {
        let obj_type = new PhotoType()
        viewport = obj_type.list_viewport(null, state)
    }
    if (viewport != null) {
        window._do_replace = true
        add_viewport(viewport)
        window._do_replace = false
    }
}

window.do_detail = function(type : string, obj_id : number, session : Session, state : GetStreamable) : void {
    setup_page(session)

    let viewport : Viewport = null

    if (type === "albums") {
        let obj_type = new AlbumType()
        viewport = obj_type.detail_viewport(obj_type.load(obj_id), state)
    } else if (type === "categorys") {
        let obj_type = new CategoryType()
        viewport = obj_type.detail_viewport(obj_type.load(obj_id), state)
    } else if (type === "places") {
        let obj_type = new PlaceType()
        viewport = obj_type.detail_viewport(obj_type.load(obj_id), state)
    } else if (type === "persons") {
        let obj_type = new PersonType()
        viewport = obj_type.detail_viewport(obj_type.load(obj_id), state)
    } else if (type === "photos") {
        let obj_type = new PhotoType()
        viewport = obj_type.detail_viewport(obj_type.load(obj_id), state)
    }
    if (viewport != null) {
        window._do_replace = true
        add_viewport(viewport)
        window._do_replace = false
    }
}
