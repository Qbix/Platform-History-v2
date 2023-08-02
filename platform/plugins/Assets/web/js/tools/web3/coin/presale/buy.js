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
	*	if not - tool will render select with all available funds for this App (all in Fund contract linked with this App)
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
		
        var pipe = Q.pipe(["text"], function () {});
        Q.Text.get('Assets/web3/coin/presale/buy', function(err, text) {
            tool.text = {
                ...tool.text,
                ...text
            }
            // "Assets/web3/coin/presale/buy" have priority of "Assets/content"
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
        
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

			Q.Template.render("Assets/web3/coin/presale/buy/legend", {
				fundContract: $selectOption.val(),
				sellingToken: $selectOption.data('erc20token'),
				sellingToken_name: $selectOption.data('erc20token_name'),
				sellingToken_symbol: $selectOption.data('erc20token_symbol'),
				nativeCoin: tool.getNativeCoin(),
				currentPrice: $selectOption.data('currentprice'),
				inWhitelist: $selectOption.data('inwhitelist')
			}, function (err_shortInfo, html_shortInfo) {
				Q.replace($('.Assets_web3_coin_presale_buy_legendInfo', tool.element)[0], html_shortInfo);
			});
			
		},
		getNativeCoin: function(){
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
			return nativeCoin;
		},
		updateNativeCoinBalance: function(){
			var tool = this;
			var state = tool.state;
			var $toolElement = $(this.element);
			
			Q.Template.render("Assets/web3/coin/presale/buy/preloader", {
				src: Q.url("{{Q}}/img/throbbers/spinner_snake_small.gif")
			}, function (err, html) {
				Q.replace($toolElement.find('.nativeCoinBalanceHtmlContainer')[0], html);
			});
			
			Assets.Currencies.balanceOf(tool.loggedInUserXid, state.chainId, function (err, moralisBalance) {
				Q.Template.render("Assets/web3/coin/presale/buy/nativeCoinBalanceHtml", {
					nativeCoinBalance: parseFloat(parseFloat(ethers.utils.formatUnits(moralisBalance[0].balance)).toFixed(12))
				}, function (err, html) {
					Q.replace($toolElement.find('.nativeCoinBalanceHtmlContainer')[0], html);
				});
			},{tokenAddresses: null});
		},

		refresh: function() {
			var tool = this;
			var state = tool.state;
			var $toolElement = $(this.element);
			
			$toolElement.addClass("Q_working");
			
			Q.Template.render("Assets/web3/coin/presale/buy/preloader", {
				src: Q.url("{{Q}}/img/throbbers/loading.gif")
			}, function (err, html) {
				Q.replace(tool.element, html);
			});
			
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
					
				Q.Template.render("Assets/web3/coin/presale/buy", {
					data: adjustFundConfig,
					//nativeCoinPlaceholder: tool.text.coin.presale.buy.form.placeholders.amount.interpolate({nativeCoin: nativeCoin}),
					nativeCoin: tool.getNativeCoin(),
					short: isShortVersion,
					showShortInfo: state.showShortInfo
				}, function (err, html) {
					Q.replace(tool.element, html);

					tool.updateNativeCoinBalance();

					if (isShortVersion) {
						$('select[name=funds]', tool.element).val(state.fund);
					}

					if (state.showShortInfo) {
						var $opt = $('select[name=funds] option[value='+state.fund+']', tool.element);
						tool.renderShortInfo($opt);
					}

					$toolElement.removeClass("Q_working");

					$("select[name=funds]", $toolElement).off('change').on('change', function (e) {
						var $selectedOption = $("option:selected", this);
						tool.renderShortInfo($selectedOption);
					}).trigger('change');

					$("button[name=buy]", $toolElement).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {

						$toolElement.addClass("Q_working");

						var fundSelected = $('select[name=funds]', $toolElement).val();
						var sellingERC20 = $('select[name=funds] option[value='+fundSelected+']', $toolElement).data('erc20token');
						var amount = $('input[name=amount]', $toolElement).val();

						var validated = true;

						if (
							!Q.Users.Web3.validate.notEmpty(fundSelected) || 
							!Q.Users.Web3.validate.address(fundSelected)
						) {
							Q.Notices.add({
								content: "Fund invalid",
								timeout: 5
							});
							validated = false;
						}
						
						if (
							!Q.Users.Web3.validate.notEmpty(sellingERC20) ||
							!Q.Users.Web3.validate.address(sellingERC20)
						) {
							Q.Notices.add({
								content: "Token invalid",
								timeout: 5
							});
							validated = false;
						}

						if (
							!Q.Users.Web3.validate.notEmpty(amount) ||
							!Q.Users.Web3.validate.numeric(amount)
						) {
							Q.Notices.add({
								content: "Amount invalid",
								timeout: 5
							});
							validated = false;
						}

						if (!validated) {
							$toolElement.removeClass("Q_working");
							return;
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

							tool.updateNativeCoinBalance();

						}).catch(function (err) {

							Q.Notices.add({
								content: Q.Users.Web3.parseMetamaskError(err, [fundContract]),
								timeout: 5
							});
						}).finally(function(){
							$toolElement.removeClass("Q_working");
						});
					});
				});
			});
		}
	});
	
	Q.Template.set("Assets/web3/coin/presale/buy",
	`
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
	<div class="Assets_web3_coin_presale_buy_legendInfo">
	</div>
	{{/if}}

	<div class="form-inline">
		<div class="form-group">
			<input name="amount" type="text" class="form-control" value="" placeholder="{{interpolate coin.presale.buy.form.placeholders.amount nativeCoin}}">
		</div>
		<button class="Q_button" name="buy">{{coin.presale.buy.btns.buy}}</button>
	</div>
	<div class="form">
		<div class="form-group nativeCoinBalanceHtmlContainer">	
		</div>
	</div>
	
	`,
		{
			text: ["Assets/content", "Assets/web3/coin/presale/buy"]
		}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/nativeCoinBalanceHtml",
	`
	{{interpolate coin.presale.buy.form.placeholders.max nativeCoinBalance}}
	`,
		{text: ["Assets/content", "Assets/web3/coin/presale/buy"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/preloader",
	`
	<img src="{{src}}" alt="">
	`,
		{text: ["Assets/content", "Assets/web3/coin/presale/buy"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/legend",
	`
	<table class="table table-striped">
		<tr>
			<td>fundContract</td>
			<td>{{this.fundContract}}</td></tr>
		<tr>
			<td>SellingToken</td>
			<td>
				<table class="table">
					<tr><td>Address</td><td>{{this.sellingToken}}</td></tr>
					<tr><td>Name</td><td>{{this.sellingToken_name}}</td></tr>
					<tr><td>The Symbol</td><td>{{this.sellingToken_symbol}}</td></tr>
				</table>
			</td>
		</tr>
		<tr>
			<td>Price in {{this.nativeCoin}}</td>
			<td>{{this.currentPrice}}</td>
		</tr>
		<tr>
			<td>inWhitelist</td>
			<td>{{#if this.inWhitelist}}(W){{/if}}</td>
		</tr>
	</table>
	`,
		{text: ["Assets/content", "Assets/web3/coin/presale/buy"]}
	);

})(window, Q, jQuery);
		