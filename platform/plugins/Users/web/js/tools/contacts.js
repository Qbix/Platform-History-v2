(function (Q, $, window, undefined) {
	
var Users = Q.Users;

/**
 * Users Contacts
 * @module Users-contacts
 * @main
 */

/**
 * Tool for inviting users with a label selected from the list of possible labels.
 * @class Users contacts
 * @constructor
 * @param {Object} [options] options for the tool
 *   @param {String} options.communityId Id of community where to need to invite user
 *   @param {String} [options.prefix="Users/"] Pass any prefix here, to filter labels by this prefix
 *  @param {Array} [options.exclude] - exclude these labels
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

	tool.refresh();
},

{
	prefix: 'Users/',
	exclude: null,
	communityId: null,
	canGrant: true,
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
		var selectedLabel = null;

		Q.Users.getLabels(state.communityId, state.prefix, function (err, labels) {
			// exclude labels if state.exclude not empty
			Q.each(state.exclude, function (i, label) {
				delete(labels[label]);
			})

			Q.Template.render("Users/contacts", {
				labels: labels,
				canGrant: state.canGrant,
				canGrantText: tool.text.usersContacts.inviteUser,
				canGrantIcon: Q.url('{{Q}}/img/actions/add.png')
			}, function (err, html) {
				tool.element.removeClass('Q_loading');
				Q.replace(tool.element, html);
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

				$('button', tool.element).plugin("Q/clickable").on(Q.Pointer.fastclick, function () {
					if(!selectedLabel) {
						return Q.alert(tool.text.usersContacts.selectLabel);
					}

					Q.Dialogs.pop();

					Q.Streams.invite(state.communityId, 'Streams/experience/main', {
						addLabel: selectedLabel,
						followup: state.followup,
						alwaysSend: true,
						userChooser: true,
						title: tool.text.usersContacts.inviteRole.interpolate({role: labelTitle})
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

Q.Template.set('Users/contacts',
`<ul>
	{{#each labels}}
		<li class="Users_labels_label" data-label="{{this.label}}">
			<img class="Users_labels_icon" src="{{call "iconUrl" 80}}" alt="label icon">
			<div class="Users_labels_title">{{this.title}}</div>
		</li>
	{{/each}}
</ul>
{{#if canGrant}}
	<button class="Q_button">{{canGrantText}}</button>
{{/if}}`);

})(Q, Q.$, window);