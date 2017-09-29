(function (Q, $) {

/**
 * Users Tools
 * @module Users-tools
 * @main
 */

/**
 * Allows selecting a facebook friend from the logged-in user's friends list.
 * @class Users friendSelector
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Function} [options.onSelect] This callback is called when the user selects a friend.
 *   @required
 *   @param {Array|Object|Function} [options.customList]
 *   Optional. By default friends list is fetched from facebook, but here you can provide an array of friends or
 *   callback which in turn will call friendSelector callback passing it such array as first agrument.
 *   Callback may be a function or string name of the function.
 *   Array should contain objects like <code> { id: 'id', name: 'name' } </code>.
 *   <b>'includeMe' option is ignored if 'customList' provided </b>
 *   @param {String|Boolean} [options.includeMe]
 *   Whether or not to include user himself. Can be just boolean true or a string,
 *    which is used instead of user real name.
 *    <b>Ignored if 'customList' option is provided.</b>
 *    @param {String} [options.platform]
 *    Has to be "facebook" for now.
 *    @default 'facebook'
 *    @param {String|Boolean} [options.prompt]
 *    Specifies type of prompt if user is not logged in or didn't give required permission for the tool.
 *    Can be either 'button', 'dialog' or null|false. In first case just shows simple button which opens facebook login popup.
 *    In second case shows Users.facebookDialog prompting user to login.
 *    In third case will not show any prompt and will just hide the tool.
 *    @optional
 *    @param {String} [options.promptTitle]
 *    Used only when 'prompt' equals 'dialog' - will be title of the dialog.
 *    @optional
 *    @param {String} [options.promptText]
 *    Used either for button caption when 'prompt' equals 'button' or
 *                 dialog text when 'prompt' equals 'dialog'.
 *    @optional
 *    @param {Function} [options.filter] Custom function to filter out the friends list.
 *    @param {Function} [options.ordering] Custom function to order the friends list. By default friends are ordered by name.
 */
Q.Tool.define('Users/friendSelector', function(o) {
	var toolDiv = $(this.element);
	if (!o.onSelect)
	{
		alert("Please provide the onSelect option for the friendSelector");
		return false;
	}
	if (o.platform !== 'facebook')
	{
		alert("Only facebook is supported as a platform for now");
		return false;
	}
	o.onSelect = new Q.Event(o.onSelect);
	
	function onSuccessfulLogin()
	{
		if (o.customList)
		{
			if (typeof(o.customList) == 'string') // string name of callback
				eval(o.customList)(processFriends);
			else if (typeof(o.customList) == 'function') // just regular callback
				o.customList(processFriends);
			else // an array
				processFriends(o.customList);
		}
		else
		{
			FB.api('me/friends', function(response)
			{
				var friends = response.data;
				if (o.includeMe)
				{
					FB.api('me', function(response)
					{
						friends.unshift({
							'id': response.id,
							'name': (typeof(o.includeMe) == 'string' ? o.includeMe : response.first_name + ' ' + response.last_name)
						});
						processFriends(friends);
					});
				}
				else
				{
					processFriends(friends);
				}
			});
		}
	}
	
	function processFriends(friends)
	{
		toolDiv.empty();
		friends = o.filter(friends);
		friends = o.ordering(friends);
		
		toolDiv.append('<div class="Users_friendSelector_tool_title">Select a user:</div>');
		var filterField = $('<div class="Users_friendSelector_tool_input_field" />');
		var filterFieldInput = $('<input type="text" placeholder="Start typing..." />');
		filterFieldInput.keyup(function()
		{
			fillFriends(o.filter(friends, $(this).val()));
		});
		filterField.prepend(filterFieldInput);
		toolDiv.append(filterField);
		var filterFieldWidth = toolDiv.width() - parseInt(filterFieldInput.css('padding-left')) -
												parseInt(filterFieldInput.css('padding-right'));
		filterFieldInput.css({ 'width': filterFieldWidth + 'px' });
		
		var searchIcon = $('<div class="Users_friendSelector_search_icon" />');
		$(document.body).append(searchIcon);
		var iconLeft = filterField.offset().left + filterField.outerWidth() - searchIcon.width();
		var iconTop = filterField.offset().top + (filterField.innerHeight() - searchIcon.height()) / 2;
		searchIcon.css({
			'margin-left': iconLeft + 'px',
			'margin-top': iconTop + 'px'
		});
		
		toolDiv.plugin('Q/placeholders');
		
		fillFriends(friends);
	}
	
	function fillFriends(friends)
	{
		$('.Users_friendSelector_tool > ul').remove();
		var friendsList = $('<ul />'), i;
		for (i in friends)
		{
			var friendItem = $(
				'<li data-uid="'+ friends[i].id + '">' +
					'<div class="Users_friendSelector_tool_user_picture">' +
						'<img src="https://graph.facebook.com/' + friends[i].id + '/picture" alt="User picture" />' +
					 '</div>' +
					 '<div class="Users_friendSelector_tool_user_name">' + friends[i].name + '</div>' +
				 '</li>'
			);
			friendItem.click(function() {
				Q.handle(options.onSelect, this, [$(this).attr('data-uid')]);
			});
			friendsList.append(friendItem);
			}
		$('.Users_friendSelector_tool').append(friendsList);
	}
	
	switch (o.platform) {
		case 'facebook':
			toolDiv.empty().append('<div class="Users_tools_throbber"><img src="' + Q.url('/{{Q}}/img/throbbers/loading.gif') + '" alt="" /></div>');
			
			Users.login({
				tryQuietly: true,
				using: 'facebook',
				onSuccess: function()
				{
					onSuccessfulLogin(toolDiv);
				},
				onCancel: function()
				{
					// we may show the dialog asking user to login
					if (o.prompt == 'dialog')
					{
						Users.facebookDialog({
							'title': o.promptTitle,
							'content': o.promptText,
							'buttons': [
								{
									'label': 'Login',
									'handler': function(dialog)
									{
										Users.login(
										{
											using: 'facebook',
											onCancel: function()
											{
												dialog.close();
												toolDiv.hide();
											},
											onSuccess: function()
											{
												dialog.close();
												onSuccessfulLogin(toolDiv);
											}
										});
									},
									'default': true
								},
								{
									'label': 'Cancel',
									'handler': function(dialog)
									{
										toolDiv.hide();
										dialog.close();
									}
								}
							],
							'position': null,
							'shadow': true
						});
					}
					// or a button, clicking on it will cause facebook login popup to appear
					else if (o.prompt == 'button')
					{
						var button = $('<button class="Q_button">' + o.promptText + '</button>');
						toolDiv.empty().append(button);
						button.click(function()
						{
							Users.login(
							{
								using: 'facebook',
								onSuccess: function()
								{
									onSuccessfulLogin();
								}
							});
						});
					}
					// or just hide friend selector
					else
					{
						toolDiv.hide();
						Users.login.options.onSuccess.set(function() {
							Users.login.options.onSuccess.remove('friend-selector-login');
							toolDiv.show();
							onSuccessfulLogin();
						}, 'friend-selector-login');
					}
				}
			});
		break;
	}
}, 

{
	onSelect: null,
	customList: null,
	includeMe: false,
	platform: 'facebook',
	prompt: false,
	promptTitle: 'Login required',
	promptText: 'Please log into Facebook to to view your friends.',
	filter: function(friends, filter)
	{
		if (typeof(filter) == 'undefined')
		{
			return friends;
		}
		else
		{
			var filteredFriends = [], i, j, k;
			for (i in friends)
			{
				var filterWords = filter.toLowerCase().split(' ');
				var nameWords = friends[i].name.toLowerCase().split(' ');
				var passedChecks = [];
				for (j in filterWords)
				{
					for (k in nameWords)
					{
						if (nameWords[k].indexOf(filterWords[j]) != -1)
						{
							passedChecks.push(true);
							delete nameWords[k];
							break;
						}
					}
				}
				var passed = passedChecks.length == filterWords.length;
				for (j in passedChecks)
				{
					if (!passedChecks[j])
						passed = false;
				}
				if (passed)
					filteredFriends.push(friends[i]);
			}
			return filteredFriends;
		}
	},
	ordering: function(friends) { return friends; }
}

);

})(Q, jQuery);