/**
 * @module Db
 */

var Q = require('Q');
var util = require('util');

/**
 * The class representing database row
 * @class Row
 * @namespace Db
 * @constructor
 * @param {object} fields Optional object of fields
 * @param {boolean} [retrieved=false] Optional if object was retrieved from database or created
 */
function Row(fields, retrieved /* false */) {

	var self = this;

	/**
	 * The fields names
	 * @property _fieldNames
	 * @type array
	 * @private
	 */
	var _fieldNames = this.fieldNames();

	/**
	 * The names of the fields in primary key
	 * @property _primaryKey
	 * @type array
	 * @private
	 */
	var _primaryKey = this.primaryKey();

	/**
	 * A container for fields values.
	 * Used by [G/S]etters to store values of the fields
	 * @property fields
	 * @type object
	 */
	this.fields = {};
	var _fields = this._fields = {};
	
	/**
	 * Whether this Db_Row was retrieved or not.
	 * The save() method uses this to decide whether to insert or update.
	 * @property retrieved
	 * @type boolean
	 */
	this.retrieved = false;
	
	/**
	 * The value of the primary key of the row
	 * Is set automatically if the Db_Row was fetched from a Db_Result.
	 * @property _pkValue
	 * @type object
	 * @private
	 */
	var _pkValue;
	
	/**
	 * The fields of the row
	 * @property _fieldsModified
	 * @type object
	 * @private
	 */
	var _fieldsModified = this._fieldsModified = {};
	
	/**
	 * The temporary config to make shards split
	 * @property _split
	 * @type object
	 * @private
	 */
	var _split = null;
	
	function getter(k) {
		return function Db_Row_getter() {
			var row = this._row;
			if (row["beforeGet_" + k]
			&& (typeof row["beforeGet_" + k] === "function")) {
				// NOTE: this is synchronous, we wouldn't be able to do any async,
				// and since Node is a single thread, we shouldn't do I/O at all in them!
				// This should be documented.
				row["beforeGet_" + k].call(row, row._fields);
			}
			return row._fields[k];
		};
	}
	function setter(k) {
		return function Db_Row_setter(x) {
			var row = this._row;
			// we shall skip beforeSet_xxx during shards split process to get exact copy of the data
			var safe = k.replace(/[^0-9a-zA-Z\_]/, '_');
			if (!_split && row["beforeSet_" + safe]
			&& (typeof row["beforeSet_" + safe] === "function")) {
				// NOTE: this is synchronous, we wouldn't be able to do any async,
				// and since Node is a single thread, we shouldn't do I/O at all in them!
				// This should be documented.
				var result = row["beforeSet_" + safe].call(row, x, row._fields);
				if (result !== undefined) {
					x = result;
				}
			}
			row._fieldsModified[k] = true;
			row._fields[k] = x;
		};
	}
	
	var k, i;

	for (i in _fieldNames) {
		k = _fieldNames[i];
		Object.defineProperty(this.fields, k, {
			'enumerable': true,
			'get': getter(k),
			'set': setter(k)
		});
		Object.defineProperty(this.fields, '_row', {
			'enumerable': false,
			'value': this
		})
		if (fields && (k in fields)) {
			this.fields[k] = (fields[k] instanceof Buffer)
				? fields[k].toString()
				: fields[k];
		}
	}
	if ((this.retrieved = !!retrieved)) {
		this._fieldsModified = {};
	}
	
	/**
	 * Whether this Db_Row was retrieved or not.
	 * @property retrieved
	 * @type boolean
	 */
	Object.defineProperty(this, 'pkValue', {
		get: function () {
			return _pkValue;
		}
	});

	_pkValue = calculatePKValue() || {};

	(function runSetUp(self) {
		if (self.__proto__) {
			runSetUp(self.__proto__);
		}
		if (self.setUp && (typeof self.setUp === "function")) {
			self.setUp.call(self);
		}
	})(this);
	
	/**
	 * Saves the row in the database.
	 * If object has methods beforeRetrieve, beforeRetrieveExecute or afterRetrieveExecute,
	 * they may be triggered during this operation.
	 * @method save
	 * @param {boolean} [onDuplicateKeyUpdate=false] If MySQL is being used, you can set this to TRUE
	 *  to add an ON DUPLICATE KEY UPDATE clause to the INSERT statement
	 * @param {boolean} [commit=false] If this is TRUE, then the current transaction is committed right after the save.
	 *  Use this only if you started a transaction before.
	 * @param {function} [callback=null] This function is called when the queries have all completed.
	 *  Its this object is the same as the one the save method is called on.
	 *  It is passed the one optional argument:
	 *  errors: an Object. If there were any errors, it will be passed error object as returned from query.execute. If successful, it will be passed nothing.
	 */
	this.save = function (onDuplicateKeyUpdate /* = false */, commit /* = false */, callback) {

		var me = this;
		var _continue = true;
		var rowClass = Q.require( this.className.split('_').join('/') );

		if (typeof onDuplicateKeyUpdate === 'function') {
			callback = onDuplicateKeyUpdate;
			onDuplicateKeyUpdate = commit = false;
		} else if (typeof commit === 'function') {
			callback = commit;
			commit = false;
		} else if (typeof callback !== 'function') {
			callback = function (err) {
				if (typeof err !== "undefined") {
					console.log("Db.Row: ERROR while saving " + self.className);
					console.log(err);
					console.log("Primary key: ", calculatePKValue());
				}
			};
		}

		if (this.className === "Row")
			throw new Error("If you're going to save, please extend Db.Row.");

		var modifiedFields = {}, key;
		for (key in this._fields) {
			if (this._fieldsModified[key]) {
				modifiedFields[key] = this._fields[key];
			}
		}

		/**
		 * Optional. If defined the method is called before taking actions to save row.
		 * It can be used synchronously and can ignore callback but must return
		 * `modifiedFields` object. If used asyncronously shall pass this object
		 * to callback
		 *
		 * **NOTE:** *if this method is defined but do returns null and do not call callback,
		 * the `save()` method fails silently without making any changes in the database!!!*
		 * @method beforeSave
		 * @param {object} modifiedFields 
		 * @param {function} [callback=null] This function is called when hook completes.
		 *  Receives "error" - error object if any, and modifiedFields as parameters.
		 */
		var shouldSaveNow;
		if (!_split && typeof this.beforeSave === "function") { // skip beforeSave when on _split is defined
			try {
				shouldSaveNow = this.beforeSave(modifiedFields, function (error, modifiedFields) {
					if (error) callback && callback.call(self, error);
					else _do_save.call(this, modifiedFields);
				});
			} catch (error) {
				callback && callback.call(self, error);
				return;
			}
		}
		if (shouldSaveNow) _do_save.call(this, modifiedFields);

		function _do_save(modifiedFields) {
			if (!modifiedFields) {
				callback && callback.call(self, new Error(self.className+".beforeSave callback cancelled save")); // nothing saved
				return;
			}
			if (typeof modifiedFields !== "object")
				throw new Error(self.className + ".beforeSave() must return the array of (modified) fields to save!");

			var db, query, _inserting;
			if (!(db = self.db()))
				throw new Error("The database was not specified!");

			if (me.retrieved) {
				// update the table
				query = rowClass.UPDATE().set(modifiedFields).where(_pkValue);
				_inserting = false;
			} else {
				// insert new row
				query = rowClass.INSERT(modifiedFields);
				if (onDuplicateKeyUpdate) 
					query.onDuplicateKeyUpdate(modifiedFields);
				_inserting = true;
			}

			function _do_callbacks(error, lastId) {
				if (error) callback && callback.call(self, error);
				else {
					// We assume that autoincrement field is the single primary key
					if (_inserting && _primaryKey.length === 1 && lastId) {
						self._fields[pk[0]] = lastId;
					}
					_pkValue = calculatePKValue() || {};
					self._fieldsModified = {};
					me.retrieved = true;
					callback && callback.call(self);
				}
				query = null;
			}

			function _execute() {
				query = this;
				if (commit) query.commit();
				query.execute(function (error, lastId) {
					if (typeof self.afterSaveExecute === "function") {
						Row.emit(self.className+'/after/saveExecute', 
							self, query, error, lastId
						);
						query.resume = _do_callbacks;
						if (!self.afterSaveExecute(query, error, lastId)) {
							_do_callbacks(error, lastId);
							// NOTE: this is synchronous
							// to use it the async way return *true* and use query.resume(error, result) to continue
						}
					} else {
						_do_callbacks(error, lastId);
					}
				}, {indexes: _split});
			}
			Row.emit(self.className+'/before/saveExecute', 
				self, query, modifiedFields
			);
			if (typeof self.beforeSaveExecute === "function") {
				query.resume = _execute;
				query = (_continue = !!self.beforeSaveExecute(query, modifiedFields))
					|| query; // NOTE: this is synchronous
					// to use it async way return *false* and use query.resume() to continue
					// or handle callbacks in some creative way
			}
			if (_continue) _execute.apply(query);
		}
	};
	
	/**
	 * Retrieves a row from the database.
	 * If object has methods beforeRetrieve, beforeRetrieveExecute or afterRetrieveExecute,
	 * they may be triggered during this operation.
	 * @method retrieve
	 * @param {String} [fields='*'] The fields to retrieve and set in the Db_Row.
	 *  This gets used if we make a query to the database.
	 * @param {boolean} [useIndex=false] If true, the primary key is used in searching, 
	 *  and an exception is thrown when any fields of the primary key are not specified
	 * @param {array|boolean} [modifyQuery=false] If an array, the following keys are options for modifying the query. Any other keys will be sent to query.options(modifyQuery);
	 *   You can call more methods, like limit, offset, where, orderBy,
	 *   and so forth, on that Db_Query. After you have modified it sufficiently,
	 *   get the ultimate result of this function, by calling the resume() method on 
	 *   the Db_Query object (via the chainable interface).
	 * 
	 *   You can also pass true in place of the modifyQuery field to achieve
	 *   the same effect as {"query": true}
	 * @param {boolean|string} [modifyQuery.begin] this will cause the query 
	 *   to have .begin() a transaction which locks the row for update. 
	 *   You should call .save(..., true) to unlock the row, otherwise other 
	 *   database connections trying to access the row will be blocked.
	 * @param {boolean} [modifyQuery.rollbackIfMissing]
	 *   If begin is true, this option determines whether to
	 *   rollback the transaction if the row we're trying to retrieve is missing.
	 *   Defaults to false.
	 * @param {boolean} [modifyQuery.ignoreCache]
	 *   If true, then call ignoreCache on the query
	 * @param {boolean} [modifyQuery.caching]
	 *   If provided, then call caching() on the query, passing this value
	 * @param {boolean} [modifyQuery.query]
	 *   If true, it will return a Db_Query that can be modified, rather than the result. 
	 * @param {array} [options=array()] Array of options to pass to beforeRetrieve and afterFetch functions.
	 * @param {function} [callback=null] This function is called when all queries have completed.
	 *  The "this" object would be this row, now hydrated with values from the database.
	 *  It is passed the following arguments:
	 *  1) errors: an Object. If there were any errors they will be passed along as
	 *     documented in query.execute. If there were no errors, this will be null.
	 *  2) result: an array of rows retrieved. If error occured it will be passed nothing
 	 */
	this.retrieve = function (fields /* '*' */, useIndex /* false */, modifyQuery /* false */, callback) {

		var _continue = true;
		var rowClass = Q.require( this.className.split('_').join('/') );

		if (typeof fields === 'function') {
			callback = fields;
			fields = '*';
			useIndex = false;
			modifyQuery = false;
		} else if (typeof useIndex === 'function') {
			callback = useIndex;
			useIndex = false;
			modifyQuery = false;
		} else if (typeof modifyQuery === 'function') {
			callback = modifyQuery;
			modifyQuery = false;
		} else if (typeof callback !== 'function' && !modifyQuery) {
			throw new Error("Callback for retrieve method was not specified for " + this.className + ".");
		}

		if (this.className === "Row")
			throw new Error("If you're going to save, please extend Db.Row.");
		
		var primaryKeyValue = calculatePKValue();
		var search_criteria = {};
		
		if (useIndex === true) {
			if (!primaryKeyValue)
				throw new Error("Fields of the primary key were not specified for " + this.className + ".");
			// Use the primary key value as the search criteria
			search_criteria = primaryKeyValue;
		} else {
			// Use the modified fields as the search criteria.
			search_criteria = this._fields;
			// If no fields were modified on this object,
			// then this function will just return an empty array -- see below.
		}
		
		/**
		 * Optional. If defined the method is called before taking actions to retrieve row.
		 * It can be used synchronously and can ignore callback but must return
		 * search_criteria object. If used asyncronously shall pass this object
		 * to callback
		 *
		 * **NOTE:** *if this method is defined but do not return result and do not call callback,
		 * the retrieve() method fails silently!!!*
		 * @method beforeRetrieve
		 * @param {Object} search_criteria 
		 * @param {function} [callback=null] This function is called when hook completes. Returns error -
		 *	error object if any and search_criteria as parameters.
		 */
		if (typeof this.beforeRetrieve === "function") {
			try {
				search_criteria = this.beforeRetrieve(search_criteria, function (error, search_criteria) {
					if (error) callback && callback.call(self, error);
					else return _do_retrieve(search_criteria);
				});
			} catch (error) {
				callback && callback.call(self, error);
				return;
			}
		}
		if (search_criteria) return _do_retrieve(search_criteria);

		function _do_retrieve(search_criteria) {
			if (!search_criteria) {
				callback && callback.call(self, new Error(this.className+".beforeRetrieve callback cancelled retrieve")); // nothing saved
				return;
			}
			if (typeof search_criteria !== "object")
				throw new Error(this.className + ".beforeRetrieve() must return the array of (modified) fields to save!");

			var db, query;
			if (!(db = self.db()))
				throw new Error("The database was not specified!");
			query = rowClass.SELECT(fields).where(search_criteria);

			function _do_callbacks(error, result) {
				var fetched = false;
				if (result[0]) {
					self.copyFromRow(result[0]);
					fetched = true;
				}
				if (error) {
					callback && callback.call(self, error);
				} else {
					callback && callback.call(self, null, result, fetched);
				}
				query = null;
			}

			function _execute() {
				// Now, execute the query!
				query = this;
				query.execute(function (error, result) {
					Row.emit(self.className+'/after/retrieveExecute', 
						self, query, error, result
					);
					if (typeof self.afterRetrieveExecute === "function") {
						query.resume = _do_callbacks;
						if (!self.afterRetrieveExecute(query, error, result)) {
							_do_callbacks(error, result);
							// NOTE: This is synchronous.
							// To use it the async way return *true* and use query.resume(error, result) to continue
						}
					} else {
						_do_callbacks(error, result);
					}
				}, {indexes: _split});
			}

			function _resume(cback) {
				// callback can be defined either at .retrieve(callback) call or
				// as argument to .resume(callback)
				// so syntax obj.retrieve('*', false, true).begin().resume(callback)
				// or obj.retrieve('*', false, true, callback).begin().resume()
				// are both valid
				if (modifyQuery && typeof callback !== "function") {
					if (typeof cback !== "function") {
						throw new Error("At least one callback shall be defined for "+self.className+".retrieve()!");
					}
					callback = cback;
				}
				query = this;
				Row.emit(self.className+'/before/retrieveExecute', 
					self, query, search_criteria
				);
				if (typeof self.beforeRetrieveExecute === "function") {
					query.resume = _execute;
					query = (_continue = !!self.beforeRetrieveExecute(query, search_criteria)) || query;
					// NOTE: this is synchronous.
					// To use it the async way, return *false* and use query.resume() to continue
				}
				if (_continue && query) {
					_execute.apply(query);
				} else {
					console.log(self.className + ': query is empty!');
				}
			}
			// Modify the query if necessary
			if (modifyQuery) {
				query.resume = _resume;
				return query;
			} else {
				_resume.apply(query);
			}
		}
	};

	/**
	 * Deletes the row from the database.
	 * If object has methods beforeRetrieve, beforeRetrieveExecute or afterRetrieveExecute,
	 * they may be triggered during this operation.
	 * @method remove
	 * @param {String|Object} [search_criteria=null] You can provide custom search criteria here, such as `&#123;"tag.name LIKE ": this.name&#125;`
	 *  If this is left null, and this Db_Row was retrieved, then the db rows corresponding
	 *  to the primary key are deleted.
	 *  But if it wasn't retrieved, then the modified fields are used as the search criteria.
	 * @param {boolean} [useIndex=false] If true, the primary key is used in searching for rows to delete.
	 *  An exception is thrown when some fields of the primary key are not specified
	 * @param {function} [callback=null] This function is called when all queries have completed.
	 *  The "this" object would be this row, now hydrated with values from the database.
	 *  It is passed the following arguments:
	 *  1) errors: an Object. If there were any errors they will be passed along as
	 *     documented in query.execute. If there were no errors, this will be null.
	 *  2) count: an Integer the number of rows deleted. If there were any errors, it will be passed nothing
 	 */
	this.remove = function (search_criteria /* null */, useIndex /* false */, callback) {

		var me = this;
		var _continue = true;
		var rowClass = Q.require( this.className.split('_').join('/') );

		if (typeof search_criteria === 'function') {
			callback = search_criteria;
			search_criteria = null;
			useIndex = false;
		} else if (typeof useIndex === 'function') {
			callback = useIndex;
			useIndex = false;
		} else if (typeof callback !== 'function') {
			callback = function (res, err) {
				if (typeof err !== "undefined") {
					console.log("ERROR while removing " + self.className + "!");
					console.log("Primary key: ", primaryKeyValue);
				}
			};
		}

		if (this.className === "Row")
			throw new Error("If you're going to save, please extend Db.Row.");

		var primaryKeyValue = calculatePKValue();
		// Check if we have specified all the primary key fields,
		if (useIndex) {
			if (!primaryKeyValue)
				throw new Error("Fields of the primary key were not specified for " + this.className + ".");
			search_criteria = primaryKeyValue;
		}
		// If search criteria are not specified, try to compute them.
		if (!search_criteria) {
			if (me.retrieved) {
				// use primary key
				search_criteria = primaryKeyValue;
			} else {
				// use modified fields
				search_criteria = this._fields;
			}
		}

		/**
		 * Optional. If defined the method is called before taking actions to remove row.
		 * It can be used synchronously and can ignore callback but must return
		 * search_criteria object. If used asyncronously shall pass this object
		 * to callback
		 *
		 * **NOTE:** *if this method is defined but do not return result and do not call callback,
		 * the remove() method fails silently without changing database!!!*
		 * @method beforeRemove
		 * @param {object} search_criteria
		 * @param {function} [callback=null] This function is called when hook completes. Returns error -
		 *	error object if any and search_criteria as parameters.
		 */
		if (typeof this.beforeRemove === "function") {
			try {
				search_criteria = this.beforeRemove(search_criteria, function (error, search_criteria) {
					if (error) callback && callback.call(self, error);
					else _do_remove(search_criteria);
				});
			} catch (error) {
				callback && callback.call(self, error);
				return;
			}
		}
		if (search_criteria) _do_remove(search_criteria);

		function _do_remove(search_criteria) {
			if (!search_criteria) {
				callback && callback.call(self, new Error(this.className+".beforeRemove callback cancelled remove")); // nothing saved
				return;
			}
			var db, query;
			if (!(db = self.db()))
				throw new Error("The database was not specified!");
			query = rowClass.DELETE().where(search_criteria);

			function _do_callbacks(error, result) {
				if (error) callback && callback.call(self, error);
				else {
					self._fields = {};
					me.retrieved = false;
					_pkValue = {};
					self._fieldsModified = {};
					callback && callback.call(self, null, result);
				}
				query = null;
			}

			function _execute() {
			// Now, execute the query!
				query = this;
				query.execute(function (error, result) {
					Row.emit(self.className+'/after/removeExecute', 
						self, query, error, result
					);
					if (typeof self.afterRemoveExecute === "function") {
						query.resume = _do_callbacks;
						if (!self.afterRemoveExecute(query, error, result))
							_do_callbacks(error, result);	// NOTE: this is synchronous
							// to use it async way return *true* and use
							// query.resume(error, result) to continue
					} else _do_callbacks(error, result);
				}, {indexes: _split});
			}

			Row.emit(self.className+'/before/removeExecute', 
				self, query, search_criteria
			);
			if (typeof this.beforeRemoveExecute === "function") {
				query.resume = _execute;
				query = (_continue = !!this.beforeRemoveExecute(query, search_criteria)) || query; // NOTE: this is synchronous
												// to use it async way return *false* and use query.resume() to continue
												// or handle callbacks in some creative way
			}
			if (_continue) _execute.apply(query);
		}
	};

	/**
	 * Rolls back the transaction
	 * @method rollback
	 * @param {function} [callback=null] This function is called when all queries have completed.
	 *  The "this" object would be this row, now hydrated with values from the database.
	 *  It is passed the following argument:
	 *  errors: an Object. If there were any errors they will be passed along as
	 *     documented in query.execute. If there were no errors, this will be null.
	 */
	this.rollback = function (callback) {
		var rowClass = Q.require( this.className.split('_').join('/') );

		if (this.className === "Row")
			throw new Error("If you're going to save, please extend Db.Row.");

		var db, query, pk;
		if (!(db = self.db())) {
			throw new Error("The database was not specified!");
		}
		if (!(pk = calculatePKValue())) {
			pk = this._fields;
		}
		query = db.rollback(pk).execute(callback);
	};

	function calculatePKValue() {
		var k, fname, res = {};
		for (k in _primaryKey) {
			fname = _primaryKey[k];
			if (typeof self._fields[fname] === "undefined") {
				return false;
			}
			res[fname] = self._fields[fname];
		}
		return Object.keys(res).length ? res : false;
	}
	
	/**
	 * Set up temporary config for shard split
	 * @method split
	 * @param {Object} index Split shard index
	 *
	 * * 'indexes->connection' section of sharding config. Shall contain 'fields' and 'partition' fields
	 * * 'partition' field shall contain new points mapped to shards
	 * * 'shards' section of config shall be already filled with new shards config
	 */
	
	this.split = function (index) {
		_split = index;
		return this;
	};
	
	/**
	 * This function copies the members of another row,
	 * as well as the primary key, etc. and assigns it to this row.
	 * @method copyFromRow
	 * @param {Db.Row} row The source row. Be careful -- In this case, Db does not check 
	 *  whether the class of the Db_Row matches. It leaves things up to you.
	 * @return {Db_Row} returns this object, for chaining
	 */
	this.copyFromRow = function (row) {
		this.retrieved = row.retrieved;
		for (var key in row.fields) {
			this.fields[key] = row.fields[key];
		}
		return this;
	};
}

Q.makeEventEmitter(Row);

/**
 * Get plain object with the fields of the row
 * @method getFields
 */
Row.prototype.getFields = function () {
	var res = {};
	for (var field in this.fields) {
		if (this.fields[field] !== undefined) {
			res[field] = this.fields[field];
		}
	}
	return res;
};

Row.prototype.toArray = Row.prototype.getFields;

Row.prototype.fillMagicFields = function () {
	var toFill = [];
	var _fieldNames = this.fieldNames();
	for (var i=0, l=_fieldNames.length; i<l; ++i) {
		var f = _fieldNames[i], ff;
		if ((ff = this.fields[f])
		&& ff.expression === "CURRENT_TIMESTAMP") {
			toFill.push(f);
		}
	}
	if (!toFill.length) {
		return this;
	}
	var db = this.db();
	var row = this;
	db.getCurrentTimestamp(function (err, timestamp) {
		for (var i=0, l=toFill.length; i<l; ++i) {
			row.fields[toFill[i]] = db.toDateTime(timestamp);
		}
	});
	return this;
};

Row.prototype.className = "Db_Row";
Row.prototype.typename = 'Db.Row';

Q.extend.dontCopy['Db.Row'] = true;

module.exports = Row;
