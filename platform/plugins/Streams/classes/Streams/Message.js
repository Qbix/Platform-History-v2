/**
 * Class representing message rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');
var Streams = Q.require('Streams');
var Base_Streams_Message = Q.require('Base/Streams/Message');

Q.makeEventEmitter(Streams_Message);

/**
 * Class representing 'Message' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's fm server
 * @namespace Streams
 * @class Message
 * @extends Base.Streams.Message
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Message (fields) {

	// Run constructors of mixed in objects
	Streams_Message.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/* * * */
}

Q.mixin(Streams_Message, Base_Streams_Message);

Streams_Message.defined = {};

Streams_Message.construct = function Streams_Message_construct(fields, retrieved) {
	if (Q.isEmpty(fields)) {
		Q.handle(callback, this, ["Streams.Message constructor: fields are missing"]);
		return false;
	}
	if (fields.fields) {
		fields = fields.fields;
	}
	var type = Q.normalize(fields.type);
	var MC = Streams_Message.defined[type];
	if (!MC) {
		MC = Streams_Message.defined[type] = function MessageConstructor(fields) {
			MessageConstructor.constructors.apply(this, arguments);
			// Default constructor. Copy any additional fields.
			if (!fields) return;
			for (var k in fields) {
				this.fields[k] = Q.copy(fields[k]);
			}
		};
		Q.mixin(MC, Streams_Message);
	}
	var message = new MC(fields);
	if (retrieved) {
		message.retrieved = true;
		message._fieldsModified = {};
	}
	return message;
};

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Message.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

/**
 * Call this function to set a constructor for a message type
 * @static
 * @method define
 * @param {String} type The type of the message, e.g. "Streams/chat/message"
 * @param {String|Function} ctor Your message's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods
 */
Streams_Message.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Streams_Message.define(t, type[t]);
		}
		return;
	};
	type = Q.normalize(type);
	if (typeof ctor !== 'function') {
		throw new Q.Error("Q.Streams.Message.define requires ctor to be a function");
	}
	function CustomMessageConstructor() {
		CustomMessageConstructor.constructors.apply(this, arguments);
		ctor.apply(this, arguments);
	}
	Q.mixin(CustomMessageConstructor, Streams_Message);
	Q.extend(CustomMessageConstructor.prototype, methods);	
	return Streams_Message.defined[type] = CustomMessageConstructor;
};

var Mp = Streams_Message.prototype;

/**
 * Get all the instructions from a message.
 * 
 * @method getAll
 */
Mp.getAll = function _Message_prototype_getAll () {
	try {
		return JSON.parse(this.fields.instructions);
	} catch (e) {
		return undefined;
	}
};

/**
 * Get the value of an instruction in the message
 * 
 * @method get
 * @param {String} instructionName
 */
Mp.get = function _Message_prototype_get (instructionName) {
	var instr = this.getAll();
	return instr[instructionName];
};

/**
 * Posts a message to the stream.
 * Currently doesn't perform any access checks, so it is only meant to be called internally.
 * It is not as robust as the PHP version, which is meant for more general use.
 * @method post
 * @static
 * @param {Object} fields
 *  The fields of the message. Requires publisherId, streamName and byUserId
 * @param callback=null {function}
 */
