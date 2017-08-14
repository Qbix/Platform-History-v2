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
				'partials_loader' => new Q_Handlebars_Loader(),
				'escape' => function($value) {
					return htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
				}
			));
			self::$handlebars->addHelper('call', array('Q_Handlebars', 'helperCall'));
			self::$handlebars->addHelper('tool', array('Q_Handlebars', 'helperTool'));
			self::$handlebars->addHelper('idPrefix', array('Q_Handlebars', 'helperIdPrefix'));
			self::$handlebars->addHelper('toUrl', array('Q_Handlebars', 'helperToUrl'));
			self::$handlebars->addHelper('toCapitalized', array('Q_Handlebars', 'helperToCapitalized'));
			self::$handlebars->addHelper('interpolate', array('Q_Handlebars', 'helperInterpolate'));
		}
		return self::$handlebars;
	}

	/**
	 * Call this in your helpers to parse the args into a useful array
	 * @method parseArgs
	 * @static
	 * @param {Handlebars_Template} $template
	 * @param {Handlebars_Context} $context
	 * @param {string|array} $args
	 * @return {array}
	 */
	static function parseArgs($template, $context, $args)
	{
		if (is_array($args)) {
			return $args;
		}
		$parsed = array_merge(
			$template->parseArguments($args),
			$template->parseNamedArguments($args)
		);
		$results = array();
		foreach ($parsed as $k => $arg) {
			$result = $context->get($arg);
			if (!isset($result)) {
				try {
					$result = Q::json_decode($arg);
				} catch (Exception $e) {

				}
			}
			$results[$k] = $result;
		}
		return $results;
	}
	
	static function helperCall($template, $context, $args, $source)
	{
		$args = self::parseArgs($template, $context, $args);
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
		$args = self::parseArgs($template, $context, $args);
		if (empty($args[0])) {
			return "{{tool missing name}}";
		}
		$name = $args[0];
		$id = null;
		if (isset($args[1]) && (is_string($args[1]) || is_numeric($args[1]))) {
			$id = $args[1];
		}
		$t = new Q_Tree();
		foreach ($args as $k => $v) {
			if (is_numeric($k)) {
				continue;
			}
			$arr = explode('-', $k);
			$arr[] = $v;
			call_user_func_array(array($t, 'set'), $arr);
		}
		$o = $t->getAll();
		$fields = $context->fields();
		if (isset($fields[$name])) {
			$o = array_merge($args, $fields[$name]);
		}
		if ($id) {
			$id2 = $id;
			if (is_string($id2) or is_numeric($id2)) {
				$id2 = implode('_', explode('/', $name)) . ($id2 !== '' ? '-'.$id2 : '');
			}
			if (isset($fields["id:$id2"])) {
				$o = array_merge($o, $fields["id:$id2"]);
			}
		}
		return Q::tool($name, $o, compact('id'));
	}
	
	static function helperIdPrefix($template, $context, $args, $source)
	{
		return Q_Html::getIdPrefix();
	}
	
	static function helperToUrl($template, $context, $args, $source)
	{
		$args = self::parseArgs($template, $context, $args);
		if (empty($args[0])) {
			return "{{url missing}}";
		}
		return Q_Html::themedUrl($args[0]);
	}
	
	static function helperToCapitalized($template, $context, $args, $source)
	{
		$args = self::parseArgs($template, $context, $args);
		return isset($args[0]) ? ucfirst($args[0]) : '';
	}
	
	static function helperInterpolate($template, $context, $args, $source)
	{
		$args = self::parseArgs($template, $context, $args);
		$expression = array_shift($args);
		if (!$expression) {
			return '';
		}
		return Q::interpolate($expression, $args);
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
			$name = $PLUGIN.'_PLUGIN_VIEWS_DIR';
			if (defined($name)
			and file_exists(constant($name).$xpath)) {
				array_unshift(self::$loaders, new Handlebars_Loader_FilesystemLoader(
					constant($name).$xpath, $options
				));
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
