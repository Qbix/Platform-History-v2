/**
 * Class representing stream rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');
var Users = Q.require('Users');

Q.makeEventEmitter(Streams_Stream);

/**
 * Class representing 'Stream' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's fm server
 * @namespace Streams
 * @class Stream
 * @extends Base.Streams.Stream
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Stream (fields) {

	// Run constructors of mixed in objects
	Streams_Stream.constructors.apply(this, arguments);


	var p = {};
	
	/**
	 * Sets some extra data
	 * @method set
	 * @param {String} key
	 * @param {mixed} value
	 *  The value to set for that extra data
	 */
	this.set = function (key, value) {
		p[key] = value;
	};
	
	/**
	 * Gets the value of an extra field
	 * @method get
	 * @param {String} key
	 * @param {mixed} [def=null]
	 *  The value to return if the field is not found.
	 *  Defaults to undefined.
	 * @return {mixed}
	 *  The field if it is found, otherwise def or undefined.
	 */
	this.get = function (key, def) {
		if (key in p) return p[key];
		else return def;
	};
	
	/**
	 * Clears the value of an extra field
	 * @method clear
	 * @param {String} [key=null]
	 *  A key to clear. If null, clears all keys.
	 */
	this.clear = function (key) {
		if (key === undefined) p = {};
		else delete p[key];
	};
	
	/**
	 * @method getAllAttributes
	 * @return {Object} The object of all attributes set in the stream
	 */
	this.getAllAttributes = function() {
		return this.fields.attributes ? JSON.parse(this.fields.attributes) : {};
	};
	
	/**
	 * @method getAttribute
	 * @param {String} attributeName The name of the attribute to get
	 * @param {mixed} def The value to return if the attribute is missing
	 * @return {mixed} The value of the attribute, or the default value, or null
	 */
	this.getAttribute = function(attributeName, def) {
		var attr = this.getAllAttributes();
		return (attributeName in attr) ? attr[attributeName] : def;
	};
	
	/**
	 * @method setAttribute
	 * @param {string} attributeName The name of the attribute to set,
	 *  or an array of {attributeName: attributeValue} pairs
	 * @param {mixed} value The value to set the attribute to
	 */
	this.setAttribute = function(attributeName, value) {
		var attr = this.getAllAttributes();
		if (Q.isPlainObject(attributeName)) {
			Q.extend(attr, attributeName);
		} else {
			attr[attributeName] = value;
		}
		this.fields.attributes = JSON.stringify(attr);
	};
	
	/**
	 * @method clearAttribute
	 * @param {String} attributeName The name of the attribute to remove
	 */
	this.clearAttribute = function(attributeName) {
		var attr = this.getAllAttributes();
		delete attr[attributeName];
		this.fields.attributes = JSON.stringify(attr);
	};
	
	/**
	 * @method clearAllAttributes
	 */
	this.clearAllAttributes = function() {
		this.fields.attributes = '{}';
	};
}

Q.mixin(Streams_Stream, Q.require('Base/Streams/Stream'));

Streams_Stream.construct = function Streams_Stream_construct(fields) {
	if (Q.isEmpty(fields)) {
		Q.handle(callback, this, ["Streams.Stream constructor: fields are missing"]);
		return false;
	}
	if (fields.fields) {
		fields = fields.fields;
	}
	var type = Q.normalize(fields.type);
	var SC = Streams.defined[type];
	if (!SC) {
		SC = Streams.defined[type] = function StreamConstructor(fields) {
			StreamConstructor.constructors.apply(this, arguments);
			// Default constructor. Copy any additional fields.
			if (!fields) return;
			for (var k in fields) {
				this.fields[k] = Q.copy(fields[k]);
			}
		};
		Q.mixin(SC, Streams_Stream);
	}
	return new SC(fields);
};

Streams_Stream.define = Streams.define;

Sp = Streams_Stream.prototype;

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Sp.setUp = function () {
	// put any code here
};

/**
 * Updates a field using an arithmetic expression
 * @method updateField
 * @private
 * @param {string} field
 *	The name of the field to update
 * @param {string} expr
 *	Will be wrapped in a Db.Expression
 * @param {function} callback=null
 *	Callback receives error and result as arguments
 */
