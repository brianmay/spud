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
window._person_created = new Signal();
window._person_changed = new Signal();
window._person_deleted = new Signal();
var Person = (function (_super) {
    __extends(Person, _super);
    function Person() {
        _super.apply(this, arguments);
    }
    return Person;
})(SpudObject);
///////////////////////////////////////
// person dialogs
///////////////////////////////////////
$.widget('spud.person_search_dialog', $.spud.form_dialog, {
    _create: function () {
        this.options.fields = [
            ["q", new TextInputField("Search for", false)],
            ["instance", new AjaxSelectField("Person", "persons", false)],
            ["mode", new SelectInputField("Mode", [["children", "Children"], ["descendants", "Descendants"], ["ascendants", "Ascendants"]], false)],
            ["root_only", new booleanInputField("Root only", false)],
        ];
        this.options.title = "Search persons";
        this.options.description = "Please search for an person.";
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
$.widget('spud.person_change_dialog', $.spud.form_dialog, {
    _create: function () {
        this.options.pages = [
            { name: 'basic', title: 'Basics', fields: [
                    ["cover_photo_pk", new PhotoSelectField("Photo", false)],
                    ["first_name", new TextInputField("First name", true)],
                    ["middle_name", new TextInputField("Middle name", false)],
                    ["last_name", new TextInputField("Last name", false)],
                    ["called", new TextInputField("Called", false)],
                    ["sex", new SelectInputField("Sex", [["1", "Male"], ["2", "Female"]], true)],
                ] },
            { name: 'connections', title: 'Connections', fields: [
                    ["work_pk", new AjaxSelectField("Work", "places", false)],
                    ["home_pk", new AjaxSelectField("Home", "places", false)],
                    ["mother_pk", new AjaxSelectField("Mother", "persons", false)],
                    ["father_pk", new AjaxSelectField("Father", "persons", false)],
                    ["spouse_pk", new AjaxSelectField("Spouse", "persons", false)],
                ] },
            { name: 'other', title: 'Other', fields: [
                    ["email", new TextInputField("E-Mail", false)],
                    ["dob", new DateInputField("Date of birth", false)],
                    ["dod", new DateInputField("Date of death", false)],
                    ["notes", new PInputField("Notes", false)],
                ] },
        ];
        this.options.title = "Change person";
        this.options.button = "Save";
        this._type = "persons";
        this._super();
    },
    _set: function (person) {
        this.obj_id = person.id;
        if (person.id != null) {
            this.set_title("Change person");
            this.set_description("Please change person " + person.title + ".");
        }
        else {
            this.set_title("Add new person");
            this.set_description("Please add new person.");
        }
        return this._super(person);
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
            window._person_changed.trigger(data);
        }
        else {
            window._person_created.trigger(data);
        }
        this._super(data);
    }
});
$.widget('spud.person_delete_dialog', $.spud.form_dialog, {
    _create: function () {
        this.options.title = "Delete person";
        this.options.button = "Delete";
        this._type = "persons";
        this._super();
    },
    _set: function (person) {
        this.obj_id = person.id;
        this.set_description("Are you absolutely positively sure you really want to delete " +
            person.title + "? Go ahead join the dark side. There are cookies.");
    },
    _submit_values: function (values) {
        void values;
        this._save("DELETE", this.obj_id, {});
    },
    _save_success: function (data) {
        window._person_deleted.trigger(this.obj_id);
        this._super(data);
    }
});
///////////////////////////////////////
// person widgets
///////////////////////////////////////
$.widget('spud.person_criteria', $.spud.object_criteria, {
    _create: function () {
        this._type = "persons";
        this._type_name = "Person";
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
$.widget('spud.person_list', $.spud.object_list, {
    _create: function () {
        this._type = "persons";
        this._type_name = "Person";
        this._super();
        window._person_changed.add_listener(this, function (person) {
            var li = this._create_li(person);
            this._get_item(person.id).replaceWith(li);
        });
        window._person_deleted.add_listener(this, function (person_id) {
            this._get_item(person_id).remove();
            this._load_if_required();
        });
    },
    _person_a: function (person) {
        var mythis = this;
        var person_list_loader = this.loader;
        var title = person.title;
        var a = $('<a/>')
            .attr('href', root_url() + "persons/" + person.id + "/")
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
                    viewport_1.set(person);
                    viewport_1.set_loader(person_list_loader);
                    return false;
                }
            }
            var params = {
                id: child_id,
                obj: person,
                obj_id: null,
                object_list_loader: person_list_loader
            };
            var viewport;
            viewport = new PersonDetailViewport(params);
            child = add_viewport(viewport);
            return false;
        })
            .data('photo', person.cover_photo)
            .text(title);
        return a;
    },
    _create_li: function (person) {
        var photo = person.cover_photo;
        var details = [];
        if (person.sort_order || person.sort_name) {
            details.push($("<div/>").text(person.sort_name + " " + person.sort_order));
        }
        var a = this._person_a(person);
        var li = this._super(photo, person.title, details, person.description, a);
        li.attr('data-id', person.id);
        return li;
    }
});
$.widget('spud.person_detail', $.spud.object_detail, {
    _create: function () {
        this._type = "persons";
        this._type_name = "Person";
        this.options.fields = [
            ["middle_name", new TextOutputField("Middle name")],
            ["last_name", new TextOutputField("Last name")],
            ["called", new TextOutputField("Called")],
            ["sex", new SelectOutputField("Sex", [["1", "Male"], ["2", "Female"]])],
            ["email", new TextOutputField("E-Mail")],
            ["dob", new TextOutputField("Date of birth")],
            ["dod", new TextOutputField("Date of death")],
            ["work", new LinkOutputField("Work", "places")],
            ["home", new LinkOutputField("Home", "places")],
            ["spouses", new LinkListOutputField("Spouses", "persons")],
            ["notes", new POutputField("Notes")],
            ["grandparents", new LinkListOutputField("Grand Parents", "persons")],
            ["uncles_aunts", new LinkListOutputField("Uncles and Aunts", "persons")],
            ["parents", new LinkListOutputField("Parents", "persons")],
            ["siblings", new LinkListOutputField("Siblings", "persons")],
            ["cousins", new LinkListOutputField("Cousins", "persons")],
            ["children", new LinkListOutputField("Children", "persons")],
            ["nephews_nieces", new LinkListOutputField("Nephews and Nieces", "persons")],
            ["grandchildren", new LinkListOutputField("Grand children", "persons")],
        ];
        this.loader = null;
        this.img = $("<div></div>");
        $.spud.image({ size: "mid", include_link: true }, this.img);
        this.img.appendTo(this.element);
        this._super();
    },
    _set: function (person) {
        this.element.removeClass("error");
        this._super(person);
        this.options.obj = person;
        this.options.obj_id = person.id;
        this.img.image("set", person.cover_photo);
    }
});
///////////////////////////////////////
// person viewports
///////////////////////////////////////
var PersonListViewport = (function (_super) {
    __extends(PersonListViewport, _super);
    function PersonListViewport(options, element) {
        this.type = "persons";
        this.type_name = "Person";
        _super.call(this, options, element);
    }
    PersonListViewport.prototype.object_list = function (options, element) {
        $.spud.person_list(options, element);
    };
    PersonListViewport.prototype.object_criteria = function (options, element) {
        $.spud.person_criteria(options, element);
    };
    PersonListViewport.prototype.object_search_dialog = function (options, element) {
        $.spud.person_search_dialog(options, element);
    };
    return PersonListViewport;
})(ObjectListViewport);
var PersonDetailViewport = (function (_super) {
    __extends(PersonDetailViewport, _super);
    function PersonDetailViewport(options, element) {
        this.type = "persons";
        this.type_name = "Person";
        _super.call(this, options, element);
    }
    PersonDetailViewport.prototype.create = function (element) {
        _super.prototype.create.call(this, element);
        var mythis = this;
        window._person_changed.add_listener(this, function (obj) {
            if (obj.id === this.options.obj_id) {
                mythis.set(obj);
            }
        });
        window._person_deleted.add_listener(this, function (obj_id) {
            if (obj_id === this.options.obj_id) {
                mythis.remove();
            }
        });
    };
    PersonDetailViewport.prototype.get_photo_criteria = function () {
        return {
            'person': this.options.obj_id
        };
    };
    PersonDetailViewport.prototype.object_list = function (options, element) {
        $.spud.person_list(options, element);
    };
    PersonDetailViewport.prototype.object_detail = function (options, element) {
        $.spud.person_detail(options, element);
    };
    PersonDetailViewport.prototype.get_object_list_viewport = function (options) {
        return new PersonListViewport(options);
    };
    PersonDetailViewport.prototype.object_change_dialog = function (options, element) {
        $.spud.person_change_dialog(options, element);
    };
    PersonDetailViewport.prototype.object_delete_dialog = function (options, element) {
        $.spud.person_delete_dialog(options, element);
    };
    return PersonDetailViewport;
})(ObjectDetailViewport);
