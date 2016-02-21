/**
 * Class representing customer rows.
 *
 * This description should be revised and expanded.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');
var Customer = Q.require('Base/Awards/Customer');

/**
 * Class representing 'Customer' rows in the 'Awards' database
 * @namespace Awards
 * @class Customer
 * @extends Base.Awards.Customer
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Customer (fields) {

	// Run mixed-in constructors
	Awards_Customer.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Customer.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Awards_Customer, Customer);

/*
 * Add any public methods here by assigning them to Awards_Customer.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Awards_Customer.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Awards_Customer;