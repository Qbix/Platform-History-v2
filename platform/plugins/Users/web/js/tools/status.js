(function (Q, $) {

/**
 * Users Tools
 * @module Users-tools
 */

var Users = Q.Users;

/**
 * Renders a user status area which displays logged in status and provides various user-related operations.
 * @class Users status
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *	 @param {String} [options.icon] Icon for the login button. Defaults to Qbix icon.
 *	 @optional
 *	 @param {String} [options.label] Text for the login button. Defaults to 'log in'.
 *	 @default 'log in'
 *	 @param {Boolean} [options.fullName] If set to true, then full name of the user will be displayed, otherwise only the first name.
 *	 @default false
 *	 @param {String} [options.logoutIcon] Url to and Icon for 'Log out' item in the tool menu.
 *   @default null
 *   @param {Array} [options.menuItems] Additional menu items besides 'Log out' which will be shown in the user menu.
 *   Should be an array of hashes like <code> { 'contents': 'value', 'action': 'value' }</code>
 *   @param {Function|String|Q.Event} [options.onMenuSelect] Function, string function name or Q.Event.
 *   Called when user selected some item from user selected some item from user menu except 'Log out'.
 *   @optional
 */
Q.Tool.define("Users/status", function(options) {
	var tool = this;
	var toolDiv = $(this.element);
	var o = options;
	
	Users.userStatus = {
			
		menuHandler: function(element)
		{
			var action = element.attr('data-action');
			switch (action)
			{
				case 'logout':
					logout();
				break;
				default:
					Q.handle(o.onMenuSelect, element, [element]);
			}
		},
		
		update: function(callback)
		{
			if (Q.Users.loggedInUser)
			{
				if (Q.info.isTouchscreen && Q.Layout.orientation == 'portrait')
				{
					makeContextual(callback);
				}
				else
				{
					Users.userStatus.button.plugin('Q/contextual', 'remove');
					makeExpandable(callback);
				}
			} else {
				Q.handle(callback);
			}
		}
	
	};
	
	function logout()
	{
		Q.plugins.Users.logout({
			using: 'native,facebook',
			onSuccess: {'Users.logout': function() {
				var urls = Q.urls || {};
				Q.handle(urls[Q.info.app+'/welcome'] || Q.url(''), function () {
					var br = Q.info.isTouchscreen && Q.Layout.orientation == 'portrait'
						? '<br />'
						: ''
					setTimeout(function()
					{
						Q.Dashboard.build();
						Users.userStatus.button.html('<img src="' + Q.url(o.icon) + '" />'+br+'<span>' + o.label +  '</span>');
						Users.userStatus.button.addClass('.Q_dialog_trigger').plugin('Q/contextual', 'remove');
						Users.userStatus.button.off(Q.Pointer.end).bind(Q.Pointer.end, Users.login);
						setTimeout(function()
						{
							Q.Contextual.updateLayout();
							setTimeout(function()
							{
								Q.Contextual.updateLayout();
							}, 1000);
						}, 0);
					}, 0);
				});
			}}
		});
	}
	
	function fillUserArea(user) {
		var br = Q.info.isTouchscreen && Q.Layout.orientation == 'portrait'
			? '<br />'
			: ''
		if (user)
		{
			var iconUrl = null;
			if (user.identifiers && user.identifiers.facebook) {
				iconUrl = 'https://graph.facebook.com/' + user.identifiers.facebook + '/picture';
			} else {
				iconUrl = Users.iconUrl(user.icon, '40.png');
			}
			Users.userStatus.button.addClass('Q_logged_in').removeClass('Q_dialog_trigger');
			var username = user.displayName || user.username || 'User';
			if (!o.fullName)
					username = username.split(' ')[0];
			Users.userStatus.button.html('<img class="Users_profile_image" src="' + iconUrl + '" alt="User profile image" />' +
										br +
										'<span>' + username + '</span>');
			Users.userStatus.button.unbind(Q.Pointer.end);
			
			if (Q.info.isTouchscreen && (Q.Layout.orientation == 'portrait'))
			{
				makeContextual();
				setTimeout(function()
				{
					Q.Contextual.updateLayout();
					setTimeout(function()
					{
						Q.Contextual.updateLayout();
					}, 1000);
				}, 0);
			}
			else
			{
				makeExpandable();
			}
		}
	}
	
	function makeContextual(callback)
	{
		var contextualItems = [];
		for (var i in o.menuItems)
		{
			contextualItems.push({
				'contents': o.menuItems[i].contents,
				'attributes': { 'action': o.menuItems[i].action }
			});
		}
		var logOutContents = (o.logoutIcon ? '<img src="' + o.logoutIcon + '" alt="" /> ' : '') + 'Log out';
		contextualItems.push({ 'contents': logOutContents, 'attrs': { 'action': 'logout' } });
		Users.userStatus.button.plugin('Q/contextual', 'remove')
		.plugin('Q/contextual', {
			'defaultHandler': 'Q.Users.userStatus.menuHandler',
			'items': contextualItems
		}, callback);
	}
	
	function makeExpandable(callback)
	{
		var expandable = toolDiv.find('.Q_dashboard_expandable');
		if (expandable.children().length === 0)
		{
			var userMenuListing = $('<ul class="Q_listing Q_selectable_listing Users_userMenuListing" />');
			for (var i in o.menuItems)
			{
				userMenuListing.append('<li data-action="' + o.menuItems[i].action + '">' + o.menuItems[i].contents + '</li>');
			}
			var logOutContents = (o.logoutIcon ? '<img src="' + o.logoutIcon + '" alt="" /> ' : '') + 'Log out';
			userMenuListing.append('<li data-action="logout">' + logOutContents + '</li>');
			expandable.append(userMenuListing);
			userMenuListing.plugin('Q/listing', { 
				'handler': { 'Users/status': 'Q.Users.userStatus.menuHandler' },
				'blink': false
			}, callback);
		} else {
			Q.handle(callback);
		}
	}
	
	Users.onLogin.set(fillUserArea, tool);
	Users.userStatus.button = toolDiv.find('.Q_login');
	Users.userStatus.button.unbind(Q.Pointer.end).bind(Q.Pointer.end, Users.login);
	fillUserArea(Q.Users.loggedInUser);
},

{
	'icon': '{{Q}}/img/ui/qbix_icon' + (Q.info.isMobile ? '_small' : '') + '.png',
	'label': 'log in',
	'fullName': false,
	'logoutIcon': null,
	'menuItems': [],
	'onMenuSelect': new Q.Event()
}

);

})(Q, jQuery);