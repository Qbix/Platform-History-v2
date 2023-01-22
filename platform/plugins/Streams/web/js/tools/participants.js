(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Displays participants of a given stream in a horizontal list.
 * Each item in the list is presented with an avatar and also can have a contextual associated with it.
 * @class Streams participants
 * @constructor
 * @param {Object} options Provide options for this tool
 *   @param {String} options.publisherId The id of the publisher
 *   @param {String} options.streamName The name of the stream
 *   @param {Object} [options.invite] Pass an object here to pass as fields to 
 *     Streams/participants/invite template, otherwise the invite button doesn't appear.
 *   @param {Boolean} [options.showSummary] Whether to show a summary
 *   @param {Array} [options.ordering] Array of user id's to order avatars in participants list.
 *   Only users mentioned in this array will ordered. Other users order none change.
 *   @param {Boolean} [options.showBlanks] Whether to show blank avatars in place of remaining spots
 *   @param {Number} [options.max]
 *    The number, if any, to show in the denominator of the summary
 *   @param {Number} [options.maxShow=10]
 *    The maximum number of participants to fetch for display
 *   @param {Function} [options.filter]
 *    Takes (userId, element) and can modify them.
 *    If this function returns false, the element is not appended.
 *   @param {Function} [options.hideIfNoParticipants=false] If true hide tool element when no participants and show when somebody join
 *   @param {Q.Event} [options.onRefresh] An event that occurs when the tool is refreshed
 */
Q.Tool.define("Streams/participants",

function _Streams_participants(options) {
	
	var tool = this;
	var state = tool.state;
	var $toolElement = $(tool.element);
	tool.$elements = {};

	if (!state.publisherId) {
		throw new Q.Error("Streams/chat: missing publisherId option");
	}
	if (!state.streamName) {
		throw new Q.Error("Streams/chat: missing streamName option");
	}
	
	tool.Q.onStateChanged('count').set(function (name) {
		var c = state.count || 0;
		tool.$count.text(c >= 100 ? '99+' : c.toString());
		if (state.showSummary) {
			tool.$summary.show().plugin('Q/textfill', 'refresh');
		} else {
			tool.$summary.hide();
		}

		if (state.hideIfNoParticipants) {
			if (c <= 0) {
				tool.cssDisplay = $toolElement.css("display");
				$toolElement.css("display", "none");
			} else {
				$toolElement.css("display", tool.cssDisplay && tool.cssDisplay!=="none" ? tool.cssDisplay : "block");
			}
		}
	}, tool);

	tool.Q.onStateChanged('ordering').set(this.orderAvatars.bind(this));

	tool.element.forEachTool('Users/avatar', function () {
		tool.$elements[this.state.userId] = $(this.element);
	});

	// refresh tool in stream refresh
	Q.Streams.Stream.onRefresh(state.publisherId, state.streamName).set(tool.refresh.bind(tool), tool);

	tool.refresh();
},

{
	publisherId: null,
	streamName: null,
	invite: {
		userChooser: true,
		appUrl: function () {
			return location.href;
		}
	},
	ordering: [],
	hideIfNoParticipants: false,
	maxShow: 10,
	maxLoad: 100,
	max: null,
	filter: function () { },
	avatar: {
		"short": true,
		icon: (window.devicePixelRatio > 1 ? '80' : '40'),
		reflectChanges: false
	},
	showSummary: true,
	showControls: false,
	showBlanks: false,
	onRefresh: new Q.Event(),
	onInvited: new Q.Event(function (err, data) {
		var msg = Q.firstErrorMessage(err, data);
		if (msg) {
			if (msg.includes("not logged")) {
				Q.Users.login();
			}
		}
	}),
	templates: {
		invite: {
			name: 'Streams/participants/invite',
			fields: { 
				src: Q.Streams.iconUrl('labels/Streams/invited', 40), 
				alt: 'Invite',
				title: 'Invite'
			}
		}
	}
},

{
	Q: {
		beforeRemove: function () {

		}
	},
	/**
	 * Refresh the participants tool
	 * @method refresh
	 * @param {Function} callback pass a callback to be called after the refresh is done
	 */
	refresh: function (callback) {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);

		if (state.rendered) {
			tool.$count = $('.Streams_participants_count', $te);
			tool.$max = $('.Streams_participants_max', $te);
			tool.$summary = $('.Streams_participants_summary', $te);
			tool.$controls = $('.Streams_participants_controls', $te);
			tool.$pei = $('.Streams_participants_expand_img', $te);
			tool.$pet = $('.Streams_participants_expand_text', $te);
			tool.$pc = $('.Streams_participants_container', $te);
			tool.$avatars = $('.Streams_participants_avatars', $te);
			tool.$blanks = $('.Streams_participants_blanks', $te);
			_continue();
			return false;
		}
		
		tool.$count = $("<span class='Streams_participants_count'></span>");
		tool.$max = $("<span class='Streams_participants_max'></span>");
		tool.$pet = $("<span class='Streams_participants_expand_text'>See All</span>");
		tool.$pei = $('<img class="Streams_participants_expand_img" />').attr({
			src: Q.url('{{Q}}/img/expand.png'),
			alt: "expand"
		});
		tool.$controls = $("<div class='Streams_participants_controls' />")
			.append(
				$("<div class='Streams_participants_expand' />")
				.append(tool.$pei, tool.$pet)
			).appendTo($te);
		tool.$summary = $("<div class='Streams_participants_summary' />")
			.append($('<span />').append(tool.$count, tool.$max))
			.appendTo($te);
		tool.$pc = $("<div class='Streams_participants_container' />")
			.appendTo($te);
		tool.$avatars = $("<span class='Streams_participants_avatars' />")
			.appendTo(tool.$pc);
		tool.$blanks = $("<span class='Streams_participants_blanks' />")
			.appendTo(tool.$pc);

		// set expand icon click event
		tool.$pei.plugin('Q/clickable').on(Q.Pointer.fastclick, function () {
			if (state.expanded) {
				tool.$blanks.show();
				$te.animate({height: state.originalHeight}, function () {
					state.expanded = false;
				});
				tool.$pei.attr({
					src: Q.url('{{Q}}/img/expand.png'),
					alt: 'expand'
				});
				tool.$pet.html('See All');
			} else {
				state.originalHeight = $te.height();
				tool.$blanks.hide();
				$te.animate({height: tool.$pc.height()}, function () {
					state.expanded = true;
				});
				tool.$pei.attr({
					src: Q.url('{{Q}}/img/collapse.png'),
					alt: 'collapse'
				});
				tool.$pet.html('Fewer');
			}
		});

		$te.addClass('Streams_participants_loading');
		Q.Streams.get(state.publisherId, state.streamName, function (err, stream, extra) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Streams/participants: " + fem);
			}
			if (!$(tool.element).closest('body').length) {
				return;
			}
			tool.stream = this;
			Q.Streams.Stream.onRefresh(state.publisherId, state.streamName)
			.set(tool.refresh.bind(tool), tool);
			var i = 0, c = 0;
			$te.removeClass('Streams_participants_loading');
			Q.Tool.clear(tool.$avatars[0]);
			Q.Tool.clear(tool.$blanks[0]);
			tool.$avatars.empty();
			tool.$blanks.empty();
			Q.each(extra && extra.participants, function (userId, participant) {
				if (participant.state !== 'participating') {
					return;
				}
				++c;
				if (!state.maxShow || ++i <= state.maxShow) {
					tool.addAvatar(userId);
				}
			}, { sort: 'insertedTime', ascending: false });
			state.count = c;
			if (state.showBlanks) {
				Q.each(c, state.maxShow-1, 1, function () {
					tool.addAvatar('');
				});
			}
			_continue();

		}, {participants: state.maxLoad});

		function _continue() {
			tool.stateChanged('count');

			if (state.max) {
				tool.$max.text('/' + state.max);
			}
			
			Q.Streams.retainWith(tool).get(state.publisherId, state.streamName, function () {
				var stream = this;
				stream.onMessage("Streams/joined")
				.set(function (stream, message, messages) {
					if (tool.avatarExists(message.byUserId)) {
						return;
					}

					tool.addAvatar(message.byUserId, true);
					++tool.state.count;
					tool.stateChanged('count');
				}, tool);
				stream.onMessage("Streams/left")
				.set(function (stream, message, messages) {
					if (!tool.avatarExists(message.byUserId)) {
						return;
					}

					tool.removeAvatar(message.byUserId);
					--tool.state.count;
					tool.stateChanged('count');
				}, tool);
				var si = state.invite;
				if (!si || !stream.testAdminLevel('invite')) {
					Q.handle(callback, tool, []);
					return Q.handle(state.onRefresh, tool, []);
				}
				if (tool.$('.Streams_inviteTrigger').length) {
					return; // the invite button already rendered
				}
				Q.Text.get("Streams/content", function (err, result) {
					var text = result && result.invite;
					if (result && result.invite[state.templates.invite.fields.alt]) {
						state.templates.invite.fields.alt = text[state.templates.invite.fields.alt];
					} else {
                        state.templates.invite.fields.alt = text.command;
					}
					if (result && result.invite[state.templates.invite.fields.title]) {
						state.templates.invite.fields.title = text[state.templates.invite.fields.title];
					} else {
                        state.templates.invite.fields.title = text.command;
					}

					Q.Template.render(
						'Streams/participants/invite',
						state.templates.invite.fields,
						function (err, html) {
							if (err) return;
							var $element = tool.$invite = $(html).insertBefore(tool.$avatars);
							var filter = '.Streams_inviteTrigger';
							$(tool.element).on(Q.Pointer.fastclick, filter, function () {
								var options = Q.extend({
									identifier: si.identifier
								}, si);
								Q.Streams.invite(
									state.publisherId, 
									state.streamName, 
									options,
									function (err, data) {
										state.onInvited.handle.call(tool, err, data);
									}
								);
								return false;
							}).on(Q.Pointer.click, filter, function () {
								return false;
							}).on(Q.Pointer.start.eventName, filter, function () {
								$(tool.element).addClass('Q_discouragePointerEvents');
								function _pointerEndHandler() {
									$(tool.element).removeClass('Q_discouragePointerEvents');
									$(window).off(Q.Pointer.end, _pointerEndHandler);
								}
								$(window).on(Q.Pointer.end, _pointerEndHandler);
							});

							if (si.clickable) {
								$('img', $element).plugin(
									'Q/clickable', Q.extend({
										triggers: $element
									}, si.clickable)
								);
							}
							Q.handle(callback, tool, []);
							Q.handle(state.onRefresh, tool, []);
						},
						state.templates.invite
					);
				});
			});
		}

		// adjust Streams_participants_container on tool width changed
		Q.onLayout(tool.$pc[0]).set(function () {
			if (state.showControls) {
				var $pcw = tool.$pc.innerWidth();
				var avatarsWidth = 0;
				$(".Streams_participants_invite", tool.$pc).add(".Users_avatar_tool", tool.$avatars).each(function () {
					avatarsWidth += $(this).outerWidth(true);
				});
				var overflowed = ($pcw > 0 && avatarsWidth > $pcw);
				if (overflowed) {
					if (!state.overflowed) {
						$te.addClass('Q_overflowed');
					}
				} else {
					$te.removeClass('Q_overflowed');
					tool.$blanks.show();
				}
				state.overflowed = overflowed;
			}
		}, tool);

		state.rendered = true;
	},
	/**
	 * Check if avatar exists
	 * @method avatarExists
	 * @param {string} userId
	 */
	avatarExists: function (userId) {
		return this.$elements[userId];
	},
	/**
	 * Add avatar to participants list
	 * @method addAvatar
	 * @param {string} userId
	 * @param {boolean} prepend - if true, prepend avatar, otherwise append
	 */
	addAvatar: function (userId, prepend) {
		var tool = this;
		var state = this.state;
		var $e = userId ? tool.$avatars : tool.$blanks;
		if (userId && tool.avatarExists(userId)) {
			return;
		}

		var $element = $(Q.Tool.setUpElement(
			'div',
			'Users/avatar',
			Q.extend({}, state.avatar, {
				userId: userId,
			}),
			userId || null,
			tool.prefix)
		);
		if (false === Q.handle(state.filter, tool, [userId, $element[0]])) {
			return;
		}

		$element[prepend ? 'prependTo' : 'appendTo']($e).activate(function () {
			tool.orderAvatars();
			Q.layout(tool.$pc[0], true);
		});
	},
	/**
	 * Remove avatar from participants list
	 * @method removeAvatar
	 * @param {string} userId
	 */
	removeAvatar: function (userId) {
		var tool = this;
		var $element = tool.$elements[userId];
		if ($element) {
			Q.removeElement($element[0], true);
			delete tool.$elements[userId];
			Q.layout(tool.$pc[0], true);
		}
	},
	/**
	 * Reorder avatars according to state.orders array
	 * @method orderAvatars
	 */
	orderAvatars: function () {
		var tool = this;
		var state = this.state;
		var $avatars = $(".Users_avatar_tool", tool.$avatars);

		// if state.ordering array empty, this method have no sense
		if (Q.isEmpty(state.ordering)) {
			return;
		}

		$avatars.each(function () {
			var avatarTool = Q.Tool.from(this, "Users/avatar");
			if (!avatarTool) {
				return;
			}

			var userId = avatarTool.state.userId;
			var $element = $(this);

			if (state.ordering.includes(userId)) {
				var elementInsertAfter = null;
				var $avatars = $(".Users_avatar_tool", tool.$avatars);

				for (var i = 0; i < state.ordering.length; i++) {
					if (state.ordering[i] === userId) {
						elementInsertAfter ? $element.insertAfter(elementInsertAfter) : $element.prependTo(tool.$avatars);
						break;
					}

					$avatars.each(function () {
						if (Q.getObject("state.userId", Q.Tool.from(this, "Users/avatar")) === state.ordering[i]) {
							elementInsertAfter = this;
						}
					});
				}

				$element.addClass("Streams_participants_ordered");
			} else {
				var $lastOrdered = $(".Streams_participants_ordered", tool.$avatars).last();
				if ($lastOrdered.length) {
					$element.insertAfter($lastOrdered);
				} else {
					$element.prependTo(tool.$avatars);
				}
			}
		});
	}
});

Q.Template.set('Streams/participants/invite',
	'<div class="Streams_participants_invite Streams_inviteTrigger">' +
	'	<img src="{{& src}}" alt="{{alt}}">' +
	'	<div class="Streams_invite_label">{{& title}}</div>' +
	'</div>'
);

})(Q, jQuery);