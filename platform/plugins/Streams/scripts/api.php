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

// get all CLI options
$params = array(
	'h::' => 'help::',
	'app::' => 'appRoot::',
	'a::' => 'action::',
	'as::' => 'asUserId::',
	'pId::' => 'publisherId::',
	'sn::' => 'streamName::'
);
$help = <<<EOT
Script to execute php methods from nodejs

Options include:

--appRoot		Required! Application root path

--action		Required! Action name need to execute
           
--asUserId		the user on whose behalf the action executed 

--publisherId

--streamName
EOT;

$options = getopt(implode('', array_keys($params)), $params);
if (empty($options['action']) || empty($options['appRoot'])) {
	die($help);
}

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h'))) {
	die($help);
}

$qPath = $options['appRoot']."/scripts/Q.inc.php";
if (!is_file($qPath)) {
    die("Q.inc.php not found: ".$qPath);
}

include $qPath;

if ($options['action'] == "close") {
	if (empty($options['asUserId'])) {
		die("asUserId required for close");
	}
	if (empty($options['publisherId'])) {
		die("publisherId required for close");
	}
	if (empty($options['streamName'])) {
		die("streamName required for close");
	}

	Q::event('Streams/Stream/delete', Q::take($options, array(
		'asUserId' => null,
		'publisherId' => null,
		'streamName' => null
	)));
}
