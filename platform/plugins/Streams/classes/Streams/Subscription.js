/**
 * Class representing subscription rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');

/**
 * Class representing 'Subscription' rows in the 'Streams' database
 * <br/>{"type": [ array of message types ], "notifications": 5}
 * @namespace Streams
 * @class Subscription
 * @extends Base.Streams.Subscription
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Subscription (fields) {

	// Run constructors of mixed in objects
	Streams_Subscription.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */
}

Q.mixin(Streams_Subscription, Q.require('Base/Streams/Subscription'));

/**
 * Test message according to filters set up for the user and generate array of subscription rules
 * @method test
 * @static
 * @param {String} userId
 * @param {String} publisherId
 * @param {Q.Streams.Stream} stream
 * @param {Function} callback First argument is any possible error, second is array of delivery methods
 */
Streams_Subscription.test = function _Subscription_test(userId, stream, msgType, callback) {
	if (!callback) return;
	(new Streams.Subscription({
		ofUserId: userId,
		publisherId: stream.fields.publisherId,
		streamName: stream.fields.name
	})).retrieve(function(err, sub) {
		if (err) return callback(err);
		if (!sub.length) return callback(null, []); // no active subscriptions
		sub = sub[0];
		var time = (new Date()).getTime();
		if ((sub.fields.untilTime && sub.fields.untilTime < time
		|| (sub.fields.duration && sub.fields.insertedTime + sub.fields.duration * 1000 < time))) {
			return callback(null, []); // date passed
		}
		var filter;
		try {
			if (sub.fields.filter) {
				filter = JSON.parse(sub.fields.filter);
			} else {
				filter = Stream.getConfigField(
					stream.fields.type, 
					['subscriptions', 'filter'],
					{ 
						types: [
							"^(?!(Users/)|(Streams/)).*/", 
							"Streams/relatedTo", 
							"Streams/chat/message"
						],
						notifications: 0
					}
				);
			}
		} catch (err) {
			return callback(err);
		}
		var types = filter.types;
		var matched = false;
		for (var i=0, l=types.length; i<l; ++i) {
			if (msgType.match(types[i])) {
				matched = true;
				break;
			}
		}
		var notifications = filter.notifications;
		if (!matched) {
			return callback(null, []); // not subscribed to this message type
		}
		Streams.SubscriptionRule.SELECT('*').where({
			ofUserId: userId,
			publisherId: stream.fields.publisherId,
			streamName: stream.fields.name
		}).execute(function(err, rules) {
			if (err) return callback(err);
			var waitFor = rules.map(function(r){ return r.fields.ordinal; });
			var p = new Q.Pipe(waitFor, 1, function (params) {
				var deliveries = [], ordinal, param;
				for (ordinal in params) {
					param = params[ordinal];
					if (param[0]) {
						return callback(param[0]);
					}
					if (param[1]) {
						deliveries.push(param[1]);
					}
				}
				callback(null, deliveries);
			});
			p.run();
			rules.forEach(function (rule) {
				var o = rule.fields.ordinal;
				var readyTime = rule.fields.readyTime;
				var filter;
				try {
					filter = rule.fields.filter ? JSON.parse(rule.fields.filter) : {};
				} catch (e) {
					return p.fill(o)(e);
				}
				var types = filter.types;
				function _checkNotifications() {
					if (!notifications) {
						return _checkDelivery();
					}
					// get last disconnection time
					Streams.Message.SELECT('publisherId, streamName, type, sentTime')
					.where({
						publisherId: userId,
						streamName: 'Streams/participating',
						type: 'Streams/disconnected'
					}).orderBy('sentTime', false)
					.limit(1)
					.execute(function(err, res) {
						if (err) {
							return p.fill(o)(err);
						}
						// NOTE: all Streams/participating for a given stream must be on the same shard
						var timeOnline = res.length
							? res.reduce(function(pv, cv) {
								return pv > cv ? pv : cv;
							}, res[0].sentTime)
							: (readyTime ? readyTime : 0);
						// now check notifications since timeOnline
						Streams.Notification.SELECT('COUNT(1) as count').where({
							userId: userId,
							"insertedTime >": timeOnline,
							publisherId: stream.fields.publisherId,
							streamName: stream.fields.streamName,
							type: msgType
						}).execute(function (err, res) {
							if (err) return p.fill(o)(err);
							// to support counting in shards
							var count = res.reduce(function(pv, cv) { 
								return pv + Number(cv.count); 
							}, 0);
							if (count < notifications) {
								_checkDelivery();
							} else {
								p.fill(o)();
							}
						}, {plain: true});
					}, { plain: true });
				}
				function _checkDelivery() {
					var deliver;
					try {
						deliver = rule.fields.deliver ? JSON.parse(rule.fields.deliver) : null;
					} catch (e) {
						p.fill(o)(e);
					}
					p.fill(o)(null, deliver);
				}
				var notFound = (
					types && Q.typeOf(types) === 'array'
					&& types.length && types.indexOf(msgType) < 0
				);
				if (notFound || (Date.fromTimestamp(readyTime) > new Date())) {
					// type and readyTime filters not passed
					return p.fill(o)();
				}					
				var labels = filter.labels;
				if (!labels || Q.typeOf(labels) !== "array" || !labels.length) {
					return _checkNotifications();
				}
				Users.Contact.SELECT('*').where({
					userId: userId,
					contactUserId: publisherId,
					label: labels
				}).execute(function (err, contacts) {
					if (err) {
						return p.fill(o)(err);
					}
					if (!contacts.length) {
						return p.fill(o)();
					}
					_checkNotifications();
				});
			});
		});
	});

	/* * * */
}

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Subscription.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Subscription;