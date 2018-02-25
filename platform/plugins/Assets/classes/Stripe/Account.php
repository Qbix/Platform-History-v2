<?php

namespace Stripe;

/**
 * @class Stripe\Account
 * @module Assets
 * @constructor
 * @param {string} $id
 * @param {string $object
 * @param {mixed} $business_logo
 * @param {string} $business_name
 * @param {mixed} $business_url
 * @param {bool} $charges_enabled
 * @param {string} $country
 * @param {bool} $debit_negative_balances
 * @param {mixed} $decline_charge_on
 * @param {string} $default_currency
 * @param {bool} $details_submitted
 * @param {string} $display_name
 * @param {string} $email
 * @param {mixed} $external_accounts
 * @param {mixed} $legal_entity
 * @param {bool} $managed
 * @param {mixed} $payout_schedule
 * @param {mixed} $payout_statement_descriptor
 * @param {bool} $payouts_enabled
 * @param {mixed} $product_description
 * @param {mixed} $statement_descriptor
 * @param {mixed} $support_email
 * @param {mixed} $support_phone
 * @param {string} $timezone
 * @param {mixed} $tos_acceptance
 * @param {mixed} $verification
 * @param {mixed} $keys
 */
class Account extends ApiResource
{
    const PATH_EXTERNAL_ACCOUNTS = '/external_accounts';
    const PATH_LOGIN_LINKS = '/login_links';

    public function instanceUrl()
    {
        if ($this['id'] === null) {
            return '/v1/account';
        } else {
            return parent::instanceUrl();
        }
    }

    /**
     * @method update
     * @retrieve
     * @param array|string|null $id The ID of the account to retrieve, or an
     *     options array containing an `id` key.
     * @param array|string|null $opts
     *
     * @return Stripe\Account
     */
    public static function retrieve($id = null, $opts = null)
    {
        if (!$opts && is_string($id) && substr($id, 0, 3) === 'sk_') {
            $opts = $id;
            $id = null;
        }
        return self::_retrieve($id, $opts);
    }

    /**
     * @method create
     * @static
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\Account
     */
    public static function create($params = null, $opts = null)
    {
        return self::_create($params, $opts);
    }

    /**
     * @method update
     * @static
     * @param string $id The ID of the account to update.
     * @param array|null $params
     * @param array|string|null $options
     *
     * @return Stripe\Account The updated account.
     */
    public static function update($id, $params = null, $options = null)
    {
        return self::_update($id, $params, $options);
    }

    /**
     * @method save
     * @param array|string|null $opts
     *
     * @return Stripe\Account
     */
    public function save($opts = null)
    {
        return $this->_save($opts);
    }

    /**
     * @method delete
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\Account The deleted account.
     */
    public function delete($params = null, $opts = null)
    {
        return $this->_delete($params, $opts);
    }

    /**
     * @method reject
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\Account The rejected account.
     */
    public function reject($params = null, $opts = null)
    {
        $url = $this->instanceUrl() . '/reject';
        list($response, $opts) = $this->_request('post', $url, $params, $opts);
        $this->refreshFrom($response, $opts);
        return $this;
    }

    /**
     * @method all
     * @static
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Collection of Accounts
     */
    public static function all($params = null, $opts = null)
    {
        return self::_all($params, $opts);
    }

    /**
     * @method deauthorize
     * @param array|null $clientId
     * @param array|string|null $opts
     *
     * @return StripeObject Object containing the response from the API.
     */
    public function deauthorize($clientId = null, $opts = null)
    {
        $params = array(
            'client_id' => $clientId,
            'stripe_user_id' => $this->id,
        );
        OAuth::deauthorize($params, $opts);
    }

    /**
     * @method createExternalAccount
     * @static
     * @param array|null $id The ID of the account on which to create the external account.
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\ExternalAccount
     */
    public static function createExternalAccount($id, $params = null, $opts = null)
    {
        return self::_createNestedResource($id, static::PATH_EXTERNAL_ACCOUNTS, $params, $opts);
    }

    /**
     * @method retrieveExternalAccount
     * @static
     * @param array|null $id The ID of the account to which the external account belongs.
     * @param array|null $externalAccountId The ID of the external account to retrieve.
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\ExternalAccount
     */
    public static function retrieveExternalAccount($id, $externalAccountId, $params = null, $opts = null)
    {
        return self::_retrieveNestedResource($id, static::PATH_EXTERNAL_ACCOUNTS, $externalAccountId, $params, $opts);
    }

    /**
     * @method updateExternalAccount
     * @static
     * @param array|null $id The ID of the account to which the external account belongs.
     * @param array|null $externalAccountId The ID of the external account to update.
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\ExternalAccount
     */
    public static function updateExternalAccount($id, $externalAccountId, $params = null, $opts = null)
    {
        return self::_updateNestedResource($id, static::PATH_EXTERNAL_ACCOUNTS, $externalAccountId, $params, $opts);
    }

    /**
     * @method deleteExternalAccount
     * @static
     * @param array|null $id The ID of the account to which the external account belongs.
     * @param array|null $externalAccountId The ID of the external account to delete.
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\ExternalAccount
     */
    public static function deleteExternalAccount($id, $externalAccountId, $params = null, $opts = null)
    {
        return self::_deleteNestedResource($id, static::PATH_EXTERNAL_ACCOUNTS, $externalAccountId, $params, $opts);
    }

    /**
     * @method allExternalAccounts
     * @static
     * @param array|null $id The ID of the account on which to retrieve the external accounts.
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\ExternalAccount
     */
    public static function allExternalAccounts($id, $params = null, $opts = null)
    {
        return self::_allNestedResources($id, static::PATH_EXTERNAL_ACCOUNTS, $params, $opts);
    }

    /**
     * @method createLoginLink
     * @static
     * @param array|null $id The ID of the account on which to create the login link.
     * @param array|null $params
     * @param array|string|null $opts
     *
     * @return Stripe\LoginLink
     */
    public static function createLoginLink($id, $params = null, $opts = null)
    {
        return self::_createNestedResource($id, static::PATH_LOGIN_LINKS, $params, $opts);
    }
}
