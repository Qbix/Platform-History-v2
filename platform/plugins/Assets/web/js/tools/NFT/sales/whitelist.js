(function (window, Q, $, undefined) {

/**
 * @module Assets
 */
	
/**
 * YUIDoc description goes here
 * @class Assets sales whitelist
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.publisherId] user id of the publisher of the stream
 *  @param {String} [options.streamName] the stream's name
 *  @param {Q.Event} [options.onMove] Event that fires after a move
 */

Q.Tool.define("Assets/NFT/sales/whitelist", function (options) {
    var tool = this;
    var state = tool.state;
    
    if (Q.isEmpty(state.salesAddress)) {
        return console.warn("salesAddress required!");
    }
    
    tool.refresh();
    
    var pipe = Q.pipe(["stylesheet","text"], function (params, subjects) {
    });
    
    Q.addStylesheet("{{Assets}}/css/tools/NFT/sales/whitelist.css", pipe.fill('stylesheet'), { slotName: 'Assets' });

    Q.Text.get('Assets/content', function(err, text) {
        tool.text = text;
        pipe.fill('text')();
    }, {
        ignoreCache: true
    });
        
},

{ // default options here
    abiPath: "Assets/templates/R1/NFT/sales/contract",
    salesAddress: '',
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
//    addToWhitelist: function(account) {},
//    removeFromWhitelist: function(account) {},
    relatedToolRefresh: function() {
        var relatedTool = Q.Tool.from($(this.element).closest(".Assets_sales_tool")[0], "Assets/NFT/sales");
        if (relatedTool) {
            relatedTool.refresh();
        }
    },
    
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
            "Assets/NFT/sales/whitelist", 
            {
                //TestParam: "Lorem ipsum dolor sit amet",
            },
            function(err, html){
                tool.element.innerHTML = html;
                Q.activate(tool.element, function(){});
                var state = tool.state;

                // check is in whitelist
                Q.Users.Web3.getContract(
                    state.abiPath, 
                    state.salesAddress
                ).then(function (contract) {
                    return contract.owner();
                }).then(function (account) {
                    let objContainer = $(tool.element).find(".Assets_NFT_sales_whitelist_сontainer");
                    if (Q.Users.Web3.getSelectedXid().toLowerCase() == account.toLowerCase()) {
                        objContainer.show();
                    } else {
                        objContainer.hide();
                    }
                });
                
                var contentManageWhitelist = function(btnClassname, btnTitle){
                    return `
                        <div class="Assets_NFT_sales_whitelist_form">
                            <div class="form-group">
                                <label>${tool.text.NFT.sales.whitelist.form.labels.account}</label>
                                <input name="account" type="text" class="form-control" placeholder="${tool.text.NFT.sales.whitelist.placeholders.account}">
                                <small class="form-text text-muted">${tool.text.NFT.sales.whitelist.form.small.account}</small>
                            </div>
                            <button class="${btnClassname} Q_button">${btnTitle}</button>
                        </div>
                    `;
                }
                
                $('.Assets_NFT_sales_whitelist_add', tool.element).on(Q.Pointer.fastclick, function(){
                    Q.Dialogs.push({    
                            title: tool.text.NFT.sales.whitelist.addToWhitelist,
                            content: contentManageWhitelist("Assets_NFT_sales_whitelist_dialogAdd", "Add"),
                            onActivate: function ($dialog) {
                                $(".Assets_NFT_sales_whitelist_dialogAdd", $dialog).on(Q.Pointer.fastclick, function(){
                                    $(this).addClass('Q_loading');
                                    let account = $($dialog).find("[name='account']").val();
                                    if (!account) {
                                            Q.Dialogs.pop();
                                            return Q.alert(tool.text.NFT.sales.whitelist.errors.invalidAddress);
                                        }
                                    Q.Users.Web3.getContract(
                                        state.abiPath, 
                                        state.salesAddress
                                    ).then(function (contract) {
                                        return contract.specialPurchasesListAdd([account]);
                                    }).then(function (txResponce) {
                                        txResponce.wait().then(function(){
                                            Q.Dialogs.pop();
                                            Q.Notices.add({
                                                content: `Account "${account}" was added into whitelist successfully`,
                                                timeout: 5
                                            });
                                            tool.relatedToolRefresh();
                                        },function(){
                                            Q.Dialogs.pop();
                                            Q.handle(null, null, [err.reason]);
                                        });
                                    });
                            
                                });
                            }
                    });
                });
                
                $('.Assets_NFT_sales_whitelist_remove', tool.element).on(Q.Pointer.fastclick, function(){
                    Q.Dialogs.push({    
                            title: tool.text.NFT.sales.whitelist.removeFromWhitelist,
                            content: contentManageWhitelist("Assets_NFT_sales_whitelist_dialogRemove", "Remove"),
                            onActivate: function ($dialog) {
                                $(".Assets_NFT_sales_whitelist_dialogRemove", $dialog).on(Q.Pointer.fastclick, function(){
                                    $(this).addClass('Q_loading');
                                    let account = $($dialog).find("[name='account']").val();
                                    if (!account) {
                                            Q.Dialogs.pop();
                                            return Q.alert(tool.text.NFT.sales.whitelist.errors.invalidAddress);
                                        }
                                    Q.Users.Web3.getContract(
                                        state.abiPath, 
                                        state.salesAddress
                                    ).then(function (contract) {
                                        return contract.specialPurchasesListRemove([account]);
                                    }).then(function (txResponce) {
                                        txResponce.wait().then(function(){
                                            Q.Dialogs.pop();
                                            Q.Notices.add({
                                                content: `Account "${account}" was removed from whitelist successfully`,
                                                timeout: 5
                                            });
                                            tool.relatedToolRefresh();
                                        },function(){
                                            Q.Dialogs.pop();
                                            Q.handle(null, null, [err.reason]);
                                        });
                                    });
                            
                                });
                            }
                    });
                });

            }
        );

    }
	
});

Q.Template.set("Assets/NFT/sales/whitelist", 
    `<div>
        <div class="Assets_NFT_sales_whitelist_сontainer">
            <h3>Manage Whitelist</h3>
            <button class="Assets_NFT_sales_whitelist_add Q_button">Add</button>
            <button class="Assets_NFT_sales_whitelist_remove Q_button">Remove</button>
        </div>
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);