<?php

function Users_filter_id($params)
{
	// override this to change how the id is filtered before it is saved
	// to reject the id, return false
	if (substr($params['id'], 5) === "Q_") {
		return false; // these ids are reserved for manually being added to the database
	}
}
