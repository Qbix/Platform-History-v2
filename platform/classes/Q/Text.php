<?php
	
/**
 * @module Q
 */
/**
 * Methods for loading text from files.
 * Used for translations, A/B testing and more.
 * @class Q_Text
 */
class Q_Text
{
	public static $collection = array();
	// This lang will be default for all text files.
	// Current lang texts will be merged to default lang text.
	// So absent texts will be displayed in default lang.
	public static $defaultLanguage = 'en';
	public static $language = 'en';
	public static $locale = 'US';
	
	/**
	 * Call this function to get the basename to use for loading files,
	 * based on the language and locale set on this class.
	 * Used to load files customized to a user's language (and locale).
	 * @param {array} [$options]
	 * @param {string} [$options.language=null] Override language
	 * @param {string} [$options.locale=null] Override locale
	 * @return {string} something like "en-US"
	 */
	static function basename($options = array())
	{
		$locale = Q_Config::get('Q', 'text', 'useLocale', false)
			? self::$locale
			: '';
		if (isset($options['language'])) {
			$language = $options['language'];
			$locale = Q::ifset($options, 'locale', $locale);
		} else {
			$language = self::$language;
		}
		return $locale ? "$language-$locale" : $language;
	}
	
	/**
	 * Sets the language and locale to use in Q_Text::basename() calls.
	 * The Q_Dispatcher::dispatch() method calls this by default using
	 * information from Q_Request::languages().
	 * @method set
	 * @static
	 * @param {String} language Something like "en"
	 * @param {String} [locale=null] Something like "US", but can also be null if unknown
	 */
	static function setLanguage($language, $locale = null)
	{
		self::$language = strtolower($language);
		self::$locale = $locale ? strtoupper($locale) : '';
	}
	
	/**
	 * Sets the text for a specific text source.
	 * @static
	 * @method set
	 * @param {string} name The name of the text source
	 * @param {array} content The content, a hierarchical object whose leaves are
	 *  the actual text translated into the current language in Q.Text.language
	 * @param {array} [options]
	 * @param {string} [options.language=Q_Text::language] Preferred language, e.g. "en"
	 * @param {string} [options.locale=Q_Text::locale] Preferred locale, e.g. "US"
	 * @param {string} [options.merge=false] If true, merges on top instead of replacing
	 * @return {array} The content that was set, with any loaded overrides applied
	 */
	static function set($name, $content, $options = array())
	{
		$basename = self::basename($options);
		if (!empty(self::$override[$basename][$name])) {
			$tree = new Q_Tree($content);
			$tree->merge(self::$override[$basename][$name]);
		}
		if (!empty($options['merge']) and !empty(self::$collection[$basename][$name])) {
			$tree = new Q_Tree(self::$collection[$basename][$name]);
			$tree->merge($content);
		} else {
			self::$collection[$basename][$name] = $content;
		}
		if (!empty($content['@override'])) {
			foreach ($content['@override'] as $k => $v) {
				self::$override[$basename][$k] = $v;
				if (!empty(self::$collection[$basename][$k])) {
					$tree = new Q_Tree(self::$collection[$basename][$k]);
					$tree->merge($v);
				}
			}
		}
		return $content;
	}
	
	/**
	 * Get the text from a specific text source or sources.
	 * @static
	 * @method get
	 * @param {string|array} name The name of the text source. Can also be an array,
	 *  in which case the text sources are merged in the order they are named.
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.ignoreCache=false] If true, reloads the text source even if it's been already cached.
	 * @param {boolean} [$options.merge=false] For Q_Text::set if content is loaded
	 * @param {string} [$options.language=null] Override language
	 * @param {string} [$options.locale=null] Override locale
	 * @param {boolean} [$options.reload=false] Whether to reload the files even if they was already loaded before
	 * @return {array} Returns the (merged) content of the text source(s)
	 */
	static function get($name, $options = array())
	{
		if (is_array($name)) {
			$result = new Q_Tree();
			$name = array_unique($name);
			foreach ($name as $n) {
				$result->merge(self::get($n, $options));
			}
			return $result->getAll();
		}
		$basename = self::basename($options);
		$content = Q::ifset(self::$collection, $basename, $name, null);
		if (empty($options['reload']) and !empty($content)) {
			return $content;
		}
		$filename = "text/$name/$basename.json";

		if (!file_exists(Q::realPath($filename))) {
			$filename = "text/$name/en.json";
		}
		$config = Q_Config::get('Q', 'text', '*', array());
		$tree = Q_Tree::createAndLoad($filename, !empty($options['ignoreCache']));
		$content = $tree ? $tree->getAll() : null;
		if ($content) {
			return self::set($name, $content, Q::ifset($options, 'merge', false));
		}
		return array();
	}

