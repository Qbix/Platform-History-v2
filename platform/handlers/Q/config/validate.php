<?php

function Q_Config_validate () {
	Q_Valid::signature(true, $_REQUEST);
	return true;
}