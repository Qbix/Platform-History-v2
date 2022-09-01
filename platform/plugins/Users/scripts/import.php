<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];

#Usage strings
$usage = "Usage: php {$argv[0]} [options] " . ($FROM_APP ? '' : '<app_root> '). 'platform [appId]';

if(!$FROM_APP) {
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';
}

$usage = <<<EOT
$usage

Parameters:

platform
For now, only supports discourse. For example do:
php import.php discourse

appId
You can optionally pass an a different appId here.

EOT;

$help = <<<EOT
Script to import users from a Discourse installation.

1) Make sure to set the info under Users/apps/discourse/{AppName}
   including baseURL under "url", API key under "keys"/"*"
   and queryIndex under "import"/"queryIndex"

2) Run this script, and let it import all users.
   Please do not kill the script, but press the "c" key instead,
   to let it gracefully finish importing the current user and exit.
   When the script is restarted afterwards, it skips users that have
   already been imported, even if partially.

$usage

EOT;

// Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

// get all CLI options
$longopts = array('abc');
$options = getopt('ab', $longopts, $restIndex);
$restArgs = array_slice($argv, $restIndex);

$platform = Q::ifset($restArgs, 0, 'discourse');
$appId = Q::ifset($restArgs, 1, null);

list($appId, $info) = Users::appInfo($platform, $appId);
$url = Q::ifset($info, 'url', null);
if (!$url) {
	die($help . PHP_EOL . "Missing URL. See instructions above." . PHP_EOL);
}
$key = Q::ifset($info, 'keys', array('*', 'import'), null);
if (!$key) {
	die($help . PHP_EOL . "Missing API key. See instructions above." . PHP_EOL);
}
$queryIndex = Q::ifset($info, 'import', 'queryIndex', null);
if (!$url) {
	die($help . PHP_EOL . "Missing Query Index. See instructions above." . PHP_EOL);
}

// TODO: use adapter pattern

// SECURITY: HTTPS means we are trusting the installed
// certificate authorities, rather than just our own certs.
$endpoint = "$url/admin/plugins/explorer/queries/$queryIndex/run";
$json = Q_Utils::post($endpoint, array(), null, array(), array(
	"Content-Type: multipart/form-data",
	"Api-Key: $key",
	"Api-Username: system"
));
$results = Q::json_decode($json, true);

$columns = $results['columns'];
$rows = $results['rows'];
$columnsFlipped = array_flip($columns);
$emailIndex = $columnsFlipped['email'];
$userInfos = array();
foreach ($rows as $r) {
	$email = $r[$emailIndex];
	if (Q_Valid::email($email)) {
		$emails[] = $email;
		$userInfos[] = $r;
	}
}
foreach ($emails as $email) {
	$user = Users_User::from('email', $email, null);
	if ($user) {
		// may have duplicates due to INNER JOIN uploads
		echo $user->id . ' ' . $email . PHP_EOL;
	}
}

// var_dump($result);