function updateField (field, expr, callback) {
	var o = {};
	o[field] = new Db.Expression(expr);
	Q.require('Streams').Stream.UPDATE().where({
		publisherId: this.fields.publisherId,
		name: this.fields.name
	}).set(o).execute(callback);
}

/**
 * Verifies wheather Stream can be handled. Can be called syncronously and in such case skips
 * verification of inherited access or asyncronously to make ful check
 * @method testLevel
 * @private
 * @param {string} type
 * @param {string} values
 * @param {string|integer} level
 * @param callback=null {function}
 *	Callback receives "error" and boolean as arguments - whether the access is granted.
 */
function testLevel (subj, type, values, level, callback) {
	if (subj.publishedByFetcher) {
		callback && callback.call(subj, null, true);
		return true;
	}
	if (subj.closedTime && level !== 'close' && !subj.testWriteLevel('close')) {
		return false;
	}
	var LEVEL = Streams[values];
	if (typeof level === "string") {
		if (typeof LEVEL[level] === "undefined") return false;
		level = LEVEL[level];
	}
	if (level < 0) {
		callback && callback.call(subj, null, false);
		return false;
	}
	if (subj.get(type, 0) >= level) {
		callback && callback.call(subj, null, true);
		return true;
	}

	var levelSource = subj.get(type+'_source', 0);
	if (levelSource === Streams.ACCESS_SOURCES['direct'] ||
		levelSource == Streams.ACCESS_SOURCES['inherited_direct']) {
		callback && callback.call(subj, null, false);
		return false;
	}
	callback && subj.inheritAccess(function(err, res) {
		if (err) {
			callback.call(subj, err);
		} else {
			if (!res) callback.call(subj, null, false);
			else {
				if (subj.get(type, 0) >= level) callback.call(subj, null, true);
				else callback.call(subj, null, false);
			}
		}
	});
	return false;
}

function _sortTemplateTypes(templates, field, type, shortName) {
	if (templates.length) {
		// let's sort templates out
		// we'll check to find first match:
		//	1. exact stream name and exact publisher id - this is record for existing row
		//	2. generic stream name and exact publisher id
		//	3. exact stream name and generic publisher
		//	4. generic stream name and generic publisher
		var sts = [[], [], [], []], i, t, pos, n, key;
		var name = shortName ? 'name' : 'streamName';
		for (i=0; i<templates.length; i++) {
			t = templates[i];
			pos = t.fields[name].length - 1;
			if (t.fields[field] === '') {
				// generic publisher
				key = (n[pos] === '/') ? 3 : 2;
			} else {
				// userId
				key = (n[pos] === '/') ? 1 : 0;
			}
			if (type) sts[key].push(t);
			else sts[key] = t;
		}

		if (type) {
			// we are looking for all templates
			for (i=0; i<sts.length; i++) {
				if (sts[i].length) return sts;
			}
		} else {
			// we are looking for exactly one template
			for (type=0; type < 4; type++) {
				if (sts[type]) {
					sts.template_type = type;
					return sts[type];
				}
			}
		}
	}
	return null;
}

Sp.getSubscriptionTemplate = function(className, userId, callback) {
	// fetch template for subscription's PK - publisher, name & user
	var stream = this;
	Streams[className].SELECT('*').where({
		publisherId: stream.fields.publisherId,
		streamName: [stream.fields.name, stream.fields.type+'/'],
		ofUserId: ['', userId]
	}).execute(function(err, res) {
		if (err) return callback.call(stream, err);
		callback.call(stream, null, _sortTemplateTypes(res, 'ofUserId'));
	});
};

/**
 * Increase participant count for the stream
 * @method incParticipants
 * @param callback=null {function}
 *	Callback receives "error" and "result" as arguments
 */
Sp.incParticipants = function (callback) {
	updateField.call(this, 'participantCount', "participantCount + 1", callback);
};

/**
 * Decrease participant count for the stream
 * @method decParticipants
 * @param callback=null {function}
 *	Callback receives "error" and "result" as arguments
 */
Sp.decParticipants = function (callback) {
	updateField.call(this, 'participantCount', "participantCount - 1", callback);
};

/**
 * Sends a message to all participants of a stream
 * @method messageParticipants
 * @param event {string}
 * @param uid {string} User who initiated the event
 * @param message {string} The message
 */
