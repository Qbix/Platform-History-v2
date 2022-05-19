(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Users = Q.Users;
    var Streams = Q.Streams;
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
     *  @param {Q.Event} [options.onSelected] Event occur when series/preview selected
     */
    Q.Tool.define("Assets/NFT/series", function(options) {
        var tool = this;
        var state = tool.state;

        // is admin
        var roles = Object.keys(Q.getObject("roles", Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        state.userId = state.userId ? state.userId : Users.loggedInUserId();
        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }

        if (state.selectedSeriesId) {
            tool.selectedSeries = NFT.series.streamType + "/" + state.selectedSeriesId;
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
        selectedSeriesId: null,
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event(),
        onSelected: new Q.Event()
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
                relationType: Assets.NFT.series.relationType,
                editable: true,
                closeable: true,
                sortable: true,
                relatedOptions: {
                    withParticipant: false
                },
                specificOptions: {
                    userId: state.userId
                }
            };
            if (tool.isAdmin || state.userId === loggedInUserId) {
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

                tool.element.innerHTML = html;

                var $relatedToolBox = $(".relatedToolBox", $toolElement);
                var $nftToolBox = $(".nftToolBox", $toolElement);
                $relatedToolBox.tool("Streams/related", relatedOptions).activate();
                var count = 0;
                $relatedToolBox[0].forEachTool("Assets/NFT/series/preview", function () {
                    var seriesPreviewTool = this;
                    var streamName = seriesPreviewTool.preview.state.streamName;
                    if (!streamName) {
                        return;
                    }

                    count++;

                    seriesPreviewTool.state.onInvoke.set(function (stream) {
                        tool.setSelected(seriesPreviewTool);
                    }, seriesPreviewTool);

                    if (!tool.selectedSeries && count === 1) {
                        tool.setSelected(seriesPreviewTool);
                    } else if (tool.selectedSeries === streamName) {
                        $(this.element).addClass("Q_selected");
                    }

                    var normalizedStreamName = Q.normalize(streamName);
                    if ($("." + normalizedStreamName, $nftToolBox).length) {
                        return;
                    }

                    var $nftBox = $("<div>").addClass(normalizedStreamName).appendTo($nftToolBox);
                    var relatedOptions = {
                        publisherId: seriesPreviewTool.preview.state.publisherId,
                        streamName: seriesPreviewTool.preview.state.streamName,
                        relationType: NFT.relationType,
                        editable: false,
                        closeable: true,
                        sortable: true,
                        relatedOptions: {
                            withParticipant: false
                        },
                        specificOptions: {
                            userId: state.userId,
                            onCreated: function (streamData) {
                                var NFTPreview = this;
                                var NFTsRelatedTool = Q.Tool.from($(NFTPreview.element).closest(".Streams_related_tool")[0], "Streams/related");
                                NFTsRelatedTool && NFTsRelatedTool.refresh();

                                $(".Assets_NFT_preview_tool.Streams_related_composer", $toolElement).each(function () {
                                    var NFTpreviewTool = Q.Tool.from(this, "Assets/NFT/preview");
                                    if (NFTpreviewTool) {
                                        NFTpreviewTool.composer();
                                    } else {
                                        debugger
                                    }
                                });
                            }
                        }
                    };
                    if (tool.isAdmin || state.userId === loggedInUserId) {
                        relatedOptions.creatable = {};
                        relatedOptions.creatable = {
                            "Assets/NFT": {
                                publisherId: state.userId,
                                title: tool.text.NFT.CreateNFT
                            }
                        };
                    }
                    $nftBox[0].forEachTool("Streams/related", function () {
                        if (tool.selectedSeries === streamName) {
                            $(this.element).addClass("Q_selected");
                            $relatedToolBox.attr("data-seriesSelected", true);
                        }
                    });

                    // onClose series
                    seriesPreviewTool.state.onClose.set(function () {
                        var wasSelected = false;
                        var $nftBox = $("." + normalizedStreamName, $nftToolBox);
                        if ($nftBox.length) {
                            if ($nftBox.hasClass("Q_selected")) {
                                wasSelected = true;
                            }
                            Q.Tool.remove($nftBox[0], true, true);
                            $nftBox.remove();
                        }
                        if (wasSelected) {
                            $relatedToolBox.attr("data-seriesSelected", false);
                        }
                    }, tool);

                    $nftBox.tool("Streams/related", relatedOptions, null, Q.normalize(streamName)).activate();
                });
            });
        },
        /**
         * Set series preview tool selected
         * @method setSelected
         * @param {Q_Tool} seriesPreview - series preview tool
         */
        setSelected: function (seriesPreview) {
            var tool = this;
            var state = this.state;
            var publisherId = seriesPreview.preview.state.publisherId;
            var streamName = seriesPreview.preview.state.streamName;
            var $relatedToolBox = $(".relatedToolBox", this.element);

            $(seriesPreview.element).addClass("Q_selected").siblings(".Assets_NFT_series_preview_tool").removeClass("Q_selected");
            $(".nftToolBox ." + Q.normalize(streamName), tool.element).addClass("Q_selected").siblings().removeClass("Q_selected");
            $relatedToolBox.attr("data-seriesSelected", true);

            tool.selectedSeries = streamName;

            history.replaceState({}, null, window.location.pathname + "?selectedSeriesId=" + streamName.split("/").pop());

            Streams.get(publisherId, streamName, function () {
                Q.handle(state.onSelected, seriesPreview, [this]);
            });
        },
        /**
         * Set first series preview tool selected
         * @method setFirstSelected
         */
        setFirstSelected: function () {
            var tool = this;
            var $relatedToolBox = $(".relatedToolBox", this.element);
            $relatedToolBox.attr("data-seriesSelected", false);
            var $tools = $(".Assets_NFT_series_preview_tool:not(.Streams_preview_composer)", $relatedToolBox);
            if (!$tools.length) {
                return;
            }

            $tools.each(function (i) {
                if (i) {
                    return;
                }

                tool.setSelected(Q.Tool.from(this, "Assets/NFT/series/preview"));
            });
        }
    });

    Q.Template.set('Assets/NFT/series',
`<div class="relatedToolBox"></div><div class="nftToolBox"></div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);