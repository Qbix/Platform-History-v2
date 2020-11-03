(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Standard tool for making payments.
 * @class Assets payment
 * @constructor
 * @param {array} options Override various options for this tool
 *  @param {string} options.payments can be "authnet" or "stripe"
 *  @param {string} options.amount the amount to pay.
 *  @param {string} [options.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {string} [options.payButton] Can override the title of the pay button
 *  @param {string} [options.name=Users::communityName()] The name of the organization the user will be paying
 *  @param {string} [options.image] The url pointing to a square image of your brand or product. The recommended minimum size is 128x128px.
 *  @param {string} [options.description=null] A short name or description of the product or service being purchased.
 *  @param {boolean} [options.allowRememberMe=true] Specify whether to include the option to "Remember Me" for future purchases (true or false).
 *  @param {boolean} [options.billingAddress=false] Specify whether to include the option to set billing address.
 *  @param {boolean} [options.shippingAddress=false] Specify whether to include the option to set shipping address.
 *  @param {boolean} [options.showGPayPanel=false] If true, show Chrome like panel, pop up below, with info about product and price.
 *  @param {boolean} [options.bitcoin=false] Specify whether to accept Bitcoin (true or false).
 *  @param {boolean} [options.alipay=false] Specify whether to accept Alipay ('auto', true, or false). 
 *  @param {boolean} [options.alipayReusable=false] Specify if you need reusable access to the customer's Alipay account (true or false).
 */

Q.Tool.define("Assets/payment", function (options) {
	var tool = this;
	var state = tool.state;
	state.payments = state.payments.charAt(0).toUpperCase() + state.payments.slice(1).toLocaleLowerCase();
	var currency = state.currency.toLocaleLowerCase();

	Q.Assets.Payments.load();

	Q.addStylesheet('{{Assets}}/css/tools/AssetsPayment.css', { slotName: 'Assets' });

	if (state.payments === 'Authnet' && currency !== 'usd') {
		throw new Q.Error("Authnet doesn't support currencies other than USD", 'currency');
	}

	if (!state.userId) {
		// throw new Q.Error("Assets/payment: Don't render tool when user is not logged in");
	}

	if (!state.amount) {
		throw new Q.Error("Assets/payment: amount is required");
	}

	Q.req('Assets/payment', ["tool"], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return console.error("GET to Assets/payment: "+ msg);
		}

		tool.refresh(data.slots.tool);
	}, {
		fields: {
			payments: state.payments,
			currency: state.currency
		}
	});

},

{ // default options here
	payments: 'Stripe',
	amount: 0,
	currency: "usd",
	payButton: null,
	description: null,
	allowRememberMe: true,
	shippingAddress: false,
	billingAddress: false,
	showGPayPanel: false,
	bitcoin: false,
	alipay: false,
	alipayReusable: false,
	name: Q.Users.communityName,
	userId: Q.Users.loggedInUserId(),
	onPay: new Q.Event()
},

{
	refresh: function (data) {
		var tool = this;
		var $te = $(tool.element);
		var state = this.state;
		var payments = state.payments;
		var token = data.token;
		var templateName = "Assets/payment/" + payments;

		if (payments === 'Authnet' && !token) {
			throw new Q.Error("Assets/payment: token is required for authnet");
		}

		// use plugin cordova-plugin-stripe-google-apple-pay for google pay
		if (typeof sgap === 'object' && Q.info.isAndroid() && Q.getObject("Q.plugins.Assets.Payments.googlePay")) {
			payments = 'googlepay';
			templateName = "Assets/payment/gpay";
		}

		Q.Template.render(
			templateName,
			{
				text: data.text.payment
			},
			function (err, html) {
				if (err) return;

				$te.html(html);

				var _pay = function () {
					Q.Assets.Payments[payments.toLowerCase()](state, function (err) {
						if (err) {
							if (err.code !== 20) {
								alert(Q.firstErrorMessage(err));
							}
							return;
						}
						Q.handle(state.onPay, tool, arguments);
					});
				};

				$('.Assets_pay', $te).on(Q.Pointer.click, _pay);

				$('.Assets_gpay', $te).on(Q.Pointer.click, function () {
					if (!state.showGPayPanel) {
						return _pay();
					}

					if ($("body > .Assets_payment_Gpay_preload").length) {
						return;
					}

					var url = Q.info.baseUrl.split(':');
					Q.Template.render(
						'Assets/payment/Gpay/preload',
						{
							name: state.description,
							amount: parseFloat(state.amount).toFixed(2),
							url: ':' + url[1],
							protocol: url[0],
							secured: url[0] === 'https',
							currency: state.currency,
							symbol: data.symbol[1],
							contact: Q.Users.loggedInUser.email || Q.Users.loggedInUser.mobile,
							text: data.text.payment
						},
						function (err, html) {
							if (err) return;

							var $this = $(html);
							var $preload = $($this[1]);
							var $body = $("body");
							var bodyOverflow = $body.css('overflow');
							var _close = function () {
								$preload.css('top', $body.outerHeight() + $body[0].scrollTop);
								setTimeout(function () {
									$this.remove();
									$body.css('overflow', bodyOverflow);
								}, 1000);
							}

							// prevent body scroll
							$body.css('overflow', 'hidden');

							$(document).on('keyup',function(event) {
								if (event.keyCode === 27) {
									_close();
								}
							});

							$(".ApGp_header_close", $preload).on(Q.Pointer.click, _close);

							$("button[name=pay]", $preload).on(Q.Pointer.click, function () {
								_close();
								_pay();
							});

							$preload.css('top', $body.outerHeight() + $body[0].scrollTop);
							$this.appendTo("body");
							$preload.css('top', $body.outerHeight() + $body[0].scrollTop - $preload.outerHeight());
						}
					);
				});
			}
		);
	}
});