Sp.messageParticipants = function (event, uid, msg) {
	var fields = this.fields;
	var stream = this;
	Streams.getParticipants(fields.publisherId, fields.name, function (participants) {
		var debug, userId;
		msg.fields.streamType = fields.type;
		for (userId in participants) {
			var participant = participants[userId];
			stream.notify(participant, event, uid, msg, function(err) {
				if (err) {
					Q.log("Failed to notify user '"+participant.fields.userId+"': ");
					Q.log(err);
				}
			});
		}
	});
};

/**
 * Set access data for the stream. Acces data is calculated:
 *	<ol>
 *		<li>from read/write/admin level fields of the stream</li>
 *		<li>from labels. Streams_Access record may contain &lt;publisherId&gt;, &lt;streamName&gt;
 *			(allowed exact match or generic name "&lt;streamType&gt;/") and
 *			&lt;ofContactLabel&gt;. If &lt;publisherId&gt; is recorded in Users_Contact
 *			to have either current user or &lt;ofContactLabel&gt; as contact, access claculation is
 *			considering such record.</li>
 *		<li>from user. Stream_Access record may contain &lt;publisherId&gt;, &lt;streamName&gt;
 *			(allowed exact match or generic name "&lt;streamType&gt;/") and
 *			&lt;ofUserId&gt;. Such record is considered in access calculation.</li>
 *	</ol>
 * @method calculateAccess
 * @param {string} $asUserId=''
 * @param callback=null {function}
 *	Callback receives "error" as argument
 */
Sp.calculateAccess = function(asUserId, callback) {
	if (typeof asUserId === "function") {
		callback = asUserId;
		asUserId = null;
	}
	if (!callback) return;
	var subj = this;

	var public_source = Streams.ACCESS_SOURCES['public'];

	this.set('asUserId', asUserId);
	this.set('readLevel', this.fields.readLevel);
	this.set('writeLevel', this.fields.writeLevel);
	this.set('adminLevel', this.fields.adminLevel);
	this.set('readLevel_source', public_source);
	this.set('writeLevel_source', public_source);
	this.set('adminLevel_source', public_source);

	if (!asUserId) {
		callback.call(subj); // No need to fetch further access info. Just return what we got.
		return;
	}

	if (asUserId && asUserId === this.fields.publisherId) {
		// The publisher should have full access to every one of their streams.
		this.publishedByFetcher = true;
		callback.call(subj);
		return;
	}

	var p = new Q.Pipe(['rows1', 'rows2'], function (res) {
		var err = res.rows1[0] || res.rows2[0];
		if (err) return callback.call(subj, err);
		var rows = res.rows1[1].concat(res.rows2[1]);
		var labels = [];
		for (var i=0; i<rows.length; i++) {
			if (rows[i].fields.ofContactLabel) labels.push(rows[i].fields.ofContactLabel);
		}
		if (labels.length) {
			Users.Contact.SELECT('*').where({
				'userId': subj.fields.publisherId,
				'contactUserId': asUserId
			}).execute(function (err, q1) {
				if (err) callback.call(subj, err);
				else {
					Users.Contact.SELECT('*').where({
						'userId':  subj.fields.publisherId,
						'label': labels
					}).execute(function (err, q2) {
						if (err) callback.call(subj, err);
						else {
							// NOTE: we load arrays into memory and hope they are not too large
							var result = q1.concat(q2), row;
							var contact_source = Streams.ACCESS_SOURCES['contact'];
							for (var i=0; i<result.length; i++) {
								for (var j=0; j<rows.length; j++) {
									row = rows[j];
									if (row.fields.ofContactLabel !== result[i]) continue;
									var readLevel =  subj.get('readLevel', 0);
									var writeLevel = subj.get('writeLevel', 0);
									var adminLevel = subj.get('adminLevel', 0);
									if (row.fields.readLevel >= 0 && row.fields.readLevel > readLevel) {
										subj.set('readLevel', row.fields.readLevel);
										subj.set('readLevel_source', contact_source);
									}
									if (row.fields.writeLevel >= 0 && row.fields.writeLevel > writeLevel) {
										subj.set('writeLevel', row.fields.writeLevel);
										subj.set('writeLevel_source', contact_source);
									}
									if (row.fields.adminLevel >= 0 && row.fields.adminLevel > adminLevel) {
										subj.set('adminLevel', row.fields.adminLevel);
										subj.set('adminLevel_source', contact_source);
									}

								}
							}
							_perUserData(subj, rows, callback);
						}
					});
				}
			});
		} else _perUserData(subj, rows, callback);
	});

	// Get the per-label access data
	// Avoid making a join to allow more flexibility for sharding
	Streams.Access.SELECT('*').where({
		'publisherId': this.fields.publisherId,
		'streamName': this.fields.name, // exact stream
		'ofUserId': this.fields.name.substr(-1) === '/' ? asUserId : ['', asUserId]
			// and either generic or specific user, if check template access use only specific
	}).execute(p.fill('rows1'));

	Streams.Access.SELECT('*').where({
		'publisherId': this.fields.publisherId,
		'streamName': this.fields.type+"/",	// generic stream
		'ofUserId': asUserId				// and specific user
	}).execute(p.fill('rows2'));

	function _perUserData(subj, rows, callback) {
		var row, i;
		var direct_source = Streams.ACCESS_SOURCES['direct'];
		for (i=0; i<rows.length; i++) {
			row = rows[i];
			if (row.fields.ofUserId === asUserId) {
				if (row.fields.readLevel >= 0) {
					subj.set('readLevel', row.fields.readLevel);
					subj.set('readLevel_source', direct_source);
				}
				if (row.fields.writeLevel >= 0) {
					subj.set('writeLevel', row.fields.writeLevel);
					subj.set('writeLevel_source', direct_source);
				}
				if (row.fields.adminLevel >= 0) {
					subj.set('adminLevel', row.fields.adminLevel);
					subj.set('adminLevel_source', direct_source);
				}
			}
		}
		callback.call(subj);
	}
};

