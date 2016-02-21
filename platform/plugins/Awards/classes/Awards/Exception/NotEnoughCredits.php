<?php

/**
 * @module Awards
 */
class Awards_Exception_NotEnoughCredits extends Q_Exception
{
	/**
	 * An exception is raised if user doesn't have enough credits
	 * @class Awards_Exception_NotEnoughCredits
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Awards_Exception_NotEnoughCredits', 'not enough credits: need {{missing}} more');
