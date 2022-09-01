(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var Web3 = Assets.Web3;
var NFT = Web3.NFT;

/**
 * List of owned NFTs
 * @class Assets NFT/owned
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {string} [options.userId] - registered in app user id
 * @param {string} [options.walletAddress] - override users wallet address
 * @param {string} [options.chainId] - override chain id
 * @param {string} [options.contractAddress] - override contract address
 */

Q.Tool.define("Assets/NFT/owned", function (options) {
	var tool = this;
	var state = this.state;

	if (!state.userId) {
		return console.warn("user id required");
	}

	var pipe = Q.pipe(['styles', 'texts'], function () {
		tool.refresh();
	});

	Q.addStylesheet('{{Assets}}/css/tools/NFT/owned.css', pipe.fill("styles"), { slotName: 'Assets' });
	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.NFT;
		pipe.fill("texts")();
	});
},

{ // default options here
	userId: null,
	walletAddress: null,
	chainId: null,
	contractAddress: null,
	limit: 10
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = this.state;

		// add composer
		//tool.createComposer();

		var _onInvoke = function () {
			var offset = $(">.Assets_NFT_preview_tool:not(.Assets_NFT_composer):visible", tool.element).length;
			var infiniteTool = this;

			// skip duplicated (same offsets) requests
			if (!isNaN(infiniteTool.state.offset) && infiniteTool.state.offset >= offset) {
				return;
			}

			infiniteTool.setLoading(true);
			infiniteTool.state.offset = offset;
			tool.loadMore(offset, function () {
				infiniteTool.setLoading(false);
			});
		};
		var $scrollingParent = $(tool.element.scrollingParent());
		var infiniteTool = Q.Tool.from($scrollingParent, "Q/infinitescroll");
		if (infiniteTool) {
			infiniteTool.state.offset = undefined;
			infiniteTool.state.onInvoke.set(_onInvoke, tool);
			$scrollingParent.trigger("scroll");
			return;
		}

		$scrollingParent.tool('Q/infinitescroll').activate(function () {
			this.state.onInvoke.set(_onInvoke, tool);
			$scrollingParent.trigger("scroll");
		});
	},
	/**
	 * Load state.limit NFTs starting from offset
	 * @method loadMore
	 * @param {number} offset - already loaded amount
	 * @param {function} callback
	 */
	loadMore: function (offset, callback) {
		var tool = this;
		var state = this.state;

		var $loading = $("<img src='" + Q.url("{{Q}}/img/throbbers/loading.gif") + "' />").appendTo(tool.element);

		Q.req("Assets/NFT", "owned", function (err, response) {
			$loading.remove();
			if (err) {
				return console.warn(err);
			}

			var NFTResults = response.slots.owned;

			Q.each(NFTResults, function (index, result) {
				$("<div>").appendTo(tool.element).tool("Assets/NFT/preview", result).activate();
			});

			Q.handle(callback);
		}, {
			fields: {
				userId: state.userId,
				walletAddress: state.walletAddress,
				chainId: state.chainId,
				contractAddress: state.contractAddress,
				offset: offset,
				limit: state.limit
			}
		});
	},
	/**
	 * Create Assets/NFT/preview in composer mode.
	 * @method createComposer
	 */
	createComposer: function () {
		var tool = this;
		var state = this.state;

		// if composer already exists
		if ($(".Assets_NFT_composer", tool.element).length) {
			return;
		}

		$("<div>").prependTo(tool.element).tool("Assets/NFT/preview", {
			composer: true,
			userId: state.userId,
			onCreated: function () {
				tool.createComposer();
			}
		}, state.userId + "-" + Date.now()).activate();
	}
});

})(window, Q, jQuery);