/**
 * Inherits access from any streams specified in the inheritAccess field.
 * @method inheritAccess
 * @param callback=null {function}
 *	Callback receives "error" and boolean as arguments - whether the access potentially changed.
 */
Sp.inheritAccess = function (callback) {
	if (!callback) return;
	var subj = this;
	if (!this.fields.inheritAccess) {
		callback.call(subj, null, false);
	}
	var names;
	try {
		names = JSON.parse(this.fields.inheritAccess);
	} catch (e) {
		callback.call(subj, e);
	}
	if (Q.typeOf(names) !== "object" || !Object.keys(names).length) {
		callback.call(subj, null, false);
	}

	if (Q.typeOf(names) !== "array") {
		names = (function (obj) {
			var res = [];
			for(var i in obj) res.push(obj[i]);
			return res;
		})(names);
	}

	var public_source = Streams.ACCESS_SOURCES['public'];
	var contact_source = Streams.ACCESS_SOURCES['contact'];
	var direct_source = Streams.ACCESS_SOURCES['direct'];
	var inherited_public_source = Streams.ACCESS_SOURCES['inherited_public'];
	var inherited_contact_source = Streams.ACCESS_SOURCES['inherited_contact'];
	var inherited_direct_source = Streams.ACCESS_SOURCES['inherited_direct'];
	var direct_sources = [inherited_direct_source, direct_source];
	
	var readLevel = this.get('readLevel', 0);
	var readLevel_source = this.get('readLevel_source', public_source);
	var writeLevel = this.get('writeLevel', 0);
	var writeLevel_source = this.get('writeLevel_source', public_source);
	var adminLevel = this.get('adminLevel', 0);
	var adminLevel_source = this.get('adminLevel_source', public_source);
	
	var p = new Q.Pipe(names, function (params) {
		var i, errors = params[0];
		for (i=0; i<errors.length; i++) {
			if (errors[i]) {
				callback.call(subj, errors[i]); // only one error reported
				return;
			}
		}
		subj.set('readLevel', readLevel);
		subj.set('writeLevel', writeLevel);
		subj.set('adminLevel', adminLevel);
		subj.set('readLevel_source', readLevel_source);
		subj.set('writeLevel_source', writeLevel_source);
		subj.set('adminLevel_source', adminLevel_source);
		callback.call(subj, null, true); // something could change...
	});
	
	// Inheritance only goes one "generation" here.
	// To implement several "generations" of inheritance, you can do things like:
	// 'inheritAccess': '["grandparentStreamName", "parentStreamName"]'
	Q.each(names, function (i, name) {
		var asUserId = subj.get('asUserId', '');
		var publisherId;
		if (typeof names === 'array') {
			publisherId = name[0];
			name = name[1];
		} else {
			publisherId = subj.fields.publisherId;
		}
		Streams.fetchOne(asUserId, publisherId, name, 
		function (err, stream) {
			if (err) {
				return callback.call(this, err);
			}
			// Inherit read, write and admin levels
			// But once we obtain a level via a
			// direct_source or inherited_direct_source,
			// we don't override it anymore.
			var s_readLevel = stream.get('readLevel', 0);
			var s_readLevel_source = stream.get('readLevel_source', public_source);
			if (direct_sources.indexOf(readLevel_source) < 0) {
				readLevel = (s_readLevel_source === direct_source) ? s_readLevel : Math.max(readLevel, s_readLevel);
				readLevel_source = 
				(s_readLevel_source > inherited_public_source) 
				? s_readLevel_source 
				: s_readLevel_source + inherited_public_source;
			}
			var s_writeLevel = stream.get('writeLevel', 0);
			var s_writeLevel_source = stream.get('writeLevel_source', public_source);
			if (direct_sources.indexOf(writeLevel_source) < 0) {
				writeLevel = (s_writeLevel_source === direct_source) ? s_writeLevel : Math.max(writeLevel, s_writeLevel);
				writeLevel_source = 
				(s_writeLevel_source > inherited_public_source) 
				? s_writeLevel_source 
				: s_writeLevel_source + inherited_public_source;
			}
			var s_adminLevel = stream.get('adminLevel', 0);
			var s_adminLevel_source = stream.get('adminLevel_source', public_source);
			if (direct_sources.indexOf(adminLevel_source) < 0) {
				adminLevel = (s_adminLevel_source === direct_source) ? s_adminLevel : Math.max(adminLevel, s_adminLevel);
				adminLevel_source = 
				(s_adminLevel_source > inherited_public_source) 
				? s_adminLevel_source 
				: s_adminLevel_source + inherited_public_source;
			}
			p.fill(name)(null, true);
		});
	});
};

