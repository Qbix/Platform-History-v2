 
(function (window, Q, $, undefined) {

if (Q.isEmpty(Q["grabMetamaskError"])) {
    
    // see https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
    // TODO need to handle most of them
    Q.grabMetamaskError = function _Q_grabMetamaskError(err, contracts) {
	
	if (err.code = '-32603') {
	    if (!Q.isEmpty(err.data)) { 
		if (err.data.code = 3) {
		    //'execution reverted'	
		    
		    var str = '';
		    contracts.every(function(contract){
			console.log(contract);
			try {
			    let customErrorDescription = contract.interface.getError(ethers.utils.hexDataSlice(err.data.data, 0,4)); // parsed 
			    if (customErrorDescription) {

				let decodedStr = ethers.utils.defaultAbiCoder.decode(
				  customErrorDescription.inputs.map(obj => obj.type),
				  ethers.utils.hexDataSlice(err.data.data, 4)
				);
				str = `${customErrorDescription.name}(${(decodedStr.length>0) ? '"'+decodedStr.join('","')+'"' : ''})`;
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
/**
 * @module Assets
 */
	
/**
 * YUIDoc description goes here
 * @class Assets NFT locked
 * @constructor
 * @param {Object} [options] Override various options for this tool
 * @param {String} [options.abiPath] ABI path for LockedHook contract
 * @param {String} [options.NFTAddress] NFTAddress address
 * @param {String} [options.abiNFT] ABI path for NFT contract
 * @param {Object} [seriesIdSource] Datasource for getting seriesId. it can be series number or sales address where script try to get series id from public state
 * @param {String} [options.seriesId] series ID 
 * @param {String} [options.salesAddress] address of NFTsales contract
 * @param {String} [options.abiNFTSales] ABI path for NFTsales contract
  
 */
Q.Tool.define("Assets/NFT/locked", function (options) {
    var tool = this;
    var state = tool.state;
 
    if (Q.isEmpty(state.NFTAddress)) {
	return console.warn("Assets/NFT/locked", "NFTAddress required!");
    }
    
    Promise.all([tool.nftContractPromise(), tool.lockedContractPromise()])
	.then(function (_ref) {
	    var nftContract = _ref[0];
	    var lockedContract = _ref[1];
	    
	    var seriesId;
	    return tool.seriesIdGetPromise().then(function(_seriesId){
		seriesId = _seriesId;
		return nftContract.getHookList(seriesId);
	    }).then(function(allHooksArr){
		return [
			allHooksArr.indexOf(lockedContract.address) >= 0 ? true : false,
			nftContract,
			lockedContract,
			seriesId
		];
	    });
	    
	}).then(function([b, nftContract,lockedContract, seriesId]){
	    if (!b)  {
		console.group("Assets/NFT/locked Warn");
		console.log("locked contract does not setup on NFT as a hook on this seriesId");
		console.log("nftContract=", nftContract.address);
		console.log("lockedContract=", lockedContract.address);
		console.log("seriesId=", seriesId);
		console.groupEnd();
		return;
	    }

	    Q.Text.get('Assets/content', function(err, text){
		if (err) {
		    return;
		}
		tool.text = text;
		tool.refresh();
	    });
	});
        
},

{ // default options here
    abiPath: "Assets/templates/R1/NFT/locked",
    //lockedAddress: '',
    NFTAddress: '',
    abiNFT: "Assets/templates/R1/NFT/contract",
    tokenId: null,
    seriesIdSource: {
	seriesId: null,
	salesAddress: '',
	abiNFTSales: "Assets/templates/R1/NFT/sales/contract"
    },
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    seriesIdGetPromise: function() {
	
	var state = this.state;
	if (!Q.isEmpty(state.seriesIdSource.seriesId)) {
	    return Promise.resolve(state.seriesIdSource.seriesId);
	} else if (!Q.isEmpty(state.seriesIdSource.salesAddress)) {
	    
	    return Q.Users.Web3.getContract(state.seriesIdSource.abiNFTSales, state.seriesIdSource.salesAddress)
		.then(salesContract => {
		    return salesContract.seriesId();
		});
	} else {
	    return console.warn("Assets/NFT/locked", "There are no available data source for getting seriesId")
	}	
    },
    nftContractPromise: function() {
	var state = this.state;
	return Q.Users.Web3.getContract(state.abiNFT, state.NFTAddress);
    },
    lockedContractPromise: function() {
	return Q.Users.Web3.getFactory('Assets/templates/R1/NFT/locked');
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
            "Assets/NFT/locked", 
            {
                //TestParam: "Lorem ipsum dolor sit amet",
            },
            function(err, html){
                tool.element.innerHTML = html;
                Q.activate(tool.element, function(){});
                var state = tool.state;
		              
		if (!Q.isEmpty(state.tokenID)) {
		    
		}
			      
                $('.Assets_NFT_locked_lockBtn', tool.element).on(Q.Pointer.fastclick, function(){

                    Q.Dialogs.push({    
                            title: tool.text.NFT.locked.Lock,
                            content:`
				    <div class="Assets_NFT_locked_form">
					<div class="form-group">
					    <label>${tool.text.NFT.locked.form.labels.tokenId}</label>
					    <input name="tokenId" type="text" class="form-control" placeholder="${tool.text.NFT.locked.placeholders.tokenId}">
					    <small class="form-text text-muted">${tool.text.NFT.locked.form.small.tokenId}</small>
					</div>
					<div class="form-group">
					    <label>${tool.text.NFT.locked.form.labels.custodian}</label>
					    <input name="custodian" type="text" class="form-control" placeholder="${tool.text.NFT.locked.placeholders.custodian}">
					    <small class="form-text text-muted">${tool.text.NFT.locked.form.small.custodian}</small>
					</div>
					<button class="Assets_NFT_locked_dialogLock Q_button">${tool.text.NFT.locked.Lock}</button>
				    </div>
				    `,
                            onActivate: function ($dialog) {
                                $(".Assets_NFT_locked_dialogLock", $dialog).on(Q.Pointer.fastclick, function(){
                                    $(this).addClass('Q_loading');
                                    let tokenId = $($dialog).find("[name='tokenId']").val();
				    let custodian = $($dialog).find("[name='custodian']").val();
                                    if (!tokenId) {
					Q.Dialogs.pop();
					return Q.alert(tool.text.NFT.locked.errors.invalidTokenId);
				    }
				    if (!custodian) {
					Q.Dialogs.pop();
					return Q.alert(tool.text.NFT.locked.errors.invalidCustodian);
				    }
				    
				    return Promise.all([tool.nftContractPromise(), tool.lockedContractPromise()]).then(function (_ref) {
					var nftContract = _ref[0];
					var lockedContract = _ref[1];

					return nftContract.ownerOf(tokenId).then(function(owner){

					    if (owner.toLowerCase() != Q.Users.Web3.getSelectedXid().toLowerCase()) {
						throw new Error('Sender is not an owner for this tokenId');
					    }
					    return lockedContract.lock(nftContract.address, tokenId, custodian);
					}).then(function(txResponce){
					    
					    txResponce.wait().then(function(){
						Q.Dialogs.pop();
						Q.Notices.add({
						    content: `Token with ID "${tokenId}" was locked successfully`,
						    timeout: 5
						});
						
					    },function(err){
						Q.Dialogs.pop();
						Q.handle(null, null, [err.reason]);
					    });
					}).catch(function(err){

					    Q.Dialogs.pop();
					    //alert(Q.grabMetamaskError(err, [nftContract,lockedContract]));
					    Q.Notices.add({
						content: Q.grabMetamaskError(err, [nftContract,lockedContract]),
						timeout: 5
					    });
					    //Q.Dialogs.pop();
					})
				    });
	    
                            
                                });
                            }
                    });
                });
                
                $('.Assets_NFT_locked_unlockBtn', tool.element).on(Q.Pointer.fastclick, function(){
                    Q.Dialogs.push({    
                            title: tool.text.NFT.locked.Unlock,
                            content: `
				    <div class="Assets_NFT_locked_form">
					<div class="form-group">
					    <label>${tool.text.NFT.locked.form.labels.tokenId}</label>
					    <input name="tokenId" type="text" class="form-control" placeholder="${tool.text.NFT.locked.placeholders.tokenId}">
					    <small class="form-text text-muted">${tool.text.NFT.locked.form.small.tokenId}</small>
					</div>
					<button class="Assets_NFT_locked_dialogUnlock Q_button">${tool.text.NFT.locked.Unlock}</button>
				    </div>
				    `,
                            onActivate: function ($dialog) {
                                $(".Assets_NFT_locked_dialogUnlock", $dialog).on(Q.Pointer.fastclick, function(){
                                    $(this).addClass('Q_loading');
                                    let tokenId = $($dialog).find("[name='tokenId']").val();
                                    if (!tokenId) {
					Q.Dialogs.pop();
					return Q.alert(tool.text.NFT.locked.errors.invalidTokenId);
				    }
				    
				    return Promise.all([tool.nftContractPromise(), tool.lockedContractPromise()]).then(function (_ref) {
					var nftContract = _ref[0];
					var lockedContract = _ref[1];
					return lockedContract.unlock(nftContract.address, tokenId).then(function(txResponce){
					    txResponce.wait().then(function(){
						Q.Dialogs.pop();
						Q.Notices.add({
						    content: `Token with ID "${tokenId}" was unlocked successfully`,
						    timeout: 5
						});

					    },function(err){
						Q.Dialogs.pop();
						Q.handle(null, null, [err.reason]);
					    });
					}).catch(function(err){

					    Q.Dialogs.pop();
					    Q.Notices.add({
						content: Q.grabMetamaskError(err, [nftContract,lockedContract]),
						timeout: 5
					    });

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

Q.Template.set("Assets/NFT/locked", 
    `<div>
        <div class="Assets_NFT_sales_lock_сontainer">
	    <button class="Assets_NFT_locked_lockBtn Q_button">{{NFT.locked.btn.Lock}}</button>
	    <button class="Assets_NFT_locked_unlockBtn Q_button">{{NFT.locked.btn.Unlock}}</button>
        </div>
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);