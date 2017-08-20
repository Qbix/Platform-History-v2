<?php

/**
 * @module Q
 */
class Q_OutputBuffer
{
	/**
	 * Allows use of output buffers that deal intelligently with exceptions.
	 * Constructor implicitly calls ob_start().
	 * The getClean() method calls ob_end_flush() repeatedly to flush buffers
	 * which have been started but not flushed yet, after this one.
	 * @class Q_OutputBuffer
	 * @constructor
	 * @param {string} [$handler=null] The output handler, such as 'ob_gzhandler'.
	 * @param {string} [$locale=null] Can be used to change the locale for a while, e.g. "en_GB"
	 * @param {boolean} [$throw_on_failure=false] If true, and throws an exception if failed
	 *  to create output buffer with this handler.
	 *  Otherwise, silently creates a "normal" output buffer.
	 * @throws {Exception}
	 */
	function __construct(
	 $handler = null, 
	 $locale = null,
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
		$this->pushLocale($locale);
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
		$this->popLocale();
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
		$this->popLocale();
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
	
	protected function pushLocale($locale)
	{
		if ($locale) {
			$this->lastLocale = $this->locales[$this->level] = $locale;
			setlocale($locale);
		} else {
			if (!$this->lastLocale) {
				$this->lastLocale = Q_Request::locale();
			}
			$this->locales[$this->level] = $this->lastLocale;
		}
	}
	
	protected function popLocale()
	{
		$locales = array();
		for ($i=0; $i<$this->level; ++$i) {
			if (isset($this->locales[$i])) {
				$locales = $this->locales[$i];
			}
		}
		$this->locales = $locales;
	}

	/**
	 * @property $level
	 * @type integer
	 */
	public $level;
	
	/**
	 * @property $locales
	 * @static
	 * @type array
	 */
	public $locales = array();
	
	/**
	 * @property $lastLocale
	 * @static
	 * @type string
	 */
	public $lastLocale = null;
}
