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
		prompt: "Let friends recognize you:",
		newUser: "or create a new account below",
		picTooltip: "You can change this picture later"
	},
	complete: {
		// this is just a fallback, see Streams/types/*/invite/dialog config
		prompt: "Let friends recognize you:"
	},
	chat: {
		noMessages: ""
	},
	followup: {
		mobile: {
			title: 'Follow up'
		},
		email: {
			title: 'Follow up'
		}
	}

};

/**
 * Read levels
 * @property READ_LEVEL
 * @type Object
 */
/**
 * Can't see the stream
 * @property READ_LEVEL.none
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can see icon and title
 * @property READ_LEVEL.see
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can see the stream's content
 * @property READ_LEVEL.content
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can see relations to other streams
 * @property READ_LEVEL.relations
 * @type integer
 * @default 25
 * @final
 */
/**
 * Can see participants in the stream
 * @property READ_LEVEL.participants
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can play stream in a player
 * @property READ_LEVEL.messages
 * @type integer
 * @default 40
 * @final
 */
/**
 * Max read level
 * @property READ_LEVEL.max
 * @type integer
 * @default 40
 * @final
 */
Streams.READ_LEVEL = {
	'none':			0,  // can't see the stream
	'see':			10, // can see icon and title
	'content':		20, // can see the stream's content
	'relations':	25,	// can see relations to other streams
	'participants':	30, // can see participants in the stream
	'messages':		40, // can play stream in a player
	'max':	  	40  // max read level
};

/**
 * Write levels
 * @property WRITE_LEVEL
 * @type Object
 */
/**
 * Cannot affect stream or participants list
 * @property WRITE_LEVEL.none
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can become a participant, chat, and leave
 * @property WRITE_LEVEL.join
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can vote for a relation message posted to the stream.
 * @property WRITE_LEVEL.vote
 * @type integer
 * @default 13
 * @final
 */
/**
 * Can post messages, but manager must approve
 * @property WRITE_LEVEL.postPending
 * @type integer
 * @default 15
 * @final
 */
/**
 * Can post messages which appear immediately
 * @property WRITE_LEVEL.messages
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can post messages relating other streams to this one
 * @property WRITE_LEVEL.relate
 * @type integer
 * @default 23
 * @final
 */
/**
 * Can update properties of relations directly
 * @property WRITE_LEVEL.relations
 * @type integer
 * @default 25
 * @final
 */
/**
 * Can post messages requesting edits of stream
 * @property WRITE_LEVEL.suggest
 * @type integer
 * @default 28
 * @final
 */
/**
 * Can post messages to edit stream content immediately
 * @property WRITE_LEVEL.edit
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can post a message requesting to close the stream
 * @property WRITE_LEVEL.closePending
 * @type integer
 * @default 35
 * @final
 */
/**
 * Don't delete, just prevent any new changes to stream
 * however, joining and leaving is still ok
 * @property WRITE_LEVEL.close
 * @type integer
 * @default 40
 * @final
 */
/**
 * Max write level
 * @property WRITE_LEVEL.max
 * @type integer
 * @default 40
 * @final
 */
Streams.WRITE_LEVEL = {
	'none':			0,		// cannot affect stream or participants list
	'join':			10,		// can become a participant, chat, and leave
	'vote':		 13,		// can vote for a relation message posted to the stream
	'postPending':	18,		// can post messages which require manager's approval
	'post':			20,		// can post messages which take effect immediately
	'relate':	   23,		// can relate other streams to this one
	'relations':	25,		// can update properties of relations directly
	'suggest':	  28,		// can suggest edits of stream
	'edit':			30,		// can edit stream content immediately
	'closePending':	35,		// can post a message requesting to close the stream
	'close':		40,		// don't delete, just prevent any new changes to stream
	// however, joining and leaving is still ok
	'max':	  	40  	// max write level
};

/**
 * Admin levels
 * @property ADMIN_LEVEL
 * @type Object
 */
/**
 * Cannot do anything related to admin / users
 * @property ADMIN_LEVEL.none
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can prove things about the stream's content or participants
 * @property ADMIN_LEVEL.tell
 * @type integer
 * @default 10
 * @final
 */
/**
 * Able to create invitations for others, granting access
 * and permissions up to what they themselves have
 * @property ADMIN_LEVEL.invite
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can approve posts, and give people any adminLevel < 'manage'
 * @property ADMIN_LEVEL.manage
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can give people any adminLevel <= 'own'
 * @property ADMIN_LEVEL.own
 * @type integer
 * @default 40
 * @final
 */
/**
 * Max admin level
 * @property ADMIN_LEVEL.max
 * @type integer
 * @default 40
 * @final
 */
Streams.ADMIN_LEVEL = {
	'none':	 		0,		// cannot do anything related to admin / users
	'tell':	 		10,		// can prove things about the stream's content or participants
	'invite':		20,		// able to create invitations for others, granting access
	'manage':		30,		// can approve posts and give people any adminLevel < 30
	'own':	 		40,		// can give people any adminLevel <= 40
	'max':		  40  	// max admin level
};

Streams.defined = {};

Streams.options = {
	overrideUserRegistrationForm: true
};

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
 * @param {String|Number|false} [basename=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
 * @return {String} the url
 */
Streams.iconUrl = function(icon, basename) {
	if (!icon) {
		console.warn("Streams.iconUrl: icon is empty");
		return '';
	}
	if ((basename === true) // for backward compatibility
	|| (!basename && basename !== false)) {
		basename = '40';
	}
	basename = (String(basename).indexOf('.') >= 0) ? basename : basename+'.png';
	var src = Q.interpolateUrl(icon + (basename ? '/' + basename : ''));
	return src.isUrl() || icon.substr(0, 2) == '{{'
		? src
		: Q.url('{{Streams}}/img/icons/'+src);
};

var _socket = null;
var _messageHandlers = {};
var _ephemeralHandlers = {};
var _seenHandlers = {};
var _avatarHandlers = {};
var _constructHandlers = {};
var _refreshHandlers = {};
var _beforeSetHandlers = {};
var _beforeSetAttributeHandlers = {};
var _streamMessageHandlers = {};
var _streamEphemeralHandlers = {};
var _streamFieldChangedHandlers = {};
var _streamAttributeHandlers = {};
var _streamClosedHandlers = {};
var _streamRelatedFromHandlers = {};
var _streamRelatedToHandlers = {};
var _streamUnrelatedFromHandlers = {};
var _streamUnrelatedToHandlers = {};
var _streamUpdatedRelateFromHandlers = {};
var _streamUpdatedRelateToHandlers = {};
var _streamConstructHandlers = {};
var _streamRefreshHandlers = {};
var _retain = undefined;
var _retainedByKey = {};
var _retainedByStream = {};
var _retainedStreams = {};
var _retainedNodes = {};

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
	if (!code && !err) {
		return;
	}
	var errors = data && data.errors
		&& (data[0] && data[0].errors)
		&& (data[1] && data[1].errors);
	console.warn(err, data);
}, 'Streams.onError');

/**
 * Returns Q.Event that occurs after the system learns of a new ephemeral payload came in on a stream.
 * @event onMessage
 * @static
 * @param {String} [streamType] id of publisher which is publishing the stream
 * @param {String} [payloadType] type of the message, or its ordinal, pass "" for all types
 */
Streams.onEphemeral = Q.Event.factory(_ephemeralHandlers, ["", ""]);

/**
 * Returns Q.Event that occurs after the system learns of a new message that was posted.
 * The platform makes sure the ordinals come in the right order, for each stream.
 * So you just have to handle the messages to update your tools, pages, etc.
 * By the time this event happens, the platform has already taken any default actions
 * for standard events such as "Streams/join", etc. so the stream and all caches
 * are up-to-date, e.g. the participants include the newly joined participant, etc.
 * @event onMessage
 * @param {String} streamType type of the stream to which a message is posted, pass "" for all types
 * @param {String} messageType type of the message, pass "" for all types
 * @return {Q.Event}
 */
Streams.onMessage = Q.Event.factory(_messageHandlers, ["", ""]);

/**
 * Returns Q.Event that occurs on a message coming in that hasn't been seen yet.
 * You can call .seen() on the message to mark it as seen, otherwise if no
 * handlers mark it seen, some other code might show a badge for "unseen" messages.
 * @event onMessageUnseen
 * @param {Streams.Stream} stream
 * @param {Streams.Message} message
 * @return {Q.Event}
 */
Streams.onMessageUnseen = new Q.Event();

/**
 * Returns Q.Event that occurs after a stream is constructed on the client side
 * @event onConstruct
 * @param {String} type type of the stream being constructed on the client side
 * @return {Q.Event}
 */
Streams.onConstruct = Q.Event.factory(_constructHandlers, [""]);

/**
 * Returns Q.Event that occurs when a stream is obtained via Streams.get()
 * and gets pulled from the server again (whether it changed or not).
 * If you just want to take some action whenever any field in the stream changes
 * (via Stream.update() method, which is called for most standard Streams/ messages)
 * then use the Streams.Stream.onFieldChanged event factory instead.
 * @event onRefresh
 * @param {String} type type of the stream being refreshed on the client side
 * @return {Q.Event}
 */
Streams.onRefresh = Q.Event.factory(_refreshHandlers, [""]);

/**
 * Returns Q.Event that occurs when an avatar has been returned, possibly
 * because it was refreshed. Any tools displaying an avatar should
 * add a handler to this event, and refresh their avatar displays.
 * @event onAvatar
 * @param {String} userId the id of the user whose avatar it is
 * @return {Q.Event}
 */
Streams.onAvatar = Q.Event.factory(_avatarHandlers, [""]);

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
 * Event occurs when the user enters their full name after following an invite,
 * completing their registration
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
	Streams.retainWith('Streams')
		.get(Users.loggedInUser.id, 'Streams/participating', function () {
			Q.each(_retainedByStream, function _connectRetainedNodes(ps) {
				var stream = _retainedStreams[ps];
				if (stream && stream.participant) {
					var parts = ps.split("\t");
					Users.Socket.connect(Q.nodeUrl({
						publisherId: parts[0],
						streamName: parts[1]
					}));
				}
			});
		});
	if (refresh) {
		_debouncedRefresh();
	}
}

/**
 * Disconnects all Streams sockets which have been connected.
 * Note that this also affects other plugins that might be listening on the sockets
 * (maybe we should have another thing, I don't know, but for now it's ok).
 * @private
 * @static
 * @method _disconnectSockets
 */
function _disconnectSockets() {
	Q.Socket.disconnectAll();
}

/**
 * A convenience method to get the URL of the streams-related action
 * @static
 * @method actionUrl
 * @param {String} publisherId The id of the publisher
 * @param {String} streamName The name of the stream
 * @param {String} [what='stream'] Can be one of 'stream', 'message', 'relation', etc.
 * @return {String} The corresponding URL
 */
Streams.actionUrl = function(publisherId, streamName, what) {
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
	"Users/avatar"		 : "{{Streams}}/js/tools/avatar.js", // override for Users/avatar tool
	"Streams/chat"		 : "{{Streams}}/js/tools/chat.js",
	"Streams/mentions/chat": "{{Streams}}/js/tools/mentions/chat.js",
	"Streams/comments"	 : "{{Streams}}/js/tools/comments.js",
	"Streams/photoSelector": "{{Streams}}/js/tools/photoSelector.js",
	"Streams/userChooser"  : "{{Streams}}/js/tools/userChooser.js",
	"Streams/participants" : "{{Streams}}/js/tools/participants.js",
	"Streams/basic"		: "{{Streams}}/js/tools/basic.js",
	"Streams/access"	   : "{{Streams}}/js/tools/access.js",
	"Streams/subscription" : "{{Streams}}/js/tools/subscription.js",
	"Streams/interests"	: "{{Streams}}/js/tools/interests.js",
	"Streams/lookup"	   : "{{Streams}}/js/tools/lookup.js",
	"Streams/relate"	   : "{{Streams}}/js/tools/relate.js",
	"Streams/related"	  : "{{Streams}}/js/tools/related.js",
	"Streams/related/menu"	  : "{{Streams}}/js/tools/related/menu.js",
	"Streams/inplace"	  : "{{Streams}}/js/tools/inplace.js",
	"Streams/html"		 : "{{Streams}}/js/tools/html.js",
	"Streams/preview"  	   : "{{Streams}}/js/tools/preview.js",
	"Streams/image/preview": "{{Streams}}/js/tools/image/preview.js",
	"Streams/image/chat": "{{Streams}}/js/tools/image/chat.js",
	"Streams/file/preview" : "{{Streams}}/js/tools/file/preview.js",
	"Streams/category/preview" : "{{Streams}}/js/tools/category/preview.js",
	"Streams/category"	 : "{{Streams}}/js/tools/category.js",
	"Streams/form"		 : "{{Streams}}/js/tools/form.js",
	"Streams/import"	   : "{{Streams}}/js/tools/import.js",
	"Streams/activity"	 : "{{Streams}}/js/tools/activity.js",
	"Streams/audioVisualization"	 : "{{Streams}}/js/tools/webrtc/audioVisualization.js",
	"Streams/webrtc"	   : "{{Streams}}/js/tools/webrtc/webrtc.js",
	"Streams/webrtc/preview" : "{{Streams}}/js/tools/webrtc/preview.js",
	"Streams/webrtc/controls"  : "{{Streams}}/js/tools/webrtc/controls.js",
	"Streams/webrtc/streamingEditor"  : "{{Streams}}/js/tools/webrtc/livestreamingEditor.js",
	"Streams/webrtc/livestreamInstructions"  : "{{Streams}}/js/tools/webrtc/livestreamInstructions.js",
	"Streams/fileManager"  : "{{Streams}}/js/tools/fileManager.js",
	"Streams/image/album": "{{Streams}}/js/tools/album/tool.js",
	"Streams/default/preview": "{{Streams}}/js/tools/default/preview.js",
	"Streams/question/preview": "{{Streams}}/js/tools/question/preview.js",
	"Streams/answer/preview": "{{Streams}}/js/tools/answer/preview.js",
	"Streams/question": "{{Streams}}/js/tools/question.js",
	"Streams/player": function () {
		// does nothing
	},
	"Streams/audio/preview" : "{{Streams}}/js/tools/audio/preview.js",
	"Streams/audio/chat" : "{{Streams}}/js/tools/audio/chat.js",
	"Streams/video/preview" : "{{Streams}}/js/tools/video/preview.js",
	"Streams/video/chat" : "{{Streams}}/js/tools/video/chat.js",
	"Streams/pdf/preview" : "{{Streams}}/js/tools/pdf/preview.js",
	"Streams/pdf/chat" : "{{Streams}}/js/tools/pdf/chat.js",
	"Streams/album/preview": "{{Streams}}/js/tools/album/preview.js",
	"Streams/chat/preview": "{{Streams}}/js/tools/chat/preview.js",
	"Streams/topic/preview": "{{Streams}}/js/tools/experience/preview.js",
	"Streams/experience": "{{Streams}}/js/tools/experience/tool.js",
	"Streams/calls": "{{Streams}}/js/tools/calls.js"
});

Q.Tool.onActivate("Streams/chat").set(function () {
	$(this.element)
	.tool('Streams/mentions/chat')
	.tool('Streams/audio/chat')
	.tool('Streams/video/chat')
	.tool('Streams/pdf/chat')
	.tool('Streams/image/chat')
	.activate();
}, 'Streams');

/**
 * Streams batch getter.
 * @static
 * @method get
 * @param {String} publisherId Publisher's user id
 * @param {String} name Name of the stream published by this publisher
 * @param {Function} callback
 *	If there were errors, first parameter is an array of errors.
 *  Otherwise, first parameter is null and second parameter is a Streams.Stream object
 * @param {object} [extra] Optional object which can include the following keys:
 *   @param {Number|Object} [extra.participants=0] Optionally fetch up to that many participants
 *   @param {Number|Object} [extra.messages=0] Optionally fetch up to that many latest messages
 *   @param {String} [extra.messageType] optional String specifying the type of messages to fetch
 *   @param {Array} [extra.withMessageTotals] an array of message types to get messageTotals for in the returned stream object
 *   @param {Array} [extra.withRelatedToTotals] an array of relation types to get relatedToTotals for in the returned stream object
 *   @param {Array} [extra.withRelatedFromTotals] an array of relation types to get relatedFromTotals for in the returned stream object
 *   @param {Boolean} [extra.cacheIfMissing] defaults to false. If true, caches the "missing stream" result.
 *   @param {Array} [extra.fields] the stream is obtained again from the server
 *	if any fields named in this array are == null
 *   @param {Mixed} [extra."$Module_$fieldname"] any other fields you would like can be added, to be passed to your hooks on the back end
 */
Streams.get = function _Streams_get(publisherId, streamName, callback, extra) {
	var args = arguments;
	var f;
	var url = Q.action('Streams/stream?') +
		Q.queryString({"publisherId": publisherId, "name": streamName});
	var slotNames = ['stream'];
	if (!publisherId) {
		throw new Q.Error("Streams.get: publisherId is empty");
	}
	if (!streamName) {
		throw new Q.Error("Streams.get: streamName is empty");
	}
	if (extra) {
		if (extra.participants) {
			url += '&'+$.param({"participants": extra.participants});
			slotNames.push('participants');
		}
		if (extra.messages) {
			url += '&'+$.param({messages: extra.messages});
			slotNames.push('messages');
		}
		if (f = extra.fields) {
			for (var i=0, l=f.length; i<l; ++i) {
				var cached = Streams.get.cache.get([publisherId, streamName]);
				if (cached && cached.subject.fields[f[i]] == null) {
					Streams.get.forget(publisherId, streamName, null, extra);
					break;
				}
			}
		}
	}
	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'stream', slotNames, publisherId, streamName,
		function Streams_get_response_handler (err, data) {
			var msg = Q.firstErrorMessage(err, data);
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
					Streams.get.forget.apply(this, args);
					setTimeout(function () {
						Streams.get.forget.apply(this, args);
					}, 0);
				}
				Streams.onError.handle.call(this, err, data);
				Streams.get.onError.handle.call(this, err, data);
				return callback && callback.call(this, err, data);
			}
			if (Q.isEmpty(data.stream)) {
				var msg = "Stream " + publisherId + " " + streamName + " is not available";
				var err = msg;
				Streams.onError.handle(err, [err, data, null]);
				return callback && callback.call(null, err, null, extra);
			}
			Stream.construct(
				data.stream,
				{
					messages: data.messages,
					participants: data.participants
				},
				function Streams_get_construct_handler(err, stream, extra) {
					var msg;
					if (msg = Q.firstErrorMessage(err)) {
						Streams.onError.handle(msg, [err, data, stream]);
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
					Streams.get.onStream.handle.call(stream);
					return ret;
				},
				true // so the callback will already have the cache set
			);
		}, extra);
	_retain = undefined;
};

/**
 * Occurs when Streams.get encounters an error loading a stream from the server
 * @event get.onError
 */
Streams.get.onError = new Q.Event();
/**
 * Occurs when Streams.get constructs a stream loaded from the server
 * @event get.onStream
 */
Streams.get.onStream = new Q.Event();

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
		_Streams_batchFunction_options[action]
	);
};
Streams.batchFunction.functions = {};

