<?php

trait Q_MetaTrait
{
    private $_methods = array();
 
    public function addMethod($method, $callable)
    {
        if (!is_callable($callable)) {
            throw new InvalidArgumentException('addMethod: Second param must be callable');
        }
        $this->_methods[$method] = Closure::bind($callable, $this, get_class());
    }
 
    public function __call($method, array $args)
    {
        if (isset($this->_methods[$method])) {
            return call_user_func_array($this->_methods[$method], $args);
        }
 
        throw Q_Exception_MethodNotSupported(compact('method'));
    }
}