<?php

function Q_missingView($params)
{
	extract($params);
	/**
	 * @var string $viewName
	 */
	return "Missing view $viewName";
}
