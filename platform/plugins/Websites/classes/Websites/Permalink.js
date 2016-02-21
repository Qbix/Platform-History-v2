/**
 * Class representing permalink rows.
 *
 * @module Websites
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Permalink' rows in the 'Websites' database
 * <br/>For permalink lookup
 * @namespace Websites
 * @class Permalink
 * @extends Base.Websites.Permalink
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Websites_Permalink (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Websites_Permalink.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Permalink.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Websites_Permalink, Q.require('Base/Websites/Permalink'));

/*
 * Add any public methods here by assigning them to Websites_Permalink.prototype
 */

module.exports = Websites_Permalink;