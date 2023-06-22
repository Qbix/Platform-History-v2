<?php if ($method=="return") {?>
    <h1><?=$connectedAccount['Success'] ?></h1>
    <p><?=$connectedAccount['YourAccountCreated'] ?></p>
<?php } else { ?>
    <p><?=$connectedAccount['YourAccountAlreadyCreated'] ?></p>
<?php } ?>