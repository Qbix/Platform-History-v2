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
var $ = root.jQuery;

// private properties
var _isReady = false;
var _isOnline = null;

/**
 * @class Q
 * @constructor
 */
function Q () {
	// explore the docs at http://qbix.com/platform/client
}

// external libraries, which you can override
Q.libraries = {
	json: "http://cdnjs.cloudflare.com/ajax/libs/json3/3.2.4/json3.min.js",
	promise: 'plugins/Q/js/Promise.js',
	handlebars: 'plugins/Q/js/handlebars-v1.3.0.min.js',
	jQuery: 'https://code.jquery.com/jquery-1.11.3.min.js'
};

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
	return null;
};

if (!Object.keys)
/**
* Returns an array containing the object's keys, in a cross-browser way
* @method keys
* @return {Array}
*/
Object.keys = (function () {
	var hasOwnProperty = Object.prototype.hasOwnProperty,
		hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
		DontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		],
		DontEnumsLength = DontEnums.length;
  
	return function (o) {
		if (typeof o != "object" && typeof o != "function" || o === null)
			throw new TypeError("Object.keys called on a non-object");
	 
		var result = [];
		for (var name in o) {
			if (hasOwnProperty.call(o, name)) {
				result.push(name);
			}
		}
	 
		if (hasDontEnumBug) {
			for (var i = 0; i < DontEnumsLength; i++) {
				if (hasOwnProperty.call(o, DontEnums[i]))
					result.push(DontEnums[i]);
			}   
		}
	 
		return result;
	};
})();

/**
 * @class String
 * @description Q extended methods for Strings
 */

/**
 * Returns a copy of the string with Every Word Capitalized
 * @method toCapitalized
 * @return {String}
 */
