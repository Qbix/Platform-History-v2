(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Standard tool for starting or managing subscriptions.
 * @class Assets subscription
 * @constructor
 * @param {Object} options Override various options for this tool
 *  @param {String} options.payments can be "authnet" or "stripe"
 *  @param {String} options.planStreamName the name of the subscription plan's stream
 *  @param {String} [options.planPublisherId=Q.Users.communityId] the publisher of the subscription plan's stream
 *  @param {String} [params.token] If payments is "authnet" then tool must be rendered server-side
 *  @param {String} [params.action] If payments is "authnet" then tool must be rendered server-side
 */

Q.Tool.define("Assets/subscription", function (options) {
	var tool = this;
	var state = tool.state;

	var pipe = Q.pipe(['styles', 'texts', 'data'], function () {
		tool.refresh();
	});

	Q.addStylesheet('{{Assets}}/css/tools/AssetsSubscription.css', {slotName: 'Assets'}, pipe.fill('styles'));
	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.subscriptions;
		pipe.fill('texts')();
	});
	Q.req('Assets/subscription', 'data', function (err, response) {
		if (err) {
			return;
		}

		tool.subscriptionData = response.slots.data;
		pipe.fill('data')();
	}, {

	});
},

{ // default options here
	payments: "stripe",
	immediatePayment: true,
	onSubscribe: new Q.Event()
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(this.element);

		this.element.forEachTool("Assets/plan/preview", function () {
			var planPreview = this;
			var $planPreviewElement = $(planPreview.element);
			var publisherId = planPreview.preview.state.publisherId;
			var streamName = planPreview.preview.state.streamName;

			// if composer
			if (!streamName) {
				return;
			}

			// get subscription plan stream
			Q.Streams.get(publisherId, streamName, function (err) {
				if (err) {
					return;
				}

				var stream = this;

				// mark subscribed plans
				if (Q.getObject(["subscribed", stream.fields.publisherId, stream.fields.name], tool.subscriptionData)) {
					$planPreviewElement.addClass("Q_selected");
				}

				planPreview.state.onInvoke.set(function () {
					if (!Q.Users.loggedInUser) {
						return Q.Users.login({
							onSuccess: function () {
								Q.handle(window.location.href);
							}
						});
					}

					if ($planPreviewElement.hasClass("Q_selected")) {
						Q.invoke({
							title: stream.fields.title,
							trigger: tool.element,
							content: Q.Tool.setUpElement('div', 'Assets/plan', {
								publisherId: publisherId,
								streamName: streamName
							}),
							className: 'Assets_subscription_plan'
						});
						return;
					}

					Q.confirm(tool.text.confirm.message.interpolate({ "title": stream.fields.title }), function (response) {
						if (!response) {
							return;
						}

						Q.Assets.Subscriptions[state.payments]({
							planPublisherId: stream.fields.publisherId,
							planStreamName: stream.fields.name,
							immediatePayment: state.immediatePayment
						}, function (err, data) {
							if (err) {
								return;
							}

							$planPreviewElement.addClass("Q_selected");

							Q.handle(state.onSubscribe, tool, data);
						});
					}, {
						title: tool.text.confirm.title
					})
				}, tool);
			});
		});

		$toolElement.tool("Streams/related", {
			publisherId: Q.Users.currentCommunityId,
			streamName: "Assets/plans",
			relationType: "Assets/plan",
			creatable: {
				'Assets/plan': {title: tool.text.plan.NewPlan}
			}
		}).activate();


	}
});

})(window, Q, jQuery);