<?php

function Users_importContacts_platforms_google($params) {
	#Url fetching function
	$fetch = function($url) use ($params) {
		/** @var $client Zend_Oauth_Client */
		$client = $params['client'];
		$client->setUri($url);
		$client->setParameterGet('alt', 'json');
		$client->setHeaders('GData-Version', '3.0');
		$response = $client->request(Zend_Http_Client::GET);
		if($response->getStatus()!=200) #TODO: Should we only throw Users_Exception_OAuthTokenInvalid on error 401?
			throw new Users_Exception_OAuthTokenInvalid();
		return $response->getBody();
	};

	echo '<pre>';

	$allgroups = array();
	
	#GET GROUPS
	$res = json_decode($fetch('https://www.google.com/m8/feeds/groups/default/full'));
	foreach($res->feed->entry as $e)
		if(!isset($e->{'gContact$systemGroup'}))
			$allgroups[$e->id->{'$t'}] = $e->title->{'$t'};

	#GET CONTACTS
	$res = json_decode($fetch('https://www.google.com/m8/feeds/contacts/default/full')); //FIXME: Specify MAX_CONTACTS?
	foreach($res->feed->entry as $e)
	{
		if(!isset($e->{'gd$email'}))
			continue;

		$givenName = null;
		$familyName = null;
		$email = null;
		$groups = array();

		#Find out primary email
		foreach($e->{'gd$email'} as $em)
			if($em->primary)
			{
				$email = $em->address;
				break;
			}

		#Find the name field to use
		if(isset($e->{'gd$name'}, $e->{'gd$name'}->{'gd$givenName'}, $e->{'gd$name'}->{'gd$familyName'}))
		{
			$givenName = $e->{'gd$name'}->{'gd$givenName'}->{'$t'};
			$familyName = $e->{'gd$name'}->{'gd$familyName'}->{'$t'};
		}
		elseif(!empty($e->title) && !empty($e->title->{'$t'}))
			$givenName = $e->title->{'$t'};
		else
			$givenName = $email;

		//Is this contact in a group?
		if(!empty($e->{'gContact$groupMembershipInfo'}))
			foreach($e->{'gContact$groupMembershipInfo'} as $g)
				if(isset($allgroups[$g->href]))
					$groups[]=$allgroups[$g->href];



		$alr = Users::addLink($email, 'email', array(
			'firstName'=>$givenName, 
			'lastName'=>$familyName, 
			'labels' => $groups
		));

		echo $givenName.($familyName?' '.$familyName:'').' ['.$email.']'.($groups ? ' ('. implode(', ', $groups) .')' : '').' -> '.($alr === true ? 'ADDED': ($alr ? 'EXISTS: ' .$alr : 'EXISTS')) . PHP_EOL;
	}

	return true;
}