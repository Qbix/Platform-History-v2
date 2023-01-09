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
    /**
     * Get daystamp from a PHP timestamp
     * @method fromTimestamp
     * @static
     * @param {integer} $timestamp 
     * @return {integer}
     */
    static function fromTimestamp($timestamp)
    {
        return floor(($timestamp - self::epoch) / self::secPerDay);
    }

    /**
     * Get daystamp from a string of the form "yyyy-mm-dd"
     * or "yyyy-mm-dd hh:mm:ss"
     * @method fromDateTime
     * @static
     * @param {string} $datetime 
     * @return {integer}
     */
    static function fromDateTime(string $datetime)
    {
        return self::fromTimestamp(strtotime($datetime));
    }

    /**
     * Get daystamp from a year, month and day
     * @method fromYMD
     * @static
     * @param {integer} $year 
     * @param {integer} $month January is 1
     * @param {integer} $day
     * @return {integer}
     */
    static function fromYMD(int $y, int $m, int $d)
    {
        return self::fromDateTime(sprintf("%04d-%02d-%02d", $y, $m, $d));
    }

    /**
     * Get today's daystamp
     * @method today
     * @static
     * @return {integer}
     */
    static function today()
    {
        return self::fromTimestamp(time());
    }

    /**
     * Get PHP timestamp from a daystamp
     * @method toTimestamp
     * @static
     * @param {integer} $daystamp 
     * @return {integer}
     */
    static function toTimestamp(int $daystamp)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dti = $epoch->modify("$daystamp day");
        return $dti->getTimestamp();
    }

    /**
     * Get date-time string from a daystamp
     * @method toDateTime
     * @static
     * @param {integer} $daystamp 
     * @return {string} String of the form "yyyy-mm-dd 00:00:00"
     */
    static function toDateTime($daystamp)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dti = $epoch->modify("$daystamp day");
        return $dti->format('Y-m-d H:i:s');
    }

    /**
     * Get PHP timestamp from a daystamp
     * @method toYMD
     * @static
     * @param {integer} daystamp 
     * @return {array} [year, month, date] note that January is month 1
     */
    static function toYMD(int $daystamp)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dti = $epoch->modify("$daystamp day");
        return array(
            (int)$dti->format('Y'),
            (int)$dti->format('m') ,
            (int)$dti->format('d')
        );
    }

    /**
     * Get age, in years, of someone born on a daystamp
     * @method age
     * @static
     * @param {integer} $daystampBirth
     * @param {integer} $daystampNow
     * @return {integer}
     */
    static function age(int $daystampBirth, int $daystampNow)
    {
        $epoch = new DateTimeImmutable("0000-01-01 00:00:00");
        $dtiBirth = $epoch->modify("$daystampBirth day");
        $dtiNow = $epoch->modify("$daystampNow day");
        return (int)$dtiBirth->diff($dtiNow)->format("%y");
    }

    /**
     * The daystamp epoch as a timestamp
     * @property epoch
     * @static
     */
    public const epoch = -62167219200;

    /**
     * Number of seconds in a day
     * @property msPerDay
     * @static
     */
    public const secPerDay = 8.64e4;

}