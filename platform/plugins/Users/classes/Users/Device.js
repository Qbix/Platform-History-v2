/**
 * Class representing device rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Device' rows in the 'Users' database
 * @namespace Users
 * @class Device
 * @extends Base.Users.Device
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Device (fields) {

	// Run constructors of mixed in objects
	Users_Device.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Device.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Device, Q.require('Base/Users/Device'));

/*
 * Add any public methods here by assigning them to Users_Device.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_Device.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_Device;