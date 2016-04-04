/**
 * Class representing customer rows.
 *
 * This description should be revised and expanded.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');
var Customer = Q.require('Base/Assets/Customer');

/**
 * Class representing 'Customer' rows in the 'Assets' database
 * @namespace Assets
 * @class Customer
 * @extends Base.Assets.Customer
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Assets_Customer (fields) {

	// Run mixed-in constructors
	Assets_Customer.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Customer.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Assets_Customer, Customer);

/*
 * Add any public methods here by assigning them to Assets_Customer.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Assets_Customer.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Assets_Customer;