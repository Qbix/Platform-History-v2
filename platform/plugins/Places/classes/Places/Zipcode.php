<?php
/**
 * @module Places
 */
/**
 * Class representing 'Zipcode' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a zipcode row in the Places database.
 *
 * @class Places_Zipcode
 * @extends Base_Places_Zipcode
 */
class Places_Zipcode extends Base_Places_Zipcode
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
	 * @return {Places_Zipcode} Class instance
	 */
	static function __set_state(array $array)
	{
		$result = new Places_Zipcode();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
	
	
	/**
	 * Call this function to find zipcodes near a certain location
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $meters The radius, in meters, around the central point of the zipcode
	 * @param {double} $limit Limit on how many to return. Defaults to 100.
	 * @return {array} Returns an array of Places_Zipcode objects, if any are found.
	 */
	public static function nearby($latitude, $longitude, $meters, $limit = 100)
	{
		// First, get a bounding box that's big enough to avoid false negatives
		$latGrid = $meters / (1609.34 * 69.1703234283616);
		$longGrid = abs($latGrid / cos(deg2rad($latitude)));
		
		// Now, select zipcodes in a bounding box using one of the indexes
		$q = Places_Zipcode::select('*')->where(array(
			'latitude >' => $latitude - $latGrid,
			'latitude <' => $latitude + $latGrid
		));
		$longitudes = array(
			'longitude >' => max($longitude - $longGrid, -180),
			'longitude <' => min($longitude + $longGrid, 180),
		);
		if ($latitude + $longGrid > 180) {
			$q->andWhere($longitudes, array(
				'longitude >' => -180, // should always be the case anyway
				'longitude <' => $longitude + $longGrid - 180 * 2,
			));
		} else if ($latitude - $longGrid < -180) {
			$q->andWhere($longitudes, array(
				'longitude <=' => 180, // should always be the case anyway
				'longitude >' => $longitude - $longGrid + 180 * 2,
			));
		} else {
			$q->andWhere($longitudes);
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
	 * Use this to calculate the distance of a zipcode's central point to some
	 * pair of geographic coordinates.
	 * @param {double} $latitude
	 * @param {double} $longitude
	 */
	function distanceTo($latitude, $longitude)
	{
		return Places::distance($this->latitude, $this->longitude, $latitude, $longitude);
	}
	
	/**
	 * Use this to calculate the distance of a zipcode's central point to some lat/long pair
	 * @param {double} $lat
	 * @param {double} $long
	 */
	function distanceToZipcode($zipcode)
	{
		return Places::distance($this->latitude, $this->longitude, $zipcode->latitude, $zipcode->longitude);
	}
};