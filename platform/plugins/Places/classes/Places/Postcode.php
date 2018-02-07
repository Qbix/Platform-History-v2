<?php
/**
 * @module Places
 */
/**
 * Class representing 'Postcode' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a postcode row in the Places database.
 *
 * @class Places_Postcode
 * @extends Base_Places_Postcode
 */
class Places_Postcode extends Base_Places_Postcode
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Places_Postcode} Class instance
	 */
	static function __set_state(array $array)
	{
		$result = new Places_Postcode();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
	
	
	/**
	 * Call this function to find postcodes near a certain location
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $meters The radius, in meters, around the central point of the postcode
	 * @param {double} $limit Limit on how many to return. Defaults to 100.
	 * @return {array} Returns an array of Places_Postcode objects, if any are found.
	 */
	public static function nearby($latitude, $longitude, $meters, $limit = 100)
	{
		// First, get a bounding box that's big enough to avoid false negatives
		$latGrid = $meters / (1609.34 * 69.1703234283616);
		$longGrid = abs($latGrid / cos(deg2rad($latitude)));
		
		// Now, select postcodes in a bounding box using one of the indexes
		$q = Places_Postcode::select()
		->where(array('latitude' => new Db_Range(
			$latitude - $latGrid, false, true, $latitude + $latGrid
		)));
		$condition1 = array('longitude' => new Db_Range(
			max($longitude - $longGrid, -180), false,
			false, min($longitude + $longGrid, 180)
		));
		if ($longitude + $longGrid > 180) {
			$q = $q->andWhere($condition1, array('longitude' => new Db_Range(
				-180, true, false, $longitude + $longGrid - 180 * 2
			)));
		} else if ($longitude - $longGrid < -180) {
			$q = $q->andWhere($condition1, array('longitude' => new Db_Range(
				$longitude - $longGrid + 180 * 2, false, true, 180
			)));
		} else {
			$q = $q->andWhere($condition1);
		}
		$latitude = substr($latitude, 0, 10);
		$longitude = substr($longitude, 0, 10);
		$q = $q->orderBy(
			"POW(latitude - ($latitude), 2) + POW(longitude - ($longitude), 2)"
		);
		if ($limit) {
			$q = $q->limit($limit);
		}
		return $q->fetchDbRows();
	}
	
	/**
	 * Use this to calculate the distance of a postcode's central point to some
	 * pair of geographic coordinates.
	 * @param {double} $latitude
	 * @param {double} $longitude
	 */
	function distanceTo($latitude, $longitude)
	{
		return Places::distance($this->latitude, $this->longitude, $latitude, $longitude);
	}
	
	/**
	 * Use this to calculate the distance of a postcode's central point to some lat/long pair
	 * @param {double} $lat
	 * @param {double} $long
	 */
	function distanceToPostcode($postcode)
	{
		return Places::distance($this->latitude, $this->longitude, $postcode->latitude, $postcode->longitude);
	}
};