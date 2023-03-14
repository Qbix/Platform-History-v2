/**
 * @module Q
 */

var Q = require('Q');
var fs = require('fs');
var path = require('path');
var util = require('util');
var Db = Q.require('Db');
var Db_Mysql = Q.require('Db/Mysql');

/**
 * Different utilities
 * @class Utils
 * @namespace Q
 * @static
 */
var Utils = {};

/**
 * Generate signature for an object
 * @method signature
 * @param {Object|String} data The data to sign
 * @param {String} [secret] A secret to use for signature. If null Q/internal/secret used
 * @return {string}
 * @throws {Q.Exception} if secret is not defined
 */
Utils.signature = function (data, secret) {
	secret = secret || Q.Config.get(['Q', 'internal', 'secret'], null);
	if (!secret) {
		throw new Q.Exception('Q.Utils.signature is expecting a secret');
	}
	if (typeof(data) !== 'string') {
		data = http_build_query(ksort(data)).replace(/\+/g, '%20');
	}
	return Q.Crypto.HmacSHA1(data, secret).toString();
};

/**
 * Sign data by adding signature field
 * @method sign
 * @param {object} data The data to sign
 * @param {array} fieldKeys Optionally specify the array key path for the signature field
 * @return {object} The data object is mutated and returned
 */
Utils.sign = function (data, fieldKeys) {
	var secret = Q.Config.get(['Q', 'internal', 'secret'], null);
	if (!secret) {
		return data
	}
	if (!fieldKeys || !fieldKeys.length) {
		var sf = Q.Config.get(['Q', 'internal', 'sigField'], 'sig');
		fieldKeys = ['Q.'+sf];
	}
	var ref = data;
	for (var i=0, l=fieldKeys.length; i<l-1; ++i) {
		if (!(fieldKeys[i] in ref)) {
			ref[ fieldKeys[i] ] = {};
		}
		ref = ref[ fieldKeys[i] ];
	}
	ref [ fieldKeys[fieldKeys.length-1] ] = Utils.signature(data, secret);
	return data;
};

/**
 * Validate some signed data.
 * @method validate
 * @param {object} data the signed data to validate
 * @param {array} fieldKeys Optionally specify the array key path for the isgnature field
 * @return {boolean} Whether the signature is valid. Returns true if secret is empty.
 */
Utils.validate = function(data, fieldKeys) {
	var temp = Q.copy(data, null, 100);
	var secret = Q.Config.get(['Q', 'internal', 'secret'], null);
	if (!secret) {
		return true;
	}
	if (!fieldKeys || !fieldKeys.length) {
		var sf = Q.Config.get(['Q', 'internal', 'sigField'], 'sig');
		fieldKeys = ['Q.'+sf];
	}
	var ref = temp;
	for (var i=0, l=fieldKeys.length; i<l-1; ++i) {
		if (!(fieldKeys[i] in ref)) {
			ref[ fieldKeys[i] ] = {};
		}
		ref = ref[ fieldKeys[i] ];
	}
	var sig = ref [ fieldKeys[fieldKeys.length-1] ];
	delete ref [ fieldKeys[fieldKeys.length-1] ];
	return (sig === Utils.signature(temp, secret));
};

/**
 * express server middleware validate signature of internal request
 * @method validateRequest
 * @static
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
Utils.validateRequest = function (req, res, next) {
	// merge in GET data
	if (req.body) Q.extend(req.body, req.query);
	else req.body = req.query;
	// validate signature
	if (Utils.validate(req.body)) {
		next();
	} else {
		console.log(req.body);
		console.log("Request validation failed");
		res.send(JSON.stringify({errors: "Invalid signature"}), 403); // forbidden
	}
};

/**
 * Validates a capability signed by our own server's secret key.
 * The capability must have "startTime", "endTime" in milliseconds since UNIX epoch,
 * and must also be signed with Q.Utils.sign() or equivalent implementation.
 * @method validateCapability
 * @static
 * @param {Array|String} permissions
 */
Utils.validateCapability = function (capability, permissions) {
	var now = Date.now() / 1000;
	if (!capability || !Utils.validate(capability)
	|| Q.isEmpty(capability.permissions)
	|| capability.startTime > now
	|| capability.endTime < now) {
		return false;
	}
	if (typeof permissions === 'string') {
		permissions = [permissions];
	}
	for (var i=0, l=permissions.length; i<l; ++i) {
		if (capability.permissions.indexOf(permissions[i]) < 0) {
			return false;
		}
	}
	return true;
};
	
function ksort(obj) {
	var i, sorted = {}, keys = Object.keys(obj);
	keys.sort();
	for (i=0; i<keys.length; i++) sorted[keys[i]] = obj[keys[i]];
	return sorted;
}

function urlencode (str) {
	// http://kevin.vanzonneveld.net
	str = (str + '').toString();
	return encodeURIComponent(str)
		.replace(/!/g, '%21')
		.replace(/'/g, '%27')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29')
		.replace(/\*/g, '%2A')
		.replace(/%20/g, '+');
}

