(function (window) {

/**
 * Class for Q object
 * @class Q
 * @constructor
 * @param {Function} callback , This callback function fires after Q object creation
 */

if (!window.Q) {
	Q = function (callback) {
		priv.init(function () {
			callback(Q);
		});
	}
}

Q.baseUrl = "http://gmba.local/Trump"; // "http://platform.qbix.com";

/**
 * @method Q.verify
 * @param data Object
 *  The data to verify. Should contain "signature" property,
 *  which would contain two properties of its own:
 *  "time" - the time signed
 *  "hmac" - the hash-based message authentication code
 * @param signature Object
 *  Optional, overrides the signature property in the data object.
 */
Q.verify = function (data, signature) {
	signature = signature || data.signature;
	if (!signature.hmac) {
		throw new Error("Q.verify: signature is missing hmac");
	}
	if (!signature.time) {
		throw new Error("Q.verify: signature is missing time");
	}
	if (typeof(data) === 'object') {
		var temp = [];
		for (var k in data) {
			temp.push('k='+data);
		}
		data = temp.join('&');
	}
	data += '&sig.time='+signature.time;
	return (signature.hmac === priv.md5(data));
};

/**
 * Returns the computed style of an element
 * @method computedStyle
 * @param {Element} [element] The element whose style to compute
 * @param {String} [name] If provided, the value of a property is returned instead of the whole style object.
 * @return {Object|String}
 */
Q.computedStyle = function(element, name) {
	var computedStyle = window.getComputedStyle
		? getComputedStyle(element, null)
		: element.currentStyle;
	return name
		? (computedStyle ? computedStyle[name] : null)
		: computedStyle;
};

var _iframeCount = 0;

function _isArrayLike(element) {
	return element.length && (!element.length || ((element.length-1) in element))
};

/**
 * Parses Qbix HTML
 * @method parse
 * @static
 * @param {HTMLElement} element
 * @param {Function} callback
 *  Parameters:
 *  1: Error, if any
 *  2: The iframe element containing HTML hosted on the homeAppUrl domain
 * @param options
 *  Optional object with possible keys:
 *  "stylesheet": Path to a CSS file to add
 */
Q.parse = function (element, callback, options) {
	if (_isArrayLike(element)) {
		var l = element.length;
		var remaining = l;
		for (var i=0; i<l; ++i) {
			Q.parse(element[i], function (err, iframe) {
				if (err) {
					remaining = 0;
					return callback(err);
				}
				if (--remaining === 0) {
					callback(null, iframe);
				}
			}, options);
		}
		return;
	}
	var url = Q.Users.homeAppUrl + '/Platform/iframe';
	var cs = Q.computedStyle(element);
	var params = {
		html: element.innerHTML
	};
	if (options && options.stylesheet) {
		params.stylesheet = options.stylesheet;
	}
	var iframe = priv.formPost(url, params, 'post', null, element);
	iframe.style.width = cs.width;
	iframe.style.height = cs.height;
	iframe.style.display = 'block';
	iframe.setAttribute('class', 'Q_iframe');
};

/**
 * Initializes the Q 
 * @method Q.init
 */
Q.init = function () {
	
};

/**
 * Returns the type of a value
 * @method Q.typeOf
 * @param value
 * @return {String} type of value
 */
Q.typeOf = function (value) {
	var s = typeof value;
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		if (value instanceof Array
		|| (value.constructor && value.constructor.name === 'Array')) {
			s = 'array';
		} else if (typeof(value.typename) != 'undefined' ) {
			return value.typename;
		} else if (typeof(value.constructor) != 'undefined'
		&& typeof(value.constructor.name) != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			return value.constructor.name;
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * @method Q.handle
 * @param callables
 *  The callables to call
 * @param context
 *  The context in which to call them
 * @param args
 *  An array of arguments to pass to them 
 * @param post
 *  An object containing fields to post if callables is a URL
 * @return {number}
 *  The number of handlers executed
 */
Q.handle = function(callables, context, args, post) {
	var i=0, count=0;
	switch (Q.typeOf(callables)) {
	 case 'function':
		if (context) {
			if (typeof(args) !== 'undefined') {
				callables.apply(context, args);
			} else {
				callables.apply(context);
			}
		} else {
			if (typeof(args) !== 'undefined') {
				callables.apply(null, args);
			} else {
				callables();
			}
		}
		return 1;
	 case 'array':
		for (i=0; i<callables.length; ++i) {
			count += Q.handle(callables[i], context, args);
		}
		return count;
	 case 'Q.Event':
		for (i=0; i<callables.keys.length; ++i) {
			count += Q.handle(callables.handlers[ callables.keys[i] ], context, args);
		}
		return count;
	 case 'object':
		for (k in callables) {
			count += Q.handle(callables[k], context, args);
		}
		return count;
	 case 'string':
		if (callables.substr(0, 7) == 'http://' || callables.substr(0, 8) == 'https://') {
			if (Q.typeOf(post) === 'object') {
				var form = document.createElement('form');
				var parts = Q.serializeFields(post).split('&');
				form.setAttribute('action', callables);
				form.setAttribute('method', 'POST');
				for (var i = 0; i < parts.length; ++i) {
					var input = document.createElement('input');
					var pair = parts[i].split('=')
					input.setAttribute('type', 'hidden');
					input.setAttribute('name', decodeURIComponent(pair[0]));
					input.setAttribute('value', decodeURIComponent(pair[1]));
					form.appendChild(input);
				}
				document.body.appendChild(form).submit();
				return 1;
			} else {
				if (window.location.href == callables) {
					window.location.reload(true);
				} else {
					window.location = callables;
				}
				return 1;
			}
		}
		var c;
		try {
			eval('c = ' + callables);
		} catch (ex) {
			// absorb and do nothing, if possible
		}
		if (typeof(c) !== 'function') {
			return 0;
		}
		return Q.handle(c, context, args);
	 default:
		return 0;
	}
};

/**
 * Wraps a callable in a Q.Event object
 * @class Event
 * @namespace Q
 * @param callable {callable}
 *  Optional. If not provided, the chain of handlers will start out empty.
 *  Any kind of callable which Q.handle can invoke
 * @param key=null {string}
 *  Optional key under which to add this, so you can remove it later if needed
 */
Q.Event = function (callable, key) {
	this.handlers = {};
	this.keys = [];
	this.typename = "Q.Event";
	if (callable) {
		this.set(callable, key);
	}
	/**
	 * Shorthand closure for emitting events
	 * Pass any arguments to the event here.
	 * You can pass this closure anywhere a callback function is expected.
	 * @method handle
	 * @return {mixed}
	 */
	this.handle = function() {
		Q.handle(event, this, arguments);
	};
};

var Evp = Q.Event.prototype;

/**
 * Adds a callable to a handler, or set an existing one
 * @method set
 * @param callable
 *  Any kind of callable which Q.handle can invoke
 * @param key String
 *  Optional key under which to add this, so you can remove it later if needed
 *  If the key is not provided, a unique one is computed
 * @param prepend Boolean
 *  If true, then prepends the handler to the chain
 */
Evp.set = function (callable, key, prepend) {
	if (key === undefined || key === null) {
		var i = this.keys.length, key = 'AUTOKEY_' + i;
		while (this[key]) {
			key = 'AUTOKEY_' + (++i);
		}
	}
	this.handlers[key] = callable;
	if (prepend) {
		this.keys.unshift(key);
	} else {
		this.keys.push(key);
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
 * Removes a callable
 * @method remove
 * @param key String
 *  The key of the callable to remove
 */
Evp.remove = function (key) {
	delete this.handlers[key];
	for (var i=0; i<this.keys.length; ++i) {
		if (this.keys[i] === key) {
			this.keys.splice(i, 1);
			return 1;
		}
	}
	return 0;
};

/**
 * Make a copy of this handler
 * @method copy
 * @return {Q.Event} copy of Event handler
 */
Evp.copy = function () {
	var result = new Q.Event();
	for (var i=0; i<this.keys.length; ++i) {
		result.handlers[this.keys[i]] = this.handlers[this.keys[i]];
		result.keys.push(this.keys[i]);
	}
	return result;
};

/**
 * Adds a reference to a javascript, if it's not already there
 * @method addScript
 * @param {String} src
 * @param {String} onload
 * @param {String} options
 *  Optional. A hash of options, including:
 *  'duplicate': if true, adds script even if one with that src was already loaded
 */
Q.addScript = function(src, onload, options) {
	if (!onload) {
		onload = function() { };
	}
	if (Q.typeOf(src) === 'array') {
		var ret = [];
		var len = src.length;
		var multi_onload = function () {
			if (--len === 0) {
				_onload.call(null, src);
			}
		};
		for (var i=0; i<src.length; ++i) {
			ret.push(
				Q.addScript(src[i].src, multi_onload, options)
			);
		}
		return ret;
	}

	if (!options || !options.duplicate) {
		var scripts = document.getElementsByTagName('script');
		for (var i=0; i<scripts.length; ++i) {
			if (scripts[i].getAttribute('src') !== src) continue;
			if (Q.addScript.loaded[src] || !Q.addScript.added[src]) {
				_onload();
				return;
			}
			if (Q.addScript.onLoadCallbacks[src]) {
				Q.addScript.onLoadCallbacks[src].push(onload);
			} else {
				Q.addScript.onLoadCallbacks[src] = [onload];
			}
			scripts[i].onload = onload2;
			scripts[i].onreadystatechange = onload2; // for IE6
			return; // don't add
		}
	}

	var onload2_executed;
	function onload2(e) {
		if (onload2_executed) {
			return;
		}
		if (('readyState' in this)
		&& (this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;
		}
		Q.addScript.loaded[src] = true;
		var cb;
		while (cb = Q.addScript.onLoadCallbacks[src].shift()) {
			cb.call(this);
		}
		onload2_executed = true;
	}

	function _onload() {
		var args = Array.prototype.slice.call(arguments, 0);
		Q.addScript.onLoad.handle(args);
		onload(args);
	};

	// Create the script tag and insert it into the document
	var script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	Q.addScript.added[src] = true;
	Q.addScript.onLoadCallbacks[src] = [_onload];
	script.onload = onload2;
	script.onreadystatechange = onload2; // for IE6
	script.setAttribute('src', src);
	document.getElementsByTagName('head')[0].appendChild(script);
	return script;
};
Q.addScript.onLoadCallbacks = {};
Q.addScript.added = {};
Q.addScript.loaded = {};
Q.addScript.onLoad = new Q.Event();


/**
 * Loads some kind of plugin and returns its interface
 * @method Q.load
 * @param {String} pluginName
 * @param {Function} callback
 */
Q.load = function(pluginName, callback) {
	Q.addScript(Q.baseUrl+"/plugins/"+pluginName+"/js/Platform.js", function () {
		var err = null;
		callback(err, Q.plugins[pluginName]);
	});
};

/**
* Q Plugins
* @property Q.plugins
* @type {Object}
*/

Q.plugins = {
    /**
    * @property Q.plugins.Users
    * @type {Q.Users}
    */
	Users: Q.Users
};





/*
 * Hashes
 */
var hexcase=0;var b64pad="";function hex_md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)))}function b64_md5(a){return rstr2b64(rstr_md5(str2rstr_utf8(a)))}function any_md5(a,b){return rstr2any(rstr_md5(str2rstr_utf8(a)),b)}function hex_hmac_md5(a,b){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)))}function b64_hmac_md5(a,b){return rstr2b64(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)))}function any_hmac_md5(a,c,b){return rstr2any(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(c)),b)}function md5_vm_test(){return hex_md5("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72"}function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8))}function rstr_hmac_md5(c,f){var e=rstr2binl(c);if(e.length>16){e=binl_md5(e,c.length*8)}var a=Array(16),d=Array(16);for(var b=0;b<16;b++){a[b]=e[b]^909522486;d[b]=e[b]^1549556828}var g=binl_md5(a.concat(rstr2binl(f)),512+f.length*8);return binl2rstr(binl_md5(d.concat(g),512+128))}function rstr2hex(c){try{hexcase}catch(g){hexcase=0}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15)}return b}function rstr2b64(c){try{b64pad}catch(h){b64pad=""}var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b="";var a=c.length;for(var f=0;f<a;f+=3){var k=(c.charCodeAt(f)<<16)|(f+1<a?c.charCodeAt(f+1)<<8:0)|(f+2<a?c.charCodeAt(f+2):0);for(var d=0;d<4;d++){if(f*8+d*6>c.length*8){b+=b64pad}else{b+=g.charAt((k>>>6*(3-d))&63)}}}return b}function rstr2any(m,c){var b=c.length;var l,f,a,n,e;var k=Array(Math.ceil(m.length/2));for(l=0;l<k.length;l++){k[l]=(m.charCodeAt(l*2)<<8)|m.charCodeAt(l*2+1)}var h=Math.ceil(m.length*8/(Math.log(c.length)/Math.log(2)));var g=Array(h);for(f=0;f<h;f++){e=Array();n=0;for(l=0;l<k.length;l++){n=(n<<16)+k[l];a=Math.floor(n/b);n-=a*b;if(e.length>0||a>0){e[e.length]=a}}g[f]=n;k=e}var d="";for(l=g.length-1;l>=0;l--){d+=c.charAt(g[l])}return d}function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++}if(a<=127){b+=String.fromCharCode(a)}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63))}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63))}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63))}}}}}return b}function str2rstr_utf16le(b){var a="";for(var c=0;c<b.length;c++){a+=String.fromCharCode(b.charCodeAt(c)&255,(b.charCodeAt(c)>>>8)&255)}return a}function str2rstr_utf16be(b){var a="";for(var c=0;c<b.length;c++){a+=String.fromCharCode((b.charCodeAt(c)>>>8)&255,b.charCodeAt(c)&255)}return a}function rstr2binl(b){var a=Array(b.length>>2);for(var c=0;c<a.length;c++){a[c]=0}for(var c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32)}return a}function binl2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255)}return a}function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;var o=1732584193;var n=-271733879;var m=-1732584194;var l=271733878;for(var g=0;g<p.length;g+=16){var j=o;var h=n;var f=m;var e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e)}return Array(o,n,m,l)}function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d)}function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h)}function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h)}function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h)}function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h)}function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535)}function bit_rol(a,b){return(a<<b)|(a>>>(32-b))};

