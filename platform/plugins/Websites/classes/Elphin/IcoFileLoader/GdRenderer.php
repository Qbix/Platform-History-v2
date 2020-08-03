<?php

namespace Elphin\IcoFileLoader;

/**
 * GdRenderer renders an IconImage to a gd resource
 *
 * @package Elphin\IcoFileLoader
 */
class GdRenderer implements RendererInterface
{
    public function render(IconImage $img, array $opts = null)
    {
        $opts = $this->initOptions($img, $opts);

        if ($img->isPng()) {
            $gd = $this->renderPngImage($img, $opts['background']);
        } else {
            $gd = $this->renderBmpImage($img, $opts['background']);
        }

        if ((imagesx($gd) != $opts['w']) && (imagesy($gd) != $opts['h'])) {
            $gd = $this->resize($gd, $opts['w'], $opts['h']);
        }

        return $gd;
    }

    protected function initOptions(IconImage $img, $opts)
    {
        $opts = is_array($opts) ? $opts : [];
        $opts['w'] = isset($opts['w']) ? $opts['w'] : $img->width;
        $opts['h'] = isset($opts['h']) ? $opts['h'] : $img->height;
        $opts['background'] = isset($opts['background']) ? $opts['background'] : null;
        return $opts;
    }

    protected function resize($gd, $w, $h)
    {
        //TODO - imagescale not available in hhvm it seems
        $resized = imagescale($gd, $w, $h, IMG_BICUBIC_FIXED);
        imagedestroy($gd);
        return $resized;
    }

    protected function renderPngImage(IconImage $img, $hexBackgroundColor)
    {
        $im = imagecreatefromstring($img->pngData);
        imagesavealpha($im, true);

        if (!is_null($hexBackgroundColor)) {
            $w = $img->width;
            $h = $img->height;

            $gd = imagecreatetruecolor($w, $h);
            $col = $this->parseHexColor($hexBackgroundColor);
            $colVal = $this->allocateColor($gd, $col[0], $col[1], $col[2]);
            imagefilledrectangle($gd, 0, 0, $w, $h, $colVal);
            imagecopy($gd, $im, 0, 0, 0, 0, $w, $h);
            imagedestroy($im);
            $im = $gd;
        }
        return $im;
    }

    protected function renderBmpImage(IconImage $img, $hexBackgroundColor = null)
    {
        // create image filled with desired background color
        $w = $img->width;
        $h = $img->height;
        $gd = imagecreatetruecolor($w, $h);

        if (is_null($hexBackgroundColor)) {
            imagealphablending($gd, false);
            $colVal = $this->allocateColor($gd, 255, 255, 255, 127);
            imagefilledrectangle($gd, 0, 0, $w, $h, $colVal);
            imagesavealpha($gd, true);
        } else {
            $col = $this->parseHexColor($hexBackgroundColor);
            $colVal = $this->allocateColor($gd, $col[0], $col[1], $col[2]);
            imagefilledrectangle($gd, 0, 0, $w, $h, $colVal);
        }

        // now paint pixels based on bit count
        switch ($img->bitCount) {
            case 32:
                $this->render32bit($img, $gd);
                break;
            case 24:
                $this->render24bit($img, $gd);
                break;
            case 8:
                $this->render8bit($img, $gd);
                break;
            case 4:
                $this->render4bit($img, $gd);
                break;
            case 1:
                $this->render1bit($img, $gd);
                break;
        }

        return $gd;
    }

    /**
     * Allocate a color on $gd resource. This function prevents
     * from allocating same colors on the same palette. Instead
     * if it finds that the color is already allocated, it only
     * returns the index to that color.
     * It supports alpha channel.
     *
     * @param resource $gd    gd image resource
     * @param int      $red   Red component
     * @param int      $green Green component
     * @param int      $blue  Blue component
     * @param int      $alpha Alpha channel
     *
     * @return int Color index
     */
    private function allocateColor($gd, $red, $green, $blue, $alpha = 0)
    {
        $c = imagecolorexactalpha($gd, $red, $green, $blue, $alpha);
        if ($c >= 0) {
            return $c;
        }

        //we don't use this for calculating 32bit color values
        //@codeCoverageIgnoreStart
        return imagecolorallocatealpha($gd, $red, $green, $blue, $alpha);
        //@codeCoverageIgnoreEnd
    }

    protected function parseHexColor($hexCol)
    {
        if (preg_match('/^\#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i', $hexCol, $c)) {
            return [hexdec($c[1]), hexdec($c[2]), hexdec($c[3])];
        } else {
            throw new \InvalidArgumentException("invalid hex colour");
        }
    }

