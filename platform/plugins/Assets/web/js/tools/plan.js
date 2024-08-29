(function (Q, $, window, undefined) {
/**
 * Assets/plan tool.
 * @class Assets/plan
 * @constructor
 * @param {Object} [options] options to pass
 *  @param {String} options.payments Payment gateway, can be "authnet" or "stripe"
 *  @param {Object} [relatedStreamTypes] Streams types of streams can be related to this subscription plan.
 *  Better to define this option in app main js
 */
Q.Tool.define("Assets/plan", function(options) {
	var tool = this;
	var state = this.state;

	var pipe = new Q.pipe(["planStream", "subscriptionStream"], tool.refresh.bind(tool));
	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) {
			return;
		}

		this.retain(tool);
		tool.planStream = this;
		pipe.fill("planStream")();

		Q.req('Assets/subscription', 'data', function (err, response) {
			if (err) {
				return;
			}

			var publisherId = Q.getObject([state.publisherId, state.streamName, "publisherId"], response.slots.data.subscribed);
			var streamName = Q.getObject([state.publisherId, state.streamName, "streamName"], response.slots.data.subscribed);

			if (publisherId && streamName) {
				Q.Streams.get(publisherId, streamName, function (err) {
					if (err) {
						return;
					}

					tool.subscriptionStream = this;
					pipe.fill("subscriptionStream")();
				});
			} else {
				tool.subscriptionStream = null;
				pipe.fill("subscriptionStream")();
			}
		}, {

		});
	});
},

