(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var Web3 = Assets.Currency.Web3;

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

	if (Q.isEmpty(state.userId)) {
		return console.warn("userId not found");
	}

	if (Q.isEmpty(state.chainId)) {
		return console.warn("chain not found");
	}
	
	tool.refresh();
},

{ // default options here
	userId: Q.Users.loggedInUserId(),
	chainId: null,
	tokenAddresses: null,
	template: "Assets/web3/balance/select"
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		tool.element.innerHTML = "";
		tool.balanceOf(function (results) {
			Q.Template.render(state.template, {
				results: results
			}, function (err, html) {
				if (err) {
					return;
				}

				Q.replace(tool.element, html);
			});
		});
	},
	balanceOf: function (callback) {
		var tool = this;
		var state = this.state;

		Q.handle(Web3.balanceOf, tool, [state.userId, state.chainId, function (err, balance) {
			if (err) {
				return console.warn(err);
			}

			var results = [];
			Q.each(balance, function (i, item) {
				var amount = parseFloat(ethers.utils.formatUnits(item.balance)).toFixed(12);

				results.push({
					tokenAmount: parseFloat(amount),
					tokenName: item.name
				});
			});

			Q.handle(callback, null, [results]);
		}, {
			tokenAddresses: state.tokenAddresses
		}]);
	},
	getValue: function () {
		var $selectedOption = $("select[name=tokens]", this.element).find(":selected");
		if (!$selectedOption.length) {
			return null;
		}

		return {
			amount: $selectedOption.attr("data-amount"),
			name: $selectedOption.attr("data-name")
		};
	},
	Q: {
		beforeRemove: function () {
			this.state.intervalId && clearInterval(this.state.intervalId);
		}
	}
});

Q.Template.set('Assets/web3/balance/list',
`{{#each results}}
	<div data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}">{{this.tokenAmount}} {{this.tokenName}}</div>
{{/each}}`
);

Q.Template.set('Assets/web3/balance/select',
`<select name="tokens" data-count="{{results.length}}">
	{{#each results}}
		<option data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}">{{this.tokenAmount}} {{this.tokenName}}</option>
	{{/each}}
</select>`
);

})(window, Q, jQuery);