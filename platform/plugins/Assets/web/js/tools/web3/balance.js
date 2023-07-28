(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var Users = Q.Users;

/**
 * Show balance of tokens by chain and token
 * @class Assets web3/balance
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {String} [chainId] - if defined there will no chains select created, will be use this chain
 * @param {String} [tokenAddresses] - if defined there will no tokens select created, will be use this tokenAddresses
 * @param {Boolean} [skipWeb3=false] - if true don't request users crypto balance, means only credits transfer
 * @param {Q.Event} [options.onRefresh] - on chain start to change
 * @param {Q.Event} [options.onChainChange] - on chain start to change
 * @param {Q.Event} [options.onChainChanged] - on chain changed
 */
Q.Tool.define("Assets/web3/balance", function (options) {
	var tool = this;
	var state = this.state;
	var loggedInUserId = Users.loggedInUserId();
	var loggedInWalletAddress = Users.Web3.getLoggedInUserXid();

	state.skipWeb3 = state.skipWeb3 || Q.isEmpty(Q.getObject("Web3.chains", Users)) || (loggedInUserId && !loggedInWalletAddress);

	tool.refresh();
},

{ // default options here
	chainId: null,
	skipWeb3: false,
	tokenAddresses: null,
	onRefresh: new Q.Event(),
	onChainChange: new Q.Event(),
	onChainChanged: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		Q.Template.render("Assets/web3/balance", {
			chainId: state.skipWeb3 ? null : state.chainId,
			chains: state.skipWeb3 ? [] : Users.Web3.chains
		}, function (err, html) {
			Q.replace(tool.element, html);

			if (state.chainId) {
				tool.balanceOf(state.chainId);
			} else {
				$("select[name=chains]", tool.element).on("change", function () {
					var chainId = $(this).val();
					Q.handle(state.onChainChange, tool, [chainId]);
					tool.balanceOf(chainId);
				}).trigger("change");
			}
		});
	},
	balanceOf: function (chainId) {
		var tool = this;
		var $toolElement = $(tool.element);
		var state = this.state;

		$toolElement.addClass("Q_disabled");

		var _parseAmount = function (amount) {
			return parseFloat(parseFloat(ethers.utils.formatUnits(amount)).toFixed(12));
		};

		if (!chainId) {
			Q.handle(state.onChainChanged, tool, [chainId]);
			return Q.Template.render("Assets/web3/balance/credits", {}, function (err, html) {
				if (err) {
					return;
				}

				$toolElement.removeClass("Q_disabled");
				Q.replace($(".Assets_web3_balance_select", tool.element)[0], html);
				Q.activate(tool.element);
				Q.handle(state.onRefresh, tool);
			});
		}

		Users.Web3.onAccountsChanged.set(tool.balanceOf.bind(tool, chainId), tool);

		Users.Web3.getWalletAddress().then(function (walletAddress) {
			Q.handle(Assets.Currencies.balanceOf, tool, [walletAddress, chainId, function (err, balance) {
				$toolElement.removeClass("Q_disabled");
				Q.handle(state.onChainChanged, tool, [chainId]);

				if (err) {
					return console.warn(err);
				}

				var results = [];
				Q.each(balance, function (i, item) {
					var amount = _parseAmount(item.balance);

					// commented becasue contract.on send infinite requests to publicRPC url
					//TODO: need to use some third party API to listen contract event
					/*if (parseInt(item.token_address) > 0) {
						// listen transfer event
						Users.Web3.getContract("Assets/templates/R1/CommunityCoin/contract", {
							chainId: chainId,
							contractAddress: item.token_address,
							readOnly: true
						}, function (err, contract) {
							if (err) {
								return;
							}

							contract.on("Transfer", function _assets_web3_balance_listener (from, to, value) {
								if (![from.toLowerCase(), to.toLowerCase()].includes(tool.loggedInUserXid.toLowerCase())) {
									return;
								}

								contract.balanceOf(tool.loggedInUserXid).then(function (balance) {
									balance = _parseAmount(balance);
									$("*[data-address='" + item.token_address + "']", tool.element)
										.attr("data-amount", balance)
										.text(balance + " " + item.name)
								}, function (err) {

								});
							});
						});
					}*/

					results.push({
						tokenAmount: amount,
						tokenName: item.name,
						tokenAddress: item.token_address,
						decimals: item.decimals
					});
				});

				Q.Template.render("Assets/web3/balance/select", {
					results: results
				}, function (err, html) {
					if (err) {
						return;
					}

					Q.replace($(".Assets_web3_balance_select", tool.element)[0], html);
					Q.handle(state.onRefresh, tool);
				});
			}, {
				tokenAddresses: state.tokenAddresses
			}]);
		});
	},
	getValue: function () {
		var tool = this;
		var state = this.state;

		var $selectedOption = $("select[name=tokens]", this.element).find(":selected");
		if ($selectedOption.length) {
			return {
				chainId: state.chainId || $("select[name=chains]", tool.element).val(),
				tokenAmount: $selectedOption.attr("data-amount"),
				tokenName: $selectedOption.attr("data-name"),
				tokenAddress: $selectedOption.attr("data-address"),
				decimals: $selectedOption.attr("data-decimals")
			};
		}

		// for app credits
		var assetsCreditsBalance = Q.Tool.from($(".Assets_credits_balance_tool", tool.element)[0], "Assets/credits/balance");
		if (assetsCreditsBalance) {
			return {
				chainId: null,
				tokenAmount: assetsCreditsBalance.getValue(),
				tokenName: "credits"
			};
		}
	},
	Q: {
		beforeRemove: function () {

		}
	}
});

Q.Template.set('Assets/web3/balance',
`{{#if chainId}}{{else}}<select name="chains">
	{{#each chains}}
		<option value="{{this.chainId}}">{{this.name}}</option>
	{{/each}}
	<option selected value="">{{transfer.AppCredits}}</option>
</select>{{/if}}
<div class="Assets_web3_balance_select"></div>`, {text: ['Assets/content']});

Q.Template.set('Assets/web3/balance/credits',
`{{credits.Credits}} {{&tool "Assets/credits/balance"}}`, {text: ['Assets/content']});

Q.Template.set('Assets/web3/balance/select',
`<select name="tokens" data-count="{{results.length}}">
	{{#each results}}
		<option data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}" data-address="{{this.tokenAddress}}" data-decimals="{{this.decimals}}">{{this.tokenName}} {{this.tokenAmount}}</option>
	{{/each}}
</select>`);

})(window, Q, jQuery);