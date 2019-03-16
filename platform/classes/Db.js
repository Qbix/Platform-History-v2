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
	var moduleName =  dbms.charAt(0).toUpperCase() + dbms.substr(1);
	Db[moduleName] = Q.require('Db/' + moduleName);

	return dbs[name] = new Db[moduleName](name, dsn);
};