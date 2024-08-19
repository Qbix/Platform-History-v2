(function (Q, $, window, undefined) {

var Users = Q.Users;

/**
 * Users Tools
 * @module Users-tools
 * @main
 */

/**
 * Tool that provide a way to produce new community instance
 * @param {Object} [options]
 *   @param {Array} options.chains list of chains in which tool will try to create community
 *   @param {String} options.defaultChain default chain in hexstring (will be choosen in select field)
 *   @param {String} options.communityId communityId
 *   @param {String} options.showSelectChainId force show user select with chainId, even if it predefined
 *   @param {Object} options.contractParams fields that describe community.
 *     @param {String} [options.contractParams.hook] hook address. can be zero-address. if value present, form will hide input field
 *     @param {String} [options.contractParams.invitedHook] invitedHook address. can be zero-address. if value present, form will hide input field
 *     @param {String} [options.contractParams.name] community nft name. if value present, form will hide input field
 *     @param {String} [options.contractParams.symbol] community nft symbol. if value present, form will hide input field
 *     @param {String} [options.contractParams.contractURI] community contract URI. if value present, form will hide input field
 */
Q.Tool.define("Users/web3/community", function Users_web3_community_tool(options) {
	if (this.element.childNodes.length) {
		return;
	}
	var tool = this;
	var state = this.state;
    
	tool.refresh();
},

{
	chains: [], // filled on \Users\web3\community\tool.php
    
	//defaultChain: null,
	communityId: null,
    showSelectChainId: false,
	contractParams: {
	    hook: null,
        invitedHook: null,
	    name: null,
	    symbol: null,
	    contractURI: null,
	}
},
{
	/**
	 * Refresh the list
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);

        var chains = [];
        Q.each(state.chains, function (i, chain) {
            if (tool.getFactoryAddress(chain.chainId)) {
                chains.push(chain);
            }
        });
        
        Q.Template.render('Users/web3/community/list', {
		    chains: chains,
            
		    //defaultChain: state.defaultChain,
		    //contractParams: state.contractParams
		}, function (err, html) {
		    
		    Q.replace(tool.element, html);
            
            $("button[name=produce]", $toolElement).off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function(){
                
                var selectedChainId = $(this).data('chainid');
                
                var runImmediately;
                // if all params defined just immediately send transaction with loading animation
                if (!Q.isEmpty(state.contractParams.hook) &&
                    !Q.isEmpty(state.contractParams.invitedHook) &&
                    !Q.isEmpty(state.contractParams.name) &&
                    !Q.isEmpty(state.contractParams.symbol) &&
                    !Q.isEmpty(state.contractParams.contractURI)&&
                    !Q.isEmpty(selectedChainId)
                ){
                    runImmediately = true;
                } else {
                    // overwise works as was before: popup, fields and pressing produce button
                    runImmediately = false;
                }
                
                ///-----
                if (runImmediately) {
                    var factoryAddress = tool.getFactoryAddress(selectedChainId);
                    if (typeof factoryAddress === 'undefined') {
                        Q.alert(tool.text.err.cantFindFactoryAddress);
                    } else {
                        // here we didn't validate params and expect that dev know what he put in inititialize
                        tool.proceedAndSend(
                            {
                                selectedChainId: selectedChainId,
                                hook: state.contractParams.hook,
                                invitedHook: state.contractParams.invitedHook,
                                name: state.contractParams.name,
                                symbol: state.contractParams.symbol,
                                contractURI: state.contractParams.contractURI
                            },
                            factoryAddress,
                            function(){
                                $toolElement.addClass("Q_working");
                            },
                            function(err){
                                $toolElement.removeClass("Q_working");
                                if (err) {
                                    Q.alert(err);
                                }
                            }
                        );    
                    }
                } else {
                    Q.Dialogs.push({
                        title: tool.text.title.createCommunity,
                        className: "Users_web3_community_composer",
                        template: {
                            name: "Users/web3/community/composer",
                            fields: {
                                chains: state.chains,
                                selectedChainId: selectedChainId,
                                hideSelectChainIdContent: (state.showSelectChainId == false) && selectedChainId,
                                contractParams: state.contractParams            
                            }
                        },
                        onActivate: function (dialog) {
                            $("button[name=sendtx]", dialog).off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function(){
                                var userParams, validated;
                                [validated, userParams] = tool.validateOnForm(dialog);
                                userParams.selectedChainId = selectedChainId || userParams.selectedChainId;
                                var factoryAddress = tool.getFactoryAddress(userParams.selectedChainId);
                                if (typeof factoryAddress === 'undefined') {
                                    validated = false;
                                    Q.alert(tool.text.err.cantFindFactoryAddress);
                                }
                                if (validated) {
                                    tool.proceedAndSend(
                                        userParams,
                                        factoryAddress,
                                        function(){
                                            dialog.addClass("Q_working");
                                        },
                                        function(err){
                                            dialog.removeClass("Q_working");
                                            if (err) {
                                                Q.alert(err);
                                            }
                                            Q.Dialogs.pop();
                                        }
                                    );
                                }
                            });
                        }
                    });
                }
            });
        });
	},
    getFactoryAddress: function(selectedChainId){
        return Q.Users.Web3.contracts['Users/templates/R1/Community/factory'][selectedChainId];
    },
    /**
     * 
     * @param {type} $elContainer
     * @return {Array} [validated, userParams]
     */
    validateOnForm: function($elContainer){
        var tool = this;
		var state = this.state;
        
        var $fields = {
            selectedChainId: $elContainer.find('select[name=chain]'),
            hook: $elContainer.find('input[name=hook]'),
            invitedHook: $elContainer.find('input[name=invitedHook]'),
            name: $elContainer.find('input[name=name]'),
            symbol: $elContainer.find('input[name=symbol]'),
            contractURI: $elContainer.find('input[name=contractURI]')
        }
        var userParams = {
            selectedChainId: $fields.selectedChainId.val(),
            hook: state.contractParams.hook || $fields.hook.val(),
            invitedHook: state.contractParams.invitedHook || $fields.invitedHook.val(),
            name: state.contractParams.name || $fields.name.val(),
            symbol: state.contractParams.symbol || $fields.symbol.val(),
            contractURI: state.contractParams.contractURI || $fields.contractURI.val()
        };

        // simple validation.
        // if error send notice and add class Q_error to input field
        var validated = true;
        
        if (Q.isEmpty(userParams.hook) || !ethers.utils.isAddress(userParams.hook)) {
            validated = false;

            $("<span/>").addClass('error').html(tool.text.form.err.hook).insertBefore($fields.hook);
            $fields.hook.addClass('Q_error').addClass('fieldErrorBox');
        } else {
            $fields.hook.removeClass('Q_error').removeClass('fieldErrorBox');
        }

        if (Q.isEmpty(userParams.invitedHook) || !ethers.utils.isAddress(userParams.invitedHook)) {
            validated = false;

            $("<span/>").addClass('error').html(tool.text.form.err.invitedHook).insertBefore($fields.hook);
            $fields.hook.addClass('Q_error').addClass('fieldErrorBox');
        } else {
            $fields.hook.removeClass('Q_error').removeClass('fieldErrorBox');
        }

        if (Q.isEmpty(userParams.name)) {
            validated = false;

            $("<span/>").addClass('error').html(tool.text.form.err.name).insertBefore($fields.name);
            $fields.name.addClass('Q_error').addClass('fieldErrorBox');
        } else {
            $fields.name.removeClass('Q_error').removeClass('fieldErrorBox');
        }

        if (Q.isEmpty(userParams.symbol)) {
            validated = false;

            $("<span/>").addClass('error').html(tool.text.form.err.symbol).insertBefore($fields.symbol);
            $fields.symbol.addClass('Q_error').addClass('fieldErrorBox');
        } else {
            $fields.symbol.removeClass('Q_error').removeClass('fieldErrorBox');
        }
        if (Q.isEmpty(userParams.contractURI)) {
            validated = false;

            $("<span/>").addClass('error').html(tool.text.form.err.contracturi).insertBefore($fields.contractURI);

            $fields.contractURI.addClass('Q_error').addClass('fieldErrorBox');
        } else {
            $fields.contractURI.removeClass('Q_error').removeClass('fieldErrorBox');
            $fields.contractURI.find('.error');
        }
        
        return [validated, userParams];
    },
    /**
     * 
     * @param {type} userParams data to send
     * @param {function} onProcessWorking, called when need to disable user interface
     * @param {type} onProcessNotWorking, called when need to enable user interface after onProcessWorking
     */
    proceedAndSend: function(userParams, factoryAddress, onProcessWorking = function(){}, onProcessNotWorking = function(){}) {
        var tool = this;
		var state = this.state;
		//var $toolElement = $(tool.element);
        
        
        // pre-check to creation when xid alrteady exists
        // second validation on backend side. tx will be mined but backend will not update xid in DB
        var xidAlreadyExists=false;
        state.chains.forEach(function(item, index) {
            if (item["chainId"] === userParams.selectedChainId && item["xid"]) {
                xidAlreadyExists = true;
            }
        });
        if (xidAlreadyExists) {return;}
        //----------------
                
        var contractABIName = 'Users/templates/R1/Community/factory';
        var txData = {};
        Q.handle(onProcessWorking);
        Q.Users.Web3.getFactory(
            contractABIName,
            {
            chainId: userParams.selectedChainId,
            //contractAddress: factoryAddress,
            readOnly: false
            }
        ).then(function (communityFactory) {
            return communityFactory.produce(
                userParams.hook,
                userParams.invitedHook,
                userParams.name,
                userParams.symbol,
                userParams.contractURI
            );
        }).then(function (tx) {

            var produceParams = Q.copy(userParams);
            delete produceParams['selectedChainId'];


            Q.req("Users/transaction", ["result"], function (err, response) {

                var fem = Q.firstErrorMessage(err, response);
                if (fem) {return console.warn(fem);}

            }, {
                method: "post",
                fields: {
                    communityId: state.communityId,
                    chainId: tx.chainId == 0 ? userParams.selectedChainId : tx.chainId,
                    transactionId: tx.hash,
                    fromAddress: tx.from,
                    contract: factoryAddress,
                    contractABIName: contractABIName,
                    methodName: "produce",
                    params: JSON.stringify(produceParams)
                }
            });
            txData.tx = tx;

            return tx.wait();
        }).then(function (receipt) {

            // additionally try to get instace address when transaction will be mine. 
            // it can be processing by cron job
            if (receipt.status == 1) {
                var event = receipt.events.find(function (event) {
                    return event.event === 'InstanceCreated'
                });
                var instance;
                [instance, /*instancesCount*/] = event.args;

                var txChainId = txData["tx"].chainId == 0 ? userParams.selectedChainId : txData["tx"].chainId;
                Q.req("Users/transaction", ["result"], function (err, response) {

                    var fem = Q.firstErrorMessage(err, response);
                    if (fem) {return console.warn(fem);}

                }, {
                    method: "put",
                    fields: {
                        communityId: state.communityId,
                        chainId: txChainId,
                        transactionId: txData["tx"].hash,
                        status: "mined",
                        contract: instance,
                        result: JSON.stringify(receipt)
                    }
                });

                //state.chains
                //update xid in state.chains

                state.chains.forEach(function(item, index) {
                    if (item["chainId"] === txChainId) {
                        item["xid"] = instance;
                    }

                });

                tool.refresh();
                Q.handle(onProcessNotWorking);
            } else {
                Q.handle(onProcessNotWorking, null, [tool.text.err.transactionFailed]);
            }


        }).catch(function (err) {
            var msg = Q.getObject("message", err);

            Q.handle(onProcessNotWorking, null, [msg ? msg : tool.text.err.smthWentWrong]);
            
        });
    }
}
);

Q.Template.set('Users/web3/community/list',
`
<table class="table">
    <tr>
        <th>{{list.table.td0}}</th>
        <th>{{list.table.td1}}</th>
        <th>{{list.table.td2}}</th>
    </tr>
{{#each chains}}
    <tr>
        <td>{{this.name}}</td>
        <td>{{this.chainId}}</td>
        <td>
    {{#if this.xid}}
            <a target="_blank" href="{{call "Q.Users.Web3.getExplorerLink" this.xid this.chainId "address/"}}">
                {{call "Q.Users.Web3.abbreviateAddress" this.xid}}
            </a>
    {{else}}
            <button class="Q_button" name="produce" data-chainId="{{this.chainId}}">{{../list.btnTitle}}</button>
    {{/if}}
        </td>
    </tr>
{{/each}}
</table>
`,
    {text: ["Users/content", "Users/web3/community"]}
);

Q.Template.set('Users/web3/community/composer',
	`
    <div class="form">
    {{#if hideSelectChainIdContent}}
    {{else}}
        <div class="form-group row">
            <label class="col-sm-3 col-form-label">{{form.labels.chain}}</label>
            <div class="col-sm-9">
                <select class="form-control" name="chain">
                {{#each chains}}
                    <option value="{{this.chainId}}" {{#ifEquals ../selectedChainId this.chainId}}selected{{/ifEquals}}>{{this.name}}</option>
                {{/each}}
                </select>
            </div>
        </div>
    
    {{/if}}
    {{#if contractParams.hook}}
    {{else}}
        <div class="form-group row">
            <label class="col-sm-3 col-form-label">{{form.labels.hook}}</label>
            <div class="col-sm-9">
            <input type="text" class="form-control" name="hook" placeholder="{{form.placeholders.hook}}">
            <small>{{form.small.hook}}</small>
            </div>
        </div>
    {{/if}}
    {{#if contractParams.invitedHook}}
    {{else}}
        <div class="form-group row">
            <label class="col-sm-3 col-form-label">{{form.labels.invitedHook}}</label>
            <div class="col-sm-9">
            <input type="text" class="form-control" name="invitedHook" placeholder="{{form.placeholders.invitedHook}}">
            <small>{{form.small.invitedHook}}</small>
            </div>
        </div>
    {{/if}}
    {{#if contractParams.name}}
    {{else}}
        <div class="form-group row">
            <label class="col-sm-3 col-form-label">{{form.labels.name}}</label>
            <div class="col-sm-9">
            <input type="text" class="form-control" name="name" placeholder="{{form.placeholders.name}}">
            <small>{{form.small.name}}</small>
            </div>
        </div>
    {{/if}}
    {{#if contractParams.symbol}}
    {{else}}
        <div class="form-group row">
            <label class="col-sm-3 col-form-label">{{form.labels.symbol}}</label>
            <div class="col-sm-9">
            <input type="text" class="form-control" name="symbol" placeholder="{{form.placeholders.symbol}}">
            <small>{{form.small.symbol}}</small>
            </div>
        </div>
    {{/if}}
    {{#if contractParams.contractURI}}
    {{else}}
        <div class="form-group row">
            <label class="col-sm-3 col-form-label">{{form.labels.contracturi}}</label>
            <div class="col-sm-9">
            <input type="text" class="form-control" name="contractURI" placeholder="{{form.placeholders.contracturi}}">
            <small>{{form.small.contracturi}}</small>
            </div>
        </div>
    {{/if}}
        <div class="form-group row">
            <div class="col-sm-10">
            <button type="submit" name="sendtx" class="Q_button">{{form.btnTitle}}</button>
            </div>
        </div>
    </div>
    `,
    {text: ["Users/content", "Users/web3/community"]}
);

})(Q, Q.jQuery, window);