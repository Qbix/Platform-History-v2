/**
 * Streams plugin's front end code
 *
 * @module Streams
 * @class Streams
 */
"use strict";
/* jshint -W014 */
(function(Q, $) {

var Users = Q.Users;
var Streams = Q.Streams = Q.plugins.Streams = {

	cache: {
		where: null // to override default, use 'document', 'session' or 'local'
	}

};

var dc = Q.extend.dontCopy;
dc["Q.Streams.Stream"] = true;
dc["Q.Streams.Message"] = true;
dc["Q.Streams.Participant"] = true;
dc["Q.Streams.Avatar"] = true;

Q.text.Streams = {

	access: {

	},

	basic: {
		prompt: null, //"Fill our your basic information to complete your signup.",
		title: "Basic Information"
	},

	login: {

		fullName: "Let friends recognize you:",
		picTooltip: "You can change this picture later"

	},

	chat: {
		noMessages: ""
	}

};

/**
 * Read levels
 * @property READ_LEVEL
 * @type {Object}
 * @param {Number} none , Can't see the stream
 * @default 0
 * @param {Number} see , can see icon and title
 * @default 10
 * @param {Number} content ,  can preview stream and its content
 * @default 20
 * @param {Number} participants , can see participants in the stream
 * @default 30
 * @param {Number} messages , can play stream in a player
 */
Streams.READ_LEVEL = {
	'none':			0, //Can't see the stream
	'see':			10, //can see icon and title
	'content':		20, //can preview stream and its content
	'participants':	30, // can see participants in the stream
	'messages':		40 //can play stream in a player
};

/**
 * Write levels
 * @property WRITE_LEVEL
 * @type {Object}
 * @param {Number} none , cannot affect stream or participants list
 * @default 0
 * @param {Number} join , can become a participant, chat, and leave
 * @default 10
 * @param {Number} vote , can vote for a relation message posted to the stream
 * @default 13
 * @param {Number} postPending , can post messages which require manager's approval
 * @default 18
 * @param {Number} post , can post messages which take effect immediately
 * @default 20
 * @param {Number} relate , can relate other streams to this one
 * @default 23
 * @param {Number} relations , can update properties of relations directly
 * @default 25
 * @param {Number} suggest , can suggest edits of stream
 * @default 28
 * @param {Number} edit , can edit stream content immediately
 * @default 30
 * @param {Number} closePending , can post a message requesting to close the stream
 * @default 35
 * @param {Number} close , don't delete, just prevent any new changes to stream , however, joining and leaving is still ok
 * @default 40

 */
Streams.WRITE_LEVEL = {
	'none':			0,		// cannot affect stream or participants list
	'join':			10,		// can become a participant, chat, and leave
	'vote':         13,		// can vote for a relation message posted to the stream
	'postPending':	18,		// can post messages which require manager's approval
	'post':			20,		// can post messages which take effect immediately
	'relate':       23,		// can relate other streams to this one
	'relations':    25,		// can update properties of relations directly
	'suggest':      28,		// can suggest edits of stream
	'edit':			30,		// can edit stream content immediately
	'closePending':	35,		// can post a message requesting to close the stream
	'close':		40		// don't delete, just prevent any new changes to stream
							// however, joining and leaving is still ok
};

/**
 * Admin levels
 * @property ADMIN_LEVEL
 * @type {Object}
 * @param {Number} none , cannot do anything related to admin / users
 * @default 0
 * @param {Number} tell , can post on your stream about participating
 * @default 10
 * @param {Number} invite , able to create invitations for others, granting access
 * @default 20
 * @param {Number} manage , can approve posts and give people any adminLevel < 30
 * @default 30
 * @param {Number} own , can give people any adminLevel <= 40
 * @default 40
 */
Streams.ADMIN_LEVEL = {
	'none':	 		0,		// cannot do anything related to admin / users
	'tell':	 		10,		// can post on your stream about participating
	'invite':		20,		// able to create invitations for others, granting access
	'manage':		30,		// can approve posts and give people any adminLevel < 30
	'own':	 		40		// can give people any adminLevel <= 40
};

Streams.defined = {};

/**
 * Call this function to define a stream type
 * @static
 * @method define
 * @param {String} type The type of the stream, e.g. "Streams/smalltext"
 * @param {String|Function} ctor Your tool's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods
 */
Streams.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Q.Tool.define(t, type[t]);
		}
		return;
	};
	type = Q.normalize(type);
	if (typeof ctor === 'string') {
		if (typeof Streams.defined[type] !== 'function') {
			return Streams.defined[type] = ctor;
		}
		return ctor;
	}
	if (typeof ctor !== 'function') {
		throw new Q.Error("Q.Streams.define requires ctor to be a string or a function");
	}
	function CustomStreamConstructor() {
		CustomStreamConstructor.constructors.apply(this, arguments);
		ctor.apply(this, arguments);
	}
	Q.mixin(CustomStreamConstructor, Streams.Stream);
	Q.extend(CustomStreamConstructor.prototype, methods);	
	return Streams.defined[type] = CustomStreamConstructor;
};

/**
 * Calculate the url of a stream's icon
 * @static
 * @method iconUrl
 * @param {String} icon the value of the stream's "icon" field
 * @param {Number} [size=40] the size of the icon to render. Defaults to 40.
 * @return {String} the url
 */
Streams.iconUrl = function(icon, size) {
	if (!icon) {
		console.warn("Streams.iconUrl: icon is empty");
		return '';
	}
	if (!size || size === true) {
		size = '40';
	}
	size = (String(size).indexOf('.') >= 0) ? size : size+'.png';
	var src = (icon + '/' + size).interpolate({
		"baseUrl": Q.info.baseUrl
	});
	return src.isUrl() ? src : Q.url('plugins/Streams/img/icons/'+src);
};

var _socket = null,
	_messageHandlers = {},
	_constructHandlers = {},
	_refreshHandlers = {},
	_streamMessageHandlers = {},
	_streamFieldChangedHandlers = {},
	_streamUpdatedHandlers = {},
	_streamClosedHandlers = {},
	_streamRelatedFromHandlers = {},
	_streamRelatedToHandlers = {},
	_streamUnrelatedFromHandlers = {},
	_streamUnrelatedToHandlers = {},
	_streamUpdatedRelateFromHandlers = {},
	_streamUpdatedRelateToHandlers = {},
	_streamConstructHandlers = {},
	_streamRefreshHandlers = {},
	_retain = undefined,
	_retainedByKey = {},
	_retainedByStream = {},
	_retainedStreams = {};

/**
 * Calculate the key of a stream used internally for retaining and releasing
 * @static
 * @method key
 * @param {String} publisherId
 * @param {String} streamName
 * @return {String} the key
 */
Streams.key = function (publisherId, streamName) {
	return publisherId + "\t" + streamName;
};

/**
 * This event is fired if an error occurs in any Streams function
 * @event onError
 */
Streams.onError = new Q.Event(function (err, data) {
	var code = Q.getObject([0, 'errors', 0, 'code'], data)
		|| Q.getObject([1, 'errors', 0, 'code'], data);
	if (!code) return;
	var errors = data && data.errors
		&& (data[0] && data[0].errors)
		&& (data[1] && data[1].errors);
	console.warn(Q.firstErrorMessage(err, data && data.errors));
}, 'Streams.onError');

/**
 * This event is fired when a dialog is presented to a newly invited user.
 * @event onInvitedDialog
 */
Streams.onInvitedDialog = new Q.Event();

/**
 * This event is fired when the invited user takes the first action after
 * entering their name. It is a good time to start playing any audio, etc.
 * @event onInvitedUserAction
 */
Streams.onInvitedUserAction = new Q.Event();

/**
 * Returns Q.Event that occurs on message post event coming from socket.io
 * @event onMessage
 * @param type {String} type of the stream to which a message is posted
 * @param messageType {String} type of the message
 * @return {Q.Event}
 */
Streams.onMessage = Q.Event.factory(_messageHandlers, ["", ""]);

/**
 * Returns Q.Event that occurs after a stream is constructed on the client side
 * @event onConstruct
 * @param type {String} type of the stream being constructed on the client side
 * @return {Q.Event}
 */
Streams.onConstruct = Q.Event.factory(_constructHandlers, [""]);

/**
 * Returns Q.Event that should be used to update any stream representations
 * @event onConstruct
 * @param type {String} type of the stream being refreshed on the client side
 * @return {Q.Event}
 */
Streams.onRefresh = Q.Event.factory(_refreshHandlers, [""]);

/**
 * Returns Q.Event that occurs on some socket event coming from socket.io
 * that is meant to be processed by the Streams API.
 * @event onEvent
 * @param {String} name
 * @return {Q.Event}
 */
Streams.onEvent = function (name) {
	return Q.Socket.onEvent('Streams', null, name);
};

/**
 * Event occurs if native app is activated from background by click on native notification
 * @event onActivate
 */
Streams.onActivate = new Q.Event();

/**
 * Event occurs when the user enters their full name after following an invite, completing their registration
 * @event onInviteComplete
 */
Streams.onInviteComplete = new Q.Event();

/**
 * Connects or reconnects sockets for all participating streams
 * @private
 * @static
 * @method _connectSockets
 * @param {Boolean} refresh
 */
function _connectSockets(refresh) {
	if (!Users.loggedInUser) {
		return false;
	}
	Streams.getParticipating(function (err, participating) {
		Q.each(participating, function (i, p) {
			Q.Socket.connect('Streams', Q.nodeUrl({
				publisherId: p.publisherId,
				streamName: p.streamName
			}));
		});
	});
	Streams.retainWith('Streams').get(
		Users.loggedInUser.id, 'Streams/participating'
	);
	if (refresh) {
		Streams.refresh();
	}
}

/**
 * Disconnects all Streams sockets which have been connected
 * note that this also affects other plugins that might be listening on the sockets
 * maybe we should have another thing, I don't know, but for now it's ok
 * @private
 * @static
 * @method _disconnectSockets
 */
function _disconnectSockets() {
	Q.Socket.disconnectAll();
}

/**
 * Get the current client's socket session id on the node hosting the socket,
 * a node which is found based on the publisherId and streamName.
 * @static
 * @method socketSessionId
 * @param {String} publisherId
 * @param {String} streamName
 * @return {String}
 */
Streams.socketSessionId = function (publisherId, streamName) {
	var s = Q.Socket.get('Streams', Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	return s ? s.namespace.socket.sessionid : null;
};

/**
 * A convenience method to get the URL of the streams-related action
 * @static
 * @method actionUrl
 * @param {String} publisherId The id of the publisher
 * @param {String} streamName The name of the stream
 * @param {String} [what='stream'] Can be one of 'stream', 'message', 'relation', etc.
 * @return {String} The corresponding URL
 */
Streams.actionUrl = function(publisherId, streamName, what)
{
	if (!what) {
		what = 'stream';
	}
	switch (what) {
	case 'stream':
	case 'message':
	case 'relation':
		return Q.action("Streams/"+what, {
			'publisherId': publisherId,
			'name': streamName,
			'Q.clientId': Q.clientId()
		});
	default:
		return null;
	}
};

Q.Tool.define({
	"Users/avatar"         : "plugins/Streams/js/tools/avatar.js", // override for Users/avatar tool
	"Streams/chat"         : "plugins/Streams/js/tools/chat.js",
	"Streams/comments"     : "plugins/Streams/js/tools/comments.js",
	"Streams/photoSelector": "plugins/Streams/js/tools/photoSelector.js",
	"Streams/userChooser"  : "plugins/Streams/js/tools/userChooser.js",
	"Streams/participants" : "plugins/Streams/js/tools/participants.js",
	"Streams/basic"        : "plugins/Streams/js/tools/basic.js",
	"Streams/access"       : "plugins/Streams/js/tools/access.js",
	"Streams/subscription" : "plugins/Streams/js/tools/subscription.js",
	"Streams/interests"    : "plugins/Streams/js/tools/interests.js",
	"Streams/related"      : "plugins/Streams/js/tools/related.js",
	"Streams/inplace"      : "plugins/Streams/js/tools/inplace.js",
	"Streams/html"         : "plugins/Streams/js/tools/html.js",
	"Streams/player"       : "plugins/Streams/js/tools/player.js",
	"Streams/preview"  	   : "plugins/Streams/js/tools/preview.js",
	"Streams/image/preview": "plugins/Streams/js/tools/image/preview.js",
	"Streams/file/preview" : "plugins/Streams/js/tools/file/preview.js",
	"Streams/category/preview" : "plugins/Streams/js/tools/category/preview.js",
	"Streams/category/player" : "plugins/Streams/js/tools/category/player.js",
	"Streams/form"         : "plugins/Streams/js/tools/form.js",
	"Streams/activity"     : "plugins/Streams/js/tools/activity.js"
});

/**
 * Streams batch getter.
 * @static
 * @method get
 * @param publisherId {string}
 *  Publisher's user id
 * @param name {string}
 *	Name of the stream published by this publisher
 * @param callback {function}
 *	If there were errors, first parameter is an array of errors.
 *  Otherwise, first parameter is null and second parameter is a Streams.Stream object
 * @param {object} [extra] Optional object which can include the following keys:
 *   @param {Mixed} [extra.participants]
 *   @param {Mixed} [extra.messages]
 *   @param {String} [extra.messageType] optional String specifying the type of messages to fetch
 *   @param {Boolean} [extra.cacheIfMissing] defaults to false. If true, caches the "missing stream" result.
 *   @param {Mixed} [extra."$Module/$fieldname"] , any other fields you would like can be added, to be passed to your hooks on the back end
 */
Streams.get = function _Streams_get(publisherId, streamName, callback, extra) {
	var args = arguments;
	var url = Q.action('Streams/stream?')+
		Q.serializeFields({"publisherId": publisherId, "name": streamName});
	var slotNames = ['stream'];
	if (extra) {
		if (extra.participants) {
			url += '&'+$.param({"participants": extra.participants});
			slotNames.push('participants');
		}
		if (extra.messages) {
			url += '&'+$.param({messages: extra.messages});
			slotNames.push('messages');
		}
	}
	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'stream', slotNames, publisherId, streamName,
	
	function Streams_get_response_handler (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (!msg && (!data || !data.stream)) {
			msg = "Streams.get: data.stream is missing";
		}
		if (msg) {
			var forget = false;
			if (err && err[0] && err[0].classname === "Q_Exception_MissingRow") {
				if (!extra || !extra.cacheIfMissing) {
					forget = true;
				}
			} else {
				forget = true;
			}
			if (forget && Streams.get.forget) {
				setTimeout(function () {
					Streams.get.forget.apply(this, args);
				}, 0);
			}
			var params = [err, data];
			Streams.onError.handle.call(this, msg, params);
			Streams.get.onError.handle.call(this, msg, params);
			return callback && callback.call(this, msg, params);
		}
		if (Q.isEmpty(data.stream)) {
			var msg = "Stream " + publisherId + " " + streamName + " is not available";
			var err = msg;
			var params = [err, data, null];
			Streams.onError.handle(msg, params);
			return callback && callback.call(null, err, null, extra);
		}
		Streams.construct(
			data.stream,
			{ 
				messages: data.messages, 
				participants: data.participants 
			}, 
			function Streams_get_construct_handler(err, stream, extra) {
				var msg;
				if (msg = Q.firstErrorMessage(err)) {
					var params = [err, data, stream];
					Streams.onError.handle(msg, params);
				}
				var ret = callback && callback.call(stream, err, stream, extra);
				if (ret === false) {
					return false;
				}
				if (msg) return;
				
				// The onRefresh handlers occur after the other callbacks
				var f = stream.fields;
				var handler = Q.getObject([f.type], _refreshHandlers);
				Q.handle(handler, stream, []);
				handler = Q.getObject(
					[f.publisherId, f.name], 
					_streamRefreshHandlers
				);
				Q.handle(handler, stream, []);
				return ret;
			}
		);
	}, extra);
	_retain = undefined;
};
Streams.get.onError = new Q.Event();

