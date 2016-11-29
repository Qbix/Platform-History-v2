(function (Q, $, window, undefined) {
	
var Users = Q.Users;

Q.setObject({
	'Q.text.Users.labels.addLabel': 'New Label',
	'Q.text.Users.labels.prompt': 'Type your new label'
});

/**
 * Users Tools
 * @module Users-labels
 * @main
 */

/**
 * Tool for viewing, and possibly managing, a user's contact labels
 * @class Users labels
 * @constructor
 * @param {Object} [options] options for the tool
 *   @param {String} [options.userId=Q.Users.loggedInUserId()] You can set the user id whose labels are being edited, instead of the logged-in user
 *   @param {String} [options.prefix="Users/"] Pass any prefix here, to filter labels by this prefix
 *   @param {String} [options.contactUserId] Pass a user id here to let the tool add/remove contacts with the various labels, between userId and contactUserId
 *   @param {Boolean|String} [options.canAdd=false] Pass true here to allow the user to add a new label, or a string to override the title of the command.
 */
Q.Tool.define("Users/labels", function Users_labels_tool(options) {
	var tool = this
	var state = tool.state;
	if (state.userId == null) {
		state.userId = Users.loggedInUserId();
	}
	if (state.canAdd === true) {
		state.canAdd = Q.text.Users.labels.addLabel;
	}
	tool.refresh();
	$(tool.element).on(Q.Pointer.fastclick, '.Users_labels_label', function () {
		var $this = $(this);
		var label = $this.attr('data-label');
		if ($this.hasClass('Q_selected')) {
			$this.removeClass('Q_selected');
			if (state.contactUserId) {
				Users.Contact.remove(state.userId, label, state.contactUserId);
			}
		} else {
			$this.addClass('Q_selected');
			if (state.contactUserId) {
				Users.Contact.add(state.userId, label, state.contactUserId);
			}
		}
	});
},

{
	userId: null,
	prefix: 'Users/',
	contactUserId: null,
	onRefresh: new Q.Event()
},

{
	/**
	 * Refresh the tool's contents
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		tool.element.addClass('Q_loading');
		Q.Users.getLabels(state.userId, state.prefix, function (err, labels) {
			Q.Template.render("Users/labels", {
				labels: labels,
				canAdd: state.canAdd,
				canAddIcon: Q.url('plugins/Q/img/actions/add.png')
			}, function (err, html) {
				tool.element.removeClass('Q_loading');
				tool.element.innerHTML = html;
				Q.handle(state.onRefresh, tool, []);
			});
			if (state.userId && state.contactUserId) {
				$(tool.element)
				.addClass('Users_labels_active')
				.find('.Users_labels_label')
					.addClass('Q_selectable')
				.end()
				.find('.Users_labels_action')
					.plugin('Q/clickable')
					.on(Q.Pointer.fastclick, function () {
						Q.prompt(Q.text.Users.labels.prompt, function (title) {
							if (!title) return;
							Users.Label.add(state.userId, title, function () {
								tool.refresh();
							});
						}, { 
							title: state.canAdd, 
							hidePrevious: true,
							maxLength: 63
						});
					});
				Users.getContacts(state.userId, null, state.contactUserId,
				function (err, contacts) {
					Q.each(contacts, function () {
						var label = this.label;
						$(tool.element)
						.find('.Users_labels_label')
						.each(function () {
							var $this = $(this);
							if ($this.attr('data-label') === label) {
								$this.addClass('Q_selected');
								return false;
							}
						});
					});
				});
			}
		});
	}
}

);

Q.Template.set('Users/labels', ''
+ '<ul>'
+ '{{#each labels}}'
+ '<li class="Users_labels_label" data-label="{{this.label}}">'
+   '<img class="Users_labels_icon" src="{{call "iconUrl"}}" alt="label icon">'
+   '<div class="Users_labels_title">{{this.title}}</div>'
+ '</li>'
+ '{{/each}}'
+ '{{#if canAdd}}'
+ '<li class="Users_labels_action">'
+   '<img class="Users_labels_icon" src="{{canAddIcon}}">'
+   '<div class="Users_labels_title">{{canAdd}}</div>'
+ '</li>'
+ '{{/if}}')
+ '<ul>';

})(Q, jQuery, window);