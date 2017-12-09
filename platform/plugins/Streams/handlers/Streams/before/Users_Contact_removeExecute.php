<?php

function Streams_before_Users_Contact_removeExecute($params)
{
	// Save the contacts list that will be deleted, so we can update the avatars later
	Streams::$cache['contacts_removed'] = Users_Contact::select()
		->where($params['criteria'])
		->fetchDbRows();
}