/**
 * @static
 * @method batchFunction
 * @param {String} baseUrl
 * @param {String} action
 * @return {Function}
 */

Streams.batchFunction = function Streams_batchFunction(baseUrl, action) {
	action = action || 'batch';
	return Q.batcher.factory(Streams.batchFunction.functions, baseUrl,
		"/action.php/Streams/"+action, "batch", "batch",
		_Streams_batchFunction_preprocess[action]
	);
};
Streams.batchFunction.functions = {};

var _Streams_batchFunction_preprocess = {
	avatar: {
		preprocess: function (args) {
			var userIds = [], i;
			for (i=0; i<args.length; ++i) {
				userIds.push(args[i][0]);
			}
			return {userIds: userIds};
		},
		max: 100
	},
	batch: {
		max: 100
	}
};

/**
 * Create a new stream
 * @static
 * @method create
 * @param {Object} fields
 *  Should contain at least the publisherId and type of the stream
 * @param {Function} callback 
 *	if there were errors, first parameter is the error message
 *  otherwise, first parameter is null and second parameter is a Streams.Stream object
 * @param {Object} [related] Optional information to add a relation from the newly created stream to another one. Can include:
 *   @param {String} [related.publisherId] the id of whoever is publishing the related stream
 *   @param {String} [related.streamName] the name of the related stream
 *   @param {Mixed} [related.type] the type of the relation
 * @param {Object} [options] Any extra options involved in creating the stream
 *   @param {HTMLElement} [options.form] If you want to upload a file or an icon, pass
 *    a form element here which includes input elements of type "file", named "file" or "icon".
 *    If they have files selected in them, they will be passed along with the rest of the
 *    fields. Setting this option will cause a call to Q.formPost which will load the result
 *    in an iframe. That resulting webpage must contain 
 * @param {String} [options.resultFunction=null] The path to the function to handle inside the
 *    contentWindow of the resulting iframe, e.g. "Foo.result". 
 *    Your document is supposed to define this function if it wants to return results to the
 *    callback's second parameter, otherwise it will be undefined
 */
Streams.create = function (fields, callback, related, options) {
	var slotNames = ['stream'];
	var options = options || {};
	fields = Q.copy(fields);
	if (fields.icon) {
		slotNames.push('icon');
	}
	if (related) {
		if (!related.publisherId || !related.streamName) {
			throw new Q.Error("Streams.create related needs publisherId and streamName");
		}
		fields['Q.Streams.related.publisherId'] = related.publisherId || related.publisherId;
		fields['Q.Streams.related.streamName'] = related.streamName || related.streamName || related.name;
		fields['Q.Streams.related.type'] = related.type;
		slotNames.push('messageTo');
	}
	var baseUrl = Q.baseUrl({
		publisherId: fields.publisherId,
		streamName: "" // NOTE: the request is routed to wherever the "" stream would have been hosted
	});
	fields["Q.clientId"] = Q.clientId();
	if (options.form) {
		fields["file"] = {
			path: 'uploads/Streams'
		}
	}
	var _r = _retain;
	Q.req('Streams/stream', slotNames, function Stream_create_response_handler(err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Streams.create.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		if (related) {
			Streams.related.cache.each([related.publisherId, related.streamName],
			function (key) {
				Streams.related.cache.remove(key);
			});
		}
		Streams.construct(data.slots.stream, {}, function Stream_create_construct_handler (err, stream) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return callback && callback.call(stream, msg, stream, data.slots.icon);
			}
			if (_r) {
				stream.retain(_r);
			}
			var extra = {};
			extra.icon = data.slots.icon;
			if (related && data.slots.messageTo) {
				var m = extra.messageTo = Streams.Message.construct(data.slots.messageTo);
				extra.related = {
					publisherId: related.publisherId,
					streamName: related.streamName,
					type: related.type,
					weight: m.get('weight')
				};
			}
			callback && callback.call(stream, null, stream, extra, data.slots);
			// process various messages posted to Streams/participating
			Stream.refresh(
				Users.loggedInUserId(), 'Streams/participating', null,
				{ messages: true, unlessSocket: true }
			);
			return;
		});
	}, { 
		method: 'post', 
		fields: fields, 
		baseUrl: baseUrl, 
		form: options.form, 
		resultFunction: options.resultFunction
	});
	_retain = undefined;
};
Streams.create.onError = new Q.Event();

/**
 * This function is similar to _activateTools in Q.js
 * That one is to create "controllers" on the front end,
 * and this one is to create "models" on the front end.
 * They have very similar conventions.
 * @static
 * @method construct
 * @param fields {Object} Provide any stream fields here. Requires at least the "type" of the stream.
 * @param extra {Object} Can include "messages" and "participants"
 * @param callback {Function} The function to call when all constructors and event handlers have executed
 *  The first parameter is an error, in case something went wrong. The second one is the stream object.
 * @return {Q.Stream}
 */
Streams.construct = function _Streams_construct(fields, extra, callback) {

	if (typeof extra === 'function') {
		callback = extra;
		extra = null;
	}

	if (Q.typeOf(fields) === 'Q.Streams.Stream') {
		Q.handle(callback, fields, [null, fields]);
		return false;
	}

	if (Q.isEmpty(fields)) {
		Q.handle(callback, this, ["Streams.Stream constructor: fields are missing"]);
		return false;
	}

	var type = Q.normalize(fields.type);
	var streamFunc = Streams.defined[type];
	if (!streamFunc) {
		streamFunc = Streams.defined[type] = function StreamConstructor(fields) {
			streamFunc.constructors.apply(this, arguments);
			// Default constructor. Copy any additional fields.
			if (!fields) return;
			for (var k in fields) {
				if ((k in this.fields)
				|| k === 'access'
				|| k === 'isRequired') continue;
				this.fields[k] = Q.copy(fields[k]);
			}
		};
	}
	if (typeof streamFunc === 'function') {
		return _doConstruct();
	} else if (typeof streamFunc === 'string') {
		Q.addScript(streamFunc, function () {
			streamFunc = Streams.defined[streamName];
			if (typeof streamFunc !== 'function') {
				throw new Error("Streams.construct: streamFunc cannot be " + typeof(streamFunc));
			}
			return _doConstruct();
		});
		return true;
	} else if (typeof streamFunc !== 'undefined') {
		throw new Error("Streams.construct: streamFunc cannot be " + typeof(streamFunc));
	}
	function _doConstruct() {
		if (!streamFunc.streamConstructor) {
			streamFunc.streamConstructor = function Streams_Stream(fields) {
				// run any constructors
				streamFunc.streamConstructor.constructors.apply(this, arguments);

				var f = this.fields;

				// update the Streams.get cache
				if (f.publisherId && f.name) {
					Streams.get.cache
					.removeEach([f.publisherId, f.name])
					.set(
						[f.publisherId, f.name], 0,
						this, [null, this]
					);
				}

				// call any onConstruct handlers
				Q.handle(_constructHandlers[f.type], this, []);
				Q.handle(_constructHandlers[''], this, []);
				if (f.publisherId && f.name) {
					Q.handle(Q.getObject([f.publisherId, f.name], _streamConstructHandlers), this, []);
					Q.handle(Q.getObject([f.publisherId, ''], _streamConstructHandlers), this, []);
					Q.handle(Q.getObject(['', f.name], _streamConstructHandlers), this, []);
					Q.handle(Q.getObject(['', ''], _streamConstructHandlers), this, []);
				}
			};
			Q.mixin(streamFunc, Streams.Stream);
			Q.mixin(streamFunc.streamConstructor, streamFunc);
		}
		var stream = new streamFunc.streamConstructor(fields);
		var messages = {}, participants = {};
		
		if (extra && extra.messages) {
			Q.each(extra.messages, function (ordinal, message) {
				if (Q.typeOf(message) !== 'Q.Streams.Message') {
					message = Message.construct(message);
				}
				messages[ordinal] = message;
			});
		}
		if (extra && extra.participants) {
			Q.each(extra.participants, function (userId, participant) {
				if (Q.typeOf(participant) !== 'Q.Streams.Participant') {
					participant = new Participant(participant);
				}
				participants[userId] = participant;
				Participant.get.cache.set(
					[fields.publisherId, fields.name, participant.userId], 0,
					participant, [null, participant]
				);
			});
		}
		
		Q.handle(callback, stream, [null, stream, {
			messages: messages,
			participants: participants
		}]);
		return stream;
	}
}

function _toolInDialog(toolName, toolParams, callback, classContainer) {
	Q.Dialogs.push({
		url: Q.action(toolName, toolParams),
		removeOnClose: true,
		onActivate: function() {
			callback && callback.apply(this, arguments);
		},
		apply: true
	}).addClass(classContainer || '');
}

/**
 * Operates with dialogs.
 * @class Streams.Dialogs
 */

Streams.Dialogs = {

	/**
	 * Show a dialog to manage "subscription" related stuff in a stream.
	 * @static
	 * @method subscription
	 * @param publisherId {String} id of publisher which is publishing the stream
	 * @param streamName {String} the stream's name
	 * @param callback {Function} The function to call after dialog is activated
	 */
	subscription: function(publisherId, streamName, callback) {
		_toolInDialog('Streams/subscription', {
			publisherId: publisherId,
			streamName : streamName
		}, callback, 'Streams_subscription_tool_dialog_container');
	},

	/**
	 * Show a dialog to manage "access" related stuff in a stream.
	 * @static
	 * @method access
	 * @param publisherId {String} id of publisher which is publishing the stream
	 * @param streamName {String} the stream's name
	 * @param callback {Function} The function to call after dialog is activated
	 */
	access: function(publisherId, streamName, callback) {
		_toolInDialog('Streams/access', {
			publisherId: publisherId,
			streamName: streamName
		}, callback, 'Streams_access_tool_dialog_container');
	}
	
};

/**
 * @class Streams
 */

/**
 * Returns streams that the current user is participating in
 * @static
 * @param {Function} callback
 * @method getParticipating
 */
Streams.getParticipating = function(callback) {
	if(!callback) return;
	Q.req('Streams/participating', 'participating',
	function (err, data) {
		callback && callback(err, data && data.slots && data.slots.participating);
	});
	_retain = undefined;
};

/**
 * Refreshes all the streams the logged-in user is participating in
 * If your app is using socket.io, then calling this manually is largely unnecessary.
 * @static
 * @method refresh
 * @param {Function} callback optional callback
 * @param {Object} [options] A hash of options, including:
 *   @param {Boolean} [options.messages] If set to true, then besides just reloading the stream, attempt to catch up on the latest messages
 *   @param {Number} [options.max] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Number} [options.unlessSocket] Whether to avoid doing any requests when a socket is attached
 *   @param {Array} [options.duringEvents] Streams.refresh.options.duringEvents are the window events that can lead to an automatic refresh
 *   @param {Number} [options.minSeconds] Streams.refresh.options.minEvents is the minimum number of seconds to wait between automatic refreshes
 *   @param {Number} [options.timeout] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket] Whether to avoid doing any requests when a socket is attached
 *   @param {Object} [options.changed] An Object of {fieldName: true} pairs naming fields to trigger change events for, even if their values stayed the same
 *   @param {Boolean} [options.evenIfNotRetained] If the stream wasn't retained (for example because it was missing last time), then refresh anyway
 *   @param {Object} [options.extra] Any extra parameters to pass to the callback
 * @return {boolean} whether the refresh occurred
 */
Streams.refresh = function (callback, options) {
	if (!Q.isOnline()) {
		Q.handle(callback, this, [false]);
		return false;
	}
	var now = Date.now();
	if (now - Streams.refresh.lastTime < Streams.refresh.options.minSeconds * 1000) {
		return false;
	}
	Streams.refresh.lastTime = now;
	var p = new Q.Pipe(Object.keys(_retainedByStream), callback);
	Streams.refresh.beforeRequest.handle(callback, options);
	Q.each(_retainedByStream, function (ps) {
		var parts = ps.split("\t");
		Stream.refresh(parts[0], parts[1], p.fill(ps), options);
	});
	_retain = undefined;
	return true;
};

Streams.refresh.options = {
	duringEvents: ['focus', 'pageshow'],
	minSeconds: 3
};
Streams.refresh.lastTime = 0;
Streams.refresh.beforeRequest = new Q.Event();

/**
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * stream.refresh() are called. You can release it with stream.release().
 * Call this function in a chain before calling Streams.get, Streams.related, etc.
 * in order to set the key for retaining the streams those functions obtain.
 * @static
 * @method retainWith
 * @param {String} key
 * @return {Object} returns Streams for chaining with .get(), .related() or .getParticipating()
 */
Streams.retainWith = function (key) {
	_retain = Q.calculateKey(key, _retainedByKey);
	return this;
};

/**
 * Releases all retained streams under a given key. See Streams.retain()
 * @static
 * @method release
 * @param {String} key
 */
Streams.release = function (key) {
	key = Q.calculateKey(key);
	Q.each(_retainedByKey[key], function (ps, v) {
		if (_retainedByStream[ps]) {
			delete _retainedByStream[ps][key];
			if (Q.isEmpty(_retainedByStream[ps])) {
				delete(_retainedByStream[ps]);
				delete(_retainedStreams[ps]);
			}
		}
	});
	delete _retainedByKey[key];
};

/**
 * Invite other users to a stream. Must be logged in first.
 * @static
 * @method invite
 * @param {String} publisherId The user id of the publisher of the stream 
 * @param {String} streamName The name of the stream you are inviting to
 * @param {String} options] More options that are passed to the API, which can include:
 *   @param {String} [options.identifier] An email address or mobile number to invite. Might not belong to an existing user yet.
 *   @param {String} [options.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 *   @param {String} [options.displayName] Optionally override the name to display in the invitation for the inviting user
 *   @param {String} [options.callback] Also can be used to provide callbacks.
 *   @param {Boolean} [options.followup="future"] Whether to set up a followup email or sms for the user to send. Set to true to always send followup, or false to never send it. Set to "future" to send followups only when the invited user hasn't registered yet.
 * @param {Function} callback Called with (err, result)
 * @return {Q.Request} represents the request that was made if an identifier was provided
 */
