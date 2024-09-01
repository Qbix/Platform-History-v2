(function (Q) {

	/**
	 * Various front-end functionality dealing with awards, badges, credits, etc.
	 * @class Assets
	 */

	var Users = Q.Users;
	var Streams = Q.Streams;

	Streams.Stream.properties['Assets/canPayForStreams'] = true;
    
    var priv = {};
    
	var Assets = Q.Assets = Q.plugins.Assets = {

		/**
		 * Operates with credits.
		 * @class Assets.Credits
		 */
        
		Credits: Q.Method.define({
			getStream: new Q.Method(),
			buy: new Q.Method(),
			pay: new Q.Method(),
			/**
			 * Convert from currency to credits
			 * @method convertToCredits
			 * @static
			 *  @param {Number} amount
			 *  @param {String} currency
			 */
			convertToCredits: function (amount, currency) {
				var exchange = Q.getObject(["exchange", currency], Q.Assets.Credits);

				if (!exchange) {
					return null;
				}

				return Math.ceil(parseFloat(amount) * parseFloat(exchange));
			}
		}, '{{Assets}}/js/methods/Assets/Credits'),

		onPaymentSuccess: new Q.Event(),

		onBeforeNotice: new Q.Event(),
		onCreditsChanged: new Q.Event(),
		preSubscribeLogin: new Q.Event(),

		/**
		 * Operates with subscriptions.
		 * @class Assets.Subscriptions
		 */
		Subscriptions: Q.Method.define({
            authnet: new Q.Method({
                options: {
                    name: Q.Users.communityName
                }
            }),
            stripe: new Q.Method({
                options: {
                    name: Q.Users.communityName,
                    email: Q.getObject("loggedInUser.email", Q.Users),
                    currency: 'USD'
                }
            }),
            subscribe: new Q.Method(),
			getPlansRelated: new Q.Method(),
			showPlansRelated: new Q.Method(),
			onSubscribe: new Q.Event()
		}, '{{Assets}}/js/methods/Assets/Subscriptions'),

		/**
		 * Operates with payments
		 * @class Assets.Payments
		 */
		Payments: Q.Method.define({
			/**
			 * In order to use Assets.Payments methods need to call method Assets.Payments.load()
			 * This method load needed libs and make some needed actions when libs loaded
			 * @method checkLoaded
			 * @static
			 */
			checkLoaded: function () {
				if (Q.getObject("Payments.loaded", Assets)) {
					return true;
				}

				throw new Q.Error("In order to use Assets.Payments methods need to call method Assets.Payments.load()");
			},
            authnet: new Q.Method({
                options: {
                    name: Q.Users.communityName,
                    description: 'a product or service'
                }
            }),
            stripe: new Q.Method({
                options: {
                    description: 'a product or service',
                    javascript: 'https://checkout.stripe.com/checkout.js',
                    name: Q.Users.communityName
                }
            }),
            load: new Q.Method(),
            standardStripe: new Q.Method(),
			/**
			 * Show message with payment status
			 * @method stripePaymentResult
			 * @static
			 *  @param {Object} paymentIntent - stripe payment intent object
			 */
			stripePaymentResult: function (paymentIntent) {
				var message = "";
				switch (paymentIntent.status) {
					case "succeeded":
						message = Q.Assets.texts.payment.PaymentSucceeded;
						break;
					case "processing":
						message = Q.Assets.texts.payment.PaymentProcessing;
						break;
					case "requires_payment_method":
						message = Q.Assets.texts.payment.FailTryAgain;
						break;
					default:
						message = Q.Assets.texts.payment.SomethingWrong;
						break;
				}

				Q.Dialogs.push({
					title: Q.Assets.texts.payment.PaymentStatus,
					className: "Assets_Payment_status",
					content: message,
					onActivate: function (dialog) {
						dialog.setAttribute('data-status', paymentIntent.status);
					}
				});
			}
		}, 
            '{{Assets}}/js/methods/Assets/Payments',
            function(){
                return [priv];
            }
        ),

		/**
		 * For dealing with currencies
		 * @class Assets.Currencies
		 */
		Currencies: Q.Method.define({
            load: new Q.Method(),
			getSymbol: new Q.Method(),
			balanceOf: new Q.Method(),
			Web3: {
				/**
				 * @method getTokens
				 * @static
				 * @param {String} chainId
				 */
				getTokens: function(chainId) {
					var temp = {}, results = {};
					var zero = Q.Users.Web3.zeroAddress;
					Q.each(Assets.currencies.tokens, function (address) {
						var token = this[chainId];
						if (!token) {
							return;
						}
						temp[this.symbol] = Q.extend({
							token: token
						}, this);
					});
					for (var symbol in temp) {
						if (temp[symbol].token === zero) {
							results[symbol] = temp[symbol];
						}
					}
					for (var symbol in temp) {
						if (temp[symbol].token !== zero) {
							results[symbol] = temp[symbol];
						}
					}
					return results;
				},
				/**
				 * @method getTokens
				 * @static
				 * @param {String} chainId
				 * @param {String} tokenSymbolOrAddress
				 * @return {Object|null}
				 */
				getToken: function(chainId, tokenSymbolOrAddress) {
					if (!tokenSymbolOrAddress
					|| tokenSymbolOrAddress.substring(0, 2) !== '0x') {
						throw new Q.Exception("Assets.Currencies.Web3.getToken: token symbol or address required");
					}
					var tokens = Assets.Currencies.Web3.getTokens(chainId);
					for (var tokenSymbol in tokens) {
						var tokenInfo = tokens[tokenSymbol];
						if (tokenSymbol === tokenSymbolOrAddress
						|| tokenInfo[chainId] === tokenSymbolOrAddress) {
							return {
								symbol: tokenInfo.symbol,
								name: tokenInfo.name,
								decimals: tokenInfo.decimals,
								token: tokenInfo[chainId]
							};
						}
					}
					return null;
				}
			}
		}, '{{Assets}}/js/methods/Assets/Currencies'),

		/**
		 * Create batcher
		 * @method batchFunction
		 */
		batchFunctions: {},
		batchFunction: function Assets_batchFunction() {
			return Q.batcher.factory(this.batchFunctions, Q.info.baseUrl,"/action.php/Assets/batch", "batch", "batch");
		},

		NFT: {
			/**
			 * For dealing with NFTs on web3 (EVM-compatible) blockchains
			 * @class Assets.NFT.Web3
			 */
			Web3: Q.Method.define({
				onTokenRemovedFromSale: new Q.Event(),
				onTokenPutOnSale: new Q.Event(),
				onTransfer: new Q.Event(),
				onInstanceCreated: new Q.Event(),
				onInstanceOwnershipTransferred: new Q.Event(),
				onSeriesPutOnSale: new Q.Event(),
				onSeriesRemovedFromSale: new Q.Event(),

				Sales: Q.Method.define({
					getFactory: new Q.Method(),
					getContract: new Q.Method(),
				}, '{{Assets}}/js/methods/Assets/NFT/Web3/Sales'),

				Locked: Q.Method.define({
					getContract: new Q.Method()
				}, '{{Assets}}/js/methods/Assets/NFT/Web3/Locked'),

				setSeriesInfo: new Q.Method(),
				getFactory: new Q.Method(),
				getContract: new Q.Method(),
				metadata: new Q.Method(),
				balanceOf: new Q.Method(),
				getAuthor: new Q.Method(),
				getOwner: new Q.Method(),
				commissionInfo: new Q.Method(),
				saleInfo: new Q.Method(),
				transferFrom: new Q.Method(),
				buy: new Q.Method(),
				/**
				 * Get long string and minimize to fixed length with some chars at the end and dots in the middle
				 * @method minimizeAddress
				 * @param {string} str
				 * @param {integer} length result length
				 * @param {integer} endChars amount of chars at the end
				 */
				minimizeAddress: function (str, length, endChars) {
					if (!str) {
						return str;
					}

					endChars = endChars || 0;
					var strLength = str.length;
					if (strLength <= length) {
						return str;
					}

					return str.substring(0, length - endChars - 3) + "..." + str.slice(-endChars);
				},
				/**
				 * Check if transaction successful
				 * @method isSuccessfulTransaction
				 * @param {object} receipt
				 */
				isSuccessfulTransaction: function (receipt) {
					var status = Q.getObject("status", receipt);
					return status === '0x1' || status === 1;
				}
			}, '{{Assets}}/js/methods/Assets/NFT/Web3'),

			/**
			 * Calculate seriesId from tokenId
			 * @param {String} tokenId can be a long decimal representation
			 * @returns {String} '0x' followed by 16 hexits
			 */
			seriesIdFromTokenId(tokenId) {
				return '0x' + tokenId.decimalToHex().substring(0, 16);
			}
		},
        CommunityCoins: Q.Method.define({
            Pools: Q.Method.define({
                Factory: Q.Method.define({
                    Get: new Q.Method()
                }, '{{Assets}}/js/methods/Assets/CommunityCoins/Pools/Factory'),
                getAll: new Q.Method(),
                getAllExtended: new Q.Method(),
                getERC20TokenInfo: new Q.Method()
            }, '{{Assets}}/js/methods/Assets/CommunityCoins/Pools')
        }, '{{Assets}}/js/methods/Assets/CommunityCoins'),
		Funds: Q.Method.define({
			getFactory: new Q.Method(),
			getAll: new Q.Method(),
			getFundConfig: new Q.Method(),
			getWhitelisted: new Q.Method(),
			adjustFundConfig: function(infoConfig, options) {
				//make output data an userfriendly
				var infoConfigAdjusted = Object.assign({}, infoConfig);

				infoConfigAdjusted._endTs = new Date(parseInt(infoConfig._endTs) * 1000).toDateString();
				infoConfigAdjusted._prices = infoConfig._prices.map(
						x => ethers.utils.formatUnits(
							x.toString(), 
							Q.isEmpty(options.priceDenom)?18:Math.log10(options.priceDenom)
						));
				infoConfigAdjusted._thresholds = infoConfig._thresholds.map(x => ethers.utils.formatUnits(x.toString(), 18));
				infoConfigAdjusted._timestamps = infoConfig._timestamps.map(x => new Date(parseInt(x) * 1000).toDateString());
				
				var currentDate = Math.floor(new Date().getTime()/1000);
				//currentDate = Math.floor(new Date('2023/07/24  GMT+00:00').getTime()/1000);
				var index = -1;
				
				if (infoConfig._timestamps.length == 1) {
					index = (infoConfig._timestamps[0] > currentDate) ? 1 : -1;
				} else if (infoConfig._timestamps.length > 1) {

					var cur = currentDate;
					for (var i = 0; i < infoConfig._timestamps.length; i++) {
						var tsInt = parseInt(infoConfig._timestamps[i]);
						if (
								tsInt <= currentDate &&
								(
									index == -1 ||
									cur <= tsInt
								)
							) {
							index = i;
							cur = tsInt;
						}
					}
					
				}
				
				infoConfigAdjusted.currentPrice = (index != -1) ? infoConfigAdjusted._prices[index] : 0;
				infoConfigAdjusted.isOutOfDate = (currentDate > infoConfig._endTs) ? true : false;
				
				return infoConfigAdjusted;
			}
		}, '{{Assets}}/js/methods/Assets/Funds'),
		Web3: Q.Method.define({
			constants: {
				zeroAddress: '0x0000000000000000000000000000000000000000'
			},
			/**
			 * Generates a link for opening a coin
			 * @static
			 * @method addAsset
			 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			 * @param {String} symbol A ticker symbol or shorthand, up to 5 chars.
			 * @param {Number} decimals The number of decimals in the token
			 * @param {String} [image] A string url of the token logo
			 * @return {String}
			 */
			addAsset: Q.Method.define({
				metamask: new Q.Method(),
				trustwallet: new Q.Method()
			}, '{{Assets}}/js/methods/Assets/Web3/addAsset'),

			Links: {
				/**
				 * Generates a link for adding an asset
				 * @static
				 * @method addAsset
				 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
				 * @return {String}
				 */
				addAsset: { trustwallet: function (asset) {
						return 'https://link.trustwallet.com/add_asset?asset='+asset;
					}},
				/**
				 * Generates a link for opening a coin
				 * @static
				 * @method openCoin
				 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
				 * @return {String}
				 */
				openCoin: { trustwallet: function (asset) {
						return 'https://link.trustwallet.com/open_coin?asset='+asset;
					}},
				/**
				 * Generates a link for sending a payment
				 * @static
				 * @method send
				 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
				 * @param {String} address some Ethereum address
				 * @param {Number} amount The amount to send
				 * @param {String} [memo] What to say with the payment
				 * @return {String}
				 */
				send: { trustwallet: function (asset, address, amount, memo) {
						return Q.url('https://link.trustwallet.com/send', {
							asset: asset,
							address: address,
							amount: amount,
							memo: memo || ''
						});
					}},
				/**
				 * Generates a link for swapping between tokens
				 * @static
				 * @method addAsset
				 * @param {String} from in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
				 * @param {String} to in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
				 * @return {String}
				 */
				swap: { trustwallet: function (from, to) {
						return Q.url('https://link.trustwallet.com/swap', {
							from: from,
							to: to,
						});
					}}
			}
		}, '{{Assets}}/js/methods/Assets/Web3'),
	};
    

//    var priv = Q.Method.define({
//    }, '{{Assets}}/js/methods/Assets/priv');
//        
//        
/**
     * method will redirect if Cordova plugin
     * TODO: mb move it to '{{Assets}}/js/methods/Assets/Payments/stripe.js',
     * @param {type} options
     * @returns {undefined}
     */
	priv._redirectToBrowserTab = function _redirectToBrowserTab(options) {
		var url = new URL(document.location.href);
		url.searchParams.set('browsertab', 'yes');
		url.searchParams.set('scheme', Q.info.scheme);
		url.searchParams.set('paymentOptions', JSON.stringify({
			amount: options.amount,
			email: options.email,
			userId: Q.Users.loggedInUserId(),
			currency: options.currency,
			description: options.description,
			metadata: options.metadata
		}));
		cordova.plugins.browsertabs.openUrl(url.toString(), {
			scheme: Q.info.scheme
		}, function(successResp) {
			Q.handle(options.onSuccess, null, [successResp]);
		}, function(err) {
			Q.handle(options.onFailure, null, [err]);
		});
	}

    
    // define methods for Users to replace method stubs
    Q.Method.define(
        Assets, 
        '{{Assets}}/js/methods/Assets', 
        function() {
            return [priv];
        }
    );
    
	Q.Text.addFor(
		['Q.Tool.define', 'Q.Template.set'],
		'Assets/', ["Assets/content"]
	);
	Q.Tool.define({
		"Assets/subscription": {
			js: "{{Assets}}/js/tools/subscription.js",
			css: "{{Assets}}/css/tools/AssetsSubscription.css"
		},
		"Assets/payment": {
			js: "{{Assets}}/js/tools/payment.js",
			css: "{{Assets}}/css/tools/AssetsPayment.css"
		},
		"Assets/history": "{{Assets}}/js/tools/history.js",
		"Assets/service/preview": "{{Assets}}/js/tools/service/preview.js",
		"Assets/NFT/preview": "{{Assets}}/js/tools/NFT/preview.js",
		"Assets/NFT/series": "{{Assets}}/js/tools/NFT/series.js",
		"Assets/NFT/series/preview": "{{Assets}}/js/tools/NFT/seriesPreview.js",
		"Assets/NFT/collection/preview": "{{Assets}}/js/tools/NFT/collectionPreview.js",
		"Assets/NFT/contract": "{{Assets}}/js/tools/NFT/contract.js",
		"Assets/NFT/owned": {
			js: "{{Assets}}/js/tools/NFT/owned.js",
			css: "{{Assets}}/css/tools/NFT/owned.css"
		},
		"Assets/NFT/list": "{{Assets}}/js/tools/NFT/list.js",
		"Assets/plan/preview": {
			js: "{{Assets}}/js/tools/plan/preview.js",
			css: "{{Assets}}/css/tools/plan/preview.css"
		},
		"Assets/plan": {
			js: ["{{Assets}}/js/tools/plan.js", "{{Q}}/js/datejs/date.js"],
			css: "{{Assets}}/css/tools/Plan.css"
		},
		"Assets/NFT/sales/factory": {
            js:"{{Assets}}/js/tools/NFT/sales/factory.js",
            css: "{{Q}}/css/bootstrap-custom/bootstrap.css"
        },
		"Assets/NFT/sales": {
            js:"{{Assets}}/js/tools/NFT/sales.js",
            css: "{{Q}}/css/bootstrap-custom/bootstrap.css"
        },
		"Assets/NFT/sales/whitelist": "{{Assets}}/js/tools/NFT/sales/whitelist.js",
		"Assets/NFT/locked": {
		    js: "{{Assets}}/js/tools/NFT/locked.js",
		    css: "{{Assets}}/css/tools/NFT/locked.css"
		},
		"Assets/web3/currencies": "{{Assets}}/js/tools/web3/currencies.js",
		"Assets/web3/transfer": {
			js: "{{Assets}}/js/tools/web3/transfer.js",
			css: "{{Assets}}/css/tools/web3/transfer.css",
			text: ["Assets/content", "Users/content"]
		},
        "Assets/web3/invoice": {
			js: "{{Assets}}/js/tools/web3/invoice.js",
			css: ["{{Assets}}/css/tools/web3/invoice.css", "{{Q}}/css/bootstrap-custom/bootstrap.css"],
			text: ["Assets/content", "Assets/web3/invoice"]
		},
		"Assets/web3/balance": {
			js: "{{Assets}}/js/tools/web3/balance.js",
			css: "{{Assets}}/css/tools/web3/balance.css"
		},
		"Assets/credits/balance": {
			js: "{{Assets}}/js/tools/credits/balance.js",
			css: "{{Assets}}/css/tools/credits/balance.css"
		},
		"Assets/web3/coin/presale/admin": {
			js: [
				"{{Assets}}/js/tools/web3/coin/presale/admin.js",
				'{{Q}}/pickadate/picker.js',
				'{{Q}}/pickadate/picker.date.js'
			],
			css: [
				"{{Assets}}/css/tools/web3/coin/presale/admin.css", 
                "{{Q}}/css/bootstrap-custom/bootstrap.css",
				'{{Q}}/pickadate/themes/default.css',
				'{{Q}}/pickadate/themes/default.date.css'
			]
		},
		"Assets/web3/coin/presale/buy": {
			js: "{{Assets}}/js/tools/web3/coin/presale/buy.js",
			css: ["{{Assets}}/css/tools/web3/coin/presale/buy.css", "{{Q}}/css/bootstrap-custom/bootstrap.css"]
		},
		"Assets/web3/coin/presale/manage": {
			js: "{{Assets}}/js/tools/web3/coin/presale/manage.js",
			css: ["{{Q}}/css/bootstrap-custom/bootstrap.css"]
		},
		"Assets/web3/coin/admin": {
			js: "{{Assets}}/js/tools/web3/coin/admin.js",
			css: ["{{Assets}}/css/tools/web3/coin/admin.css", "{{Q}}/css/bootstrap-custom/bootstrap.css"]
		},
		"Assets/web3/coin/staking/start": {
			js: "{{Assets}}/js/tools/web3/coin/staking/start.js",
			css: ["{{Assets}}/css/tools/web3/coin/staking/start.css", "{{Q}}/css/bootstrap-custom/bootstrap.css"],
            text: ["Assets/content", "Assets/web3/coin/staking/start"]
		},
		"Assets/web3/coin/staking/history": {
			js: "{{Assets}}/js/tools/web3/coin/staking/history.js",
			css: "{{Assets}}/css/tools/web3/coin/staking/history.css"
		},
		"Assets/fundraise": {
			js: "{{Assets}}/js/tools/fundraise.js",
			css: "{{Assets}}/css/tools/AssetsFundraise.css"
		}
	});
    
	Q.onInit.add(function () {
		// preload this, so it's available on gesture handlers
		Q.Text.get('Assets/content', function (err, text) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return console.warn("Assets/text: " + msg);
			}

			Assets.texts = text;
		});

		Q.extend(Q.Users.Web3.chains, Q.Assets.Web3.chains);

		// Listen for Assets/credits stream changes to update Q.Assets.Credits on client.
		// and listem messages to show Q.Notices
		var _listenUserStream = function () {
			Assets.Credits.getStream(function (err) {
				if (err) {
					return;
				}

				this.onFieldChanged('attributes').set(function (fields, k) {
					if (!fields[k]) {
						return;
					}

					try {
						Assets.Credits.amount = JSON.parse(fields[k]).amount;
						Q.handle(Assets.onCreditsChanged, null, [Assets.Credits.amount]);
					} catch (e) {}
				}, 'Assets');

				var _createNotice = function (message) {
					// check if message already displayed
					var messageId = message.getInstruction('messageId') || message.getInstruction('token');
					if (Q.isEmpty(this.usedIds)) {
						this.usedIds = [messageId];
					} else if (this.usedIds.includes(messageId)) {
						return;
					} else {
						this.usedIds.push(messageId);
					}

					var reason = message.getInstruction('reason');
					var content = message.content;
					if (reason) {
						content += '<br>' + reason;
					}

					var timeout = message.getInstruction('timeout') || 5;

					var options = {
						content: content,
						timeout: timeout,
						group: reason || null,
						handler: function () {
							if (content.includes("credit") || reason.includes("credit")) {
								Q.handle(Q.url("me/credits"));
							}
						}
					};

					Q.handle(Assets.onBeforeNotice, message, [options]);

					Q.Notices.add(options);
				};
				this.onMessage('Assets/credits/received').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/sent').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/spent').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/granted').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/bought').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/bonus').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/alert').set(_createNotice, 'Assets');
			}, {
				retainWith: true
			});
		};

		_listenUserStream();

		Users.onLogin.set(function (user) {
			if (!user) { // the user changed
				return;
			}

			_listenUserStream();
		}, "Assets");

	}, 'Assets');

	function _error(message, code) {
		var err = new Q.Error(message);
		if (code) {
			err.code = code;
		}
		console.warn(err);
		return err;
	}
    
	if (window.location.href.indexOf('browsertab=yes') !== -1) {
		window.onload = function() {
			var params = new URLSearchParams(document.location.href);
			try {
				var paymentOptions = JSON.parse(params.get('paymentOptions'));
			} catch(err) {
				console.warn("Undefined payment options");
				throw(err);
			}

			if (Q.isEmpty(paymentOptions)) {
				return console.warn("Undefined payment options");
			}

			var scheme = params.get('scheme');

			// need Stripe lib for safari browserTab
			Assets.Payments.load(function () {
				Assets.Payments.stripe(paymentOptions, function () {
					if (scheme) {
						location.href = scheme;
					} else {
						window.close();
					}
				});
			});
		};
	}

	// catch Assets/connected request and rewrite handler to open new tab
	Q.Tool.onActivate('Q/tabs').set(function () {
		// only for main Q/tabs tool from dashboard
		if (!$(this.element).closest("#dashboard").length) {
			return;
		}

		this.state.beforeSwitch.set(function (tab, href) {
			if (!href || !href.includes("Assets/connected")) {
				return true;
			}

			var $tab = $(tab);

			$tab.addClass("Q_working");

			Q.req(href, "content", function (err, data) {
				$tab.removeClass("Q_working");

				var fem = Q.firstErrorMessage(err, data);
				if (fem) return Q.alert(fem);

				var redirectUrl = Q.getObject("slots.content.redirectUrl", data);

				if (!redirectUrl) {
					Q.alert("Assets/connected: invalid url");
				}

				Q.openUrl(redirectUrl);
			});

			return false;
		}, 'Assets');
	}, 'Assets');

	// columns settings
	var co = {
		scrollbarsAutoHide: false,
		handlers: {
			billing: "{{Assets}}/js/columns/billing.js",
			subscription: "{{Assets}}/js/columns/subscription.js",
			plan: "{{Assets}}/js/columns/plan.js",
			services: "{{Assets}}/js/columns/services.js"
		}
	};
	if (Q.info.isMobile) {
		co.back = {src: "Q/plugins/Q/img/x.png"};
	}
	Q.Tool.define.options('Q/columns', co);

	// selectors
	$('body').off(Q.Pointer.fastclick, ".Assets_plan_preview_tool[data-onInvoke=openTool]").on(Q.Pointer.fastclick, ".Assets_plan_preview_tool[data-onInvoke=openTool]", function () {
		var tool = Q.Tool.from(this, "Assets/plan/preview");
		if (!tool) {
			return console.warn("Assets/plan/preview tool not found");
		}
		var stream = tool.stream;
		var publisherId = stream.fields.publisherId;
		var streamName = stream.fields.name;

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
			name: 'Assets/plan',
			url: Q.url("Assets/plan/" + publisherId + "/" + streamName.split("/").pop()),
			className: 'Assets_subscription_plan',
			onActivate: function (element) {

			}
		});
	});

})(Q, Q.plugins.Assets, Q.plugins.Streams, jQuery);