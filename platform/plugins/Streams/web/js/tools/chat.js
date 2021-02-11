(function (Q, $) {

	var WebRTC = Q.Streams.WebRTC;

	/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Chatroom for people chat in a stream that allows posting messages with type "Streams/chat/message"
 * @class Streams chat
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.publisherId] Required if stream option is empty. The publisher's user id.
 *   @param {String} [options.streamName] Required if stream option is empty. The stream's name.
 *   @param {Stream} [options.stream] Optionally pass a Streams.Stream object here if you have it already
 *   @param {Stream} [options.stream] Optionally pass a Streams.Stream object here if you have it already
 *   @param {Stream} [options.inputType="text"] Can be either "text" or "textarea"
 *   @param {String} [options.messagesToLoad] The number of "Streams/chat" messages to load at a time.
 *   @param {String} [options.messageMaxHeight] The maximum height, in pixels, of a rendered message
 *   @param {Stream} [options.seen] Whether the tool should mark rendered chat messages as seen
 *   @param {String} [options.animations] Options for animations, which can include:
 *   @param {String} [options.animations.duration=300] The duration of the animation
 *   @param {Object} [options.controls={}] Controls to show next to each chat message
 *   @param {Boolean|Array} [options.controls.up] Can be true or an array of [off, on] image urls.
 *   @param {Boolean|Array} [options.controls.down] Can be true or an array of [off, on] image urls.
 *   @param {Boolean|Array} [options.controls.flag] Can be true or an array of [off, on] image urls.
 *   @param {Object} [options.loadMore] May be "scroll", "click" or null/false. Defaults to "click".
 *     <ul>
 *         <li>"click" will show label with "Click to see earlier messages" (configurable in Q.text.Streams.chat.loadMore.click string), and when the user clicks it, new messages will be loaded.</li>
 *         <li>"scroll" means new messages will be loaded when the scrollbar of the chat container reaches the top (for desktop) or whole document scrollbar reaches the top (android). On all other browsers it would use pull-to-refresh ... meaning, it will show "Pull to see earlier messages" (html configurable in Q.text.Streams.chat.loadMore.pull string) and as you pull "too far" you trigger the load. As for the indicator of "pulling too far", we will worry about that later, for now skip it. But remember to discuss it with me afterwards.</li>
 *         <li>null/false/etc. - no interface to load earlier messages</li>
 *     </ul>
 *   @param {Object} [options.startWebRTC=false] If true, start webrtc once tool activated. Also if startWebRTC exist somewhere in GET params.
 *   @param {Object} [options.preprocess=[]] Array of functions which call one by one before message post.
 *   Each function will get callback as argument. Need to call this callback when ready to go further.
 *   @param {Array} [option.excludedRelatedStreams] Array with types of related streams excluded from display as chat message.
 *   @param {Q.Event} [options.onRefresh] Event for when an the chat has been updated
 *   @param {Q.Event} [options.onRender] Event when tool element rendered
 *   @param {Q.Event} [options.onError] Event for when an error occurs, and the error is passed
 *   @param {Q.Event} [options.onClose] Event for when chat stream closed
 *   @param {Q.Event} [options.onMessageRender] Event for when message rendered
 *   @param {Q.Event} [options.onContextualCreated] Event for when contextual menu for addons rendered
 *   @param {Q.Event} [options.beforePost] Execute before message post (before calling Q.Message.post). Pass fields as argument.
 */
Q.Tool.define('Streams/chat', function(options) {		
	var tool = this;
	var state = tool.state;
	state.more = {};
	switch (state.loadMore) {
		case 'click': state.more.isClick = true; break;
		case 'scroll': state.more.isScroll = true; break;
		default: break;
	}
	if (state.stream) {
		state.publisherId = state.stream.fields.publisherId;
		state.streamName = state.stream.fields.name;
	}
	if (!state.publisherId) {
		throw new Q.Error("Streams/chat: missing publisherId option");
	}
	if (!state.streamName) {
		throw new Q.Error("Streams/chat: missing streamName option");
	}
	if (!Q.isEmpty(state.vote)) {
		$(this).addClass('Streams_chat_with_vote');
		for (var k in state.vote) {
			state.vote[k].src = Q.url(state.vote[k].src);
			state.vote[k].activeSrc = Q.url(state.vote[k].activeSrc);
		}
	}

	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			console.warn(msg);
		}

		tool.text = text.chat;

		tool.refresh(function () {
			if (state.scrollToBottom) {
				tool.scrollToBottom();
			}
		});
		Q.Streams.refresh.beforeRequest.add(function () {
			if (state.stream && state.stream.refrresh) {
				state.stream.refresh(null, {messages: true});
			}
		}, tool);
	});

	// close chat button handler
	$(tool.element).on(Q.Pointer.fastclick, "button[name=close]", function (event) {
		event.stopPropagation();
		event.preventDefault();

		var button = $(this);
		var stream = state.stream;

		Q.confirm(tool.text.closeChatConfirm, function (res) {
			if (!res) return;


			button.addClass("Q_working");
			Q.Streams.Stream.close(stream.fields.publisherId, stream.fields.name, function(err, response){
				var msg = Q.firstErrorMessage(err);
				button.removeClass("Q_working");
				if (msg) {
					return Q.alert(msg);
				}

				Q.handle(state.onClose, tool, [stream]);
			});
		}, {
			ok: tool.text.closeChatConfirmYes,
			cancel: tool.text.closeChatConfirmNo,
			title: tool.text.closeChatConfirmTitle
		});

		return false;
	});

	Q.addStylesheet('{{Streams}}/css/tools/chat.css');
},

