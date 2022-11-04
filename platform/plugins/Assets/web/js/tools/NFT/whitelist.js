
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

Q.Tool.define("Assets/sales/whitelist", function (options) {
	var tool = this;
	var state = tool.state;
     
        if (Q.isEmpty(state.nftSaleAddress)) {
            return console.warn("nftSaleAddress required!");
        }
        if (Q.isEmpty(state.abiPath)) {
            return console.warn("abiPath required!");
        }
        
        tool.refresh();
//        
//	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
//		tool.text = params.text[1];
//                
//		tool.refresh();
//	});
//        Q.addStylesheet("{{Assets}}/css/tools/NFT/sales.css", p.fill('stylesheet'), { slotName: 'Assets' });
//	Q.Text.get('Assets/content', p.fill('text'));
},

{ // default options here
    
    nftSaleAddress: '',
    abiPath: '',    
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    addToWhitelist: function(account) {},
    removeFromWhitelist: function(account) {},
//
//    purchase: function(
//        seriesId, // uint64
//        account, // address
//        amount // uint256
//    ) {
//
//        var state = this.state;
//
//        Q.Assets.NFT.Web3.checkProvider(
//            Q.Assets.NFT.defaultChain, 
//            function (err, contract) { 
//                console.log(seriesId,account,amount);
//                console.log(contract);
//                contract.purchase(seriesId,account,amount).then(function () {
//console.log("ok");
//                    //Q.handle(callback, null, [null, tokensAmount]);
//                }, function (err) {
//console.log("err", err.reason);
//                    Q.handle(null, null, [err.reason]);
//                });
//            }, 
//            {
//                contractAddress: state.nftSaleAddress, 
//                abiPath: state.abiPath
//            }
//        );
//            
//    },
//    
  
    /**
     * Refreshes the appearance of the tool completely
     * @method getMyStream
     * @param {Function} callback receives arguments (err) with this = stream
     */
    refresh: function () {
        
        var tool = this;
        var state = tool.state;


        // if user login then 
        Q.Template.render(
            "Assets/sales/whitelist", 
            {
                //TestParam: "Lorem ipsum dolor sit amet",
                
            },
            function(err, html){
                
                tool.element.innerHTML = html;
                Q.activate(tool.element, function(){
                   
                });
                var state = tool.state;
                
                // check is in whitelist
                Q.Assets.NFT.Web3.checkProvider(
                    Q.Assets.NFT.defaultChain, 
                    function (err, contract) { 
                        contract.owner().then(function(account) {
                            if (Q.Users.Web3.getSelectedXid().toLowerCase() == account.toLowerCase()) {
                                $(tool.element).find(".jsToolContainer").show();
                            } else {
                                $(tool.element).find(".jsToolContainer").hide();
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

                var contentManageWhitelist = function(btnClassname, btnTitle){
                    return `
                        <div class="form">
                            <div class="form-group">
                                <label>Address</label>
                                <input name="account" type="text" class="form-control" placeholder="Address">
                                <small class="form-text text-muted">Address</small>
                            </div>
                            <button class="${btnClassname} Q_button">${btnTitle}</button>
                        </div>
                    `;
                }
                
                $('.jsAdd', tool.element).on(Q.Pointer.fastclick, function(){
                    Q.Dialogs.push({    
                            title: "Add To Whitelist",
                            content: contentManageWhitelist("jsDialogAdd", "Add"),
                            onActivate: function ($dialog) {
                                $(".jsDialogAdd", $dialog).on(Q.Pointer.fastclick, function(){

                                    Q.Assets.NFT.Web3.checkProvider(
                                        Q.Assets.NFT.defaultChain, 
                                        function (err, contract) { 
                                            var acc = $($dialog).find("[name='account']").val();
                                            if (!acc) {
                                                Q.Dialogs.pop();
                                                return Q.alert("Invalid Address");
                                            }
                                                                        
                                            contract.specialPurchasesListAdd([acc]).then(function() {
                                                Q.Dialogs.pop();
                                                //Q.handle(callback, null, [null, tokensAmount]);
                                            }, function (err) {
                                                Q.Dialogs.pop();
                                                Q.handle(null, null, [err.reason]);
                                            });
                                        }, 
                                        {
                                            contractAddress: state.nftSaleAddress, 
                                            abiPath: state.abiPath
                                        }
                                    );
                                });
                            }
                    });
         
                });
                
                $('.jsRemove', tool.element).on(Q.Pointer.fastclick, function(){
                    Q.Dialogs.push({    
                            title: "Remove from Whitelist",
                            content: contentManageWhitelist("jsDialogRemove", "Remove"),
                            onActivate: function ($dialog) {
                                $(".jsDialogRemove", $dialog).on(Q.Pointer.fastclick, function(){

                                    Q.Assets.NFT.Web3.checkProvider(
                                        Q.Assets.NFT.defaultChain, 
                                        function (err, contract) { 
                                            var acc = $($dialog).find("[name='account']").val();
                                            if (!acc) {
                                                Q.Dialogs.pop();
                                                return Q.alert("Invalid Address");
                                            }
                                                                        
                                            contract.specialPurchasesListRemove([acc]).then(function() {
                                                Q.Dialogs.pop();
                                                //Q.handle(callback, null, [null, tokensAmount]);
                                            }, function (err) {
                                                Q.Dialogs.pop();
                                                Q.handle(null, null, [err.reason]);
                                            });
                                        }, 
                                        {
                                            contractAddress: state.nftSaleAddress, 
                                            abiPath: state.abiPath
                                        }
                                    );
                                });
                            }
                    });
         
                });

            }
        );


            // if not 
            // Q.Template.render("error template");
//            
//           factoryaddress
//           nft contract
//           
	}
	
});

Q.Template.set("Assets/sales/whitelist", 
    `<div>
        <div class="jsToolContainer">
            <h3>Manage Whitelist</h3>
            <button class="jsAdd Q_button">Add</button>
            <button class="jsRemove Q_button">Remove</button>
        </div>
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);