function http_build_query (formdata, numeric_prefix, arg_separator) {
	// http://kevin.vanzonneveld.net
	var value, key, tmp = [],
		that = this;

	var _http_build_query_helper = function (key, val, arg_separator) {
		var k, tmp = [];
		if (val === true) {
			val = "1";
		} else if (val === false) {
			val = "0";
		}
		if (val !== null && typeof(val) === "object") {
			for (k in val) {
				if (val[k] !== null) {
					tmp.push(_http_build_query_helper(key + "[" + k + "]", val[k], arg_separator));
				}
			}
			return tmp.join(arg_separator);
		} else if (typeof(val) !== "function") {
			return urlencode(key) + "=" + urlencode(val);
		} else {
			throw new Error('There was an error processing for http_build_query().');
		}
	};

	if (!arg_separator) {
		arg_separator = "&";
	}
	for (key in formdata) {
		value = formdata[key];
		if (numeric_prefix && !isNaN(key)) {
			key = String(numeric_prefix) + key;
		}
		tmp.push(_http_build_query_helper(key, value, arg_separator));
	}

	return tmp.join(arg_separator);
}

/**
 * Issues an http request, and returns the response
 * @method _request
 * @private
 * @param {string} method The http method to use
 * @param {string|array} uri The URL to request
 *  This can also be an array of [url, ip] to send the request
 *  to a particular IP, while retaining the hostname and request URI
 * @param {object|string} [data=''] The associative array of data to add to query
 * @param {object} [query=null] The associative array of data to post
 * @param {string} [user_agent='Mozilla/5.0'] The user-agent string to send. Defaults to Mozilla.
 * @param {object} [header={}] Optional associative array of headers to replace the entire header
 * @param [callback=null] {function} Callback receives error and result string as arguments
 */

function _request(method, uri, data /* '' */, query /* null */, user_agent /* Mosilla */, header /* auto */, callback ) {
	var that = this;
	var agent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.9) Gecko/20071025 Firefox/2.0.0.9';
	method = method.toLowerCase();
	if (typeof data === "function") {
		callback = data;
		data = '';
		query = null;
		user_agent = agent;
	} else if (typeof query === "function") {
		callback = query;
		query = null;
		user_agent = agent;
	} else if (typeof user_agent === "function") {
		callback = user_agent;
		user_agent = agent;
	} else if (typeof header === "function") {
		callback = header;
		header = null;
	}

	if (!callback || typeof callback !== "function") return;

	var ip = null, url;
	if (Q.typeOf(uri) === "array") {
		url = uri[0];
		if (!!uri[1]) ip = uri[1];
	} else url = uri;
	var parts = new URL(url);
	var host = parts.host;
	if (!ip) ip = host;
	var request_uri = parts.pathname;
	var port = parts.port ? ":"+parts.port : '';
	var server = parts.protocol+"://"+ip+port+request_uri;

	if (!header) header = {
		'user-agent': user_agent,
		'host': host
	};

	if (typeof data !== "string") data = http_build_query(data, '', '&');

	var request = {
		headers: header,
		uri: server+"?"+data
	};
	if (query) request.qs = query;

	require('request')[method](request, function (err, res, body) {
		if (err) callback.call(that, err);
		else {
			if (res.statusCode >= 400) callback.call(that, new Error(body));
			else callback.call(that, null, body);
		}
	});
}

/**
 * Issues a POST request, and returns the response
 * @method post
 * @param{string|array}  url The URL to post to
 *  This can also be an array of [url, ip] to send the request
 *  to a particular IP, while retaining the hostname and request URI
 * @param {object|string} [data=''] The associative array of data or string to add to query
 * @param {array} [query=null] The associative array of data to post
 * @param {string} [user_agent='Mozilla/5.0'] The user-agent string to send. Defaults to Mozilla.
 * @param {object} [header={}] Optional associative array of headers to replace the entire header
 * @param [callback=null] {function} Callback receives error and result string as arguments
 */
Utils.post = function (url, data, query, user_agent, header, callback) {
	_request('POST', url, data, query, user_agent, header, callback);
};

/**
 * Issues a GET request, and returns the response
 * @method get
 * @param {string|array} url The URL to get from
 *  This can also be an array of [url, ip] to send the request
 *  to a particular IP, while retaining the hostname and request URI
 * @param {object|string} [data=''] The associative array of data or string to add to query
 * @param {string} [user_agent='Mozilla/5.0'] The user-agent string to send. Defaults to Mozilla.
 * @param {object} [header={}] Optional associative array of headers to replace the entire header
 * @param [callback=null] {function} Callback receives error and result string as arguments
 */
Utils.get = function (url, data, user_agent, header, callback) {
	_request('GET', url, data, null, user_agent, header, callback);
};

