<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];

#Usage strings
$usage = "Usage: php {$argv[0]} [options] " . ($FROM_APP ? '' : '<app_root> '). 'identifier [communityId [labels]]';

if(!$FROM_APP) {
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';
}

$usage = <<<EOT
$usage

Parameters:

identifier
Can be an email address or mobile number

communityId
Defaults to the app's name, as found under the Users/community/id config.

labels
Defaults to Users/admins but you can override it with a space-separated list.

Options:

--always-send     This option sends invites even if they have already been sent.

EOT;

$help = <<<EOT
Script to invite someone to be an admin of the app, or a community inside the app.

1) The app must already be fully installed before you run this script.
2) Your App/local/app.json config should have info for sending email and sms messages.
3) Make sure that your App/scripts/App/App.js node service is running, to send the invitation.
4) Anytime you need to invite an admin to the community, run this script.
5) Once an admin appears, they can appoint other admins without the script.

$usage

EOT;

// Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

// get all CLI options
$longopts = array("always-send");
$options = getopt('', $longopts, $restIndex);
$restArgs = array_slice($argv, $restIndex);

// Check primary arguments count: 2 if running /app/scripts/Q/invite.php, 3 if running /framework/scripts/invite.php
$count = count($restArgs);
if ($count < ($FROM_APP ? 1 : 2))
	die($usage);

// Read primary arguments
$LOCAL_DIR = $FROM_APP ? APP_DIR : $restArgs[0];

// Check paths
if (!file_exists($Q_filename = Q_DIR . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR .  'Q.inc.php')) #Q Platform
	die("[ERROR] $Q_filename not found" . PHP_EOL);

if (!is_dir($LOCAL_DIR)) #App dir
	die("[ERROR] $LOCAL_DIR doesn't exist or is not a directory" . PHP_EOL);

#Define APP_DIR
if (!defined('APP_DIR'))
	define('APP_DIR', $LOCAL_DIR);

#Include Q
try {
	include($Q_filename);
} catch (Exception $e) {
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
}

$identifier = $FROM_APP ? $restArgs[0] : $restArgs[1];
$communityId = Q::ifset($restArgs, $FROM_APP ? 1 : 2, Users::communityId());
$labels = array_slice($restArgs, $FROM_APP ? 2 : 3);
$addLabel = empty($labels) ? "Users/admins" : $labels;
$asUserId = $communityId;
$skipAccess = true;
$appUrl = Q_Uri::url('Communities/onboarding?communityId='.urlencode($communityId));
$alwaysSend = isset($options['always-send']);

$ret = Streams::invite($communityId, 'Streams/experience/main', @compact('identifier'), @compact('addLabel', 'asUserId', 'skipAccess', 'appUrl', 'alwaysSend'));
$count1 = count($ret['userIds']);
echo "Processed $count1 users" . PHP_EOL;
if ($count2 = count($ret['alreadyParticipating'])) {
	echo "$count2 were already participating" . PHP_EOL;
}
if ($alwaysSend) {
	echo "Sent invites to them anyway!" . PHP_EOL;
}