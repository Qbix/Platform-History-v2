<?php

/**
 * @module Q
 */
class Q_OutputBuffer
{
	/**
	 * Allows use of output buffers that deal intelligently with exceptions.
	 * Constructor responseTypely calls ob_start().
	 * The getClean() method calls ob_end_flush() repeatedly to flush buffers
	 * which have been started but not flushed yet, after this one.
	 * @class Q_OutputBuffer
	 * @constructor
	 * @param {string} [$handler=null] The output handler, such as 'ob_gzhandler'.
	 * @param {string} [$languageLocale=null] Can be used to change the PHP locale for a while, e.g. "en_GB"
	 * @param {boolean} [$throw_on_failure=false] If true, and throws an exception if failed
	 *  to create output buffer with this handler.
	 *  Otherwise, silently creates a "normal" output buffer.
	 * @throws {Exception}
	 */
	function __construct(
	 $handler = null, 
	 $languageLocale = null,
	 $throw_on_failure = false)
	{
		if (empty($handler) or !is_string($handler)) {
			ob_start();
		} else {
			$started = ob_start($handler);
			if (!$started) {
				if (!$throw_on_failure) {
					throw new Exception(
						"Q_OutputBuffer with handler $handler could not be created"
					);
				}
				ob_start();
			}
		}
		$status = ob_get_status(false);
		$this->level = $status['level']; // nesting level of current buffer
		$this->pushLanguageLocale($languageLocale);
	}
	
	/**
	 * Calls ob_get_clean().
	 * The getClean() method calls ob_end_flush() repeatedly to flush buffers
	 * which have been started but not flushed yet, after this one.
	 * @method getClean
	 * @return {string}
	 */
	function getClean()
	{
		$this->flushHigherBuffers();
		$this->popLanguageLocale();
		return ob_get_clean();
	}
	
	/**
	 * Calls ob_end_flush().
	 * The endFlush() method calls ob_end_flush() repeatedly to flush buffers
	 * which have been started but not flushed yet, after this one.
	 * @method endFlush
	 */
	function endFlush()
	{
		$this->flushHigherBuffers();
		$this->popLanguageLocale();
		return @ob_end_flush();
	}
	
	/**
	 * Calls ob_get_length().
	 * The getLength() method calls ob_end_flush() repeatedly to flush buffers
	 * which have been started but not flushed yet, after this one.
	 * @method getLength
	 */
	function getLength()
	{
		$this->flushHigherBuffers();
		return ob_get_length();
	}
	
	/**
	 * @method flushHigherBuffers
	 */
	function flushHigherBuffers()
	{
		$status = ob_get_status(false);
		$level = $status['level']; // nesting level of current buffer
		for ($i = $level; $i > $this->level; --$i) {
			@ob_end_flush();
		}
	}
	
	protected function pushLanguageLocale($languageLocale)
	{
		if ($languageLocale) {
			$this->lastLanguageLocale = $this->locales[$this->level] = $languageLocale;
			setlocale(LC_ALL, $languageLocale);
		} else {
			if (!$this->lastLanguageLocale) {
				$this->lastLanguageLocale = Q_Request::languageLocale();
			}
			$this->locales[$this->level] = $this->lastLanguageLocale;
		}
	}
	
	protected function popLanguageLocale()
	{
		$languageLocales = array();
		for ($i=0; $i<$this->level; ++$i) {
			if (isset($this->languageLocales[$i])) {
				$languageLocales = $this->languageLocales[$i];
			}
		}
		$this->languageLocales = $languageLocales;
	}

	/**
	 * @property $locales
	 * @type array
	 */
	public $locales;

	/**
	 * @property $level
	 * @type integer
	 */
	public $level;
	
	/**
	 * @property $languageLocales
	 * @static
	 * @type array
	 */
	public $languageLocales = array();
	
	/**
	 * @property $lastLanguageLocale
	 * @static
	 * @type string
	 */
	public $lastLanguageLocale = null;
}