/**
 * Queries a server externally to the specified handler. Expects json array with
 * either ['slots']['data'] or ['error'] fields filled
 * @method queryExternal
 * @param {string} handler the handler to call
 * @param {array} [data={}] Associative array of data of the message to send.
 * @param {string|array} [url=null] and url to query. Default to 'Q/web/appRootUrl' config value
 * @param {function} [callback=null] Callback receives error and result string as arguments
 */
Utils.queryExternal = function(handler, data /* {} */, url /* null */, callback)
{
	var that = this;
	if (typeof data === "function") {
		callback = data;
		data = {};
		url = null;
	} else if (typeof url === "function") {
		callback = url;
		url = null;
	}

	if (!callback || typeof callback !== "function") return;

	if (typeof data !== "object") {
		callback(new Error("Utils.queryExternal: data has wrong type. Expecting 'object'"));
	}

	var query = {}, sig = 'Q.'+Q.Config.get(['Q', 'internal', 'sigField'], 'sig');
	query['Q.ajax'] = 'json';
	query['Q.slotNames'] = 'data';
	query[sig] = Utils.sign(Q.extend({}, data, query))[sig];

	if (!url && !(url = Q.Config.get(['Q', 'web', 'appRootUrl'], false)))
		callback(new Error("Root URL is not defined in Q.Utils.queryExternal"));

	var servers = [], tail = "/action.php/"+handler;
	if (Q.typeOf(url) === "array") {
		servers.push(url[0]+tail);
		if (url.length > 1) servers.push(url[1]);
	} else {
		servers = url+tail;
	}

	Utils.post(servers, data, query, function (err, res) {
		var d;
		if (err) callback.call(that, err);
		else {
			try {
				d = JSON.parse(res);
			} catch (e) {
				callback(e);
				return;
			}
			if (d.errors) {
				if (d.errors[0]) callback(new Error(d.errors[0].message));
				else callback(new Error("Unknown error reported by 'Utils.post()'"));
			} else if (d.slots && d.slots.data) {
				callback(null, d.slots.data);
			} else {
				callback(null, null); // no slot as set but no error either
			}
		}
	});
};

/**
 * Sends a query to Node.js internal server and gets the response
 * This method shall make communications behind firewal
 * @method queryInternal
 * @param {string} handler the handler to call
 * @param {array} [data={}] Associative array of data of the message to send.
 * @param [url=null] {string|array} and url to query. Default to 'Q/nodeInternal' config value
 * @param [callback=null] {function} Callback receives error and result string as arguments
 */
Utils.queryInternal = function(handler, data /* {} */, url /* null */, callback)
{
	var that = this;
	if (typeof data === "function") {
		callback = data;
		data = {};
		url = null;
	} else if (typeof url === "function") {
		callback = url;
		url = null;
	}

	if (!callback || typeof callback !== "function") return;

	if (typeof data !== "object") callback(new Error("'data' has wrong type. Expecting 'object'"));

	if (!url) {
		var nodeh = Q.Config.get(['Q', 'nodeInternal', 'host'], null),
			nodep = Q.Config.get(['Q', 'nodeInternal', 'port'], null), node;
		if (!(url = nodep && nodeh ? "http://"+nodeh+":"+nodep : false))
			callback(new Error("nodeInternal server is not defined"));
	}

	var server = [], tail = "/"+handler;
	if (Q.typeOf(url) === "array") {
		server.push(url[0]+tail);
		if (url.length > 1) server.push(url[1]);
	} else {
		server = url+tail;
	}

	Utils.post(server, Utils.sign(data), function (err, res) {
		var d;
		if (err) callback.call(that, err);
		else {
			try {
				d = JSON.parse(res);
			} catch (e) {
				callback.call(that, e);
				return;
			}
			if (d.errors) callback.call(that, d.errors);
			else callback.call(that, null, d.data);
		}
	});
};

/**
 * Sends internal message to Node.js
 * @method sendToNode
 * @param data {array} Associative array of data of the message to send.
 *  It should contain the key "Q/method" so Node can decide what to do with the message.
 * @param [url=null] {string|array} and url to query. Default to 'Q/nodeInternal' config value and path '/Q/node'
 * @throws {Q.Exception} if data is not object or does not contain 'Q/method' field
 */
Utils.sendToNode = function (data, url /* null */) {
	if (typeof data !== 'object')
		throw new Q.Exception("The message to send to node shall be an object");
	if (!data['Q/method'])
		throw new Q.Exception("'Q/method' is required in message for sendToNode");

	if (!url) {
		var nodeh = Q.Config.get(['Q', 'nodeInternal', 'host'], null),
			nodep = Q.Config.get(['Q', 'nodeInternal', 'port'], null);
		if (!(url = nodep && nodeh ? "http://"+nodeh+":"+nodep+"/Q/node" : false)) return false;
	}

	require('request').post({
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.9) Gecko/20071025 Firefox/2.0.0.9'
		},
		uri: url+"?"+http_build_query(Utils.sign(data))
	});
	return true;
};

/**
 * Create folder for filename is it does not exists
 * Folder is created with 'world' access rights with 'Q/internal/umask' config value applied as umask
 * @method preparePath
 * @param filename {string} The filename
 * @param callback {function} Receiver errors if any
 */