Streams_Message.post = function (fields, callback)
{
	var required = {publisherId: true, streamName: true, byUserId: true};
	for (var k in required) {
		if (!fields[k]) {
			throw new Q.Exception("Streams.Message.post requires " + k);
		}
	}
	var f = Q.extend({
		type: 'text/small',
		content: '',
		instructions: '',
		byClientId: '',
		weight: 1
	}, fields);
	f.sentTime = new Db.Expression("CURRENT_TIMESTAMP");
	var msg = Streams.Message.construct(f);
	
	var query = 
	 " START TRANSACTION;"
	+"		SELECT messageCount"
	+"		  FROM {$prefix}stream"
	+"		  WHERE publisherId = ?"
	+"		  AND name = ?"
	+"		  INTO @Streams_messageCount"
	+"        FOR UPDATE;"
	+"		INSERT INTO {$prefix}message("
	+"			publisherId, streamName, byUserId, byClientId, sentTime, "
	+"			type, content, instructions, weight, ordinal"
	+"		)"
	+"		VALUES("
	+"			?, ?, ?, ?, CURRENT_TIMESTAMP,"
	+"			?, ?, ?, ?, @Streams_messageCount+1"
	+"		);"
	+"		INSERT INTO {$prefix}total("
	+"			publisherId, streamName, messageType, messageCount"
	+"		)"
	+"		VALUES("
	+"			?, ?, ?, @Streams_messageCount+1"
	+"		)"
	+"		ON DUPLICATE KEY UPDATE messageCount = messageCount+1;"
	+"		UPDATE {$prefix}stream"
	+"		  SET messageCount = @Streams_messageCount+1"
	+"		  WHERE publisherId = ?"
	+"		  AND name = ?;"
	+"		SELECT * FROM {$prefix}stream"
	+"		  WHERE publisherId = ?"
	+"		  AND name = ?;"
	+"		SELECT * FROM {$prefix}message"
	+"		  WHERE publisherId = ?"
	+"		  AND streamName = ?"
	+"		  AND ordinal = @Streams_messageCount+1;"
	+" COMMIT;";
	var values = [
		f.publisherId, f.streamName,
		f.publisherId, f.streamName, f.byUserId, f.byClientId,
		f.type, f.content, f.instructions, f.weight,
		f.publisherId, f.streamName, f.type,
		f.publisherId, f.streamName,
		f.publisherId, f.streamName,
		f.publisherId, f.streamName
	];
	Streams.Stream.db()
	.rawQuery(query, values)
	.execute(function (params) {
		var err = params[""][0];
		if (err) {
			return callback && callback(err);
		}
		var results = params[""][1];
		var stream = Streams.Stream.construct(results[5][0], true);
		var message = Streams.Message.construct(results[6][0]);
		Streams.Stream.emit('post', stream, f.byUserId, message, stream);
		callback && callback.call(stream, null, f.byUserId, message);
	});
};

/**
 * Delivers the message posted to stream according to particular
 * delivery method (see: Streams_Rule.deliver). Message template is taken from views/{message.type} folder -
 * 'email.handlebars' or 'mobile.handlebars' depending on delivery
 * @method deliver
 * @param {Streams.Stream} stream
 * @param {function} toUserId the id of the user to whom to deliver
 * @param {Object} delivery can contain "email" or "mobile" for now
 * @param {Streams.Avatar} the avatar for getting the displayName
 * @param {function} callback
 *	Callback reports errors and response from mail delivery system
 */
Streams_Message.prototype.deliver = function(stream, toUserId, delivery, avatar, callback) {
	var fields = {
		app: Q.app,
		communityName: Users.communityName(),
		stream: stream,
		message: this,
		instructions: this.getAll(),
		avatar: avatar,
		config: Q.Config.getAll()
	};
	var messageType = this.fields.type;
	var subject = Q.Config.get(
		['Streams', 'types', stream.fields.type, 'messages', this.fields.type, 'subject'], 
		Q.Config.get(
			['Streams', 'types', '*', 'messages', this.fields.type, 'subject'],
			Q.Config.get(
				['Streams', 'types', '*', 'messages', '', 'subject'],
				'Please set config "Streams"/"types"/"*"/"messages"/""/"subject"'
			)
		)
	);
	Users.fetch(toUserId, function (err) {
		var to = delivery.to
			? Q.Config.get(['Streams', 'rules', 'deliver', delivery.to], ['email', 'mobile'])
			: ['email', 'mobile'];
		var emailAddress = delivery.email
			|| (to.indexOf('email') >= 0 && this.fields.emailAddress)
			|| (to.indexOf('email+pending') >= 0 && this.fields.emailAddressPending);
		var mobileNumber = delivery.mobile
			|| (to.indexOf('mobile') >= 0 && this.fields.mobileNumber)
			|| (to.indexOf('mobile+pending') >= 0 && this.fields.mobileNumberPending);
		
		// Give the app an opportunity to modify the fields or anything else
		var o = {
			fields: fields,
			subject: subject,
			delivery: delivery,
			stream: stream,
			avatar: avatar,
			callback: callback,
			emailAddress: emailAddress,
			mobileNumber: mobileNumber
		};
		Streams_Message.emit('deliver/before', o);
		var viewPath;
		var result = [];
		if (mobileNumber) {
			viewPath = messageType+'/mobile.handlebars';
			if (!Q.Handlebars.template(viewPath)) {
				viewPath = 'Streams/message/mobile.handlebars';
			}
			Q.Utils.sendSMS(mobileNumber, viewPath, o.fields, {}, callback);
			result.push('mobile');
		} else if (emailAddress) {
			viewPath = messageType+'/email.handlebars';
			if (!Q.Handlebars.template(viewPath)) {
				viewPath = 'Streams/message/email.handlebars';
			}
			Q.Utils.sendEmail(
				emailAddress, o.subject, viewPath, o.fields, {html: true}, callback
			);
			result.push('email');
		}
		return result;
	});
};

module.exports = Streams_Message;