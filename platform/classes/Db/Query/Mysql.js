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
 * @param {Number} type One of the TYPE_* constants in Db.Query
 * @param {String|Object} query A sql query (for raw queries) or an associative array of clauses
 * @param {Object|Array} parameters The parameters to add to the query right away (to be bound when executing). Values corresponding to numeric keys replace question marks, while values corresponding to string keys replace ":key" placeholders, in the SQL.
 * @param {String} table The table operated with query
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
	 * @param {function} callback This function is called when the queries have all completed.
	 *  It is passed the following arguments:
	 * * errors: an Object. If there were any errors, it will contain shardName: error pairs
	 * * results: an array of results merged from all the shards (for SELECT queries)
	 *    for INSERT queries results contains the value of LAST_INSERT_ID()
	 * * fields: an array of fields merged from all the shards (for SELECT queries)
	 *  It is passed an object whose keys are the shard names and the values
	 *  are arrays of [err, results, fields] as returned from the mysql module.
	 * @method execute
	 * @param {Object} [options={}] You can override the following options:
	 * @param {boolean} [options.plain=false]
	 *    If true, returns array of plain object instead of Db.Row instances
	 * @param {boolean} [options.raw=false]
	 *    If true, or if the query type is Db.Query.TYPE_RAW, the callback
	 *    will be passed an object of pairs representing the results returned
	 *    from the mysql query on each shard. Note that the results array will
	 *    contain raw objects of the form "{fieldName: fieldValue};",
	 *    and not objects which have Db.Row mixed in.
	 * @param {String|Array|Object} [options.shards]
	 *    This option will bypass the usual sharding calculations.
	 *    You can pass a string here, which will be used to run the query
	 *    on this shard. Or pass an array of shard names. Or you can 
	 *    specify custom query objects as {shardName: query}.
	 */
	mq.execute = function(callback, options) {
		var shardName, connection = this.db.connName;
		options = options || {};
		var shards = options.shards;
		if (typeof shards === 'string') {
			shardName = shards;
			shards = {};
			shards[shardName] = mq;
		} else if (Q.isArrayLike(shards)) {
			var shards2 = {};
			for (var i=0, l=shards.length; i<l; ++i) {
				shards[ shards[i] ] = mq;
			}
			shards = shards2;
		}
		var queries = shards || this.shard(options.indexes);
		var self = this;
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
			var i, pk, pk2, f;
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
				if (pk2 = pk[2]) {
					for (f in pk2) {
						temp[pk2[f].name] = 1;
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
						var row = rowClass.newRow
							? rowClass.newRow(results[i], true)
							: new rowClass(results[i], true)
						results2.push(row);
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
					 * @param {Error} error
					 *	The error object
					 * @param {Db.Query.Mysql} mq
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
			if (sql.indexOf('(,') >= 0) {
				debugger;
			}
			connection.query(sql, function(err, rows, fields) {
				if (err) {
					err.message += "\nQuery was:\n"+mq;
					mq.db.emit('error', err, mq);
				}
				cb(err, rows, fields, sql, connection);
			});
		}
	};
	
	/**
	 * Creates a query to select fields from one or more tables.
	 * @method SELECT
	 * @param {string|object} fields The fields as strings, or associative array of {alias: field};
	 * @param {string|object} tables The tables as strings, or associative array of {alias: table};
	 * @param {boolean} [repeat=false] If tables is an array, and select() has
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
				column = Db.Query.Mysql.column(fields[alias]);
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
	 * @param {string} table The name of the table. May also be "name AS alias".
	 * @param {Db.Expression|object|string} condition The condition to join on. Thus, JOIN table ON (condition)
	 * @param {string} [join_type='INNER'] The string to prepend to JOIN, such as 'INNER', 'LEFT OUTER', etc.
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
			var conditionList = [];
			for (var expr in condition) {
				var i, l, value = condition[expr];
				if (Q.isArrayLike(value)) {
					// a bunch of OR criteria
					var pieces = [];
					for (i=0, l=value.length; i<l; ++i) {
						var v = value[i];
						v = v.map(function (a) {
							return new Db.Expression(a);
						});
						pieces.push(criteria_internal(this, v));
					}
					conditionList.push(pieces.join(' OR '));
				} else {
					conditionList = criteria_internal(this, {
						expr: new Db_Expression(value)
					}, {});
				}
			}
			condition = conditionList.join(' AND ' );
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
	 * @param {Db.Expression|object|string} criteria An associative array of expression: value pairs.
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
	 * @param {Db.Expression|object|string} criteria An associative array of expression: value pairs.
	 *  The values are automatically turned into placeholders to be escaped later.
	 *  They can also be arrays, in which case they are placed into an expression of the form "key IN ('val1', 'val2')"
	 *  Or, this could be a Db.Expression object.
	 * @param {Db.Expression|object|string} or_criteria You can have any number of these, including zero.
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
	 * @param {Db.Expression|object|string} criteria An associative array of expression: value pairs.
	 *  The values are automatically turned into placeholders to be escaped later.
	 *  They can also be arrays, in which case they are placed into an expression of the form "key IN ('val1', 'val2')"
	 *  Or, this could be a Db.Expression object.
	 * @param {Db.Expression|object|string} and_criteria
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
	 * @param {Db.Expression|object|string} criteria An associative array of expression => value pairs.
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
			case Db.Query.TYPE_UPDATE:
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
	 * @param {number} limit A non-negative integer showing how many rows to return
	 * @param {number} [offset=0] A non-negative integer showing what row to start the result set with.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 * @chainable
	 */
	mq.limit = function(limit, offset) {
		if (limit == null) {
			return this;
		}
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
	 * @param {object} updates An associative array of column: value pairs.
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
	 * @param {object} updates An associative array of {column: value} pairs.
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
	 * @param {string} [type='FOR UPDATE'] Defaults to 'FOR UPDATE', but can also be 'LOCK IN SHARE MODE'
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
					updates_list.push(Query_Mysql.column(field) + " = " + value);
				} else {
					updates_list.push(
						Query_Mysql.column(field) + " = :_dupUpd_"
						+onDuplicateKeyUpdate_internal.i
					);
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
	 * @param {object} options An associative array of {key: value} pairs, where the key is
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
	 * @param {function} callback The callback is fired after connection is complete. mysql.Connection is passed as argument
	 * @param {string} [shardName=''] The name of the shard to connect
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
	 * @param {string} after The name of the standard clause to add after, such as FROM or UPDATE
	 * @param {string} clause The text of the clause to add
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
	 * @param {string} clause Name of the clause
	 * @param {boolean} with_after Also get the sql after the clause, if any
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
	 * Gets the SQL that would be executed with the execute() method.
	 * @method getSQL
	 * @param {function} callback This callback is passed the resulting SQL string.
	 * @param {string} [shardName=''] The name of the shard on which to execute getSQL.
	 * @return {Db.Query|string} Returns the db query again, for chainable interface.
	 *	If "callback" is not defined returns string representation of the query
	 */
	mq.getSQL = function (callback, shardName) {
		var mq = this;
		delete mq.replacements['{{prefix}}'];
		delete mq.replacements['{{dbname}}'];
		var repres = mq.build();
		var keys = Object.keys(mq.parameters);
		keys.sort(replaceKeysCompare);
		function makeSQL(connection) {
			var k, key, value, value2, values3 = {};
			for (k in keys) {
				key = keys[k];
				value = mq.parameters[key];
				if (value instanceof Buffer) {
					value = value.toString();
				}
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
					values3[key] = value2;
				} else {
					repres = repres.replace(":"+key, value2);
				}
			}
			var i = 0;
			if (!Q.isEmpty(values3)) {
				repres = repres.replace( /\?/g, function() {
					var v = values3[i++];
					if (v === undefined) {
						console.log(repres, i);
					}
					return v !== undefined ? v : '?';
				});
			}
			if (callback)
				Q.extend(mq.replacements, {
					'{{prefix}}': mq.db.prefix(), 
					'{{dbname}}': mq.db.dbname()
				});
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

function criteria_internal (query, criteria, fillCriteria) {
	var criteria_list, expr, parts, columns, value, values, v, i, j, k, vl, vl2, pl;
	var fillCriteria = query.criteria;
	if (typeof criteria === 'object') {
		criteria_list = [];
		for (expr in criteria) {
			value = criteria[expr];
			if (value instanceof Buffer) {
				value = value.toString();
			}
			parts = expr.split(',').map(function (str) {
				return str.trim();
			});
			pl = parts.length;
			if (pl > 1) {
				if (!Q.isArrayLike(value)) {
					throw new Q.Exception("Db.Query.Mysql: The value should be an array of arrays");
				}
				var columns = [], c;
				for (k=0; k<pl; ++k) {
					c = parts[k];
					columns.push(Query_Mysql.column(c));
					if (!fillCriteria[c]) {
						fillCriteria[c] = []; // sharding heuristics
					}
				}
				var list = [];
				for (j=0, vl=value.length; j<vl; ++j) {
					if (!Q.isArrayLike(value[j])) {
						var json = JSON.stringify(value[j]);
						throw new Q.Exception(
							"Db.Query.Mysql: Value " + json
								+ " needs to be an array"
						);
					}
					if (value[j].length != pl) {
						throw new Q.Exception(
							"Db_Query_Mysql: Arrays should have " + pl +
							" elements to match " + expr
						);
					}
					var vector = [];
					for (k=0, vl2=value[j].length; k<vl2; ++k) {
						vector.push(":_criteria_" + _valueCounter);
						query.parameters["_criteria_" + _valueCounter] = value[j][k];
						_valueCounter = (_valueCounter + 1) % 1000000;
						fillCriteria[column].push(value[j][k]); // sharding heuristics
					}
					list.push('(' + vector.join(',') + ')');
				}
				if (list.length) {
					var lhs = '(' + columns.join(',') + ')';
					var rhs = '(\n' + list.join(',\n') + '\n)';
					criteria_list.push(lhs + ' IN ' + rhs);
				} else {
					criteria_list.push('FALSE');
				}
			} else if (value === undefined) {
				// do not add this value to criteria
			} else if (value == null) {
				criteria_list.push( "ISNULL(" + expr + ")");
			} else if (value && value.typename === "Db.Expression") {
				Q.extend(query.parameters, value.parameters);
				if (/\W/.test(expr.slice(-1))) {
					criteria_list.push( "" + Query_Mysql.column(expr) + "(" + value + ")" );
				} else {
					criteria_list.push( "" + Query_Mysql.column(expr) + " = (" + value + ")");
				}
			} else if (Q.isArrayLike(value)) {
				var valueList = '';
				if (value.length) {
					values = [];
					for (i=0; i<value.length; ++i) {
						values.push(":_criteria_" + _valueCounter);
						query.parameters["_criteria_" + _valueCounter] = value[i];
						_valueCounter = (_valueCounter + 1) % 1000000;
					}
					valueList = values.join(',');
				}
				if (/\W/.test(expr.slice(-1))) {
					criteria_list.push( "" + expr + "(" + valueList + ")" );
				} else if (value.length === 0) {
					criteria_list.push("FALSE"); // since value array is empty
				} else {
					criteria_list.push( "" + Query_Mysql.column(expr) + " IN (" + valueList + ")");
				}
			} else if (value && value.typename === 'Db.Range') {
				if (value.min != null) {
					var c_min = value.includeMin ? ' >= ' : ' > ';
					criteria_list.push( "" + Query_Mysql.column(expr) + c_min + ":_criteria_" + _valueCounter );
					query.parameters["_criteria_" + _valueCounter] = value.min;
					_valueCounter = (_valueCounter + 1) % 1000000;
				}
				if (value.max != null) {
					var c_max = value.includeMax ? ' <= ' : ' < ';
					criteria_list.push( "" + Query_Mysql.column(expr) + c_max + ":_criteria_" + _valueCounter );
					query.parameters["_criteria_" + _valueCounter] = value.max;
					_valueCounter = (_valueCounter + 1) % 1000000;
				}
			} else {
				var eq = /\W/.test(expr.slice(-1)) ? '' : ' = ';
				criteria_list.push( "" + Query_Mysql.column(expr) + eq + ":_criteria_" + _valueCounter );
				query.parameters["_criteria_" + _valueCounter] = value;
				_valueCounter = (_valueCounter + 1) % 1000000;
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
				_valueCounter = (_valueCounter + 1) % 1000000;
			}
		}
		updates = (updates_list.length) ? updates_list.join(", \n") : "";
	}
	if (typeof updates !== 'string') {
		throw new Q.Exception("Db.Query.Mysql set_internal: The SET updates need to be specified correctly.");
	}
	return updates;
}

Query_Mysql.column = function _column(column) {
	var len = column.length, part = column, pos = false, chars = ['.', '_', '-', '$'], i, c;
	for (i=0; i<len; ++i) {
		c = column[i];
		if (
			chars.indexOf(c) < 0
			&& (c < 'a' || c > 'z')
			&& (c < 'A' || c > 'Z')
			&& (c < '0' || c > '9')
		) {
			pos = i;
			part = column.substring(0, pos);
			break;
		}
	}
	var parts = part.split('.');
	var quoted = [];
	len = parts.length;
	for (i=0; i<len; ++i) {
		quoted.push('`' + parts[i] + '`');
	}
	return quoted.join('.') + (pos ? column.substring(pos) : '');
}

Q.mixin(Query_Mysql, Db.Query);

module.exports = Query_Mysql;