var Sp = String.prototype;
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
	return !!this.match(/^([A-Za-z]*:|)\/\//);
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
 * @return {String}
 */
Sp.encodeHTML = function _String_prototype_encodeHTML() {
	return this.replaceAll({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
		"\n": '<br>'
	});
};

/**
 * Reverses what encodeHTML does
 * @method decodeHTML
 * @return {String}
 */
Sp.decodeHTML = function _String_prototype_decodeHTML() {
	return this.replaceAll({
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&apos;': "'",
		"<br>": "\n",
		"<br />": "\n"
	});
};

/**
 * Interpolates some fields into the string wherever "{{fieldName}}" appears
 * @method interpolate
 * @param {Object} fields The field names and values
 * @return {String}
 */
Sp.interpolate = function _String_prototype_interpolate(fields) {
	return this.replace(/\{\{([^{}]*)\}\}/g, function (a, b) {
		var r = fields[b];
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
 * Gets a param from a string, which is usually the location.search or location.hash
 * @method queryField
 * @param {String} name The name of the field
 * @param value {String} Optional, provide a value to set in the querystring, or null to delete any fields that match name as a RegExp
 * @return {String} the value of the field in the string, or if value was not undefined, the resulting querystring
 */
Sp.queryField = function Q_queryField(name, value) {
	var what = this;
	var prefixes = ['#!', '#', '?', '!'];
	var count = prefixes.length;
	var prefix = '';
	var i, l, p, keys, parsed;
	for (i=0; i<count; ++i) {
		l = prefixes[i].length;
		p = this.substring(0, l);
		if (p == prefixes[i]) {
			prefix = p;
			what = this.substring(l);
			break;
		}
	}
	if (typeof name === 'object') {
		var result = what;
		Q.each(value, function (key, value) {
			result = result.queryField(key, value);
		});
	} else if (value === undefined) {
		return Q.parseQueryString(what) [ name ];
	} else if (value === null) {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		var reg = new RegExp(name);
		for (var k in parsed) {
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
 * @return {String}
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
	if (this.length < prefix.length) {
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
 * @class Array
 * @description Q extended methods for Arrays
 */
var Ap = Array.prototype;
if (!Ap.indexOf)
Ap.indexOf = function _Array_prototype_indexOf(searchElement /*, fromIndex */ ) {
	if (this === 0 || this === null) {
		throw new TypeError();
	}
	var t = Object(this);
	var len = t.length >>> 0;
	if (len === 0) {
		return -1;
	}
	var n = 0;
	if (arguments.length > 0) {
		n = Number(arguments[1]);
		if (n !== n) { // shortcut for verifying if it's NaN
			n = 0;
		} else if (n !== 0 && n !== Infinity && n !== -Infinity) {
			n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
	}
	if (n >= len) {
		return -1;
	}
	var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	for (; k < len; k++) {
		if (k in t && t[k] === searchElement) {
			return k;
		}
	}
	return -1;
};

if (!Ap.forEach)
Ap.forEach = function(callback) {
	for (var i = 0; i < this.length; i++){
		callback.apply(this, [this[i], i, this]);
	}
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
 * Returns a Date from a dateTimeString
 * @param {String} dateTimeString
 * @return {Date}
 */
Date.fromDateTime = function _Date_fromDateTime(dateTimeString) {
	return new Date(dateTimeString.replace(/-/g,"/"));
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

if(!document.getElementsByClassName) {
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
	return null;
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
 * @return {Object|String}
 */
Elp.computedStyle = function(name) {
	var computedStyle = root.getComputedStyle
		? getComputedStyle(this, null)
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
 * @param {Element} element
 */
Elp.scrollingParent = function() {
	var p = this;
	while (p = p.parentNode) {
		if (typeof p.computedStyle !== 'function') {
			continue;
		}
		var overflow = p.computedStyle().overflow;
		if (['hidden', 'visible'].indexOf(overflow) < 0) {
			return p;
		}
	}
	return document.documentElement;
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
 * Restore ability to select text in an element 
 * @method addClass
 * @chainable
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.addClass = function (className) {
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
 * Returns whether the element's is visible
 * @method isVisible
 * @return {boolean}
 */
Elp.isVisible = function () {
	return this.offsetWidth > 0 || this.offsetHeight > 0;
};

/**
 * Gets the width remaining after subtracting all the siblings on the same line
 * @method remainingWidth
 * @param {boolean} subpixelAccuracy
 * @return {number|null} Returns the remaining width, or null if element has no parent
 */
Elp.remainingWidth = function (subpixelAccuracy) {
	var element = this;
	if (!this.parentNode) {
		return null;
	}
	var rect1 = this.getBoundingClientRect();
	var rect2 = this.parentNode.getBoundingClientRect();
	var w = (rect2.right - rect2.left); // could be fractional
	var cs = this.parentNode.computedStyle();
	w -= _parseFloat(cs.paddingLeft) + _parseFloat(cs.paddingRight)
		+ _parseFloat(cs.borderLeftWidth) + _parseFloat(cs.borderRightWidth);
	Q.each(this.parentNode.children, function () {
		if (this === element || !this.isVisible()) return;
		var style = this.computedStyle();
		var rect3 = this.getBoundingClientRect();
		if (rect1.top > rect3.bottom || rect1.bottom < rect3.top) {
			return;
		}
		w -= (rect3.right - rect3.left
			+ _parseFloat(style.marginLeft) + _parseFloat(style.marginRight));
	});	
	return subpixelAccuracy ? w : Math.floor(w-0.01);
};

if (!Elp.getElementsByClassName) {
	Elp.getElementsByClassName = document.getElementsByClassName;
}

}

function _parseFloat(value) {
	return value.substr(value.length-2) == 'px' ? parseFloat(value) : 0;
}
	
(function() {
	if(navigator.appVersion.indexOf('MSIE 8') > 0) {
		var _slice = Array.prototype.slice;
		Array.prototype.slice = function() {
			if(this instanceof Array) {
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
 * Returns the number of milliseconds since the first call to this function
 * i.e. since this script was parsed.
 * @method milliseconds
 * @param {boolean} sinceEpoch
 *  Defaults to false. If true, just returns the number of milliseconds in the UNIX timestamp.
 * @return {number}
 *  The number of milliseconds, with fractional part
 */
Q.milliseconds = function _Q_microtime(sinceEpoch) {
	var now = Date.now();
	if (sinceEpoch) {
		return now;
	}
	Q.milliseconds.started = Q.milliseconds.started || now;
	return now - Q.milliseconds.started;
};
Q.milliseconds();

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
		return null;
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
	return null;
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
				break;
			}
		}
		if (!found) {
			if (isArr) {
				result.push(v1);
			} else {
				result[k] = v1;
			}
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
		// This is just for IE8
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
 * @param {Array} fields
 *  Optional array of fields to copy. Otherwise copy all that we can.
 * @param levels {number}
 *  Optional. Copy this many additional levels inside x if it is a plain object.
 * @return {Object}
 *  Returns the shallow copy where some properties may have deepened the copy
 */
Q.copy = function _Q_copy(x, fields, levels) {
	if (Q.typeOf(x) === 'array') {
		var arr = Array.prototype.slice.call(x, 0);
	}
	if (x && typeof x.copy === 'function') {
		return x.copy();
	}
	if (x === null || !Q.isPlainObject(x)) {
		return x;
	}
	var result = Q.objectWithPrototype(Object.getPrototypeOf(x)), i, k, l;
	if (fields) {
		l = fields.length;
		for (i=0; i<l; ++i) {
			k = fields[i];
			if (!(k in x)) continue;
			if (x[k] && typeof(x[k].copy) === 'function') {
				result[k] = x[k].copy();
			} else {
				result[k] = x[k];
			}
		}
	} else {
		for (k in x) {
			if (!Q.has(x, k)) {
				continue;
			}
			if (x[k] && typeof(x[k].copy) === 'function') {
				result[k] = x[k].copy();
			} else if (levels) {
				result[k] = Q.copy(x[k], null, levels-1);
			} else {
				result[k] = x[k];
			}
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
 * @param levels {number}
 *  Optional. Precede any Object with an integer to indicate that we should 
 *  also copy that many additional levels inside the object.
 * @param deep {Boolean|Number}
 *  Optional. Precede any Object with a boolean true to indicate that we should
 *  also copy the properties it inherits through its prototype chain.
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
 *  The array taht gets passed here is shuffled in place
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
 * @return {String} the normalized string
 */
Q.normalize = function _Q_normalize(text, replacement, characters, numChars) {
	if (!numChars) numChars = 200;
	if (replacement === undefined) replacement = '_';
	characters = characters || /[^A-Za-z0-9]+/g;
	if (text === undefined) {
		debugger; // pause here if debugging
	}
	var result = text.toLowerCase().replace(characters, replacement);
	if (text.length > numChars) {
		result = text.substr(0, numChars-11) + '_' 
				 + Math.abs(text.substr(numChars-11).hashCode());
	}
	return result;
};

function _getProp (/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var p, i = 0;
	if (context === null) return undefined;
	context = context || root;
	if(!parts.length) return context;
	while(context && (p = parts[i++]) !== undefined){
		try {
			context = (p in context) ? context[p] : (create ? context[p] = {} : undefined);
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
 * @return {Object|undefined} Returns the passed value if setting is successful or `undefined` if not.
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
		Q.setObject(name, create, context, delimiter);
	}
	return result;
};

/**
 * Use this to ensure that a property exists before running some javascript code.
 * If something is undefined, loads a script or executes a function, calling the callback on success.
 * @static
 * @method ensure
 * @param {Mixed} property
 *  The property to test for being undefined.
 * @param {String|Function} loader
 *  Something to execute if the property was undefined.
 *  If a string, this is interpreted as the URL of a javascript to load.
 *  If a function, this is called with the callback as the first argument.
 * @param {Function} callback
 *  The callback to call when the loader has been executed.
 *  This is where you would put the code that relies on the property being defined.
 */
Q.ensure = function _Q_ensure(property, loader, callback) {
	if (property !== undefined) {
		Q.handle(callback);
		return;
	}
	if (typeof loader === 'string') {
		Q.addScript(loader, callback);
		return;
	} else if (typeof loader === 'function') {
		loader(callback);
	} else if (loader instanceof Q.Event) {
		loader.add(callback);
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
 * Calculates a string key by considering the parameter that was passed,
 * the tool being activated, and the page being activated.
 * These keys can be used in methods of Q.Event, Q.Masks etc.
 * @static
 * @method calculateKey
 * @param {String|Q.Tool} key
 * @param {Object} container in which the key will be used
 * @param {number} number at which to start the loop for the default key generation
 * @return {String}
 */
Q.calculateKey = function _Q_Event_calculateKey(key, container, start) {
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
 * @return {String} The key under which the event was set
 */
Evp.set = function _Q_Event_prototype_set(handler, key, prepend) {
	var isTool = (Q.typeOf(key) === 'Q.Tool');
	if (key === true || (key === undefined && Q.Page.beingActivated)) {
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
 * @return {String} The key under which the handler was set
 */
Evp.add = function _Q_Event_prototype_add(handler, key, prepend) {
	var event = this;
	var ret = this.set(handler, key, prepend);
	if (this.occurred || this.occurring) {
		Q.handle(handler, this.lastContext, this.lastArgs);
	}
	return ret;
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
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to anotherEvent.add (see docs for that method).
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
 * @method debounce
 * @param {number} milliseconds The number of milliseconds
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.debounce = function _Q_Event_prototype_debounce(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.debounce(newEvent.handle, milliseconds, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only at most every given milliseconds.
 * @method throttle
 * @param {number} milliseconds The number of milliseconds
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.throttle = function _Q_Event_prototype_throttle(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.throttle(newEvent.handle, milliseconds, 0), key);
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
 *   an array of two items for the new call: [this, arguments]
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.map = function _Q_Event_prototype_map(transform, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		var parts = transform.apply(this, arguments);
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
 * @param {Object} collection
 *  The object that will store all the events. Pass null here to auto-create one.
 * @param {Array} defaults
 *  You can pass an array of defaults for the fields in the returned function
 *  The last element of this array can be a function that further processes the arguments,
 *  returning an array of the resulting arguments
 * @param {Function} callback
 *  An optional callback that gets called when a new event is created.
 *  The "this" object is the Q.Event, and the parameters are the processed parameters
 *  passed to the returned factory function.
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
	var _Q_Event_factory = function _Q_Event_factory_function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var len = defaults.length;
		var f = (typeof(defaults[len-1]) === 'function')
			? defaults[defaults.length-1] : null;
		if (f) --len;
		for (var i=args.length; i<len; ++i) {
			args[i] = defaults[i];
		}
		args = (f && f.apply(this, args)) || args;
		var delimiter = "\t";
		var name = args.join(delimiter);
		var e = Q.getObject(name, collection, delimiter);
		if (e) {
			return e;
		}
		var e = new Q.Event();
		e.factory = _Q_Event_factory;
		e.name = name;
		if (callback) {
			callback.apply(e, args);
		}
		_Q_Event_factory.onNewEvent.handle.apply(e, args);
		Q.setObject(name, e, collection, delimiter);
		if (removeOnEmpty) {
			e.onEmpty().set(_remove);
		}
		e.indexes = name;
		return e;
	}
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
var _layoutElements = [];
var _layoutEvents = [];
/**
 * Call this function to get an event which occurs every time
 * Q.layout() is called on the given element or one of its parents.
 * @param {Element} [element=document.documentElement] 
 * @event onLayout
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
	var event = new Q.Event();
	var l = _layoutElements.push(element);
	_layoutEvents[l-1] = event;
	event.onEmpty().set(function () {
		for (var i=0, l=_layoutElements.length; i<l; ++i) {
			if (_layoutElements[i] === element) {
				_layoutElements.splice(i, 1);
				break;
			}
		}
	}, 'Q');
	return event;
}
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
 */
Pp.on = function _Q_pipe_on(field, callback) {
	return this.add([field], 1, function _Q_pipe_on_callback (params, subjects, field) {
		return callback.apply(subjects[field], params[field], field);
	});
};

/**
 * Adds a callback to the pipe with more flexibility
 * @method add
 * @param requires {Array}
 *  Optional. Pass an array of required field names here.
 *  Alternatively, pass an array of objects, which should be followed by
 *  the name of a Q.Event to wait for.
 * @param maxTimes {number}
 *  Optional. The maximum number of times the callback should be called.
 * @param callback {Function}
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
 *  It is passed the arguments, subjects and callbacks that were collected by Q.batcher
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
			if (!batch.args) batch.args = [];
			if (!batch.callbacks) batch.callbacks = [];

			batch.subjects.push(this);
			batch.args.push(args);
			batch.callbacks.push(callbacks);

			if (batch.timeout) {
				clearTimeout(batch.timeout);
			}
			function runBatch() {
				try {
					batch.call(this, batch.subjects, batch.args, batch.callbacks);
					batch.subjects = batch.args = batch.callbacks = null;
					batch.count = 0;
					batch.argmax = 0;
					batch.cbmax = 0;
				} catch (e) {
					batch.count = 0;
					batch.argmax = 0;
					batch.cbmax = 0;
					throw e;
				}
			}
			if (batch.count == o.max) {
				runBatch();
			} else {
				batch.timeout = setTimeout(runBatch, o.ms);
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
		Q.req(baseUrl+tail, slotName, function (err, response) {
			var error = err || response.errors;
			if (error) {
				Q.each(callbacks, function (k, cb) {
					cb[0].call(response, error, response);
				});
				return;
			}
			var request = this;
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
 * @param {Q.Cache|Boolean} [options.cache] pass false here to prevent caching, or an object which supports the Q.Cache interface
 * @return {Function}
 *  The wrapper function, which returns an object with a property called "result"
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
		
		var ret = { dontCache: false };
		gw.onCalled.handle.call(this, arguments2, ret);

		var cached, cbpos, cbi;
		Q.getter.usingCached = false;
		
		function _prepare(subject, params, callback, ret, cached) {
			if (gw.prepare) {
				gw.prepare.call(gw, subject, params, _result);
			} else {
				_result(subject, params);
			}
			function _result(subject, params) {
				gw.onResult.handle(subject, params, arguments2, ret, gw);
				Q.getter.usingCached = cached;
				callback.apply(subject, params);
				gw.onExecuted.handle(subject, params, arguments2, ret, gw);
				Q.getter.usingCached = false;
			}
		}

		// if caching is required, check the cache -- maybe the result is there
		if (gw.cache && !ignoreCache) {
			if (cached = gw.cache.get(key)) {
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
					// save the results in the cache
					if (gw.cache && !ret.dontCache) {
						gw.cache.set(key, cbpos, this, arguments);
					}
					// process waiting callbacks
					var wk = _waiting[key];
					if (wk) for (i = 0; i < wk.length; i++) {
						_prepare(this, arguments, wk[i].callbacks[cbpos], wk[i].ret, false);
					}
					delete _waiting[key]; 
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
				if (typeof newSize === 'undefined') {
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
		var key = Q.Cache.key(arguments);
		if (key && gw.cache) {
			return gw.cache.remove(key);
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
 * @param {number} milliseconds The number of milliseconds
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.throttle = function (original, milliseconds, defaultValue) {
	var _lastCalled;
	return function _Q_throttle_wrapper() {
		if (Date.now() - _lastCalled < milliseconds) return defaultValue;
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
 * after calls stopped coming in for a given number of milliseconds
 * @static
 * @method debounce
 * @param {Function} original The function to wrap
 * @param {number} milliseconds The number of milliseconds
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.debounce = function (original, milliseconds, defaultValue) {
	var _timeout = null;
	return function _Q_debounce_wrapper() {
		if (_timeout) {
			clearTimeout(_timeout);
		}
		var t = this, a = arguments;
		_timeout = setTimeout(function _Q_debounce_handler() {
			original.apply(t, a);
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
		this.element.id = prefix + Q.Tool.names[this.name].split('/').join('_')
			+ '-' + (Q.Tool.nextDefaultId++) + "_tool";
		Q.Tool.nextDefaultId %= 1000000;
	}
	this.prefix = Q.Tool.calculatePrefix(this.element.id);
	this.id = this.prefix.substr(0, this.prefix.length-1);
	
	if (Q.Tool.byId(this.id, this.name)) {
		var toolName = Q.Tool.names[this.name];
		throw new Q.Error("A " + toolName + " tool with id " + this.id + " is already active");
	}

	// for later use
	var classes = (this.element.className && this.element.className.split(/\s+/) || []);

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
			Q.extend(this.options, Q.Tool.options.levels, parsed, 'Q.Tool');
		}
	}

	// options cascade -- process option keys that start with '.' or '#'
	var partial, i, k, l;
	options = options || {};
	this.options = this.options || {};
	
	var normalizedName = Q.normalize(this.name);
	var pids = this.parentIds();
	var len = pids.length;
	var o = len ? Q.extend({}, Q.Tool.options.levels, options) : options;
	
	for (i = len-1; i >= 0; --i) {
		var pid = pids[i];
		if (Q.isEmpty(Q.getObject([pid, this.name, 'state'], Q.Tool.active))) {
			continue;
		}
		o = Q.extend(o, Q.Tool.options.levels, Q.Tool.active[pid][this.name].state);
	}
	
	// .Q_something
	for (i = 0, l = classes.length; i < l; i++) {
		var className = classes[i];
		var cn = Q.normalize(className.substr(0, className.length-5));
		partial = o['.' + className];
		if (partial && (className.substr(-5) !== '_tool' || cn === this.name)) {
			Q.extend(this.options, Q.Tool.options.levels, partial, 'Q.Tool');
		}
	}
	// #Q_parent_child_tool
	if ((partial = o['#' + this.element.id])) {
		Q.extend(this.options, Q.Tool.options.levels, partial, 'Q.Tool');
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
			Q.extend(this.options, Q.Tool.options.levels, partial, 'Q.Tool');
		}
	}

	// get options from options property on element
	var eo = element.options;
	if (eo && eo[normalizedName]) {
		Q.extend(this.options, Q.Tool.options.levels, eo[normalizedName], 'Q.Tool');
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
	element.Q.tool = this;
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
Q.Tool.latestName = null;
Q.Tool.latestNames = {};

var _constructToolHandlers = {};
var _activateToolHandlers = {};
var _initToolHandlers = {};
var _beforeRemoveToolHandlers = {};
var _waitingParentStack = [];
var _pendingParentStack = [];

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
 */
Q.Tool.remove = function _Q_Tool_remove(elem, removeCached) {
	if (typeof elem === 'string') {
		var tool = Q.Tool.byId(elem);
		if (!tool) return false;
		elem = tool.element;
	}
	Q.find(elem, true, null,
	function _Q_Tool_remove_found(toolElement) {
		var tn = toolElement.Q.toolNames;
		if (tn) {
			for (var i=tn.length-1; i>=0; --i) {
				toolElement.Q.tools[tn[i]].remove(removeCached);
			}
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
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-retain" attribute
 *  should be removed...
 */
Q.Tool.clear = function _Q_Tool_clear(elem, removeCached) {
	if (typeof elem === 'string') {
		var tool = Q.Tool.byId(elem);
		if (!tool) return false;
		elem = tool.element;
	}
	Q.find(elem.children || elem.childNodes, true, null,
	function _Q_Tool_remove_found(toolElement) {
		var tn = toolElement.Q.toolNames;
		if (!tn) { // this edge case happens very rarely, usually if a slot element
			return; // being replaced is inside another slot element being replaced
		}
		for (var i=tn.length-1; i>=0; --i) {
			toolElement.Q.tools[tn[i]].remove(removeCached);
		}
	});
};

/**
 * Call this function to define a tool
 * @static
 * @method define
 * @param {String|Object} name The name of the tool, e.g. "Q/foo". Also you can pass an object of name: filename here here.
 * @param {Function} ctor Your tool's constructor. You can also pass a filename here, in which case the other parameters are ignored.
 * @param {String|array} [require] Optionally name another tool (or array of tool names) that was supposed to already have been defined. This will cause your tool's constructor to make sure the required tool has been already loaded and activated on the same element.
 * @param {Object} defaultOptions An optional hash of default options for the tool
 * @param {Array} stateKeys An optional array of key names to copy from options to state
 * @param{Object} methods An optional hash of method functions to assign to the prototype
 */
Q.Tool.define = function (name, /* require, */ ctor, defaultOptions, stateKeys, methods) {
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
		Q.Tool.names[n] = name;
		if (typeof ctor === 'string') {
			if (typeof Q.Tool.constructors[n] !== 'function') {
				_qtdo[n] = _qtdo[n] || {};
				Q.Tool.constructors[n] = ctor;
			}
			continue;
		}
		ctor.toolName = n;
		if (typeof stateKeys === 'object') {
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
		Q.Tool.constructors[n] = ctor;
		Q.Tool.onLoadedConstructor(n).handle(n, ctor);
		Q.Tool.onLoadedConstructor("").handle(n, ctor);
		Q.Tool.latestName = n;
	}
	return ctor;
};

Q.Tool.beingActivated = undefined;

/**
 * Call this function to define options for a tool constructor
 * that may not have been loaded yet.
 * @static
 * @method define.options
 * @param {String} toolName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.define.options = function (toolName, setOptions) {
	var options;
	toolName = Q.normalize(toolName);
	if (typeof Q.Tool.constructors[toolName] === 'function') {
		options = Q.Tool.constructors[toolName].options;
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
Q.Tool.jQuery = function(name, ctor, defaultOptions, stateKeys, methods) {
	if (typeof name === 'object') {
		for (var n in name) {
			Q.Tool.jQuery(n, name[n]);
		}
		return;
	}
	var n = Q.normalize(name);
	Q.Tool.names[n] = name;
	if (typeof ctor === 'string') {
		if (root.jQuery
		&& typeof jQuery.fn.plugin[n] !== 'function') {
			_qtjo[n] = _qtjo[n] || {};
			jQuery.fn.plugin[n] = Q.Tool.constructors[n] = ctor;
		}
		return ctor;
	}
	ctor.toolName = n;
	if (typeof stateKeys === 'object') {
		methods = stateKeys;
		stateKeys = undefined;
	}
	Q.ensure(root.jQuery, Q.libraries.jQuery, _onJQuery);
	Q.Tool.latestName = n;
	function _onJQuery() {
		$ = root.jQuery;
		function jQueryPluginConstructor(options /* or methodName, argument1, argument2, ... */) {
			if (typeof options === 'string') {
				var method = options;
				if (jQueryPluginConstructor.methods[method]) {
					// invoke method on this with arguments
					return jQueryPluginConstructor.methods[method].apply(
						this, Array.prototype.slice.call(arguments, 1)
					);
				}
			} else {
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = Q.extend({}, 10, jQueryPluginConstructor.options, 10, options);
				$(this).each(function () {
					var key = n + ' state';
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
		ToolConstructor.prototype.$ = {};
		Q.each(methods, function (method) {
			ToolConstructor.prototype.$[method] = function _Q_Tool_jQuery_method() {
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(n, method);
				var $te = $(this.element);
				$te.plugin.apply($te, args);
			};
		});
	}
};

/**
 * Call this function to define options for a jQuery tool constructor
 * that may not have been loaded yet.
 * @static
 * @method jQuery.options
 * @param {String} toolName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.jQuery.options = function (pluginName, setOptions) {
	var options;
	var pluginName = Q.normalize(pluginName);
	if (typeof Q.Tool.constructors[name] === 'function') {
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
		this.Q.onStateChanged(name).handle.call(this, name);
	}
	this.Q.onStateChanged('').handle.call(this, names);
};

/**
 * When implementing tools, use this to implement rendering markup that can vary
 * as a function of the tool's state (with no additional side effects).
 * @method rendering
 * @param {Array|String} fields The names of fields to watch for, either as an array or comma-separated string. When stateChanged is called, if one of the fields named here really changed, the callback will be called.
 * @param {Function} callback The callback, which receives (changed, previous, timestamp). By default, Qbix defers the execution of your rendering handler until the next animation frame. If several calls to tool.stateChanged</span> occurred in the meantime, Qbix aggregates all the changes and reports them to the rendering handler. If a field in the state was changed several times in the meantime, those intermediate values aren't given to the rendering handler, since the assumption is that the view depends on the state without any side effects. However, if the field was changed, even if it later went back to its original value, it will show up in the list of changed fields.
 * @param {String} [key=""] Optional key used when attaching event handlers to tool.Q.onStateChanged events.
 * @param {boolean} [dontWaitForAnimationFrame=false] Pass true here if you really don't want to wait for the next animation frame to do rendering (for example, if you insist on reading the DOM and will use a library like FastDOM to manage DOM thrashing)
 */
Tp.rendering = function (fields, callback, key, dontWaitForAnimationFrame) {
	var tool = this;
	if (typeof fields === 'string') {
		fields = fields.split(',');
		for (var i=0,l=fields.length; i<l; ++i) {
			fields[i] = fields[i].trim();
		}
	}
	if (!fields.length) return false;
	var event;
	for (var i=0, l=fields.length; i<l; ++i) {
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
 * @param {number} [levels] Pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
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
	return null;
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
 * Returns a tool on the same element
 * @method sibling
 * @return {Q.Tool|null}
 */
Tp.sibling = function Q_Tool_prototype_sibling(name) {
	return this.element.Q(name);
};

/**
 * Called when a tool instance is removed, possibly
 * being replaced by another.
 * Typically happens after an AJAX call which returns
 * markup for the new instance tool.
 * Also can be used for removing a tool instance
 * and all of its children.
 * @method remove
 * @param {boolean} removeCached
 *  Defaults to false. Whether or not to remove the actual tool if its containing element
 *  has a "data-Q-retain" attribute.
 * @return {boolean} Returns whether the tool was removed.
 */
Tp.remove = function _Q_Tool_prototype_remove(removeCached) {

	var i;
	var shouldRemove = removeCached
		|| !this.element.getAttribute('data-Q-retain') !== null;
	if (!shouldRemove) return false;

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
	
	var nn = Q.normalize(this.name);
	delete this.element.Q.tools[nn];
	delete Q.Tool.active[this.id][nn];
	if (Q.isEmpty(Q.Tool.active[this.id])) {
		Q.removeElement(this.element);
		delete Q.Tool.active[this.id];
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
 * Returns all subelements with the given class name.
 * @method getElementsByClassName
 * @param {String} className
 *   the class name to look for
 * @return {NodeList}
 *   a list of nodes with the given class name.
 */
Tp.getElementsByClassName = function _Q_Tool_prototype_getElementsByClasName(className) {
	return this.element.getElementsByClassName(className);
};

/**
 * Do something for every and future child tool that is activated inside this element
 * @method forEachChild
 * @param {String} [name=""] Filter by name of the child tools, such as "Q/inplace"
 * @param {number} [levels] Optionally pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
 * @param {Function} callback The callback to execute at the right time
 */
Tp.forEachChild = function _Q_Tool_prototype_forEachChild(name, levels, callback) {
	if (typeof name !== 'string') {
		levels = name;
		callback = levels;
		name = null;
	}
	if (typeof levels !== 'number') {
		callback = levels;
		levels = null;
	}
	name = name && Q.normalize(name);
	var tool = this;
	var children = tool.children(name, levels);
	for (var id in children) {
		for (var n in children[id]) {
			Q.handle(callback, children[id][n]);
		}
	}
	var onActivate = Q.Tool.onActivate(name);
	var key = onActivate.set(function () {
		if (this.prefix.startsWith(tool.prefix)) {
			Q.handle(callback, this, arguments);
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
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} [toolOptions]
 *  The options for the tool
 * @param {String} [id]
 *  Optional id of the tool, such as "Q_tabs_2"
 * @param {String} [prefix]
 *  Optional prefix to prepend to the tool's id
 * @return {HTMLElement}
 *  Returns an element you can append to things
 */
Q.Tool.setUpElement = function _Q_Tool_setUpElement(element, toolName, toolOptions, id, prefix) {
	if (typeof toolOptions === 'string') {
		id = toolOptions;
		toolOptions = undefined;
	}
	if (typeof element === 'string') {
		element = document.createElement(element);
	}
	if (typeof toolName === 'string') toolName = [toolName];
	if (Q.isPlainObject(toolOptions)) toolOptions = [toolOptions];
	for (var i=0, l=toolName.length; i<l; ++i) {
		var tn = toolName[i];
		var ntt = tn.replace(/\//g, '_');
		element.addClass('Q_tool '+ntt+'_tool');
		if (!element.getAttribute('id')) {
			if (!id) {
				var p1, p2;
				p1 = prefix || (Q.Tool.beingActivated 
					? Q.Tool.beingActivated.prefix : '');
				do {
					p2 = p1 + ntt + '-' + (Q.Tool.nextDefaultId++) + '_';
					Q.Tool.nextDefaultId %= 1000000;
				} while (Q.Tool.active[p2]);
				id = p2 + 'tool';
			}
			element.setAttribute('id', id);
		}
		if (toolOptions && toolOptions[i]) {
			element.options = element.options || {};
			element.options[Q.normalize(tn)] = toolOptions[i];
		}
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
 * @param {String} id
 *  Optional id of the tool, such as "Q_tabs_2"
 * @param {String} [prefix]
 *  Optional prefix to prepend to the tool's id
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Q.Tool.setUpElementHTML = function _Q_Tool_setUpElementHTML(element, toolName, toolOptions, id, prefix) {
	var e = Q.Tool.setUpElement(element, toolName, null, id, prefix);
	var ntt = toolName.replace(/\//g, '_');
	if (toolOptions) {
		e.setAttribute('data-'+ntt.replace(/_/g, '-'), JSON.stringify(toolOptions));
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
 * For example: $('container').append(Q.Tool.make('Streams/chat')).activate(options);
 * @method setUpElementHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Tp.setUpElementHTML = function (element, toolName, toolOptions, id) {
	return Q.Tool.setUpElementHTML(element, toolName, toolOptions, id, this.prefix);
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
	return toolElement.Q ? toolElement.Q(toolName) : null;
};

/**
 * Reference a tool by its id
 * @static
 * @method byId
 * @param {String} id
 * @param {String} name optional name of the tool, useful if more than one tool was activated on the same element
 * @return {Q.Tool|null|undefined}
 */
Q.Tool.byId = function _Q_Tool_byId(id, name) {
	if (name) {
		return Q.Tool.active[id] ? Q.Tool.active[id][name] : null;
	}
	var tool = Q.Tool.active[id] ? Q.first(Q.Tool.active[id]) : null;
	if (!tool) {
		return null;
	}
	var q = tool.element.Q;
	return tool.element.Q(q.toolNames[q.toolNames.length-1]);
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
 * Computes and returns a tool's id
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
 * @param {Mixed} shared pass this only when constructing a tool
 * @param {Q.Pipe} you can pass a parent pipe which will be filled later
 * @return {boolean} whether the script needed to be loaded
 */
function _loadToolScript(toolElement, callback, shared, parentPipe) {
	var id = toolElement.id;
	var classNames = toolElement.className.split(' ');
	var toolNames = [];
	var normalizedId = Q.normalize(Q.Tool.calculateId(id));
	if (parentPipe) {
		if (!parentPipe.waitForIdNames) {
			parentPipe.waitForIdNames = [];
		}
	}
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
		function _loadToolScript_loaded() {
			// in this function, toolFunc starts as a string
			if (Q.Tool.latestName) {
				_qtc[toolName] = _qtc[Q.Tool.latestName];
				Q.Tool.latestNames[toolFunc] = Q.Tool.latestName;
			}
			toolFunc = _qtc[toolName];
			if (typeof toolFunc !== 'function') {
				Q.Tool.onMissingConstructor.handle(_qtc, toolName);
				toolFunc = _qtc[toolName];
				if (typeof toolFunc !== 'function') {
					toolFunc = function () { console.log("Missing tool constructor for " + toolName); }; 
				}
			}
			p.fill(toolName)(toolElement, toolFunc, toolName, uniqueToolId);
		}
		var toolFunc = _qtc[toolName];
		if (typeof toolFunc === 'undefined') {
			Q.Tool.onMissingConstructor.handle(_qtc, toolName);
			toolFunc = _qtc[toolName];
			if (typeof toolFunc !== 'function' && typeof toolFunc !== 'string') {
				toolFunc = function () {
					console.log("Missing tool constructor for " + toolName);
				}; 
			}
		}
		if (parentPipe) {
			var normalizedName = Q.normalize(toolName);
			parentPipe.waitForIdNames.push(normalizedId+"\t"+normalizedName);
		}
		if (shared) {
			var uniqueToolId = "tool " + (shared.waitingForTools.length+1)
				+ ": " + normalizedId;
			if (!shared.firstToolId) {
				shared.firstToolId = uniqueToolId;
			}
			shared.waitingForTools.push(uniqueToolId);
		}
		if (typeof toolFunc === 'function') {
			return p.fill(toolName)(toolElement, toolFunc, toolName, uniqueToolId);
		}
		if (toolFunc === undefined) {
			return;
		}
		if (typeof toolFunc !== 'string') {
			throw new Q.Error("Q.Tool.loadScript: toolFunc cannot be " + typeof(toolFunc));
		}
		if (Q.Tool.latestNames[toolFunc]) {
			Q.Tool.latestName = Q.Tool.latestNames[toolFunc];
			_loadToolScript_loaded();
		} else {
			Q.Tool.latestName = null;
			Q.addScript(toolFunc, _loadToolScript_loaded);
		}
	});
}

Q.Tool.onLoadedConstructor = Q.Event.factory({}, ["", function (name) { 
	return [Q.normalize(name)];
}]);
Q.Tool.onMissingConstructor = new Q.Event();


/**
 * A Q.Session object represents a session, and implements things like an "expiring" dialog
 * @class Q.Session
 * @constructor
 */

Q.Session = function _Q_Session() {
	// TODO: Set a timer for when session expires?
	return {};
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
 * A Q.Cache object stores items in a cache and throws out least-recently-used ones.
 * @class Q.Cache
 * @constructor
 * @param {Object} options you can pass the following options:
 * @param {boolean} [options.localStorage] use local storage instead of page storage
 * @param {boolean} [options.sessionStorage] use session storage instead of page storage
 * @param {String} [options.name] the name of the cache, not really used for now
 * @param {Integer} [options.max=100] the maximum number of items the cache should hold. Defaults to 100.
 * @param {Q.Cache} [options.after] pass an existing cache with max > this cache's max, to look in first
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
function Q_Cache_get(cache, key, special) {
	if (cache.documentStorage) {
		return (special === true) ? cache.special[key] : cache.data[key];
	} else {
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		var item = storage.getItem(cache.name + (special===true ? "\t" : "\t\t") + key);
		return item ? JSON.parse(item) : undefined;
	}
}
function Q_Cache_set(cache, key, obj, special) {
	if (cache.documentStorage) {
		if (special === true) {
			cache.special[key] = obj;
		} else {
			cache.data[key] = obj;
		}
	} else {
		var serialized = JSON.stringify(obj);
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		storage.setItem(cache.name + (special===true ? "\t" : "\t\t") + key, serialized);
	}
}
function Q_Cache_remove(cache, key, special) {
	if (cache.documentStorage) {
		if (special === true) {
			delete cache.special[key];
		} else {
			delete cache.data[key];
		}
	} else {
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		storage.removeItem(cache.name + (special === true ? "\t" : "\t\t") + key);
	}
}
function Q_Cache_pluck(cache, existing) {
	var value;
	if (existing.prev) {
		value = Q_Cache_get(cache, existing.prev);
		if (!value) {
			debugger; // pause here if debugging
		}
		value.next = existing.next;
		Q_Cache_set(cache, existing.prev, value);
	} else {
		cache.earliest(existing.next);
	}
	if (existing.next) {
		value = Q_Cache_get(cache, existing.next);
		value.prev = existing.prev;
		Q_Cache_set(cache, existing.next, value);
	} else {
		cache.latest(existing.prev);
	}
}
/**
 * Generates the key under which things will be stored in a cache
 * @static
 * @method key
 * @param  {Array} args the arguments from which to generate the key
 * @param {Array} functions  optional array to which all the functions found in the arguments will be pushed
 * @return {String}
 */
Q.Cache.key = function _Cache_key(args, functions) {
	var i, keys = [];
	for (i=0; i<args.length; ++i) {
		if (typeof args[i] !== 'function') {
			keys.push(args[i]);
		} else if (functions && functions.push) {
			functions.push(args[i]);
		}
	}
	return JSON.stringify(keys);
};

var Cp = Q.Cache.prototype;

/**
 * Accesses the cache and sets an entry in it
 * @method set
 * @param {String} key  the key to save the entry under, or an array of arguments
 * @param {number} cbpos the position of the callback
 * @param {Object} subject The "this" object for the callback
 * @param {Array} params The parameters for the callback
 * @param {Object} options  supports the following options:
 * @param {boolean} [options.dontTouch=false] if true, then doesn't mark item as most recently used
 * @return {boolean} whether there was an existing entry under that key
 */
Cp.set = function _Q_Cache_prototype_set(key, cbpos, subject, params, options) {
	var existing, previous, count;
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
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
		params: (params instanceof Array) ? params : Array.prototype.slice.call(params),
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
		this.remove(this.earliest());
	}

	return existing ? true : false;
};
/**
 * Accesses the cache and gets an entry from it
 * @method get
 * @param {String} key  the key to search for
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
 * @param {String} key  the key of the entry to remove
 * @return {boolean} whether there was an existing entry under that key
 */
Cp.remove = function _Q_Cache_prototype_remove(key) {
	var existing, count;
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
	}
	existing = this.get(key, true);
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

	return true;
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
		}
	}
	this.earliest(null);
	this.latest(null);
	this.count(0);
};
/**
 * Cycles through all the entries in the cache
 * @method each
 * @param {Array} args  An array consisting of some or all the arguments that form the key
 * @param {Function} callback  Is passed two parameters: key, value, with this = the cache
 */
Cp.each = function _Q_Cache_prototype_each(args, callback) {
	var prefix = null;
	if (typeof args === 'function') {
		callback = args;
		args = undefined;
	} else {
		var json = Q.Cache.key(args);
		prefix = json.substring(0, json.length-1);
	}
	if (!callback) {
		return;
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
Cp.removeEach = function _Q_Cache_prototype_each(args) {
	this.each(args, function (key) {
		this.remove(key);
	});
	return this;
};
Q.Cache.document = function _Q_Cache_document(name, max) {
	if (!Q.Cache.document.caches[name]) {
		var cache = Q.Cache.document.caches[name] = new Q.Cache({
			max: max
		});
		cache.name = name;
	}
	return Q.Cache.document.caches[name];
};
Q.Cache.local = function _Q_Cache_local(name, max) {
	if (!Q.Cache.local.caches[name]) {
		var cache = Q.Cache.local.caches[name] = new Q.Cache({
			localStorage: true,
			max: max
		});
		cache.name = name;
	}
	return Q.Cache.local.caches[name];
};
Q.Cache.session = function _Q_Cache_session(name, max) {
	if (!Q.Cache.session.caches[name]) {
		var cache = Q.Cache.session.caches[name] = new Q.Cache({
			sessionStorage: true,
			max: max
		});
		cache.name = name;
	}
	return Q.Cache.session.caches[name];
};
Q.Cache.document.caches = {};
Q.Cache.local.caches = {};
Q.Cache.session.caches = {};

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
 */
Q.Page.push = function (url) {
	url = Q.url(url);
	if (url.substr(0, Q.info.baseUrl.length) !== Q.info.baseUrl) {
		return;
	}
	var parts = url.split('#');
	var path = (url.substr(Q.info.baseUrl.length+1) || '');
	if (history.pushState) {
		history.pushState({}, null, url);
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
	Q_hashChangeHandler.currentUrl = url.substr(Q.info.baseUrl.length + 1);
	Q.info.url = url;
};

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
 * @param {String} page "$Module/$action" or a more specific URI string, or "" to handle all pages
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
	Q.info.imgLoading = Q.info.imgLoading ||
		Q.url('plugins/Q/img/throbbers/loading.gif');
	Q.loadUrl.options.slotNames = Q.info.slotNames;
	_detectOrientation();
	Q.handle(Q.beforeInit);
	Q.handle(Q.onInit); // Call all the onInit handlers
	Q.addEventListener(root, 'unload', Q.onUnload.handle);
	Q.addEventListener(root, 'online', Q.onOnline.handle);
	Q.addEventListener(root, 'offline', Q.onOffline.handle);
	Q.addEventListener(root, Q.Pointer.focusout, _onPointerBlurHandler);
	var checks = ["ready"];
	if (Q.info.isCordova
	&& root.cordova && Q.typeOf(cordova).substr(0, 4) !== 'HTML') {
		checks.push("device");
	}
	var p = Q.pipe(checks, 1, function _Q_init_pipe_callback() {
		if (!Q.info) Q.info = {};
		Q.info.isCordova = !!root.device && device.cordova;
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

		function _getJSON() {
			Q.ensure(root.JSON, Q.libraries.json, _ready);
		}

		if (options && options.isLocalFile) {
			Q.loadUrl(Q.info.baseUrl, {
				ignoreHistory: true,
				skipNonce: true,
				onActivate: _getJSON,
				handler: function () {},
				slotNames: ["cordova"]
			});
		} else {
			_getJSON();
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
			if ((Q.info.isCordova = !!root.device && device.cordova)) {
				// avoid opening external urls in app window
				Q.addEventListener(document, "click", function (e) {
					var t = e.target, s;
					do {
						if (t && t.nodeName === "A" && t.href && !t.outerHTML.match(/\Whref=[',"]#[',"]\W/) && t.href.match(/^https?:\/\//)) {
							e.preventDefault();
							s = (t.target === "_blank") ? "_system" : "_blank";
							root.open(t.href, s, "location=no");
						}
					} while ((t = t.parentNode));
				});
			}
			p.fill("device")();
		}
		if (root.device) {
			_Q_init_deviceready_handler();
		} else {
			Q.addEventListener(document, 'deviceready', _Q_init_deviceready_handler, false);
		}
	}

	// Bind document ready event
	if (root.jQuery) {
		Q.jQueryPluginPlugin();
		Q.onJQuery.handle(jQuery, [jQuery]);
		jQuery(document).ready(_domReady);
	} else {
		var _timer = setInterval(function(){
			if(/loaded|complete/.test(document.readyState)) {
				clearInterval(_timer);
				_domReady();
			}
		}, 10);
	}
	
	_waitForDeviceReady();
};

/**
 * This is called when the DOM is ready
 * @static
 * @method ready
 */
Q.ready = function _Q_ready() {
	function readyWithNonce() {

		_isReady = true;

		if (Q.info.isLocalFile) {
			// This is an HTML file loaded from the local filesystem
			var url = location.hash.queryField('url');
			if (url === undefined) {
				Q.handle(Q.info.baseUrl);
			} else {
				Q.handle(url.indexOf(Q.info.baseUrl) == -1 ? Q.info.baseUrl+'/'+url : url);
			}
			return;
		}

		// Try to add the plugin thing again
		Q.jQueryPluginPlugin();
		
		Q.onDOM.handle.call(root, root.jQuery);

		var body = document.getElementsByTagName('body')[0];
		Q.activate(body, undefined, function _onReadyActivate() {
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

			if (Q.info.isCordova && navigator.splashscreen) {
				navigator.splashscreen.hide();
			}

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
		
	}
	Q.loadNonce(readyWithNonce);
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
	// Q.nonce = Q.cookie('Q_nonce');
	if (Q.nonce) {
		Q.handle(callback, context, args);
		return;
	}
	Q.req('Q/nonce', 'data', function _Q_loadNonce_nonceLoaded(err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			throw new Q.Error(msg);
		}
		Q.nonce = Q.cookie('Q_nonce');
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
	}, {"method": "post", "skipNonce": true});
};

/**
 * This function is called by Q to make sure that we've loaded the Handlebars library
 * If you like, you can also call it yourself.
 * @static
 * @method loadHandlebars
 * @param {Function} callback This function is called when the library is loaded
 */
Q.loadHandlebars = function _Q_loadHandlebars(callback) {
	Q.ensure(root.Handlebars, Q.url(Q.libraries.handlebars), function () {
		_addHandlebarsHelpers();
		callback();
	});
};

/**
 * Call this function to set a notice that is shown when the page is almost about to be unloaded
 * @static
 * @method beforeUnload
 * @param notice {String} The notice to set. It should typically be worded so that "Cancel" cancels the unloading.
 * @required
 */
Q.beforeUnload = function _Q_beforeUnload(notice) {
	window.onbeforeunload = function(e){
		if (!notice) return undefined;
		e = e || window.event;
		if (e) { // For IE and Firefox (prior to 4)
			e.returnValue = notice;
		}
		return notice; // For Safari and Chrome
	};
};

/**
 * Remove an element from the DOM and try to clean up memory as much as possible
 * @static
 * @method removeElement
 * @param {HTMLElement} element
 * @param {boolean} removeTools
 */
Q.removeElement = function _Q_removeElement(element, removeTools) {
	if (removeTools) {
		Q.Tool.clear(element);
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
	for (var i=0, l=_layoutElements.length; i<l; ++i) {
		if (_layoutElements[i] === element) {
			_layoutElements.splice(i, 1);
			_layoutEvents.splice(i, 1);
		}
	}
};

/**
 * Add an event listener to an element
 * @static
 * @method addEventListener
 * @param {HTMLElement} element
 *  An HTML element, window or other element that supports listening to events
 * @param {String|Array|Object} eventName
 *  A space-delimited string of event names, or an array of event names.
 *  You can also pass an object of { eventName: eventHandler } pairs, in which csae
 *  the next parameter would be useCapture.
 * @param {Function} eventHandler
 *  A function to call when the event fires
 * @param {boolean} useCapture
 *  Whether to use the capture instead of bubble phase. Ignored in IE8 and below.
 * @param {boolean} hookStopPropagation
 *  Whether to override Event.prototype.stopPropagation in order to capture the event when a descendant of the element tries to prevent
 */
Q.addEventListener = function _Q_addEventListener(element, eventName, eventHandler, useCapture, hookStopPropagation) {
	useCapture = useCapture || false;
	if (Q.isPlainObject(eventName)) {
		for (var k in eventName) {
			Q.addEventListener(element, k, eventName[k], eventHandler);
		}
		return;
	}
	var handler = (eventHandler.typename === "Q.Event"
		? eventHandler.eventListener = function _Q_addEventListener_wrapper(e) { Q.handle(eventHandler, element, [e]); }
		: eventHandler);
	if (typeof eventName === 'string') {
		var split = eventName.split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (typeof eventName === 'function') {
		var params = {
			original: eventHandler
		};
		eventHandler = eventName ( params );
		if (!('eventName' in params)) {
			throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
		}
		eventName = params.eventName;
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
		element["on"+eventName] = function () {
			if (element["on"+eventName]) {
				element["on"+eventName].apply(this, arguments);
			}
			eventHandler.apply(this, arguments);
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
 */
Q.removeEventListener = function _Q_removeEventListener(element, eventName, eventHandler, useCapture) {
	useCapture = useCapture || false;
	var handler = (eventHandler.typename === "Q.Event"
		? eventHandler.eventListener
		: eventHandler);
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
 */
Q.layout = function _Q_layout(elementOrEvent) {
	var element = Q.instanceOf(elementOrEvent, Element) ? elementOrEvent : null;
	Q.each(_layoutElements, function (i, e) {
		if (element && !element.contains(e)) {
			return;
		}
		var event = _layoutEvents[i];;
		event.handle.call(event, e, elementOrEvent);
	});
	Q.trigger('Q.layout', elementOrEvent);
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
 * Returns whether the client is currently connected to the 'net
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
	Q.each(plugins, function (i, plugin) {
		if (plugin && !Q.plugins[plugin]) {
			urls.push(Q.info.baseUrl+'/plugins/'+plugin+'/js/'+plugin+'.js');
		}
	});
	return Q.addScript(urls, callback, options);	
};

/**
 * Obtain a URL
 * @static
 * @method url
 * @param {Object|String|null} what
 *  Usually the stuff that comes after the base URL.
 *  If you don't provide this, then it just returns the Q.info.baseUrl
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  Fields containing null and undefined are skipped.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} options
 *  A hash of options, including:
 *  'baseUrl': A string to replace the default base url
 *  'cacheBust': Number of milliseconds before a new cachebuster is appended
 */
Q.url = function _Q_url(what, fields, options) {
	var what2 = what || '';
	if (fields) {
		for (var k in fields) {
			if (fields[k] == null) continue;
			what2 += '?'+encodeURIComponent(k)+'='+encodeURIComponent(fields[k]);
		}
	}
	if (options && options.cacheBust) {
		what2 += "?Q.cacheBust="+Math.floor(Date.now()/options.cacheBust);
	}
	var parts = what2.split('?');
	if (parts.length > 2) {
		what2 = parts.slice(0, 2).join('?') + '&' + parts.slice(2).join('&');
	}
	var result = '';
	var baseUrl = (options && options.baseUrl) || Q.info.proxyBaseUrl || Q.info.baseUrl;
	if (!what) {
		result = baseUrl + (what === '' ? '/' : '');
	} else if (what2.isUrl()) {
		result = what2;
	} else {
		result = baseUrl + ((what2.substr(0, 1) == '/') ? '' : '/') + what2;
	}
	if (Q.url.options.beforeResult) {
		var params = {
			what: what2,
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
 * Get the URL for an action
 * @static
 * @method action
 * @param {String} uri
 *  A string of the form "Module/action" or an absolute url, which is returned unmodified.
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} options
 *  A hash of options, including:
 *  'baseUrl': A string to replace the default base url
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
 *  * @param {boolean} [options.iframe] if true, tells the server to render the response as HTML in an iframe, which should call the specified callback
 *  * @param {boolean} [options.loadExtras] if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
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
	if (typeof what == 'string') {
		var what2 = what;
		if (Q.info && Q.info.baseUrl === what2) {
			what2 += '/'; // otherwise we will have 301 redirect with trailing slash on most servers
		}
		what2 += (what.indexOf('?') < 0) ? '?' : '&';
		var ajax = options.iframe ? 'iframe'
			: (options.loadExtras ? 'loadExtras' : 'json');
		what2 += encodeURI('Q.ajax='+ajax);
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
	} else {
		// assume it's an object
		var what2 = {};
		for (var k in what) {
			what2[k] =  what[k];
		}
		what2.Q = { "ajax": "json" };
		if (options.timestamp) {
			what2.Q.timestamp = timestamp;
		}
		if (slotNames) {
			what2.slotNames = slotNames2;
		}
		if (options) {
			if (options.callback) {
				what2.Q.callback = options.callback;
			}
			if ('echo' in options) {
				what2.Q.echo = options.echo;
			}
			if (options.method) {
				what2.Q.method = options.method;
			}
		}
		if ('nonce' in Q) {
			what2.Q.nonce = Q.nonce;
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
 *  A hash of options, to be passed to Q.request
 */
Q.req = function _Q_req(uri, slotNames, callback, options) {
	if (typeof options === 'string') {
		options = {'method': options};
	}
	var args = arguments, index = (typeof arguments[0] === 'string') ? 0 : 1;
	args[index] = Q.action(args[index]);
	Q.request.apply(this, args);
};

/**
 * A way to make requests that is cross-domain. Typically used for requesting JSON or various templates.
 * It uses script tags and JSONP callbacks for remote domains, and prefers XHR for the local domain.
 * @static
 * @method request
 * @param {Object} fields
 *  Optional object of fields to pass
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
 *  A hash of options, including:
 * @param {boolean} [options.post] if set, adds a &Q.method=post to the querystring
 * @param {String} [options.method] if set, adds a &Q.method= that value to the querystring, default "get"
 * @param {Object} [options.fields] optional fields to pass with any method other than "get"
 * @param {HTMLElement} [options.form] if specified, then the request is made by submitting this form, temporarily extending it with any fields passed in options.fields, and possibly overriding its method with whatever is passed to options.method .
 * @param {String} [options.resultFunction=null] The path to the function to handle inside the
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
 * @param {boolean} [options.query=false] if true simply returns the query url without issuing the request
 * @param {String} [options.callbackName] if set, the URL is not extended with Q fields and the value is used to name the callback field in the request.
 * @param {boolean} [options.duplicate=true] you can set it to false in order not to fetch the same url again
 * @param {boolean} [options.quiet=true] this option is just passed to your onLoadStart/onLoadEnd handlers in case they want to respect it.
 * @param {boolean} [options.timestamp] whether to include a timestamp (e.g. as a cache-breaker)
 * @param {Function} [options.handleRedirects=Q.handle] if set and response data.redirect.url is not empty, automatically call this function.
 * @param {boolean} [options.timeout=1500] milliseconds to wait for response, before showing cancel button and triggering onTimeout event, if any, passed to the options
 * @param {Q.Event} [options.onTimeout] handler to call when timeout is reached. First argument is a function which can be called to cancel loading.
 * @param {Q.Event} [options.onResponse] handler to call when the response comes back but before it is processed
 * @param {Q.Event} [options.onProcessed] handler to call when a response was processed
 * @param {Q.Event} [options.onLoadStart] if "quiet" option is false, anything here will be called after the request is initiated
 * @param {Q.Event} [options.onLoadEnd] if "quiet" option is false, anything here will be called after the request is fully completed
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
	if (typeof slotNames === 'function') {
		options = callback;
		callback = slotNames;
		slotNames = [];
	} else if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	var o = Q.extend({}, Q.request.options, options);
	if (o.skipNonce) {
		return _Q_request_makeRequest.call(this, url, slotNames, callback, o);
	} else {
		Q.loadNonce(_Q_request_makeRequest, this, [url, slotNames, callback, o]);
	}
	function _Q_request_makeRequest (url, slotNames, callback, o) {

		var request = new Q.Request(url, slotNames, callback, o);

		var tout = false, t = {};
		if (o.timeout !== false) {
			tout = o.timeout || 1500;
		}
	
		function _Q_request_callback(err, content, wasJsonP) {
			if (err) {
				callback(err);
				Q.handle(o.onProcessed, this, [err]);
				return;
			}
			var data = content;
			if (o.parse !== false) {
				try {
					if (wasJsonP) {
						data = content;
					} else {
						data = JSON.parse(content)
					}
				} catch (e) {
					console.warn('Q.request(' + url + ',['+slotNames+']):' + e);
					err = {"errors": [e]};
					callback(e, content);
					Q.handle(o.onProcessed, this, [e, content]);
				}
			}
			var redirected = false;
			if (data && data.redirect && data.redirect.url) {
				Q.handle(o.handleRedirects, Q, [data.redirect.url]);
				redirected = true;
			}
			callback && callback.call(this, err, data, redirected);
			Q.handle(o.onProcessed, this, [err, data, redirected]);
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

		function _onResponse (data, wasJsonP) {
			t.loaded = true;
			if (t.timeout) {
				clearTimeout(t.timeout);
			}
			Q.handle(o.onLoadEnd, request, [url, slotNames, o]);
			if (!t.cancelled) {
				o.onResponse.handle.call(request, data, wasJsonP);
				_Q_request_callback.call(request, null, data, wasJsonP);
			}
		}
		
		function _onCancel (status, msg) {
			status = Q.isInteger(status) ? status : null;
			var defaultError = status ? Q.text.Q.request.error : Q.text.Q.request.canceled;
			msg = (msg || Q.text.Q.request[status] || defaultError)
				.interpolate({'status': status, 'url': url})
			t.cancelled = true;
			_onResponse();
			var errors = {
				errors: [{message: msg || "Request was canceled", code: status}]
			};
			o.onCancel.handle.call(this, errors, o);
			_Q_request_callback.call(this, errors, errors);
		}
		
		function xhr(onSuccess, onCancel) {
			if (o.extend !== false) {
				url = Q.ajaxExtend(url, slotNames, overrides);
			}			
			var xmlhttp;
			if (root.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp = new XMLHttpRequest();
			} else { // code for IE6, IE5
				xmlhttp = new root.ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4) {
					if (xmlhttp.status == 200) {
						onSuccess.call(xmlhttp, xmlhttp.responseText);
					} else {
						console.log("Q.request xhr: " + xmlhttp.status + ' ' + xmlhttp.responseText.substr(1000));
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
			var content = Q.queryString(o.fields);
			request.xmlhttp = xmlhttp;
			if (verb === 'GET') {
				xmlhttp.open('GET', url + (content ? '&' + content : ''), !sync);
				xmlhttp.send();
			} else {
				xmlhttp.open(verb, url, !sync);
				xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				//xmlhttp.setRequestHeader("Content-length", content.length);
				//xmlhttp.setRequestHeader("Connection", "close");
				xmlhttp.send(content);
			}
		}
		
		var method = o.method || 'GET';
		var verb = method.toUpperCase();
		var overrides = {
			loadExtras: !!o.loadExtras
		};
		if (verb !== 'GET') {
			verb = 'POST'; // browsers don't always support other HTTP verbs;
			overrides.method = o.method;
		}

		if (o.form) {
			var method = options.method || 'GET';
			if (o.extend !== false) {
				overrides.iframe = true;
				url = Q.ajaxExtend(url, slotNames, overrides);
			}
			Q.formPost(url, o.fields, method, {
				form: o.form,
				onLoad: function (iframe) {
					var resultFunction = o.resultFunction
						? Q.getObject(o.resultFunction, iframe.contentWindow)
						: null;
					var result = resultFunction ? resultFunction() : undefined;
					_Q_request_callback.call(request, null, result, true);
				}
			});
			return;
		}

		if (!o.query && o.xhr !== false
		&& Q.url(url).search(Q.info.baseUrl) === 0) {
			_onStart();
			return xhr(_onResponse, _onCancel);
		}

		var i = Q.request.callbacks.length;
		var url2 = url;
		if (callback) {
			Q.request.callbacks[i] = function _Q_request_JSONP(data) {
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
		if (o.query) {
			return url2;
		} else {
			_onStart();
			var script = Q.addScript(url2, null, {'duplicate': o.duplicate});
		}
	}
};


Q.request.callbacks = []; // used by Q.request

/**
 * Try to find an error message assuming typical error data structures for the arguments
 * @static
 * @method firstErrorMessage
 * @param {Object} data An object where the errors may be found. You can pass as many of these as you want. If it contains "errors" property, then errors[0] is the first error. If it contains an "error" property, than that's the first error. Otherwise, for the first argument only, if it is nonempty, then it's considered an error.
 * @return {String|null} The first error message found, or null
 */
Q.firstErrorMessage = function _Q_firstErrorMessage(data /*, data2, ... */) {
	var error = null;
	for (var i=0; i<arguments.length; ++i) {
		var d = arguments[i];
		if (Q.isEmpty(d)) {
			continue;
		}
		if (d.errors && d.errors[0]) {
			error = d.errors[0];
		} else if (d.error) {
			error = d.error;
		} else if (Q.isArrayLike(d)) {
			error = d[0];
		} else if (!i) {
			error = d;
		}
		if (error) {
			break;
		}
	}
	if (!error) {
		return null;
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
 * @return {Object}
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
 * @param {Array} keys
 *  An optional array of keys into the object, in the order to serialize things
 * @param {boolean} returnAsObject
 *  Pass true here to get an object of {fieldname: value} instead of a string
 * @return {String}
 *  A querystring that can be used with HTTP requests
 */
Q.queryString = function _Q_queryString(fields, keys, returnAsObject) {
	if (Q.isEmpty(fields)) {
		return '';
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
				? this.options[this.selectedIndex].text
				: this.value;
			result += (result ? '&' : '') + this.getAttribute('name')
				+ '=' + encodeURIComponent(value);
		});
		return result;
	}
	var parts = [];
	function _params(prefix, obj) {
		if (Q.typeOf(obj) === "array") {
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
			for (var name in obj) {
				_params(prefix + "[" + name + "]", obj[name], _add);
			}
		} else {
			// Serialize scalar item.
			_add(prefix, obj);
		}
	}
	
	var result = {};
	
	function _add(key, value) {
		if (value == undefined) return;
		// If value is a function, invoke it and return its value
		value = Q.typeOf(value) === "function" ? value() : value;
		if (returnAsObject) {
			result[key] = value;
		} else {
			parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
		}
	}

	if (keys) {
		Q.each(keys, function _Q_param_each(i, field) {
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
 * Uses a form to do a real POST, but doesn't have a callback
 * Useful for convincing Safari to stop blocking third-party cookies
 * Technically we could use AJAX and CORS instead, and then we could have a callback.
 * @static
 * @method formPost
 * @param {String|HTMLElement} action The form action. You can also pass an
 *  HTML form element here, and skip fields and method.
 * @param {Object} [fields]  The parameters of the form
 * @param {String} [method] The method with which to submit the form
 * @param {Object|Boolean} options 
 *  You can pass true here to just submit the form and load the results in a new page in this window.
 *  Or provide an optional object which can contain the following:
 * @param {String} [options.target] the name of a window or iframe to use as the target.
 * @param {HTMLElement} [options.iframe] the iframe to use. If not provided, this is filled to point to a newly created iframe object.
 * @param {Q.Event} [options.onLoad] callback to call when results are loaded in the iframe. Ignored if options.target is specified.
 * @param {HTMLElement} [options.form] the form to use. In this case, the action, fields and method are ignored.
 */
Q.formPost = function _Q_formPost(action, fields, method, options) {
	if (typeof options === 'function') {
		options = {onLoad: options};
	} else if (options === true) {
		options = {straight: true};
	} else {
		options = options || {};
	}
	var o = Q.copy(options);
	if (action && typeof action.action === 'string') {
		o.form = action;
		action = action.action;
		method = form.method;
	} else {
		method = method || "post"; // Set method to post by default, if not specified.
	}
	var onload;
	if (o.onLoad) {
		onload = (o.onLoad.typename === 'Q.Event')
			? o.onLoad.handle
			: o.onLoad;
	}
	var name = o.target, iframeProvided = o.iframe, iframe;
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
	for(var key in fields2) {
		if(fields2.hasOwnProperty(key)) {
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
	if (!o.form) {
		Q.removeElement(form);
	} else {
		for (var i=hiddenFields.length-1; i>=0; --i) {
			Q.removeElement(hiddenFields[i]);
		}
		form.action = oldAction;
		form.method = oldMethod;
	}
};
Q.formPost.counter = 0;

/**
 * Adds a reference to a javascript, if it's not already there
 * @static
 * @method addScript
 * @param {String|Array} src
 * @param {Function} onload
 * @param {Object} options
 *  Optional. A hash of options, including:
 * @param {Boolean} [options.duplicate] if true, adds script even if one with that src was already loaded
 * @param {Boolean} [options.onError] optional function that may be called in newer browsers if the script fails to load. Its this object is the script tag.
 * @param {Boolean} [options.ignoreLoadingErrors] If true, ignores any errors in loading scripts.
 * @param {Boolean} [options.container] An element to which the stylesheet should be appended (unless it already exists in the document)
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
		if (('readyState' in this) && (this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;	
		}
		if (s) {
			script = s;
			src = u;
		} else if (onload2.executed) {
			return;
		}
		Q.addScript.loaded[src] = true;
		while ((cb = Q.addScript.onLoadCallbacks[src].shift())) {
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
	
	var p, ret = [];
	if (!onload) {
		onload = function () {};
	}
	
	if (Q.isArrayLike(src)) {
		var srcs = [];
		Q.each(src, function (i, src) {
			if (!src) return;
			srcs.push((src && src.src) ? src.src : src);
		});
		if (Q.isEmpty(srcs)) {
			onload();
			return [];
		}
		p = new Q.Pipe(srcs, onload);
		Q.each(srcs, function (i, src) {
			ret.push(Q.addScript(src, p.fill(src), options));
		});
		return ret;
	}

	var o = Q.extend({}, Q.addScript.options, options),
		firstScript = document.scripts ? document.scripts[0] : document.getElementsByTagName('script')[0],
		container = o.container || document.head  || document.getElementsByTagName('head')[0];
		
	if (!onload) {
		onload = function() { };
	}
	
	var script, i;
	_onload.loaded = {};
	src = (src && src.src) ? src.src : src;
	if (!src) {
		return null;
	}
	src = Q.url(src);
	
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
		for (i=0; i<scripts.length; ++i) {
			script = scripts[i];
			if (script.getAttribute('src') !== src) {
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
			if (Q.addScript.loaded[src]) {
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
			if (!scripts[i].wasProcessedByQ) {
				scripts[i].onload = onload2;
				scripts[i].onreadystatechange = onload2; // for IE
				Q.addEventListener(script, 'error', onerror2);
				scripts[i].wasProcessedByQ = true;
			}
			return o.returnAll ? script : false; // don't add this script to the DOM
		}
	}

	// Create the script tag and insert it into the document
	script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	Q.addScript.added[src] = true;
	Q.addScript.onLoadCallbacks[src] = [_onload];
	Q.addScript.onErrorCallbacks[src] = [];
	if (o.onError) {
		Q.addScript.onErrorCallbacks[src].push(o.onError);
	}
	script.onload = onload2;
	script.wasProcessedByQ = true;
	Q.addEventListener(script, 'error', onerror2);
	
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
 * Adds a reference to a stylesheet, if it's not already there
 * @static
 * @method addStylesheet
 * @param {String} href
 * @param {String} media
 * @param {Function} onload
 * @param {Object} options
 *  An optional hash of options, which can include:
 * @param {HTMLElement} [options.container] An element to which the stylesheet should be appended (unless it already exists in the document)
 * @param {Boolean} [options.returnAll=false] If true, returns all the link elements instead of just the new ones
 * @return {Array} Returns an aray of LINK elements
 */
Q.addStylesheet = function _Q_addStylesheet(href, media, onload, options) {
	var i;
	options = options || {};
	if (typeof media === 'function') {
		onload = media; media = undefined;
	}
	if (!onload) {
		onload = function _onload() { };
	}
	if (Q.isArrayLike(href)) {
		var ret = [];
		var len = href.length;
		for (i=0; i<len; ++i) {
			ret.push(Q.addStylesheet(
				href[i].href || href[i],
				href[i].media
			));
		}
		return ret;
	}
	var container = options.container || document.getElementsByTagName('head')[0];

	if (!href) {
		onload(false);
		return false;
	}
	href = Q.url(href);
	if (!media) media = 'screen,print';
	var links = document.getElementsByTagName('link');
	for (i=0; i<links.length; ++i) {
		if (links[i].getAttribute('href') !== href) continue;
		// move the element to the right container if necessary
		// hopefully, moving the link element won't change the order of applying the styles
		var p = links[i], outside = true;
		while (p = p.parentNode) {
			if (p === container) {
				outside = false;
				break;
			}
		}
		if (outside) {
			container.appendChild(links[i]);
		}
		if (Q.addStylesheet.loaded[href] || !Q.addStylesheet.added[href]) {
			onload();
			return options.returnAll ? links[i] : false;
		}
		if (Q.addStylesheet.onLoadCallbacks[href]) {
			Q.addStylesheet.onLoadCallbacks[href].push(onload);
		} else {
			Q.addStylesheet.onLoadCallbacks[href] = [onload];
		}
		links = document.getElementsByTagName('link');
		for (var j=0; j<links.length; ++j) {
			if (links[j].href !== href) continue;
			links[j].onload = onload2;
			links[j].onreadystatechange = onload2; // for IE6
			break;
		}
		return options.returnAll ? links[i] : false; // don't add
	}

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

	// Create the stylesheet's tag and insert it into the document
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('type', 'text/css');
	link.setAttribute('media', media);
	Q.addStylesheet.added[href] = true;
	Q.addStylesheet.onLoadCallbacks[href] = [onload];
	link.onload = onload2;
	link.onreadystatechange = onload2; // for IE
	link.setAttribute('href', href);
	container.appendChild(link);
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
 * @param {String} [options.domain] the domain to set cookie
 * @param {String} [options.path] path to set cookie. Defaults to location.pathname
 * @return {String|null}
 *   If only name was passed, returns the stored value of the cookie, or null.
 */
Q.cookie = function _Q_cookie(name, value, options) {
	var parts;
	options = options || {};
	if (typeof value != 'undefined') {
		var path, domain = '';
		parts = Q.info.baseUrl.split('://');
		if ('path' in options) {
			path = ';path='+options.path;
		} else {
			path = ';path=/' + parts[1].split('/').slice(1).join('/');
		}
		if ('domain' in options) {
			domain = ';domain='+options.domain;
		} else {
			var hostname = parts[1].split('/').shift();
			domain = ';domain=' + (hostname.isIPAddress() ? '' : '.') + hostname;
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
	if (Q.clientId.value = storage.getItem("Q\tclientId")) {
		return Q.clientId.value;
	}
	var detected = Q.Browser.detect();
	var code = Math.floor(Date.now()/1000)*1000 + Math.floor(Math.random()*1000);
	var ret = Q.clientId.value = (detected.device || "desktop").substr(0, 4)
		+ "\t" + detected.OS.substr(0, 3)
		+ "\t" + detected.name.substr(0, 3)
		+ "\t" + detected.mainVersion + (detected.isWebView ? "n" : "w")
		+ "\t" + code.toString(36);
	storage.setItem("Q\tclientId", ret);
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
	var i;
	if (!elem) {
		return;
	}
	if (filter === true) {
		filter = 'q_tool';
	}
	// Arrays are accepted
	if ((Q.isArrayLike(elem) && !Q.instanceOf(elem, Element))
	|| (typeof HTMLCollection !== 'undefined' && (elem instanceof root.HTMLCollection))
	|| (root.jQuery && (elem instanceof jQuery))) {

		Q.each(elem, function _Q_find_array(i) {
			if (false === Q.find(
				this, filter, callbackBefore, callbackAfter, 
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
		var children;
		if ('children' in elem) {
			children = elem.children;
		} else {
			children = elem.childNodes; // more tedious search
		}
		var c = [];
		if (children) {
			for (i=0; i<children.length; ++i) {
				c[i] = children[i];
			}
		}
		ret = Q.find(c, filter, callbackBefore, callbackAfter, options, shared, elem);
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
 * @param {Function|Q.Event} callback
 *  This will get called when the content has been completely activated.
 *  That is, after all the files, if any, have been loaded and all the
 *  constructors have run.
 *  It receives (elem, options, tools) as arguments, and the last tool to be
 *  activated as "this".
 *  @optional
 */
Q.activate = function _Q_activate(elem, options, callback) {
	
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
	
	Q.beforeActivate.handle.call(root, elem); // things to do before things are activated
	
	var shared = {
		tool: null,
		tools: {},
		waitingForTools: [],
		pipe: Q.pipe()
	};
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	Q.find(elem, true, _activateTools, _initTools, options, shared);
	shared.pipe.add(shared.waitingForTools, 1, _activated)
		.run();
	
	Q.Tool.beingActivated = ba;
	
	function _activated() {
		var tool = shared.firstTool || shared.tool;
		if (callback) {
			Q.handle(callback, tool, [elem, options, shared.tools]);
		}
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
 * @param {Element|String} source
 *  An HTML string or a Element which is not part of the DOM
 * @param {Object} options
 *  Optional. A hash of options, including:
 * @param {Array} [options.replaceElements] array of elements or ids of elements in the document to replace, even if they have "data-q-retain" attributes.
 * @param {boolean} [options.animation] To animate the transition, pass an object here with optional "duration", "ease" and "callback" properties.
 * @return {HTMLElement}
 *  Returns the container element if successful
 */
Q.replace = function _Q_replace(container, source, options) {
	if (!source) {
		Q.Tool.clear(container); // Remove all the tools remaining in the container, with their events etc.
		var c; while (c = container.lastChild) {
			container.removeChild(c);
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
		&& !incomingElement.getAttribute('data-Q-replace') !== null) {
			// If a tool exists with this exact id and has "data-Q-retain",
			// then re-use it and all its HTML elements, unless
			// the new tool HTML has data-Q-replace.
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
	
	Q.Tool.clear(container); // Remove all the tools remaining in the container, with their events etc.
	var c; while (c = container.lastChild) {
		container.removeChild(c);
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

var _latestLoadUrlObjects = {};

/**
 * @static
 * @method loadUrl
 * @param {String} url The url to load.
 * @param {Array|String} slotNames Optional, defaults to all application slots
 * @param {Function} callback Callback which is called when response returned and scripts,
 * stylesheets and inline styles added, but before inline scripts executed.
 * Receives response as its first agrument. May return DOM element or array of DOM elements on which to call Q.activate
 * By default place slot content to DOM element with id "{slotName}_slot"
 * @param {Object} options Optional.
 * An hash of options to pass to the loader, and can also include options for loadUrl itself:
 * @param {Function} [options.loader=Q.request] the actual function to load the URL. See Q.request documentation for more options.
 * @param {Function} [options.handler] the function to handle the returned data. Defaults to a function that fills the corresponding slot containers correctly.
 * @param {boolean} [options.ignoreHistory=false] if true, does not push the url onto the history stack
 * @param {boolean} [options.ignorePage=false] if true, does not process the links / stylesheets / script data in the response, and doesn't trigger deactivation of current page and activation of the new page
 * @param {boolean} [options.ignoreLoadingErrors=false] If true, ignores any errors in loading scripts.
 * @param {boolean} [options.ignoreHash=false] if true, does not navigate to the hash part of the URL in browsers that can support it
 * @param {Object} [options.fields] additional fields to pass via the querystring
 * @param {boolean} [options.loadExtras=false] if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 * @param {Number|boolean} [options.timeout=1500] milliseconds to wait for response, before showing cancel button and triggering onTimeout event, if any, passed to the options
 * @param {boolean} [options.quiet=false] if true, allows visual indications that the request is going to take place.
 * @param {String|Array} [options.slotNames] an array of slot names to request and process (default is all slots in Q.info.slotNames)
 * @param {Array} [options.idPrefixes] optional array of values to pass to PHP method Q_Html::pushIdPrefix for each slotName
 * @param {Object} [options.retainSlots] an object of {slotName: whetherToRetain} pairs, retained slots aren't requested
 * @param {boolean} [options.slotContainer] optional function taking (slotName, response) and returning the element, if any, to fill for that slot
 * @param {Array} [options.replaceElements] array of elements or ids of elements in the document to replace. Overrides "data-q-retain" attributes but not retainSlots option.
 * @param {String} [options.key='Q'] If a response to the request initiated by this call to Q.loadUrl is preceded by another call to Q.loadUrl with the same key, then the response handler is not run for that response (since a newer one is pending or arrived).
 * @param {Q.Event} [options.onTimeout] handler to call when timeout is reached. Receives function as argument - the function might be called to cancel loading.
 * @param {Q.Event} [options.onResponse] handler to call when the response comes back but before it is processed
 * @param {Q.Event} [options.onError] event for when an error occurs, by default shows an alert
 * @param {Q.Event} [options.onLoad] event which occurs when the parsed data comes back from the server
 * @param {Q.Event} [options.onActivate] event which occurs when all Q.activate's processed and all script lines executed
 * @param {Q.Event} [options.onLoadStart] if "quiet" option is false, anything here will be called after the request is initiated.
 * @param {Q.Event} [options.onLoadEnd] if "quiet" option is false, anything here will be called after the request is fully completed.
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
	var hashUrl = parts[1] ? parts[1].queryField('url') : undefined;
	url = (hashUrl !== undefined) ? hashUrl : parts[0];

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
	var _loadUrlObject = {};
	_latestLoadUrlObjects[o.key] = _loadUrlObject;
	loader(url, slotNames, loadResponse, o);

	function loadResponse(err, response, redirected) {
		if (_loadUrlObject != _latestLoadUrlObjects[o.key]) {
			return; // a newer request was sent
		}
		if (err) {
			return Q.handle(onError, this, [Q.firstErrorMessage(err)]);
		}
		if (!response) {
			return Q.handle(onError, this, ["Response is empty", response]);
		}
		if (response.errors) {
			return Q.handle(onError, this, [response.errors[0].message]);
		}
		Q.handle(o.onLoad, this, [response]);
		
		if (redirected) {
			return;
		}
		
		Q.Page.beingProcessed = true;
		
		loadTemplates();
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
			newScripts = loadScripts(afterScripts);
		}
		
		function afterScripts () {
			
			// WARNING: This function may not be called if one of the scripts is missing or returns an error
			// So the existing page will not be unloaded and the new page will not be loaded, in this case,
			// but some of the new scripts will be added.

			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // old page going out
			var i, newStylesheets, newStyles;
			
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
							if (element.tagName.toUpperCase() === 'LINK') {
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
				
				Q.Page.beingProcessed = false;
				Q.handle(onActivate, this, [domElements]);
			}
			
			function afterStyles() {
			
				if (!o.ignorePage && Q.info && Q.info.uri) {
					Q.Page.onLoad(moduleSlashAction).occurred = false;
					Q.Page.onActivate(moduleSlashAction).occurred = false;
					if (Q.info.uriString !== Q.moduleSlashAction) {
						Q.Page.onLoad(Q.info.uriString).occurred = false;
						Q.Page.onActivate(Q.info.uriString).occurred = false;
					}
				}

				if (response.scriptData) {
					Q.each(response.scriptData, function _Q_loadUrl_scriptData_each(slot, data) {
						Q.each(data, function _Q_loadUrl_scriptData_assign(k, v) {
							Q.setObject(k, v);
						});
					});
				}
				if (response.scriptLines) {
					for (i in response.scriptLines) {
						if (response.scriptLines[i]) {
							eval(response.scriptLines[i]);
						}
					}
				}

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
				Q.Page.push(url);
			}
			
			if (!o.ignorePage) {
				// Remove various elements belonging to the slots that are being reloaded
				Q.each(['link', 'style', 'script'], function (i, tag) {
					Q.each(document.getElementsByTagName(tag), function (k, e) {
						if (tag === 'link' && e.getAttribute('rel').toLowerCase() != 'stylesheet') {
							return;
						}

						var slot = e.getAttribute('data-slot');
						if (slot && slotNames.indexOf(slot) >= 0) {
							var found = false;
							if (response.stylesheets && response.stylesheets[slot]) {
								var stylesheets = response.stylesheets[slot];
								for (var i=0, l=stylesheets.length; i<l; ++i) {
									var stylesheet = stylesheets[i];
									if (stylesheet.href === e.href
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
			
			var domElements = handler(response, url, o); // this is where we fill all the slots
			if (o.ignorePage) {
				newStylesheets = [];
				afterStylesheets();
			} else {
				_doEvents('on', moduleSlashAction);
				newStylesheets = loadStylesheets(afterStylesheets);
			}
			
			function afterStylesheets() {
				var newStyles = loadStyles();
				
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
		}
		
		function loadStylesheets(callback) {
			if (!response.stylesheets) {
				return null;
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
						slotPipe.fill(key), { returnAll: false }
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
		
		function loadStyles() {
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
		
		function loadTemplates() {
			if (!response.templates) {
				return null;
			}
			var slotName, newTemplates = {};
			for (slotName in response.templates) {
				newTemplates[slotName] = [];
				Q.each(response.templates[slotName], function (i) {
					newTemplates[slotName].push(
						Q.Template.set(this.name, this.content, this.type)
					);
				});
			}
			return newTemplates;
		}
		
		function loadScripts(callback) {
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
					ignoreLoadingErrors: o.ignoreLoadingErrors,
					returnAll: false
				});
				if (elem) {
					newScripts[slotName] = elem;
				}
			});
			return newScripts;
		}
	}
};

Q.loadUrl.retainedSlots = {};

Q.loadUrl.saveScroll = function _Q_loadUrl_saveScroll (url) {
	var slotNames = Q.info.slotNames, l, elem, i;
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	l = slotNames.length;
	for (i=0; i<l; ++i) {
		if ((elem = document.getElementById(slotNames[i] + "_slot"))
		&& ('scrollLeft' in elem)) {
			Q.setObject(['Q', 'scroll', url], {
				left: elem.scrollLeft,
				top: elem.scrollTop
			}, elem);
		}
	}
};

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
 *  @param {boolean} [options.loadExtras=true] if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
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
			var sameDomain = callables.sameDomain(Q.info.baseUrl);
			if (callables[0] === '#') {
				root.location.hash = callables;
			} else if (o.loadUsingAjax && sameDomain
			&& (!o.target || o.target === true || o.target === '_self')) {
				if (callables.search(Q.info.baseUrl) === 0) {
					// Use AJAX to refresh the page whenever the request is for a local page
					Q.loadUrl(callables, Q.extend({
						loadExtras: true,
						ignoreHistory: false,
						onActivate: function () {
							if (callback) callback();
						}
					}, o));
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
					if (Q.info && (callables === Q.info.baseUrl || callables === Q.info.proxyBaseUrl)) {
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
		Q.removeElement(this);
	});
	Q.Pointer.stopHints();
}, "Q");

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
	var url = location.hash.queryField('url'), result = null;
	if (url === undefined) {
		url = root.location.href.split('#')[0].substr(Q.info.baseUrl.length + 1);
	}
	if (Q_hashChangeHandler.ignore) {
		Q_hashChangeHandler.ignore = false;
	} else if (url != Q_hashChangeHandler.currentUrl) {
		Q.handle(url.indexOf(Q.info.baseUrl) == -1 ? Q.info.baseUrl + '/' + url : url);
		result = true;
	}
	Q_hashChangeHandler.currentUrl = url;
	return result;
}

function Q_popStateHandler() {
	var url = root.location.href.split('#')[0], result = null;
	if (Q.info.url === url) {
		return; // we are already at this url
	}
	url = url.substr(Q.info.baseUrl.length + 1);
	if (url != Q_hashChangeHandler.currentUrl) {
		Q.handle(
			url.indexOf(Q.info.baseUrl) === 0 ? url : Q.info.baseUrl + '/' + url,
			{
				ignoreHistory: true,
				quiet: true
			}
		);
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
 * Note: to communicate with the constructor, you can use
 * attributes and hidden fields.
 * Note: don't forget to add the entry to Q.Tool.constructors
 * when you define your tool's constructor.
 * @private
 * @static
 * @method _activateTools
 * @param {HTMLElement} toolElement
 *  A tool's generated container div.
 * @param {Object} options
 *  Options that should be passed onto the tool
 * @param {Mixed} shared
 *  A shared pipe which we can use to fill
 */
function _activateTools(toolElement, options, shared) {
	var pendingParentEvent = _pendingParentStack[_pendingParentStack.length-1];
	var pendingCurrentEvent = new Q.Event();
	pendingCurrentEvent.toolElement = toolElement; // just to keep track for debugging
	_pendingParentStack.push(pendingCurrentEvent); // wait for construct of parent tool
	_loadToolScript(toolElement,
	function _activateTools_doConstruct(toolElement, toolFunc, toolName, uniqueToolId) {
		if (!_constructors[toolName]) {
			_constructors[toolName] = function Q_Tool(element, options) {
				// support re-entrancy of Q.activate
				var tool = Q.getObject(['Q', 'tools', toolName], element);
				if (this.activated || tool) {
					tool = tool || this;
					return _activateTools.alreadyActivated;
				}
				this.activated = false;
				this.initialized = false;
				try {
					this.options = Q.extend({}, Q.Tool.options.levels, toolFunc.options);
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
					Q.Tool.call(this, element, options);
					this.state = Q.copy(this.options, toolFunc.stateKeys);
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
					Q.each(toolFunc.require, function (i, n) {
						var req = Q.Tool.from(element, n);
						if (!req) {
							throw new Q.Exception("Q.Tool.define: " + toolFunc.toolName
							+ " requires " + n + " to have been activated on the same element.");
						}
						args.push(req);
					});
					toolFunc.apply(this, args);
					if (normalizedName === 'q_inplace') 
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
				this.activated = true;
			};
			Q.mixin(toolFunc, Q.Tool);
			Q.mixin(_constructors[toolName], toolFunc);
		}
		var key;
		if (pendingParentEvent) {
			key = pendingParentEvent.add(_reallyConstruct, null);
		} else {
			_reallyConstruct();
		}
		function _reallyConstruct() {
			var _constructor = _constructors[toolName];
			var result = new _constructor(toolElement, options);
			var tool = Q.getObject(['Q', 'tools', toolName], toolElement);
			shared.tools[tool.id] = shared.tool = tool;
			
			if (result !== _activateTools.alreadyActivated) {
				// recursively activate whatever was inside,
				// handle _initTools events, etc.
				
				// TODO: make a mechanism for the tools
				// to tell Q to go deeper inside, and otherwise
				// we can skip the subtree on every Q.activate
				// when it hits an element where no tool on that
				// element said to go deeper. Which also means
				// no child tools will be activated, so nothing
				// was added to waitForIdNames and the tool will
				// be initialized without waiting for any child tools.
				// tool.element.Q.supportsChildren = true
				// set by tool.supportsChildren(true)
				Q.activate(toolElement.children || toolElement.childNodes, options);
			}
			
			if (uniqueToolId) {
				if (uniqueToolId === shared.firstToolId) {
					shared.firstTool = tool;
				}
				shared.pipe.fill(uniqueToolId)();
			}
			pendingCurrentEvent.handle.call(result, options);
			pendingCurrentEvent.removeAllHandlers();
		}
	}, shared);
	_waitingParentStack.push(new Q.Pipe()); // wait for init of child tools
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
function _initTools(toolElement) {
	
	function _handleInit() {
		var tn, tool, normalizedName, normalizedId;
		var tools = toolElement.Q.tools;
		for (tn in tools) {
			tool = tools[tn];
			normalizedName = Q.normalize(tn);
			normalizedId = Q.normalize(tool.id);
			if (!tool.initialized) {
				tool.initialized = true;
				Q.handle(tool.Q && tool.Q.onInit, tool, [tool.options]);
				_initToolHandlers[""] &&
				_initToolHandlers[""].handle.call(tool, tool.options);
				_initToolHandlers[normalizedName] &&
				_initToolHandlers[normalizedName].handle.call(tool, tool.options);
				_initToolHandlers["id:"+normalizedId] &&
				_initToolHandlers["id:"+normalizedId].handle.call(tool, tool.options);
			}
			if (parentPipe) {
				parentPipe.fill(normalizedId+"\t"+normalizedName).call(tool, tool.options);
			}
		}
	}
	
	_pendingParentStack.pop();
	
	var currentPipe = _waitingParentStack.pop();
	var parentPipe = _waitingParentStack.length
		? _waitingParentStack[_waitingParentStack.length-1]
		: null;
	
	_loadToolScript(toolElement, function () {
		var wfin = currentPipe.waitForIdNames;
		if (wfin) {
			currentPipe.add(wfin, 1, _handleInit).run();
		} else {
			_handleInit(); // just a slight optimization
		}
	}, null, parentPipe);
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
	return Q.info.baseUrl; // By default, return the base url of the app
};
Q.baseUrl.routers = []; // functions returning a custom url

/**
 * Given an index and field values, returns the hostname and port for connecting to a Node.js server running Q
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


/**
 * Sets the text of a template in this document's collection, and compiles it.
 * This is e.g. called by Q.loadUrl when the server sends over some templates,
 * so they won't have to be requested later.
 * @static
 * @method set
 * @param {String} name The template's name under which it will be found
 * @param {String} content The content of the template that will be processed by the template engine
 * @param {String} type The type of template. Defaults to "handlebars"
 */
Q.Template.set = function (name, content, type) {
	type = type || 'handlebars';
	Q.Template.remove(name);
	Q.Template.collection[Q.normalize(name)] = content;
	Q.loadHandlebars(function () {
		Q.Template.compile(content);
	});
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
 * @return {Function} a function that can be called to render the template
 */
Q.Template.compile = function _Q_Template_compile (content) {
	var r = Q.Template.compile.results;
	if (!r[content]) {
		r[content] = Handlebars.compile(content);
	}
	return r[content];
};
Q.Template.compile.results = {};

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
	
	// Now attempt to load the template.
	// First, search the DOM for templates loaded inside script tag with type "text/theType",
	// e.g. "text/handlebars" and id matching the template name.
	var i, l, script;
	var scripts = document.getElementsByTagName('script');
	var trash = [];
	for (i = 0, l = scripts.length; i < l; i++) {
		script = scripts[i];
		var type = script.getAttribute('type');
		if (script && script.id && script.innerHTML
		&& type && type.substr(0, 5) === 'text/'
		&& o.types[type.substr(5)]) {
			tpl[Q.normalize(script.id)] = script.innerHTML.trim();
			trash.unshift(script);
		}
	}
	// For efficiency process all found scripts and remove them from DOM
	for (i = 0, l = trash.length; i < l; i++) {
		Q.removeElement(trash[i]);
	}
	
	// TODO: REMOVE THE ABOVE BLOCK SO IT DOESNT EXECUTE EVERY TIME A TEMPLATE IS RENDERED
	
	// check if template is cached
	var n = Q.normalize(name);
	if (tpl && typeof tpl[n] === 'string') {
		var result = tpl[n];
		callback(null, result);
		return true;
	}
	// now try to load template from server
	function _callback(err, content) {
		if (err) {
			Q.Template.onError.handle(err);
			return callback(err, null);
		}
		tpl[n] = content.trim();
		callback(null, tpl[n]);
	}
	function _fail () {
		var err = 'Failed to load template "'+o.dir+'/'+name+'.'+o.type+'"';
		Q.Template.onError.handle(err);
		callback(err);
	}
	var url = Q.url(o.dir+'/'+name+'.'+ o.type);

	Q.request(url, _callback, {parse: false, extend: false});
	return true;
}, {
	cache: Q.Cache.document('Q.Template.load', 100),
	throttle: 'Q.Template.load'
});

Q.Template.load.options = {
	type: "handlebars",
	types: { "handlebars": true, "php": true },
	dir: "views"
};

Q.Template.onError = new Q.Event(function (err) {
	console.warn("Q.Template: " + Q.firstErrorMessage(err));
}, 'Q.Template');

/**
 * Render template taken from DOM or from file on server with partials
 * @static
 * @method render
 * @param {String} name The name of template. See Q.Template.load
 * @param {Object} fields The fields to pass to the template when rendering it
 * @param {Array} [partials] Names of partials to load and use for rendering the template
 * @param {Function} [callback] a callback - receives (error) or (error, html)
 * @param {Object} [options={}] Options.
 * @param {String} [options.type='handlebars'] the type and extension of the template
 * @param {String} [options.dir] the folder under project web folder where templates are located
 * @param {String} [options.name] option to override the name of the template
 * @param {String} [options.tool] if the rendered html will be placed inside a tool, pass it here so that its prefix will be used
 */
Q.Template.render = function _Q_Template_render(name, fields, partials, callback, options) {
	if (typeof fields === "function") {
		options = partials;
		callback = fields;
		partials = undefined;
		fields = {};
	} else if (typeof partials === "function") {
		options = callback;
		callback = partials;
		partials = undefined;
	}
	if (!callback) {
		throw new Q.Error("Q.Template.render: callback is missing");
	}
	var isArray = Q.isArrayLike(name);
	if (isArray || Q.isPlainObject(name)) {
		var names = name;
		var p = Q.pipe(isArray ? names : Object.keys(names), callback);
		return Q.each(names, function (key, name) {
			Q.Template.render(
				name, fields, partials, p.fill(isArray ? name : key), options
			);
		});
	}
	var tba = (options && options.tool) || Q.Tool.beingActivated;
	var pba = Q.Page.beingActivated;
	Q.loadHandlebars(function () {
		// load the template and partials
		var p = Q.pipe(['template', 'partials'], function (params) {
			if (params.template[0]) {
				return callback(params.template[0]);
			}
			var tbaOld = Q.Tool.beingActivated;
			var pbaOld = Q.Page.beingActivated;
			Q.Tool.beingActivated = tba;
			Q.Page.beingActivated = pba;
			try {
				var compiled = Q.Template.compile(params.template[1]);
				callback(null, compiled(fields, {partials: params.partials[0]}));
			} catch (e) {
				console.warn(e);
			}
			Q.Tool.beingActivated = tbaOld;
			Q.Page.beingActivated = pbaOld;
		});
		var o = Q.copy(options, ['type', 'dir', 'name']);
		Q.Template.load(name, p.fill('template'), o);
		// pipe for partials
		if (partials && partials.length) {
			var pp = Q.pipe(partials, function (params) {
				var i, partial, part = {};
				for (i=0; i<partials.length; i++) {
					partial = partials[i];
					part[partial] = params[partial][0] ? null : params[partial][1];
				}
				p.fill('partials')(part);
			});
			for (var i=0; i<partials.length; i++) {
				Q.Template.load(partials[i], pp.fill(partials[i]), options);
			}
		} else {
			p.fill('partials')();
		}
	});
};

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
 * @param ns {String} The socket.io namespace
 * @param url {String} The url where socket.io is listening. If it's empty, then returns all matching sockets.
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

function _connectSocketNS(ns, url, callback, force) {
	// load socket.io script and connect socket
	function _connectNS(ns, url, callback) {
		// connect to (ns, url)
		if (!root.io) return;
		var qs = _qsockets[ns][url];
		if (!qs || !qs.socket) {
			_qsockets[ns][url] = qs = new Q.Socket({
				socket: root.io.connect(url+ns, force ? {
					'force new connection': true
				} : {}),
				url: url,
				ns: ns
			});
			Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
			// remember actual socket - for disconnecting
			var socket = qs.socket;
			_ioOn(socket, 'connect', _connected);
			/*
			_ioOn(socket, 'reconnect', function () {
				this.connected = true;
				++this.io.connected;
				_connected.apply(this, arguments);
			});
			*/
			_ioOn(socket, 'connect_error', function (error) {
				console.log('Failed to connect to '+url, error);
			});
			_ioOn(socket, 'disconnect', function () {
				console.log('Socket ' + ns + ' disconnected from '+url);
			});
			_ioOn(socket, 'error', function () {
				console.log('Error on connection '+url);
			});
		}
		callback && callback(_qsockets[ns][url]);
		
		function _Q_Socket_register(socket) {
			Q.each(_socketRegister, function (i, item) {
				if (item[0] !== ns) return;
				var name = item[1];
				_ioOn(socket, name, Q.Socket.onEvent(ns, url, name).handle); // may overwrite again, but it's ok
				_ioOn(socket, name, Q.Socket.onEvent(ns, '', name).handle);
			});
		}
		
		function _connected() {
			Q.Socket.onConnect().handle(this, [ns, url]);
			Q.Socket.onConnect(ns).handle(this, [ns, url]);
			Q.Socket.onConnect(ns, url).handle(this, [ns, url]);
			console.log('Socket connected to '+url);
		}
	}
	
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	
	if (root.io && root.io.Socket) {
		_connectNS(ns, url, callback);
	} else {
		Q.addScript(url+'/socket.io/socket.io.js', function () {
			_connectNS(ns, url, callback);
		});
	}
}

/**
 * Connects a socket, and stores it in the list of connected sockets
 * @static
 * @method connect
 * @param ns {String} A socket.io namespace to use
 * @param url {String} The url of the socket.io node to connect to
 * @param callback {Function} When a connection is made, receives the socket object
 */
Q.Socket.connect = function _Q_Socket_prototype_connect(ns, url, callback) {
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
	_connectSocketNS(ns, url, callback); // check if socket already connected and try to restore it
};

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
			if (!_qsockets[ns][url]) {
				_connectSocketNS(ns, url);
			} else if (!_qsockets[ns][url].socket.io.connected) {
				_qsockets[ns][url].socket.io.reconnect();
			}
		}
	}
};

/**
 * Completely remove all sockets, de-register events and forget socket.io
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
		root.io = undefined;
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
 * Returns Q.Event which occurs on a message post event coming from socket.io
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
 *  x = the position in the animation, between 0 and 1
 *  y = the output of the ease function after plugging in x
 *  params = the fourth parameter passed to the run function
 * @param {number} duration
 *  The number of milliseconds the animation should run
 * @param {String|Function} ease
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param {Object} params
 *  Optional parameters to pass to the callback
 */
Q.Animation = function _Q_Animation(callback, duration, ease, params) {
	if (duration == undefined) {
		duration = 1000;
	}
	if (typeof ease == "string") {
		ease = Q.Animation.ease[ease];
	}
	if (typeof ease !== 'function') {
		ease = Q.Animation.ease.smooth;
	}
	var anim = this;
	anim.position = 0;
	anim.milliseconds = 0;
	anim.sinceLastFrame = 0;
	this.id = ++_Q_Animation_index;
	this.duration = duration;
	this.ease = ease;
	this.callback = callback;
	this.params = params;
	this.onRewind = new Q.Event();
	this.onPause = new Q.Event();
	this.onRender = new Q.Event();
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
 * Rewind the animation
 * @method rewind
 */
Ap.rewind = function _Q_Animation_prototype_rewind() {
	this.pause();
	this.position = this.milliseconds = this.sinceLastFrame = 0;
	this.onRewind.handle.call(this);
	return this;
};

/**
 * Render the current frame of the animation
 * @method render
 */
Ap.render = function _Q_Animation_prototype_render() {
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
		var x = anim.position = anim.elapsed / anim.duration;
		if (x >= 1) {
			Q.handle(anim.callback, anim, [1, anim.ease(1), anim.params]);
			anim.onRender.stop();
			anim.onComplete.handle.call(anim);
			anim.rewind();
			return;
		}
		var y = anim.ease(x);
		Q.handle(anim.callback, anim, [x, y, anim.params]);
		anim.onRender.handle.call(anim, x, y, anim.params);
		if (anim.playing) {
			anim.render();
		}
	});
};

/**
 * Play the animation (resume after a pause)
 * @method play
 */
Ap.play = function _Q_Animation_instance_play() {
	Q.Animation.playing[this.id] = this;
	if (!this.playing) {
		this.started = Q.milliseconds();
	}
	this.playing = true;
	this.render();
	return this;
};

/**
 * Play the animation
 * @static
 * @method play
 * @param {Function} callback
 *  The function to call. It is passed the following parameters:
 *  x = the position in the animation, between 0 and 1
 *  y = the output of the ease function after plugging in x
 *  params = the fourth parameter passed to the run function
 * @param {number} duration
 *  The number of milliseconds the animation should run
 * @param {String|Function} ease
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param {Object} params
 *  Optional parameters to pass to the callback
 */
Q.Animation.play = function _Q_Animation_play(callback, duration, ease, params) {
	var result = new Q.Animation(callback, duration, ease, params);
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
		return (x==0) ? 0 : pow(2, 10 * (x - 1)) + 0 - 1 * 0.001;
	},
	inOutQuintic: function(t) {
		var ts = t * t;
		var tc = ts * t;
		return 6 * tc * ts + -15 * ts * ts + 10 * tc;
	}
};

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
		Q.onVisibilityChange.handle(document, [document[hidden]]);
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
	var $ = root.jQuery;
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
			case 'array': // passing a bunch of parameters to a plugin
				args = options;
				break;
			case 'string': // calling the method of a plugin
				args = Array.prototype.slice.call(arguments, 1);
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
			var src = ($.fn.plugin[pn] || 'plugins/jQuery/'+pn+'.js');
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
	 * @param {String} toolName
	 *  The type of the tool, such as "Q/tabs"
	 * @param {Object} [toolOptions]
	 *  The options for the tool
	 * @param {String|Function} [id]
	 *  Optional id of the tool, such as "Q_tabs_2"
	 * @param {String} [prefix]
	 *  Optional prefix to prepend to the tool's id
	 */
	$.fn.tool = function _jQuery_fn_tool(toolName, toolOptions, id, prefix) {
		var args = arguments;
		return this.each(function () {
			var id2 = (typeof id === 'function') ? id.apply(this, args) : id;
			Q.Tool.setUpElement(this, toolName, toolOptions, id2, prefix);
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
		return this.each(function _jQuery_fn_activate_each(index, element) {
			if (!$(element).closest('html').length) {
				console.log("Q.activate: element " + element.id + " is not in the DOM");
				return false; // avoid doing work if it's not in the DOM
			}
			Q.activate(element, options, callback);
		});
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

/**
 * A tool for detecting user browser parameters.
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
		var isCordova = /(.*)QCordova(.*)/.test(navigator.userAgent);
		var isWebView = /(.*)QWebView(.*)/.test(navigator.userAgent)
			|| (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Version)/i).test(navigator.userAgent);
		var isStandalone = navigator.standalone
			|| (root.external && external.msIsSiteMode && external.msIsSiteMode())
			|| false;
		if (OS === 'Android') {
			isStandalone = screen.height-document.documentElement.clientHeight<40
			             || screen.width-document.documentElement.clientHeight<40;
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
			device: OSdata.device,
			isWebView: isWebView,
			isStandalone: isStandalone,
			isCordova: isCordova
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
			subString : "BlackBerry",
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
	}
	
};

var detected = Q.Browser.detect();
var isTouchscreen = ('ontouchstart' in root || !!root.navigator.msMaxTouchPoints);
var isTablet = navigator.userAgent.match(/tablet|ipad/i)
	|| (isTouchscreen && !navigator.userAgent.match(/mobi/i));
/**
 * Useful info about the page and environment
 * @property {Object} info
 */
Q.info = {
	isTouchscreen: isTouchscreen, // works on ie10
	isTablet: isTablet,
	isWebView: detected.isWebView,
	isStandalone: detected.isStandalone,
	platform: detected.OS,
	browser: detected,
	isIE: function (minVersion, maxVersion) {
		return Q.info.browser.name === 'explorer'
			&& (minVersion == undefined || minVersion <= Q.info.browser.mainVersion)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.mainVersion);
	},
	isAndroid: function (maxWidth, maxHeight, minVersion, maxVersion) {
		return Q.info.platform === 'android'
			&& (maxWidth == undefined || maxWidth >= Q.Pointer.windowWidth())
			&& (maxHeight == undefined || maxHeight >= Q.Pointer.windowHeight())	
			&& (minVersion == undefined || minVersion <= Q.info.browser.mainVersion)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.mainVersion);
	}
};
Q.info.isAndroidStock = !!(Q.info.platform === 'android'
	&& navigator.userAgent.match(/Android .*Version\/[\d]+\.[\d]+/i));
Q.info.isMobile = Q.info.isTouchscreen && !Q.info.isTablet;
Q.info.formFactor = Q.info.isMobile ? 'mobile' : (Q.info.isTablet ? 'tablet' : 'desktop');
var de = document.documentElement;
de.addClass('Q_js');
de.addClass(Q.info.isTouchscreen  ? 'Q_touchscreen' : 'Q_notTouchscreen');
de.addClass(Q.info.isMobile ? 'Q_mobile' : 'Q_notMobile');
de.addClass(Q.info.isAndroid() ? 'Q_android' : 'Q_notAndroid');

Q.Page.onLoad('').set(function () {
	de.addClass(Q.info.uri.module + '_' + Q.info.uri.action)
		.addClass(Q.info.uri.module);
}, 'Q');
Q.Page.beforeUnload('').set(function () {
	de.removeClass(Q.info.uri.module + '_' + Q.info.uri.action)
		.removeClass(Q.info.uri.module);
}, 'Q');

function _touchScrollingHandler(event) {
    var p = event.target;
	var pos;
	var scrollable = null;
	do {
		if (!p.computedStyle) {
			continue;
		}
		var overflow = p.computedStyle().overflow;
		var hiddenWidth = p.scrollWidth - Math.min(
			p.offsetWidth, Q.Pointer.windowWidth()
		);
		var q = (p.tagName === 'HTML')
			? document.getElementsByTagName('body')[0]
			: p;
		var hiddenHeight = q.scrollHeight - Math.min(
			p.offsetHeight, Q.Pointer.windowHeight()
		);
		var s = (['hidden', 'visible'].indexOf(overflow) < 0);
		if ((s || p.tagName === 'HTML')
		&& hiddenHeight > 0
		&& Q.Pointer.movement) {
			if (_touchScrollingHandler.options.direction != 'horizontal'
			&& (Q.Pointer.movement.positions.length == 1)
			&& (pos = Q.Pointer.movement.positions[0])) {
				var sy = Q.Pointer.getY(event) - Q.Pointer.scrollTop();
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
			&& (Q.Pointer.movement.positions.length == 1)
			&& (pos = Q.Pointer.movement.positions[0])) {
				var sx = Q.Pointer.getX(event) - Q.Pointer.scrollLeft();
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
        Q.Pointer.preventDefault(event);
    }
}

_touchScrollingHandler.options = {
	direction: 'both'
};

function _touchBlurHandler(event) {
	var o = _touchBlurHandler.options.blur;
	if (!o.blur) return;
	var target = Q.Pointer.target(event);
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
	var w = window,
	    d = document,
	    h = d.documentElement,
	    b = d.getElementsByTagName('body')[0],
	    x = w.innerWidth || h.clientWidth || b.clientWidth,
	    y = w.innerHeight|| h.clientHeight|| b.clientHeight;
	if (x > y) {
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
	var w = Q.Pointer.windowWidth();
	var h = Q.Pointer.windowHeight();
	var interval = setInterval(function () {
		var ae = document.activeElement;
		if (ae && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(ae.tagName.toUpperCase()) >= 0) {
			return;
		}
		var w2 = Q.Pointer.windowWidth();
		var h2 = Q.Pointer.windowHeight();
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
 * Methods for working with pointer and touchscreen events
 * @class Q.Pointer
 */
Q.Pointer = {
	/**
	 * Either 'touchstart' or 'mousedown' event name, depending on environment
	 * @static
	 * @property {String} start
	 */
	start: (Q.info.isTouchscreen ? 'touchstart' : 'mousedown'),
	/**
	 * Either 'touchmove' or 'mousemove' event name, depending on environment
	 * @static
	 * @property {String} move
	 */
	move: (Q.info.isTouchscreen ? 'touchmove' : 'mousemove'),
	/**
	 * Either 'touchend' or 'mouseup' event name, depending on environment
	 * @static
	 * @property {String} end
	 */
	end: (Q.info.isTouchscreen ? 'touchend' : 'mouseup'),
	/**
	 * Either 'touchenter' or 'mouseenter' event name, depending on environment
	 * @static
	 * @property {String} enter
	 */
	enter: (Q.info.isTouchscreen ? 'touchenter' : 'mouseenter'),
	/**
	 * Either 'touchleave' or 'mouseleave' event name, depending on environment
	 * @static
	 * @property {String} leave
	 */
	leave: (Q.info.isTouchscreen ? 'touchleave' : 'mouseleave'),
	/**
	 * The 'touchcancel' event name, depending on environment
	 * @static
	 * @property {String} cancel
	 */
	cancel: (Q.info.isTouchscreen ? 'touchcancel' : 'mousecancel'), // mousecancel can be a custom event
	/**
	 * The 'focusin' event name, depending on environment
	 * @static
	 * @property {String} focusin
	 */
	focusin: (Q.info.browser.engine === 'gecko' ? 'focus' : 'focusin'),
	/**
	 * The 'focusout' event name, depending on environment
	 * @static
	 * @property {String} focusout
	 */
	focusout: (Q.info.browser.engine === 'gecko' ? 'blur' : 'focusout'),
	/**
	 * Intelligent click event that also works on touchscreens, and respects Q.Pointer.canceledClick
	 * @static
	 * @method click
	 */
	click: function _Q_click(params) {
		params.eventName = 'click';
		return function _Q_click_on_wrapper (e) {
			if (Q.Pointer.canceledClick) {
				return Q.Pointer.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Like click event but fires much sooner on touchscreens, and respects Q.Pointer.canceledClick
	 * @static
	 * @method fastclick
	 */
	fastclick: function _Q_fastclick (params) {
		params.eventName = Q.info.isTouchscreen ? 'touchend' : 'click';
		return function _Q_fastclick_on_wrapper (e) {
			var elem = Q.Pointer.elementFromPoint(Q.Pointer.getX(e), Q.Pointer.getY(e));
			if (Q.Pointer.canceledClick
			|| !this.contains(Q.Pointer.started || null)
			|| !this.contains(elem)) {
				return Q.Pointer.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Like click event but works on touchscreens even if the viewport moves 
	 * during click (such as when the on-screen keyboard disappears).
	 * Respects Q.Pointer.canceledClick
	 * @static
	 * @method touchclick
	 */
	touchclick: function _Q_touchclick (params) {
		if (!Q.info.isTouchscreen) {
			return Q.Pointer.click(params);
		}
		params.eventName = Q.Pointer.start;
		return function _Q_touchclick_on_wrapper (e) {
			var _relevantClick = true;
			var t = this, a = arguments;
			function _clickHandler(e) {
				Q.removeEventListener(root, 'click', _clickHandler);
				if (Q.Pointer.canceledClick) {
					return Q.Pointer.preventDefault(e);
				}
				if (_relevantClick) {
					params.original.apply(t, a);
				}
			}
			function _touchendHandler(e) {
				Q.removeEventListener(this, 'touchend', _touchendHandler);
				setTimeout(function () {
					_relevantClick = false;
				}, Q.Pointer.touchclick.duration);
			}
			Q.addEventListener(root, 'click', _clickHandler);
			Q.addEventListener(this, 'touchend', _touchendHandler);
		};
	},
	/**
	 * Normalized mouse wheel event that works with various browsers
	 * @static
	 * @method click
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
	 * Whether the click was canceled by Q.Pointer.cancelClick()
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
	 * Returns the window's inner width, in pixels, consistently across browsers
	 * @static
	 * @method scrollTop
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
	 * Returns the x coordinate of an event relative to the document
	 * @static
	 * @method getX
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	getX: function(e) {
		var oe = e.originalEvent || e;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[0]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[0]
				: oe
			);
		return Math.max(0, ('pageX' in oe) ? oe.pageX : oe.clientX + Q.Pointer.scrollLeft());
	},
	/**
	 * Returns the y coordinate of an event relative to the document
	 * @static
	 * @method getY
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	getY: function(e) {
		var oe = e.originalEvent || e;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[0]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[0]
				: oe
			);
		return Math.max(0, ('pageY' in oe) ? oe.pageY : oe.clientY + Q.Pointer.scrollTop());
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
 		return oe.touches ? oe.touches.length : (Q.Pointer.which(e) > 0 ? 1 : 0);
	},
	/**
	 * Returns which button was pressed - Q.Pointer.which.{LEFT|MIDDLE|RIGHT}
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
	 * @param {String} [options.width="200px"]
	 * @param {String} [options.height="200px"]
	 * @param {Integer} [options.zIndex=99999]
	 * @param {Boolean} [option.dontStopBeforeShown=false] Don't let Q.Pointer.stopHints stop this hint before it's shown.
	 * @param {boolean} [options.dontRemove=false] Pass true to keep current hints displayed
	 * @param {String} [options.audio.src] Can be used to play an audio file.
	 * @param {String} [options.audio.from=0] Number of seconds inside the audio to start playing the audio from. Make sure audio is longer than this.
	 * @param {String} [options.audio.until] Number of seconds inside the audio to play the audio until. Make sure audio is longer than this.
	 * @param {String} [options.audio.removeAfterPlaying] Whether to remove the audio object after playing
	 * @param {Integer} [options.show.delay=500] How long to wait after the function call (or after audio file has loaded and starts playing, if one was specified) before showing the hint animation
	 * @param {Integer} [options.show.initialScale=10] The initial scale of the hint pointer image in the show animation
	 * @param {Integer} [options.show.duration=500] The duration of the hint show animation
	 * @param {Function} [options.show.ease=Q.Animation.ease.smooth]
	 * @param {Integer} [options.hide.duration=500] The duration of the hint hide animation
	 * @param {Function} [options.hide.ease=Q.Animation.ease.smooth]
	 */
	hint: function (targets, options) {
		options = options || {};
		var img, img1, i, l;
		var qphi = Q.Pointer.hint.imgs;
		var imageEvent = options.imageEvent || new Q.Event();
		var audioEvent = options.audioEvent || new Q.Event();
		var hintEvent = imageEvent.and(audioEvent);
		var o = Q.extend({}, Q.Pointer.hint.options, 10, options);
		var body = document.getElementsByTagName('body')[0];
		if (!options.dontRemove && !options.waitForEvents) {
			for (i=0, l=qphi.length; i<l; ++i) {
				img = qphi[i];
				if (img.parentNode) {
					img.parentNode.removeChild(img);
				}
			}
			qphi = Q.Pointer.hint.imgs = [];
		}
		img1 = document.createElement('img');
		img1.setAttribute('src', Q.url(o.src));
		img1.style.position = 'absolute';
		img1.style.width = o.width;
		img1.style.height = o.height;
		img1.style.display = 'block';
		img1.style.pointerEvents = 'none';
		img1.setAttribute('class', 'Q_hint');
		img1.style.opacity = 0;
		img1.hide = o.hide;
		img1.dontStopBeforeShown = o.dontStopBeforeShown;
		qphi.push(img1);
		body.appendChild(img1);
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
				if (Q.isArrayLike(targets)) {
					img1.target = targets[0];
					for (i=1, l=targets.length; i<l; ++i) {
						var img2 = img1.cloneNode(false);
						img2.hide = img1.hide;
						img2.dontStopBeforeShown = img1.dontStopBeforeShown;
						img2.target = targets[i];
						img2.timeout = false;
						imgs.push(img2);
						Q.Pointer.hint.imgs.push(img2);
						body.appendChild(img2);
					}
				} else {
					img1.target = targets;
				}
				Q.each(imgs, function (i, img) {
					if (typeof img.target === 'string') {
						img.target = document.querySelector(target);
					}
					img1.timeout = false;
					var point;
					var target = img.target;
					if (Q.instanceOf(target, Element)) {
						if (!target.isVisible()) {
							if (img.parentNode) {
								img.parentNode.removeChild(img);
							}
							return; // perhaps it disappeared
						}
						var offset = Q.Pointer.offset(target);
						point = {
							x: offset.left + target.offsetWidth / 2,
							y: offset.top + target.offsetHeight / 2
						};
					} else {
						point = target;
					}
					img.style.display = 'block';
					img.style.left = point.x - img.offsetWidth * o.hotspot.x + 'px';
					img.style.top = point.y - img.offsetHeight * o.hotspot.y + 'px';
					img.style.zIndex = o.zIndex;
					var width = parseInt(img.style.width);
					var height = parseInt(img.style.height);
					Q.Animation.play(function (x, y) {
						img.style.opacity = y;
						if (o.show.initialScale !== 1) {
							var z = 1 + (o.show.initialScale - 1) * (1 - y);
							var w = width * z;
							var h = height * z;
							img.style.width = w + 'px';
							img.style.height = h + 'px';
							img.style.left = point.x - w * o.hotspot.x + 'px';
							img.style.top = point.y - h * o.hotspot.y + 'px';
						}
					}, o.show.duration, o.show.ease);
				});
			}, o.show.delay);
		}));
		if (!Q.Pointer.hint.addedListeners) {
			Q.addEventListener(window, Q.Pointer.start, Q.Pointer.stopHints, false, true);
			Q.addEventListener(window, 'keydown', Q.Pointer.stopHints, false, true);
			Q.addEventListener(document, 'scroll', Q.Pointer.stopHints, false, true);
			Q.Pointer.hint.addedListeners = true;
		}
		if (options.waitForEvents) {
			return;
		}
		if (img1.complete) {
			imageEvent.handle();
		} else {
			img1.onload = imageEvent.handle;
		}
		var a = options.audio || {};
		if (a.src) {
			Q.audio(a.src, function () {
				img1.audio = this;
				this.play(a.from || 0, a.until, a.removeAfterPlaying);
				audioEvent.handle();
			});
		} else if (!options.waitForEvents) {
			audioEvent.handle();
		}
	},
	/**
	 * Stops any hints that are currently being displayed
	 * @static
	 * @method stopHints
	 * @param {HTMLElement} [container] If provided, only hints for elements in this container are stopped.
	 */
	stopHints: function (container) {
		var imgs = Q.Pointer.hint.imgs;
		var imgs2 = [];
		Q.each(imgs, function (i, img) {
			var outside = (
				Q.instanceOf(container, Element)
				&& !container.contains(img.target)
			);
			if ((img.timeout !== false && img.dontStopBeforeShown)
			|| outside) {
				imgs2.push(img);
				return;
			}
			if (img.audio) {
				img.audio.pause();
			}
			clearTimeout(img.timeout);
			img.timeout = null;
			Q.Animation.play(function (x, y) {
				img.style.opacity = 1-y;
			}, img.hide.duration, img.hide.ease)
			.onComplete.set(function () {
				if (img.parentNode) {
					img.parentNode.removeChild(img);
				}
			});
		});
		Q.Pointer.hint.imgs = imgs2;
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
	 * setting Q.Pointer.canceledClick to true.
	 * However, this canceling itself can be canceled by a handler
	 * returning false.
	 * @static
	 * @method cancelClick
	 * @param {Q.Event} event Some mouse or touch event from the DOM
	 * @param {Object} extraInfo Extra info to pass to onCancelClick
	 * @return {boolean}
	 */
	cancelClick: function (event, extraInfo) {
		if (false === Q.Pointer.onCancelClick.handle(event, extraInfo)) {
			return false;
		}
		Q.Pointer.canceledClick = true;	
	},
	/**
	 * Consistently obtains the element under pageX and pageY relative to document
	 * @static
	 * @method elementFromPoint
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	elementFromPoint: function (pageX, pageY) {
		return document.elementFromPoint(
			pageX - Q.Pointer.scrollLeft(),
			pageY - Q.Pointer.scrollTop()
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
			Q.addEventListener(window, 'touchmove', _touchScrollingHandler, false, true);
		}
	},
	/**
	 * Can restore touch scrolling after preventRubberBand() was called
	 * @method restoreRubberBand
	 */
	restoreRubberBand: function () {
		Q.removeEventListener(window, 'touchmove', _touchScrollingHandler, false, true);
	},
	/**
	 * Call this function to begin blurring active elements when touching outside them
	 * @method startBlurringOnTouch
	 */
	startBlurringOnTouch: function (options) {
		Q.addEventListener(window, 'touchstart', _touchBlurHandler, false, true);
	},
	/**
	 * Call this function to begin blurring active elements when touching outside them
	 * @method startBlurringOnTouch
	 */
	stopBlurringOnTouch: function (options) {
		Q.removeEventListener(window, 'touchstart', _touchBlurHandler, false, true);
	},
	/**
	 * This event occurs when a click has been canceled, for one of several possible reasons.
	 * @static
	 * @event onCancelClick
	 */
	onCancelClick: new Q.Event(),
	/**
	 * This event occurs when touching or mouse pressing should have ended
	 * @static
	 * @event onEnded
	 */
	onEnded: new Q.Event(),
	/**
	 * This event occurs when touching or mouse pressing should have started
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

Q.Pointer.which.LEFT = 1;
Q.Pointer.which.MIDDLE = 2;
Q.Pointer.which.RIGHT = 3;
Q.Pointer.touchclick.duration = 400;
Q.Pointer.hint.options = {
	src: 'plugins/Q/img/hints/tap.gif',
	hotspot:  {x: 0.5, y: 0.3},
	width: "50px",
	height: "50px",
	zIndex: 99999,
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
Q.Pointer.hint.imgs = [];

function _Q_restoreScrolling() {
	if (!Q.info || !Q.info.isTouchscreen) return false;
	var body = document.getElementsByTagName('body')[0];
	var lastScrollLeft, lastScrollTop;
	var focused = false;
	setInterval(function _Q_saveScrollPositions() {
		var ae = document.activeElement;
		var b = _Q_restoreScrolling.options.prevent;
		if (b.indexOf(ae.tagName.toUpperCase()) >= 0) {
			focused = true;
		}
		if (focused) return false;
		lastScrollTop = Q.Pointer.scrollTop();
		lastScrollLeft = Q.Pointer.scrollLeft();
	}, 300);
	Q.addEventListener(body, Q.Pointer.focusin, function _Q_body_focusin() {
		focused = true;
	});
	Q.addEventListener(body, Q.Pointer.focusout, function _Q_body_focusout() {
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
	Q.Pointer.started = Q.Pointer.target(e);
	Q.Pointer.canceledClick = false;
	Q.addEventListener(window, Q.Pointer.move, _onPointerMoveHandler, false, true);
	Q.addEventListener(window, Q.Pointer.end, _onPointerEndHandler, false, true);
	Q.addEventListener(window, Q.Pointer.cancel, _onPointerEndHandler, false, true);
	Q.handle(Q.Pointer.onStarted, this, arguments);
	var screenX = Q.Pointer.getX(e) - Q.Pointer.scrollLeft();
	var screenY = Q.Pointer.getY(e) - Q.Pointer.scrollTop();
	_pos = { // first movement
		x: screenX,
		y: screenY
	};
	_dist = _last = _lastTimestamp = _lastVelocity = null;
	Q.Pointer.movement = {
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
	var screenX = Q.Pointer.getX(evt) - Q.Pointer.scrollLeft();
	var screenY = Q.Pointer.getY(evt) - Q.Pointer.scrollTop();
	if (!screenX || !screenY || Q.Pointer.canceledClick) {
		return;
	}
	var ccd = Q.Pointer.options.cancelClickDistance;
	if (_pos
	&& ((_pos.x && Math.abs(_pos.x - screenX) > ccd)
	 || (_pos.y && Math.abs(_pos.y - screenY) > ccd))) {
		// finger moved more than the threshhold
		if (false !== Q.Pointer.cancelClick(evt, {
			fromX: _pos.x,
			fromY: _pos.y,
			toX: screenX,
			toY: screenY,
			comingFromPointerMovement: true
		})) {
			_pos = false;
		}
	}
	var _timestamp = Q.milliseconds();
	Q.Pointer.movement.times.push(_timestamp);
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
		Q.Pointer.movement.velocities.push(velocity);
		if (_lastVelocity != null) {
			Q.Pointer.movement.accelerations.push({
				x: (velocity.x - _lastVelocity.x) / _timeDiff,
				y: (velocity.y - _lastVelocity.y) / _timeDiff
			});
		}
		_lastVelocity = velocity;
		var times = Q.Pointer.movement.times;
		var velocities = Q.Pointer.movement.velocities;
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
		Q.Pointer.movement.movingAverageVelocity = tDiff
			? { x: totalX / tDiff, y: totalY / tDiff }
			: Q.Pointer.movement.velocities[velocities.length-1];
		_pointerMoveTimeout = setTimeout(function () {
			// no movement for a while
			var noMovement = {x: 0, y: 0};
			var _timestamp = Q.milliseconds();
			var _timeDiff = _timeDiff - _lastTimestamp;
			var movement = Q.Pointer.movement;
			movement.times.push(_timestamp);
			movement.velocities.push(noMovement);
			movement.movingAverageVelocity = noMovement;
			movement.accelerations.push({
				x: -velocity.x / _timeDiff,
				y: -velocity.y / _timeDiff
			});
		}, Q.Pointer.movement.timeout);
	}
	_lastTimestamp = _timestamp;
	_last = {
		x: screenX,
		y: screenY
	};
	Q.Pointer.movement.positions.push(_last);

}

/**
 * Removes event listeners that are activated when the pointer has started.
 * This method is called automatically when the mouse or fingers are released
 * on the window. However, in the code that stops propagation of the Q.Pointer.end
 * event (mouseup or touchend), you'd have to call this method manually.
 * @method ended
 * @static
 */
var _onPointerEndHandler = Q.Pointer.ended = function _onPointerEndHandler() {
	setTimeout(function () {
		Q.Pointer.started = null;
	}, 0);
	clearTimeout(_pointerMoveTimeout);
	Q.removeEventListener(window, Q.Pointer.move, _onPointerMoveHandler);
	Q.removeEventListener(window, Q.Pointer.end, _onPointerEndHandler);
	Q.removeEventListener(window, Q.Pointer.cancel, _onPointerEndHandler);
	Q.handle(Q.Pointer.onEnded, this, arguments);
	setTimeout(function () {
		Q.Pointer.canceledClick = false;
	}, 100);
};

function _onPointerBlurHandler() {
	Q.Pointer.blurring = true;
	setTimeout(function () {
		Q.Pointer.blurring = false;
	}, 500); // for touchscreens that retry clicks after keyboard disappears
};

/**
 * Operates with dialogs.
 * @class Q.Dialogs
 */
Q.Dialogs = {

	options: {
		topMargin: '10%', // in percentage	
		bottomMargin: '10%' // or in absolute pixel values
	},
	
	dialogs: [], // stack of dialogs that is currently being shown
	
	/**
	 * Shows the dialog and pushes it on top of internal dialog stack.
	 * @static
     * @method push
	 * @param {Object} options A hash of options, that can include:
     * @param {boolean} [options.apply] Optional. Set to true if the dialog 
	 *  should show the "apply" style button to close dialog
	 * @param {Element|jQuery} [options.dialog] If provided, may be Element or 
	 *   jQuery object containing already prepared dialog html
	 *	 structure with 'Q_title_slot', 'Q_dialog_slot' and appropriate content in them. 
	 *   If it's provided, then 'title' and 'content' options given below are ignored.
	 *	@param {String} [options.url] Optional. If provided, this url will be used 
	 *   to fetch the "title" and "dialog" slots, to display in the dialog. 
	 *   Thus the default content provided by 'title' and 'content' options
	 *   given below will be replaced after the response comes back.
	 *	@param {String|Element} [options.title='Dialog'] initial dialog title.
	 *	@param {String|Element} [options.content] initial dialog content, defaults to 
	 *   loading and displaying a throbber immage.
	 *  @param {String} [options.className] a CSS class name or 
	 *   space-separated list of classes to append to the dialog element.
	 *  @param {String} [options.mask] Default is true unless fullscreen option is true. If true, adds a mask to cover the screen behind the dialog. If a string, this is passed as the className of the mask.
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
	 *  @param {boolean} [options.removeOnClose] Defaults to false if "dialog" is provided, and true otherwise. If true, dialog DOM element will be removed from the document on close.
	 *  @param {Q.Event} [options.beforeLoad]  Q.Event or function which is called before dialog is loaded.
	 *  @param {Q.Event} [options.onActivate] Q.Event or function which is called when dialog is activated (all inner tools, if any, are activated and dialog is fully loaded and shown).
	 *  @param {Q.Event} [options.beforeClose] Optional. Q.Event or function which is called when dialog closing initiated but it's still visible and exists in DOM.
	 *  @param {Q.Event} [options.onClose] Optional. Q.Event or function which is 
	 *   called when dialog is closed and hidden and probably 
	 *   removed from DOM (if 'removeOnClose' is 'true').
	 * @return {Object} jQuery object representing DOM element of the dialog that was just pushed.
	 */
	push: function(options) {
		var maskDefault = true;
		for (var i = 0; i < this.dialogs.length; i++) {
			if (!this.dialogs[i].isFullscreen) maskDefault = false;
		}
		var o = Q.extend({mask: maskDefault}, Q.Dialogs.push.options, options);
		if (o.fullscreen) o.mask = false;
		var $dialog = $(o.dialog);
		if (!$dialog.length) {
			// create this dialog element
			$dialog = $('<div />').append(
				$('<div class="Q_title_slot" />')
				.append($('<h2 class="Q_dialog_title" />')
				.append(o.title))
			).append(
				$('<div class="Q_dialog_slot Q_dialog_content" />').append(o.content)
			);
			if (o.className) $dialog.addClass(o.className);
			if (o.apply) $dialog.addClass('Q_overlay_apply');
			if (o.removeOnClose !== false) {
				o.removeOnClose = true;
			}
		}
		$dialog.hide();
		//if ($dialog.parent().length == 0) {
			$(o.appendTo || $('body')[0]).append($dialog);
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
		$dialog.isFullscreen = o.fullscreen;
		if (this.dialogs.length) {
			topDialog = this.dialogs[this.dialogs.length - 1];
		}
		if (!topDialog || topDialog[0] !== $dialog[0]) {
			this.dialogs.push($dialog);
			if (o.hidePrevious && topDialog) {
				topDialog.hide();
			}
		}
		return $dialog;
	},
	
	/**
	 * Closes dialog and removes it from top of internal dialog stack.
	 * @static
     * @method pop
	 * @param {boolean} dontTriggerClose is for internal use only
	 * @return {Object}  jQuery object representing DOM element of the dialog that was just popped.
	 */
	pop: function(dontTriggerClose) {
		if (dontTriggerClose === undefined) {
			dontTriggerClose = false;
		}
		
		var $dialog = this.dialogs.pop();
		if (this.dialogs.length) {
			this.dialogs[this.dialogs.length - 1].show();
		}
		if (!dontTriggerClose && $dialog) {
			Q.Dialogs.dontPopOnClose = true;
			if ($dialog.data('Q/overlay')) {
				$dialog.data('Q/overlay').close();
			} else if ($dialog.data('Q/dialog')) {
				$dialog.data('Q/dialog').close();
			}
		}
		if (!this.dialogs.length) {
			Q.Masks.hide('Q.screen.mask');
		}
		return $dialog;
	}

};

Q.Dialogs.push.options = {
	dialog: null,
	url: null,
	title: 'Dialog',
	content: '',
	className: null,
	fullscreen: Q.info.isAndroidStock && Q.info.isAndroid(undefined, 1000),
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
 * @param {Object} [options] An optiopnal hash of options which can include:
 *   @param {String} [options.title] Optional parameter to override alert dialog title. Defaults to 'Alert'.
 *   @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.alert = function(message, options) {
	if (options === undefined) options = {};
	if (options.title === undefined) options.title = 'Alert';
	return Q.Dialogs.push(Q.extend({
		'title': options.title,
		'content': '<div class="Q_messagebox Q_big_prompt"><p>' + message + '</p></div>',
		'className': 'Q_alert',
		'onClose': options.onClose || undefined,
		'fullscreen': false,
		'hidePrevious': false
	}, options));
};

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
 * @param {Object} [options] An optiopnal hash of options which can include:
 * @param {String} [options.title='Confirm'] to override confirm dialog title.
 * @param {String} [options.ok='OK'] to override confirm dialog 'Ok' button label, e.g. 'Yes'.
 * @param {String} [options.cancel='Cancel'] to override confirm dialog 'Cancel' button label, e.g. 'No'.
 * @param {boolean} [options.noClose=true] set to false to show a close button
 * @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.confirm = function(message, callback, options) {
	var o = Q.extend({}, Q.confirm.options, options);
	var buttonClicked = false;
	var $dialog = Q.Dialogs.push(Q.extend({
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
		'hidePrevious': false
	}, options));
	$dialog.find('.Q_buttons button:first').on(Q.Pointer.end, function() {
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, root, [true]);
	});
	$dialog.find('.Q_buttons button:last').on(Q.Pointer.end, function() {
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, root, [false]);
	});
	return $dialog;
};

Q.confirm.options = {
	title: 'Confirm',
	ok: 'OK',
	cancel: 'Cancel',
	noClose: true
};

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
 * @param {Object} [options] An optiopnal hash of options which can include:
 * @param {String} [options.title='Prompt'] to override confirm dialog title.
 * @param {String} [options.placeholder=''] to set a placeholder in the textbox
 * @param {String} [options.ok='OK'] to override confirm dialog 'Ok' button label, e.g. 'Yes'.
 * @param {String} [options.cancel='Cancel'] to override confirm dialog 'Cancel' button label, e.g. 'No'.
 * @param {boolean} [options.noClose=true] set to false to show a close button
 * @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.prompt = function(message, callback, options) {
	function _done() {
		buttonClicked = true;
		var value = $dialog.find('input').val();
		Q.Dialogs.pop();
		Q.handle(callback, this, [value]);
	}
	if (options === undefined) options = {};
	var o = Q.extend({}, Q.prompt.options, options);
	var buttonClicked = false;
	var $dialog = Q.Dialogs.push(Q.extend({
		'title': o.title,
		'content': $('<div class="Q_messagebox Q_big_prompt" />').append(
			$('<p />').html(message),
			$('<div class="Q_buttons" />').append(
				$('<input type="text" />').attr('placeholder', o.placeholder), ' ',
				$('<button class="Q_messagebox_done Q_button" />').html(o.ok)
			)
		),
		'className': 'Q_prompt',
		'onActivate': function(dialog) {
			var field = dialog.find('input');
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
		},
		'onClose': {'Q.prompt': function() {
			if (!buttonClicked) Q.handle(callback, this, [null]);
		}},
		'fullscreen': false,
		'hidePrevious': false
	}, options));
	$dialog.find('button').on(Q.Pointer.click, _done);
	return $dialog;
};
Q.prompt.options = {
	title: 'Prompt',
	ok: 'OK',
	placeholder: '',
	noClose: true
};

/**
 * Q.Audio objects facilitate audio functionality on various browsers.
 * Please do not create them directly, but use the Q.audio function.
 * @class Q.Audio
 * @constructor
 * @param {String} url the url of the audio to load
 */
Q.Audio = function (url) {
	if (this === root) {
		throw new Q.Error("Please call Q.Audio with the keyword new");
	}
	var t = this;
	this.src = url = Q.url(url);
	var container = document.getElementById('Q-audio-container');
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
	function _handler(e) {
		var event = (e.type === 'canplay' ? Aup.onCanPlay : (
			(e.type === 'canplaythrough' ? Aup.onCanPlayThrough : Aup.onEnded)
		));
		event.handle.call(t, [e]);
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

var Aup = Q.Audio.prototype;
Aup.onCanPlay = new Q.Event();
Aup.onCanPlayThrough = new Q.Event();
Aup.onEnded = new Q.Event();

/**
 * @method play
 * Plays the audio as soon as it is available
 * @param {number} [from] The time, in seconds, from which to start.
 * @param {number} [until] The time, in seconds, until which to play.
 * @param {boolean} [removeAfterPlaying]
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
	return t;
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
	return t;
};

/**
 * @method pause
 * Pauses the audio if it is playing
 */
Q.Audio.pauseAll = function () {
	for (var url in Q.Audio.collection) {
		Q.Audio.collection[url].pause();
	}
};

/**
 * @class Q
 */

/**
 * Loads an audio file and calls the callback when it's ready to play
 * @static
 * @method audio
 * @param {String} url 
 * @param {Function} handler A function to run after the audio is ready to play
 * @param {Object} [options={}] Can be one of the following options
 * @param {boolean} [options.canPlayThrough=true] Whether to wait until the audio can play all the way through before calling the handler.
 */
Q.audio = Q.getter(function _Q_audio(url, handler, options) {
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
	 * @param {number} [options.zIndex] You can override the mask's default z-index here
	 * @param {String} [options.html=''] Any HTML to insert into the mask.
	 * @param {HTMLElement} [options.shouldCover=null] Optional element in the DOM to cover.
	 * @return {Object} the mask info
	 */
	mask: function(key, options)
	{
		key = Q.calculateKey(key);
		if (key in Q.Masks.collection) {
			return Q.Masks.collection[key];
		}
		var mask = Q.Masks.collection[key] = Q.extend({
			'fadeTime': 0,
			'shouldCover': null
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
	 */
	show: function(key, options)
	{
		if (Q.typeOf(key) === 'Q.Tool')	{
			key.Q.beforeRemove.set(function () {
				Q.Masks.hide(key);
			}, key);
		}
		key = Q.calculateKey(key);
		var mask = Q.Masks.mask(key, options);
		if (!mask.counter) {
			var me = mask.element;
			me.style.display = 'block';
			if (mask.fadeIn) {
				var opacity = me.computedStyle().opacity;
				Q.Animation.play(function (x, y) {
					me.style.opacity = y * opacity;
				}, mask.fadeIn);
				me.style.opacity = 0;
			}
		}
		++mask.counter;
		Q.Masks.update(key);
	},
	/**
	 * Hides the mask by given key. If mask with given key doesn't exist, fails silently.
	 * @static
	 * @method hide
	 * @param {String} key A key of the mask to hide.
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
				var opacity = me.computedStyle().opacity;
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
		var collection = {};
		if (key) {
			collection[key] = true;
		} else {
			collection = Q.Masks.collection;
		}
		for (var k in collection) {
			var mask = Q.Masks.collection[k];
			if (!mask.counter) continue;
			var html = document.documentElement;
			var offset = $('body').offset();
			var scrollLeft = Q.Pointer.scrollLeft() - offset.left;
			var scrollTop = Q.Pointer.scrollTop() - offset.top;
			var ms = mask.element.style;
			var rect = (mask.shouldCover || html).getBoundingClientRect();
			mask.rect = {
				'left': rect.left,
				'right': rect.right,
				'top': rect.top,
				'bottom': rect.bottom
			};
			if (!mask.shouldCover) {
				mask.rect.right = Math.max(mask.rect.right, Q.Pointer.windowWidth());
				mask.rect.bottom = Math.max(mask.rect.bottom, Q.Pointer.windowHeight());
				var body = document.getElementsByTagName('body')[0];
				Q.each(body.children || body.childNodes, function () {
					if (!this.hasClass || this.hasClass('Q_mask')) return;
					var rect = this.getBoundingClientRect();
					if (!rect || rect.right - rect.left == 0) return;
					mask.rect.left = Math.min(mask.rect.left, rect.left);
					mask.rect.top = Math.min(mask.rect.top, rect.top);
					mask.rect.right = Math.max(mask.rect.right, rect.right);
					mask.rect.bottom = Math.max(mask.rect.bottom, rect.bottom);
				});
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
	'Q.screen.mask': { className: 'Q_screen_mask', fadeIn: 100 },
	'Q.request.load.mask': { className: 'Q_load_data_mask', fadeIn: 200 },
	'Q.request.cancel.mask': { className: 'Q_cancel_mask', fadeIn: 200 }
};

Q.addEventListener(window, Q.Pointer.start, _Q_PointerStartHandler, false, true);

function noop() {}
if (!root.console) {
	// for irregular browsers like IE8 and below
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
 * @method processStylesheets
 */
function processStylesheets() {
	// Complain about some other libraries if necessary
	if (Q.findScript('plugins/Q/js/prefixfree.min.js')) {
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
	if (!Q.info.baseUrl) {
		throw new Q.Error("Please define Q.info.baseUrl before calling Q.init()");
	}
	Q_hashChangeHandler.currentUrl = window.location.href.split('#')[0]
		.substr(Q.info.baseUrl.length + 1);
	if (window.history.pushState) {
		Q.onPopState.set(Q_popStateHandler, 'Q.loadUrl');
	} else {
		Q.onHashChange.set(Q_hashChangeHandler, 'Q.loadUrl');
	}
	Q.onReady.set(function () {
		// renew sockets when reverting to online
		Q.onOnline.set(Q.Socket.reconnectAll, 'Q.Socket');
	}, 'Q.Socket');
	
	//jQuery Tools tooltip and validator plugins configuration
	var tooltipConf = Q.getObject("jQuery.tools.tooltip.conf", root);
	if (tooltipConf) {
		tooltipConf.tipClass = 'Q_tooltip';
		tooltipConf.effect = 'fade';
		tooltipConf.opacity = 1;
		tooltipConf.position = 'bottom center';
		tooltipConf.offset = [0, 0];
	}
	var validatorConf = Q.getObject("jQuery.tools.validator.conf", root);
	if (validatorConf) {
		validatorConf.errorClass = 'Q_errors';
		validatorConf.messageClass = 'Q_error_message';
		validatorConf.position = 'bottom left';
		validatorConf.offset = [0, 0];
	}
	// end of jQuery Tools configuration
	
}, 'Q');

Q.onJQuery.add(function ($) {
	
	Q.Tool.define({
		"Q/inplace": "plugins/Q/js/tools/inplace.js",
		"Q/tabs": "plugins/Q/js/tools/tabs.js",
		"Q/form": "plugins/Q/js/tools/form.js",
		"Q/panel": "plugins/Q/js/tools/panel.js",
		"Q/ticker": "plugins/Q/js/tools/ticker.js",
		"Q/timestamp": "plugins/Q/js/tools/timestamp.js",
		"Q/bookmarklet": "plugins/Q/js/tools/bookmarklet.js",
		"Q/columns": "plugins/Q/js/tools/columns.js",
		"Q/drawers": "plugins/Q/js/tools/drawers.js",
		"Q/expandable": "plugins/Q/js/tools/expandable.js",
		"Q/filter": "plugins/Q/js/tools/filter.js",
		"Q/rating": "plugins/Q/js/tools/rating.js"
	});
	
	Q.Tool.jQuery({
		"Q/placeholders": "plugins/Q/js/fn/placeholders.js",
		"Q/textfill": "plugins/Q/js/fn/textfill.js",
		"Q/autogrow": "plugins/Q/js/fn/autogrow.js",
		"Q/dialog": "plugins/Q/js/fn/dialog.js",
		"Q/flip": "plugins/Q/js/fn/flip.js",
		"Q/gallery": "plugins/Q/js/fn/gallery.js",
		"Q/zoomer": "plugins/Q/js/fn/zoomer.js",
		"Q/fisheye": "plugins/Q/js/fn/fisheye.js",
		"Q/listing": "plugins/Q/js/fn/listing.js",
		"Q/hautoscroll": "plugins/Q/js/fn/hautoscroll.js",
		"Q/imagepicker": "plugins/Q/js/fn/imagepicker.js",
		"Q/viewport": "plugins/Q/js/fn/viewport.js",
		"Q/actions": "plugins/Q/js/fn/actions.js",
		"Q/clickable": "plugins/Q/js/fn/clickable.js",
		"Q/clickfocus": "plugins/Q/js/fn/clickfocus.js",
		"Q/contextual": "plugins/Q/js/fn/contextual.js",
		"Q/scrollIndicators": "plugins/Q/js/fn/scrollIndicators.js",
		"Q/iScroll": "plugins/Q/js/fn/iScroll.js",
		"Q/scroller": "plugins/Q/js/fn/scroller.js",
		"Q/touchscroll": "plugins/Q/js/fn/touchscroll.js",
		"Q/scrollbarsAutoHide": "plugins/Q/js/fn/scrollbarsAutoHide.js",
		"Q/sortable": "plugins/Q/js/fn/sortable.js"
	});
	
	Q.onLoad.add(function () {
		// Start loading some plugins asynchronously after document loads.
		// We may need them later.
		$.fn.plugin.load([
			'Q/clickfocus', 
			'Q/contextual', 
			'Q/scrollIndicators', 
			'Q/iScroll', 
			'Q/scroller', 
			'Q/touchscroll'
		]);
	});
	
	if ($ && $.tools && $.tools.validator && $.tools.validator.conf) {
		$.tools.validator.conf.formEvent = null; // form validator's handler irresponsibly sets event.target to a jquery!
	}
		
}, 'Q');

function _addHandlebarsHelpers() {
	var Handlebars = root.Handlebars;
	if (!Handlebars.helpers.call) {
		Handlebars.registerHelper('call', function(path) {
			if (!path) {
				return "{{call missing method name}}";
			}
			var args = Array.prototype.slice.call(
				arguments, 1, arguments.length-1
			);
			var parts = path.split('.');
			var subparts = parts.slice(0, -1);
			var f = Q.getObject(parts, this);
			if (typeof f === 'function') {
				return f.apply(Q.getObject(subparts, this), args);
			}
			var f = Q.getObject(parts);
			if (typeof f === 'function') {
				return f.apply(Q.getObject(subparts), args);
			}
			return "{{call '"+path+"' not found}}";
		});
	}
	if (!Handlebars.helpers.tool) {
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
			if (hash) {
				for (var k in hash) {
					Q.setObject(k, hash[k], o, '-');
				}
			}
			if (this && this[name]) {
				Q.extend(o, this[name]);
			}
			if (id && this && this['id:'+id]) {
				Q.extend(o, this['id:'+id]);
			}
			if (typeof id === 'string' || typeof id === 'number') {
				id = prefix + name.split('/').join('_') + (id !== '' ? '-'+id : '');
			}
			return Q.Tool.setUpElementHTML(tag, name, o, id, prefix);
		});
	}
	if (!Handlebars.helpers.url) {
		Handlebars.registerHelper('toUrl', function (url) {
			if (!url) {
				return "{{url missing}}";
			}
			return Q.url(url);
		});
	}
	if (!Handlebars.helpers.toCapitalized) {
		Handlebars.registerHelper('toCapitalized', function(text) {
			text = text || '';
			return text.charAt(0).toUpperCase() + text.slice(1);
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

function _Q_loadUrl_fillSlots (res, url, options) {
	var elements = {}, name, elem, pos;
	var osc = options.slotContainer;
	if (Q.isPlainObject(osc)) {
		options.slotContainer = function (slotName) {
			return osc[slotName] || document.getElementById(slotName+"_slot");
		};
	}
	for (name in res.slots) {
		// res.slots will simply not contain the slots that have
		// already been "cached"

		if (name.toUpperCase() === 'TITLE') {
			document.title = res.slots[name];
		} else if (elem = options.slotContainer(name, res)) { 
			try {
				Q.replace(elem, res.slots[name], options);
				if (pos = Q.getObject(['Q', 'scroll', url], elem)) {
					elem.scrollLeft = pos.left;
					elem.scrollTop = pos.top;
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
	onLoadStart: new Q.Event(Q.loadUrl.saveScroll, 'Q'),
	onLoadEnd: new Q.Event(),
	onActivate: new Q.Event(),
	slotNames: [],
	slotContainer: function (slotName) {
		return document.getElementById(slotName+"_slot");
	},
	handler: _Q_loadUrl_fillSlots,
	key: 'Q'
};

Q.request.options = {
	duplicate: true,
	quiet: true,
	parse: 'json',
	handleRedirects: function (url) {
		Q.handle(url, {
			target: '_self',
			quiet: true
		});
	},
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
			button.setAttribute('class', 'Q_load_cancel_button');
			button.innerHTML = 'Cancel';
			if (mask[0]) { mask = mask[0]; }
			mask.appendChild(button);
		}
		$(button).off(Q.Pointer.end).on(Q.Pointer.end, callback);
		Q.Masks.show('Q.request.cancel.mask');
	}, 'Q.request.load.mask');
	Q.request.options.onLoadEnd.set(function(url, slotNames, o) {
		if (o.quiet) return;
		Q.Masks.hide('Q.request.load.mask');
		Q.Masks.hide('Q.request.cancel.mask');
	}, 'Q.request.load.mask');
	Q.layout();
}, 'Q.Masks');

if (typeof module !== 'undefined' && typeof process !== 'undefined') {
	// Assume we are in a Node.js environment, e.g. running tests
	module.exports = Q;
} else if (!dontSetGlobals) {
	// We are in a browser environment
	/**
	 * This method restores the old window.Q and returns an instance of itself.
     * @method Q.noConflict
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

/**
 * Can be used to construct another instance of Q
 * (possibly alongside other instances in the document).
 * This is typically followed by calling Q2.extend(Q2, ...)
 * to set some properties, followed by a call to Q2.init();
 * Useful e.g. for bookmarklets and other javascript widgets.
 * @method anotherQ
 * @static
 * @return {Function} Another instance of Q
 */
Q.anotherQ = function () {
	return _Q_setup.call(root, undefined, true); 
};

Q.globalNames = Object.keys(root); // to find stray globals
Q.globalNamesAdded = function () {
	return Q.diff(Object.keys(window), Q.globalNames);
};

return Q;

}).call(this);