<?php

/**
 * Front controller for Q
 */
include(dirname(__FILE__).DIRECTORY_SEPARATOR.'Q.inc.php');

//
// Handle the web request
//
Q_ActionController::execute();
