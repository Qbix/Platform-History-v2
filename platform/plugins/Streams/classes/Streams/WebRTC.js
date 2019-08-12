"use strict";
/*jshint node:true */
/**
 * WebRTC class
 * @module Streams
 * @main Streams
 */
var Q = require('Q');
var fs = require('fs');
var Streams = Q.Streams;

/**
 * Static methods for WebRTC
 * @class WebRTC
 * @static
 */
function WebRTC() { }
module.exports = WebRTC;

/**
 * Start internal listener for Streams plugin. Accepts messages such as<br/>
 * "Streams/Stream/join",
 * "Streams/Stream/leave",
 * "Streams/Stream/create",
 * "Streams/Stream/remove",
 * "Streams/Message/post",
 * "Streams/Message/postMessages",
 * "Streams/Stream/invite"
 * @method listen
 * @static
 * @param {Object} options={} So far no options are implemented.
 * @return {Users.Socket|null} The socket if connected, otherwise null
 */
WebRTC.listen = function () {
	var socket = (Q.Streams.listen() || {}).socket;
	if (!socket) {
		return null;
	}
	// Take the following as an example
	// client.on('Streams/webrtc/signaling',
	// function (sessionId, clientId, publisherId, streamName, fn) {
	//   return fn && fn(foo, bar, baz);
	// });
};