/**
 * Class representing invite rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');

/**
 * Class representing 'Invite' rows in the 'Streams' database
 * <br/>stores invites to the stream on user id server
 * @namespace Streams
 * @class Invite
 * @extends Base.Streams.Invite
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Invite (fields) {

	// Run constructors of mixed in objects
	Streams_Invite.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Invite.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Streams_Invite.prototype.url = function _Streams_Invite_prototype_getUrl() {
	return Streams.invitedUrl(this.fields.token);
};

Q.mixin(Streams_Invite, Q.require('Base/Streams/Invite'));

/*
 * Add any public methods here by assigning them to Streams_Invite.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Invite.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Invite;