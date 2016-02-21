<?php

/**
 * Renders an import tool
 * @param $options
 *   An associative array of parameters, which can include:
 *   "provider" => Required. The provider from which we are importing.
 * @return {string}
 */
function Users_importContacts_tool($options)
{
	$provider = $options['provider'];

	ob_start();

	try{
		if(!($client=Users::oAuth($provider)))
			throw new Users_Exception_NotAuthorized();

		Q::event('Users/importContacts/providers/'.$provider, array('client'=>$client));
	}
	catch(Users_Exception_OAuthTokenInvalid $ex) //Expired token
	{
		#TODO: Log something to error log?
		Users::oAuthClear($provider);
		Q_Response::redirect(Q_Uri::url(Q_Request::url(true)));
		return false;
	}
	catch(Zend_Oauth_Exception $ex) //User didn't allow access
	{
		#TODO: Show a nicely-formatted message and close the pop-up
		echo 'Could not import contacts: '.$ex->getMessage();
	}

	$out = ob_get_contents();
	ob_clean();

	Q_Response::output($out, true);

	return true;
}