Q.Template.set('Assets/payment/Gpay/preload',
	'<div class="Assets_payment_Gpay_bg"></div>' +
	'<div class="Assets_payment_Gpay_preload">' +
	'	<div class="ApGp_header">' +
	'		<div class="ApGp_header_icon"></div>' +
	'		<h2>{{name}}</h2>' +
	'		<div class="ApGp_header_url" data-secured="{{secured}}"><span class="ApGp_header_url_protocol">{{protocol}}</span>{{url}}</div>' +
	'		<div class="ApGp_header_close"></div>' +
	'	</div>' +
	'	<div class="ApGp_prodInfo">' +
	'		<div class="ApGp_text">{{text.AboutOrder}}</div>' +
	'		<div class="ApGp_prodInfo_name">{{name}}</div><div class="ApGp_prodInfo_price">{{currency}} <span>{{amount}} {{symbol}}</span></div>' +
	'	</div>' +
	'	<div class="ApGp_methodInfo">' +
	'		<div class="ApGp_text">{{text.PaymentMethod}}</div>' +
	'		<div class="ApGp_methodInfo_name">Google Pay</div><div class="ApGp_methodInfo_icon"></div>' +
	'	</div>' +
	'	<div class="ApGp_contactInfo">' +
	'		<div class="ApGp_text">{{text.ContactInfo}}</div>' +
	'		<div class="ApGp_contactInfo_name">{{contact}}</div>' +
	'	</div>' +
	'	<div class="ApGp_pay">' +
	'		<button name="pay">{{text.Pay}}</button>' +
	'	</div>' +
	'</div>'
);
Q.Template.set('Assets/payment/Gpay',
	'<button class="Q_button Assets_gpay">&nbsp;</button>'
);
Q.Template.set('Assets/payment/Stripe',
	'<button class="Q_button Assets_pay">{{text.Pay}}</button>'
);
Q.Template.set('Assets/payment/Authnet',
	'<form method="post" target="Assets_authnet" action="{{action}}">' +
	'<input type="hidden" name="Token" value="{{token}}">' +
	'<button class="Q_button Assets_pay">{{text.Pay}}</button>' +
	'</form>'
);

})(window, Q, jQuery);