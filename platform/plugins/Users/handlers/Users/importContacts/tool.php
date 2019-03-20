<?php

/**
 * Renders an import tool
 * @param $options
 *   An associative array of parameters, which can include:
 *   "platform" => Required. The platform from which we are importing.
 * @return {string}
 */
function Users_importContacts_tool($options)
{
	$platform = $options['platform'];

	ob_start();

	try{
		if(!($client=Users::oAuth($platform)))
			throw new Users_Exception_NotAuthorized();

		Q::event('Users/importContacts/platforms/'.$platform, array('client'=>$client));
	}
	catch(Users_Exception_OAuthTokenInvalid $ex) //Expired token
	{
		#TODO: Log something to error log?
		Users::oAuthClear($platform);
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