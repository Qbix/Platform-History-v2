"use strict";
/* jshint -W014 */

/**
 * Contains core Qbix functionality.
 * @module Q
 * @main Q
 */
var express = require('express');
var http = require('http');
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

Q.VERSION = 0.8;

Q.Error = Error;

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
	context = context || null;
	if(!parts.length) return context;
	while(context && (p = parts[i++]) !== undefined){
		context = (typeof context === 'object') && (p in context) 
			? context[p] 
			: (create ? context[p] = {} : undefined);
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
 * @param {Object} [context=window] Optional. Object to use as root of path.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @return {Object|undefined} Returns the passed value if setting is successful or `undefined` if not.
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
 * @param {Object} [context=window] Optional. Object to use as root of path. Null may be passed.
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
		Q.setObject(name, create, context, delimiter);
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
 * @method Pipe
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
 * This function helps create "batch functions", which can be used in getter functions
 * and other places to accomplish things in batches.
 * @method batcher
 * @param {Function} batch
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
 * @param {Object} options
 *  An optional hash of possible options, which can include:
 *  "max": Defaults to 10. When the number of individual calls in the queue reaches this,
 *         the batch function is run.
 *  "ms": Defaults to 50. When this many milliseconds elapse without another call to the
 *         same batcher function, the batch function is run.
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
 * @param {Object} options
 *  An optional hash of possible options, which include:
 *  "throttle" => a String id to throttle on, or an Object that supports the throttle interface:
 *	"throttle.throttleTry" => function(subject, getter, args) - applies or throttles getter with subject, args
 *	"throttle.throttleNext" => function (subject) - applies next getter with subject
 *	"throttleSize" => defaults to 100. Integer representing the size of the throttle, if it is enabled
 *	"cache" => pass false here to prevent caching, or an object which supports the Q.Cache interface
 * @return {Function}
 *  The wrapper function, which returns an object with a property called "result"
 *  which could be one of Q.getter.CACHED, Q.getter.WAITING, Q.getter.REQUESTING or Q.getter.THROTTLING
 */
Q.getter = function _Q_getter(original, options) {


	function wrapper() {
		var i, key, that = this, callbacks = [];
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
		wrapper.emit('called', this, arguments2, ret);

		var cached, cbpos, cbi;
		Q.getter.usingCached = false;

		// if caching is required check the cache -- maybe the result is there
		if (wrapper.cache && !ignoreCache) {
			if (cached = wrapper.cache.get(key)) {
				cbpos = cached.cbpos;
				if (callbacks[cbpos]) {
					wrapper.emit('result', cached.subject, cached.params, arguments2, ret, original);
					Q.getter.usingCached = true;
					callbacks[cbpos].apply(cached.subject, cached.params);
					ret.result = Q.getter.CACHED;
					wrapper.emit('executed', this, arguments2, ret);
					Q.getter.usingCached = false;
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
			wrapper.emit('executed', this, arguments2, ret);
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
					if (wrapper.cache && !ret.dontCache) {
						wrapper.cache.set(key, cbpos, this, arguments);
					}

					// process waiting callbacks
					var wk = _waiting[key];
					if (wk) for (i = 0; i < wk.length; i++) {
						wrapper.emit('result', this, arguments, arguments2, wk[i].ret, original);
						wk[i].callbacks[cbpos].apply(this, arguments);
					}
					delete _waiting[key];

					// tell throttle to execute the next function, if any
					if (wrapper.throttle && wrapper.throttle.throttleNext) {
						wrapper.throttle.throttleNext(this);
					}
				};
			})(callbacks[cbi], cbi));
			++cbi; // the index in the array of callbacks
		}

		if (!wrapper.throttle) {
			// no throttling, just run the function
			if (false === original.apply(that, args)) {
				ret.dontCache = true;
			}
			ret.result = Q.getter.REQUESTING;
			wrapper.emit('executed', this, arguments2, ret);
			return ret;
		}

		if (!wrapper.throttle.throttleTry) {
			// the throttle object is probably not set up yet
			// so set it up
			var p = {
				size: wrapper.throttleSize,
				count: 0,
				queue: [],
				args: []
			};
			wrapper.throttle.throttleTry = function _throttleTry(that, getter, args, ret) {
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
			wrapper.throttle.throttleNext = function _throttleNext(that) {
				if (--p.count < 0) {
					console.warn("Q.getter: throttle count is negative");
				}
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!wrapper.throttleSize) {
			wrapper.throttle.throttleSize = function _throttleSize(newSize) {
				if (typeof(newSize) === 'undefined') {
					return p.size;
				}
				p.size = newSize;
			};
		}

		// execute the throttle
		ret.result = wrapper.throttle.throttleTry(this, original, args, ret)
			? Q.getter.REQUESTING
			: Q.getter.THROTTLING;
		wrapper.emit('executed', this, arguments2, ret);
		return ret;
	}

	Q.extend(wrapper, original, Q.getter.options, options);
	Q.makeEventEmitter(wrapper);

	var _waiting = {};
	if (wrapper.cache === false) {
		// no cache
		wrapper.cache = null;
	} else if (wrapper.cache === true) {
		// create our own Object that will cache locally in the page
		wrapper.cache = Q.Cache.document(++_Q_getter_i);
	} else {
		// assume we were passed an Object that supports the cache interface
	}

	wrapper.throttle = wrapper.throttle || null;
	if (wrapper.throttle === true) {
		wrapper.throttle = '';
	}
	if (typeof wrapper.throttle === 'string') {
		// use our own objects
		if (!Q.getter.throttles[wrapper.throttle]) {
			Q.getter.throttles[wrapper.throttle] = {};
		}
		wrapper.throttle = Q.getter.throttles[wrapper.throttle];
	}

	wrapper.forget = function _forget() {
		var key = Q.Cache.key(arguments);
		if (key && wrapper.cache) {
			return wrapper.cache.remove(key);
		}
	};
	
	var ignoreCache = false;
	wrapper.force = function _force() {
		ignoreCache = true;
		wrapper.apply(this, arguments);
	};

	if (original.batch) {
		wrapper.batch = original.batch;
	}
	return wrapper;
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
 * 
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
 * after calls stopped coming in for a given number of milliseconds
 * 
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
		_timeout = setTimeout(function () {
			original.apply(t, a);
		}, milliseconds);
		return defaultValue;
	};
};

