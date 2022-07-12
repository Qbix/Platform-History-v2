if (!window.Q) { // You can remove this part after you've run install.php
	document.getElementsByTagName('body')[0].innerHTML = "<h1>Please run MyApp/scripts/Q/install.php --all</h1>";
	throw "Q is not defined";
}

var MyApp = (function (Q, $) {
	
	// Here is some example code to get you started
	
	var MyApp = {
		userContextual: function (item) {
			var action = $(item).attr('data-action');
			if (MyApp.actions[action]) {
				Q.handle(MyApp.actions[action], MyApp, [item]);
			}
		},
		actions: {
			logout: Q.Users.logout,
			setIdentifier: Q.Users.setIdentifier
		}
	};
	
	Q.onInit.set(function () {
		// you can override some default strings client-side:
		Q.Text.get('MyApp/content');
	}, 'MyApp', true);
	
	// The following code is for all pages.
	// For specific pages, see web/js/pages directory. 
	Q.page('', function () {
		
		$('.MyApp_login').on(Q.Pointer.click, function () {
			Q.Users.login();
			return false;
		});

		var $userCommands = $('#dashboard_user_contextual .Q_listing').children();
		if ($userCommands.length) {
			Q.addScript("{{Q}}/js/contextual.js", function () {
				$('#dashboard .Users_avatar_tool').plugin('Q/contextual', {
					elements: $userCommands.clone(),
					defaultHandler: MyApp.userContextual
				});
			});
		}
		
		// For example, we can hide notices when the user clicks/taps on them
		$('#notices li').on(Q.Pointer.fastclick, true, function () {
			var $this = $(this), key;
			$this.css('min-height', 0)
			.slideUp(300, function () {
				$(this).remove();
				if (!$('#notices li').length) {
					$('#notices_slot').empty();
				}
				Q.layout();
			});
			if (key = $this.attr('data-key')) {
				Q.req('Q/notice', 'data', null, { 
					method: 'delete', 
					fields: {key: key} 
				});
			}
		}).css('cursor', 'pointer');
	}, 'MyApp');
	
	// example stream
	Q.Streams.define("MyApp/cool", "js/streams/cool.js");
	
	// example tool
	Q.Tool.define("MyApp/cool", "js/tools/cool.js");

	// tell Q.handle to load pages using AJAX - much smoother
	Q.handle.options.loadUsingAjax = true;
	
	// make the app feel more native on touch devices
	Q.Pointer.preventRubberBand({
		direction: 'vertical'
	});
	Q.Pointer.startBlurringOnTouch();
	
	// set some options
	if (Q.info.isTouchscreen) {
		Q.Tool.jQuery.options("Q/clickable", {
			press: { size: 1.5 },
			release: { size: 3 },
			shadow: null
		});
	}
	
	Q.extend(Q.Tool.jQuery.loadAtStart, [
		'Q/clickfocus', 
		'Q/contextual', 
		'Q/scrollIndicators', 
		'Q/iScroll', 
		'Q/scroller'
	]);
	
	Q.Users.cache.where = 'local';
	Q.Streams.cache.where = 'local';
	
	return MyApp;
	
})(Q, jQuery);