Streams.invite = function (publisherId, streamName, options, callback) {
	// TODO: expand this implementation to be complete
	if (!Users.loggedInUser) {
		Q.handle(callback, null, ["Streams.invite: not logged in"]);
		return false; // not logged in
	}
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var o = Q.extend({}, Streams.invite.options, options);
	o.publisherId = publisherId,
	o.streamName = streamName;
	o.displayName = o.displayName || Users.loggedInUser.displayName;
	function _request() {
		return Q.req('Streams/invite', ['data'], function (err, response) {
			var msg = Q.firstErrorMessage(err, response && response.errors);
			if (msg) {
				var args = [err, response];
				return Streams.onError.handle.call(this, msg, args);
			}
			var rsd = response.slots.data;
			Q.handle(o && o.callback, null, [err, response, msg]);
			Q.handle(callback, null, [err, response, msg]);
			var shouldFollowup = (o.followup !== 'future'
				|| rsd.statuses[rsd.invited[0]] === 'future');
			if (o.followup && rsd.identifierType && shouldFollowup) {
				var fields = Q.info;
				switch (rsd.identifierType) {
				case 'email':
					Q.Template.render({
						subject: 'Streams/followup/email/subject',
						body: 'Streams/followup/email/body',
						alert: 'Streams/followup/email/alert'
					},
					fields,
					function (params) {
						var url = "mailto:" + o.identifier;
						url += '?subject=' + encodeURIComponent(params.subject[1]);
						url += '&body=' + encodeURIComponent(params.body[1]);
						if (params.alert[1]) {
							alert(params.alert[1]);
						}
						window.location = url;
					});
					break;
				case 'mobile':
					Q.Template.render({
						text: 'Streams/followup/mobile',
						alert: 'Streams/followup/mobile/alert'
					}, fields,
					function (params) {
						var url = "sms:" + o.identifier;
						if (Q.info.browser.OS !== 'ios') {
							url += '?body=' + encodeURIComponent(params.text[1]);
						}
						if (params.alert[1]) {
							alert(params.alert[1]);
						}
						window.location = url;
					});
					break;
				}
			}
		}, { method: 'post', fields: o, baseUrl: baseUrl });
	}
	if (o.identifier) {
		return _request();
	}
	Q.prompt(
	'Enter a mobile # or email address',
	function (value) {
		if (!value) return;
		o.identifier = value;
		_request();
	}, {
		title: "Invite"
	});
	return null;
};

Streams.invite.options = {
	followup: "future"
};

/**
 * Get streams related to a given stream.
 * @static
 * @method related
 * @param publisherId {string}
 *  Publisher's user id
 * @param name {string}
 *	Name of the stream to/from which the others are related
 * @param relationType {String} the type of the relation
 * @param isCategory {boolean} defaults to false. If true, then gets streams related TO this stream.
 * @param {Object} [options] optional object that can include:
 *   @param {Number} [options.limit] the maximum number of results to return
 *   @param {Number} [options.offset] the page offset that goes with the limit
 *   @param {Boolean} [options.ascending] whether to sort by ascending weight.
 *   @default false
 *   @param {Number} [options.min] the minimum weight (inclusive) to filter by, if any
 *   @param {Number} [options.max] the maximum weight (inclusive) to filter by, if any
 *   @param {String} [options.prefix] optional prefix to filter the streams by
 *   @param {Boolean} [options.stream] pass true here to fetch the latest version of the stream (ignores cache)
 *   @param {Mixed} [options.participants]  optional. Pass a limit here to fetch that many participants (ignores cache). Only honored if streamName is a string.
 *   @param {Boolean} [options.messages]
 *   @param {String} [options.messageType] optional String specifying the type of messages to fetch. Only honored if streamName is a string.
 *   @param {Object} [options."$Module/$fieldname"] any other fields you would like can be added, to be passed to your hooks on the back end
 * @param callback {function}
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and the "this" object is the data containing "stream", "relations" and "streams"
 */
Streams.related = function _Streams_related(publisherId, streamName, relationType, isCategory, options, callback) {
	if (typeof publisherId !== 'string'
	|| typeof relationType !== 'string') {
		throw new Q.Error("Streams.related is expecting publisherId, relationType as strings");
	}
	if (!publisherId || !streamName) {
		throw new Q.Error("Streams.related is expecting publisherId and streamName to be non-empty");
	}
	if (typeof isCategory !== 'boolean') {
		callback = options;
		options = isCategory;
		isCategory = undefined;
	}
	if (Q.typeOf(options) === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};
	var near = isCategory ? 'to' : 'from',
		far = isCategory ? 'from' : 'to',
		farPublisherId = far+'PublisherId',
		farStreamName = far+'StreamName',
		slotNames = ['relations', 'relatedStreams'],
		fields = {"publisherId": publisherId, "streamName": streamName};
	if (options.messages) {
		slotNames.push('messages');
	}
	if (options.participants) {
		slotNames.push('participants');
	}
	if (relationType) {
		fields.type = relationType;
	}
	Q.extend(fields, options);
	fields.omitRedundantInfo = true;
	if (isCategory !== undefined) {
		fields.isCategory = isCategory;
	}

	var cached = Streams.get.cache.get([publisherId, streamName]);
	if (!cached || options.stream) {
		if (typeof streamName === 'string'
		&& streamName[streamName.length-1] !== '/') {
			slotNames.push('stream');
		} else {
			slotNames.push('streams');
		}
	}

	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', slotNames, function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Streams.related.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		if (cached && cached.subject) {
			_processResults(null, cached.subject);
		} else {
			var extra = {};
			if (options.messages) {
				extra.messages = data.slots.messages;
			}
			if (options.participants) {
				extra.participants = data.slots.participants;
			}
			if (!data.slots.stream) {
				callback && callback.call(this, "Streams/related missing stream " + streamName + ' published by ' + publisherId);
			} else {
				Streams.construct(data.slots.stream, extra, _processResults);
			}
		}

		function _processResults(err, stream) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				var args = [err, stream];
				return callback && callback.call(this, msg, args);
			}
			
			// Construct related streams from data that has been returned
			var p = new Q.Pipe(), keys = [], keys2 = {}, streams = {};
			Q.each(data.slots.relatedStreams, function (k, fields) {
				if (!Q.isPlainObject(fields)) return;
				var key = Streams.key(fields.publisherId, fields.name);
				keys.push(key);
				keys2[key] = true;
				Streams.construct(fields, {}, function () {
					streams[key] = this;
					p.fill(key)();
				});
			});
			
			// Now process all the relations
			Q.each(data.slots.relations, function (j, relation) {
				relation[near] = stream;
				var key = Streams.key(relation[farPublisherId], relation[farStreamName]);
				if (!keys2[key] && relation[farPublisherId] != publisherId) {
					// Fetch all the related streams from other publishers
					keys.push(key);
					Streams.get(relation[farPublisherId], relation[farStreamName], function (err, data) {
						var msg = Q.firstErrorMessage(err, data && data.errors);
						if (msg) {
							p.fill(key)(msg);
							return;
						}
						relation[far] = this;
						streams[key] = this;
						p.fill(key)();
						return;
					});
				} else {
					relation[far] = streams[key];
				}
			});
			
			// Finish setting up the pipe
			if (keys.length) {
				p.add(keys, _callback);
				p.run();
			} else {
				_callback();
			}
			function _callback(params) {
				// all the streams have been constructed
				for (var k in params) {
					if (params[k]) {
						if (params[k][0] === undefined) {
							delete params[k];
						} else {
							params[k] = params[k][0];
						}
					}
				}
				callback && callback.call({
					relatedStreams: streams, 
					relations: data.slots.relations, 
					stream: stream, 
					errors: params
				}, null);
			}
		}
	}, { fields: fields, baseUrl: baseUrl });
	_retain = undefined;
	var socket = Q.Socket.get('Streams', Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	if (!socket) {
		return false; // do not cache relations to/from this stream
	}
};
Streams.related.onError = new Q.Event();

/**
 * @class Streams.Stream
 */

/**
 * Constructs a stream from fields, which are typically returned from the server.
 * @class Streams.Stream
 * @constructor
 * @param {String} fields
 */
var Stream = Streams.Stream = function (fields) {
	if (this.constructed) {
		return;
	}
	this.constructed = true;
	this.fields = Q.copy(fields, [
		'publisherId',
		'name',
		'type',
		'title',
		'content',
		'attributes',
		'icon',
		'messageCount',
		'participantCount',
		'insertedTime',
		'updatedTime',
		'readLevel',
		'writeLevel',
		'adminLevel',
		'inheritAccess',
		'closedTime',
		'access',
		'isRequired'
	]);
	this.typename = 'Q.Streams.Stream';
	prepareStream(this, fields);
};

Stream.get = Streams.get;
Stream.create = Streams.create;
Stream.construct = Streams.construct;
Stream.define = Streams.define;

/**
 * Call this function to retain a particular stream.
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * stream.refresh() are called. You can release it with stream.release().
 * 
 * @static
 * @method retain
 * @param {String} publisherId
 * @param {String} streamName
 * @param {String} key
 * @param {Function} callback optional callback for when stream is retained
 * @return {Object} returns Streams for chaining with .get(), .related() or .getParticipating()
 */
Stream.retain = function _Stream_retain (publisherId, streamName, key, callback) {
	var ps = Streams.key(publisherId, streamName);
	key = Q.calculateKey(key);
	Streams.get(publisherId, streamName, function (err) {
		if (err) {
			_retainedStreams[ps] = null;
		} else {
			_retainedStreams[ps] = this;
			Q.setObject([ps, key], true, _retainedByStream);
			Q.setObject([key, ps], true, _retainedByKey);
		}
		Q.handle(callback, this, [err, this]);
	});
};

/**
 * Releases a stream from being retained. See Streams.retain()
 * 
 * @static
 * @method release
 * @param {String} publisherId
 * @param {String} streamName
 */
Stream.release = function _Stream_release (publisherId, streamName) {
	var ps = Streams.key(publisherId, streamName);
	Q.each(_retainedByStream[ps], function (key, v) {
		if (_retainedByKey[key]) {
			delete _retainedByKey[key][ps];
		}
		if (Q.isEmpty(_retainedByKey[key])) {
			delete _retainedByKey[key];
		}
	});
	delete _retainedByStream[ps];
	delete _retainedStreams[ps];
};

/**
 * Refreshes a stream, to show the latest content and possibly process the latest messages posted to the stream.
 * If your app server script is running, then calling this manually is largely unnecessary because messages arrive via push using socket.io .
 * @static
 * @method refresh
 * @param {Function} callback This is called when the stream has been refreshed.
 * @param {Object} [options] A hash of options, including:
 *   @param {Boolean} [options.messages] If set to true, then besides just reloading the fields, attempt to catch up on the latest messages
 *   @param {Number} [options.max] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Number} [options.timeout] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket] Whether to avoid doing any requests when a socket is attached
 *   @param {Object} [options.changed] An Object of {fieldName: true} pairs naming fields to trigger change events for, even if their values stayed the same
 *   @param {Boolean} [options.evenIfNotRetained] If the stream wasn't retained (for example because it was missing last time), then refresh anyway
 *   @param {Object} [options.extra] Any extra parameters to pass to the callback
 * @return {boolean} Whether callback will be called, or false if the refresh has been canceled
 */
Stream.refresh = function _Stream_refresh (publisherId, streamName, callback, options) {
	var notRetained = !_retainedByStream[Streams.key(publisherId, streamName)];
	if (!Q.isOnline()
	|| (notRetained && !(options && options.evenIfNotRetained))) {
		Streams.get.cache.removeEach([publisherId, streamName]);
		return false;
	}
	var result = false;
	if (options && options.messages) {
		// If the stream was retained, fetch latest messages,
		// and replay their being "posted" to trigger the right events
		result = Message.wait(publisherId, streamName, -1, callback, options);
	}
	var node = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var socket = Q.Socket.get('Streams', node);
	if (result === false) {
		if (socket && options && options.unlessSocket) {
   			// We didn't even try to wait for messages
   			return false;
		}
		// We sent a request to get the latest messages.
		// But we will also force-get the stream, to trigger any handlers
		// set for a streams refresh event.
		Streams.get.force(publisherId, streamName, function (err, stream) {
			if (!err) {
				var ps = Streams.key(publisherId, streamName);
				var changed = (options && options.changed) || {};
				Stream.update(_retainedStreams[ps], this.fields, changed);
				_retainedStreams[ps] = this;
			}
			if (callback) {
				var params = [err, stream];
				if (options && options.extra) {
					params.concat(extra);
				}
				callback && callback.apply(this, params);
			}
		});
		result = true;
	}
	_retain = undefined;
	return true;
};

Stream.refresh.ms = 75;
var _debouncedRefresh = Q.debounce(Stream.refresh, Stream.refresh.ms);

var Sp = Stream.prototype;

/**
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * stream.refresh() are called. You can release it with stream.release().
 * Call this function in a chain before calling stream.related, etc.
 * in order to set the key for retaining the streams those functions obtain.
 * 
 * @method retainWith
 * @param {String} key
 * @return {Object} returns Streams for chaining with .get(), .related() or .getParticipating()
 */
Sp.retainWith = Streams.retainWith;

/**
 * Calculate the url of a stream's icon
 * @static
 * @method iconUrl
 * @param {Number} [size=40] the size of the icon to render. Defaults to 40.
 * @return {String} the url
 */
Sp.iconUrl = function _Stream_prototype_iconUrl (size) {
	return Streams.iconUrl(this.fields.icon, size)
};

/**
 * Get all stream attributes
 * 
 * @method getAll
 * @param {Boolean} usePending
 * @return {Array}
 */

Sp.getAll = function _Stream_prototype_getAll (usePending) {
	return usePending ? this.pendingAttributes : this.attributes;
};

/**
 * Get the value of an attribute
 * 
 * @method get
 * @param {String} attributeName the name of the attribute to get
 * @param {Boolean} usePending if true, and there is a value pending to be saved, get that instead
 * @return {Mixed}
 */
Sp.get = function _Stream_prototype_get (attributeName, usePending) {
	var attr = this.getAll(usePending);
	return attr[attributeName];
};

/**
 * Set the value of an attribute, pending to be saved to the server with the stream
 * 
 * @method set
 * @param {String} attributeName
 * @param {Mixed} value
 */
Sp.set = function _Stream_prototype_set (attributeName, value) {
	if (this.pendingAttributes === this.attributes) {
		this.pendingAttributes = Q.copy(this.attributes); // copy on write
	}
	if (typeof attributeName === 'string') {
		this.pendingAttributes[attributeName] = value;
	} else {
		for (var k in attributeName) {
			this.pendingAttributes[k] = attributeName[k];
		}
	}
	this.pendingFields.attributes = JSON.stringify(this.pendingAttributes);
};

