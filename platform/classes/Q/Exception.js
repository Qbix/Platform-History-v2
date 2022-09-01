/**
 * @module Q
 */
/**
 * Create custom exception
 * @class Exception
 * @namespace Q
 * @constructor
 * @param {string} [message=""] The error message
 * @param {object} fields={}
 */
var Exception = function (message, fields) {
	this.fields = fields || {};
	this.message = message.interpolate(fields) || "";
};
Exception.prototype = Error.prototype;

module.exports = Exception;