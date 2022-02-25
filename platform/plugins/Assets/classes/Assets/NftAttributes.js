/**
 * Class representing nft_attributes rows.
 *
 * This description should be revised and expanded.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');
var NftAttributes = Q.require('Base/Assets/NftAttributes');

/**
 * Class representing 'NftAttributes' rows in the 'Assets' database
 * @namespace Assets
 * @class NftAttributes
 * @extends Base.Assets.NftAttributes
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Assets_NftAttributes (fields) {

	// Run mixed-in constructors
	Assets_NftAttributes.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Assets_NftAttributes, NftAttributes);

/*
 * Add any public methods here by assigning them to Assets_NftAttributes.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Assets_NftAttributes.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Assets_NftAttributes;