var _Streams_batchFunction_options = {
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
 *  Should contain at least the publisherId and type of the stream.
 *  Fields are passed to the Streams/stream POST handler.
 *  The attributes field can be an object.
 * @param {Function} callback
 *	if there were errors, first parameter is the error message
 *  otherwise, first parameter is null and second parameter is a Streams.Stream object
 * @param {Object} [related] Optional information to add a relation from the newly created stream to another one. Can include:
 *   @param {String} [related.publisherId] the id of whoever is publishing the related stream
 *   @param {String} [related.streamName] the name of the related stream
 *   @param {Mixed} [related.type] the type of the relation
 *   @param {Mixed} [related.weight] the type of the relation
 * @param {Object} [options] Any extra options involved in creating the stream
 *   @param {Object} [options.fields] Used to override any other fields passed in the request
 *   @param {Object} [options.streamName] Overrides fields.name . You can set a specific stream name from Streams/possibleUserStreams config
 *   @param {String} [options.filename] Overrides the default filename for file uploads
 *   @param {HTMLElement} [options.form] If you want to upload a file or an icon, pass
 *	a form element here which includes input elements of type "file", named "file" or "icon".
 *	If they have files selected in them, they will be passed along with the rest of the
 *	fields. Setting this option will cause a call to Q.formPost which will load the result
 *	in an iframe. That resulting webpage must contain javascript to call the resultFunction.
 * @param {String} [options.resultFunction=null] The path to the function to handle inside the
 *	contentWindow of the resulting iframe, e.g. "Foo.result".
 *	Your document is supposed to define this function if it wants to return results to the
 *	callback's second parameter, otherwise it will be undefined
 */
Streams.create = function (fields, callback, related, options) {
	var slotNames = ['stream'];
	var options = options || {};
	fields = Q.copy(fields);
	if (options.fields) {
		Q.extend(fields, 10, options.fields);
	}
	if (options.streamName) {
		fields.name = options.streamName;
	}
	if (fields.icon) {
		slotNames.push('icon');
	}
	if (fields.attributes && typeof fields.attributes === 'object') {
		fields.attributes = JSON.stringify(fields.attributes);
	}
	if (related) {
		if (!related.publisherId || !related.streamName) {
			throw new Q.Error("Streams.create related needs publisherId and streamName");
		}
		fields['Q.Streams.related.publisherId'] = related.publisherId || related.publisherId;
		fields['Q.Streams.related.streamName'] = related.streamName || related.streamName || related.name;
		fields['Q.Streams.related.type'] = related.type;
		fields['Q.Streams.related.weight'] = related.weight;
		slotNames.push('messageTo');
	}
	var baseUrl = Q.baseUrl({
		publisherId: fields.publisherId,
		streamName: "" // NOTE: the request is routed to wherever the "" stream would have been hosted
	});
	fields["Q.clientId"] = Q.clientId();
	if (options.form) {
		fields["file"] = {
			path: 'Q/uploads/Streams'
		}
	}
	var _r = _retain;
	Q.req('Streams/stream', slotNames, function Stream_create_response_handler(err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Streams.create.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		if (related) {
			Streams.related.cache.removeEach([related.publisherId, related.streamName]);
		}
		Stream.construct(data.slots.stream, {},
			function Stream_create_construct_handler (err, stream) {
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
					var m = extra.messageTo = Streams.Message.construct(data.slots.messageTo, true);
					extra.related = {
						publisherId: related.publisherId,
						streamName: related.streamName,
						type: related.type,
						weight: m.getInstruction('weight')
					};
				}
				callback && callback.call(stream, null, stream, extra, data.slots);
				// process various messages posted to Streams/participating
				_refreshUnlessSocket(Users.loggedInUserId(), 'Streams/participating');
				if (related) {
					// process possible relatedTo messages posted
					_refreshUnlessSocket(related.publisherId, related.streamName);
				}
				return;
			}, true);
	}, {
		method: 'post',
		fields: fields,
		baseUrl: baseUrl,
		form: options.form,
		resultFunction: options.resultFunction
	});
	_retain = undefined;
};
/**
 * Occurs when Streams.create encounters an error trying to create a stream on the server
 * @event create.onError
 */
Streams.create.onError = new Q.Event();

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
	 * @param {String} publisherId id of publisher which is publishing the stream
	 * @param {String} streamName the stream's name
	 * @param {Function} callback The function to call after dialog is activated
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
	 * @param {String} publisherId id of publisher which is publishing the stream
	 * @param {String} streamName the stream's name
	 * @param {Function} [callback] The function to call after dialog is activated
	 */
	access: function(publisherId, streamName, callback) {
		_toolInDialog('Streams/access', {
			publisherId: publisherId,
			streamName: streamName
		}, callback, 'Streams_access_tool_dialog_container');
	},

	/**
	 * Show a dialog to invite others to a stream.
	 * @static
	 * @method invite
	 * @param {String} publisherId id of publisher which is publishing the stream
	 * @param {String} streamName the stream's name
	 * @param {Function} [callback] The function to call after dialog is activated.
	 *  It is passed an object with keys "suggestion", "stream", "data"
	 * @param {object} [options] Different options
	 * @param {string} [options.title] Custom dialog title
	 * @param {string} [options.token] Use to set the invite token, if you have enough permissions
	 * @param {String} [options.userChooser=false] If true allow to invite registered users with Streams/userChooser tool.
	 */
	invite: function(publisherId, streamName, callback, options) {
		var stream = null;
		var text = null;
		options = Q.extend({}, Streams.Dialogs.invite.options, options);

		var suggestion = null, data = null;
		var fields = {
			publisherId: publisherId,
			streamName: streamName
		};
		if (options.token) {
			fields.token = options.token;
		}
		Q.req('Streams/invite', ['suggestion', 'data'], function (err, response) {
			var slots = response && response.slots;
			if (slots) {
				suggestion = slots.suggestion;
				data = slots.data;
				$('.Streams_invite_dialog').addClass('Streams_suggestion_ready');
			}
		}, {
			fields: fields
		});

		// detect if cordova or Contacts Picker API available.
		var isContactsPicker = Q.info.isCordova || ('contacts' in navigator && 'ContactsManager' in window);

		var pipe = Q.pipe(['stream', 'text'], function () {
			var copyLinkText = text.copyLink.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap});
			if (Q.getObject("share", navigator)) {
				copyLinkText = text.shareOrCopyLink.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap});
			}

			Q.Dialogs.push({
				title: options.title || text.title,
				template: {
					name: options.templateName,
					fields: {
						isContactsPicker: isContactsPicker,
						userChooser: options.userChooser,
						text: text,
						photo: (options.photo)? text.photo: options.photo,
						to: text.to.interpolate({"Stream Title": stream.fields.title}),
						copyLink: copyLinkText,
						QR: text.QR.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap})
					}
				},
				stylesheet: '{{Streams}}/css/Streams/invite.css',
				className: 'Streams_invite_dialog',
				onActivate: function (dialog) {
					if (data) {
						dialog.addClass('Streams_suggestion_ready');
					}

					var $eContacts = $(".Streams_invite_contacts", dialog);

					var _renderInviteList = function (contacts) {
						Q.Template.render("Users/templates/contacts/display", {
							contacts: contacts,
							text: text
						}, function (err, html) {
							if (err) {
								return;
							}

							$eContacts.html(html).activate();

							$("button.Streams_invite_submit_contact", $eContacts).on(Q.Pointer.fastclick, function () {
								var inviteParams;
								for(var i in contacts) {
									inviteParams = {
										stream: stream,
										data: data
									};

									if (contacts[i].prefix === "user") {
										inviteParams.userId = contacts[i]["id"];
									} else {
										inviteParams.identifier = contacts[i][contacts[i].prefix];
									}
									Q.handle(callback, Streams, [inviteParams]);
								}
								Q.Dialogs.pop(); // close the Dialog
							});

							$(".qp-communities-close", $eContacts).on(Q.Pointer.fastclick, function () {
								var $this = $(this);
								var id = $this.attr('data-id');
								$this.closest("tr").remove();
								delete contacts[id];

								$eContacts.data("contacts", contacts);

								if ($.isEmptyObject(contacts)) {
									$("button.Streams_invite_submit_contact", $eContacts).remove();
								}
							});
						});
					};

					// invite user from registered users
					var userChooserTool = Q.Tool.from($(".Streams_userChooser_tool", dialog), "Streams/userChooser");
					if (userChooserTool) {
						userChooserTool.state.resultsHeight = 180;
						userChooserTool.stateChanged("resultsHeight");
						userChooserTool.state.onChoose.set(function (userId, avatar) {
							var contacts = $eContacts.data("contacts") || {};
							contacts[userId] = {id: userId, name: avatar.displayName(), prefix: "user"}

							_renderInviteList(contacts);

							$eContacts.data("contacts", contacts);

							/*Q.handle(callback, Streams, [{
								userId: userId,
								stream: stream,
								data: data
							}]);
							Q.Dialogs.pop(); // close the Dialog*/

						}, "Streams_invite_dialog");
					}

					// handle "choose from contacts" button
					$('.Streams_invite_choose_contact', dialog).on(Q.Pointer.fastclick, function () {
						var $this = $(this);
						$eContacts.empty();

						var params = {
							prefix: "Users",
							data: $eContacts.data("contacts") || null,
							identifierTypes: options.identifierTypes
						};

						$this.addClass('loading');

						Users.Dialogs.contacts(params, function (contacts) {
							$this.removeClass('loading');
							$eContacts.data("contacts", contacts);

							if (!contacts || Object.keys(contacts).length <= 0) {
								return;
							}

							_renderInviteList(contacts);

							$this.text(text.chooseAgainFromContacts).addClass("");
						})
					});

					if (!Q.info.isTouchscreen) {
						$('.Streams_invite_submit input[type=text]').focus();
						setTimeout(function () {
							$('.Streams_invite_submit input[type=text]').plugin('Q/clickfocus');
						}, 300);
					}
					// handle go button
					$('.Streams_invite_submit').on('submit', function (e) {
						Q.handle(callback, Streams, [{
							identifier: $("input[type=text]", this).val(),
							stream: stream,
							data: data,
							appUrl: options.appUrl
						}]);
						Q.Dialogs.pop(); // close the Dialog
						e.preventDefault();
					});

					// handle social buttons
					$('.Streams_invite_social_buttons button, .Streams_invite_QR', dialog)
					.on(Q.Pointer.fastclick, function () {
						var sendBy = $(this).data('sendby');
						var result = {
							token: suggestion,
							identifier: null,
							sendBy: sendBy,
							stream: stream,
							data: data,
							appUrl: options.appUrl
						};
						Q.Dialogs.pop(); // close the Dialog
						Q.handle(callback, Streams, [result]);
					});
					
					// handle social buttons
					$('.Streams_invite_social_buttons button, .Streams_invite_copyLink', dialog)
					.on(Q.Pointer.fastclick, function () {
						var sendBy = $(this).data('sendby');
						var result = {
							token: suggestion,
							identifier: null,
							sendBy: sendBy,
							stream: stream,
							data: data,
							appUrl: options.appUrl
						};
						Q.Dialogs.pop(); // close the Dialog
						Q.handle(callback, Streams, [result]);
					});
				}
			});
		});

		Q.Text.get("Streams/content", function (err, result) {
			text = Q.getObject(["invite", "dialog"], result);
			pipe.fill('text')();
		});

		Streams.get(publisherId, streamName, function() {
			stream = this;
			pipe.fill('stream')();
		});
	}
};

Streams.Dialogs.invite.options = {
	templateName: "Streams/templates/invite/dialog",
	photo: true
};

/**
 * @class Streams
 */

/**
 * Refreshes all the streams the logged-in user is participating in
 * If your app is using socket.io, then calling this manually is largely unnecessary.
 * @static
 * @method refresh
 * @param {Function} callback optional callback
 * @param {Object} [options] A hash of options, including:
 *   @param {Boolean} [options.messages] If set to true, then besides just reloading the stream, attempt to catch up on the latest messages
 *   @param {Number} [options.max] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Array} [options.duringEvents] Streams.refresh.options.duringEvents are the window events that can lead to an automatic refresh
 *   @param {Number} [options.minSeconds] Streams.refresh.options.minEvents is the minimum number of seconds to wait between automatic refreshes
 *   @param {Number} [options.timeout] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket] Whether to avoid doing any requests when a socket is attached
 *   @param {Object} [options.changed=null] An Object of {fieldName: true} pairs naming fields to trigger change events for, even if their values stayed the same.
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
		Q.handle(callback, this, [false]);
		return false;
	}
	Streams.refresh.lastTime = now;
	var p = new Q.Pipe(Object.keys(_retainedByStream), callback);
	Streams.refresh.beforeRequest.handle(callback, Streams, options);
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
 * @return {Object} returns Streams object for chaining with .get() or .related()
 */
Streams.retainWith = function (key) {
	_retain = Q.calculateKey(key, _retainedByKey);
	return Streams;
};

/**
 * Releases all retained streams under a given key. See Streams.retain()
 * It also closes sockets corresponding to all the released streams,
 * if they were the last streams to be retained on their respective nodes.
 * @static
 * @method release
 * @param {String} key
 */
Streams.release = function (key) {
	key = Q.calculateKey(key);
	if (_retainedByKey[key]) {
		for (var ps in _retainedByKey) {
			if (!_retainedByStream[ps]) {
				continue;
			}
			delete _retainedByStream[ps][key];
			if (Q.isEmpty(_retainedByStream[ps])) {
				delete(_retainedByStream[ps]);
				delete(_retainedStreams[ps]);
			}
			var parts = ps.split("\t");
			var nodeUrl = Q.nodeUrl({
				publisherId: parts[0],
				streamName: parts[1]
			});
			var hasNode = !Q.isEmpty(_retainedNodes[nodeUrl]);
			delete _retainedNodes[nodeUrl][ps];
			if (hasNode && Q.isEmpty(_retainedNodes[nodeUrl])) {
				delete(_retainedNodes[nodeUrl]);
				var socket = Users.Socket.get(nodeUrl);
				socket && socket.disconnect();
			}
		}
	}
	delete _retainedByKey[key];
};

/**
 * Invite other users to a stream. Must be logged in first.
 * @static
 * @method invite
 * @param {String} publisherId The user id of the publisher of the stream
 * @param {String} streamName The name of the stream you are inviting to
 * @param {Object} [options] More options that are passed to the API, which can include:
 * @param {String|Array} [options.identifier] An email address or mobile number to invite. Might not belong to an existing user yet. Can also be an array of identifiers.
 * @param {boolean} [options.token=false] Pass true here to generate an invite
 *	which you can then send to anyone however you like. When they show up with the token
 *	and presents it via "Q.Streams.token" querystring parameter, the Streams plugin
 *	will accept this invite either right away, or as soon as they log in.
 *	They will then be added to the list of Streams_Invited for this stream, thus
 *	keeping track of who accepted whose invite.
 * @param {String|Function} [options.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 * @param {String} [options.userId] user id or an array of user ids to invite
 * @param {string} [options.platform] platform for which xids are passed
 * @param {String} [options.xid] xid or arary of xids to invite
 * @param {String} [options.label] label or an array of labels to invite, or tab-delimited string
 * @param {String|Array} [options.addLabel] label or an array of labels for adding publisher's contacts
 * @param {String|Array} [options.addMyLabel] label or an array of labels for adding logged-in user's contacts
 * @param {String} [options.readLevel] the read level to grant those who are invited
 * @param {String} [options.writeLevel] the write level to grant those who are invited
 * @param {String} [options.adminLevel] the admin level to grant those who are invited
 * @param {String} [options.callback] Also can be used to provide callbacks, which are called before the followup.
 * @param {Boolean} [options.followup="future"] Whether to set up a followup email or sms for the user to send. Set to true to always send followup, or false to never send it. Set to "future" to send followups only to users who haven't registered yet.
 * @param {String} [options.uri] If you need to hit a custom "Module/action" endpoint
 * @param {String} [options.title] Custom dialog title.
 * @param {String} [options.userChooser=false] If true allow to invite registered users with Streams/userChooser tool.
 * @param {Function} callback Called with (err, result) .
 *   In this way you can obtain the invite token, email addresses, etc.
 *   See Streams::invite on the PHP side for the possible return values.
 *   This is called before the followup flow.
 * @return {Q.Request} represents the request that was made if an identifier was provided
 */
Streams.invite = function (publisherId, streamName, options, callback) {
	// TODO: start integrating this with Cordova methods to invite people
	// from your contacts or facebook flow.
	// Follow up with the Groups app, maybe! :)
	var loggedUserId = Users.loggedInUserId();
	if (!loggedUserId) {
		Q.handle(callback, null, ["Streams.invite: not logged in"]);
		return false; // not logged in
	}
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var o = Q.extend({
		uri: 'Streams/invite'
	}, Streams.invite.options, options);
	o.publisherId = publisherId;
	o.streamName = streamName;
	if (typeof o.appUrl === 'function') {
		o.appUrl = o.appUrl();
	}
	function _request() {
		return Q.req(o.uri, ['data'], function (err, response) {
			var msg = Q.firstErrorMessage(err, response && response.errors);
			if (msg) {
				alert(msg);
				var args = [err, response];
				return Streams.onError.handle.call(this, msg, args);
			}
			Participant.get.cache.removeEach([publisherId, streamName]);
			Streams.get.cache.removeEach([publisherId, streamName]);
			var rsd = response.slots.data;
			Q.handle(o && o.callback, null, [err, rsd]);
			Q.handle(callback, null, [err, rsd]);
			var emailAddresses = [];
			var mobileNumbers = [];
			var fb_xids = [];
			// The invite mechanism allows clients to know whether
			// certain identifiers are verified with the site or not,
			// but will not let clients know which userIds they correspond to.
			Q.each(rsd.statuses, function (i, s) {
				// The invite mechanism no longer leak participant userIds to clients,
				// so you can't match external identifiers to userIds
				// That is why rsd.alreadyParticipating is no longer returned:
				// if (rsd.alreadyParticipating.indexOf(userId) >= 0) {
				// 	return;
				// }
				var shouldFollowup = (o.followup === true)
					|| (o.followup !== false && s === 'future');
				if (!shouldFollowup) {
					return; // next one
				}
				var identifier = rsd.identifiers[i];
				var identifierType = rsd.identifierTypes[i];
				switch (identifierType) {
					case 'userId': break;
					case 'email': emailAddresses.push(identifier); break;
					case 'mobile': mobileNumbers.push(identifier); break;
					case 'facebook':
						if (shouldFollowup === true) {
							fb_xids.push(identifier[i]);
						}
						break;
					case 'label':
					case 'newFutureUsers':
					default:
						break;
				}
			});
			Streams.followup({
				mobile: {
					numbers: mobileNumbers
				},
				email: {
					addresses: emailAddresses
				},
				facebook: {
					xids: fb_xids
				}
			}, callback);
		}, { method: 'post', fields: o, baseUrl: baseUrl });
	}
	function _sendBy(r, text) {
		// Send a request to create the actual invite
		Q.req(o.uri, ['data', 'stream'], function (err, response) {
			var msg = Q.firstErrorMessage(err, response && response.errors);
			if (msg) {
				alert(msg);
				var args = [err, response];
				return Streams.onError.handle.call(this, msg, args);
			}
			Q.handle(o && o.callback, null, [err, rsd]);
			Q.handle(callback, null, [err, rsd]);
		}, {
			method: 'post',
			fields: o,
			baseUrl: baseUrl
		});
		if (o.photo) {
			var photo = o.photo;
			delete o.photo;
		}
		var rsd = r.data;
		var rss = r.stream;
		var t;
		switch (o.sendBy) {
		case "email":
			t = Q.extend({
				url: rsd.url,
				title: rss.fields.title
			}, 10, text);
			Q.Template.render("Streams/templates/invite/email", t,
				function (err, body) {
					if (err) return;
					var subject = Q.getObject(['invite', 'email', 'subject'], text);
					var url = Q.Links.email(subject, body);
					window.location = url;
				});
			break;
		case "text":
			var content = Q.getObject(['invite', 'sms', 'content'], text)
				.interpolate({
					url: rsd.url,
					title: rss.fields.title
				});
			t = Q.extend({
				content: content,
				url: rsd.url,
				title: streamName
			}, 10, text);
			Q.Template.render("Streams/templates/invite/sms", t,function (err, text) {
				if (err) {
					return;
				}

				window.location = Q.Links.sms(text);
			});
			break;
		case "facebook":
			window.open("https://www.facebook.com/sharer/sharer.php?u=" + rsd.url, "_blank");
			break;
		case "twitter":
			window.open("http://www.twitter.com/share?url=" + rsd.url, "_blank");
			break;
		case "copyLink":
			if (Q.getObject("share", navigator)) {
				navigator.share({url: rsd.url});
			} else {
				Q.Clipboard.copy(rsd.url);
				Q.Text.get("Streams/content", function (err, result) {
					var text = result && result.invite;
					if (text) {
						var element = Q.alert(text.youCanNowPaste, {
							title: ''
						});
						setTimeout(function () {
							if (element === Q.Dialogs.element()) {
								Q.Dialogs.pop();
							}
						}, Streams.invite.options.youCanNowPasteDuration);
					}
				});
			}
			break;
		case "QR":
			Q.Dialogs.push({
				className: 'Streams_invite_QR',
				title: Q.getObject(['invite', 'dialog', 'QRtitle'], text),
				content: '<div class="Streams_invite_QR_content"></div>'
					+ '<div class="Q_buttons">'
					+ '<button class="Q_button">'
					+ text.invite.dialog.scannedQR.interpolate(Q.text.Q.words)
					+'</button>'
					+ '</div>',
				onActivate: function (dialog) {
					// fill QR code
					Q.addScript("{{Q}}/js/qrcode/qrcode.js", function(){
						var $qrIcon = $(".Streams_invite_QR_content", dialog);
						new QRCode($qrIcon[0], {
							text: rsd.url,
							width: 250,
							height: 250,
							colorDark : "#000000",
							colorLight : "#ffffff",
							correctLevel : QRCode.CorrectLevel.H
						});
						$('.Q_button', dialog).plugin('Q/clickable')
							.on(Q.Pointer.click, function () {
								Q.Dialogs.push({
									title: Q.getObject(['invite', 'dialog', 'photo'], text),
									apply: true,
									className: "Dialog_invite_photo_camera",
									content:
										'<div class="Streams_invite_photo_dialog">' +
										'<p>'+ Q.getObject(['invite', 'dialog', 'photoInstruction'], text) +'</p>' +
										'<div class="Streams_invite_photo_camera">' +
										'<img src="' + Q.url('{{Streams}}/img/invitations/camera.svg') + '" class="Streams_invite_photo Streams_invite_photo_pulsate"></img>' +
										'</div>' +
										'</div>',
									onActivate: function (dialog) {
										// handle "photo" button
										var photo = null;
										var saveSizeName = {};
										Q.each(Users.icon.sizes, function (k, v) {
											saveSizeName[k] = v;
										});
										var o = {
											path: 'Q/uploads/Users',
											save: 'Users/icon',
											subpath: loggedUserId.splitId() + '/invited/' + rsd.invite.token,
											saveSizeName: saveSizeName,
											onFinish: function () {
												Q.Dialogs.pop();
											}
										};
										$('.Streams_invite_photo', dialog).plugin('Q/imagepicker', o);
									}
								});
							});
					});
				}
			});
			break;
		}
		return true;
	}
	if (o.identifier || o.token || o.xids || o.userIds || o.label) {
		return _request();
	}
	Q.Text.get('Streams/content', function (err, text) {
		Streams.Dialogs.invite(publisherId, streamName, function (r) {
			if (!r) return;
			for (var option in r) {
				o[option] = r[option];
			}
			if (r.sendBy) {
				_sendBy(r, text);
			} else {
				_request();
			}
		}, {
			title: o.title,
			identifierTypes: o.identifierTypes,
			userChooser: o.userChooser,
			appUrl: o.appUrl
		});
	});
	return null;
};

