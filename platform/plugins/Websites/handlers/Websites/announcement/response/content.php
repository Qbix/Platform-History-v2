<?php
	
function Websites_announcement_response_content($params)
{
	$articleId = Q_Request::uri()->articleId;
	// $wp = new Websites_Permalink();
	// $wp->uri = "Communities/article articleId=$articleId";
	// if ($wp->retrieve() and Q_Request::url() != $wp->url) {
	// 	Q_Response::redirect($wp->url);
	// 	return false;
	// }
	$publisherId = Q_Request::uri()->publisherId;
	if (!isset($publisherId)) {
		$publisherId = Users::communityId();
	}
	$streamName = "Websites/article/$articleId";
	$relationType = 'announcement';
	$onRelate = 'Websites.announcement.onRelate';
	Q_Response::addStylesheet('{{Websites}}/css/Websites.css');
	Q_Response::addScript("{{Websites}}/js/Websites.js", 'Websites');
	return Q::view("Websites/content/announcement.php", @compact(
		'publisherId', 'streamName', 'relationType', 'onRelate'
	));
}