(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;

/**
 * List of owned NFTs
 * @class Assets NFT/owned
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {string} options.accountAddress - either this or userId is required
 * @param {string} options.userId - either this or accountAddress is required
 * @param {string} [options.contractAddress] - Can override address of the NFT contract.
 *    By default takes it from Q.Assets.NFT.Web3.chains[currentChainId].contract
 * @param {string} [options.chainId] - by default, it will use the currently selected chain in the client
 * @param {string} [options.pathABI] - override NFT contract ABI template, if necessary
 * @param {boolean} [options.skipCache=false] - whether to use cache for Web3 requests
 */

Q.Tool.define("Assets/NFT/owned", function (options) {
	this.refresh();
},

{ // default options here
	owner: {
		userId: null,
		accountAddress: null,
	},
	holder: {
		contractAddress: null,
		pathABI: "Assets/templates/R1/NFT/sales/contract"
	},
	chainId: null,
	contractAddress: null,
	pathABI: "Assets/templates/R1/NFT/contract",
	skipCache: false,
	limit: 10
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = this.state;

		new Promise(function (resolve, reject) {
			if (state.chainId) {
				resolve(state.chainId);
			} else {
				resolve(Q.Users.Web3.getChainId());
			}
		}).then(function (chainId) {
			state.chainId = chainId;
			var chains = Q.Assets.NFT.Web3.chains;
			if (!chains[chainId] || !chains[chainId].contract) {
				throw new Q.Exception("Assets/NFTowned: missing Q.Assets.NFT.Web3.chains[" + currentChainId + '].contract');
			}
			return chains[chainId].contract;
		}).then(function (contractAddress) {
			state.contractAddress = contractAddress;

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

			if (!offset && Q.isEmpty(NFTResults)) {
				$(tool.element).attr("data-empty", true).html(tool.text.NFT.NoNFTyet);
			}

			Q.each(NFTResults, function (index, result) {
				$("<div>").appendTo(tool.element).tool("Assets/NFT/preview", {
					tokenId: result.tokenId,
					tokenURI: result.tokenURI,
					secondsLeft: result.secondsLeft,
					owner: result.owner,
					ownerUserId: result.ownerUserId,
					metadata: result.metadata,
					chainId: state.chainId,
					contractAddress: state.contractAddress
				}).activate();
			});

			Q.handle(callback);
		}, {
			fields: {
				owner: state.owner,
				holder: state.holder,
				chainId: state.chainId,
				contractAddress: state.contractAddress,
				pathABI: state.pathABI,
				skipCache: state.skipCache,
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