Utils.preparePath = function(filename, callback) {
	var dir = path.dirname(filename.replace('/', Q.DS));
	if (!callback || typeof callback !== "function") return;
	fs.stat(dir, function (err, stats) {
		if (err && err.code !== 'ENOENT') callback(err);
		else {
			if (err) {
				// dir does not exists
				Utils.preparePath(dir, function (err) {
					if (err) callback(err);
					else {
						// created path up to dirname(dir)
						var mask = process.umask(parseInt(Q.Config.get(['Q', 'internal', 'umask'], "0000"), 8));
						fs.mkdir(dir, function (err) {
							process.umask(mask);
							callback(err);
						});
					}
				});
			} else {
				// dir exists
				if (stats.isDirectory()) callback();
				else callback(new Error("'"+dir+"' is not a directory"));
			}
		}
	});
};

// wheather to write log and which log
var _logging = false;
// Connection name
var _connection = null;
// Table name
var _table = null;
// table name with db and prefix
var _dbTable = null;
// the class for which shard is being split
var _class = null;
// the shard name which is being split
var _shard = null;
// the new shards config
var _shards = null;
// the partition which is being split
var _part = null;
// config for new shards
var _parts = null;
// select criteria
var _where = null;
// log file streams
var _log = [];
// log file name
var _log_file = null;
// we'll monitor closing of files for clean up
var _log_pipe = null;
// config reload timeout
var _timeout = 0;
// we give 0.5 sec to check if the file can be created
var _fileTimeout = 500;
// create new Db_Mysql object to leverage caching
var _dbm = null;
// the class construactor
var _rowClass = null;
// timestamp of select query
var _timestamp = null;

function _setTimeout(message, action, timeout) {
	var time = Math.floor(timeout/1000);
	function _counter() {
		process.stderr.write("Wait "+(time--)+" sec to "+message+"   \r");
		if (time > 0) return setTimeout(_counter, 1000);
		else return null;
	}
	return [setTimeout(action, timeout), _counter()];
}

function _clearTimeout(timeout) {
	clearTimeout(timeout[0]);
	clearTimeout(timeout[1]);
}

function _reset_split() {
	// close split process and update config
	_split_log("Resetting shard split handler and configuration. Please, wait for final confirmation");
	_connection = _table = _dbTable = _class = _shard = _shards = _part = _parts = _where = _log_file = _dbm = _rowClass = _timestamp = null;
	_logging = false; _phase = 0;
	var config = Q.Config.get(['Q', 'internal', 'sharding', 'upcoming'], 'Db/config/upcoming.json');
	Q.Config.clearOnServer(config, function (err) {
		if (err) _split_log("Failed to clear config in file '"+config+"'. Delete the file manually to avoid excessive messaging.", err);
		else {
			_setTimeout("reload updated config", function () {
				_timeout = 0;
				_split_log("Shards split handler is reset and can handle new request");
				_split_log("The file '"+config+"' can be safely deleted");
			}, _timeout);
		}
	});
}

function _split_log() {
	// may be modified to write log to file
	console.log.apply(this, arguments);
}

var _logServer = null;