/**
 * Q.Cache constructor
 * @namespace Q
 * @class Cache
 * @constructor
 * @param {Object} [options={}] you can pass the following options:
 *  "max": the maximum number of items the cache should hold. Defaults to 100.
 */
Q.Cache = function  _Q_Cache(options) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
	options = options || {};
	this.name = options.name;
	this.data = {};
	this.max = options.max || 100;
	this.earliest = this.latest = null;
	this.count = 0;
};
/**
 * Generates the key under which things will be stored in a cache
 * @method key
 * @param {Array} args the arguments from which to generate the key
 * @param {Array} functions optional array to which all the functions found in the arguments will be pushed
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
	if (typeof key !== 'string') {
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
		params: params,
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
	return existing ? true : false;
};
/**
 * Accesses the cache and gets an entry from it
 * @method get
 * @param {String} key
 * @param {Object} options supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
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
	if (typeof key !== 'string') {
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
 * Cycles through all the entries in the cache
 * @method each
 * @param {Array} args An array consisting of some or all the arguments that form the key
 * @param {Function} callback Is passed two parameters: key, value, with this = the cache
 */
Q.Cache.prototype.each = function _Q_Cache_prototype_clear(args, callback) {
	var cache = this;
	var prefix = null;
	if (!callback) return;
	if (typeof args === 'function') {
		callback = args;
		args = undefined;
	} else {
		var json = Q.Cache.key(args);
		prefix = json.substring(0, json.length-1);
	}
	return Q.each(this.data, function (key, item) {
		if (prefix && k.substring(0, prefix.length) !== prefix) {
			return;
		}
		if (callback.call(cache, key, item) === false) {
			return false;
		}
	});
};
/**
 * @method local
 * @param {String} name
 * @return {mixed}
 */
