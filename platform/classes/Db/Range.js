/**
 * @module Db
 */
/**
 * The class representing a rabge of database values
 * @class Range
 * @namespace Db
 * @constructor
 * @param min {string}               Minimal value of the range. Pass null to skip the min.
 * @param includeMin {boolean}       Whether the range extends to include the minimum value
 * @param includeMax {boolean}       Whether the range extends to include the maximum value
 * @param max {string}               Maximal value of the range. Pass null to skip the max.
 *  If boolean true is passed here, then $max is set to $min with the last character
 *  incremented to the next ASCII value.
 */
function Range(min, includeMin, includeMax, max) {
	this.min = min;
	this.includeMin = includeMin;
	this.includeMax = includeMax;
	if (max === true) {
		if (typeof min !== 'string') {
			throw new Exception("Db.Range: min is the wrong type, expected a string");
		}
		max = min.substring(0, min.length-1) + String.fromCharCode(min.charCodeAt(min.length-1)+1);
	}
	this.max = max;
	this.typename = "Db.Range";
}

module.exports = Range;