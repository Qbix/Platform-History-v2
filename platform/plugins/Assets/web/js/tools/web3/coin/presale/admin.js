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

		if (Q.isEmpty(state.fundFactoryAddress)) {
			return console.warn("fundFactoryCoinAddress required!");
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

		
		tool.refresh();
	},
	{ // default options here
		//abiPath: "Assets/templates/R1/Fund/contract",
		abiPathF: "Assets/templates/R1/Fund/factory",
		chainId: null,
		fundFactoryAddress: null,
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
				
				$('.Assets_web3_coin_presale_admin_produce', tool.element).off(Q.Pointer.click).on(Q.Pointer.fastclick, function(e){
					e.preventDefault();
					e.stopPropagation();
					
console.log("Assets_web3_coin_presale_admin_produce");
					var invokeObj = Q.invoke({
						title: tool.text.coin.presale.admin.createFund,
						template: {
							
							fields: {
								objfields: state.fields
							},
							name: 'Assets/web3/coin/presale/admin/create'
						},
						className: 'Assets_web3_coin_presale_admin_create',
						
						trigger: tool.element,
						onActivate: function ($element) {
							
							if (!($element instanceof $)) {
								$element = $(arguments[2]);
							}
							
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

							// creation funds
							$("button[name=create]", $element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
console.log("button[name=create]");
								e.preventDefault();
								e.stopPropagation();

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
									Q.Users.Web3.getContract(
										state.abiPathF, 
										{
											contractAddress: state.fundFactoryAddress,
											chainId: state.chainId
										}
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
				state.fundFactoryAddress, 
				state.abiPathF, 
				state.chainId, 
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
	{{#unless objfields.timestamps.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.timestamps}}</label>
				<input name="timestamps" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.uint256s}}" value="{{objfields.timestamps.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.timestamps}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.prices.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.prices}}</label>
				<input name="prices" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.uint256s}}" value="{{objfields.prices.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.prices}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.endTime.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.endTime}}</label>
				<input name="endTime" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.integer}}" value="{{objfields.endTime.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.endTime}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.thresholds.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.thresholds}}</label>
				<input name="thresholds" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.uint256s}}" value="{{objfields.thresholds.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.thresholds}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.bonuses.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.bonuses}}</label>
				<input name="bonuses" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.uint256s}}" value="{{objfields.bonuses.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.bonuses}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.ownerCanWithdraw.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.ownerCanWithdraw}}</label>
				<input name="ownerCanWithdraw" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.integer}}" value="{{objfields.ownerCanWithdraw.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.ownerCanWithdraw}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.whitelistData.hide}}
			<div class="form-group">
				<label>{{coin.presale.admin.form.labels.whitelistData}}</label>
				<input name="whitelistData" type="text" class="form-control" placeholder="{{coin.presale.admin.placeholders.tuple}}" value="{{objfields.whitelistData.value}}">
				<small class="form-text text-muted">{{coin.presale.admin.form.small.whitelistData}}</small>
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