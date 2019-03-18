/**
 * Class representing slide rows.
 *
 * This description should be revised and expanded.
 *
 * @module Websites
 */
var Q = require('Q');
var Db = Q.require('Db');
var Slide = Q.require('Base/Websites/Slide');

/**
 * Class representing 'Slide' rows in the 'Websites' database
 * <br/>Websites/article stream type extension
 * @namespace Websites
 * @class Slide
 * @extends Base.Websites.Slide
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Websites_Slide (fields) {

	// Run mixed-in constructors
	Websites_Slide.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Slide.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Websites_Slide, Slide);

/*
 * Add any public methods here by assigning them to Websites_Slide.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Websites_Slide.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Websites_Slide;