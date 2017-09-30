(function (Q, $, window, undefined) {
	
var Users = Q.Users;

Q.setObject({
	'Q.text.Users.labels.addLabel': 'New Label',
	'Q.text.Users.labels.prompt': 'Give it a name'
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
 *   @param {String|Object} [options.all] To show "all labels" option, whose value is "*", pass here its title or object with "title" and "icon" properties.
 *  @param {Q.Event} [options.onRefresh] occurs after the tool is refreshed
 *  @param {Q.Event} [options.onClick] occurs when the user clicks or taps a label. Is passed (element, label, title, wasSelected). Handlers may return false to cancel the default behavior of toggling the label.
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
		var $this = $(this), ret;
		var label = $this.attr('data-label');
		var wasSelected = $this.hasClass('Q_selected');
		var title = $this.text();
		if (false === Q.handle(state.onClick, tool, [this, label, title, wasSelected])) {
			return;
		};
		if (wasSelected) {
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
	canAdd: false,
	onRefresh: new Q.Event(),
	onClick: new Q.Event()
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
		var all = state.all;
		if (typeof all === 'string') {
			all = {
				title: all,
				icon: Q.url("{{Users}}/img/icons/labels/all/40.png")
			};
		}
		Q.Users.getLabels(state.userId, state.prefix, function (err, labels) {
			Q.Template.render("Users/labels", {
				labels: labels,
				all: all,
				canAdd: Q.Users.loggedInUser && state.canAdd,
				canAddIcon: Q.url('{{Q}}/img/actions/add.png')
			}, function (err, html) {
				tool.element.removeClass('Q_loading');
				tool.element.innerHTML = html;
				Q.handle(state.onRefresh, tool, []);
			});
			if (state.userId && state.contactUserId) {
				$(tool.element)
				.addClass('Users_labels_active')
				.find('.Users_labels_label')
				.addClass('Q_selectable');
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
			if (state.canAdd) {
				var $add = tool.$('.Users_labels_add')
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
				setTimeout(function () {
					// add clickable after the sizing has been done
					$add.plugin('Q/clickable');
				}, 0);
			}
		});
	}
}

);

Q.Template.set('Users/labels', ''
+ '<ul>'
+ '{{#if all}}'
+ '<li class="Users_labels_label" data-label="*">'
+   '<img class="Users_labels_icon" src="{{all.icon}}" alt="all">'
+   '<div class="Users_labels_title">{{all.title}}</div>'
+ '</li>'
+ '{{/if}}'
+ '{{#each labels}}'
+ '<li class="Users_labels_label" data-label="{{this.label}}">'
+   '<img class="Users_labels_icon" src="{{call "iconUrl"}}" alt="label icon">'
+   '<div class="Users_labels_title">{{this.title}}</div>'
+ '</li>'
+ '{{/each}}'
+ '{{#if canAdd}}'
+ '<li class="Users_labels_action Users_labels_add">'
+   '<img class="Users_labels_icon" src="{{canAddIcon}}">'
+   '<div class="Users_labels_title">{{canAdd}}</div>'
+ '</li>'
+ '{{/if}}')
+ '<ul>';

})(Q, jQuery, window);