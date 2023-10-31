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

	Q.req('Assets/subscription', 'data', function (err, response) {
		if (err) {
			return;
		}

		tool.subscriptionData = response.slots.data;
		tool.refresh();
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

		var _renderPlanPreview = function () {
			var planPreview = this;
			var $planPreviewElement = $(planPreview.element);
			var publisherId = planPreview.preview.state.publisherId;
			var streamName = planPreview.preview.state.streamName;

			// if composer
			if (!streamName) {
				planPreview.preview.state.onRefresh.set(function (stream) {
					Q.handle(_renderPlanPreview, planPreview);
				}, tool);
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

					Q.invoke({
						title: stream.fields.title,
						trigger: tool.element,
						content: $("<div>").tool('Assets/plan', {
							publisherId: publisherId,
							streamName: streamName,
							payments: state.payments,
							immediatePayment: state.immediatePayment
						}),
						className: 'Assets_subscription_plan',
						callback: function ($element) {
							if (!($element instanceof $)) {
								$element = $(arguments[2]);
							}

							var assetsPlanTool = Q.Tool.from($element[0], "Assets/plan");
							if (assetsPlanTool) {
								assetsPlanTool.state.onSubscribe.set(function () {
									$toolElement.addClass("Q_selected");
								}, tool);
								Q.handle(state.onSubscribe, tool);
							}
						}
					});
				}, tool);
			});
		};

		this.element.forEachTool("Assets/plan/preview", _renderPlanPreview);

		$toolElement.tool("Streams/related", {
			publisherId: Q.Users.currentCommunityId,
			streamName: "Assets/plans",
			relationType: "Assets/plan",
			creatable: {
				'Assets/plan': {title: tool.text.subscriptions.plan.NewPlan}
			}
		}).activate();
	}
});

})(window, Q, jQuery);