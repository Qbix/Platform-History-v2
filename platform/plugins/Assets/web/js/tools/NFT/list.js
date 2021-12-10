(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var Web3 = Assets.Web3;
var NFT = Web3.NFT;

/**
 * UI for credits and charges
 * @class Assets NFT/list
 * @constructor
 * @param {Object} options Override various options for this tool
 */

Q.Tool.define("Assets/NFT/preview", function (options) {
	var tool = this;
	var state = this.state;

	if (!Q.Users.loggedInUser) {
		return console.warn("user not logged in");
	}

	var pipe = Q.pipe(['styles', 'texts'], function () {
		tool.refresh();
	}); //tool.refresh.bind(tool)

	Q.addStylesheet('{{Assets}}/css/tools/NFT/list.css', pipe.fill("styles"), { slotName: 'Assets' });
	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.NFT.list;
		pipe.fill("texts")();
	});
},

{ // default options here
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		Q.handle(NFT.balanceOf, tool, [window.ethereum.selectedAddress, window.ethereum.chainId, function (err, tokensAmount) {
			if (err) {
				return;
			}


		}]);
	}
});

})(window, Q, jQuery);