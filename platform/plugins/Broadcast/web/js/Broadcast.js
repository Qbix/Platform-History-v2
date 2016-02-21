/**
 * Broadcast plugin's front end code
 *
 * @module Broadcast
 * @class Broadcast
 */


(function (Q) {

var Broadcast = Q.Broadcast = Q.plugins.Broadcast = {

};

Q.onActivate.set(function () {
	
	Q.Users.login.options.using = 'facebook';
	Q.Users.login.options.scope = 'email,publish_stream,offline_access';
	Q.text.Users.login.directions = "Create an account, or login:";
	Q.text.Users.login.explanation = null;
	
	Broadcast.login = function(options) {
		if (typeof options === 'function') {
			options.onSuccess = arguments[0];
			if (arguments.length > 1) {
				options.onRequireComplete = arguments[1];
			}
		}
		Q.plugins.Users.login(options || {});
	};
	
	Broadcast.logout = function(options)
	{
		//if (!confirm('This will log you out of facebook too. Proceed?'))
		  	//return;
		Q.plugins.Users.logout({
		  // using: 'facebook',
		  onSuccess: function()
		  {
		    Q.handle(Q.info.baseUrl);
		  }
		});
	};
	
	Broadcast.onBroadcastSuccess = function (params) {
		alert("Broadcast successful!");
		window.location.reload(true);
	};

	
	$(function() {
	  $('.Broadcast_login').on('click', function() { 
			if (Broadcast.widget) {
				Broadcast.login({
					onSuccess: onWidgetLoginSuccess
				});
			} else {
				Broadcast.login(); return false; 
			}
		});
		$('.Broadcast_logout').on('click', function()
		{
		  Broadcast.logout();
			return false;
		});
		$('.Broadcast_addtab').on('click', function () {
			FB.ui({method: 'pagetab'}, function (response) {
	            if (response != null && response.tabs_added != null) {
					var page_ids = [];
					for (var page_id in response.tabs_added) {
						page_ids.push(page_id);
					}
					// inform our server
					Q.request(
						Q.action('Broadcast/page'
							+ '?page_ids=' + page_ids.join(',')
						),
						'', 
						function () {},
						{ method: "post" }
					);
	            }
			});
		})
		Q.ensure($.deparam, Q.url('plugins/Broadcast/js/bbq.min.js'), function () {
			$('#Broadcast_agreement_main').on('change', function () {
				var q = $.deparam.querystring();
				var $this = $(this);
				var method = $this.attr('checked') ? 'put' : 'delete';
				if (!q.publisherId) {
					alert('publisher id is missing');
					return false;
				}
				if (!q.streamName) {
					alert('stream name is missing');
					return false;
				}
				$this.next().css({
					'background': 'url('+ Q.url('plugins/Q/img/throbbers/bars16.gif') +')'
				});

				Q.request(
					Q.action('Broadcast/agreement?publisherId='
					+encodeURIComponent(q.publisherId)+'&streamName='
					+encodeURIComponent(q.streamName))+sessionQuerystring(),
					'data',
					function (err, response) {
						$this.next().css({'background': 'none'});
						if (response.errors) {
							alert(response.errors[0].message);
							return;
						}
						$this.attr('checked', response.slots.data.agreed);
					},
					{method: method}
				);
			});	
		});
		// Q.plugins.Users.initFacebook();
		if (Q.info.uri.action === 'stream') {
			Q.plugins.Users.initFacebook();
		} else {
			if (Broadcast.widget) {
				Broadcast.login({
					tryQuietly: true,
					onSuccess: onWidgetLoginSuccess,
					prompt: false
				});
			} else {
				Broadcast.login({
					tryQuietly: true
				});
			}
		}
		
		$('textarea.widget_code').mouseup(function () {
			$(this).select();
		});
	});
	
	Q.Users.login.options.onSuccess.set(function (user) {
		var args;
		if (typeof(FB) !== 'undefined' && FB.getAuthResponse) {
			// if we haven't set a cookie yet, we need to do a post
			// otherwise, we will just redirect
			if (!Q.cookie('fbsr_'+Q.plugins.Users.facebookApps.Broadcast.appId)) {
				args = {Users: {facebook_authResponse: FB.getAuthResponse()}};
			}
		}
		if (user && Q.info.uri && Q.info.uri.facebook) {
			Q.handle(Q.url('facebook/'), null, null, args);
			return;
		}
		var l = location.href.split('#')[0].split('?')[0];
		if ((l == Q.info.baseUrl || l == Q.info.baseUrl + '/')) {
			Q.handle(Q.urls['Broadcast/main'], null, null, args);
		}
	}, '');

	function onWidgetLoginSuccess () {
		Q.ensure($.deparam, Q.url('plugins/Broadcast/js/bbq.min.js'), function () {
			var q = $.deparam.querystring();
			if (!q.publisherId) {
				alert('publisher id is missing');
				return false;
			}
			if (!q.streamName) {
				alert('stream name is missing');
				return false;
			}

			var args, argsQuery = '';
			if (typeof(FB) !== 'undefined' && FB.getAuthResponse) {
				// if we haven't set a cookie yet, we need to do a post
				// otherwise, we will just redirect
				if (!Q.cookie('fbsr_'+Q.plugins.Users.facebookApps.Broadcast.appId)) {
					args = {Users: {facebook_authResponse: FB.getAuthResponse()}};
					argsQuery = '&'+$.param(args);
				}
			}

			if (q.streamName.join) {
				q.streamName = q.streamName.join('/');
			}
			Q.request(
				Q.action('Broadcast/agreement?publisherId='
				+encodeURIComponent(q.publisherId)+'&streamName='
				+encodeURIComponent(q.streamName))+sessionQuerystring(),
				'data',
				function (response) {
					if (response.errors) {
						return alert(response.errors[0].message);
					}
					$('.Broadcast_manage').show('fast');
					$('.Broadcast_initiate').hide('fast');
					$('#Broadcast_agreement_main').attr('checked', response.slots.data.agreed);
				}
			);
		});
	};
	
	Broadcast.onWidgetmakerSuccess = function (response) {
		if (response.errors) {
			alert(response.errors[0].message);
			return;
		}
		$('textarea.widget_code').text(response.slots.form);
		$('div.widget_results').show();
	};
	
	function sessionQuerystring() {
		var args;
		if (typeof(FB) !== 'undefined' && FB.getAuthResponse) {
			// if we haven't set a cookie yet, we need to do a post
			// otherwise, we will just redirect
			if (!Q.cookie('fbsr_'+Q.plugins.Users.facebookApps.Broadcast.appId)) {
				args = {Users: {facebook_authResponse: FB.getAuthResponse()}};
				return '&'+$.param(args);
			}
		}
		return '';
	};
	
});


})(Q);