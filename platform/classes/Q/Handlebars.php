<?php

/**
 * @module Q
 */
/**
 * This class lets you output render handlebars templates
 * @class Q_Handlebars
 */

class Q_Handlebars {
	/**
	 * Render view using Handlebars rendering engine
	 * @method render
	 * @static
	 * @param {string} $template
	 * @param {mixed} [$data=array()]
	 * @return {string} Rendered template
	 */
	static function render($template, $data = array()) {
		return self::handlebars()->render($template, $data);
	}
	
	/**
	 * Render source using Handlebars rendering engine
	 * @method render
	 * @static
	 * @param {string} $source
	 * @param {mixed} [$data=array()]
	 * @return {string} Rendered template
	 */
	static function renderSource($source, $data = array()) {
		return self::handlebars($source)->loadString($source)->render($data);
	}
	
	static function handlebars()
	{
		if (!isset(self::$handlebars)) {
			self::$handlebars = new Handlebars_Engine(array(
				'cache' => new Handlebars_Cache_Disk(
					APP_FILES_DIR.DS.'Q'.DS.'cache'.DS.'handlebars'
	            ),
				'loader' => new Q_Handlebars_Loader(),
				'partials_loader' => new Q_Handlebars_Loader('partials'),
				'escape' => function($value) {
					return htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
				}
			));
			self::$handlebars->addHelper('call', array('Q_Handlebars', 'helperCall'));
			self::$handlebars->addHelper('tool', array('Q_Handlebars', 'helperTool'));
		}
		return self::$handlebars;
	}
	
	static function helperCall($template, $context, $args, $source)
	{
		if (empty($args[0])) {
			return "{{call missing method name}}";
		}
		$parts = explode('.', $args[0]);
		if (count($parts) < 2) {
			return "{{call ".$args[0]." not found}}";
		}
		$name = $parts[0];
		$method = $parts[1];
		$fields = $context->fields();
		if (empty($fields[$name])) {
			return "{{call ".$args[0]." not found}}";
		}
		$subject = $fields[$name];
		$callable = array($subject, $method);
		if (!is_object($subject) or !is_callable($callable)) {
			return "{{call ".$args[0]." not callable}}";
		}
		return call_user_func_array($callable, array_slice($args, 1));
	}
	
	static function helperTool($template, $context, $args, $source)
	{
		if (empty($args[0])) {
			return "{{tool missing name}}";
		}
		$name = $args[0];
		if (count($args) > 1 && (is_string($args[1]) || is_numeric($args[1]))) {
			$id = $args[1];
		}
		$o = Q::ifset($args, 'hash', array());
		$fields = $context->fields();
		if (isset($fields[$name])) {
			$o = array_merge($o, $fields[$name]);
		}
		if ($id && isset($fields["id:$id"])) {
			$o = array_merge($o, $fields["id:$id"]);
		}
		return Q::tool($name, $o, compact('id'));
	}

	private static $handlebars = null;
}

class Q_Handlebars_Loader implements Handlebars_Loader {
	/**
	 * Q_Handlebars filesystem Loader constructor.
	 *
	 * Passing an $options array allows overriding certain Loader options during instantiation:
	 *
	 *	 $options = array(
	 *		 // The filename extension used for Handlebars templates. Defaults to '.handlebars'
	 *		 'extension' => '.ms',
	 *	 );
	 *
	 * @class Q_Handlebars_Loader
	 * @private
	 * @constructor
	 * @param {string} [$xpath=''] Extra path to add to standard view path (for partials)
	 * @param {array} [$options=array()] Array of Loader options
	 */
	public function __construct($xpath = '', $options = array()) {
		if (!empty($xpath)) $xpath = DS.$xpath;
		// the last resourt is to search Qbix views
		if (file_exists(Q_VIEWS_DIR.$xpath)) {
			array_unshift(self::$loaders, new Handlebars_Loader_FilesystemLoader(Q_VIEWS_DIR.$xpath, $options));
		}

		// search plugin views
		$plugins = Q_Config::get('Q', 'plugins', array());
		foreach ($plugins as $k => $v) {
			$plugin = is_numeric($k) ? $v : $k;
			$PLUGIN = strtoupper($plugin);
			if (file_exists(constant($PLUGIN.'_PLUGIN_VIEWS_DIR').$xpath)) {
				array_unshift(self::$loaders, new Handlebars_Loader_FilesystemLoader(constant($PLUGIN.'_PLUGIN_VIEWS_DIR').$xpath, $options));
			}
		}

		// application views
		if (file_exists(APP_VIEWS_DIR.$xpath)) {
			array_unshift(self::$loaders, new Handlebars_Loader_FilesystemLoader(APP_VIEWS_DIR.$xpath, $options));
		}
	}
	/**
	 * Load a Template by name.
	 * @method load
	 * @param {string} $name
	 * @return {string} Handlebars Template source
	 */
	public function load($name) {
		if (!isset(self::$templates[$name])) {
			self::$templates[$name] = $this->loadFile($name);
		}
		return self::$templates[$name];
	}
	/**
	 * Helper function for loading a Handlebars file by name.
	 * @method loadFile
	 * @protected
	 * @throws {Q_Exception_MissingFile} if a template file is not found.
	 * @param {string} $name
	 * @return {string} Handlebars Template source
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