{
	messageMaxHeight: '200px',
	messagesToLoad: 10,
	loadMore: 'click',
	animations: {
		duration: 300
	},
	vote: {
		up: {
			src: '{{Streams}}/img/chat/vote-up.png',
			activeSrc: '{{Streams}}/img/chat/vote-up-active.png'
		},
		down: {
			src: '{{Streams}}/img/chat/vote-down.png',
			activeSrc: '{{Streams}}/img/chat/vote-down-active.png'
		},
		flag: {
			src: '{{Streams}}/img/chat/vote-flag.png',
			activeSrc: '{{Streams}}/img/chat/vote-flag-active.png'
		}
	},
	excludedRelatedStreams: ["Streams/question"],
	seen: true,
	scrollToBottom: true,
	overflowed: {
		srcToMe: '{{Streams}}/img/chat/message-overflowed-to-me.png',
		srcFromMe: '{{Streams}}/img/chat/message-overflowed-from-me.png',
		title: 'Message from {{displayName}}'
	},
	closeable: false,
	startWebRTC: false,
	onRefresh: new Q.Event(),
	onClose: new Q.Event(function () {
		// remove tool when chat stream closed
		this.remove();
	}),
	onRender: new Q.Event(),
	onMessageRender: new Q.Event(),
	onContextualCreated: new Q.Event(),
	beforePost: new Q.Event(),
	preprocess: [],
	templates: {
		main: {
			dir: '{{Streams}}/views',
			name: 'Streams/chat/main',
			fields: {
				placeholder: "Add a comment"
			}
		},
		Streams_chat_noMessages: {
			dir: '{{Streams}}/views',
			name: 'Streams/chat/Streams_chat_noMessages',
			fields: { }
		},
		message: {
			item: {
				dir: '{{Streams}}/views',
				name: 'Streams/chat/message/bubble',
				fields: { }
			},
			notification: {
				dir: '{{Streams}}/views',
				name: 'Streams/chat/message/notification',
				fields: { }
			},
			error: {
				dir: '{{Streams}}/views',
				name: 'Streams/chat/message/error',
				fields: { }
			}
		}
	}
}, 

