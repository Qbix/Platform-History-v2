<?php

/**
 * @module Assets
 */
class Assets_Exception_HeldForReview extends Q_Exception
{
	/**
	 * The charge is held for review by the payment processor
	 * @class Assets_Exception_HeldForReview
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_HeldForReview', 'Held for review');
