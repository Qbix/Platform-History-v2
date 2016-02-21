<?php

/**
 * @module Awards
 */
class Awards_Exception_HeldForReview extends Q_Exception
{
	/**
	 * The charge is held for review by the payment processor
	 * @class Awards_Exception_HeldForReview
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Awards_Exception_HeldForReview', 'Held for review');
