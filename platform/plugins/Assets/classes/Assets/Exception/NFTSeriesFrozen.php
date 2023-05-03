<?php

/**
 * @module Assets
 */
class Assets_Exception_NFTSeriesFrozen extends Q_Exception
{
	/**
	 * Trying to manage frozen NFT series
	 * @class Assets_Exception_NFTSeriesFrozen
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_NFTSeriesFrozen', "Can't manage frozen series.");
