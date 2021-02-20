#!/usr/bin/env php
<?php
/**
 * Allow to execute php actions from nodejs
 */

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

$usage = <<<EOT
Parameters:

[appRoot]
Required! Application root path

[action]
Required! Action name need to execute 

[asUserId]
the user on whose behalf the action executed

[publisherId]

[streamName]
EOT;

$help = <<<EOT
Script to execute php methods from nodejs

Options include:

--appRoot		Required! Application root path

--action		Required! Action name need to execute
           
--asUserId		the user on whose behalf the action executed 

--publisherId

--streamName

--signature
EOT;

// get all CLI options
$params = array(
	'h::' => 'help::',
	'app::' => 'appRoot::',
	'a::' => 'action::',
	'as::' => 'asUserId::',
	'pId::' => 'publisherId::',
	'sn::' => 'streamName::',
	'sig::' => 'signature::'
);
$options = getopt(implode('', array_keys($params)), $params);
if (empty($options['action'])) {
	throw new Q_Exception_RequiredField(array("field" => "action"));
}
if (empty($options['appRoot'])) {
	throw new Q_Exception_RequiredField(array("field" => "appRoot"));
}
if (empty($options['signature'])) {
	throw new Q_Exception_RequiredField(array("field" => "signature"));
}

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h'))) {
	die($help);
}

$qPath = $options['appRoot']."/scripts/Q.inc.php";
if (!is_file($qPath)) {
	throw new Exception("Q.inc.php not found: ".$qPath);
}

include $qPath;

// check signature
$signature = Q::ifset($options, "signature", null);
unset($options["signature"]);
if (Q_Utils::signature($options) !== $signature) {
	throw new Q_Exception_FailedValidation($options);
}

if ($options['action'] == "close") {
	if (empty($options['asUserId'])) {
		throw new Q_Exception_RequiredField(array("field" => "asUserId"));
	}
	if (empty($options['publisherId'])) {
		throw new Q_Exception_RequiredField(array("field" => "publisherId"));
	}
	if (empty($options['streamName'])) {
		throw new Q_Exception_RequiredField(array("field" => "streamName"));
	}

	Q::event('Streams/Stream/delete', Q::take($options, array(
		'asUserId' => null,
		'publisherId' => null,
		'streamName' => null
	)));
}