Utils.listen = function(callback) {
	// Start internal server
	var server = Q.listen();
	server.attahed.express.post('/Db/Shards', function Shards_split_handler (req, res, next) {
		var parsed = req.body;
		if (!parsed || !parsed['Q/method']) return next();
		switch (parsed['Q/method']) {
			case 'split':
				if (Q.Config.get(['Db', 'upcoming', _connection, 'shard'], null) === null) {
					Q.time("Db/Shards/split");
					_log_pipe = new Q.Pipe((function () {
						var i, l = [];
						for (i=1; i<Q.Config.get(['Q', 'internal', 'sharding', 'iterations'], 1); i++) l.push(i);
						return l;
					})(), function () {
						_split_log("All logs processed");
						_log_pipe = null;
						_log = [];
					});
					_connection = parsed.connection;
					_table = parsed.table;
					_dbTable = parsed.dbTable;
					_class = parsed['class'];
					_shard = parsed.shard; // may be '' at initial split
					_shards = JSON.parse(parsed.shards);
					_part = parsed.part;
					_parts = JSON.parse(parsed.parts);
					_where = parsed.where;
					_log = []; // array of log file handlers according to the phases
					_dbm = new Db_Mysql(_connection);
					// _timeout shall be at least php timeout plus config reload timeout
					// to make sure all processes have new config
					_timeout = 1000 * (Q.Config.get(['Q', 'internal', 'configServer', 'interval'], 60) + Q.Config.get(['Q', 'internal', 'phpTimeout'], 30));
					try {
						_rowClass = Q.require(_class.split('_').join('/'));
					} catch (e) {
						_split_log("Wrong row class supplied '%s', aborting", _class);
						_reset_split();
						res.send({data: false});
						break;
					}
					// let's check supplied data
					if (!(_connection && _table && _dbTable && _shards && _class  && _part && _parts && _where)) {
						_split_log("Insufficient data supplied for shard split, aborting");
						_reset_split();
						res.send({data: false});
						break;
					} else res.send({data: true});
					_logServer = [
							"http://" + req.info.host+":"+req.info.port+"/Q/node",
							server.address().address
						];
					// write 'upcoming.json'
					Q.Config.setOnServer(
						Q.Config.get(['Q', 'internal', 'sharding', 'upcoming'], 'Db/config/upcoming.json'),
						(new Q.Tree())
							.set(['Db', 'connections', _connection, 'indexes', _table], {})
							.set(['Db', 'upcoming', _connection], {shard: _shard, table: _table, dbTable: _dbTable})
							.set(['Db', 'upcoming', _connection, 'indexes', _table], _parts)
							.set(['Db', 'internal', 'sharding', 'logServer'], _logServer),
						function (err) {
							if (err) {
								_split_log("Failed to write '%s'", Q.Config.get(['Q', 'internal', 'sharding', 'upcoming'], 'Db/config/upcoming.json'));
								_reset_split();
							} else {
								// Now 'upcoming' file is ready and after config update we are ready to proceed
								// give some time for createWriteStream to check file and then send true
								_log_file = Q.Config.get(['Q', 'internal', 'sharding', 'logs'], 'files'+Q.DS+'Db'+Q.DS+'logs')+ // in 'files/DB/logs' dir
										Q.DS+'split_'+_connection+'_'+_table+'_'+_shard; // with name 'split_CONNECTION_TABLE_SHARD', later add '_phase_PHASE.log'
								Utils.preparePath(_log_file, function (err) {
									if (err) {
										_split_log("Failed to create directory for logs:", err.message);
										_reset_split();
									} else {
										_log_file_start(1, function () { // on success
											_split_log("Begin split process for class '"+_class+"', shard '"+_shard+"' ("+_part+")");
											// wait for config update to start process
											_setTimeout("activate upcoming config", _split, _timeout);
										});
									}
								});
							}
						}, true);
				} else res.send({errors: "Split process for class '"+_class+"', shard '"+_shard+"' ("+_part+") is active"});
				break;
			case 'switch':
				// now all log lines are processed,
				// indexes contain full set of new indexes for _table
				// _shards contain new shards
				// we shall update new db config and clear temporary file (unblock writes)
				// all processes will start writing to new shards
				// this is done by query handler to be able to restart process
				res.send({data: true});
				var i, shardsFile = null,
					baseName = Q.Config.get(['Q', 'internal', 'sharding', 'config'], 'Db/config/shards.json'),
					configFiles = Q.Config.get(['Q', 'configFiles'], []),
					extName = path.extname(baseName);
				// baseName is the name of the file without extension
				if ((i = baseName.lastIndexOf(extName)) >= 0)
					baseName = baseName.substr(0, i);
				if (!baseName.length) {
					// who knows how creative user is...
					baseName = 'Db/config/shards';
					extName = '.json';
				}
				for (i=0; i<configFiles.length; i++) {
					if (configFiles[i].indexOf(baseName) === 0) {
						shardsFile = configFiles[i];
						break;
					}
				}
				// first create new file for shards config
				var newShardsFile = baseName+(new Date()).toISOString().replace(/([\-:]|\.\d{3}z$)/gi, '')+extName;
				if (shardsFile) {
					Q.Config.getFromServer(shardsFile, function (err, data) {
						if (err) {
							_split_log("Config file read error ("+shardsFile+").", err.message);
							_split_log("NOTE: platform is not writing to shard '"+_shard+"'!!!");
							_split_log("Update the config file manually and then delete file '%s'", Q.Config.get(["Q", "internal", "sharding", "upcoming"], 'Db/config/upcoming.json'));
							_split_log("New shards:", _shards);
							_split_log("New indexes:", _parts);
						} else _writeShardsConfig(data);
					});
				} else _writeShardsConfig({});

				function _writeShardsConfig(data) {
					// calculate new indexes
					// get content of previous connection.indexes and connection.shards
					var local = new Q.Tree(data);
					// clear indexes config related to currently split table
					local.clear(['Db', 'connections', _connection, 'indexes', _table]);
					var connection = Q.Config.get(['Db', 'connections', _connection], {});
					var indexes = {};
					if (!connection.indexes || !connection.indexes[_table] || !Object.keys(connection.indexes[_table]).length) {
						// no sharding yet
						indexes = _parts;
					} else {
						// sharding already started
						var tmp = connection.indexes[_table].partition;
						var fields = connection.indexes[_table].fields;
						// tmp may be object or array
						// if both are arrays keep array in the config
						if (Q.typeOf(tmp) === 'array' && Q.typeOf(_parts.partition) === 'array') {
							// remove first point from array to avoid listing shard twice
							tmp = tmp.concat(_parts.partition.slice(1));
							indexes = {partition: tmp.sort(tmp), fields: fields};
						} else {
							if (Q.typeOf(tmp) === 'array') {
								var o = {};
								tmp.forEach(function(val) { o[val] = val; });
								tmp = o;
							}
							// now both are objects
							Q.extend(tmp, _parts.partition);
							indexes = {partition: ksort(tmp), fields: fields};
						}
					}
					// set up new indexes
					local.set(['Db', 'connections', _connection, 'indexes', _table], indexes);
					// extend shards with new shards config
					connection = local.get(['Db', 'connections', _connection], {});
					if (connection.shards) Q.extend(connection.shards, _shards);
					else connection.shards = _shards;

					// write new file with shards config
					Q.Config.setOnServer(newShardsFile, local.getAll(), function (err) {
						if (err) {
							_split_log("Config file write error ("+newShardsFile+").", err.message);
							_split_log("NOTE: platform is not writing to shard '"+_shard+"'!!!");
							_split_log("Update the config files manually and then delete file '%s'", Q.Config.get(["Q", "internal", "sharding", "upcoming"], 'Db/config/upcoming.json'));
							_split_log("New shards:", _shards);
							_split_log("New indexes:", _parts);

						} else {
							// remove old shards config and upcoming config
							Q.Config.clearOnServer(
								'Q/config/bootstrap.json',
								['Q', 'configFiles',
									[
										shardsFile,
										Q.Config.get([
											'Q', 'internal', 'sharding', 'upcoming'
										], 'Db/config/upcoming.json')
									]
								], function(err, tree) {
									if (err) {
										_split_log("Config file read error (Q/config/bootstrap.json).", err.message);
										_split_log("NOTE: platform is not writing to shard '"+_shard+"'!!!");
										_split_log("Update the config file manually and then delete file '%s'", Q.Config.get(["Q", "internal", "sharding", "upcoming"], 'Db/config/upcoming.json'));
										_split_log("New shards:", _shards);
										_split_log("New indexes:", _parts);
									} else {
										// add new shards config and save
										tree = new Q.Tree(tree);
										tree.merge({Q: {configFiles: [newShardsFile]}});
										Q.Config.setOnServer(
											'Q/config/bootstrap.json',
											tree.getAll(),
											function(err) {
												if (err) {
													_split_log("Config file write error (Q/config/bootstrap.json).", err.message);
													_split_log("NOTE: platform is not writing to shard '"+_shard+"'!!!");
													_split_log("Update the config file manually and then delete file '%s'", Q.Config.get(["Q", "internal", "sharding", "upcoming"], 'Db/config/upcoming.json'));
													_split_log("New content for 'Q/config/bootstrap.json':", tree.getAll());
												} else {
													// config was written. Now let's update platform
													_split_log("Finished split process for shard '%s' (%s) in %s", _shard, _part, Q.timeEnd("Db/Shards/split"));
													_reset_split();
												}
											}, true); // setConfig 'Q/config/bootstrap.json'
									}
								}, true); // clearConfig 'Q/config/bootstrap.json'
						}
					}, true); // setConfig newShardsFile
				} // _writeShardsConfig
				break;
			case 'log':
				res.send({data: true}); // in case logging use queryInternal
				if (_logging) {
					_log[_logging].write(
						JSON.stringify({
							shards: parsed.shards,
							sql: parsed.sql,
							timestamp: (new Date()).getTime()
						})+'\n',
						'utf-8');
				}
				break;
			case 'reset':
				if (!splitting) {
					res.send({data: false});
					break;
				}
			case 'writeLog':
				res.send({data: true});
				function _block_error(err, config) {
						_split_log("Error updating config.", err.message);
						_split_log("Failed block shard '"+_shard+"'. Log file is been written.");
						_split_log("Check and fix error, verify if file '"+config+"' exists and contains split information");
						_split_log("then run 'split.php --log-process' to continue the process");
				}
				if (_logging >= Q.Config.get(['Q', 'internal', 'sharding', 'iterations'], 1)) {
					// lock table, write last log and switch to new config
					// set up Db_Exception_Blocked response while writing log
					Q.Config.setOnServer(
						Q.Config.get('Q', 'internal', 'sharding', 'upcoming', 'Db/config/upcoming.json'),
						(new Q.Tree()).set(['Db', 'upcoming', _connection, 'block'], true),
						function (err) {
							if (err) _block_error(err, config);
							else {
								// now we are ready to write last log
								// need to wait for php timeout
								_setTimeout("block writing to shard '"+_shard+"'", function(phase) {
									phase = _logging;
									_dump_log(phase, function () {
										Utils.queryInternal('Db/Shards', {'Q/method': 'switch'}, function(err) {
											if (err) {
												_split_log("Failed to change config files.", err.message);
												_split_log("Check and fix error, then run 'split.php --reconfigure' to continue the process");
											}
										}, _logServer);
									});
								}, _timeout);
							}
						}); // Utils.setConfig
				} else {
					// make next log file and start writing it
					// process file for current phase and start processing the next
					_log_file_start(_logging + 1, function() {
						_dump_log(_logging++, function () {
							Utils.queryInternal('Db/Shards', {'Q/method': 'writeLog'}, function(err) {
								if (err) {
									_split_log("Failed to start writion log.", err.message);
									_split_log("Check and fix error, then run 'split.php --log-process' to continue the process");
								}
							}, _logServer);
						});
					});
				}
				break;
			default:
				return next();
		} // switch (parsed['Q/method'])
	}); // server.attached.express.post query

	server.attached.express.post('/Q/node', function Shards_split_logger(req, res, next) {
		var parsed = req.body;
		if (!parsed || !parsed['Q/method']) return next();
		switch (parsed['Q/method']) {
			case 'Db/Shards/log':	// loose logging with sendToNode
				if (_logging) {
					_log[_logging].write(JSON.stringify({
						shards: parsed.shards,
						sql: parsed.sql,
						timestamp: (new Date()).getTime()}
					)+'\n', 'utf-8');
				}
				break;
			default:
				return next();
		}
	}); // server.attached.express.post sendToNode

	if (server.address()) callback && callback();
	else server.once('listening', function () {
		callback && callback(server.address());
	});
};

