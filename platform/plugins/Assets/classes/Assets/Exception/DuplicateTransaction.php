<?php

/**
 * @module Assets
 */
class Assets_Exception_DuplicateTransaction extends Q_Exception
{
	/**
	 * The charge is reported as a duplicate transaction, so it won't be charged again
	 * @class Assets_Exception_DuplicateTransaction
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_DuplicateTransaction', 'Duplicate transaction');
