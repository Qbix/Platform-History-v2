(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;

/**
 * Show balance of tokens by chain and token
 * @class Assets web3/balance
 * @constructor
 * @param {Object} options Override various options for this tool
 */
Q.Tool.define("Assets/web3/balance", function (options) {
	var tool = this;
	var state = this.state;
	var loggedInUser = Q.Users.loggedInUser;
	if (!loggedInUser) {
		return console.warn("user not logged in");
	}

	tool.loggedInUserXid = Q.Users.Web3.getLoggedInUserXid();

	if (Q.isEmpty(state.userId)) {
		return console.warn("userId not found");
	}

	tool.refresh();
},

{ // default options here
	userId: Q.Users.loggedInUserId(),
	chainId: null,
	tokenAddresses: null,
	template: "Assets/web3/balance/select",
	onRefresh: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		Q.Template.render("Assets/web3/balance", {
			chainId: state.chainId,
			chains: Assets.Web3.chains
		}, function (err, html) {
			Q.replace(tool.element, html);

			if (state.chainId) {
				tool.balanceOf();
			} else {
				$("select[name=chains]", tool.element).on("change", function () {
					state.chainId = $(this).val();
					$("select[name=tokens]", tool.element).addClass("Q_disabled");
					tool.balanceOf();
				}).trigger("change");
			}
		});
	},
	balanceOf: function (callback) {
		var tool = this;
		var state = this.state;
		var _parseAmount = function (amount) {
			return parseFloat(parseFloat(ethers.utils.formatUnits(amount)).toFixed(12));
		};

		Q.Users.init.web3(function () { // to load ethers.js
			Q.handle(Assets.Currencies.balanceOf, tool, [state.userId, state.chainId, function (err, balance) {
				if (err) {
					return console.warn(err);
				}
	
				var results = [];
				Q.each(balance, function (i, item) {
					var amount = _parseAmount(item.balance);
	
					if (parseInt(item.token_address) > 0) {
						// listen transfer event
						Q.Users.Web3.getContract("Assets/templates/R1/CommunityCoin/contract", {
							chainId: state.chainId,
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
					}
	
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
		var $selectedOption = $("select[name=tokens]", this.element).find(":selected");
		if (!$selectedOption.length) {
			return null;
		}

		return {
			chainId: this.state.chainId,
			tokenAmount: $selectedOption.attr("data-amount"),
			tokenName: $selectedOption.attr("data-name"),
			tokenAddress: $selectedOption.attr("data-address"),
			decimals: $selectedOption.attr("data-decimals")
		};
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
</select>{{/if}}
<div class="Assets_web3_balance_select"></div>`);

Q.Template.set('Assets/web3/balance/list',
`{{#each results}}
	<div data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}" data-address="{{this.tokenAddress}}">{{this.tokenName}} {{this.tokenAmount}}</div>
{{/each}}`);

Q.Template.set('Assets/web3/balance/select',
`<select name="tokens" data-count="{{results.length}}">
	{{#each results}}
		<option data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}" data-address="{{this.tokenAddress}}" data-decimals="{{this.decimals}}">{{this.tokenName}} {{this.tokenAmount}}</option>
	{{/each}}
</select>`);

})(window, Q, jQuery);