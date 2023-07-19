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
	* 
	* @param {String} [options.abiPath] ABI path for FundContract contract
	* @param {String} [options.abiPathF] ABI path for FundContractFactory contract
	* @param {String} [options.chainId] chainId
	* @param {String} [options.communityCoinAddress] address od CommunityCoin contract
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
		//abiPath: "Assets/templates/R1/Fund/contract",
		abiPathF: "Assets/templates/R1/Fund/factory",
		chainId: null,
		fields: {
			
			// key validate is optional
			// value can be :
			// - plain array
			//  validate: ["isEmpty", "isInteger", ...] and try to call Q methods: Q.isEmpty, Q.isInteger ...
			// - object  like {key => errormessage}
			//  validate: {"isEmpty": "err msg here to key %key%, "isInteger": "invalid key %key%, ...} and try to call Q methods: Q.isEmpty, Q.isInteger ...
			sellingToken: {value: "", hide: false, validate: ["notEmpty", "address"]},
			timestamps: {value: "", hide: false, validate: ["notEmpty"]},
			prices: {value: "", hide: false, validate: ["notEmpty"]},
			endTime: {value: "", hide: false, validate: ["notEmpty", "integer"]},
			thresholds: {value: "", hide: false, validate: ["notEmpty"]},
			bonuses: {value: "", hide: false, validate: ["notEmpty"]},
			ownerCanWithdraw: {value: "", hide: false, validate: ["notEmpty", "integer"]},
			whitelistData: {value: "", hide: false, validate: ["notEmpty"]}
		},
	},
	{ // methods go here
		refresh: function() {
			var tool = this;
			var state = tool.state;

			Q.Template.render("Assets/web3/coin/presale/admin", {
				chainId: state.chainId,
				chains: Assets.Web3.chains
			}, function (err, html) {
				Q.replace(tool.element, html);
				
				tool.refreshFundList();
				
				$('.Assets_web3_coin_presale_admin_produce', tool.element).off('click').on('click', function(e){
					
					console.log("Assets_web3_coin_presale_admin_produce");
					
					var invokeObj = Q.invoke({
						title: tool.text.coin.presale.admin.createFund,
						template: {
							
							fields: {
								objfields: state.fields,
								ownerCanWithdrawOptions: [

									[0,"Owner can not withdraw"],
									[1,"Owner can withdraw tokens only after endTime passed"],
									[2,"Owner can withdraw tokens anytime"]
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
							
							var nextDayDate = function() {
								var date = new Date( Date.now() + 1000 * 60 * 60 * 24 );
								var y = date.getFullYear();
								var m = date.getMonth();
								var d = date.getDate();
								return new Date(y, m, d);
							}();
							
							$element.find('input[name=endTime]').pickadate({
										showMonthsShort: true,
										format: 'ddd, mmm d, yyyy',
										formatSubmit: 'yyyy/mm/dd',
										hiddenName: true,
										min: new Date(),
										container: $element,
										onStart: function () {
											this.set('select', nextDayDate);
										}
									});
									
									
							/*
							for (var fieldName in state.fields) {
								var $input = $element.find("input[name="+fieldName+"]");
								if (state.fields[fieldName].hide) {
									var $formGroup = $input.closest('.form-group');
									$formGroup.add($formGroup.prev('label'))
										.remove();
								} else {
									$input.val(
										state.fields[fieldName].value
									);
								}
							}
							*/
							var removeBtnsHandler = function($btn) {

								var ident = $btn.data('ident');
								console.log("removeBtnsHandler ident =",ident);				
								$btn.closest('div[data-ident="'+ident+'"]').remove();
							}

							$('button[name=timestamps_and_prices_add_row]', $element).off('click').on('click', function(e){
								console.log("button[name=timestamps_and_prices_add_row]");	

								Q.Template.render("Assets/web3/coin/presale/admin/create/fields/timestamps_and_prices/row", {
									ident: (Math.random() + 1).toString(36).substring(2)
								}, function (err, html) {

									var $html = $(html);
									
									$html.find('input[name=timestamps]').pickadate({
										showMonthsShort: true,
										format: 'ddd, mmm d, yyyy',
										formatSubmit: 'yyyy/mm/dd',
										hiddenName: true,
										min: new Date(),
										container: $html,
										onStart: function () {
											this.set('select', nextDayDate);
										}
									}).on('change', function () {
										//console.log('endTime = ', $element.find('input[name=endTime]').pickadate().pickadate('picker').get());
										//_hideEarlierTimes(tool.$date, tool.$time);
									});
									
									$($element).find('.timestamps_and_prices_rows_container').append($html);

									$('button[name=timestamps_and_prices_remove_row]', $element).off('click').on('click', function(e){
										removeBtnsHandler($(this));
									});
								});

							});
							
							$('button[name=thresholds_and_bonuses_add_row]', $element).off('click').on('click', function(e){
								console.log("button[name=thresholds_and_bonuses_add_row]");	

								Q.Template.render("Assets/web3/coin/presale/admin/create/fields/thresholds_and_bonuses/row", {
									ident: (Math.random() + 1).toString(36).substring(2)
								}, function (err, html) {

									var $html = $(html);
									//$html.find('input[name=timestamps]').datepicker();
									$($element).find('.thresholds_and_bonuses_rows_container').append($html);

									$('button[name=thresholds_and_bonuses_remove_row]', $element).off('click').on('click', function(e){
										removeBtnsHandler($(this));
									});
								});

							});
							
							$("#useWhiteList", $element).off('change').on('change', function (e) {
								if($(this).is(":checked")) {
									$('.useWhiteListContainer').show(300);
								} else {
									$('.useWhiteListContainer').hide(200);
								}
							}).trigger('change');
							
							// creation funds
							$("button[name=create]", $element).off('click').on('click', function (e) {
//console.log("button[name=create]");

								$element.addClass("Q_working");
								
								// clone state fields
								let fields = Object.assign({}, state.fields);
								//collect form
								for (let key in fields) {
									// get field values
									fields[key].userValue = $element.find(`[name='${key}']`).val();
									// use default values if present
									fields[key].userValue = fields[key].userValue || fields[key].value;
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
//											var $input = $element.find("input[name="+key+"]");
//											$input.closest('.form-group').find('label').after(fields[key].validate[validateMethod].replace('%key%', key));
											break;

										}
									}
								}
								
								if (validated) {
									
									var contract;
									Assets.Funds.getFactory(
										state.chainId, 
										false,
										state.abiPathF
									).then(function (_contract) {
										contract = _contract;
										// stupid thing
										// we cant by pass in etherjs value like "[]". is not array ,because -  Array.isArray("[]") => false
										// so need to convert to array "[]".split(',')
										//vals.donations = "[]" == vals.donations ?[]:vals.donations.split(',');
										var f = function(input) {
											if (input == '[]') {
												return [];
											}
											var match = /(?<=\[).+?(?=\])/.exec(input);
											if (match != null) {
												return match[0].split(',');
											}
											return input;
										}
										fields.timestamps.userValue		= f(fields.timestamps.userValue);
										fields.prices.userValue			= f(fields.prices.userValue);
										fields.thresholds.userValue		= f(fields.thresholds.userValue);
										fields.bonuses.userValue		= f(fields.bonuses.userValue);
										fields.whitelistData.userValue	= f(fields.whitelistData.userValue);

//console.log(fields.sellingToken.userValue);
//console.log(fields.timestamps.userValue);
//console.log(fields.prices.userValue);
//console.log(fields.endTime.userValue);
//console.log(fields.thresholds.userValue);
//console.log(fields.bonuses.userValue);
//console.log(fields.ownerCanWithdraw.userValue);
//console.log(fields.whitelistData.userValue);

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
										$element.removeClass("Q_working");
										invokeObj.close();
									});
									
								} else {
									$element.removeClass("Q_working");
									invokeObj.close();
								}
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
					} else {
						
						instances.forEach(function(i, index){

							Q.Template.render('Assets/web3/coin/presale/admin/funds/row', {index: index+1, i:i}, function(err, html){
								$tbody.append(html);
							});

						});
					}
					
					$fundsListContainer.removeClass("Q_working");
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
						<input name="timestamps" type="text" class="form-control" value="{{objfields.timestamps.value}}">
						<small class="form-text text-muted">{{coin.presale.admin.form.small.timestamps}}</small>
					</div>
				</div>
				<div class="col-xs-5">
					<div class="form-group">
						<input name="prices" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.prices}}" value="{{objfields.prices.value}}">
						<small class="form-text text-muted">{{coin.presale.admin.form.small.prices}}</small>
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
						<small class="form-text text-muted">{{coin.presale.admin.form.small.thresholds}}</small>
					</div>
				</div>
				<div class="col-xs-5">
					<div class="form-group">
						<input name="bonuses" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.bonuses}}" value="{{objfields.bonuses.value}}">
						<small class="form-text text-muted">{{coin.presale.admin.form.small.bonuses}}</small>
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
				<label>{{coin.presale.admin.form.labels.sellingToken}}</label>
				<input name="sellingToken" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.address}}" value="{{objfields.sellingToken.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.sellingToken}}</small>
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
				<input name="endTime" type="text" class="form-control" value="{{objfields.endTime.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.endTime}}</small>
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
			<label>{{coin.presale.admin.form.labels.ownerCanWithdraw}}</label>
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
	</tr>
	`,
	{text: ["Assets/content"]});
})(window, Q, jQuery);