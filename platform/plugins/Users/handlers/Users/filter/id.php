<?php

function Users_filter_id($params)
{
	// override this to change how the id is filtered before it is saved
	// to reject the id, return false
	if (substr($params['id'], 0, 2) === "Q_") {
		return false; // these ids are reserved for installers to add to the database
	}
}
