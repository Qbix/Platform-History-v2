<?php

/**
 * Renders a search tool which is able to search in streams using query typed by user.
 * @param $options
 *   An associative array of parameters, which can include:
 *   "placeholder" => Optional. Search field placeholder text. Default is "search".
 *   "submit" => Optional. Submit button text (or arbitrary html content). Default is "Submit". If 'false' value is passed, then submit button is not added.
 * @return {string}
 */
function Streams_search_tool($options)
{
  Q_Response::addScript('plugins/Streams/js/Streams.js');
  Q_Response::addStylesheet('plugins/Streams/css/Streams.css');
  $default = array('placeholder' => 'search', 'submit' => 'Submit');
  $options = array_merge($default, $options);
  Q_Response::setToolOptions($options);
  return Q::view('Streams/tool/search.php', $options);
}