/**
 * Verifies wheather Stream can be read. Can be called syncronously and in such case skips
 * verification of inherited access or asyncronously to make ful check
 * @method testReadLevel
 * @param {string|integer} level
 *	String describing the level (see Streams.READ_LEVEL) or integer
 * @param callback=null {function}
 *	Callback receives "error" and boolean as arguments - whether the access is granted.
 */
Sp.testReadLevel = function(level, callback) {
	return testLevel (this, 'readLevel', 'READ_LEVEL', level, callback);
};
/**
 * Verifies wheather Stream can be written. Can be called syncronously and in such case skips
 * verification of inherited access or asyncronously to make ful check
 * @method testWriteLevel
 * @param {string|integer} level
 *	String describing the level (see Streams.WRITE_LEVEL) or integer
 * @param callback=null {function}
 *	Callback receives "error" and boolean as arguments - whether the access is granted.
 */
Sp.testWriteLevel = function(level, callback) {
	return testLevel (this, 'writeLevel', 'WRITE_LEVEL', level, callback);
};
/**
 * Verifies wheather Stream can be administered. Can be called syncronously and in such case skips
 * verification of inherited access or asyncronously to make ful check
 * @method testAdminLevel
 * @param {string|integer} level
 *	String describing the level (see Streams.ADMIN_LEVEL) or integer
 * @param callback=null {function}
 *	Callback receives "error" and boolean as arguments - whether the access is granted.
 */
Sp.testAdminLevel = function(level, callback) {
	return testLevel (this, 'adminLevel', 'ADMIN_LEVEL', level, callback);
};

Sp._fetchAsUser = function (options, callback) {
	var stream = this;
	if (!options['userId']) {
		return callback.call(stream, new Error("No user id provided"));
	}
	var user = new Users.User({ id: options['userId'] });
	user.retrieve(function (err, users) {
		if (err) return callback.call(stream, err);
		if (!users.length) return callback.call(stream, new Error("User not found"));
		var user = users[0];
		if (user.fields.id === stream.get(['asUserId'], null)) {
			return callback.call(stream, null, stream, user.fields.id, user);
		}
		Streams.fetch(user.fields.id, stream.fields.publisherId, stream.fields.name, function(err, streams) {
			if (err) return callback.call(stream, err);
			if (!streams[stream.fields.name]) return callback.call(stream, new Error("Stream not found"));
			callback.call(stream, null, streams[stream.fields.name], user.fields.id, user);
		});
	});
};