{
	publisherId: null,
	streamName: null,
	payments: "stripe",
	immediatePayment: true,
	icon: {
		defaultSize: 200
	},
	relatedStreamTypes: {},
	onSubscribe: new Q.Event()
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);

		var isAdmin = tool.planStream.testAdminLevel(40);
		var period = tool.planStream.getAttribute("period");
		var currency = tool.planStream.getAttribute('currency');
		var lastChargeTime = null;
		var started = null;
		var subscribed = false;
		var endsIn = null;
		var stopped = false;
		if (tool.subscriptionStream) {
			stopped = tool.subscriptionStream.getAttribute("stopped");
			subscribed = !stopped;
			lastChargeTime = parseInt(tool.subscriptionStream.getAttribute("lastChargeTime"));
			started = new Date(lastChargeTime * 1000).toDateString().split(' ').slice(1).join(' ');
			endsIn = new Date(lastChargeTime * 1000);
			switch (period) {
				case "annually":
					endsIn.addYears(1);
					break;
				case "monthly":
					endsIn.addMonths(1);
					break;
				case "weekly":
					endsIn.addWeeks(1);
					break;
				case "daily":
					endsIn.addDays(1);
					break;
			}
			endsIn = endsIn.toDateString().split(' ').slice(1).join(' ');
		}
		var _refreshSubscriptionAndTool = function () {
			Q.Streams.get.force(tool.subscriptionStream.fields.publisherId, tool.subscriptionStream.fields.name, function (err) {
				if (err) {
					return;
				}

				tool.subscriptionStream = this;
				tool.refresh();
			});
		};
		var _subscribe = function ($button) {
			Q.Assets.Subscriptions.subscribe(state.payments, {
				planPublisherId: state.publisherId,
				planStreamName: state.streamName,
				immediatePayment: state.immediatePayment,
				onFailure: function () {
					$button.removeClass("Q_working");
				}
			}, function (err, status, subscriptionStream) {
				$button.removeClass("Q_working");
				if (err) {
					return;
				}

				if (status) {
					Q.Streams.get(subscriptionStream.publisherId, subscriptionStream.streamName, function (err) {
						if (err) {
							return;
						}

						tool.subscriptionStream = this;
						_refreshSubscriptionAndTool();
						Q.handle(state.onSubscribe, tool);
					});
				}
			});
		};

		$toolElement.attr("data-subscribed", subscribed);
		$toolElement.attr("data-stopped", stopped);
		Q.Template.render('Assets/plan', {
			isAdmin,
			status: subscribed ? tool.text.subscriptions.Subscribed : tool.text.subscriptions.Unsubscribed,
			started: started,
			endsIn: {
				text: subscribed ? tool.text.subscriptions.NextPay : tool.text.subscriptions.EndsIn,
				date: endsIn
			},
			period: period,
			currency: currency === "USD" ? '$' : currency,
			iconUrl: tool.planStream.iconUrl(state.icon.defaultSize)
		}, function (err, html) {
			if (err) {
				return;
			}

			Q.replace(tool.element, html);

			if (isAdmin) {
				$(".Assets_plan_participants", tool.element).tool("Streams/participants", {
					maxShow: 100,
					showSummary: true,
					showControls: true,
					publisherId: state.publisherId,
					streamName: state.streamName,
					invite: {
						readLevel: 40,
						appUrl: Q.url("Assets/plan/" + state.publisherId + "/" + state.streamName.split("/").pop())
					}
				});
			}

			$toolElement.activate();

			$("<div>").tool("Streams/preview", {
				publisherId: state.publisherId,
				streamName: state.streamName,
				editable: true
			}).activate(function () {
				var size = Q.largestSize(Q.image.sizes['Streams/image']);
				tool.preview = this;
				tool.preview.icon($("img.Assets_plan_image", tool.element)[0], null, {
					overrideShowSize: {
						'': Q.image.sizes['Streams/image'][size]
					}
				});
			});

			if (tool.planStream.fields.content) {
				$(".Assets_plan_description", tool.element).tool("Streams/inplace", {
					stream: tool.planStream,
					field: "content"
				}).activate();
			}
			$(".Assets_plan_amount", tool.element).tool("Streams/inplace", {
				stream: tool.planStream,
				attribute: "amount",
				editable: false
			}).activate(function () {
				var _formatPrice = function () {
					this.$static && this.$static.html(parseFloat(this.$static.html()).toFixed(2));
				};
				Q.handle(_formatPrice, this);
				this.state.onUpdate.set(function () {
					Q.handle(_formatPrice, this);
				}, tool);
			});
			$(".Assets_plan_period span", tool.element).tool("Streams/inplace", {
				stream: tool.planStream,
				attribute: "period",
				editable: false
			}).activate();

			tool.planStream.onAttribute("amount").set(function (attributes, name) {
				$(".Assets_plan_amount", $toolElement).text(parseFloat(attributes[name]).toFixed(2));
			}, tool);
			tool.planStream.onAttribute("period").set(function (attributes, name) {
				$(".Assets_plan_period span", $toolElement).text(attributes[name]);
			}, tool);

			if (!Q.isEmpty(state.relatedStreamTypes)) {
				var creatable = {};
				var $relatedStreams = $(".Assets_plan_related_streams", tool.element);
				$relatedStreams[0].forEachTool("", function () {
					if (this.name.split("_").pop() !== "preview" || this.name === "streams_preview") {
						return;
					}

					var thisPreview = this;
					var $thisPreviewElement = $(this.element);
					var thisStreamsPreview = Q.Tool.from(this.element, "Streams/preview");
					if (!thisStreamsPreview) {
						return console.warn("Streams/preview tool not found on " + this.name + " tool");
					}
					thisStreamsPreview.state.beforeClose = function (_delete) {
						thisStreamsPreview.element.addClass('Q_working');
						Q.Streams.unrelate(
							state.publisherId,
							state.streamName,
							Q.Assets.Subscriptions.plan.relationType,
							thisStreamsPreview.state.publisherId,
							thisStreamsPreview.state.streamName
						);
					};
					var streamType = thisStreamsPreview.state.creatable.streamType;
					if ($thisPreviewElement.hasClass("Streams_related_composer")) {
						thisStreamsPreview.state.creatable.preprocess = function (_proceed) {
							Q.Dialogs.push({
								title: tool.text.subscriptions.plan.SelectDisplayType.interpolate(tool.text.types[streamType]),
								className: "Assets_plan_select_stream",
								content: $("<div>").tool("Streams/related", {
									publisherId: state.relatedStreamTypes[streamType].categoryStream.publisherId,
									streamName: state.relatedStreamTypes[streamType].categoryStream.streamName,
									relationType: state.relatedStreamTypes[streamType].categoryStream.relationType,
									editable: false,
									closeable: false,
									realtime: true,
									sortable: false,
									relatedOptions: {
										withParticipant: false,
										ascending: true
									},
								}),
								onActivate: function (dialog) {
									dialog.forEachTool(streamType + "/preview", function () {
										var streamsPreview = Q.Tool.from(this.element, "Streams/preview");
										this.state.onInvoke = function () {
											var relatedTool = Q.Tool.from($relatedStreams[0], "Streams/related");
											if (!relatedTool) {
												return Q.alert("Related tool not found!");
											}
											if (Q.getObject([streamsPreview.state.publisherId, streamsPreview.state.streamName], relatedTool.previewElements)) {
												return Q.alert("This stream already added");
											}
											streamsPreview.element.addClass("Q_working");
											Q.Streams.relate(
												state.publisherId,
												state.streamName,
												Q.Assets.Subscriptions.plan.relationType,
												streamsPreview.state.publisherId,
												streamsPreview.state.streamName,
												function () {
													streamsPreview.element.removeClass("Q_working");
												}
											);
										};
									});
								}
							});
							return false;
						};
					} else {

					}
				}, tool);
				var streamTypes = Object.keys(state.relatedStreamTypes);
				var streamTypesPipe = new Q.Pipe(streamTypes, function () {
					$relatedStreams.tool("Streams/related", {
						publisherId: state.publisherId,
						streamName: state.streamName,
						relationType: Q.Assets.Subscriptions.plan.relationType,
						editable: false,
						closeable: true,
						realtime: true,
						sortable: false,
						composerPosition: "last",
						relatedOptions: {
							withParticipant: false,
							ascending: true
						},
						creatable
					}).activate();
				});
				streamTypes.forEach(function (streamType) {
					// if plan interrupted, don't create relations
					if (tool.planStream.getAttribute("interrupted")) {
						return streamTypesPipe.fill(streamType)();
					}
					var pluginName = streamType.split("/")[0];
					Q.Text.get(pluginName + '/content', function (err, text) {
						Q.extend(tool.text, text);
						creatable[streamType] = {title: text.types[streamType].displayType};
						streamTypesPipe.fill(streamType)();
					});
				});
			}

			$("button[name=subscribe]", tool.element).on(Q.Pointer.fastclick, function () {
				var $this = $(this);
				$this.addClass("Q_working");

				// if user never was subscribed, just subscribe
				if (Q.isEmpty(tool.subscriptionStream)) {
					return _subscribe($this);
				}

				// if user was already subscribed, check if subscription is active, and if yes just update attr stopped
				Q.req("Assets/subscription", ["subscribe"], function (err, response) {
					$this.removeClass("Q_working");
					var msg = Q.firstErrorMessage(err);
					if (msg) {
						return Q.alert(msg);
					}

					if (response.slots.subscribe) {
						return _refreshSubscriptionAndTool();
					}

					// if subscription is not active already, just call subscribe where charge funds again
					_subscribe($this);
				}, {
					method: "put",
					fields: {
						publisherId: state.publisherId,
						streamName: state.streamName
					}
				});
			});
			$("button[name=unsubscribe]", tool.element).on(Q.Pointer.fastclick, function () {
				Q.confirm(tool.text.subscriptions.AreYouSureUnsubscribe, function (result) {
					if (!result) {
						return;
					}

					Q.req("Assets/subscription", ["unsubscribe"], function (err, response) {
						var msg = Q.firstErrorMessage(err);
						if (msg) {
							return Q.alert(msg);
						}

						Q.alert(tool.text.subscriptions.YouUnsubscribedFromPlan.interpolate({
							planTitle: tool.planStream.fields.title,
							endsIn: Q.Tool.setUpElementHTML('span', 'Q/timestamp', {
								capitalized: true,
								time: endsIn
							}, 'Q_timestamp', tool.prefix)
						}));

						Q.Streams.get.force(tool.subscriptionStream.fields.publisherId, tool.subscriptionStream.fields.name, function (err) {
							if (err) {
								return;
							}

							tool.subscriptionStream = this;
							tool.refresh();
						});
					}, {
						method: "put",
						fields: {
							publisherId: state.publisherId,
							streamName: state.streamName
						}
					});
				});
			});
		});
	},
	Q: {
		beforeRemove: function () {
			if (this.preview) {
				Q.Tool.remove(this.preview.element, true, true);
			}
		}
	}
});

Q.Template.set('Assets/plan',
`<img class="Assets_plan_image" />
	{{#if isAdmin}}
		<div class="Assets_plan_participants"></div>
	{{/if}}
	<button class="Q_button" name="unsubscribe">{{subscriptions.Unsubscribe}}</button>
	<button class="Q_button" name="subscribe">{{subscriptions.Subscribe}}</button>
	<div class="Assets_plan_period">{{subscriptions.Period}}: <span></span></div>
	<div class="Assets_plan_price">{{subscriptions.Price}}: <span class="Assets_plan_currency">{{currency}}</span><span class="Assets_plan_amount"></span></div>
	<div class="Assets_plan_started">{{subscriptions.Started}}: {{started}}</div>
	<div class="Assets_plan_endsIn">{{endsIn.text}}: {{{tool "Q/timestamp" "endsIn" capitalized=true time=endsIn.date}}}</div>
	<div class="Assets_plan_description"></div>
	<h2 class="Assets_plan_status">{{status}}</h2>
	<div class="Assets_plan_related_streams"></div>`, {text:["Assets/content"]}
);

})(Q, Q.jQuery, window);