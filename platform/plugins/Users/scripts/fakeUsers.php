<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . ($FROM_APP ? '' : '<app_root> '). ' [amount] [city]';

if(!$FROM_APP) {
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';
}

$usage = <<<EOT
$usage

Parameters:

[amount]
Amount of users to create. If omitted, default 10.

[city]
City where users will live. For example "New York", "Washington". If omitted, default "New York". 

EOT;

// get all CLI options
$params = array(
	'h::' => 'help::',
	'a::' => 'amount::',
	'c::' => 'city::'
);
$options = getopt(implode('', array_keys($params)), $params);
if (empty($options['amount'])) {
	$options['amount'] = 10;
}
if (empty($options['city'])) {
	$options['city'] = "New York";
}

$help = <<<EOT

Script to create fake users in particular app.

Options include:

--amount          Amount of users to create. If omitted, default 10.
           
--city            City where users will live. For example "New York", "Washington". 
                  If omitted, default "New York".
EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 2 if running /app/scripts/Q/invite.php, 3 if running /framework/scripts/invite.php
if ($count < ($FROM_APP ? 0 : 1))
	die($usage);

#Read primary arguments
$LOCAL_DIR = $FROM_APP ? APP_DIR : $argv[1];

$app = Q::app();
$amount = (int)$options['amount'];
$city = $options['city'];

// same email for all demo users
$email = "demo-user@qbix.com";

// collect location for users
$location = Places::autocomplete($city, false, "geocode");
$query = http_build_query(array(
	'key' => Q_Config::expect('Places', 'google', 'keys', 'server'),
	'placeid' => $location[0]['place_id']
));
$location = json_decode(Places::getRemoteContents("https://maps.googleapis.com/maps/api/place/details/json?$query"), true);
$address_components = $location['result']['address_components'];
$country = null;
// get country
foreach($address_components as $address_component) {
	if (in_array('country', $address_component['types'])) {
		$country = $address_component['short_name'];
		break;
	}
}

// random names
$firstNames = array("Jillian", "Kayleen", "Florrie", "Goldie", "Arnette", "Hans", "Taina", "Ryann", "Ashlee", "Sherilyn");
$lastNames = array("Bialaszewski", "Kissell", "Fruge", "Mcpartland", "Obyrne", "Lozano", "Mcculler", "Dolby", "Franklin", "Alers");
$checkUnique = array();
for ($i = 0; $i < $amount; $i++) {
	// get random indexes for first and last names
	$firstIndex = rand ( 0 , count($firstNames) -1);
	$lastIndex = rand ( 0 , count($lastNames) -1);

	// if duplicated - random again
	while(in_array($firstIndex.$lastIndex, $checkUnique)) {
		$firstIndex = rand ( 0 , count($firstNames) -1);
		$lastIndex = rand ( 0 , count($lastNames) -1);
	}

	$checkUnique[] = $firstIndex.$lastIndex;
	// result name
	$name = $firstNames[$firstIndex] . ' ' . $lastNames[$lastIndex];

	// create user
	$user = Streams::register($name, $email, true, array("activation" => null));

	// set logged user to complete Communities plugin actions
	Users::setLoggedInUser($user);

	// set user location
	$locationStream = Places_Location::userStream();
	$locationStream->setAttribute("latitude", $location['result']['geometry']['location']['lat']);
	$locationStream->setAttribute("longitude", $location['result']['geometry']['location']['lng']);
	$locationStream->setAttribute("placeName", $location['result']['name']);
	$locationStream->setAttribute("country", $country);
	$locationStream->setAttribute("meters", Q_Config::expect('Places', 'nearby', 'defaultMeters'));
	$locationStream->save();
}