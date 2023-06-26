<?php

/**
 * @module Q
 */
class Q_Exception_InvalidLanguage extends Q_Exception
{
	/**
	 * @class Q_Exception_InvalidLanguage
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $language
	 */
};

Q_Exception::add('Q_Exception_InvalidLanguage', 'invalid language {{language}}');
