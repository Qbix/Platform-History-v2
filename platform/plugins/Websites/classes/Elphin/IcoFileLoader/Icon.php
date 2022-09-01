<?php

namespace Elphin\IcoFileLoader;

/**
 * An instance of icon holds the extracted data from a .ico file
 */
class Icon implements \ArrayAccess, \Countable, \Iterator
{
    /**
     * @var IconImage[]
     */
    private $images = [];

    /**
     * @var int iterator position
     */
    private $position = 0;

    /**
     * Returns best icon image with dimensions matching w,h
     * @param $w
     * @param $h
     * @return IconImage|null
     */
    public function findBestForSize($w, $h)
    {
        $bestBitCount = 0;
        $best = null;
        foreach ($this->images as $image) {
            if ($image->width >= $w && $image->height >= $h
            && ($image->bitCount > $bestBitCount)) {
                $bestBitCount = $image->bitCount;
                $best = $image;
            }
        }
        return $best;
    }

    /**
     * Finds the highest quality image in the icon
     * @return IconImage
     */
    public function findBest()
    {
        $bestBitCount = 0;
        $bestWidth = 0;
        $best = null;
        foreach ($this->images as $image) {
            if (($image->width > $bestWidth) ||
                (($image->width == $bestWidth) && ($image->bitCount > $bestBitCount))
            ) {
                $bestWidth = $image->width;
                $bestBitCount = $image->bitCount;
                $best = $image;
            }
        }
        return $best;
    }

    /**
     * Count number of images in the icon
     * As this class implements Countable you can simply use count($icon) if you desire
     * @return int
     */
    #[\ReturnTypeWillChange]
    public function count()
    {
        return count($this->images);
    }

    /**
     * Set an icon
     * This is an implementation of ArrayAccess allowing you to do $icon[$x]=$image
     * @param integer   $offset
     * @param IconImage $value
     */
    #[\ReturnTypeWillChange]
    public function offsetSet($offset, $value)
    {
        if (!$value instanceof IconImage) {
            throw new \InvalidArgumentException('Can only add IconImage instances to an Icon');
        }
        if (is_null($offset)) {
            $this->images[] = $value;
        } else {
            $this->images[$offset] = $value;
        }
    }

    /**
     * Check if image with particular index exists
     * This is an implementation of ArrayAccess allowing you to do isset($icon[$x])
     * @param integer $offset
     * @return boolean
     */
    #[\ReturnTypeWillChange]
    public function offsetExists($offset)
    {
        return isset($this->images[$offset]);
    }

    /**
     * Remove image from icon
     * This is an implementation of ArrayAccess allowing you to do unset($icon[$x])
     * @param integer $offset
     * @return boolean
     */
    #[\ReturnTypeWillChange]
    public function offsetUnset($offset)
    {
        unset($this->images[$offset]);
    }

    /**
     * Get image from icon
     * This is an implementation of ArrayAccess allowing you to do $image = $icon[$x]
     * @param integer $offset
     * @return IconImage
     */
    #[\ReturnTypeWillChange]
    public function offsetGet($offset)
    {
        return isset($this->images[$offset]) ? $this->images[$offset] : null;
    }

    /**
     * Implements \Iterator allowing foreach($icon as $image){}
     */
    #[\ReturnTypeWillChange]
    public function rewind()
    {
        $this->position = 0;
    }

    /**
     * Implements \Iterator allowing foreach($icon as $image){}
     */
    public function current()
    {
        return $this->images[$this->position];
    }

    /**
     * Implements \Iterator allowing foreach($icon as $image){}
     */
    public function key()
    {
        return $this->position;
    }

    /**
     * Implements \Iterator allowing foreach($icon as $image){}
     */
    #[\ReturnTypeWillChange]
    public function next()
    {
        ++$this->position;
    }

    /**
     * Implements \Iterator allowing foreach($icon as $image){}
     */
    #[\ReturnTypeWillChange]
    public function valid()
    {
        return isset($this->images[$this->position]);
    }
}
