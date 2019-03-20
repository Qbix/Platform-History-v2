<table>
	<tr>
		<th>Ordinal</th><th>Filter</th><th>Deliver</th><th>Ready</th><th></th><th></th>
	</tr>
	<?php foreach ($rules as $rule): ?>
	<tr>
		<td><?php echo $rule->ordinal ?></td>
		<td><?php echo $rule->filter ?></td>
		<td><?php echo $rule->deliver ?></td>
		<td><?php echo $rule->readyTime ?></td>
		<td><?php echo Q_Html::a(Q_Request::url(array('rules' => true, 'ordinal' => $rule->ordinal)), array(), 'edit') ?></td>
		<td><?php echo Q_Html::a(Q_Request::url(array('rules' => true, 'ordinal' => $rule->ordinal, 'delete' => true)), array(), 'delete') ?></td>
	</tr>
	<?php endforeach ?>
</table>
