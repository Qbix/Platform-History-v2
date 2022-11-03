(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

var Assets = Q.Assets;
var NFT = Assets.NFT;

/**
 * Return currencies available for chain.
 * @class Assets web3/currencies
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {string} [options.currency] -initial selected currency
 * @param {string} [options.chainId] - chain id
 * @param {Q.Event} [options.onChoose] - event occur when currency selected
 */

Q.Tool.define("Assets/web3/currencies", function (options) {
	var tool = this;
	var state = this.state;

	if (!state.chainId) {
		throw new Q.Exception("chainId required");
	}

        tool.refresh();

},

{ // default options here
        currency: null,
	chainId: null,
        fieldName: "currency",
	onChoose: new Q.Event()
},

{ // methods go here
	/**
	 * Refresh tool
	 * @static
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var tokens = {};
		Q.each(Assets.currencies.tokens, function (i, obj) {
			var token = Q.getObject(state.chainId, obj);
			if (!token) {
				return;
			}

			tokens[obj.symbol] = {
				symbol: obj.symbol,
				name: obj.name,
				decimals: obj.decimals,
				token: token
			};
		});


		Q.Template.render("Assets/web3/currencies", {
			tokens: tokens,
                        fieldName: state.fieldName
		}, function (err, html) {
			tool.element.innerHTML = html;

			var $select = $("select[name=currency]", tool.element);
                        if (tool.currency) {
                            $select.val(tool.currency);
                        }
                        
			$select.on("change", function () {
                                state.currency = tokens[$select.val()];
				Q.handle(state.onChoose, tool, [null, state.currency]);
			});
			Q.handle(state.onChoose, tool, [null, tokens[$select.val()]]);

		});
	},
	/**
	 * Get currently selected currency
	 * @static
	 * @method getValue
	 * @return {Object}
	 */
	getValue: function () {
		return this.currencies[$("select[name=currency]", this.element).val()];
	}
});

Q.Template.set("Assets/web3/currencies",
            `<select name="{{fieldName}}">
                <option disabled selected value="">{{currencies.choose}}</option>
		{{#each tokens}}
			<option value="{{token}}">{{@key}}</option>
		{{/each}}
		</select>`,
	{text: ['Assets/content']}
);

})(window, Q, jQuery);