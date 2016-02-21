/**
 * @module Db
 */

var Q = require('Q');
var Db = Q.require('Db');

var util = require('util');

var _valueCounter = 1;
var _HASH_LEN = 7;

/**
 * Class implements MySQL query
 * @class Mysql
 * @namespace Db.Query
 * @constructor
 * @param mysql Db.Mysql
 * @param type {Number} One of the TYPE_* constants in Db.Query
 * @param query {String|Object} A sql query (for raw queries) or an associative array of clauses
 * @param parameters {Object|Array} The parameters to add to the query right away (to be bound when executing). Values corresponding to numeric keys replace question marks, while values corresponding to string keys replace ":key" placeholders, in the SQL.
 * @param table {String} The table operated with query
 */
var Query_Mysql = function(mysql, type, clauses, parameters, table) {
	Db.Query.apply(this, arguments);
	var mq = this;

	/**
	 * Criteria used for sharding the query
	 * @property criteria
	 * @type object
	 */
	mq.criteria = {};
	/**
	 * The table operated with query
	 * @property table
	 * @type string
	 */
	mq.table = table;

	// and now, for sharding
	mq.parameters = {};
	if (parameters) {
		for (var k in parameters) {
			var p = parameters[k];
			if (p instanceof Db.Expression) {
				Q.extend(mq.parameters, p.parameters);
			} else {
				mq.parameters[k] = p;
			}
		}
	}
	if (typeof parameters === 'object') {
		this.criteria = Q.copy(this.parameters);
	}

	/**
	 * Executes the query against a database connection
	 * Connects to one or more shard(s) as necessary.
	 * @param callback {function} This function is called when the queries have all completed.
	 *  It is passed the following arguments:
	 *
	 * * errors: an Object. If there were any errors, it will contain shardName: error pairs
	 * * results: an array of results merged from all the shards (for SELECT queries)
	 *    for INSERT queries results contains the value of LAST_INSERT_ID()
	 * * fields: an array of fields merged from all the shards (for SELECT queries)
	 *
	 *  It is passed an object whose keys are the shard names and the values
	 *  are arrays of [err, results, fields] as returned from the mysql module.
	 * @method execute
	 * @param {object} [options={}]
	 *  You can override the following options:
	 *
	 * * "plain": defaults to false
	 *    If true, returns array of plain object instead of instances
	 * * "raw": defaults to false.
	 *    If true, or if the query type is Db.Query.TYPE_RAW, the callback will be passed an object
 pairs representing the results returned
	 *    from the mysql query on each shard. Note that the results array will contain raw objects
	 *    of the form "{fieldName: fieldValue};", and not objects which have Db.Row mixed in.
	 * * "queries": Manually specify the queries, to bypass the sharding.
	 */
	mq.execute = function(callback, options) {
		options = options || {};
		var queries = options.queries || this.shard(options.indexes), self = this;
		var shardName, connection = this.db.connName;
		if (queries["*"]) {
			var shardNames = Q.Config.get(['Db', 'connections', connection, 'shards'], {'': ''});
			var q = queries["*"];
			for (shardName in shardNames) {
				queries[shardName] = q;
			}
			delete queries['*'];
		}
		var p = new Q.Pipe(Object.keys(queries), function (params, subjects) {
			// all the queries have completed
			// report the results in an object whose keys are the shard names
			// and whose values are arrays of the form [err, rows, fields]
			if (options.raw || mq.type === Db.Query.TYPE_RAW) {
				callback && callback(params);
				return;
			}

			var temp={}, k, res = 0;
			if (mq.type !== Db.Query.TYPE_SELECT) {
				for (k in params) {
					if (params[k][0])
						temp[k] = params[k][0];
					else if (mq.type === Db.Query.TYPE_INSERT)
						res = params[k][1].insertId;
					else if (mq.type === Db.Query.TYPE_DELETE)
						res += params[k][1].affectedRows;
				}
				if (callback) {
					if (Object.keys(temp).length) callback(temp, null);
					else callback(null, mq.type === Db.Query.TYPE_INSERT && !res ? null : res);
				}
				return;
			}
			
			var err={}, results=[], results2=[], rowClass;
			var i, pk, f;
			for (k in params) {
				pk = params[k];
				if (pk[0]) {
					err[k] = pk[0];
				}
				if (pk[1]) {
					for (i=0; i<pk[1].length; ++i) {
						results.push(pk[1][i]);
					}
				}
				if (pk[2]) {
					for (f in pk[2]) {
						temp[f] = 1;
					}
				}
			}
			var fields = Object.keys(temp);
			if (self.className) {
				rowClass = Q.require( self.className.split('_').join('/') );
				for (i=0; i<results.length; ++i) {
					if (options.plain) {
						results2.push(results[i]);
					} else {
						results2.push(new rowClass(results[i], true));
					}
				}
			} else {
				for (i=0; i<results.length; ++i) {
					results2.push({ fields: results[i] });
				}
			}
			callback && callback(Object.keys(err).length ? err : null, results2, fields);
		});
		var upcoming = Q.Config.get(['Db', 'upcoming', connection], false);

		for (shardName in queries) {
			if (upcoming && queries[shardName].type !== Db.Query.TYPE_SELECT && queries[shardName].type !== Db.Query.TYPE_RAW) {
				if (upcoming.block && shardName === upcoming.shard) {
					var err = new Q.Exception("Shard '"+shardName+"' for connection '"+connection+"' is temporary blocked for writing");
					/**
					 * Database error
					 * @event error
					 * @param error {Error}
					 *	The error object
					 * @param mq {Db.Query.Mysql}
					 *	Db.Query.Mysql object which caused an error
					 */
					mq.db.emit('error', err, mq);
					cb(err);
					return;
				}
			}
			_queryShard(queries[shardName], shardName, p.fill(shardName));
		}
		function _queryShard (query, shardName, cb) {
			query.getSQL(function (sql, connection) {
				Db.emit('execute', query, sql, connection);
				function _doTheQuery () {
					var a = arguments;
					_queryConnection(query, sql, connection, function (err) {
						if (!sql) return _doTheCallback();
						var t = query, a = arguments;
						if (!err && query.clauses['COMMIT']) {
							connection.query('COMMIT;', _doTheCallback);
						} else {
							_doTheCallback();
						}
						function _doTheCallback() {
							if (!options.indexes) {
								switch (query.type) {
									case Db.Query.TYPE_SELECT:
										// SELECT queries don't need to be logged
									case Db.Query.TYPE_RAW:
										// Raw queries are run on shard '' - i.e. main db only
										// actually, raw query may get here only on initial sharding
										// when sharding has started raw queries are never run on shard
										break;
									default:
										var i, k, table;
										if (upcoming && shardName === upcoming.shard) {
											table = query.table;
											for (k in query.replacements) {
												table = table.replace(new RegExp(k, 'g'), query.replacements[k]);
											}
											if (table !== upcoming.dbTable) break;
											// send query to log
											var sql_template = query.getSQL();
											connection.query("SELECT CURRENT_TIMESTAMP", function (err, res) {
												var date;
												if (err) {
													date = new Date(); // backup solution
													date = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getMonth()+' '+
														date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
												}
												else date = res['CURRENT_TIMESTAMP'];

												var transaction =
													(query.clauses['COMMIT'] ? 'COMMIT' :
													(query.clauses['BEGIN'] ? 'START TRANSACTION' :
													(query.clauses['ROLLBACK'] ? 'ROLLBACK' : null)));

												if (transaction && transaction !== "COMMIT") {
													Q.Utils.sendToNode({
														'Q/method': 'Db/Shards/log',
														'shards': Object.keys(query.shard(upcoming.indexes[upcoming.table])),
														'sql': transaction+';'
													}, Q.Config.get(['Db', 'internal', 'sharding', 'logServer'], null));
												}

												Q.Utils.sendToNode({
													'Q/method': 'Db/Shards/log',
													'shards': Object.keys(query.shard(upcoming.indexes[upcoming.table])),
													'sql': sql_template.replace('CURRENT_TIMESTAMP', date).replace(/[\n]+/g, ' ').replace(/(^[\s]+|[\s]+$)/g, '')
												}, Q.Config.get(['Db', 'internal', 'sharding', 'logServer'], null));

												if (transaction && transaction === "COMMIT") {
													Q.Utils.sendToNode({
														'Q/method': 'Db/Shards/log',
														'shards': Object.keys(query.shard(upcoming.indexes[upcoming.table])),
														'sql': transaction+';'
													}, Q.Config.get(['Db', 'internal', 'sharding', 'logServer'], null));
												}
											});
										}
										break;
								}
							}
							cb.apply(query, a);
						}
					});
				}
				if (query.clauses['BEGIN']) {
					connection.query('START TRANSACTION;', _doTheQuery);
				} else if (query.clauses['ROLLBACK']) {
					connection.query('ROLLBACK;', _doTheQuery);
				} else {
					_doTheQuery();
				}
			}, shardName);
		}
		function _queryConnection (query, sql, connection, cb) {
			if (!sql) return cb(null);
			Db.emit('query', query, sql, connection);
			connection.query(sql, function(err, rows, fields) {
				if (err) {
					mq.db.emit('error', err, mq);
				}
				cb(err, rows, fields, sql, connection);
			});
		}
	};
	
	/**
	 * Creates a query to select fields from one or more tables.
	 * @method SELECT
	 * @param fields {string|object} The fields as strings, or associative array of {alias: field};
	 * @param tables {string|object} The tables as strings, or associative array of {alias: table};
	 * @param [repeat=false] {boolean} If tables is an array, and select() has
	 *  already been called with the exact table name and alias
	 *  as one of the tables in that array, then
	 *  this table is not appended to the tables list if
	 *  repeat is false. Otherwise it is.
	 *  This is really just for using in your hooks.
	 * @return {Db.Query.Mysql} The resulting query object.
	 * @chainable
	 */
	mq.SELECT = function (fields, tables, repeat) {
		var as = ' '; // was: ' AS ', but now we made it more standard SQL
		var column, alias, fields_list, prev_tables_list;
		var table, table_string, tables_array, prev_tables_array;
		var that = this;
		if (typeof fields === 'object') {
			fields_list = [];
			for (alias in fields) {
				column = fields[alias];
				if (isNaN(alias))
					fields_list.push(column + as + alias);
				else
					fields_list.push(column);
			}
			fields = fields_list.join(', ');
		}
		if (typeof fields !== 'string') {
			throw new Q.Exception("The fields to select need to be specified correctly.");
		}

		this.clauses['SELECT'] = this.clauses['SELECT'] ? this.clauses['SELECT'] + ", " + fields : fields;
		if (!tables) {
			return this;
		}

		function get_table_string(table, alias) {
			var table_string;
			if (table && table.typename === "Db.Expression") {
				// this is a subquery
				table_string = "(" + table + ")";
				Q.extend(that.parameters, table.parameters);
			} else {
				table_string = table.trim();
			}
			if (typeof alias !== "undefined" && alias) {
				table_string += as + alias;
			}
			return table_string;
		}
		
		if (!tables) {
			return this;
		}
		
		tables_array = [];
		switch (Q.typeOf(tables)) {
			case "Db.Expression":
				tables_array.push(get_table_string(tables));
				break;
			case "object":
				prev_tables_array = this.clauses['FROM'] ? this.clauses['FROM'] : [];
				for (alias in tables) {
					table_string = get_table_string(tables[alias], alias);
					if (!repeat && prev_tables_array.indexOf(table_string) >= 0) {
						continue;
					}
					tables_array.push(table_string);
				}
				break;
			case "string":
				tables_array = [tables];
				break;
			case "array":
				tables_array = tables;
				break;
			default:
				throw new Exception("Db.Query.Mysql: tables must be string, array or object");
		}
		this.clauses['FROM'] = this.clauses['FROM'] ? this.clauses['FROM'].concat(tables_array) : tables_array;

		return this;
	};

	/**
	 * Joins another table to use in the query
	 * @method join
	 * @param table {string} The name of the table. May also be "name AS alias".
	 * @param condition {Db.Expression|object|string} The condition to join on. Thus, JOIN table ON (condition)
	 * @param [join_type='INNER'] {string} The string to prepend to JOIN, such as 'INNER', 'LEFT OUTER', etc.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @throws {Q.Exception} If JOIN clause does not belong in this context or the JOIN condition specified incorrectly.
	 * @chainable
	 */
	mq.join = function (table, condition, join_type) {
		if (!join_type) {
			join_type = "INNER";
		}
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
			case Db.Query.TYPE_UPDATE:
				break;
			case Db.Query.TYPE_DELETE:
				if (!this.after['FROM']) break;
			default:
				throw new Q.Exception("the JOIN clause does not belong in this context.");
		}

		var expr, value;
		if (typeof condition === 'object') {
			condition = criteria_internal(this, condition);
		} else if (condition && condition.typename === "Db.Expression") {
			Q.extend(this.parameters, condition.parameters);
			condition = condition.toString();
		}
		if (typeof condition !== "string") {
			throw new Q.Exception("The JOIN condition needs to be specified correctly.");
		}
		
		var join = join_type + " JOIN " + table + " ON (" + condition + ")";
		
		this.clauses['JOIN'] = this.clauses['JOIN'] ? this.clauses['JOIN'] + " \n" + join : join;
		return this;
	};

	/**
	 * Adds a WHERE clause to a query
	 * @method where
	 * @param criteria {Db.Expression|object|string} An associative array of expression: value pairs.
	 *  The values are automatically turned into placeholders to be escaped later.
	 *  They can also be arrays, in which case they are placed into an expression of the form "key IN ('val1', 'val2')"
	 *  Or, this could be a Db.Expression object.
	 * @return {Db.Query.Mysql} The resulting Db.Query
	 * @throws {Q.Exception} If WHERE criteria specified incorrectly
	 * @chainable
	 */
	mq.where = function (criteria) {
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
			case Db.Query.TYPE_UPDATE:
			case Db.Query.TYPE_DELETE:
				break;
			default:
				throw new Q.Exception("The WHERE clause does not belong in this context.");
		}
		
		// and now, for sharding
		if (typeof criteria === 'object') {
			this.criteria = Q.copy(criteria);
		}
		
		var ci = criteria_internal(this, criteria);
		if (typeof ci !== 'string') {
			throw new Q.Exception("The WHERE criteria need to be specified correctly.");
		}
		if (!ci) {
			return this;
		}

		this.clauses['WHERE'] = this.clauses['WHERE'] ? "(" + this.clauses['WHERE'] + ") AND (" + ci + ")" : ci;
			
		return this;
	};

	/**
	 * Adds to the WHERE clause, like this:  " ... AND (x OR y OR z)",
	 * where x, y and z are the arguments to this function.
	 * @method andWhere
	 * @param criteria {Db.Expression|object|string} An associative array of expression: value pairs.
	 *  The values are automatically turned into placeholders to be escaped later.
	 *  They can also be arrays, in which case they are placed into an expression of the form "key IN ('val1', 'val2')"
	 *  Or, this could be a Db.Expression object.
	 * @param or_criteria {Db.Expression|object|string} You can have any number of these, including zero.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.andWhere = function (criteria, or_criteria) {
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
			case Db.Query.TYPE_UPDATE:
			case Db.Query.TYPE_DELETE:
				break;
			default:
				throw new Q.Exception("The WHERE clause does not belong in this context.");
		}

		// and now, for sharding
		if (typeof criteria === 'object') {
			if (!this.criteria) {
				this.criteria = criteria;
			} else if (this.shardIndex()) {
				if (arguments.length > 1) {
					throw new Q.Exception("You can't use OR in your WHERE clause when sharding.");
				}
				Q.extend(this.criteria, criteria);
			}
		}

		var c_arr = [];
		var was_empty = true;
		var c; 
		for (var i = 0; i < arguments.length; ++i ) {
			c = criteria_internal(this, arguments[i]);
			if (typeof c !== 'string') {
				throw new Q.Exception("The WHERE criteria need to be specified correctly");
			}
			c_arr.push(c);
			if (c) {
				was_empty = false;
			}
		}
		if (was_empty) {
			return this;
		}
		
		var new_criteria = "(" + c_arr.join(") OR (") + ")";
		this.clauses["WHERE"] = "(" + this.clauses["WHERE"] + ") AND (" + new_criteria + ")";
		return this;
	};

	/**
	 * Adds to the WHERE clause, like this:  " ... OR (x AND y AND z)",
	 * where x, y and z are the arguments to this function.
	 * @method orWhere
	 * @param criteria {Db.Expression|object|string} An associative array of expression: value pairs.
	 *  The values are automatically turned into placeholders to be escaped later.
	 *  They can also be arrays, in which case they are placed into an expression of the form "key IN ('val1', 'val2')"
	 *  Or, this could be a Db.Expression object.
	 * @param and_criteria {Db.Expression|object|string}
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.orWhere = function (criteria, and_criteria) {
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
			case Db.Query.TYPE_UPDATE:
			case Db.Query.TYPE_DELETE:
				break;
			default:
				throw new Q.Exception("The WHERE clause does not belong in this context.");
		}

		// and now, for sharding
		if (typeof criteria === 'object') {
			if (this.shardIndex() && this.criteria) {
				throw new Exception("You can't use OR in your WHERE clause when sharding.");
			}
		}

		var c_arr = [];
		var was_empty = true;
		var c;
		for (var i = 0; i < arguments.length; ++i ) {
			c = criteria_internal(this, arguments[i]);
			if (typeof c !== 'string') {
				throw new Q.Exception("The WHERE criteria need to be specified correctly");
			}
			c_arr.push(c);
			if (c) {
				was_empty = false;
			}
		}
		if (was_empty) {
			return this;
		}
		
		var new_criteria = "(" + c_arr.join(") AND (") + ")";
		this.clauses["WHERE"] = "(" + this.clauses["WHERE"] + ") OR (" + new_criteria + ")";
		return this;
	};
	
	/* *
	 * This function is specifically for adding criteria to query for sharding purposes.
	 * It doesn't affect the SQL generated for the query.
	 * @method criteria
	 * @param criteria Object An associative array of expression => value pairs.
	 */
	/*mq.criteria = function(criteria) {
		if (typeof criteria === 'object') {
			if (!this.criteria) {
				this.criteria = criteria;
			} else {
				Q.extend(this.criteria, criteria);
			}
		}
	};*/

	/**
	 * Adds a GROUP BY clause to a query
	 * @method groupBy
	 * @param expression {Db.Expression|string} A string or Db.Expression with the expression to group the results by.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.groupBy = function (expression) {
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
				break;
			default:
				throw new Q.Exception("The GROUP BY clause does not belong in this context.");
		}

		if (expression && expression.typename === "Db.Expression") {
			Q.extend(this.parameters, expression.parameters);
			expression = expression.toString();
		}
		if (typeof expression !== 'string') {
			throw new Q.Exception("The GROUP BY expression has to be specified correctly.");
		}
		this.clauses['GROUP BY'] = this.clauses['GROUP BY'] ? this.clauses['GROUP BY'] + ", " + expression : expression;
		return this;
	};
	
	/**
	 * Adds a HAVING clause to a query
	 * @method having
	 * @param criteria {Db.Expression|object|string} An associative array of expression => value pairs.
	 *  The values are automatically escaped using PDO placeholders.
	 *  Or, this could be a Db.Expression object.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.having = function (criteria) {
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
				break;
			default:
				throw new Q.Exception("The  clause does not belong in this context.");
		}

		if (!this.clauses['GROUP BY']) {
			throw new Q.Exception("Don't call having() when you haven't called groupBy() yet");
		}

		var ci = criteria_internal(this, criteria);
		if (typeof ci !== 'string') {
			throw new Q.Exception("The HAVING criteria need to be specified correctly.");
		}

		this.clauses['HAVING'] = this.clauses['HAVING'] ? "(" + this.clauses['HAVING'] + ") AND (" + ci + ")" : ci;

		return this;
	};

	/**
	 * Adds a ORDER BY clause to a query
	 * @method orderBy
	 * @param expression {Db.Expression|string} A string or Db.Expression with the expression to order the results by.
	 * @param [ascending=false] Boolean If false, sorts results as ascending, otherwise descending.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.orderBy = function (expression, ascending) {
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
				break;
			default:
				throw new Q.Exception("The ORDER BY clause does not belong in this context.");
		}

		if (expression && expression.typename === "Db.Expression") {
			Q.extend(this.parameters, expression.parameters);
			expression = expression.toString();
		}
		if (typeof expression !== 'string') {
			throw new Q.Exception("The ORDER BY expression has to be specified correctly.");
		}
		if (typeof ascending === 'boolean') {
			expression += ascending ? ' ASC' : ' DESC';
		} else if (typeof ascending === 'string') {
			if (ascending.toUpperCase() == 'DESC') {
				expression += ' DESC';
			} else {
				expression += ' ASC';
			}
		}
		this.clauses['ORDER BY'] = this.clauses['ORDER BY'] ? this.clauses['ORDER BY'] + ", " + expression : expression;
		return this;
	};

	/**
	 * Adds optional LIMIT and OFFSET clauses to the query
	 * @method limit
	 * @param limit {number} A non-negative integer showing how many rows to return
	 * @param [offset=0] {number} A non-negative integer showing what row to start the result set with.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.limit = function(limit, offset) {
		if (isNaN(limit) || limit < 0 || Math.floor(limit) !== limit) {
			throw new Q.Exception("the limit must be a non-negative integer");
		}
		if (offset !== undefined && offset !== null) {
			if (isNaN(offset) || offset < 0 || Math.floor(offset) !== offset) {
				throw new Q.Exception("the offset must be a non-negative integer");
			}
		}
		switch (this.type) {
			case Db.Query.TYPE_SELECT:
				break;
			case Db.Query.TYPE_UPDATE:
			case Db.Query.TYPE_DELETE:
				if (offset !== undefined && offset !== null) {
					throw new Q.Exception("the LIMIT clause cannot have an OFFSET in this context");
				}
				break;
			default:
				throw new Q.Exception("The LIMIT clause does not belong in this context.");
		}

		if (this.clauses['LIMIT'])
			throw new Q.Exception("The LIMIT clause has already been specified.");

		this.clauses['LIMIT'] = "LIMIT " + limit;
		if (offset !== undefined && offset !== null) {
			this.clauses['LIMIT'] += " OFFSET " + offset;
		}

		return this;
	};
	
	/**
	 * Adds a SET clause to an UPDATE statement
	 * @method set
	 * @param updates {object} An associative array of column: value pairs.
	 *  The values are automatically escaped using PDO placeholders.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.set = function (updates) {
		var expression = set_internal(this, updates);
		this.clauses['SET'] = this.clauses['SET'] ? this.clauses['SET'] + ", " + expression : expression;
		return this;
	};
	
	/**
	 * Adds an ON DUPLICATE KEY UPDATE clause to an INSERT statement.
	 * Use only with MySQL.
	 * @method onDuplicateKeyUpdate
	 * @param updates {object} An associative array of {column: value} pairs.
	 *  The values are automatically escaped using PDO placeholders.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.onDuplicateKeyUpdate = function(updates) {
		updates = onDuplicateKeyUpdate_internal(this, updates);
		
		if (!this.clauses['ON DUPLICATE KEY UPDATE']) {
			this.clauses['ON DUPLICATE KEY UPDATE'] = updates; 
		} else {
			this.clauses['ON DUPLICATE KEY UPDATE'] += ", " + updates;
		}
		return this;
	};
	
	/**
	 * Works with SELECT queries to lock the selected rows.
	 * Use only with MySQL.
	 * @method lock
	 * @param [type='FOR UPDATE'] {string} Defaults to 'FOR UPDATE', but can also be 'LOCK IN SHARE MODE'
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.lock = function(type) {
		type = type || 'FOR UPDATE';
		switch (type.toUpperCase()) {
			case 'FOR UPDATE':
			case 'LOCK IN SHARE MODE':
				this.clauses['LOCK'] = type;
				break;
			default:
				throw new Exception("Incorrect type for MySQL lock");
		}
		return this;
	};
	
	/**
	 * Begins a transaction right before executing this query.
	 * The reason this method is part of the query class is because
	 * you often need the "where" clauses to figure out which database to send it to,
	 * if sharding is being used.
	 * @method begin
	 * @param {string} [lockType='FOR UPDATE'] Defaults to 'FOR UPDATE',
	 *   but can also be 'LOCK IN SHARE MODE', 
	 *   or set it to null to avoid adding a "LOCK" clause
	 * @chainable
	 */
	mq.begin = function(lockType)
	{
		if (lockType === undefined || lockType === true) {
			lockType = 'FOR UPDATE';
		}
		if (lockType) {
			this.lock(lockType);
		}
		this.clauses['BEGIN'] = 'START TRANSACTION';
		return this;
	};

	/**
	 * Commits transaction when query is executed
	 * Use only with MySQL.
	 * @method commit
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.commit = function() {
		this.clauses['COMMIT'] = 'COMMIT';
		return this;
	};

	/**
	 * Rolls back transaction when query is executed
	 * Use only with MySQL.
	 * @method rollback
	 * @param {string} [criteria=null] Pass this to target the rollback to the right shard.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.rollback = function(criteria) {
		this.clauses['ROLLBACK'] = 'ROLLBACK';
		// and now, for sharding
		if (typeof criteria === 'object') {
			this.criteria = Q.copy(criteria);
		}
		return this;
	};

	function onDuplicateKeyUpdate_internal (query, updates) {
		if (query.type != Db.Query.TYPE_INSERT) {
			throw new Q.Exception("The ON DUPLICATE KEY UPDATE clause does not belong in this context.");
		}
		
		if (typeof updates === 'object') {
			var updates_list = [], field;
			for (field in updates) {
				var value = updates[field];
				if (value && value.typename === "Db.Expression") {
					Q.extend(query.parameters, value.parameters);
					updates_list.push(field + " = " + value);
				} else {
					updates_list.push(field + " = :_dupUpd_"+onDuplicateKeyUpdate_internal.i);
					query.parameters["_dupUpd_"+onDuplicateKeyUpdate_internal.i] = value;
					++ onDuplicateKeyUpdate_internal.i;
				}
			}
			updates = updates_list.join(", ");
		}
		if (typeof updates !== 'string')
			throw new Q.Exception("The ON DUPLICATE KEY updates need to be specified correctly.");
		
		return updates;
	}
	onDuplicateKeyUpdate_internal.i = 1;
	
	/**
	 * This function provides an easy way to provide additional clauses to the query.
	 * @method options
	 * @param options {object} An associative array of {key: value} pairs, where the key is
	 *  the name of the method to call, and the value is the array of arguments.
	 *  If the value is not an array, it is wrapped in one.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.options = function(options) {
		if (!options) {
			return this;
		}
		for (var key in options) {
			var value = options[key];
			if (typeof(this[key]) === 'function') {
				if (Q.typeOf(value) !== 'array') {
					value = [value];
				}
				var method = this[key];
				method.apply(this, value);
			}
		}
		return this;
	};

	
	/**
	 * Builds the query from the clauses
	 * @method build
	 * @param {object} [options={}]
	 * @return {string}
	 */
	mq.build = function(options) {
		var sql = '', select, from, join, where, groupBy, having, orderBy, limit, lock,
			into, values, afterValues, onDuplicateKeyUpdate,
			update, set, i;
		switch (this.type) {
			case Db.Query.TYPE_RAW:
				sql = this.clauses['RAW'] || '';
				break;
			case Db.Query.TYPE_SELECT:
				// SELECT
				select = this.clauses['SELECT'] || '*';
				if (this.after['SELECT']) {
					select += " " + this.after['SELECT'];
				}
				// FROM
				from = (this.clauses['FROM'] || []).join(', ');
				// if (!from)
				// 	throw new Q.Exception("missing FROM clause in DB query.");
				if (this.after['FROM']) {
					from += " " + this.after['FROM'];
				}
				// JOIN
				join = this.clauses['JOIN'] || '';
				if (this.after['JOIN']) {
					join += " " + this.after['JOIN'];
				}
				// WHERE
				where = this.clauses['WHERE'] ? 'WHERE ' + this.clauses['WHERE'] : '';
				if (this.after['WHERE']) {
					where += " " + this.after['WHERE'];
				}
				// GROUP BY
				groupBy = this.clauses['GROUP BY'] ? "GROUP BY " + this.clauses['GROUP BY'] : '';
				if (this.after['GROUP BY']) {
					groupBy += " " + this.after['GROUP BY'];
				}
				// HAVING
				having = this.clauses['HAVING'] ? "HAVING " + this.clauses['HAVING'] : '';
				if (this.after['HAVING']) {
					having += " " + this.after['HAVING'];
				}
				// ORDER BY
				orderBy = this.clauses['ORDER BY'] ? "ORDER BY " + this.clauses['ORDER BY'] : '';
				if (this.after['ORDER BY']) {
					orderBy += " " + this.after['ORDER BY'];
				}
				// LIMIT
				limit = this.clauses['LIMIT'] || '';
				if (this.after['LIMIT']) {
					limit += " " + this.after['LIMIT'];
				}
				// LOCK
				lock = this.clauses['LOCK'] || '';
				if (this.after['LOCK']) {
					lock +=  " " + this.after['LOCK'];
				}
				sql = "SELECT " + select +
					(from ? "\nFROM " + from : '') +
					"\n" + join +
					"\n" + where +
					"\n" + groupBy +
					"\n" + having +
					"\n" + orderBy +
					"\n" + limit +
					"\n" + lock;
				break;
			case Db.Query.TYPE_INSERT:
				// INTO
				if (!this.clauses['INTO'])
					throw new Q.Exception("missing INTO clause in DB query.");
				into = this.clauses['INTO'] || '';
				if (into) {
					if (!this.clauses['FIELDS']) {
						throw new Q.Exception("missing FIELDS clause in DB query.");
					}
					into += '(' + this.clauses['FIELDS'] + ')';
				}
				if (this.after['INTO']) {
					into += " " + this.after['INTO'];
				}
				values = this.clauses['VALUES'] || '';
				afterValues = this.after['VALUES'] || '';
				onDuplicateKeyUpdate = this.clauses['ON DUPLICATE KEY UPDATE'] ?
					'ON DUPLICATE KEY UPDATE '  + this.clauses['ON DUPLICATE KEY UPDATE'] : '';
				sql = "INSERT INTO " + into +
					"\nVALUES (" + values + ")" +
					"\n" + afterValues +
					"\n" + onDuplicateKeyUpdate;
				break;
			case Db.Query.TYPE_UPDATE:
				// UPDATE
				if (!this.clauses['UPDATE'])
					throw new Q.Exception("Missing UPDATE tables clause in DB query.");
				if (!this.clauses['SET'])
					throw new Q.Exception("missing SET clause in DB query.");
				update = this.clauses['UPDATE'] || '';
				if (this.after['UPDATE']) {
					update += " " + this.after['UPDATE'];
				}
				// JOIN
				join = this.clauses['JOIN'] || '';
				if (this.after['JOIN']) {
					join += " " + this.after['JOIN'];
				}
				// SET
				set = this.clauses['SET'] || '';
				if (this.after['SET']) {
					set += " " + this.after['SET'];
				}
				// WHERE
				where = this.clauses['WHERE'] ? 'WHERE ' + this.clauses['WHERE'] : 'WHERE 1';
				if (this.after['WHERE']) {
					where += " " + this.after['WHERE'];
				}
				// LIMIT
				limit = this.clauses['LIMIT'] || '';
				if (this.after['LIMIT']) {
					limit += " " + this.after['LIMIT'];
				}
				sql = "UPDATE " + update +
					"\n" + join +
					"\nSET " + set +
					"\n" + where +
					"\n" + limit;
				break;
			case Db.Query.TYPE_DELETE:
				// DELETE
				if (!this.clauses['FROM'])
					throw new Q.Exception("missing FROM clause in DB query.");
				from = this.clauses['FROM'] || '';
				if (this.after['FROM']) {
					from += " " + this.after['FROM'];
				}
				// JOIN
				join = this.clauses['JOIN'] || '';
				if (this.after['JOIN']) {
					join += " " + this.after['JOIN'];
				}
				// WHERE
				where = this.clauses['WHERE'] ? 'WHERE ' + this.clauses['WHERE'] : 'WHERE 1';
				if (this.after['WHERE']) {
					where += " " + this.after['WHERE'];
				}
				// LIMIT
				limit = this.clauses['LIMIT'] || '';
				if (this.after['LIMIT']) {
					limit += " " + this.after['LIMIT'];
				}
				sql = "DELETE FROM " + from +
					"\n" + join +
					"\n" + where +
					"\n" + limit;
				break;
			case Db.Query.TYPE_ROLLBACK:
				break;
			default:
				throw new Q.Exception("Unknown query type "+this.type);
				break;
		}
		return sql;
	};
	
	/**
	 * Create mysql.Connection and connects to the database table
	 * @method reallyConnect
	 * @param callback {function} The callback is fired after connection is complete. mysql.Connection is passed as argument
	 * @param [shardName=''] {string} The name of the shard to connect
	 * @param {object} modifications={} Additional modifications to table information. If supplied override shard modifications
	 */
	mq.reallyConnect = function(callback, shardName, modifications) {
		return this.db.reallyConnect(callback, shardName, modifications);
	};

	/**
	 * Get string representation of the query
	 * @method valueOf
	 * @return {string} SQL statement
	 */
	/**
	 * Get string representation of the query
	 * @method toString
	 * @return {string} SQL statement
	 */
	mq.valueOf = mq.toString = function() {
		try {
			return this.build();
		} catch (e) {
			return '*****' + e;
		}
	};
	
	/**
	 * Inserts a custom clause after a particular clause
	 * @method after
	 * @param after {string} The name of the standard clause to add after, such as FROM or UPDATE
	 * @param clause {string} The text of the clause to add
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.after = function(after, clause) {
		if (clause) {
			this.after = this.after[after] ? this.after + ' ' + clause : clause;
		}
		return this;
	};
	
	/**
	 * Gets a clause from the query
	 * @method getClause
	 * @param clause {string} Name of the clause
	 * @param with_after {boolean} Also get the sql after the clause, if any
	 * @return {string|array} If with_after is true, returns [clause, after]
	 *  Otherwise just returns clause
	 */
	mq.getClause = function(clause_name, with_after) {
		var clause = this.clauses[clause_name] || '';
		if (!with_after) {
			return clause;
		}
		var after = this.after[clause_name] || '';
		return [clause, after];
	};
	
	/**
	 * Calculates which shards the query should be issued to, based on those
	 * "WHERE" criteria that were specified in a structured way.
	 * Used mostly by .execute(), but you can call it too, to see how a query
	 * would be executed.
	 * @method shard
	 * @param {object} [index={}] Used internally to override configuration setting for sharding
	 * @return {object} Returns a hash of shardName => query pairs, where shardName
	 *  can be the name of a shard, or "*" to have the query run on all the shards.
	 */
	mq.shard = function(index) {
		if (!this.className) {
			return {"": this};
		}
		var point, max, field, i, value, hash, parts, shards, len, hashed = [], missing = 0;
		var connName = this.db.connName;
		var className = this.className.substr(connName.length + 1);
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
	 * Gets the SQL that would be executed with the execute() method.
	 * @method getSQL
	 * @param callback {function} This callback is passed the resulting SQL string.
	 * @param [shardName=''] {string} The name of the shard on which to execute getSQL.
	 * @return {Db.Query|string} Returns the db query again, for chainable interface.
	 *	If "callback" is not defined returns string representation of the query
	 */
	mq.getSQL = function (callback, shardName) {
		var mq = this;
		delete mq.replacements['{\\$prefix}'];
		delete mq.replacements['{\\$dbname}'];
		var repres = mq.build();
		var keys = Object.keys(mq.parameters);
		keys.sort(replaceKeysCompare);
		function makeSQL(connection) {
			var k, key, value, value2;
			for (k in keys) {
				key = keys[k];
				value = mq.parameters[key];
				if (value === null || value === undefined) {
					value2 = "NULL";
				} else if (value && value.typename === "Db.Expression") {
					value2 = value;
				} else if (value instanceof Date) {
					value2 = '"'+mq.db.toDateTime(value.getTime())+'"';
				} else {
					value2 = connection.escape(value);
				}
				if (Q.isInteger(key)) {
					repres = repres.replace('?', value2);
				} else {
					repres = repres.replace(":"+key, value2);
				}
			}
			if (callback)
				Q.extend(mq.replacements, {'{\\$prefix}': mq.db.prefix(), '{\\$dbname}': mq.db.dbname()});
			for (k in mq.replacements) {
				repres = repres.replace(new RegExp(k, 'g'), mq.replacements[k]);
			}
			if (callback) {
				callback.call(mq, repres, connection);
			}
		}
		if (callback) {
			this.reallyConnect(makeSQL, shardName);
			return this;
		} else {
			makeSQL(this.reallyConnect());
			return repres;
		}
	};
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
			hashed = Q.normalize(value).substr(0, len);
			break;
		case 'md5':
			hashed = Q.md5(value).substr(0, len);
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

function replaceKeysCompare(a, b) {
	var aIsInteger = Q.isInteger(a);
	var bIsInteger = Q.isInteger(b);
	if (aIsInteger && !bIsInteger) {
		return -1;
	}
	if (bIsInteger && !aIsInteger) {
		return 1;
	}
	if (aIsInteger && bIsInteger) {
		return parseInt(a) - parseInt(b);
	}
	return b.length-a.length;
}

function criteria_internal (query, criteria) {
	var criteria_list, expr, value, values, i, k;
	if (typeof criteria === 'object') {
		criteria_list = [];
		for (expr in criteria) {
			value = criteria[expr];
			if (value == null) {
				criteria_list.push( "ISNULL(" + expr + ")");
			} else if (value && value.typename === "Db.Expression") {
				Q.extend(query.parameters, value.parameters);
				if (/\W/.test(expr.substr(-1))) {
					criteria_list.push( "" + expr + "(" + value + ")" );
				} else {
					criteria_list.push( "" + expr + " = (" + value + ")");
				}
			} else {
				if (/\W/.test(expr.substr(-1))) {
					criteria_list.push( "" + expr + ":_criteria_" + _valueCounter );
					query.parameters["_criteria_" + _valueCounter] = value;
					++ _valueCounter;
				} else if (Q.typeOf(value) === 'array') {
					if (value.length) {
						values = [];
						for (i=0; i<value.length; ++i) {
							values.push(":_criteria_" + _valueCounter);
							query.parameters["_criteria_" + _valueCounter] = value[i];
							++ _valueCounter;
						}
						criteria_list.push( "" + expr + " IN (" + values.join(',') + ")" );
					} else {
						criteria_list.push("FALSE"); // since value array is empty
					}
				} else if (value && value.typename === 'Db.Range') {
					if (value.min != null) {
						var c_min = value.includeMin ? ' >= ' : ' > ';
						criteria_list.push( "" + expr + c_min + ":_criteria_" + _valueCounter );
						query.parameters["_criteria_" + _valueCounter] = value.min;
						++ _valueCounter;
					}
					if (value.max != null) {
						var c_max = value.includeMax ? ' <= ' : ' < ';
						criteria_list.push( "" + expr + c_max + ":_criteria_" + _valueCounter );
						query.parameters["_criteria_" + _valueCounter] = value.max;
						++ _valueCounter;
					}
				} else {
					criteria_list.push(expr + " = :_criteria_" + _valueCounter);
					query.parameters["_criteria_" + _valueCounter] = value;
					++ _valueCounter;
				}
			}
		}
		criteria = criteria_list.join(" AND ");
	} else if (criteria && criteria.typename === "Db.Expression") {
		Q.extend(query.parameters, criteria.parameters);
		criteria = criteria.toString();
	}

	return criteria;
}

function set_internal (query, updates) {
	switch (query.type) {
		case Db.Query.TYPE_UPDATE:
			break;
		default:
			throw new Q.Exception("Db.Query.Mysql set_internal: The SET clause does not belong in this context.");
	}
	if (typeof updates === 'object') {
		var updates_list = [];
		for (var field in updates) {
			var value = updates[field];
			if (value && value.typename === "Db.Expression") {
				Q.extend(query.parameters, value.parameters);
				updates_list.push(field + " = " + value);
			} else {
				updates_list.push(field + " = :_set_"+_valueCounter);
				query.parameters["_set_"+_valueCounter] = value;
				++ _valueCounter;
			}
		}
		updates = (updates_list.length) ? updates_list.join(", \n") : "";
	}
	if (typeof updates !== 'string') {
		throw new Q.Exception("Db.Query.Mysql set_internal: The SET updates need to be specified correctly.");
	}
	return updates;
}

module.exports = Query_Mysql;
