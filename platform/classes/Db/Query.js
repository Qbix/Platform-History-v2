/**
 * @module Db
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Database query class
 * @class Query
 * @namespace Db
 * @constructor
 * @param {Db.Mysql} db
 * @param type {number}
 * @param {object} [clauses={}]
 * @param {object} [bind={}]
 */
var Query = function(db, type, clauses, bind) {
	this.db = db;
	this.type = type;
	this.clauses = clauses || {};
	this.after = {};
	this.parameters = bind || {};
	this.replacements = {};
	this.indexName = null;
	this.typename = "Db.Query";
};

/**
 * make a copy of all the sub-objects, including the clauses, parameters, etc.
 * @method copy
 * @return {Db.Query}
 */
Query.prototype.copy = function () {
	var ret = Q.copy(this);
	
	// do a slightly deep copy
	for (var k in this) {
		// make a copy of all the sub-objects, including the clauses, parameters, etc.
		if (typeof this[k] === 'object') {
			ret[k] = Q.copy(this[k]);
		}
	}
	return ret;
};

/**
 * Used to determine if there is a shardIndex to be used for this type of class
 * @method copy
 * @return {Db.Query}
 */
Query.prototype.shardIndex = function () {
	if (this.cachedShardIndex !== undefined) {
		return this.cachedShardIndex;
	}
	if (!this.className) {
		return null;
	}
	var connName = this.db.connName;
	var className = this.className.substr(connName.length + 1);
	var info = Q.Config.get(['Db', 'upcoming', connName], false);
	if (!info) {
		Q.Config.get(['Db', 'connections', connName], false);
	}
	return this.cachedShardIndex = info.indexes && info.indexes[className]
		? info.indexes[className]
		: null;
};

Query.Mysql = Q.require('Db/Query/Mysql');

// Types of queries available right now
/**
 * Raw query
 * @property TYPE_RAW
 * @type integer
 * @final
 * @default 1
 */
Query.TYPE_RAW = 1;
/**
 * Select query
 * @property TYPE_SELECT
 * @type integer
 * @final
 * @default 2
 */
Query.TYPE_SELECT = 2;
/**
 * Insert query
 * @property TYPE_INSERT
 * @type integer
 * @final
 * @default 3
 */
Query.TYPE_INSERT = 3;
/**
 * Update query
 * @property TYPE_UPDATE
 * @type integer
 * @final
 * @default 4
 */
Query.TYPE_UPDATE = 4;
/**
 * Delete query
 * @property TYPE_DELETE
 * @type integer
 * @final
 * @default 5
 */
Query.TYPE_DELETE = 5;
/**
 * Rollback query
 * @property TYPE_ROLLBACK
 * @type integer
 * @final
 * @default 6
 */
Query.TYPE_ROLLBACK = 6;

module.exports = Query;