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
 * @param {number} type
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
	var className = this.className.substring(connName.length + 1);
	var info = Q.Config.get(['Db', 'upcoming', connName], false);
	if (!info) {
		Q.Config.get(['Db', 'connections', connName], false);
	}
	return this.cachedShardIndex = info.indexes && info.indexes[className]
		? info.indexes[className]
		: null;
};

/**
 * Calculates which shards the query should be issued to, based on those
 * "WHERE" criteria that were specified in a structured way.
 * Used mostly by .execute(), but you can call it too, to see how a query
 * would be executed.
 * Here is sample shards config:
 * 
 * **NOTE:** *"fields" shall be an object with keys as fields names and values containing hash definition
 * 		in the format "type%length" where type is one of 'md5' or 'normalize' and length is hash length
 * 		hash definition can be empty string or false. In such case 'md5%7' is used*
 *
 * **NOTE:** *"partition" can be an array. In such case shards shall be named after partition points*
 *
 *
 *	"Streams": {
 *		"prefix": "streams_",
 *		"dsn": "mysql:host=127.0.0.1;dbname=DBNAME",
 *		"username": "USER",
 *		"password": "PASSWORD",
 *		"driver_options": {
 *			"3": 2
 *		},
 *		"shards": {
 *			"alpha": {
 *				"prefix": "alpha_",
 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
 *				"username": "USER",
 *				"password": "PASSWORD",
 *				"driver_options": {
 *					"3": 2
 *				}
 *			},
 *			"betta": {
 *				"prefix": "betta_",
 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
 *				"username": "USER",
 *				"password": "PASSWORD",
 *				"driver_options": {
 *					"3": 2
 *				}
 *			},
 *			"gamma": {
 *				"prefix": "gamma_",
 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
 *				"username": "USER",
 *				"password": "PASSWORD",
 *				"driver_options": {
 *					"3": 2
 *				}
 *			},
 *			"delta": {
 *				"prefix": "delta_",
 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
 *				"username": "USER",
 *				"password": "PASSWORD",
 *				"driver_options": {
 *					"3": 2
 *				}
 *			}
 *		},
 *		"indexes": {
 *			"Stream": {
 *				"fields": {"publisherId": "md5", "name": "normalize"},
 *				"partition": {
 *					"0000000.       ": "alpha",
 *					"0000000.sample_": "betta",
 *					"4000000.       ": "gamma",
 *					"4000000.sample_": "delta",
 *					"8000000.       ": "alpha",
 *					"8000000.sample_": "betta",
 *					"c000000.       ": "gamma",
 *					"c000000.sample_": "delta"
 *				}
 *			}
 *		}
 *	}
 *
 * @method shard
 * @param {object} [index={}] Used internally to override configuration setting for sharding
 * @return {object} Returns a hash of shardName => query pairs, where shardName
 *  can be the name of a shard, or "*" to have the query run on all the shards.
 */
Query.prototype.shard = function(index) {
	if (!this.className) {
		return {"": this};
	}
	var point, max, field, i, value, hash, parts, shards, len, hashed = [], missing = 0;
	var connName = this.db.connName;
	var className = this.className.substring(connName.length + 1);
	index = index || Q.Config.get(['Db', 'connections', connName, 'indexes', className], false);
	if (!index) {
		return {"": this};
	}
	if (Q.isEmpty(this.criteria)) {
		return {"*": this};
	}
	if (Q.isEmpty(index.fields)) {
		throw new Q.Exception("Db.Query.Mysql: index for " + this.className + " should have at least one field");
	}
	if (Q.isEmpty(index.partition)) {
		return {"": this};
	}
	var arr, j, hashed_min, hashed_max;
	var fields = Object.keys(index.fields);
	for (i=0; i<fields.length; ++i) {
		field = fields[i];
		if (!(field in this.criteria)) return {"*": this};
		value = this.criteria[field];
		hash = index.fields[field] ? index.fields[field] : 'md5';
		parts = hash.split('%');
		hash = parts[0];
		len = parts[1] ? parts[1] : _HASH_LEN;
		if (Q.typeOf(value) === 'array') {
			arr = [];
			for (j=0; j<value.length; j++)
				arr.push(applyHash(value[j], hash, len));
			hashed[i] = arr;
		} else if (value instanceof Db.Range) {
			if (hash !== 'normalize') {
				throw new Exception("Db.Query: ranges don't work with "+hash+" hash");
			}
			hashed_min = applyHash(value.min, hash, len);
			hashed_max = applyHash(value.max, hash, len);
			hashed[i] = new Db.Range(hashed_min, value.includeMin, value.includeMax, hashed_max);
		} else {
			hashed[i] = applyHash(value, hash, len);
		}
	}
	// collect array of shards
	shards = shard_internal(index, hashed);
	var result = {}, mapping = (Q.typeOf(index.partition) === 'object' ? index.partition : false);
	for (i=0; i<shards.length; i++) result[map_shard(shards[i], mapping)] = this;
	return result;
};

