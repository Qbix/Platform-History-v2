/**
 * @module Q
 */
var Q = require('../Q');

var p = new Q.Tree();
/**
 * Holds application config
 * @class Config
 * @namespace Q
 * @static
 */
var Config = {};

/**
 * Loads a configuration file and merges it into the internal config.
 * @method load
 * @param {string} filename The filename of the file to load.
 */
Config.load = function (filename, callback) {
	return p.load.apply(this, arguments);
};

/**
 * Saves the configuration to a file
 * @method save
 * @param {string} filename The filename to save into
 * @param {array} [arrayPath=[]] Array of keys identifying the path of the config to save
 * @param {array} [prefixPath=[]] Array of keys identifying the prefix path of the config to save
 * @param {function} [callback=null]
 */
Config.save = function (filename, arrayPath, prefixPath, callback) {
	return p.save.apply(this, arguments);
};

/**
 * Gets the entire configuration tree
 * @method getAll
 * @return {object}
 */
Config.getAll = function () {
	return p.getAll();
};

/**
 * Gets the value of a configuration field
 * @method get
 * @param {string|array} [keys=[]] A key or an array of keys for traversing the configuration tree.
 * @param {mixed} [def=undefined] The value to return if the field is not found. Defaults to undefined.
 * @return {mixed} The configuration field if it is found, otherwise def or undefined.
 */
Config.get = function (keys, def) {
	return p.get.apply(this, arguments);
};

/**
 * Sets the value of a configuration field
 * @method set
 * @param {string|array} keys A key or an array of keys for traversing the configuration tree.
 * @param {mixed} value The value to set for that field.
 */
Config.set = function (keys, value) {
	return p.set.apply(this, arguments);
};

/**
 * Clears the value of a field, removing that key from the tree
 * @method clear
 * @param {string|array} [keys=null] A key or an array of keys for traversing the configuration tree. If null, clears entire config.
 * @return {boolean} Returns whether the field to be cleared was found
 */
Config.clear = function (keys) {
	return p.clear.apply(this, arguments);
};

/**
 * Merges a configuration over the top of an existing configuration
 * @method merge
 * @param {Q.Tree|object} second The Object or Q.Tree to merge on top of the existing one
 **/
Config.merge = function(second) {
	return p.merge.apply(this, arguments);
};

/**
 * Gets the value of a configuration field. If it is null or not set,
 * throws an exception. Otherwise, it is guaranteed to return a non-null value.
 * May throw an exception if the config field is missing.
 * @method expect
 * @param {string|array} keys A key or an array of keys for traversing the configuration tree.
 * @return {mixed} Only returns non-null values
 * @throws {Q.Exception} if value is missing
 */
Config.expect = function(keys) {
	var value = p.get.apply(p, arguments);
	if (value === undefined) {
		var k = (keys.constructor.name === 'Array') ? keys.join('/') : keys;
		throw new Q.Exception("Q.Config: expected value at " + k);
	}
	return value;
};

/**
 * Check for config server url and return it if found
 * @method serverInfo
 * @return {mixed} Config server information or false if config server is not defined
 * (if called from 'Q/config' listener also returns false if config server itself is requested)
 */
Config.serverInfo = function() {
	var cs = Config.get(['Q', 'internal', 'configServer'], false);
	if (!cs || !cs.url) return false;
	else if (_self) return false;
	return cs;
};

/**
 * Get contents of config file
 * Config file is searched in APP_DIR/files forder. If config server url is defined
 * the filename is searched on config server
 * @method getFromServer
 * @param {string} filename The name of the config file. If config server is defined, file is got from there
 * @param {function} callback Callback receives error and Q.tree content as arguments
 */
Config.getFromServer = function(filename, callback) {
	var cs;
	if (cs = Config.serverInfo()) {
		// request config server
		Q.Utils[!!cs.internal ? 'queryInternal' : 'queryExternal']
				('Q/Config', {'Q/method': 'get', filename: filename}, cs.url, callback);
		return;
	}
	// take local file, return empty tree if file does not exists
	(new Q.Tree()).load(Q.app.DIR+Q.DS+'files'+Q.DS+filename, function(err, data) {
		if (err) {
			if (err.code !== "ENOENT") {
				callback && callback(err);
				return;
			} else data = {};
		}
		callback && callback(null, data);
	});
};

/**
 * Modify a config file by merging over new data
 * Config file is searched in APP_DIR/files forder. If config server url is defined
 * the filename is searched on config server
 * @method setOnServer
 * @param {string} filename The name of the config file. If config server is defined, file is changed there
 * @param {array} data The data to merge to the file
 * @param {function} callback Callback receives error as arguments
 * @param {boolean} [clear=false] Weather data shall be merged over or cleared and set
 */
Config.setOnServer = function(filename, data, callback, clear) {
	if (typeof data !== "object") callback && callback(new Error("Wrong argument type in 'setConfig'"));
	else {
		if (Q.typeOf(clear) === "string") clear = JSON.parse(clear);
		var cs;
		if (cs = Config.serverInfo()) {
			// request config server
			Q.Utils[!!cs.internal ? 'queryInternal' : 'queryExternal']
				('Q/Config', {'Q/method': 'set', filename: filename, data: data, clear: !!clear}, cs.url, callback);
			return;
		}
		// save local file, return empty tree if file does not exists
		filename = Q.app.DIR+Q.DS+'files'+Q.DS+filename;
		// file esists???
		Q.Utils.preparePath(filename, function (err) {
			if (err) callback && callback(err);
			else {
				var tree = new Q.Tree();
				if (!clear)
					tree.load(filename, function(err) {
						if (err && err.code !== "ENOENT") {
							callback && callback(err);
						} else {
							this.merge(err ? {} : data);
							this.save(filename, callback);
						}
					});
				else {
					tree.merge(data);
					tree.save(filename, callback);
				}
			}
		});
	}
};

