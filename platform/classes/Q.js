"use strict";
/* jshint -W014 */

/**
 * Contains core Qbix functionality.
 * @module Q
 * @main Q
 */
var express = require('express');
var http = require('http');
var https = require('https');
var util = require('util');
var events = require('events');
var path = require('path');
var fs = require('fs');

var root = this;
var QConstructor = function QConstructor() {};
QConstructor.prototype = new events.EventEmitter();
/**
 * The main platform module. Contains basic properties and methods and serves as namespace
 * for more specific sub-classes
 * @class Q
 * @static
 */
var Q = new QConstructor();
module.exports = Q;

Q.VERSION = 1.1;

/**
 * @class Q.Error
 * @description Throw this when throwing errors in Javascript
 */
Q.Error = Error;

/**
 * @class Q
 */

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

/**
 * Returns the type of a value
 * @method typeOf
 * @param {mixed} value The value to test type
 * @return {String} String description of the type
 */
Q.typeOf = function _Q_typeOf(value) {
	var s = typeof value, x, l;
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		if (root.Element && value instanceof root.Element) {
			return 'Element';
		} else if (value instanceof Array
		|| (value.constructor && value.constructor.name === 'Array')) {
			s = 'array';
		} else if (typeof(value.typename) != 'undefined' ) {
			return value.typename;
		} else if (typeof (l=value.length) == 'number' && (l%1==0)
		&& (!l || ((l-1) in value))) {
			return 'array';
		} else if (typeof(value.constructor) != 'undefined' && typeof(value.constructor.name) != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			return value.constructor.name;
		} else if ((x = Object.prototype.toString.apply(value)).substr(0, 8) === "[object ") {
			return x.substring(8, x.length-1);
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Walks the tree from the parent, and returns whether the path was defined
 * @method isSet
 * @param {Object} parent
 * @param {Array} keys
 * @param {String} delimiter Optional
 * @return {boolean}
 */
Q.isSet = function _Q_isSet(parent, keys, delimiter) {
	var p = parent;
	if (!p) {
		return false;
	}
	delimiter = delimiter || '.';
	if (typeof keys === 'string') {
		keys = keys.split(delimiter);
	}
	for (var i=0; i<keys.length; i++) {
		if (!(keys[i] in p)) {
			return false;
		}
		p = p[keys[i]];
	}
	return true;
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
};

/**
 * Set an object from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * Objects are created as needed along `path`.
 * Another way to call this function is to pass an object of {name: value} pairs as the first parameter
 * and context as an optional second parameter. Then the return value is an object of the usual return values.
 *
 * @static
 * @method setObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param {mixed} value value or object to place at location given by name
 * @param {Object} [context=root] Optional. Object to use as root of path.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @return {Object|undefined} Returns the resulting value if setting is successful or `undefined` if not.
 */
Q.setObject = function _Q_setObject(name, value, context, delimiter) {
	delimiter = delimiter || '.';
	if (Q.isPlainObject(name)) {
		context = value;
		var result = {};
		for (var k in name) {
			result[k] = Q.setObject(k, name[k], context);
		}
		return result;
	}
	if (typeof name === 'string') {
		name = name.split(delimiter);
	}
	var p = name.pop(),
	obj = _getProp(name, true, context);
	return obj && (p !== undefined) ? (obj[p] = value) : undefined;
};

/**
 * Get a property from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * You can also use it to resolve an object where it might be a string or array or something else.
 *
 * @static
 * @method getObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param {Object} [context=root] Optional. Object to use as root of path. Null may be passed.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @param {mixed} [create=undefined] Pass a value here to set with Q.setObject if nothing was there
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
 * Used to prevent overwriting the latest results on the client with older ones.
 * Typically, you would call this function before making some sort of request,
 * save the ordinal in a variable, and then pass it to the function again inside
 * a closure. For example:
 * @example
 *     var ordinal = Q.latest(tool);
 *     requestSomeResults(function (err, results) {
 *       if (!Q.latest(tool, ordinal)) return;
 *     // otherwise, show the latest results on the client
 *     });
 * @method latest
 * @param {String|Q.Tool} key
 *  Requests under the same key share the same incrementing ordinal
 * @param {Number|Boolean} ordinal
 *  Pass an ordinal that you obtained from a previous call to the function
 *  Pass true here to get the latest ordinal that has been passed so far
 *  to the method under this key, corresponding to the latest results seen.
 * @return {Number|Boolean}
 *  If only key is provided, returns an ordinal to use.
 *  If ordinal is provided, then returns whether this was the latest ordinal.
 */
Q.latest = function (key, ordinal) {
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = key.id;
	}
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
 * Makes an object into an event emitter.
 * @method makeEventEmitter
 * @param {Object} what Can be an object or a function
 * @param {boolean} [isConstructor=false] Whether the object is a constructor function. In this case,
 *  it is not the function that is made an emitter, but the
 *  objects which the function constructs.
 */
Q.makeEventEmitter = function _Q_makeEventEmitter(what, isConstructor) {
	if (isConstructor) {
		what.prototype.__proto__ = events.EventEmitter.prototype;
	} else {
		Q.extend(what, events.EventEmitter.prototype);
	}
};

/**
 * Creates a derived object which you can extend, inheriting from an existing object
 * @method objectWithPrototype
 * @param {Object} original The object to use as the prototype
 * @return {Object} The derived object
 */
Q.objectWithPrototype = function _Q_objectWithPrototype(original) {
	if (!original) {
		return {};
	}
	function Clone() {}
	Clone.prototype = original;
	return new Clone();
};

/**
 * Clones the Base constructor and mixes in the Constructor function
 * @method inherit
 * @param {Function} Base the base function, such as Q.Tool
 * @param {Function} Constructor the constructor function to change
 * @return {Function} The resulting function to be used as a constructor
 */
Q.inherit = function _Q_inherit(Base, Constructor) {
	function InheritConstructor() {
		InheritConstructor.constructors.apply(this, arguments);
	}
	InheritConstructor.prototype = Q.objectWithPrototype(Q.Tool.prototype);
	InheritConstructor.prototype.constructor = InheritConstructor;
	Q.mixin(InheritConstructor, Constructor);
	return InheritConstructor;
};

/**
 * Sets up control flows involving multiple callbacks and dependencies
 * Usage:
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
 * Q.Cache constructor
 * @namespace Q
 * @class Q.Pipe
 * @constructor
 * @see {Q.Pipe.prototype.add} for more info on the parameters
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

/**
 * Adds a callback to the pipe
 * @method add
 * @param {String} field
 *  Pass the name of a field to wait for, until it is filled, before calling the callback.
 * @param {Function} callback
 *  This function is called as soon as the field is filled, i.e. when the callback
 *  produced by pipe.fill(field) is finally called by someone.
 *  The "this" and arguments from that call are also passed to the callback.
 *  The callback receives the same "this" and arguments that the original call was made with.
 *  It is passed the "this" and arguments which are passed to the callback.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 */
Q.Pipe.prototype.on = function _Q_pipe_on(field, callback) {
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
 * @param {number} maxTimes
 *  Optional. The maximum number of times the callback should be called.
 * @param {Function} callback
 *  Once all required fields are filled, this function is called every time something is piped.
 *  It is passed four arguments: (params, subjects, field, requires)
 *  If you return false from this function, it will no longer be called for future pipe runs.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 */
Q.Pipe.prototype.add = function _Q_pipe_add(requires, maxTimes, callback) {
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
			}
			if (e !== null && typeof e !== 'string') {
				debugger;
				throw new Q.Error("Q.Pipe.prototype.add requires event name after array of objects");
			}
		}
	}
	return this;
};

/**
 * Makes a function that fills a particular field in the pipe and can be used as a callback
 * @method fill
 * @param {String} field
 *   For error callbacks, you can use field="error" or field="users.error" for example.
 * @param {boolean|String|Array} ignore
 *   Optional. If true, then ignores the current field in subsequent pipe runs.
 *   Or pass the name (string) or names (array) of the field(s) to ignore in subsequent pipe runs.
 * @return {Function} Returns a callback you can pass to other functions.
 */
