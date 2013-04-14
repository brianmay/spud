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

