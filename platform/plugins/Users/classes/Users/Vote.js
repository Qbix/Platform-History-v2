/**
 * Class representing vote rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Vote' rows in the 'Users' database
 * <br/>Represents a vote by a user for something
 * @namespace Users
 * @class Vote
 * @extends Base.Users.Vote
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Vote (fields) {

	// Run constructors of mixed in objects
	Users_Vote.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	var _cache = null;

	function _afterHandler (query, error, result) {
		if (!error && _cache) {
			_cache.save(false, true, function (err) {
				if (err) {
					// rollback
					_cache.beforeRetrieveExecute = function (query) {
						return query.rollback().execute();
					};
					_cache.retrieve(function () {
						_cache = null;
						query.resume(err);
					});
				} else {
					_cache = null;
					query.resume(error, result);
				}
			});
			return true;
		}
	}

	function _rollback (obj, str) {
		obj.beforeRetrieveExecute = function (query) {
			return query.rollback();
		};
		obj.retrieve(function () {
			throw new Error(str);
		});
	}

	/**
	 * Update total votes in Users.Total when saving new vote
	 * @method beforeSaveExecute
	 * @param query {Db.Query.Mysql}
	 *	The query being excecuted
	 * @param modifiedFields {object}
	 *	The fields which are modified by query
	 */
	this.beforeSaveExecute = function (query, modifiedFields) {
		var self = this;
		var total = new Users.Total({forId: this.forId});
		total.retrieve('*', true, true, function(err, total_res) {
			if (!err) {
				if (!total_res.length) {
					total.weightTotal = 0;
					total.voteCount = 0;
					total.value = 0;
				} else {
					total = total_res[0];
				}
				var weightTotal = total.weightTotal;
				var vote = new Users.Vote({userId: modifiedFields.userId, forId: modifiedFields.forId});
				vote.retrieve('*', true, function (err, vote_res) {
					if (!err) {
						if (!vote_res.length) {
							total.weightTotal += modifiedFields.weight;
							total.voteCount += 1;
							total.value = (total.value * weightTotal + modifiedFields.value * modifiedFields.weight) / (total.weightTotal);
						} else {
							vote = vote_res[0];
							if (!total.voteCount) {
								// something is wrong
								total.voteCount = 1;
							}
							total.weightTotal += (modifiedFields.weight - vote.weight);
							if (!total.weightTotal) {
								_rollback(total, self.className + ".beforeSaveExecute(): total.weight = 0!");
							}
							total.value =
								(total.value * weightTotal 
									- vote.value * vote.weight 
									+ modifiedFields.value * modifiedFields.weight) / (total.weightTotal);
						}
						_cache = total;
						query.resume();
					} else console.log(err);
				});
			} else console.log(err);
		}).begin().lock().resume();
		if (this.prototype.beforeSaveExecute) {
			return this.prototype.beforeSaveExecute(query, modifiedFields);
		}
	};
	
	/**
	 * Commit or rollback transaction when saving new vote
	 * @method afterSaveExecute
	 * @param query {Db.Query.Mysql}
	 *	The query being excecuted
	 * @param result {object}
	 *	The result of the query
	 * @param error {Error}
	 *	Error object if any
	 */
	this.afterSaveExecute = _afterHandler;
	
	/**
	 * Update total votes in Users.Total when removing a vote
	 * @method beforeRemoveExecute
	 * @param query {Db.Query.Mysql}
	 *	The query being excecuted
	 */
	this.beforeRemoveExecute = function (query) {
		var self = this;
		var vote = new Users.Vote({userId: this.userId, forId: this.forId});
		vote.retrieve('*', true, true, function(err, vote_res) {
			if (!err) {
				if (vote_res.length) {
					vote = vote_res[0];
					var total = new Users.Total({forId: vote.forId});
					total.retrieve('*', true, true, function (err, total_res) {
						if (!err) {
							if (!total_res.length) {
								// something is wrong ... if there are votes, there should have been a total
								total.weightTotal = 0;
								total.voteCount = 0;
								total.value = 0;
							} else {
								total = total_res[0];
								var weightTotal = total.weightTotal;
								total.weightTotal -= vote.weight;
								if (!total.weightTotal) {
									total.value = 0;
								} else {
									total.value = 
										(total.value * weightTotal - vote.value * vote.weight) / (total.weightTotal);
								}
								total.voteCount -= 1;
							}
							_cache = total;
							query.resume();
						} else console.log(err);
					}).lock().resume();
				} else query.resume();
			} else console.log(err);
		}).begin().resume();
	};

	/**
	 * Commit or rollback transaction when deleting a vote
	 * @method afterRemoveExecute
	 * @param query {Db.Query.Mysql}
	 *	The query being excecuted
	 * @param result {object}
	 *	The result of the query
	 * @param error {Error}
	 *	Error object if any
	 */
	this.afterRemoveExecute = _afterHandler;

	/* * * */
}

Q.mixin(Users_Vote, Q.require('Base/Users/Vote'));

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Vote.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Vote;