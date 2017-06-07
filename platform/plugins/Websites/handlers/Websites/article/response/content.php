<?php
	
function Websites_article_response_content($params)
{	
	$articleId = Q_Request::uri()->articleId;
	// $wp = new Websites_Permalink();
	// $wp->uri = "Websites/article articleId=$articleId";
	// if ($wp->retrieve() and Q_Request::url() != $wp->url) {
	// 	Q_Response::redirect($wp->url);
	// 	return false;
	// }
	$publisherId = Q_Request::uri()->publisherId;
	if (!isset($publisherId)) {
		$publisherId = Users::communityId();
	}
	$streamName = "Websites/article/$articleId";
	Q_Response::addStylesheet('plugins/Websites/css/Websites.css');
	Q_Response::addScript("plugins/Websites/js/Websites.js");
	return Q::view("Websites/content/article.php", compact('publisherId', 'streamName'));
}