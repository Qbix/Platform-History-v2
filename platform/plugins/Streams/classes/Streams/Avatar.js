/**
 * Class representing avatar rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Streams = require('Streams');
var Db = Q.require('Db');

/**
 * Class representing 'Avatar' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's shard
 * @namespace Streams
 * @class Avatar
 * @extends Base.Streams.Avatar
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Avatar (fields) {

	// Run constructors of mixed in objects
	Streams_Avatar.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Avatar.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Avatar, Q.require('Base/Streams/Avatar'));

/**
 * Get the display name from a Streams.Avatar
 * 
 * @method displayName
 * @param {Object} [options] A bunch of options which can include:
 *   @param {Boolean} [options.short] Show one part of the name only
 *   @param {boolean} [options.show] The parts of the name to show. Can have "f", "fu", "l", "lu", "flu" and "u" separated by spaces. The "fu" and "lu" represent firstname or lastname with fallback to username, while "flu" is "firstname lastname" with a fallback to username.
 *   @param {Boolean} [options.html] If true, encloses the first name, last name, username in span tags. If an array, then it will be used as the attributes of the html.
 *   @param {Boolean} [options.escape] If true, does HTML escaping of the retrieved fields
 * @param {String} [fallback='Someone'] What to return if there is no info to get displayName from.
 * @return {String}
 */
Streams_Avatar.prototype.displayName = function _Avatar_prototype_displayName (options, fallback) {
	var fn = Q.getObject("fields.firstName", this);
	var ln = Q.getObject("fields.lastName", this);
	var u = Q.getObject("fields.username", this);
	var fn2, ln2, u2, f2;
	fallback = fallback || 'Someone';
	if (options && (options.escape || options.html)) {
		fn = fn.encodeHTML();
		ln = ln.encodeHTML();
		u = u.encodeHTML();
		fallback = fallback.encodeHTML();
	}
	if (options && options.html) {
		fn2 = '<span class="Streams_firstName">'+fn+'</span>';
		ln2 = '<span class="Streams_lastName">'+ln+'</span>';
		u2 = '<span class="Streams_username">'+u+'</span>';
		f2 = '<span class="Streams_username">'+fallback+'</span>';
	} else {
		fn2 = fn;
		ln2 = ln;
		u2 = u;
		f2 = fallback;
	}
	if (options && options.show) {
		var show = options.show.split(' ').map(function (x) {
			return x.trim();
		});
		var parts = [];
		for (var i=0, l=show.length; i<l; ++i) {
			var s = show[i];
			switch (s) {
			case 'f': parts.push(fn2); break;
			case 'l': parts.push(ln2); break;
			case 'u': parts.push(u2); break;
			case 'fu': parts.push(fn2 ? fn2 : u2); break;
			case 'lu': parts.push(ln2 ? ln2 : u2); break;
			case 'flu':
			default:
				parts.push(fn2 || ln2 ? [fn2, ln2].join(' ') : u2);
				break;
			}
		}
		return parts.join(' ').trim() || f2;
	}
	if (options && options.short) {
		return fn ? fn2 : (u ? u2 : f2);
	} else if (fn && ln) {
		return fn2 + ' ' + ln2;
	} else if (fn && !ln) {
		return u ? fn2 + ' ' + u2 : fn2;
	} else if (!fn && ln) {
		return u ? u2 + ' ' + ln2 : ln2;
	} else {
		return u ? u2 : f2;
	}
};

/**
 * Get plain object representing the row, as well as displayName and shortName
 * @method toArray
 */
Streams_Avatar.prototype.toArray = function () {
	var res = Db.Row.prototype.toArray.call(this);
	res.displayName = this.displayName();
	res.shortName = this.displayName({short: true});
	return res;
};

/**
 * Fetches a Streams.Avatar object.
 * The Streams plugin maintains an avatar for every user that authenticates the app.
 * 
 * @static
 * @method fetch
 * @param {String} toUserId The user to which the avatar will be displayed
 * @param {String} publisherId The user publishing the avatar
 * @param {Function} callback Receives (err, avatar)
 */
Streams_Avatar.fetch = function (toUserId, publisherId, callback) {
	Streams.Avatar.SELECT('*').where({
		toUserId: ['', toUserId],
		publisherId: publisherId
	}).execute(function (err, results) {
		if (err) {
			return callback.apply(this, arguments);
		}
		var avatar = null;
		if (results.length) {
			var index = (results.length == 1 || results[0].toUserId) ? 0 : 1;
			avatar = results[index];
		}
		callback(null, avatar);
	});
};

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Avatar.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Avatar;