Q.Cache.local = function _Q_Cache_local(name) {
	if (!Q.Cache.local.caches[name]) {
		Q.Cache.local.caches[name] = new Q.Cache({name: name});
	}
	return Q.Cache.local.caches[name];
};
Q.Cache.local.caches = {};

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
		for (k in callables) {
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
 * @param {Object} options
 *  "firstKey": return the first non-empty key
 * @return {Number|String}
 *  the index in the container, or null
 * @throws {Q.Exception} If container is not array, object or string
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
			throw new Q.Exception("Q.first: container has to be an array, object or string");
	}
	return null;
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
		return Array.prototype.slice.call(x, 0);
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
				if (levels && (target[k] && typeof target[k] === 'object') 
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
 * Returns the number of milliseconds since the first call to this function
 * i.e. since this script was parsed.
 * @method milliseconds
 * @param {Boolean} sinceEpoch
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
		var found = {dirs: [], files: []},
			total = 0,
			processed = 0;
		function isDir(abspath) {
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
						isDir(path.join(start, files[x]));
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

// Hashes
var hexcase=0;
var b64pad="";
function any_md5(a,b){return rstr2any(rstr_md5(str2rstr_utf8(a)),b);}
function any_hmac_md5(a,c,b){return rstr2any(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(c)),b);}
function md5_vm_test(){return hex_md5("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72";}
function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8));}
function rstr_hmac_md5(c,f){var e=rstr2binl(c);if(e.length>16){e=binl_md5(e,c.length*8);}var a=Array(16),d=Array(16);for(var b=0;b<16;b++){a[b]=e[b]^909522486;d[b]=e[b]^1549556828;}var g=binl_md5(a.concat(rstr2binl(f)),512+f.length*8);return binl2rstr(binl_md5(d.concat(g),512+128));}
function rstr2hex(c){try{hexcase;}catch(g){hexcase=0;}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15);}return b;}
function rstr2b64(c){try{b64pad;}catch(h){b64pad="";}var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b="";var a=c.length;for(var f=0;f<a;f+=3){var k=(c.charCodeAt(f)<<16)|(f+1<a?c.charCodeAt(f+1)<<8:0)|(f+2<a?c.charCodeAt(f+2):0);for(var d=0;d<4;d++){if(f*8+d*6>c.length*8){b+=b64pad;}else{b+=g.charAt((k>>>6*(3-d))&63);}}}return b;}
function rstr2any(m,c){var b=c.length;var l,f,a,n,e;var k=Array(Math.ceil(m.length/2));for(l=0;l<k.length;l++){k[l]=(m.charCodeAt(l*2)<<8)|m.charCodeAt(l*2+1);}var h=Math.ceil(m.length*8/(Math.log(c.length)/Math.log(2)));var g=Array(h);for(f=0;f<h;f++){e=Array();n=0;for(l=0;l<k.length;l++){n=(n<<16)+k[l];a=Math.floor(n/b);n-=a*b;if(e.length>0||a>0){e[e.length]=a;}}g[f]=n;k=e;}var d="";for(l=g.length-1;l>=0;l--){d+=c.charAt(g[l]);}return d;}
function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++;}if(a<=127){b+=String.fromCharCode(a);}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63));}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63));}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63));}}}}}return b;}
function str2rstr_utf16le(b){var a="";for(var c=0;c<b.length;c++){a+=String.fromCharCode(b.charCodeAt(c)&255,(b.charCodeAt(c)>>>8)&255);}return a;}
function str2rstr_utf16be(b){var a="";for(var c=0;c<b.length;c++){a+=String.fromCharCode((b.charCodeAt(c)>>>8)&255,b.charCodeAt(c)&255);}return a;}
function rstr2binl(b){var a=Array(b.length>>2),c;for(c=0;c<a.length;c++){a[c]=0;}for(c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32);}return a;}
function binl2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255);}return a;}
function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;var o=1732584193;var n=-271733879;var m=-1732584194;var l=271733878;for(var g=0;g<p.length;g+=16){var j=o;var h=n;var f=m;var e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e);}return Array(o,n,m,l);}
function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d);}
function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h);}
function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h);}
function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h);}
function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h);}
function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535);}
function bit_rol(a,b){return(a<<b)|(a>>>(32-b));}
/**
 * Calculates MD5 hash
 * @method md5
 * @param {String} a
 * @return {String} The calculated hash
 */
Q.md5 = function _Q_md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)));};
/**
 * Calculates b64_MD5 hash
 * @method b64_md5
 * @param {String} a
 * @return {String} The calculated hash
 */
Q.md5_b64 = function _Q_md5_b64(a){return rstr2b64(rstr_md5(str2rstr_utf8(a)));};
/**
 * Calculates MD5_HMAC hash
 * @method md5_hmac
 * @param {String} a
 * @param {String} b
 * @return {String} The calculated hash
 */
Q.md5_hmac = function _Q_md5_hmac(a,b){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)));};
/**
 * Calculates MD5_HMAC_b64 hash
 * @method md5_hmac_b64
 * @param {String} a
 * @param {String} b
 * @return {String} The calculated hash
 */
Q.md5_hmac_b64 = function _Q_md5_hmac_b64(a,b){return rstr2b64(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)));};

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

