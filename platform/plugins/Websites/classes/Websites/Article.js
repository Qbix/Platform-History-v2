/**
 * Class representing article rows.
 *
 * This description should be revised and expanded.
 *
 * @module Websites
 */
var Q = require('Q');
var Db = Q.require('Db');
var Article = Q.require('Base/Websites/Article');

/**
 * Class representing 'Article' rows in the 'Websites' database
 * <br/>Websites/article stream type extension
 * @namespace Websites
 * @class Article
 * @extends Base.Websites.Article
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Websites_Article (fields) {

	// Run mixed-in constructors
	Websites_Article.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Article.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Websites_Article, Article);

/*
 * Add any public methods here by assigning them to Websites_Article.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Websites_Article.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Websites_Article;