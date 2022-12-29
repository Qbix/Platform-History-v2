(function (Q, $, window, undefined) {
/**
 * Assets/plan tool.
 * @class Assets/plan
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("Assets/plan", function(options) {
	var tool = this;
	var state = this.state;

	var pipe = new Q.pipe(["style", "script", "text", "stream"], tool.refresh.bind(tool));

	Q.addStylesheet('{{Assets}}/css/tools/Plan.css', { slotName: 'Assets' }, pipe.fill("style"));
	Q.addScript('{{Q}}/js/datejs/date.js', pipe.fill("script"));

	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text;
		pipe.fill("text")();
	});

	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) {
			return;
		}

		tool.planStream = this;

		Q.req('Assets/subscription', 'data', function (err, response) {
			if (err) {
				return;
			}

			var publisherId = Q.getObject(["subscribed", tool.planStream.fields.publisherId, tool.planStream.fields.name, "publisherId"], response.slots.data);
			var streamName = Q.getObject(["subscribed", tool.planStream.fields.publisherId, tool.planStream.fields.name, "streamName"], response.slots.data);

			Q.Streams.get(publisherId, streamName, function (err) {
				if (err) {
					return;
				}

				tool.subscriptionStream = this;
				pipe.fill("stream")();
			});

		}, {

		});
	});
},

{
	publisherId: null,
	streamName: null,
	icon: {
		defaultSize: 200
	}
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);

		var period = tool.subscriptionStream.getAttribute("period");
		var lastChargeTime = parseInt(tool.subscriptionStream.getAttribute("lastChargeTime"));
		var endsIn = new Date(lastChargeTime * 1000);
		switch (period) {
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

		var subscribed = !tool.subscriptionStream.getAttribute("stopped");
		$toolElement.attr("data-status", subscribed);
		Q.Template.render('Assets/plan', {
			text: tool.text,
			status: subscribed ? tool.text.subscriptions.Subscribed : tool.text.subscriptions.Unsubscribed,
			started: tool.subscriptionStream.getAttribute("startDate"),
			endsIn: {
				text: subscribed ? tool.text.subscriptions.NextPay : tool.text.subscriptions.EndsIn,
				date: endsIn
			},
			period: tool.subscriptionStream.getAttribute("period"),
			price: '$' + parseFloat(tool.subscriptionStream.getAttribute('amount')).toFixed(2),
			iconUrl: tool.planStream.iconUrl(state.icon.defaultSize)
		}, function (err, html) {
			if (err) {
				return;
			}

			Q.replace(tool.element, html);
			$toolElement.activate();

			$("button[name=subscribe]", tool.element).on(Q.Pointer.fastclick, function () {
				Q.req("Assets/subscription", ["subscribe"], function (err, response) {
					var msg = Q.firstErrorMessage(err);
					if (msg) {
						return Q.alert(msg);
					}

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
						publisherId: tool.planStream.fields.publisherId,
						streamName: tool.planStream.fields.name
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
							endsIn: Q.Tool.setUpElementHTML('div', 'Q/timestamp', {
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
							publisherId: tool.planStream.fields.publisherId,
							streamName: tool.planStream.fields.name
						}
					});
				});
			});
		});
	}
});

Q.Template.set('Assets/plan',
`<img class="Streams_preview_icon" src="{{iconUrl}}">
	<h2 class="Assets_plan_status">{{status}}</h2>
	<div class="Assets_plan_period">{{text.subscriptions.Period}}: {{period}}</div>
	<div class="Assets_plan_price">{{text.subscriptions.Price}}: {{price}}</div>
	<div class="Assets_plan_started">{{text.subscriptions.Started}}: {{started}}</div>
	<div class="Assets_plan_endsIn">{{endsIn.text}}: {{&tool "Q/timestamp" "endsIn" capitalized=true time=endsIn.date}}</div>
	<button class="Q_button" name="unsubscribe">{{text.subscriptions.Unsubscribe}}</button>
	<button class="Q_button" name="subscribe">{{text.subscriptions.Subscribe}}</button>`
);

})(Q, Q.$, window);