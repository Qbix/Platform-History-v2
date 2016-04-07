<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . ($FROM_APP ? '' : '<app_root> ')
	. '--part (PLUGIN/TABLE/PART | PLUGIN/TABLE) [--connection CONNECTION] [--class CLASS] [--fields \'{"FIELD": "HASH", ...}\'] --parts (\'{"SHARDNAME": {DBINFO}, ...}\' | \'[DBINFO, ...]\')';

if(!$FROM_APP)
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';

$usage = <<<EOT
$usage

ATTENTION!: If you use config server ('Q/internal/configServer') please make sure that all your
            Qbix server instances (php and node.js) use common config server

Options:

--part What to split. If sharding has not started yet it's enough to provide plugin name and TABLE
  if sharding for table has already started the partition section shall be provided

--connection Optional. The connection name if different from plugin name

--class Optional. The name of the class stored in the table if different from PLUGINNAME_TABLENAME

--fields Optional. JSON formatted string of sharding fields and hashes. By default fields are hashed 
  with "md5" hash. If provided when starting sharding let you overwrite the default hash where needed.
  Valid hash value is ("md5"|"normalize")[%LEN]. Ignored if sharding has already started - hashes are
  stored in the config

--parts JSON formatted string of database connection information formatted in the same way as
  'Db/connections/CONNECTION' config section (see \$APP_DIR/local/app.json). Only differencies
  to connection config must be provided. If you want just different table prefix it's enough
  to provide only prefix. The rest of DB connection info will be fetched from
  'Db/connections/CONNECTION' config section.

--node IP address pointing to node.js instance which will handle the split. If not provided, the
  instance which receive message from this script will be assigned to continue the process.

--trace
  Print stacktraces on errors 


EOT;

$help = <<<EOT
Script to split sharding partition.

1) Calculate requirements and size of new partitions
2) Pass all necessary information to node to make splitting online without disturbing server operations

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/shards.php, 2 if running /framework/scripts/app.php
if ($count < $FROM_APP ? 1 : 2)
	die($usage);

#Read primary arguments
$LOCAL_DIR = $FROM_APP ? APP_DIR : $argv[1];

#Check paths
if (!file_exists($Q_filename = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'Q.inc.php')) #Q Platform
	die("[ERROR] $Q_filename not found" . PHP_EOL);

if (!is_dir($LOCAL_DIR)) #App dir
	die("[ERROR] $LOCAL_DIR doesn't exist or is not a directory" . PHP_EOL);

#Define APP_DIR
if (!defined('APP_DIR'))
	define('APP_DIR', $LOCAL_DIR);

#Include Q
try {
	include($Q_filename);
}
catch (Exception $e)
{
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
}

#Parse secondary arguments
$config = new Q_Tree();

$mode = '';
for ($i = ($FROM_APP ? 1 : 2); $i < $count; ++$i) {
	switch ($mode) {
		case 'part':
			$part = explode('/', $argv[$i]);
			if (count($part) < 2) {
				echo "Not enough parameters to $argv[$i] option\n$usage";
				exit;
			}
			$config->set('plugin', $part[0]);
			$config->set('table', $part[1]);
			if (isset($part[2])) $config->set('shard', $part[2]);
			$mode = '';
			break;
		case 'connection':
		case 'class':
		case 'node':
			$config->set($mode, $argv[$i]);
			$mode = '';
			break;
		case 'fields':
		case 'parts':
			try {
				$config->set($mode, json_decode($argv[$i], true));
				$mode = '';
			} catch (Exception $e) {
				die('[ERROR] '.$e->getMessage());
			}
			break;
		case '':
			switch ($argv[$i]) {
				case '--part':
				case '-part':
				case '-connection':
				case '--connection':
				case '-class':
				case '--class':
				case '-fields':
				case '--fields':
				case '-parts':
				case '--parts':
				case '-node':
				case '--node':
					if ($i + 1 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = ltrim($argv[$i], '-');
					break;
				case '-trace':
				case '--trace':
					$trace = true;
					break;
				case '-log-process':
				case '--log-process':
					Db_Utils::splitRecover();
					exit;
					break;
			}
			break;
		default:
			echo "Wrong parameters to {$argv[$i]}\n$usage";
			exit;
	}
}

if (!$config->get('plugin', false)) {
	echo "You must supply --part argument\n$usage";
	exit;
}

if (!$config->get('connection', false)) {
	$config->set('connection', $config->get('plugin', ''));
}

if (!$config->get('class', false)) {
	$config->set('class', $config->get('connection', '').'_'.$config->get('table', ''));
}

$class = $config->get('class', false);
$row = new $class();

$fields = array_fill_keys($row->getPrimaryKey(), 'md5');
foreach ($config->get('fields', array()) as $field => $hash) {
	if (isset($fields[$field])) $fields[$field] = $hash;
}
$config->set('fields', $fields);

try {

	echo 'Shards splitting script'.PHP_EOL;
	Db_Utils::split($config);

} catch (Exception $e) {
	die('[ERROR] '.$e->getMessage().PHP_EOL.(isset($trace) ? $e->getTraceAsString().PHP_EOL : ''));
}