	/**
	 * Get sources for a view template merged from all the wildcards in the config
	 * Looks in the config under Q/text/$viewPattern and expects an array of strings,
	 * of an object of options, with key "sources" with an array of strings.
	 * @method sources
	 * @static
	 * @param {array} $parts The parts of the view name, to use with Q/text config
	 * @return {array} The merged array of names of sources to load
	 */
	static function sources($parts = array())
	{
		$count = count($parts);
		$try = array();
		for ($i=0, $j=0; $i<=$count; ++$i) {
			$try[$j] = $parts;
			if ($i > 0) {
				array_splice($try[$j], -$i, $i, '*');
			}
			++$j;
		}
		$result = array();
		$count = count($try);
		for ($j=0; $j<$count; ++$j) {
			$p = array_merge(array('Q', 'text'), $try[$j], array(null));
			if ($sources = call_user_func_array(array('Q_Config', 'get'), $p)) {
				if (Q::isAssociative($sources)) {
					$sources = Q::ifset($sources, 'sources', array());
				}
				$result = array_merge($result, $sources);
			}
		}
		return $result;
	}

	/**
	 * Get parameters merged from all the text sources corresponding to a view template.
	 * Looks in the config under Q/text/$viewPattern and expects an array of strings,
	 * of an object of options, with key "sources" with an array of strings.
	 * @method params
	 * @static
	 * @param {array} $parts The parts of the view name, to use with Q/text config
	 * @param {array} [$options=array()] Array of options which will pass to Q_Text::get
	 * @return {array} The merged parameters that come from the text
	 */
	static function params($parts = array(), $options = array())
	{
		$count = count($parts);
		$try = array();
		for ($i=0, $j=0; $i<=$count; ++$i) {
			$try[$j] = $parts;
			if ($i > 0) {
				array_splice($try[$j], -$i, $i, '*');
			}
			++$j;
		}
		$count = count($try);
		$tree = new Q_Tree();
		$sources = array();
		for ($j=0; $j<$count; ++$j) {
			$p = array_merge(array('Q', 'text'), $try[$j], array(null));
			if ($text = call_user_func_array(array('Q_Config', 'get'), $p)) {
				if (Q::isAssociative($text)) { 
					if (empty($options2['sources'])) {
						continue;
					}
					$sources = array_merge($sources, $options2['sources']);
				} else {
					$options2 = $options;
					$sources = array_merge($sources, $text);
				}
				break; // just take whatever is there, no merging
			}
		}
		$sources = array_unique($sources);
		foreach ($sources as $s) {
			if (isset($options2['language']) && $options2['language'] != self::$defaultLanguage) {
				$tree->merge(Q_Text::get($s, array('language' => self::$defaultLanguage)));
			}
			$tree->merge(Q_Text::get($s, $options2));
		}
		return $tree->getAll();
	}
	
	/**
	 * Depending on whether the client is a touchscreen or not,
	 * returns either the word "click" or "tap" in the current language,
	 * @method clickOrTap
	 * @static
	 * @param {boolean} $uppercase Whether the first letter should be uppercase
	 * @return {string}
	 */
	static function clickOrTap($uppercase)
	{
		if (Q_Request::isTouchscreen()) {
			$word = $uppercase ? 'Tap' : 'tap';
		} else {
			$word = $uppercase ? 'Click': 'click';
		}
		$text = Q_Text::get('Q/content');
		return Q::ifset($text, 'words', $word, $word);
	}
	
	/**
	 * Information on languages
	 * @static
	 * @return {array} An array with the keys being the two-digit language code
	 */
	static function languagesInfo()
	{
		static $info = null;
		if (!$info) {
			$content = file_get_contents(Q_FILES_DIR.DS.'Q'.DS.'languages.json');
			$info = Q::json_decode($content);
		}
		return $info;
	}
	
	protected static $get = array();
	protected static $override = array();
}