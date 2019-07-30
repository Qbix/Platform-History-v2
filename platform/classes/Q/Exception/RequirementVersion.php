<?php

/**
 * @module Q
 */
class Q_Exception_RequirementVersion extends Q_Exception
{
	/**
	 * @class Q_Exception_RequirementVersion
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $by
	 * @param {string} $plugin
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_RequirementVersion', 'Plugin \'{{by}}\' requires plugin \'{{plugin}}\' version {{version}} or compatible. (You have: {{installed}}, compatible with {{compatible}})', 500);