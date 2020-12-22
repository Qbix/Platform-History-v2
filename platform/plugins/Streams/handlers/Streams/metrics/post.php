<?php
function Streams_metrics_post() {
	$user = Users::loggedInUser();

	// don't save stats for non logged user
	if (!$user) {
		return;
	}

	$required = array("publisherId" => null, "streamName" => null, "metrics" => null, "minPeriod" => null);
	Q_Valid::requireFields(array_keys($required), $_REQUEST, true);

	$request = Q::take($_REQUEST, $required);

	foreach (array_keys($required) as $field) {
		if(empty($request[$field])) {
			throw new Q_Exception_WrongValue(array('field' => $field, 'range' => "not empty"));
		}
	}

	$minPeriod = $request["minPeriod"];

	$row = new Streams_Metrics();
	$row->userId = $user->id;
	$row->publisherId = $request["publisherId"];
	$row->streamName = $request["streamName"];
	if (!$row->retrieve()) {
		$row->save();
		$row->metrics = null;
	}

	if (empty($row->metrics)) {
		$row->metrics = Q::json_encode($request["metrics"]);
	} else {
		$metrics = Q::json_decode($row->metrics, true);

		foreach ($request["metrics"] as $reqMetric) {
			if (sizeof($reqMetric) == 1) {
				continue;
			}

			$reqStart = (float)$reqMetric[0];
			$reqEnd = (float)$reqMetric[1];
			$used = false;

			foreach ($metrics as $i => $rowMetric) {
				$rowStart = (float)$rowMetric[0];
				$rowEnd = (float)$rowMetric[1];

				// this period already stored
				if ($reqStart >= $rowStart - $minPeriod && $reqEnd <= $rowEnd + $minPeriod) {
					if ($reqStart < $rowStart) {
						$metrics[$i][0] = $reqStart;
					}
					if ($reqEnd > $rowEnd) {
						$metrics[$i][1] = $reqEnd;
					}
					$used = true;
				}
				// this period completely overlaps stored period, so just replace
				elseif ($reqStart < $rowStart && $reqEnd > $rowEnd) {
					$metrics[$i] = $reqMetric;
					$used = true;
				}
				// this period overlaps stored period before start, so change start of period
				elseif ($reqStart < $rowStart - $minPeriod && $rowStart - $minPeriod < $reqEnd && $reqEnd <= $rowEnd + $minPeriod) {
					$metrics[$i][0] = $reqStart;
					$used = true;
				}
				// this period overlaps stored period from end, so change end of period
				elseif ($reqStart >= $rowStart - $minPeriod && $reqStart < $rowEnd + $minPeriod && $reqEnd > $rowEnd + $minPeriod) {
					$metrics[$i][1] = $reqEnd;
					$used = true;
				}
			}

			// this is new period
			if (!$used) {
				$metrics[] = $reqMetric;
			}
		}

		$row->metrics = Q::json_encode($metrics);
	}

	$row->save();
}