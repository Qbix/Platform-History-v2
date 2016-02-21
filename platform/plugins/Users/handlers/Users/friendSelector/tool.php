<?php

/**
 * Renders a friend selector tool
 * @param $options
 *   An associative array of parameters, which can include:
 *   "onSelect" => a string naming the function to call when a friend is selected.
 *   "customList" => Optional. By default friends list is fetched from facebook, but here you can provide an array of friends or
 *                   callback which in turn will call friendSelector callback passing it such array as first agrument.
 *                   Callback may be a function or string name of the function.
 *                   Array should contain objects like { id: 'id', name: 'name' }. 'includeMe' option is ignored if 'customList' provided.
 *   "includeMe" => Optional. Whether or not to include user himself. Can be just boolean true or a string, which is used instead of user real name.
 *   "provider" => Optional. Has to be "facebook" for now.
 *   "prompt" => Prompt that appears if the tool is shown but user hasn't granted sufficient permissions yet.
 *   "filter" => Custom function to filter out the friends list.
 *   "ordering" => Custom function to order the friends list. By default friends are ordered by name.
 * @return {string}
 */
function Users_friendSelector_tool($options)
{
	Q_Response::addStylesheet('plugins/Users/css/Users.css');
	Q_Response::setToolOptions($options);
	return '';
}