/**
 * Modify a config file by clearing some data
 * Config file is searched in APP_DIR/files forder. If config server url is defined
 * the filename is searched on config server
 * @method clearOnServer
 * @param {string} filename The name of the config file. If config server is defined, file is changed there
 * @param {string|array} [keys=null] A key or an array of keys for traversing the tree.
 *	If keys are not supplied the file is cleared
 *	If all-but-last keys point to plain array, last key is interpreted as a member
 *	of that array and only this array member is removed
 *	If all-but-last keys point to associative array (A) and last key is plain array (B)
 *	all keys from array A which are in array B are unset
 * @param {function} callback Callback receives error as arguments
 * @param {boolean} [noSave=false] if true the new tree is returned as callback second argument and not saved
 */
Config.clearOnServer = function(filename, keys /* null */, callback, noSave) {
	if (typeof keys === "function") {
		callback = keys;
		noSave = false;
		keys = null;
	}
	if (Q.typeOf(keys) === "string") keys = JSON.parse(keys);
	if (Q.typeOf(noSave) === "string") noSave = JSON.parse(noSave);
	noSave = !!noSave;
	var cs;
	if (cs = Config.serverInfo()) {
		// request config server
		Q.Utils[!!cs.internal ? 'queryInternal' : 'queryExternal']
			('Q/Config', {'Q/method': 'clear', filename: filename, args: keys, noSave: noSave}, cs.url, callback);
		return;
	}
	// modify local file
	filename = Q.app.DIR+Q.DS+'files'+Q.DS+filename;
	(new Q.Tree()).load(filename, function(err) {
		if (err && err.code !== 'ENOENT') callback && callback(err);
		else if (err && err.code === 'ENOENT') callback && callback(null, {}); // file does not exists
		else {
			if (keys && keys.length) {
				var last = (keys.length > 1) ? this.get(keys.slice(0, -1)) : this.getAll();
				var search, i, j;
				if (Q.typeOf(last) === "array") {
					search = keys.pop();
					if (typeof search !== "object") search = [search];
					for (i in search) {
						if ((j = last.indexOf(search[i])) >= 0) last.splice(j, 1);
					}
					this.clear(keys);
					if (last.length) this.set(keys, last);
				} else if (Q.typeOf(last) === "object") {
					search = keys.pop();
					if (typeof search !== "object") search = [search];
					for (i in search) this.clear(keys.concat([search[i]]));
					if (!Object.keys(this.get(keys)).length) this.clear(keys);
				} else this.clear(keys);
				if (noSave) callback && callback(null, this);
				else this.save(filename, callback);
			} else {
				if (noSave) callback && callback(null, {});
				else (new Q.Tree()).save(filename, callback);
			}
		}
	});
};

var _self = false;
/**
 * Start config server listener. Called from Q.Bootstrap.configure
 * @method listen
 * @param {function} callback
 */
Config.listen = function(callback) {
	var server = Q.listen();
	server.attached.express.post('/Q/Config', function Config_query_handler (req, res, next) {
		var parsed = req.body;
        if (!parsed || !parsed['Q/method']) return next();
		var filename, data, clear;
		// some protection against querying self
		var s = server.address(), c = req.client.address();
		_self = ((s.address === '0.0.0.0' || s.address === c.address) && s.port === c.port);
        switch (parsed['Q/method']) {
			case 'set':
				if (!(filename = req.param('filename'))) {
					res.send({errors: "'filename' is not defined in 'Q/Config/set' handler"});
					break;
				}
				if (!(data = req.param('data'))) {
					res.send({errors: "'data' is not defined in 'Q/Config/set' handler"});
					break;
				}
				if (!(clear = req.param('clear'))) {
					res.send({errors: "'clear' is not defined in 'Q/Config/set' handler"});
					break;
				}
				Config.setOnServer(filename, data, function (err) {
					if (err) res.send({errors: err.message});
					else res.send({data: true});
					_self = false;
				}, clear);
				break;
			case 'get':
				if (!(filename = req.param('filename'))) {
					res.send({errors: "'filename' is not defined in 'Q/Config/get' handler"});
					break;
				}
				Config.getFromServer(filename, function (err, data) {
					if (err) res.send({errors: err.message});
					else res.send({data: data});
					_self = false;
				});
				break;
			case 'clear':
				if (!(filename = req.param('filename'))) {
					res.send({errors: "'filename' is not defined in 'Q/Config/clear' handler"});
					break;
				}
				if (!(data = req.param('args'))) {
					res.send({errors: "'args' is not defined in 'Q/Config/clear' handler"});
					break;
				}
				if (!(clear = req.param('noSave'))) {
					res.send({errors: "'noSave' is not defined in 'Q/Config/clear' handler"});
					break;
				}
				Config.clearOnServer(filename, data, function (err) {
					if (err) res.send({errors: err.message});
					else res.send({data: true});
					_self = false;
				}, clear);
				break;
			default:
				res.send({data: false, errors: "Unknown 'Q/method' in 'Q/config' handler: '"+parsed['Q/method']+"'"});
				break;
        } // switch Q/method
	});

	var addr = server.address && server.address();
	if (addr) callback && callback(addr);
	else server.once('listening', function () {
		callback && callback(server.address());
	});
};

module.exports = Config;