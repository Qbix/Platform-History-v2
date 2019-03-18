<?php
/**
 * This file is part of Handlebars-php
 * Base on mustache-php https://github.com/bobthecow/mustache.php
 *
 * PHP version 5.2
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @author    Chris Gray <chris.w.gray@gmail.com>
 * @author    Dmitriy Simushev <simushevds@gmail.com>
 * @author    majortom731 <majortom731@googlemail.com>
 * @author    Jeff Turcotte <jeff.turcotte@gmail.com>
 * @author    John Slegers <slegersjohn@gmail.com>
 * @copyright 2010-2012 (c) Justin Hileman
 * @copyright 2012 (c) ParsPooyesh Co
 * @copyright 2013 (c) Behrooz Shabani
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */


/**
 * Handlebars base template
 * contain some utility method to get context and helpers
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

class Handlebars_Template
{
    /**
     * @var Handlebars
     */
    protected $handlebars;

    /**
     * @var array The tokenized tree
     */
    protected $tree = array();

    /**
     * @var string The template source
     */
    protected $source = '';

    /**
     * @var array Run stack
     */
    private $_stack = array();

    /**
     * Handlebars template constructor
     *
     * @param Handlebars_Engine $engine Handlebars engine
     * @param array      $tree   Parsed tree
     * @param string     $source Handlebars source
     */
    public function __construct(Handlebars_Engine $engine, $tree, $source)
    {
        $this->handlebars = $engine;
        $this->tree = $tree;
        $this->source = $source;
        array_push($this->_stack, array(0, $this->getTree(), false));
    }

    /**
     * Get current tree
     *
     * @return {array}
     */
    public function getTree()
    {
        return $this->tree;
    }

    /**
     * Get current source
     *
     * @return {string}
     */
    public function getSource()
    {
        return $this->source;
    }

    /**
     * Get current engine associated with this object
     *
     * @return {Handlebars_Engine}
     */
    public function getEngine()
    {
        return $this->handlebars;
    }

    /**
     * set stop token for render and discard method
     *
     * @param string $token token to set as stop token or false to remove
     *
     * @return {void}
     */

    public function setStopToken($token)
    {
        $topStack = array_pop($this->_stack);
        $topStack[2] = $token;
        array_push($this->_stack, $topStack);
    }

    /**
     * get current stop token
     *
     * @return {string|bool}
     */

    public function getStopToken()
    {
        $topStack = end($this->_stack);

        return $topStack[2];
    }

    /**
     * Get the current token's tree
     *
     * @return {array}
     */
    public function getCurrentTokenTree()
    {
        $topStack = end($this->_stack);

        return $topStack[1];
    }

    /**
     * Render top tree
     *
     * @param mixed $context current context
     *
     * @throws {InvalidArgumentException}
     * @return {string}
     */
    public function render($context)
    {
        if (!$context instanceof Handlebars_Context) {
            $context = new Handlebars_Context($context);
        }
        $topTree = end($this->_stack); // never pop a value from stack
        list($index, $tree, $stop) = $topTree;

        $buffer = '';
        $rTrim = false;
        while (array_key_exists($index, $tree)) {
            $current = $tree[$index];
            $index++;
            //if the section is exactly like waitFor
            if (is_string($stop)
                && $current[Handlebars_Tokenizer::TYPE] == Handlebars_Tokenizer::T_ESCAPED
                && $current[Handlebars_Tokenizer::NAME] === $stop
            ) {
                break;
            }
            if (isset($current[Handlebars_Tokenizer::TRIM_LEFT]) && $current[Handlebars_Tokenizer::TRIM_LEFT]) {
                $buffer = rtrim($buffer);
            }

            $tmp = $this->_renderInternal($current, $context);

            if (isset($current[Handlebars_Tokenizer::TRIM_LEFT]) && $current[Handlebars_Tokenizer::TRIM_LEFT]) {
                $tmp = rtrim($tmp);
            }

            if ($rTrim  || (isset($current[Handlebars_Tokenizer::TRIM_RIGHT]) && $current[Handlebars_Tokenizer::TRIM_RIGHT])) {
                $tmp = ltrim($tmp);
            }

            $buffer .= $tmp;
            // Some time, there is more than one string token (first is empty),
            //so we need to trim all of them in one shot

            $rTrim = (empty($tmp) && $rTrim) ||
                isset($current[Handlebars_Tokenizer::TRIM_RIGHT]) && $current[Handlebars_Tokenizer::TRIM_RIGHT];
        }
        if ($stop) {
            //Ok break here, the helper should be aware of this.
            $newStack = array_pop($this->_stack);
            $newStack[0] = $index;
            $newStack[2] = false; //No stop token from now on
            array_push($this->_stack, $newStack);
        }

        return $buffer;
    }

    /**
     * Render tokens base on type of tokens
     *
     * @param array $current current token
     * @param mixed $context current context
     *
     * @return {string}
     */
    private function _renderInternal($current, $context)
    {
        $result = '';
        switch ($current[Handlebars_Tokenizer::TYPE]) {
        case Handlebars_Tokenizer::T_END_SECTION:
            break; // Its here just for handling whitespace trim.
        case Handlebars_Tokenizer::T_SECTION :
            $newStack = isset($current[Handlebars_Tokenizer::NODES])
                ? $current[Handlebars_Tokenizer::NODES] : array();
            array_push($this->_stack, array(0, $newStack, false));
            $result = $this->_section($context, $current);
            array_pop($this->_stack);
            break;
        case Handlebars_Tokenizer::T_INVERTED :
            $newStack = isset($current[Handlebars_Tokenizer::NODES]) ?
                $current[Handlebars_Tokenizer::NODES] : array();
            array_push($this->_stack, array(0, $newStack, false));
            $result = $this->_inverted($context, $current);
            array_pop($this->_stack);
            break;
        case Handlebars_Tokenizer::T_COMMENT :
            $result = '';
            break;
        case Handlebars_Tokenizer::T_PARTIAL:
        case Handlebars_Tokenizer::T_PARTIAL_2:
            $result = $this->_partial($context, $current);
            break;
        case Handlebars_Tokenizer::T_UNESCAPED:
        case Handlebars_Tokenizer::T_UNESCAPED_2:
            $result = $this->_get($context, $current, false);
            break;
        case Handlebars_Tokenizer::T_ESCAPED:
            $result = $this->_get($context, $current, true);
            break;
        case Handlebars_Tokenizer::T_TEXT:
            $result = $current[Handlebars_Tokenizer::VALUE];
            break;
            /* How we could have another type of token? this part of code
            is not used at all.
            default:
                throw new RuntimeException(
                    'Invalid node type : ' . json_encode($current)
                );
            */
        }

        return $result;
    }

    /**
     * Discard top tree
     *
     * @return {string}
     */
    public function discard()
    {
        $topTree = end($this->_stack); //This method never pop a value from stack
        list($index, $tree, $stop) = $topTree;
        while (array_key_exists($index, $tree)) {
            $current = $tree[$index];
            $index++;
            //if the section is exactly like waitFor
            if (is_string($stop)
                && $current[Handlebars_Tokenizer::TYPE] == Handlebars_Tokenizer::T_ESCAPED
                && $current[Handlebars_Tokenizer::NAME] === $stop
            ) {
                break;
            }
        }
        if ($stop) {
            //Ok break here, the helper should be aware of this.
            $newStack = array_pop($this->_stack);
            $newStack[0] = $index;
            $newStack[2] = false;
            array_push($this->_stack, $newStack);
        }

        return '';
    }

    /**
     * Rewind top tree index to the first element
     *
     * @return {void}
     */
    public function rewind()
    {
        $topStack = array_pop($this->_stack);
        $topStack[0] = 0;
        array_push($this->_stack, $topStack);
    }

    /**
     * Process handlebars section style
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @return {mixed|string}
     */
    private function _handlebarsStyleSection(Handlebars_Context $context, $current)
    {
        $helpers = $this->handlebars->getHelpers();
        $sectionName = $current[Handlebars_Tokenizer::NAME];
        if (isset($current[Handlebars_Tokenizer::END])) {
            $source = substr(
                $this->getSource(),
                $current[Handlebars_Tokenizer::INDEX],
                $current[Handlebars_Tokenizer::END] - $current[Handlebars_Tokenizer::INDEX]
            );
        } else {
            $source = '';
        }
        // subexpression parsing loop
        $subexprs = array(); // will contain all subexpressions inside outermost brackets
        $insideOf = array( 'single' => false, 'double' => false );
        $lvl = 0;
        $cur_start = 0;
        for ($i=0; $i < strlen($current[Handlebars_Tokenizer::ARGS]); $i++) {
            $cur = substr($current[Handlebars_Tokenizer::ARGS], $i, 1);
            if ($cur == "'" ) {
                $insideOf['single'] = ! $insideOf['single'];
            }
            if ($cur == '"' ) {
                $insideOf['double'] = ! $insideOf['double'];
            }
            if ($cur == '(' && ! $insideOf['single'] && ! $insideOf['double']) {
                if ($lvl == 0) {
                    $cur_start = $i+1;
                }
                $lvl++;
                continue;
            }
            if ($cur == ')' && ! $insideOf['single'] && ! $insideOf['double']) {
                $lvl--;
                if ($lvl == 0) {
                    $subexprs[] = substr($current[Handlebars_Tokenizer::ARGS], $cur_start, $i - $cur_start);
                }
            }
        }
        if (! empty($subexprs)) {
            foreach ($subexprs as $expr) {
                $cmd = explode(" ", $expr);
                $name = trim($cmd[0]);
                // construct artificial section node
                $section_node = array(
                    Handlebars_Tokenizer::TYPE => Handlebars_Tokenizer::T_ESCAPED,
                    Handlebars_Tokenizer::NAME => $name,
                    Handlebars_Tokenizer::OTAG => $current[Handlebars_Tokenizer::OTAG],
                    Handlebars_Tokenizer::CTAG => $current[Handlebars_Tokenizer::CTAG],
                    Handlebars_Tokenizer::INDEX => $current[Handlebars_Tokenizer::INDEX],
                    Handlebars_Tokenizer::ARGS => implode(" ", array_slice($cmd, 1))
                );
                // resolve the node recursively
                $resolved = addcslashes($this->_handlebarsStyleSection($context, $section_node), '"');
                // replace original subexpression with result
                $current[Handlebars_Tokenizer::ARGS] = str_replace('('.$expr.')', '"' . $resolved . '"', $current[Handlebars_Tokenizer::ARGS]);
            }
        }
        $return = $helpers->call($sectionName, $this, $context, $current[Handlebars_Tokenizer::ARGS], $source);
        if ($return instanceof StringWrapper) {
            return $this->handlebars->loadString($return)->render($context);
        } else {
            return $return;
        }
    }

    /**
     * Process Mustache section style
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @throws {RuntimeException}
     * @return {mixed|string}
     */
    private function _mustacheStyleSection(Handlebars_Context $context, $current)
    {
        $sectionName = $current[Handlebars_Tokenizer::NAME];

        // fallback to mustache style each/with/for just if there is
        // no argument at all.
        try {
            $sectionVar = $context->get($sectionName, true);
        } catch (InvalidArgumentException $e) {
            throw new RuntimeException(
                $sectionName . ' is not registered as a helper'
            );
        }
        $buffer = '';
        if (is_array($sectionVar) || $sectionVar instanceof Traversable) {
            $isList = is_array($sectionVar) &&
                (array_keys($sectionVar) === range(0, count($sectionVar) - 1));
            $index = 0;
            $lastIndex = $isList ? (count($sectionVar) - 1) : false;

            foreach ($sectionVar as $key => $d) {
                $specialVariables = array(
                    '@index' => $index,
                    '@first' => ($index === 0),
                    '@last' => ($index === $lastIndex),
                );
                if (!$isList) {
                    $specialVariables['@key'] = $key;
                }
                $context->pushSpecialVariables($specialVariables);
                $context->push($d);
                $buffer .= $this->render($context);
                $context->pop();
                $context->popSpecialVariables();
                $index++;
            }
        } elseif (is_object($sectionVar)) {
            //Act like with
            $context->push($sectionVar);
            $buffer = $this->render($context);
            $context->pop();
        } elseif ($sectionVar) {
            $buffer = $this->render($context);
        }

        return $buffer;
    }

    /**
     * Process section nodes
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @throws {RuntimeException}
     * @return {string} the result
     */
    private function _section(Handlebars_Context $context, $current)
    {
        $helpers = $this->handlebars->getHelpers();
        $sectionName = $current[Handlebars_Tokenizer::NAME];
        if ($helpers->has($sectionName)) {
            return $this->_handlebarsStyleSection($context, $current);
        } elseif (trim($current[Handlebars_Tokenizer::ARGS]) == '') {
            return $this->_mustacheStyleSection($context, $current);
        } else {
            throw new RuntimeException(
                $sectionName . ' is not registered as a helper'
            );
        }
    }

    /**
     * Process inverted section
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @return {string} the result
     */
    private function _inverted(Handlebars_Context $context, $current)
    {
        $sectionName = $current[Handlebars_Tokenizer::NAME];
        $data = $context->get($sectionName);
        if (!$data) {
            return $this->render($context);
        } else {
            //No need to discard here, since it has no else
            return '';
        }
    }

    /**
     * Process partial section
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @return {string} the result
     */
    private function _partial(Handlebars_Context $context, $current)
    {
        $partial = $this->handlebars->loadPartial($current[Handlebars_Tokenizer::NAME]);

        if ($current[Handlebars_Tokenizer::ARGS]) {
            $context = $context->get($current[Handlebars_Tokenizer::ARGS]);
        }

        return $partial->render($context);
    }


    /**
     * Check if there is a helper with this variable name available or not.
     *
     * @param array $current current token
     *
     * @return {boolean}
     */
    private function _isSection($current)
    {
        $helpers = $this->getEngine()->getHelpers();
        // Handlebars_Tokenizer doesn't process the args -if any- so be aware of that
        $name = explode(' ', $current[Handlebars_Tokenizer::NAME], 2);

        return $helpers->has(reset($name));
    }

    /**
     * get replacing value of a tag
     *
     * will process the tag as section, if a helper with the same name could be
     * found, so {{helper arg}} can be used instead of {{#helper arg}}.
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     * @param boolean $escaped escape result or not
     *
     * @return {string} the string to be replaced with the tag
     */
    private function _get(Handlebars_Context $context, $current, $escaped)
    {
        if ($this->_isSection($current)) {
            return $this->_getSection($context, $current, $escaped);
        } else {
            return $this->_getVariable($context, $current, $escaped);
        }
    }

    /**
     * Process section
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     * @param boolean $escaped escape result or not
     *
     * @return {string} the result
     */
    private function _getSection(Handlebars_Context $context, $current, $escaped)
    {
        $args = explode(' ', $current[Handlebars_Tokenizer::NAME], 2);
        $name = array_shift($args);
        $current[Handlebars_Tokenizer::NAME] = $name;
        $current[Handlebars_Tokenizer::ARGS] = implode(' ', $args);
        $result = $this->_section($context, $current);

        if ($escaped && !($result instanceof Handlebars_SafeString)) {
            $escape_args = $this->handlebars->getEscapeArgs();
            array_unshift($escape_args, $result);
            $result = call_user_func_array(
                $this->handlebars->getEscape(),
                array_values($escape_args)
            );
        }

        return $result;
    }

    /**
     * Process variable
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     * @param boolean $escaped escape result or not
     *
     * @return {string} the result
     */
    private function _getVariable(Handlebars_Context $context, $current, $escaped)
    {
        $name = $current[Handlebars_Tokenizer::NAME];
        $value = $context->get($name);
        if (is_array($value)) {
            return 'Array';
        }
        if ($escaped) {
            $args = $this->handlebars->getEscapeArgs();
            array_unshift($args, $value);
            $value = call_user_func_array(
                $this->handlebars->getEscape(),
                array_values($args)
            );
        }

        return $value;
    }

    /**
     * Break an argument string into an array of named arguments
     *
     * @param string $string Argument Handlebars_String as passed to a helper
     *
     * @return {string} the argument list as an array
     */
    public function parseNamedArguments($string)
    {
        if ($string instanceof Handlebars_Arguments) {
            // This code is needed only for backward compatibility
            $args = $string;
        } else {
            $args = new Handlebars_Arguments($string);
        }

        return $args->getNamedArguments();
    }

    /**
     * Break an argument string into an array of strings
     *
     * @param string $string Argument Handlebars_String as passed to a helper
     *
     * @throws {InvalidArgumentException}
     * @return {array} the argument list as an array
     */
    public function parseArguments($string)
    {
        if ($string instanceof Handlebars_Arguments) {
            // This code is needed only for backward compatibility
            $args = $string;
        } else {
            $args = new Handlebars_Arguments($string);
        }

        return $args->getPositionalArguments();
    }
}
