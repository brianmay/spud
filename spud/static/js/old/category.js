/// <reference path="globals.ts" />
/// <reference path="base.ts" />
/// <reference path="dialog.ts" />
/// <reference path="infobox.ts" />
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
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
window._category_created = new Signal();
window._category_changed = new Signal();
window._category_deleted = new Signal();
var Category = (function (_super) {
    __extends(Category, _super);
    function Category() {
        _super.apply(this, arguments);
    }
    return Category;
})(SpudObject);
///////////////////////////////////////
///////////////////////////////////////
// category dialogs
///////////////////////////////////////
$.widget('spud.category_search_dialog', $.spud.form_dialog, {
    _create: function () {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Category", "categorys", false)],
            ["mode", new SelectInputField("Mode", [["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"]], false)],
            ["root_only", new booleanInputField("Root only", false)],
        ];
        this.options.title = "Search categorys";
        this.options.description = "Please search for an category.";
        this.options.button = "Search";
        this._super();
    },
    _submit_values: function (values) {
        var criteria = {};
        $.each(values, function (key, el) {
            if (el != null && el !== false) {
                criteria[key] = el;
            }
        });
        if (this.options.on_success(criteria)) {
            this.close();
        }
    }
});
$.widget('spud.category_change_dialog', $.spud.form_dialog, {
    _create: function () {
        this.options.fields = [
            ["title", new TextInputField("Title", true)],
            ["description", new PInputField("Description", false)],
            ["cover_photo_pk", new PhotoSelectField("Photo", false)],
            ["sort_name", new TextInputField("Sort Name", false)],
            ["sort_order", new TextInputField("Sort Order", false)],
            ["parent", new AjaxSelectField("Parent", "categorys", false)],
        ];
        this.options.title = "Change category";
        this.options.button = "Save";
        this._type = "categorys";
        this._super();
    },
    _set: function (category) {
        this.obj_id = category.id;
        if (category.id != null) {
            this.set_title("Change category");
            this.set_description("Please change category " + category.title + ".");
        }
        else {
            this.set_title("Add new category");
            this.set_description("Please add new category.");
        }
        return this._super(category);
    },
    _submit_values: function (values) {
        if (this.obj_id != null) {
            this._save("PATCH", this.obj_id, values);
        }
        else {
            this._save("POST", null, values);
        }
    },
    _save_success: function (data) {
        if (this.obj_id != null) {
            window._category_changed.trigger(data);
        }
        else {
            window._category_created.trigger(data);
        }
        this._super(data);
    }
});
$.widget('spud.category_delete_dialog', $.spud.form_dialog, {
    _create: function () {
        this.options.title = "Delete category";
        this.options.button = "Delete";
        this._type = "categorys";
        this._super();
    },
    _set: function (category) {
        this.obj_id = category.id;
        this.set_description("Are you absolutely positively sure you really want to delete " +
            category.title + "? Go ahead join the dark side. There are cookies.");
    },
    _submit_values: function (values) {
        void values;
        this._save("DELETE", this.obj_id, {});
    },
    _save_success: function (data) {
        window._category_deleted.trigger(this.obj_id);
        this._super(data);
    }
});
///////////////////////////////////////
// category widgets
///////////////////////////////////////
$.widget('spud.category_criteria', $.spud.object_criteria, {
    _create: function () {
        this._type = "categorys";
        this._type_name = "Category";
        this._super();
    },
    _set: function (criteria) {
        var mythis = this;
        mythis.element.removeClass("error");
        this.options.criteria = criteria;
        var ul = this.criteria;
        this.criteria.empty();
        criteria = $.extend({}, criteria);
        var title = null;
        var mode = criteria.mode || 'children';
        delete criteria.mode;
        if (criteria.instance != null) {
            var instance = criteria.instance;
            title = instance + " / " + mode;
            $("<li/>")
                .text("instance" + " = " + instance + " (" + mode + ")")
                .appendTo(ul);
            delete criteria.instance;
        }
        else if (criteria.q != null) {
            title = "search " + criteria.q;
        }
        else if (criteria.root_only) {
            title = "root only";
        }
        else {
            title = "All";
        }
        $.each(criteria, function (index, value) {
            $("<li/>")
                .text(index + " = " + value)
                .appendTo(ul);
        });
        this._super(criteria);
        if (this.options.on_load != null) {
            this.options.on_load(criteria, title);
        }
    }
});
$.widget('spud.category_list', $.spud.object_list, {
    _create: function () {
        this._type = "categorys";
        this._type_name = "Category";
        this._super();
        window._category_changed.add_listener(this, function (category) {
            var li = this._create_li(category);
            this._get_item(category.id).replaceWith(li);
        });
        window._category_deleted.add_listener(this, function (category_id) {
            this._get_item(category_id).remove();
            this._load_if_required();
        });
    },
    _category_a: function (category) {
        var mythis = this;
        var category_list_loader = this.loader;
        var title = category.title;
        var a = $('<a/>')
            .attr('href', root_url() + "categorys/" + category.id + "/")
            .on('click', function () {
            if (mythis.options.disabled) {
                return false;
            }
            var child_id = mythis.options.child_id;
            if (child_id != null) {
                var child = $(document.getElementById(child_id));
                if (child.length > 0) {
                    var viewport_1 = child.data('widget');
                    viewport_1.enable();
                    viewport_1.set(category);
                    viewport_1.set_loader(category_list_loader);
                    return false;
                }
            }
            var params = {
                id: child_id,
                obj: category,
                obj_id: null,
                object_list_loader: category_list_loader
            };
            var viewport;
            viewport = new CategoryDetailViewport(params);
            child = add_viewport(viewport);
            return false;
        })
            .data('photo', category.cover_photo)
            .text(title);
        return a;
    },
    _create_li: function (category) {
        var photo = category.cover_photo;
        var details = [];
        if (category.sort_order || category.sort_name) {
            details.push($("<div/>").text(category.sort_name + " " + category.sort_order));
        }
        var a = this._category_a(category);
        var li = this._super(photo, category.title, details, category.description, a);
        li.attr('data-id', category.id);
        return li;
    }
});
$.widget('spud.category_detail', $.spud.object_detail, {
    _create: function () {
        this._type = "categorys";
        this._type_name = "Category";
        this.options.fields = [
            ["title", new TextOutputField("Title")],
            ["sort_name", new TextOutputField("Sort Name")],
            ["sort_order", new TextOutputField("Sort Order")],
            ["description", new POutputField("Description")],
            ["ascendants", new LinkListOutputField("Ascendants", "categorys")],
        ];
        this.loader = null;
        this.img = $("<div></div>");
        $.spud.image({ size: "mid", include_link: true }, this.img);
        this.img.appendTo(this.element);
        this._super();
    },
    _set: function (category) {
        this.element.removeClass("error");
        this._super(category);
        this.options.obj = category;
        this.options.obj_id = category.id;
        this.img.image("set", category.cover_photo);
    }
});
///////////////////////////////////////
// category viewports
///////////////////////////////////////
var CategoryListViewport = (function (_super) {
    __extends(CategoryListViewport, _super);
    function CategoryListViewport(options, element) {
        this.type = "categorys";
        this.type_name = "Category";
        _super.call(this, options, element);
    }
    CategoryListViewport.prototype.object_list = function (options, element) {
        $.spud.category_list(options, element);
    };
    CategoryListViewport.prototype.object_criteria = function (options, element) {
        $.spud.category_criteria(options, element);
    };
    CategoryListViewport.prototype.object_search_dialog = function (options, element) {
        $.spud.category_search_dialog(options, element);
    };
    return CategoryListViewport;
})(ObjectListViewport);
var CategoryDetailViewport = (function (_super) {
    __extends(CategoryDetailViewport, _super);
    function CategoryDetailViewport(options, element) {
        this.type = "categorys";
        this.type_name = "Category";
        _super.call(this, options, element);
    }
    CategoryDetailViewport.prototype.create = function (element) {
        _super.prototype.create.call(this, element);
        var mythis = this;
        window._category_changed.add_listener(this, function (obj) {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj);
            }
        });
        window._category_deleted.add_listener(this, function (obj_id) {
            if (obj_id === this.options.obj_id) {
                mythis.remove();
            }
        });
    };
    CategoryDetailViewport.prototype.get_photo_criteria = function () {
        return {
            'category': this.options.obj_id,
            'category_descendants': true
        };
    };
    CategoryDetailViewport.prototype.object_list = function (options, element) {
        $.spud.category_list(options, element);
    };
    CategoryDetailViewport.prototype.object_detail = function (options, element) {
        $.spud.category_detail(options, element);
    };
    CategoryDetailViewport.prototype.get_object_list_viewport = function (options) {
        return new CategoryListViewport(options);
    };
    CategoryDetailViewport.prototype.object_change_dialog = function (options, element) {
        $.spud.category_change_dialog(options, element);
    };
    CategoryDetailViewport.prototype.object_delete_dialog = function (options, element) {
        $.spud.category_delete_dialog(options, element);
    };
    return CategoryDetailViewport;
})(ObjectDetailViewport);