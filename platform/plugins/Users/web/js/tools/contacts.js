(function (Q, $, window, undefined) {
	
var Users = Q.Users;

/**
 * Users Tools
 * @module Users-labels
 * @main
 */

/**
 * Tool for inviting users with a label selected from the list of possible labels.
 * @class Users contacts
 * @constructor
 * @param {Object} [options] options for the tool
 *   @param {String} options.communityId Id of community where to need to invite user
 *   @param {String} [options.prefix="Users/"] Pass any prefix here, to filter labels by this prefix
 *  @param {Q.Event} [options.onRefresh] occurs after the tool is refreshed
 *  @param {Q.Event} [options.onClick] occurs when the user clicks or taps a label. Is passed (element, label, title, wasSelected). Handlers may return false to cancel the default behavior of toggling the label.
 */
Q.Tool.define("Users/contacts", function Users_labels_tool(options) {
	var tool = this
	var state = tool.state;

	if (!state.communityId) {
		throw new Q.Exception('communityId not defined');
	}

	Q.Text.get('Users/content', function (err, text) {
		tool.text = text.usersContacts;

		tool.refresh();
	});

	$(tool.element).on(Q.Pointer.fastclick, '.Users_labels_label', function () {
		var $this = $(this);
		state.label = $this.attr('data-label');

		$this.addClass('Q_selected').siblings().removeClass('Q_selected');
	});
},

{
	prefix: 'Users/',
	communityId: null,
	label: null,
	onInvited: new Q.Event()
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
		Q.Users.getLabels(state.communityId, state.prefix, function (err, labels) {
			Q.Template.render("Users/labels", {
				labels: labels,
				all: all,
				canAdd: tool.text.inviteUser,
				canAddIcon: Q.url('{{Q}}/img/actions/add.png')
			}, function (err, html) {
				tool.element.removeClass('Q_loading');
				tool.element.innerHTML = html;
				Q.handle(state.onRefresh, tool, []);
			});

			var $add = tool.$('.Users_labels_add').on(Q.Pointer.fastclick, function () {

				if(!state.label) {
					return Q.alert(tool.text.selectLabel);
				}

				Q.Streams.invite(state.communityId, 'Streams/experience/main', {
					addLabel: state.label
				}, function () {
					Q.handle(state.onInvited, tool);
				});
			});

			setTimeout(function () {
				// add clickable after the sizing has been done
				$add.plugin('Q/clickable');
			}, 0);
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
+ '<li class="Users_labels_action Users_labels_add">'
+   '<img class="Users_labels_icon" src="{{canAddIcon}}">'
+   '<div class="Users_labels_title">{{canAdd}}</div>'
+ '</li>'
+ '<ul>');

})(Q, jQuery, window);