Q.Pipe.prototype.fill = function _Q_pipe_fill(field, ignore) {
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
 * @param {String} field optionally indicate name of the field that was just filled
 * @return {number} the number of pipe callbacks that wound up running
 */
Q.Pipe.prototype.run = function _Q_pipe_run(field) {
	var cb, ret, callbacks = this.callbacks, params = Q.copy(this.params), count = 0;

	cbloop:
	for (var i=0; i<callbacks.length; i++) {
		if (this.ignore[i]) {
			continue;
		}
		this.i = i;
		if (!(cb = callbacks[i]))
			continue;
		if (cb.pipeRequires) {
			for (var j=0; j<cb.pipeRequires.length; j++) {
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
 * @method batcher
 * @param {Function} batch
 *  This is the function you must write to implement the actual batching functionality.
 *  It is passed the subjects, params and callbacks that were collected by Q.batcher
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
 * @param {Object} options 
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
			var i, j;
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
					batch.timeout = null;
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
 * Wraps a getter function to provide support for re-entrancy, cache and throttling.
 *  It caches based on all non-function arguments which were passed to the function.
 *  All functions passed in as arguments are considered as callbacks. Getter execution is
 *  considered complete when one of the callbacks is fired. If any other callback is fired,
 *  throttling may be influenced - i.e. throttleSize will increase by number of callbacks fired.
 *  If the original function has a "batch" property, it gets copied as a property of
 *  the wrapper function being returned. This is useful when calling Q.getter(Q.batcher(...))
 *  Call method .forget with the same arguments as original getter to clear cache record
 *  and update it on next call to getter (if it happen)
 *  @method getter
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
		gw.emit('called', this, arguments2, ret);

		var cached, cbpos, cbi;
		Q.getter.usingCached = false;
		
		function _prepare(subject, params, callback, ret, cached) {
			if (gw.prepare) {
				gw.prepare.call(gw, subject, params, _result, arguments2);
			} else {
				_result(subject, params);
			}
			function _result(subject, params) {
				gw.emit('result', subject, subject, params, arguments2, ret, gw);
				Q.getter.usingCached = cached;
				var err = null;
				try {
					callback.apply(subject, params);
				} catch (e) {
					err = e;
				}
				gw.emit('executed', subject, subject, params, arguments2, ret, gw);
				Q.getter.usingCached = false;
				if (err) {
					throw err;
				}
			}
		}

		// if caching is required check the cache -- maybe the result is there
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
			gw.emit('executed', this, arguments2, ret);
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
					delete _waiting[key];
					if (wk) {
						for (i = 0; i < wk.length; i++) {
							try {
								_prepare(this, arguments, wk[i].callbacks[cbpos], wk[i].ret, true);
							} catch (e) {
								debugger;
								console.warn(e);
							}
						}
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
			gw.emit('executed', this, arguments2, ret);
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
					console.warn("Q.getter: throttle count is negative");
				}
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!gw.throttleSize) {
			gw.throttle.throttleSize = function _throttleSize(newSize) {
				if (typeof(newSize) === 'undefined') {
					return p.size;
				}
				p.size = newSize;
			};
		}

		// execute the throttle
		ret.result = gw.throttle.throttleTry(this, original, args, ret)
			? Q.getter.REQUESTING
			: Q.getter.THROTTLING;
		gw.emit('executed', this, arguments2, ret);
		return ret;
	}

	Q.extend(gw, original, Q.getter.options, options);
	gw.original = original;
	Q.makeEventEmitter(gw);

	var _waiting = {};
	if (gw.cache === false) {
		// no cache
		gw.cache = null;
	} else if (gw.cache === true) {
		// create our own Object that will cache locally in the page
		gw.cache = Q.Cache.process(++_Q_getter_i);
	} else {
		// assume we were passed an Object that supports the cache interface
	}

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
 * Chains an array of callbacks together into a function that can be called with arguments
 * 
 * @static
 * @method chain
 * @param {Array} callbacks An array of callbacks, each taking another callback at the end
 * @return {Function} The wrapper function
 */
Q.chain = function (callbacks) {
	var result = null;
	Q.each(callbacks, function (i, callback) {
		if (Q.typeOf(callback) !== 'function') {
			return;
		}

		var prevResult = result;
		result = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.push(prevResult);
			return callback.apply(this, args);
		};
	}, {ascending: false, numeric: true});
	return result;
};

/**
 * Takes a function and returns a version that returns a promise
 * @method promisify
 * @static
 * @param  {Function} getter A function that takes one callback and passes err as the first parameter to it
 * @param {Boolean} useSecondArgument whether to resolve the promise with the second argument instead of with "this"
 * @return {Function} a wrapper around the function that returns a promise, extended with the original function's return value if it's an object
 */
Q.promisify = function (getter, useSecondArgument) {
	function _promisifier() {
		if (!Q.Promise) {
			return getter.apply(this, args);
		}
		var args = [], resolve, reject, found = false;
		for (var i=0, l=arguments.length; i<l; ++i) {
			var ai = arguments[i];
			if (typeof ai === 'function') {
				found = true;
				ai = function _promisified(err, second) {
					if (err) {
						return reject(err);
					}
					try {
						ai.apply(this, arguments);
					} catch (e) {
						err = e;
					}
					if (err) {
						return reject(err);
					}
					resolve(useSecondArgument ? second : this);
				}
			}
			args.push(ai);
			break; // only one callback, expect err as first argument
		}
		if (!found) {
			args.push(function _defaultCallback(err, second) {
				if (err) {
					return reject(err);
				}
				resolve(useSecondArgument ? second : this);
			});
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
 * 
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
 * 
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
			_timeout = setTimeout(function () {
				_Q_queue_next();
			}, 0);
		}
		return len;
	};
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * after calls stopped coming in for a given number of milliseconds.
 * If the immediate param is true, the wrapper lets the function be called
 * without waiting if it hasn't been called for the given number of milliseconds.
 * @static
 * @method debounce
 * @param {Function} original The function to wrap
 * @param {number} milliseconds The number of milliseconds
 * @param {Boolean} [immediate=false] if true, the wrapper also lets the function be called
 *   without waiting if it hasn't been called for the given number of milliseconds.
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
 * Q.Cache constructor
 * @namespace Q
 * @class Q.Cache
 * @constructor
 * @param {Object} [options={}] you can pass the following options:
 * @param {Integer} [options.max=100] the maximum number of items the cache should hold. Defaults to 100.
 * @param {Q.Cache} [options.after] pass an existing cache with max > this cache's max, to look in first
 */
Q.Cache = function  _Q_Cache(options) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
	options = options || {};
	this.name = options.name;
	this.data = {};
	this.special = {};
	this.max = options.max || 100;
	this.earliest = this.latest = null;
	this.count = 0;
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
			cache.remove.apply(this, arguments);
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
/**
 * Generates the key under which things will be stored in a cache
 * @static
 * @method key
 * @param {Array} args the arguments from which to generate the key
 * @param {Array} functions  optional array to which all the functions found in the arguments will be pushed
 * @return {String}
 */
Q.Cache.key = function _Cache_key(args, functions) {
	var i, keys = [];
	if (Q.isArrayLike(args)) {
		return args;
	}

	for (i=0; i<args.length; ++i) {
		if (typeof args[i] !== 'function') {
			keys.push(args[i]);
		} else if (functions && functions.push) {
			functions.push(args[i]);
		}
	}

	return JSON.stringify(keys);
};
/**
 * Accesses the cache and sets an entry in it
 * @method set
 * @param {String} key  the key to save the entry under, or an array of arguments
 * @param {number} cbpos the position of the callback
 * @param {Object} subject The "this" object for the callback
 * @param {Array} params The parameters for the callback
 * @param {Object} options  supports the following options:
 * @param {boolean} [options.dontTouch=false] if true, then doesn't mark item as most recently used
 * @return {Boolean} whether there was an existing entry under that key
 */
Q.Cache.prototype.set = function _Q_Cache_prototype_set(key, cbpos, subject, params, options) {
	var parameters = (typeof key !== 'string' ? key : null);
	if (parameters) {
		key = Q.Cache.key(key);
	}
	var existing = this.data[key], previous;
	if (!options || !options.dontTouch) {
		// marks the item as being recently used, if it existed in the cache already
		existing = this.get(key);
		if (!existing) {
			++this.count;
		}
	}
	var value = {
		cbpos: cbpos,
		subject: subject,
		params: (params instanceof Array) ? params : Array.prototype.slice.call(params||[]),
		prev: (options && options.prev) ? options.prev : (existing ? existing.prev : this.latest),
		next: (options && options.next) ? options.next : (existing ? existing.next : null)
	};
	this.data[key] = value;
	if (!existing || (!options || !options.dontTouch)) {
		if (previous = this.data[value.prev]) {
			previous.next = key;
		}
		this.latest = key;
		if (this.count === 1) {
			this.earliest = key;
		}
	}
	if (this.count > this.max) {
		this.remove(this.earliest);
	}
	if (parameters) {
		for (var i=1, l=parameters.length; i<=l; ++i) {
			// add to index for Cache.prototype.each
			this.special[Q_Cache_index_name(i)] = true;

			if (i===l) {
				break;
			}

			// key in the index
			var k = 'index:' + Q.Cache.key(parameters.slice(0, i));
			var obj = this.special[k] || {};
			obj[key] = 1;
			this.special[k] = obj;
		}
	}
	return !!existing;
};
/**
 * Accesses the cache and gets an entry from it
 * @method get
 * @param {String} key
 * @param {Object} options supports the following options:
 * @param {boolean} [options.dontTouch=false] if true, then doesn't mark item as most recently used
 * @return {mixed} whatever is stored there, or else returns undefined
 */
Q.Cache.prototype.get = function _Q_Cache_prototype_get(key, options) {
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
	}
	if (!(key in this.data)) {
		return undefined;
	}
	var existing = this.data[key], previous;
	if ((!options || !options.dontTouch) && this.latest !== key) {
		if (this.earliest == key) {
			this.earliest = existing.next;
		}
		existing.prev = this.latest;
		existing.next = null;
		if (previous = this.data[existing.prev]) {
			previous.next = key;
		}
		this.latest = key;
	}
	return existing;
};
/**
 * Accesses the cache and removes an entry from it.
 * @method remove
 * @param {String} key the key of the entry to remove
 * @return {Boolean} whether there was an existing entry under that key
 */
Q.Cache.prototype.remove = function _Q_Cache_prototype_remove(key) {
	var parameters = (typeof key !== 'string' ? key : null);
	if (parameters) {
		key = Q.Cache.key(key);
	}
	if (!(key in this.data)) {
		return false;
	}
	var existing = this.data[key];
	--this.count;
	if (this.latest === key) {
		this.latest = existing.prev;
	}
	if (this.earliest === key) {
		this.earliest = existing.next;
	}
	delete this.data[key];
	if (parameters) {
		// remove from index for Cache.prototype.each
		for (var i=1, l=parameters.length; i<l; ++i) {
			// key in the index
			var k = 'index:' + Q.Cache.key(parameters.slice(0, i));
			var obj = this.special[k] || {};
			delete obj[key];
			this.special[k] = obj;
		}
	}
	return true;
};
/**
 * Clears Cache data and sets it to {}
 * @method clear
 * @param {String} key
 */
Q.Cache.prototype.clear = function _Q_Cache_prototype_clear(key) {
	this.data = {};
};
/**
 * Searches for entries matching a certain prefix of arguments array
 * and calls the callback repeatedly with each matching result.
 * @method each
 * @param {Array} args An array consisting of some or all the arguments that form the key
 * @param {Function} callback Is passed two parameters: key, value, with this = the cache
 * @param {Object} [options]
 * @param {Boolean} [options.evenIfNoIndex] pass true to suppress an exception that would be thrown if an index doesn't exist
 */
Q.Cache.prototype.each = function _Q_Cache_prototype_clear(args, callback, options) {
	var cache = this;
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
	options = options || {};
	var localStorageIndexInfoKey = Q_Cache_index_name(args.length);
	if (this.special[localStorageIndexInfoKey]) {
		var rawKey = Q.Cache.key(args);
		var key = 'index:' + rawKey; // key in the index
		var localStorageKeys = this.special[key] || {};
		for (var k in localStorageKeys) {
			callback.call(this, k, this.get(k));
		}
		// also the key itself
		var item = this.special[rawKey];
		if (item !== undefined) {
			callback.call(this, rawKey, item);
		}
		return;
	}
	// key doesn't exist
	if (!options.evenIfNoIndex) {
		throw new Q.Exception('Cache.prototype.each: no index for ' + this.name + ' ' + localStorageIndexInfoKey);
	}
	return Q.each(this.data, function (k, v) {
		if (prefix && !k.startsWith(prefix)) {
			return;
		}
		if (callback.call(cache, k, v) === false) {
			return false;
		}
	});
};
/**
 * @method process
 * @static
 * @param {String} name
 * @param {Object} options for Q.Cache constructor
 * @return {mixed}
 */
Q.Cache.process = function _Q_Cache_local(name, options) {
	if (!Q.Cache.process.caches[name]) {
		var c = Q.Cache.process.caches[name] = new Q.Cache(options);
		c.name = name;
	}
	return Q.Cache.process.caches[name];
};
Q.Cache.process.caches = {};

/**
 * @class Q
 */
/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * @method handle
 * @param {callable} callables The callables to call
 * @param {Object} context The context in which to call them
 * @param {Array} args An array of arguments to pass to them
 * @return {number} The number of handlers executed
 */
Q.handle = function _Q_handle(callables, context, args) {
	if (!callables) {
		return 0;
	}
	var i=0, count= 0, result;
	switch (Q.typeOf(callables)) {
	 case 'function':
		result = callables.apply(
			context ? context : null,
			args ? args : []
		);
		if (result === false) return false;
		return 1;
	 case 'array':
		for (i=0; i<callables.length; ++i) {
			result = Q.handle(callables[i], context, args);
			if (result === false) return false;
			count += result;
		}
		return count;
	 case 'object':
		for (var k in callables) {
			result = Q.handle(callables[k], context, args);
			if (result === false) return false;
			count += result;
		}
		return count;
	 case 'string': 
		var c = Q.getObject(callables, context) || Q.getObject(callables);
		return Q.handle(c, context, args);
	 default:
		return 0;
	}
};

/**
 * Iterates over elements in a container, and calls the callback.
 * Use this if you want to avoid problems with loops and closures.
 * @method each
 * @param {Array|Object|String|Number} container, which can be an array, object or string.
 *  You can also pass up to three numbers here: from, to and optional step
 * @param {Function|String} callback
 *  A function which will receive two parameters
 *	index: the index of the current item
 *	value: the value of the current item
 *  Also can be a string, which would be the name of a method to invoke on each item, if possible.
 *  In this case the callback should be followed by an array of arguments to pass to the method calls.
 * @param {Object} options
 *  ascending: Optional. Pass true here to traverse in ascending key order, false in descending.
 *  numeric: Optional. Used together with ascending. Use numeric sort instead of string sort.
 *  sort: Optional. Pass a compare Function here to be used when sorting object keys before traversal. Also can pass a String naming the property on which to sort.
 *  hasOwnProperty: Optional. Set to true to skip properties found on the prototype chain.
 * @throws {Q.Exception} If container is not array, object or string
 */
Q.each = function _Q_each(container, callback, options) {
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
			length = c.length;
			if (!c || !length || !callback) return;
			if (options && options.ascending === false) {
				for (i=length-1; i>=0; --i) {
					r = Q.handle(callback, c[i], args || [i, c[i]], c);
					if (r === false) return false;
				}
			} else {
				for (i=0; i<length; ++i) {
					r = Q.handle(callback, c[i], args || [i, c[i]], container);
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
				var _byKeys = undefined;
				var compare = (t === 'function') ? s : (t === 'string'
					? (options.numeric ? _byFieldsNumeric : _byFields)
					: (options.numeric ? _byKeysNumeric : _byKeys));
				keys.sort(compare);
				if (options.ascending === false) {
					for (i=keys.length-1; i>=0; --i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key]], container);
						if (r === false) return false;
					}
				} else {
					for (i=0; i<keys.length; ++i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key]], container);
						if (r === false) return false;
					}
				}
			} else {
				for (k in container) {
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						r = Q.handle(callback, container[k], args || [k, container[k]], container);
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
					r = Q.handle(callback, c, args || [i, c], container);
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
}

/**
 * Returns the first non-undefined value found in a container
 * @method first
 * @param {Array|Object|String} container
 * @param {Object} options
 *  "nonEmptyKey": return the first non-empty key
 * @return {mixed} the value in the container, or undefined
 * @throws {Q.Exception} If container is not array, object or string
 */
Q.first = function _Q_first(container, options) {
	var fk = Q.firstKey(container, options);
	return fk != null ? container[fk] : undefined;
};

/**
 * Returns the first key or index in a container with a value that's not undefined
 * @method firstKey
 * @param {Array|Object|String} container
 * @param {boolean} [options.nonEmptyKey] return the first non-empty key
 * @return {Number|String} the index in the container, or null
 * @throws {Q.Exception} If container is not array, object or string
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
			throw new Q.Exception("Q.first: container has to be an array, object or string");
	}
	return undefined;
};

/**
 * Returns a container with the items in the first parameter that are not in the others
 * @method first
 * @param {Array|Object} container to subtract items from to form the result
 * @param {Array|Object} container whose items are subtracted in the result
 * @param {Function} comparator accepts item1, item2, index1, index2) and returns whether two items are equal
 * @return {Array|Object} a container of the same type as container1, but without elements of container2
 */
Q.diff = function _Q_diff(container1, container2 /*, ... comparator */) {
	if (!container1 || !container2) {
		return container1;
	}
	var len = arguments.length;
	var args = arguments;
	var comparator = arguments[len-1];
	if (typeof comparator !== 'function') {
		throw new Q.Exception("Q.diff: comparator must be a function");
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
 * @method isEmpty
 * @param {mixed} o The object to test.
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
 * @param {mixed} value The value to test
 * @return {boolean} Whether it is an array
 */
Q.isArrayLike = function _Q_isArrayLike(value) {
	return (Q.typeOf(value) === 'array');
};

/**
 * Determines whether something is a plain object created within Javascript,
 * or something else, like a DOMElement or Number
 * @method isPlainObject
 * @return {boolean} Returns true only for a non-null plain object
 */
Q.isPlainObject = function (x) {
	if (x === null || typeof x !== 'object') {
		return false;
	}
	if (Object.prototype.toString.apply(x) !== "[object Object]") {
		return false;
	}
	return true;
};

/**
 * Use this instead of instanceof, it works with Q.mixin
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
 * @param {Mixed} x the object to copy
 * @param {Array} fields
 *  Optional array of fields to copy. Otherwise copy all that we can.
 * @param {number} levels
 *  Optional. Copy this many additional levels inside x if it is a plain object.
 * @return {Object}
 *  Returns the shallow copy where some properties may have deepened the copy
 */
Q.copy = function _Q_copy(x, fields, levels) {
	if (Buffer && (x instanceof Buffer)) {
		var v = process.version.substr(1).split('.')
		.map(function (x) { return parseInt(x) });
		return v < [5, 10] ? new Buffer(x) : Buffer.from(x);
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
 * @method extend
 * @param {Object} target
 *  This is the first object. It winds up being modified, and also returned
 *  as the return value of the function.
 * @param {number} levels
 *  Optional. Precede any Object with an integer to indicate that we should 
 *  also copy that many additional levels inside the object.
 * @param {Boolean|Number} deep
 *  Optional. Precede any Object with a boolean true to indicate that we should
 *  also copy the properties it inherits through its prototype chain.
 * @param {Object} anotherObject
 *  Put as many objects here as you want, and they will extend the original one.
 * @return {Object} The extended object.
 */
Q.extend = function _Q_extend(target /* [[deep,] [levels,] anotherObject], ... */ ) {
	var length = arguments.length;
	var namespace = undefined;
	if (typeof arguments[length-1] === 'string') {
		namespace = arguments[length-1];
		--length;
	}
	if (length === 0) {
		return {};
	}
	var deep = false, levels = 0, arg;
	var type = Q.typeOf(target);
	for (var i=1; i<length; ++i) {
		arg = arguments[i];
		if (!arg) {
			continue;
		}
		if (arg === true) {
			deep = true;
			continue;
		}
		if (typeof(arg) === 'number' && arg) {
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
		if (Q.isArrayLike(target) && Q.isArrayLike(arg)) {
			target = target.concat(arg);
		} else {
			for (var k in arg) {
				if (deep !== true 
				&& (!arg.hasOwnProperty || !arg.hasOwnProperty(k))
				&& (arg.hasOwnProperty && (k in arg))) {
					continue;
				}
				var argk = arg[k];
				var ttk = Q.typeOf(target[k]);
				var tak = Q.typeOf(argk);
				if (levels 
				&& target[k]
				&& (typeof target[k] === 'object' || typeof target[k] === 'function') 
				&& (Q.isPlainObject(argk) || (ttk === 'array' && tak === 'array'))) {
					target[k] = (ttk === 'array' && ('replace' in argk))
						? Q.copy(argk.replace)
						: Q.extend(target[k], deep, levels-1, argk);
				} else {
					target[k] = Q.extend.dontCopy[Q.typeOf(argk)]
						? argk
						: Q.copy(argk, null, levels-1);
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

Q.extend.dontCopy = { "Q.Tool": true };

/**
 * Mixes in one or more classes. Useful for inheritance and multiple inheritance.
 * @method mixin
 * @static
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
Q.mixin = function _Q_mixin(A, B) {
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
 * Copies a subset of the fields in an object
 * @method take
 * @static
 * @param {Object} source An Object from which to take things
 * @param {Array|Object} An array of fields to take or an object of fieldname: default pairs
 * @return {Object} a new Object
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
 * Returns whether an object contains a property directly
 * @method has
 * @static
 * @param {Object} obj
 * @param {String} key
 * @return {boolean}
 */
Q.has = function _Q_has(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Shuffles an array
 * @method shuffle
 * @static
 * @param {Array} arr The array taht gets passed here is shuffled in place
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
 * Returns the number of milliseconds since the
 * first call to this function (i.e. since script started).
 * @method milliseconds
 * @static
 * @param {Boolean} sinceEpoch
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
 * Default exception handler for Q
 * @method exceptionHandler
 * @param {Exception} exception
 **/
Q.exceptionHandler = function _Q_exceptionHandler(exception) {
	debugger; // pause here if debugging
	// print the exception in the log and keep going
	var name = Q.Config
		? Q.Config.get(['Q', 'exception', 'nodeLogName'], null)
		: null;
	Q.log("UNCAUGHT EXCEPTION:", name);
	Q.log(exception, name);
	process.exit(1);
};
process.on('uncaughtException', Q.exceptionHandler);

/**
 * Search for directory and passes to callback if found. Passes an error if not directory
 * @method dir
 * @param {String} start Directory path
 * @param {Function} [callback=null] Callback functions with arguments "error", "result" where result is an object `{dirs: [...], files: [...]}`
 */
Q.dir = function _Q_dir(start, callback) {
	// Use lstat to resolve symlink if we are passed a symlink
	fs.lstat(start, function(err, stat) {
		if(err) {
			callback && callback(err);
			return;
		}
		var found = {dirs: [], files: []};
		var total = 0;
		var processed = 0;
		function _loadPath(abspath) {
			fs.stat(abspath, function(err, stat) {
				if(stat.isDirectory()) {
					found.dirs.push(abspath);
					// If we found a directory, recurse!
					Q.dir(abspath, function(err, data) {
						found.dirs = found.dirs.concat(data.dirs);
						found.files = found.files.concat(data.files);
						if(++processed == total) {
							callback && callback(null, found);
						}
					});
				} else {
					found.files.push(abspath);
					if(++processed == total) {
						callback && callback(null, found);
					}
				}
			});
		}
		// Read through all the files in this directory
		if(stat.isDirectory()) {
			fs.readdir(start, function (err, files) {
				if (files.length) {
					total = files.length;
					for(var x=0, l=files.length; x<l; x++) {
						_loadPath(path.join(start, files[x]));
					}					
				} else {
					callback && callback(null, {dirs: [], files: []});
				}
			});
		} else {
			callback && callback(new Error("path: " + start + " is not a directory"));
		}
	});
};

/**
 * Normalizes text by converting it to lower case, and
 * replacing all non-accepted characters with underscores.
 * @method normalize
 * @param {String} text The text to normalize
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
	if (text instanceof Buffer) {
		text = text.toString();
	}
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

/*
 * A collection of HTTP servers started with Q.listen
 * @property servers
 * @type Object
 * @default {}
 */
Q.servers = {};

/**
 * Starts http or https server to listen for messages from PHP processes and other things.
 * Uses the Q/node/port and Q/node/host config fields.
 * Make sure to protect the communication using a firewall.
 * @static
 * @method listen
 * @param {Object} [options={}] Options can include:
 * @param {String} [options.port] the port to listen on
 * @param {String} [options.host] the hostname to listen on
 * @param {Array} [options.attach] an array of additional listeners to attach. Each member is a name of a class (e.g. "Q.Socket", "Q.Dispatcher" and "Db") which has the listen(options) method.
 * @param {Object} [options.https] To start an https server, pass options to https.createServer here, to override the ones in the "Q"/"node"/"https" config options, if any.
 * @param {String|Buffer} [options.https.key] Content of the private key file
 * @param {String|Buffer} [options.https.cert] Content of the certificate file
 * @param {String|Buffer} [options.https.ca] Content of the certificate authority file
 * @param {String|Buffer} [options.https.dhparam] Contains the DH parameters for Perfect Forward Secrecy
 * @param {Function} [callback=null] fired when the server actually starts listening.
 *	The callback receives server address as argument
 * @throws {Q.Exception} if config field Q/nodeInternal/port or Q/nodeInternal/host are missing
 */
Q.listen = function _Q_listen(options, callback) {
	options = options || {};
	var internalPort = Q.Config.get(['Q', 'nodeInternal', 'port'], null);
	var internalHost = Q.Config.get(['Q', 'nodeInternal', 'host'], null);
	var port = options.port || internalPort;
	var host = options.host || internalHost;
	var info;

	if (port === null)
		throw new Q.Exception("Q.listen: Missing config field: Q/nodeInternal/port");
	if (host === null)
		throw new Q.Exception("Q.listen: Missing config field: Q/nodeInternal/host");

	var server = Q.getObject([port, host], Q.servers) || null;
	if (server) {
		var address = server.address();
		if (address) callback && callback(address);
		else server.once('listening', function () {
			callback && callback(server.address());
		});
		return server;
	}
	var _express;
	if (express.version === undefined
	|| parseInt(express.version) >= 3) {
		_express = express();
		if (!Q.isEmpty(options.https)) {
			var h = Q.Config.get(['Q', 'node', 'https'], false) || {};
			var keys = ['key', 'cert', 'ca', 'dhparam'];
			keys.forEach(function (k) {
				if (h[k]) {
					h[k] = fs.readFileSync(h[k]).toString();
				}
			});
			if (Q.isPlainObject(options.https)) {
				Q.extend(h, options.https);
			}
			server = https.createServer(h, _express);
		} else {
			server = http.createServer(_express);
		}
	} else {
		server = express.createServer();
		_express = server;
	}
	server.host = host;
	server.port = port;
	server.attached = {
		express: _express
	};
	
	var app = server.attached.express;
	var bodyParser = require('body-parser');
	app.use(bodyParser());
	
	var use = app.use;
	app.use = function _app_use() {
		console.log("Adding request handler under " + server.host + ":" + server.port + " :", arguments[0].name);
		use.apply(this, Array.prototype.slice.call(arguments));
	};
	var methods = {
		"get": "GET",
		"post": "POST",
		"put": "PUT",
		"del": "DELETE",
		"options": "OPTIONS",
		"all": "ALL"
	};
	Q.each(methods, function (k) {
		var f = app[k];
		app[k] = function () {
			var w, h;
			if (arguments.length > 1) {
				w = arguments[0];
				h = arguments[1];
			} else if (typeof arguments[0] === 'function') {
				w = '';
				h = arguments[0];
			} else {
				return;
			}
			if (typeof h === 'function') {
				h = h.name;
			} else if (typeof h !== 'string') {
				h = h.toString();
			}
			console.log("Adding " + methods[k] + " handler under "
				+ server.host + ":" + server.port
				+ w + " :", h);
			f.apply(this, Array.prototype.slice.call(arguments));
		};
	});
	app.use(function Q_request_handler (req, res, next) {
		// WARNING: the following per-request log may be a bottleneck in high-traffic sites:
		var a = server.address();
		if (Q.Config.get('Q', 'node', 'logRequests', true)) {
			Q.log(req.method+" "+req.socket.remoteAddress+ " -> "+a.address+":"+a.port+req.url.split('?', 2)[0] + (req.body['Q/method'] ? ", method: '"+req.body['Q/method']+"'" : ''));
		}
		req.info = {
			port: port,
			host: host
		};
		var headers;
		if (headers = Q.Config.get(['Q', 'node', 'headers'], false)) {
			res.header(headers);
		}
		if (internalHost == host && internalPort == port) {
			Q.Utils.validateRequest(req, res, _requested);
		} else {
			_requested();
		}
		function _requested () {
			/**
			 * Http request
			 * @event request
			 * @param {http.Request} req The request object
			 * @param {http.Response} res The response object
			 */
			Q.emit('request', req, res);
			next();
		}
	});
	server.listen(port, host, function () {
		var internalString = (internalHost == host && internalPort == port) ? ' (internal requests)' : '';
		console.log('Q: listening at ' + host + ':' + port + internalString);
		callback && callback(server.address());
	});

	if (!Q.servers[port]) {
		Q.servers[port] = {};
	}
	Q.servers[port][host] = server;
	return server;
};

/**
 * This should be called from Q.inc.js
 * @method init
 * @param {Object} app An object that MUST contain one key:
 * @param {Object} app.DIR the directory of the app
 * @param {boolean} [notListen=false] Indicate wheather start http server. Useful for forking parallel processes.
 * @throws {Q.Exception} if app is not provided or does not contain DIR field
 */
Q.init = function _Q_init(app, notListen) {
	if (!app) { throw new Q.Exception("Q.init: app is required"); }
	if (!app.DIR) { throw new Q.Exception("Q.init: app.DIR is required"); }

	var path = require('path');
	var Q_dir = path.normalize(__dirname+'/..');
	
	if (require('os').type().toLowerCase().indexOf('windows') === -1) {
		/**
		 * Directory separator
		 * @property DS
		 * @type string
		 */
		Q.DS = '/';
		/**
		 * Path separator
		 * @property PS
		 * @type string
		 */
		Q.PS = ':';
	} else {
		Q.DS = '\\';
		Q.PS = ';';
	}
	/**
	 * App data for your scripts
	 * @property app
	 * @type object
	 */
	Q.app = Q.copy(app);
	
	//
	// constants
	//
	var dirs = {
		/**
		 * Directory for platform classes. Also Q.app.CLASSES_DIR is defined for application classes
		 * @property CLASSES_DIR
		 * @type string
		 */
		CLASSES_DIR: 'classes',
		/**
		 * Directory for platform config. Also Q.app.CONFIG_DIR is defined for application config
		 * @property CONFIG_DIR
		 * @type string
		 */
		CONFIG_DIR: 'config',
		/**
		 * Directory for platform local config. Also Q.app.LOCAL_DIR is defined for application local config
		 * @property LOCAL_DIR
		 * @type string
		 */
		LOCAL_DIR: 'local',
		/**
		 * Directory for platform files. Also Q.app.FILES_DIR is defined for application files
		 * @property FILES_DIR
		 * @type string
		 */
		FILES_DIR: 'files',
		/**
		 * Directory for platform handlers. Also Q.app.HANDLERS_DIR is defined for application handlers
		 * @property HANDLERS_DIR
		 * @type string
		 */
		HANDLERS_DIR: 'handlers',
		/**
		 * Directory for platform plugins. Also Q.app.PLUGINS_DIR is defined for application plugins
		 * @property PLUGINS_DIR
		 * @type string
		 */
		PLUGINS_DIR: 'plugins',
		/**
		 * Directory for platform scripts. Also Q.app.SCRIPTS_DIR is defined for application scripts
		 * @property SCRIPTS_DIR
		 * @type string
		 */
		SCRIPTS_DIR: 'scripts',
		/**
		 * Directory for platform test dir. Also Q.app.TESTS_DIR is defined for application test dir
		 * @property TESTS_DIR
		 * @type string
		 */
		TESTS_DIR: 'tests',
		/**
		 * Directory for platform views. Also Q.app.VIEWS_DIR is defined for application views
		 * @property VIEWS_DIR
		 * @type string
		 */
		VIEWS_DIR: 'views'
	};
	var k;
	for (k in dirs) {
		Q[k] = Q_dir  + '/' + dirs[k];
	}
	for (k in dirs) {
		if (!(k in Q.app)) {
			Q.app[k] = Q.app.DIR  + '/' + dirs[k];
		}
	}
	
	//
	// modules
	//
	/**
	 * Reference to Q.Exception class
	 * @property Exception
	 * @type {object}
	 */
	Q.Exception = require('./Q/Exception');
	/**
	 * Reference to Q.Tree class
	 * @property Tree
	 * @type {object}
	 */
	Q.Tree = require('./Q/Tree');
	/**
	 * Reference to Q.Config class
	 * @property Config
	 * @type {object}
	 */
	Q.Config = require('./Q/Config');
	/**
	 * Reference to Q.Text class
	 * @property Text
	 * @type {object}
	 */
	Q.Text = require('./Q/Text');
	/**
	 * Reference to Q.Bootstrap class
	 * @property Bootstrap
	 * @type {object}
	 */
	Q.Bootstrap = require('./Q/Bootstrap');
	/**
	 * Reference to Q.Request class
	 * @property Request
	 * @type {object}
	 */
	Q.Request = require('./Q/Request');
	/**
	 * Reference to Q.Socket class
	 * @property Socket
	 * @type {object}
	 */
	Q.Socket = require('./Q/Socket');
	/**
	 * Reference to Q.Dispatcher class
	 * @property Dispatcher
	 * @type {object}
	 */
	Q.Dispatcher = require('./Q/Dispatcher');
    /**
     * Reference to Q.Handlebars class
     * @property Handlebars
     * @type {object}
     */
    Q.Handlebars = require('./Q/Handlebars');
   /**
    * Reference to Q.Crypto class
    * @property Crypto
    * @type {object}
    */
	Q.Crypto = require('./Q/Crypto');
	//
	// set things up
	//
	//Q.Bootstrap.registerExceptionHandler();
	Q.Bootstrap.setIncludePath();
	/**
	 * Reference to Q.Utils class
	 * @property Utils
	 * @type {object}
	 */
	Q.Utils = require('./Q/Utils');
	Q.Bootstrap.configure(function (err) {
		if (err) {
			// if run as child Q.Bootstrap.configure returns errors in callback
			process.exit(2);
		}
		Q.app.name = Q.Config.expect(["Q", "app"]);
		Q.Bootstrap.loadPlugins(function () {
			Q.Bootstrap.loadHandlers(function () {
				console.log(typeof notListen === "string" ? notListen : 'Q platform initialized!');
				/**
				 * Qbix platform initialized
				 * @event init
				 * @param {Q} Q Initialized Qbix instance
				 */
				Q.emit('init', Q);
			});
		});
	}, notListen);
};

/**
 * Renders a particular view
 * @method view
 * @param {string} viewName
 *  The full name of the view
 * @param {array} [params=array] Parameters to pass to the view
 * @param {array} [options=array] Some options
 * @param {string|null} [options.language=null] Preferred language
 * @return {string} The rendered content of the view
 */
Q.view = function _Q_view(viewName, params, options) {
	
	params = params || {};
	options = options || {};

	var parts = viewName.split('/');
	var viewPath = parts.join(Q.DS);
	var fields = Q.Config.get(['Q', 'views', 'fields'], null);
	if (fields && typeof fields === 'object') {
		params = Q.extend(fields, params);
	}

	// set options
	options.language = options.language || null;
	params.language = options.language;

	var textParams = Q.Text.params(parts, {'language': options.language});
	params = Q.extend({}, 10, textParams, 10,  params);
	return Q.Handlebars.render(viewPath, params);

};
/**
 * Check if a file exists in the include path
 * And if it does, return the absolute path.
 * @method realPath
 * @param {String} filename Name of the file to look for
 * @param {boolean} [ignoreCache=false] If true, then this function ignores
 *  the cached value, if any, and always attempts to search
 *  for the file. It will cache the new value.
 * @return {String|false} The absolute path if file exists, false if it does not
 */
Q.realPath = function _Q_realPath(filename, ignoreCache) {
  if (!ignoreCache && (filename in realPath_results)) {
		return realPath_results[filename];
	}
	var result = false, paths = (process.env.NODE_PATH || '').split(Q.PS);
	for (var i = 0; i<=paths.length; ++i) {
		var p = (i == paths.length) ? '' : paths[i];
		var fullpath = path.normalize((p.substr(-1) === Q.DS) ? p + filename : p + Q.DS + filename);
		if (fs.existsSync(fullpath)) {
			result = fullpath;
			break;
		}
  }
	realPath_results[filename] = result;
	return result;
};
var realPath_results = {};

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
		if (obj == undefined) {
			return;
		}
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
		// If value is a function, invoke it and return its value
		value = Q.typeOf(value) === "function" ? value() : value;
		if (value == undefined) return;
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
 * Require node module
 * @method require
 * @param {String} what
 * @return {mixed}
 */
Q.require = function _Q_require(what) {
	var ext = what.split('.').pop();
	var realPath = Q.realPath(what + (ext === 'js' ? '' : '.js'));
	if (!realPath && ext != 'js') {
		var path = Q.realPath(what);
		if (path && fs.lstatSync(path).isFile()) {
			realPath = path;
		}
	}
	if (!realPath) {
		throw new Error("Q.require: file '"+what+"' not found");
	}
	return require(realPath);
};

/**
 * Removes all log files older than Q.Config.get('[Q', 'log', 'removeAfterDays'], null)
 * @method removeOldLogs
 * @private
 * @static
 * @return {integer} The number of log files removed
 */
function _removeOldLogs()
{
	var days = parseInt(Q.Config.get(['Q', 'logs', 'removeAfterDays'], null));
	if (!days) {
		return 0;
	}
	var path = _logsDirectory();
	const fs = require('fs');

	var count = 0;
	fs.readdir(path, function (err, files) {
		if (!files) {
			return;
		}
		files.forEach(function (filename) {
			var basename = filename.split('.').shift();
			var parts = basename.split('-');
			if (parts.length <= 3) {
				return;
			}
			var d = parseInt(parts.pop());
			var m = parseInt(parts.pop());
			var y = parseInt(parts.pop());
			var timestamp = (new Date(y, m-1, d+1)).getTime() / 1000;
			var now = Date.now() / 1000;
			var today = now - now % 86400;
			if (today - timestamp > days * 86400) {
				fs.unlink(path + Q.DS + filename, function () {});
				++count;
			}
		});
	});
	return count;
}

function _logsDirectory() {
	var filesDirectory = ((Q.app && Q.app.FILES_DIR)
		? Q.app.FILES_DIR
		: Q.FILES_DIR);
	var logsDirectory = Q.Config.get(['Q', 'logs', 'directory'], 'Q/logs')
		.replace('/', Q.DS);
	return filesDirectory+Q.DS+logsDirectory;
}

var getLogStream = Q.getter(function (name, callback) {
	var Db = Q.require('Db');
	var path = _logsDirectory();
	var suffix = Db.toDate(new Date());
	var filename = path+Q.DS+name+'_node'+'-'+suffix+'.log';
	Q.Utils.preparePath(filename, function (err) {
		if (err) {
			console.error("Failed to create directory '"+path+"', Error:", err.message);
			return callback && callback(err);
		}
		try {
			var stats = fs.statSync(filename);
		} catch (err) {
			if (err) {
				if (err.code === 'ENOENT') {
					// about to create a new file, remove old log files
					_removeOldLogs();
				} else {
					// any error other than "file doesn't exist"
					err.message = "Could not stat '"+filename+"', Error:" + err.message;
					callback && callback(err);
					return;
				}
			}
		}
		if (stats && !stats.isFile()) {
			callback && callback(new Error("'"+filename+"' exists but is not a file"));
			return;
		}
		var stream = fs.createWriteStream(
			filename, {flags: 'a', encoding: 'utf-8'}
		);
		callback(null, stream);
	});
});

/**
 * Returns date/time string formatted the same way as PHP date function does
 * @method date
 * @param {String} format The format string
 * @param {number} timestamp The date to format
 * @return {String}
 */
Q.date = function (format, timestamp) {
	// http://kevin.vanzonneveld.net
	var jsdate, f, formatChr = /[a-z]{1}/gi,
		// Keep this here (works, but for code commented-out
		// below for file size reasons)
		//, tal= [],
		_pad = function (n, c) {
			if ((n = n + '').length < c) {
				return new Array((++c) - n.length).join('0') + n;
			}
			return n;
		},
		txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	function formatChrCb(t, s) {
		return f[t] ? f[t]() : s;
	};
	f = {
		// Day
		d: function () { // Day of month w/leading 0; 01..31
			return _pad(f.j(), 2);
		},
		D: function () { // Shorthand day name; Mon...Sun
			return f.l().slice(0, 3);
		},
		j: function () { // Day of month; 1..31
			return jsdate.getDate();
		},
		l: function () { // Full day name; Monday...Sunday
			return txt_words[f.w()] + 'day';
		},
		N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
			return f.w() || 7;
		},
		S: function () { // Ordinal suffix for day of month; st, nd, rd, th
			var j = f.j();
			return j < 4 | j > 20 && ['st', 'nd', 'rd'][j%10 - 1] || 'th'; 
		},
		w: function () { // Day of week; 0[Sun]..6[Sat]
			return jsdate.getDay();
		},
		z: function () { // Day of year; 0..365
			var a = new Date(f.Y(), f.n() - 1, f.j()),
				b = new Date(f.Y(), 0, 1);
			return Math.round((a - b) / 864e5) + 1;
		},

		// Week
		W: function () { // ISO-8601 week number
			var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
				b = new Date(a.getFullYear(), 0, 4);
			return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
		},

		// Month
		F: function () { // Full month name; January...December
			return txt_words[6 + f.n()];
		},
		m: function () { // Month w/leading 0; 01...12
			return _pad(f.n(), 2);
		},
		M: function () { // Shorthand month name; Jan...Dec
			return f.F().slice(0, 3);
		},
		n: function () { // Month; 1...12
			return jsdate.getMonth() + 1;
		},
		t: function () { // Days in month; 28...31
			return (new Date(f.Y(), f.n(), 0)).getDate();
		},

		// Year
		L: function () { // Is leap year?; 0 or 1
			var j = f.Y();
			return j%4===0 & j%100!==0 | j%400===0;
		},
		o: function () { // ISO-8601 year
			var n = f.n(),
				W = f.W(),
				Y = f.Y();
			return Y + (n === 12 && W < 9 ? -1 : n === 1 && W > 9);
		},
		Y: function () { // Full year; e.g. 1980...2010
			return jsdate.getFullYear();
		},
		y: function () { // Last two digits of year; 00...99
			return (f.Y() + "").slice(-2);
		},

		// Time
		a: function () { // am or pm
			return jsdate.getHours() > 11 ? "pm" : "am";
		},
		A: function () { // AM or PM
			return f.a().toUpperCase();
		},
		B: function () { // Swatch Internet time; 000..999
			var H = jsdate.getUTCHours() * 36e2,
				// Hours
				i = jsdate.getUTCMinutes() * 60,
				// Minutes
				s = jsdate.getUTCSeconds(); // Seconds
			return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
		},
		g: function () { // 12-Hours; 1..12
			return f.G() % 12 || 12;
		},
		G: function () { // 24-Hours; 0..23
			return jsdate.getHours();
		},
		h: function () { // 12-Hours w/leading 0; 01..12
			return _pad(f.g(), 2);
		},
		H: function () { // 24-Hours w/leading 0; 00..23
			return _pad(f.G(), 2);
		},
		i: function () { // Minutes w/leading 0; 00..59
			return _pad(jsdate.getMinutes(), 2);
		},
		s: function () { // Seconds w/leading 0; 00..59
			return _pad(jsdate.getSeconds(), 2);
		},
		u: function () { // milliseconds; 000000-999000
			return _pad(jsdate.getMilliseconds() * 1000, 6);
		},

		// Timezone
		e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
			// The following works, but requires inclusion of the very large
			// timezone_abbreviations_list() function.
/*              return this.date_default_timezone_get();
*/
			throw new Q.Error("Not supported (see source code of date() for timezone on how to add support)");
		},
		I: function () { // DST observed?; 0 or 1
			// Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
			// If they are not equal, then DST is observed.
			var a = new Date(f.Y(), 0),
				// Jan 1
				c = Date.UTC(f.Y(), 0),
				// Jan 1 UTC
				b = new Date(f.Y(), 6),
				// Jul 1
				d = Date.UTC(f.Y(), 6); // Jul 1 UTC
			return 0 + ((a - c) !== (b - d));
		},
		O: function () { // Difference to GMT in hour format; e.g. +0200
			var tzo = jsdate.getTimezoneOffset();
			var a = Math.abs(tzo);
			return (tzo > 0 ? "-" : "+") + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
		},
		P: function () { // Difference to GMT w/colon; e.g. +02:00
			var O = f.O();
			return (O.substr(0, 3) + ":" + O.substr(3, 2));
		},
		T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
			// The following works, but requires inclusion of the very
			// large timezone_abbreviations_list() function.
/*              var abbr = '', i = 0, os = 0, default = 0;
			if (!tal.length) {
				tal = that.timezone_abbreviations_list();
			}
			if (that.php_js && that.php_js.default_timezone) {
				default = that.php_js.default_timezone;
				for (abbr in tal) {
					for (i=0; i < tal[abbr].length; i++) {
						if (tal[abbr][i].timezone_id === default) {
							return abbr.toUpperCase();
						}
					}
				}
			}
			for (abbr in tal) {
				for (i = 0; i < tal[abbr].length; i++) {
					os = -jsdate.getTimezoneOffset() * 60;
					if (tal[abbr][i].offset === os) {
						return abbr.toUpperCase();
					}
				}
			}
*/
			return 'UTC';
		},
		Z: function () { // Timezone offset in seconds (-43200...50400)
			return -jsdate.getTimezoneOffset() * 60;
		},

		// Full Date/Time
		c: function () { // ISO-8601 date.
			return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
		},
		r: function () { // RFC 2822
			return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
		},
		U: function () { // Seconds since UNIX epoch
			return jsdate / 1000 | 0;
		}
	};
	jsdate = (!timestamp ? new Date() : (timestamp instanceof Date) ? new Date(timestamp) : new Date(timestamp * 1000));
	return format.replace(formatChr, formatChrCb);
};

var timeHandles = {};

/**
 * Start time counter
 * @method time
 * @param {String} handle A handle to refer to time counter. Shall be namespaced to avoid overlap with
 *	other possible counters - Q/PROCESS/NAME
 */
Q.time = function _Q_time(handle) {
	timeHandles[handle] = (new Date()).getTime();
};

/**
 * Retrieves time difference between start by Q.time() and current time.
 * Time is formatted string <code>"XX days XX hours XX minutes XX seconds"</code>
 * If time is less than a second returns <code>"XXX milliseconds"</code>
 * @method timeEnd
 * @param {String} handle The handle started with Q.time(). If not started returns null
 * @return {String|null}
 */
Q.timeEnd = function _Q_timeEnd(handle) {
	if (!timeHandles[handle]) {
		return null;
	}
	var diff = (new Date()).getTime() - timeHandles[handle];
	var days = Math.floor(diff / 1000 / 60 / 60 / 24);
	var hours = Math.floor(diff / 1000 / 60 / 60 - (24 * days));
	var minutes = Math.floor(diff / 1000 / 60 - (24 * 60 * days) - (60 * hours));
	var seconds = Math.floor(diff / 1000 - (24 * 60 * 60 * days) - (60 * 60 * hours) - (60 * minutes));
	return 	((days > 0) ? days+" days " : '') +
			((days+hours > 0) ? hours+" hours " : '') +
			((days+hours+minutes > 0) ? minutes+" minutes " : '') +
			((days+hours+minutes+seconds > 0) ? seconds+" seconds" : diff+" milliseconds");
};

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
		return undefined;
	}
	return (typeof error === 'string')
		? error
		: (error.message ? error.message : JSON.stringify(error));
};

/**
 * Writes a string to application log. If run outside Qbix application writes to console.
 * @method log
 * @param {mixed} message The data to write to log file. If data is string it is written to log, if it has other type
 *	it is converted to string using util.format with depth defined by Q/var_dump_max_levels config key
 * @param {String} [name] If set log file will be named name+'_node.log', otherwise it would be named ('Q/app' config value) + '_node.log'
 * @param {boolean} [timestamp=true] Whether to prepend the current timestamp
 * @param {Function} [callback=null] The callback to call after log file is written
 * @return {boolean} false if failed to parse arguments
 */
Q.log = function _Q_log(message, name, timestamp, callback) {
	if (typeof timestamp === "undefined") timestamp = true;
	if (typeof name === "function") {
		callback = name;
		timestamp = true;
		name = Q.Config.get(['Q', 'app'], false);
	} else if (typeof timestamp === "function") {
		callback = timestamp;
		timestamp = true;
	}
	if (typeof name === "undefined" || name === true) {
		name = Q.Config.get(['Q', 'app'], false);
	}

	if (typeof message !== "string") {
		if (!message) {
			message = JSON.stringify(message);
		} else if (message instanceof Error
		|| (message.fileName && message.stack)) {
			var error = message;
			message = error.name + ": " + error.message
				+ "\n" + "in " + error.fileName
				+ " at (" + error.lineNumber + ":" + error.columnNumber + ")"
				+ "\n" + error.stack;
		} else {
			message = 'inspecting '+Q.typeOf(message)+':\n'+util.inspect(message, false, Q.Config.get('Q', 'var_dump_max_levels', 5));
		}
	}

	message = (timestamp ? '['+Q.date('Y-m-d H:i:s')+'] ' : '')+(name ? name : 'Q')+': ' + message + "\n";

	if (!name) {
		return console.log(message);
	}
	getLogStream(name, function (err, stream) {
		if (err) {
			console.log(err);
			return;
		}
		stream.write(message);
		_removeOldLogs();
	});
};

/**
 * Obtain a URL
 * @method url
 * @param {Object} what
 *  Usually the stuff that comes after the base URL
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} [options] A hash of options, including:
 * @param {String} [options.baseUrl] A string to replace the default base url
 * @param {Number} [options.cacheBust] Number of milliseconds before a new cachebuster is appended
 */
Q.url = function _Q_url(what, fields, options) {
	var what2 = what || '';
	if (what2.startsWith('data:') || what2.startsWith('blob:')) {
		return what2; // this is a special type of URL
	}
	var parts = what2.split('?');
	var what3;
	if (fields) {
		for (var k in fields) {
			parts[1] = (parts[1] || "").queryField(k, fields[k]);
		}
		what2 = parts[0] + (parts[1] ? '?' + parts[1] : '');
	}
	var baseUrl = (options && options.baseUrl) || Q.Config.get(['Q', 'web', 'appRootUrl']);
	what3 = Q.interpolateUrl(what2);
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
		result = baseUrl + ((what3.substr(0, 1) === '/') ? '' : '/') + what3;
	}
	return result;
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
	var baseUrl = Q.Config.get(['Q', 'web', 'appRootUrl']);
	substitutions['baseUrl'] = substitutions[Q.app.name] = baseUrl;
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

/*
 * Extend some built-in prototypes
 */

if (!Object.getPrototypeOf) {
	Object.getPrototypeOf = function (obj) {
		if (obj.__proto__) return obj.__proto__;
		if (obj.constructor && obj.constructor.prototype) {
			return obj.constructor.prototype;
		}
		return undefined;
	};
}

Date.fromTimestamp = function (timestamp) {
	if (isNaN(timestamp)) {
		return undefined;
	}
	timestamp = parseFloat(timestamp);
	return new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
};

Date.from = function (input) {
	if (input instanceof Date) {
		return input;
	}
	return Date.fromTimestamp(input) || new Date(input);
};

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
 * @param {Array} [convert] Array of codes to unconvert. Can include
 *  '&amp;', '&lt;', '&gt;, '&quot;', '&apos;', "<br>", "<br />"
 * @return {String}
 */
Sp.decodeHTML = function _String_prototype_decodeHTML(unconvert) {
	var conversions = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&apos;': "'",
		"<br>": "\n",
		"<br />": "\n"
	};
	if (unconvert) {
		conversions = Q.take(conversions, unconvert);
	}
	return this.replaceAll(conversions);
};

/**
 * Interpolates some fields into the string wherever "{{fieldName}}" appears
 * or {{index}} appears.
 * @method interpolate
 * @param {Object|Array} fields Can be an object with field names and values,
 *   or an array corresponding to {{0}}, {{1}}, etc. If the string is missing
 *   {{0}} then {{1}} is mapped to the first element of the array.
 *   If the placeholder names contain dots, e.g. "{{foo.bar.baz}}" or "{{0.bar.baz}}",
 *   we use Q.getObject to dig deeper into the fields.
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
 * @return {String|Object} the value of the field in the string, or if value was not undefined, the resulting querystring. Finally, if 
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

if (!Sp.trim) {
	Sp.trim = function _String_prototype_trim() {
		return this.replace(/^\s+|\s+$/g, "");
	};
}

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

Sp.quote = function _String_prototype_quote() {
	var c, i, l = this.length, o = '"';
	for (i = 0; i < l; i += 1) {
		c = this.charAt(i);
		if (c >= ' ') {
			if (c === '\\' || c === '"') {
				o += '\\';
			}
			o += c;
		} else {
			switch (c) {
			case '\b':
				o += '\\b';
				break;
			case '\f':
				o += '\\f';
				break;
			case '\n':
				o += '\\n';
				break;
			case '\r':
				o += '\\r';
				break;
			case '\t':
				o += '\\t';
				break;
			default:
				c = c.charCodeAt();
				o += '\\u00' + Math.floor(c / 16).toString(16) +
					(c % 16).toString(16);
			}
		}
	}
	return o + '"';
};

/**
 * Used to split ids into one or more segments, in order to store millions
 * of files under a directory, without running into limits of various filesystems
 * on the number of files in a directory.
 * Consider using Amazon S3 or another service for uploading files in production.
 * @method matchTypes
 * @param {String|Array} [types] type or types to detect. Can be "url", "email", "phone", "twitter".
 *  If omitted, all types are processed.
 * @return {object}
 */
Sp.matchTypes = function (types) {
	var string = this;
	if (typeof types === 'string') {
		types = [types];
	}
	if (!Q.isArrayLike(types)) {
		types = Object.keys(Sp.matchTypes.adapters);
	}
	var res = {};
	Q.each(types, function (i, type) {
		if (Sp.matchTypes.adapters[type]) {
			res[type] = Sp.matchTypes.adapters[type].call(string);
		}
	});
	if (types.length === 1) {
		return res[Object.keys(res)[0]];
	}
	return res;
};

Sp.matchTypes.adapters = {
	url: function () {
		return this.match(/(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/gi) || [];
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
 * Binds a method to an object, so "this" inside the method
 * refers to that object when it is called.
 * @method bind
 * @param {Function} method A reference to the function to call
 * @param {Object} obj The object to bind as the context for the function call
 * @param {Object} options If supplied, binds these options and pushes them as the last argument to the function call.
 */
if (!Function.prototype.bind)
Function.prototype.bind = function _Function_prototype_bind(obj, options) {
	var method = this;
	if (!obj) obj = root;
	if (!options) {
		return function _Q_bind_result() {
			return method.apply(obj, arguments);
		};
	}
	return function _Q_bind_result_withOptions() {
		var args = Array.prototype.slice.call(arguments);
		if (options) args.push(options);
		return method.apply(obj, args);
	};
};

// Backward compatibility with older versions of Node.js
fs.exists = fs.exists || function(uri, callback){return path.exists.call(path, uri, callback);};
fs.existsSync = fs.existsSync || function(uri){return path.existsSync.call(path, uri);};
if (!Buffer.from) {
	Buffer.from = function (x, y, z) {
	    if (typeof x === 'number') {
			throw new TypeError('Buffer.from: first argument must not be a number');
	    }
		return new Buffer(x, y, z);
	};
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function _Array_prototype_indexOf(searchElement /*, fromIndex */ ) {
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
			} else if (n !== 0 && n !== root.Infinity && n !== -root.Infinity) {
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
}

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
	return obj.stack;
};

Q.globalNames = Object.keys(root); // to find stray globals

/**
 * This function is useful to make sure your code is not polluting the global namespace
 * @method globalNamesAdded
 * @static
 */
Q.globalNamesAdded = function () {
	return Q.diff(Object.keys(root), Q.globalNames);
};
