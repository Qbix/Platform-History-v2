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
 *  @param {Q.Event} [options.followup=true] this option for Streams.invite
 *  @param {Q.Event} [options.onRefresh] occurs after the tool is refreshed
 *  @param {Q.Event} [options.onClick] occurs when the user clicks or taps a label. Is passed (element, label, title, wasSelected). Handlers may return false to cancel the default behavior of toggling the label.
 *  @param {Q.Event} [options.onInvited] occurs when the user invited.
 */
Q.Tool.define("Users/contacts", function Users_labels_tool(options) {
	var tool = this;
	var state = tool.state;

	if (!state.communityId) {
		throw new Q.Exception('communityId not defined');
	}

	Q.Text.get('Users/content', function (err, text) {
		tool.text = text.usersContacts;

		tool.refresh();
	});
},

{
	prefix: 'Users/',
	communityId: null,
	canAdd: true,
	followup: true,
	onRefresh: new Q.Event(),
	onClick: new Q.Event(),
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

		var selectedLabel = null;

		Q.Users.getLabels(state.communityId, state.prefix, function (err, labels) {
			Q.Template.render("Users/contacts", {
				labels: labels,
				all: all,
				canAdd: state.canAdd,
				canAddText: tool.text.inviteUser,
				canAddIcon: Q.url('{{Q}}/img/actions/add.png')
			}, function (err, html) {
				tool.element.removeClass('Q_loading');
				tool.element.innerHTML = html;
				var labelTitle = null;

				$('.Users_labels_label', tool.element).on(Q.Pointer.fastclick, function () {
					var $this = $(this);
					selectedLabel = $this.attr('data-label');
					labelTitle = $(".Users_labels_title", $this).text();

					if (false === Q.handle(state.onClick, tool, [selectedLabel, labelTitle])) {
						return;
					}

					$this.addClass('Q_selected').siblings().removeClass('Q_selected');
				});

				$('.Users_labels_add button', tool.element).on(Q.Pointer.fastclick, function () {
					if(!selectedLabel) {
						return Q.alert(tool.text.selectLabel);
					}

					Q.Dialogs.pop();

					Q.Streams.invite(state.communityId, 'Streams/experience/main', {
						addLabel: selectedLabel,
						followup: state.followup,
						alwaysSend: true,
						userChooser: true,
						title: tool.text.inviteRole.interpolate({role: labelTitle})
					}, function (err, info) {
						var msg = Q.firstErrorMessage(err);
						if (msg) {
							return alert(msg);
						}

						info.labelTitle = labelTitle;
						Q.handle(state.onInvited, tool, [selectedLabel, info]);
					});
				});

				Q.handle(state.onRefresh, tool, []);
			});
		});
	}
}

);

Q.Template.set('Users/contacts', ''
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
+ '<li class="Users_labels_action Users_labels_add Q/clickable">'
+   '<button class="Q_button">{{canAddText}}</button>'
+ '</li>'
+ '{{/if}}'
+ '<ul>');

})(Q, Q.$, window);