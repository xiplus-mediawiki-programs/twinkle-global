QUnit.module('MorebitsGlobal.string');
QUnit.test('escapeRegExp', assert => {
	assert.strictEqual(MorebitsGlobal.string.escapeRegExp('Four score and seven years ago'), 'Four[_ ]score[_ ]and[_ ]seven[_ ]years[_ ]ago', 'Spaces');
	assert.strictEqual(MorebitsGlobal.string.escapeRegExp('Four_score_and_seven_years_ago'), 'Four[_ ]score[_ ]and[_ ]seven[_ ]years[_ ]ago', 'Underscores');
});
QUnit.test('formatReasonForLog', assert => {
	var reason = 'They were wrong';
	assert.strictEqual(MorebitsGlobal.string.formatReasonForLog(reason), reason, 'Simple, unchanged');
	var more = 'Really wrong';
	assert.strictEqual(MorebitsGlobal.string.formatReasonForLog(reason + '\n' + more), reason + '{{pb}}' + more, '\n -> {{pb}}');
	assert.strictEqual(MorebitsGlobal.string.formatReasonForLog('#' + reason + '\n' + more), '##' + reason + '{{pb}}' + more, 'Prepend extra #');
	assert.strictEqual(MorebitsGlobal.string.formatReasonForLog('*' + reason + '\n' + more), '#*' + reason + '{{pb}}' + more, 'Prepend extra #');
});
QUnit.test('formatReasonText', assert => {
	var reason = 'They were correct';
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(reason), reason, 'Simple, unchanged');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(reason, true), reason + ' ~~~~', 'Simple');
	var more = 'Technically correct';
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(reason + '|' + more ), reason + '{{subst:!}}' + more, 'Replace pipe');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(reason + '|' + more, true), reason + '{{subst:!}}' + more + ' ~~~~', 'Replace pipe');
	reason += 'The <nowiki>{{best|kind|of}}</nowiki> correct: ';
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(reason + more ), reason + more, 'No replace in nowiki');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(), '', 'Empty');
	var alreadySigned = 'already signed ~~~~';
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(alreadySigned, true), alreadySigned, 'No sig duplication');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText('alreadySigned~~~~  ', true), 'alreadySigned~~~~', 'trims and avoids duplicating sig');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText('Wow', true), 'Wow ~~~~', '3-letter reason');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText('', true), '~~~~', 'Empty');
	assert.strictEqual(MorebitsGlobal.string.formatReasonText(undefined, true), '~~~~', 'Undefined');
});
QUnit.test('isInfinity', assert => {
	assert.true(MorebitsGlobal.string.isInfinity('infinity'), 'Infinity');
	assert.true(MorebitsGlobal.string.isInfinity('indefinite'), 'Indefinite');
	assert.true(MorebitsGlobal.string.isInfinity('never'), 'Never');
	assert.true(MorebitsGlobal.string.isInfinity('infinite'), 'Infinite');
	assert.false(MorebitsGlobal.string.isInfinity('always'), 'Always');
	assert.false(MorebitsGlobal.string.isInfinity('2 weeks'), 'Relative date');
	assert.false(MorebitsGlobal.string.isInfinity('2020-04-17T09:31:00.000Z'), 'ISO string');
});
QUnit.test('safeReplace', assert => {
	var string = '{{subst:board|thread=$SECTION|but=$NOTTHIS}} ~~~~';
	assert.strictEqual(MorebitsGlobal.string.safeReplace(string, '$SECTIONAL', 'thread$'), string, 'No replacement');
	assert.strictEqual(MorebitsGlobal.string.safeReplace(string, '$SECTION', 'thread$'), '{{subst:board|thread=thread$|but=$NOTTHIS}} ~~~~', 'Replacement');
});
QUnit.test('splitWeightedByKeys', assert => {
	var split = ['{{thisis|one|template}}', '{{another|one}}', '[[heresalink]]', '[[thislink|ispiped]]'];
	var text = split.join(' also ');
	assert.deepEqual(MorebitsGlobal.string.splitWeightedByKeys(text, '{{', '}}'), split.slice(0, 2), 'Templates');
	assert.deepEqual(MorebitsGlobal.string.splitWeightedByKeys(text, '[[', ']]'), split.slice(2), 'Links');
	assert.deepEqual(MorebitsGlobal.string.splitWeightedByKeys(text, '{{', '}}', split[0]), [split[1]], 'Skiplist, non-array');
	assert.deepEqual(MorebitsGlobal.string.splitWeightedByKeys(text, '[[', ']]', split[2]), [split[3]], 'Skiplist, array');
	assert.deepEqual(MorebitsGlobal.string.splitWeightedByKeys(text, '[[', ']]', split.slice(2)), [], 'Skiplist, multi-array');
	assert.throws(() => MorebitsGlobal.string.splitWeightedByKeys (text, '{{', '}'), 'throws: not same length');
	assert.throws(() => MorebitsGlobal.string.splitWeightedByKeys(text, '[[', ']]', {}), 'throws: skiplist not string or array');
});
QUnit.test('toLowerCaseFirstChar', assert => {
	assert.strictEqual(MorebitsGlobal.string.toLowerCaseFirstChar('River tam'), 'river tam', 'Lower first');
});
QUnit.test('toUpperCaseFirstChar', assert => {
	assert.strictEqual(MorebitsGlobal.string.toUpperCaseFirstChar('river Song'), 'River Song', 'Upperfirst');
});
