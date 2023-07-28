(function (window, Q, $, undefined) {

    /**
     * @module Users
     */
    
    /**
     * Allows a user to select a web3 address from an existing user,
     * or paste one manually. Later, we will also render "recently used" addresses.
     * @class Users/web3/address
     * @constructor
     * @param {Object} options Override various options for this tool
     * @param {Object} userChooser Override any options for userChooser child tool
     * @param {String} [chosen.address] You can pass an initial address here, that may be changed by the tool UX
     */
    
    Q.Tool.define("Users/web3/address", function (options) {
        this.refresh();
    },
    
    { // default options here
        chosen: {
            address: null
        },
        userChooser: {
            communitiesOnly: false,
            onChoose: new Q.Event()
        },
        onRefresh: new Q.Event(),
        onAddress: new Q.Event(function (address) {
            var tool = this;
            var abbr = Q.Users.Web3.abbreviateAddress(address);
            if (!abbr) {
                return Q.alert(Q.text.Users.errors.WalletInvalid);
            }
            tool.$input.val(abbr);
            var $te = $(this.element);
            $te.addClass('Users_web3_address_set');
            tool.$input.blur().on('focus', function () {
                tool.$input.val('')
                $te.removeClass('Users_web3_address_set');
            });
        }, 'Users/web3/address')
    },
    
    { // methods go here
        refresh: function () {
            var tool = this;
            var state = this.state;
    
            var button = document.createElement('button');
            var img = document.createElement('img');
            img.setAttribute('src', Q.url('{{Users}}/img/platforms/web3.png'));
            button.appendChild(img);
    
            state.userChooser.onChoose.set(function (userId, avatar) {
                _getXid(tool, userId, function (err, xid) {
                    if (err) {
                        return Q.alert(err);
                    }
                    if (false !== Q.handle(state.onAddress, tool, [xid])) {
                        state.chosen.address = xid;
                    }
                });
            }, tool);
    
            button.addEventListener('click', function () {
                Q.prompt(Q.text.Users.web3.PasteAddress, function (xid) {
                    // TODO: validate address if it's mixed case,
                    // after implementing Users.Web3.validateAddress()
                    Q.handle(state.onAddress, tool, [xid]);
                    state.chosen.address = xid;
                });
            });
            
            var ucOptions = Q.extend({
                platform: 'web3',
                initialList: {
                    key: 'Users/web3/address'
                }
            }, state.userChooser);
            var ucElement = Q.Tool.prepare('div', 'Streams/userChooser', ucOptions, 'userChooser');
            tool.element.innerHTML = '';
            tool.element.appendChild(ucElement);
            tool.element.appendChild(button);
    
            Q.activate(ucElement, tool.state.userChooser, function () {
                tool.$input = this.$input;
                tool.$input.on('input paste', function (event) {
                    if (Q.Users.Web3.validate.address(event.target.value)) {
                        Q.handle(state.onAddress, tool, [event.target.value]);
                    }
                });
            });
        }
    });
    
    // this function might eventually be moved to Q.Streams.Web3
    function _getXid(tool, userId, callback) {
        Q.Streams.get(userId, "Streams/user/xid/web3", function (err) {
            if (err) {
                return callback(err);
            }
    
            var wallet, walletError;
            if (!this.testReadLevel("content")) {
                walletError = tool.text.errors.NotEnoughPermissionsWallet;
            } else {
                wallet = this.fields.content;
                if (!wallet) {
                    walletError = tool.text.errors.ThisUserHaveNoWallet;
                } else if (!ethers.utils.isAddress(wallet)) {
                    walletError = tool.text.errors.TheWalletOfThisUserInvalid;
                }
            }
    
            if (walletError) {
                return callback(walletError);
            }
    
            callback(null, this.fields.content);
        });
    }
    
    })(window, Q, jQuery);