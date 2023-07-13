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
 * @param {Q.Event} [options.onChainChange] - on chain start to change
 * @param {Q.Event} [options.onChainChanged] - on chain changed
 */
Q.Tool.define("Assets/web3/balance", function (options) {
	var tool = this;
	tool.usingWeb3 = !Q.isEmpty(Q.getObject("Web3.chains", Users));

	if (tool.usingWeb3) {
		Users.Web3.connect(function (err, provider) {
			if (err) {
				// some error occur during Web3.connect or user closed modal
				tool.usingWeb3 = false;
			}
			Users.Web3.onAccountsChanged.set(tool.refresh.bind(tool), tool);
			tool.refresh();
		});
	} else {
		tool.refresh();
	}
},

{ // default options here
	walletAddress: null,
	chainId: null,
	tokenAddresses: null,
	template: "Assets/web3/balance/select",
	onRefresh: new Q.Event(),
	onChainChange: new Q.Event(),
	onChainChanged: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var $toolElement = $(tool.element);
		var state = tool.state;
		var loggedInWalletAddress = Users.Web3.getLoggedInUserXid();
		var _getWalletAddress = function (callback) {
			if (state.walletAddress) {
				return Q.handle(callback, null, [state.walletAddress]);
			}

			Users.Web3.getWalletAddress().then(function (address) {
				return Q.handle(callback, null, [address]);
			});
		};
		var _renderTemplate = function (walletAddress) {
			Q.Template.render("Assets/web3/balance", {
				chainId: walletAddress ? state.chainId : null,
				chains: walletAddress ? Users.Web3.chains : []
			}, function (err, html) {
				Q.replace(tool.element, html);

				if (state.chainId) {
					tool.balanceOf(walletAddress, state.chainId);
				} else {
					$("select[name=chains]", tool.element).on("change", function () {
						var chainId = $(this).val();
						$toolElement.addClass("Q_disabled");
						Q.handle(state.onChainChange, tool, [chainId]);
						tool.balanceOf(walletAddress, chainId);
					}).trigger("change");
				}
			});
		};

		if (tool.usingWeb3) {
			_getWalletAddress(function (walletAddress) {
				_renderTemplate(walletAddress);
			});
		} else {
			_renderTemplate();
		}
	},
	balanceOf: function (walletAddress, chainId) {
		var tool = this;
		var $toolElement = $(tool.element);
		var state = this.state;
		var _parseAmount = function (amount) {
			return parseFloat(parseFloat(ethers.utils.formatUnits(amount)).toFixed(12));
		};

		if (!chainId) {
			$toolElement.removeClass("Q_disabled");
			Q.handle(state.onChainChanged, tool, [chainId]);
			return Q.Template.render("Assets/web3/balance/credits", {}, function (err, html) {
				if (err) {
					return;
				}

				Q.replace($(".Assets_web3_balance_select", tool.element)[0], html);
				Q.activate(tool.element);
				Q.handle(state.onRefresh, tool);
			});
		}

		Users.init.web3(function () { // to load ethers.js
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

				Q.Template.render(state.template, {
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
	<option value="">{{transfer.AppCredits}}</option>
</select>{{/if}}
<div class="Assets_web3_balance_select"></div>`, {text: ['Assets/content']});

Q.Template.set('Assets/web3/balance/list',
`{{#each results}}
	<div data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}" data-address="{{this.tokenAddress}}">{{this.tokenName}} {{this.tokenAmount}}</div>
{{/each}}`);

Q.Template.set('Assets/web3/balance/credits',
`{{credits.Credits}} {{&tool "Assets/credits/balance"}}`, {text: ['Assets/content']});

Q.Template.set('Assets/web3/balance/select',
`<select name="tokens" data-count="{{results.length}}">
	{{#each results}}
		<option data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}" data-address="{{this.tokenAddress}}" data-decimals="{{this.decimals}}">{{this.tokenName}} {{this.tokenAmount}}</option>
	{{/each}}
</select>`);

})(window, Q, jQuery);