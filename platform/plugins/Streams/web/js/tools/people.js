(function (window, Q, $, undefined) {

/**
 * @module Streams
 */

/**
 * Render people list with filters and Streams/userChooser
 * @class Streams/people
 * @constructor
 * @param {Object} options Override various options for this tool
 */

Q.Tool.define("Streams/people", function (options) {
        var tool = this;
        var state = this.state;

        tool.refresh();
    },

    { // default options here
        limit: 100,
        avatar: {
            short: true,
            icon: '50'
        },
        onChoose: new Q.Event()
    },

    { // methods go here
        refresh: function () {
            var tool = this;
            var state = this.state;

            Q.Template.render("Streams/people", {

            }, function (err, html) {
                if (err) {
                    return;
                }

                Q.replace(tool.element, html);

                $(".Streams_people_usersList", tool.element).tool("Users/list", {
                    avatar: state.avatar
                }).tool('Q/infinitescroll', {
                    onInvoke: function () {
                        var usersListTool = Q.Tool.from(this.element, "Users/list");
                        var infiniteTool = Q.Tool.from(this.element, "Q/infinitescroll");
                        var offset = $(">.Users_avatar_tool:visible", infiniteTool.element).length;

                        // skip duplicated (same offsets) requests
                        if (!isNaN(infiniteTool.state.offset) && infiniteTool.state.offset >= offset) {
                            return;
                        }

                        infiniteTool.setLoading(true);
                        infiniteTool.state.offset = offset;

                        Q.req('Streams/people', 'load', function (err, data) {
                            infiniteTool.setLoading(false);
                            err = Q.firstErrorMessage(err, data);
                            if (err) {
                                return console.error(err);
                            }

                            if (!usersListTool.state.userIds) {
                                usersListTool.state.userIds = [];
                            }

                            usersListTool.state.userIds = usersListTool.state.userIds.concat(data.slots.load);
                            usersListTool.loadMore();
                        }, {
                            fields: {
                                limit: state.limit,
                                offset: offset
                            }
                        });
                    }
                }).activate(function () {
                    $(this.element).trigger("scroll");
                });
            });
        }
    });

Q.Template.set("Streams/people",
    `<div class="Streams_people_usersList"></div>`,
    {text: ['Streams/content']}
);
})(window, Q, jQuery);