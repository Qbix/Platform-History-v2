<?php
if (!defined('RUNNING_FROM_APP') or !defined('CONFIGURE_ORIGINAL_APP_NAME')) {
	die("This script can only be run from an app template.\n");
}

$help = <<<EOT

This script automatically translates app interface into various languages or prepares json files for human translators.
		
Options include:

--source          Use language code as a value. The value can be combined with location code.
                  Default value is en, if the option is not specified.
                  Examples:
                  --source=en-US
                  --source=ru-UA
                  --source=ru
           
--in              Input directory which contains source json files.
                  Default value APP_DIR/text, where APP_DIR is your application folder.
                  Example:
                  --in=/home/user/input
       
--out             Output directory.
                  Default value APP_DIR/text, where APP_DIR is your application folder.
                  Example:
                  --out=/home/user/output
				  
--app             Translate the text in the app

--plugins         Translate the text in all the plugins
       
--format          Can be "google" or "human".
                  "google" automatically translates files using Google Translation API.
                  Google API key must be provided in your application config (app.json).
                  "human" prepares files for further human translators.
                  Default value is "google".
                  Examples:
                  --format=google
                  --format=human
                  
--google-format   Google translation format. This option is used along with --format=google.
                  The format of the source text, in either HTML (default) or plain-text.
                  A value of html indicates HTML and a value of text indicates plain-text.
                  Default value is "html".
                  Examples:
                  --google-format=html
                  --google-format=text

--retranslate     This option can be used more than once. It should be followed by a
                  slash-separated ("/") set of strings that together form the key of a string,
                  or of an object containing strings, to be translated even if already translated
                  in the destination. 
				  
--locales         Use this to indicate the alternative filename to config/Q/locales.json

EOT;

// get all CLI options
$opts = array( 'h::', 's::', 'i::', 'o::', 'n::', 'f::', 'g::', 'r:', 'l:', 'p:');
$longopts = array('help::', 'source::', 'in::', 'out::', 'null::', 'format::', 'google-format::', 'retranslate:', 'locales:', 'plugins');
$options = getopt(implode('', $opts), $longopts);
if (isset($options['help'])) {
	echo $help;
	exit;
}

Q_Cache::clear(true, false, 'Q_Text::get');

if (empty($options['source'])) {
	$options['source'] = 'en';
};
if (empty($options['format'])) {
	$options['format'] = 'google';
};
if (!empty($options['google-format'])) {
	$options['google-format'] = in_array($options['google-format'], array('text', 'html')) ? $options['google-format'] : 'html';
} else {
	$options['google-format'] = 'html';
}
if (isset($options['plugins'])) {
	$plugins = Q::plugins();
	foreach ($plugins as $plugin) {
		$PLUGIN = strtoupper($plugin);
		$PLUGIN_DIR = constant($PLUGIN . '_PLUGIN_DIR');
		foreach (glob($PLUGIN_DIR . DS . 'text' . DS . '*') as $textFolder) {
			$options['in'] = $options['out'] = $textFolder;
			echo "Translating $textFolder\n";
			$translate = new Q_Translate($options);
			$translate->saveAll();
		}
	}
} else {
	$textFolder = APP_DIR . DS . 'text' . DS . CONFIGURE_ORIGINAL_APP_NAME;
	if (empty($options['in'])) {
		$options['in'] = $textFolder;
	} else {
		// relative path
		if (substr($options['in'], 0, 1) === '.') {
			$options['in'] = APP_SCRIPTS_DIR . DS . 'Q' . DS .$options['in'];
		}
	}
	if (empty($options['out'])) {
		$options['out'] = $textFolder;
	} else {
		// relative path
		if (substr($options['in'], 0, 1) === '.') {
			$options['out'] = APP_SCRIPTS_DIR . DS . 'Q' . DS .$options['out'];
		}
	};

	$translate = new Q_Translate($options);
	$translate->saveAll();
}