/*
 * A collection of HTTP servers started with Q.listen
 * @property servers
 * @type Object
 * @default {}
 */
Q.servers = {};

/**
 * Starts internal server to listen for messages from PHP processes and other things.
 * Uses the Q/node/port and Q/node/host config fields.
 * Make sure to protect the communication using a firewall.
 * @static
 * @method listen
 * @param {Object} [options={}] Options can include:
 * @param {String} [options.port] the port to listen on
 * @param {String} [options.host] the hostname to listen on
 * @param {Array} [options.attach] an array of additional listeners to attach. Each member is a name of a class (e.g. "Q.Socket", "Q.Dispatcher" and "Db") which has the listen(options) method.
 * @param {Object} [options.https] https options. Not supported for now.
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
		server = http.createServer(_express);
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
	app.use(express.bodyParser());
	
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
	})
	app.use(function Q_request_handler (req, res, next) {
		// WARNING: the following per-request log may be a bottleneck in high-traffic sites:
		var a = server.address();
		if (Q.Config.get('Q', 'node', 'logRequests', true)) {
			console.log(req.method+" "+req.socket.remoteAddress+ " -> "+a.address+":"+a.port+req.url.split('?', 2)[0] + (req.body['Q/method'] ? ", method: '"+req.body['Q/method']+"'" : ''));
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
			Q.Utils.validate(req, res, _requested);
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
 * @param {object} app An object that MUST contain one key:
 * * DIR: the directory of the app
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
	 * Application data
	 * @property app
	 * @type object
	 */
	Q.app = app;
	
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
		if (!(k in app)) {
			app[k] = app.DIR  + '/' + dirs[k];
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
	 * Reference to Q.Mustache class
	 * @property Mustache
	 * @type {object}
	 */
	Q.Mustache = require('./Q/Mustache');
    /**
     * Reference to Q.Handlebars class
     * @property Handlebars
     * @type {object}
     */
    Q.Handlebars = require('./Q/Handlebars');
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
		if (err) process.exit(2); // if run as child Q.Bootstrap.configure returns errors in callback
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
		if (fs.existsSync(fullpath) || fs.existsSync(fullpath + '.js')) {
			result = fullpath;
			break;
		}
  }
	realPath_results[filename] = result;
	return result;
};
var realPath_results = {};

/**
 * Require node module
 * @method require
 * @param {String} what
 * @return {mixed}
 */
Q.require = function _Q_require(what) {
	var realPath = Q.realPath(what);
	if (!realPath) throw new Error("Q.require: file '"+what+"' not found");
	return require(realPath);
};

var logStream = {};

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
		if (message instanceof Error
		|| (message.fileName && message.stack)) {
			var error = message;
			message = error.name + ": " + error.message
				+ "\n" + "in " + error.fileName
					+ " at (" + error.lineNumber + ":" + error.columnNumber + ")"
				+ "\n" + error.stack;
		} else {
			message = 'inspecting "'+Q.typeOf(message)+'":\n'+util.inspect(message, false, Q.Config.get('Q', 'var_dump_max_levels', 5));
		}
	}

	message = (timestamp ? '['+Q.date('Y-m-d h:i:s')+'] ' : '')+(name ? name : 'Q')+': ' + message + "\n";

	if (!name) {
		return console.log(message);
	}
	if (typeof logStream[name] === "undefined") {
		logStream[name] = [];
		var path = ((Q.app && Q.app.FILES_DIR) ? Q.app.FILES_DIR : Q.FILES_DIR)+Q.DS+'Q'+Q.DS+Q.Config.get(['Q', 'internal', 'logDir'], 'logs');
		var filename = path+Q.DS+name+'_node.log';
		Q.Utils.preparePath(filename, function (err) {
			if (err) {
				console.error("Failed to create directory '"+path+"', Error:", err.message);
				callback && callback(err);
			} else {
				fs.stat(filename, function (err, stats) {
					if (err && err.code !== 'ENOENT') {
						console.error("Could not stat '"+filename+"', Error:", err.message);
						callback && callback(err);
						return;
					} else if (err && err.code === 'ENOENT') {
						logStream[name].unshift(message);
					} else if (!stats.isFile()) {
						console.error("'"+filename+"' exists but is not a file");
						callback && callback(new Error("'"+filename+"' exists but is not a file"));
						return;
					}
					var log = logStream[name];
					var stream = logStream[name] = fs.createWriteStream(
						filename, {flags: 'a', encoding: 'utf-8'}
					);
					stream.write(message);
					while (log.length) {
						stream.write(log.shift());
					}
				});
			}
		});
	} else if (!logStream[name].path) {
		logStream[name].push(message);
		callback && callback();
	} else {
		logStream[name].write(message);
		callback && callback();
	}
};

