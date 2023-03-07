(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var NFT = Assets.NFT.Web3;

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

	if (Q.isEmpty(state.xid)) {
		return console.warn("xid not found");
	}

	if (Q.isEmpty(state.chainId)) {
		return console.warn("chain not found");
	}
	
	if (!state.communityCoinAddress) {
		return console.warn("CommunityCoin contract not found");
	}

	if (!state.abiPath) {
		return console.warn("abiPath not found");
	}

	tool.refresh();
},

{ // default options here
	chainId: Q.getObject("NFT.defaultChain.chainId", Assets),
	contractAddress: null,
	interval: 10, // in seconds
	xid: Q.Users.Web3.getLoggedInUserXid(),
	communityCoinAddress: Q.getObject("NFT.defaultChain.contracts.CommunityCoin.instance", Assets),
	abiPath: "Assets/templates/R3/CommunityCoin/contract"
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		state.intervalId = setInterval(function x () {
			tool.balanceOf(function (tokensAmount, tokenName) {
				tool.element.innerHTML = tokensAmount + " " + tokenName;
			});
			return x;
		}(), state.interval*1000);
	},
	balanceOf: function (callback) {
		var tool = this;
		var state = this.state;

		Q.handle(NFT.balanceOf, tool, [state.xid, state.chainId, function (err, tokensAmount, tokenName, contract) {
			if (err) {
				return console.warn(err);
			}

			Q.handle(callback, null, [tokensAmount, tokenName]);
		}, {
			contractAddress: state.communityCoinAddress,
			abiPath: state.abiPath
		}]);
	},
	Q: {
		beforeRemove: function () {
			this.state.intervalId && clearInterval(this.state.intervalId);
		}
	}
});

})(window, Q, jQuery);