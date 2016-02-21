var RS = (function() {

	//=========== PRIVATE FIELDS =========== //
	var $ = undefined;
	var RS = {};
	var userData = {
		sessionId : undefined,
		sessionTime : undefined,
		minWait : undefined,
		visitId : undefined
	};

	//=========== PUBLIC FIELDS =========== //
	RS.config = {
		baseUrl : 'http://rs.hidev.it',
		cookiePrefix : '__rs_'
	};

	RS.callback = function(index, params) {
		api.callbacks[index](params);
	};

	RS.debug = function()
	{
		trace('userData', userData);	
	};

	//=========== PRIVATE METHODS =========== //
	function startUp() {
		var pr = RS.config.cookiePrefix;

		//read data from cookies
		userData.sessionId = util.cookie(pr + 'sessionId');
		userData.sessionTime = parseInt(util.cookie(pr + 'session_time')) || 0;
		userData.minWait = parseInt(util.cookie(pr + 'min_wait')) || 0;

		//http://rs.hidev.it/#rs=12345&tag1&tag2
		var hash = window.location.href.split('#')[1];

		//if there's a #rs=12345 in url - track this visit now (it's a share)
		if(hash)
		{
			var hashparts = hash.split('&');
			if(hashparts[0].substring(0, 3) == 'rs=')
			{
				userData.fromVisitId = hashparts[0].split('=')[1];
				hashparts.splice(0, 1);
				userData.fromVisitTags = hashparts;

				trace('Tracking visit: rs=' + userData.fromVisitId);
				api.trackVisit();
				return;
			}
		}

		//if we don't have a sessionId - get it now
		if(!userData.sessionId)
		{
			trace('Tracking visit: no session id');
			api.trackVisit();
			return;
		}

		//it's not a share and we have sessionId

		//fix sessionTime if it isn't there
		if(!userData.sessionTime)
			userData.sessionTime = 0;

		//fix minWait if it isn't there
		if(!userData.minWait)
			userData.minWait = 0;

		var curr_time = (new Date()).getTime();

		//if there is a timeout and it hasn't elapsed - schedule it
		if(userData.sessionTime && userData.minWait && (userData.sessionTime + userData.minWait > curr_time))
		{
			trace('Scheduling request to happen in: ' + (((userData.sessionTime + userData.minWait) - curr_time) / 1000 / 60).toFixed(2) + ' minutes');
			setTimeout(function() { trace('Tracking visit: minWait has come'); api.trackVisit(); }, (userData.sessionTime + userData.minWait) - curr_time);
		}
		else //otherwise, do it now
		{
			trace('Tracking visit: minWait is in the past');
			api.trackVisit();
		}
	}

	function trace() {
		if(window.console && window.console.log && window.console.log.apply)
			window.console.log.apply(window.console, arguments);
	}
	function loadIfMissing(current, url, onload) {
		if(!current)
			util.addScript(url, onload);
		else if(onload)
			onload();
	}

	function injectScript(url)
	{
//		$$.trace(url);
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		document.getElementsByTagName('head')[0].appendChild(script);
		script.setAttribute('src', url);
		return script;
	}

	//=========== CLASSES =========== //

	/* UTILITIES */
	var util = (function() {
		var util = {};

		util.addScript = function(src, type, onload)
		{
			if (typeof(src) === 'array')
			{
				if (typeof(type) === 'function')
					onload = type;

				var ret = [];

				for (var i = 0; i < src.length; ++i)
					ret.push(util.addScript(src[i].src, src[i].type, onload));

				return ret;
			}

			if (typeof(type) === 'function')
			{
				onload = type;
				type = null;
			}

			if (!type)
				type = 'text/javascript';

			var scripts = document.getElementsByTagName('script');

			for (var s = 0; s < scripts.length; ++s)
			{
				if (scripts[s].getAttribute('src') === src)
				{
					if (onload)
						onload(true);

					return null; // don't add
				}
			}

			// Create the script tag and insert it into the document
			var script = document.createElement('script');

			script.setAttribute('type', type);

			if (onload)
			{
				script.onload = onload;
				script.onreadystatechange = onload; // for IE6
			}

			document.getElementsByTagName('head')[0].appendChild(script);

			script.setAttribute('src', src);

			return script;
		};

		util.cookie = function(name, value, options) {
			var o = $.extend({
				expires: 3600*1000
			}, options);
			if (typeof value != 'undefined') {
				if (value === null) {
					document.cookie = encodeURIComponent(name)+'=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/';
					return null;
				}
				var expires = new Date();
				expires.setTime((new Date()).getTime() + o.expires);
				document.cookie = encodeURIComponent(name)+'='+encodeURIComponent(value)
						+';expires='+expires.toGMTString()+';path=/';
				return null;
			}

			// Otherwise, return the value
			var cookies = document.cookie.split(';');
			var parts = null;
			for (var i=0; i<cookies.length; ++i) {
				parts = cookies[i].split('=', 2);
				if (decodeURIComponent(parts[0].trim()) === name) {
					return parts.length < 2 ? null : decodeURIComponent(parts[1]);
				}
			}
			return null;
		};

		return util;
	})();

	/* API */
	var api = (function() {
		var api = {
			callbacks : []
		};

		function request(url, urlparams, callback) {
			var i = api.callbacks.length;
			api.callbacks[i] = function(json) {
				api.callbacks.splice(i, 1);
				callback(json);
			};

			urlparams = $.extend(urlparams, {
				'Q.ajax':'JSON',
				'Q.timestamp':(new Date()).getTime(),
				'Q.callback':i
			});

			util.addScript(url + '?' + $.param(urlparams));
		}

		api.callbacks = [];
		api.trackVisit = function() {
			trace('Sending request');

			var params = {
				url: window.location.toString().split('#')[0]
			};

			if(userData.sessionId)
				params.sessionId = userData.sessionId;

			if(userData.fromVisitId)
				params.from_visit_id = userData.fromVisitId;

			//TODO: add fromVisitTags to params

			request(RS.config.baseUrl + '/visit.php', params, function(resp) {

				trace(resp);

				userData.sessionId = resp.sessionId;
				userData.sessionTime = (new Date()).getTime();
				userData.visitId = resp.visit_id;
				userData.minWait = resp.min_wait * 1000; //next min_wait

				var pr = RS.config.cookiePrefix;

				util.cookie(pr + 'sessionId', userData.sessionId);
				util.cookie(pr + 'session_time', userData.sessionTime);
				util.cookie(pr + 'min_wait', userData.minWait);

				if(userData.fromVisitId)
				{
					trace('REDIRECTING TO NO HASH');
					window.location.replace(window.location.toString().split('#')[0]);
				}
			});
		};

		return api;
	})();

	loadIfMissing(window.jQuery, 'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js', function() {
		$ = window.jQuery;

		trace('jQuery loaded');

		$(function() {
			startUp(); //Visit tracker

			util.addScript('http://s7.addthis.com/js/250/addthis_widget.js#username=vasman&async=1&domready=1', function() {

				addthis.init();

				window.addthis_config.data_track_clickback = true;
				window.addthis_config.username = "vasman";

				if(!window.addthis_share.url_transforms)
					window.addthis_share.url_transforms = {};

				if(!window.addthis_share.url_transforms.add)
					window.addthis_share.url_transforms.add = {};

				window.addthis_share.url_transforms.add._rs_session = '12345';

				var $div = $('<div>').css({position:'absolute', top:'6px', right:'20px', height:'20px', width:'100px'});
				var $btn = $('<a/>').addClass('addthis_counter addthis_pill_style');

				$('#dashboard').append($div.append($btn));

				addthis.counter($btn[0]);
			});


		});
	});

	return RS;
})();


