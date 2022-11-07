
(function (window, Q, $, undefined) {
	
/**
 * @module Assets
 */
	
/**
 * YUIDoc description goes here
 * @class Assets cool
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.publisherId] user id of the publisher of the stream
 *  @param {String} [options.streamName] the stream's name
 *  @param {Q.Event} [options.onMove] Event that fires after a move
 */

Q.Tool.define("Assets/sales", function (options) {
	var tool = this;
	var state = tool.state;

        // fill missed attr fields
        for (var i in state.fields) {
            
            if (typeof(state.fields[i]) === "string") {
                state.fields[i] = {
                    value: state.fields[i],
                    hide: false
                }
            } else if (typeof(state.fields[i]) === "object") {
                if (Q.isEmpty(state.fields[i]["value"])) {
                    state.fields[i]["value"] = "";
                }
                if (Q.isEmpty(state.fields[i]["hide"])) {
                    state.fields[i]["hide"] = false;
                }
            }
        }
        
        if (Q.isEmpty(state.abiPath)) {
            return console.warn("abiPath required!");
        }
        if (Q.isEmpty(state.nftSaleAddress)) {
            return console.warn("nftSaleAddress required!");
        }
        
	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
                
                Q.Users.Web3.onAccountsChanged.set(function () {
                    tool.refresh();
                }, tool);
                
		tool.refresh();
	});
        Q.addStylesheet("{{Assets}}/css/tools/NFT/sales.css", p.fill('stylesheet'), { slotName: 'Assets' });
	Q.Text.get('Assets/content', p.fill('text'));
},

{ // default options here
    fields: {
        account: {value: "", hide: false},
        amount: {value: "", hide: false}
    },
    nftSaleAddress: '',
    abiPath: '',    
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    specialPurchase: function(
        account,
        amount
    ) {
        var state = this.state;

        Q.Assets.NFT.Web3.checkProvider(
            Q.Assets.NFT.defaultChain, 
            function (err, contract) { 

                if (state.paymentCurrency != "0x0000000000000000000000000000000000000000") {
                    Q.alert("not supported yet");
                    // need approve before.  we can do it here 
                }

                let calculateTotalAmount = (state.paymentPrice).mul(amount);

                //ethers.utils.parseEther("0.1")
                contract.specialPurchase(account,amount, {value: calculateTotalAmount}).then(function () {

                    //Q.handle(callback, null, [null, tokensAmount]);
                }, function (err) {
                    console.log("err", err.reason);
                    Q.handle(null, null, [err.reason]);
                });
            }, 
            {
                contractAddress: state.nftSaleAddress, 
                abiPath: state.abiPath
            }
        );
    },

    purchase: function(
        account, // address
        amount // uint256
    ) {

        var state = this.state;

        Q.Assets.NFT.Web3.checkProvider(
            Q.Assets.NFT.defaultChain, 
            function (err, contract) { 
                
                contract.purchase(account,amount).then(function () {

                    //Q.handle(callback, null, [null, tokensAmount]);
                }, function (err) {
                    console.log("err", err.reason);
                    Q.handle(null, null, [err.reason]);
                });
            }, 
            {
                contractAddress: state.nftSaleAddress, 
                abiPath: state.abiPath
            }
        );
            
    },
    
    //isInWhitelist: function(account) {},

    /**
     * Refreshes the appearance of the tool completely
     * @method getMyStream
     * @param {Function} callback receives arguments (err) with this = stream
     */
    refresh: function () {
        
        var tool = this;
        var state = tool.state;

        state.a = Date.now();

        //var t = tool.getMultiple(3,5);

        // if user login then 
        Q.Template.render(
            "Assets/sales", 
            {
                TestParam: "Lorem ipsum dolor sit amet",

                fields:state.fields,
                nftSaleAddress: state.nftSaleAddress, 
                abiPath: state.abiPath
            },
            function(err, html){
                
                tool.element.innerHTML = html;

                var state = tool.state;
                
                Q.activate(tool.element, function(){
                    
                });
                    
                // check is in whitelist
                Q.Assets.NFT.Web3.checkProvider(
                    Q.Assets.NFT.defaultChain, 
                    function (err, contract) { 
                        contract.isWhitelisted(Q.Users.Web3.getSelectedXid()).then(function (isInWhitelist) {
                            if (isInWhitelist) {
                                $(tool.element).find(".jsSpecialPurchase").removeClass("Q_disabled");
                            } else {
                                $(tool.element).find(".jsSpecialPurchase").addClass("Q_disabled");
                            }
                            
                            //Q.handle(callback, null, [null, tokensAmount]);
                        }, function (err) {
                            
                            Q.handle(null, null, [err.reason]);
                        });
                    }, 
                    {
                        contractAddress: state.nftSaleAddress, 
                        abiPath: state.abiPath
                    }
                );
                
                //check if current user is owner
                Q.Assets.NFT.Web3.checkProvider(
                    Q.Assets.NFT.defaultChain, 
                    function (err, contract) { 
                        contract.owner().then(function (ownerAddress) {
   
                            if (Q.Users.Web3.getSelectedXid() == ownerAddress) {
                                Q.Template.render(
                                    "Assets/sales/whitelist", 
                                {
                                    TestParam: "Lorem ipsum dolor sit amet",
                                },
                                function(err, html){

                                }
                                );
                            }
                            
                            //Q.handle(callback, null, [null, tokensAmount]);
                        }, function (err) {
                            
                            Q.handle(null, null, [err.reason]);
                        });
                        
                        // get specialPrice
                        contract.price().then(function (currency) {
                           state.paymentPrice = currency;
                        }, function (err) {
                            Q.handle(null, null, [err.reason]);
                        });
                        // 
                        // get paymentToken
                        contract.currency().then(function (currency) {
                           state.paymentCurrency = currency;
                        }, function (err) {
                            Q.handle(null, null, [err.reason]);
                        });
                    }, 
                    {
                        contractAddress: state.nftSaleAddress, 
                        abiPath: state.abiPath
                    }
                );
                        
                $('.jsPurchase', tool.element).on(Q.Pointer.fastclick, function(){

                    //collect form
                    let account = $(tool.element).find("[name='account']").val();
                    account = account || state.fields.account.value || Q.Users.Web3.getLoggedInUserXid();
                    
                    let amount = $(tool.element).find("[name='amount']").val();
                   
                    // call 
                    tool.purchase(account, amount);

                });
                
                $('.jsSpecialPurchase', tool.element).on(Q.Pointer.fastclick, function(){

                    //collect form
                    let account = $(tool.element).find("[name='account']").val();
                    account = account || state.fields.account.value || Q.Users.Web3.getLoggedInUserXid();
                    
                    let amount = $(tool.element).find("[name='amount']").val();
                   
                    // call 
                    tool.specialPurchase(account, amount);

                });
            }
        );

	}
	
});

Q.Template.set("Assets/sales", 
    `<div>
        <div class="form">
            <div class="form-group">
                <label>{{NFT.sales.instance.form.labels.account}}</label>
                <input name="account" type="text" class="form-control" placeholder="{{NFT.sales.instance.placeholders.account}} {{NFT.sales.instance.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.instance.form.small.account}}</small>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="form-group">
                        <label>{{NFT.sales.instance.form.labels.amount}}</label>
                        <input name="amount" type="text" class="form-control" placeholder="{{NFT.sales.instance.placeholders.integer}}">
                        <small class="form-text text-muted">{{NFT.sales.instance.form.small.amount}}</small>
                    </div>
                </div>
            </div>
    
            <button class="jsPurchase Q_button">{{NFT.sales.instance.btn.Purchase}}</button>
            <button class="jsSpecialPurchase Q_button">{{NFT.sales.instance.btn.SpecialPurchase}}</button>
            
            <div class="form-group">
                {{&tool "Assets/sales/whitelist" nftSaleAddress=nftSaleAddress abiPath=abiPath q=3 }}
            </div>
        </div>
    
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);