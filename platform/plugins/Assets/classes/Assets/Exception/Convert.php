<?php

/**
 * @module Assets
 */
class Assets_Exception_Convert extends Q_Exception
{
	/**
	 * Conversion between currencies failed
	 * @class Assets_Exception_Convert
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_Convert', 'No conversion rate from {{fromCurrency}} to {{toCurrency}}');
