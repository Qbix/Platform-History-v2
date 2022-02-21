/**
 * Class representing web3 rows.
 *
 * This description should be revised and expanded.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');
var Web3 = Q.require('Base/Assets/Web3');

/**
 * Class representing 'Web3' rows in the 'Assets' database
 * <br>Cache web3 requests
 * @namespace Assets
 * @class Web3
 * @extends Base.Assets.Web3
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Assets_Web3 (fields) {

	// Run mixed-in constructors
	Assets_Web3.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Assets_Web3, Web3);

/*
 * Add any public methods here by assigning them to Assets_Web3.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Assets_Web3.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Assets_Web3;