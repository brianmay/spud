/// <reference path="DefinitelyTyped/jquery.d.ts" />
/**
 *
 * jCookie - https://github.com/martinkr/jCookie
 *
 * jCookie - a jQuery-Plugin providing an convenient api for CRUD-related cookie handling.
 *
 * @version 1.2.0
 *
 * @example:
 *  Create,update:
 *    jQuery.jCookie('cookie','value');
 *  Delete:
 *    jQuery.jCookie('cookie',null);
 *  Read:
 *    jQuery.jCookie('cookie');
 *
 * Copyright (c) 2008-2011 Martin Krause (jquery.public.mkrause.info)
 * Dual licensed under the MIT and GPL licenses.
 *
 * @author Martin Krause public@mkrause.info
 * @copyright Martin Krause (jquery.public.mkrause.info)
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @license GNU http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @requires
 *  jQuery JavaScript Library - http://jquery.com/
 *    Copyright 2010, John Resig
 *    Dual licensed under the MIT or GPL Version 2 licenses - http://jquery.org/license
 *
 */

// JSLint setting, @see http://www.jslint.com/lint.html#options
/*jslint devel: false, browser: true, continue: true, eqeq: true, vars: true, evil: true, white: true, forin: true, css: true, cap: true, nomen: true, plusplus: true, maxerr: 500, indent: 4 */

interface Options {
    name?: string;
    value?: string;
    expires?: string | number;
    path?: string;
    domain?: string;
    secure?: boolean;
}

interface JQueryStatic {
    jCookie(sCookieName : string, oValue? : string, oExpires? : string | number, oOptions? : Options);
}


/**
 *
 * @param {String} sCookieName, the cookie name
 * @param {Object} [oValue], the cokie value
 * @param {String, Number} [oExpires], the expire date as string ('session') or number
 * @param {Object} [oOptions], additional cookie options { path: {String}, domain: {String}, secure {Bool} }
 */
jQuery.jCookie = function(sCookieName : string, oValue? : string, oExpires? : string | number, oOptions? : Options) {

	// cookies disabled
	if (!navigator.cookieEnabled) { return false; }

	// enfoce params, even if just an object has been passed
	var oOptions = oOptions || {};
	if (typeof(arguments[0]) !== 'string' && arguments.length === 1) {
		oOptions = arguments[0];
		sCookieName = oOptions.name;
		oValue = oOptions.value;
		oExpires = oOptions.expires;
	}

	// escape characters
	sCookieName = encodeURI(sCookieName);

	// basic error handling
	if (oValue && (typeof(oValue) !== 'number' && typeof(oValue) !== 'string' && oValue !== null)) { return false; }

	// force values
	var _sPath = oOptions.path ? "; path=" + oOptions.path : "";
	var _sDomain = oOptions.domain ? "; domain=" + oOptions.domain : "";
	var _sSecure = oOptions.secure ? "; secure" : "";
	var sExpires = "";

	// write ('n delete ) cookie even in case the value === null
	if (oValue || (oValue === null && arguments.length == 2)) {

		// set preceding expire date in case: expires === null, or the arguments have been (STRING,NULL)
		oExpires = (oExpires === null || (oValue === null && arguments.length == 2)) ? -1 : oExpires;

		// calculate date in case it's no session cookie (expires missing or expires equals 'session' )
		if (typeof(oExpires) === 'number' && oExpires !== undefined) {
			var _date = new Date();
			_date.setTime(_date.getTime() + (Number(oExpires) * 24 * 60 * 60 * 1000));
			sExpires = ["; expires=", _date.toUTCString()].join("");
		}
		// write cookie
		document.cookie = [sCookieName, "=", encodeURI(oValue), sExpires, _sDomain, _sPath, _sSecure].join("");

		return true;
	}

	// read cookie
	if (!oValue && typeof(arguments[0]) === 'string' && arguments.length == 1 && document.cookie && document.cookie.length) {
		// get the single cookies
		var _aCookies = document.cookie.split(';');
		var _iLenght = _aCookies.length;
		// parse cookies
		while (_iLenght--) {
			var _aCurrrent = _aCookies[_iLenght].split("=");
			// find the requested one
			if (jQuery.trim(_aCurrrent[0]) === sCookieName) { return decodeURI(_aCurrrent[1]); }
		}
		return undefined;
	}
	// no cookie present
	if(!document.cookie || !document.cookie.length) { return undefined;}

	return false;
};
