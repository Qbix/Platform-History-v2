/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function (window, Q, $, undefined) {
	
	if (Q.isEmpty(Q.grabMetamaskError)) {

        // see https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
        // TODO need to handle most of them
        Q.grabMetamaskError = function _Q_grabMetamaskError(err, contracts) {

            if (err.code == '-32603') {
                if (!Q.isEmpty(err.data)) {
                    if (err.data.code == 3) {
                        //'execution reverted'

                        var str = '';
                        contracts.every(function (contract) {
                            try {
                                var customErrorDescription = contract.interface.getError(ethers.utils.hexDataSlice(err.data.data, 0, 4)); // parsed
                                if (customErrorDescription) {

                                    var decodedStr = ethers.utils.defaultAbiCoder.decode(
                                        customErrorDescription.inputs.map(obj => obj.type),
                                        ethers.utils.hexDataSlice(err.data.data, 4)
                                    );
                                    str = `${customErrorDescription.name}(${(decodedStr.length > 0) ? '"' + decodedStr.join('","') + '"' : ''})`;
                                    return false;
                                }
                                return true;
                            } catch (error) {
                                return true;
                            }

                        });

                        if (Q.isEmpty(str)) {
                            // handle: revert("here string message")
                            return (err.data.message)
                        } else {
                            return (str);
                        }
                    } else {
                        //handle "Internal JSON-RPC error."
                        return (err.data.message);
                    }
                }
            }

            // handle revert and grab custom error
            return (err.message);
        }
    }
	
	if (Q.isEmpty(Q.isAddress)) {
		Q.isAddress = function _Q_isAddress(address) {
			// https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go#L2295-L2329
			if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
				// check if it has the basic requirements of an address
				return false;
			} else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
				// If it's all small caps or all all caps, return true
				return true;
			} else {
				// Otherwise check each case
	//            address = address.replace('0x','');
	//            var addressHash = Web3.utils.sha3(address.toLowerCase());
	//            for (var i = 0; i < 40; i++ ) {
	//                // the nth letter should be uppercase if the nth digit of casemap is 1
	//                if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
	//                    return false;
	//                }
	//            }
				return true;
			}

		}
	}

	if (Q.isEmpty(Q.validate)) {
		Q.validate = function _Q_validate(address) {

		}
		Q.validate.notEmpty = function _Q_validate_notEmpty(input) {
			return !Q.isEmpty(input)
		}
		Q.validate.integer = function _Q_validate_integer(input) {
			return Q.isInteger(input)
		}
		Q.validate.address = function _Q_validate_address(input) {
			return Q.isAddress(input)
		}
	}
	
	/**
	 * @module Assets
	 */
	var Assets = Q.Assets;
	/**
	 * @module Users
	 */
	var Users = Q.Users;

	/**
	* creation and viewing stakings pools
	* @class Assets Community Coin Admin
	* @constructor
	* @param {Object} options Override various options for this tool
	* @param {String} [options.abiPath] ABI path for CommunityCoin contract
	* @param {String} [options.abiPathPoolF] ABI path for CommunityStakingPoolFactory contract
	* @param {String} [options.chainId] chainId
	* @param {String} [options.communityCoinAddress] address od CommunityCoin contract
	* @param {String} [options.fields] array of defaults for the values
	*  @param {String} [options.fields.tokenErc20.value]
	*  @param {Integer} [options.fields.bonusTokenFraction.value]
	*  @param {String} [options.fields.popularToken.value]
	*  @param {String} [options.fields.donations.value] array of tuple like [[address, fraction], ...]
	*  @param {Integer} [options.fields.rewardsRateFraction.value]
	*  @param {Integer} [options.fields.numerator.value]
	*  @param {Integer} [options.fields.denominator.value]
	*/
	Q.Tool.define("Assets/web3/coin/admin", function (options) {
		
		var tool = this;
		var state = this.state;
		
		var defaultsValidate = {
            notEmpty: "<b>%key%</b> cannot be empty", 
            integer: "<b>%key%</b> must be an integer", 
            address: "<b>%key%</b> invalid"
        };
		
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

		if (Q.isEmpty(state.communityCoinAddress)) {
			return console.warn("communityCoinAddress required!");
		}

		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}
		
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
		abiPath: "Assets/templates/R1/CommunityCoin/contract",	// for test predefined in local app.json
		abiPathPoolF: "Assets/templates/R1/CommunityStakingPool/factory",	// for test predefined in local app.json
		chainId: null,
		communityCoinAddress: null,
		fields: {
			
			// key validate is optional
			// value can be :
			// - plain array
			//  validate: ["isEmpty", "isInteger", ...] and try to call Q methods: Q.isEmpty, Q.isInteger ...
			// - object  like {key => errormessage}
			//  validate: {"isEmpty": "err msg here to key %key%, "isInteger": "invalid key %key%, ...} and try to call Q methods: Q.isEmpty, Q.isInteger ...
			tokenErc20: {value: "", hide: false, validate: ["notEmpty", "address"]},
			duration: {value: "", hide: false, validate: ["notEmpty", "integer"]},
			bonusTokenFraction: {value: "", hide: false, validate: ["notEmpty", "integer"]},
			popularToken: {value: "", hide: false, validate: ["notEmpty", "address"]},
			donations: {value: "", hide: false, validate: ["notEmpty"]},
			rewardsRateFraction: {value: "", hide: false, validate: ["notEmpty", "integer"]},
			numerator: {value: "", hide: false, validate: ["notEmpty", "integer"]},
			denominator: {value: "", hide: false, validate: ["notEmpty", "integer"]}
		},
	},

	{ // methods go here
		refresh: function () {
			var tool = this;
			var state = tool.state;

			Q.Template.render("Assets/web3/coin/admin", {
				chainId: state.chainId,
				chains: Assets.Web3.chains
			}, function (err, html) {
				Q.replace(tool.element, html);
                
				tool.checkOwner();
				tool.refreshPoolList();

				$('.Assets_web3_coin_admin_produce', tool.element).off(Q.Pointer.click).on(Q.Pointer.fastclick, function(){
					
					var invokeObj = Q.invoke({
						title: tool.text.coin.admin.createPool,
						template: {
							
							fields: {
								objfields: state.fields
							},
							name: 'Assets/web3/coin/admin/create'
						},
						className: 'Assets_web3_coin_admin_create',
						
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

							// creation staking pool
							$("button[name=create]", $element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
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
										if (!Q.validate[validateMethod](fields[key].userValue)) {
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
										state.abiPath, 
										{
											contractAddress: state.communityCoinAddress,
											chainId: state.chainId
										}
									).then(function (_contract) {
										contract = _contract;
										// stupid thing
										// we cant by pass in etherjs value like "[]". is not array ,because -  Array.isArray("[]") => false
										// so need to convert to array "[]".split(',')
										//vals.donations = "[]" == vals.donations ?[]:vals.donations.split(',');
										fields.donations.userValue = "[]" == fields.donations.userValue ?[]:fields.donations.userValue.split(',');

										return contract.produce(
											fields.tokenErc20.userValue, //address tokenErc20,
											fields.duration.userValue, //uint64 duration,
											fields.bonusTokenFraction.userValue, //uint64 bonusTokenFraction,
											fields.popularToken.userValue, //address popularToken,
											fields.donations.userValue, //IStructs.StructAddrUint256[] memory donations,
											fields.rewardsRateFraction.userValue, //uint64 rewardsRateFraction,
											fields.numerator.userValue, //uint64 numerator,
											fields.denominator.userValue //uint64 denominator
										);

									}).then(function (tx) {
										return tx.wait();
									}).then(function (receipt) {

										if (receipt.status == 0) {
											throw 'Smth unexpected';
										}
										tool.refreshPoolList();	

									}).catch(function (err) {

										Q.Notices.add({
											content: Q.grabMetamaskError(err, [contract]),
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
		
		refreshPoolList: function(){
			var tool = this;
			var state = this.state;
			var $toolElement = $(this.element);
			var $poolListContainer = $toolElement.find('.Assets_web3_coin_admin_poolsContainer');
			$poolListContainer.addClass("Q_working");
			
			Assets.CommunityCoins.Pools.getAll(
				state.communityCoinAddress, 
				null, 
				state.chainId, 
				function (err, instanceInfos) {
					if (err) {
						return console.warn(err);
					}
					var $tbody = $toolElement.find('.Assets_web3_coin_admin_poolsList tbody');
					$tbody.html('');
					if (Q.isEmpty(instanceInfos)) {
						$tbody.html('<tr><td>'+tool.text.coin.admin.errmsgs.ThereAreNoPools+'</td></tr>');
					} else {
						instanceInfos.forEach(function(i, index){
							Q.Template.render('Assets/web3/coin/admin/pools/row', {index: index+1, i:i}, function(err, html){
								$tbody.append(html);
							});

						});
					}
					
					$poolListContainer.removeClass("Q_working");
				}
			);
			
		},
		checkOwner: function() {
			var tool = this;
			var state = this.state;
			var $toolElement = $(this.element);

	//		if (!state.contractAddress || !state.chainId) {
	//			return;
	//		}
			$toolElement.addClass("Q_working");

			Q.Users.Web3.getContract(
				state.abiPath, 
				{
					contractAddress: state.communityCoinAddress,
					readOnly: true,
					chainId: state.chainId
				}
			).then(function (contract) {
				return contract.owner();
			}).then(function (account) {

				if (ethers.utils.getAddress(account) != ethers.utils.getAddress(tool.loggedInUserXid)) {

					let $btnProduce = $(tool.element).find(".Assets_web3_coin_admin_produce");
					
					//objContainer.addClass("Users_web3_notAuthorized");
					$btnProduce.addClass("Q_disabled");
				}
			}).finally(function(){
				$toolElement.removeClass("Q_working");
			});



		},
		Q: {
			beforeRemove: function () {

			}
		}
	});

	Q.Template.set("Assets/web3/coin/admin",
	`
	<div>
		<button class="Assets_web3_coin_admin_produce Q_button">{{coin.admin.btns.createPool}}</button>	

		<div class="Assets_web3_coin_admin_poolsContainer">
			<h3>List by pools</h3>
			<table class="Assets_web3_coin_admin_poolsList table ">
			<thead>
			<tr>
				<th scope="col">#</th>
				<th scope="col">{{coin.admin.form.labels.tokenErc20}}</th>
				<th scope="col">{{coin.admin.form.labels.duration}}</th>
				<th scope="col">{{coin.admin.form.labels.bonusTokenFraction}}</th>
				<th scope="col">{{coin.admin.form.labels.popularToken}}</th>

				<th scope="col">{{coin.admin.form.labels.rewardsRateFraction}}</th>
				<th scope="col">{{coin.admin.form.labels.numerator}}</th>
				<th scope="col">{{coin.admin.form.labels.denominator}}</th>
			</tr>
			</thead>
			<tbody>
			<tr class="Assets_web3_coin_admin_loading"><td>{{coin.admin.loading}}</td></tr>
			</tbody>
			</table>
		</div>

		<button class="Assets_web3_coin_admin_produce Q_button">{{coin.admin.btns.createPool}}</button>	

	</div>
	`,
		{text: ["Assets/content"]}
	);

	Q.Template.set("Assets/web3/coin/admin/create",
	`
		<div class="form Assets_web3_coin_admin_produceContainer">
	{{#unless objfields.tokenErc20.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.tokenErc20}}</label>
				<input name="tokenErc20" type="text" class="form-control" placeholder="{{coin.admin.placeholders.address}}" value="{{objfields.tokenErc20.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.tokenErc20}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.duration.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.duration}}</label>
				<input name="duration" type="text" class="form-control" placeholder="{{coin.admin.placeholders.days}}" value="{{objfields.duration.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.duration}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.bonusTokenFraction.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.bonusTokenFraction}}</label>
				<input name="bonusTokenFraction" type="text" class="form-control" placeholder="{{coin.admin.placeholders.fraction}}" value="{{objfields.bonusTokenFraction.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.bonusTokenFraction}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.popularToken.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.popularToken}}</label>
				<input name="popularToken" type="text" class="form-control" placeholder="{{coin.admin.placeholders.address}}" value="{{objfields.popularToken.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.popularToken}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.donations.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.donations}}</label>
				<input name="donations" type="text" class="form-control" placeholder="{{coin.admin.placeholders.tuple}}" value="{{objfields.donations.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.donations}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.rewardsRateFraction.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.rewardsRateFraction}}</label>
				<input name="rewardsRateFraction" type="text" class="form-control" placeholder="{{coin.admin.placeholders.fraction}}" value="{{objfields.rewardsRateFraction.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.rewardsRateFraction}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.numerator.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.numerator}}</label>
				<input name="numerator" type="text" class="form-control" placeholder="{{coin.admin.placeholders.fraction}}" value="{{objfields.numerator.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.numerator}}</small>
			</div>
	{{/unless}} 
	{{#unless objfields.denominator.hide}}
			<div class="form-group">
				<label>{{coin.admin.form.labels.denominator}}</label>
				<input name="denominator" type="text" class="form-control" placeholder="{{coin.admin.placeholders.fraction}}" value="{{objfields.denominator.value}}">
				<small class="form-text text-muted">{{coin.admin.form.small.denominator}}</small>
			</div>
	{{/unless}} 
			<button name="create" class="Assets_web3_coin_admin_produce Q_button">{{coin.admin.btns.createPoolInForm}}</button>	

		</div>
	`,
	{text: ["Assets/content"]});

	Q.Template.set("Assets/web3/coin/admin/pools",
	`
	Template: Assets/web3/coin/admin/pools

	`,
	{text: ["Assets/content"]});

	Q.Template.set("Assets/web3/coin/admin/pools/row",
	`
	<tr>
		<th scope="row">{{index}}</th>
		<td>{{i.tokenErc20}}</td>
		<td>{{i.duration}}</td>
		<td>{{i.bonusTokenFraction}}</td>
		<td>{{i.popularToken}}</td>

		<td>{{i.rewardsRateFraction}}</td>
		<td>{{i.numerator}}</td>
		<td>{{i.denominator}}</td>
	</tr>
	`,
	{text: ["Assets/content"]});

})(window, Q, jQuery);