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

function person_doer() {
    this.type = "person"
    this.display_type = "Person"
    this.display_plural = "People"
    this.list_type = "person_list"
    this.has_children = true
    generic_doer.call(this)
}

person_doer.prototype = new generic_doer()
person_doer.constructor = person_doer

person_doer.prototype.get_search = function(person) {
    return {
        results_per_page: get_settings().items_per_page,
        params: { person: person.id },
    }
}

person_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "person",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parent: parent_person,
        children: [],
    }
}

person_doer.prototype.get_object = function(results) {
    return results.person
}

person_doer.prototype.get_objects = function(results) {
    return results.persons
}

person_doer.prototype.details = function(person, div) {
    $.ui.person_details({person: person}, div)
}

person_doer.prototype.list_menu = function(search, div) {
    $.ui.person_list_menu(search, div)
}


person_doer.prototype.menu = function(person, div) {
    $.ui.person_menu({person: person}, div)
}

person_doer.prototype.list = function(persons, page, last_page, html_page, div) {
    $.ui.person_list({
        persons: persons,
        change_mode: true,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

person_doer.prototype.search_dialog = function(search, dialog) {
    $.ui.person_search_dialog({ search: search }, dialog)
}

person_doer.prototype.search_details = function(search, results, dialog) {
    $.ui.person_search_details({ search: search, results: results }, dialog)
}

person_doer.prototype.change_dialog = function(person, dialog) {
    $.ui.person_change_dialog({ person: person }, dialog)
}

person_doer.prototype.delete_dialog = function(person, dialog) {
    $.ui.person_delete_dialog({ person: person }, dialog)
}

persons = new person_doer()

