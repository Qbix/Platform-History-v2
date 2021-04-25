<div id="content">
    <h1><?php echo $analytics["Title"]?></h1>

    <div class="Communities_tabs">
        <div class="Communities_tab Q_current" data-val="application"><?php echo $analytics["Application"]?></div>
        <div class="Communities_tab" data-val="pages"><?php echo $analytics["Pages"]?></div>
        <div class="Communities_tab" data-val="services"><?php echo $analytics["Services"]?></div>
        <div class="Communities_tab" data-val="faq"><?php echo $analytics["Faq"]?></div>
    </div>
    <div class="Communities_tabContent Q_current" data-val="application">
        <table>
            <thead>
            <tr>
                <?php
                foreach ($periods as $period => $value) {
                    echo '<th class="Users_analytics_period">'.$analytics[ucfirst($period)].'</th>';
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
                <th><?php echo $analytics['WeekDays']?></th>
				<?php
				foreach ($weekDaysStat["app"] as $weekDay => $value) {
					echo '<th class="Users_analytics_period">'.$weekDay.'</th>';
				}
				?>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td></td>
				<?php
				foreach ($weekDaysStat["app"] as $weekDay => $value) {
					echo '<td class="Users_analytics_stat">' . $value . '</td>';
				}
				?>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="Communities_tabContent" data-val="pages">
        <table class="Users_analytics_sortable">
            <thead>
            <tr>
                <th></th>
                <?php
                foreach ($periods as $period => $value) {
                    echo '<th class="Users_analytics_period">'.$analytics[ucfirst($period)].'</th>';
                }
                ?>
            </tr>
            </thead>
            <tbody>
            <?php
            $html = array();
            foreach ($stats as $period => $stat) {
                foreach ($stat as $st) {
                    if ($st["forType"] != "page") {
                        continue;
                    }

                    if (!is_array($html[$st["name"]])) {
                        $html[$st["name"]] = array();
                    }

                    $html[$st["name"]]["name"] = $st["name"];
                    $html[$st["name"]][$period] = Q::ifset($html, $st["name"], $period, 0) + 1;
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
            </tbody>
        </table>

        <table>
            <thead>
            <tr>
                <th><?php echo $analytics['WeekDays']?></th>
				<?php
				foreach ($weekDaysStat["page"] as $weekDay => $value) {
					echo '<th class="Users_analytics_period">'.$weekDay.'</th>';
				}
				?>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td></td>
				<?php
				foreach ($weekDaysStat["page"] as $weekDay => $value) {
					echo '<td class="Users_analytics_stat">' . $value . '</td>';
				}
				?>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="Communities_tabContent" data-val="services">
        <?php
        $html = array();
        foreach ($stats as $period => $stat) {
            foreach ($stat as $st) {
                if ($st["forType"] != "Assets/service") {
                    continue;
                }

                $html[$st["name"]][$period] = Q::ifset($html, $st["name"], $period, 0) + 1;
            }
        }?>
        <table class="Users_analytics_sortable">
            <thead>
            <tr>
                <th></th>
                <?php
                foreach ($periods as $period => $value) {
                    echo '<th class="Users_analytics_period">'.$analytics[ucfirst($period)].'</th>';
                }
                ?>
            </tr>
            </thead>
            <tbody>
            <?php
            foreach ($html as $name => $st) {
                echo '<tr><td class="Users_analytics_service">'.$name.'</td>';
                foreach ($periods as $period => $value) {
                    echo '<td class="Users_analytics_stat">' . $st[$period] . '</td>';
                }
                echo '</tr>';
            }
            ?>
            </tbody>
        </table>

        <table>
            <thead>
            <tr>
                <th><?php echo $analytics['WeekDays']?></th>
				<?php
				foreach ($weekDaysStat["Assets/service"] as $weekDay => $value) {
					echo '<th class="Users_analytics_period">'.$weekDay.'</th>';
				}
				?>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td></td>
				<?php
				foreach ($weekDaysStat["Assets/service"] as $weekDay => $value) {
					echo '<td class="Users_analytics_stat">' . $value . '</td>';
				}
				?>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="Communities_tabContent" data-val="faq">
		<?php
		$html = array();
		foreach ($stats as $period => $stat) {
			foreach ($stat as $st) {
				if ($st["forType"] != "faq") {
					continue;
				}

				$html[$st["name"]][$period] = Q::ifset($html, $st["name"], $period, 0) + 1;
			}
		}?>
        <table class="Users_analytics_sortable">
            <thead>
            <tr>
                <th></th>
				<?php
				foreach ($periods as $period => $value) {
					echo '<th class="Users_analytics_period">'.$analytics[ucfirst($period)].'</th>';
				}
				?>
            </tr>
            </thead>
            <tbody>
			<?php
			foreach ($html as $name => $st) {
				echo '<tr><td class="Users_analytics_faq">'.$name.'</td>';
				foreach ($periods as $period => $value) {
					echo '<td class="Users_analytics_stat">' . $st[$period] . '</td>';
				}
				echo '</tr>';
			}
			?>
            </tbody>
        </table>
    </div>

</div>
