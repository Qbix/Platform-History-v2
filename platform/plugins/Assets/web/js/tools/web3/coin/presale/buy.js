(function (window, Q, $, undefined) {
	
	/**
	 * @module Assets
	 */
	var Assets = Q.Assets;
	/**
	 * @module Users
	 */
	var Users = Q.Users;
	
	/**
	* buying tokens via fundContract
	* @constructor
	* @param {Object} options Override various options for this tool
	* @param {String} [options.abiPathF] optional(see default value) ABI path for FundContractFactory contract
	* @param {String} [options.abiPath] optional(see default value) ABI path for FundContract contract
	* @param {String} [options.chainId] chainId
	* @param {String} [options.fund] optional. FundContract's address 
	*	if present tool render input field and button buy
	*	if not - tool rednder select with all available fund for this App (all in Fund contract linked with this App)
	* @param {bool} [options.showShortInfo] showing short info about choosen fund
	*/
	Q.Tool.define("Assets/web3/coin/presale/buy", function (options) {
		var tool = this;
		var state = this.state;
		
		
		
		var loggedInUser = Q.Users.loggedInUser;
		if (!loggedInUser) {
			return console.warn("user not logged in");
		}

		tool.loggedInUserXid = Q.Users.Web3.getLoggedInUserXid();
		// really strange thing in contract. especially for ratio ETH/token when 1 ETH is a 10**18
		tool.priceDenom = 100000000; //1*10**8;

		if (Q.isEmpty(tool.loggedInUserXid)) {
			return console.warn("user not found");
		}
		
		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}
		
		tool.refresh();
	},
	{ // default options here
		abiPathF: "Assets/templates/R1/Fund/factory",
		abiPath: "Assets/templates/R1/Fund/contract",
		chainId: null,
		fund: null,
		showShortInfo: false,
	},
	{ // methods go here
		renderShortInfo: function($selectOption){
			var tool = this;
			var state = tool.state;
			
			var nativeCoin;

			Q.each(Assets.currencies.tokens, function () {
				var addr = this[state.chainId];
				if (addr && addr == Assets.Web3.constants.zeroAddress) {
					nativeCoin = this['symbol'];
					return;
				}
			});

			Q.Template.render("Assets/web3/coin/presale/buy_short", {
				fundContract: $selectOption.val(),
				sellingToken: $selectOption.data('erc20token'),
				sellingToken_name: $selectOption.data('erc20token_name'),
				sellingToken_symbol: $selectOption.data('erc20token_symbol'),
				nativeCoin: nativeCoin,
				//nativeCoinBalance
				currentPrice: $selectOption.data('currentprice'),
				inWhitelist: $selectOption.data('inwhitelist')
			}, function (err_shortInfo, html_shortInfo) {
				Q.replace($('.Assets_web3_coin_presale_buy_shortInfo', tool.element)[0], html_shortInfo);
			});
			
		},
		refresh: function() {
			var tool = this;
			var state = tool.state;
			
			Assets.Funds._getAll(
				state.chainId, 
				state.abiPathF, 
			).then(function(instances){
				var p = [];
				for (var i in instances) {
					p.push(Assets.Funds._getFundConfig(instances[i].value, state.chainId, ethers.utils.getAddress(tool.loggedInUserXid)));
				}
				return Promise.allSettled(p);
			}).then(function(configsData){
				var adjustFundConfig = [];

				for (var i in configsData) {
					adjustFundConfig.push(Assets.Funds.adjustFundConfig(configsData[i].value, {priceDenom: tool.priceDenom}));
				}
				
				var isShortVersion = Q.isEmpty(state.fund) ? false: true;
				
				var nativeCoin;

				Q.each(Assets.currencies.tokens, function (address) {
					var addr = this[state.chainId];
					if (addr && addr == Assets.Web3.constants.zeroAddress) {
						nativeCoin = this['symbol'];
						return;
					}
				});
							
				Assets.Currencies.balanceOf(tool.loggedInUserXid, state.chainId, function (err, moralisBalance) {
					
				
					Q.Template.render("Assets/web3/coin/presale/buy", {
						data: adjustFundConfig,
						//nativeCoinPlaceholder: tool.text.coin.presale.buy.form.placeholders.amount.interpolate({nativeCoin: nativeCoin}),
						nativeCoin: nativeCoin,
						nativeCoinBalance: parseFloat(parseFloat(ethers.utils.formatUnits(moralisBalance[0].balance)).toFixed(12)),
						short: isShortVersion,
						showShortInfo: state.showShortInfo
					}, function (err, html) {
						Q.replace(tool.element, html);


						if (isShortVersion) {
							$('select[name=funds]', tool.element).val(state.fund);
						}
						
						if (state.showShortInfo) {
							var $opt = $('select[name=funds] option[value='+state.fund+']', tool.element);
							tool.renderShortInfo($opt);
						}
						
						$("select[name=funds]", tool.element).off('change').on('change', function (e) {
							var $selectedOption = $("option:selected", this);
							tool.renderShortInfo($selectedOption);
						}).trigger('change');

						$("button[name=buy]", tool.element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {

							tool.element.addClass("Q_working");

							var fundSelected = $('select[name=funds]', tool.element).val();
							var sellingERC20 = $('select[name=funds] option[value='+fundSelected+']', tool.element).data('erc20token');
							var amount = $('input[name=amount]', tool.element).val();

							var validated = true;

							if (
								Q.Users.Web3.validate.notEmpty(fundSelected) && 
								Q.Users.Web3.validate.address(fundSelected)
							) {
							//
							} else {
								Q.Notices.add({
									content: "Fund invalid",
									timeout: 5
								});
								validated = false;
							}
							if (
								Q.Users.Web3.validate.notEmpty(sellingERC20) && 
								Q.Users.Web3.validate.address(sellingERC20)
							) {
							//
							} else {
								Q.Notices.add({
									content: "Token invalid",
									timeout: 5
								});
								validated = false;
							}

							if (
								Q.Users.Web3.validate.notEmpty(amount)
							) {
							//
							} else {
								Q.Notices.add({
									content: "Amount invalid",
									timeout: 5
								});
								validated = false;
							}

							var closeHandler = function(){
								tool.element.removeClass("Q_working");

							}

							if (!validated) {
								closeHandler();
							}

							var fundContract;

							Q.Users.Web3.getContract(
								state.abiPath, 
								{
									contractAddress: fundSelected,
									chainId: state.chainId
								}
							).then(function (fund) {
								fundContract = fund;

								return fund.buy({value: ethers.utils.parseUnits(amount)});
							}).then(function (tx) {
								return tx.wait();
							}).then(function (receipt) {
								if (receipt.status == 0) {
									throw 'Smth unexpected when approve';
								}
							}).catch(function (err) {

								Q.Notices.add({
									content: Q.Users.Web3.parseMetamaskError(err, [fundContract]),
									timeout: 5
								});
							}).finally(function(){
								closeHandler();
							});


						});


					});
				},{tokenAddresses: null});
			});
	

		}
	});
	
	Q.Template.set("Assets/web3/coin/presale/buy",
	`
	<div>
		<div style="margin-bottom:20px; {{#if this.short}}display:none{{/if}}">
			<select name="funds">
			{{#each data}}
			{{#unless this.isOutOfDate}}
			<option value="{{this.fundContract}}" 
				data-erc20token="{{this._sellingToken}}"
				data-erc20token_name="{{this.erc20TokenInfo.name}}"
				data-erc20token_symbol="{{this.erc20TokenInfo.symbol}}"
				data-currentprice="{{this.currentPrice}}"
				data-inwhitelist="{{this.inWhitelist}}"
			>
				{{this.erc20TokenInfo.name}}({{this.erc20TokenInfo.symbol}}) 
				Price = ({{this.currentPrice}}) 
				{{#if this.inWhitelist}}(W){{/if}}
			</option>
			{{/unless}}
			{{/each}}
			</select>
		</div>
	{{#if this.showShortInfo}}
	<div class="Assets_web3_coin_presale_buy_shortInfo">
	</div>
	{{/if}}
	
	
	<div class="form-inline">
		<div class="form-group">
			<input name="amount" type="text" class="form-control" value="" placeholder="{{interpolate coin.presale.buy.form.placeholders.amount nativeCoin}}">
		</div>
		<button class="Q_button" name="buy">{{coin.presale.buy.btns.buy}}</button>
	</div>
	<div class="form">
		<div class="form-group">	
			{{interpolate coin.presale.buy.form.placeholders.max nativeCoinBalance}}
		</div>
	</div>
	
	</div>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy_short",
	`
	<table class="table table-striped">
	<tr><td>fundContract</td><td>{{this.fundContract}}</td></tr>
	<tr><td>SellingToken</td><td>
		<table class="table">
			<tr><td>Address</td><td>{{this.sellingToken}}</td></tr>
			<tr><td>Name</td><td>{{this.sellingToken_name}}</td></tr>
			<tr><td>The Symbol</td><td>{{this.sellingToken_symbol}}</td></tr>
		</table>
	</td></tr>
	<tr><td>Price in {{this.nativeCoin}}</td><td>{{this.currentPrice}}</td></tr>
	<tr><td>inWhitelist</td><td>{{#if this.inWhitelist}}(W){{/if}}</td></tr>
	</table>
	
	`,
		{text: ["Assets/content"]}
	);
//Q.Template.set("Assets/web3/coin/presale/buyForm",
//`
//<div class="form">
//
//	<div class="form-group">
//		<label>{{coin.presale.buy.form.labels.amount}}</label>
//		<input name="amount" type="text" class="form-control" value="" placeholder="{{coin.presale.buy.form.placeholders.amount}}">
//		<small class="form-text text-muted"></small>
//	</div>
//
//	<button class="Q_button" name="execute">{{coin.presale.buy.btns.execute}}</button>
//</div>
//`,
//	{text: ["Assets/content"]}
//);
	
	Q.Template.set("Assets/web3/coin/presale/buy/interface",
	`
		You should need to execute two transactions:<br>

		<table class="table table-stripe">
			<tr>
			<td>Approve {{token_amount}} {{token_symbol}} to the FundContract {{fundname}}</td>
			<td class="steps step1">
				{{> "Assets/web3/coin/presale/buy/interface/asterisk"}}
			</td>
			</tr>
			<tr>
			<td>staking</td>
			<td class="steps step2">
				{{> "Assets/web3/coin/presale/buy/interface/asterisk"}}
			</td>
			</tr>
		</table>
	`,
		{
			text: ["Assets/content"],
			partials:[
				"Assets/web3/coin/presale/buy/interface/check",
				"Assets/web3/coin/presale/buy/interface/asterisk"
			]
		}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/interface/check",
	`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
			<path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
		</svg>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/interface/asterisk",
	`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-asterisk" viewBox="0 0 16 16">
			<path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/>
		</svg>
	`,
		{text: ["Assets/content"]}
	);
})(window, Q, jQuery);
		