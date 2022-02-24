/**
 * Class representing purchase rows.
 *
 * This description should be revised and expanded.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');
var Purchase = Q.require('Base/Assets/Purchase');

/**
 * Class representing 'Purchase' rows in the 'Assets' database
 * @namespace Assets
 * @class Purchase
 * @extends Base.Assets.Purchase
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Assets_Purchase (fields) {

	// Run mixed-in constructors
	Assets_Purchase.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Assets_Purchase, Purchase);

/*
 * Add any public methods here by assigning them to Assets_Purchase.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Assets_Purchase.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Assets_Purchase;