/*jshint node:true */
/**
 * Broadcast model
 * @module Broadcast
 * @main Broadcast
 */
var Q = require('Q');

/**
 * Static methods for the Broadcast model
 * @class Broadcast
 * @extends Base.Broadcast
 * @static
 */
function Broadcast() { }
module.exports = Broadcast;

var Base_Broadcast = require('Base/Broadcast');
Q.mixin(Broadcast, Base_Broadcast);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Broadcast object.
 * If file 'Broadcast.js.inc' exists, its content is included
 * * * */

/* * * */

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Broadcast object.
 
 * * * */

if (!Q.plugins.Streams) {
	throw new Q.Exception("Broadcast: Streams plugin is required");
}

var http = require('http');
var fb = require('Facebook');

/**
 * Start internal listener for Broadcast plugin<br/>
 * Accepts "Users/session" message
 * @method listen
 * @param {object} options={}
 *  So far no options are implemented.
 */
Broadcast.listen = function (options) {

	// Start internal server
	var server = Q.listen();

	// Handle internal requests if Q.listen() was ever called
	server.attached.express.post('/Q/node', function Broadcast_request_handler (req, res, next) {
		
		var parsed = req.body;
		if (!parsed || !parsed['Q/method']) {
			return next();
		}
		switch (parsed['Q/method']) {
			case 'Users/session':
				var sid = parsed.sessionId;
				var content = parsed.content ? JSON.parse(parsed.content) : null;
				if (content !== null) {
					var appId = Q.Config.get(["Users", "facebookApps", "Broadcast", "appId"], null);
					var token = Q.getObject(['fb_'+appId+'_access_token'], content);
					var userId = Q.getObject(['Users', 'loggedInUser', 'id'], content);
					if (userId === undefined) {
						userId = null;
					}
					if (token) {
						fb.createClient(token).getObject('me/friends', {},
						function(err, res, data) {
							if (!err && userId) {
								(new Broadcast.User({
									'userId': userId,
									'friend_count': data.data.length
								})).save(true, function(error){
									if (error) console.log("Insert broadcast user error: ", error);
								});
							} else {
								console.log('Failed to update friends count: ' + err.message);
							}
						});
					}
				}
				return next();
			default:
				return next();
		}
	});
};

/**
 * The message handler to use with Streams plugin
 * @method messageHandler
 * @param msg {string}
 *	The message to handle
 */
Broadcast.messageHandler = function (msg) {

	var content = JSON.parse(msg.broadcast_instructions); // may throw an exception if parsed wrong
	
	function postToWall(app_user, app_users) {

		function next() {
			if (!app_users.length) return;
			// do the remaining ones
			var app_user = app_users.shift();
			postToWall(app_user, app_users);
		}
	
		// this function is called repeatedly until all the posting has been done
		var client = require('Facebook').createClient(app_user.fields.access_token);
		var data = {};
		for (var k in content) {
			data[k] = content[k];
		}
		client.request('post', 'me/feed', data, function (err, res, json)
		{
			if (err) {
				Q.log("ERROR while posting to FB feed: "+err.message);
				next();
			} else {
				Q.log("Posted message with id "+json.id);
				Broadcast.Syndicated.INSERT({
					userId: app_user.fields.userId,
					publisherId: msg.publisherId,
					ordinal: msg.ordinal,
					platform: 'facebook'
				}).execute(next);
			}
		});
	}

	var p = new Q.Pipe(
		["agreements", "syndicated"], function (params, subjects) {
			var agreements = params.agreements[1];
			var syndicated = params.syndicated[1];
			var userIds = [];
			collecting:
			for (var j in agreements) {
				for (var k in syndicated) {
					if (syndicated[k].fields.userId === agreements[j].fields.userId) {
						continue collecting;
					}
				}
				userIds.push(agreements[j].fields.userId);
			}
		
			var Users = Q.require('Users');
		
			var appId = Q.Config.get('Users', 'facebookApps', 'Broadcast', 'appId', null);
			Users.AppUser.SELECT('*').where({
				appId: appId,
				userId: userIds
			}).execute(this.fill('app_users', true));
		},
		["app_users"], function (params, subjects) {
			var app_users = params.app_users[1];
		
			if (!app_users.length) return false;
		
			var app_user = app_users.shift();
			postToWall(app_user, app_users);
		}
	);

	try {
		Broadcast.Agreement.SELECT('*').where({
			publisherId: msg.publisherId,
			streamName: msg.streamName,
			platform: 'facebook'
		}).execute(p.fill('agreements'));
		Broadcast.Syndicated.SELECT('*').where({
			publisherId: msg.publisherId,
			ordinal: msg.ordinal,
			platform: 'facebook'
		}).execute(p.fill('syndicated'));
	} catch (e) {
		console.log(e); // try to continue to the next request
	}
};

// Register a message handler with Streams plugin
Q.plugins.Streams.messageHandler('Broadcast', Broadcast.messageHandler);

/* * * */