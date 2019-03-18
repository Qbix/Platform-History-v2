<?php

/**
 * @module Assets
 */
class Assets_Exception_NotEnoughCredits extends Q_Exception
{
	/**
	 * An exception is raised if user doesn't have enough credits
	 * @class Assets_Exception_NotEnoughCredits
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_NotEnoughCredits', 'not enough credits: need {{missing}} more');
