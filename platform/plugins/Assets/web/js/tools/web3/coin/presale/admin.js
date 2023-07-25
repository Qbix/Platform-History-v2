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
	* creation and viewing FundContract which uses as Presale
	* @class Assets FundContract Admin
	* @constructor
	* @param {Object} options Override various options for this tool
	* @param {String} [options.abiPathF] ABI path for FundContractFactory contract
	* @param {String} [options.chainId] chainId
	* @param {String} [options.fields] array of defaults for the values
	*  @param {String} [options.fields.sellingToken]
	*  @param {String} [options.fields.timestamps] array of timestamps
	*  @param {String} [options.fields.prices] array of prices
	*  @param {String} [options.fields.endTime] endtime
	*  @param {String} [options.fields.thresholds] array of thresholds
	*  @param {String} [options.fields.bonuses] array of bonuses
	*  @param {Integer} [options.fields.ownerCanWithdraw    
	*	0 -owner can not withdraw tokens
    *	1 -owner can withdraw tokens only after endTimePassed
    *	2 -owner can withdraw tokens anytime
	*  @param {String} [options.fields.whitelistData] array of tuple like [address, bytes4, uint8, bool] as [contractAddress, method, role, useWhitelist]
	*/
	Q.Tool.define("Assets/web3/coin/presale/admin", function (options) {
		var tool = this;
		var state = this.state;
		
		// really strange thing in contract. especially for ratio ETH/token when 1 ETH is a 10**18
		tool.priceDenom = 100000000; //1*10**8;
		
		var loggedInUser = Q.Users.loggedInUser;
		if (!loggedInUser) {
			return console.warn("user not logged in");
		}

		tool.loggedInUserXid = Q.Users.Web3.getLoggedInUserXid();

		if (Q.isEmpty(tool.loggedInUserXid)) {
			return console.warn("user not found");
		}

		// is admin
		var roles = Object.keys(Q.getObject("roles", Users) || {});

		tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

		if (!tool.isAdmin) {
			return console.warn("owners/admin role require!");
		}

		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}
		
		var defaultsValidate = {
            notEmpty: "<b>%key%</b> cannot be empty", 
            integer: "<b>%key%</b> must be an integer", 
            address: "<b>%key%</b> invalid"
        };
		
		// fill missed attr fields
        for (var i in state.fields) {
            
            if (typeof(state.fields[i]) === "string") {
                state.fields[i] = {
                    value: state.fields[i],
                    hide: false
                }
            } else if (typeof(state.fields[i]) === "object") {
                let arr;
                if (Q.isEmpty(state.fields[i]["value"])) {
                    state.fields[i].value = "";
                }
                if (Q.isEmpty(state.fields[i]["hide"])) {
                    state.fields[i].hide = false;
                }
                
                if (Q.isEmpty(state.fields[i]["validate"])) {
                    state.fields[i]["validate"] = {};
                } else if (Array.isArray(state.fields[i]["validate"])) {
                    
                    arr = {};
                    for (var j in state.fields[i]["validate"]) {
                        let k = state.fields[i]["validate"][j];
                        if (Q.isEmpty(defaultsValidate[k])) {
                            console.warn(`validate expr "${k}" have not supported yet`);
                        } else {
                            arr[k] = defaultsValidate[k];
                        }
                    }
                    state.fields[i]["validate"] = Object.assign({}, arr);
                    
                } else if (typeof(state.fields[i]["validate"]) === "object") {
                    for (var j in state.fields[i]["validate"]) {
                        if (Q.isEmpty(defaultsValidate[j])) {
                            console.warn(`validate expr "${j}" have not supported yet`);
                        } else {
                            state.fields[i]["validate"][j] = state.fields[i]["validate"][j];
                        }
                    }
                }
            }
        }
		
		//tool.mybestvar = '123123213213';
		
		tool.refresh();
	},
	{ // default options here
		abiPathF: "Assets/templates/R1/Fund/factory",
		chainId: null,
		fields: {
			
			// key validate is optional
			// value can be :
			// - plain array
			//  validate: ["isEmpty", "isInteger", ...] and try to call Q methods: Q.isEmpty, Q.isInteger ...
			// - object  like {key => errormessage}
			//  validate: {"isEmpty": "err msg here to key %key%, "isInteger": "invalid key %key%, ...} and try to call Q methods: Q.isEmpty, Q.isInteger ...
			sellingToken: {
				value: "", 
				hide: false, 
				validate: ["notEmpty", "address"], 
				output: function(v) {return v}
			},
			timestamps: {
				value: "", 
				hide: false, 
				validate: ["notEmpty"],
				output: function(v) {
					return Math.floor(new Date(v).getTime()/1000)
				}, 
				expectArray:true,
				emptyValue:[]
			},
			prices: {
				value: "", 
				hide: false, 
				validate: ["notEmpty"],
				output: function(v, dpl) {

					return ethers.utils.parseUnits(
						v.toString(), 
						Q.isEmpty(dpl) ? 18 : dpl
					)
				},
				expectArray:true,
				emptyValue:[]
			},
			endTime: {
				value: "", 
				hide: false, 
				validate: ["notEmpty"],
				output: function(v) {
					return Math.floor(new Date(v).getTime()/1000)
				}
			},
			thresholds: {
				value: "", 
				hide: false, 
				validate: [],
				output: function(v, dpl) {
					return ethers.utils.parseUnits(
						v.toString(), 
						Q.isEmpty(dpl) ? 18 : dpl
					)
				}, 
				expectArray:true,
				emptyValue:[]
			},
			bonuses: {
				value: "", 
				hide: false, 
				validate: [],
				output: function(v) {return v}, 
				expectArray:true,
				emptyValue:[]
			},
			ownerCanWithdraw: {
				value: "", 
				hide: false, 
				validate: ["notEmpty", "integer"],
				output: function(v) {return v}
			},
			whitelistData: {
				value: "", 
				hide: false, 
				validate: ["notEmpty"],
				output: function(v) {return v}
			}
		},
	},
	{ // methods go here
		// generate random string like that `g3ynh3ss4b`
		getRndIdent: function(){
			return (Math.random() + 1).toString(36).substring(2);
		},
		refresh: function() {
			var tool = this;
			var state = tool.state;

			Q.Template.render("Assets/web3/coin/presale/admin", {}, function (err, html) {
				Q.replace(tool.element, html);
				
				tool.refreshFundList();
				
				$('.Assets_web3_coin_presale_admin_produce', tool.element).off(Q.Pointer.click).on(Q.Pointer.click, function(e){
					
					var invokeObj = Q.invoke({
						title: tool.text.coin.presale.admin.createFund,
						template: {
							fields: {
								objfields: state.fields,
								ownerCanWithdrawOptions: [
									[0,tool.text.coin.presale.admin.form.fields.ownerWithdrawOptions.option0],
									[1,tool.text.coin.presale.admin.form.fields.ownerWithdrawOptions.option1],
									[2,tool.text.coin.presale.admin.form.fields.ownerWithdrawOptions.option2]
								]
							},
							name: 'Assets/web3/coin/presale/admin/create'
						},
						className: 'Assets_web3_coin_presale_admin_create',
						
						trigger: tool.element,
						onActivate: function ($element) {
							
							if (!($element instanceof $)) {
								$element = $(arguments[2]);
							}
													
							var removeBtnsHandler = function($btn) {
								var ident = $btn.data('ident');
								$btn.closest('div[data-ident="'+ident+'"]').remove();
							}
							
							// handler for adding `timestamps_and_prices` group fields
							$('button[name=timestamps_and_prices_add_row]', $element).off(Q.Pointer.click).on(Q.Pointer.click, function(e){
								Q.Template.render("Assets/web3/coin/presale/admin/create/fields/timestamps_and_prices/row", {
									ident: tool.getRndIdent()
								}, function (err, html) {
									var $html = $(html);
									$($element).find('.timestamps_and_prices_rows_container').append($html);
									$('button[name=timestamps_and_prices_remove_row]', $html).off(Q.Pointer.click).on(Q.Pointer.click, function(e){
										removeBtnsHandler($(this));
									});
								});
							});
							
							// handler for adding `thresholds_and_bonuse` group fields
							$('button[name=thresholds_and_bonuses_add_row]', $element).off(Q.Pointer.click).on(Q.Pointer.click, function(e){
								Q.Template.render("Assets/web3/coin/presale/admin/create/fields/thresholds_and_bonuses/row", {
									ident: tool.getRndIdent()
								}, function (err, html) {
									var $html = $(html);
									$($element).find('.thresholds_and_bonuses_rows_container').append($html);
									$('button[name=thresholds_and_bonuses_remove_row]', $html).off(Q.Pointer.click).on(Q.Pointer.click, function(e){
										removeBtnsHandler($(this));
									});
								});
							});
							
							// handler for weitchin `usewhitelist` block
							$("#useWhiteList", $element).off('change').on('change', function (e) {
								if($(this).is(":checked")) {
									$('.useWhiteListContainer').show(300);
								} else {
									$('.useWhiteListContainer').hide(200);
								}
							}).trigger('change');
							
							// creation funds
							$("button[name=create]", $element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
								$element.addClass("Q_working");
								// clone state fields
								let fields = Object.assign({}, state.fields);
								//collect form
								for (let key in fields) {
									// use default values if present and if 'hide' key present
									if (fields[key].hide) {
										fields[key].userValue = fields[key].value;
										continue;
									}
									
									//custom for whitelist structure
									if (key == 'whitelistData') {
										if ($('#useWhiteList').is(":checked")) {
											fields[key].userValue = [];
											fields[key].userValue[0] = $($element).find('input[name=whitelistData_communityAddress]').val();
											fields[key].userValue[1] = $($element).find('input[name=whitelistData_methodkeccack]').val();
											fields[key].userValue[2] = $($element).find('input[name=whitelistData_roleId]').val();
											fields[key].userValue[3] = true;

											//fields[key].userValue = '['+ (fields[key].userValue).join(',')+']';
										} else {
											fields[key].userValue = ['0x0000000000000000000000000000000000000000','0x95a8c58d','1',false];
										}

									} else { // for other fields collect but code need to be moved outside)
										// get field values
										var tmp;
										var $fieldSelector = $element.find(`[name='${key}']`);
										if ($fieldSelector.length == 0) {
											fields[key].userValue = (fields[key].emptyValue) ? fields[key].emptyValue : '';
											continue;
										} else if ($fieldSelector.length == 1) {
											fields[key].userValue = fields[key].output($fieldSelector.val(), (key == 'prices' ? Math.log10(tool.priceDenom):null));
											
											if (fields[key].expectArray) {
												fields[key].userValue = [fields[key].userValue];
											}
										} else {
											tmp = [];
											$fieldSelector.each(function(i, v){
												var val = $(v).val();
												if (!Q.isEmpty(val)) {
													tmp[tmp.length] = fields[key].output(val, (key == 'prices' ? Math.log10(tool.priceDenom):null) );	
												}
											});
											fields[key].userValue = tmp;
										}
									}
								}
	
								// validate (after user input and applied defaults value)
								var validated = true;
								for (let key in fields) {
									for (let validateMethod in fields[key].validate) {
										if (!Q.Users.Web3.validate[validateMethod](fields[key].userValue)) {
											validated = false;
											Q.Notices.add({
												content: fields[key].validate[validateMethod].replace('%key%', key),
												timeout: 5
											});
											break;
										}
									}
								}
								
								var closeHandler = function(){
									$element.removeClass("Q_working");
									invokeObj.close();
								}

								if (!validated) {
									closeHandler();
								}
								
								var contract;
								Assets.Funds.getFactory(
									state.chainId, 
									false,
									state.abiPathF
								).then(function (_contract) {
									contract = _contract;
									return contract.produce(
										fields.sellingToken.userValue,
										fields.timestamps.userValue,
										fields.prices.userValue,
										fields.endTime.userValue,
										fields.thresholds.userValue,
										fields.bonuses.userValue,
										fields.ownerCanWithdraw.userValue,
										fields.whitelistData.userValue
									);
								}).then(function (tx) {
									return tx.wait();
								}).then(function (receipt) {
									if (receipt.status == 0) {
										throw 'Smth unexpected';
									}
									tool.refreshFundList();	
								}).catch(function (err) {
									Q.Notices.add({
										content: Q.Users.Web3.parseMetamaskError(err, [contract]),
										timeout: 5
									});
								}).finally(function(){
									closeHandler();
								});
							});
						}
					});
				});
			});
		},
		refreshFundList: function(){
			var tool = this;
			var state = this.state;
			var $toolElement = $(this.element);
			var $fundsListContainer = $toolElement.find('.Assets_web3_coin_presale_admin_fundsContainer');
			$fundsListContainer.addClass("Q_working");

			Assets.Funds.getAll(
				state.chainId, 
				state.abiPathF, 
				function (err, instances) {
					if (err) {
						return console.warn(err);
					}
					var $tbody = $toolElement.find('.Assets_web3_coin_presale_admin_fundsList tbody');
					$tbody.html('');

					if (Q.isEmpty(instances)) {
						$tbody.html('<tr><td>'+tool.text.coin.presale.admin.errmsgs.ThereAreNoFunds+'</td></tr>');
						$fundsListContainer.removeClass("Q_working");
						return;
					}
					// else filling table
					instances.forEach(function(i, index){
						Q.Template.render('Assets/web3/coin/presale/admin/funds/row', {index: index+1, i:i, chainId:state.chainId}, function(err, html){
							$tbody.append(html);
						});
					});
					
					$fundsListContainer.removeClass("Q_working");

					//and handle fund info btns
					$("button[name=fundInfo]", $fundsListContainer).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
						$fundsListContainer.addClass("Q_working");
						var data = $(this).data();
						
						if (!Q.Users.Web3.validate.address(data.addr) || Q.isEmpty(data.chainid)) {
							console.warn('incorrect address or chainId')
							$fundsListContainer.removeClass("Q_working");
							return;
						}
						
						Assets.Funds.getFundConfig( data.addr, data.chainid, ethers.utils.getAddress(tool.loggedInUserXid), function(err, infoConfig){
							if (err) {
								$fundsListContainer.removeClass("Q_working");
								return;
							}
							Q.invoke({
								title: tool.text.coin.presale.admin.fundInfo,
								template: {

									fields: {
										objfields: state.fields,
										data: Assets.Funds.adjustFundConfig(infoConfig, {priceDenom: tool.priceDenom})
									},
									name: 'Assets/web3/coin/presale/admin/fund/info'
								},
								className: 'Assets_web3_coin_presale_admin_fund_info',

								trigger: tool.element,
								onActivate: function ($element) {
									$fundsListContainer.removeClass("Q_working");
								}
							});

						});
					});
				}
			);
		}
	});
	
	Q.Template.set("Assets/web3/coin/presale/admin",
	`
	<div>
		<button class="Assets_web3_coin_presale_admin_produce Q_button">{{coin.presale.admin.btns.createFund}}</button>	

		<div class="Assets_web3_coin_presale_admin_fundsContainer">
			<h3>Funds List</h3>
			<table class="Assets_web3_coin_presale_admin_fundsList table ">
			<thead>
			<tr>
				<th scope="col">#</th>
				<th scope="col">{{coin.presale.admin.fundAddress}}</th>
				<th scope="col"></th>
			</tr>
			</thead>
			<tbody>
			<tr class="Assets_web3_coin_presale_admin_loading"><td>{{coin.presale.admin.loading}}</td></tr>
			</tbody>
			</table>
		</div>

		<button class="Assets_web3_coin_presale_admin_produce Q_button">{{coin.presale.admin.btns.createFund}}</button>	

	</div>
	`,
		{text: ["Assets/content"]}
	);

	Q.Template.set("Assets/web3/coin/presale/admin/create/fields/timestamps_and_prices/row", `
		<div class="timestamps_and_prices_row_container" data-ident='{{ident}}'>
			<div class="row">
				<div class="col-xs-4">
					<div class="form-group">
						<input name="timestamps" type="datetime-local" class="form-control" value="{{objfields.timestamps.value}}">
					</div>
				</div>
				<div class="col-xs-5">
					<div class="form-group">
						<input name="prices" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.prices}}" value="{{objfields.prices.value}}">
					</div>
				</div>
				<div class="col-xs-3">
					<button data-ident='{{ident}}' class='Q_button' type='button' name='timestamps_and_prices_remove_row'>Remove</button>
				</div>
			</div>
		</div>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/admin/create/fields/thresholds_and_bonuses/row", `
		<div class="thresholds_and_bonuses_row_container" data-ident='{{ident}}'>
			<div class="row">
				<div class="col-xs-4">
					<div class="form-group">
						<input name="thresholds" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.thresholds}}" value="{{objfields.thresholds.value}}">
					</div>
				</div>
				<div class="col-xs-5">
					<div class="form-group">
						<input name="bonuses" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.bonuses}}" value="{{objfields.bonuses.value}}">
					</div>
				</div>
				<div class="col-xs-3">
					<button data-ident='{{ident}}' class='Q_button' type='button' name='thresholds_and_bonuses_remove_row'>Remove</button>
				</div>
			</div>
		</div>
	`,
		{text: ["Assets/content"]}
	);

	Q.Template.set("Assets/web3/coin/presale/admin/create",
	`
	<div class="form Assets_web3_coin_presale_admin_produceContainer">
		{{#unless objfields.sellingToken.hide}}
		<div class="form-group">
			<input name="sellingToken" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.sellingToken}}" value="{{objfields.sellingToken.value}}">
		</div>
		{{/unless}} 

		<button class='Q_button' type='button' name='timestamps_and_prices_add_row'>Add</button>
		<div class="row">
			<div class="col-xs-4">
				<div class="form-group">
					<label>{{coin.presale.admin.form.labels.timestamps}}</label>
				</div>
			</div>
			<div class="col-xs-5">
				<div class="form-group">
					<label>{{coin.presale.admin.form.labels.prices}}</label>
				</div>
			</div>
			<div class="col-xs-3">
				&nbsp;
			</div>
		</div>
		<div class="timestamps_and_prices_rows_container">
		</div>

		{{#unless objfields.endTime.hide}}
		<div class="form-group">
			<label>{{coin.presale.admin.form.labels.endTime}}</label>
			<input name="endTime" type="datetime-local" class="form-control" value="{{objfields.endTime.value}}">
		</div>
		{{/unless}} 

		<button class='Q_button' type='button' name='thresholds_and_bonuses_add_row'>Add</button>
		<div class="row">
			<div class="col-xs-4">
				<div class="form-group">
					<label>{{coin.presale.admin.form.labels.thresholds}}</label>
				</div>
			</div>
			<div class="col-xs-5">
				<div class="form-group">
					<label>{{coin.presale.admin.form.labels.bonuses}}</label>
				</div>
			</div>
			<div class="col-xs-3">
				&nbsp;
			</div>
		</div>
		<div class="thresholds_and_bonuses_rows_container">
		</div>

		{{#unless objfields.ownerCanWithdraw.hide}}
		<div class="form-group">
			<select name="ownerCanWithdraw" class="form-control">
			{{#each ownerCanWithdrawOptions}}
			<option value="{{this.[0]}}">{{this.[1]}}</option>
			{{/each}}
			</select>
		</div>
		{{/unless}} 
		{{#unless objfields.whitelistData.hide}}
		<div class="form-check">
			<input class="form-check-input" type="checkbox" value="" id="useWhiteList" name="useWhiteList">
			<label class="form-check-label" for="useWhiteList">
			  Use WhiteList
			</label>
		</div>
		<div class="useWhiteListContainer" >
			<div class="form-group" >
				<label>{{coin.presale.admin.form.labels.communityAddress}}</label>
				<input name="whitelistData_communityAddress" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.communityAddress}}" value="">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.communityAddress}}</small>
			</div>
			<div class="form-group" >
				<label>{{coin.presale.admin.form.labels.methodkeccack}}</label>
				<input name="whitelistData_methodkeccack" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.methodkeccack}}" value="">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.whitelistData}}</small>
			</div>
			<div class="form-group" >
				<label>{{coin.presale.admin.form.labels.roleId}}</label>
				<input name="whitelistData_roleId" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.roleId}}" value="">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.roleId}}</small>
			</div>
		</div>
		{{/unless}} 
		<button name="create" class="Assets_web3_coin_presale_admin_produce Q_button">{{coin.presale.admin.btns.createFundInForm}}</button>	
	</div>
	`,
	{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/admin/funds/row",
	`
	<tr>
		<th scope="row">{{index}}</th>
		<td>{{i.value}}</td>
		<td><button name="fundInfo" class="Q_button" data-addr='{{i.value}}' data-chainid='{{chainId}}'>info</button></td>
	</tr>
	`,
	{text: ["Assets/content"]});

	Q.Template.set("Assets/web3/coin/presale/admin/fund/info",
	`
	<table class="table table-row">
		<tbody>
		<tr>
			<td>{{coin.presale.admin.form.labels.sellingToken}}</td>
			<td>{{data._sellingToken}}</td>
		</tr>
		<tr>
			<td>{{coin.presale.admin.form.labels.timestamps}} && {{coin.presale.admin.form.labels.prices}}</td>
			<td>
				<div class="row">
					<div class="col-xs-6">
						<table class="table table-striped">
						{{#each data._timestamps}}
							<tr><td>{{this}}</td></tr>
						{{/each}}
						</table>
					</div>
					<div class="col-xs-6">
						<table class="table ">
						{{#each data._prices}}
							<tr><td>{{this}}</td></tr>
						{{/each}}
						</table>
					</div>
				</div>
			</td>
		</tr>
		<tr>
			<td>{{coin.presale.admin.form.labels.endTime}}</td>
			<td>{{data._endTs}}</td>
		</tr>
		<tr>
			<td>{{coin.presale.admin.form.labels.thresholds}} && {{coin.presale.admin.form.labels.bonuses}}</td>
			<td>
				<div class="row">
					<div class="col-xs-6">
						<table class="table ">
						{{#each data._thresholds}}
							<tr><td>{{this}}</td></tr>
						{{/each}}
						</table>
					</div>
					<div class="col-xs-6">
						<table class="table table-striped">
						{{#each data._bonuses}}
							<tr><td>{{this}}</td></tr>
						{{/each}}
						</table>
					</div>
				</div>
			</td>
		</tr>
		</tbody>
	</table>
	`,
	{text: ["Assets/content"]});
})(window, Q, jQuery);