(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Users = Q.Users;
    var Assets = Q.Assets;
    var NFT = Assets.NFT;
    var Web3 = NFT.Web3;

    /**
     * Series category tool
     * @class Assets NFT/series
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {string} userId
     *  @param {Q.Event} [options.onInvoke] Event occur when user click on tool element.
     *  @param {Q.Event} [options.onAvatar] Event occur when click on Users/avatar tool inside tool element.
     *  @param {Q.Event} [options.onCreated] Event occur when series created.
     */
    Q.Tool.define("Assets/NFT/series", function(options) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);

        // is admin
        var roles = Object.keys(Q.getObject("roles", Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        state.userId = state.userId ? state.userId : Users.loggedInUserId();
        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            tool.refresh();
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/series.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
    },

    { // default options here
        userId: null,
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event()
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         */
        refresh: function () {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var loggedInUserId = Users.loggedInUserId();
            var relatedOptions = {
                publisherId: state.userId,
                streamName: Assets.NFT.series.categoryStreamName,
                type: Assets.NFT.series.relationType,
                editable: true,
                closeable: true,
                sortable: true,
                relatedOptions: {
                    withParticipant: false
                }
            };
            if (state.userId === loggedInUserId) {
                relatedOptions.creatable = {};
                relatedOptions.creatable[Assets.NFT.series.streamType] = {
                    publisherId: state.userId,
                    title: tool.text.NFT.series.NewItem
                };
            }

            Q.Template.render("Assets/NFT/series", function (err, html) {
                if (err) {
                    return;
                }

                var $relatedToolBox = $(".relatedToolBox", tool.element);
                var $nftsToolBox = $(".nftsToolBox", tool.element);
                $relatedToolBox.tool("Streams/related", relatedOptions).activate();
                $relatedToolBox.forEachTool("Assets/NFT/series/preview", function () {
                    var seriesTool = this;
                    var normalizedStreamName = Q.normalize(seriesTool.preview.state.streamName);
                    if ($("." + normalizedStreamName, $nftsToolBox).length) {
                        return;
                    }

                    var $nftsBox = $("<div>").addClass("." + normalizedStreamName).appendTo($nftsToolBox);
                    var relatedOptions = {
                        publisherId: seriesTool.preview.state.publisherId,
                        streamName: seriesTool.preview.state.streamName,
                        type: "Assets/NFT",
                        editable: true,
                        closeable: true,
                        sortable: true,
                        relatedOptions: {
                            withParticipant: false
                        }
                    };
                    if (state.userId === loggedInUserId) {
                        relatedOptions.creatable = {};
                        relatedOptions.creatable = {
                            "Assets/NFT": {
                                publisherId: state.userId,
                                title: tool.text.NFT.CreateYourNFT
                            }
                        };
                    }
                    $nftsBox.tool("Streams/related");
                });
            });
        }
    });

    Q.Template.set('Assets/NFT/series',
`<div class="relatedToolBox"></div><div class="nftsToolBox"></div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);