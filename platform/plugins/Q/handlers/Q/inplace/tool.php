<?php

/**
 * @module Q-tools
 */

/**
 * This tool generates an inline editor, along with a form tag.
 * @class Q inplace
 * @constructor
 * @param {array} [$options] An associative array of parameters, containing:
 *   @param {string} $options.fieldInput  Required. HTML representing a text input, textarea, or select.
 *   @param {string} $options.staticHtml  Required. The static HTML to display when the input isn't showing.
 *   @param {string} [$options.type='textarea']  The type of the input. Can be "textarea", "text" or "select"
 *   @param {string} [$options.action=""]  The uri or url to submit to
 *   @param {string} [$options.method="put"]  The method to use for submitting the form.
 *   @param {boolean} [$options.editing]  If true, then renders the inplace tool in editing mode.
 *   @param {boolean} [$options.editOnClick=true]  If true, then edit mode starts only if "Edit" button is clicked.
 *   @param {boolean} [$options.selectOnEdit=true] If true, selects all the text when entering edit mode.
 *   @param {string} [$options.placeholder] Text to show in the staticHtml or input field when the editor is empty
 *   @param {array} [$options.hidden] An associative array of additional hidden fields to submit in the form
 *   @param {integer} [$options.maxWidth] The maximum width for the Q/autogrow
 *   @param {string} [$options.beforeSave] Reference to a callback to call after a successful save. This callback can cancel the save by returning false.
 *   @param {string} [$options.onSave] Reference to a callback or event to run after a successful save.
 *   @param {string} [$options.onCancel] Reference to a callback or event to run after cancel.
 */
function Q_inplace_tool($options)
{
	$action = '';
	$method = 'put';
	$fieldInput = '';
	$staticHtml = '';
	$type = 'textarea';
	$editOnClick = true;
	$selectOnEdit = true;
	$placeholder = 'Type something...';
	extract($options);
	if (isset($inplace)) {
		extract($inplace);
	}
	if (!isset($fieldInput)) {
		throw new Q_Exception_RequiredField(array('field' => 'fieldInput'));
	}
	$staticClass = ($type === 'textarea')
		? 'Q_inplace_tool_blockstatic'
		: 'Q_inplace_tool_static';
	Q_Response::addScript('{{Q}}/js/tools/inplace.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/inplace.css', 'Q');

	$formTag = Q_Html::form("$action", $method, array('class' => 'Q_inplace_tool_form'));

	$hiddenInputs = $options['hidden'] 
		? Q_Html::hidden($options['hidden'])
		: '';

	$classes = !empty($editing) ? 'Q_editing Q_nocancel' : '';
	$options = @compact(
		'editOnClick', 'selectOnEdit', 'showEditButtons',
		'maxWidth', 'beforeSave', 'onSave', 'placeholder', 'type'
	);
	Q_Response::setToolOptions($options);
	$sh = $staticHtml
		? $staticHtml
		: '<span class="Q_placeholder">'.Q_Html::text($placeholder).'</span>';

return <<<EOT
<div class='Q_inplace_tool_container $classes Q_inplace_$type' style="position: relative;">
	<div class='Q_inplace_tool_editbuttons'>
		<button class='Q_inplace_tool_edit basic16 basic16_edit'>Edit</button>
	</div>
	<div class='$staticClass'>$sh</div>
	$formTag
		$fieldInput
		$hiddenInputs
		<div class='Q_inplace_tool_buttons'>
			<button class='Q_inplace_tool_cancel basic16 basic16_cancel'>Cancel</button>
			<button class='Q_inplace_tool_save basic16 basic16_save'>Save</button>
		</div>
	</form>
</div>

EOT;
}
