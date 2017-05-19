/**
 * Class representing session rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = require('Users');

/**
 * Class representing 'Session' rows in the 'Users' database
 * <br/>This table is used to replicate PHP sessions information for
 * @namespace Users
 * @class Session
 * @extends Base.Users.Session
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Session (fields) {

	// Run constructors of mixed in objects
	Users_Session.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Session.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Users_Session.decodeId = function (id) {
	if (!id) {
		return [false, '', ''];
	}
	var secret = Q.Config.get(['Q', 'external', 'secret'], null);
	var result = '';
	var i = 0;
	var len = id.length;
	var r, c1, c2, a, b, c;
	var replacements = {
		'z': 'z',
		'a': '+',
		'b': '/',
		'c': '='
	};
	while (i < len-1) {
		r = id[i];
		c1 = id[i];
		++i;
		if (c1 == 'z') {
			c2 = id[i];
			if (replacements[c2]) {
				r = replacements[c2];
				++i;
			}
		}
		result += r;
	}
	if (i < len) {
		result += id[i];
	}
	result = bin2hex(base64_decode(result));
	a = result.substr(0, 32);
	b = result.substr(32, 32);
	c = secret !== undefined
		? (b === Q.Utils.signature(a, secret).substr(0, 32))
		: true;
	return [c, a, b];
};

/**
 * Pushes notifications to the device corresponding the session ids.
 * @method pushNotifications
 * @static
 * @param {String|Array} userIds A user id, or an array of them, 
 *	 in which case sessionIds would be an object of { userId: sessionId }
 *   in which case notifications would be an object of { userId: notification }
 * @param {String|Object} sessionIds A session id, or an object of them
 * @param {Object} notifications Please see Users.Device.pushNotification for the spec
 * @param {Function} [callback] A function to call after the push has been completed
 */
Users_Session.pushNotifications = function (userIds, sessionIds, notifications, callback) {
	var isArrayLike = Q.isArrayLike(userIds);
	Users.Device.SELECT('*').where({
		userId: userIds
	}).execute(function (err, devices) {
		if (err) {
			return callback(err);
		}
		var d = [];
		Q.each(devices, function (i) {
			var u = this.fields.userId;
			var n = isArrayLike ? notifications[u] : notifications;
			var s = isArrayLike ? sessionIds[u] : sessionIds;
			if (this.fields.sessionId === s) {
				this.pushNotification(n);
				d.push(this);
			}
		});
		callback(null, d, n);
	});
};

Q.mixin(Users_Session, Q.require('Base/Users/Session'));

/*
 * Add any public methods here by assigning them to Users_Session.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Session.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Session;





function bin2hex (s) {
	var o = '', i, l, n;
	s += '';
	for (i = 0, l = s.length; i < l; i++) {
		n = s.charCodeAt(i).toString(16);
		o += n.length < 2 ? '0'+n : n;
	}
	return o;
}

function base64_decode (encodedData) {
	var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	var o1, o2, o3, h1, h2, h3, h4, bits;
	var i = 0, ac = 0, dec = '', tmpArr = [];
	if (!encodedData) {
		return encodedData
	}
	encodedData += '';
	do {
		// unpack four hexets into three octets using index points in b64
		h1 = b64.indexOf(encodedData.charAt(i++));
		h2 = b64.indexOf(encodedData.charAt(i++));
		h3 = b64.indexOf(encodedData.charAt(i++));
		h4 = b64.indexOf(encodedData.charAt(i++));
		bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
		o1 = bits >> 16 & 0xff;
		o2 = bits >> 8 & 0xff;
		o3 = bits & 0xff;
		if (h3 === 64) {
			tmpArr[ac++] = String.fromCharCode(o1);
		} else if (h4 === 64) {
			tmpArr[ac++] = String.fromCharCode(o1, o2);
		} else {
			tmpArr[ac++] = String.fromCharCode(o1, o2, o3);
		}
	} while (i < encodedData.length);
	dec = tmpArr.join('');
	return decodeURIComponent(encodeURIComponent(dec.replace(/\0+$/, '')));
}