/**
 * If the user is not participating in the stream yet,
 * inserts a participant record and posts a "Streams/join" type message to the stream.
 * Otherwise update timestamp
 * @method join
 * @param options={} {object}
 *  An associative array of options. 'userId' is mandatory. The keys can be:<br/>
 *  "subscribed" => boolean<br/>
 *  "posted" => boolean<br/>
 *  "reputation" => integer<br/>
 *  "reason" => string<br/>
 *  "enthusiasm" => decimal<br/>
 *  "userId" => The user who is joining the stream.
 * @param callback {function} receives error if any and participant object as arguments
 */
Sp.join = function(options, callback) {
	var stream = this;
	if (typeof options === "function") {
		callback = options;
		options = {};
	}
	this._fetchAsUser(options, function(err, stream, userId) {
		if (err) return callback.call(stream, err);
		if (!stream.testWriteLevel('join')) return callback.call(stream, new Error("User is not authorized"));
		new Streams.Participant({
			publisherId: stream.fields.publisherId,
			streamName: stream.fields.name,
			userId: userId
		}).retrieve(function(err, sp) {
			if (err) return callback.call(stream, err);
			var type = 'Streams/join';
			if (sp.length) {
				sp = sp[0];
				var save = false, subscribed = options['subscribed'];
				var yn = subscribed ? 'yes' : 'no';
				if (subscribed && sp.fields.subscribed !== yn) {
					sp.fields.subscribed = yn;
					save = true;
				}
				if (sp.fields.state === 'participating') {
					type = 'Streams/visit';
				}
				if (sp.fields.state === 'participating') {
					sp.fields.state = 'participating';
					save = true;
				}
				if (save) {
					sp.save(true, _afterSaveParticipant);
				} else {
					_afterSaveParticipant();
				}
			} else {
				sp = new Streams.Participant({
					publisherId: stream.fields.publisherId,
					streamName: stream.fields.name,
					userId: userId,
					streamType: stream.fields.type,
					subscribed: options['subscribed'] ? 'yes' : 'no',
					posted: options['posted'] ? 'yes' : 'no',
					reputation: options['reputation'] || 0,
					state: 'participating',
					extra: options['extra'] || '{}'
				});
				sp.save(_afterSaveParticipant);
			}
			function _afterSaveParticipant(err) {
				if (err) return callback.call(stream, err);
				Streams.emitToUser(userId, 'join', sp.fillMagicFields().getFields());
				stream.incParticipants(/* empty callback*/);
				
				var f = sp.fields;
				stream.post(userId, {
					type: type,
					instructions: JSON.stringify({
						reason: f.reason,
						enthusiasm: f.enthusiasm
					})
				}, function(err) {
					if (err) return callback.call(stream, err);
					new Streams.Stream({
						publisherId: userId,
						name: 'Streams/participating'
					}).retrieve(function (err, pstream) {
						if (err || !pstream.length) return callback.call(stream, err);
						pstream[0].post(userId, {
							type: type+'ed',
							content: '',
							instructions: JSON.stringify({
								publisherId: stream.fields.publisherId,
								streamName: stream.fields.name
							})
						}, function (err) {
							if (err) return callback.call(stream, err);
							callback.call(stream, null, sp);
						});
					});
				});
			}
		});
	});
};

Sp.leave = function(options, callback) {
	// TODO: Nazar: Implement to be similar to PHP, and add documentation
	callback(); // pass err
};

/**
 * Subscribe to the stream's messages<br/>
 *	If options are not given check the subscription templates:
 *	<ol>
 *		<li>1. exact stream name and exact user id</li>
 *		<li>2. generic stream name and exact user id</li>
 *		<li>3. exact stream name and generic user</li>
 *		<li>4. generic stream name and generic user</li>
 *	</ol>
 *	default is to subscribe to ALL messages.<br/>
 *	If options supplied - skip templates and use options<br/><br/>
 * Using subscribe if subscription is already active will modify existing
 * subscription - change type(s) or modify notifications
 * @method subscribe
 * @param options={} {object}
 * @param {Array} [options.types] array of message types, if this is empty then subscribes to all types
 * @param {integer} [options.notifications=0] limit number of notifications, 0 means no limit
 * @param {datetime} [options.untilTime=null] time limit, if any for subscription
 * @param {datetime} [options.readyTime] time from which user is ready to receive notifications again
 * @param {String} [options.userId] the user subscribing to the stream. Defaults to the logged in user.
 * @param {Object} [options.deliver={"to":"default"}] under "to" key, names the field under Streams/rules/deliver config, which will contain the names of destinations, which can include "email", "mobile", "email+pending", "mobile+pending"
 * @return {Streams_Subscription|false}
 */