/**
* @module priv
*/
var priv = {
	md5: hex_md5,
	md5_b64: b64_md5,
	md5_hmac: hex_hmac_md5,
	md5_hmac_b64: b64_hmac_md5,
	
	dialog: function () {
		
	},
	
	/**
	 * Resizes an iframe. If it is a dialog, it might get repositioned as well.
     * @method resize
	 * @param bounds {object}
	 *  contains "width" and "height" keys, with values in pixels
	 * @return {object}
	 *  the final size
	 */
	resize: function (what, bounds) {
		var width = Math.min(window.width, bounds.width);
		var height = Math.height(window.height, bounds.height);
		return {width: width, height: height};
	},

    /**
     * Form Post
     * @method formPost
     * @param {String} action , URL action for making form post
     * @param {Object} params Object with key:value pair
     * @param {String} method HTTP method
     * @param {HTMLElement} [iframe] pass null here to create a new iframe
     * @param {HTMLElement} [element] the element to append the iframe to
	 * @param {Function} [callback] this gets called after the post response returns
     */
	formPost: function (action, params, method, iframe, element, callback) {
		element = element || document.body;
	    method = method || "post"; // Set method to post by default, if not specified.
	    var form = document.createElement("form");
		if (!iframe) {
			iframe = document.createElement("iframe");
		}
		var name = 'Q_iframe_' + (_iframeCount++ % 100000);
		iframe.setAttribute("id", name);
		iframe.setAttribute("name", name);
		iframe.style.display = 'none';
	    form.setAttribute("method", method);
	    form.setAttribute("action", action);
		form.setAttribute("target", name);

	    for(var key in params) {
	        if(params.hasOwnProperty(key)) {
	            var hiddenField = document.createElement("input");
	            hiddenField.setAttribute("type", "hidden");
	            hiddenField.setAttribute("name", key);
	            hiddenField.setAttribute("value", params[key]);
	            form.appendChild(hiddenField);
	         }
	    }

		element.appendChild(iframe);
	    element.appendChild(form);
	    form.submit();
		element.removeChild(form);
		
		iframe.onload = function () {
			callback && callback(null, iframe);
		};
		return iframe;
	},

    /**
     * Session Initialization
     * @method init
     * @param {Function} callback , Callback fired after Session Initialization
     */

	init: function (callback) {
		priv.session(function (session) {
			callback();
		});
	},

    /**
     * Creates Session
     * @method session
     * @param {Function} callback , Callback fired after Session creation
     */

	session: function (callback) {
		if (priv.init.session) {
			callback(priv.init.session);
			return;
		}
		// if session is not set, do a form post
		priv.formPost(Q.baseUrl + '/plugins/Platform/init', {}, 'post', function () {
			if (callback) {
				callback(priv.init.session);
			}
		}, priv.init.iframe);
		priv.init.session = true;
	},

    /**
     * Creates Iframe fro this object
     * @method iframe
     * @param {Function} callback , Callback fired after Iframe DOMElement creation
     */

	iframe: function (callback) {
		if (priv.init.iframe) {
			return priv.init.iframe;
		}
		// if iframe wasn't added yet, create one
		var iframe = document.createElement("iframe");
		iframe.setAttribute('name', 'Q0');
		iframe.style.display = 'none';
		document.body.appendChild(iframe);
		priv.init.iframe = iframe;
	}
	
	// stuff to fill iframes etc.
};

