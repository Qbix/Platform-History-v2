(function (window, Q, $, undefined) {

    var Users = Q.Users;

/**
 * @module Streams
 */

/**
 * YUIDoc description goes here
 * @class Streams/image/album
 * @constructor
 * @param {Object} [options] Override various options for this tool
 */

Q.Tool.define("Streams/image/album", function _Streams_image_album_tool (options) {
    var tool = this;
    var state = tool.state;

    if (!Users.loggedInUser) {
        throw new Error("Streams/image/album tool: You are not logged in.");
    }
    if ((!state.publisherId || !state.streamName)
	&& (!state.stream || Q.typeOf(state.stream) !== 'Streams.Stream')) {
		throw new Q.Error("Streams/image/album tool: missing publisherId or streamName");
	}

    Users.login.options = Q.extend(Users.login.options, {
        using: ['native', 'facebook'],
        scope: ['email', 'public_profile', 'publish_actions', 'user_photos'],
        onSuccess: new Q.Event(function Users_login_onSuccess(user, options) {

        }, 'Users')
    });

    // this is the tool constructor
},

{ // default options here
    publisherId: Q.info.app,
	relationType: null,
	realtime: false,
	editable: true,
	closeable: true,
	creatable: {},
},

{ // tool methods go here
     
});

Q.Template.set('Streams/image/album/begin',
    '<div class="Streams_image_album_content">'+
    '<button type="button" name="upload_image">Add Image</button>'+
    '</div>'
);



})(window, Q, jQuery);