/**
 * Remove an attribute from the stream, pending to be saved to the server
 * 
 * @method clear
 * @param {String} attributeName
 */
Sp.clear = function _Stream_prototype_clear (attributeName) {
	if (this.pendingAttributes === this.attributes) {
		this.pendingAttributes = Q.copy(this.attributes); // copy on write
	}
	if (typeof attributeName === 'string') {
		delete this.pendingAttributes[attributeName];
	} else {
		for (var i=0; i<attributeName.length; ++i) {
			delete this.pendingAttributes[ attributeName[i] ];
		}
	}
	this.pendingFields.attributes = JSON.stringify(this.pendingAttributes);
};

/**
 * Save a stream to the server
 * 
 * @method save
 * @param {Function} callback
 * @param {Object} [options] A hash of options for the subsequent refresh.
 *   See Q.Streams.Stream.refresh
 */
Sp.save = function _Stream_prototype_save (callback, options) {
	var that = this;
	var slotName = "stream";
	var f = this.fields;
	var pf = this.pendingFields; 
	pf.publisherId = f.publisherId;
	pf.name = f.name;
	pf["Q.clientId"] = Q.clientId();
	var baseUrl = Q.baseUrl({
		publisherId: pf.publisherId,
		streamName: pf.name
	});
	Q.req('Streams/stream', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		// the rest will occur in the handler for the stream.onUpdated event
		// coming from the socket
		var stream = data.slots.stream || null;
		if (stream) {
			// process the Streams/changed message, if stream was retained
			Stream.refresh(stream.publisherId, stream.name, callback, Q.extend({
				messages: true,
				unlessSocket: true
			}, options));
		} else {
			callback && callback.call(that, null, stream);
		}
	}, { method: 'put', fields: pf, baseUrl: baseUrl });
};

/**
 * Closes a stream in the database, and marks it for removal unless it is required.
 * 
 * @method remove
 * @param {Function} callback
 */