{
	Q: {
		onRetain: function () {
			var $last = this.$('.Streams_chat_bubble').last();
			var selector = '.Streams_chat_item';
			var $nextAll = $last.length
				? $last.nextAll(selector)
				: this.$(selector);
			this.refresh(function () {
				this.$('.Streams_chat_messages')
					.append($nextAll)
					.scrollTop(this.state.lastScrollTop);
			});
		},
		beforeRemove: function () {
			if (this.addonsContextual) {
				this.addonsContextual.plugin("Q/contextual").remove();
			}
		}
	},
	/**
	 * Call this method to set whether the tool will mark rendered Streams/chat/message
	 * messages as seen.
	 * @method seen
	 * @param {Boolean} value
	 *  Pass true to enable the tool to mark rendered messages as seen.
	 *  Pass false to pause the tool from marking rendered messages as seen.
	 *  Or pass nothing to get the current value.
	 * @return {Boolean} The new value
	 */
	seen: function (value) {
		var state = this.state;
		state.seen = value;
		if (value) {
			Q.Streams.Message.Total.seen(
				state.publisherId, 
				state.streamName, 
				'Streams/chat/message',
				true
			);
		}
		return state.seen;
	},
	/**
	 * Disables the textarea, preventing the user from writing
	 * a message using the provided interface. They are still able to POST
	 * to the server, however, e.g. manually.
	 * @method prevent
	 * @param {String|false} message
	 *  The text to display in the placeholder of the textarea while input is prevented.
	 *  Pass false here to re-enable the textarea.
	 * @return {HTMLElement} the div that replaces the textarea
	 */
	prevent: function (message, callback) {
		var tool = this;
		var state = tool.state;
		var $ie = state.$inputElement;
		var $prevent = state.$prevent;
		if (state.prevented && message === false) {
			$ie.attr('placeholder', state.lastPlaceholder)
			.removeAttr('disabled')
			.css('cursor', 'text')
			.trigger('Q_refresh');
		} else if (!state.prevented && message !== false) {
			state.lastPlaceholder = $ie.attr('placeholder')
				|| $ie.data('Q-placeholder').text();
			$ie.val('')
			.attr('placeholder', message)
			.trigger('Q_refresh')
			.attr('disabled', 'disabled')
			.css('cursor', 'not-allowed');
		}
		state.prevented = !!message;
	},
	prepareMessages: function(messages, action){
		var res  = {};
		var tool = this;
		var state = tool.state;
		
		if ('content' in messages) {
			// this is a single message
			var m = messages;
			messages = {};
			messages[m.ordinal] = m;
		}

		for (var ordinal in messages) {
			var message = messages[ordinal];
			var r = res[ordinal] = Q.extend({
				time       : Date.fromDateTime(message.sentTime).getTime() / 1000,
				classes    : (message.byUserId === Q.Users.loggedInUserId())
								? ' Streams_chat_from_me'
								: ' Streams_chat_to_me'
			}, message);
			r[action] = true;
		}

		return res;
	},

	render: function(callback){
		var tool = this;
		var $te = $(tool.element);
		var state = tool.state;
		var isPublisher = Q.Users.loggedInUserId() === Q.getObject("stream.fields.publisherId", state);

		var subscribed = ('yes' === Q.getObject('stream.participant.subscribed', state));
		var what = subscribed ? 'on' : 'off';
		var touchlabel = subscribed ? tool.text.Subscribed : tool.text.Unsubscribed;
		var fields = Q.extend({}, state.more, state.templates.main.fields);
		fields.textarea = (state.inputType === 'textarea');
		fields.text = tool.text;
		fields.closeable = state.closeable && isPublisher;
		fields.earlierSrc = Q.url('{{Streams}}/img/chat/earlier.png');
		fields.subscriptionSrc = Q.url('{{Communities}}/img/subscription/'+what+'/80.png');
		Q.Template.render(
			'Streams/chat/main',
			fields,
			function(error, html){
				if (error) { return error; }
				$te.html(html, true).activate(function () {
					Q.handle(state.onRender, tool);
				});

				Q.addScript("{{Q}}/js/contextual.js", function () {
					$te.find(".Streams_chat_addons").plugin('Q/contextual', {
						className: "Streams_chat_addons",
						onConstruct: function (contextual, cid) {
							tool.addonsContextual = this;
							Q.handle(state.onContextualCreated, tool, [contextual]);
						}
					});

					tool.addMenuItem({
						title: touchlabel,
						className: "Streams_chat_subscription",
						attributes: {
							"data-subscribed": subscribed,
							"data-hide": false
						},
						handler: function ($this) {
							var status = $this.attr('data-subscribed');
							var callback = function (err, participant) {
								if (err) {
									return console.warn(err);
								}

								$(".Streams_chat_addon_title", $this).html(participant.subscribed === 'yes' ? tool.text.Subscribed : tool.text.Unsubscribed);
								$this.attr({'data-subscribed': participant.subscribed === 'yes'});
							};

							$this.attr('data-subscribed', 'loading');

							if (status === 'true') {
								state.stream.unsubscribe(callback);
							} else {
								state.stream.subscribe(callback);
							}

							return false;
						}
					});
				});

				$te.find('.Streams_chat_call').attr('data-touchlabel', tool.text.RealTimeCall);

				if (Q.Users.loggedInUser
				&& !state.stream.testWriteLevel('post')) {
					tool.$('.Streams_chat_composer').hide();
				}
				
				tool.$('.Streams_chat_composer').submit(function () {
					return false;
				});

				state.$inputElement = tool.$('.Streams_chat_composer :input').eq(0);
				callback && callback();
			},
			state.templates.main
		);
	},
	/**
	 * Add element to addons contextual menu
	 * @method addMenuItem
	 * @param {object} params
	 * @param {string} params.title Element text
	 * @param {string} [params.icon] Element icon url
	 * @param {string} [params.className] Element class
	 * @param {object} [params.attributes] Element attributes
	 * @param {function} [params.handler] click event handler
	 * @return {jQuery} Result element
	 */
	addMenuItem: function (params) {
		var $element = $("<li class='Streams_chat_addon'></li>");

		$("<div class='Streams_chat_addon_icon'><img src='" + Q.url(params.icon) + "' /></div>").appendTo($element);

		$("<span class='Streams_chat_addon_title'>" + params.title + "</span>").appendTo($element);

		if (params.className) {
			$element.addClass(params.className);
		}

		if (Q.typeOf(params.attributes) === "object") {
			$element.attr(params.attributes);
		}

		if (Q.typeOf(params.handler) === "function") {
			$element.data("handler", params.handler);
		}

		this.state.onContextualCreated.add(function (contextual) {
			$("ul.Q_listing", contextual).append($element);
		});

		return $element;
	},
	renderMessages: function(messages, callback){
		var tool = this;
		var state = this.state;

		if (Q.isEmpty(messages)) {
			return Q.Template.render(
				'Streams/chat/Streams_chat_noMessages',
				{
					text: tool.text
				},
				function(error, html){
					if (error) { return error; }
					tool.$('.Streams_chat_messages').html(html, true);
				},
				state.templates.Streams_chat_noMessages
			);
		}
		
		function _processMessage(ordinal, fields) {
			// TODO: in the future, render stream players inside message template
			// according to the instructions in the message
			var byMe = (fields.byUserId === Q.Users.loggedInUserId());
			if (!byMe) {
				fields = Q.extend({}, fields, { vote: state.vote });
			}

			Q.Template.render('Streams/chat/message/bubble', fields, function (err, html) {
				// generate special message for related streams
				if (fields.type === "Streams/relatedTo") {
					var $preview = tool.renderRelatedStream(fields);
					if (!$preview) {
						return p.fill(ordinal)(null, null);
					}

					var $html = $(html);
					$html.addClass("Streams_chat_message_skipOverflowed");
					$(".Streams_chat_message_content", $html).html($preview, true);
					Q.handle(state.onMessageRender, tool, [fields, $html]);
					p.fill(ordinal)(null, $html);
				} else {
					Q.handle(state.onMessageRender, tool, [fields, html]);
					p.fill(ordinal)(err, fields.html || html);
				}
			});
			ordinals.push(ordinal);
		}
		var p = new Q.Pipe();
		var ordinals = [];
		Q.each(messages, _processMessage, {ascending: true, numeric: true});
		p.add(ordinals, 1, function (params) {
			var items = {};
			for (var ordinal in params) {
				var $element = params[ordinal][1];

				if (Q.isEmpty($element)) {
					continue;
				}

				if (!($element instanceof jQuery)) {
					$element = $($element);
				}
				$('.Streams_chat_avatar_icon', $element).each(function () {
					Q.Tool.setUpElement(this, 'Users/avatar', {
						userId: $(this).attr('data-byUserId'),
						icon: true,
						contents: false
					}, null, tool.prefix);
				});
				$('.Streams_chat_avatar_name', $element).each(function () {
					Q.Tool.setUpElement(this, 'Users/avatar', {
						userId: $(this).attr('data-byUserId'),
						icon: false,
						short: true
					}, null, tool.prefix);
				});
				$('.Streams_chat_timestamp', $element).each(function () {
					Q.Tool.setUpElement(this, 'Q/timestamp', {
						time: $(this).attr('data-time')
					}, null, tool.prefix);
				});
				$element.find('.Streams_chat_vote')
				.plugin('Q/clickable')
				.on(Q.Pointer.click, function () {
					var $this = $(this);
					var thisType = $this.attr('data-vote');
					$this.closest('.Streams_chat_item')
					.find('.Streams_chat_vote')
					.each(function () {
						var $this = $(this);
						var type = $this.attr('data-vote');
						var src = $this.attr('src');
						src = (type === thisType && src === state.vote[type].src)
							? state.vote[type].activeSrc
							: state.vote[type].src;
						$this.attr('src', src);
						if (type === 'flag' && src === state.vote[type].activeSrc) {
							Q.alert(tool.text.flaggedForAdminReview);
							var fields = {type: type};
							Q.req('Streams/chatVote', function () {
								// Vote up/down/flag has been submitted
							}, { fields: fields, method: 'post' });
						}
					});
				});

				// set handler for each tool activated in chat message
				$element[0].forEachTool(function () {
					var state = this.state;
					var $toolElement = $(this.element);

					if (!(state.publisherId && state.streamName)) {
						return;
					}

					Q.Streams.get(state.publisherId, state.streamName, function (err) {
						if (err) {
							return console.warn(err);
						}

						var stream = this;

						var streamType = stream.fields.type;

						if (streamType === 'Streams/webrtc') {
							// Streams/webrtc/preview tool handle click event itself
							return;
						}

						$toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
							// possible tool names like ["Streams/audio", "Q/audio", "Streams/audio/preview"]
							var possibleToolNames = [streamType, streamType.replace(/(.*)\//, "Q/"), streamType + '/preview'];
							var toolName = null;
							for (var i=0, l=possibleToolNames.length; i<l; ++i) {
								if (Q.Tool.defined(possibleToolNames[i])) {
									toolName = possibleToolNames[i];
									break;
								}
							}

							var element = "div";
							// if tool is preview, apply Streams/preview tool first, because it may be required
							if (toolName && toolName.endsWith("/preview")) {
								element = Q.Tool.setUpElement(element, "Streams/preview", state);
							}

							var fields = Q.extend({}, stream.getAllAttributes(), {
								publisherId: stream.fields.publisherId,
								streamName: stream.fields.name,
								autoplay: true,
								url: stream.fileUrl() || stream.iconUrl('200')
							});

							element = Q.Tool.setUpElement(element, toolName, fields);
							Q.invoke({
								title: stream.fields.title,
								content: element,
								trigger: $toolElement[0]
							});
						});
					});
				}, tool);

				items[ordinal] = $element;
			}
			callback(items, messages);
		}).run();
		
		if (state.seen) {
			Q.Streams.Message.Total.seen(
				state.publisherId, 
				state.streamName, 
				'Streams/chat/message',
				true
			);
		}
	},

	renderNotification: function(message){
		var tool = this;
		var state = tool.state;
		Q.Streams.Avatar.get(message.byUserId, function (err, avatar) {
			message.displayName = avatar.displayName();
			message.time = Date.now() / 1000;

			Q.Template.render(
				'Streams/chat/message/notification', 
				message, 
				function(error, html){
					if (error) { return error }
					
					tool.$('.Streams_chat_noMessages').remove();
					tool.$('.Streams_chat_messages').append(html);
				},
				state.templates.message.notification
			);
		});
	},

	renderError: function(msg, err, data){
		var tool = this;
		var state = tool.state;

		if (!msg) return;
		var fields = {
			errorText: msg,
			time: Date.now() / 1000
		};

		Q.Template.render(
			'Streams/chat/message/error', 
			fields, 
			function(error, html){
				if (error) { return error; }
    	
				tool.$('.Streams_chat_noMessages').remove();
				tool.$('.Streams_chat_messages').append(html);
    	
				tool.findMessage('last')
					.find('.Streams_chat_timestamp')
					.html(Q.Tool.setUpElement('div', 'Q/timestamp', data.date), true)
					.activate();
			},
			state.templates.message.error
		);
	},

	more: function(callback){
		var tool = this;
		var state = tool.state;
		var params = {
			max  : state.earliest ? state.earliest - 1 : state.stream.fields.messageCount,
			limit: state.messagesToLoad,
			type: ["Streams/chat/message", "Streams/relatedTo"],
			withMessageTotals: ["Streams/chat/message", "Streams/relatedTo"]
		};
		if (params.max - params.limit <= 0) {
			$(tool.element).addClass('Streams_chat_reachedEarliest');
		}

		Q.Streams.Message.get(state.publisherId, state.streamName, params,
		function(err, messages){
			if (err) {
				return Q.handle(state.onError, this, [err]);
			}

			Q.each(messages, function (ordinal) {
				state.earliest = ordinal;
				return false;
			}, {ascending: true, numeric: true});
			callback.call(tool, messages);
		});
	},
	/**
	 * get more messages
	*/
	renderMore: function (messages) {
		var tool = this;
		var results = tool.prepareMessages(messages);
		var $more = tool.$('.Streams_chat_more');
		if (Q.isEmpty(results)) {
			return $more.hide();
		};
		var $scm = tool.$('.Streams_chat_messages');
		tool.renderMessages(results, function (items) {
			tool.$('.Streams_chat_noMessages').remove();
			var least = 1000;
			var totalHeight = 0;
			Q.each(items, function (ordinal, $element) {
				$element.prependTo($scm).activate();
				least = ordinal;
				totalHeight += ($element.outerHeight(true) + $element.outerHeight())/2;
			}, {ascending: false});
			$more.prependTo($scm);
			$scm.scrollTop(totalHeight);
			if (least <= 1) {
				return $more.hide();
			}
			tool.processDOM();
		});
	},
	/**
	 * @method startWebRTC
	 * Trying to connect user to video/audio conversation related to current chat stream.
	 * If WebRTC stream doesn't exist, try to create one.
	 */
	startWebRTC: function () {
		console.log('startWebRTC');

		var tool = this;
		var state = this.state;
		var $toolElement = $(this.element);

		if (state.webrtc) {
			console.log('startWebRTC state.webrtc');
			return;
		}

		$toolElement.attr('data-webrtc', 'loading');

		Q.Streams.WebRTC.start({
			publisherId: state.publisherId,
			streamName: state.streamName,
			tool: tool,
			onWebrtcControlsCreated: function () {
				$toolElement.attr('data-webrtc', true);
			},
			onStart: function () {
				state.webrtc = this;
			},
			onEnd: function () {
				state.webrtc = null;
				$toolElement.attr('data-webrtc', false);
			}
		});
	},
	/**
	 * Render single message
	 * @method renderMessage
	 * @param message
	 */
	renderMessage: function(message) {
		var tool = this;
		tool.renderMessages(tool.prepareMessages(message), function (items) {
			tool.$('.Streams_chat_noMessages').remove();
			var $scm = tool.$('.Streams_chat_messages');
			Q.each(items, function (key, $html) {
				$html.appendTo($scm).activate();
			}, {ascending: true});
			tool.processDOM();
		});
		// TODO: don't scroll to bottom, show "V 10 new messages" button
		// on the bottom left of Streams/chat, and then jump to bottom and refresh
		tool.scrollToBottom();
	},
	addEvents: function(){
		var tool    = this,
			state   = this.state,
			blocked = false,
			$te = $(this.element);

		if (state.more.isClick) {
			tool.$('.Streams_chat_more').click(function(){
				tool.more(tool.renderMore);
			});
		} else {
			this.niceScroll(function(){
				tool.more(tool.renderMore);
			});
		}

		$te.on(Q.Pointer.click, '.Streams_chat_message',
		function(e) {
			var $element = $(this);
			if (!$element.is('.Streams_chat_message')) {
				$element = $element.parents('.Streams_chat_message');
			}
			if ($element.closest(".Streams_chat_message_skipOverflowed").length || !$element[0].isOverflowed()) {
				return;
			}

			var $container = $element.parents('.Streams_chat_item');
			var displayName   = $('.Users_avatar_name', $container).text();

			if ($container.data('byuserid') === Q.Users.loggedInUserId()) {
				displayName = 'me';
			}

			Q.Dialogs.push({
				title: state.overflowed.title.interpolate({
					displayName: displayName
				}),
				content: '<div class="Streams_popup_content">' + $(e.target).html() + '</div>'
			});
		});

		// new message arrived
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/chat/message')
		.set(function (stream, message) {
			tool.renderMessage(message);
		}, tool);
		// a new stream was related (including a call)
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/relatedTo')
		.set(function(stream, message) {
			tool.renderMessage(message);
		}, tool);

		// new user joined
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/join')
		.set(function(stream, message) {
			var messages = tool.prepareMessages(message, 'join');
			tool.renderNotification(Q.first(messages));
		}, tool);

		// new user left
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/leave')
		.set(function(stream, message) {
			var messages = tool.prepareMessages(message, 'leave');
			tool.renderNotification(Q.first(messages));
		}, tool);

		// new user left
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/subscribe').set(function(stream, message) {
			$te.find('.Streams_chat_subscription').attr({
				'data-subscribed': 'true'
			})
		}, tool);

		/*
		 * activate the composer
		 */
		var isTextarea = (state.inputType === 'textarea');
		var sel1 = '.Streams_chat_composer textarea';
		var sel2 = '.Streams_chat_composer input[type=text]';
		var $input = tool.$(isTextarea ? sel1: sel2);
		$input.plugin('Q/placeholders', null, function () {
			if (isTextarea) {
				this.plugin('Q/autogrow', {
					maxWidth: $te.width()
				});
			}
			if (!Q.info.isTouchscreen) {
				this.plugin('Q/clickfocus');
			}
		}).on('keypress change input focus paste blur Q_refresh', function(event) {
			var $this = $(this);
			var $form = $this.closest('form');
			var $submit = $form.find('.Streams_chat_submit');
			var $call = $form.find('.Streams_chat_call');
			var content = $this.val().trim();

			// 'enter' key handler
			if (event.keyCode === 13) {
				Q.handle(_submit, this, [$this]);
				return false;
			}

			if (content) {
				$submit.removeClass('Q_disappear').addClass('Q_appear');
				$call.removeClass('Q_appear').addClass('Q_disappear');
			} else {
				$submit.removeClass('Q_appear').addClass('Q_disappear');
				$call.removeClass('Q_disappear').addClass('Q_appear');
			}
		});

		// when virtual keyboard appear, trying to scroll body to input element position
		$input.on('focus', function () {
			tool.scrollToBottom();
			setTimeout(function () {
				tool.scrollToBottom();
			}, 500);
		});

		// submit button handler
		tool.$(".Streams_chat_composer .Streams_chat_submit").on(Q.Pointer.fastclick, function(){
			Q.handle(_submit, $input[0], [$input]);
		});

		// call button handler
		tool.$(".Streams_chat_composer .Streams_chat_call").on(Q.Pointer.fastclick, function(e){
			e.stopPropagation();
			e.preventDefault();

			$input.blur();

			tool.startWebRTC();
		});

		function _submit ($this) {
			if (blocked) {
				return false;
			}
			var content = $this.val().trim();
			if (content.length === 0) {
				return false;
			}

			state.hadFocus = true;

			blocked = true;
			$this.attr('disabled', 'disabled');

			if (Q.Users.loggedInUser) {
				_postMessage();
			} else {
				tool.element.setAttribute('data-Q-retain', '');
				Q.Users.login({
					onSuccess: { "Streams/chat": _postMessage },
					onCancel: { "Streams/chat": function () {
						if (!Q.info.isTouchscreen && state.hadFocus) {
							$this.plugin('Q/clickfocus');
						}
						state.hadFocus = false;
					}},
					onResult: { "Streams/chat": function () {
						blocked = false;
						$this.removeAttr('disabled');
					}},
					successUrl: window.location,
					calledBy: tool
				});
			}

			function __postMessage() {
				var fields = {
					'publisherId' : state.publisherId,
					'streamName'  : state.streamName,
					'type'        : 'Streams/chat/message',
					'content'	  : content
				};

				Q.handle(state.beforePost, tool, [fields]);

				Q.Streams.Message.post(fields, function(err, args) {
					blocked = false;
					$this.removeAttr('disabled');
					if (err) {
						tool.renderError(err, args[0], args[1]);
						tool.scrollToBottom();
						return;
					}
					state.stream.refresh(null, {
						messages: true, 
						unlessSocket: true,
						evenIfNotRetained: true
					});
					$this.val('').trigger('Q_refresh');
					if (!Q.info.isTouchscreen && state.hadFocus) {
						$this.plugin('Q/clickfocus');
					}
					if (Q.info.isTouchscreen) {
						$this.blur();
					}
					state.hadFocus = false;
					if (state.seen) {
						Q.Streams.Message.Total.seen(
							state.publisherId, 
							state.streamName, 
							'Streams/chat/message',
							true
						);
					}
				});
			}

			function _postMessage (preprocessCounter) {
				preprocessCounter = preprocessCounter || 0;

				Q.handle(state.preprocess[preprocessCounter], tool, [function () {
					_postMessage(preprocessCounter + 1);
				}]);

				if (preprocessCounter === state.preprocess.length) {
					__postMessage();
				}
			}
		}
	},

	niceScroll: function(callback) {
		if (Q.info.formFactor === 'desktop') {
			return false;
		}

		// TODO - when user scrolled in message container not running this function
		var isScrollNow = false,
			startY      = null;

		function touchstart(event){
			isScrollNow = true;
			startY      = event.originalEvent.touches[0].pageY;
		};

		function touchend(event){
			isScrollNow = false;
			startY      = null;
		};

		$(document.body)
			.on('touchstart', touchstart)
			.on('touchend', touchend)
			.on('touchmove', function(event){

			if (isScrollNow && event.originalEvent.touches[0].pageY > startY) {
				// isset scollbar in window
				if (0 > $(window).height() - $(document.body).height()) {
					$(document.body)
						.off('touchstart')
						.off('touchend')
						.off('touchmove');

					tool.$('.Streams_chat_messages').scroll(function(event){
						if ($(this).scrollToTop() == 0) {
							callback && callback();
						}
					});
				} else {
					callback && callback();
				}
			}
		});
	},
	/**
	 * Render related stream as chat message
	 * @method renderRelatedStream
	 * @param {object} message
	 */
	renderRelatedStream: function (message) {
		var state = this.state;

		if (Q.getObject("constructor.name", message) !== "Streams_Message") {
			message = Q.Streams.Message.construct(message);
		}

		var instructions = message.getAllInstructions();

		if (state.excludedRelatedStreams.includes(instructions.fromType)) {
			return;
		}

		var previewToolName = instructions.fromType + '/preview';
		if (!Q.Tool.defined(previewToolName)) {
			return console.warn("tool " + previewToolName + " not found");
		}

		var fields = {
			publisherId: instructions.fromPublisherId,
			streamName: instructions.fromStreamName,
			closeable: false,
			onError: function () {
				$(this.element).closest(".Streams_chat_item").remove();
			}
		};

		if (previewToolName === "Streams/image/preview") {
			fields.showTitle = false;
			fields.imagepicker = {showSize: "200"};
		}

		return Q.Tool.setUpElementHTML($(Q.Tool.setUpElementHTML("div", "Streams/preview", fields))[0], previewToolName, fields);
		//return $('<div />').tool("Streams/preview", fields).tool(previewToolName, fields);
	},
	getOrdinal: function(action, ordinal){
		if (ordinal) {
			ordinal = 'data-ordinal='+ordinal;
		}

		var data = this.findMessageData.call(this, action, ordinal);
		return data ? data.ordinal : null;
	},

	/*
	* find by options [first, last] or/and param
	* or only by param
	* @return {String|null} data attribute or null
	*/
	findMessageData: function(action, byParam){
		var message = this.findMessage(action, byParam);
		return message ? message.data() : null;
	},

	findMessage: function(action, byParam) {
		var tool = this,
			query = '.Streams_chat_item';

		byParam = (byParam ? '['+byParam+']' : '');

		if (!action && byParam) {
			return tool.$(query+byParam);
		}

		if (typeof(action) === 'string') {
			switch(action){
				case 'first':
				case 'last':
					return tool.$(query+':'+action+byParam);
			}
		} else if (typeof(action) === 'number') {
			var messages = tool.$(query+byParam);
			return messages.length <= action ? $(messages.get(action)) : null;
		}

		return null;
	},

	scrollToBottom: function(callback) {
		var state = this.state;
		var $scm = this.$('.Streams_chat_messages');
		var overflow = $scm.css('overflow-y');
		if (['scroll', 'auto'].indexOf(overflow) >= 0) {
			state.$scrolling = $scm;
		}
		if (!state.$scrolling) {
			state.$scrolling = $($scm[0].scrollingParent());
		}
		if (state.$scrolling.length) {
			state.$scrolling.animate({
				scrollTop: state.$scrolling[0].scrollHeight
			}, this.state.animations.duration, callback);
		}
	},

	scrollToTop: function() {
		$scm = this.$('.Streams_chat_messages');
		$scm.animate({ scrollTop: 0 }, this.state.animations.duration);
	},

	processDOM: function() {
		var state = this.state;
		this.$('.Streams_chat_message').each(function () {
			var $this = $(this);

			if ($this.closest(".Streams_chat_message_skipOverflowed").length || !this.isOverflowed()) {
				return;
			}

			this.style.cursor = 'pointer';
			var type = $this.closest('.Streams_chat_item').hasClass('Streams_chat_to_me')
				? 'srcToMe' : 'srcFromMe';
			var $indicator = $('<img />', {
				"src": Q.url(state.overflowed[type]),
				"class": "Streams_chat_overflowed_indicator"
			});
			$this.closest('.Streams_chat_bubble')
				.addClass('Streams_chat_overflowed')
				.append($indicator);
		});
		if (!Q.info.isTouchscreen && state.hadFocus) {
			$(this.state.$inputElement).plugin('Q/clickfocus');
		}
		state.hadFocus = false;
	},
	
	refresh: function (callback) {
		
		var tool = this;
		var state = tool.state;
		
		function _render(messages) {
			Q.each(messages, function (ordinal) {
				state.earliest = ordinal;
				return false;
			}, {ascending: true, numeric: true});
		
			tool.render(function() {
				tool.renderMessages(
					tool.prepareMessages(messages), 
					function (items) {
						Q.each(items, function (key, $html) {
							tool.$('.Streams_chat_noMessages').remove();
							var $scm = tool.$('.Streams_chat_messages'); 
							$html.appendTo($scm).activate();
							$scm.off('scroll.Streams_chat')
							.on('scroll.Streams_chat', function () {
								state.lastScrollTop = $scm.scrollTop();
							});
						});
					}
				);
				
				Q.handle(callback, tool);
				tool.processDOM();
				tool.addEvents();
				
				Q.handle(state.onRefresh, tool);
				
				tool.scrollToBottom();

				// if startWebRTC is true, start webrtc
				if (state.startWebRTC
				|| (location.href.indexOf(state.stream.url() >= 0) 
					&& location.href.indexOf('startWebRTC') >= 0
				)) {
					tool.startWebRTC();
				}
			});
		
		}

		Q.Streams.retainWith(this).get(state.publisherId, state.streamName, function () {
			state.stream = this;
			tool.more(function () {
				_render.apply(this, arguments);

				state.stream.refresh(null, {
					messages: true,
					unlessSocket: true,
					evenIfNotRetained: true
				});
			});
		}, {
			withParticipant: true
		});
	}
});

