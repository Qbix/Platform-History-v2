<?php

function Assets_purchases_response_content()
{
    $roles = Users::roles();
    if (empty($roles['Users/admins'])) {
        throw new Users_Exception_NotAuthorized();
    }

    $destAddress = Q_Config::expect(
        'Assets', 'NFT', 'sales', 'manual', 'address'
    );

    $file = fopen(APP_FILES_DIR . DS . "Assets" . DS . "purchases.csv", "r");
    $data = fgetcsv($file);
    $txIndex = $fromIndex = $toIndex = $timestampIndex = null;
    foreach ($data as $i => $v) {
        if ($v === 'Txhash') {
            $txIndex = $i;
        } else if ($v === 'From') {
            $fromIndex = $i;
        } else if ($v === 'To') {
            $toIndex = $i;
        } else if ($v === 'UnixTimestamp') {
            $timestampIndex = $i;
        }
    }

    Q_Response::addScript('js/pages/purchases.js');

    $db = Assets_Purchase::db();
    $rows = Assets_Purchase::select()->fetchDbRows();
    $purchases = array();
    foreach ($rows as $p) {
        $timestamp = $db->fromDateTime($p->insertedTime);
        $purchases[$timestamp] = $p;
    }

    $result = "<h1>Purchases</h1>";
    $result .= <<<EOT
    <form action="" method="post" enctype="multipart/form-data">
        Upload a <a style="text-decoration: underline" href="https://etherscan.io/exportData?type=address&a=0x3459e62df2da4c22b0957ce04c1b6520e4fb8f85">newer CSV file from etherscan</a>
        <input type="file" name="csvfile" id="csvfile">
        <input type="submit" value="Upload" name="submit">
    </form>
EOT;
    $result .= "<button class='Q_button Assets_highlightWallet'>Highlight a wallet</button>";
    $result .= "<table class='Assets_purchases'>";
    
    $index = 1;
    $p1 = $s1 = null;
    while ($data) {
        if (++$index > 10000) {
            break;
        }
        $data = fgetcsv($file);
        if (!$data) {
            break;
        }
        $txHash = $data[$txIndex];
        $from = strtolower($data[$fromIndex]);
        $to = strtolower($data[$toIndex]);
        $timestamp = $data[$timestampIndex];
        $tz = 'America/New_York';
        $dt = new DateTime("now", new DateTimeZone($tz));
        $dt->setTimestamp($timestamp);
        $nycTime = $dt->format('Y-m-d h:i:s a');
        $candidate = null;
        $i = 0;
        foreach ($purchases as $t => $p) {
            ++$i;
            if ($t <= $timestamp
            and strtolower($p->buyer) === $from
            and $destAddress ===  $to) {
                $candidate = $p;
            }
            if ($p->txHash === $txHash
            and $destAddress === $to) {
                $candidate = $p;
            }
            if (!$p1 and $p) {
                $p1 = $p;
            }
        }
        if (!$candidate) {
            $candidate = $p1; // at least choose some candidate for minting
        }
        $stream = Streams::fetchOne($candidate->publisherId, $candidate->publisherId, $candidate->streamName);
        if (!$stream) {
            $stream = $s1; // at least choose some stream for minting
        }
        $parts = explode('/', $stream->name);
        $lastPart = end($parts);
        $uri = Q_Uri::from(array(
            'module' => 'Assets',
            'action' => 'NFT',
            'publisherId' => $stream->publisherId,
            'lastPart' => $lastPart
        ))->toUrl();
        $img = Q_Html::img($stream->iconUrl('300x.png'), $stream->title);
        $link = Q_Html::a("$uri?mintTo=".$candidate->buyer, array(
            "target" => "_blank"
        ), $img);
        $result .= "<tr>";
        $result .= "<td>$link</td><td>{$stream->title}</td><td>$from</td><td>$nycTime</td>";
        $result .= "</tr>";
    }
    $result .= "</table>";
    return $result;
}