String.prototype.toCapitalized = function _String_prototype_toCapitalized() {
	return (this + '').replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

String.prototype.isUrl = function () {
	return this.match(/^[A-Za-z]*:\/\//);
};

String.prototype.encodeHTML = function _String_prototype_encodHTML(quote_style, charset, double_encode) {
	return this.replaceAll({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;'
	});
};

String.prototype.decodeHTML = function _String_prototype_encodHTML(quote_style, charset, double_encode) {
	return this.replaceAll({
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&apos;': "'"
	});
};

String.prototype.hashCode = function() {
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		var c = this.charCodeAt(i);
		hash = hash % 16777216;
		hash = ((hash<<5)-hash)+c;
		hash = hash & 0xffffffff; // Convert to 32bit integer
	}
	return hash;
};

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
 * @method firstErrorMessage
 * @param {Object} data an object where the errors may be found, you can pass as many of these as you want
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
		} else {
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
 * Obtain a URL
 * @method url
 * @param {Object} what
 *  Usually the stuff that comes after the base URL
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} options
 *  A hash of options, including:
 *  'baseUrl': A string to replace the default base url
 *  'cacheBust': Number of milliseconds before a new cachebuster is appended
 */
Q.url = function _Q_url(what, fields, options) {
	var what2 = what;
	if (fields) {
		for (var k in fields) {
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
	var baseUrl = (options && options.baseUrl);
	if (!baseUrl) {
		var cs = Q.Config.get(['Q', 'web', 'controllerSuffix']);
		baseUrl = Q.Config.get(['Q', 'web', 'appRootUrl']);
			+ (cs ? '/' + cs : '');
	}
	if (!what) {
		result = baseUrl + (what === '' ? '/' : '');
	} else if (what2.isUrl()) {
		result = what2;
	} else {
		result = baseUrl + ((what2.substr(0, 1) == '/') ? '' : '/') + what;
	}
	return result;
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
		return null;
	};
}

String.prototype.toCapitalized = function _String_prototype_toCapitalized() {
	return (this + '').replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

String.prototype.encodeHTML = function _String_prototype_htmlentities(quote_style, charset, double_encode) {
	return this.replaceAll({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;'
	});
};

String.prototype.quote = function _String_prototype_quote() {
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
 * Goes through the params and replaces any references
 * to their names in the string with their value.
 * References are expected to be of the form {{varname}}
 * @method interpolate
 * @param {Object} params
 *  A hash of parameters for interpolating in the expression.
 *  Variable names in the expression can refer to them.
 * @return {string}
 *  The result of the interpolation
 */
String.prototype.interpolate = function _String_prototype_interpolate(params) {
	return this.replace(/\{\{([^{}]*)\}\}/g,
		function (a, b) {
			var r = params[b];
			return typeof r === 'string' || typeof r === 'number' ? r : a;
		}
	);
};

String.prototype.replaceAll = function _String_prototype_replaceAll(pairs) {
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
 * @param {String} value Optional, provide a value to set in the querystring, or null to delete any fields that match name as a RegExp
 * @return {String} the value of the field in the source, or if value was not undefined, the resulting querystring
 */
String.prototype.queryField = function Q_queryField(name, value) {
	var what = this;
	var prefixes = ['#!', '#', '?', '!'], count = prefixes.length, prefix = '', i, l, p, keys, parsed;
	for (var i=0; i<count; ++i) {
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
		return prefix + Q.buildQueryString(parsed, keys);
	} else {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		if (!(name in parsed)) {
			keys.push(name);
		}
		parsed[name] = value;
		return prefix + Q.buildQueryString(parsed, keys);
	}
};

if (!String.prototype.trim) {
	String.prototype.trim = function _String_prototype_trim() {
		return this.replace(/^\s+|\s+$/g, "");
	};
}

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
	if (!obj) obj = window;
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
			} else if (n !== 0 && n !== window.Infinity && n !== -window.Infinity) {
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

// Backward compatibility with older versions of Node.js
fs.exists = fs.exists || function(uri, callback){return path.exists.call(path, uri, callback);};
fs.existsSync = fs.existsSync || function(uri){return path.existsSync.call(path, uri);};
