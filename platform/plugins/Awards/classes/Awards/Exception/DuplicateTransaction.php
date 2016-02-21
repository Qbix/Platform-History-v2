<?php

/**
 * @module Awards
 */
class Awards_Exception_DuplicateTransaction extends Q_Exception
{
	/**
	 * The charge is reported as a duplicate transaction, so it won't be charged again
	 * @class Awards_Exception_DuplicateTransaction
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Awards_Exception_DuplicateTransaction', 'Duplicate transaction');