Streams.invite.options = {
	followup: "future",
	identifierTypes: ["email", "mobile"],
	youCanNowPasteDuration: 10000
};

/**
 * @method followup
 * @static
 * @param {Object} options
 * @param {String} [options.show="alert"] Can be "alert" or "confirm", or empty
 * @param {Object} [options.mobile]
 * @param {Array} [options.mobile.numbers] The list of phone numbers to send to
 * @param {String} [options.mobile.text] Override template for sms body
 * @param {String} [options.mobile.alert] Override template for alert
 * @param {String} [options.mobile.confirm] Override template for confirmation dialog to continue
 * @param {Object} [options.email]
 * @param {Array} [options.email.addresses] The list of email addresses to send to
 * @param {String} [options.email.subject] Override template for subject
 * @param {String} [options.email.body] Override template for email body
 * @param {String} [options.email.alert] Override template for alert
 * @param {String} [options.email.confirm] Override template for confirmation dialog to continue
 * @param {Object} options.facebook
 * @param {Array} options.facebook.xids The facebook xids to send followup push notifications to messenger
 */
Streams.followup = function (options, callback) {
	var o = Q.extend({}, Streams.followup.options, 10, options);
	var e = o.email;
	var m = o.mobile;
	if (e && e.addresses && e.addresses.length) {
		Q.Template.render({
			subject: e.subject,
			body: e.body,
			alert: e.alert,
			confirm: e.confirm
		}, Q.info, function (params) {
			if (o.show === 'alert' && params.alert[1]) {
				Q.alert(params.alert[1], { onClose: _emails, title: e.title, apply: true });
			} else if (o.show === 'confirm' && params.confirm[1]) {
				Q.confirm(params.confirm[1], function (choice) {
					choice && _emails();
				}, { title: e.title });
			} else {
				_emails();
			}
			function _emails() {
				var url = Q.Links.email(
					Q.getObject(["subject", 1], params), Q.getObject(["body", 1], params), null, null, e.addresses
				);
				Q.handle(callback, Streams, [url, e.addresses, params]);
				window.location = url;
			}
		});
	} else if (m && m.numbers && m.numbers.length) {
		Q.Template.render({
			text: m.text,
			alert: m.alert,
			confirm: m.confirm
		}, Q.info, function (params) {
			if (o.show === 'alert' && params.alert[1]) {
				Q.alert(params.alert[1], { onClose: _sms, title: m.title, apply: true });
			} else if (o.show === 'confirm' && params.confirm[1]) {
				Q.confirm(params.confirm[1], function (choice) {
					choice && _sms();
				}, { title: m.title });
			} else {
				_sms();
			}
			function _sms() {
				var url = Q.Links.sms(params.text[1], m.numbers);
				Q.handle(callback, Streams, [url, m.numbers, params]);
				window.location = url;
			}
		});
	}
};

Streams.followup.options = {
	show: "alert",
	email: {
		subject: 'Streams/followup/email/subject',
		body: 'Streams/followup/email/body',
		alert: 'Streams/followup/email/alert',
		title: Q.text.Streams.followup.email.title,
		confirm: 'Streams/followup/email/confirm'
	},
	mobile: {
		text: 'Streams/followup/mobile',
		alert: 'Streams/followup/mobile/alert',
		title: Q.text.Streams.followup.mobile.title,
		confirm: 'Streams/followup/mobile/confirm'
	}
};

/**
 * Get streams related to a given stream.
 * @static
 * @method related
 * @param {String} publisherId
 *  Publisher's user id
 * @param {String} streamName
 *	Name of the stream to/from which the others are related
 * @param {String|Array|null} relationType the type of the relation
 * @param {boolean} isCategory defaults to false. If true, then gets streams related TO this stream.
 * @param {Object} [options] optional object that can include:
 *   @param {Number} [options.limit] the maximum number of results to return
 *   @param {Number} [options.offset] the page offset that goes with the limit
 *   @param {Boolean} [options.ascending=false] whether to sort by ascending weight.
 *   @param {Number} [options.min] the minimum weight (inclusive) to filter by, if any
 *   @param {Number} [options.max] the maximum weight (inclusive) to filter by, if any
 *   @param {String} [options.prefix] optional prefix to filter the streams by
 *   @param {Array} [options.fields] if set, limits the "extended" fields exported to only these
 *   @param {Boolean} [options.stream] pass true here to fetch the latest version of the stream and ignore the cache.
 *   @param {Mixed} [options.participants]  Pass a limit here to fetch that many participants and ignore cache.
 *   @param {Boolean} [options.relationsOnly=false] Return only the relations, not the streams
 *   @param {Boolean} [options.messages] Pass a limit here to fetch that many recent messages and ignore cache.
 *   @param {Boolean} [options.withParticipant=true] Pass false here to return related streams without extra info about whether the logged-in user (if any) is a participant.
 *   @param {String} [options.messageType] optional String specifying the type of messages to fetch. Only honored if streamName is a string.
 *   @param {Object} [options."$Module/$fieldname"] any other fields you would like can be added, to be passed to your hooks on the back end
 * @param{function} callback
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and the "this" object is the data containing "stream", "relations" and "streams"
 */
