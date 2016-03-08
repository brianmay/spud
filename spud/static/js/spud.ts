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

window.do_root = function(session : Session, params : {}) : void {
    setup_page(session)
}

window.do_list = function(obj_type : string, session : Session, criteria : StringArray<string>) : void {
    setup_page(session)

    let viewport : Viewport = null
    let params = {
        criteria: criteria,
    }

    if (obj_type === "albums") {
        viewport = new AlbumListViewport(params)
    } else if (obj_type === "categorys") {
        viewport = new CategoryListViewport(params)
    } else if (obj_type === "places") {
        viewport = new PlaceListViewport(params)
    } else if (obj_type === "persons") {
        viewport = new PersonListViewport(params)
    } else if (obj_type === "photos") {
        viewport = new PhotoListViewport(params)
    }
    if (viewport != null) {
        window._do_replace = true
        add_viewport(viewport)
        window._do_replace = false
    }
}

window.do_detail = function(obj_type : string, obj_id : number, session : Session) : void {
    setup_page(session)

    let viewport : Viewport
    let params = {
        obj : null,
        obj_id : obj_id,
    }

    if (obj_type === "albums") {
        viewport = new AlbumDetailViewport(params)
    } else if (obj_type === "categorys") {
        viewport = new CategoryDetailViewport(params)
    } else if (obj_type === "places") {
        viewport = new PlaceDetailViewport(params)
    } else if (obj_type === "persons") {
        viewport = new PersonDetailViewport(params)
    } else if (obj_type === "photos") {
        viewport = new PhotoDetailViewport(params)
    }
    if (viewport != null) {
        window._do_replace = true
        add_viewport(viewport)
        window._do_replace = false
    }
}
