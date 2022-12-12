<?php

function Users_register_response_data()
{
	$fields = Users::responseData();
	return $fields;
}