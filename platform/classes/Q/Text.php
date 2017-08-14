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
	public $collection = array();
	public $info = array();
	public $language = 'en';
	public $locale = 'US';
	
	static function setLanguage($lang, $locale)
	{
		
	}
	
	static function set($name, $content, $merge)
	{
		
	}
	
	static function get($name, $callback, $options)
	{
		$config = Q_Config::get('Q', 'templates', array());
        $content = Q::readFile($fileName, Q::take($config, array(
			'ignoreCache' => true,
			'dontCache' => true,
			'duration' => 3600
		));
	}
}