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
     *  @param {Q.Event} [options.onIconChanged] Event occur when series/preview icon changed
     *  @param {Q.Event} [options.onClose] Event occur when series stream closed
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
        onCreated: new Q.Event(),
        onSelected: new Q.Event(),
        onIconChanged: new Q.Event(),
        onClose: new Q.Event()
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         */
        refresh: function () {
            var tool = this;
            var state = tool.state;

            Q.Template.render("Assets/NFT/series", function (err, html) {
                if (err) {
                    return;
                }

                tool.element.innerHTML = html;

                Streams.related(state.userId, Assets.NFT.series.categoryStreamName, [NFT.series.relationType, NFT.series.selectedRelationType], true, function (err) {
                    if (err) {
                        return;
                    }

                    tool.series = this.relatedStreams;
                    tool.selectedSeries = null;
                    Q.each(this.relations, function (i, relation) {
                        if (relation.type === NFT.series.selectedRelationType) {
                            tool.selectedSeries = relation.from;
                        }
                    });

                    tool.setSelected();

                    Q.each(tool.series, function (i, stream) {
                        var publisherId = stream.fields.publisherId;
                        var streamName = stream.fields.name;
                        if (!streamName) {
                            return;
                        }

                        tool.addNFTsBox(publisherId, streamName);
                    });
                });
            });
        },
        /**
         * Set series preview tool selected
         * @method setSelected
         * @param {Streams_Stream} [stream] - series stream
         * @param {Function} [callback]
         */
        setSelected: function (stream, callback) {
            var tool = this;
            var $toolElement = $(this.element);
            var $relatedToolBox = $(".relatedToolBox", this.element);
            var _setSelected = function () {
                Q.Tool.remove($relatedToolBox[0], true, true);
                if (tool.selectedSeries) {
                    // remove button "Select series"
                    $(".Assets_NFT_series_select", tool.element).remove();

                    // set selected series preview in dialog
                    $(".nftToolBox ." + Q.normalize(tool.selectedSeries.fields.name), tool.element).addClass("Q_selected").siblings().removeClass("Q_selected");

                    // set selected series preview in relatedToolBox
                    $("<div>")
                        .addClass("Q_selected")
                        .appendTo($relatedToolBox)
                        .tool("Streams/preview", {
                            publisherId: tool.selectedSeries.fields.publisherId,
                            streamName: tool.selectedSeries.fields.name,
                            editable: false,
                            closeable: false
                        })
                        .tool("Assets/NFT/series/preview", {
                            onInvoke: tool.selectSeries.bind(tool)
                        })
                        .activate();
                } else {
                    // create button "Select series"
                    $("<div class='Assets_NFT_series_select Q_button'>" + tool.text.NFT.series.SelectSeries + "</div>")
                        .on(Q.Pointer.fastclick, tool.selectSeries.bind(tool))
                        .appendTo($relatedToolBox);
                }
            };

            if (!stream) {
                return _setSelected();
            }

            $toolElement.addClass("Q_working");

            Q.req("Assets/NFTseries", ["selectNFTSeries"], function (err, response) {
                $toolElement.removeClass("Q_working");
                var errMsg = Q.firstErrorMessage(err, response && response.errors);
                if (errMsg) {
                    Q.handle(callback, tool, [errMsg]);
                    return Q.alert(errMsg);
                }

                tool.selectedSeries = stream;

                _setSelected();

                Q.handle(callback, tool);
            }, {
                method: "post",
                fields: {
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name
                }
            });
        },
        /**
         * Select series from the list
         * @method selectSeries
         */
        selectSeries: function () {
            var tool = this;
            var state = this.state;
            var $toolElement = $(this.element);
            var loggedInUserId = Users.loggedInUserId();
            var $nftToolBox = $(".nftToolBox", $toolElement);
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
                    onCreated: function (stream) {
                        tool.addNFTsBox(stream.fields.publisherId, stream.fields.name);
                    }
                }
            };
            if (tool.isAdmin || state.userId === loggedInUserId) {
                relatedOptions.creatable = {};
                relatedOptions.creatable[Assets.NFT.series.streamType] = {
                    publisherId: state.userId,
                    title: tool.text.NFT.series.NewItem
                };
            }

            Q.Dialogs.push({
                title: tool.text.NFT.series.SelectSeries,
                className: "Assets_NFT_series_select",
                content: $("<div>").tool("Streams/related", relatedOptions),
                onActivate: function ($dialog) {
                    $dialog[0].forEachTool("Assets/NFT/series/preview", function () {
                        var seriesPreviewTool = this;
                        var $seriesPreviewToolElement = $(seriesPreviewTool.element);
                        var streamName = seriesPreviewTool.preview.state.streamName;
                        if (!streamName) {
                            return;
                        }
                        var normalizedStreamName = Q.normalize(streamName);

                        if (Q.getObject("fields.name", tool.selectedSeries) === streamName) {
                            $seriesPreviewToolElement.addClass("Q_selected").siblings(".Assets_NFT_series_preview_tool").removeClass("Q_selected");
                        }

                        // on series/preview invoke
                        seriesPreviewTool.state.onInvoke.set(function (stream) {
                            $dialog.addClass("Q_working");
                            tool.setSelected(stream, function (err) {
                                $dialog.removeClass("Q_working");
                                if (err) {
                                    return;
                                }

                                $seriesPreviewToolElement.addClass("Q_selected").siblings(".Assets_NFT_series_preview_tool").removeClass("Q_selected");
                                Q.handle(state.onSelected, seriesPreviewTool, [seriesPreviewTool.stream]);
                                Q.Dialogs.pop();
                            });
                        }, seriesPreviewTool);

                        // on series/preview icon changed
                        seriesPreviewTool.state.onIconChanged.set(function (stream) {
                            Q.handle(state.onIconChanged, seriesPreviewTool, [stream]);
                        }, seriesPreviewTool);

                        // onClose series
                        seriesPreviewTool.preview.state.onClose.set(function () {
                            Q.handle(state.onClose, seriesPreviewTool);
                            var $nftBox = $("." + normalizedStreamName, $nftToolBox);
                            if ($nftBox.length) {
                                Q.Tool.remove($nftBox[0], true, true);
                                $nftBox.remove();
                            }
                            if ($seriesPreviewToolElement.hasClass("Q_selected")) {
                                tool.selectedSeries = null;
                                tool.setSelected();
                            }
                        }, seriesPreviewTool);
                    });
                }
            });
        },
        /**
         * Add element with NFTs for some series
         * @method addNFTsBox
         * @param {String} publisherId - series stream publisher id
         * @param {String} streamName - series stream name
         */
        addNFTsBox: function (publisherId, streamName) {
            var tool = this;
            var state = this.state;
            var $toolElement = $(this.element);
            var $nftToolBox = $(".nftToolBox", $toolElement);
            var loggedInUserId = Users.loggedInUserId();

            var normalizedStreamName = Q.normalize(streamName);
            if ($("." + normalizedStreamName, $nftToolBox).length) {
                return;
            }

            var $nftsBox = $("<div>").addClass(normalizedStreamName).appendTo($nftToolBox);
            var relatedOptions = {
                publisherId: publisherId,
                streamName: streamName,
                relationType: "Assets/NFT",
                editable: true,
                closeable: true,
                sortable: true,
                relatedOptions: {
                    withParticipant: false
                },
                specificOptions: {
                    onCreated: function (streamData) {
                        var NFTPreview = this;

                        Q.Streams.relate(
                            publisherId,
                            streamName,
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
                    $(this.element).addClass("Q_selected");
                }
            });

            $nftsBox.tool("Streams/related", relatedOptions).activate();
        }
    });

    Q.Template.set('Assets/NFT/series',
`<div class="relatedToolBox"></div><div class="nftToolBox"></div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);