(function (Q, $, window, undefined) {
	
var Users = Q.Users;

Q.text.Users.labels = Q.extend({
	addToPhonebook: 'Add To My Phone Contacts',
	addLabel: 'New Relationship',
	prompt: 'Give it a name'
}, Q.text.Users.labels);

/**
 * Users Labels
 * @module Users-labels
 * @main
 */

/**
 * Tool for viewing, and possibly managing, a user's contact labels
 * @class Users labels
 * @constructor
 * @param {Object} [options] options for the tool
 *   @param {String} [options.userId=Q.Users.loggedInUserId()] You can set the user id whose labels are being edited, instead of the logged-in user
 *   @param {String|Array} [options.filter="Users/"] Pass any prefix here, to filter labels by this prefix
 *   	Alternatively pass an array of label names here, to filter by.
 *   @param {Array} [exclude] - array of labels needed to exclude from result
 *   @param {String} [options.contactUserId] Pass a user id here to var the tool add/remove contacts with the various labels, between userId and contactUserId
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
	if (Users.isCommunityId(state.userId)) {
		tool.element.addClass('Users_labels_communityRoles');
		state.addToPhonebook = false;
	}

	tool.refresh();

	var _callback = function(err, res){
		if (err) {
			return Q.alert(err);
		}
	};

	$(tool.element).on(Q.Pointer.fastclick, '.Users_labels_label', function () {
		var $this = $(this);
		var label = $this.attr('data-label');
		var wasSelected = $this.hasClass('Q_selected');
		var title = $this.text();
		if (false === Q.handle(state.onClick, tool, [this, label, title, wasSelected])) {
			return;
		}
		if (wasSelected) {
			$this.removeClass('Q_selected');
			if (state.contactUserId) {
				Users.Contact.remove(state.userId, label, state.contactUserId, _callback);
			}
		} else {
			$this.addClass('Q_selected');
			if (state.contactUserId) {
				Users.Contact.add(state.userId, label, state.contactUserId, _callback);
			}
		}
	});
},

{
	userId: null,
	filter: 'Users/',
	exclude: null,
	contactUserId: null,
	canAd: false,
	addToPhonebook: Q.info.isMobile,
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
				icon: Q.url("{{Users}}/img/icons/labels/all/200.png")
			};
		}
		var selectedLabels = [];
		tool.$('li.Q_selected').each(function () {
			selectedLabels.push($(this).attr('data-label'));
		});
		Q.Users.getLabels(state.userId, state.filter, function (err, labels) {
			// exclude labels if state.exclude not empty
			Q.each(state.exclude, function (i, label) {
				delete(labels[label]);
			})

			Q.Template.render("Users/labels", {
				labels: labels,
				all: all,
				canAdd: Q.Users.loggedInUser && state.canAdd,
				canAddIcon: Q.url('{{Q}}/img/actions/add.png'),
				phoneBookIcon: Q.url('{{Q}}/img/actions/add_to_phonebook.png'),
                addToPhonebook: state.contactUserId && state.addToPhonebook && Q.text.Users.labels.addToPhonebook
			}, function (err, html) {
				tool.element.removeClass('Q_loading');
				Q.replace(tool.element, html);
				tool.$('li').each(function () {
					if (selectedLabels.indexOf($(this).attr('data-label')) >= 0) {
						$(this).addClass('Q_selected');
					}
				});
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
			if (state.canAd) {
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
			}
			if (state.addToPhonebook) {
				var $addToPhonebook = tool.$('.Users_labels_add_phonebook')
				.on(Q.Pointer.fastclick, function () {
					location.href = Q.url("{{baseUrl}}/Users/" + state.contactUserId + ".vcf");
				});
			}

            var elems = $('.Users_labels_title');
            var length = elems.length;
			var shownHint;
            $('.Users_labels_title', $(tool.element)).each(function(i){
                if (i == length -1){
                    return;
				}
				if(i == 0) {
                    shownHint = Q.Users.hint('Communities/profile/addContact', $addToPhonebook, {
                        dontStopBeforeShown: true,
                        show: { delay: 500 }
                    });
					return;
                }
				if (!shownHint) {
					return;
				}
				var labelName = i;
				var label = this.dataset.label;
				if(label) {
					labelNameArr = label.split('/');
					if(labelNameArr.length > 1) labelName = labelNameArr[1];
				}
				Q.Visual.hint('Users/labels/' + labelName, this, {
					hotspot: {x: i % 2 ? 0 : 0.3, y: 0},
					dontStopBeforeShown: true,
					dontRemove: true,
					show: {delay: 1000 + (100 * i)},
					hide: {after: 1000},
					styles: {
						opacity: 1 - (i / length / 2)
					}
				})
            })
		});
	}
});

Q.Template.set('Users/labels', ''
+ '<ul>'
+ '{{#if addToPhonebook}}'
+ '<li class="Users_labels_action Users_labels_add_phonebook">'
+   '<img class="Users_labels_icon" src="{{phoneBookIcon}}">'
+   '<div class="Users_labels_title">{{addToPhonebook}}</div>'
+ '</li>'
+ '{{/if}}'
+ '{{#if all}}'
+ '<li class="Users_labels_label" data-label="*">'
+   '<img class="Users_labels_icon" src="{{all.icon}}" alt="all">'
+   '<div class="Users_labels_title">{{all.title}}</div>'
+ '</li>'
+ '{{/if}}'
+ '{{#each labels}}'
+ '<li class="Users_labels_label" data-label="{{this.label}}">'
+   '<img class="Users_labels_icon" src="{{call "iconUrl" 80}}" alt="label icon">'
+   '<div class="Users_labels_title">{{this.title}}</div>'
+ '</li>'
+ '{{/each}}'
+ '{{#if canAdd}}'
+ '<li class="Users_labels_action Users_labels_add">'
+   '<img class="Users_labels_icon" src="{{canAddIcon}}">'
+   '<div class="Users_labels_title">{{canAdd}}</div>'
+ '</li>'
+ '{{/if}}'
+ '</ul>');

})(Q, Q.$, window);