Sp.close = function _Stream_prototype_remove (callback) {
	return Stream.close(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Reopens a stream in the database that was previously closed, but not yet removed.
 * 
 * @static
 * @method reopen
 * @param {Function} callback Receives (err, result) as parameters
 */
Sp.reopen = function _Stream_remove (callback) {
	this.pendingFields.closedTime = false;
	this.save(callback);
};

/**
 * Retain the stream in the client under a certain key.
 * Retained streams are refreshed during Streams.refresh()
 * 
 * @method retain
 * @param {String} key
 * @return {Q.Streams.Stream}
 */
Sp.retain = function _Stream_prototype_retain (key) {
	var ps = Streams.key(this.fields.publisherId, this.fields.name);
	key = Q.calculateKey(key);
	_retainedStreams[ps] = this;
	Q.setObject([ps, key], true, _retainedByStream);
	Q.setObject([key, ps], true, _retainedByKey);
	return this;
};

/**
 * Release the stream in the client retained under a certain key.
 * When the stream is released under all the keys it was retained under,
 * it is no longer refreshed during Streams.refresh()
 * 
 * @method release
 * @return {Q.Streams.Stream}
 */
Sp.release = function _Stream_prototype_release () {
	Stream.release(this.fields.publisherId, this.fields.name);
	return this;
};

/**
 * Retrieves a Streams.Message object, by using Message.get
 * 
 * @method getMessage
 * @param {Number} ordinal the ordinal of the message
 * @param {Function} callback arguments = (err) and this = the message
 */
Sp.getMessage = function _Stream_prototype_getMessage (ordinal, callback) {
	return Message.get(this.fields.publisherId, this.fields.name, ordinal, callback);
};

/**
 * Retrieves a Streams.Participant object, by using Participant.get
 * 
 * @method getParticipant
 * @param {String} userId
 * @param {Function} callback arguments = (err) and this = the message
 */
Sp.getParticipant = function _Stream_prototype_getParticipant (userId, callback) {
	return Participant.get(this.fields.publisherId, this.fields.name, userId, callback);
};

/**
 * Event factory for listening to messages based on type.
 * 
 * @event onMessage
 * @param {String} messageType can be "" for all message types
 */
Sp.onMessage = function _Stream_prototype_onMessage (messageType) {
	return Stream.onMessage(this.fields.publisherId, this.fields.name, messageType);
};

/**
 * Event factory for listening to attributes based on name.
 * 
 * @event onUpdated
 * @param {String} attribute can be "" for all attributes
 */
Sp.onUpdated = function _Stream_prototype_onUpdated (attribute) {
	return Stream.onUpdated(this.fields.publisherId, this.fields.name, attribute);
};

/**
 * Event factory for listening for changed stream fields based on name.
 * 
 * @event onFieldChanged
 * @param {String} field can be "" for all fields
 */
Sp.onFieldChanged = function _Stream_prototype_onFieldChanged (field) {
	return Stream.onFieldChanged(this.fields.publisherId, this.fields.name, field);
};

/**
 * Event factory for listening for changed stream fields based on name.
 * 
 * @event onClosed
 */
Sp.onClosed = function _Stream_prototype_onClosed () {
	return Stream.onClosed(this.fields.publisherId, this.fields.name, field);
};

/**
 * Event factory for listening to this stream being related to other streams
 *
 * @event onRelatedFrom
 */
Sp.onRelatedFrom = function _Stream_prototype_onRelatedFrom () {
	return Stream.onRelatedFrom(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for listening to streams being related to this stream
 * 
 * @event onRelatedTo
 */
Sp.onRelatedTo = function _Stream_prototype_onRelatedTo () {
	return Stream.onRelatedTo(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for listening to this stream becoming un-related to other streams
 * 
 * @event onUnrelatedFrom
 */
Sp.onUnrelatedFrom = function _Stream_prototype_onUnrelatedFrom () {
	return Stream.onUnrelatedFrom(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for listening to other streams becoming un-related to this stream
 * 
 * @event onUnrelatedTo
 */
Sp.onUnrelatedTo = function  _Stream_prototype_onUnrelatedTo () {
	return Stream.onUnrelatedTo(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for listening to changes in relations from this stream to others
 * 
 * @event onUnrelatedFrom
 */
Sp.onUpdatedRelateFrom = function  _Stream_prototype_onUpdatedRelateFrom () {
	return Stream.onUpdatedRelateFrom(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for listening to changes in relations of other streams to this stream
 * 
 * @event onUnrelatedTo
 */
Sp.onUpdatedRelateTo = function _Stream_prototype_onUpdatedRelateTo () {
	return Stream.onUpdatedRelateTo(this.fields.publisherId, this.fields.name);
};

/**
 * Post a message to this stream.
 * 
 * @method post
 * @param {Object} [data] A Streams.Message object or a hash of fields to post. This stream's publisherId and streamName are added to it.
 *   @param {String} [data.publisherId]
 *   @param {String} [data.streamName]
 * @param {Function} callback Receives (err, message) as parameters
 */
Sp.post = function  _Stream_prototype_post (data, callback) {
	var message = Q.extend({
		publisherId: this.fields.publisherId,
		streamName: this.fields.name
	}, data);
	return Message.post(message, callback);
};

/**
 * Join a stream as a participant, so you get realtime messages through socket events.
 * 
 * @method join
 * @param {Function} callback receives (err, participant) as parameters
 */
Sp.join = function _Stream_prototype_join (callback) {
	return Stream.join(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Leave a stream that you previously joined, so that you don't get realtime messages anymore.
 * 
 * @method leave
 * @param {Function} callback Receives (err, participant) as parameters
 */
Sp.leave = function _Stream_prototype_leave (callback) {
	return Stream.leave(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Test whether the user has enough access rights when it comes to reading from the stream
 * 
 * @method testReadLevel
 * @param {String} level One of the values in Streams.READ_LEVEL
 * @return {Boolean} Returns true if the user has at least this level of access
 */
Sp.testReadLevel = function _Stream_prototype_testReadLevel (level) {
	if (typeof level === 'string') {
		level = Streams.READ_LEVEL[level];
	}
	if (level === undefined) {
		throw new Q.Error("Streams.Sp.testReadLevel: level is undefined");
	}
	return this.access.readLevel >= level;
};

/**
 * Test whether the user has enough access rights when it comes to writing to the stream
 * 
 * @method testWriteLevel
 * @param {String} level One of the values in Streams.WRITE_LEVEL
 * @return {Boolean} Returns true if the user has at least this level of access
 */
Sp.testWriteLevel = function _Stream_prototype_testWriteLevel (level) {
	if (typeof level === 'string') {
		level = Streams.WRITE_LEVEL[level];
	}
	if (level === undefined) {
		throw new Q.Error("Streams.Sp.testWriteLevel: level is undefined");
	}
	return this.access.writeLevel >= level;
};

/**
 * Test whether the user has enough access rights when it comes to administering the stream
 * 
 * @method testAdminLevel
 * @param {String} level One of the values in Streams.ADMIN_LEVEL
 * @return {Boolean} Returns true if the user has at least this level of access
 */
Sp.testAdminLevel = function _Stream_prototype_testAdminLevel (level) {
	if (typeof level === 'string') {
		level = Streams.ADMIN_LEVEL[level];
	}
	if (level === undefined) {
		throw new Q.Error("Streams.Sp.testAdminLevel: level is undefined");
	}
	return this.access.adminLevel >= level;
};

/**
 * This function displays a Streams/access tool in a dialog
 * 
 * @method accessDialog
 * @param options {Object} Additional options to pass to Q.Dialogs.push
 */
Sp.accessDialog = function(options) {
	return Streams.accessDialog(this.fields.publisherId, this.fields.name, options);
};

/**
 * A convenience method to get the URL of the streams-related action
 * 
 * @method actionUrl
 * @param {String} [what='stream'] Can be one of 'stream', 'message', 'relation', etc.
 * @return {String} The corresponding URL
 */
Sp.actionUrl = function _Stream_prototype_actionUrl (what) {
	return Streams.actionUrl(this.fields.publisherId, this.fields.name, what);
};

/**
 * Invite other users to this stream. Must be logged in first.
 * 
 * @method invite
 * @param {Object} [fields] More fields that are passed to the API, which can include:
 *   @param {String} [fields.identifier] Required for now. An email address or mobile number to invite. Might not belong to an existing user yet.
 *   @required
 *   @param {String} [fields.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 * @param {Function} callback Called with (err, result)
 */
Sp.invite = function (fields, callback) {
	Streams.invite(this.fields.publisherId, this.fields.name, fields, callback);
};

/**
 * Waits for the latest messages to be posted to a given stream.
 * If your app is using socket.io, then calling this manually is largely unnecessary.
 * 
 * @method refresh
 * @param {Function} callback This is called when the stream has been refreshed, or if Streams has determined it won't send a refresh request, it will get null as the first parameter.
 * @param {Object} [options] A hash of options, including:
 *   @param {Boolean} [options.messages] If set to true, then besides just reloading the fields, attempt to catch up on the latest messages
 *   @param {Number} [options.max] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Number} [options.timeout] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket] Whether to avoid doing any requests when a socket is attached
 *   @param {Array} [options.changed] An array of {fieldName: true} pairs naming fields to trigger change events for, even if their values stayed the same
 *   @param {Boolean} [options.evenIfNotRetained] If the stream wasn't retained (for example because it was missing last time), then refresh anyway
 *   @param {Object} [options.extra] Any extra parameters to pass to the callback
 * @return {boolean} whether the refresh occurred
 */
Sp.refresh = function _Stream_prototype_refresh (callback, options) {
	return Stream.refresh(this.fields.publisherId, this.fields.name, callback, options);
};

/**
 * Returns all the streams this stream is related to
 * 
 * @method relatedFrom
 * @param relationType {String} the type of the relation
 * @param {Object} [options] optional object that can include:
 *   @param {Number} [options.limit] the maximum number of results to return
 *   @param {Number} [options.offset] the page offset that goes with the limit
 *   @param {Boolean} [options.ascending] whether to sort by ascending weight.
 *   @default false
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedFrom objects you can iterate over with Q.each
 */
Sp.relatedFrom = function _Stream_prototype_relatedFrom (relationType, options, callback) {
	return Streams.related(this.fields.publisherId, this.fields.name, relationType, true, options, callback);
};

/**
 * Returns all the streams related to this stream
 * 
 * @method relatedTo
 * @param relationType {String} the type of the relation
 * @param {Object} [options] optional object that can include:
 *   @param {Number} [options.limit] the maximum number of results to return
 *   @param {Number} [options.offset] the page offset that goes with the limit
 *   @param {Boolean} [options.ascending] whether to sort by ascending weight.
 *   @default false
 *   @param {String} [options.prefix] optional prefix to filter the streams by
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.relatedTo = function _Stream_prototype_relatedTo (relationType, options, callback) {
	return Streams.related(this.fields.publisherId, this.fields.name, relationType, false, options, callback);
};

/**
 * Relates this stream to another stream
 * 
 * @method relateTo
 * @param type {String} the type of the relation
 * @param toPublisherId {String} id of publisher of the stream
 * @param toStreamName {String} name of stream to which this stream is being related
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.relateTo = function _Stream_prototype_relateTo (type, toPublisherId, toStreamName, callback) {
	return Streams.relate(toPublisherId, toStreamName, type, this.fields.publisherId, this.fields.name, callback);
};

/**
 * Relates another stream to this stream
 * 
 * @method relate
 * @param type {String} the type of the relation
 * @param fromPublisherId {String} id of publisher of the stream
 * @param fromStreamName {String} name of stream which is being related to this stream
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.relate = Sp.relateFrom = function _Stream_prototype_relate (type, fromPublisherId, fromStreamName, callback) {
	return Streams.relate(this.fields.publisherId, this.fields.name, type, fromPublisherId, fromStreamName, callback);
};

/**
 * Removes a relation from this stream to another stream
 * 
 * @method unrelateTo
 * @param toPublisherId {String} id of publisher which is publishing the stream
 * @param toStreamName {String} name of stream which the being unrelated
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.unrelateTo = function _Stream_prototype_unrelateTo (toPublisherId, toStreamName, callback) {
	return Streams.unrelate(this.fields.publisherId, this.fields.name, toPublisherId, toStreamName, callback);
};

/**
 * Removes a relation from another stream to this stream
 * 
 * @method unrelateFrom
 * @param fromPublisherId {String} id of publisher which is publishing the stream
 * @param fromStreamName {String} name of stream which is being unrelated
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.unrelate = Sp.unrelateFrom = function _Stream_prototype_unrelateFrom (fromPublisherId, fromStreamName, callback) {
	return Streams.unrelate(fromPublisherId, fromStreamName, type, this.fields.publisherId, this.fields.name, callback);
};

/**
 * Returns Q.Event which occurs on a message post event coming from socket.io
 * Generic callbacks can be assigend by setting messageType to ""
 * @event onMessage
 * @static
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} name of stream which the message is posted to
 * @param messageType {String} type of the message, or its ordinal
 */
Stream.onMessage = Q.Event.factory(_streamMessageHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when fields of the stream officially changed
 * @event onFieldChanged
 * @static
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} optional name of stream which the message is posted to
 * @param fieldName {String} optional name of the field to listen for
 */
Stream.onFieldChanged = Q.Event.factory(_streamFieldChangedHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when attributes of the stream officially updated
 * @event onUpdated
 * @static
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} optional name of stream which the message is posted to
 * @param attributeName {String} optional name of the attribute to listen for
 */
Stream.onUpdated = Q.Event.factory(_streamUpdatedHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when attributes of the stream officially updated
 * @event onUpdated
 * @static
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} optional name of stream which the message is posted to
 * @param attributeName {String} optional name of the attribute to listen for
 */
Stream.onUpdated = Q.Event.factory(_streamUpdatedHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when a stream has been closed
 * (and perhaps has been marked for removal)
 * @event onClosed
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onClosed = Q.Event.factory(_streamClosedHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been related to this stream
 * @event onRelatedFrom
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onRelatedTo = Q.Event.factory(_streamRelatedToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was related to a category stream
 * @event onRelatedFrom
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onRelatedFrom = Q.Event.factory(_streamRelatedFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been unrelated to this stream
 * @event onUnrelatedTo
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onUnrelatedTo = Q.Event.factory(_streamUnrelatedToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was unrelated to a category stream
 * @event onUnrelatedFrom
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onUnrelatedFrom = Q.Event.factory(_streamUnrelatedFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been related to this stream
 * @event onUpdatedRelateTo
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onUpdatedRelateTo = Q.Event.factory(_streamUpdatedRelateToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was related to a category stream
 * @event onUpdatedRelateFrom
 * @static
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 */
Stream.onUpdatedRelateFrom = Q.Event.factory(_streamUpdatedRelateFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs after a stream is constructed on the client side
 * Generic callbacks can be assigend by setting type or mtype or both to ""
 * @event onConstruct
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param name {String} name of stream which is being constructed on the client side
 */
Stream.onConstruct = Q.Event.factory(_streamConstructHandlers, ["", ""]);

/**
 * Returns Q.Event that should be used to update any representaitons of this stream
 * @event onConstruct
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param name {String} name of stream which is being refreshed
 * @return {Q.Event}
 */
Stream.onRefresh = Q.Event.factory(_streamRefreshHandlers, ["", ""]);

/**
 * Join a stream as a participant, so messages start arriving in real time via sockets.
 * May call Streams.join.onError if an error occurs.
 * 
 * @static
 * @method join
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} name of stream to join
 * @param {Function} callback receives (err, participant) as parameters
 */
Stream.join = function _Stream_join (publisherId, streamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.Stream.join: Not logged in.");
	}
	var slotName = "participant";
	var fields = {"publisherId": publisherId, "name": streamName};
	var baseUrl = Q.baseUrl({
		"publisherId": publisherId,
		"streamName": streamName,
		"Q.clientId": Q.clientId()
	});
	Q.req('Streams/join', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.join.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.name, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(participant, err, participant || null);
		_refreshUnlessSocket(publisherId, streamName);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};
Stream.join.onError = new Q.Event();

/**
 * Leave a stream that you previously joined,
 * so that you don't get realtime socket messages for that stream anymore.
 * May call Stream.leave.onError if an error occurs.
 * 
 * @static
 * @method leave
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Function} callback Receives (err, participant) as parameters
 */
Stream.leave = function _Stream_leave (publisherId, streamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.Stream.join: Not logged in.");
	}
	var slotName = "participant";
	var fields = {
		"publisherId": publisherId, 
		"name": streamName,
		"Q.clientId": Q.clientId()
	};
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/leave', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.leave.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.name, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(this, err, participant || null);
		_refreshUnlessSocket(publisherId, streamName);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};
Stream.leave.onError = new Q.Event();

/**
 * Closes a stream in the database, and marks it for removal unless it is required.
 * 
 * @static
 * @method remove
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Function} callback Receives (err, result) as parameters
 */
Stream.close = function _Stream_remove (publisherId, streamName, callback) {
	var slotName = "result,stream";
	var fields = {"publisherId": publisherId, "name": streamName};
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/stream', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.close.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var stream = data.slots.stream;
		if (stream) {
			// process the Streams/closed message, if stream was retained
			Stream.refresh(stream.publisherId, stream.name, null, {
				messages: true,
				unlessSocket: true
			});
			Stream.refresh(
				Users.loggedInUserId(), 'Streams/participating', null,
				{ messages: true, unlessSocket: true }
			);
		}
		callback && callback.call(this, err, data.slots.result || null);
	}, { method: 'delete', fields: fields, baseUrl: baseUrl });
};
Stream.close.onError = new Q.Event();

/**
 * @class Streams
 */

/**
 * Relates streams to one another
 * @method relate
 * @param publisherId {String} the publisher id of the stream to relate to
 * @param streamName {String} the name of the stream to relate to
 * @param relationType {String} the type of the relation, such as "parent" or "photo"
 * @param fromPublisherId {String} the publisher id of the stream to relate from
 * @param fromStreamName {String} the name of the stream to relate from
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second will be relations data
 */
Streams.relate = function _Streams_relate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.relate: Not logged in.");
	}
	var slotName = "result";
	var fields = {
		"toPublisherId": publisherId,
		"toStreamName": streamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"Q.clientId": Q.clientId()
	};
	// TODO: When we refactor Streams to support multiple hosts,
	// the client will have to post this request to both hosts if they are different
	// or servers will have tell each other on their own
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		var messageFrom = Q.getObject('slots.result.messageFrom', data);
		var messageTo = Q.getObject('slots.result.messageTo', data);
		// wait for messages from cached streams -- from, to or both!
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Removes relations from streams to one another
 * @static
 * @method unrelate
 * @param publisherId {String} the publisher id of the stream to relate to
 * @param streamName {String} the name of the stream to relate to
 * @param relationType {String} the type of the relation, such as "parent" or "photo"
 * @param fromPublisherId {String} the publisher id of the stream to relate from
 * @param fromStreamName {String} the name of the stream to relate from
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second will be relations data
 */
Streams.unrelate = function _Stream_prototype_unrelate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.unrelate: Not logged in.");
	}
	var slotName = "result";
	var fields = {
		"toPublisherId": publisherId,
		"toStreamName": streamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"Q.clientId": Q.clientId()
	};
	// TODO: When we refactor Streams to support multiple hosts,
	// the client will have to post this request to both hosts if they are different
	// or servers will have tell each other on their own
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'delete', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Later we will probably make Streams.Relation objects which will provide easier access to this functionality.
 * For now, use this to update weights of relations, etc.
 * 
 * @method updateRelation
 * @param {String} toPublisherId
 * @param {String} toStreamName
 * @param {String} relationType
 * @param {String} fromPublisherId
 * @param {String} fromStreamName
 * @param {Number} weight
 * @param {Boolean} adjustWeights
 * @param {Function} callback
 */
Streams.updateRelation = function(
	toPublisherId,
	toStreamName,
	relationType,
	fromPublisherId,
	fromStreamName,
	weight,
	adjustWeights,
	callback
) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.relate: Not logged in.");
	}
	// We will send a request to wherever (toPublisherId, toStreamName) is hosted
	var slotName = "result";
	var fields = {
		"toPublisherId": toPublisherId,
		"toStreamName": toStreamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"weight": weight,
		"adjustWeights": adjustWeights,
		"Q.clientId": Q.clientId()
	};
	var baseUrl = Q.baseUrl({
		publisherId: toPublisherId,
		streamName: toStreamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		var message = Q.getObject('slots.result.message', data);
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'put', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * @class Streams.Message
 * Relates streams to one another
 * @method relate
 * @param publisherId {String} the publisher id of the stream to relate to
 * @param streamName {String} the name of the stream to relate to
 * @param relationType {String} the type of the relation, such as "parent" or "photo"
 * @param fromPublisherId {String} the publisher id of the stream to relate from
 * @param fromStreamName {String} the name of the stream to relate from
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second will be relations data
 */
Streams.relate = function _Streams_relate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.relate: Not logged in.");
	}
	var slotName = "result";
	var fields = {
		"toPublisherId": publisherId,
		"toStreamName": streamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"Q.clientId": Q.clientId()
	};
	// TODO: When we refactor Streams to support multiple hosts,
	// the client will have to post this request to both hosts if they are different
	// or servers will have tell each other on their own
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		var messageFrom = Q.getObject('slots.result.messageFrom', data);
		var messageTo = Q.getObject('slots.result.messageTo', data);
		// wait for messages from cached streams -- from, to or both!
		callback && callback.call(this, msg, Q.getObject('slots.result', data) || null);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Removes relations from streams to one another
 * @static
 * @method unrelate
 * @param publisherId {String} the publisher id of the stream to relate to
 * @param streamName {String} the name of the stream to relate to
 * @param relationType {String} the type of the relation, such as "parent" or "photo"
 * @param fromPublisherId {String} the publisher id of the stream to relate from
 * @param fromStreamName {String} the name of the stream to relate from
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second will be relations data
 */
Streams.unrelate = function _Stream_prototype_unrelate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.unrelate: Not logged in.");
	}
	var slotName = "result";
	var fields = {
		"toPublisherId": publisherId,
		"toStreamName": streamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"Q.clientId": Q.clientId()
	};
	// TODO: When we refactor Streams to support multiple hosts,
	// the client will have to post this request to both hosts if they are different
	// or servers will have tell each other on their own
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'delete', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Later we will probably make Streams.Relation objects which will provide easier access to this functionality.
 * For now, use this to update weights of relations, etc.
 * 
 * @method updateRelation
 * @param {String} toPublisherId
 * @param {String} toStreamName
 * @param {String} relationType
 * @param {String} fromPublisherId
 * @param {String} fromStreamName
 * @param {Number} weight
 * @param {Boolean} adjustWeights
 * @param {Function} callback
 */
Streams.updateRelation = function(
	toPublisherId,
	toStreamName,
	relationType,
	fromPublisherId,
	fromStreamName,
	weight,
	adjustWeights,
	callback
) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.relate: Not logged in.");
	}
	// We will send a request to wherever (toPublisherId, toStreamName) is hosted
	var slotName = "result";
	var fields = {
		"toPublisherId": toPublisherId,
		"toStreamName": toStreamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"weight": weight,
		"adjustWeights": adjustWeights,
		"Q.clientId": Q.clientId()
	};
	var baseUrl = Q.baseUrl({
		publisherId: toPublisherId,
		streamName: toStreamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		var message = Q.getObject('slots.result.message', data);
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'put', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Constructs a message from fields, which are typically returned from the server.
 * @class Streams.Message
 * @constructor
 * @param {Object} fields
 */
var Message = Streams.Message = function Streams_Message(fields) {
	Q.extend(this, fields);
	this.typename = 'Q.Streams.Message';
};

Message.construct = function Streams_Message_construct(fields) {
	if (Q.isEmpty(fields)) {
		return false;
	}
	var type = Q.normalize(fields.type);
	var messageFunc = Message.defined[type];
	if (!messageFunc) {
		messageFunc = Message.defined[type] = function MessageConstructor(fields) {
			messageFunc.constructors.apply(this, arguments);
			// Default constructor. Copy any additional fields.
			if (!fields) return;
			for (var k in fields) {
				this[k] = Q.copy(fields[k]);
			}
		};
	}
	if (!messageFunc.messageConstructor) {
		messageFunc.messageConstructor = function Streams_Message(fields) {
			// run any constructors
			messageFunc.messageConstructor.constructors.apply(this, arguments);
			Message.get.cache.set(
				[this.publisherId, this.streamName, parseInt(this.ordinal)],
				0, this, [null, this]
			);
		};
		Q.mixin(messageFunc, Streams.Message);
		Q.mixin(messageFunc.messageConstructor, messageFunc);
	}
	return new messageFunc.messageConstructor(fields);
};

Message.latest = {};

Message.defined = {};

/**
 * Call this function to set a constructor for a message type
 * @static
 * @method define
 * @param {String} type The type of the message, e.g. "Streams/chat/message"
 * @param {String|Function} ctor Your message's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods
 */
Message.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Q.Tool.define(t, type[t]);
		}
		return;
	};
	type = Q.normalize(type);
	if (typeof ctor !== 'function') {
		throw new Q.Error("Q.Streams.Message.define requires ctor to be a function");
	}
	Q.mixin(CustomMessageConstructor, Message);
	Q.extend(CustomMessageConstructor.prototype, methods);	
	return Message.defined[type] = CustomMessageConstructor;
};

var Mp = Message.prototype;

/**
 * Get all the instructions from a message.
 * 
 * @method getAll
 */
Mp.getAll = function _Message_prototype_getAll () {
	try {
		return JSON.parse(this.instructions);
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
 * Get one or more messages, which may result in batch requests to the server.
 * May call Message.get.onError if an error occurs.
 * 
 * @static
 * @method get
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Number|Object} ordinal Can be the ordinal, or an object containing one or more of:
 *   "min": The minimum ordinal in the range.
 *   "max": The maximum ordinal in the range. If omitted, gets the latest messages.
 *   "limit": Change the max number of messages to retrieve. If only max and limit are specified, messages are sorted by decreasing ordinal.
 * @param {Function} callback This receives two parameters. The first is the error.
 *   If ordinal was a Number, then the second parameter is the Streams.Message, as well as the "this" object.
 *   If ordinal was an Object, then the second parameter is a hash of { ordinal: Streams.Message } pairs
 */
Message.get = function _Message_get (publisherId, streamName, ordinal, callback) {
	var slotName, criteria = {};
	if (Q.typeOf(ordinal) === 'object') {
		slotName = ['messages'];
		criteria.min = parseInt(ordinal.min);
		criteria.max = parseInt(ordinal.max);
		criteria.limit = parseInt(ordinal.limit);
		if ('type' in ordinal) criteria.type = ordinal.type;
		if ('ascending' in ordinal) criteria.ascending = ordinal.ascending;
	} else {
		slotName = ['message'];
		criteria = parseInt(ordinal);
	}

	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'message', slotName, publisherId, streamName, criteria,
	function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Message.get.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var messages = {};
		if ('messages' in data) {
			messages = data.messages;
		} else if ('message' in data) {
			messages[ordinal] = data.message;
		}
		Q.each(messages, function (ordinal, message) {
			if (Q.typeOf(message) !== 'Q.Streams.Message') {
				message = Message.construct(message);
			}
			messages[ordinal] = message;
		});
		if (Q.isPlainObject(ordinal)) {
			callback && callback.call(this, err, messages || null);
		} else {
			var message = Q.first(messages);
			callback && callback.call(message, err, message || null);
		}
	});
};
Message.get.onError = new Q.Event();

/**
 * Post a message to a stream, so it can be broadcast to all participants, sent to all subscribers, etc.
 * May call Message.post.onError if an error occurs.
 * @static
 * @method post
 * @param {Object} msg A Streams.Message object or a hash of fields to post. Must include publisherId and streamName.
 * @param {Function} callback Receives (err, message) as parameters
 */
Message.post = function _Message_post (msg, callback) {
	var baseUrl = Q.baseUrl({
		publisherId: msg.publisherId,
		streamName: msg.streamName
	});
	msg["Q.clientId"] = Q.clientId();
	Q.req('Streams/message', [], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Message.post.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		callback && callback.call(Message, err);
	}, { method: 'post', fields: msg, baseUrl: baseUrl });
};
Message.post.onError = new Q.Event();

/**
 * Gets the latest ordinal as long as there is a cache for that stream or that stream's messages.
 * Otherwise it returns 0.
 * 
 * @static
 * @method latestOrdinal
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Boolean} [checkMessageCache=false] whether to check the Streams.Message cache in addition to the Streams.Stream cache
 * @return {Number}
 */
Message.latestOrdinal = function _Message_latestOrdinal (publisherId, streamName, checkMessageCache) {
	var latest = 0;
	if (checkMessageCache) {
		Message.get.cache.each([publisherId, streamName], function (k, v) {
			if (!v.params[0] && v.subject.ordinal > 0) {
				latest = Math.max(latest, v.subject.ordinal);
			}
		});
	}
	if (!latest) {
		Streams.get.cache.each([publisherId, streamName], function (k, v) {
			if (!v.params[0] && v.subject.fields.messageCount > 0) {
				latest = v.subject.fields.messageCount;
				return false;
			}
		});
	}
	return parseInt(latest);
};

/**
 * Wait until a particular message is posted.
 * Used by Streams plugin to make sure messages arrive in order.
 * 
 * @static
 * @method wait
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Number} ordinal The ordinal of the message to wait for, or -1 to load latest messages
 * @param {Function} callback Receives ([arrayOfOrdinals]) as parameters
 * @param {Object} [options] A hash of options which can include:
 *   @param {Number} [options.max=5] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Number} [options.timeout=1000] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket=true] Whether to avoid doing any requests when a socket is attached
 *   @param {Boolean} [options.evenIfNotRetained] Set this to true to fetch all messages posted to the stream, in the event that it wasn't cached or retained.
 * @return {Boolean|Number|Q.Pipe}
 *   Returns false if no attempt was made because stream wasn't cached,
 *   true if the cached stream already got this message,
 *   a Q.Pipe if we decided to wait for messages to arrive via socket
 *   or return value of Q.Message.get, if we decided to send a request for the messages.
 */
Message.wait = function _Message_wait (publisherId, streamName, ordinal, callback, options) {
	var alreadyCalled = false, handlerKey;
	var latest = Message.latestOrdinal(publisherId, streamName, true);
	if (!latest && (!options || !options.evenIfNotRetained)) {
		// There is no cache for this stream, so we won't wait for previous messages.
		return false;
	}
	if (ordinal >= 0 && ordinal <= latest) {
		// The cached stream already got this message
		return true;
	}
	var o = Q.extend({}, Message.wait.options, options);
	var waiting = {};
	var node = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var socket = Q.Socket.get('Streams', node);
	if (!socket || ordinal < 0 || ordinal - o.max > latest) {
		return (socket && o.unlessSocket) ? false : _tryLoading();
	}
	// ok, wait a little while
	var t = setTimeout(_tryLoading, o.timeout);
	var ordinals = [];
	var p = new Q.Pipe();
	Q.each(latest+1, ordinal, 1, function (ord) {
		ordinals.push(ord);
		var event = Stream.onMessage(publisherId, streamName, ord);
		handlerKey = event.add(function () {
			p.fill(ord)();
			event.remove(handlerKey);
			handlerKey = null;
		});
		waiting[ord] = [event, handlerKey];
	});
	p.add(ordinals, 1, function () {
		if (!alreadyCalled) {
			Q.handle(callback, this, [ordinals]);
		}
		alreadyCalled = true;
		return true;
	}).run();
	return p;
	
	function _tryLoading() {
		// forget waiting, we'll request them again
		
		// We could have requested just the remaining ones, like this:
		// var filled = Q.Object(pipe.subjects),
		//	 remaining = Q.diff(ordinals, filled);
		// but we are going to request the entire range.
		
		if (ordinal < 0) {
			Message.get.forget(publisherId, streamName, {min: latest+1, max: ordinal});
		}
		return Message.get(publisherId, streamName, {min: latest+1, max: ordinal},
		function (err, messages) {
			if (err) {
				return Q.handle(callback, this, [err]);
			}
			// Go through the messages and simulate the posting
			// NOTE: the messages will arrive a lot quicker than they were posted,
			// and moreover without browser refresh cycles in between,
			// which may cause confusion in some visual representations
			// until things settle down on the screen
			ordinal = parseInt(ordinal);
			Q.each(messages, Q.queue(function (ordinal, message) {
				if (Message.latest[publisherId+"\t"+streamName] >= ordinal) {
					return; // it was already processed
				}
				Streams.onEvent('post').handle(message, messages);
			}, 0), {ascending: true, numeric: true});
			
			// if any new messages were encountered, updateMessageCache removed all the cached
			// results where max < 0, so future calls to Streams.Message.get with max < 0 will
			// make a request to the server

			// Do we have this message now?
			if (ordinal < 0 || Message.get.cache.get([publisherId, streamName, ordinal])) {
				// remove any event handlers still waiting for the event to be posted
				Q.each(waiting, function (i, w) {
					w[0].remove(w[1]);
				});
				if (!alreadyCalled) {
					Q.handle(callback, this, [Object.keys(messages)]);
				}
				alreadyCalled = true;
			}
		});
	}
};
Message.wait.options = {
	max: 5, // maximum number of messages we'll actually wait for, if there's a socket
	timeout: 1000 // maximum number of milliseconds we'll actually wait for, if there's a socket
};

var _messageShouldRefreshStream = {};

/**
 * This affects how the Streams plugin handles the posting of this message
 * on the front end. If true for a particular message type, the stream is
 * refreshed (if it was cached before) after all the message handlers have run.
 * You can, of course, implement more complex functionality in message handlers.
 * @method shouldRefreshStream
 * @param {type} The type of the message
 * @param {Boolean} should Whether the stream should be refreshed. Defaults to false.
 */
Message.shouldRefreshStream = function (type, should) {
	_messageShouldRefreshStream[type] = should;
};

/**
 * Constructs a participant from fields, which are typically returned from the server.
 * @class Streams.Participant
 * @constructor
 * @param {Object} fields
 */
var Participant = Streams.Participant = function Streams_Participant(fields) {
	Q.extend(this, fields);
	this.typename = 'Q.Streams.Participant';
};

/**
 * Get one or more participants, sorted by insertedTime
 * 
 * @static
 * @method get
 * @param {String} publisherId
 * @param {String} streamName
 * @param {String|Object} userId Can be the id of the participant user, or an object containing one or more of:
 *   "limit": The maximum number of participants to retrieve.
 *   "offset": The offset of the participants to retrieve. If it is -1 or lower, then participants are sorted by descending insertedTime.
 *   "state": The state of the participants to filter by, if any. Can be one of ('invited', 'participating', 'left')
 * @param {Function} callback This receives two parameters. The first is the error.
 *   If userId was a String, then the second parameter is the Streams.Participant, as well as the "this" object.
 *   If userId was an Object, then the second parameter is a hash of { userId: Streams.Participant } pairs
 */
Participant.get = function _Participant_get(publisherId, streamName, userId, callback) {
	var slotName, criteria = {"publisherId": publisherId, "name": streamName};
	if (Q.typeOf(userId) === 'object') {
		slotName = 'participants';
		criteria.limit = userId.limit;
		criteria.offset = userId.offset;
		if ('state' in userId) criteria.state = userId.state;
		if ('userId' in userId) criteria.userId = userId.userId;
	} else {
		slotName = 'participant';
		criteria.userId = userId;
	}
	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'participant', slotName, publisherId, streamName, criteria, function (err, data) {
		var participants = {};
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Participant.get.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		if ('participants' in data) {
			participants = data.participants;
		} else if ('participant' in data) {
			participants[userId] = data.participant;
		}
		Q.each(participants, function (userId, p) {
			var participant = participants[userId] = p && new Participant(p);
			Participant.get.cache.set(
				[publisherId, streamName, userId],
				0, participant, [err, participant]
			);
		});
		if (Q.isPlainObject(userId)) {
			callback && callback.call(this, err, participants || null);
		} else {
			var participant = Q.first(participants);;
			callback && callback.call(participant, err, participant || null);
		}
	});
};
Participant.get.onError = new Q.Event();

/**
 * Constructs an avatar from fields, which are typically returned from the server.
 * @class Streams.Avatar
 * @constructor
 * @param {Array} fields
 */
var Avatar = Streams.Avatar = function Streams_Avatar (fields) {
	this.fields = Q.extend({}, fields);
	this.typename = 'Q.Streams.Avatar';
};

/**
 * Avatar batch getter.
 * 
 * @static
 * @method get
 * @param userId {String|Object} The id of the user whose avatar we are requesting.
 *  Alternatively, this can also be an object with keys "prefix", "limit", "offset"
 * @param callback {function}
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a Streams.Avatar object
 */
Avatar.get = function _Avatar_get (userId, callback) {
	var func = Streams.batchFunction(Q.baseUrl({userId: userId}), 'avatar');
	func.call(this, userId, function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Avatar.get.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var avatar = data.avatar ? new Avatar(data.avatar) : null;
		Avatar.get.cache.set(
			[userId],
			0, avatar, [err, avatar]
		);
		callback && callback.call(avatar, null, avatar);
	});
};
Avatar.get.onError = new Q.Event();

/**
 * Get avatars by prefix
 * 
 * @static
 * @method byPrefix
 * @param prefix {string}
 *  For example something the user started typing in an autocomplete field
 * @param callback {function}
 *	If there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a hash of {userId: Streams.Avatar} pairs
 * @param {Object} [options]
 *   @param {Number} [options.limit] for paging
 *   @param {Number} [options.offset] for paging
 *   @param {Boolean} [options.public] If true, also gets publicly accessible names.
 *   @default false
 */
Avatar.byPrefix = function _Avatar_byPrefix (prefix, callback, options) {
	var userId = Q.plugins.Users.loggedInUser ? Users.loggedInUser.id : "";
	// Query avatar as userId would see it, by requesting it from the right server.
	// If userId is empty, then we query avatars on one of the public servers.
	var func = Streams.batchFunction(Q.baseUrl({
		userId: userId
	}), 'avatar');
	var fields = Q.take(options, ['limit', 'offset', 'public']);
	Q.extend(fields, {prefix: prefix});
	Q.req('Streams/avatar', ['avatars'], function (err, data) {
		var msg = Q.firstErrorMessage(err, data && data.errors);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Avatar.byPrefix.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var avatars = {};
		Q.each(data.slots.avatars, function (userId, avatar) {
			avatars[userId] = avatar = new Avatar(avatar);
			Avatar.get.cache.set([userId], 0, avatar, [null, avatar]);
		});
		Avatar.byPrefix.cache.set([prefix], 0, this, [null, avatars]);
		callback && callback.call(this, null, avatars);
	}, { fields: fields });
};
Avatar.byPrefix.onError = new Q.Event();

var Ap = Avatar.prototype;

/**
 * Get the display name from a Streams.Avatar
 * 
 * @method displayName
 * @param {Object} [options] A bunch of options which can include:
 *   @param {Boolean} [options.short] Show one part of the name only
 *   @param {boolean} [options.show] The parts of the name to show. Can have the letters "f", "l", "u" in any order.
 *   @param {Boolean} [options.html] If true, encloses the first name, last name, username in span tags. If an array, then it will be used as the attributes of the html.
 *   @param {Boolean} [options.escape] If true, does HTML escaping of the retrieved fields
 * @param {String} [fallback='Someone'] What to return if there is no info to get displayName from.
 * @return {String}
 */
Ap.displayName = function _Avatar_prototype_displayName (options, fallback) {
	var fn = this.firstName;
	var ln = this.lastName;
	var u = this.username;
	var fn2, ln2, u2, f2;
	fallback = fallback || 'Someone';
	if (options && (options.escape || options.html)) {
		fn = fn.encodeHTML();
		ln = ln.encodeHTML();
		u = u.encodeHTML();
	}
	if (options && options.html) {
		fn2 = '<span class="Streams_firstName">'+fn+'</span>';
		ln2 = '<span class="Streams_lastName">'+ln+'</span>';
		u2 = '<span class="Streams_username">'+u+'</span>';
		f2 = '<span class="Streams_username">'+fallback+'</span>';
	} else {
		fn2 = fn;
		ln2 = ln;
		u2 = u;
		f2 = fallback;
	}
	if (options && options.show) {
		var show = options.show.split('');
		var parts = [];
		for (var i=0, l=show.length; i<l; ++i) {
			var s = show[i];
			parts.push(s == 'f' ? fn2 : (s == 'l' ? ln2 : u2));
		}
		return parts.join(' ');
	}
	if (options && options.short) {
		return fn ? fn2 : u2;
	} else if (fn && ln) {
		return fn + ' ' + ln2;
	} else if (fn && !ln) {
		return u ? fn2 + ' ' + u2 : fn2;
	} else if (!fn && ln) {
		return u ? u2 + ' ' + ln2 : ln2;
	} else {
		return u ? u2 : f2;
	}
};

/**
 * Get the url of the user icon from a Streams.Avatar
 * @method
 * @param {Number} [size=40] the size of the icon to render.
 * @return {String} the url
 */
Ap.iconUrl = function _Avatar_prototype_iconUrl (size) {
	return Users.iconUrl(this.icon.interpolate({
		'userId': this.publisherId.splitId()
	}), size);
};

/**
 * Methods related to "Streams/interest" streams.
 * @class Streams.Interests
 * @constructor
 * @param {Object} fields
 */
var Interests = Streams.Interests = {
	add: function (title, callback, options) {
		if (!Users.loggedInUser) {
			return false;
		}
		var fields = {
			title: title
		};
		if (options) {
			if (options.subscribe) {
				fields.subscribe = 1;
			}
			if (options.publisherId) {
				fields.publisherId = options.publisherId;
			}
		}
		Q.req('Streams/interest', ['publisherId', 'streamName'],
		function (err, response) {
			Q.handle(callback, this, arguments);
			var s = response && response.slots;
			if (s) {
				_refreshUnlessSocket(s.publisherId, s.streamName);
			}
		}, {
			method: 'post', 
			fields: fields
		});
	},
	remove: function (title, callback) {
		if (!Users.loggedInUser) {
			return false;
		}
		var fields = {
			title: title
		};
		Q.req('Streams/interest', ['publisherId', 'streamName'],
		function (err, response) {
			Q.handle(callback, this, arguments);
			var s = response && response.slots;
			if (s) {
				_refreshUnlessSocket(s.publisherId, s.streamName);
			}
		}, {
			method: 'delete', 
			fields: fields
		});
	},
	forUser: function (userId, communityId, callback) {
		var fields = {};
		if (userId) {
			fields.userId = userId;
		}
		if (communityId) {
			fields.communityId = communityId;
		}
		Q.req('Streams/interest', 'interests', function (err, response) {
			var msg;
			var r = response && response.errors;
			if (msg = Q.firstErrorMessage(err, r)) {
				return callback && callback(msg);
			}
			var results = {};
			var relatedTo = response.slots.interests;
			for (var w in relatedTo) {
				var info = relatedTo[w];
				var title = info[2];
				var normalized = Q.normalize(title);
				results[normalized] = title;
			}
			callback && callback.call(this, null, results);
		}, { fields: fields });
	},
	forMe: function (communityId, callback) {
		if (!Q.isEmpty(Interests.my)) {
			return callback && callback(null, Interests.my);
		}
		var userId = Users.loggedInUserId();
		Interests.forUser(userId, communityId, function (err, results) {
			if (err) {
				return callback(err);
			}
			Interests.my = results;
			callback(null, results);
		});
	},
	all: {},
	my: null
};

/**
 * @class Streams
 */

/**
 * Try to figure out a displayable title from a stream's type
 * @static
 * @method displayType
 * @param {String} type
 * @return {String}
 */
Streams.displayType = function _Streams_displayType(type) {
	return type.split('/').slice(1).join('/');
};

Streams.setupRegisterForm = function _Streams_setupRegisterForm(identifier, json, priv, overlay) {
	var src = json.entry[0].thumbnailUrl;
	var src40 = src, src50 = src, src80 = src;
	var firstName = '', lastName = '';
	if (priv.registerInfo) {
		if (priv.registerInfo.firstName){
			firstName = priv.registerInfo.firstName;
		}
		if (priv.registerInfo.lastName){
			lastName = priv.registerInfo.lastName;
		}
		if (priv.registerInfo.pic) {
			src40 = src50 = src = src80 = priv.registerInfo.pic;
		}
	}
	var img = $('<img />').attr('src', src).attr('title', Q.text.Streams.login.picTooltip);
	if (img.tooltip) {
		img.tooltip();
	}
	var td, table = $('<table />').append(
		$('<tr />').append(
			$('<td class="Streams_login_picture" />').append(img)
		).append(
			td = $('<td class="Streams_login_username_block" />').append(
				$('<label for="Streams_login_username" />').html(Q.text.Streams.login.fullName)
			).append(
				'<br>'
			).append(
				$('<input id="Streams_login_username" name="fullName" type="text" class="text" />')
				.attr('maxlength', Q.text.Users.login.maxlengths.fullName)
				.attr('placeholder', Q.text.Users.login.placeholders.fullName)
				.val(firstName+(lastName ? ' ' : '')+lastName)
			)
		)
	);
	var register_form = $('<form method="post" class="Users_register_form" />')
	.attr('action', Q.action("Streams/register"))
	.data('form-type', 'register')
	.append($('<div class="Streams_login_appear" />'));

	var $b = $('<button />', {
		"type": "submit",
		"class": "Q_button Q_main_button Streams_login_start "
	}).html(Q.text.Users.login.registerButton)
	.on(Q.Pointer.touchclick, function (e) {
		Users.submitClosestForm.apply(this, arguments);
	}).on(Q.Pointer.click, function (e) {
		e.preventDefault(); // prevent automatic submit on click
	});

	register_form.append(table)
	.append($('<input type="hidden" name="identifier" />').val(identifier))
	.append($('<input type="hidden" name="icon" />'))
	.append($('<input type="hidden" name="Q.method" />').val('post'))
	.append(
		$('<div class="Streams_login_get_started">&nbsp;</div>')
		.append($b)
	).submit(Q.throttle(function (e) {
		e.preventDefault();
		if (!$('#Users_agree').attr('checked')) {
			$(this).data('cancelSubmit', true);
			if (!confirm(Q.text.Users.login.confirmTerms)) {
				$(this).data('cancelSubmit', true);
			} else {
				$(this).data('cancelSubmit', false);
				$('#Users_agree').attr('checked', 'checked');
			}
		}
	}, 300)).on('keydown', function (e) {
		if ((e.keyCode || e.which) === 13) {
			$(this).submit();
			e.preventDefault();
		}
	});
	if (priv.activation) {
		register_form.append($('<input type="hidden" name="activation" />').val(priv.activation));
	}

	if (json.termsLabel) {
		td.append(
			$('<div />').attr("id", "Users_register_terms")
				.append($('<input type="checkbox" name="agree" id="Users_agree" value="yes">'))
				.append($('<label for="Users_agree" />').html(json.termsLabel))
		);
	}

	var authResponse, fields = {};
	if (Q.plugins.Users.facebookApps && Q.plugins.Users.facebookApps[Q.info.app]) {
		Q.plugins.Users.initFacebook(function() {
			if ((authResponse = FB.getAuthResponse())) {
				fields['Users'] = {
					'facebook_authResponse': authResponse
				};
				for (var k in authResponse) {
					register_form.append(
						$('<input type="hidden" />')
						.attr('name', 'Users[facebook_authResponse][' + k + ']')
						.attr('value', authResponse[k])
					);
				}
			}
		});
	}

	if ($('#Streams_login_step1_form').data('used') === 'facebook') {
		register_form.append($('<input type="hidden" name="provider" value="facebook" />'));
	}
	if (json.emailExists || json.mobileExists) {
		var p = $('<p id="Streams_login_identifierExists" />')
			.html(json.emailExists ? Q.text.Users.login.emailExists : Q.text.Users.login.mobileExists);
		$('a', p).click(function() {
			$.post(Q.ajaxExtend(Q.action("Users/resend"), 'data'), 'identifier='+encodeURIComponent(identifier), function () {
				overlay.close();
			});
			return false;
		});
		register_form.append(p);
	}
	return register_form;
};

function updateAvatarCache(stream) {
	var avatarStreamNames = {
		'Streams/user/firstName': true,
		'Streams/user/lastName': true,
		'Streams/user/username': true,
		'Streams/user/icon': true
	};
	var sf = stream.fields;
	if (avatarStreamNames[sf.name]) {
		// Reload User and Avatar from the server
		Users.get.force(sf.publisherId);
		Avatar.get.force(sf.publisherId);
	}
}

Stream.update = function _Streams_Stream_update(stream, fields, onlyChangedFields) {
	if (!stream || !fields) {
		return false;
	}
	var publisherId = stream.fields.publisherId;
	var streamName = stream.fields.name;
	var updated = {}, cleared = [], k;
		
	// events about updated fields
	for (k in fields) {
		if (onlyChangedFields
		&& fields[k] === stream.fields[k]
		&& !(k in onlyChangedFields)) {
			continue;
		}
		Q.handle(
			Q.getObject([publisherId, streamName, k], _streamFieldChangedHandlers),
			stream,
			[fields, k]
		);
		Q.handle(
			Q.getObject([publisherId, '', k], _streamFieldChangedHandlers),
			stream,
			[fields, k]
		);
		Q.handle(
			Q.getObject(['', streamName, k], _streamFieldChangedHandlers),
			stream,
			[fields, k]
		);
		updated[k] = fields[k];
	}
	if (!onlyChangedFields || !Q.isEmpty(updated)) {
		Q.handle(
			Q.getObject([publisherId, streamName, ''], _streamFieldChangedHandlers),
			stream,
			[fields, updated]
		);
		Q.handle(
			Q.getObject([publisherId, '', ''], _streamFieldChangedHandlers),
			stream,
			[fields, updated]
		);
		Q.handle(
			Q.getObject(['', streamName, ''], _streamFieldChangedHandlers),
			stream,
			[fields, updated]
		);
	}
	if (('attributes' in fields)
	&& (!onlyChangedFields || fields.attributes != stream.fields.attributes)) {
		var attributes = JSON.parse(fields.attributes || "{}");
		var publisherId = stream.fields.publisherId;
		var streamName = stream.fields.name, obj;
		updated = {}, cleared = [];
		
		// events about cleared attributes
		var streamAttributes = stream.getAll();
		for (k in streamAttributes) {
			if (k in attributes) {
				continue;
			}
			obj = {};
			obj[k] = undefined;
			Q.handle(
				Q.getObject([publisherId, streamName, k], _streamUpdatedHandlers),
				stream,
				[fields, obj, [k]]
			);
			updated[k] = undefined;
			cleared.push(k);
		}
		
		// events about updated attributes
		for (k in attributes) {
			if (JSON.stringify(attributes[k]) == JSON.stringify(stream.get(k))) {
				continue;
			}
			obj = {};
			obj[k] = attributes[k];
			Q.handle(
				Q.getObject([publisherId, streamName, k], _streamUpdatedHandlers),
				stream,
				[attributes, k]
			);
			updated[k] = attributes[k];
		}
		Q.handle(
			Q.getObject([publisherId, streamName, ''], _streamUpdatedHandlers),
			stream,
			[attributes, updated, cleared]
		);
		Q.handle(
			Q.getObject([publisherId, '', ''], _streamUpdatedHandlers),
			stream,
			[attributes, updated, cleared]
		);
	}
	// Now time to replace the fields in the stream with the incoming fields
	Q.extend(stream.fields, fields);
	updateAvatarCache(stream);
	prepareStream(stream);
}

function prepareStream(stream) {
	if (stream.fields.messageCount) {
		stream.fields.messageCount = parseInt(stream.fields.messageCount);
	}
	if (stream.fields.participantCount) {
		stream.fields.participantCount = parseInt(stream.fields.participantCount);
	}
	if (stream.fields.access) {
		stream.access = Q.copy(stream.fields.access);
		delete stream.fields.access;
	}
	if (stream.fields.isRequired) {
		stream.isRequired = stream.fields.isRequired;
		delete stream.fields.isRequired;
	}
	try {
		stream.pendingAttributes = stream.attributes
		= stream.fields.attributes ? JSON.parse(stream.fields.attributes) : {};
	} catch (e) {
		stream.pendingAttributes = stream.attributes = {};
	}
	stream.pendingFields = {};
}

function _onCalledHandler(args, shared) {
	shared.retainUnderKey = _retain;
	_retain = undefined;
}

function _onResultHandler(subject, params, args, ret, original) {
	var key = ret.retainUnderKey;
	if (key == undefined || params[0] || !subject) {
		return; // either retainWith was not called or an error occurred during the request
	}
	if (Q.typeOf(subject) === 'Q.Streams.Stream') {
		subject.retain(key);
	} else {
		if (subject.stream) {
			subject.stream.retain(key);
		}
		Q.each(subject.streams, 'retain', [key]);
		Q.each(subject.relatedStreams, 'retain', [key]);
	}
}

Q.Tool.onMissingConstructor.set(function (constructors, normalized) {
	var str = "_preview";
	if (normalized.substr(normalized.length-str.length) === str) {
		constructors[normalized] = "plugins/Streams/js/tools/default/preview.js";
	}
}, 'Streams');

Q.beforeInit.add(function _Streams_beforeInit() {

	var where = Streams.cache.where || 'document';

	Stream.get = Streams.get = Q.getter(Streams.get, {
		cache: Q.Cache[where]("Streams.get", 100), 
		throttle: 'Streams.get'
	});

	Streams.getParticipating = Q.getter(Streams.getParticipating, {
		cache: Q.Cache.document("Streams.getParticipating", 10)
	});

	Streams.related = Q.getter(Streams.related, {
		cache: Q.Cache[where]("Streams.related", 100), 
		throttle: 'Streams.related'
	});

	Message.get = Q.getter(Message.get, {
		cache: Q.Cache[where]("Streams.Message.get", 1000), 
		throttle: 'Streams.Message.get'
	});

	Participant.get = Q.getter(Participant.get, {
		cache: Q.Cache[where]("Streams.Participant.get", 1000), 
		throttle: 'Streams.Participant.get'
	});

	Avatar.get = Q.getter(Avatar.get, {
		cache: Q.Cache[where]("Streams.Avatar.get", 1000), 
		throttle: 'Streams.Avatar.get'
	});

	Avatar.byPrefix = Q.getter(Avatar.byPrefix, {
		cache: Q.Cache[where]("Streams.Avatar.byPrefix", 100),
		throttle: 'Streams.Avatar.byPrefix'
	});
	
	Q.each([Streams.get, Streams.getParticipating, Streams.related],
	function () {
		this.onCalled.set(_onCalledHandler, 'Streams');
		this.onResult.set(_onResultHandler, 'Streams');
	});
	
}, 'Streams');

Q.onInit.add(function _Streams_onInit() {
	var Users = Q.plugins.Users;
	Users.login.options.setupRegisterForm=  Streams.setupRegisterForm;
	Q.text.Users.login.placeholders.fullName = 'Enter your full name';
	Q.text.Users.login.maxlengths.fullName = 50;

	Users.onLogin.set(function (user) {
		if (user) { // the user changed
			Interests.my = {};
			_clearCaches();
		};
		_connectSockets.apply(this, arguments);
	}, "Streams");
	Users.onLogout.set(function () {
		Interests.my = {}; // clear the interests
		_clearCaches();
		Streams.invite.dialog = null;  // clear invite dialog info
		Q.Socket.destroyAll();
	}, "Streams");
	if (Users.loggedInUser) {
		_connectSockets();
	}

	var pushNotification = window.plugins && window.plugins.pushNotification;
	function _registerPushNotifications () {
		pushNotification.registerDevice({alert:true, badge:true, sound:true}, function(status) {
			// if successful status is an object that looks like this:
			// {"type":"7","pushBadge":"1","pushSound":"1","enabled":"1","deviceToken":"blablahblah","pushAlert":"1"}
			Q.req('Users/device', 'data', function (res) {
				if (res.errors) return console.log(res.errors[0].message);
				Streams.pushNotification = {
					engine: pushNotification,
					status: status
				};
				document.addEventListener('push-notification', function(e) {
					if (e.notification && e.notification.aps && e.notification.aps.badge !== undefined) {
						pushNotification.setApplicationIconBadgeparseInt(e.notification.aps.badge);
					}
				});
				function _onActivate() {
					pushNotification.getPendingNotifications(function(e) {
						if (e.notifications.length) {
							var n = e.notifications[0];
							// trigger activation event only if application was inactive
							if (n.applicationStateActive === "0") Q.handle(Streams.onActivate, Streams, [n.data]);
						}
					});
				}
				document.addEventListener('active', _onActivate);
				_onActivate();
			}, {
				method: "post",
				fields: {token: status.deviceToken},
				quiet: true
			});
		});
	}
	if (Q.info.isCordova && pushNotification && !Streams.pushNotification) {
		Users.login.options.onSuccess.set(_registerPushNotifications, 'Streams.PushNotifications');
		Users.logout.options.onSuccess.set(function() { pushNotification.setApplicationIconBadgeparseInt(0); }, 'Streams.PushNotifications');
		if (Users.loggedInUser) _registerPushNotifications();
	}
	
	// handle resign/resume application in Cordova
	if (Q.info.isCordova) {
		Q.addEventListener(document, ['resign', 'pause'], _disconnectSockets);
		Q.addEventListener(document, 'resume', function () {
			_connectSockets(true);
		});
	}
	
	// handle going online after being offline
	Q.onOnline.set(function () {
		_connectSockets(true);
	}, 'Streams');

	// set up full name request dialog
	Q.Page.onLoad('').add(function _Streams_onPageLoad() {
		if (Q.getObject("Q.plugins.Users.loggedInUser.displayName")) {
			return;
		}
		var params = Q.getObject("Q.plugins.Streams.invite.dialog");
		if (!params) {
			return;
		}
		Streams.construct(params.stream, function () {
			params.stream = this;
			Q.Template.render('Streams/invite/complete', params, 
			function(err, html) {
				var dialog = $(html);
				var interval;
				Q.Dialogs.push({
					dialog: dialog,
					className: 'Streams_completeInvited_dialog',
					mask: true,
					noClose: true,
					closeOnEsc: false, 
					beforeClose: function () {
						if (interval) {
							clearInterval(interval);
						}
					},
					onActivate: {'Streams.completeInvited': function _Streams_completeInvited() {
						Streams.onInvitedDialog.handle.call(Streams, [dialog]);
						var l = Q.text.Users.login;
						dialog.find('#Streams_login_username')
							.attr('maxlength', l.maxlengths.fullName)
							.attr('placeholder', l.placeholders.fullName)
							.plugin('Q/placeholders');
						if (!Q.info.isTouchscreen) {
							var $input = $('input', dialog).eq(0);
							$input.plugin('Q/clickfocus');
							interval = setInterval(function () {
								if ($input.val()) return;
								$input.plugin('Q/clickfocus');
							}, 100);
						}
						var $complete_form = dialog.find('form')
						.validator()
						.submit(function(e) {
							e.preventDefault();
							var baseUrl = Q.baseUrl({
								publisherId: Q.plugins.Users.loggedInUser.id,
								streamName: "Streams/user/firstName"
							});
							var url = 'Streams/basic?' + $(this).serialize();
							Q.req(url, ['data'], function _Streams_basic(err, data) {
								var msg = Q.firstErrorMessage(
									err, data && data.errors
								);
								if (data && data.errors) {
									$complete_form.data('validator').invalidate(
										Q.ajaxErrors(data.errors, ['fullName'])
									);
									$('input', $complete_form).eq(0)
									.plugin('Q/clickfocus');
									return;
								} else if (msg) {
									return alert(msg);
								}
								$complete_form.data('validator').reset();
								dialog.data('Q/dialog').close();
								var params = {
									evenIfNotRetained: true,
									unlessSocket: true
								};
								var p = new Q.Pipe(['first', 'last'], function (params) {
									Q.handle(Streams.onInviteComplete, data, 
										[ params.first[0], params.last[0] ]
									);
								});
								Stream.refresh(Users.loggedInUser.id, 
									'Streams/user/firstName', p.fill('first'), params
								);
								Stream.refresh(Users.loggedInUser.id, 
									'Streams/user/lastName', p.fill('last'), params
								);
							}, {method: "post", quietly: true, baseUrl: baseUrl});
						}).on('submit keydown', Q.debounce(function (e) {
							if (e.type === 'keydown'
							&& (e.keyCode || e.which) !== 13) {
								return;
							}
							var val = dialog.find('#Streams_login_username').val();
							Streams.onInvitedUserAction.handle.call(
								[val, dialog]
							);
						}, 0));
						$('button', $complete_form).on('touchstart', function () {
							$(this).submit();
						});
					}}
				});
			});
		});
	}, "Streams");

	Streams.onEvent('debug').set(function _Streams_debug_handler (msg) {
		console.log('DEBUG:', msg);
	}, 'Streams');

	// if stream was edited or removed - invalidate cache
	Streams.onEvent('remove').set(function _Streams_remove_handler (stream) {
		Streams.get.cache.each([msg.publisherId, msg.streamName], 
		function (k, v) {
			this.remove(k);
			updateAvatarCache(v.subject);
		});
	}, 'Streams');

	Streams.onEvent('join').set(function _Streams_join_handler (p) {
		// 'join' event contains new participant.
		console.log('Streams.onEvent("join")', p);
		var _cache = Participant.get.cache;
		if (_cache) {
			var key = JSON.stringify([p.publisherId, p.streamName, p.userId]);
			_cache.set(key, p);
		}
	}, 'Streams');

	Streams.onEvent('leave').set(function (p) {
		// 'leave' event contains removed participant.
		console.log('Streams.onEvent("leave")', p);
		Participant.get.cache.set(
			[p.publisherId, p.streamName, p.userId],
			0, p, [null, p]
		);
	});

	Streams.onEvent('post').set(function _Streams_post_handler (msg, messages) {
		if (!msg) {
			throw new Q.Error("Q.Streams.onEvent msg is empty");
		}
		var latest = Message.latestOrdinal(msg.publisherId, msg.streamName, false);
		if (parseInt(msg.ordinal) <= latest) {
			return;
		}
		// Wait until the previous message has been posted, then process this one.
		// Will return immediately if previous message is already cached
		// (e.g. from a post or retrieving a stream, or because there was no cache yet)
		var ret = Message.wait(msg.publisherId, msg.streamName, msg.ordinal-1, _message);
		if (typeof ret === 'boolean') {
			_message();
		}
		function _message() {
			var ptn = msg.publisherId+"\t"+msg.streamName;
			if (Message.latest[ptn] >= parseInt(msg.ordinal)) {
				return; // it was already processed
			}
			// New message posted - update cache
			console.log('Streams.onEvent("post")', msg);
			var message = (Q.typeOf(msg) === 'Q.Streams.Message')
				? msg
				: Message.construct(msg);
			Message.latest[ptn] = parseInt(msg.ordinal);
			var cached = Streams.get.cache.get(
				[msg.publisherId, msg.streamName]
			);
			Streams.get(msg.publisherId, msg.streamName, function (err) {

				if (err) {
					console.warn(Q.firstErrorMessage(err));
					console.log(err);
					return;
				}

				var stream = this;
				var params = [this, message, messages];
				var usingCached = Q.getter.usingCached;
				
				stream.fields.messageCount = msg.ordinal;

				_messageHandlers[msg.streamType] &&
				_messageHandlers[msg.streamType][msg.type] &&
				Q.handle(_messageHandlers[msg.streamType][msg.type], Q.plugins.Streams, params);

				_messageHandlers[''] &&
				_messageHandlers[''][msg.type] &&
				Q.handle(_messageHandlers[''][msg.type], Q.plugins.Streams, params);

				_messageHandlers[msg.streamType] &&
				_messageHandlers[msg.streamType][''] &&
				Q.handle(_messageHandlers[msg.streamType][''], Q.plugins.Streams, params);

				_messageHandlers[''] &&
				_messageHandlers[''][''] &&
				Q.handle(_messageHandlers[''][''], Q.plugins.Streams, params);

				Q.each([msg.publisherId, ''], function (ordinal, publisherId) {
					Q.each([msg.streamName, ''], function (ordinal, streamName) {
						Q.handle(
							Q.getObject([publisherId, streamName, ordinal], _streamMessageHandlers),
							Q.plugins.Streams,
							params
						);
						Q.each([msg.type, ''], function (ordinal, type) {
							Q.handle(
								Q.getObject([publisherId, streamName, type], _streamMessageHandlers),
								Q.plugins.Streams,
								params
							);
						});
					});
				});

				updateMessageCache();

				var fields = msg.instructions && JSON.parse(msg.instructions);
				var node;
				var updatedParticipants = true;
				switch (msg.type) {
				case 'Streams/join':
					updateParticipantCache(1);
					break;
				case 'Streams/leave':
					updateParticipantCache(-1);
					break;
				case 'Streams/joined':
					if (stream.fields.name==="Streams/participating") {
						node = Q.nodeUrl({
							publisherId: fields.publisherId,
							streamName: fields.streamName
						});
						Q.Socket.onConnect(node).add(function (socket) {
							console.log('Listening to stream '+p.publisherId+", "+p.streamName);
						}, 'Streams');
						Q.Socket.connect('Streams', node);
					}
					break;
				case 'Streams/left':
					if (stream.fields.name==="Streams/participating") {
						node = Q.nodeUrl({
							publisherId: fields.publisherId,
							streamName: fields.streamName
						});
						var socket = Q.Socket.get('Streams', node);
						if (socket) {
							// only disconnect when you've left all the streams on this node
							// socket.disconnect();
						}
					}
					break;
				case 'Streams/changed':
					Stream.update(stream, fields.changes, null);
					break;
				case 'Streams/progress':
					Stream.update(stream, fields, null);
					break;
				case 'Streams/relatedFrom':
					updateRelatedCache(fields);
					_relationHandlers(_streamRelatedFromHandlers, msg, stream, fields);
					break;
				case 'Streams/relatedTo':
					updateRelatedCache(fields);
					_relationHandlers(_streamRelatedToHandlers, msg, stream, fields);
					break;
				case 'Streams/unrelatedFrom':
					updateRelatedCache(fields);
					_relationHandlers(_streamUnrelatedFromHandlers, msg, stream, fields);
					break;
				case 'Streams/unrelatedTo':
					updateRelatedCache(fields);
					_relationHandlers(_streamUnrelatedToHandlers, msg, stream, fields);
					break;
				case 'Streams/updatedRelateFrom':
					updateRelatedCache(fields);
					_relationHandlers(_streamUpdatedRelateFromHandlers, msg, stream, fields);
					break;
				case 'Streams/updatedRelateTo':
					updateRelatedCache(fields);
					_relationHandlers(_streamUpdatedRelateToHandlers, msg, stream, fields);
					break;
				case 'Streams/closed':
					Stream.update(stream, fields, null);
					var sf = stream.fields;
					var Qh = Q.handle;
					var Qgo = Q.getObject;
					Qh(Qgo([sf.publisherId, sf.name], _streamClosedHandlers), stream, [fields]);
					Qh(Qgo([sf.publisherId, ''], _streamClosedHandlers), stream, [fields]);
					Qh(Qgo(['', sf.name], _streamClosedHandlers), stream, [fields]);
					Qh(Qgo(['', ''], _streamClosedHandlers), stream, [fields]);
					break;
				default:
					break;
				}
				
				if (usingCached && _messageShouldRefreshStream[msg.type]) {
					_debouncedRefresh(
						stream.fields.publisherId, 
						stream.fields.name,
						null,
						{evenIfNotRetained: true}
					);
				}

				function _relationHandlers(handlers, msg, stream, fields) {
					Q.each([msg.publisherId, ''], function (ordinal, publisherId) {
						Q.each([msg.streamName, ''], function (ordinal, streamName) {
							if (handlers[publisherId] && handlers[publisherId][streamName]) {
								Q.handle(
									handlers[publisherId][streamName],
									stream,
									[msg, fields]
								);
							}
						});
					});
				}

				function updateMessageCache() {
					Streams.get.cache.each([msg.publisherId, msg.streamName],
					function (k, v) {
						var stream = (v && !v.params[0]) ? v.subject : null;
						if (!stream) {
							return;
						}
						var args = JSON.parse(k), extra = args[2];
						if (extra && extra.messages) {
							this.remove(k);
						}
					});
					Message.get.cache.each([msg.publisherId, msg.streamName],
					function (k, v) {
						var args = JSON.parse(k), ordinal = args[2];
						if (ordinal && ordinal.max && ordinal.max < 0) {
							this.remove(k); 
						}
					});
				}

				function updateParticipantCache(incrementCount) {
					Streams.get.cache.each([msg.publisherId, msg.streamName],
					function (k, v) {
						var stream = (v && !v.params[0]) ? v.subject : null;
						if (!stream) {
							return;
						}
						if ('participantCount' in stream.fields) {
							stream.fields.participantCount += incrementCount; // increment participant count
						}
						var args = JSON.parse(k), extra = args[2];
						if (extra && extra.participants) {
							this.remove(k);
						}
					});
					Participant.get.cache.removeEach([msg.publisherId, msg.streamName]);
					// later, we can refactor this to insert
					// the correct data into the cache
				}

				function updateRelatedCache(fields) {
					Streams.related.cache.removeEach([msg.publisherId, msg.streamName]);
				}
			});
		}
	}, 'Streams');
	
	function _preloadedStreams(elem) {
		// Every time before anything is activated,
		// process any preloaded streams data we find
		Q.each(Stream.preloaded, function (i, fields) {
			Streams.construct(fields, {}, null);
		});
		Stream.preloaded = null;
	}
		
	Q.beforeActivate.add(_preloadedStreams, 'Streams');
	Q.loadUrl.options.onResponse.add(_preloadedStreams, 'Streams');
	
	Q.addEventListener(window, Streams.refresh.options.duringEvents, Streams.refresh);
	_scheduleUpdate();

}, 'Streams');

Q.Tool.beforeRemove("").set(function (tool) {
	Streams.release(this);
}, 'Streams');

Q.Page.beforeUnload("").set(function () {
	Streams.release(true);
}, 'Stream');

function _clearCaches() {
	// Clear caches so permissions can be recalculated as various objects are fetched
	Streams.get.cache.clear();
	Streams.related.cache.clear();
	Streams.getParticipating.cache.clear();
	Message.get.cache.clear();
	Participant.get.cache.clear();
	Avatar.get.cache.clear();
	_retainedByKey = {};
	_retainedByStream = {};
	_retainedStreams = {};
}

function _scheduleUpdate() {
	var ms = 1000;
	if (_scheduleUpdate.timeout) {
		clearTimeout(_scheduleUpdate.timeout);
	}
	_scheduleUpdate.timeout = setTimeout(function () {
		var now = Date.now();
		if (_scheduleUpdate.lastTime !== undefined
		&& now - _scheduleUpdate.lastTime - ms > _scheduleUpdate.delay) {
			// The timer was delayed for too long. Something might have changed.
			// Streams.refresh.options.minSeconds should prevent the update
			// from happening too frequently
			if (!Streams.refresh.options.preventAutomatic) {
				Streams.refresh();
			}
		}
		_scheduleUpdate.lastTime = now;
		setTimeout(_scheduleUpdate, ms);
	}, ms);
}

function _refreshUnlessSocket(publisherId, streamName) {
	Stream.refresh(publisherId, streamName, null, {
		messages: true,
		unlessSocket: true
	});
}

Q.Template.set('Streams/followup/mobile/alert', "The invite was sent from our number, which your friends don't yet recognize. Follow up with a quick text to let them know the invitation came from you, asking them to click the link.");

Q.Template.set('Streams/followup/mobile', 
	"Hey, I just sent you an invite with {{app}}. Please check your sms and click the link!"
);

Q.Template.set('Streams/followup/email/alert', "");

Q.Template.set('Streams/followup/email/subject', "Did you get an invite?");

Q.Template.set('Streams/followup/email/body', 
	"Hey, I just sent you an invite with {{app}}. Please check your email and click the link in there!"
);

_scheduleUpdate.delay = 5000;

})(Q, jQuery);