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
 * @param userId {string}
 * @param publisherId {string}
 * @param streamName {string}
 * @param callback {function} Callback have error and array of delivery methods as arguments
 */
Streams_Subscription.test = function _Subscription_test(userId, publisherId, streamName, msgType, callback) {
	if (!callback) return;
	(new Streams.Subscription({
		ofUserId: userId,
		publisherId: publisherId,
		streamName: streamName
	})).retrieve(function(err, sub) {
		if (err) return callback(err);
		if (!sub.length) return callback(null, []); // no active subscriptions
		sub = sub[0];
		if (sub.fields.untilTime && sub.fields.untilTime > new Date()) return callback(null, []); // date passed
		var filter;
		try {
			filter = JSON.parse(sub.fields.filter);
		} catch (err) {
			return callback(err);
		}
		var types = filter.types, notifications = filter.notifications;
		var isStreamsType = (msgType.substring(0, 8) === 'Streams/'
			&& msgType !== "Streams/invite"
			&& msgType !== "Streams/chat/message");
		if (isStreamsType
		|| (types && types.length && types.indexOf(msgType) < 0)) {
			return callback(null, []); // no subscription to type
		}
		Streams.Rule.SELECT('*').where({
			ofUserId: userId,
			publisherId: publisherId,
			streamName: streamName
		}).execute(function(err, rules) {
			if (err) return callback(err);
			var waitFor = rules.map(function(r){ return r.fields.ordinal; });
			var p = new Q.Pipe(waitFor, function (params) {
				var deliveries = [], ordinal, param;
				for (ordinal in params) {
					param = params[ordinal];
					if (param[0]) return callback(param[0]);
					if (param[1]) deliveries.push(param[1]);
				}
				callback(null, deliveries);
			});
			rules.forEach(function (rule) {
				var o = rule.fields.ordinal;
				var readyTime = new Date(rule.fields.readyTime);
				try {
					filter = JSON.parse(rule.fields.filter);
				} catch (e) {
					return p.fill(o)(e);
				}
				var types = filter.types;
				function _checkNotifications() {
					if (notifications) {
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
							var time_online = res.length
								? res.reduce(function(pv, cv) {
									var cvd = new Date(cv.sentTime);
									return pv > cvd ? pv : cvd;
								}, new Date(res[0].sentTime))
								: (readyTime ? readyTime : new Date(0));
							// now check notifictions since time_online
							Streams.Notification.SELECT('COUNT(1) as count').where({
								userId: userId,
								"insertedTime >": Q.date('c', time_online),
								publisherId: publisherId,
								streamName: streamName,
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
					} else {
						_checkDelivery();
					}
				}
				function _checkDelivery() {
					var deliver;
					try {
						deliver = JSON.parse(rule.fields.deliver);
						if (Q.typeOf(deliver) !== "object") deliver = null;
					} catch (e) {
						p.fill(o)(e);
					}
					p.fill(o)(null, deliver);
				}
				if ((!types || !types.length || types.indexOf(msgType) >= 0)
				&& readyTime < new Date()) {
					// type and readyTime filters passed
					var labels = filter.labels;
					if (labels && Q.typeOf(labels) === "array" && labels.length) {
						Users.Contact.SELECT('*').where({
							userId: userId,
							contactUserId: publisherId,
							label: labels
						}).execute(function (err, contacts) {
							if (err) return p.fill(o)(err);
							if (contacts.length) _checkNotifications();
							else p.fill(o)();
						});
					} else _checkNotifications();
				} else p.fill(o)();
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