<?php

/**
 * Default Q/toolActionNotFound handler.
 */
function Q_toolActionNotFound($params)
{
	Q_Response::code(404);
	echo Q::json_encode("The tool and action were not found.");
}
