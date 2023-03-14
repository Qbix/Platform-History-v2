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
	
	if (!state.tokenAddress) {
		return console.warn("CommunityCoin contract not found");
	}

	if (!state.abiPath) {
		return console.warn("abiPath not found");
	}

	tool.refresh();
},

{ // default options here
	userId: Q.Users.loggedInUserId(),
	chainId: Q.getObject("Web3.defaultChain.chainId", Assets),
	contractAddress: null,
	interval: 10, // in seconds
	tokenAddress: Q.getObject("Web3.defaultChain.contracts.CommunityCoin.instance", Assets),
	abiPath: "Assets/templates/R3/CommunityCoin/contract"
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		//state.intervalId = setInterval(function x () {
			tool.element.innerHTML = "";
			tool.balanceOf(function (tokenAmount, tokenName) {
				tool.element.innerHTML += '<div>' + tokenAmount + ' ' + tokenName + '</div>';
			});
		/*	return x;
		}(), state.interval*1000);*/
	},
	balanceOf: function (callback) {
		var tool = this;
		var state = this.state;

		Q.handle(Web3.balanceOf, tool, [state.userId, state.chainId, function (err, balance) {
			if (err) {
				return console.warn(err);
			}

			Q.each(balance, function (i, item) {
				Q.handle(callback, null, [ethers.utils.formatUnits(item.balance), item.name]);
			});
		}, {
			tokenAddress: state.tokenAddress
		}]);
	},
	Q: {
		beforeRemove: function () {
			this.state.intervalId && clearInterval(this.state.intervalId);
		}
	}
});

})(window, Q, jQuery);