/**
* @property Q.Users
*/
Q.Users = {
	
	homeAppUrl: "http://gmba.local/Groups",
	homeOrigin: "http://gmba.local",
	
	/**
	 * Shows a login dialog
     * @method login
	 * @param callback
	 *  Parameters:
	 *  1: Error, if any
	 * @param options
	 */
	login: function (callback, options) {
		var url = Q.Users.homeAppUrl + '/Platform/api';
		
		priv.formPost(url, {
			discover: ['user','contacts']
		}, 'post', null, null, function (err, iframe) {
			iframe.contentWindow.postMessage({
				method: "Q.Users.login",
	        	appUrl: Q.baseUrl
	        }, Q.Users.homeOrigin);
		});
		window.addEventListener("message", receiveMessage, false);
		function receiveMessage(event) {
			console.log(event.data, event.origin);
		  // ...
		}
		// show the login dialog
		// requesting "title" and "dialog" slot from Users/login
		// with our cool security feature
		// iframe should say how to resize!!
	},
	
	/**
	 * Get the logged in user, if any
     * @method getUser
	 * @param callback {Function}
	 *  Parameters:
	 *  1. Error, if any
	 *  2. The Q.Users.User object of logged-in user, or null if user is not logged in
	 */
	getUser: function (callback) {
		priv.loadEasyXDM(function () {
			// get the logged in user
		});
	},
	
	/**
	 * Event is triggered when a new user is detected, or during logout
	 * Parameters:
	 *  1: Q.Users.User object. This could be null if user logged out.
     *  @event onUserChange
	 */
	onUserChange: new Q.Event()
};

Q.Users.User = function (xid) {
	this.xid = xid;
};
Q.Users.User.prototype.typename = "Q.Users.User";

Q.Streams = {

};


/**
 * This method restores the old window.Q and returns an instance of itself.
 * @method Q.noConflict
 * @param callback Function
 *  Optional. If true, then simply calls Q(callback) passing the Q instance
 *  on which this callback was called.
 * @return {Function}
 *  Returns the Q instance on which this method was called
 */
Q.noConflict = function (callback) {
	window.Q = oldQ;
	Q(callback);
	return Q;
};

var oldQ = window.Q;
window.Q = Q;


})(window);