/**
 * @method applyHash
 * @private
 * @param {string} value
 * @param {string} hash
 * @param {number} len
 * @return {string}
 * @throws {Q.Exception} if hash is not supported
 */
function applyHash(value, hash, len)
{
	if (!hash) hash = 'normalize';
	if (!len) len = _HASH_LEN;
	if (value == null) {
		return value;
	}
	switch (hash) {
		case 'normalize':
			hashed = Q.normalize(value).substring(0, len);
			break;
		case 'md5':
			hashed = Q.Crypto.MD5(value).substring(0, len).toString();
			break;
		default:
			throw new Q.Exception("Db.Query.Mysql: The hash " + hash + " is not supported");
	}
	while (hashed.length < len) hashed = " " + hashed;
	return hashed;
}

function shard_internal(index, hashed) {
	var partition = [], keys = Object.keys(index.fields), point, last_point = null, i, result = {};
	var points = (Q.typeOf(index.partition) === 'object') ? Object.keys(index.partition) : index.partition;
	for (i=0; i<points.length; i++) {
		point = points[i];
		partition[i] = point.split('.');
		if (last_point && point <= last_point)
			throw new Q.Exception("Db.Query.Mysql: in "+this.className+" partition, point "+i+" is not greater than the previous point");
		last_point = point;
	}
	return slice_partitions(partition, 0, hashed);
}

function slice_partitions(partition, j, hashed, adjust) {
	if (!adjust) adjust = false;
	if (partition.length <= 1) return partition;
	var hj = hashed[j], result = [], temp = hashed.slice(0), i, point;
	
	if (Q.typeOf(hj) === 'array') {
		for (i=0; i<hj.length; i++) {
			temp[j] = hj[i];
			result = result.concat(slice_partitions(partition, j, temp, adjust));
		}
		return result;
	}
	var min = hj, max = hj;
	if (hj instanceof Db.Range) {
		min = hj.min;
		max = hj.max;
		if (min === null) {
			throw new Q.Exception("Db.Query.Mysql slice_partitions: The minimum of the range should be set.");
		}
	}
	var current, next = null;
	var lower = 0, upper = partition.length-1;
	var lower_found = false, upper_found = false;
	
	for (i=0; i<partition.length; i++) {
		point = partition[i];
		upper_found = upper_found && next;
		current = point[j];
		if (!adjust && max != null && current > max) break;
		if ((next = (Q.getObject([i+1, j], partition) || null)) === current) continue;
		if (adjust && current > next) lower_found = !(next = null);
		if (!lower_found && next && min >= next) lower = i+1;
		if (!upper_found) {
			if (!next || max < next) {
				upper = i;
				if (!adjust) break;
				else upper_found = true;
			}
		}
	}
	if (!Q.isEmpty(hashed[j+1]))
		return slice_partitions(partition.slice(lower, upper+1), j+1, hashed, hj instanceof Db.Range || adjust);
	else
		return partition.slice(lower, upper+1);
}

function map_shard(a, map) {
	var aj = a.join('.');
	return map ? map[aj] : aj;
}

Db.Query = Query;
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