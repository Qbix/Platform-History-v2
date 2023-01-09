<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . ($FROM_APP ? '' : '<app_root> '). '[--all] [-su options [-su options] ... ]';

if(!$FROM_APP) {
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';
}

$usage = <<<EOT
$usage

Options:

--all This option is the same as doing install.php --app --plugins --composer --npm
  It will install plugins listed in Q/app/plugins in \$APP_DIR/config/app.json
  followed by installing the app. The plugins and app will be installed on all
  connections/schemas listed in Q/pluginInfo and Q/appInfo, and each plugin and app
  will install any composer or npm package that is specified for it.

--app If true, installs the app

--plugins This option installs all the plugins

--composer Run PHP composer when encountered

--npm Run Node.js Package Manager when encountered

-p \$NAME Can be used repeatedly to install one or more plugins

-s \$CONN_NAME
  This will execute app's install/upgrade sql scripts for connections \$CONN_NAME.
  Note: running SQL statements may require elevated privileges.

-su \$CONN_NAME \$USER_NAME
  This will execute apps's install/upgrade sql scripts for connections \$CONN_NAME,
  using the provided username and will prompt for a password.
  Note: running SQL statements may require elevated privileges.

--group \$GROUP
  Set filesystem group (by name or id) to the \$GROUP,
  accessible by http server and file permisions to 0664/0775
  If no --group parameter specified file permisions are set to 0666/0777
  Note: may require elevated privileges.

--noreq
  Skip requirements checking (useful when installing 2 interdependent plugins)

--trace
  Print stacktraces on errors 


EOT;

$help = <<<EOT
Script to install an app.

1) Install required plugins by running plugin.php script (or run this script with --all after step 2)
2) Customize the database config in your \$local dir to add the necessary DB connections
3) Run this script.

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/install.php, 2 if running /framework/scripts/app.php
if ($count < ($FROM_APP ? 2 : 3))
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
	$Q_installing = true;
	$Q_Bootstrap_config_plugin_limit = 1;
	include($Q_filename);
} catch (Exception $e) {
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
}

#Parse secondary arguments -sql, -sql-user-pass, -auto-install-prerequisites
$auto_plugins = $do_app = false;
$sql_array = $plugins = array();
$options = array(
	'filemode' => 0666,
	'dirmode' => 0777
);

$mode = '';
for ($i = ($FROM_APP ? 1 : 2); $i < $count; ++$i) {
	switch ($mode) {
		case 'sql':
			$sql_array[$argv[$i]] = array('enabled'=>true);
			$mode = '';
			break;
		case 'sql-user-pass':
			$sql_array[$argv[$i]] = array(
				'enabled'=>true,
				'username' => $argv[$i + 1],
				'password' => true //$argv[$i + 2]
			);
			$i = $i + 1;
			$mode = '';
			break;
		case 'group':
			$options['group'] = $argv[$i];
			$options['filemode'] = 0664;
			$options['dirmode'] = 0775;
			$mode = '';
			break;
		case 'plugin':
			$plugins[] = $argv[$i];
		case '':
			switch ($argv[$i]) {
				case '-s':
					if ($i + 1 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = 'sql';
					break;
				case '-su':
				case '-sum':
					if ($i + 2 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = 'sql-user-pass';
					break;
				case '--trace':
					$trace = true;
					break;
				case '--noreq':
					$options['noreq'] = true;
					break;
				case '-all':
				case '--all':
					$auto_plugins = true;
					$do_app = true;
					$options['composer'] = true;
					$options['npm'] = true;
					break;
				case '-plugins':
				case '--plugins':
					$auto_plugins = true;
					break;
				case '-p':
				case '--plugin':
					if ($i + 1 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = 'plugin';
					break;
				case '--group':
					if (isset($options['group'])) {
						echo "You can specify $argv[$i] option only once\n$usage";
						exit;
					}
					if ($i + 1 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = 'group';
					break;
				case '--app':
					$do_app = true;
					break;
				case '--composer':
					$options['composer'] = true;
					break;
				case '--npm':
					$options['npm'] = true;
					break;
			}
			break;
	}
}

$options['sql'] = $sql_array;
$is_win = (substr(strtolower(PHP_OS), 0, 3) === 'win');

$app = Q::app();
echo "Q Platform installer for $app app".PHP_EOL;

$uploads_dir = APP_FILES_DIR.DS.$app.DS.'uploads';
if (is_dir($uploads_dir)) {
	$web_uploads_path = APP_ROOT_DIR.DS.'Q'.DS.'uploads';
	if (!file_exists($web_uploads_path)
	and !is_link($web_uploads_path)) {
		Q_Utils::symlink($uploads_dir, $web_uploads_path);
	}
}

$text_dir = APP_TEXT_DIR;
if (is_dir($text_dir)) {
	$web_text_path = APP_ROOT_DIR.DS.'Q'.DS.'text';
	if (!file_exists($web_text_path)
	and !is_link($web_text_path)) {
		Q_Utils::symlink($text_dir, $web_text_path);
	}
}

$web_views_path = APP_ROOT_DIR.DS.'Q'.DS.'views';
if (!file_exists($web_views_path)) {
	mkdir($web_views_path, 0755, true);
}

if ($auto_plugins) {
	$plugins = Q::plugins();
}

if (in_array('Q', $plugins) !== false) {
	Q_Plugin::checkPermissions(Q_FILES_DIR, $options);
	Q_Plugin::npmInstall(Q_DIR, !empty($options['npm']));
	Q_Plugin::composerInstall(Q_DIR, !empty($options['composer']));
}

foreach ($plugins as $plugin) {
	$cons = Q_Config::get('Q', 'pluginInfo', $plugin, 'connections', array());
	foreach ($cons as $con) {
		if (empty($options['sql'][$con])) {
			$options['sql'][$con] = array('enabled' => true);
		}
	}
	Q_Plugin::installPlugin($plugin, $options);
	++$Q_Bootstrap_config_plugin_limit;
	Q_Bootstrap::configure(true);
}
if (empty($plugins)) {
	$Q_Bootstrap_config_plugin_limit = null;
	Q_Bootstrap::configure(true);
}

if ($do_app) {
	// if application is installed/updated, its schema is always installed/updated
	$cons = Q_Config::get('Q', 'appInfo', 'connections', array());
	foreach ($cons as $con) {
		if (empty($options['sql'][$con])) {
			$options['sql'][$con] = array('enabled' => true);
		}
	}

	$options['deep'] = true;
	Q_Plugin::installApp($options);
}