Q.Template.set('Streams/chat/message/bubble',
	'<div class="Streams_chat_item {{classes}}" '+
			'data-byUserId="{{byUserId}}" '+
			'data-ordinal="{{ordinal}}" ' +
			'data-instructions="{{instructions}}">'+
		'<div class="Streams_chat_avatar_icon" data-byUserId="{{byUserId}}"></div>'+
		'<div class="Streams_chat_bubble">'+
			'<div class="Streams_chat_tick"></div>'+
			'<div class="Streams_chat_message">'+
				'<div class="Streams_chat_avatar_name" data-byUserId="{{byUserId}}"></div>'+
				'<span class="Streams_chat_message_content">{{content}}</span>'+
			'</div>'+
			'<div class="Q_clear"></div>'+
		'</div>'+
		'<div class="Streams_chat_timestamp" data-time="{{time}}"></div>'+
		'{{#if vote}}' +
		'<div class="Streams_chat_vote_container">' +
			'<img class="Streams_chat_vote_up Streams_chat_vote" data-vote="up" src="{{vote.up.src}}">' +
			'<img class="Streams_chat_vote_down Streams_chat_vote" data-vote="down" src="{{vote.down.src}}">' +
			'<img class="Streams_chat_vote_flag Streams_chat_vote" data-vote="flag" src="{{vote.flag.src}}">' +
		'</div>' +
		'{{/if}}' +
		'<div class="Q_clear"></div>'+
	'</div>'
);

