<?php
/**
 * @module Websites
 */
/**
 * Class representing 'Permalink' rows in the 'Websites' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a permalink row in the Websites database.
 *
 * @class Websites_Permalink
 * @extends Base_Websites_Permalink
 */
class Websites_Permalink extends Base_Websites_Permalink
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
		// INSERT YOUR CODE HERE
		// e.g. $this->hasMany(...) and stuff like that.
	}

	/* 
	 * Add any Websites_Permalink methods here, whether public or not
	 * If file 'Permalink.php.inc' exists, its content is included
	 * * * */
	function beforeSave($modifiedFields)
	{
		$stream = null;
		$uri = Q_Uri::from($this->uri);
		if ($uri->module === 'Streams' and $uri->action === 'stream') {
			$publisherId = Streams::requestedPublisherId(false, $uri);
			$streamName = Streams::requestedName(false, 'original', $uri);
			$stream = Streams_Stream::fetch(null, $publisherId, $streamName);
		}
		Q::event('Websites/permalink', array(
			'permalink' => $this,
			'modifiedFields' => $modifiedFields,
			'stream' => &$stream
		), 'before');
		if ($stream and ($stream instanceof Streams_Stream)) {
			$stream->setAttribute("Websites/url", $this->url);
			$stream->changed();
		}
		return parent::beforeSave($modifiedFields);
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Websites_Permalink} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Websites_Permalink();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};