Sp.subscribe = function(options, callback) {

	var stream = this;
	if (typeof options === "function") {
		callback = options;
		options = {};
	}
	this._fetchAsUser(options, function(err, stream, userId, user) {
		if (err) return callback.call(stream, err);
		stream.join({
			subscribed: true,
			userId: userId
		}, function (err) {
			if (err) return callback.call(stream, err);
			new Streams.Subscription({
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				ofUserId: userId
			}).retrieve(function(err, s) {
				if (err) return callback.call(stream, err);
				if (s.length) s = s[0];
				else s = new Streams.Subscription({
					publisherId: stream.fields.publisherId,
					streamName: stream.fields.name,
					ofUserId: userId
				});
				stream.getSubscriptionTemplate('Subscription', userId,
				function (err, template) {
					if (err) return callback.call(stream, err);
					var filter = template 
						? JSON.parse(template.fields.filter)
						: {types: [], notifications: 0};
					if (options['types']) {
						filter['types'] = options['types'];
					}
					if (options['notifications']) {
						filter['notifications'] = options['notifications'];
					}
					s.fields.filter = JSON.stringify(filter);

					if (options['untilTime']) {
						s.fields.untilTime = options['untilTime'];
					} else {
						if (template && template.template_type > 0
						&& template.fields.duration > 0) {
							s.fields.untilTime = Q.date(
								'c', Date.now() + template.fields.duration
							);
						}
					}
					s.save(true, function (err) {
						if (err) return callback.call(stream, err);
						// Now let's handle rules
						stream.getSubscriptionTemplate('Rule', userId,
						function (err, template) {
							var deliver;
							if (err) return callback.call(stream, err);
							if (!template || template.template_type !== 0) {
								deliver = (template && template.fields.deliver)
									? template.fields.deliver
									: JSON.stringify(
										options.deliver || {to: 'default'}
									);
								var filter = template && template.fields.filter
									? template.fields.filter
									: '{"types":[],"labels":[]}';
								var readyTime = options['readyTime']
									? options['readyTime']
									: new Db.Expression('CURRENT_TIMESTAMP');
								new Streams.Rule({
									ofUserId: userId,
									publisherId: stream.fields.publisherId,
									streamName: stream.fields.name,
									readyTime: readyTime,
									filter: filter,
									deliver: deliver,
									relevance: 1
								}).save(function(err) {
									if (err) return callback.call(stream, err);
									stream.post(userId, {
										type: 'Streams/subscribe'
									}, function(err) {
										if (err) return callback.call(stream, err);
										new Streams.Stream({
											publisherId: userId,
											name: 'Streams/participating'
										}).retrieve(function (err, pstream) {
											if (err || !pstream.length) {
												return callback.call(stream, err);
											}
											pstream[0].post(userId, {
												type: 'Streams/subscribed',
												instructions: JSON.stringify({
													publisherId: stream.fields.publisherId,
													streamName: stream.fields.name
												})
											}, function (err) {
												if (err) return callback.call(stream, err);
												callback.call(stream, null, s);
											});
										});
									});
								});
							}
						});
					});
				});
			});
		});
	});
};

Sp.unsubscribe = function(options, callback) {
	// TODO: Nazar: Implement to be similar to PHP, and add documentation
	callback(); // pass err
};

/**
 * Notify participants of the stream depending on user status
 * @method notify
 * @param participant {object} Participant to notify
 * @param event {string} The type of event
 * @param uid {string} The user who initiated the message
 * @param message {object} Message on 'post' event or stream on other events
 * @param callback=noop {function}
 */
