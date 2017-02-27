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
"use strict"
///////////////////////////////////////
// signals
///////////////////////////////////////

window._listeners = {}

interface Listener<T> {
    (args: T) : void
}

function remove_all_listeners(obj) {
    var key = "null"
    if (obj != null) {
        key = obj.get_uuid()
    }

    if (window._listeners[key] != null) {
        $.each(window._listeners[key], (i, listener) => {
            if (listener != null) {
                listener.remove_listener(obj)
            }
        })
    }

    delete window._listeners[key]
}

class Signal<T> {
    on_no_listeners : () => void
    listeners : StringArray<Listener<T>>
    objects : StringArray<any>
    private immediate_dispatch : T
    private no_new_listeners : boolean

    constructor() {
        this.on_no_listeners = null
        this.listeners = {}
        this.objects = {}
        this.immediate_dispatch = null
        this.no_new_listeners = false
    }

    add_listener(obj : any, listener : Listener<T>) : void {
        var key = "null"
        if (obj != null) {
            key = obj.get_uuid()
        }
        if (this.listeners[key]) {
            this.remove_listener(key)
        }

        if (!this.no_new_listeners) {
            this.listeners[key] = listener
            this.objects[key] = obj

            if (window._listeners[key] == null) {
                window._listeners[key] = []
            }
            window._listeners[key].push(this)
        }

        if (this.immediate_dispatch != null) {
            listener(this.immediate_dispatch)
        }
    }

    remove_listener(obj : any) : void {
        var key = "null"
        if (obj != null) {
            key = obj.get_uuid()
        }
        delete this.listeners[key]
        delete this.objects[key]

        if (window._listeners[key] === null) {
            var index = window._listeners[key].indexOf(this)
            if (index !== -1) {
                // Don't do this; is called from within loop in
                // remove_all_listeners
                // window._listeners[key].splice(index, 1)
                window._listeners[key][index] = null
            }
        }

        if (!this.is_any_listeners()) {
            // FIXME check this isn't run multiple times
            if (this.on_no_listeners != null) {
                this.on_no_listeners()
            }
        }
    }

    disable(immediate_dispatch : T) : void {
        let objects : Array<any> = $.extend({}, this.objects);
        for (let key in objects) {
            this.remove_listener(objects[key])
        }
        this.immediate_dispatch = immediate_dispatch
        this.no_new_listeners = true
    }

    set_immediate_dispatch(immediate_dispatch : T) : void {
        this.immediate_dispatch = immediate_dispatch
    }

    is_any_listeners() : boolean {
        return !$.isEmptyObject(this.listeners)
    }

    trigger(arg: T) : void {
        var mythis = this
        $.each(this.listeners, (uuid, listener) => {
            var obj = null
            if (uuid !== "null") {
                obj = mythis.objects[uuid]
            }
            listener.call(obj, arg)
        })
    }
}

window._reload_all = new Signal<void>()
window._perms_changed = new Signal<Perms>()
window._session_changed = new Signal<Session>()

interface Window {
    _listeners : StringArray<SignalArray>;

    _reload_all : Signal<void>;
    _session_changed : Signal<Session>;
    _perms_changed : Signal<Perms>;
}

interface SignalArray {
    [index: number] : Signal<any>
    push(Signal) : void
    indexOf(Signal) : number
}
