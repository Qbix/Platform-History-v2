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

	tool.refresh();
},

{ // default options here
	chainId: null,
	contractAddress: null,
	xid: Q.Users.Web3.getLoggedInUserXid()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		Q.handle(NFT.balanceOf, tool, [state.xid, state.chainId, function (err, tokensAmount) {
			if (err) {
				return;
			}

			debugger;
		}]);
	}
});

})(window, Q, jQuery);