<?php
/**
 * This file is part of Handlebars-php
 *
 * PHP version 5.2
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    Jeff Turcotte <jeff.turcotte@gmail.com>
 * @copyright 2014 Authors
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */


/**
 * Handlebars helper interface
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    Jeff Turcotte <jeff.turcotte@gmail.com>
 * @copyright 2014 Authors
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   Release: @package_version@
 * @link      http://xamin.ir
 */
interface Handlebars_Helper
{
    /**
     * Execute the helper
     *
     * @param Handlebars_Template $template The template instance
     * @param Handlebars_Context  $context  The current context
     * @param array                $args     The arguments passed the the helper
     * @param string               $source   The source
     *
     * @return {mixe}
     */
    public function execute(Handlebars_Template $template, Handlebars_Context $context, $args, $source);
}
