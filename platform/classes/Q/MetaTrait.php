<?php

trait Q_MetaTrait
{
    private $_methods = array();
 
    public function addMethod($methodName, $methodCallable)
    {
        if (!is_callable($methodCallable)) {
            throw new InvalidArgumentException('Second param must be callable');
        }
        $this->_methods[$methodName] = Closure::bind($methodCallable, $this, get_class());
    }
 
    public function __call($methodName, array $args)
    {
        if (isset($this->_methods[$methodName])) {
            return call_user_func_array($this->_methods[$methodName], $args);
        }
 
        throw RunTimeException('There is no method with the given name to call');
    }
}