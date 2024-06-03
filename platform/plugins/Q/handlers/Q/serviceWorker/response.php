<?php

function Q_serviceWorker_response()
{
    header("Content-Type: text/javascript");

	$baseUrl_json = Q::json_encode(Q_Request::baseUrl());
	$serviceWorkerUrl_json = Q::json_encode(Q_Request::serviceWorkerURL());
	$cookies_json = Q::json_encode($_COOKIE);
	echo <<<JS
/************************************************
 * Unified Service Worker for Qbix Platform App
 ************************************************/
var Q = {
	info: {
		baseUrl: $baseUrl_json,
		serviceWorkerUrl: $serviceWorkerUrl_json
	}
};
(function () {
	// This anonymous closure is not accessible from outside.
	// It contains code to read, store and attach cookie-like
	// Cookie-JS request headers, and Set-Cookie-JS response headers.

	var cookies = $cookies_json;

	self.addEventListener('fetch', function (event) {
		// if request is not for same origin, then just send it
		var url = new URL(event.request.url);
		var ext = event.request.url.split('?')[0]
			.split('.').pop().toLowerCase();
		if (url.origin !== self.location.origin
		|| ['js', 'css'].indexOf(ext) < 0) {
			return; // let the browser do its usual fetch
		}
		if (url.toString() === Q.info.serviceWorkerUrl) {
			return event.respondWith(new Response(
				"// Can't peek at serviceWorker JS, please use Q.ServiceWorker.start()",
				{
					headers: {'Content-Type': 'text/javascript'}
				}
			));
		}
		return event.respondWith(
			caches.match(event.request)
			.then(function (response) {
				if (response !== undefined) {
					console.log('cached: ' + event.request.url);
					return response;
				}
				// otherwise, attach some headers
				return fetch(event.request);
			})
		);
	});
	self.addEventListener("install", (event) => {
		self.skipWaiting();
	});
	self.addEventListener("activate", (event) => {
  		event.waitUntil(clients.claim());
	});
	self.addEventListener('message', function (event) {
		var data = event.data || {};
		if (data.type === 'Q.Cache.put') {
			caches.open('Q').then(function (cache) {
				data.items.forEach(function (item) {
					var o = {};
					if (item.headers) {
						o.headers = new Headers(item.headers);
					}
					cache.put(item.url, new Response(item.content, o));
					console.log("cache.put " + item.url);
				});
			});
		}
	});
})();


JS;

	echo <<<JS
/************************************************
 * Qbix Platform plugins have added their own code
 * to this service worker through the config named
 * Q/javascript/serviceWorker/modules
 ************************************************/
JS;

	echo PHP_EOL . PHP_EOL;
	echo Q_ServiceWorker::inlineCode();
	echo PHP_EOL . PHP_EOL;
	echo <<<JS

/************************************************
 * Below, Qbix Platform plugins have a chance to 
 * add their own code to this service worker by
 * adding hooks after  "Q/serviceWorker/response"
 ************************************************/
JS;
			
	echo PHP_EOL . PHP_EOL;
	
	// Give a chance for other hooks to output some code.
	Q::event("Q/serviceWorker/response", array(), 'after');

	// TODO: output the other service worker code here from plugins
	// TODO: output the httponly cookies in the service worker, inside a closure
	// and use it to sign things.
	// TODO: also send the httponly cookies again on every request,
	// TODO: listen to Set-Cookie-JS headers and update cookies
	// Every time the script is reloaded, it will get the latest cookies.
	// And then Set-Cookie-JS will set the cookies there.
	// Notice that other sites won't be able to get this,
	// make sure that CORS headers do NOT include access-control-allow-origin

    return false;
}