// actually make the split
function _split() {
	if (Q.Config.get(['Db', 'upcoming', _connection, 'shard'], null) === null) {
		_split_log("Splitting cancelled!");
		return;
	}
	_split_log("Start copying old shard '"+_shard+"' ("+_part+")");

	var total = 0, read = 0, count = 0, shards = Object.keys(_shards);
	var batches = {};
	shards.forEach(function(shard) {
		batches[shard] = Q.batcher(function(rows, callback) {
			// insert ['row1', 'row2', ...] to 'shard'
			if (rows.length) {
				_dbm.reallyConnect(function (client) {
					var i, s = [];
					function _escapeRow(row) {
						var key, v = [];
						for (key in row) v.push(client.escape(row[key]));
						return "("+v.join(", ")+")";
					}
					for (i=0; i<rows.length; i++) {
						s.push(_escapeRow(rows[i]));
					}
					var sql = "INSERT INTO "+_rowClass.table().toString()
						.replace('{{prefix}}', _dbm.prefix())
						.replace('{{dbname}}', _dbm.dbname())
						+" ("+Object.keys(rows[0]).join(", ")+") VALUES "+s.join(", ");
					client.query(sql, function(err) {
						process.stderr.write("Processed "+(count/total*100).toFixed(1)+"%\r");
						callback([err]);
					});
				}, shard, _shards[shard]);
			} else callback();
		}, {ms: 50, max: 100}); // explicit batch options
	});
	_logging = 1;
	var child = require('child_process').fork(
			Q.CLASSES_DIR+'/Q/Utils/Split.js',
			[Q.app.DIR, _class, _connection, _dbTable, _shard, _part, JSON.stringify(_parts), _where],
			{cwd: Q.CLASSES_DIR, env: process.env}
		).once('exit', function(code, signal) {
			switch (code) {
				case 0:
					child = null;
					return;
				case 99:
					break;
				default:
					if (signal) _split_log("Child process died unexpectedly on signal '%s'", signal);
					else _split_log("Child process died unexpectedly with code %d", code);
			}
			_split_log("Split process for '"+_shard+"' ("+_part+") failed!");
			child = batches = null;
			_reset_split();
		}) // on 'exit'
		.on('message', function (message) {
			var fail = false;
			if (!message.type) throw new Error("Message type is not defined");
			switch (message.type) {
				case 'start':
					Q.time("Db/Shards/copy");
					total = message.count;
					_timestamp = message.timestamp;
					break;
				case 'log':
					_split_log.apply(this, message.content);
					break;
				case 'row':
					batches[message.shard](message.row, function (err) {
						count++;
						if (err) {
							if (fail) return;
							fail = true;
							child.removeAllListeners('message');
							child.removeAllListeners('exit');
							for (var shard in batches) batches[shard].cancel();
							child.kill();
							batches = null;
							_split_log("Error processing rows of table '"+_dbTable+"'.", err.message);
							_split_log("Split process for '"+_shard+"' ("+_part+") failed!");
							_reset_split();
						} else if (count === read) {
							_split_log("Total "+count+" rows from shard '"+_shard
								+"' ("+_part+") processed in "+Q.timeEnd("Db/Shards/copy"));
							Utils.queryInternal('Db/Shards', {'Q/method': 'writeLog'}, function(err) {
								if (err) {
									_split_log("Failed to start writing log.", err.message);
									_split_log("Check and fix error, then run 'split.php --log-process' to continue the process");
								}
							}, _logServer);
						}
					});
					break;
				case 'stop':
					read = message.count;
					if (read <= count) {
						for (var shard in batches) batches[shard].cancel();
						_split_log("All rows processed before read finished. Exiting.");
						child.kill();
						batches = null;
						_reset_split();
					}
					break;
				default:
					throw new Error("Message of type '"+message.type+"' is not supported");
			}
		}); // on 'message'
}

