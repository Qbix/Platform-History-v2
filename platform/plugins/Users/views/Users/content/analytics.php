<div id="content">
    <h1><?php echo $analytics["Title"]?></h1>


    <table>
        <thead>
            <tr>
                <th><?php echo $analytics["Application"]?></th>
                <?php
                foreach ($periods as $period => $value) {
                    echo '<th>'.$analytics[ucfirst($period)].'</th>';
                }
                ?>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td></td>
                <?php
                $html = array();
                foreach ($stats as $period => $stat) {
                    foreach ($stat as $st) {
                        if ($st["forType"] != "app") {
                            continue;
                        }

                        $html[$period] = Q::ifset($html, $period, 0) + 1;
                    }
                }
                foreach ($periods as $period => $value) {
                    echo '<td class="Users_analytics_stat">' . $html[$period] . '</td>';
                }
                ?>
            </tr>
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th><?php echo $analytics["Pages"]?></th>
                <?php
                foreach ($periods as $period => $value) {
                    echo '<th>'.$analytics[ucfirst($period)].'</th>';
                }
                ?>
            </tr>
        </thead>
        <tbody>
            <tr>
                <?php
                $html = array();
                foreach ($stats as $period => $stat) {
                    foreach ($stat as $st) {
                        if ($st["forType"] != "page") {
                            continue;
                        }

                        if (!is_array($html[$st["url"]])) {
                            $html[$st["url"]] = array();
                        }

						$html[$st["url"]]["name"] = Q::ifset($st, "name", $st["url"]);
                        $html[$st["url"]][$period] = Q::ifset($html, $st["url"], $period, 0) + 1;
                    }
                }
                foreach ($html as $url => $st) {
                    echo '<tr><td class="Users_analytics_url">'.$st["name"].'</td>';
                    foreach ($periods as $period => $value) {
                        echo '<td class="Users_analytics_stat">' . $st[$period] . '</td>';
                    }
                    echo '</tr>';
                }
                ?>
            </tr>
        </tbody>
    </table>

    <?php
	$html = array();
	foreach ($stats as $period => $stat) {
		foreach ($stat as $st) {
			if ($st["forType"] != "Assets/service") {
				continue;
			}

			$html[$st["name"]][$period] = Q::ifset($html, $st["name"], $period, 0) + 1;
		}
	}
	if (!empty($html)) {?>
        <table>
            <thead>
            <tr>
                <th><?php echo $analytics["Services"]?></th>
				<?php
				foreach ($periods as $period => $value) {
					echo '<th>'.$analytics[ucfirst($period)].'</th>';
				}
				?>
            </tr>
            </thead>
            <tbody>
            <tr>
				<?php
				foreach ($html as $name => $st) {
					echo '<tr><td class="Users_analytics_service">'.$name.'</td>';
					foreach ($periods as $period => $value) {
						echo '<td class="Users_analytics_stat">' . $st[$period] . '</td>';
					}
					echo '</tr>';
				}
				?>
            </tr>
            </tbody>
        </table>
    <?php }	?>
</div>
