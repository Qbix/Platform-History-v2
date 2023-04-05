(function (window, Q, $, undefined) {

/**
 * @module Users
 */

/**
 * Render people list with filters and Streams/userChooser
 * @class Users/people
 * @constructor
 * @param {Object} options Override various options for this tool
 */
Q.Tool.define("Users/people", function (options) {
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

            Q.Template.render("Users/people", {

            }, function (err, html) {
                if (err) {
                    return;
                }

                Q.replace(tool.element, html);

                $(".Users_people_usersList", tool.element).tool("Users/list", {
                    avatar: state.avatar
                }).tool('Q/infinitescroll', {

                }).activate(function () {
                    var infinitescrollTool = Q.Tool.from(this.element, 'Q/infinitescroll');
                    infinitescrollTool.state.onInvoke.set(function () {
                        var usersListTool = Q.Tool.from(this.element, "Users/list");
                        var infiniteTool = Q.Tool.from(this.element, "Q/infinitescroll");
                        var offset = $(">.Users_avatar_tool:visible", infiniteTool.element).length;

                        // skip duplicated (same offsets) requests
                        if (!isNaN(infiniteTool.state.offset) && infiniteTool.state.offset >= offset) {
                            return;
                        }

                        infiniteTool.setLoading(true);
                        infiniteTool.state.offset = offset;

                        Q.req('Users/people', 'load', function (err, data) {
                            infiniteTool.setLoading(false);
                            err = Q.firstErrorMessage(err, data);
                            if (err) {
                                return console.error(err);
                            }

                            if (!usersListTool.state.userIds) {
                                usersListTool.state.userIds = [];
                            }

                            usersListTool.state.userIds = data.slots.load;
                            usersListTool.loadMore();
                        }, {
                            fields: {
                                limit: state.limit,
                                offset: offset
                            }
                        });
                    }, tool);

                    Q.handle(infinitescrollTool.state.onInvoke, infinitescrollTool);
                });
            });
        }
    });

Q.Template.set("Users/people",
`<div class="Users_people_header">{{people.People}}</div>
<div class="Users_people_usersList"></div>
<div class="Users_people_footer"></div>`,
    {text: ['Users/content']}
);
})(window, Q, jQuery);