Q.Template.set('Streams/chat/message/notification', 
	'<div class="Streams_chat_notification>'+
		'<div class="Streams_chat_timestamp" data-time="{{time}}"></div>'+
		'{{#if visit}}{{interpolate Visit displayName=displayName}}{{/if}}'+
		'{{#if join}}{{interpolate Join displayName=displayName}}{{/if}}'+
		'{{#if leave}}{{interpolate Leave displayName=displayName}}{{/if}}'+
		'{{#if relatedTo}}{{interpolate RelatedTo displayName=displayName stream=stream}}{{/if}}'+
	'</div>',
	{ text: ['Streams/content'] }
);

Q.Template.set('Streams/chat/message/error',
	'<div class="Streams_chat_item Q_error">'+
		'<div class="Streams_chat_container">'+
			'<div class="Streams_chat_timestamp" data-time="{{time}}"></div>'+
			'<div class="Streams_chat_error">'+
				'{{errorText}}'+
			'</div>'+
		'</div>'+
		'<div class="Q_clear"></div>'+
	'</div>'
);

Q.Template.set('Streams/chat/Streams_chat_noMessages',
	'<i class="Streams_chat_noMessages">{{text.noOneSaid}}</i>'
);

Q.Template.set('Streams/chat/main', 
	'<div class="Q_clear"></div>'+
	'<div class="Streams_chat_messages">'+
		'{{#isClick}}'+
			'<div class="Streams_chat_more">'+
				'<img src="{{earlierSrc}}">{{text.earlierComments}}'+ 
			'</div>'+
		'{{/isClick}}'+
		'<!-- messages -->'+
	'</div>'+
	'<form class="Streams_chat_composer" action="" method="post">'+
		'<div class="Streams_chat_addons">+</div>' +
		'{{#if textarea}}' +
			'<textarea placeholder="{{placeholder}}"></textarea>'+
		'{{else}}' +
			'<input type="text" placeholder="{{placeholder}}">'+
		'{{/if}}' +
		'<div class="Streams_chat_submit Q_disappear"></div>' +
		'<div class="Streams_chat_call Q_appear"></div>' +
	'</form>'+
	'<hr />'+
	'{{#if closeable}}' +
		'<button class="Q_button Q_tool Q_clickable_tool" style="display: block; margin: 0 auto;" name="close">{{text.closeChatButton}}</button>' +
	'{{/if}}' +
	'<div class="Q_clear"></div>'
);

})(Q, jQuery);