Sp.notify = function(participant, event, uid, message, callback) {
	var userId = participant.fields.userId, stream = this;
	function _notify(tokens, sessions) {
		// 1) if session is associated to device and no socket is connected for device
		//		we update 'fresh' field, update badge, issue alert to device
		//		User can cancel all subscriptions to receive only push notifications   
		//      managed via device settings
		var i, online = false;
		for (i=0; i<sessions.length; i++) {
			if ((online = Streams.isDeviceOnline(userId, sessions[i]))) {
			    break;
			}
		}
		// check if the message generated some significant event
		// and proceed only if no device is online
		if (Streams.Participating.freshEvent(online, event, message, uid)) {
			Streams.pushNotification(userId, tokens, event, message);
		}
		// 2) if user has socket connected - emit socket message and quit
		if (Streams.emitToUser(userId, event, message.getFields())) {
			return callback && callback();
		}
		// 3) if user has no socket connected notify subscribed users
		if (userId === message.fields.byUserId) {
			return; // no need to notify the user of their own actions
		}
		if (participant.fields.subscribed === 'yes') {
			Streams.Subscription.test(
			userId, stream.fields.publisherId, stream.fields.name, message.fields.type,
			function(err, deliveries) {
				if (err || !deliveries.length) return callback && callback(err);
				var waitingFor = deliveries.map(function(d) { return JSON.stringify(d); });
				var p = new Q.Pipe(waitingFor, function(params) {
					for (var d in params) {
						if (params[d][0]) return callback && callback(params[d][0]);
					}
					new Streams.Notification({
						userId: userId,
						publisherId: participant.fields.publisherId,
						streamName: participant.fields.streamName,
						type: message.fields.type
					}).save(function(err) {
						callback && callback(err, deliveries);
					});
				});
				// actually notify according to the deliveriy rules
				var byUserId = message.fields.byUserId;
				Streams.Avatar.fetch(userId, byUserId, function (err, avatar) {
					if (message.fields.type !== "Streams/invite") {
						return deliveries.forEach(function(delivery) {
							message.deliver(stream, userId, delivery, avatar,
								p.fill(JSON.stringify(delivery))
							);
						});
					}
					var instructions = JSON.parse(message.fields.instructions);
					new Streams.Invite({
						token: instructions.token
					}).retrieve(function(err, rows) {
						if (err || !rows.length) {
							return deliveries.forEach(function(delivery) {
								p.fill(JSON.stringify(delivery))(err); 
							});
						}
						var invite = this;
						new Streams.Stream({
							publisherId: invite.fields.publisherId,
							name: invite.fields.streamName
						}).retrieve(function(err, rows2) {
							if (err || !rows2.length) {
								return deliveries.forEach(function(delivery) {
									p.fill(JSON.stringify(delivery))(err); 
								});
							}
							var stream = this;
							try { 
								var instructions = JSON.parse(message.fields.instructions); 
							} catch (e) {}
							var invited = invite.getFields();
							invited.url = invite.url();
							if (instructions && instructions.type) {
								invited[instructions.type] = true;
							}
							stream.invited = invited;
							deliveries.forEach(function(delivery) {
								message.deliver(stream, userId, delivery, avatar,
									p.fill(JSON.stringify(delivery))
								);
							});
						});
					});
				});
			});
		} else {
			callback && callback(null, []);
		}
	}
	function _tokens(err, access) {
		var userId = participant.fields.userId;
		if (err) {
		    return callback && callback(err);
		}
		if (access) {
		    Q.plugins.Users.tokensForUser(userId, _notify);
		}
	}
	// check access
	if (this.get('asUserId') !== userId) {
		this.calculateAccess(userId, function (err) {
			if (err) return callback && callback(err);
			this.testReadLevel(Streams.READ_LEVEL['messages'], _tokens);
		});
	} else {
		this.testReadLevel(Streams.READ_LEVEL['messages'], _tokens);
	}
};

/**
 * Posts a message to the stream.
 * @method post
 * Currently this is not nearly as robust as the PHP method,
 * and doesn't perform any access checks, so it is only
 * meant to be called internally.
 * @param {String} asUserId
 *  The user to post as
 * @param fields {Object}
 * @param callback=null {function}
 */
Sp.post = function (asUserId, fields, callback) {
	if (typeof asUserId !== 'string') {
		callback = fields;
		fields = asUserId;
		asUserId = fields.byUserId;
		if (!asUserId) {
			throw new Q.Exception("Streams.Stream.prototype.post needs asUserId");
		}
	}
	Streams.Message.post(Q.extend({
		publisherId: this.fields.publisherId,
		streamName: this.fields.name,
		byUserId: asUserId
	}, fields), callback);
};

module.exports = Streams_Stream;
