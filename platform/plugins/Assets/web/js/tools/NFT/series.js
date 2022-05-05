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

        var pipe = Q.pipe(["stylesheet", "text", "selected"], function (params, subjects) {
            tool.refresh();
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/series.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
        Streams.related(state.userId, Assets.NFT.series.categoryStreamName, NFT.series.selectedRelationType, true, function (err) {
            if (err) {
                return;
            }

            if (Q.isEmpty(this.relatedStreams)) {
                tool.selectedSeries = null;
            } else {
                tool.selectedSeries = this.relatedStreams[Object.keys(this.relatedStreams)[0]];
            }

            pipe.fill('selected')();
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
                var $nftsToolBox = $(".nftsToolBox", $toolElement);
                $relatedToolBox.tool("Streams/related", relatedOptions).activate();
                $relatedToolBox[0].forEachTool("Assets/NFT/series/preview", function () {
                    var seriesTool = this;
                    var publisherId = seriesTool.preview.state.publisherId;
                    var streamName = seriesTool.preview.state.streamName;
                    if (!streamName) {
                        return;
                    }

                    seriesTool.state.onInvoke.set(function (stream) {
                        tool.setSelected(seriesTool, stream);
                    }, tool);

                    var normalizedStreamName = Q.normalize(streamName);
                    if ($("." + normalizedStreamName, $nftsToolBox).length) {
                        return;
                    }

                    var $nftsBox = $("<div>").addClass(normalizedStreamName).appendTo($nftsToolBox);
                    var relatedOptions = {
                        publisherId: seriesTool.preview.state.publisherId,
                        streamName: seriesTool.preview.state.streamName,
                        relationType: "Assets/NFT",
                        editable: true,
                        closeable: true,
                        sortable: true,
                        relatedOptions: {
                            withParticipant: false
                        },
                        specificOptions: {
                            userId: state.userId,
                            onCreated: function (streamData) {
                                var NFTPreview = this;

                                Q.Streams.relate(
                                    seriesTool.preview.state.publisherId,
                                    seriesTool.preview.state.streamName,
                                    "Assets/NFT",
                                    streamData.publisherId,
                                    streamData.streamName,
                                    function () {
                                        var NFTsRelatedTool = Q.Tool.from($(NFTPreview.element).closest(".Streams_related_tool")[0], "Streams/related");
                                        NFTsRelatedTool.refresh();
                                        $(".Assets_NFT_preview_tool.Streams_related_composer", $toolElement).each(function () {
                                            Q.Tool.from(this, "Assets/NFT/preview").composer();
                                        });
                                    }
                                );
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
                    $nftsBox[0].forEachTool("Streams/related", function () {
                        if (Q.getObject("fields.name", tool.selectedSeries) === streamName) {
                            tool.setSelected(seriesTool, {fields: {publisherId: publisherId, name: streamName}}, true);
                        }
                    });
                    $nftsBox.tool("Streams/related", relatedOptions).activate();
                });
            });
        },
        /**
         * Set series preview tool selected
         * @method setSelected
         * @param {Q_Tool} seriesPreview
         * @param {Streams_Stream} stream - series stream
         * @param {boolean} [local=false] - if true don't send request to server, just set tool selected on client
         */
        setSelected: function (seriesPreview, stream, local) {
            var tool = this;
            var $toolElement = $(this.element);
            local = local === undefined ? false : local;
            var _setSelectedElement = function () {
                $(seriesPreview.element).addClass("Q_selected").siblings(".Assets_NFT_series_preview_tool").removeClass("Q_selected");
                $(".nftsToolBox ." + Q.normalize(stream.fields.name), tool.element).addClass("Q_selected").siblings().removeClass("Q_selected");
            };

            if (local) {
                return _setSelectedElement();
            }

            $toolElement.addClass("Q_working");

            Q.req("Assets/NFTseries", ["selectNFTSeries"], function (err, response) {
                $toolElement.removeClass("Q_working");
                var errMsg = Q.firstErrorMessage(err, response && response.errors);
                if (errMsg) {
                    return Q.alert(errMsg);
                }

                _setSelectedElement();
            }, {
                method: "post",
                fields: {
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name
                }
            });
        }
    });

    Q.Template.set('Assets/NFT/series',
`<div class="relatedToolBox"></div><div class="nftsToolBox"></div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);