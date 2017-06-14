(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Renders a facebook comments form and feed that looks like the stadard Facebook
 * @class Streams comments
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.objectId] A Graph object id which is used to load comments from it and post comments to it.
 *   @required
 *   @param {String} [options.platform]  Has to be "facebook" for now.
 *   @default "facebook"
 *   @param {Boolean} [options.canDelete] Identifies if deletion of comments is possible.
 *   @default false
 */
Q.Tool.define("Streams/comments", function(o) {
    if (o.platform !== 'facebook') {
        alert("Only facebook is supported as a platform for now");
        return false;
    }

    function parseFacebookDate(string)
    {
        var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
                "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
                "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
        var d = string.match(new RegExp(regexp));

        var offset = 0;
        var date = new Date(d[1], 0, 1);

        if (d[3]) { date.setMonth(d[3] - 1); }
        if (d[5]) { date.setDate(d[5]); }
        if (d[7]) { date.setHours(d[7]); }
        if (d[8]) { date.setMinutes(d[8]); }
        if (d[10]) { date.setSeconds(d[10]); }
        if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
        if (d[14]) {
                offset = (Number(d[16]) * 60) + Number(d[17]);
                offset *= ((d[15] == '-') ? 1 : -1);
        }

        offset -= date.getTimezoneOffset();
        time = (Number(date) + (offset * 60 * 1000));
        return new Date(Number(time));
    }

    function postToFacebook()
    {
        FB.api(o.objectId + '/comments', 'post', { 'message': $('#Streams_comments_tool_comment').val() }, function(response)
        {
            if (response.id)
            {
                FB.api(o.objectId + '/comments', function(response)
                {
                    pasteComment(response.data[response.data.length - 1]);
                    makeFooter($('.Streams_comments_tool_feed_post').length);
                    $('#Streams_comments_tool_comment').val('');
                });
            }
            else
            {
                alert('An error occured while posting a comment, plese try again later.');
            }
            $('.Streams_comments_tool_loading_small').hide();
        });
    }

    function pasteComment(comment)
    {
        var postBlock = $('<div class="Streams_comments_tool_feed_post" />');
        postBlock.append('<div class="Streams_comments_tool_user_picture">' +
                                                '<img src="https://graph.facebook.com/' + comment.from.id + '/picture" alt="User picture" />' +
                                            '</div>');
        var date = parseFacebookDate(comment.insertedTime), curDate = new Date();
        var postComment = $('<div class="Streams_comments_tool_feed_post_comment">' +
                                                    '<div>' +
                                                        '<fb:name uid="' + comment.from.id + '" capitalize="true" useyou="false"></fb:name>' +
                                                        '<span class="Streams_comments_tool_post_date"></span>' +
                                                    '<div>' +
                                                    '<div class="Streams_comments_tool_feed_post_comment_message">' + comment.message + '</div>' +
                                                    (o.canDelete ?
                                                    '<div class="Streams_comments_tool_feed_post_comment_delete">' +
                                                        '<a href="delete-comment/' + comment.id + '" class="fb_link delete-link">Delete</a>' +
                                                    '</div>' : '') +
                                                '</div>');
        postBlock.append(postComment);
        postComment.find('.Streams_comments_tool_post_date').timestamp({
            'time': date.getTime() / 1000,
            'format': '{day-week} {date+week} {year+year} {time-week}'
        });
        postBlock.append('<div class="Streams_comments_tool_clear" />');
        $('#Streams_comments_tool_feed').prepend(postBlock);
        FB.XFBML.parse(postComment[0]);
    }

    function makeFooter(count)
    {
        var msg;
        $('.Streams_comments_tool_footer').remove();
        if (count > 0)
        {
            if (count == 1)
                msg = 'Displaying the only 1 post.';
            else if (count == 2)
                msg = 'Displaying the only 2 posts.';
            else
                msg = 'Displaying all ' + count + ' posts.';
            $('#Streams_comments_tool_feed').append('<div class="Streams_comments_tool_footer">' + msg + '</div>');
        }
    }

        $element = $(this.element);
        switch (o.platform)
        {
            case 'facebook':
                Q.plugins.Users.login({
                    tryQuietly: true,
                    using: 'facebook',
                    onSuccess: function()
                    {
						var uid = Q.Users.loggedInUser.uids.facebook;
                        var $pictureBlock = $('.Streams_comments_tool_content > .Streams_comments_tool_user_picture');
                        $pictureBlock.prepend(
							'<div><img src="https://graph.facebook.com/' + uid
							+ '/picture" alt="User picture" /></div>'
						);
                        var $loggedAsBlock = $('.Streams_comments_tool_logged_as');
                        $loggedAsBlock.append('<fb:name uid="' + uid + '" capitalize="true" useyou="false"></fb:name>');
                        FB.XFBML.parse($loggedAsBlock[0]);

                        FB.api(o.objectId + '/comments', function(response)
                        {
                            if (response.data.length > 0)
                            {
                                for (var i in response.data)
                                {
                                    pasteComment(response.data[i]);
                                }
                                makeFooter(response.data.length);
                                FB.XFBML.parse($('#Streams_comments_tool_feed')[0]);
                            }
                            $('.Streams_comments_tool_loading').hide();
                            $('.Streams_comments_tool_content').show();
                        });

                        $('#Streams_comments_tool_do_post').click(function()
                        {
                            if ($('#Streams_comments_tool_comment').val().length > 0)
                            {
                                $('.Streams_comments_tool_loading_small').show();
                                FB.api('me/permissions', function(response)
                                {
                                    if ('publish_stream' in response.data[0])
                                    {
                                        postToFacebook();
                                    }
                                    else
                                    {
                                        FB.ui({ method: 'permissions.request', 'scope': 'publish_stream' }, function(response)
                                        {
                                            if (response.scope && response.scope.indexOf('publish_stream') != -1)
                                            {
                                                postToFacebook();
                                            }
                                            else
                                            {
                                                alert("A 'publish_stream' permission is required to post comments.");
                                                $('.Streams_comments_tool_loading_small').hide();
                                            }
                                        });
                                    }
                                });
                            }
                            else
                            {
                                var taWidth = $('#Streams_comments_tool_comment').outerWidth() - 2;
                                var taHeight = $('#Streams_comments_tool_comment').outerHeight() - 2;
                                var offset = $('#Streams_comments_tool_comment').offset();
                                var highlightBlock = $('<div style="position: absolute; width: ' + taWidth + 'px; height: ' +
                                        taHeight + 'px; left: ' + (offset.left + 2) + 'px; top: ' + (offset.top + 1) + 'px; background-color: red; ' +
                                        'opacity: 0" />');
                                $(document.body).append(highlightBlock);
                                highlightBlock.animate({ 'opacity': 0.3 }, 70).animate({ 'opacity': 0 }, 70, function()
                                {
                                    $(this).remove();
                                });
                            }
                        });

                        $('.Streams_comments_tool_feed_post_comment_delete a').on('click', function(event)
                        {
                            var link = this;

                            Q.Users.facebookDialog({
                                'title': 'Delete Post',
                                'content': 'Are you sure you want to delete this post?',
                                'buttons': [
                                    {
                                        'label': 'Delete',
                                        'handler': function(dialog)
                                        {
                                            dialog.close();
                                            var post = $(link).parents('.Streams_comments_tool_feed_post');
                                            $('.Streams_comments_tool_loading_small').show();
                                            var hrefParts = link.href.split('/');
                                            FB.api(hrefParts[hrefParts.length - 1], 'delete', function(response)
                                            {
                                                if (response === true)
                                                {
                                                    post.fadeOut(300, function()
                                                    {
                                                        post.remove();
                                                        makeFooter($('.Streams_comments_tool_feed_post').length);
                                                    });
                                                }
                                                $('.Streams_comments_tool_loading_small').hide();
                                            });
                                        },
                                        'default': true
                                    },
                                    {
                                        'label': 'Cancel',
                                        'handler': function(dialog)
                                        {
                                            dialog.close();
                                        }
                                    }
                                ],
                                'position': { 'x': event.pageX + 50, 'y': event.pageY - 200 }
                            });

                            return false;
                        });
                    },
                    onCancel: function ()
                    {
                        $('.Streams_comments_tool_loading').hide();
                        $('.Streams_comments_tool_not_logged_in').show();
                        $('.Streams_comments_tool_not_logged_in a.fb_login_button').click(function()
                        {
                            $('.Streams_comments_tool_not_logged_in').hide();
                            $('.Streams_comments_tool_loading').show();
                            Q.plugins.Users.login({
                                using: 'facebook',
                                onSuccess: function ()
                                {
                                    $('.Streams_comments_tool_not_logged_in').hide();
                                    $element.commentsTool(o);
                                }
                            });
                            return false;
                        });
                    }
                });
                break;
            default:
                 break;
        }
},

{
    platform: 'facebook',
    canDelete: false
}

);

})(Q, jQuery, window);