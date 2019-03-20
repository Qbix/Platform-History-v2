<?php

function Q_missingTool($params)
{
	// By default, render an empty tool element with all the options passed
	Q_Response::setToolOptions($params['options']);
	return '';
}
