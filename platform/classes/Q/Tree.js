/**
 * @module Q
 */
 
var Q = require('../Q');
var fs = require('fs');

/**
 * Creates a Q.Tree object
 * @class Tree
 * @namespace Q
 * @constructor
 * @param {object} [linked={}] If supplied, then this object is
 *  used as the internal tree that Tree operates on.
 */
module.exports = function (linked) {

	if (linked === undefined) {
		linked = {};
	}
	
	if (Q.typeOf(linked) === 'Q.Tree') {
		linked = linked.getAll();
	}
	
	this.typename = "Q.Tree";

	/**
	 * Loads data into a tree from a file.
	 * @method load
	 * @param {string} filename The filename of the file to load.
	 * @param {function} [callback=null] Function to call back, with params (err, data)
	 * @throws {Q.Exception} if filename is not string or array of strings
	 */
	this.load = function (filename, callback) {
		var that = this;
		var filenames;
		switch (Q.typeOf(filename)) {
			case 'string':
				filenames = [filename];
				break;
			case 'array':
				filenames = filename;
				break;
			default:
				throw new Q.Exception("Q.Tree.load: filename has to be a string or array");
		}
		var p = new Q.Pipe(filenames, function (params) {
			// All the files were requested, time to merge them in the right order
			for (var i=0; i<filenames.length; ++i) {
				var k = filenames[i];
				// if (params[k][0] && params[k][0].code === 'ENOENT') {
				// 	// file doesn't exist, it's OK, keep going
				// }
				if (params[k][1]) {
					that.merge(params[k][1]);
				}
			}
			this.filename = filename;
			callback && callback.call(that, null, that.getAll());
		});
		for (var i=0; i<filenames.length; ++i) {
			(function (i) {
				var isPHP = (filenames[i].substr(-4).toLowerCase() === '.php');
				fs.readFile(filenames[i].replace('/', Q.DS), 'utf-8', function (err, data) {
					if (err) {
						p.fill(filenames[i])(err, null);
						return;
					}
					try {
						if (isPHP) {
							data = data.substring(
								data.indexOf("\n") + 1,
								data.lastIndexOf("\n")
							);
						}
						data = data.replace(/\s*(?!<")\/\*[^\*]+\*\/(?!")\s*/gi, '');
						data = data.replace(/\,\s*\}/, '}');
						data = JSON.parse(data);
					} catch (e) {
						p.fill(filenames[i])(e, null);
					}
					p.fill(filenames[i])(null, data);
				});
			})(i);
		}
	};

	/**
	 * Saves a (sub)tree of parameters to a file
	 * @method save
	 * @param {string} filename The filename to save into.
	 *   If tree was loaded from a single file, you can leave this blank to update that file.
	 * @param {array} [arrayPath=[]] Array of keys identifying the path of the subtree to save
	 * @param {array} [prefixPath=[]] Array of keys identifying the prefix path of the subtree to save
	 * @param {function} [callback=null] Function to call back, with params (err)
	 */
	this.save = function (filename, arrayPath, prefixPath, callback) {
		if (!filename && (typeof this.filename === 'string')) {
			filename = this.filename;
		}
		if (typeof arrayPath === 'function' || typeof arrayPath === 'undefined') {
			callback = arrayPath;
			arrayPath = prefixPath = [];
		} else if (typeof prefixPath === 'function' || typeof prefixPath === 'undefined') {
			callback = prefixPath;
			prefixPath = [];
		}

		var d, data = this.get.apply(this, [arrayPath]), that = this;

		if(Q.typeOf(prefixPath) !== 'array') prefixPath = prefixPath ? [prefixPath] : [];

		for (var i=prefixPath.length-1; i>=0; i--) {
			d = {};
			d[prefixPath[i]] = data;
			data = d;
		}

		to_save = JSON.stringify(data, null, '\t');
		var mask = process.umask(parseInt(Q.Config.get(['Q', 'internal', 'umask'], "0000"), 8));
		fs.writeFile(filename.replace('/', Q.DS), to_save, function (err) {
			process.umask(mask);
			callback && callback.call(that, err);
		});
	};

	/**
	 * Gets the entire tree of parameters
	 * @method getAll
	 * @return {object}
	 */
	this.getAll = function () {
		return linked;
	};

	/**
	 * Gets the value of a field in the tree
	 * @method get
	 * @param {string|array} [keys=[]] A key or an array of keys for traversing the tree.
	 * @param {mixed} [def=undefined] The value to return if the field is not found. Defaults to undefined.
	 * @return {mixed} The field if it is found, otherwise def or undefined.
	 * @throws {Q.Exception} if subtree is not an object
	 */
	this.get = function (keys, def) {
		if (typeof keys === 'undefined') keys = [];
		if (typeof keys === 'string') {
			var arr = [];
			for (var j=0; j<arguments.length-1; ++j) {
				arr.push(arguments[j]);
			}
			keys = arr;
			def = arguments[arguments.length-1];
		}
		var result = linked, key, sawKeys = [];
		for (var i=0, len = keys.length; i<len; ++i) {
			key = keys[i];
			if (typeof result !== 'object') {
				return def; // silently ignore the rest of the path
				// var sawString = '["' + sawKeys.join('"]["') + '"]';
				// throw new Q.Exception(
				// 	"Q.Tree: subtree at '"+sawString+"' is not an object",
				// 	{keys: keys, key: key}
				// );
			}
			if (!result || key == null || !(key in result)) {
				return def;
			}
			result = result[key];
			sawKeys.push(key);
		}
		return result;
	};

	/**
	 * Sets the value of a field in the tree. If only one argument is given,
	 * it is assigned as tree value
	 * @method set
	 * @param {string|array} keys A key or an array of keys for traversing the tree.
	 * @param {mixed} value The value to set for that field.
	 * @return {Q.Tree} Returns itself for chaining
	 * @chainable
	 */
	this.set = function (keys, value) {
		var k;
		if (arguments.length === 1) {
			linked = (typeof keys === "object") ? keys : [keys];
		} else {
			if (Q.typeOf(keys) === 'object') {
				for (k in keys) {
					linked[k] = keys[k];
				}
			} else {
				if (typeof keys === 'string') {
					var arr = [];
					for (var j=0; j<arguments.length-1; ++j) {
						arr.push(arguments[j]);
					}
					keys = arr;
					value = arguments[arguments.length-1];
				}
				var result = linked, key;
				for (var i=0, len = keys.length; i<len-1; ++i) {
					key = keys[i];
					if (!(key in result) || Q.typeOf(result[key]) !== 'object') {
						result[key] = {}; // overwrite with an object
					}
					result = result[key];
				}
				if (key = keys[len-1]) {
					result[key] = value;
				}
			}
		}
		return this;
	};

	/**
	 * Clears the value of a field, removing that key from the tree
	 * @method clear
	 * @param {string|array} [keys=null] A key or an array of keys for traversing the tree. If null, clears entire tree.
	 * @return {boolean} Returns whether the field to be cleared was found
	 */
	this.clear = function (keys) {
		if (!keys) {
			linked = {};
			return;
		}
		if (typeof keys === 'string') {
			keys = [keys];
		}
		var result = linked, key;
		for (var i=0, len = keys.length; i<len; ++i) {
			key = keys[i];
			if (typeof result !== 'object') {
				return false;
			}
			if (!(key in result)) {
				return false;
			}
			if (i === len - 1) {
				// return the final value
				delete result[key];
				return true;
			}
			result = result[key];
		}
		return false;
	};

	/**
	 * Traverse the tree depth-first and call the callback
	 * @method depthFirst
	 * @param {Function} callback Will receive (path, value, tree, context)
	 * @param {mixed} [context=null] To propagate some context to the callback
	 */
	this.depthFirst = function(callback, context) {
		_depthFirst.call(this, [], linked, callback, context);
	};

	/**
	 * Traverse the tree breadth-first and call the callback
	 * @method breadthFirst
	 * @param {Function} callback Will receive (path, value, tree, context)
	 * @param {mixed} [context=null] To propagate some context to the callback
	 */
	this.breadthFirst = function(callback, context) {
		callback.call(this, [], linked, linked, context);
		_breadthFirst.call(this, [], linked, callback, context);
	};

	/**
	 * Calculates a diff between this tree and another tree
	 * @method diff
	 * @param {Q.Tree} tree
	 * @return {Q.Tree} This tree holds the results of the diff
	 */
	this.diff = function(tree) {
		var context = {
			from: this,
			to: tree,
			diff: new Q.Tree()
		};
		this.depthFirst(_diffTo, context);
		tree.depthFirst(_diffFrom, context);
		return context.diff;
	};

	function _diffTo (path, value, arr, context) {
		var valueTo = context.to.get(path, null);
		if ((!Q.isPlainObject(value) || !Q.isPlainObject(valueTo))
		&& valueTo !== value) {
			if (Q.isArrayLike(value) && Q.isArrayLike(valueTo)) {
				valueTo = {replace: valueTo};
			}
			context.diff.set(path, valueTo);
		}
		if (valueTo == null) {
			return false;
		}
	}

	function _diffFrom (path, value, arr, context) {
		var valueFrom = context.from.get(path, undefined);
		if (valueFrom === undefined) {
			context.diff.set(path, value);
			return false;
		}
	}

	/**
	 * Merges a tree over the top of an existing tree
	 * @method merge
	 * @param {Q.Tree|Object} second The Object or Q.Tree to merge over the existing tree.
	 * @param {boolean} [under=false] If true, merges the second under this tree, instead of over it.
	 *  By default, second is merged on top of this tree.
	 * @return {object} Returns the resulting tree, modified by the merge.
	 **/
	this.merge = function(second, under) {
		if (Q.typeOf(second) === 'Q.Tree') {
			this.merge(second.getAll(), under);
		} else if (typeof second === 'object') {
			if (under === true) {
				linked = _merge(second, linked);
			} else {
				linked = _merge(linked, second);
			}
		} else {
			return false;
		}
		return this;
	};

	function _merge(first, second) {
		var result = (Q.typeOf(second) === 'object' ? {} : []);
		var k;
		// copy first to the result
		if (Q.typeOf(first) === 'array' && second.replace) {
			return second.replace;
		}
		for (k in first) {
			result[k] = first[k];
		}
		switch (Q.typeOf(second)) {
			case 'array':
				// merge in values if they are not in array yet
				// if array contains scalar values only unique values are kept
				for (k=0; k<second.length; k++) {
					if (result.indexOf(second[k]) < 0) {
						result.push(second[k]);
					}
				}
				break;
			case 'object':
				for (k in second) {
					if (!(k in result)) {
						// key is not in result so just add it
						result[k] = second[k];
					} else if (typeof result[k] !== 'object' || result[k] === null) {
						// result[k] is scalar type
						result[k] = second[k];
					} else if (typeof second[k] !== 'object' || second[k] === null) {
						// key already in result but second[k] is scalar
						result[k] = second[k];
					} else {
						// otherwise second[k] is an object so merge it in
						result[k] = _merge(result[k], second[k]);
					}
				}
				break;
			case 'null':
				break;
			default:
				throw new Q.Exception("Cannot merge scalar '"+second+"' into Q.Tree");
		}
		return result;
	}
};

function _depthFirst(subpath, obj, callback, context)  {
	var k, v, path;
	for (k in obj) {
		v = obj[k];
		path = subpath.concat([k]);
		if (false === callback.call(this, path, v, obj, context)) {
			continue;
		}
		if (Q.isPlainObject(v)) {
			_depthFirst.call(this, path, v, callback, context);
		}
	}
}

function _breadthFirst(subpath, obj, callback, context) {
	var k, v, path;
	for (k in obj) {
		v = obj[k];
		path = subpath.concat([k]);
		if (false === callback.call(this, path, v, obj, context)) {
			break;
		}
	}
	for (k in obj) {
		if (Q.isPlainObject(v)) {
			path = subpath.concat([k]);
			_breadthFirst.call(this, path, v, callback);
		}
	}
}