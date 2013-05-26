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

function display_uploads(params) {
    return $.map(params.files, function(file, i){
        var tr = $('<tr class="template-upload fade"></tr>')
            .append('<td class="preview"><span class="fade"></span></td>')
            .append($('<td class="name"/>').text(file.name))
            .append($('<td class="size"/>').text(params.formatFileSize(file.size)))
        if (file.error) {
            tr.append($('<td class="erroronote" colspan="2"/>').text(file.error))
        } else if (params.files.valid && i == 0) {
            $("<td></td>")
                .append($('<div class="fade progress"></div>').progressbar({value: 0}))
                .appendTo(tr)

            var td = $("<td></td>")
            if (!params.options.autoUpload) {
                td.append($('<button class="start">Start</button>').button())
            }
            td.append($('<button class="cancel">Cancel</button>').button())
            tr.append(td)
        } else {
            tr.append('<td colspan="2"></td>')
            if (i==0) {
                td.append($('<button class="cancel">Cancel</button>').button())
            }
        }
        return tr
    })
}

function display_downloads(params) {
    return $.map(params.files, function(file, i){
        var tr = $('<tr class="template-download fade"></tr>')

        if (file.error) {
            tr
                .append('<td></td>')
                .append($('<td class="name"/>').text(file.name))
                .append($('<td class="size"/>').text(params.formatFileSize(file.size)))
                .append($('<td class="errornote" colspan="2"/>').text(file.error))
        } else {
            var td = $('<td class="preview"></td>')
                .append($("<div/>").image({photo: file.photo, size: get_settings().list_size}))
            tr.append(td)

            var td = $('<td class="name"></td>')
                .append(photo_a(file.photo, {}))

            tr
                .append(td)
                .append($('<td class="size"/>').text(params.formatFileSize(file.size)))
                .append('<td></td>')
        }
        var td = $('<td></td>')
//            .append($('<button class="delete"/>')
//                    .data('type', file.delete_type)
//                    .data('url', file.delete_url)
//                    .text("Delete")
//                    .button())
//            .append('<input type="checkbox" name="delete" value="1" class="toggle"/>')
            .appendTo(tr)

        tr.append(td)
        return tr
    })
}

function display_upload_form(data) {
    update_history(upload_form_url(), {
        type: 'display_upload_form',
    });

    window.spud_type = "upload"
    replace_links()

    var cm = $("#content-main")
        .empty()

    if (!data.rights.can_add) {
        cm
            .append("<h1>Permission denied</h1>")
            .append("<p>You do not have upload rights.</p>")
        return
    }

    'use strict';

    var form = $("<form></form>")

    $('<div class="row fileupload-buttonbar"></div>')
        .append($('<span class="fileinput-button">Add files<input type="file" name="files[]" multiple="multiple"/></span>').button())
        .append($('<button type="submit" class="start">Start upload</button>').button())
        .append($('<button type="reset" class="cancel">Cancel upload</button>').button())
//        .append($('<button type="button" class="delete">Delete</button>').button())
//        .append('<input type="checkbox" class="toggle"/>')
        .append('<div class="progress progress-success progress-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="bar" style="width:0%;"></div></div>')
        .append('<div class="progress-extended"></div>')
        .appendTo(form)

    var progress_node = $('<div></div>').progressbar({value: false})
    var progress_extended_node = $('<div class="progress-extended"></div>')

    var div = $('<div class="fileupload-progress fade"></div>')
        .append(progress_node)
        .append(progress_extended_node)
        .appendTo(form)

    form
        .append('<div class="fileupload-loading"></div>')
        .appendTo(cm)

    $('<table role="presentation" class="table table-striped"/>')
        .append('<thead><th>Preview</th><th>Filename</th><th>Size</th><th>Progress</th><th>Ops</th></thead>')
        .append('<tbody class="files"></tbody>')
        .appendTo(form)

    // Initialize the jQuery File Upload widget:
    form.fileupload({
        formData: [
            { name: "uid", value: data.uid },
        ],
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: '/a/upload/file/',
        uploadTemplate: display_uploads,
        downloadTemplate: display_downloads,
        limitConcurrentUploads: 1,

        send: function (e, data) {
            if (data.context) {
                data.context.find('.progress').addClass("in")
            }
            $.blueimp.fileupload.prototype.options.send.call(this, e, data)
        },

        progress: function (e, data) {
            if (data.context) {
                var progress = Math.floor(data.loaded / data.total * 100);
                data.context.find('.progress').progressbar("option", "value", progress)
            }
            $.blueimp.fileupload.prototype.options.progress.call(this, e, data)
        },

        progressall: function (e, data) {
            var progress = Math.floor(data.loaded / data.total * 100)
            progress_node.progressbar("option", "value", progress)
            $.blueimp.fileupload.prototype.options.progressall.call(this, e, data)
        },

    });

    // Enable iframe cross-domain access via redirect option:
    form.fileupload(
        'option',
        'redirect',
        window.location.href.replace(
            /\/[^\/]*$/,
            '/cors/result.html?%s'
        )
    );

}

