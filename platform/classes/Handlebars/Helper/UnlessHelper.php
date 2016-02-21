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
 * @author    Jeff Turcotte <jeff.turcotte@gmail.com>
 * @copyright 2014 Authors
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */

/**
 * The Unless Handlebars_Helper
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @author    Dmitriy Simushev <simushevds@gmail.com>
 * @author    Jeff Turcotte <jeff.turcotte@gmail.com>
 * @copyright 2014 Authors
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   Release: @package_version@
 * @link      http://xamin.ir
 */
class Handlebars_Helper_UnlessHelper implements Handlebars_Helper
{
    /**
     * Execute the helper
     *
     * @param Handlebars_Template $template The template instance
     * @param Handlebars_Context  $context  The current context
     * @param array                $args     The arguments passed the the helper
     * @param string               $source   The source
     *
     * @return {mixed}
     */
    public function execute(Handlebars_Template $template, Handlebars_Context $context, $args, $source)
    {
        $parsedArgs = $template->parseArguments($args);
        $tmp = $context->get($parsedArgs[0]);

        $context->push($context->last());

        if (!$tmp) {
            $template->setStopToken('else');
            $buffer = $template->render($context);
            $template->setStopToken(false);
        } else {
            $template->setStopToken('else');
            $template->discard();
            $template->setStopToken(false);
            $buffer = $template->render($context);
        }

        $context->pop();

        return $buffer;
    }
}
