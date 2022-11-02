(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var NFT = Assets.NFT;

/**
 * Return currencies available for chain.
 * @class Assets NFT/currencies
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {string} [options.chainId] - chain id
 * @param {Q.Event} [options.onChoose] - event occur when currency selected
 */

Q.Tool.define("Assets/NFT/currencies", function (options) {
	var tool = this;
	var state = this.state;

	if (!state.chainId) {
		throw new Q.Exception("chainId required");
	}

	var pipe = Q.pipe(['styles'], function () {
		tool.refresh();
	});

	Q.addStylesheet('{{Assets}}/css/tools/NFT/currencies.css', pipe.fill("styles"), { slotName: 'Assets' });
},

{ // default options here
	chainId: null,
	onChoose: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = this.state;
		var currencies = {};
		Q.each(NFT.currencies, function (i, obj) {
			var token = Q.getObject(state.chainId, obj);
			if (!token) {
				return;
			}

			currencies[obj.symbol] = {
				symbol: obj.symbol,
				name: obj.name,
				decimals: obj.decimals,
				token: token
			};
		});

		Q.Template.render("Assets/NFT/currencies", {
			currencies: currencies
		}, function (err, html) {
			tool.element.innerHTML = html;

			var $select = $("select[name=currency]", tool.element);
			$select.on("change", function () {
				Q.handle(state.onChoose, tool, [null, currencies[$select.val()]]);
			});
			Q.handle(state.onChoose, tool, [null, currencies[$select.val()]]);
		});
	}
});

Q.Template.set("Assets/NFT/currencies",
`<select name="currency">
		{{#each currencies}}
			<option value="{{@key}}">{{@key}}</option>
		{{/each}}
		</select>`,
	{text: ['Assets/content']}
);

})(window, Q, jQuery);