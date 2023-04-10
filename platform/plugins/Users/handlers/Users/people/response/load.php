<?php
function Users_people_response_load () {
	$options = Q_Config::get('Users', 'people', 'userIds', array());
	$options['communityId'] = Q::ifset($_REQUEST, 'communityId', Users::currentCommunityId(true));
	$options['offset'] = Q::ifset($_REQUEST, 'offset', 0);
	$options['limit'] = Q::ifset($_REQUEST, 'limit', $options['limit']);

	$userIds = Users::userIds($options);

	return $userIds;
}

