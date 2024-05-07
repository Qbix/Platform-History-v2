/**
 * You'll find all your Q.Frames related functionality right here.
 *
 * @module Q
 * @main Q
 */
"use strict";
/* jshint -W014 */
(function (undefined, dontSetGlobals) {

var rls = window.localStorage;
var _frameMessageEvents = {};

/**
 * Methods for working with storage and signaling across frames and windows
 * @class Q.Frames
 * @namespace Q
 * @static
 */
var Frames = Q.Frames = {
	/**
	 * An index that uniquely identifies this frame among all frames and windows
	 * loaded from this domain.
	 * @property index
	 * @type {Number}
	 */
	index: null,
	/**
	 * Get the index of the "main" iframe, that will be the one opening
	 * sockets, making requests to the server, and triggering any callbacks
	 * in the other "client" iframes.
	 * @method mainIndex
	 * @static
	 * @return {Integer|null} 
	 */
	mainIndex: function () {
		return parseInt(rls.getItem(Frames.mainIndexKey)) || null;
	},
	/**
	 * Get whether this is the main frame
	 * @method isMain
	 * @static
	 * @return {Boolean} 
	 */
	isMain: function () {
		return Frames.mainIndex() === Frames.index;
	},
	/**
	 * Send some message to all other frames on this domain.
	 * This will trigger their onMessage() event with the data.
	 * @method message
	 * @static
	 * @param {String} type The type of the message
	 * @param {Object} data Will be JSON-encoded for transmitting via localStorage
	 * @param {Integer} [index] Place the index of a specific frame here,
	 *  such as the return value of Q.Frames.main(), to message only this frame.
	 *  Otherwise it will be broadcast to all other frames.
	 * @param {Function} [callback] If index is provided, then you can optionally
	 *  pass a callback here whose first parameter will be false if the message was not received
	 *  by the frame with that index (because it was unloaded), or true if it was received.
	 */
	message: function (type, data, index, callback) {
		var messageIndex;
		rls.setItem(Frames.message.counterKey,
			messageIndex = ((parseInt(rls.getItem(Frames.message.counterKey)) || 0) + 1) % 1000000
		);
		var value = {
			type: type,
			data: data,
			toIndex: index || null,
			fromIndex: Frames.index,
			messageIndex: messageIndex,
			rand: Math.random().toString(36).substring(7)
			// rand is to make it unique and trigger "storage" event
		};
		rls.setItem(Frames.message.key, JSON.stringify(value));
		rls.removeItem(Frames.message.key); // just to keep things clean
		if (callback) {
			Frames.message.callbacks[messageIndex] = callback;
			setTimeout(function () {
				var cb = Frames.message.callbacks[messageIndex];
				if (cb) {
					callback(false); // it's been 100 ms and it hasn't been handled
					delete Frames.message.callbacks[messageIndex];
				}
			}, 1000);
		}
	},
	/**
	 * This event factory is used to create events to be handled
	 * when Q.Frames.message() was called in one of the frames
	 * to send some data. Call the factory and pass the messageType to create an event handler.
	 * @event onMessage
	 * @param name {String} The name of the message. Can be "" to listen on all messages.
	 */
	onMessage: new Q.Event.factory(_frameMessageEvents, "", null, true),
	/**
	 * This event fires when the current frame became main.
	 * Attach any event handlers to set up sockets, and so on.
	 * @event onBecameMain
	 */
	onBecameMain: new Q.Event,
	/**
	 * Execute some method that is also defined in the main frame.
	 * @method message
	 * @static
	 * @param {Function} original The function to call if we are in the main frame
	 * @param {String} methodPath for example "Q.Socket.connect"
	 */
	useMainFrame: function(original, methodPath) {
		var wrapper = function () {
			var t = this;
			var a = arguments;
			var f = Frames.useMainFrame;
			var callIndex = f.callIndex = ((f.callIndex || 0) + 1) % 1000000;
			var subjectPath = methodPath.split('.').slice(0, -1).join('.');
			var subject = Q.getObject(subjectPath);
			var args = Array.prototype.slice.call(arguments, 0);
			var mainIndex = Frames.mainIndex();
			if (!mainIndex || mainIndex === Frames.index) {
				if (mainIndex !== Frames.index) {
					_becomeMainFrame();
				}
				return original.apply(t, a);
			}
			var params = [], callbacks = [];
			var i=0, l=args.length;
			while (i < l) {
				// assume callbacks are at the end
				if (typeof args[i] === 'function') {
					callbacks.push(args[i]);
				} else {
					params.push(args[i]);
				}
				++i;
			}
			Frames.message('Q.call', {
				methodPath: methodPath,
				subjectPath: subjectPath,
				params: params,
				callbackCount: callbacks ? callbacks.length : 0,
				callIndex: callIndex
			}, mainIndex, function (received) {
				if (!received) {
					_becomeMainFrame();
					return original.apply(t, a);
				}
				// the below is only for getters, you don't need them for most functions
				Frames.onMessage('Q.callback ' + callIndex).addOnce(
				function (type, data, fromIndex, wasBroadcast) {
					var callback = callbacks[data.callbackIndex];
					var subject = data.subject || {};
					subject.fromFrames = Frames;
					if (callback) {
						callback.apply(data.subject, data.params);
					}
				});
			});
		}
		Q.extend(wrapper, original);
		return wrapper;
	}
};

Frames.mainIndexKey = "Q.Frames.mainIndex";
Frames.counterKey = "Q.Frames.counter";
Frames.message.key = "Q.Frames.message";
Frames.message.handledKey = "Q.Frames.message.handled";
Frames.message.counterKey = "Q.Frames.message.counter";
Frames.message.callbacks = {};

Frames.onMessage('Q.Socket.onEvent').add(
function _Q_Socket_onEvent_message (type, data, fromIndex, wasBroadcast) {
	if (Q.Socket.get(data.ns, data.url)) {
		return; // we already have our own socket
	}
	var event = Q.Socket.onEvent(data.ns, data.url, data.name);
	Q.handle(event, {
		nsp: data.ns,
		fromFrames: Frames,
		connected: true
	}, data.params); // simulate a socket event
});

Frames.onMessage('Q.call').add( // implement calling
function _Q_call_message (type, data, fromIndex, wasBroadcast) {
	// handle the call
	var callbacks = [];
	var callbackMessageType = 'Q.callback ' + data.callIndex;
	var params = Q.copy(data.params);
	Q.each(1, data.callbackCount, 1, function (i) {
		params.push(function () {
			Frames.message(callbackMessageType, {
				callbackIndex: i-1,
				subject: Q.isPlainObject(this) ? this : null,
				params: Array.prototype.slice.call(arguments, 0),
				callIndex: data.callIndex
			}, fromIndex);
		});
	});
	Q.handle(Q.getObject(data.methodPath), Q.getObject(data.subjectPath), params);
});

function _becomeMainFrame() {
	if (Frames.mainIndex() === Frames.index) {
		return false; // already main frame
	}
	rls.setItem(Frames.mainIndexKey, Frames.index);
	Q.handle(Frames.onBecameMain);
}

(function () {
	rls.setItem(Q.Frames.counterKey,
		Frames.index = (parseInt(rls.getItem(Frames.counterKey) || 0) + 1) % 1000000
	);
	var mainIndex = Q.Frames.mainIndex();
	if (!mainIndex) {
		_becomeMainFrame();
	} else {
		Frames.message('Q.seekingMainFrame', {}, mainIndex, function (received) {
			if (received === false) {
				_becomeMainFrame();
			}
		});
	}
	Frames.onMessage("Q.needNewMainIndex").set(
	function (type, data, fromIndex, wasBroadcast) {
		if (wasBroadcast && !Frames.mainIndex()) {
			_becomeMainFrame();
		}
	}, 'Q.Frames');
	Q.addEventListener(window, 'storage', function (e) {
		var handledKey = Q.Frames.message.handledKey;
		if (e.key === handledKey) {
			var cb, mi = e.newValue;
			if (mi != null) {
				// signal arrived indicating some messageIndex was handled
				if (cb = Q.Frames.message.callbacks[mi]) {
					try { cb(true); } catch (e) {}
					delete Q.Frames.message.callbacks[mi];
				}
			}
			return;
		}
		if (e.key !== Q.Frames.message.key
		|| e.newValue == null) {
			return;
		}
		var value = JSON.parse(e.newValue);
		if (value.toIndex && value.toIndex !== Q.Frames.index) {
			return;
		}
		rls.setItem(handledKey, value.messageIndex); // signal that it was handled
		rls.removeItem(handledKey); // just to keep things clean
		var event = _frameMessageEvents[value.type];
		if (event) {
			event.handle.call(
				Q, value.type, value.data, value.fromIndex, value.toIndex == null
			);
		}
	});
	Q.onUnload.set(function () {
		if (Q.Frames.mainIndex() !== Q.Frames.index) {
			return;
		}
		rls.removeItem(Q.Frames.mainIndexKey);
		Q.Frames.message('Q.needNewMainIndex');
	}, 'Q.Frames');
})();

Q.Socket.onRegister.set(function (ns, url, name) {
	Q.Socket.onEvent(ns, '', name).add(function (message) {
		if (this.fromFrames === Frames) {
			return;
		}
		if (Frames.isMain()) {
			var params = Array.prototype.slice.call(arguments, 0);
			Frames.message('Q.Socket.onEvent', { params: params, ns: ns, url: '', name: name } );
		}
	}, 'Q.Frames');
	Q.Socket.onEvent(ns, url, name).add(function (message) {
		if (this.fromFrames === Frames) {
			return;
		}
		if (Frames.isMain()) {
			var params = Array.prototype.slice.call(arguments, 0);
			Frames.message('Q.Socket.onEvent', { params: params, ns: ns, url: url, name: name } );
		}
	}, 'Q.Frames');
}, 'Q.Frames');

Q.Socket.connect = Q.Frames.useMainFrame(Q.Socket.connect, 'Q.Socket.connect');

})();