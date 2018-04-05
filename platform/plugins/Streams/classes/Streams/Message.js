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
				if (this.fields[k] instanceof Buffer) {
					this.fields[k] = this.fields[k].toString();
				}
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
Mp.getAllInstructions = function _Message_prototype_getAllInstructions () {
	try {
		return JSON.parse(this.fields.instructions);
	} catch (e) {
		return undefined;
	}
};

/**
 * Get the value of an instruction in the message
 * 
 * @method getInstruction
 * @param {String} instructionName
 */
Mp.getInstruction = function _Message_prototype_get (instructionName) {
	var instr = this.getAllInstructions();
	return Q.getObject([instructionName], instr);
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
	+"        SET messageCount = @Streams_messageCount+1,"
	+"            updatedTime = CURRENT_TIMESTAMP"
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
 * 'email.handlebars' or 'mobile.handlebars' or 'device.handlebars' depending on delivery
 * @method deliver
 * @param {Streams.Stream} stream
 * @param {function} toUserId the id of the user to whom to deliver
 * @param {String|Object} deliver can be any key under "Streams"/"rules"/"deliver" config,
 *   such as "default" or "invited". The value in the config should be an array of entries,
 *   each of which can be a string or an array itself.
 *   Entries can contain one or more of "email", "mobile" and "devices".
 *   They are tried, in order, and delivery stops as soon as at least one destination
 *   is found to deliver to.
 *   Or, it can be an object with "to" property
 *   as this key, or "emailAddress", "mobileNumber" or "deviceId" specified directly.
 * @param {Streams.Avatar} avatar the avatar for getting the displayName
 * @param {function} callback
 *	Callback reports errors and response from delivery systems
 */
Streams_Message.prototype.deliver = function(stream, toUserId, deliver, avatar, callback) {
	var instructions = this.getAllInstructions();
	var fields = {
		app: Q.app,
		communityName: Users.communityName(),
		stream: stream,
		message: this,
		instructions: instructions,
		avatar: avatar,
		config: Q.Config.getAll()
	};
	var message = this;
	var messageType = this.fields.type;
	var subject = Streams.Stream.getConfigField(
		stream.fields.type,
		['messages', this.fields.type, 'subject'],
		Q.Config.get(
			['Streams', 'types', '*', 'messages', '*', 'subject'],
			'Please set config "Streams"/"types"/"*"/"messages"/"*"/"subject"'
		)
	);
	if (typeof deliver === 'string') {
		deliver = {to: deliver};
	}
	Users.fetch(toUserId, function (err) {
		var to = Q.Config.get(
			['Streams', 'rules', 'deliver', deliver.to],
			['devices', 'email', 'mobile']
		);
		var uf = this.fields;
		var p1 = new Q.Pipe();
		var streamUrl = stream.url(message.fields.ordinal);
		var o = {
			fields: fields,
			subject: subject,
			deliver: deliver,
			stream: stream,
			streamUrl: streamUrl,
			url: message.getInstruction("url") || streamUrl,
			icon: stream.iconUrl(80),
			user: this,
			avatar: avatar,
			callback: callback
		};
		var result = [];
		/**
		 * @event "Streams/deliver/:messageType"
		 * @param {Object} options for the notification delivery
		 * @param {Function} callback to call when options has been transformed
		 */
		var name = 'Streams/deliver/'+message.fields.type;
		var handler = Q.getObject(name, Q.handlers, '/');
		if (!Q.isEmpty(handler)) {
			Q.handle(handler, message, [o, _afterTransform]);
		} else {
			_afterTransform();
		}
		function _afterTransform() {
			var w1 = [];
			var e, m, d;
			if (e = deliver.emailAddress || deliver.email) {
				_email(e, p1.fill('email'));
				w1.push('email');
			}
			if (m = deliver.mobileNumber || deliver.mobile) {
				_mobile(m, p1.fill('mobile'));
				w1.push('mobile');
			}
			if (d = deliver.deviceId || deliver.device) {
				_device(d, p1.fill('device'));
				w1.push('device');
			}
			p1.add(w1, function () {
				_next(0);
			}).run();
		}
		function _next(i) {
			var destinations = to[i];
			if (!destinations) {
				return callback(new Error("Streams.Message.prototype.deliver: no destinations"));
			}
			if (typeof destinations === 'string') {
				destinations = [destinations];
			}
			var platforms = Q.Config.get('Users', 'apps', 'platforms', []);
			var p2 = new Q.Pipe();
			var waitFor = [];
			Q.each(destinations, function (i, d) {
				var emailAddress = (d.indexOf('email') >= 0 && uf.emailAddress)
					|| (d === 'email+pending' && uf.emailAddressPending);
				var mobileNumber = (d.indexOf('mobile') >= 0 && uf.mobileNumber)
					|| (d === 'mobile+pending' && uf.mobileNumberPending);
				// Give the app an opportunity to modify the fields or anything else
				Streams_Message.emit('deliver/before', o);
				if (emailAddress) {
					_email(emailAddress, p2.fill('email'));
					waitFor.push('email');
				}
				if (mobileNumber) {
					_mobile(mobileNumber, p2.fill('mobile'));
					waitFor.push('mobile');
				}
				if (d === 'devices') {
					_device(null, p2.fill(d));
					waitFor.push(d);
				}
				if (platforms.indexOf(d) >= 0) {
					_platform(p2.fill(d));
					waitFor.push(d);
				}
			});
			p2.add(waitFor, function (params) {
				var success = false;
				for (var k in params) {
					if (params[k][0]) {
						continue;
					}
					if (k === 'email' && params[k][1] === 'log') {
						// email was not sent
						continue;
					}
					if (k === 'mobile' && params[k][1] === 'log') {
						// mobile sms was not sent
						continue;
					}
					if (k === 'devices' && params[k][1].length === 0) {
						// no devices were reached
						continue;
					}
					if (platforms.indexOf(k) >= 0 && !params[k][1]) {
						// no platform apps were reached
						continue;
					}
					success = true;
				}
				if (success) {
					callback(null, result, params);
				} else {
					_next(i+1);
				}
			}).run();
		}
		function _email(emailAddress, callback) {
			o.destination = 'email';
			o.emailAddress = emailAddress;
			Streams_Message.emit('deliver/before', o);  // app may modify some fields
			var viewPath = messageType+'/email.handlebars';
			if (Q.Handlebars.template(viewPath) === null) {
				viewPath = 'Streams/message/email.handlebars';
			}
			Users.Email.sendMessage(
				emailAddress, o.subject, viewPath, o.fields, {html: true}, callback
			);
			result.push({'email': emailAddress});
		}
		function _mobile(mobileNumber, callback) {
			o.destination = 'mobile';
			o.mobileNumber = mobileNumber;
			Streams_Message.emit('deliver/before', o); // app may modify some fields
			var viewPath = messageType+'/mobile.handlebars';
			if (Q.Handlebars.template(viewPath) === null) {
				viewPath = 'Streams/message/mobile.handlebars';
			}
			Users.Mobile.sendMessage(mobileNumber, viewPath, o.fields, {}, callback);
			result.push({'mobile': mobileNumber});
		}
		function _device(deviceId, callback) {
			o.destination = 'devices';
			o.deviceId = deviceId;
			Streams_Message.emit('deliver/before', o); // app may modify some fields
			var viewPath = messageType+'/device.handlebars';
			if (!Q.Handlebars.template(viewPath)) {
				viewPath = 'Streams/message/device.handlebars';
			}
			Users.pushNotifications(
				toUserId, 
				{
					alert: { title: o.subject },
					payload: message.getAllInstructions(),
					url: o.url,
					icon: o.icon
				},
				callback, 
				{ view: viewPath, fields: o.fields },
				function (device) {
					if (deviceId && device.deviceId !== deviceId) {
					return false;
				}
			});
			result.push({'devices': deviceId || true});
		}
		function _platform(platform, callback) {
			var appId = Users.appInfo(platform).appId;
			Users.AppUser.SELECT('*').WHERE({
				userId: toUserId,
				platform: platform,
				appId: appId
			}).execute(function (err, appusers) {
				if (err) {
					return callback(err);
				}
				var appuser = appusers[0];
				var notification = {
					alert: o.subject,
					href: o.url,
					ref: message.fields.type
				};
				if (appuser) {
					appuser.pushNotification(notification);
				}
				Q.handle(callback, Users, [null, appuser, notification]);
			});
		}
	});
};

module.exports = Streams_Message;