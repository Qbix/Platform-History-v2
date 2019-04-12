<?php
	
function Websites_scrape_post($params)
{
	Q_Valid::nonce(true);

	$loggedUser = Users::loggedInUser(true);

	$r = array_merge($_REQUEST, $params);

	$fields = Q::take($r, array('url'));

	$result = Websites_Webpage::scrape($fields['url']);

	// if requested slots publisherId and streamName - create stream
	if (Q_Request::slotName('publisherId') && Q_Request::slotName('streamName')) {
		Q::Event('Websites/webpage/post', $result);
	}

	Q_Response::setSlot('result', $result);
}