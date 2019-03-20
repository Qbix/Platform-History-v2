<?php

/**
 * Return 'filename' contents or full config on success or false if update action failed
 */
function Q_Config_response_data () {
	return Q_Config::$cache;
}