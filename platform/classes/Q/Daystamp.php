<?php

/**
 * @module Q
 */
/**
 * Like a timestamp, but works with number of Gregorian Calendar 
 * days since fictional epoch year=0, month=0, day=1.
 * You can store daystamps and do arithmetic with them.
 * @class Q_Daystamp
 */
class Q_Daystamp
{
    static function fromTimestamp($timestamp)
    {
        return floor(($timestamp - self::epoch) / self::secPerDay);
    }

    static function fromYMD(int $y, int $m, int $d)
    {
        return self::fromDateTime(sprintf("%04d-%02d-%02d", $y, $m, $d));
    }

    static function fromDateTime(string $datetime)
    {
        return self::fromTimestamp(strtotime($datetime));
    }

    static function toTimestamp(int $daystamp)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dti = $epoch->modify("$daystamp day");
        return $dti->getTimestamp();
    }

    static function toYMD(int $daystamp)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dti = $epoch->modify("$daystamp day");
        return array(
            $dti->format('Y'), $dti->format('m') , $dti->format('d')
        );
    }

    static function toDateTime($daystamp)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dti = $epoch->modify("$daystamp day");
        return $dti->format('Y-m-d H:i:s');
    }

    public const secPerDay = 8.64e4;
    public const epoch = -62167219200;
}