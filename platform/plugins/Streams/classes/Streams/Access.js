/**
 * Class representing access rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Access' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's shard
 * @namespace Streams
 * @class Access
 * @extends Base.Streams.Access
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Access (fields) {

	// Run constructors of mixed in objects
	Streams_Access.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Access.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Access, Q.require('Base/Streams/Access'));

/**
 * @method getAllPermissions
 * @return {Array}
 */
Streams_Access.prototype.getAllPermissions = function () {
	try {
		return this.permissions ? JSON.parse(this.permissions) : [];
	} catch (e) {
		return [];
	}
};

/**
 * @method hasPermission
 * @param {String} permission
 * @param {Boolean}
 */
Streams_Access.prototype.hasPermission = function (permission) {
	return (this.getAllPermissions().indexOf(permission) >= 0);
};

/**
 * @method addPermission
 * @param {String} permission
 */
Streams_Access.prototype.addPermission = function (permission) {
	var permissions = this.getAllPermissions();
	if (permissions.indexOf(permission) < 0) {
		permissions.push(permission);
	}
	this.permissions = JSON.stringify(permissions);
};

/**
 * @method removePermission
 * @param {String} permission
 * @param {Boolean}
 */
Streams_Access.prototype.removePermission = function (permission) {
	var permissions = this.getAllPermissions();
	var index = permissions.indexOf(permission);
	if (index >= 0) {
		permissions.splice(index, 1);
	}
	this.permissions = JSON.stringify(permissions);
};

/**
 * @method getAllPermissions
 * @return {Array}
 */
this.getAllPermissions = function () {
	try {
		return this.permissions ? JSON.parse(this.permissions) : [];
	} catch (e) {
		return [];
	}
};

/**
 * @method hasPermission
 * @param {String} permission
 * @param {Boolean}
 */
this.hasPermission = function (permission) {
	return (this.getAllPermissions().indexOf(permission) >= 0);
};

/**
 * @method addPermission
 * @param {String} permission
 */
this.addPermission = function (permission) {
	var permissions = this.getAllPermissions();
	if (permissions.indexOf(permission) < 0) {
		permissions.push(permission);
	}
	this.permissions = JSON.stringify(permissions);
};

/**
 * @method removePermission
 * @param {String} permission
 * @param {Boolean}
 */
this.removePermission = function (permission) {
	var permissions = this.getAllPermissions();
	var index = permissions.indexOf(permission);
	if (index >= 0) {
		permissions.splice(index, 1);
	}
	this.permissions = JSON.stringify(permissions);
};

/*
 * Add any public methods here by assigning them to Streams_Access.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Access.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Access;