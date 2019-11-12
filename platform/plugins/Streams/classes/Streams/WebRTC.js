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
var express = require('express');
var express = require('express');var app = express();app.set('view engine', 'ejs');

// respond with "hello world" when a GET request is made to the homepage

const child_process = require('child_process');

/**
 * Static methods for WebRTC
 * @class WebRTC
 * @static
 */
function WebRTC() { }

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
	var socket = (Q.plugins.Streams.listen() || {}).socket;

	if (!socket || !socket.io) {
		return null;
	}

	var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
	var io = socket.io;
	io.on('connection', function(socket) {

		let rtmpUrl = socket.handshake.query.rtmp
		if ( rtmpUrl != null ) {
			//return;
			if(_debug) console.log('made sockets connection (LIVE STREAMING)', socket.id);


			console.log('Target RTMP URL:', rtmpUrl);
			var ffmpeg;
			function createFfmpegProcess() {
				// Launch FFmpeg to handle all appropriate transcoding, muxing, and RTMP.
				// If 'ffmpeg' isn't in your path, specify the full path to the ffmpeg binary.
				ffmpeg = child_process.spawn('ffmpeg', [
					// Facebook requires an audio track, so we create a silent one here.
					// Remove this line, as well as `-shortest`, if you send audio from the browser.
					//'-f', 'lavfi', '-i', 'anullsrc',

					//set input framerate to 24 fps
					//'-r', '24',
					// FFmpeg will read input video from STDIN
					'-i', '-',

					// Because we're using a generated audio source which never ends,
					// specify that we'll stop at end of other input.  Remove this line if you
					// send audio from the browser.
					//'-shortest',

					// If we're encoding H.264 in-browser, we can set the video codec to 'copy'
					// so that we don't waste any CPU and quality with unnecessary transcoding.
					// If the browser doesn't support H.264, set the video codec to 'libx264'
					// or similar to transcode it to H.264 here on the server.
					'-vcodec', 'copy',

					// AAC audio is required for Facebook Live.  No browser currently supports
					// encoding AAC, so we must transcode the audio to AAC here on the server.
					'-acodec', 'aac',

					// FLV is the container format used in conjunction with RTMP
					'-f', 'flv',

					//set output framerate to 24 fps
					//'-r', '24',

					// The output RTMP URL.
					// For debugging, you could set this to a filename like 'test.flv', and play
					// the resulting file with VLC.  Please also read the security considerations
					// later on in this tutorial.
					rtmpUrl
				]);

				// If FFmpeg stops for any reason, close the WebSocket connection.
				ffmpeg.on('close', (code, signal) => {
					console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
					ffmpeg = null;
					//socket.disconnect();
				});

				// Handle STDIN pipe errors by logging to the console.
				// These errors most commonly occur when FFmpeg closes and there is still
				// data to write.  If left unhandled, the server will crash.
				ffmpeg.stdin.on('error', (e) => {
					console.log('FFmpeg STDIN Error', e);
				});

				// FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
				ffmpeg.stderr.on('data', (data) => {
					console.log('FFmpeg STDERR:', data.toString());
				});
			}
			createFfmpegProcess();

			// When data comes in from the WebSocket, write it to FFmpeg's STDIN.
			socket.on('Streams/webrtc/videoData', function(data) {
				console.log('VIDEODATA');
				//socket.broadcast.emit('video', data);
				if(ffmpeg != null) {
					ffmpeg.stdin.write(data);
				} else {
					createFfmpegProcess();
				}
			});

			// If the client disconnects, stop FFmpeg.
			socket.on('disconnect', function() {
				if(ffmpeg != null) ffmpeg.kill('SIGINT');
			});

			return;
		}


		if(_debug) console.log('made sockets connection', socket.id);

		socket.on('Streams/webrtc/log', function (message) {
			if(_debug) console.log('CONSOLE.LOG', message);
		});

		socket.on('Streams/webrtc/errorlog', function (message) {
			console.log('CONSOLE.ERROR', message);
			var todaysDay = new Date().toISOString().replace(/T.*/, ' ');
			console.log('CONSOLE.ERROR DATE', todaysDay);
		});

		socket.on('Streams/webrtc/errorlog_timeout', function (message) {
			if(_debug) console.log('CONSOLE.ERROR', message);
			if(_debug) console.log('CONSOLE.ERROR DATE', (new Date().toISOString()));
		});

		var room;
		socket.on('Streams/webrtc/joined', function (identity) {
			if(_debug) console.log('Got message: joined', identity, socket.id);
			socket.username = identity.username;
			socket.info = identity.info;
			room = identity.room;
			socket.join(identity.room, function () {
				if(_debug) console.log(socket.id + 'now in rooms: ', socket.rooms);
			})


			socket.broadcast.to(identity.room).emit('Streams/webrtc/participantConnected', {
				username:identity.username,
				sid:socket.id,
				info:identity.info,
			});


			io.of('/').in(identity.room).clients(function (error, clients) {
				if(_debug) console.log(clients);
				var participantsList = [];
				for (var i in clients) {
					if (socket.id != clients[i]) {
						participantsList.push({sid: clients[i], username: io.sockets.connected[clients[i]].username});
					}
				}
				io.to(socket.id).emit('Streams/webrtc/roomParticipants', participantsList);
			});

		});

		socket.on('Streams/webrtc/confirmOnlineStatus', function(message) {
			if(_debug) console.log('confirmOnlineStatus', message);
			message.fromSid = socket.id;
			socket.to(message.targetSid).emit('Streams/webrtc/confirmOnlineStatus', message);

		});

		socket.on('Streams/webrtc/signalling', function(message) {
			if(_debug) console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, socket.id);
			message.fromSid = socket.id;
			if(message.type == 'offer') message.info = socket.info;
			socket.to(message.targetSid).emit('Streams/webrtc/signalling', message);
		});

		socket.on('disconnect', function() {
			if(_debug) console.log('DISCONNECT', socket.id);
			socket.broadcast.to(room).emit('Streams/webrtc/participantDisconnected', socket.id);
		});

	})

};

module.exports = WebRTC;