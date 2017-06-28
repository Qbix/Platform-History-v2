<?php

function Users_importContacts_platforms_yahoo($params) {
	#Url fetching function
	$fetch = function($url) use ($params) {
		/** @var $client Zend_Oauth_Client */
		$client = $params['client'];
		$client->setUri($url);
		$client->setParameterGet('format', 'json');
		$response = $client->request(Zend_Http_Client::GET);
		if($response->getStatus()!=200) #TODO: Should we only throw Users_Exception_OAuthTokenInvalid on error 401? 
			throw new Users_Exception_OAuthTokenInvalid();
		return $response->getBody();
	};


	#Find out user's Yahoo GUID

	#Do we have the GUID saved?
	if ($cu = Users::loggedInUser()) {
		$appId = Q::ifset($params, 'appId', Q::app());
		list($appId, $appInfo) = Users::appInfo('yahoo', $appId);
		$au = new Users_AppUser();
		$au->userId = $cu->id;
		$au->platform = 'yahoo';
		$au->appId = Q_Config::expect('Users', 'apps', $platform, $appId, 'appId');
		$au->retrieve();
	}

	if(!empty($au->platform_uid)) #We have user's Yahoo GUID saved
		$guid = $au->platform_uid;
	else #Request user's GUID from Yahoo and save it
	{
		$guidjson = json_decode($fetch('http://social.yahooapis.com/v1/me/guid'));
		$guid = $guidjson->guid->value;
		$au->platform_uid = $guid;
		$au->save(true);
	}

	#Request contacts
	$res = json_decode($fetch("http://social.yahooapis.com/v1/user/$guid/contacts"));
	
	echo '<pre>';

	foreach($res->contacts->contact as $c)
	{
		$givenName = null;
		$familyName = null;
		$nickName = null;
		$email = null;
		$groups = array();

		foreach($c->fields as $f) #Loop through fields and load the ones we need
		{
			switch($f->type)
			{
				case 'nickname':
					$nickName = $f->value;
			        break;
				case 'email':
					if(empty($email))
						$email = $f->value;
			        break;
				case 'name':
					if(!empty($f->value->givenName))
						$givenName = $f->value->givenName;
					if(!empty($f->value->familyName))
						$familyName = $f->value->familyName;
			        break;
			}
		}

		if(!$email)
			continue;

		#Detect groups
		foreach($c->categories as $g)
			$groups[]=$g->name;

		#Save user
		$alr = Users::addLink($email, 'email', array(
			'firstName'=>$givenName, 
			'lastName'=>$familyName, 
			'labels' => $groups
		));

		echo $givenName.($familyName?' '.$familyName:'').' ['.$email.']'.($groups ? ' ('. implode(', ', $groups) .')' : '').' -> '.($alr === true ? 'ADDED': ($alr ? 'EXISTS: ' .$alr : 'EXISTS')) . PHP_EOL;
	}

	return true;
}