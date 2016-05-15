<?php
/**
 * This file is part of Handlebars-php
 * Base on mustache-php https://github.com/bobthecow/mustache.php
 * re-write to use with handlebars
 *
 * PHP version 5.2
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @copyright 2010-2012 (c) Justin Hileman
 * @copyright 2012 (c) ParsPooyesh Co
 * @copyright 2013 (c) Behrooz Shabani
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */


/**
 * Handlebars parser (based on mustache)
 *
 * This class is responsible for turning raw template source into a set of
 * Handlebars tokens.
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @copyright 2010-2012 (c) Justin Hileman
 * @copyright 2012 (c) ParsPooyesh Co
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   Release: @package_version@
 * @link      http://xamin.ir
 */

class Handlebars_Parser
{
    /**
     * Process array of tokens and convert them into parse tree
     *
     * @param array $tokens Set of
     *
     * @return {array} Token parse tree
     */
    public function parse(array $tokens = array())
    {
        return $this->_buildTree(new ArrayIterator($tokens));
    }

    /**
     * Handlebars_Helper method for recursively building a parse tree.
     * Trim right and trim left is a bit tricky here.
     * {{#begin~}}{{TOKEN}}, TOKEN.. {{LAST}}{{~/begin}} is translated to:
     * {{#begin}}{{~TOKEN}}, TOKEN.. {{LAST~}}{{/begin}}
     *
     * @param ArrayIterator $tokens Stream of tokens
     *
     * @throws {RuntimeException} when nesting errors or mismatched section tags
     * are encountered.
     * @return {array} Token parse tree
     *
     */
    private function _buildTree(ArrayIterator $tokens)
    {
        $stack = array();

        do {
            $token = $tokens->current();
            $tokens->next();

            if ($token !== null) {
                switch ($token[Handlebars_Tokenizer::TYPE]) {
                case Handlebars_Tokenizer::T_END_SECTION:
                    $newNodes = array($token);
                    do {
                        $result = array_pop($stack);
                        if ($result === null) {
                            throw new RuntimeException(
                                'Unexpected closing tag: /' . $token[Handlebars_Tokenizer::NAME]
                            );
                        }

                        if (!array_key_exists(Handlebars_Tokenizer::NODES, $result)
                            && isset($result[Handlebars_Tokenizer::NAME])
                            && $result[Handlebars_Tokenizer::NAME] == $token[Handlebars_Tokenizer::NAME]
                        ) {
                            if (isset($result[Handlebars_Tokenizer::TRIM_RIGHT]) && $result[Handlebars_Tokenizer::TRIM_RIGHT]) {
                                // If the start node has trim right, then its equal with the first item in the loop with
                                // Trim left
                                $newNodes[0][Handlebars_Tokenizer::TRIM_LEFT] = true;
                            }

                            if (isset($token[Handlebars_Tokenizer::TRIM_RIGHT]) && $token[Handlebars_Tokenizer::TRIM_RIGHT]) {
                                //OK, if we have trim right here, we should pass it to the upper level.
                                $result[Handlebars_Tokenizer::TRIM_RIGHT] = true;
                            }

                            $result[Handlebars_Tokenizer::NODES] = $newNodes;
                            $result[Handlebars_Tokenizer::END] = $token[Handlebars_Tokenizer::INDEX];
                            array_push($stack, $result);
                            break;
                        } else {
                            array_unshift($newNodes, $result);
                        }
                    } while (true);
                    break;
                default:
                    array_push($stack, $token);
                }
            }

        } while ($tokens->valid());

        return $stack;
    }

}