    private function render32bit(IconImage $img, $gd)
    {
        // 32 bits: 4 bytes per pixel [ B | G | R | ALPHA ].
        $offset = 0;
        $binary = $img->bmpData;

        for ($i = $img->height - 1; $i >= 0; --$i) {
            for ($j = 0; $j < $img->width; ++$j) {
                //we translate the BGRA to aRGB ourselves, which is twice as fast
                //as calling imagecolorallocatealpha
                $alpha7 = ((~ord($binary[$offset + 3])) & 0xff) >> 1;
                if ($alpha7 < 127) {
                    $col = ($alpha7 << 24) |
                        (ord($binary[$offset + 2]) << 16) |
                        (ord($binary[$offset + 1]) << 8) |
                        (ord($binary[$offset]));
                    imagesetpixel($gd, $j, $i, $col);
                }
                $offset += 4;
            }
        }
    }

    private function render24bit(IconImage $img, $gd)
    {
        // 24 bits: 3 bytes per pixel [ B | G | R ].

        $maskBits = $this->buildMaskBits($img);

        $binary = $img->bmpData;
        $offset = 0;
        $maskpos = 0;

        for ($i = $img->height - 1; $i >= 0; --$i) {
            for ($j = 0; $j < $img->width; ++$j) {
                if ($maskBits[$maskpos] == 0) {
                    //translate BGR to RGB
                    $col = (ord($binary[$offset + 2]) << 16) |
                        (ord($binary[$offset + 1]) << 8) |
                        (ord($binary[$offset]));
                    imagesetpixel($gd, $j, $i, $col);
                }
                $offset += 3;
                $maskpos++;
            }
        }
    }

    private function buildMaskBits(IconImage $img)
    {
        $width = $img->width;
        if (($width % 32) > 0) {
            $width += (32 - ($img->width % 32));
        }
        $offset = $img->width * $img->height * $img->bitCount / 8;
        $total_bytes = ($width * $img->height) / 8;
        $maskBits = '';
        $bytes = 0;
        $bytes_per_line = ($img->width / 8);
        $bytes_to_remove = (($width - $img->width) / 8);
        for ($i = 0; $i < $total_bytes; ++$i) {
            $maskBits .= str_pad(decbin(ord($img->bmpData[$offset + $i])), 8, '0', STR_PAD_LEFT);
            ++$bytes;
            if ($bytes == $bytes_per_line) {
                $i += $bytes_to_remove;
                $bytes = 0;
            }
        }
        return $maskBits;
    }

    private function render8bit(IconImage $img, $gd)
    {
        // 8 bits: 1 byte per pixel [ COLOR INDEX ].
        $palette = $this->buildPalette($img, $gd);
        $maskBits = $this->buildMaskBits($img);

        $offset = 0;
        for ($i = $img->height - 1; $i >= 0; --$i) {
            for ($j = 0; $j < $img->width; ++$j) {
                if ($maskBits[$offset] == 0) {
                    $color = ord($img->bmpData[$offset]);
                    imagesetpixel($gd, $j, $i, $palette[$color]);
                }
                ++$offset;
            }
        }
    }

    private function buildPalette(IconImage $img, $gd)
    {
        $palette = [];
        if ($img->bitCount != 24) {
            $palette = [];
            for ($i = 0; $i < $img->colorCount; ++$i) {
                $palette[$i] = $this->allocateColor(
                    $gd,
                    $img->palette[$i]['red'],
                    $img->palette[$i]['green'],
                    $img->palette[$i]['blue'],
                    round($img->palette[$i]['reserved'] / 255 * 127)
                );
            }
        }
        return $palette;
    }

    private function render4bit(IconImage $img, $gd)
    {
        //4 bits: half byte/nibble per pixel [ COLOR INDEX ].
        $palette = $this->buildPalette($img, $gd);
        $maskBits = $this->buildMaskBits($img);

        $offset = 0;
        $maskoffset = 0;
        for ($i = $img->height - 1; $i >= 0; --$i) {
            for ($j = 0; $j < $img->width; $j += 2) {
                $colorByte = ord($img->bmpData[$offset]);
                $lowNibble = $colorByte & 0x0f;
                $highNibble = ($colorByte & 0xf0) >> 4;

                if ($maskBits[$maskoffset++] == 0) {
                    imagesetpixel($gd, $j, $i, $palette[$highNibble]);
                }

                if ($maskBits[$maskoffset++] == 0) {
                    imagesetpixel($gd, $j + 1, $i, $palette[$lowNibble]);
                }
                $offset++;
            }
        }
    }

    private function render1bit(IconImage $img, $gd)
    {
        //1 bit: 1 bit per pixel (2 colors, usually black&white) [ COLOR INDEX ].
        $palette = $this->buildPalette($img, $gd);
        $maskBits = $this->buildMaskBits($img);


        $colorbits = '';
        $total = strlen($img->bmpData);
        for ($i = 0; $i < $total; ++$i) {
            $colorbits .= str_pad(decbin(ord($img->bmpData[$i])), 8, '0', STR_PAD_LEFT);
        }

        $offset = 0;
        for ($i = $img->height - 1; $i >= 0; --$i) {
            for ($j = 0; $j < $img->width; ++$j) {
                if ($maskBits[$offset] == 0) {
                    imagesetpixel($gd, $j, $i, $palette[$colorbits[$offset]]);
                }
                ++$offset;
            }
        }
    }
}
