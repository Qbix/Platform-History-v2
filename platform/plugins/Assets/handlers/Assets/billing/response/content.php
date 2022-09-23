<?php
function Assets_billing_response_content() {
	$communityId = Users::currentCommunityId(true);

	Q_Response::addStylesheet("{{Assets}}/css/pages/billing.css");

	return Q::view('Assets/content/billing.php', @compact("communityId"));
}