/**
 * Class representing category rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Category = Q.require('Base/Streams/Category');

/**
 * Class representing 'Category' rows in the 'Streams' database
 * <br/>denormalized to speed up display of related streams
 * @namespace Streams
 * @class Category
 * @extends Base.Streams.Category
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Category (fields) {

	// Run mixed-in constructors
	Streams_Category.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Category.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Category, Category);

/*
 * Add any public methods here by assigning them to Streams_Category.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Category.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_Category;