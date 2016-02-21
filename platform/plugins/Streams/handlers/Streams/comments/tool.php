<?php

/**
* Renders a comment form and comments feed which is looking like standard Facebook.
* @param $options
*   An associative array of parameters, which can include:
*   "objectId" => Required. A Graph object id which is used to load comments from it and post comments to it.
*   "provider" => Optional. Has to be "facebook" for now.
* @return {string}
*/
function Streams_comments_tool($options)
{
  Q_Response::addScript('plugins/Q/js/phpjs.js');
  Q_Response::addScript('plugins/Streams/js/Streams.js');
  Q_Response::addStylesheet('plugins/Streams/css/Streams.css');
  Q_Response::addStylesheet('plugins/Users/css/Users.css');
  Q_Response::setToolOptions($options);
  return Q::view('Streams/tool/comments.php');
}
