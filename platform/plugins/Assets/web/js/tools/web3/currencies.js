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
 * @param {String} [options.currency] -initial selected currency
 * @param {String} [options.chainId] - chain id
 * @param {Q.Event} [options.onChoose] - event occur when currency selected
 * @param {String} [options.className] - optional class name to add to select
 */

Q.Tool.define("Assets/web3/currencies", function (options) {
	var tool = this;
	var state = this.state;

	tool.refresh();

},

{ // default options here
	currency: null,
	chainId: null,
	fieldName: "currency",
	className: null,
	onChoose: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = this.state;
		var tokens = {};
		if (state.chainId) {
			_doRender(state.chainId);
		} else {
			Q.Users.Web3.getChainId().then(_doRender);
		}
			
		function _doRender(chainId) {
			state.chainId = chainId;
			var tokens = Assets.Currencies.Web3.getTokens(chainId);
	
			Q.Template.render("Assets/web3/currencies", {
				tokens: tokens,
				fieldName: state.fieldName
			}, function (err, html) {
				tool.element.innerHTML = html;
	
				var $select = $("select[name=currency]", tool.element);
				if (tool.currency) {
					$select.val(tool.currency);
				}
				if (state.className) {
					$select.addClass(state.className);
				}
							
				$select.on("change", function () {
					state.currency = tokens[$select.val()];
					Q.handle(state.onChoose, tool, [null, state.currency]);
				});
				Q.handle(state.onChoose, tool, [null, tokens[$select.val()]]);
			});
		}
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