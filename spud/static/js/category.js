function category_doer() {
    this.type = "category"
    this.display_type = "Category"
    this.display_plural = "Categories"
    this.list_type = "category_list"
    this.has_children = true
    generic_doer.call(this)
}

category_doer.prototype = new generic_doer()
category_doer.constructor = category_doer

category_doer.prototype.get_search = function(category) {
    return {
        results_per_page: get_settings().items_per_page,
        params: { category: category.id },
    }
}

category_doer.prototype.get_new_object = function(parent) {
    return {
        id: null,
        type: "category",
        title: "",
        description: "",
        cover_photo: null,
        sortname: "",
        sortorder: "",
        parent: parent_category,
        children: [],
    }
}

category_doer.prototype.get_object = function(results) {
    return results.category
}

category_doer.prototype.get_objects = function(results) {
    return results.categorys
}

category_doer.prototype.details = function(category, div) {
    $.ui.category_details({category: category}, div)
}

category_doer.prototype.list_menu = function(search, div) {
    $.ui.category_list_menu(search, div)
}


category_doer.prototype.menu = function(category, div) {
    $.ui.category_menu({category: category}, div)
}

category_doer.prototype.list = function(categorys, page, last_page, html_page, div) {
    $.ui.category_list({
        categorys: categorys,
        change_mode: true,
        page: page,
        last_page: last_page,
        html_page: html_page,
    }, div)
}

category_doer.prototype.search_dialog = function(search, dialog) {
    $.ui.category_search_dialog({ search: search }, dialog)
}

category_doer.prototype.search_details = function(search, results, dialog) {
    $.ui.category_search_details({ search: search, results: results }, dialog)
}

category_doer.prototype.change_dialog = function(category, dialog) {
    $.ui.category_change_dialog({ category: category }, dialog)
}

category_doer.prototype.delete_dialog = function(category, dialog) {
    $.ui.category_delete_dialog({ category: category }, dialog)
}

categorys = new category_doer()

