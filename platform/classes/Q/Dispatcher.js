/**
 * @module Q
 */
var Q = require('../Q');
var events = require('events');
var express = require('express');

/**
 * Used to dispatch request to the appropriate handler
 * @class Dispatcher
 * @namespace Q
 * @constructor
 * @param {object} server The server object
 * @param {object} [options={}] Options
 */
function Dispatcher (server, options) {
	var dispatcher = this;
	dispatcher.route = Dispatcher.route;
	var app = server.attached.express;
	app.use(express.methodOverride('Q.method'));
	app.use(function Q_Dispatcher_request_handler (req, res, next) {
		var handler;
		var uri = Dispatcher.route(req.url);
		if (!uri) {
			return next();
		}
		var info = {request: req, uri: uri, response: res};

		req.query.callback = req.query["Q.callback"] || req.query.callback;

		/**
		 * Http request validation
		 * @event validate
		 * @param {object} info
		 *	The object containing request, response and url
		 */
		dispatcher.emit('validate', info);
		handler = Q.getObject([uri.module, uri.action, 'validate'], Q.handlers);
		if (!Q.isEmpty(handler)) {
			Q.handle(handler, this, [info, afterValidate]);
		} else {
			afterValidate();
		}

		function afterValidate(errors) {
			if (errors && errors.length) {
				res.send(JSON.stringify({"errors": errors}));
				return;
			}
			var methods = Q.Config.get(['Q', 'methods'], ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
			var method = Q.Request.method(req);
			if (methods.indexOf(method) < 0) {
				res.send(JSON.stringify({"errors": method + " method not supported"}));
				return;
			}
			var m = method.toLowerCase();
			/**
			 * Http POST request
			 * @event post
			 * @param {object} info
			 *	The object containing request, response and url
			 */
			/**
			 * Http PUT request
			 * @event put
			 * @param {object} info
			 *	The object containing request, response and url
			 */
			/**
			 * Http DELETE request
			 * @event delete
			 * @param {object} info
			 *	The object containing request, response and url
			 */
			/**
			 * Http OPTIONS request
			 * @event options
			 * @param {object} info
			 *	The object containing request, response and url
			 */

			dispatcher.emit(m, info);
			handler = Q.getObject([uri.module, uri.action, m], Q.handlers);
			if (!Q.isEmpty(handler)) {
				Q.handle(handler, this, [info, afterMethod]);
			} else {
				afterMethod();
			}
		}

		function afterMethod(errors) {
			if (errors && errors.length) {
				res.send(JSON.stringify({"errors": errors}));
				return;
			}
			/**
			 * Http response
			 * @event response
			 * @param {object} info
			 *	The object containing request, response and url
			 */
			dispatcher.emit('response', info);

			var slotNames = Q.Request.slotNames(req);
			if (!slotNames) {
				result = {"errors": ["missing slot names"]};
				res.contentType('application/json');
				var content = req.query.callback
					? req.query.callback + "(" + JSON.stringify(result) + ")"
					: JSON.stringify(result);
				res.send(content);
				return;
			}
			var p = new Q.Pipe(slotNames, function (params) {
				// this happens only after all the slots are filled
				// so make sure those handlers call the callbacks, or no response will be written
				var slots = {}, errors = [];
				for (var i=0; i<slotNames.length; ++i) {
					var slotName = slotNames[i];
					var err = params[slotName][0];
					if (err) {
						errors.push(err);
					}
					slots[slotName] = params[slotName][1];
				}
				var result = {"slots": slots};
				if (errors.length) {
					result.errors = errors;
				}
				result.timestamp = Date.now();
				res.contentType('application/json');
				var content = req.query.callback
					? req.query.callback + "(" + JSON.stringify(result) + ")"
					: JSON.stringify(result);
				res.send(content);
			});
			for (var i=0; i<slotNames.length; ++i) {
				var slotName = slotNames[i];
				var handler = Q.getObject([uri.module, uri.action, 'response', slotName], Q.handlers);
				if (!Q.isEmpty(handler)) {
					Q.handle(handler, this, [info, p.fill(slotName)]);
				} else {
					p.fill(slotName)(uri.module+"/"+uri.action+" does not define slot "+slotName);
				}
			}
		}
	});
}

/**
 * Start external server
 * @method listen
 * @param {object} [options={}]
 * @return {object} The server object
 * @throws {Q.Exception} if Q/node/port or Q/node/host config fields are missing
 */
Dispatcher.listen = function (options) {
	options = options || {};
	var port = Q.Config.get(['Q', 'node', 'port'], null);
	var host = Q.Config.get(['Q', 'node', 'host'], null);
	if (port === null)
		throw new Q.Exception("Q: Missing config field: Q/node/port");
	if (host === null)
		throw new Q.Exception("Q: Missing config field: Q/node/host");
	var server = Q.listen({
		port: options.port || port,
		host: options.host || host
	});
	if (!server.attached.dispatcher) {
		server.attached.dispatcher = new Dispatcher(server, options);
	}
	return server;
};

/**
 * Route the request
 * @method route
 * @param {string} url The URL to route
 * @return {object} Object containint the requested "module" and "action"
 */
Dispatcher.route = function (url) {
	var index = url.indexOf('/action.php/'), tailStart;
	if (index === -1) {
		var appRootUrl = Q.Config.get('Q', 'web', 'appRootUrl', false);
		if (!appRootUrl) {
			return false;
		}
		var parsed = require('url').parse(appRootUrl);
		tailStart = parsed.pathname.length;
	} else {
		tailStart = index+'/action.php/'.length;
	}
	var parts1 = url.substring(tailStart).split('?');
	var parts2 = parts1[0].split('/');
	if (!parts2[1]) {
		return false;
	}
	return {module: parts2[0], action: parts2[1]};
};

Q.makeEventEmitter(Dispatcher, true);
module.exports = Dispatcher;