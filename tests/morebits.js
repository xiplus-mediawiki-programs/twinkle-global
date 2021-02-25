QUnit.module('constants');
QUnit.test('userIsSysop', assert => {
	assert.true(MorebitsGlobal.userIsSysop, 'Is sysop');
});
QUnit.test('pageNameNorm', assert => {
	assert.strictEqual(MorebitsGlobal.pageNameNorm, 'Macbeth, King of Scotland', 'Normalized page title');
});

QUnit.module('methods');
QUnit.test('userIsInGroup', assert => {
	assert.true(MorebitsGlobal.userIsInGroup('sysop'), 'Sysop');
	assert.true(MorebitsGlobal.userIsInGroup('interface-admin'), 'Int-Admin');
	assert.false(MorebitsGlobal.userIsInGroup('Founder'), 'Founder');
});

QUnit.test('pageNameRegex', assert => {
	assert.strictEqual(MorebitsGlobal.pageNameRegex(mw.config.get('wgPageName')), '[Mm]acbeth,[_ ]King[_ ]of[_ ]Scotland', 'First character and spaces');
	assert.strictEqual(MorebitsGlobal.pageNameRegex(''), '', 'Empty');
	assert.strictEqual(MorebitsGlobal.pageNameRegex('a'), '[Aa]', 'Single character');
	assert.strictEqual(MorebitsGlobal.pageNameRegex('#'), '#', 'Single same-case');
	assert.strictEqual(MorebitsGlobal.pageNameRegex('*$, \{}(a) |.?+-^ [ ]'), '\\*\\$,[_ ]\\{\\}\\(a\\)[_ ]\\|\\.\\?\\+\\-\\^\[_ ]\\[[_ ]\\]', 'Special characters');
});
QUnit.test('namespaceRegex', assert => {
	assert.strictEqual(MorebitsGlobal.namespaceRegex([6]), '(?:[Ff][Ii][Ll][Ee]|[Ii][Mm][Aa][Gg][Ee])', 'Files');
	assert.strictEqual(MorebitsGlobal.namespaceRegex(10), '[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee]', 'Non-array singlet');
	assert.strictEqual(MorebitsGlobal.namespaceRegex([4, 5]), '(?:[Ww][Ii][Kk][Ii][Pp][Ee][Dd][Ii][Aa]|[Ww][Ii][Kk][Ii][Pp][Ee][Dd][Ii][Aa][_ ][Tt][Aa][Ll][Kk]|[Ww][Pp]|[Ww][Tt]|[Pp][Rr][Oo][Jj][Ee][Cc][Tt]|[Pp][Rr][Oo][Jj][Ee][Cc][Tt][_ ][Tt][Aa][Ll][Kk])', 'Project and project talk');
	assert.strictEqual(MorebitsGlobal.namespaceRegex(0), '', 'Main');
	assert.strictEqual(MorebitsGlobal.namespaceRegex(), '', 'Empty');
});

QUnit.test('isPageRedirect', assert => {
	assert.false(MorebitsGlobal.isPageRedirect(), 'Is redirect');
});
