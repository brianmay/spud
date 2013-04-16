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

function place_doer() {
    this.type = "place"
    this.display_type = "Place"
    this.display_plural = "Places"
    this.list_type = "place_list"
    this.has_children = true
    generic_doer.call(this)
}

place_doer.prototype = new generic_doer()
place_doer.constructor = place_doer

place_doer.prototype.get_search = function(place) {
    return {
        results_per_page: get_settings().items_per_page,
        params: { place: place.id },
    }
}

place_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "place",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parent: parent_place,
        children: [],
    }
}

place_doer.prototype.get_object = function(results) {
    return results.place
}

place_doer.prototype.get_objects = function(results) {
    return results.places
}

place_doer.prototype.details = function(place, div) {
    $.ui.place_details({place: place}, div)
}

place_doer.prototype.list_menu = function(search, div) {
    $.ui.place_list_menu(search, div)
}


place_doer.prototype.menu = function(place, div) {
    $.ui.place_menu({place: place}, div)
}

place_doer.prototype.list = function(places, page, last_page, html_page, div) {
    $.ui.place_list({
        places: places,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

place_doer.prototype.search_dialog = function(search, dialog) {
    $.ui.place_search_dialog({ search: search }, dialog)
}

place_doer.prototype.search_details = function(search, results, dialog) {
    $.ui.place_search_details({ search: search, results: results }, dialog)
}

place_doer.prototype.change_dialog = function(place, dialog) {
    $.ui.place_change_dialog({ place: place }, dialog)
}

place_doer.prototype.delete_dialog = function(place, dialog) {
    $.ui.place_delete_dialog({ place: place }, dialog)
}

places = new place_doer()

