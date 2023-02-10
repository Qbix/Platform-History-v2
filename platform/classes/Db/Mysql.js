/**
 * @module Db
 */
var Q = require('Q');
var Db = Q.require('Db');
var util = require('util');
	
/**
 * MySQL connection class
 * @class Mysql
 * @namespace Db
 * @constructor
 * @param {String} connName The name of connection
 * @param {String} dsn The DSN string to make connection
 * @throws {Q.Exception} If database connection is not registered with Db module
 */
function Db_Mysql(connName, dsn) {
	
	/**
	 * Connection information
	 * @property info
	 * @type object
	 * @private
	 */
	var info = Db.getConnection(connName);
	if (!info) {
		throw new Q.Exception("Database connection \""+connName+"\" wasn't registered with Db");
	}
	if (!dsn) {
		dsn = Db.parseDsnString(info['dsn']);
	}
	
	var dbm = this;
	/**
	 * The name of connection
	 * @property connName
	 * @type string
	 */
	dbm.connName = connName;
	/**
	 * The connection created with mysql.createConnection()
	 * @property connection
	 * @type mysql.Connection
	 * @default null
	 */
	dbm.connection = null;
	/**
	 * Wheather connection is connected to database
	 * @property connected
	 * @type boolean
	 * @default false
	 */
	dbm.connected = false;
	
	/**
	 * Cache of connections
	 * @property connections
	 * @type object
	 * @default {}
	 * @private
	 */
	var connections = {};

	function mysqlConnection(host, port, user, password, database, options, ignoreExisting) {
		var key = [host, port, user, password, database].join("\t");
		if (!ignoreExisting && connections[key]) {
			return connections[key];
		}
		var o = Q.extend({
			host: host,
			port: port,
			user: user,
			password: password,
			database: database,
			multipleStatements: true
		}, options);
		return connections[key] = require('mysql').createConnection(o);
	}

	/**
	 * Retrieve connection information possibly modified for particular shard
	 * @method info
	 * @param {String} [shardName=''] The name of the shard, defaults to '' - i.e. main table
	 * @param {Object} [modifications={}] Additional modifications to table information. If supplied override shard modifications
	 * @return {Object} Parsed dsn string with possible modifications
	 */
	dbm.info = function(shardName, modifications) {
		modifications = modifications || Db.getShard(this.connName, shardName || '') || {};
		return Q.extend({}, info, dsn, modifications, (modifications['dsn'] ? Db.parseDsnString(modifications['dsn']): {}));
	};

	/**
	 * Create mysql.Connection and connects to the database table
	 * @method reallyConnect
	 * @param {Function} callback The callback is fired after connection is complete. mysql.Connection is passed as argument
	 * @param {String} [shardName=''] The name of the shard to connect
	 * @param {Object} [modifications={}] Additional modifications to table information. If supplied override shard modifications
	 * @param {Boolean} [dontReconnect=false] Pass true here to avoid automatically reconnecting when connection is lost
	 */
	dbm.reallyConnect = function(callback, shardName, modifications, dontReconnect) {
	
		function _setUpConnection() {
			if (Q.Config.get(['Db', 'debug'], false)) {
				connection._original_query = connection.query;
				connection.query = function (sql) {
					Q.log(
						"--> db="+connection.config.database+": " + sql.replace(/[\n\t]+/g, " ") + "\n",
						'mysql'
					);
					return connection._original_query.apply(connection, arguments);
				};
			}
			dbm.on('error', _Db_Mysql_onConnectionError);
			connection.on('error', _Db_Mysql_onConnectionError);
			var mt = require('moment-timezone');
			var timezone = Q.Config.expect(['Q', 'defaultTimezone']);
			var offset = mt.tz.zone(timezone);
			offset = typeof offset.utcOffset === 'function' ? offset.utcOffset(Date.now()) : offset.offset(Date.now());
		    var dt = new Date(
				Math.abs(offset) * 60000 + new Date(2000, 0).getTime()
		    ).toTimeString();
		    var tz = (offset < 0 ? '-' : '+') + dt.substr(0,2) + ':' + dt.substr(3,2);
			connection.query('SET NAMES UTF8; SET time_zone = "'+tz+'"');

			function _Db_Mysql_onConnectionError(err, mq) {
				if (err.code === "PROTOCOL_CONNECTION_LOST" && !dontReconnect) {
					connection = mysqlConnection(
						info.host,
						info.port || 3306,
						info.username,
						info.password,
						info.dbname,
						info.options,
						true
					);
					connection.connect(function (err) {
						if (err) {
							throw new Q.Exception("Db.Mysql connection failed to reconnect to " + connection.config.database, 'mysql')
							return;
						}
						Q.log("Db.Mysql reconnected to " + connection.config.database, 'mysql');
					});
					return _setUpConnection();
				}
				Q.log("Db.Mysql error: " + err, 'mysql');
				if (mq) {
					mq.getSQL(function (repres) {
						Q.log("Query was: " + repres, 'mysql');
					});
				}
				if (!Q.Config.expect(['Db', 'survive', 'mysql'])) {
					console.log("Db: MySQL error, see files/Q/logs/sql_node-....log");
					process.exit();
					// our app will survive mysql errors, and continue operating
				}
			}
		}
		
		info = this.info(shardName, modifications);
		var connection = mysqlConnection(
			info.host,
			info.port || 3306,
			info.username,
			info.password,
			info.dbname,
			info.options
		);
		if (!dbm.connected) {
			_setUpConnection();
			dbm.connected = true;
		}
		callback && callback(connection);
		return connection;
	};
	/**
	 * Retrieves table prefix to use with connection
	 * @method prefix
	 * @return {string}
	 */
	dbm.prefix = function() {
		return info.prefix;
	};
	
	/**
	 * Retrieves database name to use with connection
	 * @method dbname
	 * @return {string}
	 */
	dbm.dbname = function() {
		return info.dbname;
	};
	
	/**
	 * Creates a raw query.
	 * @method rawQuery
	 * @param {String} query The query string
	 * @param {Object|Array} parameters The parameters to add to the query right away (to be bound when executing). Values corresponding to numeric keys replace question marks, while values corresponding to string keys replace ":key" placeholders, in the SQL.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.rawQuery = function(query, parameters) {
		query = query.replaceAll({
			'{{prefix}}': dbm.prefix()
		});
		return new Db.Query.Mysql(this, Db.Query.TYPE_RAW, {"RAW": query}, parameters);
	};

	/**
	 * Creates a query to rollback a previously started transaction.
	 * @method rollback
	 * @param {array} $criteria The criteria to use, for sharding
	 * @return {Db_Query_Mysql} The resulting Db_Query object
	 */
	dbm.rollback = function(criteria) {
		return new Db.Query.Mysql(this, Db.Query.TYPE_ROLLBACK).rollback(criteria);
	};

	/**
	 * Creates a query to select fields from a table. Needs to be used with Db.Query.from().
	 * @method SELECT
	 * @param {String|Object} fields The fields as strings, or associative array of `{alias: field}` pairs
	 * @param {String|Object} tables The tables as strings, or associative array of `{alias: table}` pairs
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.SELECT = function(fields, tables) {
		if (!fields)
			throw new Q.Exception("fields not specified in call to 'select'.");
		if (tables === undefined)
			throw new Q.Exception("tables not specified in call to 'select'.");
		var query = new Db.Query.Mysql(this, Db.Query.TYPE_SELECT);
		return query.SELECT(fields, tables);
	};
	
	/**
	 * Creates a query to insert a row into a table
	 * @method INSERT
	 * @param {String} table_into The name of the table to insert into
	 * @param {Object} fields The fields as an associative of `{column: value}` pairs
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.INSERT = function(table_into, fields) {
		if (!table_into)
			throw new Q.Exception("table not specified in call to 'insert'.");

		// fields might be an empty array,
		// but the insert will still be attempted.

		var columns_list = [];
		var values_list = [];
		for (var column in fields) {
			var value = fields[column];
			columns_list.push(Db.Query.Mysql.column(column));
			if (value && value.typename === 'Db.Expression') {
				values_list.push(value.valueOf());
			} else {
				values_list.push(":" + column);
			}
		}
		var columns_string = columns_list.join(', ');
		var values_string = values_list.join(', ');

		var clauses = {
			"INTO": table_into,
			"FIELDS": columns_string,
			"VALUES": values_string
		};

		return new Db.Query.Mysql(this, Db.Query.TYPE_INSERT, clauses, fields, table_into);
	};
	
	/**
	 * Creates a query to update rows. Must be used with Db.Query.set
	 * @method UPDATE
	 * @param {String} table The table to update
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.UPDATE = function (table) {
		if (!table)
			throw new Q.Exception("table not specified in call to 'update'.");
		var clauses = {"UPDATE": table};
		return new Db.Query.Mysql(this, Db.Query.TYPE_UPDATE, clauses, null, table);
	};

	/**
	 * Creates a query to delete rows.
	 * @method DELETE
	 * @param {String} table_from The table to delete from
	 * @param {String} [table_using=null] If set, adds a USING clause with this table.
	 *  You can then use .join() with the resulting Db_Query.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.DELETE = function (table_from, table_using) {
		if (!table_from)
			throw new Q.Exception("table not specified in call to 'delete'.");

		var clauses = table_using ? {"FROM": table_from + " USING " + table_using} : {"FROM": table_from};
		return new Db.Query.Mysql(this, Db.Query.TYPE_DELETE, clauses, null, table_from);
	};
	
	/**
	 * Generate an ID that is unique in a table
	 * @method uniqueId
	 * @param {String} table The name of the table
	 * @param {String} field The name of the field to check for uniqueness.
	 *  You should probably have an index starting with this field.
	 * @param {Function} callback When an acceptable unique ID is generated, this function is called with the ID
	 *  as the first parameter.
	 * @param {Object} [where={}] You can indicate conditions here to limit the search for
	 *  an existing value. The result is an id that is unique within
	 *  a certain partition.
	 * @param {Object} [options={}] Optional hash used to override default options:
	 * @param {Number} [options.length=8] The length of the ID to generate, after the prefix.
	 * @param {String} [options.characters='abcdefghijklmnopqrstuvwxyz']  All the characters from which to construct the id
	 * @param {String} [options.prefix=''] The prefix to prepend to the unique id.
	 * @param {Function} [options.filter]
	 *     A function that will take the generated string and check it.
	 *     The filter function can modify the string by returning another string,
	 *     or simply reject the string by returning false, in which case
	 *     another string will be generated.
	 * @param {Function|Q.Event} [options.onError] Triggered if an error occurs
	 */
	dbm.uniqueId = function(table, field, callback, where, options) {
		where = where || {};
		options = options || {};
		var length = options.length || 8;
		var characters = options.characters || 'abcdefghijklmnopqrstuvwxyz';
		var prefix = options.prefix || '';
		var count = characters.length;
		var that = this;
		function attempt() {
			var id = prefix;
			for (var i=0; i<length; ++i) {
				id += characters[Math.floor(Math.random() * count)];
			}
			if (options.filter) {
				var ret = Q.handle(options.filter, this, [id, table, field, where, options]);
				if (ret === false) {
					attempt();
					return;
				} else if (ret) {
					id = ret;
				}
			}
			where[field] = id;
			that.SELECT(field, table).where(where).limit(1)
			.execute(function (err, rows) {
				if (err) {
					Q.handle(options.onError, that, [err]);
				} else if (!rows.length) {
					Q.handle(callback, that, [id]);
				} else {
					attempt(); // generate another id
				}
			});
		}
		attempt();
	};
	
	/**
	 * Returns a timestamp from a Date string
	 * @method fromDate
	 * @param {string} date The Date string that comes from the db
	 * @return {integer} The timestamp
	 */
	dbm.fromDate = function(date) {
		return Db.fromDate(date);
	};
    
	/**
	 * Returns a timestamp from a DateTime string
	 * @method fromDateTime
	 * @param {string} datetime The DateTime string that comes from the db
	 * @return {integer} The timestamp
	 */
	dbm.fromDateTime = function(datetime) {
		return Db.fromDateTime(datetime);
	};

	/**
	 * Returns a Date string to store in the database
	 * @method toDate
	 * @param {Date|String|integer} input The UNIX timestamp, e.g. from a strtotime function
	 * @return {String} in "yyyy-mm-dd hh:mm:ss" format
	 */
	dbm.toDate = function(input) {
		return Db.toDate(input);
	};

	/**
	 * Returns a DateTime string to store in the database
	 * @method toDateTime
	 * @param {Date|string|integer} input a standard UNIX timestamp
	 * @return {String} in "yyyy-mm-dd hh:mm:ss" format
	 */
	dbm.toDateTime = function(input) {
		return Db.toDateTime(input);
	};
	
	var _dbtime = null,
	    _nodetime = null;
	
	/**
	 * Returns the timestamp the db server would have, based on synchronization
	 * @method timestamp
	 * @param {Function} callback receives (err, timestamp)
	 * @return {integer}
	 */
	dbm.getCurrentTimestamp = function (callback) {
		if (_dbtime) {
			return callback(null, _dbtime + Math.round(Date.now() - _nodetime));
		}
		var time1 = Date.now();
		dbm.SELECT('CURRENT_TIMESTAMP ct', '').execute(function (err, rows) {
			if (err) {
				return callback(err);
			}
			if (!rows || !rows[0]) {
				return callback("No results returned");
			}
			_dbtime = dbm.fromDateTime(rows[0].fields.ct);
			var time2 = Date.now();
			_nodetime = (time1 + time2) / 2;
			callback(null, _dbtime + Math.round(time2 - _nodetime));
		});
	};

}

Q.makeEventEmitter(Db_Mysql, true);
module.exports = Db_Mysql;