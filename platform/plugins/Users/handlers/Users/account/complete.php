<?php

/**
 * Determine and return whether the account is complete
 * Override this handler in your apps to determine
 * whether an account is considered complete.
 *
 * @return {bool}
 */
function Users_account_complete($params)
{
	return true;
}
