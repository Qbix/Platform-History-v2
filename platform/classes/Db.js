/*
 * @module Db
 * @main Db
 */
var Q = require('Q');
var Db = module.exports;
Q.makeEventEmitter(Db);

/**
 * The database interface module. Contains basic properties and methods and serves as namespace
 * for more specific sub-classes
 * @class Db
 * @namespace Db
 * @static
 * @requires Q
 */
var dbs = {};

Db.Expression = Q.require('Db/Expression');
Db.Query = Q.require('Db/Query');
Db.Row = Q.require('Db/Row');
Db.Range = Q.require('Db/Range');
Db.Q = Q;

/**
 * Add a database connection with a name
 * @method setConnection
 * @param {String} name The name under which to store the connection details
 * @param {Object} details The connection details. Should include the keys:
 *  'dsn', 'username', 'password', 'driver_options'
 */
Db.setConnection = function(name, details) {
	Q.Config.set(['Db', 'connections', name], details);
};

/**
 * Returns all the connections added thus far
 * @method getConnections
 * @return {Object}
 */
Db.getConnections = function () {
	var result = Q.Config.get(['Db', 'connections'], {});
	var base = result['*'];
	for (var k in result) {
		result[k] = Q.extend({}, base, result[k]);
	}
	delete result['*'];
	return result;
};

/**
 * Returns connection details for a connection
 * @method getConnection
 * @param {String} name 
 * @return {Object|null}
 */
Db.getConnection = function(name) {

	if (!name) return null;
	var result = Q.Config.get(['Db', 'connections', name], null);
	if (name !== '*' && (base = Db.getConnection('*'))) {
		result = Q.extend({}, base, result);
	}
	return result;
};

/**
 * Add a named shard under a database connection
 * Can contain the keys "dsn", "username", "password", "driver_options"
 * They are used in constructing the PDO object.
 * @method setShard
 * @param {String} connName The name of the connection to which the shard pertains
 * @param {String} shardName The name under which to store the shard modifications
 * @param {Object} modifications The shard modifications. Can include the keys:
 *  'dsn', 'host', 'port', 'dbname', 'unix_socket', 'charset',
 *  'username', 'password', 'driver_options',
 */
Db.setShard = function(connName, shardName, modifications) {
	Q.Config.set(['Db', 'connections', connName, 'shards', shardName], modifications);
};

/**
 * Returns all the shards added thus far for a connection
 * @method getShards
 * @param {String} connName 
 * @return {Object}
 */
Db.getShards = function (connName) {
	return Q.Config.get(['Db', 'connections', connName, 'shards'], {});
};

/**
 * Returns modification details for a shard pertaining to a connection
 * @method getShard
 * @param {String} connName
 * @param {String} [shardName='']
 * @return {Object|null}
 */
Db.getShard = function(connName, shardName) {
	if (!connName) return null;
	shardName = shardName || '';
	return Q.Config.get(['Db', 'connections', connName, 'shards', shardName], null);
};

/**
 * Parses dsn string and convert to object
 * @method parseDsnString
 * @param {String} dsn The dsn string for the database
 * @return {Object} The data extracted from the DSN string
 */
Db.parseDsnString = function(dsn) {
	var parts = dsn.split(':');
	var parts2 = parts[1].split(';');
	var result = {};
	for (var k in parts2) {
		var parts3 = parts2[k].split('=');
		result[ parts3[0] ] = parts3[1];
	}
	result['dbms'] = parts[0].toLowerCase();
	return result;
};

/**
 * This function uses Db to establish a connection
 * with the information stored in the configuration.
 * If the this Db object has already been made,
 * it returns this Db object.
 * @method connect
 * @param {String} name The name of the connection out of the connections added with Db::setConnection
 * @return {Db} The database connection
 * @throws {Q.Exception} if database connection wasn't registered with Db
 */
Db.connect = function(name) {
	var info = Db.getConnection(name);
	if (!info) {
		throw new Q.Exception("Database connection \""+name+"\" wasn't registered with Db");
	}
	
	if (name in dbs) {
		return dbs[name];
	}

	var dsn = Db.parseDsnString(info['dsn']);
	var dbms = dsn['dbms'];
	var moduleName =  dbms.charAt(0).toUpperCase() + dbms.substring(1);
	Db[moduleName] = Q.require('Db/' + moduleName);

	return dbs[name] = new Db[moduleName](name, dsn);
};

/**
 * Returns a timestamp from a Date string
 * @method fromDate
 * @param {string} date The Date string that comes from the db
 * @return {integer} The timestamp
 */
Db.fromDate = function(date) {
	var year = date.substring(0, 4),
	    month = date.substring(5, 7),
	    day = date.substring(8, 10);
	return (new Date(year, month, day).getTime());
};

/**
 * Returns a timestamp from a DateTime string
 * @method fromDateTime
 * @param {string} datetime The DateTime string that comes from the db
 * @return {integer} The timestamp
 */
Db.fromDateTime = function(datetime) {
	if (datetime.constructor === Date) {
		return datetime.getTime();
	}
	var year = datetime.substring(0, 4),
	    month = datetime.substring(5, 7),
	    day = datetime.substring(8, 10),
	    hour = datetime.substring(11, 13),
	    min = datetime.substring(14, 16),
	    sec = datetime.substring(17, 19);
	return (new Date(year, month, day, hour, min, sec, 0).getTime());
};

/**
 * Returns a Date string to store in the database
 * @method toDate
 * @param {Date|String|integer} input The UNIX timestamp, e.g. from a strtotime function
 * @return {String} in "yyyy-mm-dd hh:mm:ss" format
 */
Db.toDate = function(input) {
	var date = Date.from(input);
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	month = month < 10 ? '0'+month : month;
	day = day < 10 ? '0'+day : day;
	return year + '-' + month + '-' + day;
};

/**
 * Returns a DateTime string to store in the database
 * @method toDateTime
 * @param {Date|string|integer} input a standard UNIX timestamp
 * @return {String} in "yyyy-mm-dd hh:mm:ss" format
 */
Db.toDateTime = function(input) {
	var date = Date.from(input);
	var year = date.getFullYear();
	var month = date.getMonth()+1;
	var day = date.getDate();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	month = month < 10 ? '0'+month : month;
	day = day < 10 ? '0'+day : day;
	hours = hours < 10 ? '0'+hours : hours;
	minutes = minutes < 10 ? '0'+minutes : minutes;
	seconds = seconds < 10 ? '0'+seconds : seconds;
	return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
};