function _log_file_start(phase, cb) {
	var _t = setTimeout(function() {
		_split_log("Start writing log file '"+_log_file+"' phase "+phase);
		_log[phase].write('# start\n');
		cb && cb();
	}, _fileTimeout);
	_log[phase] = require('fs')
		.createWriteStream(Q.app.DIR+Q.DS+_log_file+'_phase_'+phase+'.log') // relative to application dir
		.on('error', function(err) {
			// if log file error occur at any moment we consider split process broken
			// if log file cannot be created we shall clear timeouts to stop process
			_split_log("Log file error ("+_log_file+", phase "+phase+").", err.message);
			_clearTimeout(_t);
			_reset_split(); // if log file cannot be written the whole process fails
		}).on('close', _log_pipe.fill(this.phase));
	_log[phase].phase = phase;
}

var _buffer = '';
function _dump_log (phase, onsuccess) {
	_log[phase].end('# end');
	_split_log("Start processing log file '"+_log_file+"' phase "+phase);
	var log = require('fs')
		.createReadStream(Q.app.DIR+Q.DS+_log_file+'_phase_'+phase+'.log')
		.on('error', function (err) {
			_split_log("Log file read error ("+_log_file+").", err.message);
			_split_log("Check and fix error, verify if file '"+_log_file+"' exists and contains log information");
			_split_log("then run 'split.php --log-process' to continue the process");
			this.removeAllListeners();
		}).on('data', function(data) {
			var lines = (_buffer + data).split("\n"), that = this, failed = false;
			_buffer = lines.pop();
			lines.forEach(function(line, obj) {
			if (failed) return;
				line = line.replace("\r", '');
				// here line contains the line from log file
				if (line[0] !== '#') {
					try {
						obj = JSON.parse(line);
					} catch (e) {
						// NOTE: this may leave some file handles open
						_split_log("Error parsing log file'"+_log_file+"' phase "+phase, e);
						_split_log("Split process for '"+_shard+"' ("+_part+") failed!");
						that.removeAllListeners();
						_reset_split();
						failed = true;
						return;
					}
					if (_timestamp && obj.timestamp >= _timestamp) {
						var i, shard;
						for (i=0; i<obj.shards.length; i++) {
							shard = obj.shards[i];
							_dbm.reallyConnect(function(client) {
								var sql = obj.sql
									.replace('{{prefix}}', _dbm.prefix())
									.replace('{{dbname}}', _dbm.dbname());
								client.query(sql, function(err) {
									if (failed) return;
									if (err) {
										failed = true;
										_split_log("Error writing from log file.", err.message);
										_split_log("Split process for '"+_shard+"' ("+_part+") failed!");
										that.removeAllListeners();
										_reset_split();
									}
								});
							}, shard, _shards[shard]);
						}
					}
				}
			});
		}) // on data
		.on('end', function () {
			log = null;
			_split_log("Log for phase "+phase+" has been processed");
			onsuccess && onsuccess();
		}); // on 'end'
}

