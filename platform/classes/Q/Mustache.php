<?php

/**
 * @module Q
 */
/**
 * This class lets you output render mustache templates
 * @class Q_Mustache
 */
class Q_Mustache {
	/**
	 * Render view using Mustache rendering engine
	 * @method render
	 * @static
	 * @param {string} $template
	 * @param {mixed} [$data=array()]
	 * @return {string} Rendered template
	 */
	static function render($template, $data = array()) {
		return self::mustache()->render($template, $data);
	}
	
	/**
	 * Render source using Mustache rendering engine
	 * @method render
	 * @static
	 * @param {string} $source
	 * @param {mixed} [$data=array()]
	 * @return {string} Rendered template
	 */
	static function renderSource($source, $data = array()) {
		return self::mustache()->loadSource($source)->render($data);
	}
	
	static function mustache()
	{
		if (isset(self::$mustache)) {
			return self::$mustache;
		}
		return self::$mustache = new Mustache_Engine(array(
			'cache' => APP_FILES_DIR.DS.'Q'.DS.'cache'.DS.'mustache',
			'loader' => new Q_Mustache_Loader(),
			'partials_loader' => new Q_Mustache_Loader('partials'),
			'escape' => function($value) {
				return htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
			}
		));
	}

	private static $mustache = null;
}

class Q_Mustache_Loader implements Mustache_Loader {
	/**
	 * Q_Mustache filesystem Loader constructor.
	 *
	 * Passing an $options array allows overriding certain Loader options during instantiation:
	 *
	 *	 $options = array(
	 *		 // The filename extension used for Mustache templates. Defaults to '.mustache'
	 *		 'extension' => '.ms',
	 *	 );
	 *
	 * @class Q_Mustache_Loader
	 * @private
	 * @constructor
	 * @param {string} [$xpath=''] Extra path to add to standard view path (for partials)
	 * @param {array} [$options=array()] Array of Loader options
	 */
	public function __construct($xpath = '', $options = array()) {
		if (!empty($xpath)) $xpath = DS.$xpath;
		// the last resourt is to search Qbix views
		if (file_exists(Q_VIEWS_DIR.$xpath)) {
			array_unshift(self::$loaders, new Mustache_Loader_FilesystemLoader(Q_VIEWS_DIR.$xpath, $options));
		}

		// search plugin views
		$plugins = Q::plugins();
		foreach ($plugins as $k => $v) {
			$plugin = is_numeric($k) ? $v : $k;
			$PLUGIN = strtoupper($plugin);
			if (file_exists(constant($PLUGIN.'_PLUGIN_VIEWS_DIR').$xpath)) {
				array_unshift(self::$loaders, new Mustache_Loader_FilesystemLoader(constant($PLUGIN.'_PLUGIN_VIEWS_DIR').$xpath, $options));
			}
		}

		// application views
		if (file_exists(APP_VIEWS_DIR.$xpath)) {
			array_unshift(self::$loaders, new Mustache_Loader_FilesystemLoader(APP_VIEWS_DIR.$xpath, $options));
		}
	}
	/**
	 * Load a Template by name.
	 * @method load
	 * @param {string} $name
	 * @return {string} Mustache Template source
	 */
	public function load($name) {
		if (!isset(self::$templates[$name])) {
			self::$templates[$name] = $this->loadFile($name);
		}
		return self::$templates[$name];
	}
	/**
	 * Helper function for loading a Mustache file by name.
	 * @method loadFile
	 * @protected
	 * @throws {Q_Exception_MissingFile} if a template file is not found.
	 * @param {string} $name
	 * @return {string} Mustache Template source
	 */
	protected function loadFile($name) {
		$tpl = null;
		foreach (self::$loaders as $loader) {
			try {
				$tpl = $loader->load($name);
				break;
			} catch (InvalidArgumentException $e) {}
		}
		if (!isset($tpl)) throw new Q_Exception_MissingFile(array('filename' => $name));
		return $tpl;
	}

	private static $loaders = array();
	private static $templates = array();
}
