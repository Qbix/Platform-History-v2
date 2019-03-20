/**
 * Class representing label rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Label' rows in the 'Users' database
 * <br/>enables display and renaming of labels and their icons
 * @namespace Users
 * @class Label
 * @extends Base.Users.Label
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Label (fields) {

	// Run constructors of mixed in objects
	Users_Label.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Label.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Label, Q.require('Base/Users/Label'));

/*
 * Add any public methods here by assigning them to Users_Label.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_Label.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_Label;