<?php

/**
 * @module Q
 */
class Q_Exception_AppRequirementVersion extends Q_Exception
{
	/**
	 * @class Q_Exception_AppRequirementVersion
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $by
	 * @param {string} $plugin
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_AppRequirementVersion', 'App \'{{by}}\' requires plugin \'{{plugin}}\' version {{version}} or compatible. (You have: {{installed}}, compatible with {{compatible}})');