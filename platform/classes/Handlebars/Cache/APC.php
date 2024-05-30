<?php
/**
 * This file is part of Handlebars-php
 * Base on mustache-php https://github.com/bobthecow/mustache.php
 *
 * PHP version 5.2
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    Joey Baker <joey@byjoeybaker.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @copyright 2013 (c) Meraki, LLP
 * @copyright 2013 (c) Behrooz Shabani
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */

/**
 * A dummy array cache
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    Joey Baker <joey@byjoeybaker.com>
 * @copyright 2012 (c) Meraki, LLP
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   Release: @package_version@
 * @link      http://xamin.ir
 */

class Handlebars_Cache_APC implements Handlebars_Cache
{

    /**
     * Get cache for $name if exist.
     *
     * @param {string} $name Handlebars_Cache id
     
     * @return {mixed} data on hit, boolean false on cache not found
     */
    public function get($name)
    {
		return Q_Cache::get($name, false);
    }

    /**
     * Set a cache
     *
     * @param string $name  cache id
     * @param mixed  $value data to store
     *
     * @return {void}
     */
    public function set($name, $value)
    {
        Q_Cache::set($name, $value);
    }

    /**
     * Remove cache
     *
     * @param string $name Handlebars_Cache id
     *
     * @return {void}
     */
    public function remove($name)
    {
        Q_Cache::clear($name);
    }

}
