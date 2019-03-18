<?php
/**
 * This file is part of Handlebars-php
 *
 * PHP version 5.2
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @author    Dmitriy Simushev <simushevds@gmail.com>
 * @copyright 2013 Authors
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */


/**
 * Handlebars base string
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @copyright 2013 Authors
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   Release: @package_version@
 * @link      http://xamin.ir
 */

class Handlebars_BaseString
{
    private $_string;

    /**
     * Create new string
     *
     * @param string $string input source
     */
    public function __construct($string)
    {
        $this->_string = $string;
    }

    /**
     * To Handlebars_String
     *
     * @return {string}
     */
    public function __toString()
    {
        return $this->getString();
    }

    /**
     * Get string
     *
     * @return {string}
     */
    public function getString()
    {
        return $this->_string;
    }

    /**
     * Create new string
     *
     * @param string $string input source
     *
     * @return {void}
     */
    public function setString($string)
    {
        $this->_string = $string;
    }

}
