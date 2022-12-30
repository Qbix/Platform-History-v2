/**
 * You'll find all your Q related functionality right here.
 *
 * @module Q
 * @main Q
 */
"use strict";
/* jshint -W014 */
(function _Q_setup(undefined, dontSetGlobals) {

var root = this;
var $ = Q.$ = root.jQuery;

// private properties
var _isReady = false;
var _isOnline = null;
var _isCordova = null;
var _documentIsUnloading = null;

/**
 * @class Q
 * @constructor
 */
function Q () {
	// explore the docs at http://qbix.com/platform/client
}

/**
 * @module Q
 */

// public properties:
Q.plugins = {};

/**
 * Store and customize your text strings under Q.text
 * @property {Object} text
 */
Q.text = {
	Q: {
		"request": {
			"error": "Error {{status}} during request",
			"canceled": 'Request canceled',
			"500": "Internal server error",
			"404": "Not found: {{url}}",
			"0": "Request interrupted"
		},
		"words": {
			"tap": "tap",
			"click": "click",
			"yes": "yes",
			"no": "no",
			"Tap": "Tap",
			"Click": "Click",
			"Yes": "Yes",
			"No": "No"
		},
		"months": {
			"1": "January",
			"2": "February", 
			"3": "March",
			"4": "April", 
			"5": "May",
			"6": "June",
			"7": "July",
			"8": "August",
			"9": "September",
			"10": "October",
			"11": "November",
			"12": "December"
		},
		"durations": {
			"second": "second",
			"seconds": "seconds",
			"minute": "minute",
			"minutes": "minutes",
			"hour": "hour",
			"hours": "hours",
			"day": "day",
			"days": "days",
			"week": "week",
			"weeks": "weeks",
			"month": "month",
			"months": "months",
			"year": "year",
			"years": "years",
			"decade": "decade",
			"decades": "decades",
			"century": "century",
			"centuries": "centuries"
		},
		"audio": {
			"allowMicrophoneAccess": "Please allow access to your microphone",
			"record": "Record",
			"recording": "Recording",
			"remains": "remains",
			"maximum": "maximum",
			"playing": "Playing",
			"recorded": "Recorded",
			"clip": "clip",
			"orupload": "Or Upload",
			"usethis": "Use This",
			"discard": "Discard",
			"encoding": "Encoding"
		},
		"alert": {
			"title": "Alert"
		},
		"confirm": {
			"title": "Confirm",
			"ok": "Yes",
			"cancel": "No",
		},
		"prompt": {
			"title": "Prompt",
			"ok": "Go"
		},
		"tabs": {
			"more": "more",
			"Menu": "Menu"
		}
	}
}; // put all your text strings here e.g. Q.text.Users.foo

/**
 * Throws Q.Error with complaint if condition evaluates to something falsy
 * @method assert
 * @static
 * @param {Boolean} condition
 * @param {String} complaint
 */
Q.assert = function (condition, complaint) {
	if (!condition) {
		throw new Q.Error(complaint);
	}
};

/**
 * By default this is set to the root Promise object, which may be undefined
 * in browsers such as Internet Explorer.
 * You can load a Promises library and set Q.Promise to the Promise constructor
 * before including Q.js, to ensure Promises are used by Q.getter and other functions.
 * @property {Function} Promise
 */
Q.Promise = root.Promise;

/*
 * Extend some built-in prototypes
 */

/**
 * @class Q.Error
 * @description Throw this when throwing errors in Javascript
 */
Q.Error = Error;

if (!Object.getPrototypeOf)
/**
* Returns the prototype of an object, if one can be found
* @method getPrototypeOf
* @return {Object}
*/
Object.getPrototypeOf = function (obj) {
	if (obj.__proto__) return obj.__proto__;
	if (obj.constructor && obj.constructor.prototype) {
		return obj.constructor.prototype;
	}
	return undefined;
};

/**
 * @class Array
 * @description Q extended methods for Arrays
 */

var Ap = Array.prototype;

Object.defineProperty(Ap, "toHex", {
	enumerable: false,
	value: function () {
		return this.map(function (x) { 
			return x.toString(16).padStart(2, '0');
		}).join('');
	}
  });

/**
 * @class String
 * @description Q extended methods for Strings
 */

var Sp = String.prototype;

/**
 * Returns a copy of the string with Every Word Capitalized
 * @method toCapitalized
 * @return {String}
 */
Sp.toCapitalized = function _String_prototype_toCapitalized() {
	return this.replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

/**
 * Determins whether the string's contents are a URL
 * @method isUrl
 * @return {boolean}
 */
Sp.isUrl = function _String_prototype_isUrl () {
	return !!this.matchTypes('url', {requireScheme: true}).length;
};

/**
 * Determins whether the string's contents are an IP address
 * @method isUrl
 * @return {boolean}
 */
Sp.isIPAddress = function _String_prototype_isIPAddress () {
	return !!this.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
};

/**
 * Returns a copy of the string with special HTML characters escaped
 * @method encodeHTML
 * @param {Array} [convert] Array of characters to convert. Can include
 *   '&', '<', '>', '"', "'", "\n"
 * @return {String}
 */
Sp.encodeHTML = function _String_prototype_encodeHTML(convert) {
	var conversions = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
		"\n": '<br>'
	};
	if (convert) {
		conversions = Q.take(conversions, convert);
	}
	return this.replaceAll(conversions);
};

/**
 * Reverses what encodeHTML does
 * @method decodeHTML
 * @return {String}
 */
Sp.decodeHTML = function _String_prototype_decodeHTML() {
	var e = document.createElement('textarea');
	e.innerHTML = this;
	// handle case of empty input
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
};

/**
 * Interpolates some fields into the string wherever "{{fieldName}}" appears
 * or {{index}} appears.
 * @method interpolate
 * @param {Object|Array} fields Can be an object with field names and values,
 *   or an array corresponding to {{0}}, {{1}}, etc. If the string is missing
 *   {{0}} then {{1}} is mapped to the first element of the array.
 * @return {String}
 */
Sp.interpolate = function _String_prototype_interpolate(fields) {
	if (Q.isArrayLike(fields)) {
		var result = this;
		var b = (this.indexOf('{{0}}') < 0) ? 1 : 0;
		for (var i=0, l=fields.length; i<l; ++i) {
			result = result.replace('{{'+(i+b)+'}}', fields[i]);
		}
		return result;
	}
	return this.replace(/\{\{([^{}]*)\}\}/g, function (a, b) {
		var r = Q.getObject(b, fields);

		if (Q.typeOf(r) === 'function') {
			var context = Q.getObject(b.split('.').slice(0, -1), fields);
			r = r.apply(context);
		}

		return (typeof r === 'string' || typeof r === 'number') ? r : a;
	});
};

/**
 * Similar to String.prototype.replace, but replaces globally
 * @method replaceAll
 * @return {String}
 */
Sp.replaceAll = function _String_prototype_replaceAll(pairs) {
	var result = this;
	for (var k in pairs) {
		result = result.replace(new RegExp(k, 'g'), pairs[k]);
	}
	return result;
};

/**
 * Get or set querystring fields from a string, usually from location.search or location.hash
 * @method queryField
 * @param {String|Array|Object} name The name of the field. If it's an array, returns an object of {name: value} pairs. If it's an object, then they are added onto the querystring and the result is returned. If it's a string, it's the name of the field to get. And if it's an empty string, then we get the array of field names with no value, e.g. ?123&456&a=b returns [123,456]
 * @param {String} [value] Optional, provide a value to set in the querystring, or null to delete any fields that match name as a RegExp
 * @return {String|Object} the value of the field in the string, or if value was not undefined, the resulting querystring.
 */
Sp.queryField = function Q_queryField(name, value) {
	var what = this;
	var prefixes = ['#!', '#', '?', '!'];
	var count = prefixes.length;
	var prefix = '';
	var i, k, l, p, keys, parsed, ret, result;
	for (i=0; i<count; ++i) {
		l = prefixes[i].length;
		p = this.substring(0, l);
		if (p == prefixes[i]) {
			prefix = p;
			what = this.substring(l);
			break;
		}
	}
	if (!name) {
		ret = [];
		parsed = Q.parseQueryString(what, keys);
		for (k in parsed) {
			if (parsed[k] == null || parsed[k] === '') {
				ret.push(k);
			}
		}
		return ret;
	} if (Q.isArrayLike(name)) {
		ret = {}, keys = [];
		parsed = Q.parseQueryString(what, keys);
		for (i=0, l=name.length; i<l; ++i) {
			if (name[i] in parsed) {
				ret[name[i]] = parsed[name[i]];
			}
		}
		return ret;
	} else if (Q.isPlainObject(name)) {
		result = what;
		Q.each(name, function (key, value) {
			result = result.queryField(key, value);
		});
		return result;
	} else if (value === undefined) {
		return Q.parseQueryString(what) [ name ];
	} else if (value === null) {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		var reg = new RegExp(name);
		for (k in parsed) {
			if (reg.test(k)) {
				delete parsed[k];
			}
		}
		return prefix + Q.queryString(parsed, keys);
	} else {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		if (!(name in parsed)) {
			keys.push(name);
		}
		parsed[name] = value;
		return prefix + Q.queryString(parsed, keys);
	}
};

/**
 * Convert ascii string to hex
 * @method asc2hex
 * @return {string}
 */
Sp.asc2hex = function() {
	var arr1 = [];
	for (var n = 0, l = this.length; n < l; n ++)
	{
		var hex = Number(this.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('');
};

/**
 * Obtain some unique hash from a string, analogous to Q_Utils::hashCode
 * @method hashCode
 * @return {number}
 */
Sp.hashCode = function() {
	var hash = 0;
	if (!this.length) return hash;
	for (var i = 0; i < this.length; i++) {
		var c = this.charCodeAt(i);
		hash = hash % 16777216;
		hash = ((hash<<5)-hash)+c;
		hash = hash & 0xffffffff; // Convert to 32bit integer
	}
	return hash;
};

/**
 * @method trim
 * @return {String}
 */
Sp.trim = String.prototype.trim || function _String_prototype_trim() {
	return this.replace(/^\s+|\s+$/g, "");
};

/**
 * Analogous to PHP's parse_url function
 * @method parseUrl
 * @param {String} component Optional name of component to return
 * @return {Object}
 */
Sp.parseUrl = function _String_prototype_parseUrl (component) {
	// http://kevin.vanzonneveld.net
	// modified by N.I for 'php' parse mode
	var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
		parser = /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var m = parser.exec(this), uri = {}, i = 14;
	while (i--) {
		if (m[i]) uri[key[i]] = m[i];
	}
	if (component) {
		return uri[component.replace('PHP_URL_', '').toLowerCase()];
	}
	delete uri.source;
	return uri;
};

/**
 * @method sameDomain
 * @param {String} url2 The url to compare against
 * @param {Object} options can include the following:
 * @param {boolean} [options.compareScheme] boolean for whether the url scheme should be compared also
 * @return {boolean}
 * @private
 */
Sp.sameDomain = function _String_prototype_sameDomain (url2, options) {
	var parsed1 = this.parseUrl(),
		parsed2 = url2.parseUrl();
	var same = (parsed1.host === parsed2.host)
		&& (parsed1.user === parsed2.user)
		&& (parsed1.pass === parsed2.pass)
		&& (parsed1.port === parsed2.port);
	return options && options.compareScheme
		? same && (parsed1.scheme === parsed2.scheme)
		: same;
};

/**
 * @method startsWith
 * @param {String} prefix
 * @return {boolean}
 */
Sp.startsWith = function _String_prototype_startsWith(prefix) {
	if (prefix == null || this.length < prefix.length) {
		return false;
	}
	return this.substr(0, prefix.length) === prefix;
};

/**
 * Used to split ids into one or more segments, in order to store millions
 * of files under a directory, without running into limits of various filesystems
 * on the number of files in a directory.
 * Consider using Amazon S3 or another service for uploading files in production.
 * @param {string} id the id to split
 * @param {integer} [lengths=3] the lengths of each segment (the last one can be smaller)
 * @param {string} [delimiter='/'] the delimiter to put between segments
 * @return {string} the segments, delimited by the delimiter
 */
Sp.splitId = function(lengths, delimiter) {
	lengths = lengths || 3;
	delimiter = delimiter || '/';
	var segments = [], pos = 0, len = this.length;
	while (pos < len) {
		segments.push(this.slice(pos, pos += lengths));
	}
	return segments.join(delimiter);
};
/**
 * Used to split ids into one or more segments, in order to store millions
 * of files under a directory, without running into limits of various filesystems
 * on the number of files in a directory.
 * Consider using Amazon S3 or another service for uploading files in production.
 * @method matchTypes
 * @param {String|Array} [types] type or types to detect. Can be "url", "email", "phone", "twitter".
 *  If omitted, all types are processed.
 * @param {object} [options]
 * @param {boolean} [options.requireScheme=false] If true, return only urls with protocol
 * @return {object}
 */
Sp.matchTypes = function (types, options) {
	var string = this;
	if (typeof types === 'string') {
		types = [types];
	}
	if (Q.typeOf(types) === 'object') {
		options = types;
		types = null;
	}
	if (!Q.isArrayLike(types)) {
		types = Object.keys(Sp.matchTypes.adapters);
	}
	var res = {};
	Q.each(types, function (i, type) {
		if (Sp.matchTypes.adapters[type]) {
			res[type] = Sp.matchTypes.adapters[type].call(string, options);
		}
	});
	if (types.length === 1) {
		return res[Object.keys(res)[0]];
	}
	return res;
};

Sp.matchTypes.adapters = {
	url: function (options) {
		var parts = this.split(' ');
		var res = [];
		var regexp = (options && options.requireScheme)
			? /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)(localhost|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,50}|[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3})(:[0-9]{1,5})?([\/|\?].*)?$/gim
			: /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?(localhost|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,50}|[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3})(:[0-9]{1,5})?([\/|\?].*)?$/gim;
		for (var i=0; i<parts.length; i++) {
			if (!parts[i].match(regexp)) {
				continue;
			}
			res.push(parts[i]);
		}
		return res;
	},
	email: function () {
		return this.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
	},
	phone: function () {
		return this.match(/\+[0-9]{1,2}?(-|\s|\.)?[0-9]{3,5}(-|\s|\.)?([0-9]{3,5}(-|\s|\.)?)?([0-9]{4,5})/gi) || [];
	},
	twitter: function () {
		return this.match(/\+[0-9]{1,2}?(-|\s|\.)?[0-9]{3,5}(-|\s|\.)?([0-9]{3,5}(-|\s|\.)?)?([0-9]{4,5})/gi) || [];
	},
	qbixUserId: function () {
		return this.match(/(@[a-z]{8}@)/gi) || [];
	}
};

/**
 * Deobfuscates some text that was obfuscated by Q_Utils::obfuscate
 * @method deobfuscate
 * @param {String} str
 * @param {String} [key=' ']
 * @return {String}
 */
Sp.deobfuscate = function (key) {
	key = key || ' ';
	var len1 = Math.floor(this.length / 2);
	var len2 = key.length;
	var result = '';
	for (var i=0; i<len1; ++i) {
		var j = i % len2;
		var diff = this.charCodeAt(i*2+1);
		if (this.charAt(i*2) == '1') {
			diff = -diff;
		}
		result += String.fromCharCode(key.charCodeAt(j)+diff);
	}
	return result;
};

/**
 * Converts a decimal representation of a number to hex
 * @method decimalToHex
 * @return {String}
 */
Sp.decimalToHex = function () {
    var dec = this.split(''), sum = [], hex = [], i, s;
    while (dec.length) {
        s = 1 * dec.shift();
        for(i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10;
            sum[i] = s % 16;
            s = (s - sum[i]) / 16;
        }
    }
    while (sum.length){
        hex.push(sum.pop().toString(16));
    }
    return hex.join('');
}

/**
 * @class Function
 * @description Q extended methods for Functions
 */

/**
 * Binds a method to an object, so "this" inside the method
 * refers to that object when it is called.
 * @method bind
 * @param {Function} method A reference to the function to call
 * @param {Object} obj The object to bind as the context for the function call
 * @param {Mixed} [arg1] Optionally add arguments to be prepended to the called arguments
 */
var Fp = Function.prototype;
if (!Fp.bind)
Fp.bind = function _Function_prototype_bind(obj /*, arg1, arg2, ... */) {
	var method = this;
	obj = obj || root;
	if (!obj) obj = root;
	if (arguments.length <= 1) {
		return function _Q_bind_result() {
			return method.apply(obj, arguments);
		};
	}
	var args = Array.prototype.slice.call(arguments, 1);
	return function _Q_bind_result_withOptions() {
		return method.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
	};
};

/**
 * @class Date
 * @description Q methods for Date
 */

if (!Date.now)
/**
* Returns total number of milliseconds since the UNIX epoch
* @method now
* @static
* @return {number}
*/
Date.now = function _Date_now() {
	return new Date().getTime();
};

/**
 * Returns a Date from a dateTimeString.
 * @param {String} dateTimeString
 * @param {Number} [timezoneOffset=0]
 *  The timezone in which the dateTimeString was supposed to be. Defaults to UTC.
 * @return {Date}
 */
Date.fromDateTime = function _Date_fromDateTime(dateTimeString, timezoneOffset) {
	timezoneOffset = timezoneOffset || 0;
	var date = new Date(dateTimeString.replace(/-/g,"/"));
	var minutes = (new Date()).getTimezoneOffset() - timezoneOffset;
	if (minutes) {
		date = new Date(date.getTime() - minutes*60000);
	}
	return date;
};

/**
 * Returns a Date from a timestamp, which may be in seconds or milliseconds.
 * Returns null if isNaN(timestamp) was true.
 * @param {String|Number} timestamp
 * @return {Date|null}
 */
Date.fromTimestamp = function (timestamp) {
	if (isNaN(timestamp)) {
		return null;
	}
	timestamp = parseFloat(timestamp);
	return new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
};

/**
 * Returns a Date from a variety of possible inputs
 * @param {String|Number} input
 * @return {Date}
 */
Date.from = function (input) {
	if (input instanceof Date) {
		return input;
	}
	return Date.fromTimestamp(input) || new Date(input);
};

/**
 * Returns a Date from a dateTimeString
 * @param {Boolean} [dateOnly] pass true to return just the date part
 * @return {String}
 */
Date.prototype.toDateTime = function _Date_toDateTime(dateOnly) {
	return this.getFullYear() 
		+ "-" + ('0' + (this.getMonth() + 1)).slice(-2)
		+ "-" + ('0' + this.getDate()).slice(-2)
		+ (dateOnly ? '' : ' '
			+ ('0' + this.getHours()).slice(-2) 
			+ ":" + ('0' + this.getMinutes()).slice(-2)
			+ ":" + ('0' + this.getSeconds()).slice(-2));
};

function _returnFalse() { return false; }

if (root.Element) { // only IE7 and lower, which we don't support, wouldn't have this

if (!document.getElementsByClassName) {
	document.getElementsByClassName = function(className) {
		return Array.prototype.slice.call(this.querySelectorAll("." + className));
	};
}

var Elp = Element.prototype;

/**
 * @class Element
 * @description Q extended methods for DOM Elements
 */

if (!Elp.Q)
/**
* Call this on an element to access tools attached to it.
* The tools are like "view models".
* this method is overridden by the tool constructor on specific elements
* @method Q
* @param {String} toolName
* @return {Q.Tool|null}
*/
Elp.Q = function (toolName) {
	// this method is overridden by the tool constructor on specific elements
	return undefined;
};

if (!Elp.contains)
/**
* Check whether this element is the given element or contains it
* @method contains
* @param {Element} child
* @return {boolean}
*/
Elp.contains = function (child) {
	if (!child) return false;
	var node = child;
	while (node) {
		if (node == this) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
};

/**
 * Returns a snapshot of the computed style of an element.
 * @method computedStyle
 * @param {String} [name] If provided, the value of a property is returned instead of the whole style object.
 * @param {String} [pseudoElement] Optionally indicate the pseudo-element ("before", "placeholder" etc.) to get the style of
 * @return {Object|String}
 */
Elp.computedStyle = function(name, pseudoElement) {
	var computedStyle = root.getComputedStyle
		? root.getComputedStyle(this)
		: this.currentStyle;
	var result = {};
	for (var k in computedStyle) {
		var k2 = root.getComputedStyle ? k : k.replace(/-(\w)/gi, function (word, letter) {
			return letter.toUpperCase();
		});
		result[k2] = computedStyle[k];
	}
	return name ? result[name.replace(/-(\w)/gi, function (word, letter) {
		return letter.toUpperCase();
	})] : result;
};

/**
 * Copies the computed style from another Element, and assigns it to this Element.
 * @method copyComputedStyle
 * @param {Element} src
 * @return {Element} returns this, for chaining
 */
Elp.copyComputedStyle = function(src) {
	var s = src.computedStyle();
	for ( var i in s ) {
		// Do not use `hasOwnProperty`, nothing will get copied
		if ( typeof i == "string" && i != "cssText" && !(/\d/).test(i) ) {
			// The try is for setter only properties
			try {
				this.style[i] = s[i];
				// `fontSize` comes before `font` If `font` is empty, `fontSize` gets
				// overwritten.  So make sure to reset this property. (hackyhackhack)
				// Other properties may need similar treatment
				if ( i == "font" ) {
					this.style.fontSize = s.fontSize;
				}
				if ( i == "backgroundRepeatX" || i == "backgroundRepeatY" ) {
					this.style.backgroundRepeat = s.backgroundRepeat;
				}
			} catch (e) {}
		}
	}
	return this;
};

/**
 * Retrieves the width and height of the element, if any were set it in css,
 * as specified in either pixels or percentages, or "auto".
 * Very useful when sizing other elements to match the dimensions.
 * @return {Object} Returns object with properties "width" and "height" as strings.
 */
Elp.cssDimensions = function () {
    var cn = this.cloneNode();
	cn.style.display = 'none';
    this.parentNode.appendChild(cn);
    var cs = Q.copy(cn.computedStyle());
    this.parentNode.removeChild(cn);
    return { width: cs.width, height: cs.height };
};

/**
 * Returns the first element in the chain of parent elements which supports scrolling
 * @method scrollingParent
 * @param {Boolean} [skipIfNotOverflowed=false] If element is not overflowed, continue search
 * @param {String} [direction="all"] Can also be "vertical" or "horizontal"
 * @param {Boolean} [includeSelf=false] Whether the element itself can be returned if it matches
 * @return {Element|null} Returns the first parent encountered that matches, otherwise null
 */
Elp.scrollingParent = function(skipIfNotOverflowed, direction, includeSelf) {
	var p = this;
	while (includeSelf ? 1 : (p = p.parentNode)) {
		includeSelf = false;
		if (typeof p.computedStyle !== 'function') {
			continue;
		}
		var pcs = p.computedStyle();
		var overflow;
		if (direction === 'vertical') {
			overflow = pcs.overflowY || p.style.overflowY;
		} else if (direction === 'horizontal') {
			overflow = pcs.overflowX || p.style.overflowX;
		} else {
			overflow = pcs.overflow || p.style.overflow
				|| pcs.overflowY || p.style.overflowY
				|| pcs.overflowX || p.style.overflowX;
		}
		if (overflow && ['hidden', 'visible'].indexOf(overflow) < 0) {
			if (!skipIfNotOverflowed || p.clientHeight < p.scrollHeight) {
				return p;
			}
		}
	}
	return p || null;
};

/**
 * Call this to make sure scrolling is adjusted properly after contents have changed.
 * Some browsers, such as Safari on iOS, don't act properly unless this is called.
 * @method adjustScrolling
 * @param {Element} element
 */
Elp.adjustScrolling = function() {
	var scrolling = this.style['-webkit-overflow-scrolling'];
	var element = this;
	element.style['-webkit-overflow-scrolling'] = (scrolling === 'auto' ? 'touch' : 'auto');
	setTimeout(function () {
		element.style['-webkit-overflow-scrolling'] = scrolling;
	}, 0);
	return this;
};

/**
 * Switch places with another element
 * @method swap
 * @param {Element} element
 */
Elp.swap = function(element) {
	var parent1, next1, parent2, next2;
	parent1 = this.parentNode;
	next1   = this.nextSibling;
	parent2 = element.parentNode;
	next2   = element.nextSibling;
	parent1.insertBefore(element, next1);
	parent2.insertBefore(this, next2);
};

/**
 * Prevent ability to select text in an element
 * @method preventSelections
 * @param {boolean} deep whether to prevent it also on child elements
 * @param {boolean} callouts whether to also cancel the callouts in webkit
 */
Elp.preventSelections = function (deep, callouts) {
	Q.addEventListener(this, 'selectstart', _returnFalse);
	this.preventSelectionsInfo = this.preventSelectionsInfo || {
		style: this.style['-moz-user-select']
			|| this.style['-webkit-user-select']
			|| this.style['-ms-user-select']
			|| this.style['user-select'],
		callout: this.style['-webkit-user-callout'],
		unselectable: this.unselectable
	};
	this.unselectable = 'on'; 
	this.style[Q.info.browser.prefix+'user-select']
	= this.style['user-select'] = 'none';
	if (callouts) {
		this.style[Q.info.browser.prefix+'user-callout']
		= this.style['user-select'] = 'none';
	}
	if (!deep) return;
	Q.each(this.children || this.childNodes, function () {
		if (this.preventSelections
		&& ['INPUT', 'TEXTAREA'].indexOf(this.tagName.toUpperCase()) < 0
		&& this.hasClass && !this.hasClass('Q_selectable')) {
			this.preventSelections(deep);
		}
	});
};

/**
 * Restore ability to select text in an element 
 * @method restoreSelections
 * @param {boolean} deep whether to restore it also on child elements
 * @return {boolean}
 */
Elp.restoreSelections = function (deep) {
	var p = this.preventSelectionsInfo;
	if (p) {
		this.style['-moz-user-select']
		= this.style['-webkit-user-select']
		= this.style['-ms-user-select']
		= this.style['user-select'] = p.style || 'text';
		this.style['-webkit-user-callout'] = p.callout;
		this.unselectable = p.unselectable;
		delete this.preventSelectionsInfo;
	}
	Q.removeEventListener(this, 'selectstart', _returnFalse);
	if (!deep) return;
	Q.each(this.children || this.childNodes, function () {
		if (this.restoreSelections
		&& ['INPUT', 'TEXTAREA'].indexOf(this.tagName.toUpperCase()) >= 0) {
			this.restoreSelections(deep);
		}
	});
};

/**
 * Check whether this Element comes before another one, in a certain context
 * @method isBefore
 * @param {Element} element
 * @param {Element} context optional containing element, defaults ot the document element
 * @return {boolean}
 */
Elp.isBefore = function (element, context) {
	var before = true, that = this;
	context = context || document.documentElement; // TODO: can triangulate a parentNode instead
	Q.find(context, null, function (elem) {
		if (elem === element) {
			before = false;
			return false;
		}
		if (elem === that) {
			return false;
		}
	});
	return before;
};

/**
 * Check whether this element has a given CSS class
 * @method hasClass
 * @param {String} className
 * @return {boolean}
 */
Elp.hasClass = function (className) {
	if (this.classList) {
		return this.classList.contains(className);
	} else {
		return new RegExp('(^| )' + className + '( |$)', 'gi').test(this.className);
	}
};

/**
 * Remove a CSS class from the element
 * @method removeClass
 * @chainable
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.removeClass = function (className) {
	if (this.classList) {
		this.classList.remove(className);
	} else {
		this.className = this.className.replace(new RegExp('(^| )' 
			+ className.split(' ').join('|') + '( |$)', 'gi'), ' ');
	}
	return this;
};

/**
 * Add a CSS class to an element
 * @method addClass
 * @chainable
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.addClass = function (className) {
	if (Q.typeOf(className) !== 'string') {
		className = '';
	}

	var classNames = className.split(' ');
	var l = classNames.length;
	for (var i=0; i<l; ++i) {
		var c = classNames[i];
		if (!c) continue;
		if (this.classList) {
			this.classList.add(c);
		} else {
			this.removeClass(c);
			this.className += ' ' + c;
		}
	}
	return this;
};

/**
 * Adds or removes an element according to whether a condition is truthy
 * @method setClass
 * @chainable
 * @param {String} className
 * @param {Boolean} condition
 * @return {Element} returns this, for chaining
 */
Elp.setClass = function (className, condition) {
	if (condition) {
		this.addClass(className);
	} else {
		this.removeClass(className);
	}
	return this;
};

/**
 * Get the text content of an element (as opposed to its inner HTML)
 * @method innerText
 * @return {String}
 */
Elp.innerText = function() {
	return this.textContent || this.innerText;
};

/**
 * Returns whether the element's content has overflowed the element's bounds.
 * Does not work in IE8 and below for elements with {text-overflow: ellipsis}.
 * @method isOverflowed
 * @return {boolean}
 */
Elp.isOverflowed = function() {
	return (this.offsetWidth < this.scrollWidth)
	    || (this.offsetHeight < this.scrollHeight);
};

/**
 * Returns whether the element is visible
 * @method isVisible
 * @return {boolean}
 */
Elp.isVisible = function () {
	return this.offsetWidth > 0 || this.offsetHeight > 0;
};

/**
 * Gets the width remaining after subtracting all the siblings (except text nodes)
 * on the same line.
 * @method remainingWidth
 * @param {boolean} subpixelAccuracy
 * @param {boolean} excludeMargins
 * @return {number|null} Returns the remaining width, or null if element has no parent
 */
Elp.remainingWidth = function (subpixelAccuracy, excludeMargins) {
	var element = this;
	var pn = this.parentNode;
	if (!pn) {
		return null;
	}
	var rect1 = this.getBoundingClientRect();
	var rect2 = pn.getBoundingClientRect();
	var w = (rect2.right - rect2.left); // could be fractional
	var cs = pn.computedStyle();
	w -= _parseFloat(cs.paddingLeft) + _parseFloat(cs.paddingRight)
		+ _parseFloat(cs.borderLeftWidth) + _parseFloat(cs.borderRightWidth);
	Q.each(pn.children, function () {
		if (this === element || !this.isVisible()) return;
		var rect3 = this.getBoundingClientRect();
		if (rect1.top >= rect3.bottom || rect1.bottom <= rect3.top) {
			return;
		}
		var style = this.computedStyle();
		w -= (rect3.right - rect3.left
			+ _parseFloat(style.marginLeft) + _parseFloat(style.marginRight));
	});
	if (excludeMargins) {
		var tcs = this.computedStyle();
		w -= (_parseFloat(tcs.marginLeft) + _parseFloat(tcs.marginRight));
	}
	return subpixelAccuracy ? w : Math.floor(w-0.01);
};

/**
 * Gets activated and future tools inside some html element.
 * @method forEachTool
 * @param {String} [name=""] Filter by name of the child tools, such as "Q/inplace"
 * @param {Function} callback The callback to execute at the right time
 * @param {String} [key] Optional, to be used for the onActivate handler that gets added
 */
Elp.forEachTool = function _Q_Tool_prototype_forEachTool(name, callback, key) {
	var element = this;
	if (typeof name !== 'string') {
		callback = name;
		name = "";
	}
	// check already activated tools
	Q.each(element.getElementsByClassName("Q_tool"), function () {
		var tool = Q.Tool.from(this, name);
		tool && Q.handle(callback, tool);
	});
	Q.Tool.onActivate(name).set(function () {
		try {
			if (element.contains(this.element)) {
				Q.handle(callback, this);
			}
		} catch (e) {
			console.warn(e);
		}
	}, key);
};

/**
 * Check if element instance od HTML.Element and exists in DOM.
 * @method exists
 * @chainable
 * @param {Element} element
 * @return {Boolean}
 */
Q.elementIsInDOM = function (element) {
	return (element instanceof Element) && element.offsetParent;
};

if (!Elp.getElementsByClassName) {
	Elp.getElementsByClassName = document.getElementsByClassName;
}

}

function _parseFloat(value) {
	return value.substr(value.length-2) == 'px' ? parseFloat(value) : 0;
}
	
(function() {
	if (navigator.appVersion.indexOf('MSIE 8') > 0) {
		var _slice = Array.prototype.slice;
		Array.prototype.slice = function() {
			if (this instanceof Array) {
				return _slice.apply(this, arguments);
			} else {
				var result = [];
				var start = (arguments.length >= 1) ? arguments[0] : 0;
				var end = (arguments.length >= 2) ? arguments[1] : this.length;
				for(var i=start; i<end; i++) {
					result.push(this[i]);
				}
				return result;
			}
		};
	}
})();

if (!root.requestAnimationFrame) {
	root.requestAnimationFrame =
		root.webkitRequestAnimationFrame || 
		root.mozRequestAnimationFrame    || 
		root.oRequestAnimationFrame      || 
		root.msRequestAnimationFrame     || 
		function( callback ) {
			return setTimeout(function _shim_requestAnimationFrame() {
				callback(Q.milliseconds());
			}, 1000 / Q.Animation.fps);
		};
	root.cancelAnimationFrame =
		root.webkitCancelAnimationFrame || 
		root.mozCancelAnimationFrame    || 
		root.oCancelAnimationFrame      || 
		root.msCancelAnimationFrame     || 
		function( id ) {
			clearTimeout(id);
		};
}

// public methods:

/**
 * @class Q
 */

/**
 * Returns the number of milliseconds since the
 * first call to this function (i.e. since script started).
 * @static
 * @method milliseconds
 * @param {boolean} sinceEpoch
 *  Defaults to false. If true, just returns the number of milliseconds in the UNIX timestamp.
 * @return {float}
 *  The number of milliseconds, with fractional part
 */
Q.milliseconds = function (sinceEpoch) {
	var result = Date.now();
	if (sinceEpoch) return result;
	return result - Q.milliseconds.start;
};
Q.milliseconds.start = Date.now();

/**
 * Format time related to locale (13:00 or 1pm)
 * @static
 * @method timeInLocale
 * @param {string} time String in format hh or hh:mm or hh:mm:ss
 * @param {object} [options]
 * @param {object} [options.locale] Locale to relate format time
 * @return {String}
 */
Q.timeInLocale = function (time, options) {
	var date = new Date();
	var timeSplitted = time.split(":");
	Date.prototype.setHours.apply(date, timeSplitted);
	var locale = Q.getObject("locale", options) || navigator.language;
	var params = {hour: '2-digit'};
	if (timeSplitted.length > 1) {
		params.minute = '2-digit';
	}
	if (timeSplitted.length > 2) {
		params.second = '2-digit';
	}

	return date.toLocaleTimeString(locale, params).replace(/^0+/, '');
}

/**
 * Creates a copied object which you can extend, using existing object as prototype
 * @static
 * @method objectWithPrototype
 * @param {Derived} original
 * @return {Derived}
*/
Q.objectWithPrototype = function _Q_objectWithPrototype(original) {
	if (!original) {
		return {};
	}
	function Copied() {}
	Copied.prototype = original;
	return new Copied();
};

/**
 * Returns the type of a value
 * @static
 * @method typeOf
 * @param {Mixed} value
 * @return {String}
 */
Q.typeOf = function _Q_typeOf(value) {
	var s = typeof value, x, l;
	if (s === 'function' && !(value instanceof Function)) {
		// older webkit workaround https://bugs.webkit.org/show_bug.cgi?id=33716
		s = 'object';
	}
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		if (value instanceof root.Element) {
			return 'Element';
		} else if (value instanceof Array
		|| (value.constructor && value.constructor.name === 'Array')
		|| Object.prototype.toString.apply(value) === '[object Array]') {
			s = 'array';
		} else if (typeof value.typename != 'undefined' ) {
			return value.typename;
		} else if (typeof (l=value.length) == 'number' && (l%1==0)
		&& (!l || ((l-1) in value))) {
			return 'array';
		} else if (typeof value.constructor != 'undefined'
		&& typeof value.constructor.name != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			return value.constructor.name;
		} else if ((x = Object.prototype.toString.apply(value)).substr(0, 8) === "[object ") {
			return x.substring(8, x.length-1).toLowerCase();
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Iterates over elements in a container, and calls the callback.
 * Use this if you want to avoid problems with loops and closures.
 * @static
 * @method each
 * @param {Array|Object|String|Number} container, which can be an array, object or string.
 *  You can also pass up to three numbers here: from, to and optional step
 * @param {Function|String} callback
 *  A function which will receive two parameters
 *	index: the index of the current item
 *	value: the value of the current item
 *  Also can be a string, which would be the name of a method to invoke on each item, if possible.
 *  In this case the callback should be followed by an array of arguments to pass to the method calls.
 *  You can still pass the options afterwards.
 * @param {Object} options Can include the following:
 * @param {boolean} [options.ascending=false] pass true here to traverse in ascending key order, false in descending.
 * @param {boolean} [options.numeric=false] used together with ascending. Pass true to use numeric sort instead of string sort.
 * @param {Function} [options.sort] pass a comparator Function here to be used when sorting object keys before traversal. Also can pass a String naming the property on which to sort.
 * @param {boolean} [options.hasOwnProperty=false] set to true to skip properties found on the prototype chain.
 * @throws {Q.Error} If container is not array, object or string
 */
Q.each = function _Q_each(container, callback, options) {
	function _byKeys(a, b) { 
		return a > b ? 1 : (a < b ? -1 : 0); 
	}
	function _byFields(a, b) { 
		return container[a][s] > container[b][s] ? 1
			: (container[a][s] < container[b][s] ? -1 : 0); 
	}
	function _byKeysNumeric(a, b) { 
		return Number(a) - Number(b); 
	}
	function _byFieldsNumeric(a, b) { 
		return Number(container[a][s]) - Number(container[b][s]); 
	}
	var i, k, c, length, r, t, args;
	if (typeof callback === 'string' && Q.isArrayLike(arguments[2])) {
		args = arguments[2];
		options = arguments[3];
	}
	switch (t = Q.typeOf(container)) {
		case 'array':
		default:
			// Assume it is an array-like structure.
			// Make a copy in case it changes during iteration. Then iterate.
			c = Array.prototype.slice.call(container, 0);
			if (('0' in container) && !('0' in c)) {
				// we are probably dealing with IE < 9
				c = [];
				for (i=0; r = container[i]; ++i) {
					c.push(r);
				}
			}
			length = c.length;
			if (!c || !length || !callback) return;
			if (options && options.ascending === false) {
				for (i=length-1; i>=0; --i) {
					r = Q.handle(callback, c[i], args || [i, c[i], c]);
					if (r === false) return false;
				}
			} else {
				for (i=0; i<length; ++i) {
					r = Q.handle(callback, c[i], args || [i, c[i]], c);
					if (r === false) return false;
				}
			}
			break;
		case 'object':
			if (!container || !callback) return;
			if (options && ('ascending' in options || 'sort' in options)) {
				var keys = [], key;
				for (k in container) {
					if (options.hasOwnProperty && !Q.has(container, k)) {
						continue;
					}
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						keys.push(options.numeric ? Number(k) : k);
					}
				}
				var s = options.sort;
				var t = typeof(s);
				var compare = (t === 'function') ? s : (t === 'string'
					? (options.numeric ? _byFieldsNumeric : _byFields)
					: (options.numeric ? _byKeysNumeric : _byKeys));
				keys.sort(compare);
				if (options.ascending === false) {
					for (i=keys.length-1; i>=0; --i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key], container]);
						if (r === false) return false;
					}
				} else {
					for (i=0; i<keys.length; ++i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key], container]);
						if (r === false) return false;
					}
				}
			} else {
				for (k in container) {
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						r = Q.handle(callback, container[k], args || [k, container[k], container]);
						if (r === false) return false;
					}
				}
			}
			break;
		case 'string':
			var c;
			if (!container || !callback) return;
			if (options && options.ascending === false) {
				for (i=0; i<container.length; ++i) {
					c = container.charAt(i);
					r = Q.handle(callback, c, args || [i, c, container]);
					if (r === false) return false;
				}
			} else {
				for (i=container.length-1; i>=0; --i) {
					c = container.charAt(i);
					r = Q.handle(callback, c, args || [i, c, container]);
					if (r === false) return false;
				}
			}
			break;
		case 'number':
			var from = 0, to=container, step;
			if (typeof arguments[1] === 'number') {
				from = arguments[0];
				to = arguments[1];
				if (typeof arguments[2] === 'number') {
					step = arguments[2];
					callback = arguments[3];
					options = arguments[4];
				} else {
					callback = arguments[2];
					options = arguments[3];
				}
			}
			if (!callback) return;
			if (step === undefined) {
				step = (from <= to ? 1 : -1);
			}
			if (!step || (to-from)*step<0) {
				return 0;
			}
			if (from <= to) {
				for (i=from; i<=to; i+=step) {
					r = Q.handle(callback, this, args || [i], container);
					if (r === false) return false;
					if (step < 0) return 0;
				}
			} else {
				for (i=from; i>=to; i+=step) {
					r = Q.handle(callback, this, args || [i], container);
					if (r === false) return false;
					if (step > 0) return 0;
				}
			}
			break;
		case 'function':
		case 'boolean':
			if (container === false) break;
			throw new Q.Error("Q.each: does not support iterating a " + t);
		case 'null':
		case 'undefined':
			break;
	}
};

/**
 * Returns the first non-undefined value found in a container
 * Note: do not rely on object key ordering, it can vary in some browsers
 * @static
 * @method first
 * @param {Array|Object|String} container
 * @param {Object} options
 * @param {boolean} [options.nonEmptyKey] return the first non-empty key
 * @return {mixed} the value in the container, or undefined
 * @throws {Q.Error} If container is not array, object or string
 */
Q.first = function _Q_first(container, options) {
	var fk = Q.firstKey(container, options);
	return fk != null ? container[fk] : undefined;
};

/**
 * Returns the first key or index found in a container with a value that's not undefined
 * Note: do not rely on object key ordering, it can vary in some browsers
 * @static
 * @method firstKey
 * @param {Array|Object|String} container
 * @param {Object} options
 * @param {boolean} [options.nonEmptyKey] return the first non-empty key
 * @return {Number|String} the index in the container, or null
 * @throws {Q.Error} If container is not array, object or string
 */
Q.firstKey = function _Q_firstKey(container, options) {
	if (!container) {
		return undefined;
	}
	switch (typeof container) {
		case 'array':
			for (var i=0; i<container.length; ++i) {
				if (container[i] !== undefined) {
					return i;
				}
			}
			break;
		case 'object':
			for (var k in container) {
				if (container.hasOwnProperty(k)
				&& container[k] !== undefined) {
					if (k || !options || !options.nonEmptyKey) {
						return k;
					}
				}
			}
			break;
		case 'string':
			return 0;
		default:
			throw new Q.Error("Q.first: container has to be an array, object or string");
	}
	return undefined;
};

/**
 * Returns a container with the items in the first parameter that are not in the others
 * @static
 * @method diff
 * @param {Array|Object} container to subtract items from to form the result
 * @param {Array|Object} container whose items are subtracted in the result
 * @param {Function} [comparator] accepts item1, item2, index1, index2) and returns whether two items are equal
 * @return {Array|Object} a container of the same type as container1, but without elements of container2
 */
Q.diff = function _Q_diff(container1, container2 /*, ... comparator */) {
	if (!container1 || !container2) {
		return container1;
	}
	var args = arguments;
	var len = arguments.length;
	var comparator = arguments[len-1];
	if (typeof comparator !== 'function') {
		comparator = function _Q_diff_default_comparator(v1, v2) {
			return v1 === v2;
		}
		++len;
	}
	var isArr = Q.isArrayLike(container1);
	var result = isArr ? [] : {};
	Q.each(container1, function (k, v1) {
		var found = false;
		for (var i=1; i<len-1; ++i) {
			Q.each(args[i], function (j, v2) {
				if (comparator(v1, v2, i, j)) {
					found = true;
					return false;
				}
			});
			if (found) {
				return;
			}
		}
		if (isArr) {
			result.push(v1);
		} else {
			result[k] = v1;
		}
	});
	return result;
};

/**
 * Tests whether a variable contains a falsy value,
 * or an empty object or array.
 * @static
 * @method isEmpty
 * @param {object} o
 *  The object to test.
 *  @return {boolean}
 */
Q.isEmpty = function _Q_isEmpty(o) {
	if (!o) {
		return true;
	}
	var i, v, t;
	t = Q.typeOf(o);
	if (t === 'array') {
		return (o.length === 0);
	}
	if (t === 'object') {
		for (i in o) {
			v = o[i];
			if (v !== undefined) {
				return false;
			}
		}
		return true;
	}
	return false;
};

/**
 * Tests if the value is an integer
 * @static
 * @method isInteger
 * @param {mixed} value 
 *  The value to test
 * @param {boolean} [strictComparison=true]
 *  Whether to test strictly for a number
 * @return {boolean}
 *	Whether it is an integer
 */
Q.isInteger = function _Q_isInteger(value, strictComparison) {
	if (strictComparison) {
		return value > 0 ? Math.floor(value) === value : Math.ceil(value) === value;
	}
	return value > 0 ? Math.floor(value) == value : Math.ceil(value) == value;
};

/**
 * Tests if the value is an array
 * @static
 * @method isArray
 * @param value {mixed}
 *  The value to test
 * @return {boolean}
 *	Whether it is an array
 */
Q.isArrayLike = function _Q_isArrayLike(value) {
	return (Q.typeOf(value) === 'array');
};

/**
 * Determines whether something is a plain object created within Javascript,
 * or something else, like a DOMElement or Number
 * @static
 * @method isPlainObject
 * @param {Mixed} x
 * @return {boolean}
 *  Returns true only for a non-null plain object
 */
Q.isPlainObject = function (x) {
	if (x === null || typeof x !== 'object') {
		return false;
	}
	if (Object.prototype.toString.apply(x) !== "[object Object]") {
		return false;
	}
	if (root.attachEvent && !root.addEventListener) {
		// This is just for old browsers
		if (x && x.constructor !== Object) {
			return false;
		}
	}
	return true;
};

/**
 * Use this instead of instanceof, it works with Q.mixin, even in IE
 * @static
 * @method instanceOf
 * @param {mixed} testing
 * @param {Function} Constructor
 */
Q.instanceOf = function (testing, Constructor) {
	if (!testing || typeof testing !== 'object') {
		return false;
	}
	if (testing instanceof Constructor) {
		return true;
	}
	if (Constructor.__mixins) {
		for (var mixin in Constructor.__mixins) {
			if (testing instanceof mixin) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Makes a shallow copy of an object. But, if any property is an object with a "copy" method,
 * or levels > 0, it recursively calls that method to copy the property.
 * @static
 * @method copy
 * @param {Array} [fields=null]
 *  Optional array of fields to copy. Otherwise copy all that we can.
 * @param levels {number}
 *  Optional. Copy this many additional levels inside x if it is a plain object.
 * @return {Object}
 *  Returns the shallow copy where some properties may have deepened the copy
 */
Q.copy = function _Q_copy(x, fields, levels) {
	if (root.ArrayBuffer && (x instanceof ArrayBuffer)) {
		var result = ArrayBuffer.prototype.slice.call(x, 0);
	}
	if (Q.isArrayLike(x)) {
		var result = Array.prototype.slice.call(x, 0);
		var keys = Object.keys(x);
		for (var i=0, l=keys.length; i<l; ++i) {
			result[keys[i]] = x[keys[i]];
		}
		return result;
	}
	if (x && typeof x.copy === 'function') {
		return x.copy();
	}
	if (x === null || !Q.isPlainObject(x)) {
		return x;
	}
	var result = Q.objectWithPrototype(Object.getPrototypeOf(x)), i, k, l;
	if (fields) {
		for (i=0, l = fields.length; i<l; ++i) {
			k = fields[i];
			if (!(k in x)) {
				continue;
			}
			result[k] = levels ? Q.copy(x[k], null, levels-1) : x[k];
		}
	} else {
		for (k in x) {
			if (!Q.has(x, k)) {
				continue;
			}
			result[k] = levels ? Q.copy(x[k], null, levels-1) : x[k];
		}
	}
	return result;
};

/**
 * Extends an object by merging other objects on top. Among other things,
 *  Q.Events can be extended with Q.Events or objects of {key: handler} pairs,
 *  Arrays can be extended by other arrays or objects.
 *  (If an array is being extended by an object with a "replace" property,
 *   the array is replaced by the value of that property.)
 *  You can also extend recursively, see the levels parameter.
 * @static
 * @method extend
 * @param target {Object}
 *  This is the first object. It winds up being modified, and also returned
 *  as the return value of the function.
  * @param deep {Boolean}
 *  Optional. Precede any Object with a boolean true to indicate that we should
 *  also copy the properties it inherits through its prototype chain.
 * @param levels {Number}
 *  Optional. Precede any Object with an integer to indicate that we should 
 *  also copy that many additional levels inside the object.
 * @param anotherObject {Object}
 *  Put as many objects here as you want, and they will extend the original one.
 * @param namespace {String}
 *  Optional namespace to use when extending encountered Q.Event objects
 * @return
 *  The extended object.
 */
Q.extend = function _Q_extend(target /* [[deep,] [levels,] anotherObject], ... [, namespace] */ ) {
	var length = arguments.length;
	var namespace = undefined;
	if (typeof arguments[length-1] === 'string') {
		namespace = arguments[length-1];
		--length;
	}
	if (length === 0) {
		return {};
	}
	var deep = false, levels = 0;
	var type = Q.typeOf(target);
	var targetIsEvent = (type === 'Q.Event');
	var i, arg, k, argk, m, ttk, tak;
	for (i=1; i<length; ++i) {
		arg = arguments[i];
		if (!arg) {
			continue;
		}
		if (arg === true) {
			deep = true;
			continue;
		}
		if (typeof arg === 'number' && arg) {
			levels = arg;
			continue;
		}
		if (target === undefined) {
			if (Q.isArrayLike(arg)) {
				target = [];
				type = 'array';
			} else {
				target = {};
				type = 'object';
			}
		}
		if (targetIsEvent) {
			if (arg && arg.constructor === Object) {
				for (m in arg) {
					target.set(arg[m], m);
				}
			} else {
				target.set(arg, namespace);
			}
			continue;
		}
		if (type === 'array' && Q.isArrayLike(arg)) {
			target = Array.prototype.concat.call(target, arg);
		} else {
			for (k in arg) {
				if (deep !== true 
				&& (!arg.hasOwnProperty || !arg.hasOwnProperty(k))
				&& (arg.hasOwnProperty && (k in arg))) {
					continue;
				}
				argk = arg[k];
				ttk = (k in target) && Q.typeOf(target[k]);
				tak = Q.typeOf(argk);
				if (ttk === 'Q.Event') {
					if (argk && argk.constructor === Object) {
						for (m in argk) {
							target[k].set(argk[m], m);
						}
					} else if (tak === 'Q.Event') {
						for (m in argk.handlers) {
							target[k].set(argk.handlers[m], m);
						}
					} else {
						target[k].set(argk, namespace);
					}
				} else if (levels 
				&& target[k]
				&& (typeof target[k] === 'object' || typeof target[k] === 'function') 
				&& tak !== 'Q.Event'
				&& (Q.isPlainObject(argk) || (ttk === 'array' && tak === 'array'))) {
					target[k] = (ttk === 'array' && ('replace' in argk))
						? Q.copy(argk.replace)
						: Q.extend(target[k], deep, levels-1, argk);
				} else {
					target[k] = Q.extend.dontCopy[Q.typeOf(argk)]
						? argk
						: Q.copy(argk, null, levels);
				}
				if (target[k] === undefined) {
					delete target[k];
				}
			}
		}
		deep = false;
		levels = 0;
	}
	return target;
};

Q.extend.dontCopy = {
	"Q.Tool": true,
	"Q.Cache": true
};

/**
 * Returns whether an object contains a property directly
 * @static
 * @method has
 * @param  {Object} obj
 * @param {String} key
 * @return {boolean}
 */
Q.has = function _Q_has(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Copies a subset of the fields in an object
 * @static
 * @method take
 * @param {Object} source
 *  An Object from which to take things
 * @param  {Array|Object} fields
 *  An array of fields to take
 *  Or an Object of fieldname: default pairs
 * @return {Object}
 */
Q.take = function _Q_take(source, fields) {
	var result = {};
	if (!source) return result;
	if (Q.isArrayLike(fields)) {
		for (var i = 0; i < fields.length; ++i) {
			if (fields[i] in source) {
				result [ fields[i] ] = source [ fields[i] ];
			}
		}
	} else {
		for (var k in fields) {
			result[k] = (k in source) ? source[k] : fields[k];
		}
	}
	return result;
};

/**
 * Shuffles an array
 * @static
 * @method shuffle
 * @param {Array} arr
 *  The array that gets passed here is shuffled in place
 * @return {Array} returns the array
 */
Q.shuffle = function _Q_shuffle( arr ) {
	var i = arr.length;
	if ( !i ) return false;
	while ( --i ) {
		var j = Math.floor( Math.random() * ( i + 1 ) );
		var tempi = arr[i];
		var tempj = arr[j];
		arr[i] = tempj;
		arr[j] = tempi;
	}
	return arr;
};

/**
 * Mixes in one or more classes. Useful for inheritance and multiple inheritance.
 * @static
 * @method mixin
 * @param {Function} A
 *  The constructor corresponding to the "class" we are mixing functionality into
 *  This function will get the following members set:
 *  __mixins: an array of [B, C, ...]
 *  constructors(subject, params): a method to call the constructor of all mixin classes, in order. Pass "this" as the first argument.
 *  staticProperty(property): a method for getting a property name
 * @param {Function} B
 *  One or more constructors representing "classes" to mix functionality from
 *  They will be tried in the order they are provided, meaning methods from earlier ones
 *  override methods from later ones.
 */
Q.mixin = function _Q_mixin(A /*, B, ... */) {
	var __mixins = (A.__mixins || (A.__mixins = []));
	var mixin, i, k, l;
	for (i = 1, l = arguments.length; i < l; ++i) {
		mixin = arguments[i];
		if (typeof mixin !== 'function') {
			throw new Q.Error("Q.mixin: argument " + i + " is not a function");
		}
		var p = mixin.prototype, Ap = A.prototype;
		for (k in p) {
			if (!(k in Ap)) {
				Ap[k] = p[k];
			}
		}
		for (k in mixin) {
			if (!(k in A)) {
				A[k] = mixin[k];
			}
		}
		__mixins.push(arguments[i]);
	}

	A.staticProperty = function _staticProperty(propName) {
		for (var i=0; i<A.__mixins.length; ++i) {
			if (propName in A.__mixins[i]) {
				return A.__mixins[i].propName;
			}
		}
		return undefined;
	};
	
	A.constructors = function _constructors() {
		var mixins = A.__mixins;
		var i;
		for (i = mixins.length - 1; i >= 0; --i) {
			mixins[i].apply(this, arguments);
		}
	};

	A.prototype.constructors = function _prototype_constructors() {
		A.constructors.apply(this, arguments);
	};
};

/**
 * Normalizes text by converting it to lower case, and
 * replacing all non-accepted characters with underscores.
 * @static
 * @method normalize
 * @param {String} text
 *  The text to normalize
 * @param {String} replacement
 *  Defaults to '_'. A string to replace one or more unacceptable characters.
 *  You can also change this default using the config Db/normalize/replacement
 * @param {String} characters
 *  Defaults to '/[^A-Za-z0-9]+/'. A regexp characters that are not acceptable.
 *  You can also change this default using the config Db/normalize/characters
 * @param {number} numChars
 *  The maximum length of a normalized string. Default is 200.
 * @param {boolean} [keepCaseIntact=false] If true, doesn't convert to lowercase
 * @return {String} the normalized string
 */
Q.normalize = function _Q_normalize(text, replacement, characters, numChars, keepCaseIntact) {
	if (!numChars) numChars = 200;
	if (replacement === undefined) replacement = '_';
	characters = characters || /[^\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC0-9]+/g;
	if (text === undefined) {
		debugger; // pause here if debugging
	}
	if (!keepCaseIntact) {
		text = text.toLowerCase();
	}
	var result = text.replace(characters, replacement);
	if (result.length > numChars) {
		result = result.substr(0, numChars-11) + '_' 
				 + Math.abs(result.substr(numChars-11).hashCode());
	}
	return result;
};

function _getProp (/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var p, i = 0;
	if (context === null) return undefined;
	context = context || root;
	if (!parts.length) return context;
	while(context && (p = parts[i++]) !== undefined){
		try {
			if (p === '*') {
				p = Q.firstKey(context);
			}
			context = (context[p] !== undefined) ? context[p] : (create ? context[p] = {} : undefined);
		} catch (e) {
			if (create) {
				throw new Q.Error("Q.setObject cannot set property of " + typeof(context) + " " + JSON.stringify(context));
			}
		}
	}
	return context; // mixed
}

/**
 * Set an object from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * Objects are created as needed along `path`.
 * Another way to call this function is to pass an object of {name: value} pairs as the first parameter
 * and context as an optional second parameter. Then the return value is an object of the usual return values.
 * @static
 * @method setObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param {anything} value value or object to place at location given by name
 * @param {Object} [context=window]  Optional. Object to use as root of path.
 * @param {String} [delimiter='.']  The delimiter to use in the name
 * @return {Object|undefined} Returns the resulting value if setting is successful or `undefined` if not.
 */
Q.setObject = function _Q_setObject(name, value, context, delimiter) {
	if (Q.isPlainObject(name)) {
		context = value;
		var result = {};
		for (var k in name) {
			result[k] = Q.setObject(k, name[k], context);
		}
		return result;
	}
	if (typeof name === 'string') {
		name = name.split(delimiter || '.');
	}
	var p = name.pop();
	var obj = _getProp(name, true, context);
	return obj && (p !== undefined) ? (obj[p] = value) : undefined;
};

/**
 * Get a property from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * You can also use it to resolve an object where it might be a string or array or something else.
 * @static
 * @method getObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"] . If not a string or an array, it is simply returned.
 * @param {Object} [context=window] Optional. Object to use as root of path. Null may be passed.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @param {Mixed} [create=undefined] Pass a value here to set with Q.setObject if nothing was there
 * @return {Object|undefined} Returns the originally stored value, or `undefined` if nothing is there
 */
Q.getObject = function _Q_getObject(name, context, delimiter, create) {
	delimiter = delimiter || '.';
	if (typeof name === 'string') {
		name = name.split(delimiter);
	} else if (!(name instanceof Array)) {
		return name;
	}
	var result = _getProp(name, false, context);
	if (create !== undefined) {
		result = Q.setObject(name, create, context, delimiter);
	}
	return result;
};

/**
 * Use this to ensure that a property exists before running some javascript code.
 * If something is undefined, loads a script or executes a function,
 * calling the callback on success.
 * The callback is called only after the Q.onInit event has executed, so functions
 * like Q.url() and Q.addScript can be expected to work properly.
 * @static
 * @method ensure
 * @param {String} property
 *  Path to the property to test whether Q.getObject() will return undefined.
 * @param {Function} callback
 *  The callback to call when the loader has been executed.
 *  The first parameter should be the property (object, string, etc.) that's now defined.
 *  This is where you would put the code that relies on the property being defined.
 */
Q.ensure = function _Q_ensure(property, callback) {
	if (Q.getObject(property, root) !== undefined) {
		Q.handle(callback, null, [property]);
		return;
	}
	var loader = Q.ensure.loaders[property];
	if (!loader) {
		throw new Q.Error("Q.ensure: missing loader for " + property);
	}
	Q.onInit.addOnce(function () {
		if (typeof loader === 'string') {
			Q.require(loader, callback);
		} else if (typeof loader === 'function') {
			loader(property, callback);
		} else if (loader instanceof Q.Event) {
			loader.add(property, function _loaded() {
				callback(property);
			});
		}
	});
};

/**
 * Whether a page is currently being loaded
 * @property {Object} ensure.loaders
 *  Something to execute if the property was undefined and needs to be loaded.
 *  The key is the property. The value can be one of several things.
 *  If a string, this is interpreted as the URL of a javascript to load.
 *  If a function, this is called with the property and callback as arguments.
 *  If an event, the callback is added to it.
 *  The loader must call the callback and pass the property as the first parameter.
 */
Q.ensure.loaders = {
	'Handlebars': '{{Q}}/js/handlebars-v4.0.10.min.js',
	'jQuery': '{{Q}}/js/jquery-3.2.1.min.js',
	'Q.PHPJS': "{{Q}}/js/phpjs.js",
	'IntersectionObserver': function (property, callback) {
		if ('IntersectionObserver' in window
		&& 'IntersectionObserverEntry' in window
		&& 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
			// Minimal polyfill for Edge 15's lack of `isIntersecting`
			// See: https://github.com/w3c/IntersectionObserver/issues/211
			if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
   				  Object.defineProperty(window.IntersectionObserverEntry.prototype,
   					  'isIntersecting', {
   						  get: function () {
   							  return this.intersectionRatio > 0;
   						  }
   					  }
   				  );
			}
			return callback && callback(property);
	 	}
		Q.addScript('{{Q}}/js/polyfills/IntersectionObserver.js', function () {
			callback && callback(property);
		});
	}
};

/**
 * Used to prevent overwriting the latest results on the client with older ones.
 * Typically, you would call this function before making some sort of request,
 * save the ordinal in a variable, and then pass it to the function again inside
 * a closure. For example:
 * @example
 * var ordinal = Q.latest(tool);
 * requestSomeResults(function (err, results) {
 *   if (!Q.latest(tool, ordinal)) return;
 *   // otherwise, show the latest results on the client
 * });
 * @static
 * @method latest
 * @param key {String|Q.Tool}
 *  Requests under the same key share the same incrementing ordinal
 * @param ordinal {Number|Boolean}
 *  Pass an ordinal that you obtained from a previous call to the function
 *  Pass true here to get the latest ordinal that has been passed so far
 *  to the method under this key, corresponding to the latest results seen.
 * @return {Number|Boolean}
 *  If only key is provided, returns an ordinal to use.
 *  If ordinal is provided, then returns whether this is still the latest ordinal.
 */
Q.latest = function (key, ordinal) {
	key = Q.calculateKey(key);
	if (ordinal === undefined) {
		return Q.latest.issued[key]
			= ((Q.latest.issued[key] || 0) % Q.latest.max) + 1;
	}
	var seen = Q.latest.seen[key] || 0;
	if (ordinal === true) {
		return seen;
	}
	if (ordinal > seen || ordinal < seen - Q.latest.max * 9/10) {
		Q.latest.seen[key] = ordinal;
		return true;
	}
	return false;
};
Q.latest.issued = {};
Q.latest.seen = {};
Q.latest.max = 10000;

/**
 * Convert string or number to human readable string
 * @static
 * @method humanReadable
 * @param {String|Integer} value
 * @param {object} params
 * @param {string} [params.bytes] If true, convert from bytes to human readable string like "12 KB", "1.5 MB" etc
 * @return {String} Human readable string
 */
Q.humanReadable = function (value, params) {
	if (Q.getObject("bytes", params)) {
		value = parseInt(value);

		if (value >= Math.pow(2, 30)) {
			return Math.ceil(value / Math.pow(2, 30)) + ' GB';
		} else if (value >= Math.pow(2, 20)) {
			return Math.ceil(value / Math.pow(2, 20)) + ' MB';
		} else if (value >= Math.pow(2, 10)) {
			return Math.ceil(value / Math.pow(2, 10)) + ' KB';
		} else {
			return value + ' bytes';
		}
	}
}
/**
 * Calculates a string key by considering the parameter that was passed,
 * the tool being activated, and the page being activated.
 * These keys can be used in methods of Q.Event, Q.Masks etc.
 * @static
 * @method calculateKey
 * @param {String|Q.Tool|true} key
 * @param {Object} container in which the key will be used
 * @param {number} number at which to start the loop for the default key generation
 * @return {String}
 */
Q.calculateKey = function _Q_calculateKey(key, container, start) {
	if (key === true) {
		return "PAGE: CURRENT";
	}
	if (key === undefined) {
		key = Q.Tool.beingActivated; // by default, use the current tool as the key, if any
	}
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = "TOOL: " + key.id + " (" + key.name + ")";
	} else if (container && key == undefined) { // key is undefined or null
		var i = (start === undefined) ? 1 : start;
		key = 'AUTOKEY_' + i;
		while (container[key]) {
			key = 'AUTOKEY_' + (++i);
		}
	} else if (key !== undefined && typeof key !== 'string') {
		throw new Q.Error("Q.calculateKey: key must be a String, Q.Tool, true, or undefined");
	}
	return key;
};
Q.calculateKey.keys = [];

/**
 * Chains an array of callbacks together into a function that can be called with arguments
 * 
 * @static
 * @method chain
 * @param {Array} callbacks An array of callbacks, each taking another callback at the end
 * @param {Function} [callback] The final callback, if any, to call after the chain is done
 * @return {Function} The wrapper function
 */
Q.chain = function (callbacks, callback) {
	var result = callback;
	Q.each(callbacks, function (i, cb) {
		if (Q.typeOf(cb) !== 'function') {
			return;
		}

		var prevResult = result;
		result = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.push(prevResult);
			return cb.apply(this, args);
		};
	}, {ascending: false, numeric: true});
	return result;
};

/**
 * Takes a function and returns a version that returns a promise
 * @method promisify
 * @static
 * @param  {Function} getter A function that takes arguments that include a callback and passes err as the first parameter to that callback, and the value as the second argument.
 * @param {Boolean} useThis whether to resolve the promise with the "this" instead of the second argument
 * @param {Number} callbackIndex Which argument the getter is expecting the callback, if any
 * @return {Function} a wrapper around the function that returns a promise, extended with the original function's return value if it's an object
 */
Q.promisify = function (getter, useThis, callbackIndex) {
	function _promisifier() {
		if (!Q.Promise) {
			return getter.apply(this, args);
		}
		var args = [], resolve, reject, found = false;
		Q.each(arguments, function (i, ai) {
			if (typeof ai !== 'function') {
				args.push(ai);
			} else {
				found = true;
				args.push(function _promisified(err, second) {
					try {
						ai.apply(this, arguments);
					} catch (e) {
						err = e;
					}
					if (err) {
						return reject(err);
					}
					resolve(useThis ? this : second);
				});
			}
		});
		if (!found) {
			var ci = (callbackIndex === undefined) ? args.length : callbackIndex;
			args[ci] = function _defaultCallback(err, second) {
				if (err) {
					return reject(err);
				}
				resolve(useThis ? this : second);
			};
		}
		var promise = new Q.Promise(function (r1, r2) {
			resolve = r1;
			reject = r2;
		});
		return Q.extend(promise, getter.apply(this, args));
	}
	return Q.extend(_promisifier, getter);
};

/**
 * Wraps a function and returns a wrapper that will call the function at most once.
 * @static
 * @method once
 * @param {Function} original The function to wrap
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.once = function (original, defaultValue) {
	var _called = false;
	return function _Q_once_wrapper() {
		if (_called) return defaultValue;
		_called = true;
		return original.apply(this, arguments);
	};
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * at most once every given milliseconds.
 * @static
 * @method throttle
 * @param {Function} original The function to wrap
 * @param {Number} milliseconds The number of milliseconds
 * @param {Boolean} delayedFinal Whether the wrapper should execute the latest function call
 *  after throttle opens again, useful for e.g. following a mouse pointer that stopped.
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.throttle = function (original, milliseconds, delayedFinal, defaultValue) {
	var _lastCalled;
	var _timeout = null;
	return function _Q_throttle_wrapper(e) {
		var t = this, a = arguments;
		var ms = Date.now() - _lastCalled;
		if (ms < milliseconds) {
			if (delayedFinal) {
				if (_timeout) {
					clearTimeout(_timeout);
				}
				_timeout = setTimeout(function () {
					_lastCalled = Date.now();
					original.apply(t, a);
				}, milliseconds - ms);
			}
			return defaultValue;
		}
		_lastCalled = Date.now();
		return original.apply(this, arguments);
	};
};

/**
 * Wraps a function and returns a wrapper that adds the function to a queue
 * of functions to be called one by one at most once every given milliseconds.
 * @static
 * @method queue
 * @param {Function} original The function to wrap
 * @param {number} milliseconds The number of milliseconds, defaults to 0
 * @return {Function} The wrapper function
 */
Q.queue = function (original, milliseconds) {
	var _queue = [];
	var _timeout = null;
	milliseconds = milliseconds || 0;
	function _Q_queue_next() {
		if (!_queue.length) {
			_timeout = null;
			return 0;
		}
		var p = _queue.shift();
		var ret = original.apply(p[0], p[1]);
		if (ret === false) {
			_timeout = null;
			_queue = [];
		} else {
			_timeout = setTimeout(_Q_queue_next, milliseconds);
		}
	};
	return function _Q_queue_wrapper() {
		var args = Array.prototype.slice.call(arguments, 0);
		var len = _queue.push([this, args]);
		if (!_timeout) {
			_timeout = setTimeout(_Q_queue_next, 0);
		}
		return len;
	};
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * after calls stopped coming in for a given number of milliseconds.
 * If the immediate param is true, the wrapper lets the function be called the first time
 * without waiting if it hasn't been called for the given number of milliseconds.
 * @static
 * @method debounce
 * @param {Function} original The function to wrap
 * @param {number} milliseconds The number of milliseconds
 * @param {Boolean} [immediate=false] if true, the wrapper also lets the function be called
 *   the first time without waiting if it hasn't been called for the given number of milliseconds.
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.debounce = function (original, milliseconds, immediate, defaultValue) {
	var _timeout = null;
	return function _Q_debounce_wrapper() {
		var t = this, a = arguments;
		if (_timeout) {
			clearTimeout(_timeout);
		} else if (immediate) {
			original.apply(t, a);
		}
		_timeout = setTimeout(function _Q_debounce_handler() {
			if (!immediate) {
				original.apply(t, a);
			}
			_timeout = null;
		}, milliseconds);
		return defaultValue;
	};
};

/**
 * Wraps a function and causes it to return early if called recursively.
 * Use sparingly, since most functions should make guarantees about postconditions.
 * @static
 * @method preventRecursion
 * @param {String} name The name of the function, passed explicitly
 * @param {Function} original The function or method to wrap
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.preventRecursion = function (name, original, defaultValue) {
	return function () {
		var n = '__preventRecursion_'+name;
		if (this[n]) return defaultValue;
		this[n] = true;
		var ret = original.apply(this, arguments);
		delete this[n];
		return ret;
	};
};

/**
 * @static
 * @method digest
 * @param {String} algorithm 
 * @param {String} payload 
 * @param {Function} callback receives (err, result)
 * @return {Q.Promise}
 */
Q.digest = function (algorithm, payload, callback) {
	var encoded = new TextEncoder().encode(payload);
	return crypto.subtle.digest(algorithm, encoded)
	.then(function (buffer) {
		var result = Array.from(new Uint8Array(buffer))
		.map(function (b) {
			return b.toString(16).padStart(2, '0');
		}).join('');
		callback && callback(null, result);
		return result;
	});
};

/**
 * Open url in new tab if cordova browsertabs plugin exist or new window otherwise.
 * @static
 * @method openUrl
 * @param {String} url
 * @param {String} [name=_blank] new window name
 */
Q.openUrl = function (url, name = "_blank") {
	var browsertab = Q.getObject("cordova.plugins.browsertabs");
	if (browsertab) {
		browsertab.openUrl(url);
	} else {
		var win = window.open(url, name);
		win && win.focus();
	}
};

/**
 * Get Unix timestamp as argument and return json of days, hours, minutes, seconds elapsed from current time to this timestamp.
 * @static
 * @method timeRemaining
 * @param {integer} timestamp Unix timestamp in milliseconds
 * @return {Object} contains properties "days", "hours", "minutes", "seconds"
 */
Q.timeRemaining = function (timestamp) {
	var seconds = (new Date(timestamp) - Date.now()) / 1000;
	if (seconds < 0) {
		return {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0
		}
	}
	var result = {};
	result.days = Math.floor(seconds / 60 / 60 / 24);
	seconds -= result.days * 60 * 60 * 24;
	result.hours = Math.floor(seconds / 60 / 60);
	seconds -= result.hours * 60 * 60;
	result.minutes = Math.floor(seconds / 60);
	result.seconds = parseInt(seconds - result.minutes * 60);
	return result;
};

/**
 * Calculate the topmost z-index from children of a container.
 * Used so you can add 1 to this to move one of the children atop them all.
 * @method zIndexTopmost
 * @static
 * @param {Element} [container=document.body] 
 * @param {Function} [filter] By default, filters out elements with Q_click_mask
 * @returns Number
 */
Q.zIndexTopmost = function (container, filter) {
	container = container || document.body;
	filter = filter || function (element) {
		return !element.hasClass('Q_click_mask')
			|| element.getAttribute('id') !== 'notices_slot';
	}
	var topZ = -1;
	Q.each(container.children, function () {
		if (!filter(this)) {
			return;
		}
		var z = parseInt(this.computedStyle().zIndex);
		if (!isNaN(z)) {
			topZ = Math.max(topZ, z)
		}
	});
	return topZ;
};

/**
 * Wraps a callable in a Q.Event object
 * @class Q.Event
 * @namespace Q
 * @constructor
 * @param {callable} callable
 *  Optional. If not provided, the chain of handlers will start out empty.
 *  Any kind of callable which Q.handle can invoke
 * @param {String} [key=null]
 *  Optional key under which to add this, so you can remove it later if needed
 * @param {boolean} [prepend=false]
 *  If true, then prepends the callable to the chain of handlers
 */
Q.Event = function _Q_Event(callable, key, prepend) {
	if (this === Q) {
		throw new Q.Error("Q.Event: Missing new keyword");
	}
	var event = this;
	this.handlers = {};
	this.keys = [];
	this.typename = "Q.Event";
	if (callable) {
		this.set(callable, key, prepend);
	}
	/**
	 * Shorthand closure for emitting events
	 * Pass any arguments to the event here.
	 * You can pass this closure anywhere a callback function is expected.
	 * @method handle
	 * @return {mixed}
	 */
	this.handle = function _Q_Event_instance_handle() {
		var i, count = 0, oldOccurring = event.occurring, result;
		if (event.stopped) return 0;
		event.occurring = true;
		event.lastContext = this;
		event.lastArgs = arguments;
		var keys = Q.copy(event.keys); // in case event.remove is called during loop
		for (i=0; i<keys.length; ++i) {
			result = Q.handle(event.handlers[ keys[i] ], this, arguments);
			if (result === false) return false;
			count += result;
		}
		event.occurring = oldOccurring;
		event.occurred = true; // unless an exception was thrown
		return count;
	};
};

Q.Event.forTool = {};
Q.Event.forPage = [];
Q.Event.jQueryForTool = {};
Q.Event.jQueryForPage = [];

/**
 * Returns a Q.Event that will fire given an DOM object and an event name
 * @static
 * @method from
 * @param {String|Q.Tool} key
 * @param {Object} source
 * @param {String} eventName
 * @return {Q.Event}
 */
Q.Event.from = function _Q_Event_from(source, eventName) {
	var event = new Q.Event();
	Q.addEventListener(source, eventName, event.handle);
	return event;
};

var Evp = Q.Event.prototype;
Evp.occurred = false;
Evp.occurring = false;

/**
 * Adds a handler to an event, or overwrites an existing one
 * @method set
 * @param {Mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} key Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass true here to associate the handler to the current page,
 *  and it will be automatically removed when the current page is removed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String|null} The key under which the handler was set, or null if handler is empty
 */
Evp.set = function _Q_Event_prototype_set(handler, key, prepend) {
	if (!handler) return undefined;
	var isTool = (Q.typeOf(key) === 'Q.Tool');
	if (key === true || (key === undefined
	&& Q.Page && Q.Page.beingActivated)) {
		Q.Event.forPage.push(this);
	}
	key = Q.calculateKey(key, this.handlers, this.keys.length);
	this.handlers[key] = handler; // can be a function, string, Q.Event, etc.
	if (this.keys.indexOf(key) < 0) {
		if (prepend) {
			this.keys.unshift(key);
		} else {
			this.keys.push(key);
		}
		if (isTool) {
			Q.Event.forTool[key] = Q.Event.forTool[key] || [];
			Q.Event.forTool[key].push(this);
		}
	}
	if (this.keys.length === 1 && this._onFirst) {
		this._onFirst.handle.call(this, handler, key, prepend);
	}
	if (this._onSet) {
		this._onSet.handle.call(this, handler, key, prepend);
	}
	return key;
};

/**
 * Like the "set" method, adds a handler to an event, or overwrites an existing one.
 * But in addition, immediately handles the handler if the event has already occurred at least once, or is currently occuring,
 * passing it the same subject and arguments as were passed to the event the last time it occurred.
 * @method add
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String|null} The key under which the handler was set, or null if handler is empty
 */
Evp.add = function _Q_Event_prototype_add(handler, key, prepend) {
	if (!handler) return undefined;
	var event = this;
	var ret = this.set(handler, key, prepend);
	if (this.occurred || this.occurring) {
		Q.handle(handler, this.lastContext, this.lastArgs);
	}
	return ret;
};

/**
 * Like "set" method, but removes the handler right after it has executed.
 * @method setOnce
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String} The key under which the handler was set
 */
Evp.setOnce = function _Q_Event_prototype_setOnce(handler, key, prepend) {
	if (!handler) return undefined;
	var event = this;
	return key = event.set(function _setOnce() {
		handler.apply(this, arguments);
		event.remove(key);
	}, key, prepend);
};

/**
 * Like "add" method, but removes the handler right after it has executed.
 * @method addOnce
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String} The key under which the handler was set
 */
Evp.addOnce = function _Q_Event_prototype_addOnce(handler, key, prepend) {
	if (!handler) return undefined;
	var event = this;
	return key = event.add(function _addOnce() {
		handler.apply(this, arguments);
		event.remove(key);
	}, key, prepend);
};

/**
 * Removes an event handler
 * @method remove
 * @param {String} key
 *  The key of the handler to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Evp.remove = function _Q_Event_prototype_remove(key) {
	// Only available in the front-end Q.js: {
	var key2 = Q.calculateKey(key);
	if (key === true) {
		l = Q.Event.forPage.length;
		for (i=0; i<l; ++i) {
			if (Q.Event.forPage[i] === this) {
				Q.Event.forPage.splice(i, 1);
				break;
			}
		}
	} else if (Q.Event.forTool[key2]) {
		l = Q.Event.forTool[key2].length;
		for (i=0; i<l; ++i) {
			if (Q.Event.forTool[key2][i] === this) {
				Q.Event.forTool[key2].splice(i, 1);
				break;
			}
		}
	}
	// }
	var l, i = this.keys.indexOf(key2);
	if (i < 0) {
		return 0;
	}
	this.keys.splice(i, 1);
	if (this._onRemove) {
		this._onRemove.handle.call(this, key2);
	}
	if (!this.keys.length && this._onEmpty) {
		this._onEmpty.handle.call(this, key2);
	}
	delete this.handlers[key2];
	return 1;
};

/**
 * Removes all handlers for this event
 * @method removeAllHandlers
 * @param {String} key
 *  The key of the handler to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Evp.removeAllHandlers = function _Q_Event_prototype_removeAllHandlers() {
	this.handlers = {};
	this.keys = [];
	if (this._onEmpty) {
		this._onEmpty.handle.call(this);
	}
};

/**
 * Indicates that the event won't be firing anymore
 * @method stop
 * @param {boolean} removeAllHandlers
 *  If true, then also removes all the handlers added to this event
 */
Evp.stop = function _Q_Event_prototype_stop(removeAllHandlers) {
	this.stopped = true;
	if (this._onStop) {
		this._onStop.handle.call(this);
	}
	if (removeAllHandlers) {
		this.removeAllHandlers.call(this);
	}
};

/**
 * Make a copy of this event, with all the keys and handlers
 * @method copy
 * @return {Q.Event}
 */
Evp.copy = function _Q_Event_prototype_copy() {
	var result = new Q.Event();
	for (var i=0; i<this.keys.length; ++i) {
		result.handlers[this.keys[i]] = this.handlers[this.keys[i]];
		result.keys.push(this.keys[i]);
	}
	return result;
};

/**
 * Returns a new Q.Event that occurs whenever either this or anotherEvent occurs
 * @method or
 * @param {Q.Event} anotherEvent
 *  The other event to check
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this event.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event}
 */
Evp.or = function _Q_Event_prototype_or(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	this.add(newEvent.handle, key);
	if (anotherEvent) {
		anotherEvent.add(newEvent.handle, anotherKey);
	}
	return newEvent;
};

/**
 * Return a new Q.Event that occurs whenever either this or anotherEvent occurs
 * as long as both have occurred.
 * @method and
 * @param {Q.Event} anotherEvent
 *  The other event to check
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.and = function _Q_Event_prototype_and(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	if (!anotherEvent) {
		return Q.copy(this);
	}
	var event = this;
	newEvent.occurred = event.occurred && anotherEvent.occurred;
	newEvent.occurring = event.occurring || anotherEvent.occurring;
	function _Q_Event_and_wrapper() {
		if ((event.occurred || event.occurring)
		 && (anotherEvent.occurred || anotherEvent.occurring)) {
			 return newEvent.handle.apply(this, arguments);
		}
	}
	event.add(_Q_Event_and_wrapper, key);
	anotherKey = anotherEvent.add(_Q_Event_and_wrapper, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event object that is handled whenever this event is handled,
 * until anotherEvent occurs, in which case this event occurs one final time.
 * @method until
 * @param {Q.Event} anotherEvent
 *  An event whose occurrence will stop the returned event
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.until = function _Q_Event_prototype_until(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	var event = this;
	key = event.add(newEvent.handle, key);
	anotherKey = anotherEvent.add(function _Q_Event_until_wrapper() {
		event.remove(key);
		anotherEvent.remove(anotherKey);
		event.stop();
	}, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event object that waits until this event is stopped,
 * then processes all the pending calls to .handle(), continuing normally after that.
 * @method then
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.onStop().add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.then = function _Q_Event_prototype_then(key) {
	var newEvent = new Q.Event();
	var handle = newEvent.handle;
	var _waiting = true;
	var _pending = [];
	newEvent.handle = function _Q_Event_then_wrapper() {
		if (_waiting) {
			_pending.push([this, arguments]);
			return 0;
		}
		return handle.apply(this, arguments);
	};
	var key2 = this.onStop().add(function () {
		for (var i=0; i<_pending.length; ++i) {
			handle.apply(_pending[i][0], _pending[i][1]);
		}
		_waiting = false;
		this.onStop().remove(key2);
	}, key);
	return newEvent;
};

/**
 * Return a new Q.Event object that waits until after this event's handle() stops
 * being called for a given number of milliseconds, before processing the last call.
 * If the immediate param is true, the wrapper lets the function be called
 * without waiting if it hasn't been called for the given number of milliseconds.
 * @method debounce
 * @param {number} milliseconds The number of milliseconds
 * @param {Boolean} [immediate=false] if true, the wrapper lets the function be called
 *   without waiting if it hasn't been called for the given number of milliseconds.
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.debounce = function _Q_Event_prototype_debounce(milliseconds, immediate, key) {
	var newEvent = new Q.Event();
	this.add(Q.debounce(newEvent.handle, milliseconds, immediate, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only at most every given milliseconds.
 * @method throttle
 * @param {Number} milliseconds The number of milliseconds
 * @param {Boolean} delayedFinal Whether the wrapper should execute the latest function call
 *  after throttle opens again, useful for e.g. following a mouse pointer that stopped.
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.throttle = function _Q_Event_prototype_throttle(milliseconds, delayedFinal, key) {
	var newEvent = new Q.Event();
	this.add(Q.throttle(newEvent.handle, milliseconds, delayedFinal, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will queue calls to this event's handle()
 * method, to occur once every given milliseconds
 * @method queue
 * @param {number} milliseconds The number of milliseconds, can be 0
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.queue = function _Q_Event_prototype_queue(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.queue(newEvent.handle, milliseconds), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only if the test function returns true
 * @method filter
 * @param {Function} test Function to test the arguments and return a Boolean
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.filter = function _Q_Event_prototype_filter(test, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		if (!test.apply(this, arguments)) return 0;
		return newEvent.handle.apply(this, arguments);
	}, key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but with the arguments returned by the transform function
 * @method map
 * @param {Function} transform Function to transform the arguments and return
 *   an array of two items for the new call: [this, arguments].
 *   Whenever the transform function returns false, the returned event isn't triggered.
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.map = function _Q_Event_prototype_map(transform, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		var parts = transform.apply(this, arguments);
		if (parts === false) {
			return false;
		}
		return newEvent.handle.apply(parts[0], parts[1]);
	}, key);
	return newEvent;
};

Evp.onFirst = function () {
   return this._onFirst || (this._onFirst = new Q.Event());
};

Evp.onSet = function () {
   return this._onSet || (this._onSet = new Q.Event());
};

Evp.onRemove = function () {
   return this._onRemove || (this._onRemove = new Q.Event());
};

Evp.onEmpty = function () {
   return this._onEmpty || (this._onEmpty = new Q.Event());
};

Evp.onStop = function () {
   return this._onStop || (this._onStop = new Q.Event());
};

/**
 * Make an event factory
 * @static
 * @method factory
 * @param {Object} [collection]
 *  The object that will store all the events. Pass null here to auto-create one.
 * @param {Array} [defaults]
 *  You can pass an array of defaults for the fields in the returned function
 *  The last element of this array can be a function that further processes the arguments,
 *  returning an array of the resulting arguments
 * @param {Function} [callback]
 *  An optional callback that gets called when a new event is created.
 *  The "this" object is the Q.Event, and the parameters are the processed parameters
 *  passed to the returned factory function. The callback should return the
 *  event to be added to the collection (could just return this).
 * @param {Function} [removeOnEmpty=false]
 *  Pass true here to remove events from the factory after their last handler is removed.
 *  They might be created again by the factory.
 * @return {Function}
 *  Returns a function that can take one or more index fields and return a Q.Event
 *  that was either already stored under those index fields or newly created.
 */
Q.Event.factory = function (collection, defaults, callback, removeOnEmpty) {
	if (!collection) {
		collection = {};
	}
	defaults = defaults || [];
	function _remove() {
		var delimiter = "\t";
		var args = this.indexes.split(delimiter);
		var l = args.length, i, objs = [collection];
		for (i=0; i<l; ++i) {
			objs.push(objs[i][ args[i] ]);
		}
		for (i=l-1; i>=0; --i) {
			var arg = args[i];
			delete objs[i][arg];
			if (!Q.isEmpty(objs[i])) {
				break;
			}
		}
	}
	var _args;
	var _Q_Event_factory = function _Q_Event_factory_function() {
		var existing = _Q_Event_factory.ifAny.apply(this, arguments);
		if (existing) {
			return existing;
		}
		var delimiter = "\t";
		var name = _args.join(delimiter);
		var e = new Q.Event();
		e.factory = _Q_Event_factory;
		e.name = name;
		if (callback) {
			callback.apply(e, _args);
		}
		_Q_Event_factory.onNewEvent.handle.apply(e, _args);
		Q.setObject(name, e, collection, delimiter);
		if (removeOnEmpty) {
			e.onEmpty().set(_remove);
		}
		e.indexes = name;
		return e;
	};
	_Q_Event_factory.ifAny = function _Q_Event_factory_ifAny() {
		_args = Array.prototype.slice.call(arguments, 0);
		var len = defaults.length;
		var f = (typeof(defaults[len-1]) === 'function')
			? defaults[defaults.length-1] : null;
		if (f) --len;
		for (var i=_args.length; i<len; ++i) {
			_args[i] = defaults[i];
		}
		_args = (f && f.apply(this, _args)) || _args;
		var delimiter = "\t";
		var name = _args.join(delimiter);
		var existing = Q.getObject(name, collection, delimiter);
		return existing || null;
	};
	_Q_Event_factory.collection = collection;
	_Q_Event_factory.onNewEvent = new Q.Event();
	return _Q_Event_factory;
};

/**
 * @class Q
 */

/**
 * This event occurs right before Q javascript library is initialized
 * @event beforeInit
 */
Q.beforeInit = new Q.Event();
/**
 * This event occurs when Q javascript library has just been initialized
 * @event onInit
 */
Q.onInit = new Q.Event();
/**
 * This event tracks the window.onload event
 * @event onLoad
 */
Q.onLoad = new Q.Event();
/**
 * This event tracks the window.onunload event
 * @event onUnload
 */
Q.onUnload = new Q.Event();
/**
 * This event tracks the window.hashchange event
 * @event onHashChange
 */
Q.onHashChange = new Q.Event();
/**
 * This event tracks the window.popstate event
 * @event onPopState
 */
Q.onPopState = new Q.Event();
/**
 * This event tracks the window.ononline event, when browser goes online
 * @event onOnline
 */
Q.onOnline = new Q.Event(function () {
	_isOnline = true;
}, 'Q');
/**
 * This event tracks the window.onoffline event, when online connection is lost
 * @event onOffline
 */
Q.onOffline = new Q.Event(function () {
	_isOnline = false;
}, 'Q');
/**
 * This event occurs every time before something is activated
 * @event beforeActivate
 */
Q.beforeActivate = new Q.Event();
/**
 * This event occurs every time after something is activated
 * @event onActivate
 */
Q.onActivate = new Q.Event();
/**
 * This event occurs when the DOM is ready
 * @event onDOM
 */
Q.onDOM = new Q.Event();
/**
 * This event occurs when the DOM and entire environment is ready
 * @event onReady
 */
Q.onReady = new Q.Event();
/**
 * This event occurs when jQuery has been loaded
 * @event onJQuery
 */
Q.onJQuery = new Q.Event();
/**
 * This event occurs when an app url is open in Cordova
 * @event onHandleOpenUrl
 */
Q.onHandleOpenUrl = new Q.Event();
var _layoutElements = [];
var _layoutEvents = [];
var _layoutObservers = [];
/**
 * Call this function to get an event which occurs every time
 * Q.layout() is called on the given element or one of its parents.
 * @param {Element} [element=document.documentElement] 
 * @return {Q.Event}
 */
Q.onLayout = function (element) {
	element = element || document.documentElement;
	if (Q.typeOf(element) === 'Q.Tool') {
		element = element.element;
	}
	for (var i=0, l=_layoutElements.length; i<l; ++i) {
		if (_layoutElements[i] === element) {
			return _layoutEvents[i];
		}
	}
	var lastRect = {};
	var event = new Q.Event();
	var debouncedEvent = event.debounce(
		Q.onLayout.debounce, false, 'Q.onLayout'
	).map(function () {
		var rect = element.getBoundingClientRect();
		var ret;
		if (rect.width == lastRect.width
		&& rect.height == lastRect.height) {
			ret = false;
		} else {
			ret = [this, arguments]; // element got resized
		}
		lastRect = rect;
		return ret;
	}, 'Q.onLayout');

	var l = _layoutElements.push(element);
	_layoutEvents[l-1] = debouncedEvent;

	// create ResizeObserver
	var observer = null;
	if (typeof ResizeObserver === 'function') {
		observer = new ResizeObserver(function () {
			event.handle.call(event, element, element);
		});
		observer.observe(element);
	}
	_layoutObservers[l-1] = observer;
	event.onEmpty().set(Q.debounce(function () {
		for (var i=0, l=_layoutElements.length; i<l; ++i) {
			if (_layoutElements[i] === element) {
				_layoutElements.splice(i, 1);
				_layoutEvents.splice(i, 1);
				if (Q.getObject('disconnect', _layoutObservers[i])) {
					_layoutObservers[i].disconnect();
				}
				_layoutObservers.splice(i, 1);
				break;
			}
		}
	}, Q.onLayout.debounce || 0), 'Q');
	return debouncedEvent;
}
Q.onLayout.debounce = 100;
Q.onLayout().set(function () {
	_detectOrientation.apply(this, arguments);
	Q.Masks.update();
}, 'Q');

/**
 * This event is convenient for doing stuff when the window scrolls
 * @event onLayout
 */
Q.onScroll = new Q.Event();
/**
 * This event tracks the document.onvisibilitychange event, when online connection is lost
 * @event onVisibilityChange
 */
Q.onVisibilityChange = new Q.Event();
/**
 * This event occurs before replacing the contents of an element
 * @event beforeReplace
 */
Q.beforeReplace = new Q.Event();

/**
 * Sets up control flows involving multiple callbacks and dependencies
 * Usage:
 * @example
 * var p = Q.pipe(['user', 'stream], function (params, subjects) {
 *   // arguments that were passed are in params.user, params.stream
 *   // this objects that were passed are in subjects.user, subjects.stream
 * });
 * mysql("SELECT * FROM user WHERE userId = 2", p.fill('user'));
 * mysql("SELECT * FROM stream WHERE publisherId = 2", p.fill('stream'));
 *
 * The first parameter to p.fill() is the name of the field to fill when it's called
 * You can pass a second parameter to p.fill, which can be either:
 * true - in this case, the current function is ignored during the next times through the pipe
 * a string - in this case, this name is considered unfilled the next times through this pipe
 * an array of strings - in this case, these names are considered unfilled the next times through the pipe
 * @class Q.Pipe
 * @constructor
 * @see {Pipe.prototype.add} for more info on the parameters
 */
Q.Pipe = function _Q_Pipe(requires, maxTimes, callback) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
	this.callbacks = [];
	this.params = {};
	this.subjects = {};
	this.ignore = {};
	this.finished = false;
	this.add.apply(this, arguments);
};

var Pp = Q.Pipe.prototype;

/**
 * Adds a callback to the pipe
 * @method on
 * @param field {String}
 *  Pass the name of a field to wait for, until it is filled, before calling the callback.
 * @param callback {Function}
 *  This function is called as soon as the field is filled, i.e. when the callback
 *  produced by pipe.fill(field) is finally called by someone.
 *  The "this" and arguments from that call are also passed to the callback.
 *  The callback receives the same "this" and arguments that the original call was made with.
 *  It is passed the "this" and arguments which are passed to the callback.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 * @chainable
 */
Pp.on = function _Q_pipe_on(field, callback) {
	return this.add([field], 1, function _Q_pipe_on_callback (params, subjects, field) {
		return callback.apply(subjects[field], params[field], field);
	});
};

/**
 * Adds a callback to the pipe with more flexibility
 * @method add
 * @param {Array} requires
 *  Optional. Pass an array of required field names here.
 *  Alternatively, pass an array of objects, which should be followed by
 *  the name of a Q.Event to wait for.
 * @param {number} [maxTimes]
 *  Optional. The maximum number of times the callback should be called.
 * @param {Function} callback
 *  Once all required fields are filled, this function is called every time something is piped.
 *  It is passed four arguments: (params, subjects, field, requires)
 *  If you return false from this function, it will no longer be called for future pipe runs.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 * @return {Q.Pipe}
 * @chainable
 */
Pp.add = function _Q_pipe_add(requires, maxTimes, callback) {
	var r = null, n = null, e = null, r2, events, keys;
	for (var i=0; i<arguments.length; i++) {
		var ai = arguments[i];
		if (typeof ai === 'function') {
			if (e) {
				r2 = [];
				events = [];
				keys = [];
				var pipe = this;
				Q.each(r, function (k, item) {
					var event = Q.getObject(e, item);
					if (Q.typeOf(event) === 'Q.Event') {
						keys.push(event.add(pipe.fill(k)));
						r2.push(k);
						events.push(event);
					}
				});
				ai.pipeEvents = events;
				ai.pipeKeys = keys;
				r = r2;
			}
			ai.pipeRequires = r;
			ai.pipeRemaining = n;
			r = n = e = null;
			this.callbacks.push(ai);
		} else {
			switch (Q.typeOf(ai)) {
			case 'array':
				r = ai;
				if (r.length
				&& typeof r[0] !== 'string'
				&& typeof r[0] !== 'number') {
					e = arguments[++i];
				}
				break;
			case 'object':
				r = ai;
				e = arguments[++i];
				break;
			case 'number':
				n = ai;
				break;
			default:
				break;
			}
			if (e != null && typeof e !== 'string') {
				throw new Q.Error("Pipe.prototype.add requires event name after array of objects");
			}
		}
	}
	return this;
};

/**
 * Makes a function that fills a particular field in the pipe and can be used as a callback
 * @method fill
 * @param field {String}
 *   For error callbacks, you can use field="error" or field="users.error" for example.
 * @param ignore
 *   Optional. If true, then ignores the current field in subsequent pipe runs.
 *   Or pass the name (string) or names (array) of the field(s) to ignore in subsequent pipe runs.
 * @return {Function} Returns a callback you can pass to other functions.
 */
Pp.fill = function _Q_pipe_fill(field, ignore) {
	if (ignore === true) {
		this.ignore[this.i] = true;
	} else if (typeof ignore === 'string') {
		this.ignore[ignore] = true;
	} else if (Q.isArrayLike(ignore)) {
		for (var i=0; i<ignore.length; ++i) {
			this.ignore[ignore[i]] = true;
		}
	}

	var pipe = this;

	return function _Q_pipe_fill() {
		pipe.params[field] = Array.prototype.slice.call(arguments);
		pipe.subjects[field] = this;
		pipe.run(field);
	};
};

/**
 * Runs the pipe
 * @method run
 * @param field {String} optionally indicate name of the field that was just filled
 * @return {number} the number of pipe callbacks that wound up running
 */
Pp.run = function _Q_pipe_run(field) {
	var cb, ret, callbacks = this.callbacks, params = Q.copy(this.params), count = 0;
	var i, j;

	cbloop:
	for (i=0; i<callbacks.length; i++) {
		if (this.ignore[i]) {
			continue;
		}
		this.i = i;
		if (!(cb = callbacks[i]))
			continue;
		if (cb.pipeRequires) {
			for (j=0; j<cb.pipeRequires.length; j++) {
				if (this.ignore[cb.pipeRequires[j]]) {
					continue;
				}
				if (! (cb.pipeRequires[j] in params)) {
					continue cbloop;
				}
			}
		}
		if (cb.pipeRemaining) {
			if (!--cb.pipeRemaining) {
				delete callbacks[i];
			}
		}
		ret = cb.call(this, this.params, this.subjects, field, cb.pipeRequires);
		if (cb.pipeEvents) {
			for (j=0; j<cb.pipeEvents.length; j++) {
				cb.pipeEvents[j].remove(cb.pipeKeys[j]);
			}
		}
		++count;
		delete cb.pipeEvents;
		delete cb.pipeKeys;
		if (ret === false) {
			delete callbacks[i];
		} else if (ret === true) {
			this.callbacks = []; // clean up memory
			this.finished = true;
			break;
		}
	}
	return count;
};


/**
 * @class Q
 */

/**
 * A convenience method for constructing Q.Pipe objects
 * and is really here just for backward compatibility.
 * @static
 * @method pipe
 * @return {Q.Pipe}
 * @see Q.Pipe
 */
Q.pipe = function _Q_pipe(a, b, c, d) {
	return new Q.Pipe(a, b, c, d);
};

/**
 * This function helps create "batch functions", which can be used in getter functions
 * and other places to accomplish things in batches.
 * @static
 * @method batcher
 * @param batch {Function}
 *  This is the function you must write to implement the actual batching functionality.
 *  It is passed the subjects, arguments, and callbacks that were collected by Q.batcher
 *  from the individual calls that triggered your batch function to be run.
 *  Your batch function is supposed to cycle through the callbacks array -- where each
 *  entry is the array of (one or more) callbacks the client passed during a particular
 *  call -- and Q.handle the appropriate one.
 *  NOTE: When receiving results from the server, make sure the order in which
 *  results are returned matches the order in which your batch function was provided the
 *  arguments from the individual calls. This will help you call the correct callbacks.
 *  Typically you would serialize the array of arguments e.g. into JSON when sending
 *  the request down to the server, and the server should also return an array of results
 *  that is in the same order.
 * @param options {Object}
 *  An optional hash of possible options, which can include:
 * @param {boolean} [options.max=10] When the number of individual calls 
 *  in the queue reaches this number, the batch function is run.
 * @param {boolean} [options.ms=50] When this many milliseconds elapse 
 *  without another call to the same batcher function, the batch function is run.
 * @return {Function} It returns a function that the client can use as usual, but which,
 * behind the scenes, queues up the calls and then runs a batch function that you write.
 */
Q.batcher = function _Q_batch(batch, options) {
	var o = Q.extend({}, Q.batcher.options, options);
	var result = function _Q_batch_result() {
		var requestArguments = arguments;
		
		function nextRequest() {
			var i;
			var callbacks = [], args = [];

			// separate fields and callbacks
			for (i=0; i<requestArguments.length; ++i) {
				if (typeof requestArguments[i] === 'function') {
					callbacks.push(requestArguments[i]);
				} else {
					args.push(requestArguments[i]);
				}
			}
			if (!batch.count) batch.count = 0;
			if (!batch.argmax) batch.argmax = 0;
			if (!batch.cbmax) batch.cbmax = 0;

			++batch.count;
			if (callbacks.length > batch.cbmax) batch.cbmax = callbacks.length;
			if (args.length > batch.argmax) batch.argmax = args.length;

			// collect various arrays for convenience of writing batch functions,
			// at the expense of extra work and memory
			if (!batch.subjects) batch.subjects = [];
			if (!batch.params) batch.params = [];
			if (!batch.callbacks) batch.callbacks = [];

			batch.subjects.push(this);
			batch.params.push(args);
			batch.callbacks.push(callbacks);

			if (batch.timeout) {
				clearTimeout(batch.timeout);
			}
			if (batch.count == o.max) {
				runBatch();
			} else {
				batch.timeout = setTimeout(runBatch, o.ms);
			} 
			
			function runBatch() {
				try {
					if (batch.count) {
						batch.call(this, batch.subjects, batch.params, batch.callbacks);
						batch.subjects = batch.params = batch.callbacks = null;
						batch.count = 0;
						batch.argmax = 0;
						batch.cbmax = 0;
					}
					batch.timeout = null;
				} catch (e) {
					batch.count = 0;
					batch.argmax = 0;
					batch.cbmax = 0;
					throw e;
				}
			}
		}
		// Make the batcher re-entrant. Without this technique, if 
		// something is requested while runBatch is calling its callback,
		// that request's information may be wiped out by runBatch.
		// The following statement schedules such requests after runBatch has completed.
		setTimeout(nextRequest, 0);
	};
	result.batch = batch;
	result.cancel = function () {
		clearTimeout(batch.timeout);
	};
	return result;
};

Q.batcher.options = {
	max: 10,
	ms: 50
};

/**
 * Used to create a basic batcher function, given only the url.
 * @static
 * @method batcher.factory
 * @param {Object} collection An object to contain all the batcher functions
 * @param {String} baseUrl The base url of the webservice built to support batch requests.
 * @param {String} tail The rest of the url of the webservice built to support batch requests.
 * @param {String} slotName The name of the slot to request. Defaults to "batch".
 * @param {String} fieldName The name of the data field. Defaults to "batch".
 * @param {Object} [options={}] Any additional options to pass to Q.req, as well as:
 * @param {number} [options.max] Passed as option to Q.batcher
 * @param {number} [options.ms] Passed as option to Q.batcher
 * @param {Function} [options.preprocess] Optional function calculating a data structure to JSON stringify into the data field
 * @return {Function} A function with any number of non-function arguments followed by
 *  one function which is treated as a callback and passed (errors, content)
 *  where content is whatever is returned in the slots.
 */
Q.batcher.factory = function _Q_batcher_factory(collection, baseUrl, tail, slotName, fieldName, options) {
	if (!collection) {
		collection = {};
	}
	if (slotName === undefined) {
		slotName = 'batch';
	}
	if (fieldName === undefined) {
		fieldName = 'batch';
	}
	if (tail && tail[0] !== '/') {
		tail = '/' + tail;
	}
	var delimiter = "\t", f;
	var name = [baseUrl, tail, slotName, fieldName].join(delimiter);
	if (f = Q.getObject(name, collection, delimiter)) {
		return f;
	} 
	f = Q.batcher(function _Q_batcher_factory_function(subjects, args, callbacks) {
		var o = Q.extend({
			method: 'post',
			fields: {}
		}, options);
		var result = options && options.preprocess
			? options.preprocess(args)
			: {args: args};
		o.fields[fieldName] = JSON.stringify(result);
		return Q.req(baseUrl+tail, slotName, function (err, response) {
			var error = err || response.errors;
			if (error) {
				Q.each(callbacks, function (k, cb) {
					cb[0].call(response, error, response);
				});
				return;
			}
			var request = this;
			if (!response.slots) {
				callbacks[k][0].call(this, "The slots field is missing", null, request);
			}
			Q.each(response.slots.batch, function (k, result) {
				if (result && result.errors) {
					callbacks[k][0].call(this, result.errors, null, request);
				} else {
					callbacks[k][0].call(this, null, (result && result.slots) || {}, request);
				}
			});
		}, o);
	}, options);
	Q.setObject(name, f, collection, delimiter);
	return f;
};

/**
 * Wraps a getter function to provide support for re-entrancy, cache and throttling.
 *  It caches based on all non-function arguments which were passed to the function.
 *  All functions passed in as arguments are considered as callbacks. Getter execution is
 *  considered complete when one of the callbacks is fired. If any other callback is fired,
 *  throttling may be influenced - i.e. throttleSize will increase by number of callbacks fired.
 *  If the original function has a "batch" property, it gets copied as a property of
 *  the wrapper function being returned. This is useful when calling Q.getter(Q.batcher(...))
 *  Call method .forget with the same arguments as original getter to clear cache record
 *  and update it on next call to getter (if it happen)
 * @static
 * @method getter
 * @param {Function} original
 *  The original getter function to be wrapped
 *  Can also be an array of [getter, execute] which you can use if
 *  your getter does "batching", and waits a tiny bit before sending the batch request,
 *  to see if any more will be requested. In this case, the execute function
 *  is supposed to execute the batched request without waiting any more.
 *  If the original function returns false, the caching is canceled for that call.
 * @param {Object} [options={}] An optional hash of possible options, which include:
 * @param {Function} [options.prepare] This is a function that is run to copy-construct objects from cached data. It gets (subject, parameters, callback) and is supposed to call callback(subject2, parameters2)
 * @param {String} [options.throttle] an id to throttle on, or an Object that supports the throttle interface:
 * @param {Function} [options.throttleTry] function(subject, getter, args) - applies or throttles getter with subject, args
 * @param {Function} [options.throttleNext] function (subject) - applies next getter with subject
 * @param {Integer} [options.throttleSize=100] The size of the throttle, if it is enabled
 * @param {Boolean} [options.nonStandardErrorConvention=false] Pass true here if the callback parameters don't work with Q.firstErrorMessage() conventions
 * @param {Q.Cache|Boolean} [options.cache] pass false here to prevent caching, or an object which supports the Q.Cache interface
 * @return {Function}
 *  The wrapper function, which returns a Q.Promise with a property called "result"
 *  which could be one of Q.getter.CACHED, Q.getter.WAITING, Q.getter.REQUESTING or Q.getter.THROTTLING .
 *  This function also contains Q.Events called onCalled, onResult and onExecuted.
 */
Q.getter = function _Q_getter(original, options) {

	var gw = function Q_getter_wrapper() {
		var i, key, callbacks = [];
		var arguments2 = Array.prototype.slice.call(arguments);

		// separate fields and callbacks
		key = Q.Cache.key(arguments2, callbacks);
		if (callbacks.length === 0) {
			// in case someone forgot to pass a callback
			// pretend they added a callback at the end
			var noop = function _noop() {} ;
			arguments2.push(noop);
			callbacks.push(noop);
		}
		
		var _resolve, _reject;
		var ret = new Q.Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});
		ret.dontCache = false;
		gw.onCalled.handle.call(this, arguments2, ret);

		var cached, cbpos, cbi;
		Q.getter.usingCached = false;
		
		function _prepare(subject, params, callback, ret, cached) {
			if (!gw.nonStandardErrorConvention && Q.firstErrorMessage(params[0], params[1])) {
				ret.dontCache = true;
			}
			if (gw.prepare) {
				gw.prepare.call(gw, subject, params, _result, arguments2);
			} else {
				_result(subject, params);
			}
			function _result(subject, params) {
				gw.onResult.handle(subject, params, arguments2, ret, gw);
				Q.getter.usingCached = cached;
				var err = null;
				var resCallback = {};
				try {
					// let the callback check params
					resCallback = callback.apply(subject, params);
				} catch (e) {
					// it should throw an exception if it encounters any errors
					err = e;
				}
				if (!err && !gw.nonStandardErrorConvention) {
					err = Q.firstErrorMessage(params[0], params[1]);
				}
				gw.onExecuted.handle(subject, params, arguments2, ret, gw);
				Q.getter.usingCached = false;
				if (err) {
					if (!Q.getObject("skipException", resCallback)) {
						_reject(err);
					}
					throw err;
				}
				_resolve(subject);
			}
		}

		// if caching is required, check the cache -- maybe the result is there
		if (gw.cache && !ignoreCache) {
			if (cached = gw.cache.get(arguments2)) {
				cbpos = cached.cbpos;
				if (callbacks[cbpos]) {
					_prepare(cached.subject, cached.params, callbacks[cbpos], ret, true);
					ret.result = Q.getter.CACHED;
					return ret; // wrapper found in cache, callback and throttling have run
				}
			}
		}
		ignoreCache = false;

		_waiting[key] = _waiting[key] || [];
		_waiting[key].push({
			callbacks: callbacks,
			ret: ret
		});
		if (_waiting[key].length > 1) {
			gw.onExecuted.handle.call(this, arguments2, ret);
			ret.result = Q.getter.WAITING;
			return ret; // the request is already in process - let's wait
		}

		// replace the callbacks with smarter functions
		var args = [];
		for (i=0, cbi=0; i<arguments2.length; i++) {
			// we only care about functions
			if (typeof arguments2[i] !== 'function') {
				args.push(arguments2[i]); // regular argument
				continue;
			}
			args.push((function(cb, cbpos) {
				// make a function specifically to call the
				// callbacks in position pos, and then decrement
				// the throttle
				return function _Q_getter_callback() {
					// process waiting callbacks
					var wk = _waiting[key];
					delete _waiting[key];
					if (wk) {
						for (i = 0; i < wk.length; i++) {
							try {
								_prepare(this, arguments, wk[i].callbacks[cbpos], wk[i].ret, true);
							} catch (e) {
								console.warn(e);
							}
						}
					}
					// save the results in the cache
					if (gw.cache && !ret.dontCache) {
						gw.cache.set(arguments2, cbpos, this, arguments);
					}
					// tell throttle to execute the next function, if any
					if (gw.throttle && gw.throttle.throttleNext) {
						gw.throttle.throttleNext(this);
					}
				};
			})(callbacks[cbi], cbi));
			++cbi; // the index in the array of callbacks
		}

		if (!gw.throttle) {
			// no throttling, just run the function
			if (false === original.apply(this, args)) {
				ret.dontCache = true;
			}
			ret.result = Q.getter.REQUESTING;
			gw.onExecuted.handle.call(this, arguments2, ret);
			return ret;
		}

		if (!gw.throttle.throttleTry) {
			// the throttle object is probably not set up yet
			// so set it up
			var p = {
				size: gw.throttleSize,
				count: 0,
				queue: [],
				args: []
			};
			gw.throttle.throttleTry = function _throttleTry(that, getter, args, ret) {
				++p.count;
				if (p.size === null || p.count <= p.size) {
					if (false === getter.apply(that, args)) {
						ret.dontCache = true;
					}
					return true;
				}
				// throttle is full, so queue this function
				p.queue.push(getter);
				p.args.push(args);
				return false;
			};
			gw.throttle.throttleNext = function _throttleNext(that) {
				if (--p.count < 0) {
					console.warn("Q.getter: throttle count is negative. This probably means you passed a callback somewhere it shouldn't have been passed.");
				}
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!gw.throttleSize) {
			gw.throttle.throttleSize = function _throttleSize(newSize) {
				if (newSize === undefined) {
					return p.size;
				}
				p.size = newSize;
			};
		}

		// execute the throttle
		ret.result = gw.throttle.throttleTry(this, original, args, ret)
			? Q.getter.REQUESTING
			: Q.getter.THROTTLING;
		gw.onExecuted.handle.call(this, arguments2, ret);
		return ret;
	}

	Q.extend(gw, original, Q.getter.options, options);
	gw.original = original;
	gw.onCalled = new Q.Event();
	gw.onExecuted = new Q.Event();
	gw.onResult = new Q.Event();

	var _waiting = {};
	if (gw.cache === false) {
		// no cache
		gw.cache = null;
	} else if (gw.cache === true) {
		// create our own Object that will cache locally in the page
		gw.cache = Q.Cache.document(++_Q_getter_i);
	} // else assume we were passed an Object that supports the cache interface

	gw.throttle = gw.throttle || null;
	if (gw.throttle === true) {
		gw.throttle = '';
	}
	if (typeof gw.throttle === 'string') {
		// use our own objects
		if (!Q.getter.throttles[gw.throttle]) {
			Q.getter.throttles[gw.throttle] = {};
		}
		gw.throttle = Q.getter.throttles[gw.throttle];
	}

	gw.forget = function _forget() {
		if (gw.cache) {
			return gw.cache.remove(Array.prototype.slice.call(arguments));
		}
	};
	
	var ignoreCache = false;
	gw.force = function _force() {
		ignoreCache = true;
		gw.apply(this, arguments);
	};

	if (original.batch) {
		gw.batch = original.batch;
	}
	return gw;
};
var _Q_getter_i = 0;
Q.getter.options = {
	cache: true,
	throttle: null,
	throttleSize: 100
};
Q.getter.throttles = {};
Q.getter.cache = {};
Q.getter.waiting = {};
Q.getter.CACHED = 0;
Q.getter.REQUESTING = 1;
Q.getter.WAITING = 2;
Q.getter.THROTTLING = 3;

/**
 * Custom exception constructor
 * @class Q.Exception
 * @constructor
 * @param [message=""] {string} The error message
 * @param {object} fields={}
 */
Q.Exception = function (message, fields) {
	this.fields = fields || {};
	this.message = message || "";
};

Q.Exception.prototype = Error;

/**
 * The root mixin added to all tools.
 * @class Q.Tool
 * @constructor
 * @param [element] the element to activate into a tool
 * @param [options={}] an optional set of options that may contain ".Tool_name or #Some_exact_tool or #Some_child_tool"
 * @return {Q.Tool} if this tool is replacing an earlier one, returns existing tool that was removed.
 *	 Otherwise returns null, or false if the tool was already constructed.
 */
Q.Tool = function _Q_Tool(element, options) {
	if (this.activated) {
		return this; // don't construct the same tool more than once
	}
	this.activated = true;
	this.element = element;
	this.typename = 'Q.Tool';
	
	if (options === true) {
		options = {};
	}

	if (root.jQuery) {
		jQuery(element).data('Q_tool', this);
	}

	// ID and prefix
	if (!this.element.id) {
		var prefix = Q.Tool.beingActivated ? Q.Tool.beingActivated.prefix : '';
		if (!prefix) {
			var e = this.element.parentNode;
			do {
				if (e.hasClass && e.hasClass('Q_tool')) {
					prefix = Q.getObject('Q.tool.prefix', e)
						|| Q.Tool.calculatePrefix(e.id);
					break;
				}
			} while (e = e.parentNode);
		}
		var name = Q.Tool.names[this.name] || this.name.toCapitalized();
		this.element.id = prefix + name.split('/').join('_')
			+ '-' + (Q.Tool.nextDefaultId++) + "_tool";
		Q.Tool.nextDefaultId %= 1000000;
	}
	this.prefix = Q.Tool.calculatePrefix(this.element.id);
	this.id = this.prefix.substr(0, this.prefix.length-1);

	var activeTool = null;
	if (activeTool = Q.Tool.byId(this.id, this.name)) {
		var toolName = Q.Tool.names[this.name];
		var errMsg = "A " + toolName + " tool with id " + this.id + " is already active";
		//throw new Q.Error(errMsg);
		console.warn(errMsg, activeTool);
	}

	// for later use
	var classes = (this.element.className && this.element.className.split(/\s+/) || []);
	var key = Q.calculateKey(this);

	// options from data attribute
	var dataOptions = element.getAttribute('data-' + Q.normalize(this.name, '-'));
	if (dataOptions) {
		var parsed = null;
		if (dataOptions[0] === '{') {
			parsed = JSON.parse(dataOptions);
		} else {
			var ios = dataOptions.indexOf(' ');
			this.id = dataOptions.substr(0, ios);
			var tail = dataOptions.substr(ios+1);
			parsed = tail && JSON.parse(tail);
		}
		if (parsed) {
			Q.extend(this.options, Q.Tool.options.levels, parsed, key);
		}
	}

	// options cascade -- process option keys that start with '.' or '#'
	var partial, i, k, l, a, n;
	options = options || {};
	this.options = this.options || {};
	
	// collect options from parent ids, inner overrides outer
	var normalizedName = Q.normalize(this.name);
	var pids = this.parentIds();
	var len = pids.length;
	var o = len ? Q.extend({}, Q.Tool.options.levels, options) : options;
	for (i = len-1; i >= 0; --i) {
		var pid = pids[i];
		if (!(a = Q.Tool.active[pid])) {
			continue;
		}
		for (n in a) {
			for (k in a[n].state) {
				if (k[0] === '.' || k[0] === '#') {
					o[k] = Q.extend(o[k], Q.Tool.options.levels, a[n].state[k]);
				}
			}
		}
	}
	
	// .Q_something
	for (i = 0, l = classes.length; i < l; i++) {
		var className = classes[i];
		var cn = Q.normalize(className.substr(0, className.length-5));
		partial = o['.' + className];
		if (partial && (className.substr(-5) !== '_tool' || cn === this.name)) {
			Q.extend(this.options, Q.Tool.options.levels, partial, key);
		}
	}
	// #Q_parent_child_tool
	if ((partial = o['#' + this.element.id])) {
		Q.extend(this.options, Q.Tool.options.levels, partial, key);
		for (k in o) {
			if (k.startsWith('#' + this.prefix)) {
				this.options[k] = o[k];
			}
		}
	}
	// #parent_child_tool, #child_tool
	var _idcomps = this.element.id.split('_');
	for (i = 0; i < _idcomps.length-1; ++i) {
		if ((partial = o['#' + _idcomps.slice(i).join('_')])) {
			Q.extend(this.options, Q.Tool.options.levels, partial, key);
		}
	}

	// get options from options property on element
	var eo = element.options;
	if (eo && eo[normalizedName]) {
		Q.extend(this.options, Q.Tool.options.levels, eo[normalizedName], key);
	}
	
	// override prototype Q function on the element to associate things with it
	if (element.Q === Element.prototype.Q) {
		element.Q = function (toolName) {
			if (!toolName) {
				return (this.Q.tool || null);
			}
			return this.Q.tools[Q.normalize(toolName)] || null;
		};
	}
	
	if (!element.Q.tools) element.Q.tools = {};
	if (!element.Q.toolNames) element.Q.toolNames = [];
	element.Q.toolNames.push(normalizedName);
	element.Q.tools[normalizedName] = this;
	if (!element.Q.tool) {
		element.Q.tool = this;
	}
	Q.setObject([this.id, this.name], this, Q.Tool.active);
	
	// Add a Q property on the object and extend it with the prototype.Q if any
	this.Q = Q.extend({
		/**
		 * Q.Event which occurs when the tool was constructed
		 * @event onConstruct
		 */
		onConstruct: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was initialized
		 * @event onInit
		 */
		onInit: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was removed
		 * @event onRemove
		 */
		beforeRemove: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was retained while replacing some HTML
		 * @event onRetain
		 */
		onRetain: new Q.Event(),
		/**
		 * Returns Q.Event which occurs when some fields in the tool's state changed
		 * @event onStateChanged
		 * @param name {String} The name of the field. Can be "" to listen on all fields.
		 */
		onStateChanged: new Q.Event.factory({}, "")
	}, this.Q);
	
	return this;
};

Q.Tool.options = {
	levels: 10
};

Q.Tool.active = {};
Q.Tool.names = {};

var _constructToolHandlers = {};
var _activateToolHandlers = {};
var _initToolHandlers = {};
var _beforeRemoveToolHandlers = {};
var _waitingParentStack = [];
var _pendingParentStack = [];
var _toolsToInit = {};
var _toolsWaitingForInit = {};

function _toolEventFactoryNormalizeKey(key) {
	var parts = key.split(':', 2);
	parts[parts.length-1] = Q.normalize(parts[parts.length-1]);
	return [parts.join(':')];
}

/**
 * Returns Q.Event which occurs when a tool has been constructed, but not yet activated
 * Generic callbacks can be assigned by setting toolName to ""
 * @class Q.Tool
 * @event onConstruct
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onConstruct = Q.Event.factory(_constructToolHandlers, ["", _toolEventFactoryNormalizeKey]);

/**
 * Returns Q.Event which occurs when a tool has been activated
 * Generic callbacks can be assigned by setting toolName to ""
 * @class Q.Tool
 * @event onActivate
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onActivate = Q.Event.factory(_activateToolHandlers, ["", _toolEventFactoryNormalizeKey], null, true);

/**
 * Returns Q.Event which occurs when a tool has been initialized
 * Generic callbacks can be assigned by setting toolName to ""
 * @event onInit
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onInit = Q.Event.factory(_initToolHandlers, ["", _toolEventFactoryNormalizeKey], null, true);

/**
 * Returns Q.Event which occurs when a tool is about to be removed
 * Generic callbacks can be assigned by setting toolName to ""
 * @event beforeRemove
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.beforeRemove = Q.Event.factory(_beforeRemoveToolHandlers, ["", _toolEventFactoryNormalizeKey], null, true);

/**
 * Traverses elements in a particular container, including the container itself,
 * and removes + destroys all tools.
 * Should be called before removing elements.
 * @static
 * @method remove
 * @param {HTMLElement} elem
 *  The container to traverse
 * @param {boolean} removeCached
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-retain" attribute
 *  should be removed.
 * @param {boolean} [removeElementAfterLastTool=false]
 *  If true, removes the element if the last tool on it was removed
 * @param {String|Function} [filter]
 *  This is a string that would match the tool name exactly (after normalization) to remove it,
 *  or a function that will take a tool name and return a boolean, false means don't remove tool.
 */
Q.Tool.remove = function _Q_Tool_remove(elem, removeCached, removeElementAfterLastTool, filter) {
	if (typeof elem === 'string') {
		var tool = Q.Tool.byId(elem);
		if (!tool) return false;
		elem = tool.element;
	}
	if (typeof filter === 'string') {
		filter = Q.normalize(filter);
	}
	Q.find(elem, true, null, function _Q_Tool_remove_found(toolElement) {
		var tn = toolElement.Q.toolNames;
		if (!tn) { // this edge case happens very rarely, usually if a slot element
			return; // being replaced is inside another slot element being replaced
		}
		for (var i=tn.length-1; i>=0; --i) {
			if (typeof filter === 'string') {
				if (tn[i] !== 'filter') {
					continue;
				}
			} else if (typeof filter === 'function') {
				if (!filter(tn[i])) {
					continue;
				}
			}
			if (Q.typeOf(Q.getObject(["Q", "tools", tn[i], "remove"], toolElement)) !== "function") {
				continue;
			}
			toolElement.Q.tools[tn[i]].remove(removeCached, removeElementAfterLastTool);
		}
	});
};

/**
 * Traverses children in a particular container and removes + destroys all tools.
 * Should be called before removing elements.
 * @static
 * @method clear
 * @param {HTMLElement} elem 
 *  The container to traverse
 * @param {boolean} removeCached 
 *  Defaults to false. Whether the tools whose containing elements
 *  have the "data-Q-retain" attribute should be removed...
 */
Q.Tool.clear = function _Q_Tool_clear(elem, removeCached) {
	if (typeof elem === 'string') {
		var tool = Q.Tool.byId(elem);
		if (!tool) return false;
		elem = tool.element;
	}
	Q.Tool.remove(elem.children || elem.childNodes);
};

/**
 * Call this function to define a tool
 * @static
 * @method define
 * @param {String|Object} name The name of the tool, e.g. "Q/foo".
 *   Also you can pass an object containing {name: filename} pairs instead.
 * @param {String|Array} [require] Optionally name another tool (or array of tool names) that was supposed to already have been defined. This will cause your tool's constructor to make sure the required tool has been already loaded and activated on the same element.
 * @param {Object|Function} ctor Your tool's constructor information. You can also pass a filename here, in which case the other parameters are ignored.
 *   If you pass a function, then it will be used as a constructor for the tool. You can also pass an object with the following properties
 * @param {String} [ctor.js] filenames containing Javascript to load for the tool
 * @param {String} [ctor.css] filenames containing CSS to load for the tool, which will be namespaced
 * @param {String} [ctor.html] filenames containing HTML to load for the tool, including templates
 * @param {String|ArrayBufferConstructor} [ctor.text] list any text files to load (for the current language) before the tool constructor.
 *   Also looks for any text files added with Q.Text.forTools(namePrefix, textFileNames)
 * @param {Object} [ctor.placeholder] what to render before the tool is loaded and rendered instead
 * @param {String} [ctor.placeholder.html] literal HTML to insert
 * @param {String} [ctor.placeholder.template] the name of a template to insert
 * @param {Object} [defaultOptions] An optional hash of default options for the tool
 * @param {Array} [stateKeys] An optional array of key names to copy from options to state
 * @param {Object} [methods] An optional hash of method functions to assign to the prototype
 * @return {Function} The tool's constructor function
 */
Q.Tool.define = function (name, /* require, */ ctor, defaultOptions, stateKeys, methods, overwrite) {
	var ctors = {};
	if (typeof name === 'object') {
		ctors = name;
	} else {
		if (typeof arguments[1] !== 'function' && typeof arguments[2] === 'function') {
			var require = arguments[1];
			if (typeof require === 'string') {
				require = [require];
			}
			ctor = arguments[2]; ctor.require = require; defaultOptions = arguments[3];
			stateKeys = arguments[4]; methods = arguments[5];
		}
		ctors[name] = ctor;
	}
	for (name in ctors) {
		ctor = ctors[name];
		var n = Q.normalize(name);
		if (!overwrite && typeof _qtc[n] === 'function') {
			continue;
		}
		if (ctor == null) {
			ctor = function _Q_Tool_default_constructor() {
				// this constructor is just a stub and does nothing
			};
		}
		Q.Tool.names[n] = name;
		if (typeof ctor === 'string' || Q.isPlainObject(ctor)) {
			if (typeof _qtc[n] !== 'function') {
				_qtdo[n] = _qtdo[n] || {};
				_qtc[n] = ctor;
				if (ctor.placeholder) {
					_qtp[n] = ctor.placeholder;
				}
			}
			continue;
		}
		_qtc[n] = ctor;
		ctor.toolName = n;
		if (!Q.isArrayLike(stateKeys)) {
			methods = stateKeys;
			stateKeys = undefined;
		}
		ctor.options = Q.extend(
			defaultOptions, Q.Tool.options.levels, _qtdo[n]
		);
		ctor.stateKeys = stateKeys;
		if (typeof ctor !== 'function') {
			throw new Q.Error("Q.Tool.define requires ctor to be a string or a function");
		}
		Q.extend(ctor.prototype, 10, methods);
		Q.Tool.onLoadedConstructor(n).handle(n, ctor);
		Q.Tool.onLoadedConstructor("").handle(n, ctor);
	}
	return ctor;
};

Q.Tool.beingActivated = undefined;

/**
 * Call this to find out if a tool was defined (but maybe not loaded).
 * 
 * @static
 * @method defined
 * @param {String} toolName the name of the tool
 * @return {Function|String|undefined} the tool constuctor's constructor function,
 *    the Javascript file url if not yet loaded, or undefined if not defined
 */
Q.Tool.defined = function (toolName) {
	if (!toolName) {
		return undefined;
	}
	return Q.Tool.constructors[Q.normalize(toolName)];
};

/**
 * Call this function to define default options for a tool constructor,
 * even if has not been loaded yet. Extends existing options with Q.extend().
 * @static
 * @method define.options
 * @param {String} toolName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.define.options = function (toolName, setOptions) {
	var options;
	toolName = Q.normalize(toolName);
	if (typeof _qtc[toolName] === 'function') {
		options = _qtc[toolName].options;
	} else {
		options = _qtdo[toolName] = _qtdo[toolName] || {};
	}
	if (setOptions) {
		Q.extend(options, Q.Tool.options.levels, setOptions);
	}
	return options;
};
var _qtdo = {};

/**
 * Call this function to define a jQuery plugin, and a tool with the same name that uses it.
 * @static
 * @method jQuery
 * @param {String} name The name of the jQuery plugin and tool, e.g. "Q/foo"
 * @param {Function} ctor Your jQuery plugin's constructor
 * @param {Object} defaultOptions An optional hash of default options for the plugin
 * @param {Array} stateKeys An optional array of key names to copy from options to state
 * @param {Object} methods An optional hash of method functions to assign to the prototype
 */
Q.Tool.jQuery = function(name, ctor, defaultOptions, stateKeys, methods, overwrite) {
	var n;
	if (typeof name === 'object') {
		for (n in name) {
			Q.Tool.jQuery(n, name[n]);
		}
		return;
	}
	n = Q.normalize(name);
	Q.Tool.names[n] = name;
	if (typeof ctor === 'string' || typeof ctor === 'object') {
		if (root.jQuery
		&& typeof jQuery.fn.plugin[n] !== 'function') {
			_qtjo[n] = _qtjo[n] || {};
			if (overwrite || typeof _qtc[n] !== 'function') {
				_qtc[n] = ctor;
			}
			jQuery.fn.plugin[n] = _qtc[n];
		}
		return ctor;
	}
	ctor.toolName = n;
	if (typeof stateKeys === 'object') {
		methods = stateKeys;
		stateKeys = undefined;
	}
	$ = $ || root.jQuery;
	if ($) {
		_onJQuery();
	}
	function _onJQuery() {
		function jQueryPluginConstructor(options /* or methodName, argument1, argument2, ... */) {
			var key = n + ' state', args;
			if (typeof options === 'string') {
				var method = options;
				if (!jQueryPluginConstructor.methods[method]) {
					return this;
				}
				args = Array.prototype.slice.call(arguments, 1);
				$(this).each(function () {
					var $this = $(this);
					if ($this.data(key)) {
						// This jQuery plugin was already applied, so now we can
						// invoke a method on this with arguments
						return jQueryPluginConstructor.methods[method].apply($this, args);
					}
				});
			} else {
				args = Array.prototype.slice.call(arguments, 0);
				args[0] = Q.extend({}, 10, jQueryPluginConstructor.options, 10, options);
				$(this).each(function () {
					var $this = $(this);
					if ($this.data(key)) {
						// This jQuery plugin was already applied here,
						// so call remove method if it's defined,
						// before calling constructor again
						$this.plugin(n, 'remove');
					}
					$this.data(key, Q.copy(args[0], stateKeys));
					ctor.apply($this, args);
				});
			}
			return this;
		}
		jQueryPluginConstructor.options = Q.extend(
			defaultOptions, Q.Tool.options.levels, _qtjo[n]
		);
		jQueryPluginConstructor.methods = methods || {};
		$.fn[n] = jQueryPluginConstructor;
		var ToolConstructor = Q.Tool.define(name,
		function _Q_Tool_jQuery_constructor(options) {
			var $te = $(this.element);
			$te.plugin(n, options, this);
			this.state = $te.state(n);
			this.Q.beforeRemove.set(function () {
				$(this.element).plugin(n, 'remove', this);
			}, 'Q');
		});
		Q.each(methods, function (method) {
			ToolConstructor.prototype['$'+method] = function _Q_Tool_jQuery_method() {
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(n, method);
				var $te = $(this.element);
				$te.plugin.apply($te, args);
			};
		});
	}
};

Q.Tool.jQuery.loadAtStart = [];

Q.Tool.jQuery.info = function (element) {
	return jQuery.hasData(element) && jQuery._data(element);
};

/**
 * Call this function to define default options for a jQuery tool constructor,
 * even if it has not been loaded yet.
 * @static
 * @method jQuery.options
 * @param {String} pluginName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.jQuery.options = function (pluginName, setOptions) {
	var options;
	var pluginName = Q.normalize(pluginName);
	if (typeof _qtc[name] === 'function') {
		options = root.jQuery.fn[pluginName].options;
	} else {
		options = _qtjo[pluginName] = _qtjo[pluginName] || {};
	}
	if (setOptions) {
		Q.extend(options, Q.Tool.options.levels, setOptions);
	}
	return options;
};
var _qtjo = {};

Q.Tool.nextDefaultId = 1;
var _qtc = Q.Tool.constructors = {};
var _qtp = Q.Tool.placeholders = {};

var Tp = Q.Tool.prototype;

/**
 * Call this after changing one more values in the state.
 * Unlike Angular and Ember, Q provides a more explicit mechanism
 * for signaling that a tool's state has changed.
 * Other parts of code can use the Tool.prototype.onState event factory
 * to attach handlers to be run when the state changes.
 * @method stateChanged
 * @param {String|Array} names Name(s) of properties that may have changed,
 *  either an array or comma-separated string.
 */
Tp.stateChanged = function Q_Tool_prototype_stateChanged(names) {
	if (typeof names === 'string') {
		names = names.split(',');
		for (var i=0,l=names.length; i<l; ++i) {
			names[i] = names[i].trim();
		}
	}
	var l = names.length;
	for (var i=0; i<l; ++i) {
		var name = names[i];
		this.Q.onStateChanged(name).handle.call(this, name, this.state[name]);
	}
	this.Q.onStateChanged('').handle.call(this, names);
};

/**
 * You can call this to update the state of the tool, and let
 * all the hooks happen as a result. An alternative to this is
 * changing the state manually and then calling stateChanged(),
 * but this method was introduced to be more familiar to users of React.
 * It only does a *shallow* update, meaning it completely replaces
 * whatever was there previously.
 * @method setState
 * @param {Object} updates An object of state property names and new values
 */
Tp.setState = function Q_Tool_prototype_setState(updates) {
	Q.extend(this.state, updates);
	this.stateChanged(Object.keys(updates));
};

/**
 * When implementing tools, use this to implement rendering markup that can vary
 * as a function of the tool's state (with no additional side effects).
 * @method rendering
 * @param {Array|String} fields The names of fields to watch for, either as an array or 
 *  comma-separated string. When stateChanged is called, if one of the fields named here really changed,
 *  the callback will be called.
 * @param {Function} callback The callback, which receives (changed, previous, timestamp). 
 *  By default, Qbix defers the execution of your rendering handler until the next animation frame.
 *  If several calls to tool.stateChanged</span> occurred in the meantime, 
 *  Qbix aggregates all the changes and reports them to the rendering handler. 
 *  If a field in the state was changed several times in the meantime, 
 *  those intermediate values aren't given to the rendering handler, 
 *  since the assumption is that the view depends on the state without any side effects.
 *  However, if the field was changed, even if it later went back to its original value,
 *  it will show up in the list of changed fields.
 * @param {String} [key=""] Optional key used when attaching event handlers to tool.Q.onStateChanged events.
 * @param {boolean} [dontWaitForAnimationFrame=false] Pass true here if you really don't want to 
 *  wait for the next animation frame to do rendering (for example, 
 *  if you insist on reading the DOM and will use a library like FastDOM to manage DOM thrashing)
 */
Tp.rendering = function (fields, callback, key, dontWaitForAnimationFrame) {
	var tool = this;
	var i, l;
	if (typeof fields === 'string') {
		fields = fields.split(',');
		for (i=0,l=fields.length; i<l; ++i) {
			fields[i] = fields[i].trim();
		}
	}
	if (!fields.length) return false;
	var event;
	for (i=0, l=fields.length; i<l; ++i) {
		this.Q.onStateChanged(fields[i]).set(_handleChange, key);
	}
	var previous = (Q.Tool.beingActivated === this)
		? {} : Q.copy(this.state, fields);
	var changed = {};
	var r;
	function _handleChange(name) {
		if (this.state[name] === previous[name]) return;
		changed[name] = this.state[name];
		r = r || (dontWaitForAnimationFrame
			? setTimeout(_render, 0) 
			: requestAnimationFrame(_render));
	}
	function _render(t) { // this is only called once per animation frame
		Q.handle(callback, tool, [changed, previous, t])
		previous = Q.copy(tool.state, fields);
		changed = {};
		r = null;
	}
};

/**
 * Gets child tools contained in the tool, as determined by their ids.
 * @method children
 * @param {String} [name=""] Filter children by their tool name, such as "Q/inplace"
 * @param {number} [levels=null] Pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
 * @return {Object} A two-level hash of pairs like {id: {name: Tool}}
 */
Tp.children = function Q_Tool_prototype_children(name, levels) {
	var result = {};
	var prefix = this.prefix;
	var id, n, i, ids;
	name = name && Q.normalize(name);
	for (id in Q.Tool.active) {
		for (n in Q.Tool.active[id]) {
			if ((name && name != n)
			|| !id.startsWith(prefix)) {
				continue;
			}
			var tool = Q.Tool.active[id][n];
			if (!levels) {
				Q.setObject([id, n], tool, result);
				continue;
			}
			ids = tool.parentIds();
			var l = Math.min(levels, ids.length);
			for (i=0; i<l; ++i) {
				if (ids[i] === this.id) {
					Q.setObject([id, n], tool, result);
					continue;
				}
			}
		}
	}
	return result;
};

/**
 * Gets one child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * @method child
 * @param {String} append The string to append to the tool prefix to find the child tool id
 * @param {String} [name=""] Filter by tool name, such as "Q/inplace"
 * @return {Q.Tool|null}
 */
Tp.child = function Q_Tool_prototype_child(append, name) {
	name = name && Q.normalize(name);
	var prefix2 = Q.normalize(this.prefix + (append || ""));
	var id, ni, n;
	for (id in Q.Tool.active) {
		ni = Q.normalize(id);
		for (n in Q.Tool.active[id]) {
			if (name && name != n) {
				break;
			}
			if (id.length >= prefix2.length + (append ? 0 : 1)
			&& ni.substr(0, prefix2.length) == prefix2) {
				return Q.Tool.active[id][n];
			}
		}
	}
	return undefined;
};

/**
 * Gets the ids of the parent, grandparent, etc. tools (in that order) of the given tool
 * @method parentIds
 * @return {Array|null}
 */
Tp.parentIds = function Q_Tool_prototype_parentIds() {
	var prefix2 = Q.normalize(this.prefix), ids = [], id, ni;
	for (id in Q.Tool.active) {
		ni = Q.normalize(id);
		if (ni.length < prefix2.length-1
		&& ni === prefix2.substr(0, ni.length)
		&& prefix2[ni.length] === '_') {
			ids.push(id);
		}
	}
	// sort in reverse length order
	ids.sort(function (a, b) { 
		return String(b).length - String(a).length; 
	});
	return ids;
};

/**
 * Gets parent tools, as determined by parentIds()
 * Note that several sibling tools may be activated on the same tool id.
 * @method parents
 * @return {Object} A two-level hash of pairs like {id: {name: Q.Tool}}
 */
Tp.parents = function Q_Tool_prototype_parents() {
	var ids = [], i, id;
	ids = this.parentIds();
	var result = {}, len = ids.length;
	for (i=0; i<len; ++i) {
		id = ids[i];
		result[id] = {};
		for (var n in Q.Tool.active[id]) {
			result[id][n] = Q.Tool.active[id][n];
		}
	}
	return result;
};

/**
 * Returns the immediate parent tool, if any, by using parentIds().
 * If more than one tool is activated with the same parent id, returns the first one.
 * @method parent
 * @return {Q.Tool|null}
 */
Tp.parent = function Q_Tool_prototype_parent() {
	var ids = [];
	ids = this.parentIds();
	return ids.length ? Q.first(Q.Tool.active[ids[0]]) : null;
};

/**
 * Returns the closest ancestor, if any, with the given tool name
 * If more than one tool is activated with the same parent id, returns the first one.
 * @method ancestor
 * @param {String} name
 * @return {Q.Tool|null}
 */
Tp.ancestor = function Q_Tool_prototype_parent(name) {
	name = Q.normalize(name);
	var parents = this.parents();
	for (var id in parents) {
		for (var n in parents[id]) {
			if (n === name) {
				return parents[id][n];
			}
		}
	}
	return undefined;
};

/**
 * Returns a tool on the same element
 * @method sibling
 * @return {Q.Tool|null}
 */
Tp.sibling = function Q_Tool_prototype_sibling(name) {
	return (this.element && this.element.Q && this.element.Q(name)) || null;
};

/**
 * Gets sibling tools activated on the same element
 * @method children
 * @return {Object} pairs of {normalizedName: tool}
 */
Tp.siblings = function Q_Tool_prototype_siblings() {
	var tools = (this.element && this.element.Q && this.element.Q.tools);
	tools = tools ? Q.copy(tools) : {};
	delete tools[this.name];
	return tools;
};

/**
 * Called when a tool instance is removed, possibly
 * being replaced by another.
 * Typically happens after an AJAX call which returns
 * markup for the new instance tool.
 * You should call Q.Tool.remove unless, for some reason, you plan to
 * remove this exact tool instance, and not its children or siblings.
 * @method remove
 * @param {boolean} [removeCached=false]
 *  Defaults to false. Whether or not to remove the actual tool if its containing element
 *  has a "data-Q-retain" attribute.
 * @param {boolean} [removeElementAfterLastTool=false]
 *  If true, removes the element if the last tool on it was removed
 * @return {boolean} Returns whether the tool was removed.
 */
Tp.remove = function _Q_Tool_prototype_remove(removeCached, removeElementAfterLastTool) {

	var i;
	var shouldRemove = removeCached
		|| !this.element.getAttribute('data-Q-retain') !== null;
	if (!shouldRemove || !Q.Tool.active[this.id]) {
		return false;
	}

	// give the tool a chance to clean up after itself
	var normalizedName = Q.normalize(this.name);
	var normalizedId = Q.normalize(this.id);
	_beforeRemoveToolHandlers["id:"+normalizedId] &&
	_beforeRemoveToolHandlers["id:"+normalizedId].handle.call(this);
	_beforeRemoveToolHandlers[normalizedName] &&
	_beforeRemoveToolHandlers[normalizedName].handle.call(this);
	_beforeRemoveToolHandlers[""] &&
	_beforeRemoveToolHandlers[""].handle.call(this);
	Q.handle(this.Q.beforeRemove, this, []);
	
	// remove immediate children first, and so on recursively
	var childId, childName;
	var children = this.children(null, 1)
	for (childId in children) {
		for (childName in children[childId]) {
			children[childId][childName].remove();
		}
	}
	
	var nn = Q.normalize(this.name);
	delete this.element.Q.tools[nn];
	delete Q.Tool.active[this.id][nn];
	var tools = Q.Tool.active[this.id];
	if (Q.isEmpty(Q.Tool.active[this.id])) {
		if (removeElementAfterLastTool) {
			Q.removeElement(this.element);
		}
		this.element.Q.tool = null;
		delete Q.Tool.active[this.id];
	} else if (this.element.Q.tool
	&& Q.normalize(this.element.Q.tool.name) === nn) {
		this.element.Q.tool = Q.Tool.byId(this.id);
	}

	// remove all the tool's events automatically
	var tool = this;
	var key = Q.calculateKey(this);
	var arr = Q.Event.forTool[key];
	while (arr && arr.length) {
		// keep removing the first element of the array until it is empty
		arr[0].remove(tool);
	}
	
	var p = Q.Event.jQueryForTool[key];
	if (p) {
		for (i=p.length-1; i >= 0; --i) {
			var off = p[i][0];
			root.jQuery.fn[off].call(p[i][1], p[i][2], p[i][3]);
		}
		Q.Event.jQueryForTool[key] = [];
	}
	
	return this.removed = true;
};

/**
 * If jQuery is available, returns jQuery(selector, this.element).
 * Just a tiny Backbone.js-style convenience helper; this.$ is similar
 * to $, but scoped to the DOM tree of this tool.
 * @method $
 * @param {String} selector
 *   jQuery selector
 * @return {Object}
 *   jQuery object matched by the given selector
 */
Tp.$ = function _Q_Tool_prototype_$(selector) {
	if (root.jQuery) {
		return selector === undefined
			? jQuery(this.element)
			: jQuery(selector, this.element);
	} else {
		throw new Q.Error("Tp.$ requires jQuery");
	}
};

/**
 * Do something for every and future child tool that is activated inside this tool
 * @method forEachChild
 * @param {String} [name=""] Filter by name of the child tools, such as "Q/inplace"
 * @param {number} [levels] Optionally pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
 * @param {boolean} [withSiblings=false] Optionally pass true here to also get the sibling tools activated on the same element
 * @param {Function} callback The callback to execute at the right time
 */
Tp.forEachChild = function _Q_Tool_prototype_forEachChild(name, levels, withSiblings, callback) {
	if (typeof name !== 'string') {
		levels = name;
		callback = levels;
		name = "";
	}
	if (typeof levels !== 'number') {
		withSiblings = levels;
		levels = null;
	}
	if (typeof withSiblings !== 'boolean') {
		callback = withSiblings;
		withSiblings = false;
	}
	name = name && Q.normalize(name);
	var id, n;
	var tool = this;
	var children = tool.children(name, levels);
	for (id in children) {
		for (n in children[id]) {
			Q.handle(callback, children[id][n]);
		}
	}
	var onActivate = Q.Tool.onActivate(name);
	if (withSiblings) {
		var siblings = tool.siblings();
		for (n in siblings) {
			Q.handle(callback, siblings[n]);
		}
	}
	var key = onActivate.set(function () {
		if (this.prefix.startsWith(tool.prefix)) {
			if (withSiblings || this.prefix.length > tool.prefix.length) {
				Q.handle(callback, this, arguments);
			}
		}
	});
	tool.Q.beforeRemove.set(function () {
		onActivate.remove(key);
	});
};

/**
 * Returns a string that is already properly encoded and can be set as the value of an options attribute
 * @static
 * @method encodeOptions
 * @param {Object} options the options to pass to a tool
 * @return {String}
 */
Q.Tool.encodeOptions = function _Q_Tool_encodeOptions(options) {
	var json = JSON.stringify(options).encodeHTML().replaceAll({"&quot;": '"'});
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.setUpElement('div', 'Streams/chat')).activate(options);
 * @static
 * @method setUpElement
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String|Array} toolName
 *  The type of the tool, such as "Q/tabs", or an array of types
 * @param {Object|Array} [toolOptions]
 *  The options for the tool. If toolName is an array, this is the array 
 *  of corresponding objects to use for options.
 * @param {String|Function} [id=null]
 *  Optional id of the tool, such as "Q_tabs_2", used if element doesn't have an "id" attribute.
 *  If null, calculates an automatically unique id beginning with the tool's name
 * @param {String} [prefix]
 *  Optional prefix to prepend to the tool's id
 * @param {Boolean} [lazyload=false]
 *    Pass true to allow the tool to be lazy-loaded by a Q/lazyload tool if it is
 *    activated on one of its containers.
 * @return {HTMLElement}
 *  Returns an element you can append to things, and/or call Q.activate on
 */
Q.Tool.setUpElement = function _Q_Tool_setUpElement(element, toolName, toolOptions, id, prefix, lazyload) {
	if (typeof toolOptions === 'string') {
		prefix = id;
		id = toolOptions;
		toolOptions = undefined;
	}
	if (typeof element === 'string') {
		element = document.createElement(element);
	}
	if (typeof toolName === 'string') {
		toolName = [toolName];
	}
	if (Q.isPlainObject(toolOptions)) {
		toolOptions = [toolOptions];
	}
	for (var i=0, l=toolName.length; i<l; ++i) {
		var tn = toolName[i];
		var ntt = tn.split('/').join('_');
		var ba = Q.Tool.beingActivated;
		var p1 = prefix || (ba ? ba.prefix : '');
		element.addClass('Q_tool '+ntt+'_tool');
		if (toolOptions && toolOptions[i]) {
			element.options = element.options || {};
			element.options[Q.normalize(tn)] = toolOptions[i];
		}
		if (!element.getAttribute('id')) {
			if (typeof id === 'function') {
				id = id();
			}
			if (id == undefined) {
				var p2;
				do {
					p2 = p1 + ntt + '-' + (Q.Tool.nextDefaultId++) + '_';
					Q.Tool.nextDefaultId %= 1000000;
				} while (Q.Tool.active[p2]);
				id = p2 + 'tool';
			} else {
				id += '_tool';
				if (p1) {
					id = p1 + id;
				}
			}
			element.setAttribute('id', id);
		}
	}
	if (lazyload) {
		element.setAttribute('data-Q-lazyload', 'waiting');
	}
	return element;
};

/**
 * Returns HTML for an element that it can be used to activate a tool
 * @static
 * @method setUpElementHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String|Function} [id]
 *  Optional id of the tool, such as "Q_tabs_2"
 * @param {String} [prefix]
 *  Optional prefix to prepend to the tool's id
 * @param {Object} [attributes]
 *  You can pass extra attributes to the element here
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Q.Tool.setUpElementHTML = function _Q_Tool_setUpElementHTML(
	element, toolName, toolOptions, id, prefix, attributes
) {
	var e = Q.Tool.setUpElement(element, toolName, null, id, prefix);
	var ntt = toolName.replace(/\//g, '_');
	if (toolOptions) {
		e.setAttribute('data-'+ntt.replace(/_/g, '-'), JSON.stringify(toolOptions));
	}
	if (attributes) {
		for (var k in attributes) {
			if (k === 'class') {
				e.addClass(attributes[k]);
			} else {
				e.setAttribute(k, attributes[k]);
			}
		}
	}
	return e.outerHTML;
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.setUpElement('div', 'Streams/chat')).activate(options);
 * The prefix and id of the element are derived from the tool on which this method is called.
 * @method setUpElement
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return {HTMLElement}
 *  Returns an element you can append to things
 */
Tp.setUpElement = function (element, toolName, toolOptions, id) {
	return Q.Tool.setUpElement(element, toolName, toolOptions, id, this.prefix);
};

/**
 * Returns HTML for an element that it can be used to activate a tool.
 * The prefix and id of the element are derived from the tool on which this method is called.
 * For example: $('container').append(Q.Tool.setUpElementHTML('Streams/chat')).activate(options);
 * @method setUpElementHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @param {Object} [attributes]
 *  You can pass extra attributes to the element here
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Tp.setUpElementHTML = function (element, toolName, toolOptions, id, attributes) {
	return Q.Tool.setUpElementHTML(element, toolName, toolOptions, id, this.prefix, attributes);
};

/**
 * Returns a tool corresponding to the given DOM element, if such tool has already been constructed.
 * @static
 * @method from
 * @param toolElement {Element}
 *   the root element of the desired tool
 * @param {String} [toolName]
 *   optional name of the tool attached to the element
 * @return {Q.Tool|null}
 *   the tool corresponding to the given element, otherwise null
 */
Q.Tool.from = function _Q_Tool_from(toolElement, toolName) {
	if (Q.isArrayLike(toolElement)) {
		toolElement = toolElement[0];
	} if (typeof toolElement === 'string') {
		toolElement = document.getElementById(toolElement);
	}
	return toolElement && toolElement.Q ? toolElement.Q(toolName) : null;
};

/**
 * Reference a tool by its id
 * @static
 * @method byId
 * @param {String} id
 * @param {String} name optionally specify the name of the tool, useful if more than one tool was activated on the same element. It will be run through Q.normalize().
 * @return {Q.Tool|null|undefined}
 */
Q.Tool.byId = function _Q_Tool_byId(id, name) {
	if (name) {
		name = Q.normalize(name);
		return Q.Tool.active[id] ? Q.Tool.active[id][name] : null;
	}
	var tool = Q.Tool.active[id] ? Q.first(Q.Tool.active[id]) : null;
	if (!tool) {
		return undefined;
	}
	var q = tool.element.Q;
	return q.tools[q.toolNames[0]];
};

/**
 * Find all the activated tools with a certain name
 * @static
 * @method byName
 * @param {String|Array} name This is run through Q.normalize()
 * @return {Object}
 */
Q.Tool.byName = function _Q_Tool_byName(name) {
	var result = {};
	var isString = (typeof name === 'string');
	if (isString) {
		name = Q.normalize(name);
	} else {
		for (var i=0, l=name.length; i<l; ++i) {
			name[i] = Q.normalize(name[i]);
		}
	}
	for (var id in Q.Tool.active) {
		var tools = Q.Tool.active[id];
		for (var n in tools) {
			if ((isString && name === n)
			|| (!isString && name.indexOf(n) >= 0)) {
				result[id] = tools[n];
			}
		}
	}
	return result;
};

/**
 * Computes and returns a tool's prefix
 * @static
 * @method calculatePrefix
 * @param {String} id the id or prefix of an existing tool or its element
 * @return {String}
 */
Q.Tool.calculatePrefix = function _Q_Tool_calculatePrefix(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-4);
	} else if (id.substr(id.lengh-1) === '_') {
		return id;
	} else {
		return id + "_";
	}
};

/**
 * Computes and returns a tool's id from some string that's likely to contain it,
 * such as an HTML element's id, a tool's id, or a tool's prefix.
 * @static
 * @method calculateId
 * @param {String} id the id or prefix of an existing tool or its element
 * @return {String}
 */
Q.Tool.calculateId = function _Q_Tool_calculatePrefix(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-5);
	} else if (id.substr(id.length-1) === '_') {
		return id.substring(0, id.length-1);
	} else {
		return id;
	}
};

/**
 * For debugging purposes only, allows to log tool names conveniently
 * @method toString
 * @return {String}
 */
Tp.toString = function _Q_Tool_prototype_toString() {
	return this.id;
};

/**
 * Loads the script corresponding to a tool
 * @method _loadToolScript
 * @param {DOMElement} toolElement
 * @param {Function} callback  The callback to call when the corresponding script has been loaded and executed
 * @param {Mixed} [shared] pass this only when constructing a tool
 * @param {String} [parentId] used internally to pass id of parent tools waiting for init
 * @param {Object} [options={}]
 * @param {Boolean} [options.placeholder=false] used internally to set placeholder HTML for tools waiting for activation
 * @return {boolean} whether the script needed to be loaded
 */
function _loadToolScript(toolElement, callback, shared, parentId, options) {
	var toolId = Q.Tool.calculateId(toolElement.id);
	var classNames = toolElement.className.split(' ');
	var toolNames = [];
	for (var i=0, nl = classNames.length; i<nl; ++i) {
		var className = classNames[i];
		if (className === 'Q_tool'
		|| className.slice(-5) !== '_tool') {
			continue;
		}
		toolNames.push(Q.normalize(className.substr(0, className.length-5)));
	}
	var p = new Q.Pipe(toolNames, function (params) {
		// now that all the tool scripts are loaded, activate the tools in the right order
		for (var i=0, nl = toolNames.length; i<nl; ++i) {
			var toolName = toolNames[i];
			callback.apply(null, params[toolName]);
		}
	});
	Q.each(toolNames, function (i, toolName) {
		var toolConstructor = _qtc[toolName];
		var toolPlaceholder = _qtp[toolName];
		function _loadToolScript_loaded(params) {
			// in this function, toolConstructor starts as a string
			// and we expect the script to call Q.Tool.define()
			if (params.html && !params.html[0] && params.html[1]
			&& typeof _qtc[toolName] !== 'function') {
				var div = document.createElement('div');
				div.innerHTML = params.html[1];
				var scripts = div.getElementsByTagName('script');
				Q.each(scripts, function () { // run scripts in order
					eval(this.innerHTML);
				});
				var styles = div.getElementsByTagName('style');
				Q.each(styles, function () { // permanently add any styles to document
					document.head.appendChild(this);
				});
				_processTemplateElements(div);
			}
			toolConstructor = _qtc[toolName];
			if (typeof toolConstructor !== 'function') {
				Q.Tool.onMissingConstructor.handle(_qtc, toolName);
				toolConstructor = _qtc[toolName];
				if (typeof toolConstructor !== 'function') {
					toolConstructor = function () { console.log("Missing tool constructor for " + toolName); }; 
				}
			}
			p.fill(toolName)(toolElement, toolConstructor, toolName, uniqueToolId, params);
		}
		if (toolConstructor === undefined) {
			Q.Tool.onMissingConstructor.handle(_qtc, toolName);
			toolConstructor = _qtc[toolName];
			if (typeof toolConstructor !== 'function'
			&& typeof toolConstructor !== 'string'
			&& !(Q.isPlainObject(toolConstructor) && toolConstructor.js)) {
				toolConstructor = function () {
					console.log("Missing tool constructor for " + toolName);
				}; 
			}
		}
		if (parentId) {
			Q.setObject([toolId, parentId], true, _toolsToInit);
			if (parentId !== toolId) {
				Q.setObject([parentId, toolId], true, _toolsWaitingForInit);
			}
		}
		if (shared) {
			var uniqueToolId = toolId + " " + toolName;
			if (!shared.firstToolId) {
				shared.firstToolId = uniqueToolId;
			}
			if (shared.waitingForTools.indexOf(uniqueToolId) < 0) {
				shared.waitingForTools.push(uniqueToolId);
			}
		}
		if (options && options.placeholder && toolPlaceholder) {
			// Insert placeholder HTML from one of the tools.
			// Usually it's a .Q_placeholder_shimmer class div container with a bunch of children
			var tool = Q.getObject(['Q', 'tools', toolName], toolElement);
			if (!tool && !toolElement.innerHTML) {
				function _insertHTML(err, html) {
					toolElement.innerHTML = html;
				}
				if (toolPlaceholder.html) {
					_insertHTML(null, toolPlaceholder.html);
				} else if (toolPlaceholder.template) {
					if (Q.isPlainObject(toolPlaceholder.template)) {
						Q.Template.render(toolPlaceholder.template.name, toolPlaceholder.template.fields, _insertHTML);
					} else {
						Q.Template.render(toolPlaceholder.template, _insertHTML);
					}
				}
			}
		}
		if (typeof toolConstructor === 'function') {
			return p.fill(toolName)(toolElement, toolConstructor, toolName, uniqueToolId);
		}
		if (toolConstructor === undefined) {
			return;
		}
		if (typeof toolConstructor === 'string') {
			if (toolConstructor.split('.').pop() === 'js') {
				toolConstructor = { js: toolConstructor };
			} else {
				toolConstructor = { html: toolConstructor };
			}
		}
		if (!Q.isPlainObject(toolConstructor)) {
			throw new Q.Error("Q.Tool.loadScript: toolConstructor cannot be " + Q.typeOf(toolConstructor));
		}
		var toolConstructorSrc = toolConstructor.js || toolConstructor.html;
		if (!toolConstructorSrc) {
			throw new Q.Error("Q.Tool.loadScript: missing tool constructor file");
		}
		var pipe = Q.pipe(), waitFor = [];
		if (toolConstructor.js) {
			waitFor.push('js');
			Q.addScript(toolConstructor.js, pipe.fill('js'));
		}
		if (toolConstructor.css) {
			waitFor.push('css');
			Q.addStylesheet(toolConstructor.css, pipe.fill('css'));
		}
		if (toolConstructor.html) {
			waitFor.push('html');
			Q.request.once(toolConstructor.html, pipe.fill('html'), { extend: false, parse: false });
		}
		var n = Q.normalize(toolName);
		var text = Q.Text.addedFor('Q.Tool.define', n, toolConstructor);
		if (text) {
			waitFor.push('text');
			Q.Text.get(text, pipe.fill('text'));
		}
		pipe.add(waitFor, 1, _loadToolScript_loaded).run();
	});
}

Q.Tool.onLoadedConstructor = Q.Event.factory({}, ["", function (name) { 
	return [Q.normalize(name)];
}]);
Q.Tool.onMissingConstructor = new Q.Event();


/**
 * Methods for working with links
 * @class Q.Links
 */
Q.Links = {
	/**
	 * Generates a link for making a call
	 * @static
	 * @method tel
	 * @param {String} [mobileNumbers]
	 * @return {String}
	 */
	tel: function (mobileNumber, extension) {
		return 'tel:' + mobileNumber + (extension ? 'p' + extension : '');
	},
	/**
	 * Generates a link for sending an sms message
	 * @static
	 * @method sms
	 * @param {String} [body]
	 * @param {String|Array} [mobileNumbers]
	 * @return {String}
	 */
	sms: function (body, mobileNumbers) {
		var ios = (Q.info.browser.OS === 'ios');
		if (mobileNumbers && Q.isArrayLike(mobileNumbers)) {
			var temp = [];
			Q.each(mobileNumbers, function (i) {
				temp.push(encodeURIComponent(mobileNumbers[i]));
			});
			mobileNumbers = (ios ? '/open?addresses=' : '') + temp.join(',');
		}
		var url = "sms:" + (mobileNumbers || (ios ? '%20' : ''));
		var char = ios ? '&' : '?';
		return url + char + 'body=' + encodeURIComponent(body);
	},
	/**
	 * Generates a link for sending an email message
	 * @static
	 * @method email
	 * @param {String} [subject]
	 * @param {String} [body]
	 * @param {String|Array} [to]
	 * @param {String|Array} [cc]
	 * @param {String|Array} [bcc]
	 * @return {String}
	 */
	email: function (subject, body, to, cc, bcc) {
		var ios = (Q.info.browser.OS === 'ios');
		to = to && Q.isArrayLike(to) ? to.join(',') : to;
		cc = cc && Q.isArrayLike(cc) ? cc.join(',') : cc;
		bcc = bcc && Q.isArrayLike(bcc) ? bcc.join(',') : bcc;
		var names = ['cc', 'bcc', 'subject', 'body'];
		var parts = [cc, bcc, subject, body];
		var url = "mailto:" + (to || '');
		var char = '?';
		for (var i=0, l=names.length; i<l; ++i) {
			if (parts[i]) {
				url += char + names[i] + '=' + 
					(i >= 2 ? encodeURIComponent(parts[i]) : parts[i]);
				char = '&';
			}
		}
		return url;
	},
	/**
	 * Generates a link for opening a WhatsApp message to a number
	 * @static
	 * @method whatsApp
	 * @param {String} [phoneNumber] This should include the country code, without the "+"
	 * @param {String} [message] The text can include a URL that will be expanded in the chat
	 * @return {String}
	 */
	whatsApp: function (phoneNumber, message) {
		return 'whatsapp://send/?phone=' + phoneNumber
			+ (message ? '&text=' + encodeURIComponent(message) : '');
	},
	/**
	 * Generates a link for sharing a link in Telegram
	 * @static
	 * @method telegramShare
	 * @param {String} [to] Phone number with country code e.g. "+1", or username starting with "@".
	 *  If a username, then don't supply text or url, it can only open a window to chat.
	 *  Set this to false and supply text (and optional url) to open Telegram and let the user
	 *  choose Telegram users, channels and groups to share to.
	 * @param {String} [text] The text to share, can contain a URL, so need to include the next parameter.
	 * @param {String} [url] Optionally put a URL to share here, which will appear ahead of the text
	 * @return {String}
	 */
	telegram: function (to, text, url) {
		if (to && to[0] === '@') {
			return 'tg://resolve?domain=' + to.substr(1);
		}
		return (url
			? 'tg://msg_url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text)
			: 'tg://msg?text=' + encodeURIComponent(text)
		) + (to ? '&to=' + to : '');
	},
	/**
	 * Generates a link for sharing a link in Skype
	 * @static
	 * @method telegramShare
	 * @param {String} [text] The text to share, can contain a URL
	 * @param {String} [url] The URL to share
	 * @return {String}
	 */
	skype: function (text, url) {
		return 'https://web.skype.com/share?'
			+ (text ? '&text=' + encodeURIComponent(text) : '')
			+ (url ? '&url=' + encodeURIComponent(url) : '');
	},
	/**
	 * Generates a link for opening in android chrome browser.
	 * Usable in other browsers on Android.
	 * @static
	 * @method androidChrome
	 * @param {String} [url]
	 * @return {String}
	 */
	androidChrome: function (url) {
		return 'googlechrome://navigate?url=' + url; // note: don't encodeURIComponent
	}
};

/**
 * A Q.Session object represents a session, and implements things like an "expiring" dialog
 * @class Q.Session
 * @constructor
 */

Q.Session = {
	paths: [],
	/**
	 * Clears the various objects that were set specifically
	 * for this user session.
	 * @static
	 * @method clear
	 */
	clear: function () {
		Q.each(Q.Session.paths, function (i, path) {
			if (Q.getObject(path)) {
				Q.setObject(path, null);
			}
		});
		return true;
	}
};

/**
 * A Q.Request object represents a network request issued by Q
 * @class Q.Request
 * @constructor
 */

Q.Request = function _Q_Request(url, slotNames, callback, options) {
	this.url = url;
	this.slotNames = slotNames;
	this.callback = callback;
	this.options = options;
};

/**
 * A Q.Response object represents a network response
 * @class Q.Response
 * @constructor
 */

Q.Response = function _Q_Response(response) {
	
};

Q.Response.processScriptDataAndLines = function (response) {
	if (response.scriptData) {
		Q.each(response.scriptData,
		function _Q_scriptData_each() {
			Q.each(this, function _Q_loadUrl_scriptData_assign(k, v) {
				Q.setObject(k, v);
			});
		});
	}
	if (response.sessionDataPaths) {
		Q.Session.paths = response.sessionDataPaths;
	}
	if (response.scriptLines) {
		for (var i in response.scriptLines) {
			if (response.scriptLines[i]) {
				eval(response.scriptLines[i]);
			}
		}
	}
};

Q.Response.processStylesheets = function Q_Response_loadStylesheets(response, callback) {
	if (!response.stylesheets) {
		return callback();
	}
	var newStylesheets = {};
	var keys = Object.keys(response.stylesheets);
	if (response.stylesheets[""]) {
		keys.splice(keys.indexOf(""), 1);
		keys.unshift("");
	}
	var waitFor = [];
	var slotPipe = Q.pipe();			
	Q.each(keys, function (i, slotName) {
		var stylesheets = [];
		for (var j in response.stylesheets[slotName]) {
			var stylesheet = response.stylesheets[slotName][j];
			if (root.StyleFix && (stylesheet.href in processStylesheets.slots)) {
				continue; // if prefixfree is loaded, we will not even try to load these processed stylesheets
			}
			var key = slotName + '\t' + stylesheet.href + '\t' + stylesheet.media;
			var elem = Q.addStylesheet(
				stylesheet.href, stylesheet.media,
				slotPipe.fill(key), { slotName: slotName, returnAll: false }
			);
			if (elem) {
				stylesheets.push(elem);
			}
			waitFor.push(key);
		}
		newStylesheets[slotName] = stylesheets;
	});
	slotPipe.add(waitFor, function _Q_loadUrl_pipe_slotNames() {
		callback();
	}).run();
	return newStylesheets;
}

Q.Response.processStyles = function Q_Response_processStyles(response) {
	if (!response.stylesInline) {
		return null;
	}
	var newStyles = {},
		head = document.head || document.getElementsByTagName('head')[0];
	var keys = Object.keys(response.stylesInline);
	if (response.stylesInline[""]) {
		keys.splice(keys.indexOf(""), 1);
		keys.unshift("");
	}
	Q.each(keys, function (i, slotName) {
		var styles = response.stylesInline[slotName];
		if (!styles) return;
		var style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.setAttribute('data-slot', slotName);
		if (style.styleSheet){
			style.styleSheet.cssText = styles;
		} else {
			style.appendChild(document.createTextNode(styles));
		}
		head.appendChild(style);
		newStyles[slotName] = [style];
	});
	return newStyles;
}

Q.Response.processHtmlCssClasses = function Q_Response_processHtmlCssClasses(response) {
	Q.each(response.htmlCssClasses, function (i, c) {
		document.documentElement.addClass(c);
	});
}

Q.Response.processMetas = function Q_Response_processMetas(response) {
	if (!response.metas) {
		return null;
	}

	var elHead = document.getElementsByTagName('head')[0];
	for (var slotName in response.metas) {
		Q.each(response.metas[slotName], function (i) {
			var metaData = this;
			var metas = document.querySelectorAll("meta[" + metaData.name + "='" + metaData.value + "']");
			var found = false;
			Q.each(metas, function (j) {
				if (this.getAttribute(metaData.name) === metaData.value) {
					this.setAttribute(metaData.name, metaData.value);
					this.setAttribute("content", metaData.content);
					found = true;
					return false;
				}
			});
			if (!found) {
				var meta = document.createElement("meta");
				meta.setAttribute(this.name, metaData.value);
				meta.setAttribute("content", metaData.content);
				elHead.appendChild(meta);
				return;
			}
		});
	}
};

Q.Response.processTemplates = function Q_Response_processTemplates(response) {
	if (!response.templates) {
		return null;
	}
	var slotName, newTemplates = {};
	for (slotName in response.templates) {
		newTemplates[slotName] = [];
		Q.each(response.templates[slotName], function (i) {
			var info = Q.take(this, ['type', 'text', 'partials', 'helpers']);
			newTemplates[slotName].push(
				Q.Template.set(this.name, this.content, info)
			);
		});
	}
	return newTemplates;
};

Q.Response.processScripts = function Q_Response_processScripts(response, callback, options) {
	if (!response.scripts) {
		callback();
		return null;
	}
	var slotPipe = Q.pipe(Object.keys(response.scripts), function _Q_loadUrl_pipe_slotNames() {
		callback();
	});
	var newScripts = {};
	var keys = Object.keys(response.scripts);
	if (response.scripts[""]) {
		keys.splice(keys.indexOf(""), 1);
		keys.unshift("");
	}
	Q.each(keys, function (i, slotName) {
		var elem = Q.addScript(
			response.scripts[slotName], slotPipe.fill(slotName), {
			ignoreLoadingErrors: options.ignoreLoadingErrors,
			returnAll: false
		});
		if (elem) {
			newScripts[slotName] = elem;
		}
	});
	return newScripts;
};

/**
 * A Q.Cache object stores items in a cache and throws out least-recently-used ones.
 * @class Q.Cache
 * @constructor
 * @param {Object} options you can pass the following options:
 * @param {boolean} [options.localStorage] use local storage instead of page storage
 * @param {boolean} [options.sessionStorage] use session storage instead of page storage
 * @param {String} [options.name] the name of the cache, not really used for now
 * @param {Integer} [options.max=100] the maximum number of items the cache should hold. Defaults to 100
 * @param {Q.Cache} [options.after] pass an existing cache with max > this cache's max, to look in first
 * @param {Q.Event} [options.beforeEvict] you can pass a handler here that returns false to prevent cache eviction of certain elements
 */
Q.Cache = function _Q_Cache(options) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
	options = options || {};
	this.typename = 'Q.Cache';
	this.localStorage = !!options.localStorage;
	this.sessionStorage = !!options.sessionStorage;
	this.name = options.name;
	this.data = {};
	this.special = {};
	this.beforeEvict = new Q.Event();
	if (options.beforeEvict) {
		Q.extend(this.beforeEvict, options.beforeEvict);
	}
	var _earliest, _latest, _count;
	if (options.localStorage) {
		this.localStorage = true;
	} else if (options.sessionStorage) {
		this.sessionStorage = true;
	} else {
		this.documentStorage = true;
		_earliest = _latest = null;
		_count = 0;
	}
	this.max = options.max || 100;
	/**
	 * Returns the key corresponding to the entry that was touched the earliest
     * @method earliest
	 * @return {String}
	 */
	this.earliest = function _Q_Cache_earliest() {
		var newValue = arguments[0]; // for internal use
		if (newValue === undefined) {
			if (this.documentStorage) {
				return _earliest;
			} else {
				var result = Q_Cache_get(this, "earliest", true);
				return result === undefined ? null : result;
			}
		} else {
			if (this.documentStorage) {
				_earliest = newValue;
			} else {
				Q_Cache_set(this, "earliest", newValue, true);
			}
		}
	};
	/**
	 * Returns the key corresponding to the entry that was touched the latest
     * @method latest
	 * @return {String}
	 */
	this.latest = function _Q_Cache_latest() {
		var newValue = arguments[0]; // for internal use
		if (newValue === undefined) {
			if (this.documentStorage) {
				return _latest;
			} else {
				var result = Q_Cache_get(this, "latest", true);
				return result === undefined ? null : result;
			}
		} else {
			if (this.documentStorage) {
				_latest = newValue;
			} else {
				Q_Cache_set(this, "latest", newValue, true);
			}
		}
	};
	/**
	 * Returns the number of entries in the cache
     * @method count
	 * @return {number}
	 */
	this.count = function _Q_Cache_count() {
		var newValue = arguments[0]; // for internal use
		if (newValue === undefined) {
			if (this.documentStorage) {
				return _count;
			} else {
				var result = Q_Cache_get(this, "count", true);
				return result || 0;
			}
		} else {
			if (this.documentStorage) {
				_count = newValue;
			} else {
				Q_Cache_set(this, "count", newValue, true);
			}
		}
	};
	if (options.after) {
		var cache = options.after;
		if (!(cache instanceof Q.Cache)) {
			throw new Q.Exception("Q.Cache after option must be a Q.Cache instance");
		}
		if (cache.max < this.max) {
			throw new Q.Exception("Q.Cache after.max cannot be less than this.max");
		}
		var _set = this.set;
		var _get = this.get;
		var _remove = this.remove;
		var _clear = this.clear;
		this.set = function () {
			cache.set.apply(this, arguments);
			return _set.apply(this, arguments);
		};
		this.get = function () {
			cache.get.apply(this, arguments);
			return _get.apply(this, arguments);
		};
		this.remove = function () {
			cache.remove.call(this, arguments);
			return _remove.apply(this, arguments);
		};
		this.clear = function () {
			this.each([], function () {
				cache.remove.apply(this, arguments);
			});
			return _clear.apply(this, arguments);
		};
	}
};
function Q_Cache_index_name(parameterCount) {
	return 'index' + parameterCount + 'parameters';
}
function Q_Cache_get(cache, key, special) {
	if (cache.documentStorage) {
		return (special === true) ? cache.special[key] : cache.data[key];
	}
	var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
	var item = storage.getItem(cache.name + (special===true ? "\t" : "\t\t") + key);
	return item ? JSON.parse(item) : undefined;
}
function Q_Cache_set(cache, key, obj, special) {
	if (cache.documentStorage) {
		if (special === true) {
			cache.special[key] = obj;
		} else {
			cache.data[key] = obj;
		}
	} else {
		if (cache.localStorage && Q.Frames && !Q.Frames.isMain()) {
			return false; // do nothing, this isn't the main frame
		}
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		var id = cache.name + (special===true ? "\t" : "\t\t") + key;
		try {
			var serialized = JSON.stringify(obj);
			storage.setItem(id, serialized);
		} catch (e) {
			if (!special && e.name !== 'TypeError') {
				for (var i=0; i<10; ++i) {
					try {
						// try to remove up to 10 items it may be a problem with space
						if (cache.removeEarliest()) {
							storage.setItem(id, serialized);
						}
						break;
					} catch (e) {
		
					}
				}
			}
		}
		
	}
}
function Q_Cache_removeFromIndex(cache, parameters, key) {
	if (!parameters) {
		return false;
	}
	// remove from index for Cp.each
	for (var i=1, l=parameters.length; i<l; ++i) {
		// key in the index
		var k = 'index:' + Q.Cache.key(parameters.slice(0, i));
		var obj = Q_Cache_get(cache, k, true) || {};
		if (key in obj) {
			delete obj[key];
			Q_Cache_set(cache, k, obj, true);
		}
	}
	return true;
}
function Q_Cache_remove(cache, key, special) {
	if (cache.documentStorage) {
		if (special === true) {
			delete cache.special[key];
		} else {
			delete cache.data[key];
		}
	} else {
		if (cache.localStorage && Q.Frames && !Q.Frames.isMain()) {
			return false; // do nothing, this isn't the main frame
		}
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		storage.removeItem(cache.name + (special === true ? "\t" : "\t\t") + key);
	}
}
function Q_Cache_pluck(cache, existing) {
	var value;
	if (existing.prev) {
		if (value = Q_Cache_get(cache, existing.prev)) {
			value.next = existing.next;
			Q_Cache_set(cache, existing.prev, value);
		}
	} else {
		cache.earliest(existing.next);
	}
	if (existing.next) {
		if (value = Q_Cache_get(cache, existing.next)) {
			value.prev = existing.prev;
			Q_Cache_set(cache, existing.next, value);
		}
	} else {
		cache.latest(existing.prev);
	}
}
/**
 * Generates the key under which things will be stored in a cache
 * @static
 * @method key
 * @param  {Array|String} args the arguments from which to generate the key
 * @param {Array} functions  optional array to which all the functions found in the arguments will be pushed
 * @return {String}
 */
Q.Cache.key = function _Cache_key(args, functions) {
	var i, keys = [];
	if (!Q.isArrayLike(args)) {
		return args;
	}

	for (i=0; i<args.length; ++i) {
		if (typeof(args[i]) === 'function') {
			if (functions && functions.push) {
				functions.push(args[i]);
			}
		} else if (typeof args[i] !== 'object' || Q.isPlainObject(args[i])) {
			keys.push(args[i]);
		}
	}
	return JSON.stringify(keys);
};

var Cp = Q.Cache.prototype;

/**
 * Accesses the cache and sets an entry in it
 * @method set
 * @param {String|Array} key  the key to save the entry under, or an array of arguments
 * @param {number} cbpos the position of the callback
 * @param {Object} subject The "this" object for the callback
 * @param {Array} params The parameters for the callback
 * @param {Object} options  supports the following options:
 * @param {boolean} [options.dontTouch=false] if true, then doesn't mark item as most recently used
 * @return {boolean} whether there was an existing entry under that key
 */
Cp.set = function _Q_Cache_prototype_set(key, cbpos, subject, params, options) {
	var existing, previous, count;
	var parameters = (typeof key !== 'string' ? key : null);
	if (parameters) {
		key = Q.Cache.key(parameters);
	}
	if (!options || !options.dontTouch) {
		// marks the item as being recently used, if it existed in the cache already
		existing = this.get(key);
		if (!existing) {
			count = this.count() + 1;
			this.count(count);
		}
	}
	var value = {
		cbpos: cbpos,
		subject: subject,
		params: (params instanceof Array) ? params : Array.prototype.slice.call(params||[]),
		prev: (options && options.prev) ? options.prev : (existing ? existing.prev : this.latest()),
		next: (options && options.next) ? options.next : (existing ? existing.next : null)
	};
	Q_Cache_set(this, key, value);
	if (!existing || (!options || !options.dontTouch)) {
		if ((previous = Q_Cache_get(this, value.prev))) {
			previous.next = key;
			Q_Cache_set(this, value.prev, previous);
		}
		this.latest(key);
		if (count === 1) {
			this.earliest(key);
		}
	}

	if (count > this.max) {
		this.removeEarliest();
	}

	if (parameters) {
		for (var i=1, l=parameters.length; i<=l; ++i) {
			// add to index for Cp.each
			Q_Cache_set(this, Q_Cache_index_name(i), true, true);

			if (i===l) {
				break;
			}

			// key in the index
			var k = 'index:' + Q.Cache.key(parameters.slice(0, i));
			var obj = Q_Cache_get(this, k, true) || {};
			obj[key] = 1;
			Q_Cache_set(this, k, obj, true);
		}
	}

	return !!existing;
};
/**
 * Accesses the cache and gets an entry from it
 * @method get
 * @param {String|Array} key  the key to search for
 * @param {Object} options  supports the following options:
 * @param {boolean} [options.dontTouch=false] if true, then doesn't mark item as most recently used
 * @return {mixed} whatever is stored there, or else returns undefined
 */
Cp.get = function _Q_Cache_prototype_get(key, options) {
	var existing, previous;
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
	}
	existing = Q_Cache_get(this, key);
	if (!existing) {
		return undefined;
	}
	if ((!options || !options.dontTouch) && this.latest() !== key) {
		if (this.earliest() == key) {
			this.earliest(existing.next);
		}
		Q_Cache_pluck(this, existing);
		existing.prev = this.latest();
		existing.next = null;
		Q_Cache_set(this, key, existing);
		if ((previous = Q_Cache_get(this, existing.prev))) {
			previous.next = key;
			Q_Cache_set(this, existing.prev, previous);
		}
		this.latest(key);
	}
	return existing;
};
/**
 * Accesses the cache and removes an entry from it.
 * @static
 * @method remove
 * @param {String|Array} key  the key of the entry to remove
 * @return {boolean} whether there was an existing entry under that key
 */
Cp.remove = function _Q_Cache_prototype_remove(key) {
	var existing, count;
	var parameters = (typeof key !== 'string' ? key : null);
	if (parameters) {
		key = Q.Cache.key(key);
	}
	existing = this.get(key, {dontTouch: true});
	if (!existing) {
		return false;
	}

	count = this.count()-1;
	this.count(count);

	if (this.latest() === key) {
		this.latest(existing.prev);
	}
	if (this.earliest() === key) {
		this.earliest(existing.next);
	}

	Q_Cache_pluck(this, existing);
	Q_Cache_remove(this, key);
	Q_Cache_removeFromIndex(this, parameters, key);

	return true;
};
/**
 * Accesses the cache and removes the earliest entry from it that it can
 * @static
 * @method removeEarliest
 * @return {Object|null} the item that was removed, otherwise null
 */
Cp.removeEarliest = function _Q_Cache_prototype_removeEarliest () {
	var current, currentKey = this.earliest();
	while (current = Q_Cache_get(this, currentKey)) {
		if (false !== Q.handle(this.beforeEvict, this, [current])) {
			this.remove(currentKey);
			return current;
		}
		currentKey = current.next;
	}
};
/**
 * Accesses the cache and clears all entries from it
 * @static
 * @method clear
 */
Cp.clear = function _Q_Cache_prototype_clear() {
	if (this.documentStorage) {
		this.special = {};
		this.data = {};
	} else {
		var key = this.earliest(), prevkey, item;
		// delete the cached items one by one
		while (key) {
			item = Q_Cache_get(this, key);
			if (item === undefined) break;
			prevkey = key;
			key = item.next;
			Q_Cache_remove(this, prevkey);
			try {
				Q_Cache_removeFromIndex(this, JSON.parse(key), key);
			} catch (e) {}
		}
	}
	this.earliest(null);
	this.latest(null);
	this.count(0);
};
/**
 * Searches for entries matching a certain prefix of arguments array
 * and calls the callback repeatedly with each matching result.
 * @method each
 * @param {Array} args  An array consisting of some or all the arguments that form the key
 * @param {Function} callback  Is passed two parameters: key, value, with this = the cache
 * @param {Object} [options]
 * @param {Boolean} [options.throwIfNoIndex] pass true to throw an exception if an index doesn't exist
 */
Cp.each = function _Q_Cache_prototype_each(args, callback, options) {
	if (!callback) {
		return;
	}
	options = options || {};
	var localStorageIndexInfoKey = Q_Cache_index_name(args.length);
	if (Q_Cache_get(this, localStorageIndexInfoKey, true)) {
		var rawKey = Q.Cache.key(args);
		var key = 'index:' + rawKey; // key in the index
		var localStorageKeys = Q_Cache_get(this, key, true) || {};
		for (var k in localStorageKeys) {
			var result = Q_Cache_get(this, k);
			if (result === undefined) {
				continue;
			}
			if (false === callback.call(this, k, result)) {
				continue;
			}
		}
		// also the key itself
		var item = Q_Cache_get(this, rawKey);
		if (item !== undefined) {
			callback.call(this, rawKey, item);
		}
		return;
	}
	// key doesn't exist
	if (options.throwIfNoIndex) {
		throw new Q.Exception('Cache.prototype.each: no index for ' + this.name + ' ' + localStorageIndexInfoKey);
	}
	var prefix = null;
	if (typeof args === 'function') {
		callback = args;
		args = undefined;
	} else {
		var json = Q.Cache.key(args);
		prefix = json.substring(0, json.length-1);
	}
	var cache = this;
	if (this.documentStorage) {
		return Q.each(this.data, function (k, v) {
			if (prefix && !k.startsWith(prefix)) {
				return;
			}
			if (callback.call(cache, k, v) === false) {
				return false;
			}
		});
	} else {
		var results = {}, seen = {}, key = cache.earliest(), item;
		while (key) {
			item = Q_Cache_get(this, key);
			if (item === undefined) {
				break;
			}
			if (!prefix || key.startsWith(prefix)) {
				results[key] = item;
			}
			if (seen[key]) {
				throw new Q.Error("Q.Cache.prototype.each: "+this.name+" has an infinite loop");
			}
			seen[key] = true;
			key = item.next;
		}
		for (key in results) {
			if (false === callback.call(this, key, results[key])) {
				break;
			}
		}
	}
};
/**
 * Removes all the entries in the cache matching the args
 * @method removeEach
 * @param {Array} args  An array consisting of some or all the arguments that form the key
 */
Cp.removeEach = function _Q_Cache_prototype_each(args, options) {
	options = options || { throwIfNoIndex: false };
	this.each(args, function (key) {
		this.remove(JSON.parse(key));
	}, options);
	return this;
};
Q.Cache.document = function _Q_Cache_document(name, max, options) {
	if (!Q.Cache.document.caches[name]) {
		var cache = Q.Cache.document.caches[name] = new Q.Cache(Q.extend({
			max: max,
			name: name
		}, options));
	}
	return Q.Cache.document.caches[name];
};
Q.Cache.local = function _Q_Cache_local(name, max, options) {
	if (!Q.Cache.local.caches[name]) {
		var cache = Q.Cache.local.caches[name] = new Q.Cache(Q.extend({
			localStorage: true,
			max: max,
			name: name
		}, options));
	}
	return Q.Cache.local.caches[name];
};
Q.Cache.session = function _Q_Cache_session(name, max, options) {
	if (!Q.Cache.session.caches[name]) {
		var cache = Q.Cache.session.caches[name] = new Q.Cache(Q.extend({
			sessionStorage: true,
			max: max,
			name: name
		}, options));
	}
	return Q.Cache.session.caches[name];
};
Q.Cache.document.caches = {};
Q.Cache.local.caches = {};
Q.Cache.session.caches = {};

/**
 * Functions related to IndexedDB, when it is available
 * @class Q.IndexedDB
 * @constructor
 * @param {String} uriString
 */
Q.IndexedDB = {
	/**
	 * Creates or uses an existing database and object store name.
	 * @static
	 * @method open
	 * @param {String} dbName The name of the database
	 * @param {String} storeName The name of the object store name inside the database
	 * @param {String} keyPath The key path inside the object store
	 * @param {Function} callback Receives (error, ObjectStore)
	 * @param {Number} [version=1] The version of the database to open
	 * @return {Q.Promise}
	 */
	open: function (dbName, storeName, keyPath, callback, version) {
		if (!root.indexedDB) {
			return false;
		}
		var open = indexedDB.open(dbName, version || 1);
		open.onupgradeneeded = function() {
			var db = open.result;
			var store = db.createObjectStore(storeName, {keyPath: keyPath});
		};
		open.onerror = function (error) {
			callback && callback(error);
		};
		open.onsuccess = function() {
			// Start a new transaction
			var db = open.result;
			var tx = db.transaction(storeName, "readwrite");
			var store = tx.objectStore(storeName);
			callback && callback(null, store);
			// Close the db when the transaction is done
			tx.oncomplete = function() {
				db.close();
			};
		}
	},
	put: function (store, value, onSuccess, onError) {
		if (!onError) {
			onError = function () {
				throw new Q.Error("Q.IndexedDB.put error:" + request.errorCode);
			}
		}
		var request = store.put(value);
		request.onsuccess = onSuccess;
		request.onError = onError;
	},
	get: function (store, key, onSuccess, onError) {
		if (!onError) {
			onError = function () {
				throw new Q.Error("Q.IndexedDB.get error:" + request.errorCode);
			}
		}
		var request = store.get(key);
		request.onsuccess = function (event) {
			Q.handle(onSuccess, Q.IndexedDB, [event.target.result, event]);
		};
		request.onError = onError;
	}
};
Q.IndexedDB.open = Q.promisify(Q.IndexedDB.open);

/**
 * A constructor to create Q.Page objects
 * @class Q.Page
 * @constructor
 * @param {String} uriString
 */
Q.Page = function (uriString) {
	this.uriString = uriString;
};

/**
 * Pushes a url onto the history stack via pushState with a fallback to hashChange,
 * to be handled later by either the Q_popStateHandler or the Q_hashChangeHandler.
 * @static
 * @method push
 * @param {String} url The url to push
 * @param {String} [title=null] The title to go with the url, to override current title
 */
Q.Page.push = function (url, title) {
	var currentUrl = location.pathname + location.search + location.hash;
	if (location.href === url || currentUrl === url || currentUrl === '/' + url) {
		return null; // already here
	}
	var prevUrl = location.href;
	url = Q.url(url);
	var baseUrl = Q.baseUrl();
	if (!url.startsWith(baseUrl)) {
		return false;
	}
	var parts = url.split('#');
	var path = (url.substr(Q.baseUrl().length+1) || '');
	if (history.pushState) {
		if (typeof title === 'string') {
			history.pushState({}, title, url);	
		} else {
			history.pushState({}, null, url);
		}
	} else {
		var hash = '#!url=' + encodeURIComponent(path) +
			location.hash.replace(/#!url=[^&]*/, '')
				.replace(/&!url=[^&]*/, '')
				.replace(/&column=[^&]+/, '')
				.replace(/#column=[^&]+/, '');
		if (parts[1]) {
			hash += ('&'+parts[1])
				.replace(/&!url=[^&]*/, '')
				.replace(/&column=[^&]+/, '');
		}
		if (location.hash !== hash) {
			Q_hashChangeHandler.ignore = true;
			location.hash = hash;
		}
	}
	if (typeof title === 'string') {
		document.title = title;
	}
	Q_hashChangeHandler.currentUrl = url.split('#')[0];
	Q_hashChangeHandler.currentUrlTail = Q_hashChangeHandler.currentUrl
		.substr(baseUrl.length + 1);
	Q.info.url = url;
	Q.handle(Q.Page.onPush, Q, [url, title, prevUrl]);
};

Q.Page.onPush = new Q.Event();

Q.Page.currentUrl = function () {
	var url = location.hash.queryField('url');
	return url ? Q.url(url) : location.href.split('#')[0];
};

/**
 * Whether a page is currently being loaded
 * @property {boolean} beingLoaded
 */
Q.Page.beingLoaded = false;
/**
 * Whether a page is currently being activated
 * @property {boolean} beingActivated
 */
Q.Page.beingActivated = false;
/**
 * Whether we are currently in the process of unloading the existing page,
 * and then loading and activating the new page.
 * @property {boolean} beingProcessed
 */
Q.Page.beingProcessed = false;

/**
 * Occurs when the page has begun to load
 * @event onLoad
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onLoad = Q.Event.factory(null, [""]);
/**
 * Occurs after the page is activated
 * @event onActivate
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onActivate = Q.Event.factory(null, [""]);
/**
 * Occurs after the page unloads
 * @event onUnload
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onUnload = Q.Event.factory(null, [""]);
/**
 * Occurs before the page unloads
 * @event beforeUnload
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.beforeUnload = Q.Event.factory(null, [""]);

/**
 * @class Q
 */

/**
 * Use this function to set handlers for when the page is loaded or unloaded.
 * @static
 * @method page
 * @param {String|Array|Object} page "$Module/$action" or a more specific URI string, or "" to handle all pages
 * @param {Function} handler A function to run after the page loaded.
 *  If the page is already currently loaded (i.e. it is the latest loaded page)
 *  then the handler is run right away.
 *  The handler can optionally returns another function, which will be run when the page is unloaded.
 *  After a page is unloaded, all the "unloading" handlers added in this way are removed, so that
 *  the next time the "loading" handlers run, they don't create duplicate "unloading" handlers.
 * @param {String} key Use this to identify the entity setting the handler, e.g. "Users/authorize".
 *  If the key is undefined, it will be automatically set to "Q". To force no key, pass null here.
 *  Since "loading" handlers are not automatically removed, they can accumulate if the key was null.
 *  For example, if an AJAX call would execute Javascript such as Q.page(uri, handler, null),
 *  this could lead to frustrating bugs as event handlers are registered multiple times, etc.
 */
Q.page = function _Q_page(page, handler, key) {
	if (key === undefined) {
		key = 'Q';
	}
	if (Q.isArrayLike(page)) {
		for (var i = 0, l = page.length; i<l; ++i) {
			Q.page(page[i], handler, key);
		}
		return;
	}
	if (Q.isPlainObject(page)) {
		for (var k in page) {
			Q.page(k, page[k], key);
		}
		return;
	}
	if (typeof handler !== 'function') {
		return;
	}
	Q.Page.onActivate(page)
	.add(function Q_onPageActivate_handler(url, options) {
		var unload = handler.call(
			Q, Q.Page.beforeUnload("Q\t"+page), url, options
		);
		if (unload && typeof unload === "function") {
			Q.Page.beforeUnload("Q\t"+page).set(unload, key);
		}
	}, key);
};

/**
 * Initialize the Q javascript platform
 * @static
 * @method init
 * @param {Object} options
 *  Supports the following options:
 *  "isLocalFile": defaults to false. Set this to true if you are calling Q.init from local file:/// context.
 */
Q.init = function _Q_init(options) {
	if (Q.init.called) {
		return false;
	}
	Q.init.called = true;
	Q.info.imgLoading = Q.info.imgLoading || Q.url('{{Q}}/img/throbbers/loading.gif');
	Q.loadUrl.options.slotNames = Q.info.slotNames;
	_detectOrientation();
	Q.addEventListener(root, 'unload', Q.onUnload.handle);
	Q.addEventListener(root, 'online', Q.onOnline.handle);
	Q.addEventListener(root, 'offline', Q.onOffline.handle);
	Q.addEventListener(root, Q.Visual.focusout, _onPointerBlurHandler);
	var checks = ["init", "ready"];
	if (Q.ServiceWorker.started) {
		checks.push("serviceWorker");
	}
	if (_isCordova) {
		checks.push("device");
	}
	var p = Q.pipe(checks, 1, function _Q_init_pipe_callback() {
		if (!Q.info) Q.info = {};
		Q.info.isCordova = !!Q.info.isCordova;
		if (options && options.isLocalFile) {
			Q.info.isLocalFile = true;
			Q.handle.options.loadUsingAjax = true;
		}
		if (Q.info.isCordova && !Q.cookie('Q_cordova')) {
			Q.cookie('Q_cordova', 'yes');
		}

		function _ready() {
			Q.handle(navigator.onLine ? Q.onOnline : Q.onOffline);
			Q.ready();
		}

		var baseUrl = Q.baseUrl();
		if (options && options.isLocalFile) {
			Q.loadUrl(baseUrl, {
				ignoreHistory: true,
				skipNonce: true,
				onActivate: _getJSON,
				handler: function () {},
				slotNames: ["cordova"]
			});
		} else {
			_ready();
		}
	});

	function _domReady() {
		p.fill("ready")();
	}

	function _waitForDeviceReady() {
		if (checks.indexOf("device") < 0) {
			return;
		}
		function _Q_init_deviceready_handler() {
			if (!Q.info) Q.info = {};
			Q.info.isCordova = true;
			// avoid opening external urls in app window
			Q.addEventListener(document, "click", function (e) {
				var t = e.target, s;
				do {
					if (t && t.nodeName === "A" && t.href && !t.outerHTML.match(/\Whref=[',"]#[',"]\W/) && t.href.match(/^https?:\/\//)) {
						e.preventDefault();
						s = t.target && (t.target === "_blank" ? "_blank" : "_system");
						root.open(t.href, s, "location=no");
					}
				} while ((t = t.parentNode));
			});
			p.fill("device")();
		}
		if (root.device) {
			_Q_init_deviceready_handler();
		} else {
			Q.addEventListener(document, 'deviceready', _Q_init_deviceready_handler, false);
		}
	}

	function _waitForServiceWorker() {
		Q.ServiceWorker.onActive.addOnce(p.fill('serviceWorker'), 'Q');
	}

	// Bind document ready event
	if (root.jQuery) {
		Q.jQueryPluginPlugin();
		Q.onJQuery.handle(jQuery, [jQuery]);
		jQuery(document).ready(_domReady);
	} else {
		document.addEventListener("DOMContentLoaded", _domReady);
		var _timer = setInterval(function() { // for old browsers
			if (/loaded|complete/.test(document.readyState)) {
				clearInterval(_timer);
				_domReady();
			}
		}, 10);
	}
	
	if (_isCordova) {
		_waitForDeviceReady();
	}
	if (Q.ServiceWorker.started) {
		_waitForServiceWorker();
	}
	Q.handle(Q.beforeInit);
	
	// Time to call all the onInit handlers
	var p2 = Q.pipe();
	var waitFor = [];
	var urls = Q.info.urls;
	if (urls && urls.updateBeforeInit && (urls.caching || urls.integrity)) {
		waitFor.push('Q.info.urls.updateBeforeInit');
		Q.updateUrls(p2.fill('Q.info.urls.updateBeforeInit'));
	}
	if (!Q.isEmpty(Q.Text.loadBeforeInit)) {
		waitFor.push('Q.Text.loadBeforeInit');
		Q.Text.get(Q.Text.loadBeforeInit, p2.fill('Q.Text.loadBeforeInit'));
	}
	p2.add(waitFor, 1, function () {
		var preferredLanguage = Q.getObject("loggedInUser.preferredLanguage", Q.Users);
		if (preferredLanguage) {
			Q.Text.setLanguage.apply(Q.Text, [preferredLanguage]);
		}
		p.fill('init');
		Q.handle(Q.onInit, Q);
	}).run();
};

/**
 * This is called when the DOM is ready
 * @static
 * @method ready
 */
Q.ready = function _Q_ready() {
	Q.loadNonce(function readyWithNonce() {
		var baseUrl = Q.baseUrl();
		_isReady = true;
		if (Q.info.isLocalFile) {
			// This is an HTML file loaded from the local filesystem
			var url = location.hash.queryField('url');
			if (url === undefined) {
				Q.handle(baseUrl);
			} else {
				Q.handle(url.indexOf(baseUrl) == -1 ? baseUrl+'/'+url : url);
			}
			return;
		}

		// Try to add the plugin thing again
		Q.jQueryPluginPlugin();
		
		Q.onDOM.handle.call(root, root.jQuery);
		
		// This is an HTML document loaded from our server
		if (Q.info.uri && Q.info.uri.module) {
			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
			try {
				Q.Page.beingLoaded = true;
				Q.Page.onLoad('').handle();
				Q.Page.onLoad(moduleSlashAction).handle();
				if (Q.info.uriString !== moduleSlashAction) {
					Q.Page.onLoad(Q.info.uriString).handle();
				}
			} catch (e) {
				debugger; // pause here if debugging
				Q.Page.beingLoaded = false;
				throw e;
			}
		}
		Q.Page.beingLoaded = false;	

		Q.activate(document.body, undefined, function _onReadyActivate() {
			// Hash changes -- will work only in browsers that support it natively
			// see http://caniuse.com/hashchange
			Q.addEventListener(root, 'hashchange', Q.onHashChange.handle);
			
			// History changes -- will work only in browsers that support it natively
			// see http://caniuse.com/history
			Q.addEventListener(root, 'popstate', Q.onPopState.handle);

			// To support tool layouting, trigger 'layout' event
			// on browser resize and orientation change
			Q.addEventListener(root, 'resize', Q.layout);
			Q.addEventListener(root, 'orientationchange', Q.layout);
			Q.addEventListener(root, 'scroll', Q.onScroll.handle);
			_setLayoutInterval();

			// Call the functions meant to be called after ready() is done
			Q.onReady.handle.call(root, root.jQuery);

			// This is an HTML document loaded from our server
			try {
				Q.Page.beingActivated = true;
				Q.Page.onActivate('').handle(Q.info.url);
				if (Q.info && Q.info.uri) {
					var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
					Q.Page.onActivate(moduleSlashAction).handle();
					if (Q.info.uriString !== moduleSlashAction) {
						Q.Page.onActivate(Q.info.uriString).handle();
					}
				}
				Q.Page.beingActivated = false;
			} catch (e) {
				debugger; // pause here if debugging
				Q.Page.beingActivated = false;
				throw e;
			}
			
			if (location.hash.toString()) {
				Q_hashChangeHandler();
			}
		});
	});
};

/**
 * This function is called by Q to make sure that we've loaded the session nonce.
 * If you like, you can also call it yourself.
 * @static
 * @method loadNonce
 * @param {Function} callback This function is called when the nonce is loaded
 * @param {Object} context The "this" to pass to the callback
 * @param {Array} args The arguments to pass to the callback
 */
Q.loadNonce = function _Q_loadNonce(callback, context, args) {
	if (Q.nonce) {
		Q.handle(callback, context, args);
		return;
	}
	var baseUrl = Q.baseUrl();
	var p1 = baseUrl && baseUrl.parseUrl();
	var p2 = location.href.parseUrl();
	if (!p1 || p1.host !== p2.host || (p1.scheme !== p2.scheme && p2.scheme === 'https')) {
		Q.handle(callback, context, args); // nonce won't load cross-origin anyway
		return;
	}
	// make this into a getter function, and call it from here but also from Q.js
	if (Q.info.isStatic) {
		Q.request({"Q.scriptData": 1}, Q.info.isStatic, Q.info.slotNames,
		function (err, res) {
			for (var slot in response.scriptData) {
				var data = response.scriptData[slot];
				for (var k in data) {
					Q.setObject(k, data[k]);
				}
			}
		});
	}
	return _loadNonceReq(callback, context, args);
};

var _loadNonceReq = Q.getter(function (callback, context, args) {
	Q.req('Q/nonce', 'data', function _Q_loadNonce_nonceLoaded(err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			throw new Q.Error(msg);
		}
		Q.nonce = Q.nonce || Q.cookie('Q_nonce');
		if (Q.nonce) {
			Q.handle(callback, context, args);
		} else {
			// Cookie wasn't loaded. Perhaps because this is a 3rd party cookie.
			// IE should have been appeased with a P3P policy from the server.
			// Otherwise, let's try to appease old Safari-like browsers with Q.formPost.
			var action = Q.ajaxExtend(Q.action('Q/nonce'), 'data');
			Q.formPost(action, {"just": "something"}, 'post', function afterFormPost() {
				// we are hoping this returns after the form post
				Q.nonce = Q.cookie('Q_nonce');
				var reason = location.hostname.isIPAddress() ? " Saving cookies to IP address is not supported." : "";
				if (!Q.nonce) {
					alert("Our server couldn't set cookies in this browser." + reason);
				}
			});
		}
	}, {
		"method": "post",
		"skipNonce": true,
		"fields": {
			"Q.startNewSession": true
		}
	});
}, {
	cache: Q.Cache.document('Q.loadNonce', 1)
})

/**
 * This function is called by Q to make sure that we've loaded the Handlebars library
 * If you like, you can also call it yourself.
 * @static
 * @method loadHandlebars
 * @param {Function} callback This function is called when the library is loaded
 */
Q.loadHandlebars = Q.getter(function _Q_loadHandlebars(callback) {
	Q.onInit.addOnce(function () {
		Q.ensure('Handlebars', function () {
			_addHandlebarsHelpers();
			Q.handle(callback);
		});
	}, 'Q.loadHandlebars');
}, {
	cache: Q.Cache.document('Q.loadHandlebars', 1)
});

/**
 * Calculate the total number of pixels that fixed elements take up
 * from the given side of the screen. The elements are found by simply
 * looking for the class 'Q_fixed_' + from, which should have been added to them.
 * @param {String} [from='top'] can also be 'bottom', 'left', 'right'
 * @param {Array|HTMLElement,Function} [filter]
 *  Can pass an array of (class names to avoid, and elements to restrict to their siblings)
 *  or a function which takes a string and returns Boolean of whether to use the element.
 * @return {Number}
 */
Q.fixedOffset = function (from, filter) {
	var elements = document.body.getElementsByClassName('Q_fixed_'+from);
	var result = 0;
	Q.each(elements, function () {
		if (Q.isArrayLike(filter)) {
			var classes = this.className.split(' ');
			if (false === Q.each(filter, function (i, item) {
				if (item instanceof HTMLElement) {
					if (false !== Q.each(this.parentNode.childNodes, function () {
						if (this === filter) {
							return false;
						}
					})) {
						return false;
					}
				} else if (typeof item === 'string') {
					if (classes.indexOf(item) >= 0) {
						return false;
					}
				}
			})) {
				return;
			}
		}
		if (typeof filter === 'function' && !filter.apply(this)) {
			return;
		}
		var rect = this.getBoundingClientRect();
		switch (from) {
			case 'top':
			case 'bottom':
				result += rect.height;
				break;
			case 'left': 
			case 'right':
				result += rect.width;
				break;
			default:
				return;
		}
	});
	return result;
};

/**
 * Remove an element from the DOM and try to clean up memory as much as possible
 * @static
 * @method removeElement
 * @param {HTMLElement|Array} element, or array of elements, or object of elements
 * @param {boolean} removeTools whether to properly remove the tools before removing the element
 */
Q.removeElement = function _Q_removeElement(element, removeTools) {
	if (Q.isArrayLike(element)) {
		return Q.each(element, function () {
			Q.removeElement(this, removeTools);
		});
	}
	if (removeTools) {
		Q.Tool.remove(element);
	}
	for (var i=0, l=_layoutElements.length; i<l; ++i) {
		var p = _layoutElements[i];
		do {
			if (p === element) {
				_layoutElements.splice(i, 1);
				_layoutEvents.splice(i, 1);
				--i; --l;
				break;
			}
		} while (p = p.parentNode);
	}
	if (root.jQuery) {
		// give jQuery a chance to do its own cleanup
		return jQuery(element).remove();
	}
	if (!element.parentNode) return false;
	element.parentNode.removeChild(element);
	try {
		for (var prop in element) {
			delete element[prop];
		}
	} catch (e) {
		// Old IE doesn't like this
	}
};

/**
 * A class for detecting user browser parameters.
 * @class Q.Browser
 */
Q.Browser = {

	/**
	 * The only public method, detect() returns a hash consisting of these elements:
	 * "name": Name of the browser, can be 'mozilla' for example.
	 * "mainVersion": Major version of the browser, digit like '9' for example.
	 * "OS": Browser's operating system. For example 'windows'.
	 * "engine": Suggested engine of the browser, can be 'gecko', 'webkit' or some other.
	 * @static
     * @method detect
     * @return {Object}
	 */
	detect: function() {
		var data = this.searchData(this.dataBrowser);
		var browser = (data && data.identity) || "An unknown browser";
		
		var version = (this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version").toString();
		var dotIndex = version.indexOf('.');
		var mainVersion = version.substring(0, dotIndex != -1 ? dotIndex : version.length);
		var OSdata = this.searchData(this.dataOS);
		var OS = (OSdata && OSdata.identity) || "an unknown OS";
		var engine = '', ua = navigator.userAgent.toLowerCase();
		if (ua.indexOf('webkit') != -1) {
			engine = 'webkit';
		} else if (ua.indexOf('gecko') != -1) {
			engine = 'gecko';
		} else if (ua.indexOf('presto') != -1) {
			engine = 'presto';
		}
		var isWebView = /(.*)QWebView(.*)/.test(navigator.userAgent)
			|| (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Version)/i).test(navigator.userAgent);
		var isStandalone = navigator.standalone
			|| (root.matchMedia && root.matchMedia('(display-mode: standalone)').matches)
			|| (root.external && external.msIsSiteMode && external.msIsSiteMode())
			|| false;
		if (OS === 'Android') {
			var w = screen.width-document.documentElement.clientHeight;
			var h = screen.height-document.documentElement.clientHeight;
			isStandalone = (0<h && h<40)|| (0<w && w<40);
		}
		if (/(.*)QWebView(.*)/.test(navigator.userAgent)) {
			isStandalone = false;
		}
		var name = browser.toLowerCase();
		var prefix;
		switch (engine) {
			case 'webkit': prefix = '-webkit-'; break;
			case 'gecko': prefix = '-moz-'; break;
			case 'presto': prefix = '-o-'; break;
			default: prefix = '';
		}
		prefix = (name === 'explorer') ? '-ms-' : prefix;
		return {
			name: name,
			mainVersion: mainVersion,
			prefix: prefix,
			OS: OS.toLowerCase(),
			engine: engine,
			device: OSdata && OSdata.device,
			isWebView: isWebView,
			isStandalone: isStandalone,
			isCordova: _isCordova
		};
	},
	
	searchData: function(data) {
		for (var i=0, l=data.length; i<l; i++) {
			var dataString = data[i].string;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (navigator.userAgent.indexOf(data[i].subString) != -1) {
					return data[i];
				}
			}
		}
	},
	
	searchVersion : function(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1)
			return;
		return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
	},
	
	dataBrowser : [
		{
			string : navigator.userAgent,
			subString : "MSIE",
			identity : "Explorer",
			versionSearch : "MSIE"
		},
		{
			string : navigator.userAgent,
			subString : "Chrome",
			identity : "Chrome"
		},
		{
			string : navigator.userAgent,
			subString : "OmniWeb",
			versionSearch : "OmniWeb/",
			identity : "OmniWeb"
		},
		{
			string : navigator.vendor,
			subString : "Apple",
			identity : "Safari",
			versionSearch : "Version"
		},
		{
			prop : root.opera,
			identity : "Opera",
			versionSearch : "Version"
		},
		{
			string : navigator.vendor,
			subString : "iCab",
			identity : "iCab"
		},
		{
			string : navigator.vendor,
			subString : "KDE",
			identity : "Konqueror"
		},
		{
			string : navigator.userAgent,
			subString : "Firefox",
			identity : "Firefox"
		},
		{
			string : navigator.vendor,
			subString : "Camino",
			identity : "Camino"
		},
		{ // for newer Netscapes (6+)
			string : navigator.userAgent,
			subString : "Netscape",
			identity : "Netscape"
		},
		{
			string : navigator.userAgent,
			subString : "Gecko",
			identity : "Mozilla",
			versionSearch : "rv"
		},
		{ // for older Netscapes (4-)
			string : navigator.userAgent,
			subString : "Mozilla",
			identity : "Netscape",
			versionSearch : "Mozilla"
		}
	],

	dataOS : [
		{
			string : navigator.userAgent,
			subString : "iPhone",
			identity : "iOS",
			device: "iPhone"
		},
		{
			string : navigator.userAgent,
			subString : "iPod",
			identity : "iOS",
			device: "iPod"
		},
		{
			string : navigator.userAgent,
			subString : "iPad",
			identity : "iOS",
			device: "iPad"
		},
		{
			string : navigator.userAgent,
			subString : "Android",
			identity : "Android"
		},
		{
			string : navigator.platform,
			subString : "RIM",
			identity : "BlackBerry"
		},
		{
			string : navigator.platform,
			subString : "Win",
			identity : "Windows"
		},
		{
			string : navigator.platform,
			subString : "Mac",
			identity : "Mac"
		},
		{
			string : navigator.platform,
			subString : "Linux",
			identity : "Linux"
		},
		{
			string : navigator.platform,
			subString : "BSD",
			identity : "FreeBSD"
		},
	],
	
	getScrollbarWidth: function() {
		if (Q.Browser.scrollbarWidth) {
			return Q.Browser.scrollbarWidth;
		}
		var inner = document.createElement('p');
		inner.style.width = '100%';
		inner.style.height = '200px';
		
		var outer = document.createElement('div');
		Q.each({
			'position': 'absolute',
			'top': '0px',
			'left': '0px',
			'visibility': 'hidden',
			'width': '200px',
			'height': '150px',
			'overflow': 'hidden'
		}, function (k, v) {
			outer.style[k] = v;
		});
		outer.appendChild(inner);
		document.body.appendChild(outer);

		var w1 = parseInt(inner.offsetWidth);
		outer.style.overflow = 'scroll';
		var w2 = parseInt(inner.offsetWidth);
		if (w1 == w2) {
			w2 = outer.clientWidth;
		}

		Q.removeElement(outer);
		
		return Q.Browser.scrollbarWidth = w1 - w2;
	},

	getScrollbarHeight: function() {
		return this.getScrollbarWidth();
	}
	
};

var _supportsPassive;

/**
 * Add an event listener to an element, but with more features than Element.prototype.addEventListener()
 * You can pass this event listener also to the corresponding Q.removeEventListener(), but
 * only if you call addEventListener once per eventHandler. Otherwise, you should use this function's return value
 * in calls to Q.removeEventListener().
 * @static
 * @method addEventListener
 * @param {HTMLElement} element
 *  An HTML element, window or other element that supports listening to events
 * @param {String|Array|Object|Function} eventName
 *  A space-delimited string of event names, or an array of event names.
 *  You can also pass an object of { eventName: eventHandler } pairs, in which csae
 *  the next parameter would be useCapture.
 *  You can also pass functions such as Q.Visual.start here.
 * @param {Function} eventHandler
 *  A function to call when the event fires
 * @param {boolean|Object} useCapture
 *  Whether to use the capture instead of bubble phase. Ignored in IE8 and below.
 *  You can also pass {passive: true} and other such things here.
 * @param {boolean} hookStopPropagation
 *  Whether to override Event.prototype.stopPropagation in order to capture the event even
 *  when a descendant of the element tries to prevent.
 * @return {Function} the wrapper function to pass to corresponding Q.removeEventListener
 */
Q.addEventListener = function _Q_addEventListener(element, eventName, eventHandler, useCapture, hookStopPropagation) {
	useCapture = useCapture || false;
	if (Q.isPlainObject(eventName)) {
		for (var k in eventName) {
			Q.addEventListener(element, k, eventName[k], eventHandler);
		}
		return;
	}
	function _Q_addEventListener_wrapper(e) {
		Q.handle(eventHandler, element, [e]);
	}
	var handler = (eventHandler.typename === "Q.Event"
		? (eventHandler.eventListener = _Q_addEventListener_wrapper)
		: eventHandler);
	if (typeof eventName === 'string') {
		var split = eventName.trim().split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (Q.isPlainObject(useCapture)) {
		// Test via a getter in the options object to see if the passive property is accessed
		if (_supportsPassive === undefined) {
			_supportsPassive = false;
			if (Object.defineProperty) {
				try {
					var opts = Object.defineProperty({}, 'passive', {
						get: function() {
							_supportsPassive = true;
						}
					});
					window.addEventListener("Qtest", _f, opts);
					window.removeEventListener("Qtest", _f);
				} catch (e) {}
			}
		}
		useCapture = _supportsPassive ? useCapture : useCapture.capture;
	}
	if (typeof eventName === 'function') {
		var params = {
			original: eventHandler
		};
		var wrapper = eventName ( params );
		if (!('eventName' in params)) {
			throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
		}
		eventHandler.Q_wrapper = handler = wrapper;
		eventName = wrapper.eventName = params.eventName;
	}
	if (!eventName) {
		return;
	}

	if (Q.isArrayLike(eventName)) {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.addEventListener(element, eventName[i], eventHandler, useCapture, hookStopPropagation);
		}
		return;
	}
	if (element === root
	&& detected.name === 'explorer'
	&& detected.mainVersion <= 8
	&& ['mousedown','mouseup','click','dblclick'].indexOf(eventName) >= 0) {
		element = document;
	}
	if (element.addEventListener) {
		element.addEventListener(eventName, handler, useCapture);
	} else if (element.attachEvent) {
		element.attachEvent('on'+eventName, handler);
	} else {
		eventName = eventName.toLowerCase();
		element["on"+eventName] = function () {
			if (element["on"+eventName]) {
				element["on"+eventName].apply(this, arguments);
			}
			handler.apply(this, arguments);
		}; // best we can do
	}
	
	if (hookStopPropagation) {
		var args = [element, eventName, eventHandler, useCapture];
		var hooks = Q.addEventListener.hooks;
		for (var i=0, l=hooks.length; i<l; ++i) {
			var hook = hooks[i];
			if (hook[0] === element
			&& hook[1] === eventName
			&& hook[2] === eventHandler
			&& hook[3] === useCapture) {
				hooks.splice(i, 1);
				break;
			}
		}
		hooks.push(args);
	}
	function _f() { }
	return handler;
};
Q.addEventListener.hooks = [];
function _Q_Event_stopPropagation() {
	var event = this;
	Q.each(Q.addEventListener.hooks, function () {
		var element = this[0];
		var matches = element === root
		|| element === document
		|| (element instanceof Element
			&& element !== event.target
		    && element.contains(event.target));
		if (matches && this[1] === event.type) {
			this[2].apply(element, [event]);
		}
	});
	var p = _Q_Event_stopPropagation.previous;
	if (p) {
		p.apply(event, arguments);
	} else {
		event.cancelBubble = false;
	}
}
_Q_Event_stopPropagation.previous = Event.prototype.stopPropagation;
Event.prototype.stopPropagation = _Q_Event_stopPropagation;

/**
 * Remove an event listener from an element
 * @static
 * @method removeEventListener
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Function} eventHandler
 * @param {boolean} useCapture
 * return {boolean} Should normally return true, unless listener could not be found or removed
 */
Q.removeEventListener = function _Q_removeEventListener(element, eventName, eventHandler, useCapture) {
	if (Q.isEmpty(element)) {
		return false;
	}

	useCapture = useCapture || false;
	var handler = (eventHandler.typename === "Q.Event"
		? eventHandler.eventListener
		: eventHandler);
	if (handler.Q_wrapper) {
		handler = handler.Q_wrapper;
	}
	if (typeof eventName === 'string') {
		var split = eventName.split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (Q.isArrayLike(eventName)) {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.removeEventListener(element, eventName[i], eventHandler, useCapture);
		}
		return;
	}
	if (!eventHandler) {
		return false;
	}
	if (typeof eventName === 'function') {
		var params = {
			original: function () {}
		};
		eventName(params);
		eventName = params.eventName;
		if (!eventName) {
			return false;
		}
	}
	if (element === root
	&& detected.name === 'explorer'
	&& detected.mainVersion <= 8
	&& ['mousedown','mouseup','click','dblclick'].indexOf(eventName) >= 0) {
		element = document;
	}
	if (element.removeEventListener) {
		element.removeEventListener(eventName, handler, false);
	} else if (element.detachEvent) {
		element.detachEvent('on'+eventName, handler);
	} else {
		element["on"+eventName] = null; // best we can do
	}
	var hooks = Q.addEventListener.hooks;
	for (var i=hooks.length-1; i>=0; --i) {
		var hook = hooks[i];
		if (hook[0] === element
		&& hook[1] === eventName
		&& hook[2] === eventHandler
		&& hook[3] === useCapture) {
			hooks.splice(i, 1);
			break;
		}
	}
	return true;
};

/**
 * Call this function to set a notice that is shown when the page is almost about to be unloaded
 * @static
 * @method beforeUnload
 * @param notice {String} The notice to set. It should typically be worded so that "Cancel" cancels the unloading.
 * @required
 */
Q.beforeUnload = function _Q_beforeUnload(notice) {
	Q.addEventListener(window, 'beforeunload', function (e) {
		if (!notice) return undefined;
		e = e || window.event;
		if (e) { // For IE and Firefox (prior to 4)
			e.preventDefault(); // for newer browsers, but ignores notice
			e.returnValue = notice;
		}
		return notice; // For Safari and Chrome
	});
};

/**
 * Triggers a method or Q.Event on all the tools inside a particular element,
 * traversing in a depth-first manner.
 * @static
 * @method trigger
 * @param {String} eventName  Required, the name of the method or Q.Event to trigger
 * @required
 * @param {HTMLElement} element Optional element to traverse from (defaults to document.body).
 * @param {Array} args Any additional arguments that would be passed to the triggered method or event
 */
Q.trigger = function _Q_trigger(eventName, element, args) {
	var parts = eventName.split('.');
	Q.find(element || document.body, true, function _Q_trigger_found(toolElement) {
		_Q_trigger_recursive(Q.Tool.from(toolElement), eventName, args);
		return false;
	}, null);
};

/**
 * Call this function to trigger layout changes,
 * or assign it as an event listener to some events.
 * @param {Element} [element=document.documentElement]
 *  For any elements inside this container that Q.onLayout() was called on,
 *  handle the corresponding Q.Events, and trigger "Q.layout" methods, if any,
 *  on container elements.
 *  If a non-element is passed here (such as null, or a DOMEvent)
 *  then this defaults to the document element.
 * @param {Boolean} [force] Pass true here to handle Q.onLayout events
 *   even if ResizeObserver was added
 */
Q.layout = function _Q_layout(element, force) {
	if (!(element instanceof Element)) {
		element = null;
	}
	Q.each(_layoutElements, function (i, e) {
		if (!element || element.contains(e)) {
			var event = _layoutEvents[i];

			// return if ResizeObserver defined on this element
			if (!force && _layoutObservers[i]) {
				return;
			}

			event.handle.call(event, e, element);
		}
	});
};

/**
 * Call this to fix the iOS Safari bug where dynamically
 * added content doesn't cause the scrolling parent element
 * to start scrolling when -webkit-overflow-scrolling is enabled.
 * @param {Element} element the element to scroll into view, if needed
 * @param {Object} options see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
 * @param {String} [options.behavior] can be "auto" or "smooth"
 * @param {String} [options.block] can be "start", "center", "end" or "nearest"
 * @param {String} [options.inline] can be "start", "center", "end" or "nearest"
 * @param {Boolean} [options.unlessOffscreenHorizontally]
 * @return {Boollean} Whether the native scrollIntoView(options) was called on the element.
 */
Q.scrollIntoView = function _Q_scrollIntoView(element, options) {
	if (!element || typeof element.scrollIntoView !== 'function') {
		return false;
	}
	options = options || {};
	if (options.unlessOffscreenHorizontally) {
		var p = element, er = element.getBoundingClientRect();
		while (p = p.parentNode) {
			var pr = p.getBoundingClientRect && p.getBoundingClientRect();
			if (pr && er.left < pr.left) {
				return false;
			}
		}
		delete options.unlessOffscreenHorizontally;
	}
	element.scrollIntoView(options);
	return true;
};

/**
 * Call this to fix the iOS Safari bug where dynamically
 * added content doesn't cause the scrolling parent element
 * to start scrolling when -webkit-overflow-scrolling is enabled.
 * @param {Element} element
 */
Q.fixScrollingParent = function _Q_fixScrollingParent(element) {
	if (Q.info.platform !== 'ios') {
		return;
	}
	var scrolling = element.scrollingParent(true);
	if (!scrolling) {
		return;
	}
	var prevOverflow = scrolling.style.overflow;
	scrolling.style.overflow = 'hidden';
	setTimeout(function () {
		if (prevOverflow) {
			scrolling.style.overflow = prevOverflow;
		} else {
			scrolling.style.overflow = null;
		}
	}, 0);
};

/**
 * Returns whether Q.ready() has been called
 * @static
 * @method isReady
 * @return {boolean}
 */
Q.isReady = function _Q_isReady() {
	return _isReady;
};

/**
 * Returns whether the client is currently connected to the Internet.
 * In the future, this will not be a binary thing ;-)
 * @static
 * @method isOnline
 * @return {boolean}
 */
Q.isOnline = function _Q_isOnline() {
	return _isOnline;
};

/**
 * Loads a plugin
 * @static
 * @method load
 * @param {String|Array} plugins
 * @param {Function} callback
 * @param {Object} options
 */
Q.load = function _Q_load(plugins, callback, options) {
	var urls = [];
	if (typeof plugins === 'string') {
		plugins = plugins.split(' ').map(function (str) { return str.trim(); });
	}
	var baseUrl = Q.baseUrl();
	Q.each(plugins, function (i, plugin) {
		if (plugin && !Q.plugins[plugin]) {
			urls.push(baseUrl+'/Q/plugins/'+plugin+'/js/'+plugin+'.js');
		}
	});
	return Q.addScript(urls, callback, options);	
};

/**
 * Obtain a URL to request. Takes into account the Q_ct and Q_ut cookies
 * in order to work with Cordova file bundles, as well as Q.updateUrls()
 * @static
 * @method url
 * @param {Object|String|null} what
 *  Usually the stuff that comes after the base URL.
 *  If you don't provide this, then it just returns the Q.baseUrl()
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  Fields containing null and undefined are skipped.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} [options] A hash of options, including:
 * @param {String} [options.baseUrl] A string to replace the default base url
 * @param {Number} [options.cacheBust] Number of milliseconds before a new cachebuster is appended
 * @param {Object} [options.info] if passed, extends this object with any info about the url
 */
Q.url = function _Q_url(what, fields, options) {
	var what2 = what || '';
	if (what2.startsWith('data:') || what2.startsWith('blob:')) {
		return what2; // this is a special type of URL
	}
	var parts = what2.split('?');
	var what3, tail, info, cb;
	if (fields) {
		for (var k in fields) {
			parts[1] = (parts[1] || "").queryField(k, fields[k]);
		}
		what2 = parts[0] + (parts[1] ? '?' + parts[1] : '');
	}
	var baseUrl = (options && options.baseUrl) || Q.baseUrl();
	what3 = Q.interpolateUrl(what2);
	if (what3.isUrl()) {
		if (what3.startsWith(baseUrl)) {
			tail = what3.substr(baseUrl.length+1);
			tail = tail.split('?')[0];
			info = Q.getObject(tail, Q.updateUrls.urls, '/');
		}
	} else {
		info = Q.getObject(what3, Q.updateUrls.urls, '/');
	}
	if (info) {
		if (Q.info.urls && Q.info.urls.caching && info.t) {
			parts = what3.split('?');
			if (parts.length > 1) {
				parts[1] = parts[1].queryField('Q.cacheBust', info.t);
				what3 = parts[0] + '?' + parts[1];	
			} else {
				what3 = parts[0] + '?Q.cacheBust=' + info.t;
			}
			if (info.cacheBaseUrl && info.t < Q.cookie('Q_ct')) {
				baseUrl = info.cacheBaseUrl;
			}
		}
		if (options && options.info) {
			Q.extend(options.info, 10, info);
		}
	} else if (options && options.cacheBust) {
		cb = options.cacheBust;
		what3 += "?Q.cacheBust=" + Math.floor(Date.now()/cb)*cb;
	}
	parts = what3.split('?');
	if (parts.length > 2) {
		what3 = parts.slice(0, 2).join('?') + '&' + parts.slice(2).join('&');
	}
	var result = '';
	if (!what) {
		result = baseUrl + (what === '' ? '/' : '');
	} else if (what3.isUrl()) {
		result = what3;
	} else {
		result = baseUrl + ((what3.substr(0, 1) == '/') ? '' : '/') + what3;
	}
	if (Q.url.options.beforeResult) {
		var params = {
			what: what3,
			fields: fields,
			result: result
		};
		Q.url.options.beforeResult.handle(params);
		result = params.result;
	}
	return result;
};

Q.url.options = {
	beforeResult: null
};

/**
 * Interpolate some standard placeholders inside a url, such as 
 * {{AppName}} or {{PluginName}}
 * @static
 * @method interpolateUrl
 * @param {String} url
 * @param {Object} [additional={}] Any additional substitutions
 * @return {String} The url with substitutions applied
 */
Q.interpolateUrl = function (url, additional) {
	if (url.indexOf('{{') < 0) {
		return url;
	}
	var substitutions = {};
	substitutions['baseUrl'] = substitutions[Q.info.app] = Q.baseUrl();
	substitutions['Q'] = Q.pluginBaseUrl('Q');
	for (var plugin in Q.plugins) {
		substitutions[plugin] = Q.pluginBaseUrl(plugin);
	}
	url = url.interpolate(substitutions);
	if (additional) {
		url = url.interpolate(additional);
	}
	return url;
};

/**
 * You can override this function to do something special
 * @method pluginBaseUrl
 */
Q.pluginBaseUrl = function (plugin) {
	return 'Q/plugins/' + plugin;
};

/**
 * Get the URL for an action
 * @static
 * @method action
 * @param {String} uri
 *  A string of the form "Module/action" or an absolute url, which is returned unmodified.
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} [options] A hash of options, including:
 * @param {String} [options.baseUrl] A string to replace the default base url
 * @param {Number} [options.cacheBust] Number of milliseconds before a new cachebuster is appended
 */
Q.action = function _Q_action(uri, fields, options) {
	if (uri.isUrl()) {
		return Q.url(uri, fields);
	}
	return Q.url("action.php/"+uri, fields, options);
};

/**
 * Extends a string or object to be used with AJAX
 * @static
 * @method ajaxExtend
 * @param {String} what
 *  If a string, then treats it as a URL and
 *  appends ajax fields to the end of the querystring.
 *  If an object, then adds properties to it.
 * @param {String|Object|Array} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object or array, converts it to a comma-separated list
 * @param {Object} options
 *  Optional. A hash of options, including:
 *  * @param {String} [options.echo] A string to echo back. Used to keep track of responses
 *  * @param {String} [options.method] if set, adds a &Q.method=$method to the querystring
 *  * @param {String|Function} [options.callback] if a string, adds a "&Q.callback="+encodeURIComponent(callback) to the querystring.
 *  * @param {Boolean} [options.iframe] if true, tells the server to render the response as HTML in an iframe, which should call the specified callback
 *  * @param {String} [options.loadExtras] if 'all, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load, can also be "response", "session" or "response,session"
 *  * @param {Array} [options.idPrefixes] optional array of Q_Html::pushIdPrefix values for each slotName
 *  * @param {number} [options.timestamp] whether to include a timestamp (e.g. as a cache-breaker)
 * @return {String|Object}
 *  Returns the extended string or object
 */
Q.ajaxExtend = function _Q_ajaxExtend(what, slotNames, options) {
	if (!what && what !== '') {
		if (console && ('warn' in console)) {
			console.warn('Q.ajaxExtend received empty url');
		}
		return '';
	}
	options = options || {};
	var slotNames2 = (typeof slotNames === 'string')
		? slotNames 
		: Q.extend([], slotNames).join(',');
	var idPrefixes = options
		? ((typeof options.idPrefixes === 'string')
			? options.idPrefixes 
			: (options.idPrefixes && options.idPrefixes.join(',')))
		: '';
	var timestamp = Date.now();
	var ajax = options.iframe ? 'iframe' : 'json';
	if (typeof what == 'string') {
		var p = what.split('#');
		var what2 = p[0];
		if (Q.info && Q.baseUrl() === what2) {
			what2 += '/'; // otherwise we will have 301 redirect with trailing slash on most servers
		}
		what2 += (what2.indexOf('?') < 0) ? '?' : '&';
		what2 += 'Q.ajax=' + encodeURIComponent(ajax);
		if (options.loadExtras) {
			var loadExtras = options.loadExtras === true ? 'all' : options.loadExtras;
			what2 += '&Q.loadExtras=' + encodeURIComponent(loadExtras);
		}
		if (options.timestamp) {
			what2 += encodeURI('&Q.timestamp=')+encodeURIComponent(timestamp);
		}
		if (slotNames2 != null) {
			what2 += encodeURI('&Q.slotNames=') + encodeURIComponent(slotNames2);
		}
		if (idPrefixes) {
			what2 += encodeURI('&Q.idPrefixes=') + encodeURIComponent(idPrefixes);
		}
		if (options) {
			if (typeof options.callback === 'string') {
				what2 += encodeURI('&Q.callback=') + encodeURIComponent(options.callback);
			}
			if ('echo' in options) {
				what2 += encodeURI('&Q.echo=') + encodeURIComponent(options.echo);
			}
			if (options.method) {
				what2 += encodeURI('&Q.method=' + encodeURIComponent(options.method.toUpperCase()));
			}
		}
		if (Q.nonce !== undefined) {
			what2 += encodeURI('&Q.nonce=') + encodeURIComponent(Q.nonce);
		}
		what2 = (p[1] ? what2 + '#' + p[1] : what2);
	} else {
		// assume it's an object
		var what2 = {};
		for (var k in what) {
			what2[k] =  what[k];
		}
		what2["Q.ajax"] = ajax;
		if (options.timestamp) {
			what2["Q.timestamp"] = timestamp;
		}
		if (slotNames) {
			what2["Q.slotNames"] = slotNames2;
		}
		if (options) {
			if (options.callback) {
				what2["Q.callback"] = options.callback;
			}
			if ('echo' in options) {
				what2["Q.echo"] = options.echo;
			}
			if (options.method) {
				what2["Q.method"] = options.method;
			}
		}
		if ('nonce' in Q) {
			what2["Q.nonce"] = Q.nonce;
		}
	}
	return what2;
};

/**
 * The easiest way to make direct web service requests in Q
 * @see Q.request
 * @static
 * @method req
 * @param {String} uri
 *  A string of the form "Module/action"
 * @param {String|Array} slotNames
 *  If a string, expects a comma-separated list of slot names.
 *  If an array, converts it to a comma-separated list.
 * @param {Function} callback
 *  The err and parsed content will be passed to this callback function,
 *  (unless parse is false, in which case the raw content is passed as a String),
 *  followed by a Boolean indicating whether a redirect was performed.
 * @param {Object} options
 *  A hash of options, to be passed to Q.request and Q.action (see their options).
 * @return {Q.Request} Object corresponding to the request
 */
Q.req = function _Q_req(uri, slotNames, callback, options) {
	if (typeof options === 'string') {
		options = {'method': options};
	}
	var args = arguments, index = (typeof arguments[0] === 'string') ? 0 : 1;
	args[index] = Q.action(args[index], null, options);
	return Q.request.apply(this, args);
};

/**
 * A way to make requests that is cross-domain. Typically used for requesting JSON or various templates.
 * It uses script tags and JSONP callbacks for remote domains, and prefers XHR for the local domain.
 * @static
 * @method request
 * @param {Object} [fields]
 *  Optional object of fields to pass, syntactic sugar for adding fields to GET requests
 * @param {String} url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param {String|Array} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an array, converts it to a comma-separated list
 * @param {Function} callback
 *  The err and parsed content will be passed to this callback function,
 *  (unless parse is false, in which case the raw content is passed as a String),
 *  followed by a Boolean indicating whether a redirect was performed.
 * @param {Object} options
 *  A hash of options, including options that would be passed to Q.url(), but also these:
 * @param {String} [options.method="GET"] the HTTP method to use. If not "GET" and options.form is set, adds to url &Q.method= that value to the querystring, and uses POST method.
 * @param {Object} [options.fields] optional fields to pass with any method other than "get"
 * @param {Object} [options.formdata] if set, instead of fields, submits the formdata (including multipart form-data such as files, etc.) 
 * @param {HTMLElement} [options.form] if specified, then the request is made by submitting this form, temporarily extending it with any fields passed in options.fields, and possibly overriding its method with whatever is passed to options.method .
 * @param {String} [options.resultFunction="result"] The path to the function to handle inside the
 *  contentWindow of the resulting iframe, e.g. "Foo.result". 
 *  Your document is supposed to define this function if it wants to return results to the
 *  callback's second parameter, otherwise it will be undefined
 * @param {Array} [options.idPrefixes] optional array of Q_Html::pushIdPrefix values for each slotName
 * @param {boolean} [options.skipNonce] if true, skips loading of the nonce
 * @param {Object} [options.xhr] set to false to avoid XHR. Or set to true, to try to make xhr based on "method" option.
 *	 Or pass an object with properties to merge onto the xhr object, including a special "sync" property to make the call synchronous.
 *	 Or pass a function which will be run before .send() is executed. First parameter is the xhr object, second is the options.
 * @param {Function} [options.preprocess] an optional function that takes the xhr object before the .send() is invoked on it
 * @param {boolean} [options.parse] set to false to pass the unparsed string to the callback
 * @param {boolean} [options.extend=true] if false, the URL is not extended with Q fields.
 * @param {String} [options.loadExtras=null] if "all", asks the server to load any extra scripts, stylesheets, etc. that are loaded on first page load. Can also be "request", "session" or "request,session"
 * @param {boolean} [options.query=false] if true simply returns the query url without issuing the request
 * @param {String} [options.callbackName] if set, the URL is not extended with Q fields and the value is used to name the callback field in the request.
 * @param {boolean} [options.duplicate=true] you can set it to false in order not to fetch the same url again
 * @param {boolean} [options.quiet=true] this option is just passed to your onLoadStart/onLoadEnd handlers in case they want to respect it.
 * @param {boolean} [options.timestamp] whether to include a timestamp (e.g. as a cache-breaker)
 * @param {Function} [options.onRedirect=Q.handle] if set and response data.redirect.url is not empty, automatically call this function.
 * @param {boolean} [options.timeout=5000] milliseconds to wait for response, before showing cancel button and triggering onTimeout event, if any, passed to the options
 * @param {Array} [options.beforeRequest] array of handlers to call before the request, they receive url, slotNames, options, callback and must call the callback passing (possibly altered) url, slotNames, options
 * @param {Q.Event} [options.onTimeout] handler to call when timeout is reached. First argument is a function which can be called to cancel loading.
 * @param {Q.Event} [options.onResponse] handler to call when the response comes back but before it is processed
 * @param {Q.Event} [options.onProcessed] handler to call when a response was processed
 * @param {Q.Event} [options.onLoadStart] handlers of this event will be called after the request is initiated, if "quiet" option is false they can add some visual indicators
 * @param {Q.Event} [options.onLoadEnd] handlers of this event will be called after the request is fully completed, if "quiet" option is false they can add some visual indicators
 * @return {Q.Request} Object corresponding to the request
 */
Q.request = function (url, slotNames, callback, options) {
	
	var fields, delim;
	if (typeof url === 'object') {
		fields = arguments[0];
		url = arguments[1];
		slotNames = arguments[2];
		callback = arguments[3];
		options = arguments[4];
		delim = (url.indexOf('?') < 0) ? '?' : '&';
		url += delim + Q.queryString(fields);
	}
	url = Q.url(url, null, options);
	if (typeof slotNames === 'function') {
		options = callback;
		callback = slotNames;
		slotNames = [];
	} else if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	var o = Q.extend({}, Q.request.options, options);
	var request = new Q.Request(url, slotNames, callback, o);
	if (o.skipNonce) {
		_Q_Response_makeRequest.call(this, url, slotNames, callback, o);
	} else {
		Q.loadNonce(_Q_Response_makeRequest, this, [url, slotNames, callback, o]);
	}
	return request;
	
	function _Q_Response_makeRequest (url, slotNames, callback, o) {

		var tout = false, t = {};
		if (o.timeout !== false) {
			tout = o.timeout || Q.request.options.timeout;
		}
	
		function _Q_Response_callback(err, content, wasJSONP) {
			if (err) {
				Q.handle(callback, this, [err, content, false]);
				Q.handle(o.onProcessed, this, [err, content, false]);
				return;
			}
			var response = content;
			if (o.parse !== false) {
				try {
					if (wasJSONP) {
						response = content;
					} else {
						response = JSON.parse(content)
					}
				} catch (e) {
					console.warn('Q.request(' + url + ',['+slotNames+']):' + e);
					err = {"errors": [e]};
					callback(e, content);
					return Q.handle(o.onProcessed, this, [e, content]);
				}
			}
			var redirected = false;
			if (response && response.redirect && response.redirect.url) {
				Q.handle(o.onRedirect, Q, [response.redirect.url]);
				redirected = response.redirect.url;
			}
			callback && callback.call(this, err, response);
			Q.handle(o.onProcessed, this, [err, response]);
		};

		function _onStart () {
			Q.handle(o.onLoadStart, this, [url, slotNames, o]);
			if (tout !== false) {
				t.timeout = setTimeout(_onTimeout, tout);
			}
		}

		function _onTimeout () {
			if (!t.loaded) {
				Q.handle(o.onShowCancel, this, [_onCancel, o]);
				if (o.onTimeout) {
					o.onTimeout(_onCancel);
				}
			}
		}

		function _onResponse (response, wasJSONP) {
			t.loaded = true;
			if (t.timeout) {
				clearTimeout(t.timeout);
			}
			Q.handle(o.onLoadEnd, request, [url, slotNames, o]);
			if (!t.cancelled) {
				o.onResponse.handle.call(request, response, wasJSONP);
				_Q_Response_callback.call(request, null, response, wasJSONP);
			}
		}
		
		function _onCancel (status, msg) {
			var code, data;
			if (_documentIsUnloading) { // the document is about to go poof anyway
				return; // don't call any callbacks, avoiding possible alerts
			}
			status = Q.isInteger(status) ? status : null;
			if (this.response) {
				try {
					data = JSON.parse(this.response);
					msg = Q.getObject(['errors', 0, 'message'], data);
					code = Q.getObject(['errors', 0, 'code'], data);
				} catch (e) {
					data = null;
					msg = "Response is not in JSON format";
					console.warn('Q.request(' + url + ',['+slotNames+']): ' + msg);
				}
			}
			if (!msg) {
				var defaultError = status ? Q.text.Q.request.error : Q.text.Q.request.canceled;
				msg = (msg || Q.text.Q.request[status] || defaultError)
					.interpolate({'status': status, 'url': url})
			}
			t.cancelled = true;
			_onResponse();
			var errors = {
				errors: [{
					message: msg || "Request was canceled",
					code: code || status,
					httpStatus: status
				}]
			};
			o.onCancel.handle.call(this, errors, o);
			_Q_Response_callback.call(this, errors, errors);
		}
		
		function xhr(onSuccess, onCancel) {
			if (o.extend !== false) {
				url = Q.ajaxExtend(url, slotNames, overrides);
			}			
			var xmlhttp;
			xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4 && !xmlhttp.handled) {
					xmlhttp.handled = true;
					if (xmlhttp.status == 200) {
						onSuccess.call(xmlhttp, xmlhttp.responseText);
					} else {
						console.log("Q.request xhr: " + xmlhttp.status + ' ' 
							+ xmlhttp.responseText.substr(xmlhttp.responseText.indexOf('<body')));
						onCancel.call(xmlhttp, xmlhttp.status);
					}
				}
			};
			if (typeof o.xhr === 'function') {
				o.xhr.call(xmlhttp, xmlhttp, options);
			}
			var sync = (o.xhr === 'sync');
			if (Q.isPlainObject(o.xhr)) {
				Q.extend(xmlhttp, o.xhr);
				sync = sync || xmlhttp.sync;
			}
			var content = o.formdata ? o.formdata : Q.queryString(o.fields);
			request.xmlhttp = xmlhttp;
			if (verb === 'GET') {
				xmlhttp.open('GET', url + (content ? '&' + content : ''), !sync);
				xmlhttp.send();
			} else {
				xmlhttp.open(verb, url, !sync);
				if (!o.formdata) {
					xmlhttp.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
				}
				//xmlhttp.setRequestHeader("Content-length", content.length);
				//xmlhttp.setRequestHeader("Connection", "close");
				xmlhttp.send(content);
			}
			return url;
		}
		
		var method = o.method || 'GET';
		var verb = method.toUpperCase();
		var overrides = {};
		if (o.loadExtras) {
			overrides.loadExtras = o.loadExtras;
		}

		if (verb !== 'GET') {
			verb = 'POST'; // browsers don't always support other HTTP verbs;
			overrides.method = o.method;
		}

		if (o.beforeRequest) {
			var chain = Q.chain(o.beforeRequest);
			chain(url, slotNames, o, _request);
		} else {
			_request(url, slotNames, o);
		}

		function _request(url, slotNames, o) {
			if (o.form) {
				if (o.extend !== false) {
					overrides.iframe = true;
					o.fields = Q.ajaxExtend(o.fields || {}, slotNames, overrides);
				}
				Q.formPost(url, o.fields, o.method, {
					form: o.form,
					onLoad: function (iframe) {
						var resultFunction = o.resultFunction
							? Q.getObject(o.resultFunction, iframe.contentWindow)
							: null;
						var result = typeof(resultFunction) === 'function' ? resultFunction() : undefined;
						_Q_Response_callback.call(request, null, result, true);
					}
				});
				return;
			}
	
			if (!o.query && o.xhr !== false
			&& (url.startsWith(Q.baseUrl()))) {
				_onStart();
				return xhr(_onResponse, _onCancel);
			}
	
			var i = Q.request.callbacks.length;
			var url2 = url;
			if (callback) {
				Q.request.callbacks[i] = function _Q_Response_JSONP(data) {
					delete Q.request.callbacks[i];
					Q.removeElement(script);
					_onResponse(data, true);
				};
				if (o.callbackName) {
					url2 = url + (url.indexOf('?') < 0 ? '?' : '&')
						+ encodeURIComponent(o.callbackName) + '='
						+ encodeURIComponent('Q.request.callbacks['+i+']');
				} else {
					url2 = (o.extend === false)
						? url
						: Q.ajaxExtend(url, slotNames, Q.extend(o, {
							callback: 'Q.request.callbacks['+i+']'
						}));
				}
			} else {
				url2 = (o.extend === false) ? url : Q.ajaxExtend(url, slotNames, o);
			}
			if (options.fields) {
				delim = (url.indexOf('?') < 0) ? '?' : '&';
				url2 += delim + Q.queryString(options.fields);
			}
			if (!o.query) {
				var script = Q.addScript(url2, null, {'duplicate': o.duplicate});
			}
			request.urlRequested = url2;
		}
	}
};

Q.request.callbacks = []; // used by Q.request

Q.request.once = Q.getter(Q.request, {
	cache: Q.Cache.document('Q.request', 1)
});

/**
 * Try to find an error message assuming typical error data structures for the arguments
 * @static
 * @method firstErrorMessage
 * @param {Object} data An object where the errors may be found. You can pass as many of these as you want. If it contains "errors" property, then errors[0] is the first error. If it contains an "error" property, than that's the first error. Otherwise, for the first argument only, if it is nonempty, then it's considered an error.
 * @return {String|null} The first error message found, or null
 */
Q.firstErrorMessage = function _Q_firstErrorMessage(data /*, data2, ... */) {
	var error = undefined;
	for (var i=0; i<arguments.length; ++i) {
		var d = arguments[i];
		if (Q.isEmpty(d)) {
			continue;
		}
		if (d.errors && d.errors[0]) {
			error = d.errors[0];
		} else if (d.error) {
			error = d.error;
		} else if (!i) {
			error = Q.isArrayLike(d) ? d[0] : d;
		}
		if (error) {
			break;
		}
	}
	if (!error) {
		return undefined;
	}
	return (typeof error === 'string')
		? error
		: (error.message ? error.message : JSON.stringify(error));
};

/**
 * Turns AJAX errors returned by Q to a hash that might be
 * useful for validating a form.
 * @static
 * @method ajaxErrors
 * @param {Object} errors
 *  A hash of errors
 * @param {Array} fields
 *  Optional. An array of field names to restrict ourselves to.
 *  For each error, if none of the fields apply, then the error
 *  is assigned to the field named first in this array.
 * @return {Object} Contains {fieldName: errorMessage} pairs.
 */
Q.ajaxErrors = function _Q_ajaxErrors(errors, fields) {
	var result = {};
	var e, f, i, j;
	if (fields && typeof fields === 'string') {
		fields = [fields];
	}
	for (i=0; i<errors.length; ++i) {
		e = false;
		if ((f = errors[i].fields)) {
			for (j=0; j<f.length; ++j) {
				if (fields && fields.indexOf(f[j]) < 0) {
					continue;
				}
				result[f[j]] = errors[i].message;
				e = true;
			}
		}
		if (!e && fields) {
			result[fields[0]] = errors[i].message;
		}
	}
	return result;
};


/**
 * A way to get JSON that is cross-domain.
 * It uses script tags and JSONP callbacks.
 * But may also use XHR if we have CORS enabled.
 * Now this function is just an alias for Q.request
 * @private
 * @static
 * @method jsonRequest
 * @param {Object} fields
 *  Optional object of fields to pass
 * @param {String} url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param {String|Array} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an array, converts it to a comma-separated list
 * @param {Function} callback
 *  The JSON will be passed to this callback function
 * @param {Object} options
 *  A hash of options, to be passed to Q.request
 */
Q.jsonRequest = Q.request;

/**
 * Serialize a plain object, with possible sub-objects, into an http querystring.
 * @static
 * @method queryString
 * @param {Object|String|HTMLElement} fields
 *  The object to serialize into a querystring that can be sent to PHP or something.
 *  The algorithm will recursively walk the object, and skip undefined values.
 *  You can also pass a form element here. If you pass a string, it will simply be returned.
 * @param {Array|true} keys
 *  An optional array of keys into the object, in the order to serialize things.
 *  Or, pass true here to sort keys by ascending string order, recursively inside objects too.
 * @param {boolean} returnAsObject
 *  Pass true here to get an object of {fieldname: value} instead of a string
 * @param {Object} [options]
 * @param {boolean} [options.convertBooleanToInteger=false] Whether to convert true,false into 1,0
 * @return {String|Object}
 *  A querystring that can be used with HTTP requests.
 */
Q.queryString = function _Q_queryString(fields, keys, returnAsObject, options) {
	if (Q.isEmpty(fields)) {
		return returnAsObject ? {} : '';
	}
	if (typeof fields === 'string') {
		return fields;
	}
	if (fields instanceof Element) {
		if (fields.tagName.toUpperCase() !== 'FORM') {
			throw new Q.Error("Q.queryString: element must be a FORM");
		}
		var result = '';
		Q.each(fields.querySelectorAll('input, textarea, select'), function () {
			var value = (this.tagName.toUpperCase() === 'SELECT')
				? this.options[this.selectedIndex].value
				: this.value;
			result += (result ? '&' : '') + this.getAttribute('name')
				+ '=' + encodeURIComponent(value);
		});
		return result;
	}
	var parts = [];
	function _params(prefix, obj) {
		if (obj == undefined) {
			return;
		}
		if (Q.isArrayLike(obj)) {
			// Serialize array item.
			Q.each(obj, function _Q_param_each(i, value) {
				if (/\[\]$/.test(prefix)) {
					// Treat each array item as a scalar.
					_add(prefix, value);
				} else {
					_params(prefix + "[" + (Q.typeOf(value) === "object" || Q.typeOf(value) === "array" ? i : "") + "]", value, _add);
				}
			});
		} else if (obj && Q.typeOf(obj) === "object") {
			// Serialize object item.
			var keys2 = Object.keys(obj);
			if (keys === true) {
				keys2.sort();
			}
			for (var i=0; i<keys2.length; ++i) {
				var name = keys2[i];
				_params(prefix + "[" + name + "]", obj[name], _add);
			}
		} else {
			// Serialize scalar item.
			_add(prefix, obj);
		}
	}
	
	var result = {};
	
	function _add(key, value) {
		// If value is a function, invoke it and return its value
		value = Q.typeOf(value) === "function" ? value() : value;
		if (value == undefined) return;
		if (options && options.convertBooleanToInteger) {
			value = (value === true) ? 1 : (value === false ? 0 : value);
		}
		if (returnAsObject) {
			result[key] = value;
		} else {
			parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
		}
	}

	if (keys) {
		var keys2 = (keys !== true)
			? keys
			: (Q.isArrayLike(fields) && fields.map
				? fields.map(function (e, i) { return i; }) 
				: Object.keys(fields).sort()
			);
		Q.each(keys2, function _Q_param_each(i, field) {
			_params(field, fields[field]);
		});
	} else {
		Q.each(fields, function _Q_param_each(field, value) {
			_params(field, value);
		});
	}

	// Return the resulting serialization
	return returnAsObject
		? result
		: parts.join("&").replace(/%20/g, "+");
};

/**
 * Serialize objects in a canonical way, to match Q_Utils::serialize().
 * Sorts the keys recursively inside the object, then http-encodes it all.
 * @param {Object} data
 * @returns {String}
 */
Q.serialize = function _Q_serialize(data) {
	return Q.queryString(data, true, false, {
		convertBooleanToInteger: false
	}).replace('+', '%20');
};

/**
 * Uses a form to do a real POST, but doesn't have a callback
 * Useful for convincing Safari to stop blocking third-party cookies
 * Technically we could use AJAX and CORS instead, and then we could have a callback.
 * @static
 * @method formPost
 * @param {String|HTMLElement} action The form action. You can also pass an
 *  HTML form element here, and skip fields and method.
 * @param {Object} [fields]  The parameters of the form
 * @param {String} [method] The method with which to submit the form. Defaults to the form's method, or "post" if missing.
 * @param {Object|Boolean} options 
 *  You can pass true here to just submit the form and load the results in a new page in this window.
 *  Or provide an optional object which can contain the following:
 * @param {String} [options.target] the name of a window or iframe to use as the target.
 * @param {HTMLElement} [options.iframe] the iframe to use. If not provided, this is filled to point to a newly created iframe object.
 * @param {Q.Event} [options.onLoad] callback to call when results are loaded in the iframe. Ignored if options.target is specified.
 * @param {HTMLElement} [options.form] the form to use. In this case, the action, fields and method are ignored.
 */
Q.formPost = function _Q_formPost(action, fields, method, options) {
	var _sugar = 0;
	if (action && (action instanceof Element) && typeof action.action === 'string') {
		options = fields;
		fields = null;
		method = null;
		_sugar = 1;
	}
	if (typeof options === 'function') {
		options = {onLoad: options};
	} else if (options === true) {
		options = {straight: true};
	} else {
		options = options || {};
	}
	var o = Q.copy(options);
	if (_sugar == 1) {
		o.form = action;
		action = o.form.action;
		method = o.form.method;
	} else {
		method = method || (o.form && o.form.method) || "POST";
		action = action || (o.form && o.form.action) || "";
	}
	method = method.toUpperCase();
	var onload;
	if (o.onLoad) {
		onload = (o.onLoad.typename === 'Q.Event')
			? o.onLoad.handle
			: o.onLoad;
	}
	var name = o.target;
	var iframeProvided = o.iframe;
	var iframe;
	if (!name) {
		iframe = o.iframe;
		if (iframe) {
			name = iframe.getAttribute('name');
		}
		if (!name) {
			name = 'Q_formPost_iframe_' + (++Q.formPost.counter % 1000);
			// we only need 1000 because we remove iframes after they successfully load
		}
		if (!o.iframe) {
			iframe = options.iframe = document.createElement('iframe');
			iframe.width = iframe.height = iframe.marginWidth = iframe.marginHeight = 0;
		}
		iframe.setAttribute("name", name);
		iframe.setAttribute("id", name);
	}
	var form = o.form, oldMethod, oldAction;
	if (form) {
		oldMethod = form.method;
		oldAction = form.action;
	} else {
		form = document.createElement('form');
	}
	form.setAttribute("method", method);
	form.setAttribute("action", action);

	var hiddenFields = [];
	var fields2 = Q.queryString(fields, null, true);
	for (var key in fields2) {
		if (fields2.hasOwnProperty(key)) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("type", "hidden");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", fields2[key]);
			form.appendChild(hiddenField);
			hiddenFields.push(hiddenField);
		 }
	}

	if (iframe && !iframeProvided) {
		document.body.appendChild(iframe);
	}
	if (iframe) {
		Q.addEventListener(iframe, 'load', function _Q_formPost_loaded() {
			Q.handle(onload, this, [iframe]);
			if (!iframeProvided && iframe.parentNode) {
				// iframe has loaded everything, and onload callback completed
				// time to remove it from the DOM
				// if someone still needs it, they should have saved a reference to it.
				Q.removeElement(iframe);
			}
		});
	}

	if (!o.form) document.body.appendChild(form);
	if (!o.straight) {
		form.setAttribute("target", name);
	}
	form.submit();
	setTimeout(function () {
		if (!o.form) {
			Q.removeElement(form, true);
		} else {
			for (var i=hiddenFields.length-1; i>=0; --i) {
				Q.removeElement(hiddenFields[i]);
			}
			form.action = oldAction;
			form.method = oldMethod;
		}
	}, 0);
};
Q.formPost.counter = 0;

/**
 * Requests a diff from the server to find any updates to files since
 * the last Q_ut timestamp, then saves current timestamp in Q_ut cookie.
 * @param {Function} callback
 */
Q.updateUrls = function(callback) {
	var timestamp, url, json, ut = Q.cookie('Q_ut');
	if (ut) {
		url = 'Q/urls/diffs/' + ut + '.json';
		Q.request(url, [], function (err, result) {
			if (err) {
				// we couldn't find a diff, so let's reload the latest.json
				Q.request('Q/urls/urls/latest.json', function (err, result) {
					_update(result);
				});
				console.warn("Q.updateUrls couldn't load or parse " + url);
				return Q.handle(callback, null, []);
			} else {
				_update(result);
			}
			function _update(result) {
				var urls = JSON.parse(localStorage.getItem('Q.updateUrls.urls'));
				if (!Q.isEmpty(urls)) {
					Q.updateUrls.urls = urls;
					Q.extend(Q.updateUrls.urls, 100, result);
				}
				json = JSON.stringify(Q.updateUrls.urls);
				localStorage.setItem(Q.updateUrls.lskey, json);
				if (timestamp = result['@timestamp']) {
					Q.cookie('Q_ut', timestamp);
				}
				Q.handle(callback, null, [result, timestamp]);
			}
		}, { extend: false, cacheBust: 1000 });
	} else {
		Q.request('Q/urls/urls/latest.json', [], function (err, result) {
			Q.updateUrls.urls = result;
			json = JSON.stringify(Q.updateUrls.urls);
			localStorage.setItem(Q.updateUrls.lskey, json);
			if (timestamp = result['@timestamp']) {
				Q.cookie('Q_ut', timestamp);
			}
			Q.handle(callback, null, [result, timestamp]);
		}, {extend: false, cacheBust: 1000});
	}
};

Q.updateUrls.lskey = 'Q.updateUrls.urls';
Q.updateUrls.urls = JSON.parse(localStorage.getItem(Q.updateUrls.lskey) || "{}");

/**
 * Adds a reference to a javascript, if it's not already there
 * @static
 * @method addScript
 * @param {String|Array} src The script url or an array of script urls
 * @param {Function} onload
 * @param {Object} [options]
 *  Optional. A hash of options, including options for Q.url() and these:
 * @param {Boolean} [options.duplicate] if true, adds script even if one with that src was already loaded
 * @param {Boolean} [options.skipIntegrity] if true, skips adding "integrity" attribute even if one can be calculated
 * @param {Boolean} [options.onError] optional function that may be called in newer browsers if the script fails to load. Its this object is the script tag.
 * @param {Boolean} [options.ignoreLoadingErrors] If true, ignores any errors in loading scripts.
 * @param {Boolean} [options.container] An element to which the stylesheet should be appended (unless it already exists in the document).
 * @param {Boolean} [options.returnAll] If true, returns all the script elements instead of just the new ones
 * @return {Array} An array of SCRIPT elements
 */
Q.addScript = function _Q_addScript(src, onload, options) {

	function stateChangeInIE() { // function to watch scripts load in IE
		// Execute as many scripts in order as we can
		var script;
		while (_pendingIEScripts[0]
		&& (_pendingIEScripts[0].readyState == 'loaded' 
			|| _pendingIEScripts[0].readyState == 'complete'
		)) {
			script = _pendingIEScripts.shift();
			script.onreadystatechange = null; // avoid future loading events from this script (eg, if src changes)
			container.appendChild(script);
			onload2(null, script, script.src);
		}
	}
	
	function onload2(e, s, u) {
		var cb;
		if (this && ('readyState' in this) && (this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;	
		}
		if (s) {
			script = s;
			src = u;
		} else if (onload2.executed) {
			return;
		}
		var targetsrc = e.target.getAttribute('src');
		Q.addScript.loaded[targetsrc] = true;
		while ((cb = Q.addScript.onLoadCallbacks[targetsrc].shift())) {
			Q.nonce = Q.nonce || Q.cookie('Q_nonce');
			cb.call(this);
		}
		script.onload = script.onreadystatechange = null; // Handle memory leak in IE
		onload2.executed = true;
	}

	function onerror2(e) {
		if (o.ignoreLoadingErrors) {
			return onload2(e);
		}
		if (onerror2.executed) {
			return;
		}
		var cb;
		Q.addScript.loaded[src] = false;
		if (Q.addScript.onErrorCallbacks[src]) {
			while ((cb = Q.addScript.onErrorCallbacks[src].shift())) {
				cb.call(this);
			}
		}
		onerror2.executed = true;
	}

	function _onload() {
		Q.addScript.loaded[src] = true;
		if (root.jQuery && !Q.onJQuery.occurred) {
			Q.onJQuery.handle(jQuery, [jQuery]);
		}
		Q.jQueryPluginPlugin();
		onload();
	}

	if (!onload) {
		onload = function () {};
	}

	if (Q.isArrayLike(src)) {
		var pipe, ret = [];
		var srcs = [];
		Q.each(src, function (i, src) {
			if (!src) return;
			srcs.push((src && src.src) ? src.src : src);
		});
		if (Q.isEmpty(srcs)) {
			onload();
			return [];
		}
		pipe = new Q.Pipe(srcs, onload);
		Q.each(srcs, function (i, src) {
			ret.push(Q.addScript(src, pipe.fill(src), options));
		});
		return ret;
	}

	var o = Q.extend({}, Q.addScript.options, options),
		firstScript = document.scripts ? document.scripts[0] : document.getElementsByTagName('script')[0],
		container = o.container || document.head  || document.getElementsByTagName('head')[0];
		
	if (!onload) {
		onload = function() { };
	}
	
	var script, i, p;
	_onload.loaded = {};
	src = (src && src.src) ? src.src : src;
	if (!src) {
		return null;
	}
	options = options || {};
	options.info = {};
	src = Q.url(src, null, options);
	
	if (!o || !o.duplicate) {
		var scripts = document.getElementsByTagName('script');
		var ieStyle = _pendingIEScripts.length;
		if (ieStyle) {
			var arr = [].concat(_pendingIEScripts);
			for (i=0; i<scripts.length; ++i) {
				arr.push(scripts[i]);
			}
			scripts = arr;
		}
		var src2 = src.split('?')[0];
		for (i=0; i<scripts.length; ++i) {
			script = scripts[i];
			var s = script.getAttribute('src');
			if (s !== src && s !== src2) {
				continue;
			}
			// move the element to the right container if necessary
			// hopefully, moving the script element won't change the order of execution
			p = scripts[i];
			var outside = true;
			while (p = p.parentNode) {
				if (p === container) {
					outside = false;
    				break;
				}
			}
			if (outside && !ieStyle) {
				container.appendChild(script);
			}
			// the script already exists in the document
			if (Q.addScript.loaded[src] || Q.addScript.loaded[src2]) {
				// the script was already loaded successfully
				_onload();
				return o.returnAll ? script : false;
			}
			if (Q.addScript.loaded[src] === false) {
				// the script had an error when loading
				if (o.ignoreLoadingErrors) {
					_onload();
				} else if (o.onError) {
					o.onError.call(script);
				}
				return o.returnAll ? script : false;
			}
			if (!Q.addScript.added[src]
			&& !script.wasProcessedByQ
			&& (!('readyState' in script)
			|| (script.readyState !== 'complete'
			|| script.readyState !== 'loaded'))) {
				// the script was added by someone else (and hopefully loaded)
				// we can't always know whether to call the error handler
				// if we got here, we might as well call onload
				_onload();
				return o.returnAll ? script : false;
			}
			// this is our script, the script hasn't yet loaded, so register onload2 and onerror2 callbacks
			if (!Q.addScript.onLoadCallbacks[src]) {
				Q.addScript.onLoadCallbacks[src] = [];
			}
			if (!Q.addScript.onErrorCallbacks[src]) {
				Q.addScript.onErrorCallbacks[src] = [];
			}
			Q.addScript.onLoadCallbacks[src].push(onload);
			if (o.onError) {
				Q.addScript.onErrorCallbacks[src].push(o.onError);
			}
			if (!script.wasProcessedByQ) {
				script.onload = onload2;
				script.onreadystatechange = onload2; // for IE
				Q.addEventListener(script, 'error', onerror2);
				script.wasProcessedByQ = true;
			}
			return o.returnAll ? script : false; // don't add this script to the DOM
		}
	}

	// Create the script tag and insert it into the document
	script = document.createElement('script');
	script.setAttribute('type', 'application/javascript');
	if (options.info.h && !options.skipIntegrity) {
		if (Q.info.urls && Q.info.urls.integrity) {
			script.setAttribute('integrity', 'sha256-' + options.info.h);
		}
	}
	Q.addScript.added[src] = true;
	Q.addScript.onLoadCallbacks[src] = [_onload];
	Q.addScript.onErrorCallbacks[src] = [];
	if (o.onError) {
		Q.addScript.onErrorCallbacks[src].push(o.onError);
	}
	Q.addEventListener(script, 'load', onload2);
	Q.addEventListener(script, 'error', onerror2);
	script.wasProcessedByQ = true;
	
	if ('async' in script) { // modern browsers
		script.setAttribute('src', src);
		script.async = false;
		container.appendChild(script);
	} else if (firstScript.readyState) { // IE<10
		// create a script and add it to our todo pile
		_pendingIEScripts.push(script);
		script.onreadystatechange = stateChangeInIE; // listen for state changes
		script.src = src; // setting src after onreadystatechange listener is necessary for cached scripts
	} else { // fall back to defer
		script.setAttribute('defer', 'defer');
		script.setAttribute('src', src);
		container.appendChild(script);
	}
	return script;
};

Q.addScript.onLoadCallbacks = {};
Q.addScript.onErrorCallbacks = {};
Q.addScript.added = {};
Q.addScript.loaded = {};
var _pendingIEScripts = [];

Q.addScript.options = {
	duplicate: false,
	ignoreLoadingErrors: false
};

Q.findScript = function (src) {
	var scripts = document.getElementsByTagName('script');
	src = Q.url(src);
	for (var i=0; i<scripts.length; ++i) {
		if (scripts[i].getAttribute('src') === src) {
			return scripts[i];
		}
	}
	return null;
};

/**
 * Gets information about the currently running script.
 * Only works when called synchronously when the script loads.
 * @method currentScript
 * @static
 * @param {Number} [stackLevels=0] If called within a function
 *  that was called inside a script, put 1, if deeper put 2, etc.
 * @return {Object} object with properties "src", "path" and "file"
 */
Q.currentScript = function (stackLevels) {
	var result = '', index = 0, lines, parts, i, l;
	try {
		throw new Error();
	} catch (e) {
		lines = e.stack.split('\n');
	}
	for (i=0, l=lines.length; i<l; ++i) {
		if (lines[i].match(/http[s]?:\/\//)) {
			index = i + 1 + (stackLevels || 0);
			break;
		}
	}
	parts = lines[index].match(/((http[s]?:\/\/.+\/)([^\/]+\.js.*?)):/);
	return {
		src: parts[1],
		path: parts[2],
		file: parts[3]
	};
};

/**
 * Exports one or more variables from a javascript file.
 * The arguments you pass to this function will be passed
 * as arguments to the callback of Q.require() whenever it requires
 * the file in which this is called. They will also be saved,
 * for subsequent calls of Q.require().
 * @method exports
 * @static
 */
Q.exports = function () {
	var src = Q.currentScript(1).src;
	_exports[src] = Array.prototype.slice.call(arguments, 0);
};

/**
 * Loads the Javascript file and then executes the callback,
 * The code in the file is supposed to synchronously call Q.exports()
 * and pass arguments to it which are then passed as arguments
 * to the callback. If the code was loaded and Q.exports() was
 * already called, then the callback is called with saved arguments.
 * @method require
 * @static
 * @param {String} src The src of the script to load
 * @param {Function} callback Always called asynchronously
 */
Q.require = function (src, callback) {
	src = Q.url(src);
	if (_exports[src]) {
		setTimeout(function () {
			Q.handle(callback, Q, _exports[src]);
		}, 0);
	} else {
		Q.addScript(src, function _Q_require_callback(err) {
			if (!(src in _exports)) {
				_exports[src] = [];
			}
			Q.handle(callback, Q, _exports[src]);
		});
	}
};

var _exports = {};

/**
 * Adds a reference to a stylesheet, if it's not already there
 * @static
 * @method addStylesheet
 * @param {String} href
 * @param {String} media
 * @param {Function} onload
 * @param {Object} [options]
 *  Optional. A hash of options, including options for Q.url() and these:
 * @param {Boolean} [options.slotName] The slot name to which the stylesheet should be added, used to control the order they're applied in.
 *  Do not use together with container option.
 * @param {HTMLElement} [options.container] An element to which the stylesheet should be appended (unless it already exists in the document)
 *  Although this won't result in valid HTML, all browsers support it, and it enables the CSS to later be easily removed at runtime.
 * @param {Boolean} [options.skipIntegrity] if true, skips adding "integrity" attribute even if one can be calculated
 * @param {Boolean} [options.returnAll=false] If true, returns all the link elements instead of just the new ones
 * @return {Array} Returns an aray of LINK elements
 */
Q.addStylesheet = function _Q_addStylesheet(href, media, onload, options) {

	function onload2() {
		if (onload2.executed) {
			return;
		}
		if (('readyState' in this) &&
			(this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;
		}
		Q.addStylesheet.loaded[href] = true;
		var cb;
		while ((cb = Q.addStylesheet.onLoadCallbacks[href].shift())) {
			cb.call(this);
		}
		onload2.executed = true;
	}

	if (typeof media === 'function') {
		options = onload; onload = media; media = undefined;
	} else if (Q.isPlainObject(media) && !(media instanceof Q.Event)) {
		options = media; media = null;
	}
	options = options || {};
	if (!onload) {
		onload = function _onload() { };
	}
	if (Q.isArrayLike(href)) {
		var pipe, ret = [];
		var hrefs = [];
		Q.each(href, function (i, href) {
			if (!href) return;
			hrefs.push((href && href.href) ? href.href : href);
		});
		if (Q.isEmpty(hrefs)) {
			onload();
			return [];
		}
		pipe = new Q.Pipe(hrefs, 1, onload);
		Q.each(hrefs, function (i, href) {
			ret.push(Q.addStylesheet(href, media, pipe.fill(href), options));
		});
		return ret;
	}
	var container = options.container || document.getElementsByTagName('head')[0];

	if (!href) {
		onload(false);
		return false;
	}
	options.info = {};
	href = Q.url(href, null, options);
	if (!media) media = 'screen,print';
	var links = document.getElementsByTagName('link');
	var i, e, h, m;
	var href2 = href.split('?')[0];
	for (i=0; i<links.length; ++i) {
		e = links[i];
		m = e.getAttribute('media');
		h = e.getAttribute('href');
		if ((m && m !== media) || h.split('?')[0] !== href2) {
			continue;
		}
		// A link element with this media and href is already found in the document.
		// Move the element to the right container if necessary
		// (This may change the order in which stylesheets are applied).
		var p = e, outside = true;
		while (p = p.parentNode) {
			if (p === container) {
				outside = false;
				break;
			}
		}
		if (outside) {
			container.appendChild(e);
		}
		if (Q.addStylesheet.loaded[href]
		|| Q.addStylesheet.loaded[href2]
		|| !Q.addStylesheet.added[href]) {
			onload();
			return options.returnAll ? e : false;
		}
		if (Q.addStylesheet.onLoadCallbacks[href]) {
			Q.addStylesheet.onLoadCallbacks[href].push(onload);
		} else {
			Q.addStylesheet.onLoadCallbacks[href] = [onload];
		}
		if (Q.info.isAndroidStock) {
			onload2.call(e); // it doesn't support onload
		} else {
			e.onload = onload2;
			e.onreadystatechange = onload2; // for IE8
		}
		return options.returnAll ? e : false; // don't add
	}

	// Create the stylesheet's tag and insert it into the document
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('type', 'text/css');
	link.setAttribute('media', media);
	if (options.info.h && !options.skipIntegrity) {
		if (Q.info.urls && Q.info.urls.integrity) {
			link.setAttribute('integrity', 'sha256-' + options.info.h);
		}
	}
	Q.addStylesheet.added[href] = true;
	Q.addStylesheet.onLoadCallbacks[href] = [onload];
	link.onload = onload2;
	link.onreadystatechange = onload2; // for IE
	link.setAttribute('href', href);
	links = document.getElementsByTagName('link');
	var insertBefore = null;
	if (Q.allSlotNames && options.slotName) {
		link.setAttribute('data-slot', options.slotName);
		var slotIndex = Q.allSlotNames.indexOf(options.slotName);
		for (var j=0; j<links.length; ++j) {
			e = links[j];
			var slotName = e.getAttribute('data-slot');
			if (Q.allSlotNames.indexOf(slotName) > slotIndex) {
				insertBefore = e;
				break;
			}
		}
	}
	if (insertBefore) {
		insertBefore.parentNode.insertBefore(link, insertBefore);
	} else {
		container.appendChild(link);
	}
	// By now all widespread browser versions support at least one of the above methods:
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#Browser_compatibility
	return link;
};


Q.addStylesheet.onLoadCallbacks = {};
Q.addStylesheet.added = {};
Q.addStylesheet.loaded = {};

Q.findStylesheet = function (href) {
	var links = document.getElementsByTagName('link');
	href = Q.url(href);
	for (var i=0; i<links.length; ++i) {
		if (links[i].getAttribute('rel').toLowerCase() !== 'stylesheet') {
			continue;
		}
		if (links[i].getAttribute('href') === href) {
			return links[i];
		}
	}
	return null;
};

/**
 * A class for working with service workers
 * @class
 */
Q.ServiceWorker = {
	start: function(cookieJarId, callback) {
		if (!'serviceWorker' in navigator) {
			Q.handle(callback, null, [false]);
			Q.ServiceWorker.onActive.handle(false);
			return console.warn('Q.ServiceWorker.start: Service workers are not supported.');
		}
		Q.ServiceWorker.started = true;
		var src = Q.url('Q-ServiceWorker');
		navigator.serviceWorker.register(src)
		.then(function (registration) {
			console.log("Q.ServiceWorker.register", registration);
			var worker;
			if (registration.active) {
				worker = registration.active;
			} else if (registration.waiting) {
				worker = registration.waiting;
			} else if (registration.installing) {
				worker = registration.installing;
			} 
			if (worker) {
				Q.handle(callback);
				Q.handle(Q.ServiceWorker.onActive);
			}
		}).catch(function (error) {
			debugger;
			console.warn("Q.ServiceWorker.start error", error);
		});
	}
}
Q.ServiceWorker.onActive = new Q.Event();

/**
 * Gets, sets or a deletes a cookie
 * @static
 * @method cookie
 * @param {String} name
 *   The name of the cookie
 * @param {Mixed} value
 *   Optional. If passed, this is the new value of the cookie.
 *   If null is passed here, the cookie is "deleted".
 * @param {Object} options
 *   Optional hash of options, including:
 * @param {number} [options.expires] number of milliseconds until expiration. Defaults to session cookie.
 * @param {String} [options.domain] the domain to set cookie. If you leave it blank,
 *  then the cookie will be set as a host-only cookie, meaning that subdomains won't get it.
 * @param {String} [options.path] path to set cookie. Defaults to path from Q.baseUrl()
 * @return {String|null}
 *   If only name was passed, returns the stored value of the cookie, or null.
 */
Q.cookie = function _Q_cookie(name, value, options) {
	var parts;
	options = options || {};
	if (typeof value != 'undefined') {
		var path, domain = '';
		parts = Q.baseUrl().split('://');
		if ('path' in options) {
			path = ';path='+options.path;
		} else if (parts[1]) {
			path = ';path=/' + parts[1].split('/').slice(1).join('/');
		} else {
			return null;
		}
		if ('domain' in options) {
			domain = ';domain='+options.domain;
		} else {
			// remove any possibly conflicting cookies from .hostname, with same path
			var o = Q.copy(options);
			var hostname = parts[1].split('/').shift();
			o.domain = '.'+hostname;
			Q.cookie(name, null, o);
			domain = ''; //';domain=' + hostname;
		}
		if (value === null) {
			document.cookie = encodeURIComponent(name)+'=;expires=Thu, 01-Jan-1970 00:00:01 GMT'+path+domain;
			return null;
		}
		var expires = '';
		if (options.expires) {
			expires = new Date();
			expires.setTime((new Date()).getTime() + options.expires);
			expires = ';expires='+expires.toGMTString();
		}
		document.cookie = encodeURIComponent(name)+'='+encodeURIComponent(value)+expires+path+domain;
		return null;
	}

	// Otherwise, return the value
	var cookies = document.cookie.split(';'), result;
	for (var i=0; i<cookies.length; ++i) {
		parts = cookies[i].split('=');
		result = parts.splice(0, 1);
		result.push(parts.join('='));
		if (decodeURIComponent(result[0].trim()) === name) {
			return result.length < 2 ? null : decodeURIComponent(result[1]);
		}
	}
	return null;
};

/**
 * Get the name of the session cookie
 * @method sessionName 
 * @static
 * @return {string}
 */
Q.sessionName = function () {
	return Q.info.sessionName || 'Q_sessionId';
};

/**
 * Get the value of the session cookie
 * @method sessionId
 * @static
 * @return {string}
 */
Q.sessionId = function () {
	return Q.cookie(Q.sessionName());
};

/**
 * Get a value that identifies the client in a fairly unique way.
 * This is most useful to tell apart clients used by a particular user.
 * @method clientId
 * @static
 * @return {string}
 */
Q.clientId = function () {
	var storage = sessionStorage;
	if (Q.clientId.value = storage.getItem("Q.clientId")) {
		return Q.clientId.value;
	}
	var detected = Q.Browser.detect();
	var code = Math.floor(Date.now()/1000)*1000 + Math.floor(Math.random()*1000);
	var ret = Q.clientId.value = (detected.device || "desktop").substr(0, 4)
		+ "-" + Q.normalize(detected.OS.substr(0, 3))
		+ "-" + Q.normalize(detected.name.substr(0, 3))
		+ "-" + detected.mainVersion + (detected.isWebView ? "n" : "w")
		+ "-" + code.toString(36);
	storage.setItem("Q.clientId", ret);
	return ret;
};

/**
 * Call this function to get an rfc4122 version 4 compliant id for the current client
 * @static
 * @method uuid
 */
Q.uuid = function () {
	// TODO: consider replacing with
	// https://github.com/broofa/node-uuid/blob/master/uuid.js
	return Q.uuid.value = Q.uuid.value || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

/**
 * Finds all elements that contain a class matching the filter,
 * and calls the callback for each of them.
 * @static
 * @method find
 * @param {HTMLElement|Array} elem
 *  An element, or an array of elements, within which to search
 * @param {String|RegExp|true|null} filter
 *  The name of the class or attribute to match
 * @param {Function} callbackBefore
 *  A function to run when a match is found (before the children).
 *  If it returns true, the Q.find function doesn't search further inside that element.
 *  If it returns false, the Q.find function stops searching.
 *  Otherwise, the Q.find function continues to search inside the element.
 * @param {Function} callbackAfter
 *  A function to run when a match is found (after the children)
 *  If it returns false, the Q.find function stops searching.
 * @param {Object} options
 *  Any options to pass to the callbacks as the second argument
 * @param {Mixed} shared
 *  An optional object that will be passed to each callbackBefore and callbackAfter
 */
Q.find = function _Q_find(elem, filter, callbackBefore, callbackAfter, options, shared, parent, index) {
	var i, activating = false;
	if (!elem) {
		return;
	}
	if (filter === true) {
		filter = 'q_tool';
		activating = true;
		if (elem.Q_activating && shared && elem.Q_activating !== shared.activating) {
			return; // skip the element and its subtree, it's already being activated
		}
	}
	// Arrays are accepted
	if ((Q.isArrayLike(elem) && !Q.instanceOf(elem, Element))
	|| (typeof HTMLCollection !== 'undefined' && (elem instanceof root.HTMLCollection))
	|| (root.jQuery && (elem instanceof jQuery))) {
		Q.each(elem, function _Q_find_array(i, item) {
			if (!item) {
				return;
			}
			if (false === Q.find(
				item, filter, callbackBefore, callbackAfter, 
				options, shared, parent, i
			)) {
				return false;
			}
		});
		return;
	}
	// Do a depth-first search and call the constructors
	var found = (filter === null);
	if (!found && ('className' in elem) && typeof elem.className === "string" && elem.className) {
		var classNames = elem.className.split(' ');
		for (i=classNames.length-1; i>=0; --i) {
			var className = Q.normalize(classNames[i]);
			if (((typeof filter === 'string') && (filter === className))
			|| ((filter instanceof RegExp) && filter.test(className))
			|| ((typeof filter === 'function' && filter(className)))) {
				found = true;
				break;
			}
		}
	}
	if (!found && elem.attributes) {
		for (i=elem.attributes.length-1; i>=0; --i) {
			var attribute = elem.attributes[i].name;
			if (((typeof filter === 'string') && (filter === attribute))
			|| ((filter instanceof RegExp) && filter.test(attribute))
			|| ((typeof filter === 'function' && filter(attribute)))) {
				found = true;
				break;
			}
		}
	}
	var ret;
	if (found && typeof callbackBefore == 'function') {
		ret = callbackBefore(elem, options, shared, parent, index);
		if (ret === false) {
			return false;
		}
	}
	if (ret !== true) {
		var children = ('children' in elem) ? elem.children : elem.childNodes;
		ret = Q.find(Q.copy(children), filter, callbackBefore, callbackAfter, options, shared, elem);
		if (ret === false) {
			return false;
		}
	}
	if (found && typeof callbackAfter  == 'function') {
		if (false === callbackAfter(elem, options, shared, parent, index)) {
			return false;
		}
	}
};

/**
 * Unleash this on an element to activate all the tools within it.
 * If the element is itself an outer div of a tool, that tool is activated too.
 * @static
 * @method activate
 * @param {HTMLElement|Q.Tool} elem
 *  HTML element or existing tool to traverse and activate
 *  If this is empty, then Q.activate exits early
 * @param {Object} options
 *  Optional options to provide to tools and their children.
 * @param {Function|Q.Event} [callback]
 *  This will get called when the content has been completely activated.
 *  That is, after all the files, if any, have been loaded and all the
 *  constructors have run.
 *  It receives (elem, tools, options) as arguments, and the last tool to be
 *  activated as "this".
 * @param {Boolean} activateLazyLoad for internal use, used by Q/lazyload tool
 * @return {Q.Promise} Returns a promise with an extra .cancel() method to cancel the action
 */
Q.activate = function _Q_activate(elem, options, callback, activateLazyLoad) {
	
	if (!elem) {
		return;
	}
	
	var ba, tool;
	if (Q.typeOf(elem) === 'Q.Tool') {
		tool = elem;
		ba = Q.Tool.beingActivated;
		Q.Tool.beingActivated = tool;
		elem = tool.element;
	}
	
	var activating = ((activating || 0) + 1) % 1000000;
	elem.Q_activating = activating;
	
	Q.beforeActivate.handle.call(root, elem); // things to do before things are activated
	
	var shared = {
		tool: null,
		tools: {},
		waitingForTools: [],
		pipe: Q.pipe(),
		canceled: false,
		activating: activating,
		activateLazyLoad: activateLazyLoad
	};
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	Q.find(elem, true, _activateTools, _initTools, options, shared);
	shared.pipe.add(shared.waitingForTools, 1, _activated)
		.run();
		
	Q.Tool.beingActivated = ba;
	
	var promise = {};
	var _resolve = null;
	var _reject = null;
	if (Q.Promise) {
		promise = new Q.Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});
	}
	promise.cancel = function () {
		shared.canceled = true;
		_reject && _reject();
	};
	return promise;
	
	function _activated() {
		var tool = shared.firstTool || shared.tool;
		if (!Q.isEmpty(shared.tools) && !tool) {
			throw new Q.Error("Q.activate: tool " + shared.firstToolId + " not found.");
		}
		if (callback) {
			Q.handle(callback, tool, [elem, shared.tools, options]);
		}
		_resolve && _resolve({
			element: elem, options: options, tools: shared.tools
		});
		delete elem.Q_activating;
		Q.handle(Q.onActivate, tool, [elem, options, shared.tools]);
	}
};

/**
 * Replaces the contents of an element and does the right thing with all the tools in it
 * @static
 * @method replace
 * @param {HTMLElement} container
 *  A existing HTMLElement whose contents are to be replaced with the source
 *  Tools found in the existing DOM which have data-Q-retain attribute
 *  are actually retained unless the tool replacing them has a data-Q-replace attribute.
 *  You can update the tool by implementing a handler for
 *  tool.Q.onRetain, which receives the old Q.Tool object, the new options and incoming element.
 *  After the event is handled, the tool's state will be extended with these new options.
 * @param {Element|String|DocumentFragment} source
 *  An HTML string or a Element or DocumentFragment which is not part of the DOM.
 *  If an element, it is treated as a document fragment, and its contents are used to replace the container's contents.
 * @param {Object} options
 *  Optional. A hash of options, including:
 * @param {Array} [options.replaceElements] array of elements or ids of elements in the document to replace, even if they have "data-q-retain" attributes.
 * @param {boolean} [options.animation] To animate the transition, pass an object here with optional "duration", "ease" and "callback" properties.
 * @return {HTMLElement}
 *  Returns the container element if successful
 */
Q.replace = function _Q_replace(container, source, options) {
	if (!source) {
		var c; while (c = container.lastChild) {
			Q.removeElement(c, true);
		} // Clear the container
		return container;
	}
	options = Q.extend({}, Q.replace.options, options);
	if (Q.typeOf(source) === 'string') {
		var s = document.createElement('div'); // temporary container
		s.innerHTML = source;
		source = s;
	}
	
	var replaceElements;
	if (options.replaceElements) {
		replaceElements = [];
		Q.each(options.replaceElements, function (i, e) {
			replaceElements.push(
				typeof e === 'string' ? document.getElementById(e) : e
			);
		});
	}
	
	var retainedTools = {};
	var newOptions = {};
	var incomingElements = {};
	Q.find(source.childNodes, null, function (incomingElement) {
		var id = incomingElement.id;
		var element = id && document.getElementById(id);
		if (element && element.getAttribute('data-Q-retain') !== null
		&& !incomingElement.getAttribute('data-Q-replace') !== null
		&& replaceElements.indexOf(element) < 0) {
			// If a tool exists with this exact id and has "data-Q-retain",
			// then re-use it and all its HTML elements, unless
			// the new tool HTML has data-Q-replace or is in options.replaceElements.
			// This way tools can avoid doing expensive operations each time
			// they are replaced and reactivated.
			incomingElements[incomingElement.id] = incomingElement;
			incomingElement.parentNode.replaceChild(element, incomingElement);
			for (var name in element.Q.tools) {
				var tool = Q.Tool.from(element, name);
				var attrName = 'data-' + Q.normalize(tool.name, '-');
				var newOptionsString = incomingElement.getAttribute(attrName);
				element.setAttribute(attrName, newOptionsString);
				retainedTools[id] = tool;
				newOptions[id] = JSON.parse(newOptionsString);
			}
		}
	});
	
	Q.beforeReplace.handle(container, source, options, newOptions, retainedTools);
	
	var c; while (c = container.lastChild) {
		Q.removeElement(c, true);
	} // Clear the container
	
	// Move the actual nodes from the source to existing container
	var c;
	while (c = source.childNodes[0]) {
		container.appendChild(c);
	}
	
	for (var id in retainedTools) {
		var tool = retainedTools[id];
		var newOpt = newOptions[id];
		// The tool's constructor not will be called again with the new options.
		// Instead, implement Q.onRetain, from the tool we decided to retain.
		// The Q.Tool object still contains all its old properties, options, state.
		// Its element still contains DOM elements, 
		// attached jQuery data and events, and more.
		// However, the element's data-TOOL-NAME attribute now contains
		// the new options.
		Q.handle(tool.Q.onRetain, tool, [newOptions, incomingElements[id]]);
		Q.extend(tool.state, 10, newOptions);
	}
	
	return container;
};

/**
 * Requests a URL served by Qbix Platform and loads it as if it was a page loaded in the browser.
 * @static
 * @method loadUrl
 * @param {String} url The url to load.
 * @param {Array|String} slotNames Optional, defaults to all application slots
 * @param {Function} callback Callback which is called when response returned and scripts,
 * stylesheets and inline styles added, but before inline scripts executed.
 * Receives response as its first argument. May return DOM element or array of DOM elements on which to call Q.activate
 * By default place slot content to DOM element with id "{slotName}_slot"
 * @param {Object} options Optional.
 * An hash of options to pass to the loader, and can also include options for loadUrl itself:
 * @param {Function} [options.loader=Q.request] can be used to override the actual function to request the URL. See Q.request documentation for more options.
 * @param {Function} [options.handler] the function to handle the returned data. Defaults to a function that fills the corresponding slot containers correctly.
 * @param {boolean} [options.ignoreHistory=false] if true, does not push the url onto the history stack
 * @param {boolean} [options.ignorePage=false] if true, does not process the links / stylesheets / script data in the response, and doesn't trigger deactivation of current page and activation of the new page
 * @param {boolean} [options.ignoreLoadingErrors=false] If true, ignores any errors in loading scripts.
 * @param {boolean} [options.ignoreHash=false] if true, does not navigate to the hash part of the URL in browsers that can support it
 * @param {Object} [options.fields] additional fields to pass via the querystring
 * @param {Object} [options.formdata] if set, instead of fields, submits the formdata (including multipart form-data such as files, etc.) 
 * @param {String} [options.loadExtras=null] if "all", asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load. Can also be "request", "session" or "request,session"
 * @param {Number|boolean} [options.timeout=1500] milliseconds to wait for response, before showing cancel button and triggering onTimeout event, if any, passed to the options
 * @param {boolean} [options.quiet=false] if true, allows visual indications that the request is going to take place.
 * @param {String|Array} [options.slotNames] an array of slot names to request and process (default is all slots in Q.info.slotNames)
 * @param {Array} [options.idPrefixes] optional array of values to pass to PHP method Q_Html::pushIdPrefix for each slotName
 * @param {Object} [options.retainSlots] an object of {slotName: whetherToRetain} pairs, retained slots aren't requested
 * @param {boolean} [options.slotContainer] optional function taking (slotName, response) and returning the element, if any, to fill for that slot
 * @param {Array} [options.replaceElements] array of elements or ids of elements in the document to replace. Overrides "data-q-retain" attributes but not retainSlots option.
 * @param {Object} [options.dontRestoreScrollPosition] set dontRestoreScroll[url] = true to skip fillSlots restoring scroll position for that url, or just set dontRestoreScroll[''] = true to skip all urls
 * @param {String} [options.key='Q'] If a response to the request initiated by this call to Q.loadUrl is preceded by another call to Q.loadUrl with the same key, then the response handler is not run for that response (since a newer one is pending or arrived).
 * @param {Q.Event} [options.onTimeout] handler to call when timeout is reached. Receives function as argument - the function might be called to cancel loading.
 * @param {Q.Event} [options.onCancel] passed to the loader to be called if the loader cancels the response
 * @param {Q.Event} [options.onResponse] handler to call when the loader gets a response but before it is processed
 * @param {Q.Event} [options.onError] event for when an error occurs, by default shows an alert
 * @param {Q.Event} [options.onLoad] event which occurs when the parsed data comes back from the server
 * @param {Q.Event} [options.onActivate] event which occurs when all Q.activate's processed and all script lines executed
 * @param {Q.Event} [options.onLoadStart] handlers of this event will be called after the request is initiated, if "quiet" option is false they can add some visual indicators
 * @param {Q.Event} [options.onLoadEnd] handlers of this event will be called after the request is fully completed, if "quiet" option is false they can add some visual indicators
 * @param {Q.Event} [options.beforeFillSlots] handler to call before filling slots with new content
 * @param {Q.Event} [options.beforeUnloadUrl] opportunity to save state around current url, such as scroll positions of displayed slots
 * @param {Q.Event} [options.unloadedUrl] if the URL was already replaced by the time Q.loadUrl is called (e.g. from popState handler) pass the URL being unloaded here
 * @return {Q.Promise} Returns a promise with an extra .cancel() method to cancel the action
 */
Q.loadUrl = function _Q_loadUrl(url, options) {
	url = Q.url(url);
	var o = Q.extend({}, Q.loadUrl.options, options);

	var handler = o.handler;
	var slotNames = o.slotNames;
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	if (o.retainSlots) {
		var arr = [], i, l = slotNames.length;
		for (i=0; i<l; ++i) {
			var slotName = slotNames[i];
			if (!o.retainSlots[slotName]
			|| !Q.loadUrl.retainedSlots[slotName]) {
				arr.push(slotName);
			}
		}
		slotNames = arr;
	}

	var parts = url.split('#');
	var urlToLoad = (parts[1] && parts[1].queryField('url')) || parts[0];

	var loader = Q.request;
	var onActivate, onError;
	if (o.loader) {
		loader = o.loader;
	}
	if (o.onError) {
		onError = o.onError;
	}
	if (o.onActivate) {
		onActivate = o.onActivate;
	}
	var _loadUrlObject = {url: url, options: options};
	Q.loadUrl.loading[o.key] = _loadUrlObject;
	loader(urlToLoad, slotNames, loadResponse, o);
	
	var promise = {};
	var _resolve = null;
	var _reject = null;
	var _canceled = null;
	if (Q.Promise) {
		promise = new Q.Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});
	}
	promise.cancel = function () {
		_canceled = true;
		_reject && reject("request canceled");
	};
	return promise;

	function loadResponse(err, response, redirected) {
		var e;
		if (_canceled) {
			return; // this loadUrl call was canceled
		}
		var loadingUrlObject = Q.loadUrl.loading[o.key];
		delete Q.loadUrl.loading[o.key]; // it's loaded
		if (redirected) {
			_resolve && _resolve(response);
			return; // it was just a redirect
		}
		if (loadingUrlObject &&
		_loadUrlObject != loadingUrlObject) {
			var sn1 = loadingUrlObject.options && loadingUrlObject.options.slotNames || [];
			var sn2 = _loadUrlObject.options && _loadUrlObject.options.slotNames || [];
			e = 'request to ' + loadingUrlObject.url
				+ ' (' + sn1.join(',') + ') '
				+ ' was initiated after ' 
				+ ' current one to ' + _loadUrlObject.url
				+ ' (' + sn2.join(',') + ')';
			_reject && _reject(e);
			return; // a newer request was sent
		}
		if (!Q.isEmpty(err)) {
			e = Q.firstErrorMessage(err);
			_reject && _reject(e);
			return Q.handle(onError, this, [e]);
		}
		if (Q.isEmpty(response)) {
			e = "Response is empty";
			_reject && _reject(e);
			return Q.handle(onError, this, [e, response]);
		}
		if (!Q.isEmpty(response.errors)) {
			response.errors[0].message
			_reject && _reject(e);
			return Q.handle(onError, this, [e]);
		}
		Q.handle(o.onLoad, this, [response]);
		var unloadedUrl = o.unloadedUrl || location.href;
		Q.handle(o.beforeUnloadUrl, this, [unloadedUrl, url, response]);

		_resolve && _resolve(response);
		
		Q.Page.beingProcessed = true;

		Q.Response.processHtmlCssClasses(response);
		Q.Response.processMetas(response);
		Q.Response.processTemplates(response);

		var newScripts;
		
		if (!o.ignoreDialogs) {
			while (Q.Dialogs.dialogs.length) {
				Q.Dialogs.pop();
			}
		}
		
		if (o.ignorePage) {
			newScripts = [];
			afterScripts();
		} else {
			newScripts = Q.Response.processScripts(response, afterScripts, o);
		}
		
		function afterScripts () {
			
			// WARNING: This function may not be called if one of the scripts is missing or returns an error
			// So the existing page will not be unloaded and the new page will not be loaded, in this case,
			// but some of the new scripts will be added.

			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // old page going out
			var i, newStylesheets, newStyles;
			
			var domElements = null;
			if (o.ignorePage) {
				newStylesheets = {};
				afterStylesheets();
			} else {
				_doEvents('on', moduleSlashAction);
				newStylesheets = Q.Response.processStylesheets(response, afterStylesheets);
			}
			
			function afterStylesheets() {
				Q.Response.processStyles(response);
				
				afterStyles(); // Synchronous to allow additional scripts to change the styles before allowing the browser reflow.
			
				if (!o.ignoreHash && parts[1] && history.pushState) {
					var e = document.getElementById(parts[1]);
					if (e) {
						location.hash = parts[1];
						// history.back();
						// todo: modify history successfully somehow
						// history.replaceState({}, null, url + '#' + parts[1]);
					}
				}
			}
			
			function afterStyles() {
				
				if (!o.ignorePage) {
					_doEvents('before', moduleSlashAction);
					while (Q.Event.forPage && Q.Event.forPage.length) {
						// keep removing the first element of the array until it is empty
						Q.Event.forPage[0].remove(true);
					}
					var p = Q.Event.jQueryForPage;
					for (i=p.length-1; i >= 0; --i) {
						var off = p[i][0];
						root.jQuery.fn[off].call(p[i][1], p[i][2], p[i][3]);
					}
					Q.Event.jQueryForPage = [];
				}

				if (!o.ignoreHistory) {
					Q.Page.push(url, Q.getObject('slots.title', response));
				}
			
				if (!o.ignorePage) {
					// Remove various elements belonging to the slots that are being reloaded
					Q.each(['link', 'style', 'script'], function (i, tag) {
						if (tag !== 'style' && !o.loadExtras) {
							return;
						}
						Q.each(document.getElementsByTagName(tag), function (k, e) {
							if (tag === 'link' && e.getAttribute('rel').toLowerCase() !== 'stylesheet') {
								return;
							}

							var slot = e.getAttribute('data-slot');
							if (slot && slotNames.indexOf(slot) >= 0) {
								var found = false;
								if (response.stylesheets && response.stylesheets[slot]) {
									var stylesheets = response.stylesheets[slot];
									for (var i=0, l=stylesheets.length; i<l; ++i) {
										var stylesheet = stylesheets[i];
										var href1 = Q.getObject("href", stylesheet);
										var href2 = Q.getObject("href", e);
										if (href1 && href2 && href1.split("?")[0] === href2.split("?")[0]
										&& (!stylesheet.media || stylesheet.media === e.media)) {
											found = true;
											break;
										}
									}
								}
								if (!found) {
									Q.removeElement(e);
								}
							}

							// now let's deal with style tags inserted by prefixfree
							if (tag === 'style') {
								var href = e.getAttribute('data-href');
								if (slotNames.indexOf(processStylesheets.slots[href]) >= 0) {
									Q.removeElement(e);
									delete processStylesheets.slots[href];
								}
							}
						});
					});
				}
			
				// this is where we fill all the slots
				Q.handle(o.beforeFillSlots, Q, [response, url, o]);
				domElements = handler(response, url, o);
			
				if (!o.ignorePage && Q.info && Q.info.uri) {
					Q.Page.onLoad(moduleSlashAction).occurred = false;
					Q.Page.onActivate(moduleSlashAction).occurred = false;
					if (Q.info.uriString !== Q.moduleSlashAction) {
						Q.Page.onLoad(Q.info.uriString).occurred = false;
						Q.Page.onActivate(Q.info.uriString).occurred = false;
					}
				}

				Q.Response.processScriptDataAndLines(response);

				if (!o.ignorePage) {
					try {
						Q.Page.beingLoaded = true;
						Q.Page.onLoad('').handle(url, o);
						if (Q.info && Q.info.uri) {
							moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // new page coming in
							Q.Page.onLoad(moduleSlashAction).handle(url, o);
							if (Q.info.uriString !== moduleSlashAction) {
								Q.Page.onLoad(Q.info.uriString).handle(url, o);
							}
						}
						Q.Page.beingLoaded = false;
					} catch (e) {
						debugger; // pause here if debugging
						Q.Page.beingLoaded = false;
						throw e;
					}
				}
			
				if (Q.isEmpty(domElements)) {
					_activatedSlot();
				} else if (Q.isPlainObject(domElements)) { // is a plain object with elements
					_activatedSlot.remaining = Object.keys(domElements).length;
					for (var slotName in domElements) {
						Q.activate(domElements[slotName], undefined, _activatedSlot);
					}
				} else { // it's an element
					Q.activate(domElements, undefined, _activatedSlot);
				}
			}
			
			function _doEvents(prefix, moduleSlashAction) {
				var event, f = Q.Page[prefix+'Unload'];
				if (Q.info && Q.info.uri) {
					event = f("Q\t"+moduleSlashAction);
					event.handle(url, o);
					event.removeAllHandlers();
					event = f(moduleSlashAction);
					event.handle(url, o);
					if (Q.info.uriString !== moduleSlashAction) {
						event = f("Q\t"+Q.info.uriString);
						event.handle(url, o);
						event.removeAllHandlers();
						event = f(Q.info.uriString);
						event.handle(url, o);
					}
				}
				event = f("Q\t");
				event.handle(url, o);
				event.removeAllHandlers();
				event = f('');
				event.handle(url, o);
			}

			function _activatedSlot() {
				if (_activatedSlot.remaining !== undefined && --_activatedSlot.remaining > 0) {
					return;
				}
				Q.each([newStylesheets, newStyles, newScripts], function (i, collection) {
					Q.each(collection, function (slotName, arr) {
						if (!slotName) return;
						Q.each(arr, function (i, element) {
							if (!element) return;
							// domElements[slotName].appendChild(element);
							element.setAttribute('data-slot', slotName);
							
							// save some info before prefixfree mangles stuff
							if (element.tagName && element.tagName.toUpperCase() === 'LINK') {
								processStylesheets.slots[element.getAttribute('href')] = slotName;
							}
						});
					});
				});
				if (!o.ignorePage) {
					try {
						Q.Page.beingActivated = true;
						Q.Page.onActivate('').handle(url, o);
						if (Q.info && Q.info.uri) {
							var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
							Q.Page.onActivate(moduleSlashAction).handle(url, o);
							if (Q.info.uriString !== moduleSlashAction) {
								Q.Page.onActivate(Q.info.uriString).handle(url, o);
							}
						}
						Q.Page.beingActivated = false;
					} catch (e) {
						debugger; // pause here if debugging
						Q.Page.beingActivated = false;
						throw e;
					}
				}
				// Invoke prefixfree again if it was loaded
				if (root.StyleFix) {
					root.StyleFix.process();
				}

				Q.handle(o.onRequestProcessed, this, [err, response]);
				
				Q.Page.beingProcessed = false;
				Q.handle(onActivate, this, [domElements]);
			}
		}
	}
};

Q.loadUrl.retainedSlots = {};

Q.loadUrl.saveScroll = function _Q_loadUrl_saveScroll (fromUrl) {
	var slotNames = Q.info.slotNames, l, elem, i;
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	l = slotNames.length;
	for (i=0; i<l; ++i) {
		if ((elem = document.getElementById(slotNames[i] + "_slot"))
		&& ('scrollLeft' in elem)) {
			Q.setObject(['Q', 'scroll', fromUrl], {
				left: elem.scrollLeft,
				top: elem.scrollTop
			}, elem);
		}
	}
};

/**
 * Similar to Q.request but processes the response like loadUrl,
 * handling such scriptData, scriptLines, HTML classes, css, etc.
 * Callback receives (err, data)
 */
Q.loadUrl.request = function (url, slotNames, callback, options) {
	return Q.loadUrl(url, Q.extend({
		ignoreHistory: true,
		ignorePage: true,
		ignoreLoadingErrors: true,
		ignoreHash: true,
		dontReload: true,
		handler: function doNothing () { return null; },
		slotNames: slotNames,
		onRequestProcessed: function (err, response) {
			Q.handle(callback, this, [null, response]);
		}
	}, options));
};

Q.loadUrl.loading = {};

/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * @static
 * @method handle
 * @param {Mixed} callables
 *  The callables to call
 *  Can be a function, array of functions, object of functions, Q.Event or URL
 *  If it is a url, simply follow it with options, callback
 * @param {Function} callback
 *  You can pass a function here if callables is a URL
 * @param {Object} context
 *  The context in which to call them
 * @param {Array} args
 *  An array of arguments to pass to them
 * @param {Object} options
 *  If callables is a url, these are the options to pass to Q.loadUrl, if any. Also can include:
 *  @param {boolean} [options.dontReload=false] if this is true and callback is a url matching current url, it is not reloaded
 *  @param {boolean} [options.loadUsingAjax=false] if this is true and callback is a url, it is loaded using Q.loadUrl
 *  @param {Function} [options.externalLoader] when using loadUsingAjax, you can set this to a function to suppress loading of external websites with Q.handle.
 *	Note: this will still not supress loading of external websites done with other means, such as window.location
 *  @param {Object} [options.fields] optional fields to pass with any method other than "get"
 *  @param {String|Function} [options.callback] if a string, adds a '&Q.callback='+encodeURIComponent(callback) to the querystring. If a function, this is the callback.
 * @param {String} [options.loadExtras="all"] if "all", asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load. Can also be "request", "session" or "request,session"
 *  @param {String} [options.target] the name of a window or iframe to use as the target. In this case callables is treated as a url.
 *  @param {String|Array} [options.slotNames] a comma-separated list of slot names, or an array of slot names
 *  @param {boolean} [options.quiet] defaults to false. If true, allows visual indications that the request is going to take place.
 * @return {number}
 *  The number of handlers executed
 */
Q.handle = function _Q_handle(callables, /* callback, */ context, args, options) {
	if (!callables) {
		return 0;
	}
	if (!context) context = root;
	if (!args) args = [];
	var i=0, count=0, k, result;
	if (callables === location) callables = location.href;
	switch (Q.typeOf(callables)) {
		case 'function':
			result = callables.apply(context, args);
			if (result === false) return false;
			return 1;
		case 'array':
			for (i=0; i<callables.length; ++i) {
				result = Q.handle(callables[i], context, args);
				if (result === false) return false;
				count += result;
			}
			return count;
		case 'Q.Event':
			return callables.handle.apply(context, args);
		case 'object':
			for (k in callables) {
				result = Q.handle(callables[k], context, args);
				if (result === false) return false;
				count += result;
			}
			return count;
		case 'string':
			var o = Q.extend({}, Q.handle.options, options);
			if (!callables.isUrl()
			&& (callables[0] != '#')
			&& (!o.target || o.target.toLowerCase() === '_self')) {
				// Assume this is not a URL.
				// Try to evaluate the expression, and execute the resulting function
				var c = Q.getObject(callables, context) || Q.getObject(callables);
				return Q.handle(c, context, args);
			}
			// Assume callables is a URL
			if (o.dontReload && Q.info && Q.info.url === callables) {
				return 0;
			}
			var callback = null;
			if (typeof arguments[1] === 'function') {
				// Some syntactic sugar: (url, callback) omitting context, args, options
				callback = arguments[1];
				o = Q.handle.options;
			} else if (arguments[1] && (arguments[3] === undefined)) {
				// Some more syntactic sugar: (url, options, callback) omitting context, args, options
				o = Q.extend({}, Q.handle.options, arguments[1]);
				if (typeof arguments[2] === 'function') {
					callback = arguments[2];
				}
			} else {
				o = Q.extend({}, Q.handle.options, options);
				if (o.callback) {
					callback = o.callback;
				}
			}
			var baseUrl = Q.baseUrl();
			var sameDomain = callables.sameDomain(baseUrl);
			if (callables[0] === '#') {
				root.location.hash = callables;
			} else if (o.loadUsingAjax && sameDomain
			&& (!o.target || o.target === true || o.target === '_self')) {
				if (callables.search(baseUrl) === 0) {
					// Use AJAX to refresh the page whenever the request is for a local page
					Q.loadUrl(callables, Q.extend({
						loadExtras: 'all',
						ignoreHistory: false,
						onActivate: function () {
							if (callback) callback();
						}
					}, o)).then(function () {

					});
				} else if (o.externalLoader) {
					o.externalLoader.apply(this, arguments);
				} else {
					root.location = callables;
				}
			} else {
				if (Q.typeOf(o.fields) === 'object') {
					var method = 'POST';
					if (o.method) {
						switch (o.method.toUpperCase()) {
							case "GET":
							case "POST":
								method = o.method;
								break;
							default:
								method = 'POST'; // sadly HTML forms don't support other methods
								break;
						}
					}
					Q.formPost(callables, o.fields, method, {onLoad: o.callback, target: o.target});
				} else {
					if (Q.info && callables === baseUrl) {
						callables+= '/';
					}
					if (!o.target || o.target === true || o.target === '_self') {
						if (root.location.href == callables) {
							root.location.reload(true);
						} else {
							root.location = callables;
						}
					} else {
						root.open(callables, o.target);
					}
				}
			}
			Q.handle.onUrl.handle(callables, o);
			return 1;
		default:
			return 0;
	}
};
Q.handle.options = {
	loadUsingAjax: false,
	externalLoader: null,
	dontReload: false
};
Q.handle.onUrl = new Q.Event(function () {
	var elements = document.getElementsByClassName('Q_error_message');
	Q.each(elements, function () {
		Q.removeElement(this, true);
	});
	Q.Visual.stopHints();
}, "Q");

/**
 * Displays a duration
 * @static
 * @method displayDuration
 * @param {Integer} milliseconds The number of milliseconds from start
 * @param {Object} forceShow=[{hours:false,seconds:true}] Whether to show hours or seconds if they are 00
 * @return {String} A string of the form "hh:mm:ss" depending on forceShow
 */
Q.displayDuration = function Q_displayDuration(milliseconds, forceShow) {
	milliseconds = parseInt(milliseconds);
	if (!forceShow) {
		forceShow = { hours: false, seconds: true };
	}
	var seconds = Math.floor(milliseconds / 1000);
	var minutes = Math.floor(seconds / 60);
	var hours = Math.floor(minutes / 60);

	minutes = (minutes % 60).toString();
	if (minutes.length === 1) {
		minutes = '0' + minutes;
	}
	var components = [minutes];
	if (seconds || forceShow.seconds) {
		seconds = (seconds % 60).toString();
		if (seconds.length === 1) {
			seconds = '0' + seconds;
		}
		components.push(seconds);
	}
	if (hours || forceShow.hours) {
		components.unshift(hours);
	}
	return components.join(':');
};

/**
 * Parses a querystring
 * @static
 * @method parseQueryString
 * @param {String} queryString  The string to parse
 * @param {Array} keys  Optional array onto which the keys are pushed
 * @return {Object} an object with the resulting {key: value} pairs
 */
Q.parseQueryString = function Q_parseQueryString(queryString, keys) {
	if (!queryString) return {};
	if (queryString[0] === '?' || queryString[0] === '#') {
		queryString = queryString.substr(1);
	}
	var result = {};
	Q.each(queryString.split('&'), function (i, clause) {
		var parts = clause.split('=');
		var key = decodeURIComponent(parts[0]);
		var value = (parts[1] == null) ? null : decodeURIComponent(parts[1]);
		if (!key) return;
		if (keys) keys.push(key);
		result[key] = value;
	});
	return result;
};

function Q_hashChangeHandler() {
	var baseUrl = Q.baseUrl();
	var url = location.hash.queryField('url'), result = null;
	if (url === undefined) {
		url = root.location.href.split('#')[0].substr(baseUrl.length + 1);
	}
	if (Q_hashChangeHandler.ignore) {
		Q_hashChangeHandler.ignore = false;
	} else if (url != Q_hashChangeHandler.currentUrl
	&& url !== Q_hashChangeHandler.currentUrlTail) {
		Q.handle(url.indexOf(baseUrl) == -1 ? baseUrl + '/' + url : url);
		result = true;
	}
	Q_hashChangeHandler.currentUrl = url.split('#')[0];
	Q_hashChangeHandler.currentUrlTail = Q_hashChangeHandler.currentUrl
		.substr(baseUrl.length + 1);
	return result;
}

function Q_popStateHandler() {
	var baseUrl = Q.baseUrl();
	var url = root.location.href.split('#')[0], result = null;
	if (Q.info.url === url) {
		return; // we are already at this url
	}
	var urlTail = url.substr(baseUrl.length + 1);
	if (urlTail != Q_hashChangeHandler.currentUrlTail) {
		Q.handle(
			url.indexOf(baseUrl) === 0 ? url : baseUrl + '/' + url,
			{
				ignoreHistory: true,
				quiet: true,
				unloadedUrl: Q_hashChangeHandler.currentUrl
			}
		);
		Q_hashChangeHandler.currentUrlTail = urlTail;
		Q_hashChangeHandler.currentUrl = url;
		result = true;
	}
	return result;
}

// private methods

var _constructors = {};

/**
 * Given a tool's generated container div, constructs the
 * corresponding JS tool object. Used internally.
 * This basically calls the tool's constructor, passing it
 * the correct prefix.
 * @private
 * @static
 * @method _activateTools
 * @param {HTMLElement} toolElement
 *  A tool's generated container div.
 * @param {Object} options
 *  Options that should be passed onto the tool
 * @param {Mixed} shared
 *  A shared object we can use to pass info around while activating tools
 */
function _activateTools(toolElement, options, shared) {
	if (!shared.activateLazyLoad &&
	(toolElement instanceof Element)) {
		var attr = toolElement.getAttribute('data-q-lazyload');
		if (attr === 'waiting' || attr === 'removed') {
			return false;
		}
	}
	var pendingParentEvent = _pendingParentStack[_pendingParentStack.length-1];
	var pendingCurrentEvent = new Q.Event();
	pendingCurrentEvent.toolElement = toolElement; // just to keep track for debugging
	_pendingParentStack.push(pendingCurrentEvent); // wait for construct of parent tool
	var toolId = Q.Tool.calculateId(toolElement.id);
	_waitingParentStack.push(toolId); // wait for init of child tools
	_loadToolScript(toolElement,
	function _activateTools_doConstruct(toolElement, toolConstructor, toolName, uniqueToolId, params) {
		if (!_constructors[toolName]) {
			_constructors[toolName] = function Q_Tool(element, options) {
				// support re-entrancy of Q.activate
				var tool = Q.getObject(['Q', 'tools', toolName], element);
				if (this.activating || this.activated || tool) {
					tool = tool || this;
					return _activateTools.alreadyActivated;
				}
				this.activating = true
				this.activated = false;
				this.initialized = false;
				try {
					this.options = Q.extend({}, Q.Tool.options.levels, toolConstructor.options);
					if (options) {
						var o2 = {}, k;
						for (k in options) {
							if (k[0] !== '#') {
								o2[k] = options[k];
							}
						}
						Q.extend(this.options, Q.Tool.options.levels, o2);
					}
					this.name = toolName;
					this.constructor = toolConstructor;
					Q.Tool.call(this, element, options);
					this.state = Q.copy(this.options, toolConstructor.stateKeys);
					if (params && params.text) {
						this.text = params.text[1];
					}
					var prevTool = Q.Tool.beingActivated;
					Q.Tool.beingActivated = this;
					// Trigger events in some global event factories
					var normalizedName = Q.normalize(this.name);
					var normalizedId = Q.normalize(this.id);
					_constructToolHandlers[""] &&
					_constructToolHandlers[""].handle.call(this, this.options);
					_constructToolHandlers[normalizedName] &&
					_constructToolHandlers[normalizedName].handle.call(this, this.options);
					_constructToolHandlers["id:"+normalizedId] &&
					_constructToolHandlers["id:"+normalizedId].handle.call(this, this.options);
					var args = [this.options];
					Q.each(toolConstructor.require, function (i, n) {
						var req = Q.Tool.from(element, n);
						if (!req) {
							throw new Q.Exception("Q.Tool.define: " + toolConstructor.toolName
							+ " requires " + n + " to have been activated on the same element.");
						}
						args.push(req);
					});
					toolConstructor.apply(this, args);
					_activateToolHandlers[""] &&
					_activateToolHandlers[""].handle.call(this, this.options);
					_activateToolHandlers[normalizedName] &&
					_activateToolHandlers[normalizedName].handle.call(this, this.options);
					_activateToolHandlers["id:"+normalizedId] &&
					_activateToolHandlers["id:"+normalizedId].handle.call(this, this.options);
					Q.Tool.beingActivated = prevTool;
				} catch (e) {
					debugger; // pause here if debugging
					console.warn(e);
					Q.Tool.beingActivated = prevTool;
				}
				this.activating = false;
				this.activated = true;
			};
			Q.mixin(toolConstructor, Q.Tool);
			Q.mixin(_constructors[toolName], toolConstructor);
		}
		if (shared.canceled) {
			return;
		}
		if (pendingParentEvent) {
			var eventKey = toolId + ' ' + toolName;
			var eventKeyPrefix = 0;
			// in order to avoid replace handlers in pendingParentEvent we need to avoid adding handlers with same keys
			// So while key exists in pendingParentEvent.keys we update new id with counter.
			while(pendingParentEvent.keys.includes(eventKey)) {
				eventKey += '_' + eventKeyPrefix++;
			}
			pendingParentEvent.add(_reallyConstruct, eventKey);
		} else {
			_reallyConstruct();
		}
		function _reallyConstruct() {
			// NOTE: inside the tool constructor, after you add
			// any child elements, call Q.activate() and Qbix
			// will work correctly, whether it's sync or async.
			var _constructor = _constructors[toolName];
			var result = new _constructor(toolElement, options);
			var tool = Q.getObject(['Q', 'tools', toolName], toolElement);
			shared.tool = tool;
			Q.setObject([toolId, toolName], tool, shared);
			if (uniqueToolId) {
				if (uniqueToolId === shared.firstToolId) {
					shared.firstTool = tool;
				}
				shared.pipe.fill(uniqueToolId)();
			}
			if (!tool) {
				return;
			}
			pendingCurrentEvent.handle.call(tool, options, result);
			pendingCurrentEvent.removeAllHandlers();
		}
	}, shared, null, { placeholder: true });
}

_activateTools.alreadyActivated = {};

/**
 * Calls the init method of a tool. Used internally.
 * @private
 * @static
 * @method _initTools
 * @param {HTMLElement} toolElement
 *  A tool's generated container div
 */
function _initTools(toolElement, options, shared) {
	
	if (!shared.activateLazyLoad &&
	(toolElement instanceof Element)) {
		var attr = toolElement.getAttribute('data-q-lazyload');
		if (attr === 'waiting' || attr === 'removed') {
			return false;
		}
	}
	
	var currentEvent = _pendingParentStack[_pendingParentStack.length-1];
	_pendingParentStack.pop(); // it was pushed during tool activate
	var currentId = _waitingParentStack.pop();
	var ba = Q.Tool.beingActivated;
	var parentId = _waitingParentStack[_waitingParentStack.length-1]
		|| (ba && ba.id); // if we activated child tools while activating parent
	
	_loadToolScript(toolElement,
	function _initTools_doInit(toolElement, toolConstructor, toolName) {
		currentEvent.add(_doInit, currentId + ' ' + toolName);
	}, null, parentId);
	
	function _doInit() {
		var tool = this;
		var normalizedName = Q.normalize(tool.name);
		var normalizedId = Q.normalize(tool.id);
		var waiting = _toolsWaitingForInit[tool.id];
		if (tool.initialized || waiting) {
			return;
		}
		tool.initialized = true;
		Q.handle(tool.Q && tool.Q.onInit, tool, [tool.options]);
		_initToolHandlers[""] &&
		_initToolHandlers[""].handle.call(tool, tool.options);
		_initToolHandlers[normalizedName] &&
		_initToolHandlers[normalizedName].handle.call(tool, tool.options);
		_initToolHandlers["id:"+normalizedId] &&
		_initToolHandlers["id:"+normalizedId].handle.call(tool, tool.options);
		setTimeout(function () {
			// Let Q.find traverse the rest of the tree first,
			// to make sure that it finds and constructs all the tools,
			// putting them on the list of toolsWaitingForInit.
			var toInit = _toolsToInit[tool.id];
			for (var parentId in toInit) {
				if (!Q.Tool.active[parentId]) {
					return;
				}
				var allInitialized = true;
				var childIds = _toolsWaitingForInit[parentId];
				for (var childId in childIds) {
					var a = Q.Tool.active[childId];
					if (!a) {
						allInitialized = false;
						break;
					}
					for (var childName in a) {
						var c = a[childName];
						if (!c || !c.initialized) {
							allInitialized = false;
							break;
						}
					}
				}
				if (allInitialized) {
					// Initialize parent tools which are ready to be initialized
					delete _toolsWaitingForInit[parentId];
					for (var parentName in Q.Tool.active[parentId]) {
						var p = Q.Tool.active[parentId][parentName];
						_doInit.call(p);
					}
				}
			}
			delete _toolsToInit[tool.id]; 
		}, 0);
	}
}

/**
 * Given a hash of values, returns the hostname and port for connecting to PHP server running Q
 * @static
 * @method baseUrl
 * @param {Object} where
 *  An object of field: value pairs
 * @return {String} Something of the form "scheme://hostname:port" or "scheme://hostname:port/subpath"
 */
Q.baseUrl = function _Q_host(where) {
	var result, i;
	for (i=0; i<Q.baseUrl.routers.length; ++i) {
		if (result = Q.baseUrl.routers[i](where)) {
			return result;
		}
	}
	return Q.info.proxyBaseUrl || Q.info.baseUrl; // By default, return the base url of the app
};
Q.baseUrl.routers = []; // functions returning a custom url

/**
 * Given some optional input identifying objects in the system,
 * returns the hostname and port for connecting to a Qbix Node.js server
 * set up for working with those objects.
 * @static
 * @method nodeUrl
 * @param {Object} where
 *  An object of field: value pairs
 * @return {String} "scheme://hostname:port"
 */
Q.nodeUrl = function _Q_node(where) {
	var result, i;
	for (i=0; i<Q.nodeUrl.routers.length; ++i) {
		if (result = Q.nodeUrl.routers[i](where)) {
			return result;
		}
	}
	return Q.info.nodeUrl;
};
Q.nodeUrl.routers = []; // functions returning a custom url

/**
 * Module for templates functionality
 * @class Q.Template
 * @constructor
 */
Q.Template = function () {

};

Q.Template.collection = {};
Q.Template.info = {};


/**
 * Sets the text and/or info of a template in this document's collection, and compiles it.
 * This is e.g. called by Q.loadUrl when the server sends over some templates,
 * so they won't have to be requested later.
 * @static
 * @method set
 * @param {String} name The template's name under which it will be found
 * @param {String} content The content of the template that will be processed by the template engine.
 *   To avoid setting the content (so the template will be loaded on demand later), pass undefined here.
 * @param {Object|String} info You can also pass a string "type" here.
 * @param {String} [info.type="handlebars"] The type of template.
 * @param {Array} [info.text] Names of sources for text translations, ending in .json or .js
 * @param {Array} [info.partials] Relative urls of .js scripts for registering partials.
 *   Can also be names of templates for partials (in which case they shouldn't end in .js)
 * @param {Array} [info.helpers] Relative urls of .js scripts for registering helpers
 * @param {String} [info.dir] The directory in which the template would be located. The URL would be Q.url(dir/name.type)
 * @return {Boolean} Returns false if template info with this name was already set before
 */
Q.Template.set = function (name, content, info, overwriteEvenIfAlreadySet) {
	var T = Q.Template;
	var n = Q.normalize(name);
	if (!overwriteEvenIfAlreadySet && T.info[n]) {
		return false;
	}
	T.remove(name);
	if (content !== undefined) {
		T.collection[n] = content;
	}
	info = (typeof info === 'string') ? { type: info } : (info || {});
	Q.Text.addedFor('Q.Template.set', n, info);
	info.type = info.type || 'handlebars';
	T.info[n] = info;
	Q.loadHandlebars();
};

/**
 * Removes a template that may have been set before
 * @static
 * @method remove
 * @param {String} name The template's name under which it will be found
 */
Q.Template.remove = function (name) {
	if (typeof name === 'string') {
		delete Q.Template.collection[Q.normalize(name)];
		Q.Template.load.cache.removeEach([name]);
		return;
	}
	Q.each(name, function (i, name) {
		Q.Template.remove(name);
	});
};

/**
 * This is used to compile a template once Handlebars is loaded
 * @static
 * @method compile
 * @param {String} content The content of the template
 * @param {String} [type="handlebars"] The type of the template
 * @return {Function} a function that can be called to render the template
 */
Q.Template.compile = function _Q_Template_compile (content, type) {
	type = type || 'handlebars';
	var r = Q.Template.compile.results;
	if (!r[content]) {
		if (type === 'handlebars') {
			r[content] = Handlebars.compile(content, Q.Template.compile.options);
		} else {
			r[content] = function (fields, options) {
				return content;
			};
		}
	}
	return r[content];
};
Q.Template.compile.options = {
	preventIndent: true,
	noEscape: true
};
Q.Template.compile.results = {};

function _processTemplateElements(container) {
	var tpl = Q.Template.collection;
	var tpi = Q.Template.info;
	var trash = [];
	Q.each(container.getElementsByTagName('template'), function () {
		var element = this;
		var id = this.id || this.getAttribute('data-name');
		var type = this.getAttribute('data-type') || 'handlebars';
		var n = Q.normalize(id);
		tpl[n] = this.innerHTML.decodeHTML().trim();
		tpi[n] = {type: type};
		Q.each(['partials', 'helpers', 'text'], function (i, aspect) {
			var attr = element.getAttribute('data-' + aspect);
			var value = attr && JSON.parse(attr);
			if (value) {
				tpi[n][aspect] = value;
			}
		});
		trash.unshift(element);
	});
	Q.each(trash, function () {
		Q.removeElement(this);
	});
}

/**
 * Load template from server and store to cache
 * @static
 * @method load
 * @param {String} name The template name. Here is how templates are found:
 *   First, load any new templates from the DOM found inside script tags with type "text/"+type.
 *   Then, check the cache. If not there, we try to load the template from dir+'/'+name+'.'+type
 * @param {Function} callback Receives two parameters: (err, templateText)
 * @param {String} [options.type='handlebars'] the type and extension of the template
 * @param {String} [options.dir] the folder under project web folder where templates are located
 * @param {String} [options.name] option to override the name of the template
 * @return {String|undefined}
 */
Q.Template.load = Q.getter(function _Q_Template_load(name, callback, options) {
	if (typeof callback === "object") {
		options = callback;
		callback = undefined;
	}
	options = options || {};
	if (options.name) {
		name = options.name;
	}
	if (!name) {
		console.error('Q.Template.load: name is empty');
		return;
	}
	// defaults to handlebars templates
	var o = Q.extend({}, Q.Template.load.options, options);
	var tpl = Q.Template.collection;

	_processTemplateElements(document);

	// check if template is cached
	var n = Q.normalize(name);
	var info = Q.Template.info[n];
	if (tpl && typeof tpl[n] === 'string') {
		var result = tpl[n];
		Q.handle(callback, this, [null, result]);
		return true;
	}
	// now try to load template from server
	function _callback(err, content) {
		if (err) {
			Q.Template.onError.handle(err);
			return callback(err, null);
		}
		if (info) {
			info.dir = dir;
			info.type = type;
		}
		tpl[n] = content.trim();
		callback(null, tpl[n]);
	}
	function _fail () {
		var err = 'Failed to load template "'+o.dir+'/'+name+'.'+o.type+'"';
		Q.Template.onError.handle(err);
		callback(err);
	}
	var dir = (info && info.dir) || o.dir;
	var type = (info && info.type) || o.type;
	var url = Q.url(dir + '/' + name + '.' + type);

	Q.request(url, _callback, {parse: false, extend: false});
	return true;
}, {
	cache: Q.Cache.document('Q.Template.load', 100),
	throttle: 'Q.Template.load'
});

Q.Template.load.options = {
	type: "handlebars",
	types: {
		"handlebars": true,
		"php": true,
		"json": true,
		"abi.json": true
	},
	dir: "Q/views"
};

Q.Template.onError = new Q.Event(function (err) {
	console.warn("Q.Template: " + Q.firstErrorMessage(err));
}, 'Q.Template');

/**
 * Render template taken from DOM or from file on server with partials
 * @static
 * @method render
 * @param {String|Object} name The name of template (see Q.Template.load).
 *   You can also pass an object of {key: name}, and then the callback receives
 *   {key: arguments} of what the callback would get.
 * @param {Object} fields The fields to pass to the template when rendering it
 * @param {Function} [callback] a callback - receives (error) or (error, html)
 * @param {Object} [options={}] Options for the template engine compiler. Also can include:
 * @param {String} [options.type='handlebars'] the type and extension of the template
 * @param {String} [options.dir] the folder under project web folder where templates are located
 * @param {String} [options.name] option to override the name of the template
 * @param {String} [options.tool] if the rendered HTML will be placed inside a tool, pass it here so that its prefix will be used
 * @return {Promise} can use this instead of callback
 */
Q.Template.render = Q.promisify(function _Q_Template_render(name, fields, callback, options) {
	if (typeof fields === "function") {
		options = callback;
		callback = fields;
		fields = {};
	}
	var isArray = Q.isArrayLike(name);
	if (isArray || Q.isPlainObject(name)) {
		var names = name;
		var p = Q.pipe(isArray ? names : Object.keys(names), callback);
		return Q.each(names, function (key, name) {
			Q.Template.render(
				name, fields, p.fill(isArray ? name : key), options
			);
		});
	}
	var templateName = (options && options.name) ? options.name : name;
	var tba = (options && options.tool) || Q.Tool.beingActivated;
	var pba = Q.Page.beingActivated;
	Q.loadHandlebars(function () {
		// load the template and its associated info
		var n = Q.normalize(templateName);
		var info = Q.Template.info[n];
		var p = Q.pipe(['template', 'partials', 'helpers', 'text'], function (params) {
			if (params.template[0]) {
				return callback(params.template[0]);
			}
			// the partials, helpers and text should have already been processed
			if (params.text[1]) {
				fields = Q.extend(fields, 10, params.text[1]);
			}
			var tbaOld = Q.Tool.beingActivated;
			var pbaOld = Q.Page.beingActivated;
			Q.Tool.beingActivated = tba;
			Q.Page.beingActivated = pba;
			try {
				var type = (info && info.type) || (options && options.type);
				var compiled = Q.Template.compile(params.template[1], type);
				callback(null, compiled(fields, options));
			} catch (e) {
				console.warn(e);
			}
			Q.Tool.beingActivated = tbaOld;
			Q.Page.beingActivated = pbaOld;
		});
		var o = Q.copy(options, ['type', 'dir', 'name']);
		Q.Template.load(templateName, p.fill('template'), o);
		Q.each(['partials', 'helpers', 'text'], function (j, aspect) {
			if (!info) {
				// template was not defined yet, so no partials/helpers/text to load
				return p.fill(aspect)();
			}
			var ia = info[aspect];
			if (typeof ia === 'string') {
				ia = [ia];
			}
			if (Q.isEmpty(ia)) {
				p.fill(aspect)();
			} else if (aspect === 'text') {
				Q.Text.get(ia, p.fill(aspect));
			} else if (aspect === 'partials') {
				var p2 = Q.pipe(ia, function (params) {
					var result = {};
					var errors = null;
					try {
						Q.each(ia, function (i, pname) {
							var r = result[pname] = params[pname][1];
							Handlebars.registerPartial(pname, r);
						});
						p.fill(aspect)([null, result]);
					} catch (e) {
						e.params = params;
						p.fill(aspect)([e]);
					}
				});
				Q.each(ia, function (i, pname) {
					if (pname.split('.').pop() === 'js') {
						Q.addScript(pname, p2.fill(pname));
						waitFor.push(pname);
					} else {
						Q.Template.load(pname, p2.fill(pname));
					}
				});
			} else {
				Q.addScript(ia, p.fill(aspect));
			}
		});
	});
}, false, 2);

/**
 * Module for loading text from files.
 * Used for translations, A/B testing and more.
 * @class Q.Text
 * @constructor
 */
Q.Text = {
	collection: {},
	language: 'en',
	locale: 'US',
	dir: 'Q/text',

	/**
	 * Sets the language and locale to use in Q.Text.get calls.
	 * When Q is initialized, it is set by default from Q.first(Q.info.languages)
	 * @method setLanguage
	 * @static
	 * @param {String} language Something like "en"
	 * @param {String} locale Something like "US", but can also be blank if unknown
	 */
	setLanguage: function (language, locale) {
		Q.Text.language = language.toLowerCase();
		Q.Text.locale = locale && locale.toUpperCase();
		Q.Text.languageLocaleString = Q.Text.language
			+ (Q.Text.useLocale && Q.Text.locale ? '-' + Q.Text.locale : '');
		Q.Text.languageLocale = Q.Text.language
			+ (Q.Text.locale ? '-' + Q.Text.locale : '');
	},

	/**
	 * Sets the text for a specific text source.
	 * @method set
	 * @static
	 * @param {String} name The name of the text source
	 * @param {Object} content The content, a hierarchical object whose leaves are
	 *  the actual text translated into the current language in Q.Text.language
	 * @param {Boolean} [merge=false] If true, merges on top instead of replacing
	 * @return {Object} The content that was set, with any loaded overrides applied
	 */
	set: function (name, content, merge) {
		var obj, override, n, o;
		var lls = Q.Text.languageLocaleString;
		if (Q.Text.override[name]) {
			// override was specified for this content, merge over it
			content = Q.extend({}, content, 10, Q.Text.override[name]);
		}
		if (merge) {
			obj = Q.getObject([lls, name], Q.Text.collection);
		}
		if (obj) {
			Q.extend(obj, 10, content);
		} else {
			Q.setObject([lls, name], content, Q.Text.collection);
		}
		override = (content && content['@override']) || {};
		for (n in override) {
			Q.Text.override[n] = Q.extend(Q.Text.override[n], 10, override[n]);
			if (o = Q.getObject([lls, n], Q.Text.collection)) {
				// content was already loaded, merge over it in text collection
				Q.extend(o, 10, Q.Text.override[n]);
			}
		}
		return content;
	},

	/**
	 * Get the text from a specific text source or sources.
	 * @method get
	 * @static
	 * @param {String|Array} name The name of the text source. Can be an array,
	 *  in which case the text sources are merged in the order they are named there.
	 * @param {Function} callback Receives (err, content), may be called sync or async,
	 *  where content is an Object formed by merging all the named text sources.
	 * @param {Object} [options] Options to use for Q.request . May also include:
	 * @param {Boolean} [options.ignoreCache=false] If true, reloads the text source even if it's been already cached.
	 * @param {Boolean} [options.merge=false] For Q.Text.set if content is loaded
	 * @return {Q.Promise} Returns a promise, that is already resolved if the content
	 *  was already loaded, otherwise resolves later (asynchronously)
	 */
	get: function (name, callback, options) {
		options = options || {};
		return new Q.Promise(function (resolve, reject) {
			var dir = Q.Text.dir;
			var lls = Q.Text.languageLocaleString;
			var content = Q.getObject([lls, name], Q.Text.collection);
			if (content) {
				Q.handle(callback, Q.Text, [null, content]);
				resolve(content);
				return;
			}
			var func = _Q_Text_getter;
			if (options && options.ignoreCache) {
				func = func.force;
			}
			var names = Q.isArrayLike(name) ? name : [name];
			var pipe = Q.pipe(names, function (params, subjects) {
				var result = {};
				var errors = null;
				for (var i=0, l=names.length; i<l; ++i) {
					var name = names[i];
					if (params[name][0]) {
						errors = errors || {};
						errors[name] = params[name][0];
					} else if (params[name][1]) {
						var text = Q.getObject(
							[Q.Text.languageLocaleString, name],
							Q.Text.collection
						) || params[name][1];
						Q.extend(result, 10, text);
					}
				}
				Q.handle(callback, Q.Text, [errors, result]);
				if (Q.isEmpty(errors)) {
					resolve(result);
				} else {
					reject(errors);
				}
			});
			Q.each(names, function (i, name) {
				var url = Q.url(dir + '/' + name + '/' + lls + '.json');
				return func(name, url, pipe.fill(name), options);
			});	
		});
	},

	/**
	 * Define text files in bulk for certain methods and name prefixes
	 * @param {String|Array} methods Can be "Q.Tool.define" or "Q.Template.set", or array of them
	 * @param {String} namePrefix The prefix for the names of tools to load the text files for
	 * @param {String|Array} textFileNames any additional files to have for Q.Tool.define
	 */
	addFor: function (methods, namePrefix, textFileNames) {
		if (!Q.isArrayLike(methods)) {
			methods = [methods]
		}
		if (!Q.isArrayLike(textFileNames)) {
			textFileNames = [textFileNames];
		}
		Q.each(methods, function (i, m) {
			Q.Text.addFor.defined = Q.Text.addFor.defined || {};
			var n = Q.normalize(namePrefix);
			var obj = {};
			obj[m] = obj[m] || {};
			obj[m][n] = textFileNames;
			Q.extend(Q.Text.addFor.defined, 3, obj);
		});
	},

	/**
	 * Get the array of text files added for this normalized name
	 * @param {String|Array} methods Can be "Q.Tool.define" or "Q.Template.set", or array of them
	 * @param {String} normalizedName The prefix for the names of tools to load the text files for
	 * @param {Object} objectToExtend This object's "text" property is extended
	 * @return {Array} the array of text files, if any
	 */
	addedFor: function (method, normalizedName, objectToExtend) {
		var d = Q.Text.addFor.defined[method];
		if (!d) {
			return [];
		}
		for (var namePrefix in d) {
			if (!normalizedName.startsWith(namePrefix)) {
				continue;
			}
			var text = objectToExtend.text = objectToExtend.text || [];
			Q.each(d[namePrefix], function (i, t) {
				if (text.indexOf(t) < 0) {
					text.push(t);
				}
			});
			break;
		}
		return text;
	},
	
	override: {}
};

Q.Text.addFor.defined = {};

/**
 * Array of text files to load before calling Q.onInit
 * @property {Array} loadBeforeInit
 */
Q.Text.loadBeforeInit = [];

// Set the initial language, but this can be overridden after Q.onInit
Q.Text.setLanguage.apply(Q.Text, navigator.language.split('-'));

var _Q_Text_getter = Q.getter(function (name, url, callback, options) {
	var o = Q.extend({extend: false}, options);
	return Q.request(url, function (err, content) {
		if (err && !url.endsWith("en.json")) {
			url = url.replace(/[^\/]{2,5}\.json$/, "en.json");
			return _Q_Text_getter.force(name, url, callback, options);
		} else {
			Q.Text.set(name, content, o.merge);
		}
		Q.handle(callback, Q.Text, [err, content]);
	}, o);
}, {
	cache: Q.Cache.document('Q.Text.get', 100),
	throttle: 'Q.Text.get'
});

var _qsockets = {}, _eventHandlers = {}, _connectHandlers = {}, _ioCleanup = [];
var _socketRegister = [];

function _ioOn(obj, evt, callback) {
	// In case we call this function again during a reconnect,
	// and the functions were already bound, remove them first.
	obj.off(evt, callback);
	obj.on(evt, callback);
 	_ioCleanup.push(function () { 
 		obj.off(evt, callback);
 	});
}

/**
 * Q.Socket class can be used to manage sockets (implemented with socket.io)<br>
 * Instantiate sockets with Q.Socket.connect
 * @class Q.Socket
 * @param {Object} params
 * @private
 * @constructor
 */
Q.Socket = function (params) {
	this.socket = params.socket;
	this.url = params.url;
	this.ns = params.ns;
};

/**
 * Returns a socket, if it was already connected, or returns undefined
 * @static
 * @method get
 * @param {String} ns The socket.io namespace
 * @param {String} url The url where socket.io is listening. If it's empty, then returns all matching sockets.
 * @return {Q.Socket}
 */
Q.Socket.get = function _Q_Socket_get(ns, url) {
	ns = ns || "";
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	if (!url) {
		return _qsockets[ns];
	}
	return _qsockets[ns] && _qsockets[ns][url];
};

/**
 * Returns all the sockets, whether connected or not.
 * Note that a socket really disconnects when all the namespaces disconnect.
 * @static
 * @method getAll
 * @return {Object} indexed by socket.io namespace, url
 */
Q.Socket.getAll = function _Q_Socket_all() {
	return _qsockets;
};

function _connectSocketNS(ns, url, callback, callback2, forceNew) {
	// load socket.io script and connect socket
	function _connectNS(ns, url, callback, callback2) {
		// connect to (ns, url)
		if (!root.io) return;
		var qs = _qsockets[ns] && _qsockets[ns][url];
		var o = forceNew ? {
			forceNew: true
		} : {};
		if (qs && qs.socket &&
		(qs.socket.io.connected || !Q.isEmpty(qs.socket.io.connecting))) {
			return;
		}
		// If we have a disconnected socket that is not connecting.
		// Forget this socket manager, we must connect another one
		// because g doesn't reconnect normally otherwise
		var baseUrl = Q.baseUrl();
		var parsed = url.parseUrl();
		var host = parsed.scheme + '://' + parsed.host 
			+ (parsed.port ? ':'+parsed.port : '');
		if (url.startsWith(host+'/')) {
			o.path = url.substr(host.length) + Q.getObject('Q.info.socketPath');
		}
		_qsockets[ns][url] = qs = new Q.Socket({
			socket: root.io.connect(host+ns, o),
			url: url,
			ns: ns
		});
		// remember actual socket - for disconnecting
		var socket = qs.socket;
		
		Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
		_ioOn(socket, 'connect', _connected);
		_ioOn(socket, 'connect_error', function (error) {
			console.log('Failed to connect to '+url, error);
		});
		_ioOn(socket.io, 'close', function () {
			console.log('Socket ' + ns + ' disconnected from '+url);
		});
		_ioOn(socket, 'error', function (error) {
			console.log('Error on connection '+url+' ('+error+')');
		});

		callback2 && callback2(_qsockets[ns][url], ns, url);
		
		function _Q_Socket_register(socket) {
			Q.each(_socketRegister, function (i, item) {
				if (item[0] !== ns) return;
				var name = item[1];
				_ioOn(socket, name, Q.Socket.onEvent(ns, url, name).handle); // may overwrite again, but it's ok
				_ioOn(socket, name, Q.Socket.onEvent(ns, '', name).handle);
				Q.handle(Q.Socket.onRegister, Q.Socket, [ns, url, name]);
			});
		}
		
		function _connected() {
			Q.Socket.onConnect().handle(this, ns, url);
			Q.Socket.onConnect(ns).handle(this, ns, url);
			Q.Socket.onConnect(ns, url).handle(this, ns, url);
			callback && callback(_qsockets[ns][url], ns, url);
			console.log('Socket connected to '+url);
		}
	}
	
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	
	if (root.io && root.io.Socket) {
		_connectNS(ns, url, callback, callback2);
	} else {
		var socketPath = Q.getObject('Q.info.socketPath');
		if (socketPath === undefined) {
			socketPath = '/socket.io';
		}
		Q.addScript(url+socketPath+'/socket.io.js', function () {
			_connectNS(ns, url, callback, callback2, forceNew);
		});
	}
}

/**
 * Connects a socket, and stores it in the list of connected sockets
 * @static
 * @method connect
 * @param {String} ns A socket.io namespace to use
 * @param {String} url The url of the socket.io node to connect to
 * @param {Function} [callback] Called after socket connects successfully. Receives Q.Socket
 * @param {Function} [callback2] Receives Q.Socket as soon as it's constructed
 */
Q.Socket.connect = function _Q_Socket_connect(ns, url, callback, callback2) {
	if (!url) {
		return false;
	}
	if (typeof ns === 'function') {
		callback = ns;
		ns = '';
	} else if (!ns) {
		ns = '';
	} else if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	if (!_qsockets[ns]) _qsockets[ns] = {};
	if (!_qsockets[ns][url]) {
		_qsockets[ns][url] = null; // pending
	}
	// check if socket already connected, or reconnect
	_connectSocketNS(ns, url, callback, callback2, false);
};

Q.Socket.onRegister = new Q.Event();

/**
 * Disconnects a socket corresponding to a Q.Socket
 * @method disconnect
 */
Q.Socket.prototype.disconnect = function _Q_Socket_prototype_disconnect() {
	if (!this.url) {
		console.warn("Q.Socket.prototype.disconnect: Attempt to disconnect socket with empty url");
		return;
	}
	var qs = Q.getObject([this.ns, this.url], _qsockets);
	if (!qs) {
		console.warn("Q.Socket.prototype.disconnect: Attempt to disconnect nonexistent socket: ", this.url);
		return;
	}
	qs.socket.disconnect();
};

Q.Socket.prototype.toJSON = function () {
	return {ns: this.ns, url: this.url};
};

/**
 * Disconnects all sockets that have been connected
 * @static
 * @param {String} ns Any namespace for the sockets to disconnect
 * @method disconnectAll
 */
Q.Socket.disconnectAll = function _Q_Socket_disconnectAll(ns) {
	if (ns) {
		Q.each(_qsockets[ns], function (url, socket) {
			socket && socket.disconnect();
		});
	} else {
		Q.each(_qsockets, function (ns, arr) {
			Q.each(arr, function (url, socket) {
				socket && socket.disconnect();
			});
		});
	}
};

/**
 * Reconnect all sockets that have been connected
 * @static
 * @method reconnectAll
 */
Q.Socket.reconnectAll = function _Q_Socket_reconnectAll() {
	var ns, url;
	for (ns in _qsockets) {
		for (url in _qsockets[ns]) {
			_connectSocketNS(ns, url, null, null, true);
		}
	}
};

/**
 * Completely remove all sockets, and de-register events
 * @static
 * @method destroyAll
 */
Q.Socket.destroyAll = function _Q_Socket_destroyAll() {
	Q.Socket.disconnectAll();
	setTimeout(function () {
		for (var i=0; i<_ioCleanup.length; i++) {
			_ioCleanup[i]();
		}
		_ioCleanup = [];
		_qsockets = {};
	}, 1000);
};

/**
 * Subscribe to a socket event and obtain a Q.Event based on the parameters
 * @event onEvent
 * @param {String} ns the namespace of the socket
 * @param {String} url the url of the socket
 * @param {String} name the name of the event
 */
Q.Socket.onEvent = Q.Event.factory(
	_eventHandlers, 
	["", "", "", function (ns, url, name) { 
		if (ns[0] !== '/') {
			return ['/'+ns, url, name];
		}
	}],
	function _Q_Socket_SetupEvent(ns, url, name) {
		// url may be empty, in which case we'll affect multiple sockets
		var event = this;
    	event.onFirst().set(function () {
			// The first handler was added to the event
			Q.each(Q.Socket.get(ns, url), function (url, qs) {
				function _Q_Socket_register(socket) {
					// this occurs when socket is connected
					_ioOn(socket, name, event.handle);
		    	}
				if (qs) { 
					// add listeners on sockets which are already constructed
					Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
				}
			});
			// add pending listeners on sockets that may constructed later
	    	_socketRegister.push([ns, name]);
		});
		event.onEmpty().set(function () {
			// Every handler was removed from the event
			Q.each(Q.Socket.get(ns, url), function (url, qs) {
				if (qs) { // remove listeners on sockets which are already constructed
					qs.socket.off(name, event.handle);
				}
			});
	    	Q.each(_socketRegister, function (i, item) {
				// remove pending listeners on sockets that may be constructed later
				if (item[0] === ns && item[1] === name) {
					_socketRegister.splice(i, 1);
				}
			});
		});

		return event;
	}
);

/**
 * Be notified when a socket connects and obtain a Q.Event based on the parameters
 * @event onConnect
 * @param {String} ns the namespace of the socket
 * @param {String} url the url of the socket
 */
Q.Socket.onConnect = Q.Event.factory(
	_connectHandlers, 
	["", "", function (ns, url) { 
		if (ns[0] !== '/') {
			return ['/'+ns, url];
		}
	}]
);

/**
 * Returns Q.Event which occurs on posted event coming from socket.io
 * Generic callbacks can be assigend by setting messageType to ""
 * @event onEvent
 * @param name {String} name of the event to listen for
 */
Q.Socket.prototype.onEvent = function(name) {
	return Q.Socket.onEvent(this.url, this.ns, name);
};

/**
 * Q.Animation class can be used to repeatedly call a function
 * in order to animate something
 * @class Q.Animation
 * @constructor
 * @param {Function} callback
 *  The function to call. It is passed the following parameters:
 *  * x = the position in the animation, between 0 and 1
 *  * y = the output of the ease function after plugging in x
 *  * params = the fourth parameter passed to the run function
 * @param {number} duration
 *  The number of milliseconds the animation should run
 * @param {String|Function} ease
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param {Number} [until=1] 
 *  Optionally specify the position at which to pause the animation
 * @param {Object} params
 *  Optional parameters to pass to the callback
 */
Q.Animation = function _Q_Animation(callback, duration, ease, until, params) {
	if (duration == undefined) {
		duration = 1000;
	}
	if (typeof until === "object") {
		params = until;
		until = 1;
	}
	if (typeof ease == "string") {
		ease = Q.Animation.ease[ease];
	}
	if (typeof ease !== 'function') {
		ease = Q.Animation.ease.smooth;
	}
	var anim = this;
	this.position = 0;
	this.milliseconds = 0;
	this.sinceLastFrame = 0;
	this.id = ++_Q_Animation_index;
	this.duration = duration;
	this.ease = ease;
	this.until = 1;
	this.callback = callback;
	this.params = params;
	this.onRewind = new Q.Event();
	this.onJump = new Q.Event();
	this.onPause = new Q.Event();
	this.onRefresh = new Q.Event();
	this.onComplete = new Q.Event();
};

var Ap = Q.Animation.prototype;

/**
 * Pause the animation
 * @method pause
 */
Ap.pause = function _Q_Animation_prototype_pause() {
	this.playing = false;
	delete Q.Animation.playing[this.id];
	this.onPause.handle.call(this);
	return this;
};

/**
 * Jump to a certain position in the animation.
 * When the animation plays, the next render will use this position.
 * Additionally, you might want to follow jump() with calls to render() and/or pause().
 * @method jump
 */
Ap.jump = function _Q_Animation_prototype_jump(position) {
	var lastPosition = this.position;
	this.position = position;
	this.milliseconds = this.duration * position;
	this.sinceLastFrame = 0;
	this.jumped = position;
	this.started = Q.milliseconds();
	this.onJump.handle.call(this, position, lastPosition);
	return this;
};

/**
 * Rewind the animation by pausing and jumping to position 0
 * @method rewind
 */
Ap.rewind = function _Q_Animation_prototype_rewind() {
	this.pause();
	this.jump(0);
	this.onRewind.handle.call(this);
	return this;
};

/**
 * Render the next frame of the animation, and potentially continue playing
 * @method nextFrame
 * @param {Number} [position] optionally render a specific position in the animation
 */
Ap.nextFrame = function _Q_Animation_prototype_render(position) {
	var anim = this;
	var ms = Q.milliseconds();
	requestAnimationFrame(function () {
		var _milliseconds = anim.milliseconds || 0;
		var qm = Q.milliseconds();
		anim.elapsed = qm - anim.started;
		anim.milliseconds += qm - ms;
		anim.sinceLastFrame = anim.milliseconds - _milliseconds;
		if (!anim.playing) { // it may have been paused by now
			return;
		}
		var x = anim.position = (anim.jumped == null)
			? (anim.elapsed / anim.duration)
			: (anim.elapsed / anim.duration) + anim.jumped;
		if (x >= anim.until) {
			Q.handle(anim.callback, anim, [1, anim.ease(1), anim.params]);
			anim.onRefresh.stop();
			anim.onComplete.handle.call(anim);
			anim.rewind();
			return;
		}
		anim.render(x);
		if (anim.playing) {
			anim.nextFrame();
		}
	});
};

/**
 * Render a given frame of the animation
 * @method render
 * @param {Number} [position] defaults to current position
 */
Ap.render = function _Q_Animation_prototype_render(position) {
	var x = (position === undefined) ? this.position : position;
	var y = this.ease(x);
	Q.handle(this.callback, this, [x, y, this.params]);
	this.onRefresh.handle.call(this, x, y, this.params);
};

/**
 * Play the animation (resume after a pause)
 * @method play
 * @param {Number} [until=1] optionally specify the position at which to pause the animation
 */
Ap.play = function _Q_Animation_instance_play(until) {
	Q.Animation.playing[this.id] = this;
	if (!this.playing) {
		this.started = Q.milliseconds();
	}
	this.playing = true;
	this.until = until || 1;
	this.nextFrame();
	return this;
};

/**
 * Play the animation
 * @static
 * @method play
 * @param {Function} callback
 *  The function to call. It is passed the following parameters:
 *  * x = the position in the animation, between 0 and 1
 *  * y = the output of the ease function after plugging in x
 *  * params = the fourth parameter passed to the run function
 * @param {number} duration
 *  The number of milliseconds the animation should run
 * @param {String|Function} ease
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param {Number} [until=1] 
 *  Optionally specify the position at which to pause the animation
 * @param {Object} params
 *  Optional parameters to pass to the callback
 */
Q.Animation.play = function _Q_Animation_play(callback, duration, ease, until, params) {
	var result = new Q.Animation(callback, duration, ease, until, params);
	return result.play();
};

/**
 * The frames per second, used if requestAnimationFrame isn't defined
 * @property {number} fps
 */
Q.Animation.fps = 60;

/**
 * Ease functions for animations
 * Contains "linear", "bounce", "smooth" and "inOutQuintic".
 * Feel free to add more.
 * @property {Object} ease
 */
Q.Animation.ease = {
	linear: function(fraction) {
		return fraction;
	},
	power: function (exponent) {
		return function(fraction) {
			return 1-Math.pow(1-fraction, exponent);
		};
	},
	bounce: function(fraction) {
		return Math.sin(Math.PI * 1.2 * (fraction - 0.5)) / 1.7 + 0.5;
	},
	smooth: function(fraction) {
		return Math.sin(Math.PI * (fraction - 0.5)) / 2 + 0.5;
	},
	easeInExpo: function (t) {
		return (t==0) ? 0 : Math.pow(2, 10 * (t - 1)) + 0 - 1 * 0.001;
	},
	inOutQuintic: function(t) {
		var ts = t * t;
		var tc = ts * t;
		return 6 * tc * ts + -15 * ts * ts + 10 * tc;
	}
};
Q.Animation.ease.swing = Q.Animation.ease.inOutQuintic;

function _listenForVisibilityChange() {
	var hidden, visibilityChange;
	Q.each(['', 'moz', 'ms', 'webkit', 'o'], function (i, k) {
		hidden = k ? k+'Hidden' : 'hidden';
		if (hidden in document) {
			visibilityChange = k+'visibilitychange';
			return false;
		}
	});
	Q.addEventListener(document, visibilityChange, function () {
		Q.onVisibilityChange.handle.call(document, [!document[hidden]]);
	}, false);
	Q.isDocumentHidden = function () {
		return document[hidden];
	};
}
_listenForVisibilityChange();

function _handleVisibilityChange() {
	if (document.hidden || document.msHidden 
	|| document.webkitHidden || document.oHidden) {
		return;
	}
	for (var k in Q.Animation.playing) {
		Q.Animation.playing[k].play();
	}
}
Q.onVisibilityChange.set(_handleVisibilityChange, 'Q.Animation');

Q.Animation.playing = {};
var _Q_Animation_index = 0;

Q.jQueryPluginPlugin = function _Q_jQueryPluginPlugin() {
	$ = $ || root.jQuery;
	if (!$ || $.fn.plugin) {
		return;
	}
	/**
	 * Loads a jQuery plugin if it is not there, then calls the callback
	 * @class jQuery.fn
	 * @static
	 * @method plugin
	 * @param {String} pluginName
	 * @param {Array|Mixed} options
	 * @param {Function} callback
	 */
	$.fn.plugin = function _jQuery_fn_plugin(pluginName, options, callback) {
		if (!this.length) return this;
		var args;
		switch (Q.typeOf(options)) {
			case 'function': // this is probably a callback
				callback = options;
				options = {};
				args = [];
			case 'array': // passing a bunch of parameters to a plugin
				args = options;
				break;
			case 'string': // calling the method of a plugin
				args = Array.prototype.slice.call(arguments, 1);
				callback = null;
				break;
			default:
				args = [options]; // assume there is one option and we will pass it as the first parameter
		}
		var that = this;
		$.fn.plugin.load(pluginName, function _jQuery_plugin_load_completed(results) {
			for (var k in results) {
				if (!results[k]) {
					throw new Q.Error("jQuery.fn.plugin: "+pluginName+" not defined");
				}
				results[k].apply(that, args);
				Q.handle(callback, that, args);
				break;
			}
		});
		return this;
	};
	/**
	 * The function used by the "plugin" plugin to load other plugins
	 * @static
	 * @method plugin.load
	 * @param {String|Array} pluginNames
	 * @param {Function} callback
	 * @param {Object} options
	 *  Optional. A hash of options for Q.addScript
	 */
	$.fn.plugin.load = function _jQuery_fn_load(pluginNames, callback, options) {
		var srcs = [];
		if (typeof pluginNames === 'string') {
			pluginNames = [pluginNames];
		}
		var results = {};
		Q.each(pluginNames, function _jQuery_plugin_loaded(i, pluginName) {
			var pn = Q.normalize(pluginName);
			results[pn] = pluginName;
			if ($.fn[pn]) return;
			var src = ($.fn.plugin[pn] || 'Q/plugins/jQuery/'+pn+'.js');
			if (typeof src === 'string') {
				srcs.push(src);
			}
		});
		Q.addScript(srcs, function _jQuery_plugin_script_loaded() {
			for (var pn in results) {
				results[pn] = $.fn[pn] || $.fn[ results[pn] ];
			}
			Q.handle(callback, root, [results]);
		}, options);
		return false;
	};
	/**
	 * Used to access the state of a plugin, e.g. $('#foo').state('Q/something').foo
	 * @static
	 * @method state
	 */
	$.fn.state = function _jQuery_fn_state(pluginName) {
		var key = Q.normalize(pluginName) + ' state';
		return $(this).data(key);
	};
	/**
	 * Calls Q.Tool.setUpElement on the elements in the jQuery.
	 * Follow this up with a call to .activate()
	 * @class jQuery.fn
	 * @static
	 * @method tool
	 * @param {String|Element} element
	 *  The tag of the element, such as "div", or a reference to an existing Element
	 * @param {String|Array} toolName
	 *  The type of the tool, such as "Q/tabs", or an array of types
	 * @param {Object|Array} [toolOptions]
	 *  The options for the tool. If toolName is an array, this is the array 
	 *  of corresponding objects to use for options.
	 * @param {String|Function} [id]
	 *  Optional id of the tool, such as "Q_tabs_2"
	 * @param {String} [prefix]
	 *  Optional prefix to prepend to the tool's id
	 * @param {Boolean} [lazyload=false]
	 *    Pass true to allow the tool to be lazy-loaded by a Q/lazyload tool if it is
	 *    activated on one of its containers.
	 */
	$.fn.tool = function _jQuery_fn_tool(toolName, toolOptions, id, prefix, lazyload) {
		var args = arguments;
		return this.each(function () {
			var id2 = (typeof id === 'function') ? id.apply(this, args) : id;
			Q.Tool.setUpElement(this, toolName, toolOptions, id2, prefix, lazyload);
		});
	};
	/**
	 * Calls Q.activate on all the elements in the jQuery.
	 * @static
	 * @method activate
	 * @param {Object} options
	 *  Optional options to provide to tools and their children.
	 * @param {Function|Q.Event} callback
	 *  This will get called for each element that has been completely activated.
	 *  That is, after files for each of its tools, if any,
	 *  have been loaded and all their constructors have run.
	 *  It receives (elem, options, tools) as arguments, and the last tool to be
	 *  activated as "this".
	 */
	$.fn.activate = function _jQuery_fn_activate(options, callback) {
		if (!this.length) {
			Q.handle(callback, null, options, []);
			return this;
		}
		return this.each(function _jQuery_fn_activate_each(index, element) {
			Q.activate(element, options, callback);
		});
	};
	$.fn.andSelf = $.fn.addBack || $.fn.andSelf;

	var htmlOriginal = $.fn.html;
	$.fn.html = function () {
		var args = Array.prototype.slice.call(arguments, 0);
		if (args.pop() === true) {
			this.each(function () {
				Q.Tool.clear(this);
			});
			return htmlOriginal.apply(this, args);
		}
		return htmlOriginal.apply(this, arguments);
	};
	
	Q.each({
		'on': 'off',
		'live': 'die',
		'bind': 'unbind'
	}, function (on, off) {
		var _jQuery_fn_on = $.fn[on];
		$.fn[on] = function _jQuery_on() {
			var args = Array.prototype.slice.call(arguments, 0)
			for (var f = args.length-1; f >= 0; --f) {
				if (typeof args[f] === 'function') {
					break;
				}
			} // assume f >= 1
			var af1, af2;
			af1 = af2 = args[f];
			var namespace = '';
			if (Q.isArrayLike(args[0])) {
				namespace = args[0][1] || '';
				if (namespace && namespace[0] !== '.') {
					namespace = '.' + namespace;
				}
				args[0] = args[0][0];
			}
			if (typeof args[0] === 'function') {
				var params = {
					original: args[f]
				};
				af2 = args[f] = args[0] ( params );
				af1.Q_wrapper = af2;
				if (!('eventName' in params)) {
					throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
				}
				args[0] = params.eventName;
			}
			if (namespace) {
				var parts = args[0].split(' ');
				for (var i=parts.length-1; i>=0; --i) {
					parts[i] += namespace;
				}
				args[0] = parts.join(' ');
			}
			var added;
			if (args[f-1] === true) {
				Q.Event.jQueryForPage.push([off, this, args[0], af2]);
				added = 'page';
			} else if (Q.typeOf(args[f-1]) === 'Q.Tool') {
				var tool = args[f-1], key = tool.id;
				if (!Q.Event.jQueryForTool[key]) {
					Q.Event.jQueryForTool[key] = [];
				}
				Q.Event.jQueryForTool[key].push([off, this, args[0], af2]);
				added = 'tool';
			}
			if (added) {
				args.splice(f-1, 1);
			}
			return _jQuery_fn_on.apply(this, args);
		};
		
		var _jQuery_fn_off = $.fn[off];
		$.fn[off] = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			var namespace = '';
			if (Q.isArrayLike(arguments[0])) {
				namespace = args[0][1] || '';
				if (namespace && namespace[0] !== '.') {
					namespace = '.' + namespace;
				}
				args[0] = args[0][0];
			}
			if (typeof args[0] === 'function') {
				var params = {};
				args[0] ( params );
				if (!('eventName' in params)) {
					throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
				}
				args[0] = params.eventName;
			}
			if (namespace) {
				var parts = args[0].split(' ');
				for (var i=parts.length-1; i>=0; --i) {
					parts[i] += namespace;
				}
				args[0] = parts.join(' ');
			}
			var f, af = null;
			for (f = args.length-1; f >= 0; --f) {
				if (typeof args[f] === 'function') {
					af = args[f];
					break;
				}
			}
			if (af && af.Q_wrapper) {
				args[f] = af.Q_wrapper;
			}
			return _jQuery_fn_off.apply(this, args);
		};
	});
};
Q.jQueryPluginPlugin();

_isCordova = /(.*)QCordova(.*)/.test(navigator.userAgent)
	|| location.search.queryField('Q.cordova')
	|| Q.cookie('Q_cordova');

var detected = Q.Browser.detect();
var maxTouchPoints = (root.navigator && root.navigator.maxTouchPoints) & 0xFF;
var isTouchscreen = ('ontouchstart' in root || !!maxTouchPoints);
var hasNoMouse = root.matchMedia ? !!root.matchMedia('(any-hover: none)') : null;
var useTouchEvents = isTouchscreen && (hasNoMouse === true);
var isTablet = navigator.userAgent.match(/tablet|ipad/i)
	|| (useTouchEvents && !navigator.userAgent.match(/mobi/i));
/**
 * Useful info about the page and environment
 * @property {Object} info
 */
Q.info = {
	useTouchEvents: useTouchEvents,
	isTouchscreen: isTouchscreen,
	isTablet: isTablet,
	isWebView: detected.isWebView,
	isStandalone: detected.isStandalone,
	isCordova: _isCordova,
	platform: detected.OS,
	browser: detected,
	isIE: function (minVersion, maxVersion) {
		return Q.info.browser.name === 'explorer'
			&& (minVersion == undefined || minVersion <= Q.info.browser.mainVersion)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.mainVersion);
	},
	isAndroid: function (maxWidth, maxHeight, minVersion, maxVersion) {
		return Q.info.platform === 'android'
			&& (maxWidth == undefined || maxWidth >= Q.Visual.windowWidth())
			&& (maxHeight == undefined || maxHeight >= Q.Visual.windowHeight())	
			&& (minVersion == undefined || minVersion <= Q.info.browser.mainVersion)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.mainVersion);
	},
	hasNotch: (function () {
	    var proceed = false;
	    var div = document.createElement('div');
		var CSS = window.CSS || null;
	    if (CSS && CSS.supports('padding-top: env(safe-area-inset-top)')) {
	        div.style.paddingTop = 'env(safe-area-inset-top)';
	        proceed = true;
	    } else if (CSS && CSS.supports('padding-top: constant(safe-area-inset-top)')) {
	        div.style.paddingTop = 'constant(safe-area-inset-top)';
	        proceed = true;
	    }
	    if (CSS && CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
	        div.style.paddingBottom = 'env(safe-area-inset-bottom)';
	        proceed = true;
	    } else if (CSS && CSS.supports('padding-bottom: constant(safe-area-inset-bottom)')) {
	        div.style.paddingBottom = 'constant(safe-area-inset-bottom)';
	        proceed = true;
	    }
	    if (proceed) {
	        document.body.appendChild(div);
	        var calculatedPadding = parseInt(div.computedStyle('padding-top'))
				+ parseInt(div.computedStyle('padding-bottom'));
	        document.body.removeChild(div);
	        if (calculatedPadding > 40) {
	            return true;
	        }
	    }
		return false;
	})()
};
Q.info.isAndroidStock = !!(Q.info.platform === 'android'
	&& navigator.userAgent.match(/Android .*Version\/[\d]+\.[\d]+/i));
Q.info.isMobile = Q.info.isTouchscreen && !Q.info.isTablet;
Q.info.formFactor = Q.info.isMobile ? 'mobile' : (Q.info.isTablet ? 'tablet' : 'desktop');
var de = document.documentElement;
de.addClass('Q_js');

Q.ignoreBackwardCompatibility = {
	dashboard: false,
	notices: false
};

Q.Page.onLoad('').set(function () {
	de.addClass(Q.info.uri.module + '_' + Q.info.uri.action)
		.addClass(Q.info.uri.module);
}, 'Q');
Q.Page.beforeUnload('').set(function () {
	de.removeClass(Q.info.uri.module + '_' + Q.info.uri.action)
		.removeClass(Q.info.uri.module);
}, 'Q');

function _touchScrollingHandler(event) {
	if (!Q.isEmpty(Q.Visual.preventRubberBand.suspend)) {
		return false;
	}
    var p = event.target;
	var pos;
	var scrollable = null;
	do {
		if (!p.computedStyle) {
			continue;
		}
		var overflow = p.computedStyle().overflow;
		var hiddenWidth = p.scrollWidth - Math.min(
			p.offsetWidth, Q.Visual.windowWidth()
		);
		var q = (p.tagName === 'HTML')
			? document.body
			: p;
		var hiddenHeight = q.scrollHeight - Math.min(
			p.offsetHeight, Q.Visual.windowHeight()
		);
		var s = (['hidden', 'visible'].indexOf(overflow) < 0);
		if ((s || p.tagName === 'HTML')
		&& hiddenHeight > 0
		&& Q.Visual.movement) {
			if (_touchScrollingHandler.options.direction != 'horizontal'
			&& (Q.Visual.movement.positions.length == 1)
			&& (pos = Q.Visual.movement.positions[0])) {
				var sy = Q.Visual.getY(event) - Q.Visual.scrollTop();
				if ((sy > pos.y && q.scrollTop == 0)
				|| (sy < pos.y && q.scrollTop >= hiddenHeight)) {
					continue;
				}
			}
			scrollable = p;
			break;
		}
		if (!scrollable
		&& (s || p.tagName === 'HTML') && hiddenWidth > 0) {
			if (_touchScrollingHandler.options.direction != 'vertical'
			&& (Q.Visual.movement.positions.length == 1)
			&& (pos = Q.Visual.movement.positions[0])) {
				var sx = Q.Visual.getX(event) - Q.Visual.scrollLeft();
				if ((sx > pos.x && q.scrollLeft == 0)
				|| (sx < pos.x && q.scrollLeft >= hiddenWidth)) {
					continue;
				}
			}
			scrollable = p;
			break;
		}
	} while (p = p.parentNode);
    if (!scrollable) {
        Q.Visual.preventDefault(event);
    }
}

_touchScrollingHandler.options = {
	direction: 'both'
};

function _touchBlurHandler(event) {
	var o = _touchBlurHandler.options.blur;
	if (!o.blur) return;
	var target = Q.Visual.target(event);
	var ae = document.activeElement;
	if (ae && (typeof ae.blur === 'function')
	&& (ae !== target)) {
		if (o.blur.indexOf(target.tagName.toUpperCase()) >= 0
		|| (o.blurContentEditable && target.getAttribute('contenteditable'))) {
			var f = function () {
				target.focus();
				Q.removeEventListener(root, 'click', f);
			};
			Q.addEventListener(root, 'click', f);
		} else {
			ae.blur();
		}
	}
}

_touchBlurHandler.options = {
	blur: ['INPUT', 'TEXTAREA', 'SELECT'],
	blurContentEditable: true
};

function _detectOrientation(e) {
	var w = window;
	var d = document;
	var h = d.documentElement;
	var b = d.getElementsByTagName('body')[0];
	var x = w.innerWidth || h.clientWidth || (b && b.clientWidth);
	var y = w.innerHeight|| h.clientHeight|| (b && b.clientHeight);
	var m = w.matchMedia;
	if ((m && m("(orientation: landscape)").matches) || x > y) {
		h.removeClass('Q_verticalOrientation')
			.addClass('Q_horizontalOrientation');
		Q.info.isVertical = false;
	} else {
		h.removeClass('Q_horizontalOrientation')
			.addClass('Q_verticalOrientation');
		Q.info.isVertical = true;
	}
}

function _setLayoutInterval(e) {
	if (!Q.info.isTouchscreen
	|| !_setLayoutInterval.options.milliseconds) {
		return;
	}
	var w = Q.Visual.windowWidth();
	var h = Q.Visual.windowHeight();
	var interval = setInterval(function () {
		var ae = document.activeElement;
		if (ae && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(ae.tagName.toUpperCase()) >= 0) {
			return;
		}
		var w2 = Q.Visual.windowWidth();
		var h2 = Q.Visual.windowHeight();
		if (w !== w2 || h !== h2) {
			Q.layout();
		}
		w = w2;
		h = h2;
	}, _setLayoutInterval.options.milliseconds);
}

_setLayoutInterval.options = {
	milliseconds: 300
};

/**
 * Methods for working with the clipboard
 * @class Q.Clipboard
 */
Q.Clipboard = {
	/**
	 * @method Q.Clipboard
	 * @static
	 * @param {String} the text to copy
	 */
	copy: function (text) {
        var range, selection;
		var textArea = document.createElement('textarea');
		textArea.value = text;
		document.body.appendChild(textArea);
        if (Q.info.platform === 'ios') {
            range = document.createRange();
            range.selectNodeContents(textArea);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            textArea.setSelectionRange(0, 999999);
        } else {
            textArea.select();
        }
		document.execCommand('copy');
		document.body.removeChild(textArea);
	}
};

function _Q_Pointer_start_end_handler (e) {
	Q.Visual.startedWhileRecentlyScrolled = false;
	Q.removeEventListener(e.target, Q.Visual.end, _Q_Pointer_start_end_handler);
	Q.Visual.stopCancelingClicksOnScroll(e.target);
}

/**
 * Methods for working with pointer and touchscreen events
 * @class Q.Visual
 */
Q.Visual = Q.Pointer = {
	/**
	 * Intelligent pointer start event that also works on touchscreens
	 * @static
	 * @method start
	 */
	start: function _Q_Pointer_start(params) {
		params.eventName = Q.info.useTouchEvents ? 'touchstart' : 'mousedown';
		return function (e) {
			Q.Visual.movedTooMuchForClickLastTime = false;
			if (Q.Visual.recentlyScrolled) {
				Q.Visual.startedWhileRecentlyScrolled = true;
			} else {
				Q.Visual.canceledClick = false;
			}
			Q.Visual.startCancelingClicksOnScroll(e.target);
			Q.removeEventListener(e.target, Q.Visual.end, _Q_Pointer_start_end_handler);
			Q.addEventListener(e.target, Q.Visual.end, _Q_Pointer_start_end_handler);
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Intelligent pointer end event that also works on touchscreens
	 * @static
	 * @method end
	 */
	end: function _Q_Pointer_end(params) {
		params.eventName = Q.info.useTouchEvents ? 'touchend' : 'mouseup';
		return params.original;
	},
	/**
	 * Intelligent pointer move event that also works on touchscreens
	 * @static
	 * @method move
	 */
	move: function _Q_Pointer_move(params) {
		params.eventName = Q.info.useTouchEvents ? 'touchmove' : 'mousemove';
		return params.original;
	},
	/**
	 * Intelligent pointer enter event that also works on touchscreens
	 * @static
	 * @method enter
	 */
	enter: function _Q_Pointer_enter(params) {
		params.eventName = Q.info.useTouchEvents ? 'touchenter' : 'mouseenter';
		return params.original;
	},
	/**
	 * Intelligent pointer leave event that also works on touchscreens
	 * @static
	 * @method leave
	 */
	leave: function _Q_Pointer_leave(params) {
		params.eventName = Q.info.useTouchEvents ? 'touchleave' : 'mouseleave';
		return params.original;
	},
	/**
	 * Intelligent pointer cancel event that also works on touchscreens
	 * @static
	 * @method cancel
	 */
	cancel: function _Q_Pointer_cancel(params) {
		params.eventName = Q.info.useTouchEvents ? 'touchcancel' : 'mousecancel'; // mousecancel can be a custom event
		return params.original;
	},
	/**
	 * Intelligent focusin event that fires only once per focusin
	 * @static
	 * @method focusin
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	focusin: function (params) {
		params.eventName = (Q.info.browser.engine === 'gecko' ? 'focus' : 'focusin');
		var justHandled = false;
		return function _Q_focusin_on_wrapper (e) {
			if (justHandled) return;
			justHandled = true;
			setTimeout(function () {
				justHandled = false;
			}, 300);
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Intelligent focusout event that fires only once per focusout
	 * @static
	 * @method focusout
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	focusout: function (params) {
		params.eventName = (Q.info.browser.engine === 'gecko' ? 'blur' : 'focusout');
		var justHandled = false;
		return function _Q_focusout_on_wrapper (e) {
			if (justHandled) return;
			justHandled = true;
			setTimeout(function () {
				justHandled = false;
			}, 300);
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Intelligent click event that also works on touchscreens, and respects Q.Visual.canceledClick
	 * @static
	 * @method click
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	click: function _Q_click(params) {
		params.eventName = 'click';
		return function _Q_click_on_wrapper (e) {
			if (Q.Visual.canceledClick) {
				return Q.Visual.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Like click event but fires much sooner on touchscreens,
	 * and respects Q.Visual.canceledClick
	 * @static
	 * @method fastclick
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	fastclick: function _Q_fastclick (params) {
		params.eventName = Q.info.useTouchEvents ? 'touchend' : 'click';
		return function _Q_fastclick_on_wrapper (e) {
			var oe = e.originalEvent || e;
			if (oe.type === 'touchend') {
				if (oe.touches && oe.touches.length) {
					return; // still some touches happening
				}
				Q.Visual.touches = oe.touches;
			}
			var x = Q.Visual.getX(e), y = Q.Visual.getY(e);
			var elem = (!isNaN(x) && !isNaN(y)) && Q.Visual.elementFromPoint(x, y);
			if (!(elem instanceof Element)){
				return;
			}
			if (Q.Visual.canceledClick
			|| !this.contains(Q.Visual.started || null)
			|| !this.contains(elem)) {
				return Q.Visual.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Like click event but works on touchscreens even if the viewport moves 
	 * during click, such as when the on-screen keyboard disappears
	 * or a scrolling parent gets scrollTop = 0 because content changed.
	 * Respects Q.Visual.canceledClick
	 * @static
	 * @method touchclick
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	touchclick: function _Q_touchclick (params) {
		if (!Q.info.isTouchscreen) {
			return Q.Visual.click(params);
		}
		params.eventName = Q.info.useTouchEvents ? 'touchstart' : 'mousedown';
		return function _Q_touchclick_on_wrapper (e) {
			var _relevantClick = true;
			var t = this, a = arguments;
			function _clickHandler(e) {
				Q.removeEventListener(root, 'click', _clickHandler);
				if (Q.Visual.canceledClick) {
					return Q.Visual.preventDefault(e);
				}
				if (_relevantClick) {
					params.original.apply(t, a);
				}
			}
			function _touchendHandler(e) {
				Q.removeEventListener(this, 'touchend', _touchendHandler);
				setTimeout(function () {
					_relevantClick = false;
				}, Q.Visual.touchclick.duration);
			}
			Q.addEventListener(root, 'click', _clickHandler);
			Q.addEventListener(this, 'touchend', _touchendHandler);
		};
	},
	/**
	 * Normalized mouse wheel event that works with various browsers
	 * @static
	 * @method click
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	wheel: function _Q_wheel (params) {
		// Modern browsers support "wheel",
		// Webkit and IE support at least "mousewheel",
		// and let's assume that remaining browsers are older Firefox
		_Q_wheel.div = document.createElement("div");
		params.eventName = ("onwheel" in _Q_wheel.div) ? "wheel" :
			(document.onmousewheel !== undefined) ? "mousewheel" : 
			"DOMMouseScroll MozMousePixelScroll";
		return function _Q_wheel_on_wrapper (e) {
			var oe = e.originalEvent || e;
			e.type = 'wheel';
			e.deltaMode = (oe.type == "MozMousePixelScroll") ? 0 : 1;
			e.deltaX = oe.deltaX || 0;
			e.deltaY = oe.deltaY || 0;
			e.deltaZ = oe.deltaZ || 0;
			
			// calculate deltaY (and deltaX) according to the event
			switch (params.eventName) {
			case 'mousewheel':
				// Webkit also supports wheelDeltaX
				oe.wheelDelta && ( e.deltaY = -Math.ceil(1/3 * oe.wheelDelta) );
				oe.wheelDeltaX && ( e.deltaX = -Math.ceil(1/3 * oe.wheelDeltaX) );
				break;
			case 'wheel':
			default:
				e.deltaY = ('deltaY' in oe) ? oe.deltaY : oe.detail;
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Whether the click was canceled by Q.Visual.cancelClick()
	 * @static
	 * @property {boolean} canceledClick
	 */
	canceledClick: false,
	/**
	 * Returns the document's scroll left in pixels, consistently across browsers
	 * @static
	 * @method scrollLeft
	 * @return {number}
	 */
	scrollLeft: function () {
		return root.pageXOffset || document.documentElement.scrollLeft || (document.body && document.body.scrollLeft);
	},
	/**
	 * Returns the document's scroll top in pixels, consistently across browsers
	 * @static
	 * @method scrollTop
	 * @return {number}
	 */
	scrollTop: function () {
		return root.pageYOffset || document.documentElement.scrollTop || (document.body && document.body.scrollTop);
	},
	/**
	 * Returns the document's left position in pixels, consistently across browsers
	 * @static
	 * @method positionLeft
	 * @return {number}
	 */
	positionLeft: function () {
		var documentPosition = document.documentElement.getBoundingClientRect().left;
		var bodyPosition = 0;
		if (document.body) {
			bodyPosition = document.body.getBoundingClientRect().left;
		}

		return root.pageXOffset || documentPosition || bodyPosition;
	},
	/**
	 * Returns the document's top position in pixels, consistently across browsers
	 * @static
	 * @method positionTop
	 * @return {number}
	 */
	positionTop: function () {
		var documentPosition = -document.documentElement.getBoundingClientRect().top;
		var bodyPosition = 0;
		if (document.body) {
			bodyPosition = -document.body.getBoundingClientRect().top;
		}

		return root.pageYOffset || documentPosition || bodyPosition;
	},
	/**
	 * Returns the window's inner width, in pixels, consistently across browsers
	 * @static
	 * @method windowWidth
	 * @return {number}
	 */
	windowWidth: function () {
		return root.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	},
	/**
	 * Returns the window's inner height, in pixels, consistently across browsers
	 * @static
	 * @method windowHeight
	 * @return {number}
	 */
	windowHeight: function () {
		return root.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	},
	/**
	 * Get the rectangle enclosing all the children of the container element
	 * and – for their children with overflow: visible – their overflowed contents.
	 * @static
	 * @method boundingRect
	 * @param {HTMLElement} [container=document.body] The container element
	 * @param {Array} [omitClasses] Put CSS classes of any elements to omit from calculations
	 * @param {boolean} [omitOverflow=false] If true, doesn't use overflowed content in calculations
	 * @return {Object} with properties left, right, top, bottom, width, height
	 */
	boundingRect: function (container, omitClasses, omitOverflow) {
		var rect = {left: 0, top: 0};
		rect.right = Q.Visual.windowWidth();
		rect.bottom = Q.Visual.windowHeight();
		container = container || document.body;
		var sl = Q.Visual.scrollLeft();
		var st = Q.Visual.scrollTop();
		Q.each(container.children || container.childNodes, function () {
			if (this.hasClass && omitClasses) {
				for (var i=0, l=omitClasses.length; i<l; ++i) {
					if (this.hasClass(omitClasses[i])) return;
				}
			}
			var bcr = this.getBoundingClientRect();
			var r = {
				left: bcr.left,
				top: bcr.top,
				right: bcr.right,
				bottom: bcr.bottom
			};
			if (!r) return;
			r.left += sl; r.right += sl;
			r.top += st; r.bottom += st;
			var cs = this.computedStyle();
			if (!omitOverflow && cs.overflow === 'visible') {
				if (this.scrollWidth > r.right - r.left) {
					r.right += this.scrollWidth - (r.right - r.left);
					r.left -= this.scrollLeft;
				}
				if (this.scrollHeight > r.bottom - r.top) {
					r.bottom += this.scrollHeight - (r.bottom - r.top);
					r.top -= this.scrollTop;
				}
			}
			if (r.right - r.left == 0 || r.bottom - r.top == 0) return;
			rect.left = Math.min(rect.left, r.left);
			rect.top = Math.min(rect.top, r.top);
			rect.right = Math.max(rect.right, r.right);
			rect.bottom = Math.max(rect.bottom, r.bottom);
		});
		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;
		return rect;
	},
	/**
	 * Sets an observer to wait for an element become visible.
	 * @static
	 * @method waitUntilVisible
	 * @param {Element|Q.Tool} element the element to watch
	 * @param {Function} callback The function called by the IntersectionObserver, takes (entries, observer).
	 *   Only called when entries[0].isIntersecting is true.
	 * @param {Object|Number} options The options to pass to the observer
	 * @return {IntersectionObserver}
	 */
	waitUntilVisible: function (element, callback, options) {
		var tool;
		if ((Q.typeOf(element) === 'Q.Tool')) {
			tool = element;
			element = tool.element;
		}
		var o = Q.extend({}, Q.Visual.waitUntilVisible, options);
		var observer = new IntersectionObserver(function (entries, observer) {
			if (entries[0] && entries[0].isIntersecting) {
				callback && callback.apply(this, arguments);
				observer.unobserve(element);
			}
		}, o);
		observer.observe(element);
		if (tool) {
			tool.Q.beforeRemove.set(function () {
				observer.unobserve(element);
			});
		}
		return observer;
	},
	/**
	 * Works together with Q.Visual.animationStarted
	 * Calls the callback after all current animations have ended.
	 * @static
	 * @method waitUntilAnimationsEnd
	 * @param {Function} callback The callback may synchronously call 
	 *   animationStarted(), which will delay any subsequent callbacks,
	 *   so any such callbacks would start animations sequentially.
	 * @param {Array} params The parameters to send to the callback, if any
	 */
	waitUntilAnimationsEnd: function (callback, params) {
		setTimeout(_executeIfAnimationsEnded, 0);
		function _executeIfAnimationsEnded() {
			var a = Q.Visual.animationStarted;
			if (a.animationsEnding < Date.now()) {
				Q.handle(callback, Q.Visual, params);
			} else {
				setTimeout(_executeIfAnimationsEnded, a.animationsEnding - Date.now);
			}
		}
	},
	/**
	 * Just call this to indicate that a transient animation has started,
	 * in case someone wants to wait for all transient animations to end
	 * they will call waitUntilAnimationsEnd()
	 * @param {Number} duration in milliseconds
	 */
	animationStarted: function (duration) {
		var a = Q.Visual.animationStarted;
		a.animationsEnding = a.animationsEnding || 0;
		if (a.animationsEnding < Date.now()) {
			a.animationsStarted = Date.now();
			a.animationsEnding = a.animationsStarted + duration;
		} else {
			a.animationsEnding += duration;
		}
	},
	/**
	 * Returns the x coordinate of an event relative to the document
	 * @static
	 * @method getX
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @param {Integer} [touchIndex=0] The index inside array of touches, if any
	 * @return {number}
	 */
	getX: function(e, touchIndex) {
		var oe = e.originalEvent || e;
		touchIndex = touchIndex || 0;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[touchIndex]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[touchIndex]
				: oe
			);
		return Math.max(0, ('pageX' in oe) ? oe.pageX : oe.clientX + Q.Visual.scrollLeft());
	},
	/**
	 * Returns the y coordinate of an event relative to the document
	 * @static
	 * @method getY
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @param {Integer} [touchIndex=0] The index inside array of touches, if any
	 * @return {number}
	 */
	getY: function(e, touchIndex) {
		var oe = e.originalEvent || e;
		touchIndex = touchIndex || 0;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[touchIndex]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[touchIndex]
				: oe
			);
		return Math.max(0, ('pageY' in oe) ? oe.pageY : oe.clientY + Q.Visual.scrollTop());
	},
	/**
	 * Returns the number of touch points of an event
	 * @static
	 * @method touchCount
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	touchCount: function (e) {
		var oe = e.originalEvent || e;
 		return oe.touches ? oe.touches.length : (Q.Visual.which(e) > 0 ? 1 : 0);
	},
	/**
	 * Returns which button was pressed - Q.Visual.which.{LEFT|MIDDLE|RIGHT|NONE}
	 * @static
	 * @method which
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	which: function (e) {
		var button = e.button, which = e.which;
		if (!which && button !== undefined ) {
			which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
		}
		return which;
	},
	/**
	 * Return whether button was pressed or at least one finger is touching touchscreen
	 * @static
	 * @method isPressed
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {boolean}
	 */
	isPressed: function (e) {
		return !!(Q.Visual.which(e) || Q.Visual.touchCount(e));
	},
	/**
	 * Consistently returns the target of an event across browsers
	 * @static
	 * @method target
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {HTMLElement}
	 */
	target: function (e) {
		var target = e.target || e.srcElement;
		if (target.nodeType === 3) { // Safari bug
			target = target.parentNode;
		}
		return target;
	},
	/**
	 * Consistently returns the related target of an event across browsers
	 * @static
	 * @method relatedTarget
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	relatedTarget: function (e) {
		e.relatedTarget = e.relatedTarget || (e.type == 'mouseover' ? e.fromElement : e.toElement);	
	},
	/**
	 * Computes the offset of an element relative to the browser
	 * @static
	 * @method offset
	 * @param {Element} element
	 * @return {Object} An object with "left" and "top" properties.
	 */
	offset: function (element) {
		var offsetLeft = 0, offsetTop = 0;
		do {
			if (!isNaN(element.offsetLeft)) {
				offsetLeft += element.offsetLeft;
			}
			if (!isNaN(element.offsetTop)) {
				offsetTop += element.offsetTop;
			}
		} while (element = element.offsetParent);
		return { left: offsetLeft,  top: offsetTop };
	},
	/**
	 * Places a hint to click or tap on the screen
	 * @static
	 * @method hint 
	 * @param {Element|Object|String|Array} targets Indicates where to display the hint. A point should contain properties "x" and "y". Can also be a String selector referring to one or more elements after the show.delay, or an array of points, elements, or string css selectors to use with document.querySelector.
	 * @param {Object} [options] possible options, which can include:
	 * @param {String} [options.src] the url of the hint pointer image
	 * @param {Point} [options.hotspot={x:0.5,y:0.3}] "x" and "y" represent the location of the hotspot within the image, using fractions between 0 and 1
	 * @param {String} [options.classes=""] Additional CSS classes to add to hint images
	 * @param {Object} [options.styles=""] Additional CSS styles to add to hint images
	 * @param {String} [options.width="200px"]
	 * @param {String} [options.height="200px"]
	 * @param {Integer} [options.zIndex=99999]
	 * @param {Boolean|Object} [options.waitUntilVisible=false] Wait until it's visible, then show hint right away. You can also pass an options here for Q.Visual.waitUntilVisible(). Typically used together with dontStopBeforeShown.
	 * @param {Boolean} [options.dontStopBeforeShown=false] Don't let Q.Visual.stopHints stop this hint before it's shown.
	 * @param {boolean} [options.dontRemove=false] Pass true to keep current hints displayed
	 * @param {boolean} [options.neverRemove=false] Pass true to keep current hints displayed even after user interaction.
	 * @param {boolean} [options.tooltip] Can be used to show a tooltip with some html
	 * @param {boolean} [options.tooltip.text] Use to put text in the tooltip
	 * @param {boolean} [options.tooltip.html] Use to put text in the tooltip (overrides text)
	 * @param {boolean} [options.tooltip.index=0] The index of the image to which to attach the tooltip
	 * @param {boolean} [options.tooltip.className='Q_pulsate'] You can override the additional class name / animation effect
	 * @param {boolean} [options.tooltip.margin=10] The margin to put around the tooltip if it gets too close to the edges
	 * @param {Object} [options.speak] Can be used to speak some text. See Q.Audio.speak()
	 *  function for options you can pass in this object
	 * @param {String} [options.speak.text] The text to speak.
	 * @param {String} [options.audio.src] Can be used to play an audio file.
	 * @param {String} [options.audio.from=0] Number of seconds inside the audio to start playing the audio from. Make sure audio is longer than this.
	 * @param {String} [options.audio.until] Number of seconds inside the audio to play the audio until. Make sure audio is longer than this.
	 * @param {Boolean} [options.audio.removeAfterPlaying=false] Whether to remove the audio object after playing
	 * @param {Integer} [options.show.delay=500] How long to wait after the function call (or after audio file or speech has loaded and starts playing, if one was specified) before showing the hint animation
	 * @param {Integer} [options.show.initialScale=10] The initial scale of the hint pointer image in the show animation
	 * @param {Integer} [options.show.duration=500] The duration of the hint show animation
	 * @param {Function} [options.show.ease=Q.Animation.ease.smooth]
	 * @param {Integer} [options.hide.after=null] Set an integer here to hide the hint animation after the specified number of milliseconds
	 * @param {Integer} [options.hide.duration=500] The duration of the hint hide animation
	 * @param {Function} [options.hide.ease=Q.Animation.ease.smooth]
	 * @return {HTMLElement|IntersectionObserver} img1 - Hint image element, or an intersection observer if waitUntilVisible is true
	 */
	hint: function (targets, options) {

		options = Q.extend({}, Q.Visual.hint.options, 10, options);
		if (options.waitUntilVisible) {
			return Q.Visual.waitUntilVisible(targets[0], function (entries, observer) {
				if (entries[0].isIntersecting) {
					var sp = entries[0].target.scrollingParent();
					var st = sp.scrollTop;
					var ival = setInterval(function () {
						if (st === sp.scrollTop) {
							// scrolling paused for a little bit
							clearInterval(ival);
							options.waitUntilVisible = false;
							options.dontStopBeforeShown = true;
							Q.Visual.hint(targets, options);
						}
						st = sp.scrollTop;
					}, 300);
				}
			}, options.waitUntilVisible === true ? {} : options.waitUntilVisible);
		}

		var args = Array.prototype.slice.call(arguments, 0);
		var img, img1, i, l;
		var imageEvent = options.imageEvent || new Q.Event();
		var audioEvent = options.audioEvent || new Q.Event();
		var hintEvent = imageEvent.and(audioEvent);
		if (!options.dontRemove && !options.waitForEvents) {
			for (i=0, l=Q.Visual.hint.imgs.length; i<l; ++i) {
				img = Q.Visual.hint.imgs[i];
				if (img.parentNode) {
					img.parentNode.removeChild(img);
				}
				if (img.tooltip && img.tooltip.parentNode) {
					img.tooltip.parentNode.removeChild(img.tooltip);
				}
			}
			Q.Visual.hint.imgs = [];
		}
		img1 = document.createElement('img');
		img1.setAttribute('src', Q.url(options.src));
		Q.extend(img1.style, {
			position: 'absolute',
			width: options.width,
			height: options.height,
			left: 0,
			top: 0,
			display: 'block',
			pointerEvents: 'none'
		});
		img1.setAttribute('class', 'Q_hint');
		if (options.classes) {
			img1.addClass(options.classes);
		}
		img1.style.opacity = 0;
		img1.hide = options.hide;
		img1.dontStopBeforeShown = options.dontStopBeforeShown;
        setTimeout(function(){
            Q.Visual.hint.imgs.push(img1);
            img1.style.visibility = 'hidden';
            document.body.appendChild(img1);
            hintEvent.add(Q.once(function _hintReady() {
                img1.timeout = setTimeout(function () {
                    var i, l;
                    var imgs = [img1];
                    if (typeof targets === 'string') {
                        targets = document.querySelectorAll(targets);
                    }
                    if (Q.isEmpty(targets)) {
                        return;
                    }
                    img1.style.visibility = 'visible';
                    if (Q.isArrayLike(targets)) {
                        img1.target = targets[0];
                        for (i=1, l=targets.length; i<l; ++i) {
                            if (!Q.elementIsInDOM(targets[i])) {
                                continue;
                            }
                            var img2 = img1.cloneNode(false);
                            img2.hide = img1.hide;
                            img2.dontStopBeforeShown = img1.dontStopBeforeShown;
                            img2.target = targets[i];
                            img2.timeout = false;
                            imgs.push(img2);
                            Q.Visual.hint.imgs.push(img2);
                            document.body.appendChild(img2);
                        }
                    } else {
                        img1.target = targets;
                        if (!Q.elementIsInDOM(targets)) {
                            img1.remove();
                        }
                    }
                    Q.each(imgs, function (i, img) {
                        if (typeof img.target === 'string') {
                            img.target = document.querySelector(img.target);
                        }
                        var point;
                        var target = img.target;
                        if (Q.instanceOf(target, Element)) {
                            if (!target.isVisible()) {
                                if (img.parentNode) {
                                    img.parentNode.removeChild(img);
									if (img.tooltip && img.tooltip.parentNode) {
										img.tooltip.parentNode.removeChild(img.tooltip);
									}
                                }
                                return; // perhaps it disappeared
                            }
                            var offset = target.getBoundingClientRect();
                            point = {
                                x: Q.Visual.positionLeft() + offset.left + target.offsetWidth / 2,
                                y: Q.Visual.positionTop() + offset.top + target.offsetHeight / 2
                            };
                        } else {
                            point = target;
                        }
						var zIndex = ('zIndex' in options) ? options.zIndex : 99999;
						var x = point.x - img.offsetWidth * options.hotspot.x;
						var y = point.y - img.offsetHeight * options.hotspot.y;
						Q.extend(img.style, {
							display: 'block',
							left: x + 'px',
							top: y + 'px',
							zIndex: zIndex,
							pointerEvents: 'none'
						});
                        var width = parseInt(img.style.width);
                        var height = parseInt(img.style.height);
						var tooltip = null;
						if (options.tooltip
						&& (options.tooltip.index || 0) == i
						&& !img.tooltip) {
							tooltip = img.tooltip = img.tooltip || document.createElement('div');
							var className = ('className' in options.tooltip) ? options.tooltip.className : 'Q_pulsate';
							tooltip.setAttribute('class', 'Q_hint_tooltip'
								+ (className ? ' ' + className : '')
							);
							if (img.parentNode) {
								img.parentNode.insertBefore(tooltip, img);
							}
							if (options.tooltip.html) {
								tool.innerHTML = options.tooltip.html;
							} else if (options.tooltip.text) {
								tooltip.innerHTML = options.tooltip.text.encodeHTML();
							}
							Q.extend(tooltip.style, {
								display: 'inline-block',
								position: 'absolute',
								zIndex: (zIndex in options.tooltip) ? options.tooltip.zIndex : zIndex,
								pointerEvents: 'none'
							});
							var irect = img.getBoundingClientRect();
							var rect = tooltip.getBoundingClientRect();
							var tleft = point.x - rect.width / 2;
							var ttop = irect.bottom;
							var m = ('margin' in options.tooltip) ? options.tooltip.margin : 10;
							if (ttop + rect.height > window.innerHeight) {
								ttop = point.y - rect.height - m;
							}
							if (tleft + rect.width > window.innerWidth) {
								tleft = window.innerWidth - rect.width - m;
							} else if (tleft < 0) {
								tleft = m;
							}
							tooltip.style.left = tleft + 'px';
							tooltip.style.top = ttop + 'px';
						}
                        Q.Animation.play(function (x, y) {
                            if (options.styles) {
                                Q.extend(img.style, options.styles);
                            }
                            if (!options.styles || !options.styles.opacity) {
                                img.style.opacity = y;
								if (tooltip) {
									tooltip.style.opacity = y;
								}
                            }
                            if (options.show.initialScale !== 1) {
                                var z = 1 + (options.show.initialScale - 1) * (1 - y);
                                var w = width * z;
                                var h = height * z;
                                img.style.width = w + 'px';
                                img.style.height = h + 'px';
                                img.style.left = point.x - w * options.hotspot.x + 'px';
                                img.style.top = point.y - h * options.hotspot.y + 'px';
                            }
							if (y === 1 && img === img1) {
								img1.timeout = options.neverRemove;
							}
                        }, options.show.duration, options.show.ease);
                        if (options.hide && options.hide.after) {
                            setTimeout(function () {
                                _stopHint(img);
                            }, options.hide.after);
                        }
                    });
                }, options.show.delay);
            }));
            if (!Q.Visual.hint.addedListeners) {
                Q.Visual.stopHintsIgnore = true;
                Q.addEventListener(window, Q.Visual.start, Q.Visual.stopHints, false, true);
                Q.addEventListener(window, 'keydown', Q.Visual.stopHints, false, true);
                Q.addEventListener(document, 'scroll', Q.Visual.stopHints, false, true);
                Q.Visual.hint.addedListeners = true;
                setTimeout(function () {
                    delete Q.Visual.stopHintsIgnore;
                }, 0);
            }
            if (options.waitForEvents) {
                return;
            }
            if (img1.complete) {
                imageEvent.handle();
            } else {
                img1.onload = imageEvent.handle;
            }
        }, 0);

		var a = options.audio || {};
		if (a.src) {
			Q.Audio.load(a.src, function () {
				img1.audio = this;
				this.hint = [targets, options];
				this.play(a.from || 0, a.until, a.removeAfterPlaying);
				audioEvent.handle();
			});
		} else if (options.speak) {
			Q.Audio.speak(options.speak.text, Q.extend({}, 10, options.speak, {
				onSpeak: audioEvent.handle
			}));
		} else {
			audioEvent.handle();
		}

		return img1;
	},
	/**
	 * Stops any hints that are currently being displayed
	 * @static
	 * @method stopHints
	 * @param {HTMLElement} [container] If provided, only hints for elements in this container are stopped.
	 */
	stopHints: function (container) {
		if (Q.Visual.stopHintsIgnore) {
			return; // workaround for iOS Safari
		}
		var imgs = Q.Visual.hint.imgs;
		var imgs2 = [];
		Q.each(imgs, function (i, img) {
			if (_stopHint(img, container)) {
				imgs2.push(img);
			}
		});
		Q.Visual.hint.imgs = imgs2;
	},
	/**
	 * Start showing touchlabels on elements with data-touchlabel="Label text"
	 * to help people who touch an element know what it's going to do if they release
	 * their finger on it.
	 * @method activateTouchlabels
	 * @param {Element} [element=document.body] The element in which to activate touchlabels.
	 * @param {Boolean} [onlyTouchscreen=false] Whether to only do it on a touchscreen
	 * @static
	 */
	activateTouchlabels: function (element, onlyTouchscreen) {
		if (onlyTouchscreen && !Q.info.isTouchscreen) {
			return;
		}
		element = element || document.body;
		if (element.activatedTouchlabels) {
			return;
		}
		element.activatedTouchlabels = true;
		var _suppress = false;
		var div = document.createElement('div');
		div.addClass('Q_touchlabel');
		document.body.appendChild(div);
		Q.addEventListener(element, 'touchstart touchmove mousemove', function (e) {
			if (Q.info.isTouchscreen && !Q.Visual.isPressed(e)) {
				return;
			}
			var x = Q.Visual.getX(e);
			var y = Q.Visual.getY(e);
			var t = document.elementFromPoint(x, y);
			if (_suppress) {
				return;
			}
			while (t) {
				if (!t.hasAttribute || !t.hasAttribute('data-touchlabel')) {
					t = t.parentNode
					continue;
				}
				var content = t.getAttribute('data-touchlabel');
				if (!content) {
					return;
				}
				div.innerHTML = content;
				var erect = element.getBoundingClientRect();
				var rect = div.getBoundingClientRect();
				var trect = t.getBoundingClientRect();
				var r = Q.getObject(['touches', 0, 'radiusY'], e) || 10;
				var left1 = Math.min(
					x - rect.width / 2,
					erect.left + erect.width - rect.width
				);
				var above = Q.info.isTouchscreen || (trect.bottom + rect.height >= erect.bottom);
				var top1 = above
					? y - r - rect.height // above
					: trect.bottom; // below
				div.style.left = Math.max(erect.left, left1) + 'px';
				div.style.top = Math.max(erect.top, top1) + 'px';
				div.addClass('Q_touchlabel_show');
				_suppress = true;
				setTimeout(function () {
					_suppress = false;
				}, 10);
				return;
			}
			// if we are here, nothing matched
			div.removeClass('Q_touchlabel_show');
		}, false, true);
		Q.addEventListener(document.body, 'touchend mouseup', function () {
			div.removeClass('Q_touchlabel_show');
		}, false, true);
	},
	/**
	 * Consistently prevents the default behavior of an event across browsers
	 * @static
	 * @method preventDefault
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {boolean} Whether the preventDefault succeeded
	 */
	preventDefault: function (e) {
		if (('cancelable' in e) && !e.cancelable) {
			return false;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		return true;
	},
	/**
	 * Cancels a click that may be in progress,
	 * setting Q.Visual.canceledClick to true.
	 * This is to tell other handlers in the document, which know about Q,
	 * not to react to the click in a standard way.
	 * To really stop propagation of this event, also call stopPropagation.
	 * However, this canceling itself can be canceled by a handler
	 * returning false.
	 * @static
	 * @method cancelClick
	 * @param {boolean} [skipMask=false] Pass true here to skip showing
	 *   the Q.click.mask for 300 milliseconds, which blocks any
	 *   stray clicks on mouseup or touchend, which occurs on some browsers.
	 *   You will want to skip the mask if you want to allow scrolling, for instance.
	 * @param {Q.Event} [event] Some mouse or touch event from the DOM
	 * @param {Object} [extraInfo] Extra info to pass to onCancelClick
	 * @param {Boolean} [msUntilStopCancelClick] Pass a number here to wait
	 *   some milliseconds until setting Q.Visual.canceledClick = false .
	 * @return {boolean}
	 */
	cancelClick: function (skipMask, event, extraInfo, msUntilStopCancelClick) {
		if (false === Q.Visual.onCancelClick.handle(event, extraInfo)) {
			return false;
		}
		Q.Visual.canceledClick = true;
		Q.Visual.canceledEvent = event;
		if (!skipMask) {
			Q.Masks.show('Q.click.mask');
		}
		if (msUntilStopCancelClick) {
			++_cancelClick_counter;
			setTimeout(function () {
				if (--_cancelClick_counter === 0) {
					Q.Visual.canceledClick = false;
				}
			}, msUntilStopCancelClick);
		}
	},
	/**
	 * Consistently obtains the element under pageX and pageY relative to document
	 * @static
	 * @method elementFromPoint
	 * @param {Number} pageX horizontal coordinates relative to the page
	 * @param {Number} pageY vertical coordinates relative to the page
	 * @return {HTMLElement}
	 */
	elementFromPoint: function (pageX, pageY) {
		return document.elementFromPoint(
			pageX - Q.Visual.scrollLeft(),
			pageY - Q.Visual.scrollTop()
		);
	},
	/**
	 * Call this function to prevent the rubber band effect on iOS devices,
	 * making the app feel more native there.
	 * @param {Object} [options] possible options, which can include:
	 * @param {String} [options.direction='both'] can be 'vertical', 'horizontal', or 'both'
	 * @method preventRubberBand
	 */
	preventRubberBand: function (options) {
		if (Q.info.platform === 'ios') {
			Q.extend(_touchScrollingHandler.options, options);
			Q.addEventListener(window, 'touchmove', _touchScrollingHandler, {
				passive: false
			}, true);
		}
	},
	/**
	 * Can restore touch scrolling after preventRubberBand() was called
	 * @method restoreRubberBand
	 */
	restoreRubberBand: function () {
		Q.removeEventListener(window, 'touchmove', _touchScrollingHandler, {
			passive: false
		}, true);
	},
	/**
	 * Call this function to begin blurring active elements when touching outside them
	 * @method startBlurringOnTouch
	 */
	startBlurringOnTouch: function () {
		Q.addEventListener(window, 'touchstart', _touchBlurHandler, false, true);
	},
	/**
	 * Call this function to begin blurring active elements when touching outside them
	 * @method startBlurringOnTouch
	 */
	stopBlurringOnTouch: function () {
		Q.removeEventListener(window, 'touchstart', _touchBlurHandler, false, true);
	},
	clearSelection: function () {
		if (window.getSelection) {
			if (window.getSelection().empty) {  // Chrome
				window.getSelection().empty();
			} else if (window.getSelection().removeAllRanges) {  // Firefox
				window.getSelection().removeAllRanges();
			}
		} else if (document.selection && document.selection.empty) {  // IE?
			document.selection.empty();
		}
	},
	/**
	 * Call this function to begin canceling clicks on the element or its scrolling parent.
	 * This is to good for preventing stray clicks from happening after an accidental scroll,
	 * for instance if content changed after a tab was selected, and scrollTop became 0.
	 * @method startCancelingClicksOnScroll
	 * @param {Element} [element] If you skip this, all scrolling cancels clicks
	 */
	startCancelingClicksOnScroll: function (element) {
		var sp;
		if (element && (sp = element.scrollingParent(true))) {
			Q.addEventListener(sp, 'scroll', _handleScroll);
		} else {
			Q.addEventListener(document.body, 'scroll', _handleScroll, true);
		}
	},
	/**
	 * Call this function to stop canceling clicks on the element or its scrolling parent.
	 * This is to good for preventing stray clicks from happening after an accidental scroll,
	 * for instance if content changed after a tab was selected, and scrollTop became 0.
	 * @method startCancelingClicksOnScroll
	 * @param {
	 */
	stopCancelingClicksOnScroll: function (element) {
		if (element) {
			var sp = element.scrollingParent(true);
			Q.removeEventListener(sp, 'scroll', _handleScroll);
		} else {
			Q.removeEventListener(document.body, 'scroll', _handleScroll);
		}
	},
	/**
	 * This event occurs when a click has been canceled, for one of several possible reasons.
	 * @static
	 * @event onCancelClick
	 */
	onCancelClick: new Q.Event(),
	/**
	 * This event occurs when touching or mouse pressing should have ended anywhere
	 * @static
	 * @event onEnded
	 */
	onEnded: new Q.Event(),
	/**
	 * This event occurs when touching or mouse pressing should have started anywhere
	 * @static
	 * @event onStarted
	 */
	onStarted: new Q.Event(),
	/**
	 * The distance that a finger or mouse has to move for the click to be canceled
	 * @static
	 * @property options.cancelClickDistance
	 */
	options: {
		cancelClickDistance: 10
	}
};

var _cancelClick_counter = 0;
Q.Visual.preventRubberBand.suspend = {};

var _setRecentlyScrolledFalse = Q.debounce(function () {
	Q.Visual.recentlyScrolled = false;
}, 300);

function _handleScroll(event) {
	// if input element stuff exceeds width of element, blur will lead to scroll element to the start
	// this will lead to cancel first click on submit button because before click fired blur from input
	if (Q.typeOf(event).toLowerCase() === "event"
	&& ["input", "select"].includes(
		Q.getObject("target.tagName", event).toLowerCase())
	) {
		return false;
	}
	if (Q.Visual.latest.touches.length) {
		// no need to cancel click here, user will have to lift their fingers to click
		return false;
	}
	Q.Visual.recentlyScrolled = true;
	setTimeout(_setRecentlyScrolledFalse, 100);
	var shouldStopCancelClick = !Q.Visual.movedTooMuchForClickLastTime
		&& !Q.Visual.startedWhileRecentlyScrolled;
	Q.Visual.cancelClick(true, null, null, shouldStopCancelClick ? 300 : 0);
}

function _stopHint(img, container) {
	var outside = (
		Q.instanceOf(container, Element)
		&& !container.contains(img.target)
	);
	if ((img.timeout !== false && img.dontStopBeforeShown) || outside) {
		return img;
	}
	if (img.audio) {
		img.audio.pause();
	}
	clearTimeout(img.timeout);
	img.timeout = null;
	var initialOpacity = parseFloat(img.style.opacity);
	Q.Animation.play(function (x, y) {
		img.style.opacity = initialOpacity * (1-y);
		if (img.tooltip) {
			img.tooltip.style.opacity = initialOpacity * (1-y);
		}
	}, img.hide.duration, img.hide.ease)
	.onComplete.set(function () {
		if (img.parentNode) {
			img.parentNode.removeChild(img);
			if (img.tooltip) {
				img.tooltip.parentNode.removeChild(img.tooltip);
			}
		}
	});
	return null;
}

var _useTouchEvents = Q.info.useTouchEvents;
Q.Visual.start.eventName = _useTouchEvents ? 'touchstart' : 'mousedown';
Q.Visual.move.eventName = _useTouchEvents ? 'touchmove' : 'mousemove';
Q.Visual.end.eventName = _useTouchEvents ? 'touchend' : 'mouseup';
Q.Visual.cancel.eventName = _useTouchEvents ? 'touchcancel' : 'mousecancel';

Q.Visual.which.NONE = 0;
Q.Visual.which.LEFT = 1;
Q.Visual.which.MIDDLE = 2;
Q.Visual.which.RIGHT = 3;
Q.Visual.touchclick.duration = 400;

Q.Visual.latest = {
	which: Q.Visual.which.NONE,
	touches: []
};

Q.Visual.waitUntilVisible.options = {
	root: null,
	rootMargin: '0px',
	threshold: 1.0
};

Q.addEventListener(document.body, 'touchstart mousedown', function (e) {
	if (e.type === 'mousedown') {
		Q.Visual.latest.which = Q.Visual.which(e);
	} else {
		Q.Visual.latest.touches = e.touches;
	}
}, false, true);

Q.addEventListener(document.body, 'touchend touchcancel mouseup', function (e) {
	if (e.type === 'mouseup') {
		Q.Visual.latest.which = Q.Visual.which(e);
	} else {
		Q.Visual.latest.touches = e.touches;
	}
}, false, true);

Q.Visual.hint.options = {
	src: '{{Q}}/img/hints/tap.gif',
	hotspot:  {x: 0.5, y: 0.3},
	width: "50px",
	height: "50px",
	zIndex: 2147483647,
	neverRemove: false,
	dontRemove: false,
	show: {
		delay: 500,
		duration: 500,
		initialScale: 2,
		ease: Q.Animation.ease.smooth
	},
	hide: {
		delay: 300,
		duration: 300,
		ease: Q.Animation.ease.linear
	}
};
Q.Visual.hint.imgs = [];

function _Q_restoreScrolling() {
	if (!Q.info || !Q.info.isTouchscreen) return false;
	var lastScrollLeft, lastScrollTop;
	var focused = false;
	setInterval(function _Q_saveScrollPositions() {
		var ae = document.activeElement;
		var b = _Q_restoreScrolling.options.prevent;
		if (ae && b.indexOf(ae.tagName.toUpperCase()) >= 0) {
			focused = true;
		}
		if (focused) return false;
		lastScrollTop = Q.Visual.scrollTop();
		lastScrollLeft = Q.Visual.scrollLeft();
	}, 300);
	Q.addEventListener(document.body, Q.Visual.focusin, function _Q_body_focusin() {
		focused = true;
	});
	Q.addEventListener(document.body, Q.Visual.focusout, function _Q_body_focusout() {
		focused = false;
		if (lastScrollTop !== undefined) {
			window.scrollTo(lastScrollLeft, lastScrollTop);
		}
	});
	return true;
}

_Q_restoreScrolling.options = {
	prevent: ["INPUT", "TEXTAREA", "SELECT"]
};

var _pos, _dist, _last, _lastTimestamp, _lastVelocity;
function _Q_PointerStartHandler(e) {
	Q.Visual.started = Q.Visual.target(e);
	Q.Visual.canceledClick = false;
	Q.addEventListener(window, Q.Visual.move, _onPointerMoveHandler, false, true);
	Q.addEventListener(window, Q.Visual.end, _onPointerEndHandler, false, true);
	Q.addEventListener(window, Q.Visual.cancel, _onPointerEndHandler, false, true);
	Q.addEventListener(window, Q.Visual.click, _onPointerClickHandler, false, true);
	Q.handle(Q.Visual.onStarted, this, arguments);
	var screenX = Q.Visual.getX(e) - Q.Visual.scrollLeft();
	var screenY = Q.Visual.getY(e) - Q.Visual.scrollTop();
	_pos = { // first movement
		x: screenX,
		y: screenY
	};
	_dist = _last = _lastTimestamp = _lastVelocity = null;
	Q.Visual.movement = {
		times: [],
		positions: [],
		velocities: [],
		movingAverageVelocity: null,
		accelerations: [],
		timeout: 300
	};
}

var _pointerMoveTimeout = null;
function _onPointerMoveHandler(evt) { // see http://stackoverflow.com/a/2553717/467460
	clearTimeout(_pointerMoveTimeout);
	var screenX = Q.Visual.getX(evt) - Q.Visual.scrollLeft();
	var screenY = Q.Visual.getY(evt) - Q.Visual.scrollTop();
	if (!screenX || !screenY || Q.Visual.canceledClick
	|| (!evt.button && (evt.touches && !evt.touches.length))) {
		return;
	}
	var ccd = Q.Visual.options.cancelClickDistance;
	if (event.button || _pos
	&& ((_pos.x && Math.abs(_pos.x - screenX) > ccd)
	 || (_pos.y && Math.abs(_pos.y - screenY) > ccd))) {
		// finger moved more than the threshhold
		if (false !== Q.Visual.cancelClick(true, evt, {
			fromX: _pos.x,
			fromY: _pos.y,
			toX: screenX,
			toY: screenY,
			comingFromPointerMovement: true
		})) {
			_pos = false;
			Q.Visual.movedTooMuchForClickLastTime = true;
		}
	}
	var _timestamp = Q.milliseconds();
	Q.Visual.movement.times.push(_timestamp);
	if (_last && _lastTimestamp) {
		_dist = {
			x: screenX - _last.x,
			y: screenY - _last.y
		};
		var _timeDiff = _timestamp - _lastTimestamp;
		var velocity = {
			x: _dist.x / _timeDiff,
			y: _dist.y / _timeDiff
		};
		Q.Visual.movement.velocities.push(velocity);
		if (_lastVelocity != null) {
			Q.Visual.movement.accelerations.push({
				x: (velocity.x - _lastVelocity.x) / _timeDiff,
				y: (velocity.y - _lastVelocity.y) / _timeDiff
			});
		}
		_lastVelocity = velocity;
		var times = Q.Visual.movement.times;
		var velocities = Q.Visual.movement.velocities;
		var totalX = 0, totalY = 0;
		var t = _timestamp, tNext;
		for (var i=times.length-1; i>=1; --i) {
			var tNext = times[i];
			if (tNext < _timestamp - 100) break;
			var v = velocities[i-1];
			totalX += v.x * (t-tNext);
			totalY += v.y * (t-tNext);
			t = tNext;
		}
		var tDiff = _timestamp - t;
		Q.Visual.movement.movingAverageVelocity = tDiff
			? { x: totalX / tDiff, y: totalY / tDiff }
			: Q.Visual.movement.velocities[velocities.length-1];
		_pointerMoveTimeout = setTimeout(function () {
			// no movement for a while
			var noMovement = {x: 0, y: 0};
			var _timestamp = Q.milliseconds();
			var _timeDiff = _timeDiff - _lastTimestamp;
			var movement = Q.Visual.movement;
			movement.times.push(_timestamp);
			movement.velocities.push(noMovement);
			movement.movingAverageVelocity = noMovement;
			movement.accelerations.push({
				x: -velocity.x / _timeDiff,
				y: -velocity.y / _timeDiff
			});
		}, Q.Visual.movement.timeout);
	}
	_lastTimestamp = _timestamp;
	_last = {
		x: screenX,
		y: screenY
	};
	Q.Visual.movement.positions.push(_last);

}

/**
 * Removes event listeners that are activated when the pointer has started.
 * This method is called automatically when the mouse or fingers are released
 * on the window. However, in the code that stops propagation of the Q.Visual.end
 * event (mouseup or touchend), you'd have to call this method manually.
 * @method ended
 * @static
 */
var _onPointerEndHandler = Q.Visual.ended = function _onPointerEndHandler() {
	setTimeout(function () {
		Q.Visual.started = null;
	}, 0);
	clearTimeout(_pointerMoveTimeout);
	Q.removeEventListener(window, Q.Visual.move, _onPointerMoveHandler);
	Q.removeEventListener(window, Q.Visual.end, _onPointerEndHandler);
	Q.removeEventListener(window, Q.Visual.cancel, _onPointerEndHandler);
	Q.removeEventListener(window, Q.Visual.click, _onPointerClickHandler);
	Q.handle(Q.Visual.onEnded, this, arguments);
	_pos = false;
	setTimeout(function () {
		Q.Visual.canceledClick = false;
	}, 100);
};

function _onPointerClickHandler(e) {
	if (Q.Visual.canceledClick) {
		e.preventDefault();
	}
	Q.removeEventListener(window, Q.Visual.click, _onPointerClickHandler);
}

function _onPointerBlurHandler() {
	Q.Visual.blurring = true;
	setTimeout(function () {
		Q.Visual.blurring = false;
	}, 500); // for touchscreens that retry clicks after keyboard disappears
};

/**
 * Operates with dialogs.
 * @class Q.Dialogs
 */
Q.Dialogs = {

	options: {
		topMargin: '5%', // in percentage
		bottomMargin: '5%' // or in absolute pixel values
	},
	
	dialogs: [], // stack of dialogs that is currently being shown
	
	/**
	 * Shows the dialog and pushes it on top of internal dialog stack.
	 * @static
     * @method push
	 * @param {Object} options A hash of options. For more options see Q/dialog tool.
     * @param {boolean} [options.apply] Optional. Set to true if the dialog 
	 *  should show the "apply" style button to close dialog
	 * @param {Element|jQuery} [options.dialog] If provided, may be Element or 
	 *   jQuery object containing already prepared dialog html
	 *	 structure with 'Q_title_slot', 'Q_dialog_slot' and appropriate content in them. 
	 *   If the 'title', 'content' or 'template' options are provided, they will be used to
	 *   replace the content in this element.
	 *	@param {String} [options.url] Optional. If provided, this url will be used 
	 *   to fetch the "title" and "dialog" slots, to display in the dialog. 
	 *   Thus the default content provided by 'title' and 'content' options
	 *   given below will be replaced after the response comes back.
	 *	@param {String|Element} [options.title='Dialog'] initial dialog title.
	 *	@param {String|Element} [options.content] initial dialog content.
	 *   If the url is not supplied, then this remains the HTML content of the dialog.
	 *   By default displays an image of a throbber while the url is loading.
	 *  @param {Object} [options.template] can be used instead of content option.
	 *  @param {String} [options.template.name] names a template to render into the initial dialog content.
	 *  @param {String} [options.template.fields] fields to pass to the template, if any
	 *  @param {String} [options.elementId] an ID to set for dialog element, just use className if you aren't sure it's unique
	 *  @param {String} [options.className] a CSS class name or 
	 *   space-separated list of classes to append to the dialog element.
	 *  @param {String} [options.htmlClass] Any class to add to the html element while the overlay is open
	 *  @param {String|Boolean} [options.mask] Default is true unless fullscreen option is true. If true, adds a mask to cover the screen behind the dialog. If a string, this is passed as the className of the mask.
     * @param {String|Array} [options.stylesheet] Any stylesheets to load before dialog, to prevent Flash of Unstyled Content.
	 *  should show the "apply" style button to close dialog
	 *	@param {boolean} [options.fullscreen] Defaults to true only on Android
	 *   and false on all other platforms. 
	 *   If true, dialog will be shown not as overlay but instead will be 
	 *   prepended to document.body and all other child elements of the body 
	 *   will be hidden. Thus dialog will occupy all window space, but still 
	 *   will behave like regular dialog, i.e. it can be closed
	 *   by clicking / tapping close icon.
	 *  @param {boolean} [options.hidePrevious=false] Whether to hide the current topmost dialog, and show it again when this newly displayed dialog will be closed
	 *	@param {HTMLElement, jQuery} [options.appendTo] Can be DOM element, jQuery object 
	 *    or jQuery selector matching element where dialog should be appended.
	 *    Moreover, dialog is centered relatively to this element. 
	 *    By default it's document body.
	 *  @param {boolean} [options.alignByParent=false] if true, the dialog will be 
	 *    aligned to the center of not the entire window, but to the center 
	 *    of containing element instead.
	 *  @param {boolean} [options.noClose=false] if true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
	 *  @param {boolean} [options.closeOnEsc=true] indicates whether to close overlay on 'Esc' key press. Has sense only if 'noClose' is false.
	 *  @param {Number}  [options.closeAfterDelay=false] pass a number of milliseconds here to initiate a close automatically (which will trigger onClose event)
	 *  @param {boolean} [options.removeOnClose] Defaults to false if "dialog" is provided, and true otherwise. If true, dialog DOM element will be removed from the document on close.
	 *  @param {Q.Event} [options.beforeLoad]  Q.Event or function which is called before dialog is loaded.
	 *  @param {Q.Event} [options.onActivate] Q.Event or function which is called when dialog is activated (all inner tools, if any, are activated and dialog is fully loaded and shown).
	 *  @param {Q.Event} [options.beforeClose] beforeClose Q.Event or function which is called when overlay closing was initiated and it's still visible. Can return false to cancel closing.
	 *  @param {Q.Event} [options.onClose] Optional. Q.Event or function which is 
	 *   called when dialog is closed and hidden and probably 
	 *   removed from DOM (if 'removeOnClose' is 'true').
	 * @return {HTMLElement} The HTML element of the dialog that was just pushed.
	 */
	push: function(options) {
		var maskDefault = true;
		for (var i = 0; i < this.dialogs.length; i++) {
			if (!this.dialogs[i].isFullscreen) {
				maskDefault = false;
			}
		}
		var o = Q.extend(
			{mask: maskDefault}, 
			Q.Dialogs.options, 
			Q.Dialogs.push.options, 
			options
		);
		if (o.fullscreen) o.mask = false;
		var $dialog = $(o.dialog);
		if (o.template) {
			Q.Template.render(o.template.name, o.template.fields, function (err, html) {
				if (!err) {
					_proceed1(html);
				}
			});
		} else {
			_proceed1(o.content);
		}
		return $dialog && $dialog[0];
		function _proceed1(content) {
			if (o.stylesheet) {
				Q.addStylesheet(o.stylesheet, function () { _proceed2(content); })
			} else {
				_proceed2(content);
			}
		}
		function _proceed2(content) {
			var $h2, $title, $content;
			if (!$dialog.length) {
				// create this dialog element
				$h2 = $('<h2 class="Q_dialog_title" />');
				$title = $('<div class="Q_title_slot" />').append($h2);
				$content = $('<div class="Q_dialog_slot Q_dialog_content Q_overflow" />');
				$dialog = $('<div />').append($title).append($content);
				if (o.apply) {
					$dialog.addClass('Q_overlay_apply');
				}
				if (o.removeOnClose !== false) {
					o.removeOnClose = true;
				}
			} else {
				$h2 = $('.Q_dialog_title', $dialog);
				$title = $('.Q_title_slot', $dialog)
				$content = $('.Q_dialog_slot', $dialog);
			}
			if (o.title) {
				$h2.empty().append(o.title);
			}
			if (content) {
				$content.empty().append(content);
			}
			$dialog.hide();
			//if ($dialog.parent().length == 0) {
				$(o.appendTo || document.body).append($dialog);
			//}
			var _onClose = o.onClose;
			o.onClose = new Q.Event(function() {
				if (!Q.Dialogs.dontPopOnClose) {
					Q.Dialogs.pop(true);
				}
				Q.Dialogs.dontPopOnClose = false;
				Q.handle(o.onClose.original, $dialog, [$dialog]);
			}, 'Q.Dialogs');
			o.onClose.original = _onClose;
			$dialog.plugin('Q/dialog', o);
			var topDialog = null;
			var dialogs = Q.Dialogs.dialogs;
			$dialog.isFullscreen = o.fullscreen;
			if (dialogs.length) {
				topDialog = dialogs[dialogs.length - 1];
			}
			if (!topDialog || topDialog !== $dialog[0]) {
				dialogs.push($dialog);
				if (o.hidePrevious && topDialog) {
					topDialog.addClass('Q_hide');
				}
			}
			if (o.closeAfterDelay) {
				setTimeout(function () {
					$dialog.close();
				}, o.closeAfterDelay);
			}
		}
	},
	
	/**
	 * Closes dialog and removes it from top of internal dialog stack.
	 * @static
     * @method pop
	 * @param {boolean} dontTriggerClose is for internal use only
	 * @return {HTMLElement} The HTML element of the dialog that was just popped.
	 */
	pop: function(dontTriggerClose) {
		if (dontTriggerClose === undefined) {
			dontTriggerClose = false;
		}
		
		var $dialog = this.dialogs.pop();
		if (this.dialogs.length) {
			this.dialogs[this.dialogs.length - 1].removeClass('Q_hide');
		}
		if (!dontTriggerClose && $dialog) {
			Q.Dialogs.dontPopOnClose = true;
			if ($dialog.data('Q/overlay')) {
				$dialog.data('Q/overlay').close();
			} else if ($dialog.data('Q/dialog')) {
				$dialog.data('Q/dialog').close();
			}
		}
		Q.Visual.cancelClick();
		return $dialog && $dialog[0];
	},

	/**
	 * Closes a specific dialog and removes it from top of internal dialog stack.
	 * @static
     * @method close
	 * @param {Boolean|Number} dialog You can pass an element here, or index in the dialog stack
	 * @return {HTMLElement|null} The HTML element of the dialog that was just closed, or null if not found.
	 */
	close: function(dialog) {
		var index = -1;
		if (Q.isInteger(dialog)) {
			index = dialog;
			dialog = this.dialogs[index];
		} else {
			if (dialog instanceof Element) {
				Q.each(dialogs, function (i) {
					if (this === dialog) {
						index = i;
						return false;
					}
				});
			}
		}
		if (index >= 0) {
			this.dialogs.splice(index, 1);
			$(dialog).plugin('Q/dialog', 'close');
			return dialog;
		}
		return null;
	},
	
	/**
	 * Returns the HTML element of the dialog on top of the stack, if any
	 * @static
     * @method element
	 * @param {Integer} [index=0] Pass a positive integer for dialogs lower on the stack
	 * @return {HTMLElement} The HTML element of the dialog that is on top.
	 */
	element: function (index) {
		return this.dialogs[this.dialogs.length-(index||0)-1];
	}

};

Q.info.useFullscreen = Q.info.isMobile && Q.info.isAndroid(1000)
	&& Q.info.isAndroidStock && Q.info.browserMainVersion < 11;

Q.Dialogs.push.options = {
	dialog: null,
	url: null,
	title: null,
	content: '',
	className: null,
	fullscreen: Q.info.useFullscreen,
	appendTo: document.body,
	alignByParent: false,
	beforeLoad: new Q.Event(),
	onActivate: new Q.Event(),
	beforeClose: new Q.Event(),
	onClose: null,
	closeOnEsc: true,
	removeOnClose: null,
	hidePrevious: true
};

/**
 * @class Q
 */

/**
 * Provides replacement for default javascript alert() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, message and button label.
 * @static
 * @method alert
 * @param {String} message The only required parameter, this specifies text of the alert.
 * @param {Object} [options] An optional hash of options for Q.Dialogs.push and also:
 *   @param {String} [options.title="Alert"] Optional parameter to override alert dialog title. Defaults to 'Alert'.
 *   @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.alert = function(message, options) {
	if (options === undefined) options = {};
	if (options.title === undefined) {
		options.title = Q.alert.options.title;
	}
	return Q.Dialogs.push(Q.extend({
		'title': options.title,
		'content': '<div class="Q_messagebox Q_big_prompt"><p>' + message + '</p></div>',
		'className': 'Q_alert',
		'onClose': options.onClose || undefined,
		'fullscreen': false,
		'hidePrevious': true
	}, options));
};

Q.alert.options = {
	title: 'Alert'
};
Q.extend(Q.alert.options, Q.text.alert);

/**
 * Provides replacement for default javascript confirm() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, conrirmation message and buttons.
 * The only major difference from regular confirm is that this implementation doesn't stop JS execution
 * and thus it's impossible to synchronously return true | false when user presses 'Ok' or 'Cancel' and
 * thereby callback is used to pass the user decision result.
 * @static
 * @method confirm
 * @param {String} message The only required parameter, this specifies confirmation text.
 * @param {Function} callback: This will be called when dialog is closed,
 *   passing true | false depending on whether user clicked (tapped) 'Ok' or 'Cancel' button, respectively
 *   or null if the user closed the dialog.
 * @param {Object} [options] An optional hash of options for Q.Dialogs.push and also:
 * @param {String} [options.title='Confirm'] to override confirm dialog title.
 * @param {String} [options.ok='Yes'] to override confirm dialog 'Yes' button label, e.g. 'OK'.
 * @param {String} [options.cancel='No'] to override confirm dialog 'No' button label, e.g. 'Cancel'.
 * @param {boolean} [options.noClose=true] set to false to show a close button
 * @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.confirm = function(message, callback, options) {
	var o = Q.extend({}, Q.confirm.options, options);
	var buttonClicked = false;
	var dialog = Q.Dialogs.push(Q.extend({
		'title': o.title,
		'content': $('<div class="Q_messagebox Q_big_prompt" />').append(
			$('<p />').html(message),
			$('<div class="Q_buttons" />').append(
				$('<button class="Q_button" />').html(o.ok), ' ',
				$('<button class="Q_button" />').html(o.cancel)
			)
		),
		'className': 'Q_confirm',
		'noClose': o.noClose,
		'onClose': {'Q.confirm': function() {
			if (!buttonClicked) Q.handle(callback, this, [null]);
		}},
		'fullscreen': false,
		'hidePrevious': true
	}, options));
	var buttons = dialog.querySelectorAll('.Q_buttons button');
	Q.addEventListener(buttons[0], Q.Visual.end, function (e) {
		e.preventDefault();
		e.stopPropagation();
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, root, [true]);
		return false;
	});
	Q.addEventListener(buttons[1], Q.Visual.end, function (e) {
		e.preventDefault();
		e.stopPropagation();
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, root, [false]);
		return false;
	});
	var buttonYes = dialog.querySelectorAll('.Q_buttons button:first-child')[0];
	return dialog;
};

Q.confirm.options = {
	title: 'Confirm',
	ok: 'Yes',
	cancel: 'No',
	noClose: true
};
Q.extend(Q.confirm.options, Q.text.confirm);

/**
 * Provides replacement for default javascript prompt() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, message, input field placeholder and button label.
 * Unlike a regular JS prompt, the entered value is passed asynchronously using callback.
 * @static
 * @method prompt
 * @param {String} [message='Enter a value'] Optional, specifies text before input field useful to ask
 *   user to enter something (e.g. 'Enter your name').
 * @param {Function} callback: This will be called when dialog is closed,
 *   passing the entered value as a string, or null if the dialog was dismissed with the close button
 * @param {Object} [options] An optional hash of options for Q.Dialogs.push and also:
 * @param {String} [options.title='Prompt'] to override confirm dialog title.
 * @param {String} [options.placeholder=''] to set a placeholder in the textbox
 * @param {String} [options.initialText=null] to set any initial text
 * @param {Number} [options.maxlength=1000] the maximum length of the input
 * @param {String} [options.className] additional class name added to dialog element
 * @param {String} [options.autocomplete] the input autocomplete attribute
 * @param {String} [options.type] the input type attribute
 * @param {String} [options.ok='OK'] to override prompt dialog 'Ok' button label, e.g. 'Post'.
 * @param {boolean} [options.noClose=true] set to false to show a close button
 * @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.prompt = function(message, callback, options) {
	function _done() {
		buttonClicked = true;
		var value = $('input', dialog).val();
		Q.Dialogs.pop();
		Q.handle(callback, this, [value]);
	}
	if (options === undefined) options = {};
	var o = Q.extend({}, Q.prompt.options, options);
	var buttonClicked = false;
	var attr = {
		'placeholder': o.placeholder,
		'maxlength': o.maxLength
	};
	o.initialText && (attr.value = o.initialText);
	o.autocomplete && (attr.autocomplete = o.autocomplete);
	o.type && (attr.type = o.type);

	options.className = 'Q_prompt ' + (options.className || '');
	var dialog = Q.Dialogs.push(Q.extend({
		'title': o.title,
		'content': $('<div class="Q_messagebox Q_big_prompt" />').append(
			$('<p />').html(message),
			$('<div class="Q_buttons" />').append(
				$('<input type="text" />').attr(attr), ' ',
				$('<button class="Q_messagebox_done Q_button" />').html(o.ok)
			)
		),
		'onActivate': {'Q.prompt': function(dialog) {
			var field = $(dialog).find('input');
			var fieldWidth = field.parent().width()
				- field.next().outerWidth(true) - 5;
			field.css({ 
				width: fieldWidth + 'px',
				boxSizing: 'border-box'
			}).plugin('Q/placeholders')
			.plugin('Q/clickfocus')
			.on('keydown', function (event) {
				if ((event.keyCode || event.which) === 13) {
					_done();
				}
			});
			setTimeout(function () {
				field[0].select(); // give it a chance to appear
			}, 0);
		}},
		'onClose': {'Q.prompt': function() {
			if (!buttonClicked) Q.handle(callback, this, [null]);
		}},
		'fullscreen': false,
		'hidePrevious': true
	}, options));
	var button = dialog.querySelector('.Q_buttons button');
	Q.addEventListener(button, Q.Visual.click, _done);
	return dialog;
};
Q.prompt.options = {
	title: 'Prompt',
	ok: 'OK',
	placeholder: '',
	maxlength: 100,
	noClose: true
};
Q.extend(Q.prompt.options, Q.text.prompt);

/**
 * Opens some content with a title inside an interface construct,
 * by trying registered Q.invoke.handlers one by one in turn,
 * until one returns false (to stop trying next ones).
 * Use Array.prototype.unshift() to prepend handlers to the beginning of the list.
 * @method invoke
 * @static
 * @param {Object} options These options are passed to each handler.
 *   They should contain at least "trigger", "title", and "content" (or "template")
 * @param {String|Element} options.title The title to display, as HTML or a reference to an element
 * @param {String|Element} options.content The content to display, as HTML or a reference to an element
 * @param {Element} options.trigger The element that the user interacted with to result in this function call
*  @param {String} [options.className] a CSS class name or space-separated list of classes to append to the container (dialog or column, etc.).
 * @param {Object} [options.template] can be used instead of content option.
 * @param {String} [options.template.name] names a template to render into the initial dialog content.
 * @param {String} [options.template.fields] fields to pass to the template, if any
 * @param {Q.Event} [options.onActivate] Q.Event or function which is called when invoked container is activated (all inner tools, if any, are activated and dialog is fully loaded and shown).
 * @param {Q.Event} [options.beforeClose] beforeClose Q.Event or function which is called when invoked container closing was initiated and it's still visible. Can return false to cancel closing.
 * @param {Q.Event} [options.onClose] Optional. Q.Event or function which is called after invoked container has closed
 */
Q.invoke = function (options) {
	if (options.template) {
		Q.Template.render(options.template.name, options.template.fields, function (err, html) {
			options.content = html;
			delete options.template;
			_continue();
		});
	} else {
		_continue();
	}
	function _continue() {
		Q.each(Q.invoke.handlers, function (i, handler) {
			var ret = Q.handle(handler, Q, [options]);
			if (ret === false) {
				return false
			}
		});
	}
};
Q.invoke.handlers = [
	function (options) {
		Q.Dialogs.push(Q.extend({}, options, {
			onActivate: options.onActivate || function () { }
		}));
	}
];

/**
 * Methods relating to internationalization
 * @class Q.Intl
 */

Q.Intl = {
   /**
    * Get internationalization information about how to display and handle
	* calendar, date and time-related values
    * @method intl
    * @static
    * @return {Object} Returns an object with possible keys:
    *  "calendar", "day", "locale", "month", "numberingSystem", "year", "timeZone"
    */
	calendar: function () {
		var result = {}, dtf = Intl.DateTimeFormat();
		if (dtf && dtf.resolvedOptions) {
			result = dtf.resolvedOptions() || {};
		}
		return result;
	}
};

/**
 * Q.Audio objects facilitate audio functionality on various browsers.
 * Please do not create them directly, but use the Q.Audio.load function.
 * @class Q.Audio
 * @constructor
 * @param {String} url the url of the audio to load
 * @param {HTMLElement} container html element to insert audio to
 * @param {object} attributes json object with attributes to apply to audio element
 */
Q.Audio = function (url, container, attributes) {
	if (this === root) {
		throw new Q.Error("Q.Audio: Please call Q.Audio with the keyword new");
	}
	var t = this;
	this.src = url = Q.url(url);
	container = container || document.getElementById('Q-audio-container');
	if (!container) {
		container = document.createElement('div');
		container.setAttribute('id', 'Q-audio-container');
		container.style.display = 'none';
		document.body.appendChild(container);
	}
	this.container = container;
	var audio = this.audio = document.createElement('audio');
	audio.setAttribute('src', url);
	audio.setAttribute('preload', 'auto');
	attributes = attributes || {};
	for (var property in attributes) {
		audio.setAttribute(property, attributes[property]);
	}

	function _handler(e) {
		Q.handle(e.type === 'canplay' ? Aup.onCanPlay : (
			(e.type === 'canplaythrough' ? Aup.onCanPlayThrough : Aup.onEnded)
		), t, [e]);
		Q.handle(e.type === 'canplay' ? Q.Audio.onCanPlay : (
			(e.type === 'canplaythrough' ? Q.Audio.onCanPlayThrough : Q.Audio.onEnded)
		), t, [e]);
	}
	Q.addEventListener(audio, {
		'canplay': _handler,
		'canplaythrough': _handler,
		'ended': _handler
	});
	container.appendChild(audio); // some browsers load the file immediately
	audio.load(); // others need this
	Q.Audio.collection[url] = this;
};
Q.Audio.collection = {};

Q.Audio.onPlay = new Q.Event();
Q.Audio.onPause = new Q.Event();
Q.Audio.onCanPlay = new Q.Event();
Q.Audio.onCanPlayThrough = new Q.Event();
Q.Audio.onEnded = new Q.Event();

var Aup = Q.Audio.prototype;
Aup.onCanPlay = new Q.Event();
Aup.onCanPlayThrough = new Q.Event();
Aup.onEnded = new Q.Event();

/**
 * Loads an audio file and calls the callback when it's ready to play
 * @static
 * @method audio
 * @param {String} url 
 * @param {Function} handler A function to run after the audio is ready to play
 * @param {Object} [options={}] Can be one of the following options
 * @param {boolean} [options.canPlayThrough=true] Whether to wait until the audio can play all the way through before calling the handler.
 */
Q.Audio.load = Q.getter(function _Q_audio(url, handler, options) {
	url = Q.url(url);
	var audio = Q.Audio.collection[url]
		? Q.Audio.collection[url]
		: new Q.Audio(url);
	if (options && options.canPlayThrough === false) {
		audio.onCanPlay.add(handler);
	} else {
		audio.onCanPlayThrough.add(handler);
	}
}, {
	cache: Q.Cache.document('Q.audio', 100)
});

/**
 * @method play
 * Plays the audio as soon as it is available
 * @param {number} [from] The time, in seconds, from which to start.
 * @param {number} [until] The time, in seconds, until which to play.
 * @param {boolean} [removeAfterPlaying=false]
 */
Aup.play = function (from, until, removeAfterPlaying) {
	var t = this;
	var a = t.audio;
	from = from || 0;
	if (from > until) {
		throw new Q.Error("Audio.prototype.play: from can't be greater than until");
	}
	if (!a.readyState) {
		return false;
	}
	if (removeAfterPlaying) {
		t.onEnded.set(function () {
			delete Q.Audio.collection[t.src];
			container.removeChild(t.audio);
			t.onEnded.remove('Q.Audio');
		}, 'Q.Audio');
	}
	t.playing = true;
	t.paused = false;
	if (a.currentTime != from) {
		a.currentTime = from;
	}
	if (until) {
		setTimeout(function Q_Audio_play_pause() {
			a.pause();
		}, (until-from)*1000);
	}
	a.play();
	Q.handle(Q.Audio.onPlay, this);
	return t;
};
/**
 * @method recorderInit
 * Set recorder class
 * @param {object} [options] Object with options
 * @param {function} [options.onStreamReady] callback onStreamReady - fire when user apply access to microphones
 * @param {function} [options.onDataAvailable] callback onDataAvailable - fire when audio stream encoded and redy o use
 */
Aup.recorderInit = function (options) {
	var tool = this;

	// load recorder
	Q.addScript("{{Q}}/js/audioRecorder/recorder.js", function(){
	//new Recorder({leaveStreamOpen: true, encoderPath: Q.url("{{Q}}/js/audioRecorder/encoderWorker.min.js")}); - ogg format encoder
		tool.recorder = tool.recorder || new Recorder({leaveStreamOpen: true, encoderPath: Q.url("{{Q}}/js/audioRecorder/recorderWorkerMP3.js")}); // mp3 format encoder

		tool.recorder.addEventListener("streamReady", function(e){
			if (typeof options.onStreamReady === "function") options.onStreamReady.call();
		});

		// when error occur with audio stream
		tool.recorder.addEventListener("streamError", function(e){
			console.log('Error encountered: ' + e.error.name );
		});

		tool.recorder.addEventListener("dataAvailable", function(e){
			if (typeof options.onDataAvailable === "function") options.onDataAvailable.call(e);
		});

		tool.recorder.initStream();
	});

};
/**
 * @method pause
 * Pauses the audio if it is playing
 */
Aup.pause = function () {
	var t = this;
	if (t.playing) {
		t.audio.pause();
		t.playing = false;
		t.paused = true;
	}
	Q.handle(Q.Audio.onPause, this);
	return t;
};

/**
 * @method pause
 * Pauses all the audio that is playing
 */
Q.Audio.pauseAll = function () {
	for (var url in Q.Audio.collection) {
		var audio = Q.Audio.collection[url];
		audio.pause && audio.pause();
	}
};

/**
 * Can call this to preload data about voices, locales, genders, etc.
 * for common voices, so it can be ready to go when Q.Audio.speak() is called.
 * @method loadVoices
 * @static
 * @param {Function} callback Receives err, data
 */
Q.Audio.loadVoices = Q.getter(function (callback) {
	Q.request('{{Q}}/js/speech/voices.json', [], function (err, voices) {
		var msg = Q.firstErrorMessage(err, voices);
		if (msg) {
			throw new Q.Error(msg);
		}
		if (typeof voices !== "object") {
			callback.call(this, "Q.Audio.speak: could not get the known voices list", null);
		}
		for (var languageLocale in voices) {
			var lang = languageLocale.split('-')[0];
			if (!voices[lang]) {
				voices[lang] = voices[languageLocale];
			}
		}
		callback.call(this, err, voices);
	});
}, {
	cache: Q.Cache.document('Q.Audio.speak.loadVoices', 1)
});

/**
 * Speak text in various browsers.
 * @method speak
 * @static
 * @param {String|Array} text Pass the string of text to speak, or an array of
 *  [textSource, pathArray] to the string loaded with Q.Text.get() 
 * @param {Object} [options] An optional hash of options for Q.Audio.speak:
 * @param {String} [options.gender="female"] the voice in which will be speech the text.
 * @param {Number} [options.rate=1] the speaking rate of the SpeechSynthesizer object, from 0.1 to 1.
 * @param {Number} [options.pitch=1] the speaking pitch of the SpeechSynthesizer object, from 0.1 to 1.9.
 * @param {Number} [options.volume=1] the volume height of speech (0.1 - 1).
 * @param {Number} [options.locale="en-US"] a 5 character code that specifies the language that should be used to synthesize the text.
 * @param {Q.Event|function} [options.onStart] This gets called when the speaking has begun
 * @param {Q.Event|function} [options.onEnd] This gets called when the speaking has finished
 * @param {Q.Event|function} [options.onSpeak] This gets called when the system called speak(), whether or not it worked
 */
Q.Audio.speak = function (text, options) {
	var TTS = root.TTS; // cordova
	var SS = root.speechSynthesis; //browsers
	var o = Q.extend({}, Q.Audio.speak.options, 10, options);

	if (o.mute) {
		return;
	}

	o.locale = o.locale ||  Q.Text.languageLocale;
	if (Q.isArrayLike(text)) {
		var source = text[0];
		var pathArray = text[1];
		Q.Text.get(source, function (err, content) {
			var text = Q.getObject(pathArray, content);
			if (text) {
				_proceed(text);
			}
		});
	} else {
		_proceed(text);
	}
	function _chooseVoice(text, voicesList, knownVoices) {
		var language = o.locale.split('-')[0].toLowerCase();
		var gender = o.gender;
		var voice = null;
		var toggled = false;
		function _switchGender(gender) {
			return (gender == "female") ? "male" : "female"
		}
		function _search() {
			var result = null;
			var av = Q.getObject([gender, o.locale], knownVoices)
				|| Q.getObject([gender, language], knownVoices);
			if (!av) {
				var prefix = language + '-';
				Q.each(knownVoices[gender], function (key) {
					if (key.toLowerCase().startsWith(prefix)) {
						av = this;
						return false;
					}
				});
			}
			av = av || [];
			if (typeof av !== "object" || !av.length){
				return {error: "Q.Audio.speak: no such known voice"};
			}
			for (var i = 0; i < av.length; i++){
				for (var j = 0; j < voicesList.length; j++){
					if (av[i] == voicesList[j].name){
						result = j;
						break;
					}
				}
				if (typeof result === "number") {
					break;
				}
			}
			if (result === null && toggled){
				return {error: "Q.Audio.speak: no voice support in this device for this language"};
			} else if (result === null) {
				var previousGender = gender;
				gender = _switchGender(gender);
				toggled = true;
				console.info("%cQ.Audio.speak: no '%s' voice found for this device, switches to '%s'", 'color: Green', previousGender.toUpperCase(), gender.toUpperCase());
				return _search();
			} else {
				return result;
			}
		}
		if (gender != "male" && gender != "female") {
			gender = o.gender = "female";
		}
		voice = _search();
		if (typeof voice !== 'number'){
			var voiceError = Q.getObject("error", voice);
			console.warn(voiceError);
			return false;
		}
		return voice;
	}
	function _proceed(text) {
		if (typeof text !== "string") {
			throw new Q.Error("Q.Audio.speak: the text for speech must be a string");
		}
		text = text.interpolate(Q.text);

		if (root.TTS) {
			TTS.speak({
				text: text,
				locale: o.locale,
				rate: o.rate
			}).then(function () {
				// Text succesfully spoken
			}, function (reason) {
				console.warn("Q.Audio.speak: " + reason);
			});
		} else if (SS) {
			if (SS.speaking) {
				SS.cancel();
			}
			Q.Audio.loadVoices(function (err, voices) {
				var u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
				var voicesList = SS.getVoices();
				var chosenVoice = _chooseVoice(u.text, voicesList, voices);
				if (chosenVoice === false) {
					return;
				}
				u.voice = voicesList[chosenVoice];
				u.rate = o.rate;
				u.pitch = o.pitch;
				u.volume = o.volume;
				u.onstart = function () {
					Q.handle(o.onStart, [u]);
				};
				u.onend = function () {
					Q.handle(o.onEnd, [u]);
				};
				SS.speak(u);
				Q.handle(o.onSpeak);
			});
		}
	}
};
Q.Audio.speak.options = {
	gender: "female",
	rate: 1,
	pitch: 1,
	volume: 1,
	locale: null
};
Q.Audio.speak.enabled = !Q.info.isTouchscreen;

/**
 * Stop speaking text, if any
 * @method stopSpeaking
 * @static
 */
Q.Audio.stopSpeaking = function () {
	if (root.TTS) {
		root.TTS.stop();
	} else if (root.speechSynthesis) {
		root.speechSynthesis.pause();
	}
};

/**
 * Methods for temporarily covering up certain parts of the screen with masks
 * @class Q.Masks
 * @namespace Q
 * @static
 */
Q.Masks = {
	collection: {},
	/**
	 * Creates new mask with given key and options, or returns already created one for that key.
	 * @static
	 * @method mask
	 * @param {String} key A string key to identify mask in subsequent Q.Masks calls.
	 * @param {Object} [options={}] The defaults are taken from Q.Masks.options[key]
	 * @param {String} [options.className=''] CSS class name for the mask to style it properly.
	 * @param {number} [options.fadeIn=0] Milliseconds it should take to fade in the mask
	 * @param {number} [options.fadeOut=0] Milliseconds it should take to fade out the mask.
	 * @param {number} [options.duration] If set, hide the mask after this many milliseconds.
	 * @param {number} [options.zIndex] You can override the mask's default z-index here
	 * @param {String} [options.html=''] Any HTML to insert into the mask.
	 * @param {HTMLElement} [options.shouldCover=null] Optional element in the DOM to cover.
	 * @param {HTMLElement} [options.behind=null] Optional element in the DOM to be right behind in zIndex
	 * @return {Object} the mask info
	 */
	mask: function(key, options)
	{
		key = Q.calculateKey(key);
		var mask;
		if (key in Q.Masks.collection) {
			mask = Q.Masks.collection[key];
			if (options && options.zIndex) {
				mask.element.style.zIndex = options.zIndex;
			}
			return mask;
		}
		mask = Q.Masks.collection[key] = Q.extend({
			fadeIn: 0,
			fadeOut: 0,
			shouldCover: null,
			behind: null
		}, Q.Masks.options[key], options);
		var me = mask.element = document.createElement('div');
		me.addClass('Q_mask ' + (mask.className || ''));
		if (options && options.html) {
			me.innerHTML = options.html;
		}
		document.body.appendChild(me);
		me.style.display = 'none';
		mask.counter = 0;
		if (options && options.zIndex) {
			me.style.zIndex = options.zIndex;
		} else if (options && options.behind) {
			var zIndex = options.behind.computedStyle().zIndex;
			if (zIndex) {
				me.style.zIndex = zIndex - 1;
			}
		}
		return Q.Masks.collection[key] = mask;
	},
	/**
	 * Shows the mask by given key. Only one mask is shown for any given key.
	 * A counter is incremented on Masks.show and decremented on Masks.hide, causing
	 * the mask to be hidden when the counter reaches zero.
	 * If a mask with the given key doesn't exist, Mask.create is automatically
	 * called with the key and options from Q.Masks.options[key] .
	 * @static
	 * @method show
	 * @param {String} key The key of the mask to show.
	 * @param {Object} [options={}] Used to provide any mask options to Q.Masks.mask
	 * @param {Object} [animation={}] Used to provide any mask options to the Q.Animation
	 * @return {Object} the mask info
	 */
	show: function(key, options)
	{
		if (Q.typeOf(key) === 'Q.Tool')	{
			key.Q.beforeRemove.set(function () {
				Q.Masks.hide(key);
			}, key);
		}
		key = Q.calculateKey(key);
		options = Q.extend({}, 10, Q.Masks.show.options, 10, options);
		options.animation = options.animation || {};
		var mask = Q.Masks.mask(key, options);
		if (!mask.counter) {
			var me = mask.element;
			me.style.display = 'block';
			if (mask.fadeIn) {
				var opacity = me.originalOpacity = me.computedStyle().opacity;
				Q.Animation.play(function (x, y) {
					me.style.opacity = y * opacity;
				}, mask.fadeIn, options.animation.ease, options.animation.until);
				me.style.opacity = 0;
			}
		}
		++mask.counter;
		Q.Masks.update(key);
		if (mask.duration) {
			setTimeout(function () {
				Q.Masks.hide(key);
			}, mask.duration);
		}
		return mask;
	},
	/**
	 * Hides the mask by given key. If mask with given key doesn't exist, fails silently.
	 * @static
	 * @method hide
	 * @param {String} key A key of the mask to hide
	 */
	hide: function(key)
	{
		key = Q.calculateKey(key);
		if (!(key in Q.Masks.collection)) return;
		var mask = Q.Masks.collection[key];
		if (mask.counter === 0) return;
		var me = mask.element;
		if (--mask.counter === 0) {
			if (mask.fadeOut) {
				var opacity = me.originalOpacity || me.computedStyle().opacity;
				Q.Animation.play(function (x, y) {
					me.style.opacity = (1-y) * opacity;
				}, mask.fadeOut).onComplete.set(function () {
					me.style.display='none';
				});
			} else {
				me.style.display='none';
			}
		}
	},
	/**
	 * Updates size and appearance of all the masks. 
	 * Automatically called on Q.onLayout
	 * @static
	 * @method update
	 */
	update: function(key)
	{
		for (var k in Q.Masks.collection) {
			if (key && k !== key) {
				continue;
			}
			var mask = Q.Masks.collection[k];
			if (!mask.counter) continue;
			var html = document.documentElement;
			var offset = $('body').offset();
			var scrollLeft = Q.Visual.scrollLeft() - offset.left;
			var scrollTop = Q.Visual.scrollTop() - offset.top;
			var ms = mask.element.style;
			var rect = (mask.shouldCover || html).getBoundingClientRect();
			mask.rect = {
				'left': rect.left,
				'right': rect.right,
				'top': rect.top,
				'bottom': rect.bottom
			};
			if (!mask.shouldCover) {
				//mask.rect = Q.Visual.boundingRect(document.body, ['Q_mask']);
			}
			if (mask.rect.top < 0) {
				mask.rect.top = 0;
			}
			if (mask.rect.bottom < 0) {
				mask.rect.bottom = 0;
			}
			ms.left = scrollLeft + mask.rect.left + 'px';
			ms.top = scrollTop + mask.rect.top + 'px';
			ms.width = (mask.rect.right - mask.rect.left) + 'px';
			ms.height = ms['line-height'] = (mask.rect.bottom - mask.rect.top) + 'px';
		}
	},
	/**
	 * Checks if a mask with given key has been created and is currently being shown.
	 * @static
	 * @method isVisible
	 * @param {String} key The key of the mask
	 */
	isVisible: function(key)
	{
		key = Q.calculateKey(key);
		return !!Q.getObject([key, 'counter'], Q.Masks.Collection);
	}
};

Q.Masks.options = {
	'Q.click.mask': { className: 'Q_click_mask', fadeIn: 0, fadeOut: 0, duration: 500 },
	'Q.screen.mask': { className: 'Q_screen_mask', fadeIn: 100 },
	'Q.dialog.mask': { className: 'Q_dialog_mask', fadeIn: 100 },
	'Q.request.load.mask': { className: 'Q_load_mask', fadeIn: 5000 },
	'Q.request.cancel.mask': { className: 'Q_cancel_mask', fadeIn: 200 }
};

Q.Masks.show.options = {
	animation: {
		ease: 'easeInExpo'
	}
};

Q.addEventListener(window, Q.Visual.start, _Q_PointerStartHandler, false, true);

function noop() {}
if (!root.console) {
	root.console = {
		debug: noop,
		dir: noop,
		error: noop,
		group: noop,
		groupCollapsed: noop,
		groupEnd: noop,
		info: noop,
		log: noop,
		time: noop,
		timeEnd: noop,
		trace: noop,
		warn: noop
	};
}

/**
 * This function is just here in case prefixfree.js is included
 * because that library removes the <link> elements and puts <style> instead of them.
 * We don't know if prefixfree will be included but we have to save some information
 * about the stylesheets before it arrives on the scene.
 */
function processStylesheets() {
	// Complain about some other libraries if necessary
	if (Q.findScript('{{Q}}/js/prefixfree.min.js')) {
		var warning = "Q.js must be included before prefixfree in order to work properly";
		console.warn(warning);
	}
	var links = document.getElementsByTagName('link');
	var slots = processStylesheets.slots;
	for (var i=0; i<links.length; ++i) {
		var rel = links[i].getAttribute('rel');
		if (!rel || rel.toLowerCase() !== 'stylesheet') {
			continue;
		}
		var href = links[i].getAttribute('href');
		slots[href] = links[i].getAttribute('data-slot') || null;
	}
}
processStylesheets.slots = {};
processStylesheets(); // NOTE: the above works only for stylesheets included before Q.js and prefixfree.js

Q.addEventListener(window, 'load', Q.onLoad.handle);
Q.onInit.add(function () {
	console.log("%c"+Q.info.app+" - powered by Qbix", "color: blue; font-size: 20px");
	console.log("%c"+"Visit https://qbix.com/platform to learn how this open source platform works.", "color: black; font-size: 12px; font-weight: bold;");
	console.log("%c"+"You too can build apps for communities, and make money from clients worldwide.", "color: black; font-size: 12px; font-weight: bold;");
	de.addClass(Q.info.isTouchscreen  ? 'Q_touchscreen' : 'Q_notTouchscreen');
	de.addClass(Q.info.isMobile ? 'Q_mobile' : 'Q_notMobile');
	de.addClass(Q.info.isAndroid() ? 'Q_android' : 'Q_notAndroid');
	de.addClass(Q.info.isStandalone ? 'Q_standalone' : 'Q_notStandalone');
	de.addClass(Q.info.isWebView ? 'Q_webView' : 'Q_notWebView');
	de.removeClass(Q.info.isTouchscreen  ? 'Q_notTouchscreen' : 'Q_touchscreen');
	de.removeClass(Q.info.isMobile ? 'Q_notMobile' : 'Q_mobile');
	de.removeClass(Q.info.isAndroid() ? 'Q_notAndroid' : 'Q_android');
	de.removeClass(Q.info.isStandalone ? 'Q_notStandalone' : 'Q_standalone');
	de.removeClass(Q.info.isWebView ? 'Q_notWebView' : 'Q_webView');
	if (Q.info.isAndroidStock) {
		de.addClass('Q_androidStock');
	}
	if (Q.info.hasNotch) {
		de.addClass('Q_notch');
	}
	Q_hashChangeHandler.currentUrl = root.location.href.split('#')[0];
	Q_hashChangeHandler.currentUrlTail = Q_hashChangeHandler.currentUrl
		.substr(Q.baseUrl().length + 1);
	if (window.history.pushState) {
		Q.onPopState.set(Q_popStateHandler, 'Q.loadUrl');
	} else {
		Q.onHashChange.set(Q_hashChangeHandler, 'Q.loadUrl');
	}
	Q.onReady.set(function () {
		// renew sockets when reverting to online
		Q.onOnline.set(Q.Socket.reconnectAll, 'Q.Socket');

		// iOS related code. Hide black screen on app start.
		if (navigator.splashscreen) {
			navigator.splashscreen.hide();
		}
	}, 'Q.Socket');

	var QtQw = Q.text.Q.words;
	Q.Visual.ClickOrTap = QtQw.ClickOrTap = useTouchEvents ? QtQw.Tap : QtQw.Click;
	Q.Visual.clickOrTap = QtQw.clickOrTap = useTouchEvents ? QtQw.tap : QtQw.click;
	Q.Visual.CLICKORTAP = QtQw.CLICKORTAP = QtQw.clickOrTap.toUpperCase();
	
	if (root.SpeechSynthesisUtterance && root.speechSynthesis) {
		Q.addEventListener(document.body, 'click', _enableSpeech, false, true);
	}

	if (['en', 'en-US'].indexOf(Q.Text.languageLocale) < 0) {
		Q.Text.get('Q/content', function (err, text) {
			if (!text) {
				return;
			}
			Q.extend(Q.text.Q, 10, text);
			Q.extend(Q.confirm.options, 10, Q.text.confirm);
			Q.extend(Q.prompt.options, 10, Q.text.prompt);
			Q.extend(Q.alert.options, 10, Q.text.alert);
			var QtQw = Q.text.Q.words;
			QtQw.ClickOrTap = useTouchEvents ? QtQw.Tap : QtQw.Click;
			QtQw.clickOrTap = useTouchEvents ? QtQw.tap : QtQw.click;
			Q.layout(null, true);
		});
	}
	
	// load this ASAP so dialogs can load synchronously (for keyboard focus, etc.)
	Q.addScript("{{Q}}/js/fn/dialog.js");
	Q.addScript("{{Q}}/js/fn/clickfocus.js");

	function _enableSpeech () {
		var s = new SpeechSynthesisUtterance();
		s.text = '';
		speechSynthesis.speak(s); // enable speech for the site, on any click
		Q.removeEventListener(document.body, 'click', _enableSpeech);
		Q.Audio.speak.enabled = true;
	}

	// on Q initiated, parse all notices loaded from backend and parse them
	Q.Notices.process();

	// hook beforeunload event
	Q.addEventListener(window, 'beforeunload', function (e) {
		if (!e.defaultPrevented) {
			_documentIsUnloading = true; // WARN: a later handler might cancel the event
		}
	});

	// set some options
	Q.Audio.speak.options.mute = !!Q.getObject("Audio.speak.mute", Q);
}, 'Q');

Q.onJQuery.add(function ($) {
	
	Q.$ = $;
	
	Q.Tool.define({
		"Q/inplace": "{{Q}}/js/tools/inplace.js",
		"Q/tabs": {
			js: "{{Q}}/js/tools/tabs.js",
			css: "{{Q}}/css/tabs.css"
		},
		"Q/form": "{{Q}}/js/tools/form.js",
		"Q/panel": "{{Q}}/js/tools/panel.js",
		"Q/ticker": "{{Q}}/js/tools/ticker.js",
		"Q/timestamp": "{{Q}}/js/tools/timestamp.js",
		"Q/countdown": "{{Q}}/js/tools/countdown.js",
		"Q/bookmarklet": "{{Q}}/js/tools/bookmarklet.js",
		"Q/columns": "{{Q}}/js/tools/columns.js",
		"Q/drawers": "{{Q}}/js/tools/drawers.js",
		"Q/expandable": "{{Q}}/js/tools/expandable.js",
		"Q/filter": "{{Q}}/js/tools/filter.js",
		"Q/rating": "{{Q}}/js/tools/rating.js",
		"Q/paging": "{{Q}}/js/tools/paging.js",
		"Q/pie": "{{Q}}/js/tools/pie.js",
		"Q/badge": "{{Q}}/js/tools/badge.js",
		"Q/resize": "{{Q}}/js/tools/resize.js",
		"Q/layouts": "{{Q}}/js/tools/layouts.js",
		"Q/carousel": "{{Q}}/js/tools/carousel.js",
		"Q/infinitescroll": "{{Q}}/js/tools/infinitescroll.js",
		"Q/parallax": "{{Q}}/js/tools/parallax.js",
		"Q/lazyload": "{{Q}}/js/tools/lazyload.js",
		"Q/audio": "{{Q}}/js/tools/audio.js",
		"Q/video": "{{Q}}/js/tools/video.js",
		"Q/pdf": "{{Q}}/js/tools/pdf.js",
		"Q/image": "{{Q}}/js/tools/image.js",
		"Q/clip": "{{Q}}/js/tools/clip.js",
		"Q/floating": "{{Q}}/js/tools/floating.js"
	});
	
	Q.Tool.jQuery({
		"Q/placeholders": "{{Q}}/js/fn/placeholders.js",
		"Q/textfill": "{{Q}}/js/fn/textfill.js",
		"Q/autogrow": "{{Q}}/js/fn/autogrow.js",
		"Q/dialog": "{{Q}}/js/fn/dialog.js",
		"Q/flip": "{{Q}}/js/fn/flip.js",
		"Q/gallery": "{{Q}}/js/fn/gallery.js",
		"Q/zoomer": "{{Q}}/js/fn/zoomer.js",
		"Q/fisheye": "{{Q}}/js/fn/fisheye.js",
		"Q/listing": "{{Q}}/js/fn/listing.js",
		"Q/hautoscroll": "{{Q}}/js/fn/hautoscroll.js",
		"Q/imagepicker": "{{Q}}/js/fn/imagepicker.js",
		"Q/viewport": "{{Q}}/js/fn/viewport.js",
		"Q/actions": "{{Q}}/js/fn/actions.js",
		"Q/clickable": "{{Q}}/js/fn/clickable.js",
		"Q/clickfocus": "{{Q}}/js/fn/clickfocus.js",
		"Q/contextual": "{{Q}}/js/fn/contextual.js",
		"Q/scrollIndicators": "{{Q}}/js/fn/scrollIndicators.js",
		"Q/iScroll": "{{Q}}/js/fn/iScroll.js",
		"Q/scroller": "{{Q}}/js/fn/scroller.js",
		"Q/scrollbarsAutoHide": "{{Q}}/js/fn/scrollbarsAutoHide.js",
		"Q/sortable": "{{Q}}/js/fn/sortable.js",
		"Q/validator": "{{Q}}/js/fn/validator.js",
		"Q/touchscroll": "{{Q}}/js/fn/touchscroll.js"
	});
	
	Q.onLoad.add(function () {
		// Start loading some plugins asynchronously after document loads.
		// We may need them later.
		$.fn.plugin.load(Q.Tool.jQuery.loadAtStart);
		document.documentElement.addClass('Q_loaded');
	}, 'Q');
	
	if ($ && $.tools && $.tools.validator && $.tools.validator.conf) {
		$.tools.validator.conf.formEvent = null; // form validator's handler irresponsibly sets event.target to a jquery!
	}
		
}, 'Q');

function _addHandlebarsHelpers() {
	var Handlebars = root.Handlebars;
	/**
	 * Call this in your helpers to parse the args into a useful array
	 * You must call it like this: Handlebars.prepareArgs.call(this, arguments)
	 * @method prepareArgs
	 * @static
	 * @param {Array} arguments to helper function
	 * @return {array}
	 */
	Handlebars.prepareArgs = function(args) {
		var arr = Array.prototype.slice.call(args, 0);
		var last = arr.pop(); // last parameter is for the hash
		arr.shift(); // the pattern
		var result = Q.isEmpty(last.hash) ? {} : Q.copy(last.hash);
		Q.each(arr, function (i, item) {
			result[i] = item;
		});
		return Q.extend(result, this);
	};
	if (!Handlebars.helpers.call) {
		Handlebars.registerHelper('call', function(path) {
			if (!path) {
				return "{{call missing method name}}";
			}
			var args = Handlebars.prepareArgs.call(this, arguments);
			var parts = path.split('.');
			var subparts = parts.slice(0, -1);
			var i=0;
			var params = [];
			do {
				params.push(args[i]);
			} while (args[++i]);
			var f = Q.getObject(parts, this);
			if (typeof f === 'function') {
				return f.apply(Q.getObject(subparts, this), params);
			}
			var f = Q.getObject(parts);
			if (typeof f === 'function') {
				return f.apply(Q.getObject(subparts), params);
			}
			return "{{call "+path+" not found}}";
		});
	}
	if (!Handlebars.helpers.ifEquals) {
		/* helper to compare two arguemnts for equal: {{#ifEquals arg1 arg2}} */
		Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
			return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
		});
	}
	if (!Handlebars.helpers.tool) {
		Handlebars.registerHelper('idPrefix', function () {
			var ba = Q.Tool.beingActivated;
			return (ba ? ba.prefix : '');
		});
		Handlebars.registerHelper('join', function(array, sep, options) {
		    return array.map(function(item) {
		        return options.fn(item);
		    }).join(sep);
		});
		Handlebars.registerHelper('tool', function (name, id, tag, options) {
			if (!name) {
				return "{{tool missing name}}";
			}
			if (Q.isPlainObject(tag)) {
				options = tag;
				tag = undefined;
			}
			if (Q.isPlainObject(id)) {
				options = id;
				id = undefined;
			}
			tag = tag || 'div';
			var ba = Q.Tool.beingActivated;
			var prefix = (ba ? ba.prefix : '');
			var o = {};
			var hash = (options && options.hash);
			var className;
			if (hash) {
				for (var k in hash) {
					if (k === 'class') {
						className = hash[k];
					} else {
						Q.setObject(k, hash[k], o, '-');
					}
				}
			}
			if (this && this[name]) {
				Q.extend(o, this[name]);
			}
			if (typeof id === 'string' || typeof id === 'number') {
				id = name.split('/').join('_') + (id !== '' ? '-'+id : '');
				if (this && this['id:'+id]) {
					Q.extend(o, this['id:'+id]);
				}
			}
			return Q.Tool.setUpElementHTML(tag, name, o, id, prefix, {'class': className});
		});
	}
	if (!Handlebars.helpers.url) {
		Handlebars.registerHelper('toUrl', function (url) {
			if (Q.isPlainObject(url)) {
				// we meant to pass a variable, not call a helper
				url = Q.getObject('data.root.toUrl', url);
			}
			if (!url) {
				return "{{url missing}}";
			}
			return Q.url(url);
		});
	}
	if (!Handlebars.helpers.toCapitalized) {
		Handlebars.registerHelper('toCapitalized', function(text) {
			if (Q.isPlainObject(text)) {
				// we meant to pass a variable, not call a helper
				text = Q.getObject('data.root.toCapitalized', text);
			}
			text = text || '';
			return text.charAt(0).toUpperCase() + text.slice(1);
		});
	}
	if (!Handlebars.helpers.json) {
		Handlebars.registerHelper('json', function(context) {
			if (typeof context == "object") {
				return JSON.stringify(context);
			}
			return context;
		});
	}
	if (!Handlebars.helpers.interpolate) {
		Handlebars.registerHelper('interpolate', function(expression) {
			if (!expression || arguments.length < 2) {
				return '';
			}
			var args = Handlebars.prepareArgs.call(this, arguments);
			return expression.interpolate(args);
		});
	}
	if (!Handlebars.helpers.option) {
		Handlebars.registerHelper('option', function(value, html, selectedValue) {
			var attr = value == selectedValue ? ' selected="selected"' : '';
			return new Handlebars.SafeString(
				'<option value="'+value.encodeHTML()+'"'+attr+'>'+html+"</option>"
			);
		});
	}
	if (!Handlebars.helpers.replace) {
		Handlebars.registerHelper('replace', function(find, replace, options) {
			return options.fn(this).replace(find, replace);
		});
	}
}

function _Q_trigger_recursive(tool, eventName, args) {
	if (!tool) {
		return false;
	}
	var obj = Q.getObject(eventName, tool);
	if (obj) {
		Q.handle(obj, tool, args);
	}
	var children = tool.children('', 1);
	for (var id in children) {
		for (var n in children[id]) {
			_Q_trigger_recursive(children[id][n], eventName, args);
		}
	}
}

Q.loadUrl.fillSlots = function _Q_loadUrl_fillSlots (res, url, options) {
	var elements = {}, name, elem, pos;
	var o = options || {};
	var osc = o.slotContainer;
	if (Q.isPlainObject(osc)) {
		o.slotContainer = function (slotName) {
			return osc[slotName] || document.getElementById(slotName+"_slot");
		};
	}
	for (name in res.slots) {
		// res.slots will simply not contain the slots that have
		// already been "cached"

		if (name.toUpperCase() === 'TITLE') {
			document.title = res.slots[name];
		} else if (elem = o.slotContainer(name, res)) { 
			try {
				Q.replace(elem, res.slots[name], options);
				if (!o.dontRestoreScrollPosition['']
				&& !o.dontRestoreScrollPosition[url]
				&& (pos = Q.getObject(['Q', 'scroll', url], elem))
				) {
					elem.scrollLeft = pos.left;
					elem.scrollTop = pos.top;
				} else {
					// reset scrolling to top left corner by default
					elem.scrollLeft = o.scrollLeft || 0;
					elem.scrollTop = o.scrollTop || 0;
				}
			} catch (e) {
				debugger; // pause here if debugging
				console.warn('slot ' + name + ' could not be filled');
				console.warn(e);
			}
			elements[name] = elem;
		}
	}
	return elements;
}

Q.loadUrl.options = {
	quiet: false,
	onError: new Q.Event(),
	onResponse: new Q.Event(),
	onLoadStart: new Q.Event(),
	onLoadEnd: new Q.Event(),
	beforeUnloadUrl: new Q.Event(Q.loadUrl.saveScroll, 'Q'),
	onLoad: new Q.Event(),
	onActivate: new Q.Event(),
	slotNames: [],
	dontRestoreScrollPosition: {},
	slotContainer: function (slotName) {
		return document.getElementById(slotName+"_slot");
	},
	handler: Q.loadUrl.fillSlots,
	key: 'Q'
};

Q.request.options = {
	duplicate: true,
	quiet: true,
	parse: 'json',
	timeout: 5000,
	onRedirect: new Q.Event(function (url) {
		Q.handle(url, {
			target: '_self',
			quiet: true
		});
	}, "Q"),
	resultFunction: "result",
	beforeRequest: [],
	onLoadStart: new Q.Event(),
	onShowCancel: new Q.Event(),
	onLoadEnd: new Q.Event(),
	onResponse: new Q.Event(),
	onProcessed: new Q.Event(),
	onCancel: new Q.Event(function (error) {
		var msg = Q.firstErrorMessage(error);
		if (msg) {
			console.warn(msg);
		}
	}, 'Q')
};

Q.onReady.set(function _Q_masks() {
	_Q_restoreScrolling();
	Q.request.options.onLoadStart.set(function(url, slotNames, o) {
		if (o.quiet) return;
		Q.Masks.show('Q.request.load.mask');
	}, 'Q.request.load.mask');
	Q.request.options.onShowCancel.set(function(callback, o) {
		if (o.quiet) return;
		var mask = Q.Masks.mask('Q.request.cancel.mask').element;
		var button = mask.querySelectorAll('.Q_load_cancel_button');
		if (!button.length) {
			button = document.createElement('button');
			button.setAttribute('class', 'Q_button Q_load_cancel_button Q_wiggle');
			button.innerHTML = 'Cancel';
			if (mask[0]) { mask = mask[0]; }
			mask.appendChild(button);
			button.style.marginLeft - button.getBoundingClientRect()/2;
		}
		$(button).off(Q.Visual.end).on(Q.Visual.end, callback);
		Q.Masks.show('Q.request.cancel.mask');
	}, 'Q.request.load.mask');
	Q.request.options.onLoadEnd.set(function(url, slotNames, o) {
		if (o.quiet) return;
		Q.Masks.hide('Q.request.load.mask');
		Q.Masks.hide('Q.request.cancel.mask');
	}, 'Q.request.load.mask');
	Q.layout();
}, 'Q.Masks');

if (_isCordova) {
	Q.onReady.set(function _Q_handleOpenUrl() {
		root.handleOpenURL = function (url) {
			Q.handle(Q.onHandleOpenUrl, Q, [url]);
		};
	}, 'Q.handleOpenUrl');

	Q.onReady.set(function _Q_browsertab() {
		if (!(cordova.plugins && cordova.plugins.browsertabs)) {
			return;
		}
		cordova.plugins.browsertabs.isAvailable(function(result) {
			var a = root.open;
			delete root.open;
			root.open = function (url, target, options) {
				var noopener = options && options.noopener;
				var w = !noopener && (['_top', '_self', '_parent'].indexOf(target) >= 0);
				if (!target || w) {
					Q.handle(url);
					return root;
				}
				if (result) {
					cordova.plugins.browsertabs.openUrl(url, options, function() {}, function() {});
				} else if (cordova.InAppBrowser) {
					cordova.InAppBrowser.open(url, '_system', options);
				}
			};
			root.close = function (url, target, options) {
				if (result) {
					cordova.plugins.browsertabs.close(options);
				} else if (cordova.InAppBrowser) {
					cordova.InAppBrowser.close();
				}
			};
		}, function () {});
	}, 'Q.browsertabs');
}

/**
 * Class to do things with cameras.
 * @class Camera
 * @namespace Q
 * @static
 */
Q.Camera = {
	Scan: {
		onClose: new Q.Event(),
		options: {
			sound: {
				src: "{{Q}}/audio/scanned.mp3"
			},
			dialog: {
				title: "Scan QR codes"
			}
		},
		/**
		 * Method - interface for QR code scan action. It decide which plugin or library to use
		 * and handle callback (when QR code found) to mark participants as "checked".
		 * @method qr
		 * @static
		 * @param {function} callback Executed when QR code found with text of this code in arguments
		 * @param {object} options Object with options to replace default
		 */
		qr: function (callback, options) {
			options = Q.extend({}, this.options, options);
			var audio =  new Q.Audio(options.sound.src);
			if (typeof QRScanner !== "undefined") {
				return this.adapters.cordova(audio, callback, options);
			}
			this.adapters.instascan(audio, callback, options);
		},
		adapters: {
			/**
			 * Using to scan QR codes using QRScanner Cordova plugin
			 * @method cordova
			 * @static
			 * @param {Object} audio Q.audio with loaded audio file to play when QR code found
			 * @param {Function} callback function to execute when QR code found and provide text as argument
			 * @param {Object} options object with options to replace default
			 */
			cordova: function (audio, callback, options) {
				var $html = $('html');
				$html.addClass("Q_scanning");
				var _close = function(event){
					if (Q.getObject("target", event)) {
						event.stopPropagation();
						event.preventDefault();
					}

					$html.removeClass("Q_scanning");
					$(this).remove();
					QRScanner.cancelScan();
					Q.handle(Q.Camera.Scan.onClose);
				};
				var $closeIcon = $('<a href="#" class="Q_scanning_close">')
					.on(Q.Visual.fastclick, _close)
					.appendTo("body");
				Q.addEventListener(document, 'deviceready', function () {
					QRScanner.prepare(function(err, status){
						if (err) {
							Q.handle(_close, $closeIcon);
							return console.error(err);
						}
						if (status.authorized) {
							QRScanner.show();
							if (Q.info.platform === 'ios') {
								$html.hide();
								setTimeout(function () {
									$html.show();
								}, 0);
							}
							var _scan = function(err, text){
								if (err){
									console.warn(err);
									return;
								}
								if (audio) {
									audio.play();
								}
								Q.handle(callback, null, [text]);
								// run scanner for next code with 5 sec delay
								setTimeout(function(){
									QRScanner.scan(_scan);
								}, 3000);
							};
							QRScanner.scan(_scan); // start scanning
						} else if (status.denied) {
							Q.handle(_close, $closeIcon);
							// The video preview will remain black, and scanning is disabled. We can
							// try to ask the user to change their mind, but we'll have to send them
							// to their device settings with `QRScanner.openSettings()`.
						} else {
							Q.handle(_close, $closeIcon);
							// we didn't get permission, but we didn't get permanently denied. (On
							// Android, a denial isn't permanent unless the user checks the "Don't
							// ask again" box.) We can ask again at the next relevant opportunity.
						}
					});
				});
			},
			/**
			 * Using to scan QR code with first camera found on device
			 * (using Instascan library dynamically loaded)
			 * @method instascan
			 * @static
			 * @param {Q.Audio} audio Q.Audio with loaded audio file to play when QR code found
			 * @param {function} callback function to execute when QR code found and provide text as argument
			 * @param {object} options object with options to replace default
			 */
			instascan: function (audio, callback, options) {
				Q.addScript('{{Q}}/js/qrcode/instascan.js', function () {
					Q.Dialogs.push({
						title: options.dialog.title,
						className: "Q_scanning",
						content: "",
						fullscreen: true,
						onActivate: _onActivate,
						onClose: function () {
							Q.handle(Q.Camera.Scan.onClose);
						}
					});
				});
				function _onActivate(dialog) {
					var $element = $(".Q_dialog_slot", dialog);
					var $title = $(".Q_title_slot", dialog);

					// set max height
					$element.height(dialog.height() - $title.height());

					var elementHeight = $element.height();
					var elementWidth = $element.width();

					// create video element
					var $videoElement = $("<video playsinline autoplay>").appendTo($element);

					// set heigth/width of video element to stretch full screen
					if (elementHeight > elementWidth) {
						$videoElement.width(elementWidth);
					} else {
						$videoElement.height(elementHeight);
					}
					Q.Camera.Scan.onClose.set(function(){
						scanner.stop();
					});
					var scanner = new Instascan.Scanner({
						video: $videoElement[0],
						scanPeriod: 5,
						mirror: false
					});
					scanner.addListener('scan', function (text, image) {
						audio.play();
						Q.handle(callback, null, [text]);
					});

					Instascan.Camera.getCameras().then(function (cameras) {
						var camerasAmount = Q.getObject(['length'], cameras) || 0;
						if (!camerasAmount || camerasAmount <= 0) {
							console.error('No cameras found.');
						}

						// index of selected camera to last camera
						var selectedCamera = camerasAmount - 1;

						// if more than 1 camera - add swap icon
						if (camerasAmount > 1) {
							$("<a class='Q_swap'>").on(Q.Visual.fastclick, function(){
								selectedCamera = (selectedCamera+1) % camerasAmount;
								scanner.start(cameras[selectedCamera]);
							}).appendTo(dialog);
						}

						scanner.start(cameras[selectedCamera]);
					}).catch(function (e) {
						console.error(e);
					});
				}
			}
		}
	}
};

/**
 * Operates with colors.
 * @class Q.Colors
 */
 Q.Color = {
	/**
	 * Get a color somewhere between startColor and endColor
	 * @method toHex
	 * @static
	 * @param {String|Number} startColor 
	 * @param {String|Number} endColor 
	 * @param {String|Number} fraction 
	 * @returns {String} a color as a hex string without '#' in front
	 */
	toHex: function (r, g, b) {
		return [r, g, b].map(x => {
			const hex = Math.round(x).toString(16)
			return hex.length === 1 ? '0' + hex : hex
		  }).join('');
	},
	/**
	 * Get a color somewhere between startColor and endColor
	 * @method between
	 * @static
	 * @param {String|Number} startColor 
	 * @param {String|Number} endColor 
	 * @param {String|Number} fraction 
	 * @returns {String} a color as a hex string without '#' in front
	 */
	between: function(startColor, endColor, fraction) {
		if (typeof startColor === 'string') {
			startColor = parseInt(startColor.replace('#', '0x'), 16);
		}
		if (typeof endColor === 'string') {
			endColor = parseInt(endColor.replace('#', '0x'), 16);
		}
		var startRed = (startColor >> 16) & 0xFF;
		var startGreen = (startColor >> 8) & 0xFF;
		var startBlue = startColor & 0xFF;
		var endRed = (endColor >> 16) & 0xFF;
		var endGreen = (endColor >> 8) & 0xFF;
		var endBlue = endColor & 0xFF;
		var newRed = startRed + fraction * (endRed - startRed);
		var newGreen = startGreen + fraction * (endGreen - startGreen);
		var newBlue = startBlue + fraction * (endBlue - startBlue);
		return Q.Color.toHex(newRed, newGreen, newBlue);
	},
	/**
	 * Sets a new theme-color on the window
	 * @method setWindowTheme
	 * @static
	 * @param {String} color in any CSS format, such as "#aabbcc"
	 * @return {String} the previous color
	 */
	setWindowTheme: function (color) {
		if (Q.Color.setWindowTheme.ignore) {
			return color;
		}
		var meta = document.querySelector('meta[name="theme-color"]');
		var prevColor = null;
		if (meta) {
			prevColor = meta.getAttribute('content');
		}
		if (color) {
			if (!meta) {
				meta = document.createElement('meta');
				meta.setAttribute('name', 'theme-color');
			}
			meta.setAttribute('content', color);
		}
		return prevColor;
	},
	/**
	 * Gets the current window theme color
	 * @method getWindowTheme
	 * @static
	 * @param {String} color in any CSS format, such as "#aabbcc"
	 * @return {String|null} the previous color, or null if it's missing
	 */
	getWindowTheme: function () {
		var meta = document.querySelector('meta[name="theme-color"]');
		return meta ? meta.getAttribute('content') : null;
	}
};

/**
 * Operates with notices.
 * @class Q.Notices
 */
Q.Notices = {

	/**
	 * Setting that changes notices slide down / slide up time.
	 * @property popUpTime
	 * @type {Number}
	 * @default 500
	 */
	popUpTime: 500,

	/**
	 * Container for notices
	 * @property container
	 * @type {HTMLElement}
	 */
	container: document.getElementById("notices_slot"),

	/**
	 * Here store groips of notices closed manually by user. These groups will not appear during current session.
	 * @property closedGroups
	 * @type {array}
	 */
	closedGroups: [],

	/**
	 * Adds a notice.
	 * @method add
	 * @param {Object} options Object of options
	 * @param {String} [options.key] Unique key for this notice. Need if you want to modify/remove notice by key.
	 * @param {String} [options.group] key to group notices. If user close notice manually, this group of notices will not appear during session.
	 * @param {String} options.content HTML contents of this notice.
	 * @param {Boolean} [options.closeable=true] Whether notice can be closed with red x icon.
	 * @param {Function|String} [options.handler] Something (callback or URL) to handle with Q.handle() on click notice
	 * @param {String} [options.type=common] Arbitrary type of notice. Can be used to apply different styles dependent on type,
	 * because appropriate CSS class appended to the notice. May be 'error', 'warning'.
	 * @param {Boolean|Number} [options.timeout=false] Time in seconds after which to remove notice.
	 * @param {Boolean|Number} [options.persistent=false] Whether to save this notice to session to show after page refresh.
	 */
	add: function(options)
	{
		if (!this.container instanceof HTMLElement) {
			throw new Error("Q.Notices.add: Notices container element don't exists.");
		}

		// default options
		var o = Q.extend({
			key: null,
			group: null,
			closeable: true,
			type: 'common',
			timeout: false,
			persistent: false
		}, options);

		if (o.group && Q.Notices.closedGroups.includes(o.group)) {
			return;
		}

		if (o.persistent && !o.key) {
			o.key = Date.now().toString();
		}

		var key = o.key;
		var content = o.content;
		var noticeClass = 'Q_' + o.type + '_notice';

		// if key not empty and notice with this key already exist
		if (key && this.container.querySelector('li[data-key="'+key+'"]')) {
			throw new Error('Q.Notices.add: A notice with key "'+key+'" already exists.');
		}
		var ul = this.container.getElementsByTagName('ul')[0];
		if (!ul) {
			ul = document.createElement('ul');
			this.container.appendChild(ul);
		}
		var li = document.createElement('li');
		var notice = Q.take(o, ['key', 'closeable', 'persistent', 'timeout']);
		notice.local = true;
		if (key) {
			li.setAttribute('data-key', notice.key);
		}
		li.setAttribute('data-notice', JSON.stringify(notice));
		li.classList.add(noticeClass);
		li.onclick = function () {
			Q.Notices.remove(li);
			Q.handle(o.handler, li, [content]);
		};
		var span = document.createElement('span');
		span.innerHTML = content.trim();
		li.appendChild(span);
		if (o.closeable) {
			var closeIcon = document.createElement('span');
			closeIcon.classList.add("Q_close");
			li.appendChild(closeIcon);
			closeIcon.onclick = function (event) {
				event.stopPropagation();
				Q.Notices.remove(li);
				o.group && Q.Notices.closedGroups.push(o.group);
			}
		}
		if (typeof o.timeout === 'number' && o.timeout > 0) {
			setTimeout(function () {
				Q.Notices.remove(li);
			}, o.timeout * 1000);
		}
		ul.appendChild(li);
		Q.activate(ul);
		setTimeout(function () {
			Q.Notices.show(li);
			var element = document.getElementById('notices_slot');
			element && (element.style.zIndex = Q.zIndexTopmost() + 1);
			if (!o.persistent) {
				return;
			}
			if (!key) {
				throw new Exception("key required for persistent notice");
			}
			var oj = Q.take(o, ['persistent', 'closeable', 'timeout', 'handler']);
			Q.req('Q/notice', [], null, {
				method: 'post',
				fields: {
					// we need key for persistent notices
					key: key,
					content: content,
					options: oj
				}
			});
		}, 0);
	},
	/**
	 * Get a notice by key.
	 * @method get
	 * @param {String|HTMLElement} notice HTMLElement or key
	 * Unique key of notice which has been provided when notice was added.
	 * Or notice HTMLElement
	 */
	get: function(notice)
	{
		if (typeof notice === 'string') {
			notice = this.container.querySelector('li[data-key="' + notice + '"]');
		}

		if (notice instanceof HTMLElement) {
			return notice;
		}

		return null;
	},
	/**
	 * Removes a notice.
	 * @method remove
	 * @param {String|HTMLElement} notice HTMLElement or key
	 * Unique key of notice which has been provided when notice was added.
	 * Or notice HTMLElement
	 */
	remove: function(notice)
	{
		if (Array.isArray(notice)) {
			notice.forEach(function(item) {
				Q.Notices.remove(item);
			});

			return;
		}
		notice = this.get(notice);
		if (notice instanceof HTMLElement) {
			this.hide(notice);

			var key = notice.getAttribute('data-key');
			var json = notice.getAttribute('data-notice');
			var o = JSON.parse(json) || {};
			// if notice persistent - send request to remove from session
			if (typeof key === 'string' && o.persistent) {
				Q.req('Q/notice', [], null, {
					method: 'delete',
					fields: {key: key}
				});
			}

			// delay because notice hide with transition
			setTimeout(function () {
				notice.remove();
			}, this.popUpTime);
		}
	},
	/**
	 * Hides a notice.
	 * @method hide
	 * @param {String|HTMLElement} notice HTMLElement or key
	 * Unique key of notice which has been provided when notice was added.
	 * Or notice HTMLElement
	 */
	hide: function(notice) {
		notice = this.get(notice);
		if (notice instanceof HTMLElement) {
			notice.addClass("Q_hidden_notice").removeClass("Q_show_notice");
		}
	},
	/**
	 * Shows a previously notice.
	 * @method show
	 * @param {String|HTMLElement} notice HTMLElement or key
	 * Unique key of notice which has been provided when notice was added.
	 * Or notice HTMLElement
	 */
	show: function(notice)
	{
		notice = this.get(notice);
		if (notice instanceof HTMLElement) {
			notice.removeClass("Q_hidden_notice").addClass("Q_show_notice");
		}
	},
	/**
	 * Parse notices loaded from backend.
	 * @method process
	 */
	process: function () {
		var noticeElement = document.getElementById("notices_slot");
		if (!(noticeElement instanceof HTMLElement)) {
			return console.warn("Q.Notices.process: element with id=notices_slot not found");
		}

		var noticeElements = noticeElement.getElementsByTagName("li");
		var options, handler, key, persistent, timeout, type;

		Q.each(noticeElements, function () {
			options = {};
			options.content = this.innerHTML;
			options.type = 'common';
			var json = this.getAttribute('data-notice');
			var o = JSON.parse(json) || {};
			// turn to boolean
			Q.each(o, function (i) {
				if (this === "true") {
					o[i] = true;
				} else if (this === "false") {
					o[i] = false;
				}
			});
			Q.extend(options, o);
			this.remove(); // need to remove before adding because can be keys conflict
			Q.Notices.add(options);
		});
	}
};

Q.beforeInit.addOnce(function () {
	if (!Q.baseUrl()) {
		throw new Q.Error("Please set Q.info.baseUrl before calling Q.init()");
	}
	if (_appId) {
		Q.info.appId = _appId;
		Q.cookie('Q_appId', _appId);
	}
	if (_udid) {
		Q.info.udid = _udid;
		Q.cookie('Q_udid', _udid);
	}
	if (Q.getObject('Q.info.cookies.indexOf') && Q.info.cookies.indexOf('Q_dpr')) {
		Q.cookie('Q_dpr', window.devicePixelRatio);
	}
	var e;
	var slotNames = ['dashboard', 'notices'];
	for (var i=0; i<slotNames.length; ++i) {
		var sn = slotNames[i];
		if (Q.ignoreBackwardCompatibility === true
		|| !Q.ignoreBackwardCompatibility[sn]) {
			if (e = document.getElementById(sn+'_slot')) {
				var r = e.getBoundingClientRect();
				if (r.top < window.innerHeight / 10) {
					e.removeClass('Q_fixed_bottom').addClass('Q_fixed_top');
				} else if (r.bottom > window.innerHeight * 9 / 10) {
					e.removeClass('Q_fixed_top').addClass('Q_fixed_bottom');
				}
			}
		}
	}

	Q.ensure('Promise');
}, 'Q');

/**
 * @module Q
 */
if (typeof module !== 'undefined' && typeof process !== 'undefined') {
	// Assume we are in a Node.js environment, e.g. running tests
	module.exports = Q;
} else if (!dontSetGlobals) {
	// We are in a browser environment
	/**
	 * This method restores the old window.Q and returns an instance of itself.
     * @method noConflict
	 * @param {boolean} extend
	 *  If true, extends the old Q with methods and properties from the Q Platform.
	 *  Otherwise, the old Q is untouched.
	 * @return {Function}
	 *  Returns the Q instance on which this method was called
	 */
	Q.noConflict = function (extend) {
		if (extend) {
			Q.extend(oldQ, Q);
		}
		root.Q = oldQ;
		return Q;
	};
	var oldQ = root.Q;
	root.Q = Q;
}

Q.globalNames = Object.keys(root); // to find stray globals

/**
 * This function is useful to make sure your code is not polluting the global namespace
 * @method globalNamesAdded
 * @static
 */
Q.globalNamesAdded = function () {
	return Q.diff(Object.keys(window), Q.globalNames);
};

/**
 * This function is useful for debugging, e.g. calling it in breakpoint conditions
 * @method stackTrack
 * @static
 */
Q.stackTrace = function() {
	var obj = {};
	if (Error.captureStackTrace) {
		Error.captureStackTrace(obj, Q.stackTrace);
	} else {
		obj = new Error();
	}
	return obj.stack.replace('Error', 'Stack Trace');
};

/**
 * Call this inside a script element in the HTML when you don't want
 * some other scripts on the page to get its contents.
 * SECURITY: Watch out. If your website allows scripts to be loaded synchronously
 * before the script which calls this method, then they can register a
 * MutationObserver to get at the textContent of the script before it's executed.
 */
Q.removeCurrentScript = function() {
	var cs;
	cs = document.currentScript || document.scripts[document.scripts.length - 1];
	cs.parentNode.removeChild(cs);
};

var _udid = location.search.queryField('Q.udid');
var _appId = location.search.queryField('Q.appId');

return Q;

}).call(this);
