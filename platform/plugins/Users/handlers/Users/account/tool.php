<?php

function Users_account_tool($options)
{
	$uri = 'Users/account';
	$omit = array();
	$fields = array();
	$title = "Basic Info";
	$editing = true;
	$complete = true;
	$inProcess = false;
	$collapsed = false;
	$toggle = false;
	$omit = array();
	$setSlots = null;
	extract($options, EXTR_OVERWRITE);
	$default_fields = array(
		'username' => array('type' => 'text', 'label' => 'Choose Username'),
		'gender' => array(
			'type' => 'select', 
			'label' => 'I am',
			'options' => array('male'=>'a man', 'female'=>'a woman')
		),
		'orientation' => array(
			'type' => 'select', 
			'label' => 'Orientation',
			'options' => array('straight'=>'straight', 'gay'=>'gay', 'bi'=>'bi')
		),
		'relationship_status' => array(
			'type' => 'select',
			'label' => 'Status',
			'options' => array(
				'single' => "I'm single",
				'open' => "I'm in an open relationship",
				'relationship' => "I'm in a relationship",
				'engaged' => "I'm engaged",
				'married' => "I'm married",
				'complicated' => "It's complicated",
				'widowed' => "I'm widowed"
			)
		),
		'birthday' => array(
			'type' => 'date', 
			'label' => 'My Birthday',
			'options' => array('year_from' => '1920', 'year_to' => date('Y')-16)
		),
		'zipcode' => array(
			'type' => 'text',
			'label' => 'Zipcode',
			'attributes' => array('maxlength' => 5)
		)
	);
	$fields = array_merge($default_fields, $fields);
	
	$user = Users::loggedInUser(true);
	if (isset($user->gender)) {
		$fields['gender']['value'] = $user->gender;
	}
	if (isset($user->desired_gender)) {
		if ($user->desired_gender == 'either') {
			$fields['orientation']['value'] = 'bi';
		} else if (isset($user->gender)) {
			$fields['orientation']['value'] = 
			 ($user->gender != $user->desired_gender)
			 ? 'straight'
			 : 'gay';
		}
	}
	if (isset($user->relationship_status)) {
		$fields['relationship_status']['value'] = $user->relationship_status;
	}
	if (isset($user->birthday)) {
		$fields['birthday']['value'] 
		= date("Y-m-d", Users::db()->fromDate($user->birthday));
	}
	if (isset($user->zipcode)) {
		$fields['zipcode']['value'] = $user->zipcode;
	}
	if (isset($user->username)) {
		$fields['username']['value'] = $user->username;
	}
	
	foreach ($omit as $v) {
		unset($fields[$v]);
	}
	
	$onSuccess = Q_Request::special('onSuccess', Q_Request::url());
	
	$form = $static = compact('fields');
	return Q::tool('Q/panel', compact(
		'uri', 'title', 'form', 'static', 'onSuccess',
		'complete', 'collapsed', 'toggle', 'editing', 'inProcess',
		'static', 'setSlots'
	));
}
