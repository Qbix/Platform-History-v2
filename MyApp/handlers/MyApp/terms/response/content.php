<?php
	
function MyApp_terms_response_content()
{
	$communityName = Users::communityName();
	$organizationName = Users::communityName(true);
	$appRootUrl = Q_Config::expect('Q', 'web', 'appRootUrl');
	$host = parse_url($appRootUrl, PHP_URL_HOST);
	$dmcaEmail = "dmca@$host";
	$governingLaw = 'U.S. law';
	$jurisdiction = 'New York State';
	return Q::view('MyApp/content/terms.php', @compact(
		'communityName', 'organizationName', 'dmcaEmail', 'governingLaw', 'jurisdiction'
	));
}
