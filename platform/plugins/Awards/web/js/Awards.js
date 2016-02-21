/**
 * Various front-end functionality dealing with awards, badges, credits, etc.
 * @class Awards
 */

Q.Awards = Q.plugins.Awards = {

	/**
	 * Operates with dialogs.
	 * @class Awards.Dialogs
	 */
	Dialogs: {
		/**
		 * Show a dialog where the user can set up their payment information
		 * @method payment
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 *  @param {Object} [options] Any additional options to pass to the dialog
		 */
		payment: function (callback, options) {
			var html = '<iframe ' +
				'name="Awards_authnet" ' +
				'src="" ' +
				'width="480" ' +
				'height="640" ' +
				'frameborder="0" ' +
				'scrolling="no" ' +
				'class="authnet" ' +
			'></iframe>';
			Q.Dialogs.push(Q.extend({
				title: 'Set Payment Information',
				apply: true
			}, options, {
				content: html
			}));
		}
	},
	
	/**
	 * Operates with dialogs.
	 * @class Awards
	 */

	/**
	 * Subscribe the logged-in user to a particular payment plan
	 * @method subscribe
	 *  @param {String} payments can be "authnet" or "stripe"
	 *  @param {String} planPublisherId the publisher of the subscription plan's stream
	 *  @param {String} planStreamName the name of the subscription plan's stream
	 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
	 */
	subscribe: function (payments, planPublisherId, planStreamName, callback) {
		var fields = {
			payments: payments,
			planPublisherId: planPublisherId,
			planStreamName: planStreamName
		};
		Q.req('Awards/subscription', 'payment', function (err, response) {
			var msg;
			if (msg = Q.firstErrorMessage(err, response)) {
				return callback(msg, null);
			}
			Q.handle(callback, this, [null, response.slots.payment]);
		}, {
			method: 'post',
			fields: fields
		});
	}
};

(function(Q, Awards, Streams, $) {

	Awards.onCredits = new Q.Event();
	
	Streams.onMessage('Awards/credits', "").set(function (data) {
		
		var amount = 199;

		Awards.amount = amount;
		Awards.onCredits.handle(amount);

	});

	Q.Tool.define({
		"Awards/subscription"           : "plugins/Awards/js/tools/subscription.js"
	});

//	Streams.onMessage('Awards/credits', "").set(function (data) {
//		Awards.amount = amount;
//		Awards.onCredits.handle(amount);
//	});

	Q.onReady.set(function () {
		Awards.onCredits.handle(Q.plugins.Awards.credits.amount);
	}, 'Awards');

})(Q, Q.plugins.Awards, Q.plugins.Streams, jQuery);