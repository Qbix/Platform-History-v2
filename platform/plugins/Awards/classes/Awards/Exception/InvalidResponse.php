<?php

/**
 * @module Awards
 */
class Awards_Exception_InvalidResponse extends Q_Exception
{
	/**
	 * Received an invalid response from the payment processor
	 * @class Awards_Exception_InvalidResponse
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Awards_Exception_InvalidResponse', 'invalid response: {{response}}');