Streams.related = function _Streams_related(publisherId, streamName, relationType, isCategory, options, callback) {
	if (!publisherId || !streamName) {
		throw new Q.Error("Streams.related is expecting publisherId and streamName to be non-empty");
	}
	if (typeof publisherId !== 'string') {
		throw new Q.Error("Streams.related is expecting publisherId as a string");
	}
	if ((relationType && typeof relationType !== 'string' && !Q.isArrayLike(relatedType))) {
		throw new Q.Error("Streams.related is expecting relationType as string or array");
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
	options = Q.extend({}, Streams.related.options, options);
	var near = isCategory ? 'to' : 'from',
		far = isCategory ? 'from' : 'to',
		farPublisherId = far+'PublisherId',
		farStreamName = far+'StreamName',
		slotNames = ['relations'],
		fields = {"publisherId": publisherId, "streamName": streamName};
	if (!options.relationsOnly) {
		slotNames.push('relatedStreams');
	}
	if (options.messages) {
		slotNames.push('messages');
	}
	if (options.participants) {
		slotNames.push('participants');
	}
	if (options.withParticipant) {
		fields.withParticipant = true;
	}
	if (relationType) {
		fields.type = relationType;
	}
	Q.extend(fields, options);
	fields.omitRedundantInfo = true;
	if (isCategory) {
		fields.isCategory = isCategory;
	}
	if (Q.isArrayLike(fields.fields)) {
		fields.fields = fields.join(',');
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
		var msg = Q.firstErrorMessage(err, data);
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
				msg = "Streams/related missing stream "+streamName+' published by '+publisherId;
				callback && callback.call(this, msg);
			} else {
				Stream.construct(data.slots.stream, extra, _processResults, true);
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
				Stream.construct(fields, {}, function () {
					streams[key] = this;
					p.fill(key)();
				}, true);
			});

			// Now process all the relations
			Q.each(data.slots.relations, function (j, relation) {
				relation[near] = stream;
				var key = Streams.key(relation[farPublisherId], relation[farStreamName]);
				if (!keys2[key] && relation[farPublisherId] != publisherId) {
					// Fetch all the related streams from other publishers
					keys.push(key);
					Streams.get(relation[farPublisherId], relation[farStreamName], function (err, data) {
						var msg = Q.firstErrorMessage(err, data);
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
	var nodeUrl = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	})
	var socket = Users.Socket.get(nodeUrl);
	if (!socket) {
		// do not cache relations to/from this stream
		// since they may come to be out of date
		return false;
	}
};
Streams.related.options = {
	withParticipant: true
};
/**
 * Occurs when Streams.related encounters an error loading the response from the server
 * @event related.onError
 */
Streams.related.onError = new Q.Event();

/**
 * Detect whether stream retained
 * @static
 * @method retainedByKey
 * @param {String} publisherId
 * @param {String} streamName
 * @return {Boolean} Whether stream retained (true) or not (false)
 */
Streams.retainedByKey = function (publisherId, streamName) {
	var ps = Streams.key(publisherId, streamName);
	for (var i in _retainedByKey) {
		if (Q.getObject([ps], _retainedByKey[i]) === true) {
			return true;
		}
	}

	return false;
}

/**
 * @class Streams.Stream
 */

/**
 * Constructs a stream from fields, which are typically returned from the server.
 * @class Streams.Stream
 * @constructor
 * @param {Object} fields
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
		'invitedCount',
		'participatingCount',
		'leftCount',
		'insertedTime',
		'updatedTime',
		'readLevel',
		'writeLevel',
		'adminLevel',
		'inheritAccess',
		'closedTime',
		'access',
		'messageTotals',
		'relatedToTotals',
		'relatedFromTotals',
		'isRequired',
		'participant'
	]);
	this.typename = 'Q.Streams.Stream';
	prepareStream(this, fields);
};

/**
 * This function is similar to _activateTools in Q.js
 * That one is to create "controllers" on the front end,
 * and this one is to create "models" on the front end.
 * They have very similar conventions.
 * @static
 * @method construct
 * @param {Object} fields Provide any stream fields here. Requires at least the "type" of the stream.
 * @param {Object} [extra={}] Can include "messages" and "participants"
 * @param {Function} [callback] The function to call when all constructors and event handlers have executed
 *  The first parameter is an error, in case something went wrong. The second one is the stream object.
 * @param {Boolean} [updateCache=false] Whether to update the Streams.get cache after constructing the stream
 * @return {Q.Stream}
 */
Stream.construct = function _Stream_construct(fields, extra, callback, updateCache) {

	if (typeof extra === 'function') {
		callback = extra;
		extra = null;
	}

	if (Q.typeOf(fields) === 'Q.Streams.Stream') {
		fields = Q.extend({}, fields.fields, {
			access: fields.access,
			participant: fields.participant,
			messageTotals: fields.messageTotals,
			relatedToTotals: fields.relatedToTotals,
			relatedFromTotals: fields.relatedFromTotals,
			isRequired: fields.isRequired
		});
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
					|| k === 'messageTotals'
					|| k === 'relatedToTotals'
					|| k === 'relatedFromTotals'
					|| k === 'participant'
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
				throw new Error("Stream.construct: streamFunc cannot be " + typeof(streamFunc));
			}
			return _doConstruct();
		});
		return true;
	} else if (typeof streamFunc !== 'undefined') {
		throw new Error("Stream.construct: streamFunc cannot be " + typeof(streamFunc));
	}
	function _doConstruct() {
		if (!streamFunc.streamConstructor) {
			streamFunc.streamConstructor = function Streams_Stream(fields) {
				// run any constructors
				streamFunc.streamConstructor.constructors.apply(this, arguments);

				var f = this.fields;
				if (updateCache) { // update the Streams.get cache
					if (f.publisherId && f.name) {
						Streams.get.cache
							.removeEach([f.publisherId, f.name])
							.set(
								[f.publisherId, f.name], 0,
								this, [null, this]
							);
					}
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
			streamFunc.streamConstructor.isConstructorOf = 'Q.Streams.Stream';
		}
		var stream = new streamFunc.streamConstructor(fields);
		var messages = {}, participants = {};

		updateMessageTotalsCache(fields.publisherId, fields.name, stream.messageTotals);

		if (extra && extra.messages) {
			Q.each(extra.messages, function (ordinal, message) {
				if (!(message instanceof Message)) {
					message = Message.construct(message, true);
				}
				messages[ordinal] = message;
			});
		}
		if (extra && extra.participants) {
			Q.each(extra.participants, function (userId, participant) {
				if (!(participant instanceof Participant)) {
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
};

Stream.get = Streams.get;
Stream.create = Streams.create;
Stream.define = Streams.define;

/**
 * Call this function to retain a particular stream.
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * stream.refresh() are called. You can release the stream with stream.release().
 * This method also opens a socket to the stream's node, if one isn't already open.
 *
 * @static
 * @method retain
 * @param {String} publisherId the publisher of the stream(s)
 * @param {String|Array} streamName can be a string or array of strings
 * @param {String} key the key under which to retain
 * @param {Function} callback optional callback for when stream(s) are retained
 * @return {Object} returns Streams object for chaining with .get() or .related()
 */
Stream.retain = function _Stream_retain (publisherId, streamName, key, callback) {
	if (Q.isArrayLike(streamName)) {
		var p = Q.pipe();
		var waitFor = [];
		Q.each(streamName, function (i, v) {
			Stream.retain(publisherId, v, key, p.fill(i));
			waitFor.push(i);
		});
		p.add(waitFor, function (params, subjects) {
			Q.handle(callback, Stream, [params, subjects]);
		}).run();
		return Streams;
	}
	var ps = Streams.key(publisherId, streamName);
	Streams.get(publisherId, streamName, function (err) {
		if (err) {
			_retainedStreams[ps] = null;
		} else {
			this.retain(key);
		}
		Q.handle(callback, this, [err, this]);
	});
	return Streams;
};

/**
 * Releases a stream from being retained. See Streams.Stream.retain()
 * This method also closes a socket to the stream's node,
 * if it was the last stream released on that node.
 *
 * @static
 * @method release
 * @param {String} publisherId
 * @param {String} streamName
 */
Stream.release = function _Stream_release (publisherId, streamName) {
	var ps = Streams.key(publisherId, streamName);
	if (_retainedByStream[ps]) {
		for (var key in _retainedByStream[ps]) {
			if (_retainedByKey[key]) {
				delete _retainedByKey[key][ps];
			}
			if (Q.isEmpty(_retainedByKey[key])) {
				delete _retainedByKey[key];
			}
			var nodeUrl = Q.nodeUrl({
				publisherId: publisherId,
				streamName: streamName
			});
			var hasNode = !Q.isEmpty(_retainedNodes[nodeUrl]);
			delete _retainedNodes[nodeUrl][ps];
			if (hasNode && Q.isEmpty(_retainedNodes[nodeUrl])) {
				delete(_retainedNodes[nodeUrl]);
				var socket = Users.Socket.get(nodeUrl);
				socket && socket.disconnect();
			}
		}
	}
	delete _retainedByStream[ps];
	delete _retainedStreams[ps];
};

/**
 * Refreshes a stream, to show the latest content and possibly process the latest messages posted to the stream.
 * If your app server script is running, then calling this manually is largely unnecessary because messages arrive via push using socket.io .
 * @static
 * @method refresh
 * @param {string} publisherId publisher of a stream
 * @param {string} streamName name of a stream
 * @param {Function} callback This is called when the stream has been refreshed.
 *   If the first argument is not false or null, then "this" is the stream.
 *   The arguments are different depending on the options.
 *   If options.messages is true, then it receives (err, ordinals).
 * @param {Object} [options] A hash of options, including:
 *   @param {Boolean} [options.messages] If set to true, then besides just reloading the fields, attempt to catch up on the latest messages
 *   @param {Number} [options.max] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Number} [options.timeout] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket] Whether to avoid doing any requests when a socket is attached
 *   @param {Object} [options.changed=null] An Object of {fieldName: true} pairs naming fields to trigger change events for, even if their values stayed the same.
 *   @param {Boolean} [options.evenIfNotRetained] If the stream wasn't retained (for example because it was missing last time), then refresh anyway
 *   @param {Object} [options.extra] Any extra parameters to pass to the callback
 * @return {boolean} Returns false if refresh was canceled because stream was not retained
 */
Stream.refresh = function _Stream_refresh (publisherId, streamName, callback, options) {
	var notRetained = !_retainedByStream[Streams.key(publisherId, streamName)];
	var callbackCalled = false;

	if ((notRetained && !(options && options.evenIfNotRetained))) {
		Q.handle(callback, this, [false]);
		// Streams.get.cache.removeEach([publisherId, streamName]);
		return false;
	}
	var o = options || {};
	if (o.messages) {
		// If the stream was retained, fetch latest messages,
		// and replay their being "posted" to trigger the right events
		var result = Message.wait(publisherId, streamName, -1,
			function (ordinals) {
				Q.Streams.get(publisherId, streamName, function (err) {
					if (!callbackCalled) {
						Q.handle(callback, this, [err, ordinals]);
						callbackCalled = true;
					}
				});
			}, options);
		if (result === null || result instanceof Q.Pipe) {
			// We didn't even try to wait for messages,
			// The socket will deliver them.
			if (!callbackCalled) {
				Q.handle(callback, this, [null]);
				callbackCalled = true;
			}
		}
		return result;
	}

	// We sent a request to get the latest messages.
	// But we will also force-get the stream, to trigger any handlers
	// set for the stream's onRefresh event
	Streams.get.force(publisherId, streamName, function (err, stream) {
		if (!err) {
			var ps = Streams.key(publisherId, streamName);
			if (_retainedStreams[ps]) {
				var changed = (o.changed) || {};
				Stream.update(_retainedStreams[ps], this.fields, changed || {});
				_retainedStreams[ps] = this;
			}
		}
		if (callback) {
			var params = [err, stream];
			if (o.extra) {
				params.concat(extra);
			}

			if (!callbackCalled) {
				Q.handle(callback, this, params);
				callbackCalled = true;
			}
		}
	});
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
 * @return {Object} returns Streams object for chaining with .get() or .related()
 */
Sp.retainWith = Streams.retainWith;

/**
 * Calculate the url of a stream's icon
 * @method iconUrl
 * @param {Number|false} [size=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
 * @return {String} the url
 */
Sp.iconUrl = function _Stream_prototype_iconUrl (size) {
	return Streams.iconUrl(this.fields.icon, size);
};

/**
 * Calculate the url of a stream's file
 * @method fileUrl
 * @return {String|null} the url, or null if no url
 */
Sp.fileUrl = function() {
	var url = this.getAttribute("Q.file.url") || this.getAttribute("file.url") || this.getAttribute("url");

	if (!url) {
		return null;
	}
	return url.interpolate({ "baseUrl": Q.info.baseUrl });
};

/**
 * Get all stream fields
 *
 * @method getAll
 * @param {Boolean} usePending
 * @return {Object}
 */
Sp.getAll = function _Stream_prototype_getAll (usePending) {
	return Q.copy(usePending ? this.pendingFields : this.fields);
};

/**
 * Get the value of a field
 *
 * @method get
 * @param {String} fieldName the name of the field to get
 * @param {Boolean} usePending if true, and there is a value pending to be saved, get that instead
 * @return {Mixed}
 */
Sp.get = function _Stream_prototype_get (fieldName, usePending) {
	return (fieldName in this.pendingFields)
		? this.pendingFields[fieldName]
		: this.fields[fieldName];
};

/**
 * Set the value of a field, pending to be saved to the server with the stream
 * May cause some validators to run and throw a validation exception on the value.
 *
 * @method set
 * @param {String} fieldName
 * @param {Mixed} value
 * @throws {Q.Error}
 */
Sp.set = function _Stream_prototype_set (fieldName, value) {
	var t = this.fields.type;
	Q.handle(
		Q.getObject([t, fieldName], _beforeSetHandlers),
		this,
		[value]
	);
	Q.handle(
		Q.getObject([t, ''], _beforeSetHandlers),
		this,
		[value]
	);
	if (this.pendingFields === this.fields) {
		this.pendingFields = Q.copy(this.fields); // copy on write
	}
	if (typeof fieldName === 'string') {
		this.pendingFields[fieldName] = value;
	} else {
		for (var k in fieldName) {
			this.pendingFields[k] = fieldName[k];
		}
	}
};

/**
 * Get all stream attributes
 *
 * @method getAllAttributes
 * @param {Boolean} usePending
 * @return {Object}
 */
Sp.getAllAttributes = function _Stream_prototype_getAllAttributes (usePending) {
	return usePending ? this.pendingAttributes : this.attributes;
};

/**
 * Get the value of an attribute
 *
 * @method getAttribute
 * @param {String} attributeName the name of the attribute to get
 * @param {Boolean} usePending if true, and there is a value pending to be saved, get that instead
 * @return {Mixed}
 */
Sp.getAttribute = function _Stream_prototype_getAttribute (attributeName, usePending) {
	return (attributeName in this.pendingAttributes)
		? this.pendingAttributes[attributeName]
		: this.attributes[attributeName];
};

/**
 * Set the value of an attribute, pending to be saved to the server with the stream
 *
 * @method setAttribute
 * @param {String} attributeName
 * @param {Mixed} value
 * @return Streams_Stream
 */
Sp.setAttribute = function _Stream_prototype_setAttribute (attributeName, value) {
	var t = this.fields.type;
	Q.handle(
		Q.getObject([t, attributeName], _beforeSetAttributeHandlers),
		this,
		[value]
	);
	Q.handle(
		Q.getObject([t, ''], _beforeSetAttributeHandlers),
		this,
		[value]
	);
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

	return this;
};

/**
 * Remove an attribute from the stream, pending to be saved to the server
 *
 * @method clearAttribute
 * @param {String} attributeName
 */
Sp.clearAttribute = function _Stream_prototype_clearAttribute (attributeName) {
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
 * @method getAllPermissions
 * @param {Boolean} usePending
 * @return {Array}
 */
Sp.getAllPermissions = function _Stream_prototype_getAllPermissions(usePending) {
	try {
		var permissions = usePending && this.pendingFields.permissions
			? this.pendingFields.permissions
			: this.fields.permissions;
		return permissions ? JSON.parse(permissions) : [];
	} catch (e) {
		return [];
	}
};

/**
 * @method hasPermission
 * @param {String} permission
 * @param {Boolean} usePending
 * @return {Boolean}
 */
Sp.hasPermission = function _Stream_prototype_hasPermission(permission, usePending) {
	var permissions = this.getAllPermissions(usePending);
	return (permissions.indexOf(permission) >= 0);
};

/**
 * @method addPermission
 * @param {String} permission
 */
Sp.addPermission = function (permission) {
	var pf = this.pendingFields;
	if (!pf.permissions || pf.permissions === this.fields.permissions) {
		pf.permissions = Q.copy(this.fields.permissions) || []; // copy on write
	}
	var permissions = this.getAllPermissions(true);
	if (permissions.indexOf(permission) < 0) {
		permissions.push(permission);
	}
	pf.permissions = JSON.stringify(permissions);
};

/**
 * @method removePermission
 * @param {String} permission
 * @param {Boolean}
 */
Sp.removePermission = function (permission) {
	var pf = this.pendingFields;
	if (!pf.permissions || pf.permissions === this.fields.permissions) {
		pf.permissions = Q.copy(this.fields.permissions) || []; // copy on write
	}
	var permissions = this.getAllPermissions(true);
	var index = permissions.indexOf(permission);
	if (index >= 0) {
		permissions.splice(index, 1);
	}
	pf.permissions = JSON.stringify(permissions);
};
/**
 * Returns the canonical url of the stream, if any
 * @param {Integer} [messageOrdinal] pass this to link to a message in the stream, e.g. to highlight it
 * @param {String} [baseUrl] you can override the default found in "Q"/"web"/"appRootUrl" config
 * @return {String|null|false}
 */
Sp.url = function (messageOrdinal, baseUrl) {
	var urls = Q.plugins.Streams.urls;
	var url = urls && (urls[this.fields.type] || urls['*']);
	url = url || "{{baseUrl}}/s/{{publisherId}}/{{name}}";

	var urlString = '';

	Q.Template.set(url, url);
	Q.Template.render(url, {
		publisherId: this.fields.publisherId,
		streamName: this.fields.name.split('/'),
		name: this.fields.name,
		baseUrl: baseUrl || Q.baseUrl()
	}, function (err, html) {
		if (err) return;
		urlString = html;
	});
	var sep = urlString.indexOf('?') >= 0 ? '&' : '?';
	var qs = messageOrdinal ? sep+messageOrdinal : "";
	return Q.url(urlString + qs);
};
/**
 * Save a stream to the server
 *
 * @method save
 * @param {Object} [options] A hash of options for the subsequent refresh.
 *   See Q.Streams.Stream.refresh
 * @param {Q.Event} [options.onSave] When the result of the server request comes back.
 *   The first parameter is any error that may have occurred.
 *   Note: the steam may not be refreshed yet by that point.
 *   You can return false from the handler to prevent the refresh, for whatever reason.
 * @param {Q.Event} [options.onRefresh] When the stream has been saved and refrshed.
 */
Sp.save = function _Stream_prototype_save (options) {
	var stream = this;
	var slotName = "stream";
	var f = stream.fields;
	var pf = stream.pendingFields;
	pf.publisherId = f.publisherId;
	pf.name = f.name;
	pf["Q.clientId"] = Q.clientId();
	var baseUrl = Q.baseUrl({
		publisherId: pf.publisherId,
		streamName: pf.name
	});
	Q.req('Streams/stream', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			return Streams.onError.handle.call(this, msg, args);
		}
		var s = data.slots.stream || null;
		if (options && options.onSave) {
			if (false === Q.handle(options.onSave, stream, [err, data])) {
				return;
			}
		}
		// process the Streams/changed message and any other
		// messages that may have been posted in the meantime.
		var o = Q.extend({
			evenIfNotRetained: true,
			messages: true,
			unlessSocket: false
		}, options);
		var onRefresh = options && options.onRefresh;
		Stream.refresh(s.publisherId, s.name, onRefresh, o);
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
 */
Sp.reopen = function _Stream_remove () {
	this.pendingFields.closedTime = false;
	this.save();
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
	var publisherId = this.fields.publisherId;
	var streamName = this.fields.name;
	var ps = Streams.key(publisherId, streamName);
	key = Q.calculateKey(key);
	_retainedStreams[ps] = this;
	var nodeUrl = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var stream = _retainedStreams[ps];
	if (stream && stream.participant) {
		Users.Socket.connect(nodeUrl, function () {
			Q.setObject([nodeUrl, ps], true, _retainedNodes);
		});
	}
	Q.setObject([ps, key], true, _retainedByStream);
	Q.setObject([key, ps], true, _retainedByKey);
	return this;
};

/**
 * Release the stream in the client retained under a certain key.
 * When the stream is released under all the keys it was retained under,
 * it is no longer refreshed during Streams.refresh()
 * This method also closes a socket to the stream's node,
 * if it was the last stream released on that node.
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
 * @param {Function} callback arguments = (err) and this = the Streams.Message
 */
Sp.getMessage = function _Stream_prototype_getMessage (ordinal, callback) {
	return Message.get(this.fields.publisherId, this.fields.name, ordinal, callback);
};

/**
 * Retrieves a Streams.Participant object, by using Participant.get
 *
 * @method getParticipant
 * @param {String} userId
 * @param {Function} callback arguments = (err) and this = the Streams.Participant
 */
Sp.getParticipant = function _Stream_prototype_getParticipant (userId, callback) {
	return Participant.get(this.fields.publisherId, this.fields.name, userId, callback);
};

/**
 * Returns Q.Event that occurs after the system learns of a new ephemeral payload came in on a stream.
 * @event onMessage
 * @static
 * @param {String} [publisherId] id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which the message is posted to
 * @param {String} [payloadType] type of the message, or its ordinal, pass "" for all types
 */
Stream.onEphemeral = Q.Event.factory(_streamEphemeralHandlers, ["", "", ""]);

/**
 * Returns Q.Event that occurs after the system learns of a new message that was posted.
 * The platform makes sure the ordinals come in the right order, for each stream.
 * So you just have to handle the messages to update your tools, pages, etc.
 * By the time this event happens, the platform has already taken any default actions
 * for standard events such as "Streams/join", etc. so the stream and all caches
 * are up-to-date, e.g. the participants include the newly joined participant, etc.
 * @event onMessage
 * @static
 * @param {String} [publisherId] id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which the message is posted to
 * @param {String} [messageType] type of the message, or its ordinal, pass "" for all types
 */
Stream.onMessage = Q.Event.factory(_streamMessageHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when fields of the stream officially changed
 * on the server, or was simulated by the client. Either way, you can use this
 * opportunity to update your tools and other visual representations of the stream.
 * Note that this event occurs before the stream object is finally updated, so
 * you can compare the old values of the fields to the new ones.
 * If you need to use the updated stream object, use setTimeout(callback, 0).
 * Finally, if the field which changed is an "extend" field for that stream type,
 * then its value will be null even if the real value is probably something else.
 * You will need to call stream.refresh(callback) to load the stream from the server
 * and in the callback you'll finally have the stream object you've been looking for.
 * @event onFieldChanged
 * @static
 * @param {String} [publisherId] id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which the message is posted to
 * @param {String} [fieldName]  name of the field to listen for, or "" for all fields
 */
Stream.onFieldChanged = Q.Event.factory(_streamFieldChangedHandlers, ["", "", ""]);

/**
 * Event factory for validation hooks that run when setting stream fields.
 * Have the hooks throw a Q.Error on validation errors.
 * @event beforeSet
 * @static
 * @param {String} streamType type of the stream
 * @param {String} [attributeName] name of the field being set
 */
Stream.beforeSet = Q.Event.factory(_beforeSetHandlers, ["", ""]);

/**
 * Event factory for validation hooks that run when setting stream attributes.
 * Have the hooks throw a Q.Error on validation errors.
 * @event beforeSet
 * @static
 * @param {String} streamType type of the stream
 * @param {String} [attributeName] name of the attribute being set
 */
Stream.beforeSetAttribute = Q.Event.factory(_beforeSetAttributeHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when attributes of the stream officially updated
 * @event onAttribute
 * @static
 * @param {String} [publisherId] id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which the message is posted to, "" for all
 * @param {String} [attributeName] name of the attribute to listen for, or "" for all
 */
Stream.onAttribute = Q.Event.factory(_streamAttributeHandlers, ["", "", ""]);

/**
 * Alias for onAttribute for backward compatibility
 * @event onUpdated
 * @static
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which the message is posted to
 * @param {String} [attributeName] name of the attribute to listen for
 */
Stream.onUpdated = Q.Event.factory(_streamAttributeHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when a stream has been closed
 * (and perhaps has been marked for removal)
 * @event onClosed
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onClosed = Q.Event.factory(_streamClosedHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been related to this stream.
 * You may want to retain this stream on the client.
 * @event onRelatedTo
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onRelatedTo = Q.Event.factory(_streamRelatedToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was related to a category stream.
 * You may want to retain that category stream on the client.
 * @event onRelatedFrom
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onRelatedFrom = Q.Event.factory(_streamRelatedFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been unrelated to this stream
 * You may want to release this stream on the client.
 * @event onUnrelatedTo
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onUnrelatedTo = Q.Event.factory(_streamUnrelatedToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was unrelated to a category stream
 * You may want to release that category stream on the client.
 * @event onUnrelatedFrom
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onUnrelatedFrom = Q.Event.factory(_streamUnrelatedFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been related to this stream
 * @event onUpdatedRelateTo
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onUpdatedRelateTo = Q.Event.factory(_streamUpdatedRelateToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was related to a category stream
 * @event onUpdatedRelateFrom
 * @static
 * @param {String} publisherId id of publisher which is publishing this stream
 * @param {String} [streamName] name of this stream
 */
Stream.onUpdatedRelateFrom = Q.Event.factory(_streamUpdatedRelateFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs after a stream is constructed on the client side
 * Generic callbacks can be assigend by setting type or mtype or both to ""
 * @event onConstruct
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which is being constructed on the client side
 */
Stream.onConstruct = Q.Event.factory(_streamConstructHandlers, ["", ""]);

/**
 * Returns Q.Event that you can use update any of your stream representations.
 * If you are already handling the Streams.Stream.onFieldChanged
 * and Streams.Stream.onAttribute events, however, then you don't need to
 * also add a handler to this event, because they are called during the refresh anyway.
 * @event onConstruct
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} [streamName] name of stream which is being refreshed
 * @return {Q.Event}
 */
Stream.onRefresh = Q.Event.factory(_streamRefreshHandlers, ["", ""]);

/**
 * Returns Q.Event that occurs after the system learns of a new message that was posted.
 * The platform makes sure the ordinals come in the right order, for each stream.
 * So you just have to handle the messages to update your tools, pages, etc.
 * By the time this event happens, the platform has already taken any default actions
 * for standard events such as "Streams/join", etc. so the stream and all caches
 * are up-to-date, e.g. the participants include the newly joined participant, etc.
 * @event onMessage
 * @param {String} [messageType] type of the message, or its ordinal, pass "" for all types
 */
Sp.onMessage = function _Stream_prototype_onMessage (messageType) {
	return Stream.onMessage(this.fields.publisherId, this.fields.name, messageType);
};

/**
 * Returns Q.Event which occurs when attributes of the stream officially updated
 * @event onAttribute
 * @param {String} [attributeName] name of the attribute to listen for, or "" for all
 */
Sp.onAttribute = function _Stream_prototype_onAttribute (attribute) {
	return Stream.onAttribute(this.fields.publisherId, this.fields.name, attribute);
};

/**
 * Alias for onAttribute for backward compatibility
 * @event onUpdated
 */
Sp.onUpdated = Sp.onAttribute;

/**
 * Event factory for listening for changed stream fields based on name.
 *
 * @event onFieldChanged
 * @param {String} field can be "" to get triggered for on all fields
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
	return Stream.onClosed(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for validation hooks that run when setting stream fields.
 * Have the hooks throw a Q.Error on validation errors.
 *
 * @event beforeSet
 */
Sp.beforeSet = function _Stream_prototype_onSet () {
	return Stream.beforeSet(this.fields.publisherId, this.fields.name);
};

/**
 * Event factory for validation hooks that run when setting stream attributes
 * Have the hooks throw a Q.Error on validation errors.
 *
 * @event beforeSetAttribute
 */
Sp.beforeSetAttribute = function _Stream_prototype_onSetAttribute () {
	return Stream.beforeSetAttribute(this.fields.publisherId, this.fields.name);
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
 * Subscribe to a stream, so you get realtime messages and offline notifications.
 *
 * @method subscribe
 * @param {Function} callback receives (err, participant) as parameters
 */
Sp.subscribe = function _Stream_prototype_subscribe (callback) {
	return Stream.subscribe(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Unsubscribe from a stream that you previously subscribed to
 *
 * @method unsubscribe
 * @param {Function} callback Receives (err, participant) as parameters
 */
Sp.unsubscribe = function _Stream_prototype_unsubscribe (callback) {
	return Stream.unsubscribe(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Start observing a stream as an anonymous observer,
 * so you get realtime messages through socket events
 * but you don't join as a participant.
 *
 * @method observe
 * @param {Function} callback receives (err, participant) as parameters
 */
Sp.observe = function _Stream_prototype_observe (callback) {
	return Stream.observe(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Stop observing a stream which you previously started observing,
 * so that you don't get realtime messages anymore.
 *
 * @method neglect
 * @param {Function} callback Receives (err, participant) as parameters
 */
Sp.neglect = function _Stream_prototype_neglect (callback) {
	return Stream.neglect(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Send some payload which is not saved as a message in the stream's history,
 * but is broadcast to everyone curently connected by a socket and participating
 * or observing the stream.
 * This can be used for read receipts, "typing..." indicators, cursor movements and more.
 *
 * @method ephemeral
 * @param {Object} payload the payload to send, should have at least "type" specified
 * @param {Boolean} [dontNotifyObservers] whether to skip notifying observers who aren't registered users
 * @param {Function} [callback] receives (err, result) as parameters
 */
Sp.ephemeral = function _Stream_ephemeral (payload, dontNotifyObservers, callback) {
	return Stream.neglect(this.fields.publisherId, this.fields.name, payload, dontNotifyObservers, callback);
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
 * @param {Object} [options] More options that are passed to the API, which can include:
 *   @param {String} [options.identifier] An email address or mobile number to invite. Might not belong to an existing user yet.
 *   @param {boolean} [options.token=false] Pass true here to generate an invite
 *	which you can then send to anyone however you like. When they show up with the token
 *	and presents it via "Q.Streams.token" querystring parameter, the Streams plugin
 *	will accept this invite either right away, or as soon as they log in.
 *	They will then be added to the list of Streams_Invited for this stream, thus
 *	keeping track of who accepted whose invite.
 *   @param {String} [options.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 *   @param {String} [options.userId] user id or an array of user ids to invite
 *   @param {string} [options.platform] platform for which xids are passed
 *   @param {String} [options.xid] xid or arary of xids to invite
 *   @param {String} [options.label] label or an array of labels to invite, or tab-delimited string
 *   @param {String|Array} [options.addLabel] label or an array of labels for adding publisher's contacts
 *   @param {String|Array} [options.addMyLabel] label or an array of labels for adding logged-in user's contacts
 *   @param {String} [options.readLevel] the read level to grant those who are invited
 *   @param {String} [options.writeLevel] the write level to grant those who are invited
 *   @param {String} [options.adminLevel] the admin level to grant those who are invited
 *   @param {String} [options.callback] Also can be used to provide callbacks.
 *   @param {Boolean} [options.followup="future"] Whether to set up a followup email or sms for the user to send. Set to true to always send followup, or false to never send it. Set to "future" to send followups only when the invited user hasn't registered yet.
 *   @param {String} [options.uri] If you need to hit a custom "Module/action" endpoint
 *   @param {String} [options.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 * @param {Function} callback Called with (err, result)
 * @return {Q.Request} represents the request that was made if an identifier was provided
 */
Sp.invite = function (options, callback) {
	Streams.invite(this.fields.publisherId, this.fields.name, options, callback);
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
 * Whether stream retained
 * @method retainedByKey
 * @return {Boolean}
 */
Sp.retainedByKey = function () {
	return Streams.retainedByKey(this.fields.publisherId, this.fields.name);
};

/**
 * Returns all the streams this stream is related to
 *
 * @method relatedFrom
 * @param {String} relationType the type of the relation
 * @param {Object} [options] optional object that can include:
 *   @param {Number} [options.limit] the maximum number of results to return
 *   @param {Number} [options.offset] the page offset that goes with the limit
 *   @param {Boolean} [options.ascending=false] whether to sort by ascending weight.
 * @param {Function} callback callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedFrom objects you can iterate over with Q.each
 */
Sp.relatedFrom = function _Stream_prototype_relatedFrom (relationType, options, callback) {
	return Streams.related(this.fields.publisherId, this.fields.name, relationType, false, options, callback);
};

/**
 * Returns all the streams related to this stream
 *
 * @method relatedTo
 * @param {String} relationType the type of the relation
 * @param {Object} [options] optional object that can include:
 *   @param {Number} [options.limit] the maximum number of results to return
 *   @param {Number} [options.offset] the page offset that goes with the limit
 *   @param {Boolean} [options.ascending=false] whether to sort by ascending weight.
 *   @param {String} [options.prefix] optional prefix to filter the streams by
 * @param {Function} callback callback to call with the results
 *  First parameter is the error, the second one is an object of
 *  Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.relatedTo = function _Stream_prototype_relatedTo (relationType, options, callback) {
	return Streams.related(this.fields.publisherId, this.fields.name, relationType, true, options, callback);
};

/**
 * Relates this stream to another stream
 *
 * @method relateTo
 * @param {String} type the type of the relation
 * @param {String} toPublisherId d of publisher of the stream
 * @param {String} toStreamName name of stream to which this stream is being related
 * @param {Function} [callback] callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.relateTo = function _Stream_prototype_relateTo (type, toPublisherId, toStreamName, callback) {
	return Streams.relate(toPublisherId, toStreamName, type, this.fields.publisherId, this.fields.name, callback);
};

/**
 * Relates another stream to this stream
 *
 * @method relate
 * @param {String} type the type of the relation
 * @param {String} fromPublisherId id of publisher of the stream
 * @param {String} fromStreamName name of stream which is being related to this stream
 * @param {Function} [callback] callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.relate = Sp.relateFrom = function _Stream_prototype_relate (type, fromPublisherId, fromStreamName, callback) {
	return Streams.relate(this.fields.publisherId, this.fields.name, type, fromPublisherId, fromStreamName, callback);
};

/**
 * Removes a relation from this stream to another stream
 *
 * @method unrelateTo
 * @param {String} toPublisherId id of publisher which is publishing the stream
 * @param {String} toStreamName name of stream which the being unrelated
 * @param {String} relationType the type of the relation, such as "parent" or "photo"
 * @param {Function} [callback] callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.unrelateTo = function _Stream_prototype_unrelateTo (toPublisherId, toStreamName, relationType, callback) {
	return Streams.unrelate(this.fields.publisherId, this.fields.name, relationType, toPublisherId, toStreamName, callback);
};

/**
 * Removes a relation from another stream to this stream
 *
 * @method unrelateFrom
 * @param {String} fromPublisherId id of publisher which is publishing the stream
 * @param {String} fromStreamName name of stream which is being unrelated
 * @param {String} relationType the type of the relation, such as "parent" or "photo"
 * @param {Function} [callback] callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Sp.unrelate = Sp.unrelateFrom = function _Stream_prototype_unrelateFrom (fromPublisherId, fromStreamName, relationType, callback) {
	return Streams.unrelate(fromPublisherId, fromStreamName, relationType, this.fields.publisherId, this.fields.name, callback);
};

/**
 * Join a stream as a participant, so messages start arriving in real time via sockets.
 * May call Streams.join.onError if an error occurs.
 *
 * @static
 * @method join
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} streamName name of stream to join
 * @param {Function} [callback] receives (err, participant) as parameters
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
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.join.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.streamName, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(participant, err, participant || null);
		_refreshUnlessSocket(publisherId, streamName);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};
/**
 * Occurs when Stream.join encounters an error trying to join the stream
 * @event join.onError
 */
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
		throw new Error("Streams.Stream.leave: Not logged in.");
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
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.leave.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.streamName, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(this, err, participant || null);
		_refreshUnlessSocket(publisherId, streamName);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};
/**
 * Occurs when Stream.leave encounters an error leave a stream
 * @event leave.onError
 */
Stream.leave.onError = new Q.Event();

/**
 * Subscribe to a stream, to start getting offline notifications
 * May call Streams.subscribe.onError if an error occurs.
 *
 * @static
 * @method subscribe
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} streamName name of stream to join
 * @param {Function} [callback] receives (err, participant) as parameters
 * @param {Object} [options] optional object that can include:
 *   @param {bool} [options.device] Whether to subscribe device when user subscribed to some stream
 */
Stream.subscribe = function _Stream_subscribe (publisherId, streamName, callback, options) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.Stream.subscribe: Not logged in.");
	}

	options = Q.extend({}, Stream.subscribe.options, options);

	var slotName = "participant";
	var fields = {"publisherId": publisherId, "name": streamName};
	var baseUrl = Q.baseUrl({
		"publisherId": publisherId,
		"streamName": streamName,
		"Q.clientId": Q.clientId()
	});
	Q.req('Streams/subscribe', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.subscribe.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.streamName, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(participant, err, participant || null);
		_refreshUnlessSocket(publisherId, streamName);

		// check whether subscribe device and subscribe if yes
		if (Q.getObject(["device"], options) === true) {
			Users.Device.subscribe(function(err, subscribed){
				var fem = Q.firstErrorMessage(err);
				if (fem) {
					console.error("Device registration: " + fem);
					return false;
				}

				if(subscribed) {
					console.log("device subscribed");
				} else {
					console.log("device subscription fail!!!");
				}
			});
		}
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};
/**
 * Occurs when Stream.subscribe encounters an error trying to subscribe to a stream
 * @event subscribe.onError
 */
Stream.subscribe.onError = new Q.Event();

/**
 * Default options for Stream.subscribe function.
 * @param {bool} device Whether to subscribe device when user subscribed to some stream
 */
Stream.subscribe.options = {
	device: true
};

/**
 * Unsubscribe from a stream you previously subscribed to
 * May call Stream.unsubscribe.onError if an error occurs.
 *
 * @static
 * @method unsubscribe
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Function} callback Receives (err, participant) as parameters
 */
Stream.unsubscribe = function _Stream_unsubscribe (publisherId, streamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.Stream.unsubscribe: Not logged in.");
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
	Q.req('Streams/unsubscribe', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.unsubscribe.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.streamName, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(this, err, participant || null);
		_refreshUnlessSocket(publisherId, streamName);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};
/**
 * Occurs when Stream.unsubscribe encounters an error trying to unsubscribe from a stream
 * @event unsubscribe.onError
 */
Stream.unsubscribe.onError = new Q.Event();

/**
 * Start observing a stream, to get realtime messages through socket events.
 * You can do this either as a logged-in user or as an anonymous observer.
 *
 * @static
 * @method observe
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} streamName name of stream to observe
 * @param {Function} [callback] receives (err, result) as parameters
 */
Stream.observe = function _Stream_observe (publisherId, streamName, callback) {
	Streams.socketRequest('Streams/observe',  publisherId, streamName, callback);
};

/**
 * Stop observing a stream which you previously started observing,
 * so that you don't get realtime messages anymore.
 *
 * @static
 * @method neglect
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} streamName name of stream to stop observing
 * @param {Function} [callback] receives (err, result) as parameters
 */
Stream.neglect = function _Stream_neglect (publisherId, streamName, callback) {
	Streams.socketRequest('Streams/neglect', publisherId, streamName, callback);
};

/**
 * Send some payload which is not saved as a message in the stream's history,
 * but is broadcast to everyone curently connected by a socket and participating
 * or observing the stream.
 * This can be used for read receipts, "typing..." indicators, cursor movements and more.
 *
 * @static
 * @method ephemeral
 * @param {String} publisherId id of publisher which is publishing the stream
 * @param {String} streamName name of stream to observe
 * @param {Object} payload the payload to send. It must have "type" set at least.
 * @param {Boolean} [dontNotifyObservers] whether to skip notifying observers who aren't registered users
 * @param {Function} [callback] receives (err, result) as parameters
 */
Stream.ephemeral = function _Stream_ephemeral (
	publisherId, streamName, payload, dontNotifyObservers, callback
) {
	payload.publisherId = publisherId;
	payload.streamName = streamName;
	Streams.socketRequest('Streams/ephemeral', publisherId, streamName, dontNotifyObservers, callback);
};

/**
 * Closes a stream in the database, and marks it for removal unless it is required.
 *
 * @static
 * @method close
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
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Stream.close.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var stream = data.slots.stream;
		if (stream) {
			// process the Streams/closed message, if stream was retained
			_refreshUnlessSocket(stream.publisherId, stream.name);
			_refreshUnlessSocket(Users.loggedInUserId(), 'Streams/participating');
		}
		callback && callback.call(this, err, data.slots.result || null);
	}, { method: 'delete', fields: fields, baseUrl: baseUrl });
};
/**
 * Occurs when Stream.close encounters an error trying to close a stream
 * @event close.onError
 */
Stream.close.onError = new Q.Event();

/**
 * @class Streams
 */

/**
 * Issues a request via a socket, if one is open.
 * The request is sent to the node responsible for the stream,
 * whose url is calculated by calling Q.nodeUrl().
 * The first three parameters are documented, but you can pass more,
 * and they will be sent to the node.
 * @param {String} event the name of the socket.io event, such as "Streams/observe"
 * @param {String} publisherId the id of the stream's publisher
 * @param {String} streamName the name of the stream
 * @param {Function} [callback] Any socket.io acknowledgement callback
 * @return {Q.Socket} returns null if request wasn't sent, otherwise returns the socket
 */
Streams.socketRequest = function (event, publisherId, streamName, callback) {
	// if (!Q.sessionId()) {
	// 	throw new Error("Stream.observe: a valid session is required");
	// }
	var nodeUrl = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var socket = Users.Socket.get(nodeUrl);
	if (!socket) {
		return null;
	}
	var args = Array.prototype.slice.call(arguments, 0);
	args.splice(1, 0, Q.clientId(), Q.getObject('Q.Users.capability'));
	socket.socket.emit.apply(socket.socket, args);
	return socket;
};

/**
 * Relates streams to one another
 * @method relate
 * @param {String} publisherId the publisher id of the stream to relate to
 * @param {String} streamName the name of the stream to relate to
 * @param {String} relationType the type of the relation, such as "parent" or "photo"
 * @param {String} fromPublisherId the publisher id of the stream to relate from
 * @param {String} fromStreamName the name of the stream to relate from
 * @param {Function} [callback] callback to call with the results
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
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
		_refreshUnlessSocket(publisherId, streamName);
		_refreshUnlessSocket(fromPublisherId, fromStreamName);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Removes relations from streams to one another
 * @static
 * @method unrelate
 * @param {String} publisherId the publisher id of the stream to relate to
 * @param {String} streamName the name of the stream to relate to
 * @param {String} relationType the type of the relation, such as "parent" or "photo"
 * @param {String} fromPublisherId the publisher id of the stream to relate from
 * @param {String} fromStreamName the name of the stream to relate from
 * @param {Function} [callback] callback to call with the results
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

/**
 * Constructs a Streams.Message from fields.
 * If the Streams.Message.define() function was not called,
 * uses a default constructor for the message, which simply copies the fields.
 * @static
 * @method construct
 * @param {Object} fields Provide any message fields here. Requires at least the "type" of the stream.
 * @param {Boolean} [updateCache=true] Whether to update the Message.get cache after constructing the Message
 * @return {Q.Stream}
 */
Message.construct = function Streams_Message_construct(fields, updateCache) {
	updateCache = updateCache !== false;
	if (Q.isEmpty(fields)) {
		return false;
	}
	var orig = null;
	if (fields && fields.fields) {
		orig = fields;
		fields = fields.fields;
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
		};
		Q.mixin(messageFunc, Streams.Message);
		Q.mixin(messageFunc.messageConstructor, messageFunc);
	}
	var msg = new messageFunc.messageConstructor(fields);
	if (updateCache && !isNaN(parseInt(msg.ordinal))) {
		Message.get.cache.set(
			[msg.publisherId, msg.streamName, parseInt(msg.ordinal)],
			0, msg, [null, msg]
		);
	}
	_updateMessageCache(msg);
	if (orig) {
		Q.extend(msg, orig);
	}
	return msg;
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
 * @method getAllInstructions
 * @return {Object}
 */
Mp.getAllInstructions = function _Message_prototype_getAllInstructions () {
	try {
		return JSON.parse(this.instructions);
	} catch (e) {
		return {};
	}
};

/**
 * Get the value of an instruction in the message
 *
 * @method getInstruction
 * @param {String} instructionName
 */
Mp.getInstruction = function _Message_prototype_getInstruction (instructionName) {
	var instr = this.getAllInstructions();
	return instr[instructionName];
};

/**
 * Mark the message as seen, updating the messageTotals
 *
 * @method seen
 * @param {Number|Boolean} [messageTotal] Pass the total messages seen of this type.
 *  Or, pass true to set the latest messageTotal if any was cached, otherwise do nothing.
 * @return {Number|false}
 */
Mp.seen = function _Message_seen (messageTotal) {
	if (messageTotal == null) {
		messageTotal = true;
	}
	return MTotal.seen(this.publisherId, this.streamName, this.messageType, messageTotal);
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
 * @param {Array} [ordinal.withMessageTotals] Highly encouraged if ordinal is an object. All the possible message types to automatically update messageTotals for.
 * @param {Number} [ordinal.min] The minimum ordinal in the range. If omitted, uses limit.
 * @param {Number} [ordinal.max] The maximum ordinal in the range. If omitted, gets the latest messages.
 * @param {Number} [ordinal.limit] Change the max number of messages to retrieve. If only max and limit are specified, messages are sorted by decreasing ordinal.
 * @param {Function} callback This receives two parameters. The first is the error.
 *   If ordinal was a Number, then the second parameter is the Streams.Message, as well as the "this" object.
 *   If ordinal was an Object, then the second parameter is a hash of { ordinal: Streams.Message } pairs
 */
Message.get = function _Message_get (publisherId, streamName, ordinal, callback) {
	var slotName, criteria = {};
	if (Q.typeOf(ordinal) === 'object') {
		slotName = ordinal.withMessageTotals ? ['messages', 'messageTotals'] : ['messages'];
		if (ordinal.min) {
			criteria.min = parseInt(ordinal.min);
		}
		criteria.max = parseInt(ordinal.max);
		criteria.limit = parseInt(ordinal.limit);
		if (ordinal.withMessageTotals) {
			criteria.withMessageTotals = ordinal.withMessageTotals;
		}
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
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				var args = [err, data];
				Streams.onError.handle.call(this, msg, args);
				Message.get.onError.handle.call(this, msg, args);
				return callback && callback.call(this, msg, args);
			}
			var messages = {};
			if ('messages' in data) {
				messages = data.messages;
				if (data.messageTotals) {
					updateMessageTotalsCache(publisherId, streamName, data.messageTotals);
				}
			} else if ('message' in data) {
				messages[ordinal] = data.message;
			}
			Q.each(messages, function (ordinal, message) {
				if (!(message instanceof Message)) {
					message = Message.construct(message, true);
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
	return true;
};
/**
 * Occurs when Message.get encounters an error loading a message from the server
 * @event get.onError
 */
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
	Q.req('Streams/message', ['message'], function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Message.post.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var message = (data.slots && data.slots.message)
			? Message.construct(data.slots.message, false)
			: null;
		callback && callback.call(Message, err, message);
	}, { method: 'post', fields: msg, baseUrl: baseUrl });
};
/**
 * Occurs when Message.post encounters an error posting a message to the server
 * @event post.onError
 */
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
 * @return {Integer}
 */
Message.latestOrdinal = function _Message_latestOrdinal (publisherId, streamName, checkMessageCache) {
	var found = false;
	var latest = 0;
	if (checkMessageCache) {
		Message.get.cache.each([publisherId, streamName], function (k, v) {
			if (!v.params[0] && v.subject.ordinal > 0) {
				latest = Math.max(latest, v.subject.ordinal);
				found = true;
			}
		});
	}
	if (!latest) {
		Streams.get.cache.each([publisherId, streamName], function (k, v) {
			if (!v.params[0] && v.subject.fields.messageCount > 0) {
				latest = v.subject.fields.messageCount;
				found = true;
				return false;
			}
		});
	}
	return found ? parseInt(latest) : 0;
};

/**
 * Wait until a particular message is posted.
 * Used by Streams plugin to make sure messages arrive in order.
 * Call this with ordinal = -1 to load the latest messages.
 *
 * @static
 * @method wait
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Number} ordinal The ordinal of the message to wait for, or -1 to load latest messages
 * @param {Function} callback Called whenever all the previous messages have been processed.
 *   The first parameter is [arrayOfOrdinals] that were processed,
 *   where latest < ordinals <= ordinal.
 * @param {Object} [options] A hash of options which can include:
 *   @param {Number} [options.max=5] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   @param {Number} [options.timeout=1000] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 *   @param {Number} [options.unlessSocket=true] Whether to avoid doing any requests when a socket is attached and user is a participant in the stream
 *   @param {Boolean} [options.evenIfNotRetained] Set this to true to wait for messages posted to the stream, in the event that it wasn't cached or retained.
 * @return {Boolean|null|Q.Pipe}
 *   Returns false if the cached stream already got this message.
 *   Returns true if we decided to send a request for the messages.
 *   Returns new Q.Pipe if we decided to wait for messages to arrive via socket.
 *   Returns null if no attempt was made because ordinal=-1 and stream wasn't cached.
 *   In this last case, the callback is not called.
 */
Message.wait = function _Message_wait (publisherId, streamName, ordinal, callback, options) {
	var alreadyCalled = false, handlerKey;
	var latest = Message.latestOrdinal(publisherId, streamName);
	var ps = Streams.key(publisherId, streamName);
	var wasRetained = _retainedStreams[ps];
	if (!latest && !wasRetained && (!options || !options.evenIfNotRetained)) {
		// There is no cache for this stream, so we won't wait for previous messages.
		return null;
	}
	if (ordinal >= 0 &&  ordinal <= latest) {
		// The cached stream already got this message
		Q.handle(callback, this, [[]]);
		return false;
	}
	var o = Q.extend({}, Message.wait.options, options);
	var waiting = {};
	var nodeUrl = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var socket = Users.Socket.get(nodeUrl);
	if (!socket || ordinal - o.max > latest) {
		return _tryLoading();
	}
	// If we are here, then socket is available
	if (ordinal < 0) {
		// Requested to wait for the latest messages
		var participant;
		if (o.unlessSocket) {
			Streams.get.cache.each([publisherId, streamName], function (key, info) {
				var p = Q.getObject("subject.participant", info);
				if (p && p.state === 'participating') {
					participant = p;
					return false;
				}
			});
		}
		if (!participant) {
			return _tryLoading();
		}
	}
	// Wait for messages to arrive via the socket,
	// and if they don't all arrive, try loading them via an http request.
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
			Q.handle(callback, this, [true, ordinals]);
		}
		clearTimeout(t);
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
					return Q.handle(callback, this, [null, err]);
				}
				// Go through the messages and simulate the posting
				// NOTE: the messages will arrive a lot quicker than they were posted,
				// and moreover without browser refresh cycles in between,
				// which may cause confusion in some visual representations
				// until things settle down on the screen
				ordinal = parseInt(ordinal);
				Q.each(messages, function (ordinal, message) {
					if (Message.latest[publisherId+"\t"+streamName] >= ordinal) {
						return; // it was already processed
					}
					Users.Socket.onEvent('Streams/post').handle(message, messages);
				}, {ascending: true, numeric: true});

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
 * Methods related to working with messageTotals of different message types in a stream
 * @class Streams.Message.Total
 */
var MTotal = Streams.Message.Total = {
	/**
	 * Get one or more messageTotals, which may result in batch requests to the server.
	 * May call Streams.Message.Total.get.onError if an error occurs.
	 *
	 * @static
	 * @method get
	 * @param {String} publisherId
	 * @param {String} streamName
	 * @param {String|Array} messageType can be the message type, or an array of them
	 * @param {Function} callback This receives two parameters. The first is the error.
	 *   If messageType was a String, then the second parameter is the messageTotal.
	 *   If messageType was an Array, then the second parameter is a hash of {messageType: messageTotal} pairs
	 */
	get: function _Total_get (publisherId, streamName, messageType, callback) {
		var func = Streams.batchFunction(Q.baseUrl({
			publisherId: publisherId,
			streamName: streamName
		}));
		func.call(this, 'messageTotal', 'messageTotals', publisherId, streamName, messageType,
			function (err, data) {
				var msg = Q.firstErrorMessage(err, data);
				if (msg) {
					var args = [err, data];
					Streams.onError.handle.call(this, msg, args);
					MTotal.get.onError.handle.call(this, msg, args);
					return callback && callback.call(this, msg, args);
				}

				var messageTotals = 0;
				if (data.messageTotals) {
					messageTotals = Q.isArrayLike(messageType)
						? Q.copy(data.messageTotals)
						: data.messageTotals[messageType];
				}
				callback && callback.call(MTotal, err, messageTotals || 0);
			});
	},
	/**
	 * Returns the latest total number of messages (of a certain type) posted to the stream
	 * @method latest
	 * @static
	 * @param {String} publisherId
	 * @param {String|Array} streamName
	 * @param {String} messageType
	 * @return {Integer|null}
	 */
	latest: function (publisherId, streamName, messageType) {
		var item = MTotal.get.cache.get([publisherId, streamName, messageType]);
		var value = item && item.params[1];
		if (value == null) {
			return null;
		}
		return Q.isInteger(value) ? value : (value[messageType] || null);
	},
	/**
	 * Returns the latest number of unseen messages (of a certain type) posted to the stream
	 * @method unseen
	 * @static
	 * @param {String} publisherId id of the user publishing the straem
	 * @param {String} streamName the name of the stream
	 * @param {String} messageType the type of the messages
	 * @return {Integer|null}
	 *   Returns the number of unseen messages if there is a latest messageTotal, otherwise null.
	 */
	unseen: function _Total_unseen (publisherId, streamName, messageType) {
		var latest = MTotal.latest(publisherId, streamName, messageType);
		var seen = MTotal.seen(publisherId, streamName, messageType);
		return latest && (latest > seen) && (latest - seen);
	},
	/**
	 * Use this function to get or store the total number of messages
	 * of a particular type seen on a particular stream.
	 * @param {String} publisherId id of the user publishing the stream
	 * @param {String} streamName the name of the stream
	 * @param {String} messageType the type of messages
	 * @param {Number|Boolean} [messageTotal] Pass the total messages seen of this type.
	 *  Or, pass true to set the latest messageTotal (if any was cached), otherwise do nothing.
	 * @param {Function} [callback] This is only in the case where messageTotal is passed
	 * @return {Number|false} Returns the total number of messages seen of this type.
	 *  If messageTotal === true, however, returns false if nothing was actually done.
	 */
	seen: function _Total_seen (publisherId, streamName, messageType, messageTotal, callback) {
		var tsc = MTotal.seen.cache;
		if (messageTotal === true) {
			var cached = MTotal.get.cache.get([publisherId, streamName, messageType]);
			if (!cached) {
				return false;
			}
			messageTotal = cached.params[1];
		}
		if (messageTotal !== undefined) {
			Q.setObject([publisherId, streamName, messageType], messageTotal, _seen);
			tsc.set([publisherId, streamName, messageType], 0, messageTotal);
			// TODO: use websockets to do Streams.seen, then call callback
			Q.handle(callback, MTotal, [null, messageTotal]);
			_seenHandlers[publisherId] &&
			_seenHandlers[publisherId][streamName] &&
			_seenHandlers[publisherId][streamName][messageType] &&
			Q.handle(_seenHandlers[publisherId][streamName][messageType], MTotal, [t]);
			return messageTotal;
		}
		var t = Q.getObject([publisherId, streamName, messageType], _seen);
		if (t === undefined) {
			var c = tsc.get([publisherId, streamName, messageType]);
			if (!c) {
				return 0;
			}
			t = c.subject;
			Q.setObject([publisherId, streamName, messageType], t, _seen);
		}
		return t;
	},

	/**
	 * Sets up an element to show the total number of unseen messages (of a certain type)
	 * from a stream, and update the display in real time.
	 * @method setUpElement
	 * @static
	 * @param {Element} element The element to set up
	 * @param {String} publisherId The id of the publisher
	 * @param {String} streamName The stream name
	 * @param {String} messageType The type of the message
	 * @param {String|Q.Tool|true} key Key for attaching the events
	 * @param {Object} [options]
	 * @param {String} [options.unseenClass='Streams_unseen_nonzero']
	 *  Added if there is at least one unseen message
	 */
	setUpElement: function _Total_setUpElement(
		element, publisherId, streamName, messageType, key, options
	) {
		if (!element) {
			return;
		}
		var p = publisherId;
		var n = streamName;
		var m = messageType;
		MTotal.get(p, n, m, _unseen);
		Stream.onMessage(p, n, m).add(_unseen);
		MTotal.onSeen(p, n, m).set(_unseen);
		function _unseen() {
			var c = MTotal.unseen(p, n, m);
			var unseenClass = (options && options.unseenClass) || 'Streams_unseen_nonzero';
			element.innerHTML = c;
			element.setClass(unseenClass, c);
		}
	},

	/**
	 * Occurs when MTotal.seen is called to update the number of seen messages.
	 * The first parameter passed is the new messageTotal.
	 * @event onSeen
	 * @param {String} publisherId
	 * @param {String} streamName
	 * @param {String} messageType
	 * @return {Q.Event}
	 */
	onSeen: Q.Event.factory(_seenHandlers, ["", "", ""])
};
var _seen = {};
/**
 * Occurs when MTotal.get encounters an error loading a messageTotal from the server
 * @event get.onError
 */
MTotal.get.onError = new Q.Event();
MTotal.seen.cache = Q.Cache['local']("Streams.Message.Total.seen", 100);

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
		var msg = Q.firstErrorMessage(err, data);
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
/**
 * Occurs when Participant.get encounters an error loading a participant from the server
 * @event get.onError
 */
Participant.get.onError = new Q.Event();

var Pp = Participant.prototype;

/**
 * Get all extra attributes
 *
 * @method getAllExtras
 * @return {Object}
 */
Pp.getAllExtras = function _Participant_prototype_getAllExtras () {
	try {
		return JSON.parse(this.extra);
	} catch (e) {
		return {};
	}
};

/**
 * Get the value of an extra
 *
 * @method getExtra
 * @param {String} extraName the name of the extra to get
 * @return {Mixed}
 */
Pp.getExtra = function _Participant_prototype_get (extraName) {
	var attr = this.getAllExtras();
	return attr[extraName];
};

/**
 * Constructs an avatar from fields, which are typically returned from the server.
 * @class Streams.Avatar
 * @constructor
 * @param {Array} fields
 */
var Avatar = Streams.Avatar = function Streams_Avatar (fields) {
	Q.extend(this, fields);
	this.typename = 'Q.Streams.Avatar';
};

/**
 * Avatar batch getter.
 *
 * @static
 * @method get
 * @param {String|Object} userId The id of the user whose avatar we are requesting.
 *  Alternatively, this can also be an object with keys "prefix", "limit", "offset"
 * @param {function} callback
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a Streams.Avatar object
 */
Avatar.get = function _Avatar_get (userId, callback) {
	var func = Streams.batchFunction(Q.baseUrl({userId: userId}), 'avatar');
	func.call(this, userId, function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			var args = [err, data];
			Streams.onError.handle.call(this, msg, args);
			Avatar.get.onError.handle.call(this, msg, args);
			return callback && callback.call(this, msg, args);
		}
		var avatar = data.avatar ? new Avatar(data.avatar) : null;
		callback && callback.call(avatar, null, avatar);
		Q.handle(Q.getObject([userId], _avatarHandlers), avatar, [null, avatar]);
	});
};
/**
 * Occurs when Avatar.get encounters an error loading an avatar from the server
 * @event avatar.onError
 */
Avatar.get.onError = new Q.Event();

/**
 * Get avatars by prefix
 *
 * @static
 * @method byPrefix
 * @param prefix {string}
 *  For example something the user started typing in an autocomplete field
 * @param {Function} callback
 *	If there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a hash of {userId: Streams.Avatar} pairs
 * @param {Object} [options]
 *   @param {Number} [options.limit] for paging
 *   @param {Number} [options.offset] for paging
 *   @param {Boolean} [options.public=false] If true, also gets publicly accessible names.
 */
Avatar.byPrefix = function _Avatar_byPrefix (prefix, callback, options) {
	var userId = Q.plugins.Users.loggedInUser ? Users.loggedInUser.id : "";
	// Query avatar as userId would see it, by requesting it from the right server.
	// If userId is empty, then we query avatars on one of the public servers.
	var fields = Q.take(options, ['limit', 'offset', 'public']);
	Q.extend(fields, {prefix: prefix});
	Q.req('Streams/avatar', ['avatars'], function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
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
		callback && callback.call(this, null, avatars);
	}, { fields: fields });
};
/**
 * Occurs when Avatar.byPrefix encounters an error loading avatar from the server
 * @event byPrefix.onError
 */
Avatar.byPrefix.onError = new Q.Event();

var Ap = Avatar.prototype;

/**
 * Get the display name from a Streams.Avatar
 *
 * @method displayName
 * @param {Object} [options] A bunch of options which can include:
 *   @param {Boolean} [options.short] Show one part of the name only
 *   @param {boolean} [options.show] The parts of the name to show. Can have "f", "fu", "l", "lu", "flu" and "u" separated by spaces. The "fu" and "lu" represent firstname or lastname with fallback to username, while "flu" is "firstname lastname" with a fallback to username.
 *   @param {Boolean} [options.html] If true, encloses the first name, last name, username in span tags. If an array, then it will be used as the attributes of the html.
 *   @param {Boolean} [options.escape] If true, does HTML escaping of the retrieved fields
 * @param {String} [fallback='Someone'] What to return if there is no info to get displayName from.
 * @return {String}
 */
Ap.displayName = function _Avatar_prototype_displayName (options, fallback) {
	var fn = this.firstName;
	var ln = this.lastName;
	var u = this.username === fn || this.username === ln ? "" : this.username;

	var fn2, ln2, u2, f2;
	fallback = fallback || 'Someone';
	if (options && (options.escape || options.html)) {
		fn = fn && fn.encodeHTML();
		ln = ln && ln.encodeHTML();
		u = u && u.encodeHTML();
		fallback = fallback.encodeHTML();
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
		var show = options.show.split(' ').map(function (x) {
			return x.trim();
		});
		var parts = [];
		for (var i=0, l=show.length; i<l; ++i) {
			var s = show[i];
			switch (s) {
				case 'f': parts.push(fn2); break;
				case 'l': parts.push(ln2); break;
				case 'u': parts.push(u2); break;
				case 'fu': parts.push(fn2 ? fn2 : u2); break;
				case 'lu': parts.push(ln2 ? ln2 : u2); break;
				case 'flu':
				default:
					parts.push(fn2 || ln2 ? [fn2, ln2].join(' ') : u2);
					break;
			}
		}
		return parts.join(' ').trim() || f2;
	}
	if (options && options.short) {
		return fn ? fn2 : (u ? u2 : f2);
	} else if (fn && ln) {
		return fn2 + ' ' + ln2;
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
 * @param {String|Number|false} [basename=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
 * @return {String} the url
 */
Ap.iconUrl = function _Avatar_prototype_iconUrl (basename) {
	return Users.iconUrl(this.icon.interpolate({
		userId: this.publisherId.splitId()
	}), basename);
};

/**
 * Methods related to "Streams/interest" streams.
 * @class Streams.Interests
 * @constructor
 * @param {Object} fields
 * @param {Function} [callback]
 * @param {Object} [options] Can be used to override any options for the call to Q.req
 *   as well as provide the following options:
 * @param {Object} [options.subscribe=false] Set this to true to also subscribe to the interest
 * @param {Object} [options.publisherId=Q.Users.communityId] Can be used to override the community id
 */
var Interests = Streams.Interests = {
	/**
	 * Add an interest to the logged-in user
	 * @method add
	 * @static
	 * @param {String} title The title of the interest
	 * @param {Function} callback
	 * @param {Object} [options] Pass options for Q.req call, also supports the following:
	 * @param {Boolean} [options.subscribe] Whether to subscribe
	 * @param {String} [options.publisherId] Defaults to the current community id
	 */
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
			}, Q.extend({
				method: 'post',
				fields: fields
			}, options));
	},
	/**
	 * Remove an interest from the logged-in user in the main community
	 * @method remove
	 * @static
	 * @param {String} title The title of the interest
	 * @param {Function} callback
	 * @param {Object} [options]
	 * @param {String} [options.publisherId] Defaults to the current community id
	 */
	remove: function (title, callback, options) {
		if (!Users.loggedInUser) {
			return false;
		}
		var fields = {
			title: title
		};
		if (options) {
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
				method: 'delete',
				fields: fields
			});
	},
	/**
	 * Load interests for a user
	 * @method forUsr
	 * @static
	 * @param {String} userId
	 * @param {String} communityId
	 * @param {Function} callback
	 */
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
	/**
	 * Load my own interests
	 * @method forMe
	 * @static
	 * @param {String} communityId
	 * @param {Function} callback
	 */
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
	/**
	 * Load official interests from a community
	 * @method load
	 * @static
	 * @param {String} communityId
	 * @param {Function} callback
	 */
	load: function (communityId, callback) {
		var src = Q.action('Streams/interests', {
			communityId: communityId
		});
		Q.addScript(src, callback);
	},
	/**
	 * Get the url of a category icon
	 * @method categoryIconUrl
	 * @static
	 * @param {String} communityId
	 * @param {String} category
	 * @param {String} [style='white'] Can be "white" or "colorful"
	 * @return {String}
	 */
	categoryIconUrl: function (communityId, category, style) {
		style = style || 'white';
		var info = Interests.info[communityId];
		var cn = Q.normalize(category);
		if (info && info[category] && info[category][style]) {
			return Q.url(info[category][style]);
		}
		return Q.url(
			'{{Streams}}/img/icons/interests/categories/'
			+ style + '/' + cn + '.png'
		);
	},
	/**
	 * Find the name of the category whose "drilldown" info is
	 * equal to the normalized string passed here ("category_interest")
	 * @method drilldownCategory
	 * @static
	 * @param {String} communityId
	 * @param {String} normalized
	 * @return {String|null} the name of the category, if anuy
	 */
	drilldownCategory: function (communityId, normalized) {
		var n = Q.normalize(normalized);
		var infos = Q.Streams.Interests.info[communityId];
		for (var category in infos) {
			var info = infos[category];
			if (!info.drilldown) {
				continue;
			}
			if (Q.normalize(info.drilldown) === n) {
				return category;
			}
		}
		return null;
	},
	all: {},
	info: {},
	my: null
};

/**
 * Class with functionality to operate with Metrics
 * @class Streams.Metrics
 * @constructor
 * @param {Object} params JSON object with necessary params
 * @param {number} params.period Seconds period to send data to server
 * @param {number} params.predefined Seconds period to send data to server
 * @param {boolean|Object} params.useFaces If true, used Users.Faces with debounce=30. If false - don't use Users.Faces.
 * If object - use this object as params for Users.Faces.
 */
Streams.Metrics = function (params) {
	var that = this;

	this.publisherId = Q.getObject("publisherId", params) || null;
	this.streamName = Q.getObject("streamName", params) || null;

	if (!this.publisherId) {
		console.warn("Streams.Metrics: publisherId undefined");
	}

	if (!this.streamName) {
		console.warn("Streams.Metrics: streamName undefined");
	}

	// set useFaces option
	this.useFaces = Q.getObject("useFaces", params);
	if (this.useFaces === true) {
		this.useFaces = {
			debounce: 30
		};
	}

	/**
	 * Seconds period to send data to server
	 */
	this.period = (Q.getObject("period", params) || 60) * 1000;

	// min period to compare with prev value to decide if this continue of watching or seeked to new position
	this.minPeriod = Q.getObject("minPeriod", params) || 2;

	/**
	 * Data saved before send to server
	 */
	this.predefined = Q.getObject("predefined", params) || [];

	/**
	 * Save time as metrics locally before save
	 * @method add
	 * @param {number} value
	 */
	this.add = function (value) {

		// check active
		if (Q.isDocumentHidden()) {
			return;
		}

		// check faces
		if (!that.face) {
			return;
		}

		// iterate all periods and try to fing the period which continue value is
		var sorted = false;
		Q.each(that.predefined, function (i, period) {
			if (sorted) {
				return;
			}

			var start = period[0];
			var end = period[1] || start;

			if (value >= start && value <= end) {
				sorted = true;
			}
			else if (value > end && value < end + that.minPeriod) {
				period[1] = value;
				sorted = true;
			}
			else if (value < start && value > start - that.minPeriod) {
				period[0] = value;
				sorted = true;
			}
		});

		// if suitable period not found, create new priod
		if (!sorted) {
			that.predefined.push([value]);
		}
	};


	/**
	 * Stop timer interval
	 * @method stop
	 */
	this.stop = function () {
		that.timerId && clearInterval(that.timerId);
		that.faces && that.faces.stop();
	};

	if (this.useFaces) {
		Q.ensure('Q.Users.Faces', function () {
			that.faces = new Q.Users.Faces(that.useFaces);
			that.faces.start(function () {
				that.faces.onEnter.add(function () {
					that.face = true;
				});
				that.faces.onLeave.add(function () {
					that.face = false;
				});
			});
		});
	}

	/**
	 * Start timer interval
	 */
	this.timerId = setInterval(function () {
		if (!that.publisherId || !that.streamName) {
			return;
		}

		if (Q.isEmpty(that.predefined)) {
			return;
		}

		Q.req("Streams/metrics", [], function (err, response) {
			var msg = Q.firstErrorMessage(err, response && response.errors);
			if (msg) {
				return console.warn(msg);
			}

			Q.handle(params.callback);
		}, {
			method: "post",
			fields: {
				publisherId: that.publisherId,
				streamName: that.streamName,
				metrics: that.predefined,
				minPeriod: that.minPeriod
			}
		});

		that.predefined = [];
	}, this.period);
};

/**
 * @class Streams
 */

/**
 * Returns the type name to display from a stream type.
 * If none is set, try to figure out a displayable title from a stream's type
 * @method displayType
 * @param {String} type
 * @param {Function} callback The first parameter will be the displayType
 * @param {Object} [options] Options to use with Q.Text.get, and also
 * @param {string} [$options.plural=false] Whether to display plural, when available
 */
Streams.displayType = function _Streams_displayType(type, callback, options) {
	var parts = type.split('/');
	var module = parts.shift();
	var ret = parts.pop();
	Q.Text.get(module+'/content', function(err, text) {
		var field = 'displayType' + (options && options.plural) ? 'Plural' : '';
		var result = Q.getObject(['types', type, 'displayType']);
		if (options && options.plural) {
			result = Q.getObject(['types', type, 'displayTypePlural'], text) || result;
		}
		callback(result || ret);
	}, options);
};

/**
 * Use this to check whether variable is a Q.Streams.Stream object
 * @static
 * @method isStream
 * @param {mixed} value
 * @return {boolean}
 */
Streams.isStream = function (value) {
	return Q.getObject('constructor.isConstructorOf', value) === 'Q.Streams.Stream';
};

/**
 * Use this to check whether variable is a Q.Streams.Message object
 * @static
 * @method isMessage
 * @param {mixed} value
 * @return {boolean}
 */
Streams.isMessage = function (value) {
	return Q.getObject('constructor.isConstructorOf', value) === 'Q.Streams.Message';
};

/**
 * Converts the publisherId and the first 24 characters of
 * an ID that is typically used as the final segment in a streamName
 * to a hex string starting with "0x" representing a uint256 type.
 * Both inputs are padded by 0's on the right in the hex string.
 * For example Streams::toHexString("abc", "def") returns
 * 0x6162630000000000646566000000000000000000000000000000000000000000
 * while Streams::toHexString("abc", "123/def") returns
 * 0x616263000000007b646566000000000000000000000000000000000000000000
 * @static
 * @method toHexString
 * @param {string} publisherId - Takes the first 8 ASCII characters
 * @param {string|integer} [streamId] - Takes the first 24 ASCII characters, or an unsigned integer up to PHP_INT_MAX
 *  If the $streamId contains a slash, then the first part is interpreted as an unsigned integer up to 255,
 *  and determines the 15th and 16th hexit in the string. This is typically used for "seriesId" under a publisher.
 * @param {boolean} [isNotNumeric] - Set to true to encode $streamId as an ASCII string, even if it is numeric
 * @return {string} A hex string starting with "0x..." followed by 16 hexits and then 24 hexits.
 */
Streams.toHexString = function (publisherId, streamId, isNotNumeric) {
	streamId = streamId || '';
	var parts = streamId.split("/");
	var seriesId = null;
	if (parts.length > 1) {
		seriesId = parts[0];
		streamId = parts[1];
		if (seriesId > 255 || seriesId < 0 || Math.floor(seriesId) !== seriesId) {
			throw new Q.Exception('seriesId must be in range integer 0-255');
		}
	}

	var publisherHex = publisherId.substring(0, 8).asc2hex();
	var pad = "padStart";
	var streamHex = streamId.toString(16);
	if (!isNotNumeric && streamId && !isNaN(streamId)) {
		if (Math.floor(streamId) !== streamId || streamId < 0) {
			throw new Q.Exception('seriesId must be in range integer 0-255');
		}
	} else {
		streamHex = streamId.substring(0, 24).asc2hex();
		pad = "padEnd";
	}
	var hexFirstPart = publisherHex.padEnd(16, 0);
	var hexSecondPart = eval('streamHex.' + pad + '(48, 0)');
	if (seriesId) {
		hexFirstPart = hexFirstPart.substring(0, 14) + seriesId.toString(16).padStart(2, '0');
	}
	return "0x" + hexFirstPart + hexSecondPart;
};

/**
 * Use this to check whether user subscribed to stream
 * and also whether subscribed to message type (from streams_subscription_rule)
 * @static
 * @method showNoticeIfSubscribed
 * @param {object} options
 * @param {string} options.publisherId
 * @param {string} options.streamName
 * @param {string} options.messageType
 * @param {string} [options.evenIfNotSubscribed=false] - If yes, show notice even if user not subscribed to stream.
 * @param {function} options.callback Function which called to show notice if all fine.
 */
Streams.showNoticeIfSubscribed = function (options) {
	var publisherId = options.publisherId;
	var streamName = options.streamName;
	var messageType = options.messageType;
	var callback = options.callback;
	var evenIfNotSubscribed = options.evenIfNotSubscribed;

	Streams.get.force(publisherId, streamName, function () {
		// return if user doesn't subscribed to stream
		if (!evenIfNotSubscribed && Q.getObject("participant.subscribed", this) !== 'yes') {
			return;
		}

		var streamsSubscribeRulesFilter = JSON.parse(Q.getObject("participant.subscriptionRules.filter", this) || null);
		if ((Q.getObject("types", streamsSubscribeRulesFilter) || []).includes(messageType)) {
			return;
		}

		// if stream retained - don't show notice
		if (this.retainedByKey()) {
			return;
		}

		Q.handle(callback, this);
	}, {
		withParticipant: true
	});
};
Streams.setupRegisterForm = function _Streams_setupRegisterForm(identifier, json, priv, overlay) {
	var src = Q.getObject(["entry", 0, "thumbnailUrl"], json);
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
	var $formContent = $('<div class="Streams_login_fullname_block" />');
	if (Q.text.Streams.login.prompt) {
		$formContent.append(
			$('<label for="Streams_login_fullname" />').html(Q.text.Streams.login.prompt),
			'<br>'
		);
	}
	$formContent.append(
		$('<input id="Streams_login_fullname" name="fullName" type="text" class="text" />')
			.attr('maxlength', Q.text.Users.login.maxlengths.fullName)
			.attr('placeholder', Q.text.Users.login.placeholders.fullName)
			.val(firstName+(lastName ? ' ' : '')+lastName)
	)
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

	register_form.append($formContent)
		.append($('<input type="hidden" name="identifier" />').val(identifier))
		.append($('<input type="hidden" name="icon" />'))
		.append($('<input type="hidden" name="Q.method" />').val('post'))
		.append(
			$('<div class="Streams_login_get_started"></div>')
			.append($b)
		).submit(Q.throttle(function (e) {
			var $this = $(this);
			$this.removeData('cancelSubmit');
			$b.addClass('Q_working')[0].disabled = true;
			document.activeElement.blur();
			var $usersAgree = $('#Users_agree', register_form);
			if ($usersAgree.length && !$usersAgree.is(':checked')) {
				$this.data('cancelSubmit', true);
				setTimeout(function () {
					if (confirm(Q.text.Users.login.confirmTerms)) {
						$usersAgree.attr('checked', 'checked');
						$usersAgree[0].checked = true;
						$b.addClass('Q_working')[0].disabled = true;
						$this.submit();
					}
				}, 300);
			}
		}, 300))
		.on('keydown', function (e) {
			if ((e.keyCode || e.which) === 13) {
				$(this).submit();
				e.preventDefault();
			}
		});
	if (priv.activation) {
		register_form.append($('<input type="hidden" name="activation" />').val(priv.activation));
	}

	if (json.termsLabel) {
		$formContent.append(
			$('<div />').attr("id", "Users_register_terms")
				.append($('<input type="checkbox" name="agree" id="Users_agree" value="yes">'))
				.append($('<label for="Users_agree" />').html(json.termsLabel))
		);

		Q.Text.get('Users/content', function(err, text) {
			$("label[for=Users_agree] a", $formContent).on(Q.Pointer.fastclick, function () {
				Q.Dialogs.push({
					title: text.authorize.TermsTitle,
					className: 'Users_authorize_terms',
					url: this.href
				});
			});
		});
	}

	var authResponse;
	if (Users.apps.facebook && Users.apps.facebook[Q.info.app]) {
		Users.init.facebook(function() {
			if ((authResponse = FB.getAuthResponse())) {
				for (var k in authResponse) {
					register_form.append(
						$('<input type="hidden" />')
							.attr('name', 'Q.Users.facebook.authResponse[' + k + ']')
							.attr('value', authResponse[k])
					);
				}
			}
		});
	}

	var $form = $('#Streams_login_step1_form');
	if ($form.data('used') === 'facebook') {
		var platforms = $form.data('platforms');
		var appId = platforms.facebook || Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
		if (!fbAppId) {
			console.warn("Users.defaultSetupRegisterForm: missing Users.apps.facebook."+appId+".appId");
		}
		Users.init.facebook(function() {
			var k;
			if ((authResponse = FB.getAuthResponse())) {
				authResponse.appId = appId;
				authResponse.fbAppId = fbAppId;
				for (k in authResponse) {
					register_form.append(
						$('<input type="hidden" />')
							.attr('name', 'Q.Users.facebook.authResponse[' + k + ']')
							.attr('value', authResponse[k])
					);
				}
			}
		}, {
			appId: appId
		});
		register_form.append($('<input type="hidden" name="app[platform]" value="facebook" />'));
	}
	if (json.emailExists || json.mobileExists) {
		var $p = $('<p id="Streams_login_identifierExists" />')
			.html(json.emailExists ? Q.text.Users.login.emailExists : Q.text.Users.login.mobileExists);
		$('a', $p).click(function () {
			$(this).addClass('Q_working');
			$.post(Q.ajaxExtend(Q.action("Users/resend"), 'data'), 'identifier='+encodeURIComponent(identifier), function () {
				overlay.close();
			});
			return false;
		});
		register_form.prepend($p);
		if (Q.text.Streams.login.newUser) {
			$p.append($('<div />').html(Q.text.Streams.login.newUser));
		}
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
	var cache, item;
	if (avatarStreamNames[sf.name]) {
		var field = sf.name.split('/').pop();
		var userId = sf.publisherId;
		cache = Avatar.get.cache;
		if ((item = cache.get([userId])) && item.subject) {
			item.subject[field] = sf.content;
			cache.set([userId], 0, item.subject, [null, item.subject]);
		}
		if (field === 'username' || field === 'icon') {
			cache = Users.get.cache;
			if (item = cache.get([userId])) {
				var user = item.subject;
				user[field] = sf.content;
				cache.set([userId], 0, item.subject, [null, item.subject]);
			}
		}
	}
}

function updateMessageTotalsCache(publisherId, streamName, messageTotals) {
	if (!messageTotals) {
		return;
	}
	for (var type in messageTotals) {
		MTotal.get.cache.each([publisherId, streamName, type],
			function (k, v) {
				var args = JSON.parse(k);
				var result = v.params[1];
				if (Q.isInteger(result)) {
					v.params[1] = messageTotals[type];
				} else if (Q.isPlainObject[result] && (type in result)) {
					result[type] = messageTotals[type];
				}
			});
		MTotal.get.cache.set([publisherId, streamName, type],
			0, MTotal, [null, messageTotals[type]]
		);
	}
}

function updateStreamCache(stream) {
	Streams.get.cache.each(
		[stream.fields.publisherId, stream.fields.name],
		function (k) {
			var params = Streams.get.cache.get(k).params;
			this.set(k, 0, stream, [null, stream].concat(params.slice(2)));
		}
	);
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
			&& !Q.has(onlyChangedFields, k)) {
			continue;
		}
		Q.handle(
			Q.getObject([publisherId, streamName, k], _streamFieldChangedHandlers),
			stream,
			[fields, k, onlyChangedFields]
		);
		Q.handle(
			Q.getObject([publisherId, '', k], _streamFieldChangedHandlers),
			stream,
			[fields, k, onlyChangedFields]
		);
		Q.handle(
			Q.getObject(['', streamName, k], _streamFieldChangedHandlers),
			stream,
			[fields, k, onlyChangedFields]
		);
		updated[k] = fields[k];
	}
	if (!onlyChangedFields || !Q.isEmpty(updated)) {
		Q.handle(
			Q.getObject([publisherId, streamName, ''], _streamFieldChangedHandlers),
			stream,
			[fields, updated, onlyChangedFields]
		);
		Q.handle(
			Q.getObject([publisherId, '', ''], _streamFieldChangedHandlers),
			stream,
			[fields, updated, onlyChangedFields]
		);
		Q.handle(
			Q.getObject(['', streamName, ''], _streamFieldChangedHandlers),
			stream,
			[fields, updated, onlyChangedFields]
		);
	}
	if (('attributes' in fields)
		&& (!onlyChangedFields || fields.attributes != stream.fields.attributes)) {
		var attributes = JSON.parse(fields.attributes || "{}");
		var obj;
		updated = {};
		cleared = [];

		// events about cleared attributes
		var streamAttributes = stream.getAllAttributes();
		for (k in streamAttributes) {
			if (k in attributes) {
				continue;
			}
			obj = {};
			obj[k] = undefined;
			Q.handle(
				Q.getObject([publisherId, streamName, k], _streamAttributeHandlers),
				stream,
				[fields, obj, [k], onlyChangedFields]
			);
			updated[k] = undefined;
			cleared.push(k);
		}

		// events about updated attributes
		var currentAttributes = JSON.parse(stream.fields.attributes || "{}");
		for (k in attributes) {
			if (JSON.stringify(attributes[k]) === JSON.stringify(currentAttributes[k])) {
				continue;
			}
			obj = {};
			obj[k] = attributes[k];
			Q.handle(
				Q.getObject([publisherId, streamName, k], _streamAttributeHandlers),
				stream,
				[attributes, k, onlyChangedFields]
			);
			updated[k] = attributes[k];
		}
		Q.handle(
			Q.getObject([publisherId, streamName, ''], _streamAttributeHandlers),
			stream,
			[attributes, updated, cleared, onlyChangedFields]
		);
		Q.handle(
			Q.getObject([publisherId, '', ''], _streamAttributeHandlers),
			stream,
			[attributes, updated, cleared, onlyChangedFields]
		);
	}
	// Now time to replace the fields in the stream with the incoming fields
	Q.extend(stream.fields, fields);
	prepareStream(stream);
	updateMessageTotalsCache(publisherId, streamName, stream.messageTotals);
	updateStreamCache(stream);
	updateAvatarCache(stream);
}

function prepareStream(stream) {
	if (stream.fields.messageCount) {
		stream.fields.messageCount = parseInt(stream.fields.messageCount);
	}
	if ('access' in stream.fields) {
		stream.access = Q.copy(stream.fields.access);
		delete stream.fields.access;
	}
	if ('participant' in stream.fields) {
		stream.participant = new Streams.Participant(stream.fields.participant);
		delete stream.fields.participant;
	}
	if ('messageTotals' in stream.fields) {
		stream.messageTotals = stream.fields.messageTotals;
		delete stream.fields.messageTotals;
	}
	if ('relatedToTotals' in stream.fields) {
		stream.relatedToTotals = stream.fields.relatedToTotals;
		delete stream.fields.relatedToTotals;
	}
	if ('relatedFromTotals' in stream.fields) {
		stream.relatedFromTotals = stream.fields.relatedFromTotals;
		delete stream.fields.relatedFromTotals;
	}
	if ('isRequired' in stream.fields) {
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

function _onResultHandler(subject, params, args, shared, original) {
	var key = shared.retainUnderKey;
	if (key == undefined || params[0] || !subject) {
		return; // either retainWith was not called or an error occurred during the request
	}
	if (Streams.isStream(subject)) {
		subject.retain(key);
	} else {
		if (Streams.isStream(subject.stream)) {
			subject.stream.retain(key);
		}
		Q.each(subject.streams, 'retain', [key]);
		Q.each(subject.relatedStreams, 'retain', [key]);
	}
}

Q.Tool.onMissingConstructor.set(function (constructors, normalized) {
	var str = "_preview";
	if (normalized.substr(normalized.length-str.length) === str) {
		constructors[normalized] = "{{Streams}}/js/tools/default/preview.js";
	}
}, 'Streams');

Q.beforeInit.add(function _Streams_beforeInit() {

	var where = Streams.cache.where || 'document';

	Stream.get = Streams.get = Q.getter(Streams.get, {
		cache: Q.Cache[where]("Streams.get", 100),
		throttle: 'Streams.get',
		prepare: function (subject, params, callback) {
			if (Streams.isStream(subject)) {
				return callback(subject, params);
			}
			if (params[0]) {
				return callback(subject, params);
			}
			Stream.construct(subject, {}, function () {
				params[1] = this;
				callback(this, params);
			});
		}
	});

	Streams.related = Q.getter(Streams.related, {
		cache: Q.Cache[where]("Streams.related", 100),
		throttle: 'Streams.related',
		prepare: function (subject, params, callback) {
			if (params[0] || !Q.isEmpty(subject.errors)) { // some error
				return callback(subject, params);
			}
			var keys = Object.keys(subject.relatedStreams).concat(['stream']);
			var pipe = Q.pipe(keys, function () {
				callback(subject, params);
			});
			Stream.construct(subject.stream, {}, function () {
				subject.stream = this;
				pipe.fill('stream')();
			});
			Q.each(subject.relatedStreams, function (i) {
				Stream.construct(this, function () {
					subject.relatedStreams[i] = this;
					pipe.fill(i)();
				});
			});
		}
	});

	Message.get = Q.getter(Message.get, {
		cache: Q.Cache[where]("Streams.Message.get", 100),
		throttle: 'Streams.Message.get',
		prepare: function (subject, params, callback, args) {
			if (params[0]) {
				return callback(this, params);
			}
			if (Q.isPlainObject(args[2])) {
				var p1 = params[1];
				Q.each(p1, function (ordinal, message) {
					message = message && Message.construct(message, true);
					p1[ordinal] = message;
				});
			} else {
				params[1] = message && Message.construct(message, true);
			}
			callback(params[1], params);
		}
	});

	MTotal.get = Q.getter(MTotal.get, {
		cache: Q.Cache[where]("Streams.Message.Total.get", 100),
		throttle: 'Streams.Message.Total.get'
	});

	Participant.get = Q.getter(Participant.get, {
		cache: Q.Cache[where]("Streams.Participant.get", 100),
		throttle: 'Streams.Participant.get',
		prepare: function (subject, params, callback, args) {
			if (params[0]) {
				return callback(this, params);
			}
			if (Q.isPlainObject(args[2])) {
				var p1 = params[1];
				Q.each(p1, function (userId, participant) {
					participant = participant && new Participant(participant);
					p1[userId] = participant;
				});
			} else {
				params[1] = subject && new Participant(subject);
			}
			callback(params[1], params);
		}
	});

	Avatar.get = Q.getter(Avatar.get, {
		cache: Q.Cache[where]("Streams.Avatar.get", 1000),
		throttle: 'Streams.Avatar.get',
		prepare: function (subject, params, callback) {
			if (params[0]) {
				return callback(this, params);
			}
			params[1] = subject && new Avatar(subject);
			callback(params[1], params);
		}
	});

	Avatar.byPrefix = Q.getter(Avatar.byPrefix, {
		cache: Q.Cache[where]("Streams.Avatar.byPrefix", 100),
		throttle: 'Streams.Avatar.byPrefix'
	});

	Q.each([Streams.get, Streams.related], function () {
		this.onCalled.set(_onCalledHandler, 'Streams');
		this.onResult.set(_onResultHandler, 'Streams');
	});

}, 'Streams');

Q.onInit.add(function _Streams_onInit() {
	var Users = Q.plugins.Users;
	
	Q.Text.get('Streams/content', function (err, text) {
		if (!text) {
			return;
		}
		Q.extend(Q.text.Streams, 10, text);
	});
	
	if (Streams.options.overrideUserRegistrationForm) {
		Users.login.options.setupRegisterForm = Streams.setupRegisterForm;	
	}
	Q.text.Users.login.placeholders.fullName = 'Enter your full name';
	Q.text.Users.login.maxlengths.fullName = 50;

	Users.onLogin.set(function (user) {
		if (user) { // the user changed
			Interests.my = {};
			_clearCaches();
		};
		_connectSockets.apply(this, arguments);
		_notificationsToNotice();
	}, "Streams");
	Users.onLogout.set(function () {
		Interests.my = {}; // clear the interests
		_clearCaches();
		if (Streams.invited) {
			Streams.invited.dialog = null;  // clear invited dialog info
		}
		Q.Socket.destroyAll();
	}, "Streams");
	if (Users.loggedInUser) {
		_connectSockets(true); // refresh streams
		_notificationsToNotice();
	}

	// handle resign/resume application in Cordova
	if (Q.info.isCordova) {
		Q.addEventListener(document, ['resign', 'pause'], _disconnectSockets);
		Q.addEventListener(document, 'resume', function () {
			_connectSockets(true);
		});
	}

	/**
	 * Listen for messages and show them as notices
	 */
	function _notificationsToNotice () {
		var userId = Q.Users.loggedInUserId();
		var notificationsAsNotice = Q.getObject("Q.plugins.Streams.notifications.notices");

		if (!userId || !notificationsAsNotice) {
			return;
		}

		Users.Socket.onEvent('Streams/post').set(function (message) {
			message = Streams.Message.construct(message);
			var messageType = message.type;
			var messageUrl = message.getInstruction('inviteUrl') || message.getInstruction('url');
			var noticeOptions = notificationsAsNotice[messageType];
			var pluginName = messageType.split('/')[0];

			// if this message type absent in config
			if (!noticeOptions) {
				return;
			}

			// skip myself messages
			if (message.byUserId === userId) {
				return;
			}

			// skip messages older than 24 hours
			var timeDiff = Math.abs((new Date(message.sentTime).getTime() - new Date().getTime()))/1000;
			if (timeDiff >= parseInt(Q.Streams.notifications.notices.expired)) {
				return;
			}

			Q.Text.get(pluginName + '/content', function (err, content) {
				var text = Q.getObject(["notifications", messageType], content);
				if (!text || typeof text !== 'string') {
					return console.warn('Streams.notifications.notices: no text for ' + messageType);
				}

				Streams.showNoticeIfSubscribed({
					publisherId: message.publisherId,
					streamName: message.streamName,
					messageType: message.type,
					evenIfNotSubscribed: noticeOptions.evenIfNotSubscribed,
					callback: function () {
						var stream = this;

						if (stream.fields.name === 'Streams/invited') {
							stream.fields.title = message.getInstruction('title');
						}

						// special behavior for Streams/invite
						if (messageType === "Streams/invite") {
							var label = message.getInstruction('label');
							var inviteUrl = message.getInstruction('inviteUrl');
							var template = Q.Template.compile(text, 'handlebars');
							var html = template({
								app: Q.info.app,
								info: Q.info,
								stream: stream,
								message: message
							});

							if (label) {
								if (typeof label === "string") {
									label = [label];
								}
								// convert labels to readable
								Q.each(Users.labels, function (labelKey) {
									var index = label.indexOf(labelKey);
									if (index < 0 || !this.title) {
										return;
									}
									label[index] = this.title;
								});
								html += " as " + label.join(', ');
							}

							html += "<br>" + content.labels.DoYouAgree;
							Q.confirm(html, function (res) {
								if (res) {
									Q.handle(inviteUrl);
								}
							}, {
								ok: content.labels.Yes,
								cancel: content.labels.No
							});
							return;
						}

						Streams.Avatar.get(message.byUserId, function (err, avatar) {
							var source = (noticeOptions.showSubject !== false ? text : '');
							if (!source) {
								return;
							}
							try {
								var template = Q.Template.compile(source, 'handlebars');
								var html = template({
									app: Q.info.app,
									info: Q.info,
									stream: stream,
									avatar: avatar,
									message: message
								});
								Q.Notices.add(Q.extend(noticeOptions, {
									content: html,
									handler: messageUrl || stream.url()
								}));
							} catch (e) {
								console.warn(e);
							}
						});
					}
				});
			});
		}, 'Streams.notifications.notice');
	}

	// handle updates
	function _updateDisplayName(fields, k) {
		Avatar.get.force(Users.loggedInUser.id, function () {
			var liu = Q.Users.loggedInUser;
			liu.username = this.username;
			liu.displayName = this.displayName();
			liu.icon = this.icon;
		});
	}
	if (Users.loggedInUser) {
		var key = 'Streams.updateDisplayName';
		Q.Streams.Stream.onFieldChanged(
			Users.loggedInUser.id, "Streams/user/firstName", "content"
		).or(Q.Streams.Stream.onFieldChanged(
			Users.loggedInUser.id, "Streams/user/lastName", "content"), key, key
		).or(Q.Streams.Stream.onFieldChanged(
			Users.loggedInUser.id, "Streams/user/username", "content"), key, key
		).debounce(50, false, key).set(_updateDisplayName, 'Streams');
	}

	// handle going online after being offline
	Q.onOnline.set(function () {
		_connectSockets(true);
	}, 'Streams');

	var _showedComplete = false;

	// set up invite complete dialog
	Q.Page.onLoad('').add(function _Streams_onPageLoad() {
		var params = Q.getObject("Q.plugins.Streams.invited.dialog");
		if (!params || _showedComplete) {
			return;
		}
		_showedComplete = true;
		if (Q.Users.loggedInUserId()) {
			_showDialog();
		} else {
			params.loggedInFirst = true;
			Q.Users.login({
				onSuccess: {'Users': _showDialog}
			});
		}
		function _showDialog() {
			var templateName = params.templateName || 'Streams/invited/complete';
			params.prompt = (params.prompt !== undefined)
				? params.prompt
				: Q.text.Streams.login.prompt;
			Stream.construct(params.stream, function () {
				params.stream = this;
				params.communityId = params.communityId || Q.Users.communityId;
				params.communityName = params.communityName || Q.Users.communityName;
				Q.Template.render(templateName, params,
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
									dialog.find('#Streams_login_fullname')
										.attr('maxlength', l.maxlengths.fullName)
										.attr('placeholder', l.placeholders.fullName)
										.plugin('Q/placeholders');
									if (!Q.info.isTouchscreen) {
										var $input = $('input', dialog).eq(0);
										$input.plugin('Q/clickfocus');
										interval = setInterval(function () {
											if ($input.val() || $input[0] === document.activeElement) {
												return clearInterval(interval);
											}
											$input.plugin('Q/clickfocus');
										}, 100);
									}
									var $complete_form = dialog.find('form')
										.plugin('Q/validator')
										.submit(function(e) {
											e.preventDefault();
											var baseUrl = Q.baseUrl({
												publisherId: Q.plugins.Users.loggedInUser.id,
												streamName: "Streams/user/firstName"
											});
											var url = 'Streams/basic?' + $(this).serialize();
											Q.req(url, ['data'], function _Streams_basic(err, data) {
												var msg = Q.firstErrorMessage(err, data);
												if (data && data.errors) {
													$complete_form.plugin('validator', 'invalidate',
														Q.ajaxErrors(data.errors, ['fullName'])
													);
													$('input', $complete_form).eq(0)
														.plugin('Q/clickfocus');
													return;
												} else if (msg) {
													return alert(msg);
												}
												$complete_form.plugin('Q/validator', 'reset');
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
											var val = dialog.find('#Streams_login_fullname').val();
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
			}, true);
		}
	}, "Streams");

	Users.Socket.onEvent('Streams/debug').set(function _Streams_debug_handler (msg) {
		console.log('DEBUG:', msg);
	}, 'Streams');

	// if stream was edited or removed - invalidate cache
	Users.Socket.onEvent('Streams/remove').set(function _Streams_remove_handler (stream) {
		Streams.get.cache.each([msg.publisherId, msg.streamName],
			function (k, v) {
				this.remove(k);
				updateAvatarCache(v.subject);
			});
	}, 'Streams');

	Users.Socket.onEvent('Streams/join').set(function _Streams_join_handler (p) {
		// 'join' event contains new participant.
		console.log('Users.Socket.onEvent("Streams/join")', p);
		Participant.get.cache.set(
			[p.publisherId, p.streamName, p.userId],
			0, p, [null, p]
		);
	}, 'Streams');

	Users.Socket.onEvent('Streams/leave').set(function (p) {
		// 'leave' event contains removed participant.
		console.log('Users.Socket.onEvent("Streams/leave")', p);
		Participant.get.cache.set(
			[p.publisherId, p.streamName, p.userId],
			0, p, [null, p]
		);
	});
	
	Users.Socket.onEvent('Streams/ephemeral').set(function (payload, byUserId) {
		Streams.get(payload.publisherId, payload.streamName, function (err) {
			if (err) {
				console.warn(Q.firstErrorMessage(err));
				return;
			}
			var streamType = stream.fields.type;
			var params = [stream, payload, 'ephemeral', latest];
			var event = Streams.onEphemeral(streamType, payload.type);
			Q.handle(event, stream, [payload]);
			event = Streams.Stream.onEphemeral(payload.publisherId, payload.streamName, payload.type);
			Q.handle(event, stream, [payload]);
		});
	});

	Users.Socket.onEvent('Streams/post').set(function _Streams_post_handler (msg, messages) {
		if (!msg) {
			throw new Q.Error("Q.Users.Socket.onEvent('Streams/post') msg is empty");
		}
		var latest = Message.latestOrdinal(msg.publisherId, msg.streamName, false);
		if (latest && parseInt(msg.ordinal) <= latest) {
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
			// TODO: if a message was simulated with this ordinal, and this message
			// was expected (e.g. it returns the same id that the simulated message had)
			// then you can skip processing this message.

			// Otherwise, we have a new message posted - update cache
			console.log('Users.Socket.onEvent("Streams/post")', msg);
			var message = (msg instanceof Message)
				? msg
				: Message.construct(msg, true);
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
				var usingCached = Q.getter.usingCached;

				// update the stream
				stream.fields.messageCount = msg.ordinal;
				// update the Streams.Message.Total.get.cache first
				_updateMessageTotalsCache(msg);
				// now update the message cache
				_updateMessageCache(msg);

				var latest = MTotal.latest(msg.publisherId, msg.streamName, msg.type);
				var params = [stream, message, messages, latest];

				// Handlers for below events might call message.seen() to update latest messageTotals.
				// Otherwise, if no one updated them, synchronously, fire an event.
				var unseen = MTotal.unseen(msg.publisherId, msg.streamName, msg.type);
				if (unseen) {
					setTimeout(function () {
						params.push(unseen);
						Q.handle(Streams.onMessageUnseen, Streams, params);
					}, 0);
				}

				var streamType = stream.fields.type;
				var instructions = msg.instructions && JSON.parse(msg.instructions);
				var updatedParticipants = true;
				var prevState;
				switch (msg.type) {
					case 'Streams/join':
						prevState = message.getInstruction('prevState');
						_updateParticipantCache(msg, 'participating', prevState, usingCached);
						break;
					case 'Streams/leave':
						prevState = message.getInstruction('prevState');
						_updateParticipantCache(msg, 'left', prevState, usingCached);
						break;
					case 'Streams/changed':
						if (Q.isEmpty(instructions.changes)) {
							return;
						}
						var doRefresh = false;
						for (var f in instructions.changes) {
							if (instructions.changes[f] == null) {
								// One of the extended fields has changed, but we don't
								// know the new value.
								doRefresh = true;
								break;
							}
						}
						if (doRefresh) {
							// Refresh the stream, this will trigger Stream.update on success
							Stream.refresh(stream.fields.publisherId, stream.fields.name, null, {
								evenIfNotRetained: true
							});
						} else {
							Stream.update(stream, instructions.changes, null);
						}
						break;
					case 'Streams/progress':
						Stream.update(stream, instructions, null);
						break;
					case 'Streams/relatedFrom':
						_updateRelatedCache(msg, instructions);
						_updateRelatedTotalsCache(msg, instructions, 'From', 1);
						_relationHandlers(_streamRelatedFromHandlers, msg, stream, instructions);
						break;
					case 'Streams/relatedTo':
						_updateRelatedCache(msg, instructions);
						_updateRelatedTotalsCache(msg, instructions, 'To', 1);
						_relationHandlers(_streamRelatedToHandlers, msg, stream, instructions);
						break;
					case 'Streams/unrelatedFrom':
						_updateRelatedCache(msg, instructions);
						_updateRelatedTotalsCache(msg, instructions, 'From', -1);
						_relationHandlers(_streamUnrelatedFromHandlers, msg, stream, instructions);
						break;
					case 'Streams/unrelatedTo':
						_updateRelatedCache(msg, instructions);
						_updateRelatedTotalsCache(msg, instructions, 'To', -1);
						_relationHandlers(_streamUnrelatedToHandlers, msg, stream, instructions);
						break;
					case 'Streams/updatedRelateFrom':
						_updateRelatedCache(msg, instructions);
						_relationHandlers(_streamUpdatedRelateFromHandlers, msg, stream, instructions);
						break;
					case 'Streams/updatedRelateTo':
						_updateRelatedCache(msg, instructions);
						_relationHandlers(_streamUpdatedRelateToHandlers, msg, stream, instructions);
						break;
					case 'Streams/closed':
						Stream.update(stream, instructions, null);
						var sf = stream.fields;
						var Qh = Q.handle;
						var Qgo = Q.getObject;
						Qh(Qgo([sf.publisherId, sf.name], _streamClosedHandlers), stream, [instructions]);
						Qh(Qgo([sf.publisherId, ''], _streamClosedHandlers), stream, [instructions]);
						Qh(Qgo(['', sf.name], _streamClosedHandlers), stream, [instructions]);
						Qh(Qgo(['', ''], _streamClosedHandlers), stream, [instructions]);
						break;
					default:
						break;
				}

				_handlers(streamType, msg, params);

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
			});
		}
	}, 'Streams');
	
	function _handlers(streamType, msg, params) {
		_messageHandlers[streamType] &&
		_messageHandlers[streamType][msg.type] &&
		Q.handle(_messageHandlers[streamType][msg.type], Streams, params);

		_messageHandlers[''] &&
		_messageHandlers[''][msg.type] &&
		Q.handle(_messageHandlers[''][msg.type], Streams, params);

		_messageHandlers[streamType] &&
		_messageHandlers[streamType][''] &&
		Q.handle(_messageHandlers[streamType][''], Streams, params);

		_messageHandlers[''] &&
		_messageHandlers[''][''] &&
		Q.handle(_messageHandlers[''][''], Streams, params);

		Q.each([msg.publisherId, ''], function (ordinal, publisherId) {
			Q.each([msg.streamName, ''], function (ordinal, streamName) {
				Q.handle(
					Q.getObject([publisherId, streamName, ordinal], _streamMessageHandlers),
					Streams,
					params
				);
				Q.handle(
					Q.getObject([publisherId, streamName, msg.type], _streamMessageHandlers),
					Streams,
					params
				);
				Q.handle(
					Q.getObject([publisherId, streamName, ''], _streamMessageHandlers),
					Streams,
					params
				);
			});
		});
	}

	Q.beforeActivate.add(_preloaded, 'Streams');
	Q.loadUrl.options.onResponse.add(_preloaded, 'Streams');

	Q.addEventListener(window, Streams.refresh.options.duringEvents, Streams.refresh);
	_scheduleUpdate();

	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		Q.Template.set('Streams/followup/mobile/alert', Q.getObject(["followup", "mobile", "alert"], text));
		Q.Template.set('Streams/followup/mobile/confirm', Q.getObject(["followup", "mobile", "confirm"], text));
		Q.Template.set('Streams/followup/mobile', Q.getObject(["followup", "mobile", "check"], text));
		Q.Template.set('Streams/followup/email/alert', Q.getObject(["followup", "email", "alert"], text));
		Q.Template.set('Streams/followup/email/confirm', Q.getObject(["followup", "email", "confirm"], text));
		Q.Template.set('Streams/followup/email/subject', Q.getObject(["followup", "email", "subject"], text));
		Q.Template.set('Streams/followup/email/body', Q.getObject(["followup", "email", "body"], text));
	});
}, 'Streams');

Q.Tool.beforeRemove("").set(function (tool) {
	Streams.release(this);
}, 'Streams');

Q.Page.beforeUnload("").set(function () {
	Streams.release(true);
}, 'Stream');

function _preloaded(elem) {
	// Every time before anything is activated,
	// process any preloaded streams and avatars data we find
	Q.each(Stream.preloaded, function (i, fields) {
		Stream.construct(fields, {}, null, true);
	});
	Stream.preloaded = null;
	Q.each(Avatar.preloaded, function (i, fields) {
		var avatar = new Avatar(fields);
		Avatar.get.cache.set([fields.publisherId], 0, avatar, [null, avatar]);
	});
	Avatar.preloaded = null;
}

function _updateMessageCache(msg) {
	if (Streams.cache.where === 'local' && Q.Frames && !Q.Frames.isMain()) {
		return false; // do nothing, this isn't the main frame
	}
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

function _updateRelatedTotalsCache(msg, instructions, which, change) {
	if (Streams.cache.where === 'local' && Q.Frames && !Q.Frames.isMain()) {
		return false; // do nothing, this isn't the main frame
	}
	Streams.get.cache.each([msg.publisherId, msg.streamName],
		function (k, v) {
			var stream = (v && !v.params[0]) ? v.subject : null;
			if (!stream) {
				return;
			}
			var f = 'related' + which + 'Totals';
			if (stream[f] && stream[f][instructions.type]) {
				stream[f][instructions.type] += change;
			}
		});
}

function _updateMessageTotalsCache(msg) {
	if (Streams.cache.where === 'local' && Q.Frames && !Q.Frames.isMain()) {
		return false; // do nothing, this isn't the main frame
	}
	Streams.get.cache.each([msg.publisherId, msg.streamName],
		function (k, v) {
			var stream = (v && !v.params[0]) ? v.subject : null;
			if (!stream) {
				return;
			}
			if (stream.messageTotals && stream.messageTotals[msg.type]) {
				++stream.messageTotals[msg.type];
			}
		});
	MTotal.get.cache.each([msg.publisherId, msg.streamName, msg.type],
		function (k, v) {
			var args = JSON.parse(k);
			var result = v.params[1];
			if (Q.isInteger(result)) {
				++v.params[1];
			} else if (Q.isPlainObject[result] && (type in result)) {
				++result[type];
			}
		});
}

function _updateParticipantCache(msg, newState, prevState, usingCached) {
	Participant.get.cache.removeEach([msg.publisherId, msg.streamName]);
	if (!usingCached) {
		return;
	}
	var sawStreams = [];
	Streams.get.cache.each([msg.publisherId, msg.streamName],
		function (k, v) {
			var stream = (v && !v.params[0]) ? v.subject : null;
			if (!stream) {
				return;
			}
			var args = JSON.parse(k);
			var extra = args[2];
			if (extra && extra.participants) {
				this.remove(k);
			}
			if (sawStreams.indexOf(stream) >= 0) {
				return;
			}
			sawStreams.push(stream);
			if (prevState) {
				--stream.fields[prevState+'Count'];
			}
			++stream.fields[newState+'Count'];
		});
}

function _updateRelatedCache(msg, instructions) {
	Streams.related.cache.removeEach([msg.publisherId, msg.streamName]);
	if (instructions.toPublisherId) {
		Streams.related.cache.removeEach(
			[instructions.toPublisherId, instructions.toStreamName]
		);
		Streams.Stream.refresh(
			instructions.toPublisherId, instructions.toStreamName,
			null, { messages: true, unlessSocket: true }
		);
	} else if (instructions.fromPublisherId) {
		Streams.related.cache.removeEach(
			[instructions.fromPublisherId, instructions.fromStreamName]
		);
		Streams.Stream.refresh(
			instructions.fromPublisherId, instructions.fromStreamName,
			null, { messages: true, unlessSocket: true }
		);
	}
}

function _clearCaches() {
	// Clear caches so permissions can be recalculated as various objects are fetched
	Streams.get.cache.clear();
	Streams.related.cache.clear();
	Message.get.cache.clear();
	Participant.get.cache.clear();
	Avatar.get.cache.clear();
	MTotal.seen.cache.clear();
	_retainedByKey = {};
	_retainedByStream = {};
	_retainedStreams = {};
	_retainedNodes = {};
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
			if (Streams.refresh.options.preventAutomatic) {
				return;
			} else {
				_debouncedRefresh();
			}
		}
		_scheduleUpdate.lastTime = now;
		setTimeout(_scheduleUpdate, ms);
	}, ms);
}

function _refreshUnlessSocket(publisherId, streamName, options) {
	return Stream.refresh(publisherId, streamName, null, Q.extend({
		messages: true,
		unlessSocket: true
	}, options));
}

_scheduleUpdate.delay = 5000;


// show Q.Notice when somebody opened webrtc in chat where current user participated
Users.Socket.onEvent('Streams/post').set(function (message) {
	message = Streams.Message.construct(message);
	var instructions = message.getAllInstructions();
	var relationType = Q.getObject("type", instructions);
	var publisherId = Q.getObject("fromPublisherId", instructions);
	var streamName = Q.getObject("fromStreamName", instructions);
	var toStreamName = Q.getObject("streamName", message) || "";
	var toPublisherId = Q.getObject("publisherId", message) || "";
	var toUrl = Q.getObject("toUrl", instructions);
	var conversationUrl;

	// only relation type Streams/webrtc and not for myself
	if (relationType !== 'Streams/webrtc' || publisherId === Q.Users.loggedInUserId() || !toUrl) {
		return;
	}

	// skip messages older than 24 hours
	var timeDiff = Math.abs((new Date(message.sentTime).getTime() - new Date().getTime()))/1000;
	if (timeDiff >= parseInt(Q.Streams.notifications.notices.expired)) {
		return;
	}

	toUrl += '?startWebRTC';

	Q.Text.get("Streams/content", function (err, text) {
		Streams.showNoticeIfSubscribed({
			publisherId: toPublisherId,
			streamName: toStreamName,
			messageType: message.type,
			callback: function () {
				Q.Template.render('Streams/chat/webrtc/available', {
					avatar: Q.Tool.setUpElementHTML('div', 'Users/avatar', {
						userId: publisherId,
						icon: false,
						short: true
					}),
					text: text.chat.startedConversation
				}, function (err, html) {
					if (err) {
						return;
					}

					Q.Notices.add({
						content: html,
						handler: function () {
							if (window.location.href.includes(conversationUrl)) {
								var tool = Q.Tool.from($(".Q_tool.Streams_chat_tool[data-streams-chat*='" + toStreamName + "']"), "Streams/chat");

								if (tool) {
									return tool.startWebRTC();
								}
							}

							Q.handle(toUrl);
						}
					});
				});
			}
		});
	});
}, "Streams.chat.webrtc");
Q.Template.set('Streams/chat/webrtc/available',
	'<div class="Streams_chat_webrtc_available">'+
	'	{{& avatar}} {{text}}'+
	'</div>'
);

Q.Streams.cache = Q.Streams.cache || {};

})(Q, jQuery);
