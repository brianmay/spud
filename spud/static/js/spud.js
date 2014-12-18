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

function do_root(session, params) {
    setup_page(session)
}

function do_list(obj_type, session, params) {
    var screen_class
    setup_page(session)
    if (obj_type == "albums") {
        screen_class = $.spud.album_list_screen
    } else if (obj_type == "categorys") {
        screen_class = $.spud.category_list_screen
    }
    if (screen_class) {
        params = {
            criteria: params,
        }
        window._do_replace = true
        add_screen(screen_class, params)
        window._do_replace = false
    }
}

function do_detail(obj_type, obj_id, session, params) {
    setup_page(session)
    var screen_class
    if (obj_type == "albums") {
        screen_class = $.spud.album_detail_screen
    } else if (obj_type == "categorys") {
        screen_class = $.spud.category_detail_screen
    }
    if (screen_class) {
        params = {
            obj_id: obj_id,
        }
        window._do_replace = true
        add_screen(screen_class, params)
        window._do_replace = false
    }
}
