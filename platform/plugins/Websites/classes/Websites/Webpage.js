/**
 * Class representing webpage rows.
 *
 * This description should be revised and expanded.
 *
 * @module Websites
 */
var Q = require('Q');
var Db = Q.require('Db');
var Webpage = Q.require('Base/Websites/Webpage');

/**
 * Class representing 'Webpage' rows in the 'Websites' database
 * @namespace Websites
 * @class Webpage
 * @extends Base.Websites.Webpage
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Websites_Webpage (fields) {

	// Run mixed-in constructors
	Websites_Webpage.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Websites_Webpage, Webpage);

/*
 * Add any public methods here by assigning them to Websites_Webpage.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Websites_Webpage.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Websites_Webpage;