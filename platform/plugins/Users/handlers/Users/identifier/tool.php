<?php

function Users_identifier_tool($options)
{
	$defaults = array(
		'uri' => 'Users/identifier',
		'omit' => array(),
		'fields' => array(),
		'title' => "Contact Info",
		'collapsed' => false,
		'toggle' => false,
		'editing' => true,
		'complete' => true,
		'inProcess' => false,
		'prompt' => "In order for things to work, we must be able to reach you.",
		'button_content' => 'OK'
	);
	extract(array_merge($defaults, $options));
	$default_fields = array(
		'emailAddress' => array('type' => 'text', 'label' => 'Email')
	);
	$fields = array_merge($default_fields, $fields);
	
	$user = Users::loggedInUser(true);
	$email = null;
	if (isset($user->emailAddress)) {
		$fields['emailAddress']['value'] = $user->emailAddress;
	} else if ($user->emailAddressPending) {
		$link = Q_Html::a('#resend', 
			array('class' => 'Users_idenfitier_tool_resend'), 
			"You can re-send the activation email"
		);
		$email = new Users_Email();
		$email->address = $user->emailAddressPending;
		if ($email->retrieve()) {
			switch ($email->state) {
			 case 'active':
				if ($email->userId == $user->id) {
					$message = "Please confirm this email address.<br>$link";
				} else {
					$message = "This email seems to belong to another user";
				}
				break;
			 case 'suspended':
				$message = "This address has been suspended.";
				break;
			 case 'unsubscribed':
				$message = "The owner of this address has unsubscribed";
				break;
			 case 'unverified':
			 default:
				$message = "Not verified yet.<br>$link";
				break;
			}
			$fields['emailAddress']['value'] = $email->address;
			$fields['emailAddress']['message'] = $message;
		} else {
			// something went wrong, so we'll try to correct it
			$user->emailAddressPending = "";
			$user->save();
		}
	}
	
	$onSuccess = Q_Request::special('onSuccess', Q_Request::url());
	
	$form = $static = @compact('fields');
	return Q::tool('Q/panel', @compact(
		'uri', 'onSuccess', 'form', 'static', 'title',
		'collapsed', 'toggle', 'complete', 'editing', 'inProcess',
		'setSlots'
	));
}
