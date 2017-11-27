<?php

/**
 * Renders a comment form and comments feed which is looking like standard Facebook.
 * @param {array} $options An associative array of parameters, which can include:
 * @param {string} $options.objectId Required. A Graph object id which is used to load comments from it and post comments to it.
 * @param {string} [$options.platform='facebook']
 * @return {string}
 */

function Streams_comments_tool($options)
{
  Q_Response::addScript('{{Q}}/js/phpjs.js', 'Q');
  Q_Response::addScript('{{Streams}}/js/Streams.js', 'Streams');
  Q_Response::addStylesheet('{{Streams}}/css/Streams.css', 'Streams');
  Q_Response::addStylesheet('{{Users}}/css/Users.css', 'Users');
  Q_Response::setToolOptions($options);
  return Q::view('Streams/tool/comments.php');
}