/**
 * Used to split ids into one or more segments, in order to store millions
 * of files under a directory, without running into limits of various filesystems
 * on the number of files in a directory.
 * Consider using Amazon S3 or another service for uploading files in production.
 * @method splitId
 * @static
 * @param {string} id the id to split
 * @param {integer} [lengths=3] the lengths of each segment (the last one can be smaller)
 * @param {string} [delimiter=path.sep] the delimiter to put between segments
 * @param {string} [internalDelimiter='/'] the internal delimiter, if it is set then only the last part is split, and instances of internalDelimiter are replaced by delimiter
 * @param {string} [checkRegEx] The RegEx to check and throw an exception if id doesn't match. Pass null here to skip the RegEx check.
 * @return {string} the segments, delimited by the delimiter
 */
Utils.splitId = function(id, lengths, delimiter, internalDelimiter, checkRegEx) {
	if (checkRegEx === undefined) {
		checkRegEx = new RegExp('^[a-zA-Z0-9\\.\\-\\_]{1,31}$');
	}
	if (checkRegEx) {
		if (!id || !id.match(checkRegEx)) {
			throw new Q.Exception(
				"Wrong value for {{id}}. Expected {{range}}",
				{
					field: 'id', 
					id: id, 
					range: checkRegEx
				}
			);
		}
	}
	lengths = lengths || 3;
	delimiter = delimiter || path.sep;
	if (internalDelimiter === undefined) {
		internalDelimiter = '/';
	}
	var prefix = '';
	var parts = [];
	if (internalDelimiter) {
		parts = id.split(internalDelimiter);
		id = parts.pop();
	}
	var prefix = parts.length > 0
		? parts.join(delimiter) + delimiter
		: '';
	var segments = [];
	var pos = 0;
	var len = id.length;
	while (pos < len) {
		segments.push(id.slice(pos, pos += lengths));
	}
	return prefix + segments.join(delimiter);
};

module.exports = Utils;
