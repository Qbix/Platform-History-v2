/**
 * @module Q
 */
var Q = require('../Q');
/**
 * @class Request
 * @namespace Q
 */
var Request = {};

/**
 * Method for getting the app's canonical baseUrl from the config.
 * Note that this may not match the baseUrl for all PHP requests.
 */
Request.baseUrl = function () {
	return Q.Config.expect(['Q', 'web', 'appRootUrl'])
	+ Q.Config.get(['Q', 'web', 'controllerSuffix'], '');
};

/**
 * Use this to determine what method to treat the request as.
 * @method method
 * @param {http.Request} req
 * @return {string} Returns an uppercase string such as "GET", "POST", "PUT", "DELETE"
 *  See [Request methods](http://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods)
 */
Request.method = function (req) {
	var parts = require('url').parse(req.url, true);
	if (parts.query && parts.query["Q.method"]) {
		return parts.query["Q.method"].toUpperCase();
	}
	if (!req.method) {
		return 'GET';
	}
	return req.method.toUpperCase();
};

/**
 * The names of slots that were requested, if any
 * @method slotNames
 * @param {http.Request} req
 * @param {boolean} [returnDefaults=false]If set to true, returns the array of slot names set in config field
 *  named Q/response/$app/slotNames in the event that slotNames was not specified at all in the request.
 * @return {array}
 */
Request.slotNames = function(req, returnDefaults) {
	var parts = require('url').parse(req.url, true);
	if (!parts.query || !parts.query["Q.slotNames"]) {
		if (!returnDefaults) {
			return null;
		}
		var app = Q.Config.expect(['Q', 'app']);
		return Q.Config.get(
			['Q', 'response', 'slotNames'],
			['content', 'dashboard', 'title', 'notices']
		);
	}
	var slotNames = parts.query["Q.slotNames"];
	if (typeof slotNames === 'string') {
		var result = [];
		var snp = slotNames.split(',');
		for (var i=0; i<snp.length; ++i) {
			result.push(snp[i]);
		}
		slotNames = result;
	}
	if (!slotNames || !slotNames.length) {
		return [];
	}
	return slotNames;
}


module.exports = Request;