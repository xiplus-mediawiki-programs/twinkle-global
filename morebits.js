// <nowiki>
/**
 * A library full of lots of goodness for user scripts on MediaWiki wikis, including Wikipedia.
 *
 * The highlights include:
 * - {@link MorebitsGlobal.wiki.api} - make calls to the MediaWiki API
 * - {@link MorebitsGlobal.wiki.page} - modify pages on the wiki (edit, revert, delete, etc.)
 * - {@link MorebitsGlobal.date} - enhanced date object processing, sort of a light moment.js
 * - {@link MorebitsGlobal.quickForm} - generate quick HTML forms on the fly
 * - {@link MorebitsGlobal.simpleWindow} - a wrapper for jQuery UI Dialog with a custom look and extra features
 * - {@link MorebitsGlobal.status} - a rough-and-ready status message displayer, used by the MorebitsGlobal.wiki classes
 * - {@link MorebitsGlobal.wikitext} - utilities for dealing with wikitext
 * - {@link MorebitsGlobal.string} - utilities for manipulating strings
 * - {@link MorebitsGlobal.array} - utilities for manipulating arrays
 * - {@link MorebitsGlobal.ip} - utilities to help process IP addresses
 *
 * Dependencies:
 * - The whole thing relies on jQuery.  But most wikis should provide this by default.
 * - {@link MorebitsGlobal.quickForm}, {@link MorebitsGlobal.simpleWindow}, and {@link MorebitsGlobal.status} rely on the "morebits.css" file for their styling.
 * - {@link MorebitsGlobal.simpleWindow} and {@link MorebitsGlobal.quickForm} tooltips rely on jQuery UI Dialog (from ResourceLoader module name 'jquery.ui').
 * - To create a gadget based on morebits.js, use this syntax in MediaWiki:Gadgets-definition:
 *     - `*GadgetName[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.Title,jquery.ui]|morebits.js|morebits.css|GadgetName.js`
 * - Alternatively, you can configure morebits.js as a hidden gadget in MediaWiki:Gadgets-definition:
 *     - `*morebits[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.Title,jquery.ui|hidden]|morebits.js|morebits.css`
 *     and then load ext.gadget.morebits as one of the dependencies for the new gadget.
 *
 * All the stuff here works on all browsers for which MediaWiki provides JavaScript support.
 *
 * This library is maintained by the maintainers of Twinkle.
 * For queries, suggestions, help, etc., head to [Wikipedia talk:Twinkle on English Wikipedia](http://en.wikipedia.org/wiki/WT:TW).
 * The latest development source is available at {@link https://github.com/wikimedia-gadgets/twinkle/blob/master/morebits.js|GitHub}.
 *
 * @namespace Morebits
 */


(function (window, document, $) { // Wrap entire file with anonymous function

/** @lends MorebitsGlobal */
var MorebitsGlobal = {};
window.MorebitsGlobal = MorebitsGlobal;  // allow global access


/**
 * Stores wikiLang and wikiFamily from URL.
 */
var temp = mw.config.get('wgServer').replace(/^(https?)?:?\/\//, '').split('.');
MorebitsGlobal.wikiLang = temp[0];
MorebitsGlobal.wikiFamily = temp[1];


/**
 * Stores interwiki prefix.
 */
MorebitsGlobal.interwikiPrefix = null;
switch (MorebitsGlobal.wikiFamily) {
	case 'wikimedia':
		switch (MorebitsGlobal.wikiLang) {
			case 'commons':
			case 'meta':
			case 'species':
			case 'incubator':
			case 'outreach':
				MorebitsGlobal.interwikiPrefix = MorebitsGlobal.wikiLang;
				break;
			default:
				break;
		}
		break;
	case 'mediawiki':
		MorebitsGlobal.interwikiPrefix = 'mw';
		break;
	case 'wikidata':
		switch (MorebitsGlobal.wikiLang) {
			case 'test':
				MorebitsGlobal.interwikiPrefix = 'testwikidata';
				break;
			case 'www':
				MorebitsGlobal.interwikiPrefix = 'd';
				break;
			default:
				break;
		}
		break;
	case 'wikipedia':
		switch (MorebitsGlobal.wikiLang) {
			case 'test':
				MorebitsGlobal.interwikiPrefix = 'testwiki';
				break;
			case 'test2':
				MorebitsGlobal.interwikiPrefix = 'test2wiki';
				break;
			default:
				MorebitsGlobal.interwikiPrefix = 'w:' + MorebitsGlobal.wikiLang;
				break;
		}
		break;
	case 'wiktionary':
		MorebitsGlobal.interwikiPrefix = 'wikt:' + MorebitsGlobal.wikiLang;
		break;
	case 'wikiquote':
		MorebitsGlobal.interwikiPrefix = 'q:' + MorebitsGlobal.wikiLang;
		break;
	case 'wikibooks':
		MorebitsGlobal.interwikiPrefix = 'b:' + MorebitsGlobal.wikiLang;
		break;
	case 'wikinews':
		MorebitsGlobal.interwikiPrefix = 'n:' + MorebitsGlobal.wikiLang;
		break;
	case 'wikisource':
		MorebitsGlobal.interwikiPrefix = 's:' + MorebitsGlobal.wikiLang;
		break;
	case 'wikiversity':
		MorebitsGlobal.interwikiPrefix = 'v:' + MorebitsGlobal.wikiLang;
		break;
	case 'wikivoyage':
		MorebitsGlobal.interwikiPrefix = 'voy:' + MorebitsGlobal.wikiLang;
		break;
	default:
		break;
}


/**
 * Determines whether the current wiki is a global-sysop wiki
 * @returns {boolean}
 */
MorebitsGlobal.nonGSWikis = [
	'anwiki',
	'arwiki',
	'bgwiki',
	'bnwiki',
	'cawiki',
	'commonswiki',
	'cswiki',
	'cswikisource',
	'cswiktionary',
	'cywiki',
	'dawiki',
	'dewiki',
	'dewikibooks',
	'dewikisource',
	'dewikivoyage',
	'dewiktionary',
	'elwiki',
	'enwiki',
	'enwikisource',
	'enwiktionary',
	'eowiki',
	'eswiki',
	'etwiki',
	'euwiki',
	'fawiki',
	'fiwiki',
	'frwiki',
	'frwikisource',
	'frwiktionary',
	'hewiki',
	'hewikisource',
	'hrwiki',
	'huwiki',
	'idwiki',
	'iswiki',
	'itwiki',
	'jawiki',
	'kawiki',
	'kowiki',
	'loginwiki',
	'lvwiki',
	'metawiki',
	'mkwiki',
	'mlwiki',
	'mrwiki',
	'mswiki',
	'nlwiki',
	'nlwiktionary',
	'nnwiki',
	'nowiki',
	'plwiki',
	'plwikimedia',
	'plwikisource',
	'plwiktionary',
	'ptwiki',
	'rowiki',
	'ruwiki',
	'sewikimedia',
	'simplewiki',
	'skwiki',
	'slwiki',
	'sourceswiki',
	'specieswiki',
	'svwiki',
	'svwiktionary',
	'tawiki',
	'testwiki',
	'tewiki',
	'thwiki',
	'trwiki',
	'urwiki',
	'viwiki',
	'wikidatawiki',
	'zh_yuewiki',
	'zhwiki',
]; // end of nonGSWikis
MorebitsGlobal.isGSWiki = function() {
	return MorebitsGlobal.nonGSWikis.indexOf(mw.config.get('wgDBname')) === -1;
};


/**
 * Simple helper function to see what groups a user might belong.
 *
 * @param {string} group - e.g. `sysop`, `extendedconfirmed`, etc.
 * @returns {boolean}
 */
MorebitsGlobal.userIsInGroup = function (group) {
	return mw.config.get('wgUserGroups').indexOf(group) !== -1;
};
/** Hardcodes whether the user is a sysop, used a lot.
 *
 * @type {boolean}
 */
MorebitsGlobal.userIsSysop = MorebitsGlobal.userIsInGroup('sysop');

/**
 * Deprecated as of February 2021, use {@link MorebitsGlobal.ip.sanitizeIPv6}.
 *
 * @deprecated Use {@link MorebitsGlobal.ip.sanitizeIPv6}.
 * Converts an IPv6 address to the canonical form stored and used by MediaWiki.
 * JavaScript translation of the {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/8eb6ac3e84ea3312d391ca96c12c49e3ad0753bb/includes/utils/IP.php#131|`IP::sanitizeIP()`}
 * function from the IPUtils library.  Adddresses are verbose, uppercase,
 * normalized, and expanded to 8 words.
 *
 * @param {string} address - The IPv6 address, with or without CIDR.
 * @returns {string}
 */
MorebitsGlobal.sanitizeIPv6 = function (address) {
	console.warn('NOTE: MorebitsGlobal.sanitizeIPv6 was renamed to MorebitsGlobal.ip.sanitizeIPv6 in February 2021, please use that instead'); // eslint-disable-line no-console
	return MorebitsGlobal.ip.sanitizeIPv6(address);
};

/**
 * Determines whether the current page is a redirect or soft redirect. Fails
 * to detect soft redirects on edit, history, etc. pages.  Will attempt to
 * detect [[Module:Redirect for discussion]], with the same failure points.
 *
 * @returns {boolean}
 */
MorebitsGlobal.isPageRedirect = function() {
	return !!(mw.config.get('wgIsRedirect') || document.getElementById('softredirect') || $('.box-Redirect_for_discussion').length);
};

/**
 * Stores a normalized (underscores converted to spaces) version of the
 * `wgPageName` variable.
 *
 * @type {string}
 */
MorebitsGlobal.pageNameNorm = mw.config.get('wgPageName').replace(/_/g, ' ');


/**
 * Create a string for use in regex matching a page name.  Accounts for
 * leading character's capitalization, underscores as spaces, and special
 * characters being escaped.  See also {@link MorebitsGlobal.namespaceRegex}.
 *
 * @param {string} pageName - Page name without namespace.
 * @returns {string} - For a page name `Foo bar`, returns the string `[Ff]oo[_ ]bar`.
 */
MorebitsGlobal.pageNameRegex = function(pageName) {
	if (pageName === '') {
		return '';
	}
	var firstChar = pageName[0],
		remainder = MorebitsGlobal.string.escapeRegExp(pageName.slice(1));
	if (mw.Title.phpCharToUpper(firstChar) !== firstChar.toLowerCase()) {
		return '[' + mw.Title.phpCharToUpper(firstChar) + firstChar.toLowerCase() + ']' + remainder;
	}
	return MorebitsGlobal.string.escapeRegExp(firstChar) + remainder;
};

/**
 * Create a string for use in regex matching all namespace aliases, regardless
 * of the capitalization and underscores/spaces.  Doesn't include the optional
 * leading `:`, but if there's more than one item, wraps the list in a
 * non-capturing group.  This means you can do `MorebitsGlobal.namespaceRegex([4]) +
 * ':' + MorebitsGlobal.pageNameRegex('Twinkle')` to match a full page.  Uses
 * {@link MorebitsGlobal.pageNameRegex}.
 *
 * @param {number[]} namespaces - Array of namespace numbers.  Unused/invalid
 * namespace numbers are silently discarded.
 * @example
 * // returns '(?:[Ff][Ii][Ll][Ee]|[Ii][Mm][Aa][Gg][Ee])'
 * MorebitsGlobal.namespaceRegex([6])
 * @returns {string} - Regex-suitable string of all namespace aliases.
 */
MorebitsGlobal.namespaceRegex = function(namespaces) {
	if (!Array.isArray(namespaces)) {
		namespaces = [namespaces];
	}
	var aliases = [], regex;
	$.each(mw.config.get('wgNamespaceIds'), function(name, number) {
		if (namespaces.indexOf(number) !== -1) {
			// Namespaces are completely agnostic as to case,
			// and a regex string is more useful/compatibile than a RegExp object,
			// so we accept any casing for any letter.
			aliases.push(name.split('').map(function(char) {
				return MorebitsGlobal.pageNameRegex(char);
			}).join(''));
		}
	});
	switch (aliases.length) {
		case 0:
			regex = '';
			break;
		case 1:
			regex = aliases[0];
			break;
		default:
			regex = '(?:' + aliases.join('|') + ')';
			break;
	}
	return regex;
};


/* **************** MorebitsGlobal.quickForm **************** */
/**
 * Creation of simple and standard forms without much specific coding.
 *
 * @namespace MorebitsGlobal.quickForm
 * @memberof Morebits
 * @class
 * @param {event} event - Function to execute when form is submitted.
 * @param {string} [eventType=submit] - Type of the event.
 */
MorebitsGlobal.quickForm = function QuickForm(event, eventType) {
	this.root = new MorebitsGlobal.quickForm.element({ type: 'form', event: event, eventType: eventType });
};

/**
 * Renders the HTML output of the quickForm.
 *
 * @memberof MorebitsGlobal.quickForm
 * @returns {HTMLElement}
 */
MorebitsGlobal.quickForm.prototype.render = function QuickFormRender() {
	var ret = this.root.render();
	ret.names = {};
	return ret;
};

/**
 * Append element to the form.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(object|MorebitsGlobal.quickForm.element)} data - A quickform element, or the object with which
 * a quickform element is constructed.
 * @returns {MorebitsGlobal.quickForm.element} - Same as what is passed to the function.
 */
MorebitsGlobal.quickForm.prototype.append = function QuickFormAppend(data) {
	return this.root.append(data);
};

/**
 * Create a new element for the the form.
 *
 * Index to MorebitsGlobal.quickForm.element types:
 * - Global attributes: id, className, style, tooltip, extra, adminonly
 * - `select`: A combo box (aka drop-down).
 *     - Attributes: name, label, multiple, size, list, event, disabled
 *  - `option`: An element for a combo box.
 *      - Attributes: value, label, selected, disabled
 *  - `optgroup`: A group of "option"s.
 *      - Attributes: label, list
 *  - `field`: A fieldset (aka group box).
 *      - Attributes: name, label, disabled
 *  - `checkbox`: A checkbox. Must use "list" parameter.
 *      - Attributes: name, list, event
 *      - Attributes (within list): name, label, value, checked, disabled, event, subgroup
 *  - `radio`: A radio button. Must use "list" parameter.
 *      - Attributes: name, list, event
 *      - Attributes (within list): name, label, value, checked, disabled, event, subgroup
 *  - `input`: A text input box.
 *      - Attributes: name, label, value, size, placeholder, maxlength, disabled, required, readonly, event
 *  - `number`: A number input box.
 *      - Attributes: Everything the text `input` has, as well as: min, max, step, list
 *  - `dyninput`: A set of text boxes with "Remove" buttons and an "Add" button.
 *      - Attributes: name, label, min, max, sublabel, value, size, maxlength, event
 *  - `hidden`: An invisible form field.
 *      - Attributes: name, value
 *  - `header`: A level 5 header.
 *      - Attributes: label
 *  - `div`: A generic placeholder element or label.
 *      - Attributes: name, label
 *  - `submit`: A submit button. MorebitsGlobal.simpleWindow moves these to the footer of the dialog.
 *      - Attributes: name, label, disabled
 *  - `button`: A generic button.
 *      - Attributes: name, label, disabled, event
 *  - `textarea`: A big, multi-line text box.
 *      - Attributes: name, label, value, cols, rows, disabled, required, readonly
 *  - `fragment`: A DocumentFragment object.
 *      - No attributes, and no global attributes except adminonly.
 *
 * @memberof MorebitsGlobal.quickForm
 * @class
 * @param {object} data - Object representing the quickform element. Should
 * specify one of the available types from the index above, as well as any
 * relevant and available attributes.
 * @example new MorebitsGlobal.quickForm.element({
 *     name: 'target',
 *     type: 'input',
 *     label: 'Your target:',
 *     tooltip: 'Enter your target. Required.',
 *     required: true
 * });
 */
MorebitsGlobal.quickForm.element = function QuickFormElement(data) {
	this.data = data;
	this.childs = [];
	this.id = MorebitsGlobal.quickForm.element.id++;
};

/**
 * @memberof MorebitsGlobal.quickForm.element
 * @type {number}
 */
MorebitsGlobal.quickForm.element.id = 0;

/**
 * Appends an element to current element.
 *
 * @memberof MorebitsGlobal.quickForm.element
 * @param {MorebitsGlobal.quickForm.element} data - A quickForm element or the object required to
 * create the quickForm element.
 * @returns {MorebitsGlobal.quickForm.element} The same element passed in.
 */
MorebitsGlobal.quickForm.element.prototype.append = function QuickFormElementAppend(data) {
	var child;
	if (data instanceof MorebitsGlobal.quickForm.element) {
		child = data;
	} else {
		child = new MorebitsGlobal.quickForm.element(data);
	}
	this.childs.push(child);
	return child;
};

/**
 * Renders the HTML output for the quickForm element.  This should be called
 * without parameters: `form.render()`.
 *
 * @memberof MorebitsGlobal.quickForm.element
 * @returns {HTMLElement}
 */
MorebitsGlobal.quickForm.element.prototype.render = function QuickFormElementRender(internal_subgroup_id) {
	var currentNode = this.compute(this.data, internal_subgroup_id);

	for (var i = 0; i < this.childs.length; ++i) {
		// do not pass internal_subgroup_id to recursive calls
		currentNode[1].appendChild(this.childs[i].render());
	}
	return currentNode[0];
};

/** @memberof MorebitsGlobal.quickForm.element */
MorebitsGlobal.quickForm.element.prototype.compute = function QuickFormElementCompute(data, in_id) {
	var node;
	var childContainder = null;
	var label;
	var id = (in_id ? in_id + '_' : '') + 'node_' + this.id;
	if (data.adminonly && !MorebitsGlobal.userIsSysop) {
		// hell hack alpha
		data.type = 'hidden';
	}

	var i, current, subnode;
	switch (data.type) {
		case 'form':
			node = document.createElement('form');
			node.className = 'mgquickform';
			node.setAttribute('action', 'javascript:void(0);');
			if (data.event) {
				node.addEventListener(data.eventType || 'submit', data.event, false);
			}
			break;
		case 'fragment':
			node = document.createDocumentFragment();
			// fragments can't have any attributes, so just return it straight away
			return [ node, node ];
		case 'select':
			node = document.createElement('div');

			node.setAttribute('id', 'div_' + id);
			if (data.label) {
				label = node.appendChild(document.createElement('label'));
				label.setAttribute('for', id);
				label.appendChild(document.createTextNode(data.label));
			}
			var select = node.appendChild(document.createElement('select'));
			if (data.event) {
				select.addEventListener('change', data.event, false);
			}
			if (data.multiple) {
				select.setAttribute('multiple', 'multiple');
			}
			if (data.size) {
				select.setAttribute('size', data.size);
			}
			if (data.disabled) {
				select.setAttribute('disabled', 'disabled');
			}
			select.setAttribute('name', data.name);

			if (data.list) {
				for (i = 0; i < data.list.length; ++i) {

					current = data.list[i];

					if (current.list) {
						current.type = 'optgroup';
					} else {
						current.type = 'option';
					}

					subnode = this.compute(current);
					select.appendChild(subnode[0]);
				}
			}
			childContainder = select;
			break;
		case 'option':
			node = document.createElement('option');
			node.values = data.value;
			node.setAttribute('value', data.value);
			if (data.selected) {
				node.setAttribute('selected', 'selected');
			}
			if (data.disabled) {
				node.setAttribute('disabled', 'disabled');
			}
			node.setAttribute('label', data.label);
			node.appendChild(document.createTextNode(data.label));
			break;
		case 'optgroup':
			node = document.createElement('optgroup');
			node.setAttribute('label', data.label);

			if (data.list) {
				for (i = 0; i < data.list.length; ++i) {

					current = data.list[i];
					current.type = 'option'; // must be options here

					subnode = this.compute(current);
					node.appendChild(subnode[0]);
				}
			}
			break;
		case 'field':
			node = document.createElement('fieldset');
			label = node.appendChild(document.createElement('legend'));
			label.appendChild(document.createTextNode(data.label));
			if (data.name) {
				node.setAttribute('name', data.name);
			}
			if (data.disabled) {
				node.setAttribute('disabled', 'disabled');
			}
			break;
		case 'checkbox':
		case 'radio':
			node = document.createElement('div');
			if (data.list) {
				for (i = 0; i < data.list.length; ++i) {
					var cur_id = id + '_' + i;
					current = data.list[i];
					var cur_div;
					if (current.type === 'header') {
					// inline hack
						cur_div = node.appendChild(document.createElement('h6'));
						cur_div.appendChild(document.createTextNode(current.label));
						if (current.tooltip) {
							MorebitsGlobal.quickForm.element.generateTooltip(cur_div, current);
						}
						continue;
					}
					cur_div = node.appendChild(document.createElement('div'));
					subnode = cur_div.appendChild(document.createElement('input'));
					subnode.values = current.value;
					subnode.setAttribute('value', current.value);
					subnode.setAttribute('type', data.type);
					subnode.setAttribute('id', cur_id);
					subnode.setAttribute('name', current.name || data.name);

					// If name is provided on the individual checkbox, add a data-single
					// attribute which indicates it isn't part of a list of checkboxes with
					// same name. Used in getInputData()
					if (current.name) {
						subnode.setAttribute('data-single', 'data-single');
					}

					if (current.checked) {
						subnode.setAttribute('checked', 'checked');
					}
					if (current.disabled) {
						subnode.setAttribute('disabled', 'disabled');
					}
					label = cur_div.appendChild(document.createElement('label'));
					label.appendChild(document.createTextNode(current.label));
					label.setAttribute('for', cur_id);
					if (current.tooltip) {
						MorebitsGlobal.quickForm.element.generateTooltip(label, current);
					}
					// styles go on the label, doesn't make sense to style a checkbox/radio
					if (current.style) {
						label.setAttribute('style', current.style);
					}

					var event;
					if (current.subgroup) {
						var tmpgroup = current.subgroup;

						if (!Array.isArray(tmpgroup)) {
							tmpgroup = [ tmpgroup ];
						}

						var subgroupRaw = new MorebitsGlobal.quickForm.element({
							type: 'div',
							id: id + '_' + i + '_subgroup'
						});
						$.each(tmpgroup, function(idx, el) {
							var newEl = $.extend({}, el);
							if (!newEl.type) {
								newEl.type = data.type;
							}
							newEl.name = (current.name || data.name) + '.' + newEl.name;
							subgroupRaw.append(newEl);
						});

						var subgroup = subgroupRaw.render(cur_id);
						subgroup.className = 'mgquickformSubgroup';
						subnode.subgroup = subgroup;
						subnode.shown = false;

						event = function(e) {
							if (e.target.checked) {
								e.target.parentNode.appendChild(e.target.subgroup);
								if (e.target.type === 'radio') {
									var name = e.target.name;
									if (e.target.form.names[name] !== undefined) {
										e.target.form.names[name].parentNode.removeChild(e.target.form.names[name].subgroup);
									}
									e.target.form.names[name] = e.target;
								}
							} else {
								e.target.parentNode.removeChild(e.target.subgroup);
							}
						};
						subnode.addEventListener('change', event, true);
						if (current.checked) {
							subnode.parentNode.appendChild(subgroup);
						}
					} else if (data.type === 'radio') {
						event = function(e) {
							if (e.target.checked) {
								var name = e.target.name;
								if (e.target.form.names[name] !== undefined) {
									e.target.form.names[name].parentNode.removeChild(e.target.form.names[name].subgroup);
								}
								delete e.target.form.names[name];
							}
						};
						subnode.addEventListener('change', event, true);
					}
					// add users' event last, so it can interact with the subgroup
					if (data.event) {
						subnode.addEventListener('change', data.event, false);
					} else if (current.event) {
						subnode.addEventListener('change', current.event, true);
					}
				}
			}
			if (data.shiftClickSupport && data.type === 'checkbox') {
				MorebitsGlobal.checkboxShiftClickSupport(MorebitsGlobal.quickForm.getElements(node, data.name));
			}
			break;
		// input is actually a text-type, so number here inherits the same stuff
		case 'number':
		case 'input':
			node = document.createElement('div');
			node.setAttribute('id', 'div_' + id);

			if (data.label) {
				label = node.appendChild(document.createElement('label'));
				label.appendChild(document.createTextNode(data.label));
				label.setAttribute('for', data.id || id);
			}

			subnode = node.appendChild(document.createElement('input'));
			subnode.setAttribute('name', data.name);

			if (data.type === 'input') {
				subnode.setAttribute('type', 'text');
			} else {
				subnode.setAttribute('type', 'number');
				['min', 'max', 'step', 'list'].forEach(function(att) {
					if (data[att]) {
						subnode.setAttribute(att, data[att]);
					}
				});
			}

			['value', 'size', 'placeholder', 'maxlength'].forEach(function(att) {
				if (data[att]) {
					subnode.setAttribute(att, data[att]);
				}
			});
			['disabled', 'required', 'readonly'].forEach(function(att) {
				if (data[att]) {
					subnode.setAttribute(att, att);
				}
			});
			if (data.event) {
				subnode.addEventListener('keyup', data.event, false);
			}

			childContainder = subnode;
			break;
		case 'dyninput':
			var min = data.min || 1;
			var max = data.max || Infinity;

			node = document.createElement('div');

			label = node.appendChild(document.createElement('h5'));
			label.appendChild(document.createTextNode(data.label));

			var listNode = node.appendChild(document.createElement('div'));

			var more = this.compute({
				type: 'button',
				label: 'more',
				disabled: min >= max,
				event: function(e) {
					var new_node = new MorebitsGlobal.quickForm.element(e.target.sublist);
					e.target.area.appendChild(new_node.render());

					if (++e.target.counter >= e.target.max) {
						e.target.setAttribute('disabled', 'disabled');
					}
					e.stopPropagation();
				}
			});

			node.appendChild(more[0]);
			var moreButton = more[1];

			var sublist = {
				type: '_dyninput_element',
				label: data.sublabel || data.label,
				name: data.name,
				value: data.value,
				size: data.size,
				remove: false,
				maxlength: data.maxlength,
				event: data.event
			};

			for (i = 0; i < min; ++i) {
				var elem = new MorebitsGlobal.quickForm.element(sublist);
				listNode.appendChild(elem.render());
			}
			sublist.remove = true;
			sublist.morebutton = moreButton;
			sublist.listnode = listNode;

			moreButton.sublist = sublist;
			moreButton.area = listNode;
			moreButton.max = max - min;
			moreButton.counter = 0;
			break;
		case '_dyninput_element': // Private, similar to normal input
			node = document.createElement('div');

			if (data.label) {
				label = node.appendChild(document.createElement('label'));
				label.appendChild(document.createTextNode(data.label));
				label.setAttribute('for', id);
			}

			subnode = node.appendChild(document.createElement('input'));
			if (data.value) {
				subnode.setAttribute('value', data.value);
			}
			subnode.setAttribute('name', data.name);
			subnode.setAttribute('type', 'text');
			if (data.size) {
				subnode.setAttribute('size', data.size);
			}
			if (data.maxlength) {
				subnode.setAttribute('maxlength', data.maxlength);
			}
			if (data.event) {
				subnode.addEventListener('keyup', data.event, false);
			}
			if (data.remove) {
				var remove = this.compute({
					type: 'button',
					label: 'remove',
					event: function(e) {
						var list = e.target.listnode;
						var node = e.target.inputnode;
						var more = e.target.morebutton;

						list.removeChild(node);
						--more.counter;
						more.removeAttribute('disabled');
						e.stopPropagation();
					}
				});
				node.appendChild(remove[0]);
				var removeButton = remove[1];
				removeButton.inputnode = node;
				removeButton.listnode = data.listnode;
				removeButton.morebutton = data.morebutton;
			}
			break;
		case 'hidden':
			node = document.createElement('input');
			node.setAttribute('type', 'hidden');
			node.values = data.value;
			node.setAttribute('value', data.value);
			node.setAttribute('name', data.name);
			break;
		case 'header':
			node = document.createElement('h5');
			node.appendChild(document.createTextNode(data.label));
			break;
		case 'div':
			node = document.createElement('div');
			if (data.name) {
				node.setAttribute('name', data.name);
			}
			if (data.label) {
				if (!Array.isArray(data.label)) {
					data.label = [ data.label ];
				}
				var result = document.createElement('span');
				result.className = 'mgquickformDescription';
				for (i = 0; i < data.label.length; ++i) {
					if (typeof data.label[i] === 'string') {
						result.appendChild(document.createTextNode(data.label[i]));
					} else if (data.label[i] instanceof Element) {
						result.appendChild(data.label[i]);
					}
				}
				node.appendChild(result);
			}
			break;
		case 'submit':
			node = document.createElement('span');
			childContainder = node.appendChild(document.createElement('input'));
			childContainder.setAttribute('type', 'submit');
			if (data.label) {
				childContainder.setAttribute('value', data.label);
			}
			childContainder.setAttribute('name', data.name || 'submit');
			if (data.disabled) {
				childContainder.setAttribute('disabled', 'disabled');
			}
			break;
		case 'button':
			node = document.createElement('span');
			childContainder = node.appendChild(document.createElement('input'));
			childContainder.setAttribute('type', 'button');
			if (data.label) {
				childContainder.setAttribute('value', data.label);
			}
			childContainder.setAttribute('name', data.name);
			if (data.disabled) {
				childContainder.setAttribute('disabled', 'disabled');
			}
			if (data.event) {
				childContainder.addEventListener('click', data.event, false);
			}
			break;
		case 'textarea':
			node = document.createElement('div');
			node.setAttribute('id', 'div_' + id);
			if (data.label) {
				label = node.appendChild(document.createElement('h5'));
				var labelElement = document.createElement('label');
				labelElement.textContent = data.label;
				labelElement.setAttribute('for', data.id || id);
				label.appendChild(labelElement);
			}
			subnode = node.appendChild(document.createElement('textarea'));
			subnode.setAttribute('name', data.name);
			if (data.cols) {
				subnode.setAttribute('cols', data.cols);
			}
			if (data.rows) {
				subnode.setAttribute('rows', data.rows);
			}
			if (data.disabled) {
				subnode.setAttribute('disabled', 'disabled');
			}
			if (data.required) {
				subnode.setAttribute('required', 'required');
			}
			if (data.readonly) {
				subnode.setAttribute('readonly', 'readonly');
			}
			if (data.value) {
				subnode.value = data.value;
			}
			childContainder = subnode;
			break;
		default:
			throw new Error('MorebitsGlobal.quickForm: unknown element type ' + data.type.toString());
	}

	if (!childContainder) {
		childContainder = node;
	}
	if (data.tooltip) {
		MorebitsGlobal.quickForm.element.generateTooltip(label || node, data);
	}

	if (data.extra) {
		childContainder.extra = data.extra;
	}
	if (data.style) {
		childContainder.setAttribute('style', data.style);
	}
	if (data.className) {
		childContainder.className = childContainder.className ?
			childContainder.className + ' ' + data.className :
			data.className;
	}
	childContainder.setAttribute('id', data.id || id);

	return [ node, childContainder ];
};

/**
 * Create a jQuery UI-based tooltip.
 *
 * @memberof MorebitsGlobal.quickForm.element
 * @requires jquery.ui
 * @param {HTMLElement} node - The HTML element beside which a tooltip is to be generated.
 * @param {object} data - Tooltip-related configuration data.
 */
MorebitsGlobal.quickForm.element.generateTooltip = function QuickFormElementGenerateTooltip(node, data) {
	var tooltipButton = node.appendChild(document.createElement('span'));
	tooltipButton.className = 'morebitsglobal-tooltipButton';
	tooltipButton.title = data.tooltip; // Provides the content for jQuery UI
	tooltipButton.appendChild(document.createTextNode('?'));
	$(tooltipButton).tooltip({
		position: { my: 'left top', at: 'center bottom', collision: 'flipfit' },
		// Deprecated in UI 1.12, but MW stuck on 1.9.2 indefinitely; see #398 and T71386
		tooltipClass: 'morebitsglobal-ui-tooltip'
	});
};


// Some utility methods for manipulating quickForms after their creation:
// (None of these work for "dyninput" type fields at present)

/**
 * Returns an object containing all filled form data entered by the user, with the object
 * keys being the form element names. Disabled fields will be ignored, but not hidden fields.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {HTMLFormElement} form
 * @returns {object} With field names as keys, input data as values.
 */
MorebitsGlobal.quickForm.getInputData = function(form) {
	var result = {};

	for (var i = 0; i < form.elements.length; i++) {
		var field = form.elements[i];
		if (field.disabled || !field.name || !field.type ||
			field.type === 'submit' || field.type === 'button') {
			continue;
		}

		// For elements in subgroups, quickform prepends element names with
		// name of the parent group followed by a period, get rid of that.
		var fieldNameNorm = field.name.slice(field.name.indexOf('.') + 1);

		switch (field.type) {
			case 'radio':
				if (field.checked) {
					result[fieldNameNorm] = field.value;
				}
				break;
			case 'checkbox':
				if (field.dataset.single) {
					result[fieldNameNorm] = field.checked; // boolean
				} else {
					result[fieldNameNorm] = result[fieldNameNorm] || [];
					if (field.checked) {
						result[fieldNameNorm].push(field.value);
					}
				}
				break;
			case 'select-multiple':
				result[fieldNameNorm] = $(field).val(); // field.value doesn't work
				break;
			case 'text': // falls through
			case 'textarea':
				result[fieldNameNorm] = field.value.trim();
				break;
			default: // could be select-one, date, number, email, etc
				if (field.value) {
					result[fieldNameNorm] = field.value;
				}
				break;
		}
	}
	return result;
};


/**
 * Returns all form elements with a given field name or ID.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {HTMLFormElement} form
 * @param {string} fieldName - The name or id of the fields.
 * @returns {HTMLElement[]} - Array of matching form elements.
 */
MorebitsGlobal.quickForm.getElements = function QuickFormGetElements(form, fieldName) {
	var $form = $(form);
	fieldName = $.escapeSelector(fieldName); // sanitize input
	var $elements = $form.find('[name="' + fieldName + '"]');
	if ($elements.length > 0) {
		return $elements.toArray();
	}
	$elements = $form.find('#' + fieldName);
	return $elements.toArray();
};

/**
 * Searches the array of elements for a checkbox or radio button with a certain
 * `value` attribute, and returns the first such element. Returns null if not found.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {HTMLInputElement[]} elementArray - Array of checkbox or radio elements.
 * @param {string} value - Value to search for.
 * @returns {HTMLInputElement}
 */
MorebitsGlobal.quickForm.getCheckboxOrRadio = function QuickFormGetCheckboxOrRadio(elementArray, value) {
	var found = $.grep(elementArray, function(el) {
		return el.value === value;
	});
	if (found.length > 0) {
		return found[0];
	}
	return null;
};

/**
 * Returns the &lt;div> containing the form element, or the form element itself
 * May not work as expected on checkboxes or radios.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
MorebitsGlobal.quickForm.getElementContainer = function QuickFormGetElementContainer(element) {
	// for divs, headings and fieldsets, the container is the element itself
	if (element instanceof HTMLFieldSetElement || element instanceof HTMLDivElement ||
			element instanceof HTMLHeadingElement) {
		return element;
	}

	// for others, just return the parent node
	return element.parentNode;
};

/**
 * Gets the HTML element that contains the label of the given form element
 * (mainly for internal use).
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|MorebitsGlobal.quickForm.element)} element
 * @returns {HTMLElement}
 */
MorebitsGlobal.quickForm.getElementLabelObject = function QuickFormGetElementLabelObject(element) {
	// for buttons, divs and headers, the label is on the element itself
	if (element.type === 'button' || element.type === 'submit' ||
			element instanceof HTMLDivElement || element instanceof HTMLHeadingElement) {
		return element;
	// for fieldsets, the label is the child <legend> element
	} else if (element instanceof HTMLFieldSetElement) {
		return element.getElementsByTagName('legend')[0];
	// for textareas, the label is the sibling <h5> element
	} else if (element instanceof HTMLTextAreaElement) {
		return element.parentNode.getElementsByTagName('h5')[0];
	}
	// for others, the label is the sibling <label> element
	return element.parentNode.getElementsByTagName('label')[0];
};

/**
 * Gets the label text of the element.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|MorebitsGlobal.quickForm.element)} element
 * @returns {string}
 */
MorebitsGlobal.quickForm.getElementLabel = function QuickFormGetElementLabel(element) {
	var labelElement = MorebitsGlobal.quickForm.getElementLabelObject(element);

	if (!labelElement) {
		return null;
	}
	return labelElement.firstChild.textContent;
};

/**
 * Sets the label of the element to the given text.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|MorebitsGlobal.quickForm.element)} element
 * @param {string} labelText
 * @returns {boolean} True if succeeded, false if the label element is unavailable.
 */
MorebitsGlobal.quickForm.setElementLabel = function QuickFormSetElementLabel(element, labelText) {
	var labelElement = MorebitsGlobal.quickForm.getElementLabelObject(element);

	if (!labelElement) {
		return false;
	}
	labelElement.firstChild.textContent = labelText;
	return true;
};

/**
 * Stores the element's current label, and temporarily sets the label to the given text.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|MorebitsGlobal.quickForm.element)} element
 * @param {string} temporaryLabelText
 * @returns {boolean} `true` if succeeded, `false` if the label element is unavailable.
 */
MorebitsGlobal.quickForm.overrideElementLabel = function QuickFormOverrideElementLabel(element, temporaryLabelText) {
	if (!element.hasAttribute('data-oldlabel')) {
		element.setAttribute('data-oldlabel', MorebitsGlobal.quickForm.getElementLabel(element));
	}
	return MorebitsGlobal.quickForm.setElementLabel(element, temporaryLabelText);
};

/**
 * Restores the label stored by overrideElementLabel.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|MorebitsGlobal.quickForm.element)} element
 * @returns {boolean} True if succeeded, false if the label element is unavailable.
 */
MorebitsGlobal.quickForm.resetElementLabel = function QuickFormResetElementLabel(element) {
	if (element.hasAttribute('data-oldlabel')) {
		return MorebitsGlobal.quickForm.setElementLabel(element, element.getAttribute('data-oldlabel'));
	}
	return null;
};

/**
 * Shows or hides a form element plus its label and tooltip.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|jQuery|string)} element - HTML/jQuery element, or jQuery selector string.
 * @param {boolean} [visibility] - Skip this to toggle visibility.
 */
MorebitsGlobal.quickForm.setElementVisibility = function QuickFormSetElementVisibility(element, visibility) {
	$(element).toggle(visibility);
};

/**
 * Shows or hides the question mark icon (which displays the tooltip) next to a form element.
 *
 * @memberof MorebitsGlobal.quickForm
 * @param {(HTMLElement|jQuery)} element
 * @param {boolean} [visibility] - Skip this to toggle visibility.
 */
MorebitsGlobal.quickForm.setElementTooltipVisibility = function QuickFormSetElementTooltipVisibility(element, visibility) {
	$(MorebitsGlobal.quickForm.getElementContainer(element)).find('.morebitsglobal-tooltipButton').toggle(visibility);
};



/**
 * @external HTMLFormElement
 */
/**
 * Get checked items in the form.
 *
 * @function external:HTMLFormElement.getChecked
 * @param {string} name - Find checked property of elements (i.e. a checkbox
 * or a radiobutton) with the given name, or select options that have selected
 * set to true (don't try to mix selects with radio/checkboxes).
 * @param {string} [type] - Optionally specify either radio or checkbox (for
 * the event that both checkboxes and radiobuttons have the same name).
 * @returns {string[]} - Contains the values of elements with the given name
 * checked property set to true.
 */
HTMLFormElement.prototype.getChecked = function(name, type) {
	var elements = this.elements[name];
	if (!elements) {
		return [];
	}
	var return_array = [];
	var i;
	if (elements instanceof HTMLSelectElement) {
		var options = elements.options;
		for (i = 0; i < options.length; ++i) {
			if (options[i].selected) {
				if (options[i].values) {
					return_array.push(options[i].values);
				} else {
					return_array.push(options[i].value);
				}

			}
		}
	} else if (elements instanceof HTMLInputElement) {
		if (type && elements.type !== type) {
			return [];
		} else if (elements.checked) {
			return [ elements.value ];
		}
	} else {
		for (i = 0; i < elements.length; ++i) {
			if (elements[i].checked) {
				if (type && elements[i].type !== type) {
					continue;
				}
				if (elements[i].values) {
					return_array.push(elements[i].values);
				} else {
					return_array.push(elements[i].value);
				}
			}
		}
	}
	return return_array;
};

/**
 * Does the same as {@link HTMLFormElement.getChecked|getChecked}, but with unchecked elements.
 *
 * @function external:HTMLFormElement.getUnchecked
 * @param {string} name - Find checked property of elements (i.e. a checkbox
 * or a radiobutton) with the given name, or select options that have selected
 * set to true (don't try to mix selects with radio/checkboxes).
 * @param {string} [type] - Optionally specify either radio or checkbox (for
 * the event that both checkboxes and radiobuttons have the same name).
 * @returns {string[]} - Contains the values of elements with the given name
 * checked property set to true.
 */
HTMLFormElement.prototype.getUnchecked = function(name, type) {
	var elements = this.elements[name];
	if (!elements) {
		return [];
	}
	var return_array = [];
	var i;
	if (elements instanceof HTMLSelectElement) {
		var options = elements.options;
		for (i = 0; i < options.length; ++i) {
			if (!options[i].selected) {
				if (options[i].values) {
					return_array.push(options[i].values);
				} else {
					return_array.push(options[i].value);
				}

			}
		}
	} else if (elements instanceof HTMLInputElement) {
		if (type && elements.type !== type) {
			return [];
		} else if (!elements.checked) {
			return [ elements.value ];
		}
	} else {
		for (i = 0; i < elements.length; ++i) {
			if (!elements[i].checked) {
				if (type && elements[i].type !== type) {
					continue;
				}
				if (elements[i].values) {
					return_array.push(elements[i].values);
				} else {
					return_array.push(elements[i].value);
				}
			}
		}
	}
	return return_array;
};

/**
 * Utilities to help process IP addresses.
 *
 * @namespace MorebitsGlobal.ip
 * @memberof Morebits
 */
MorebitsGlobal.ip = {
	/**
	 * Converts an IPv6 address to the canonical form stored and used by MediaWiki.
	 * JavaScript translation of the {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/8eb6ac3e84ea3312d391ca96c12c49e3ad0753bb/includes/utils/IP.php#131|`IP::sanitizeIP()`}
	 * function from the IPUtils library.  Adddresses are verbose, uppercase,
	 * normalized, and expanded to 8 words.
	 *
	 * @param {string} address - The IPv6 address, with or without CIDR.
	 * @returns {string}
	 */
	sanitizeIPv6: function (address) {
		address = address.trim();
		if (address === '') {
			return null;
		}
		if (!mw.util.isIPv6Address(address, true)) {
			return address; // nothing else to do for IPv4 addresses or invalid ones
		}
		// Remove any whitespaces, convert to upper case
		address = address.toUpperCase();
		// Expand zero abbreviations
		var abbrevPos = address.indexOf('::');
		if (abbrevPos > -1) {
			// We know this is valid IPv6. Find the last index of the
			// address before any CIDR number (e.g. "a:b:c::/24").
			var CIDRStart = address.indexOf('/');
			var addressEnd = CIDRStart !== -1 ? CIDRStart - 1 : address.length - 1;
			// If the '::' is at the beginning...
			var repeat, extra, pad;
			if (abbrevPos === 0) {
				repeat = '0:';
				extra = address === '::' ? '0' : ''; // for the address '::'
				pad = 9; // 7+2 (due to '::')
				// If the '::' is at the end...
			} else if (abbrevPos === (addressEnd - 1)) {
				repeat = ':0';
				extra = '';
				pad = 9; // 7+2 (due to '::')
				// If the '::' is in the middle...
			} else {
				repeat = ':0';
				extra = ':';
				pad = 8; // 6+2 (due to '::')
			}
			var replacement = repeat;
			pad -= address.split(':').length - 1;
			for (var i = 1; i < pad; i++) {
				replacement += repeat;
			}
			replacement += extra;
			address = address.replace('::', replacement);
		}
		// Remove leading zeros from each bloc as needed
		return address.replace(/(^|:)0+([0-9A-Fa-f]{1,4})/g, '$1$2');
	},

	/**
	 * Determine if the given IP address is a range.  Just conjoins
	 * `mw.util.isIPAddress` with and without the `allowBlock` option.
	 *
	 * @param {string} ip
	 * @returns {boolean} - True if given a valid IP address range, false otherwise.
	 */
	isRange: function (ip) {
		return mw.util.isIPAddress(ip, true) && !mw.util.isIPAddress(ip);
	},

	/**
	 * Check that an IP range is within the CIDR limits.  Most likely to be useful
	 * in conjunction with `wgRelevantUserName`.  CIDR limits are harcoded as /16
	 * for IPv4 and /32 for IPv6.
	 *
	 * @returns {boolean} - True for valid ranges within the CIDR limits,
	 * otherwise false (ranges outside the limit, single IPs, non-IPs).
	 */
	validCIDR: function (ip) {
		if (MorebitsGlobal.ip.isRange(ip)) {
			var subnet = parseInt(ip.match(/\/(\d{1,3})$/)[1], 10);
			if (subnet) { // Should be redundant
				if (mw.util.isIPv6Address(ip, true)) {
					if (subnet >= 32) {
						return true;
					}
				} else {
					if (subnet >= 16) {
						return true;
					}
				}
			}
		}
		return false;
	},

	/**
	 * Get the /64 subnet for an IPv6 address.
	 *
	 * @param {string} ipv6 - The IPv6 address, with or without a subnet.
	 * @returns {boolean|string} - False if not IPv6 or bigger than a 64,
	 * otherwise the (sanitized) /64 address.
	 */
	get64: function (ipv6) {
		if (!ipv6 || !mw.util.isIPv6Address(ipv6, true)) {
			return false;
		}
		var subnetMatch = ipv6.match(/\/(\d{1,3})$/);
		if (subnetMatch && parseInt(subnetMatch[1], 10) < 64) {
			return false;
		}
		ipv6 = MorebitsGlobal.ip.sanitizeIPv6(ipv6);
		var ip_re = /^((?:[0-9A-F]{1,4}:){4})(?:[0-9A-F]{1,4}:){3}[0-9A-F]{1,4}(?:\/\d{1,3})?$/;
		return ipv6.replace(ip_re, '$1' + '0:0:0:0/64');
	},

	/**
	 * Check if the given username is an IP address or a temporary user
	 * @param {*} username - The username
	 * @param {*} allowBlock - Whether to allow blocks
	 * @returns {boolean} - True if the username is an IP address or a temporary user
	 */
	isIPOrTemp: function(username, allowBlock) {
		return mw.util.isIPAddress(username, allowBlock) || mw.util.isTemporaryUser(username);
	}
};


/**
 * @external RegExp
 */
/**
 * Deprecated as of September 2020, use {@link MorebitsGlobal.string.escapeRegExp}
 * or `mw.util.escapeRegExp`.
 *
 * @function external:RegExp.escape
 * @deprecated Use {@link MorebitsGlobal.string.escapeRegExp} or `mw.util.escapeRegExp`.
 * @param {string} text - String to be escaped.
 * @param {boolean} [space_fix=false] - Whether to replace spaces and
 * underscores with `[ _]` as they are often equivalent.
 * @returns {string} - The escaped text.
 */
RegExp.escape = function(text, space_fix) {
	if (space_fix) {
		console.error('NOTE: RegExp.escape from Morebits was deprecated September 2020, please replace it with MorebitsGlobal.string.escapeRegExp'); // eslint-disable-line no-console
		return MorebitsGlobal.string.escapeRegExp(text);
	}
	console.error('NOTE: RegExp.escape from Morebits was deprecated September 2020, please replace it with mw.util.escapeRegExp'); // eslint-disable-line no-console
	return mw.util.escapeRegExp(text);
};


/**
 * Helper functions to manipulate strings.
 *
 * @namespace MorebitsGlobal.string
 * @memberof Morebits
 */
MorebitsGlobal.string = {
	/**
	 * @param {string} str
	 * @returns {string}
	 */
	toUpperCaseFirstChar: function(str) {
		str = str.toString();
		return str.substr(0, 1).toUpperCase() + str.substr(1);
	},
	/**
	 * @param {string} str
	 * @returns {string}
	 */
	toLowerCaseFirstChar: function(str) {
		str = str.toString();
		return str.substr(0, 1).toLowerCase() + str.substr(1);
	},

	/**
	 * Gives an array of substrings of `str` - starting with `start` and
	 * ending with `end` - which is not in `skiplist`.  Intended for use
	 * on wikitext with templates or links.
	 *
	 * @param {string} str
	 * @param {string} start
	 * @param {string} end
	 * @param {(string[]|string)} [skiplist]
	 * @returns {string[]}
	 * @throws If the `start` and `end` strings aren't of the same length.
	 * @throws If `skiplist` isn't an array or string
	 */
	splitWeightedByKeys: function(str, start, end, skiplist) {
		if (start.length !== end.length) {
			throw new Error('start marker and end marker must be of the same length');
		}
		var level = 0;
		var initial = null;
		var result = [];
		if (!Array.isArray(skiplist)) {
			if (skiplist === undefined) {
				skiplist = [];
			} else if (typeof skiplist === 'string') {
				skiplist = [ skiplist ];
			} else {
				throw new Error('non-applicable skiplist parameter');
			}
		}
		for (var i = 0; i < str.length; ++i) {
			for (var j = 0; j < skiplist.length; ++j) {
				if (str.substr(i, skiplist[j].length) === skiplist[j]) {
					i += skiplist[j].length - 1;
					continue;
				}
			}
			if (str.substr(i, start.length) === start) {
				if (initial === null) {
					initial = i;
				}
				++level;
				i += start.length - 1;
			} else if (str.substr(i, end.length) === end) {
				--level;
				i += end.length - 1;
			}
			if (!level && initial !== null) {
				result.push(str.substring(initial, i + 1));
				initial = null;
			}
		}

		return result;
	},

	/**
	 * Formats freeform "reason" (from a textarea) for deletion/other
	 * templates that are going to be substituted, (e.g. PROD, XFD, RPP).
	 * Handles `|` outside a nowiki tag.
	 * Optionally, also adds a signature if not present already.
	 *
	 * @param {string} str
	 * @param {boolean} [addSig]
	 * @returns {string}
	 */
	formatReasonText: function(str, addSig) {
		var reason = (str || '').toString().trim();
		var unbinder = new MorebitsGlobal.unbinder(reason);
		unbinder.unbind('<no' + 'wiki>', '</no' + 'wiki>');
		unbinder.content = unbinder.content.replace(/\|/g, '{{subst:!}}');
		reason = unbinder.rebind();
		if (addSig) {
			var sig = '~~~~', sigIndex = reason.lastIndexOf(sig);
			if (sigIndex === -1 || sigIndex !== reason.length - sig.length) {
				reason += ' ' + sig;
			}
		}
		return reason.trim();
	},

	/**
	 * Formats a "reason" (from a textarea) for inclusion in a userspace
	 * log.  Replaces newlines with {{Pb}}, and adds an extra `#` before
	 * list items for proper formatting.
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	formatReasonForLog: function(str) {
		return str
			// handle line breaks, which otherwise break numbering
			.replace(/\n+/g, '{{pb}}')
			// put an extra # in front before bulleted or numbered list items
			.replace(/^(#+)/mg, '#$1')
			.replace(/^(\*+)/mg, '#$1');
	},

	/**
	 * Like `String.prototype.replace()`, but escapes any dollar signs in
	 * the replacement string.  Useful when the the replacement string is
	 * arbitrary, such as a username or freeform user input, and could
	 * contain dollar signs.
	 *
	 * @param {string} string - Text in which to replace.
	 * @param {(string|RegExp)} pattern
	 * @param {string} replacement
	 * @returns {string}
	 */
	safeReplace: function morebitsStringSafeReplace(string, pattern, replacement) {
		return string.replace(pattern, replacement.replace(/\$/g, '$$$$'));
	},

	/**
	 * Determine if the user-provided expiration will be considered an
	 * infinite-length by MW.
	 *
	 * @see {@link https://phabricator.wikimedia.org/T68646}
	 *
	 * @param {string} expiry
	 * @returns {boolean}
	 */
	isInfinity: function morebitsStringIsInfinity(expiry) {
		return ['indefinite', 'infinity', 'infinite', 'never'].indexOf(expiry) !== -1;
	},

	/**
	 * Escapes a string to be used in a RegExp, replacing spaces and
	 * underscores with `[_ ]` as they are often equivalent.
	 * Replaced RegExp.escape September 2020.
	 *
	 * @param {string} text - String to be escaped.
	 * @returns {string} - The escaped text.
	 */
	escapeRegExp: function(text) {
		return mw.util.escapeRegExp(text).replace(/ |_/g, '[_ ]');
	}
};


/**
 * Helper functions to manipulate arrays.
 *
 * @namespace MorebitsGlobal.array
 * @memberof Morebits
 */
MorebitsGlobal.array = {
	/**
	 * Remove duplicated items from an array.
	 *
	 * @param {Array} arr
	 * @returns {Array} A copy of the array with duplicates removed.
	 * @throws When provided a non-array.
	 */
	uniq: function(arr) {
		if (!Array.isArray(arr)) {
			throw 'A non-array object passed to MorebitsGlobal.array.uniq';
		}
		return arr.filter(function(item, idx) {
			return arr.indexOf(item) === idx;
		});
	},

	/**
	 * Remove non-duplicated items from an array.
	 *
	 * @param {Array} arr
	 * @returns {Array} A copy of the array with the first instance of each value
	 * removed; subsequent instances of those values (duplicates) remain.
	 * @throws When provided a non-array.
	 */
	dups: function(arr) {
		if (!Array.isArray(arr)) {
			throw 'A non-array object passed to MorebitsGlobal.array.dups';
		}
		return arr.filter(function(item, idx) {
			return arr.indexOf(item) !== idx;
		});
	},


	/**
	 * Break up an array into smaller arrays.
	 *
	 * @param {Array} arr
	 * @param {number} size - Size of each chunk (except the last, which could be different).
	 * @returns {Array[]} An array containing the smaller, chunked arrays.
	 * @throws When provided a non-array.
	 */
	chunk: function(arr, size) {
		if (!Array.isArray(arr)) {
			throw 'A non-array object passed to MorebitsGlobal.array.chunk';
		}
		if (typeof size !== 'number' || size <= 0) { // pretty impossible to do anything :)
			return [ arr ]; // we return an array consisting of this array.
		}
		var numChunks = Math.ceil(arr.length / size);
		var result = new Array(numChunks);
		for (var i = 0; i < numChunks; i++) {
			result[i] = arr.slice(i * size, (i + 1) * size);
		}
		return result;
	}
};

/**
 * Utilities to enhance select2 menus. See twinklewarn, twinklexfd,
 * twinkleblock for sample usages.
 *
 * @see {@link https://select2.org/}
 *
 * @namespace MorebitsGlobal.select2
 * @memberof Morebits
 * @requires jquery.select2
 */
MorebitsGlobal.select2 = {
	matchers: {
		/**
		 * Custom matcher in which if the optgroup name matches, all options in that
		 * group are shown, like in jquery.chosen.
		 */
		optgroupFull: function(params, data) {
			var originalMatcher = $.fn.select2.defaults.defaults.matcher;
			var result = originalMatcher(params, data);

			if (result && params.term &&
				data.text.toUpperCase().indexOf(params.term.toUpperCase()) !== -1) {
				result.children = data.children;
			}
			return result;
		},

		/** Custom matcher that matches from the beginning of words only. */
		wordBeginning: function(params, data) {
			var originalMatcher = $.fn.select2.defaults.defaults.matcher;
			var result = originalMatcher(params, data);
			if (!params.term || (result &&
				new RegExp('\\b' + mw.util.escapeRegExp(params.term), 'i').test(result.text))) {
				return result;
			}
			return null;
		}
	},

	/** Underline matched part of options. */
	highlightSearchMatches: function(data) {
		var searchTerm = MorebitsGlobal.select2SearchQuery;
		if (!searchTerm || data.loading) {
			return data.text;
		}
		var idx = data.text.toUpperCase().indexOf(searchTerm.toUpperCase());
		if (idx < 0) {
			return data.text;
		}

		return $('<span>').append(
			data.text.slice(0, idx),
			$('<span>').css('text-decoration', 'underline').text(data.text.slice(idx, idx + searchTerm.length)),
			data.text.slice(idx + searchTerm.length)
		);
	},

	/** Intercept query as it is happening, for use in highlightSearchMatches. */
	queryInterceptor: function(params) {
		MorebitsGlobal.select2SearchQuery = params && params.term;
	},

	/**
	 * Open dropdown and begin search when the `.select2-selection` has
	 * focus and a key is pressed.
	 *
	 * @see {@link https://github.com/select2/select2/issues/3279#issuecomment-442524147}
	 */
	autoStart: function(ev) {
		if (ev.which < 48) {
			return;
		}
		var target = $(ev.target).closest('.select2-container');
		if (!target.length) {
			return;
		}
		target = target.prev();
		target.select2('open');
		var search = target.data('select2').dropdown.$search ||
			target.data('select2').selection.$search;
		search.focus();
	}

};


/**
 * Temporarily hide a part of a string while processing the rest of it.
 * Used by {@link MorebitsGlobal.wikitext.page#commentOutImage|MorebitsGlobal.wikitext.page.commentOutImage}.
 *
 * @memberof Morebits
 * @class
 * @param {string} string - The initial text to process.
 * @example var u = new MorebitsGlobal.unbinder('Hello world <!-- world --> world');
 * u.unbind('<!--', '-->'); // text inside comment remains intact
 * u.content = u.content.replace(/world/g, 'earth');
 * u.rebind(); // gives 'Hello earth <!-- world --> earth'
 */
MorebitsGlobal.unbinder = function Unbinder(string) {
	if (typeof string !== 'string') {
		throw new Error('not a string');
	}
	/** The text being processed. */
	this.content = string;
	this.counter = 0;
	this.history = {};
	this.prefix = '%UNIQ::' + Math.random() + '::';
	this.postfix = '::UNIQ%';
};

MorebitsGlobal.unbinder.prototype = {
	/**
	 * Hide the region encapsulated by the `prefix` and `postfix` from
	 * string processing.  `prefix` and `postfix` will be used in a
	 * RegExp, so items that need escaping should be use `\\`.
	 *
	 * @param {string} prefix
	 * @param {string} postfix
	 * @throws If either `prefix` or `postfix` is missing.
	 */
	unbind: function UnbinderUnbind(prefix, postfix) {
		if (!prefix || !postfix) {
			throw new Error('Both prefix and postfix must be provided');
		}
		var re = new RegExp(prefix + '([\\s\\S]*?)' + postfix, 'g');
		this.content = this.content.replace(re, MorebitsGlobal.unbinder.getCallback(this));
	},

	/**
	 * Restore the hidden portion of the `content` string.
	 *
	 * @returns {string} The processed output.
	 */
	rebind: function UnbinderRebind() {
		var content = this.content;
		content.self = this;
		for (var current in this.history) {
			if (Object.prototype.hasOwnProperty.call(this.history, current)) {
				content = content.replace(current, this.history[current]);
			}
		}
		return content;
	},
	prefix: null, // %UNIQ::0.5955981644938324::
	postfix: null, // ::UNIQ%
	content: null, // string
	counter: null, // 0++
	history: null // {}
};
/** @memberof MorebitsGlobal.unbinder */
MorebitsGlobal.unbinder.getCallback = function UnbinderGetCallback(self) {
	return function UnbinderCallback(match) {
		var current = self.prefix + self.counter + self.postfix;
		self.history[current] = match;
		++self.counter;
		return current;
	};
};



/* **************** MorebitsGlobal.date **************** */
/**
 * Create a date object with enhanced processing capabilities, a la
 * {@link https://momentjs.com/|moment.js}. MediaWiki timestamp format is also
 * acceptable, in addition to everything that JS Date() accepts.
 *
 * @memberof Morebits
 * @class
 */
MorebitsGlobal.date = function() {
	var args = Array.prototype.slice.call(arguments);

	// Check MediaWiki formats
	// Must be first since firefox erroneously accepts the timestamp
	// format, sans timezone (See also: #921, #936, #1174, #1187), and the
	// 14-digit string will be interpreted differently.
	if (args.length === 1) {
		var param = args[0];
		if (/^\d{14}$/.test(param)) {
			// YYYYMMDDHHmmss
			var digitMatch = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(param);
			if (digitMatch) {
				// ..... year ... month .. date ... hour .... minute ..... second
				this._d = new Date(Date.UTC.apply(null, [digitMatch[1], digitMatch[2] - 1, digitMatch[3], digitMatch[4], digitMatch[5], digitMatch[6]]));
			}
		} else if (typeof param === 'string') {
			// Wikitext signature timestamp
			var dateParts = MorebitsGlobal.date.localeData.signatureTimestampFormat(param);
			if (dateParts) {
				this._d = new Date(Date.UTC.apply(null, dateParts));
			}
		}
	}

	if (!this._d) {
		// Try standard date
		this._d = new (Function.prototype.bind.apply(Date, [Date].concat(args)));
	}

	// Still no?
	if (!this.isValid()) {
		mw.log.warn('Invalid MorebitsGlobal.date initialisation:', args);
	}
};

/**
 * Localized strings for date processing.
 *
 * @memberof MorebitsGlobal.date
 * @type {object.<string, string>}
 * @property {string[]} months
 * @property {string[]} monthsShort
 * @property {string[]} days
 * @property {string[]} daysShort
 * @property {object.<string, string>} relativeTimes
 * @private
 */
MorebitsGlobal.date.localeData = {
	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	relativeTimes: {
		thisDay: '[Today at] h:mm A',
		prevDay: '[Yesterday at] h:mm A',
		nextDay: '[Tomorrow at] h:mm A',
		thisWeek: 'dddd [at] h:mm A',
		pastWeek: '[Last] dddd [at] h:mm A',
		other: 'YYYY-MM-DD'
	},
	signatureTimestampFormat: function (str) {
		// HH:mm, DD Month YYYY (UTC)
		var rgx = /(\d{2}):(\d{2}), (\d{1,2}) (\w+) (\d{4}) \(UTC\)/;
		var match = rgx.exec(str);
		if (!match) {
			return null;
		}
		var month = MorebitsGlobal.date.localeData.months.indexOf(match[4]);
		if (month === -1) {
			return null;
		}
		// ..... year ... month .. date ... hour .... minute
		return [match[5], month, match[3], match[1], match[2]];
	}
};

/**
 * Map units with getter/setter function names, for `add` and `subtract`
 * methods.
 *
 * @memberof MorebitsGlobal.date
 * @type {object.<string, string>}
 */
MorebitsGlobal.date.unitMap = {
	seconds: 'Seconds',
	minutes: 'Minutes',
	hours: 'Hours',
	days: 'Date',
	months: 'Month',
	years: 'FullYear'
};

MorebitsGlobal.date.prototype = {
	/** @returns {boolean} */
	isValid: function() {
		return !isNaN(this.getTime());
	},

	/**
	 * @param {(Date|MorebitsGlobal.date)} date
	 * @returns {boolean}
	 */
	isBefore: function(date) {
		return this.getTime() < date.getTime();
	},
	/**
	 * @param {(Date|MorebitsGlobal.date)} date
	 * @returns {boolean}
	 */
	isAfter: function(date) {
		return this.getTime() > date.getTime();
	},

	/** @returns {string} */
	getUTCMonthName: function() {
		return MorebitsGlobal.date.localeData.months[this.getUTCMonth()];
	},
	/** @returns {string} */
	getUTCMonthNameAbbrev: function() {
		return MorebitsGlobal.date.localeData.monthsShort[this.getUTCMonth()];
	},
	/** @returns {string} */
	getMonthName: function() {
		return MorebitsGlobal.date.localeData.months[this.getMonth()];
	},
	/** @returns {string} */
	getMonthNameAbbrev: function() {
		return MorebitsGlobal.date.localeData.monthsShort[this.getMonth()];
	},
	/** @returns {string} */
	getUTCDayName: function() {
		return MorebitsGlobal.date.localeData.days[this.getUTCDay()];
	},
	/** @returns {string} */
	getUTCDayNameAbbrev: function() {
		return MorebitsGlobal.date.localeData.daysShort[this.getUTCDay()];
	},
	/** @returns {string} */
	getDayName: function() {
		return MorebitsGlobal.date.localeData.days[this.getDay()];
	},
	/** @returns {string} */
	getDayNameAbbrev: function() {
		return MorebitsGlobal.date.localeData.daysShort[this.getDay()];
	},

	/**
	 * Add a given number of minutes, hours, days, months or years to the date.
	 * This is done in-place. The modified date object is also returned, allowing chaining.
	 *
	 * @param {number} number - Should be an integer.
	 * @param {string} unit
	 * @throws If invalid or unsupported unit is given.
	 * @returns {MorebitsGlobal.date}
	 */
	add: function(number, unit) {
		var num = parseInt(number, 10); // normalize
		if (isNaN(num)) {
			throw new Error('Invalid number "' + number + '" provided.');
		}
		unit = unit.toLowerCase(); // normalize
		var unitMap = MorebitsGlobal.date.unitMap;
		var unitNorm = unitMap[unit] || unitMap[unit + 's']; // so that both singular and  plural forms work
		if (unitNorm) {
			this['set' + unitNorm](this['get' + unitNorm]() + num);
			return this;
		}
		throw new Error('Invalid unit "' + unit + '": Only ' + Object.keys(unitMap).join(', ') + ' are allowed.');
	},

	/**
	 * Subtracts a given number of minutes, hours, days, months or years to the date.
	 * This is done in-place. The modified date object is also returned, allowing chaining.
	 *
	 * @param {number} number - Should be an integer.
	 * @param {string} unit
	 * @throws If invalid or unsupported unit is given.
	 * @returns {MorebitsGlobal.date}
	 */
	subtract: function(number, unit) {
		return this.add(-number, unit);
	},

	/**
	 * Format the date into a string per the given format string.
	 * Replacement syntax is a subset of that in moment.js:
	 *
	 * | Syntax | Output |
	 * |--------|--------|
	 * | H | Hours (24-hour) |
	 * | HH | Hours (24-hour, padded) |
	 * | h | Hours (12-hour) |
	 * | hh | Hours (12-hour, padded) |
	 * | A | AM or PM |
	 * | m | Minutes |
	 * | mm | Minutes (padded) |
	 * | s | Seconds |
	 * | ss | Seconds (padded) |
	 * | SSS | Milliseconds fragment, padded |
	 * | d | Day number of the week (Sun=0) |
	 * | ddd | Abbreviated day name |
	 * | dddd | Full day name |
	 * | D | Date |
	 * | DD | Date (padded) |
	 * | M | Month number (0-indexed) |
	 * | MM | Month number (0-indexed, padded) |
	 * | MMM | Abbreviated month name |
	 * | MMMM | Full month name |
	 * | Y | Year |
	 * | YY | Final two digits of year (20 for 2020, 42 for 1942) |
	 * | YYYY | Year (same as `Y`) |
	 *
	 * @param {string} formatstr - Format the date into a string, using
	 * the replacement syntax.  Use `[` and `]` to escape items.  If not
	 * provided, will return the ISO-8601-formatted string.
	 * @param {(string|number)} [zone=system] - `system` (for browser-default time zone),
	 * `utc`, or specify a time zone as number of minutes relative to UTC.
	 * @returns {string}
	 */
	format: function(formatstr, zone) {
		if (!this.isValid()) {
			return 'Invalid date'; // Put the truth out, preferable to "NaNNaNNan NaN:NaN" or whatever
		}
		var udate = this;
		// create a new date object that will contain the date to display as system time
		if (zone === 'utc') {
			udate = new MorebitsGlobal.date(this.getTime()).add(this.getTimezoneOffset(), 'minutes');
		} else if (typeof zone === 'number') {
			// convert to utc, then add the utc offset given
			udate = new MorebitsGlobal.date(this.getTime()).add(this.getTimezoneOffset() + zone, 'minutes');
		}

		// default to ISOString
		if (!formatstr) {
			return udate.toISOString();
		}

		var pad = function(num, len) {
			len = len || 2; // Up to length of 00 + 1
			return ('00' + num).toString().slice(0 - len);
		};
		var h24 = udate.getHours(), m = udate.getMinutes(), s = udate.getSeconds(), ms = udate.getMilliseconds();
		var D = udate.getDate(), M = udate.getMonth() + 1, Y = udate.getFullYear();
		var h12 = h24 % 12 || 12, amOrPm = h24 >= 12 ? 'PM' : 'AM';
		var replacementMap = {
			HH: pad(h24), H: h24, hh: pad(h12), h: h12, A: amOrPm,
			mm: pad(m), m: m,
			ss: pad(s), s: s,
			SSS: pad(ms, 3),
			dddd: udate.getDayName(), ddd: udate.getDayNameAbbrev(), d: udate.getDay(),
			DD: pad(D), D: D,
			MMMM: udate.getMonthName(), MMM: udate.getMonthNameAbbrev(), MM: pad(M), M: M,
			YYYY: Y, YY: pad(Y % 100), Y: Y
		};

		var unbinder = new MorebitsGlobal.unbinder(formatstr); // escape stuff between [...]
		unbinder.unbind('\\[', '\\]');
		unbinder.content = unbinder.content.replace(
			/* Regex notes:
			 * d(d{2,3})? matches exactly 1, 3 or 4 occurrences of 'd' ('dd' is treated as a double match of 'd')
			 * Y{1,2}(Y{2})? matches exactly 1, 2 or 4 occurrences of 'Y'
			 */
			/H{1,2}|h{1,2}|m{1,2}|s{1,2}|SSS|d(d{2,3})?|D{1,2}|M{1,4}|Y{1,2}(Y{2})?|A/g,
			function(match) {
				return replacementMap[match];
			}
		);
		return unbinder.rebind().replace(/\[(.*?)\]/g, '$1');
	},

	/**
	 * Gives a readable relative time string such as "Yesterday at 6:43 PM" or "Last Thursday at 11:45 AM".
	 * Similar to `calendar` in moment.js, but with time zone support.
	 *
	 * @param {(string|number)} [zone=system] - 'system' (for browser-default time zone),
	 * 'utc' (for UTC), or specify a time zone as number of minutes past UTC.
	 * @returns {string}
	 */
	calendar: function(zone) {
		// Zero out the hours, minutes, seconds and milliseconds - keeping only the date;
		// find the difference. Note that setHours() returns the same thing as getTime().
		var dateDiff = (new Date().setHours(0, 0, 0, 0) -
			new Date(this).setHours(0, 0, 0, 0)) / 8.64e7;
		switch (true) {
			case dateDiff === 0:
				return this.format(MorebitsGlobal.date.localeData.relativeTimes.thisDay, zone);
			case dateDiff === 1:
				return this.format(MorebitsGlobal.date.localeData.relativeTimes.prevDay, zone);
			case dateDiff > 0 && dateDiff < 7:
				return this.format(MorebitsGlobal.date.localeData.relativeTimes.pastWeek, zone);
			case dateDiff === -1:
				return this.format(MorebitsGlobal.date.localeData.relativeTimes.nextDay, zone);
			case dateDiff < 0 && dateDiff > -7:
				return this.format(MorebitsGlobal.date.localeData.relativeTimes.thisWeek, zone);
			default:
				return this.format(MorebitsGlobal.date.localeData.relativeTimes.other, zone);
		}
	},

	/**
	 * Get a regular expression that matches wikitext section titles, such
	 * as `==December 2019==` or `=== Jan 2018 ===`.
	 *
	 * @returns {RegExp}
	 */
	monthHeaderRegex: function() {
		return new RegExp('^(==+)\\s*(?:' + this.getUTCMonthName() + '|' + this.getUTCMonthNameAbbrev() +
			')\\s+' + this.getUTCFullYear() + '\\s*\\1', 'mg');
	},

	/**
	 * Creates a wikitext section header with the month and year.
	 *
	 * @param {number} [level=2] - Header level.  Pass 0 for just the text
	 * with no wikitext markers (==).
	 * @returns {string}
	 */
	monthHeader: function(level) {
		// Default to 2, but allow for 0 or stringy numbers
		level = parseInt(level, 10);
		level = isNaN(level) ? 2 : level;

		var header = Array(level + 1).join('='); // String.prototype.repeat not supported in IE 11
		var text = this.getUTCMonthName() + ' ' + this.getUTCFullYear();

		if (header.length) { // wikitext-formatted header
			return header + ' ' + text + ' ' + header;
		}
		return text; // Just the string

	}

};

// Allow native Date.prototype methods to be used on MorebitsGlobal.date objects
Object.getOwnPropertyNames(Date.prototype).forEach(function(func) {
	// Exclude methods that collide with PageTriage's Date.js external, which clobbers native Date: [[phab:T268513]]
	if (['add', 'getDayName', 'getMonthName'].indexOf(func) === -1) {
		MorebitsGlobal.date.prototype[func] = function() {
			return this._d[func].apply(this._d, Array.prototype.slice.call(arguments));
		};
	}
});


/* **************** MorebitsGlobal.wiki **************** */
/**
 * Various objects for wiki editing and API access, including
 * {@link MorebitsGlobal.wiki.api} and {@link MorebitsGlobal.wiki.page}.
 *
 * @namespace MorebitsGlobal.wiki
 * @memberof Morebits
 */
MorebitsGlobal.wiki = {};

/**
 * @deprecated in favor of MorebitsGlobal.isPageRedirect as of November 2020
 * @memberof MorebitsGlobal.wiki
 * @returns {boolean}
 */
MorebitsGlobal.wiki.isPageRedirect = function wikipediaIsPageRedirect() {
	console.warn('NOTE: MorebitsGlobal.wiki.isPageRedirect has been deprecated, use MorebitsGlobal.isPageRedirect instead.'); // eslint-disable-line no-console
	return MorebitsGlobal.isPageRedirect();
};


/* **************** MorebitsGlobal.wiki.actionCompleted **************** */
/**
 * @memberof MorebitsGlobal.wiki
 * @type {number}
 */
MorebitsGlobal.wiki.numberOfActionsLeft = 0;
/**
 * @memberof MorebitsGlobal.wiki
 * @type {number}
 */
MorebitsGlobal.wiki.nbrOfCheckpointsLeft = 0;

/**
 * Display message and/or redirect to page upon completion of tasks.
 *
 * Every call to MorebitsGlobal.wiki.api.post() results in the dispatch of an
 * asynchronous callback. Each callback can in turn make an additional call to
 * MorebitsGlobal.wiki.api.post() to continue a processing sequence. At the
 * conclusion of the final callback of a processing sequence, it is not
 * possible to simply return to the original caller because there is no call
 * stack leading back to the original context. Instead,
 * MorebitsGlobal.wiki.actionCompleted.event() is called to display the result to
 * the user and to perform an optional page redirect.
 *
 * The determination of when to call MorebitsGlobal.wiki.actionCompleted.event() is
 * managed through the globals MorebitsGlobal.wiki.numberOfActionsLeft and
 * MorebitsGlobal.wiki.nbrOfCheckpointsLeft. MorebitsGlobal.wiki.numberOfActionsLeft is
 * incremented at the start of every MorebitsGlobal.wiki.api call and decremented
 * after the completion of a callback function. If a callback function does
 * not create a new MorebitsGlobal.wiki.api object before exiting, it is the final
 * step in the processing chain and MorebitsGlobal.wiki.actionCompleted.event() will
 * then be called.
 *
 * Optionally, callers may use MorebitsGlobal.wiki.addCheckpoint() to indicate that
 * processing is not complete upon the conclusion of the final callback
 * function.  This is used for batch operations. The end of a batch is
 * signaled by calling MorebitsGlobal.wiki.removeCheckpoint().
 *
 * @memberof MorebitsGlobal.wiki
 */
MorebitsGlobal.wiki.actionCompleted = function(self) {
	if (--MorebitsGlobal.wiki.numberOfActionsLeft <= 0 && MorebitsGlobal.wiki.nbrOfCheckpointsLeft <= 0) {
		MorebitsGlobal.wiki.actionCompleted.event(self);
	}
};

// Change per action wanted
/** @memberof MorebitsGlobal.wiki */
MorebitsGlobal.wiki.actionCompleted.event = function() {
	if (MorebitsGlobal.wiki.actionCompleted.notice) {
		MorebitsGlobal.status.actionCompleted(MorebitsGlobal.wiki.actionCompleted.notice);
	}
	if (MorebitsGlobal.wiki.actionCompleted.redirect) {
		// if it isn't a URL, make it one. TODO: This breaks on the articles 'http://', 'ftp://', and similar ones.
		if (!(/^\w+:\/\//).test(MorebitsGlobal.wiki.actionCompleted.redirect)) {
			MorebitsGlobal.wiki.actionCompleted.redirect = mw.util.getUrl(MorebitsGlobal.wiki.actionCompleted.redirect);
			if (MorebitsGlobal.wiki.actionCompleted.followRedirect === false) {
				MorebitsGlobal.wiki.actionCompleted.redirect += '?redirect=no';
			}
		}
		window.setTimeout(function() {
			window.location = MorebitsGlobal.wiki.actionCompleted.redirect;
		}, MorebitsGlobal.wiki.actionCompleted.timeOut);
	}
};

/** @memberof MorebitsGlobal.wiki */
MorebitsGlobal.wiki.actionCompleted.timeOut = typeof window.wpActionCompletedTimeOut === 'undefined' ? 5000 : window.wpActionCompletedTimeOut;
/** @memberof MorebitsGlobal.wiki */
MorebitsGlobal.wiki.actionCompleted.redirect = null;
/** @memberof MorebitsGlobal.wiki */
MorebitsGlobal.wiki.actionCompleted.notice = null;

/** @memberof MorebitsGlobal.wiki */
MorebitsGlobal.wiki.addCheckpoint = function() {
	++MorebitsGlobal.wiki.nbrOfCheckpointsLeft;
};

/** @memberof MorebitsGlobal.wiki */
MorebitsGlobal.wiki.removeCheckpoint = function() {
	if (--MorebitsGlobal.wiki.nbrOfCheckpointsLeft <= 0 && MorebitsGlobal.wiki.numberOfActionsLeft <= 0) {
		MorebitsGlobal.wiki.actionCompleted.event();
	}
};


/* **************** MorebitsGlobal.wiki.api **************** */
/**
 * An easy way to talk to the MediaWiki API.  Accepts either json or xml
 * (default) formats; if json is selected, will default to `formatversion=2`
 * unless otherwise specified.  Similarly, enforces newer `errorformat`s,
 * defaulting to `html` if unspecified.  `uselang` enforced to the wiki's
 * content language.
 *
 * In new code, the use of the last 3 parameters should be avoided, instead
 * use {@link MorebitsGlobal.wiki.api#setStatusElement|setStatusElement()} to bind
 * the status element (if needed) and use `.then()` or `.catch()` on the
 * promise returned by `post()`, rather than specify the `onSuccess` or
 * `onFailure` callbacks.
 *
 * @memberof MorebitsGlobal.wiki
 * @class
 * @param {string} currentAction - The current action (required).
 * @param {object} query - The query (required).
 * @param {Function} [onSuccess] - The function to call when request is successful.
 * @param {MorebitsGlobal.status} [statusElement] - A MorebitsGlobal.status object to use for status messages.
 * @param {Function} [onError] - The function to call if an error occurs.
 */
MorebitsGlobal.wiki.api = function(currentAction, query, onSuccess, statusElement, onError) {
	this.currentAction = currentAction;
	this.query = query;
	this.query.assert = 'user';
	// Enforce newer error formats, preferring html
	if (!query.errorformat || ['wikitext', 'plaintext'].indexOf(query.errorformat) === -1) {
		this.query.errorformat = 'html';
	}
	// Explicitly use the wiki's content language to minimize confusion,
	// see #1179 for discussion
	this.query.uselang = 'content';
	this.query.errorlang = 'uselang';
	this.query.errorsuselocal = 1;

	this.onSuccess = onSuccess;
	this.onError = onError;
	if (statusElement) {
		this.setStatusElement(statusElement);
	} else {
		this.statelem = new MorebitsGlobal.status(currentAction);
	}
	// JSON is used throughout Morebits/Twinkle, but xml remains the default for backwards compatibility
	if (!query.format) {
		this.query.format = 'xml';
	} else if (query.format === 'json' && !query.formatversion) {
		this.query.formatversion = '2';
	} else if (['xml', 'json'].indexOf(query.format) === -1) {
		this.statelem.error('Invalid API format: only xml and json are supported.');
	}

	// Ignore tags for queries and most common unsupported actions, produces warnings
	if (query.action && ['query', 'review', 'stabilize', 'pagetriageaction', 'watch'].indexOf(query.action) !== -1) {
		delete query.tags;
	} else if (!query.tags && morebitsWikiChangeTag) {
		query.tags = morebitsWikiChangeTag;
	}
};

MorebitsGlobal.wiki.api.prototype = {
	currentAction: '',
	onSuccess: null,
	onError: null,
	parent: window,  // use global context if there is no parent object
	query: null,
	response: null,
	responseXML: null,  // use `response` instead; retained for backwards compatibility
	statelem: null,  // this non-standard name kept for backwards compatibility
	statusText: null, // result received from the API, normally "success" or "error"
	errorCode: null, // short text error code, if any, as documented in the MediaWiki API
	errorText: null, // full error description, if any
	badtokenRetry: false, // set to true if this on a retry attempted after a badtoken error

	/**
	 * Keep track of parent object for callbacks.
	 *
	 * @param {*} parent
	 */
	setParent: function(parent) {
		this.parent = parent;
	},

	/** @param {MorebitsGlobal.status} statusElement */
	setStatusElement: function(statusElement) {
		this.statelem = statusElement;
		this.statelem.status(this.currentAction);
	},

	/**
	 * Carry out the request.
	 *
	 * @param {object} callerAjaxParameters - Do not specify a parameter unless you really
	 * really want to give jQuery some extra parameters.
	 * @returns {promise} - A jQuery promise object that is resolved or rejected with the api object.
	 */
	post: function(callerAjaxParameters) {

		++MorebitsGlobal.wiki.numberOfActionsLeft;

		var queryString = $.map(this.query, function(val, i) {
			if (Array.isArray(val)) {
				return encodeURIComponent(i) + '=' + val.map(encodeURIComponent).join('|');
			} else if (val !== undefined) {
				return encodeURIComponent(i) + '=' + encodeURIComponent(val);
			}
		}).join('&').replace(/^(.*?)(\btoken=[^&]*)&(.*)/, '$1$3&$2');
		// token should always be the last item in the query string (bug TW-B-0013)

		var ajaxparams = $.extend({}, {
			context: this,
			type: this.query.action === 'query' ? 'GET' : 'POST',
			url: mw.util.wikiScript('api'),
			data: queryString,
			dataType: this.query.format,
			headers: {
				'Api-User-Agent': morebitsWikiApiUserAgent
			}
		}, callerAjaxParameters);

		return $.ajax(ajaxparams).then(

			function onAPIsuccess(response, statusText) {
				this.statusText = statusText;
				this.response = this.responseXML = response;
				// Limit to first error
				if (this.query.format === 'json') {
					this.errorCode = response.errors && response.errors[0].code;
					if (this.query.errorformat === 'html') {
						this.errorText = response.errors && response.errors[0].html;
					} else if (this.query.errorformat === 'wikitext' || this.query.errorformat === 'plaintext') {
						this.errorText = response.errors && response.errors[0].text;
					}
				} else {
					this.errorCode = $(response).find('errors error').eq(0).attr('code');
					// Sufficient for html, wikitext, or plaintext errorformats
					this.errorText = $(response).find('errors error').eq(0).text();
				}

				if (typeof this.errorCode === 'string') {
					// the API didn't like what we told it, e.g., bad edit token or an error creating a page
					return this.returnError(callerAjaxParameters);
				}

				// invoke success callback if one was supplied
				if (this.onSuccess) {
					// set the callback context to this.parent for new code and supply the API object
					// as the first argument to the callback (for legacy code)
					this.onSuccess.call(this.parent, this);
				} else {
					this.statelem.info('done');
				}

				MorebitsGlobal.wiki.actionCompleted();

				return $.Deferred().resolveWith(this.parent, [this]);
			},

			// only network and server errors reach here - complaints from the API itself are caught in success()
			function onAPIfailure(jqXHR, statusText, errorThrown) {
				this.statusText = statusText;
				this.errorThrown = errorThrown; // frequently undefined
				this.errorText = statusText + ' "' + jqXHR.statusText + '" occurred while contacting the API.';
				return this.returnError();
			}

		);
	},

	returnError: function(callerAjaxParameters) {
		if (this.errorCode === 'badtoken' && !this.badtokenRetry) {
			this.statelem.warn('Invalid token. Getting a new token and retrying...');
			this.badtokenRetry = true;
			// Get a new CSRF token and retry. If the original action needs a different
			// type of action than CSRF, we do one pointless retry before bailing out
			return MorebitsGlobal.wiki.api.getToken().then(function(token) {
				this.query.token = token;
				return this.post(callerAjaxParameters);
			}.bind(this));
		}

		this.statelem.error(this.errorText + ' (' + this.errorCode + ')');

		// invoke failure callback if one was supplied
		if (this.onError) {

			// set the callback context to this.parent for new code and supply the API object
			// as the first argument to the callback for legacy code
			this.onError.call(this.parent, this);
		}
		// don't complete the action so that the error remains displayed

		return $.Deferred().rejectWith(this.parent, [this]);
	},

	getStatusElement: function() {
		return this.statelem;
	},

	getErrorCode: function() {
		return this.errorCode;
	},

	getErrorText: function() {
		return this.errorText;
	},

	getXML: function() { // retained for backwards compatibility, use getResponse() instead
		return this.responseXML;
	},

	getResponse: function() {
		return this.response;
	}

};

var morebitsWikiApiUserAgent = 'morebits.js ([[w:WT:TW]])';
/**
 * Set the custom user agent header, which is used for server-side logging.
 * Note that doing so will set the useragent for every `MorebitsGlobal.wiki.api`
 * process performed thereafter.
 *
 * @see {@link https://lists.wikimedia.org/pipermail/mediawiki-api-announce/2014-November/000075.html}
 * for original announcement.
 *
 * @memberof MorebitsGlobal.wiki.api
 * @param {string} [ua=morebits.js ([[w:WT:TW]])] - User agent.  The default
 * value of `morebits.js ([[w:WT:TW]])` will be appended to any provided
 * value.
 */
MorebitsGlobal.wiki.api.setApiUserAgent = function(ua) {
	morebitsWikiApiUserAgent = (ua ? ua + ' ' : '') + 'morebits.js ([[w:WT:TW]])';
};



/**
 * Change/revision tag applied to Morebits actions when no other tags are specified.
 * Unused by default per {@link https://en.wikipedia.org/w/index.php?oldid=970618849#Adding_tags_to_Twinkle_edits_and_actions|EnWiki consensus}.
 *
 * @constant
 * @memberof MorebitsGlobal.wiki.api
 * @type {string}
 */
var morebitsWikiChangeTag = '';


/**
 * Get a new CSRF token on encountering token errors.
 *
 * @memberof MorebitsGlobal.wiki.api
 * @returns {string} MediaWiki CSRF token.
 */
MorebitsGlobal.wiki.api.getToken = function() {
	var tokenApi = new MorebitsGlobal.wiki.api('Getting token', {
		action: 'query',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	});
	return tokenApi.post().then(function(apiobj) {
		return apiobj.response.query.tokens.csrftoken;
	});
};


/* **************** MorebitsGlobal.wiki.page **************** */
/**
 * Use the MediaWiki API to load a page and optionally edit it, move it, etc.
 *
 * Callers are not permitted to directly access the properties of this class!
 * All property access is through the appropriate get___() or set___() method.
 *
 * Callers should set {@link MorebitsGlobal.wiki.actionCompleted.notice} and {@link MorebitsGlobal.wiki.actionCompleted.redirect}
 * before the first call to {@link MorebitsGlobal.wiki.page.load()}.
 *
 * Each of the callback functions takes one parameter, which is a
 * reference to the MorebitsGlobal.wiki.page object that registered the callback.
 * Callback functions may invoke any MorebitsGlobal.wiki.page prototype method using this reference.
 *
 *
 * Call sequence for common operations (optional final user callbacks not shown):
 *
 * - Edit current contents of a page (no edit conflict):
 * `.load(userTextEditCallback) -> ctx.loadApi.post() ->
 * ctx.loadApi.post.success() -> ctx.fnLoadSuccess() -> userTextEditCallback() ->
 * .save() -> ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()`
 *
 * - Edit current contents of a page (with edit conflict):
 * `.load(userTextEditCallback) -> ctx.loadApi.post() ->
 * ctx.loadApi.post.success() -> ctx.fnLoadSuccess() -> userTextEditCallback() ->
 * .save() -> ctx.saveApi.post() -> ctx.loadApi.post.success() ->
 * ctx.fnSaveError() -> ctx.loadApi.post() -> ctx.loadApi.post.success() ->
 * ctx.fnLoadSuccess() -> userTextEditCallback() -> .save() ->
 * ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()`
 *
 * - Append to a page (similar for prepend and newSection):
 * `.append() -> ctx.loadApi.post() -> ctx.loadApi.post.success() ->
 * ctx.fnLoadSuccess() -> ctx.fnAutoSave() -> .save() -> ctx.saveApi.post() ->
 * ctx.loadApi.post.success() -> ctx.fnSaveSuccess()`
 *
 * Notes:
 * 1. All functions following MorebitsGlobal.wiki.api.post() are invoked asynchronously from the jQuery AJAX library.
 * 2. The sequence for append/prepend/newSection could be slightly shortened,
 * but it would require significant duplication of code for little benefit.
 *
 *
 * @memberof MorebitsGlobal.wiki
 * @class
 * @param {string} pageName - The name of the page, prefixed by the namespace (if any).
 * For the current page, use `mw.config.get('wgPageName')`.
 * @param {string|MorebitsGlobal.status} [status] - A string describing the action about to be undertaken,
 * or a MorebitsGlobal.status object
 */
MorebitsGlobal.wiki.page = function(pageName, status) {

	if (!status) {
		status = 'Opening page "' + pageName + '"';
	}

	/**
	 * Private context variables.
	 *
	 * This context is not visible to the outside, thus all the data here
	 * must be accessed via getter and setter functions.
	 *
	 * @private
	 */
	var ctx = {
		// backing fields for public properties
		pageName: pageName,
		pageExists: false,
		editSummary: null,
		changeTags: null,
		testActions: null,  // array if any valid actions
		callbackParameters: null,
		statusElement: status instanceof MorebitsGlobal.status ? status : new MorebitsGlobal.status(status),

		// - edit
		pageText: null,
		editMode: 'all',  // save() replaces entire contents of the page by default
		appendText: null,   // can't reuse pageText for this because pageText is needed to follow a redirect
		prependText: null,  // can't reuse pageText for this because pageText is needed to follow a redirect
		newSectionText: null,
		newSectionTitle: null,
		createOption: null,
		minorEdit: false,
		botEdit: false,
		pageSection: null,
		maxConflictRetries: 2,
		maxRetries: 2,
		followRedirect: false,
		followCrossNsRedirect: true,
		watchlistOption: 'nochange',
		watchlistExpiry: null,
		creator: null,
		timestamp: null,

		// - revert
		revertOldID: null,

		// - move
		moveDestination: null,
		moveTalkPage: false,
		moveSubpages: false,
		moveSuppressRedirect: false,

		// - protect
		protectEdit: null,
		protectMove: null,
		protectCreate: null,
		protectCascade: null,

		// - creation lookup
		lookupNonRedirectCreator: false,

		// - stabilize (FlaggedRevs)
		flaggedRevs: null,

		// internal status
		pageLoaded: false,
		csrfToken: null,
		loadTime: null,
		lastEditTime: null,
		pageID: null,
		contentModel: null,
		revertCurID: null,
		revertUser: null,
		watched: false,
		fullyProtected: false,
		suppressProtectWarning: false,
		conflictRetries: 0,
		retries: 0,

		// callbacks
		onLoadSuccess: null,
		onLoadFailure: null,
		onSaveSuccess: null,
		onSaveFailure: null,
		onLookupCreationSuccess: null,
		onLookupCreationFailure: null,
		onMoveSuccess: null,
		onMoveFailure: null,
		onDeleteSuccess: null,
		onDeleteFailure: null,
		onUndeleteSuccess: null,
		onUndeleteFailure: null,
		onProtectSuccess: null,
		onProtectFailure: null,
		onStabilizeSuccess: null,
		onStabilizeFailure: null,

		// internal objects
		loadQuery: null,
		loadApi: null,
		saveApi: null,
		lookupCreationApi: null,
		moveApi: null,
		moveProcessApi: null,
		patrolApi: null,
		patrolProcessApi: null,
		triageApi: null,
		triageProcessListApi: null,
		triageProcessApi: null,
		deleteApi: null,
		deleteProcessApi: null,
		undeleteApi: null,
		undeleteProcessApi: null,
		protectApi: null,
		protectProcessApi: null,
		stabilizeApi: null,
		stabilizeProcessApi: null
	};

	var emptyFunction = function() { };

	/**
	 * Loads the text for the page.
	 *
	 * @param {Function} onSuccess - Callback function which is called when the load has succeeded.
	 * @param {Function} [onFailure] - Callback function which is called when the load fails.
	 */
	this.load = function(onSuccess, onFailure) {
		ctx.onLoadSuccess = onSuccess;
		ctx.onLoadFailure = onFailure || emptyFunction;

		// Need to be able to do something after the page loads
		if (!onSuccess) {
			ctx.statusElement.error('Internal error: no onSuccess callback provided to load()!');
			ctx.onLoadFailure(this);
			return;
		}

		ctx.loadQuery = {
			action: 'query',
			prop: 'info|revisions',
			inprop: 'watched',
			intestactions: 'edit', // can be expanded
			curtimestamp: '',
			meta: 'tokens',
			type: 'csrf',
			titles: ctx.pageName,
			format: 'json'
			// don't need rvlimit=1 because we don't need rvstartid here and only one actual rev is returned by default
		};

		if (ctx.editMode === 'all') {
			ctx.loadQuery.rvprop = 'content|timestamp';  // get the page content at the same time, if needed
		} else if (ctx.editMode === 'revert') {
			ctx.loadQuery.rvprop = 'timestamp';
			ctx.loadQuery.rvlimit = 1;
			ctx.loadQuery.rvstartid = ctx.revertOldID;
		}

		if (ctx.followRedirect) {
			ctx.loadQuery.redirects = '';  // follow all redirects
		}
		if (typeof ctx.pageSection === 'number') {
			ctx.loadQuery.rvsection = ctx.pageSection;
		}
		if (MorebitsGlobal.userIsSysop) {
			ctx.loadQuery.inprop += '|protection';
		}

		ctx.loadApi = new MorebitsGlobal.wiki.api('Retrieving page...', ctx.loadQuery, fnLoadSuccess, ctx.statusElement, ctx.onLoadFailure);
		ctx.loadApi.setParent(this);
		ctx.loadApi.post();
	};

	/**
	 * Saves the text for the page to Wikipedia.
	 * Must be preceded by successfully calling `load()`.
	 *
	 * Warning: Calling `save()` can result in additional calls to the
	 * previous `load()` callbacks to recover from edit conflicts! In this
	 * case, callers must make the same edit to the new pageText and
	 * reinvoke `save()`.  This behavior can be disabled with
	 * `setMaxConflictRetries(0)`.
	 *
	 * @param {Function} [onSuccess] - Callback function which is called when the save has succeeded.
	 * @param {Function} [onFailure] - Callback function which is called when the save fails.
	 */
	this.save = function(onSuccess, onFailure) {
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure || emptyFunction;

		// are we getting our editing token from mw.user.tokens?
		var canUseMwUserToken = fnCanUseMwUserToken('edit');

		if (!ctx.pageLoaded && !canUseMwUserToken) {
			ctx.statusElement.error('Internal error: attempt to save a page that has not been loaded!');
			ctx.onSaveFailure(this);
			return;
		}
		if (!ctx.editSummary) {
			// new section mode allows (nay, encourages) using the
			// title as the edit summary, but the query needs
			// editSummary to be undefined or '', not null
			if (ctx.editMode === 'new' && ctx.newSectionTitle) {
				ctx.editSummary = '';
			} else {
				ctx.statusElement.error('Internal error: edit summary not set before save!');
				ctx.onSaveFailure(this);
				return;
			}
		}

		// shouldn't happen if canUseMwUserToken === true
		if (ctx.fullyProtected && !ctx.suppressProtectWarning &&
			!confirm('You are about to make an edit to the fully protected page "' + ctx.pageName +
			(ctx.fullyProtected === 'infinity' ? '" (protected indefinitely)' : '" (protection expiring ' + new MorebitsGlobal.date(ctx.fullyProtected).calendar('utc') + ' (UTC))') +
			'.  \n\nClick OK to proceed with the edit, or Cancel to skip this edit.')) {
			ctx.statusElement.error('Edit to fully protected page was aborted.');
			ctx.onSaveFailure(this);
			return;
		}

		ctx.retries = 0;

		var query = {
			action: 'edit',
			title: ctx.pageName,
			summary: ctx.editSummary,
			token: canUseMwUserToken ? mw.user.tokens.get('csrfToken') : ctx.csrfToken,
			watchlist: ctx.watchlistOption,
			format: 'json'
		};
		if (ctx.changeTags) {
			query.tags = ctx.changeTags;
		}

		if (ctx.watchlistExpiry && ctx.watched !== true) {
			query.watchlistexpiry = ctx.watchlistExpiry;
		}

		if (typeof ctx.pageSection === 'number') {
			query.section = ctx.pageSection;
		}

		// Set minor edit attribute. If these parameters are present with any value, it is interpreted as true
		if (ctx.minorEdit) {
			query.minor = true;
		} else {
			query.notminor = true;  // force Twinkle config to override user preference setting for "all edits are minor"
		}

		// Set bot edit attribute. If this paramter is present with any value, it is interpreted as true
		if (ctx.botEdit) {
			query.bot = true;
		}

		switch (ctx.editMode) {
			case 'append':
				if (ctx.appendText === null) {
					ctx.statusElement.error('Internal error: append text not set before save!');
					ctx.onSaveFailure(this);
					return;
				}
				query.appendtext = ctx.appendText;  // use mode to append to current page contents
				break;
			case 'prepend':
				if (ctx.prependText === null) {
					ctx.statusElement.error('Internal error: prepend text not set before save!');
					ctx.onSaveFailure(this);
					return;
				}
				query.prependtext = ctx.prependText;  // use mode to prepend to current page contents
				break;
			case 'new':
				if (!ctx.newSectionText) { // API doesn't allow empty new section text
					ctx.statusElement.error('Internal error: new section text not set before save!');
					ctx.onSaveFailure(this);
					return;
				}
				query.section = 'new';
				query.text = ctx.newSectionText;  // add a new section to current page
				query.sectiontitle = ctx.newSectionTitle || ctx.editSummary; // done by the API, but non-'' values would get treated as text
				break;
			case 'revert':
				query.undo = ctx.revertCurID;
				query.undoafter = ctx.revertOldID;
				if (ctx.lastEditTime) {
					query.basetimestamp = ctx.lastEditTime; // check that page hasn't been edited since it was loaded
				}
				query.starttimestamp = ctx.loadTime; // check that page hasn't been deleted since it was loaded (don't recreate bad stuff)
				break;
			default: // 'all'
				query.text = ctx.pageText; // replace entire contents of the page
				if (ctx.lastEditTime) {
					query.basetimestamp = ctx.lastEditTime; // check that page hasn't been edited since it was loaded
				}
				query.starttimestamp = ctx.loadTime; // check that page hasn't been deleted since it was loaded (don't recreate bad stuff)
				break;
		}

		if (['recreate', 'createonly', 'nocreate'].indexOf(ctx.createOption) !== -1) {
			query[ctx.createOption] = '';
		}

		if (canUseMwUserToken && ctx.followRedirect) {
			query.redirect = true;
		}

		ctx.saveApi = new MorebitsGlobal.wiki.api('Saving page...', query, fnSaveSuccess, ctx.statusElement, fnSaveError);
		ctx.saveApi.setParent(this);
		ctx.saveApi.post();
	};

	/**
	 * Adds the text provided via `setAppendText()` to the end of the
	 * page.  Does not require calling `load()` first, unless a watchlist
	 * expiry is used.
	 *
	 * @param {Function} [onSuccess] - Callback function which is called when the method has succeeded.
	 * @param {Function} [onFailure] - Callback function which is called when the method fails.
	 */
	this.append = function(onSuccess, onFailure) {
		ctx.editMode = 'append';

		if (fnCanUseMwUserToken('edit')) {
			this.save(onSuccess, onFailure);
		} else {
			ctx.onSaveSuccess = onSuccess;
			ctx.onSaveFailure = onFailure || emptyFunction;
			this.load(fnAutoSave, ctx.onSaveFailure);
		}
	};

	/**
	 * Adds the text provided via `setPrependText()` to the start of the
	 * page.  Does not require calling `load()` first, unless a watchlist
	 * expiry is used.
	 *
	 * @param {Function}  [onSuccess] - Callback function which is called when the method has succeeded.
	 * @param {Function}  [onFailure] - Callback function which is called when the method fails.
	 */
	this.prepend = function(onSuccess, onFailure) {
		ctx.editMode = 'prepend';

		if (fnCanUseMwUserToken('edit')) {
			this.save(onSuccess, onFailure);
		} else {
			ctx.onSaveSuccess = onSuccess;
			ctx.onSaveFailure = onFailure || emptyFunction;
			this.load(fnAutoSave, ctx.onSaveFailure);
		}
	};

	/**
	 * Creates a new section with the text provided by `setNewSectionText()`
	 * and section title from `setNewSectionTitle()`.
	 * If `editSummary` is provided, that will be used instead of the
	 * autogenerated "->Title (new section" edit summary.
	 * Does not require calling `load()` first, unless a watchlist expiry
	 * is used.
	 *
	 * @param {Function}  [onSuccess] - Callback function which is called when the method has succeeded.
	 * @param {Function}  [onFailure] - Callback function which is called when the method fails.
	 */
	this.newSection = function(onSuccess, onFailure) {
		ctx.editMode = 'new';

		if (fnCanUseMwUserToken('edit')) {
			this.save(onSuccess, onFailure);
		} else {
			ctx.onSaveSuccess = onSuccess;
			ctx.onSaveFailure = onFailure || emptyFunction;
			this.load(fnAutoSave, ctx.onSaveFailure);
		}
	};

	/** @returns {string} The name of the loaded page, including the namespace */
	this.getPageName = function() {
		return ctx.pageName;
	};

	/** @returns {string} The text of the page after a successful load() */
	this.getPageText = function() {
		return ctx.pageText;
	};

	/** @param {string} pageText - Updated page text that will be saved when `save()` is called */
	this.setPageText = function(pageText) {
		ctx.editMode = 'all';
		ctx.pageText = pageText;
	};

	/** @param {string} appendText - Text that will be appended to the page when `append()` is called */
	this.setAppendText = function(appendText) {
		ctx.editMode = 'append';
		ctx.appendText = appendText;
	};

	/** @param {string} prependText - Text that will be prepended to the page when `prepend()` is called */
	this.setPrependText = function(prependText) {
		ctx.editMode = 'prepend';
		ctx.prependText = prependText;
	};

	/** @param {string} newSectionText - Text that will be added in a new section on the page when `newSection()` is called */
	this.setNewSectionText = function(newSectionText) {
		ctx.editMode = 'new';
		ctx.newSectionText = newSectionText;
	};

	/**
	 * @param {string} newSectionTitle - Title for the new section created when `newSection()` is called
	 * If missing, `ctx.editSummary` will be used. Issues may occur if a substituted template is used.
	 */
	this.setNewSectionTitle = function(newSectionTitle) {
		ctx.editMode = 'new';
		ctx.newSectionTitle = newSectionTitle;
	};



	// Edit-related setter methods:
	/**
	 * Set the edit summary that will be used when `save()` is called.
	 * Unnecessary if editMode is 'new' and newSectionTitle is provided.
	 *
	 * @param {string} summary
	 */
	this.setEditSummary = function(summary) {
		ctx.editSummary = summary;
	};

	/**
	 * Set any custom tag(s) to be applied to the API action.
	 * A number of actions don't support it, most notably watch, review,
	 * and stabilize ({@link https://phabricator.wikimedia.org/T247721|T247721}), and
	 * pagetriageaction ({@link https://phabricator.wikimedia.org/T252980|T252980}).
	 *
	 * @param {string|string[]} tags - String or array of tag(s).
	 */
	this.setChangeTags = function(tags) {
		ctx.changeTags = tags;
	};


	/**
	 * @param {string} [createOption=null] - Can take the following four values:
	 * - recreate: create the page if it does not exist, or edit it if it exists.
	 * - createonly: create the page if it does not exist, but return an
	 * error if it already exists.
	 * - nocreate: don't create the page, only edit it if it already exists.
	 * - `null`: create the page if it does not exist, unless it was deleted
	 * in the moment between loading the page and saving the edit (default).
	 *
	 */
	this.setCreateOption = function(createOption) {
		ctx.createOption = createOption;
	};

	/** @param {boolean} minorEdit - Set true to mark the edit as a minor edit. */
	this.setMinorEdit = function(minorEdit) {
		ctx.minorEdit = minorEdit;
	};

	/** @param {boolean} botEdit - Set true to mark the edit as a bot edit */
	this.setBotEdit = function(botEdit) {
		ctx.botEdit = botEdit;
	};

	/**
	 * @param {number} pageSection - Integer specifying the section number to load or save.
	 * If specified as `null`, the entire page will be retrieved.
	 */
	this.setPageSection = function(pageSection) {
		ctx.pageSection = pageSection;
	};

	/**
	 * @param {number} maxConflictRetries - Number of retries for save errors involving an edit conflict or
	 * loss of token. Default: 2.
	 */
	this.setMaxConflictRetries = function(maxConflictRetries) {
		ctx.maxConflictRetries = maxConflictRetries;
	};

	/**
	 * @param {number} maxRetries - Number of retries for save errors not involving an edit conflict or
	 * loss of token. Default: 2.
	 */
	this.setMaxRetries = function(maxRetries) {
		ctx.maxRetries = maxRetries;
	};

	/**
	 * @param {boolean|string} [watchlistOption=false] -
	 * Basically a mix of MW API and Twinkley options available pre-expiry:
	 * - `true`|`'yes'`: page will be added to the user's watchlist when the action is called
	 * - `false`|`'no'`|`'nochange'`: watchlist status of the page will not be changed.
	 * - `'default'`|`'preferences'`: watchlist status of the page will
	 * be set based on the user's preference settings when the action is
	 * called.  Ignores ability of default + expiry.
	 * - `'unwatch'`: explicitly unwatch the page
	 * - {string|number}: watch page until the specified time (relative or absolute datestring)
	 */
	this.setWatchlist = function(watchlistOption) {
		if (!watchlistOption || watchlistOption === 'no' || watchlistOption === 'nochange') {
			ctx.watchlistOption = 'nochange';
		} else if (watchlistOption === 'default' || watchlistOption === 'preferences') {
			ctx.watchlistOption = 'preferences';
		} else if (watchlistOption === 'unwatch') {
			ctx.watchlistOption = 'unwatch';
		} else {
			ctx.watchlistOption = 'watch';
			if (typeof watchlistOption === 'number' || (typeof watchlistOption === 'string' && watchlistOption !== 'yes')) {
				ctx.watchlistExpiry = watchlistOption;
			}
		}
	};

	/**
	 * Set an expiry. setWatchlist can handle this by itself if passed a
	 * string, so this is here largely for completeness and compatibility.
	 *
	 * @param {string} watchlistExpiry - A date-like string or array of strings
	 * Can be relative (2 weeks) or other similarly date-like (i.e. NOT "potato"):
	 * ISO 8601: 2038-01-09T03:14:07Z
	 * MediaWiki: 20380109031407
	 * UNIX: 2147483647
	 * SQL: 2038-01-09 03:14:07
	 * Can also be `infinity` or infinity-like (`infinite`, `indefinite`, and `never`).
	 * See {@link https://phabricator.wikimedia.org/source/mediawiki-libs-Timestamp/browse/master/src/ConvertibleTimestamp.php;4e53b859a9580c55958078f46dd4f3a44d0fcaa0$57-109?as=source&blame=off}
	 */
	this.setWatchlistExpiry = function(watchlistExpiry) {
		ctx.watchlistExpiry = watchlistExpiry;
	};

	/**
	 * @deprecated As of December 2020, use setWatchlist.
	 * @param {boolean} [watchlistOption=false] -
	 * - `True`: page watchlist status will be set based on the user's
	 * preference settings when `save()` is called.
	 * - `False`: watchlist status of the page will not be changed.
	 *
	 * Watchlist notes:
	 * 1. The MediaWiki API value of 'unwatch', which explicitly removes
	 * the page from the user's watchlist, is not used.
	 * 2. If both `setWatchlist()` and `setWatchlistFromPreferences()` are
	 * called, the last call takes priority.
	 * 3. Twinkle modules should use the appropriate preference to set the watchlist options.
	 * 4. Most Twinkle modules use `setWatchlist()`. `setWatchlistFromPreferences()`
	 * is only needed for the few Twinkle watchlist preferences that
	 * accept a string value of `default`.
	 */
	this.setWatchlistFromPreferences = function(watchlistOption) {
		console.warn('NOTE: MorebitsGlobal.wiki.page.setWatchlistFromPreferences was deprecated December 2020, please use setWatchlist'); // eslint-disable-line no-console
		if (watchlistOption) {
			ctx.watchlistOption = 'preferences';
		} else {
			ctx.watchlistOption = 'nochange';
		}
	};

	/**
	 * @param {boolean} [followRedirect=false] -
	 * - `true`: a maximum of one redirect will be followed. In the event
	 * of a redirect, a message is displayed to the user and the redirect
	 * target can be retrieved with getPageName().
	 * - `false`: (default) the requested pageName will be used without regard to any redirect.
	 * @param {boolean} [followCrossNsRedirect=true] - Not applicable if `followRedirect` is not set true.
	 * - `true`: (default) follow redirect even if it is a cross-namespace redirect
	 * - `false`: don't follow redirect if it is cross-namespace, edit the redirect itself.
	 */
	this.setFollowRedirect = function(followRedirect, followCrossNsRedirect) {
		if (ctx.pageLoaded) {
			ctx.statusElement.error('Internal error: cannot change redirect setting after the page has been loaded!');
			return;
		}
		ctx.followRedirect = followRedirect;
		ctx.followCrossNsRedirect = typeof followCrossNsRedirect !== 'undefined' ? followCrossNsRedirect : ctx.followCrossNsRedirect;
	};

	// lookup-creation setter function
	/**
	 * @param {boolean} flag - If set true, the author and timestamp of
	 * the first non-redirect version of the page is retrieved.
	 *
	 * Warning:
	 * 1. If there are no revisions among the first 50 that are
	 * non-redirects, or if there are less 50 revisions and all are
	 * redirects, the original creation is retrived.
	 * 2. Revisions that the user is not privileged to access
	 * (revdeled/suppressed) will be treated as non-redirects.
	 * 3. Must not be used when the page has a non-wikitext contentmodel
	 * such as Modulespace Lua or user JavaScript/CSS.
	 */
	this.setLookupNonRedirectCreator = function(flag) {
		ctx.lookupNonRedirectCreator = flag;
	};

	// Move-related setter functions
	/** @param {string} destination */
	this.setMoveDestination = function(destination) {
		ctx.moveDestination = destination;
	};

	/** @param {boolean} flag */
	this.setMoveTalkPage = function(flag) {
		ctx.moveTalkPage = !!flag;
	};

	/** @param {boolean} flag */
	this.setMoveSubpages = function(flag) {
		ctx.moveSubpages = !!flag;
	};

	/** @param {boolean} flag */
	this.setMoveSuppressRedirect = function(flag) {
		ctx.moveSuppressRedirect = !!flag;
	};

	// Protect-related setter functions
	/**
	 * @param {string} level - The right required for the specific action
	 * e.g. autoconfirmed, sysop, templateeditor, extendedconfirmed
	 * (enWiki-only).
	 * @param {string} [expiry=infinity]
	 */
	this.setEditProtection = function(level, expiry) {
		ctx.protectEdit = { level: level, expiry: expiry || 'infinity' };
	};

	this.setMoveProtection = function(level, expiry) {
		ctx.protectMove = { level: level, expiry: expiry || 'infinity' };
	};

	this.setCreateProtection = function(level, expiry) {
		ctx.protectCreate = { level: level, expiry: expiry || 'infinity' };
	};

	this.setCascadingProtection = function(flag) {
		ctx.protectCascade = !!flag;
	};

	this.suppressProtectWarning = function() {
		ctx.suppressProtectWarning = true;
	};

	// Revert-related getters/setters:
	this.setOldID = function(oldID) {
		ctx.revertOldID = oldID;
	};

	/** @returns {string} The current revision ID of the page */
	this.getCurrentID = function() {
		return ctx.revertCurID;
	};

	/** @returns {string} Last editor of the page */
	this.getRevisionUser = function() {
		return ctx.revertUser;
	};

	/** @returns {string} ISO 8601 timestamp at which the page was last edited. */
	this.getLastEditTime = function() {
		return ctx.lastEditTime;
	};

	// Miscellaneous getters/setters:

	/**
	 * Define an object for use in a callback function.
	 *
	 * `callbackParameters` is for use by the caller only. The parameters
	 * allow a caller to pass the proper context into its callback
	 * function.  Callers must ensure that any changes to the
	 * callbackParameters object within a `load()` callback still permit a
	 * proper re-entry into the `load()` callback if an edit conflict is
	 * detected upon calling `save()`.
	 *
	 * @param {object} callbackParameters
	 */
	this.setCallbackParameters = function(callbackParameters) {
		ctx.callbackParameters = callbackParameters;
	};

	/**
	 * @returns {object} - The object previously set by `setCallbackParameters()`.
	 */
	this.getCallbackParameters = function() {
		return ctx.callbackParameters;
	};

	/**
	 * @param {MorebitsGlobal.status} statusElement
	 */
	this.setStatusElement = function(statusElement) {
		ctx.statusElement = statusElement;
	};

	/**
	 * @returns {MorebitsGlobal.status} Status element created by the constructor.
	 */
	this.getStatusElement = function() {
		return ctx.statusElement;
	};

	/**
	 * @param {string} level - The right required for edits not to require
	 * review. Possible options: none, autoconfirmed, review (not on enWiki).
	 * @param {string} [expiry=infinity]
	 */
	this.setFlaggedRevs = function(level, expiry) {
		ctx.flaggedRevs = { level: level, expiry: expiry || 'infinity' };
	};

	/**
	 * @returns {boolean} True if the page existed on the wiki when it was last loaded.
	 */
	this.exists = function() {
		return ctx.pageExists;
	};

	/**
	 * @returns {string} Page ID of the page loaded. 0 if the page doesn't
	 * exist.
	 */
	this.getPageID = function() {
		return ctx.pageID;
	};

	/**
	 * @returns {string} - Content model of the page.  Possible values
	 * include (but may not be limited to): `wikitext`, `javascript`,
	 * `css`, `json`, `Scribunto`, `sanitized-css`, `MassMessageListContent`.
	 * Also gettable via `mw.config.get('wgPageContentModel')`.
	 */
	this.getContentModel = function() {
		return ctx.contentModel;
	};

	/**
	 * @returns {boolean|string} - Watched status of the page. Boolean
	 * unless it's being watched temporarily, in which case returns the
	 * expiry string.
	 */
	this.getWatched = function () {
		return ctx.watched;
	};

	/**
	 * @returns {string} ISO 8601 timestamp at which the page was last loaded.
	 */
	this.getLoadTime = function() {
		return ctx.loadTime;
	};

	/**
	 * @returns {string} The user who created the page following `lookupCreation()`.
	 */
	this.getCreator = function() {
		return ctx.creator;
	};

	/**
	 * @returns {string} The ISOString timestamp of page creation following `lookupCreation()`.
	 */
	this.getCreationTimestamp = function() {
		return ctx.timestamp;
	};

	/** @returns {boolean} whether or not you can edit the page */
	this.canEdit = function() {
		return !!ctx.testActions && ctx.testActions.indexOf('edit') !== -1;
	};

	/**
	 * Retrieves the username of the user who created the page as well as
	 * the timestamp of creation.  The username can be retrieved using the
	 * `getCreator()` function; the timestamp can be retrieved using the
	 * `getCreationTimestamp()` function.
	 * Prior to June 2019 known as `lookupCreator()`.
	 *
	 * @param {Function} onSuccess - Callback function to be called when
	 * the username and timestamp are found within the callback.
	 * @param {Function} [onFailure] - Callback function to be called when
	 * the lookup fails
	 */
	this.lookupCreation = function(onSuccess, onFailure) {
		ctx.onLookupCreationSuccess = onSuccess;
		ctx.onLookupCreationFailure = onFailure || emptyFunction;
		if (!onSuccess) {
			ctx.statusElement.error('Internal error: no onSuccess callback provided to lookupCreation()!');
			ctx.onLookupCreationFailure(this);
			return;
		}

		var query = {
			action: 'query',
			prop: 'revisions',
			titles: ctx.pageName,
			rvlimit: 1,
			rvprop: 'user|timestamp',
			rvdir: 'newer',
			format: 'json'
		};

		// Only the wikitext content model can reliably handle
		// rvsection, others return an error when paired with the
		// content rvprop. Relatedly, non-wikitext models don't
		// understand the #REDIRECT concept, so we shouldn't attempt
		// the redirect resolution in fnLookupCreationSuccess
		if (ctx.lookupNonRedirectCreator) {
			query.rvsection = 0;
			query.rvprop += '|content';
		}

		if (ctx.followRedirect) {
			query.redirects = '';  // follow all redirects
		}

		ctx.lookupCreationApi = new MorebitsGlobal.wiki.api('Retrieving page creation information', query, fnLookupCreationSuccess, ctx.statusElement, ctx.onLookupCreationFailure);
		ctx.lookupCreationApi.setParent(this);
		ctx.lookupCreationApi.post();
	};

	/**
	 * Reverts a page to `revertOldID` set by `setOldID`.
	 *
	 * @param {Function} [onSuccess] - Callback function to run on success.
	 * @param {Function} [onFailure] - Callback function to run on failure.
	 */
	this.revert = function(onSuccess, onFailure) {
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure || emptyFunction;

		if (!ctx.revertOldID) {
			ctx.statusElement.error('Internal error: revision ID to revert to was not set before revert!');
			ctx.onSaveFailure(this);
			return;
		}

		ctx.editMode = 'revert';
		this.load(fnAutoSave, ctx.onSaveFailure);
	};

	/**
	 * Moves a page to another title.
	 *
	 * @param {Function} [onSuccess] - Callback function to run on success.
	 * @param {Function} [onFailure] - Callback function to run on failure.
	 */
	this.move = function(onSuccess, onFailure) {
		ctx.onMoveSuccess = onSuccess;
		ctx.onMoveFailure = onFailure || emptyFunction;

		if (!fnPreflightChecks.call(this, 'move', ctx.onMoveFailure)) {
			return; // abort
		}

		if (!ctx.moveDestination) {
			ctx.statusElement.error('Internal error: destination page name was not set before move!');
			ctx.onMoveFailure(this);
			return;
		}

		if (fnCanUseMwUserToken('move')) {
			fnProcessMove.call(this, this);
		} else {
			var query = fnNeedTokenInfoQuery('move');

			ctx.moveApi = new MorebitsGlobal.wiki.api('retrieving token...', query, fnProcessMove, ctx.statusElement, ctx.onMoveFailure);
			ctx.moveApi.setParent(this);
			ctx.moveApi.post();
		}
	};

	/**
	 * Marks the page as patrolled, using `rcid` (if available) or `revid`.
	 *
	 * Patrolling as such doesn't need to rely on loading the page in
	 * question; simply passing a revid to the API is sufficient, so in
	 * those cases just using {@link MorebitsGlobal.wiki.api} is probably preferable.
	 *
	 * No error handling since we don't actually care about the errors.
	 */
	this.patrol = function() {
		if (!MorebitsGlobal.userIsSysop && !MorebitsGlobal.userIsInGroup('patroller')) {
			return;
		}

		// If a link is present, don't need to check if it's patrolled
		if ($('.patrollink').length) {
			var patrolhref = $('.patrollink a').attr('href');
			ctx.rcid = mw.util.getParamValue('rcid', patrolhref);
			fnProcessPatrol(this, this);
		} else {
			var patrolQuery = {
				action: 'query',
				prop: 'info',
				meta: 'tokens',
				type: 'patrol', // as long as we're querying, might as well get a token
				list: 'recentchanges', // check if the page is unpatrolled
				titles: ctx.pageName,
				rcprop: 'patrolled',
				rctitle: ctx.pageName,
				rclimit: 1,
				format: 'json'
			};

			ctx.patrolApi = new MorebitsGlobal.wiki.api('retrieving token...', patrolQuery, fnProcessPatrol);
			ctx.patrolApi.setParent(this);
			ctx.patrolApi.post();
		}
	};

	/**
	 * Marks the page as reviewed by the PageTriage extension.
	 *
	 * Will, by it's nature, mark as patrolled as well. Falls back to
	 * patrolling if not in an appropriate namespace.
	 *
	 * Doesn't inherently rely on loading the page in question; simply
	 * passing a `pageid` to the API is sufficient, so in those cases just
	 * using {@link MorebitsGlobal.wiki.api} is probably preferable.
	 *
	 * Will first check if the page is queued via
	 * {@link MorebitsGlobal.wiki.page~fnProcessTriageList|fnProcessTriageList}.
	 *
	 * No error handling since we don't actually care about the errors.
	 *
	 * @see {@link https://www.mediawiki.org/wiki/Extension:PageTriage} Referred to as "review" on-wiki.
	 */
	this.triage = function() {
		// Fall back to patrol if not a valid triage namespace
		if (mw.config.get('pageTriageNamespaces').indexOf(new mw.Title(ctx.pageName).getNamespaceId()) === -1) {
			this.patrol();
		} else {
			if (!MorebitsGlobal.userIsSysop && !MorebitsGlobal.userIsInGroup('patroller')) {
				return;
			}

			// If on the page in question, don't need to query for page ID
			if (new mw.Title(MorebitsGlobal.pageNameNorm).getPrefixedText() === new mw.Title(ctx.pageName).getPrefixedText()) {
				ctx.pageID = mw.config.get('wgArticleId');
				fnProcessTriageList(this, this);
			} else {
				var query = fnNeedTokenInfoQuery('triage');

				ctx.triageApi = new MorebitsGlobal.wiki.api('retrieving token...', query, fnProcessTriageList);
				ctx.triageApi.setParent(this);
				ctx.triageApi.post();
			}
		}
	};

	// |delete| is a reserved word in some flavours of JS
	/**
	 * Deletes a page (for admins only).
	 *
	 * @param {Function} [onSuccess] - Callback function to run on success.
	 * @param {Function} [onFailure] - Callback function to run on failure.
	 */
	this.deletePage = function(onSuccess, onFailure) {
		ctx.onDeleteSuccess = onSuccess;
		ctx.onDeleteFailure = onFailure || emptyFunction;

		if (!fnPreflightChecks.call(this, 'delete', ctx.onDeleteFailure)) {
			return; // abort
		}

		if (fnCanUseMwUserToken('delete')) {
			fnProcessDelete.call(this, this);
		} else {
			var query = fnNeedTokenInfoQuery('delete');

			ctx.deleteApi = new MorebitsGlobal.wiki.api('retrieving token...', query, fnProcessDelete, ctx.statusElement, ctx.onDeleteFailure);
			ctx.deleteApi.setParent(this);
			ctx.deleteApi.post();
		}
	};

	/**
	 * Undeletes a page (for admins only).
	 *
	 * @param {Function} [onSuccess] - Callback function to run on success.
	 * @param {Function} [onFailure] - Callback function to run on failure.
	 */
	this.undeletePage = function(onSuccess, onFailure) {
		ctx.onUndeleteSuccess = onSuccess;
		ctx.onUndeleteFailure = onFailure || emptyFunction;

		if (!fnPreflightChecks.call(this, 'undelete', ctx.onUndeleteFailure)) {
			return; // abort
		}

		if (fnCanUseMwUserToken('undelete')) {
			fnProcessUndelete.call(this, this);
		} else {
			var query = fnNeedTokenInfoQuery('undelete');

			ctx.undeleteApi = new MorebitsGlobal.wiki.api('retrieving token...', query, fnProcessUndelete, ctx.statusElement, ctx.onUndeleteFailure);
			ctx.undeleteApi.setParent(this);
			ctx.undeleteApi.post();
		}
	};

	/**
	 * Protects a page (for admins only).
	 *
	 * @param {Function} [onSuccess] - Callback function to run on success.
	 * @param {Function} [onFailure] - Callback function to run on failure.
	 */
	this.protect = function(onSuccess, onFailure) {
		ctx.onProtectSuccess = onSuccess;
		ctx.onProtectFailure = onFailure || emptyFunction;

		if (!fnPreflightChecks.call(this, 'protect', ctx.onProtectFailure)) {
			return; // abort
		}

		if (!ctx.protectEdit && !ctx.protectMove && !ctx.protectCreate) {
			ctx.statusElement.error('Internal error: you must set edit and/or move and/or create protection before calling protect()!');
			ctx.onProtectFailure(this);
			return;
		}

		// because of the way MW API interprets protection levels
		// (absolute, not differential), we always need to request
		// protection levels from the server
		var query = fnNeedTokenInfoQuery('protect');

		ctx.protectApi = new MorebitsGlobal.wiki.api('retrieving token...', query, fnProcessProtect, ctx.statusElement, ctx.onProtectFailure);
		ctx.protectApi.setParent(this);
		ctx.protectApi.post();
	};

	/**
	 * Apply FlaggedRevs protection settings.  Only works on wikis where
	 * the extension is installed (`$wgFlaggedRevsProtection = true`
	 * i.e. where FlaggedRevs settings appear on the "protect" tab).
	 *
	 * @see {@link https://www.mediawiki.org/wiki/Extension:FlaggedRevs}
	 * Referred to as "pending changes" on-wiki.
	 *
	 * @param {Function} [onSuccess]
	 * @param {Function} [onFailure]
	 */
	this.stabilize = function(onSuccess, onFailure) {
		ctx.onStabilizeSuccess = onSuccess;
		ctx.onStabilizeFailure = onFailure || emptyFunction;

		if (!fnPreflightChecks.call(this, 'FlaggedRevs', ctx.onStabilizeFailure)) {
			return; // abort
		}

		if (!ctx.flaggedRevs) {
			ctx.statusElement.error('Internal error: you must set flaggedRevs before calling stabilize()!');
			ctx.onStabilizeFailure(this);
			return;
		}

		if (fnCanUseMwUserToken('stabilize')) {
			fnProcessStabilize.call(this, this);
		} else {
			var query = fnNeedTokenInfoQuery('stabilize');

			ctx.stabilizeApi = new MorebitsGlobal.wiki.api('retrieving token...', query, fnProcessStabilize, ctx.statusElement, ctx.onStabilizeFailure);
			ctx.stabilizeApi.setParent(this);
			ctx.stabilizeApi.post();
		}
	};

	/*
	 * Private member functions
	 * These are not exposed outside
	 */

	/**
	 * Determines whether we can save an API call by using the csrf token
	 * sent with the page HTML, or whether we need to ask the server for
	 * more info (e.g. protection or watchlist expiry).
	 *
	 * Currently used for `append`, `prepend`, `newSection`, `move`,
	 * `stabilize`, `deletePage`, and `undeletePage`. Not used for
	 * `protect` since it always needs to request protection status.
	 *
	 * @param {string} [action=edit] - The action being undertaken, e.g.
	 * "edit" or "delete". In practice, only "edit" or "notedit" matters.
	 * @returns {boolean}
	 */
	var fnCanUseMwUserToken = function(action) {
		action = typeof action !== 'undefined' ? action : 'edit'; // IE doesn't support default parameters

		// If a watchlist expiry is set, we must always load the page
		// to avoid overwriting indefinite protection
		if (ctx.watchlistExpiry) {
			return false;
		}

		// API-based redirect resolution only works for action=query and
		// action=edit in append/prepend/new modes
		if (ctx.followRedirect) {
			if (!ctx.followCrossNsRedirect) {
				return false; // must load the page to check for cross namespace redirects
			}
			if (action !== 'edit' || (ctx.editMode === 'all' || ctx.editMode === 'revert')) {
				return false;
			}
		}

		// do we need to fetch the edit protection expiry?
		if (MorebitsGlobal.userIsSysop && !ctx.suppressProtectWarning) {
			if (new mw.Title(MorebitsGlobal.pageNameNorm).getPrefixedText() !== new mw.Title(ctx.pageName).getPrefixedText()) {
				return false;
			}

			// wgRestrictionEdit is null on non-existent pages,
			// so this neatly handles nonexistent pages
			var editRestriction = mw.config.get('wgRestrictionEdit');
			if (!editRestriction || editRestriction.indexOf('sysop') !== -1) {
				return false;
			}
		}

		return !!mw.user.tokens.get('csrfToken');
	};

	/**
	 * When functions can't use
	 * {@link MorebitsGlobal.wiki.page~fnCanUseMwUserToken|fnCanUseMwUserToken}
	 * or require checking protection or watched status, maintain the query
	 * in one place. Used for {@link MorebitsGlobal.wiki.page#deletePage|delete},
	 * {@link MorebitsGlobal.wiki.page#undeletePage|undelete},
	 * {@link* MorebitsGlobal.wiki.page#protect|protect},
	 * {@link MorebitsGlobal.wiki.page#stabilize|stabilize},
	 * and {@link MorebitsGlobal.wiki.page#move|move}
	 * (basically, just not {@link MorebitsGlobal.wiki.page#load|load}).
	 *
	 * @param {string} action - The action being undertaken, e.g. "edit" or
	 * "delete".
	 * @returns {object} Appropriate query.
	 */
	var fnNeedTokenInfoQuery = function(action) {
		var query = {
			action: 'query',
			meta: 'tokens',
			type: 'csrf',
			titles: ctx.pageName,
			prop: 'info',
			inprop: 'watched',
			format: 'json'
		};
		// Protection not checked for flagged-revs or non-sysop moves
		if (action !== 'stabilize' && (action !== 'move' || MorebitsGlobal.userIsSysop)) {
			query.inprop += '|protection';
		}
		if (ctx.followRedirect && action !== 'undelete') {
			query.redirects = ''; // follow all redirects
		}
		return query;
	};

	// callback from loadSuccess() for append(), prepend(), and newSection() threads
	var fnAutoSave = function(pageobj) {
		pageobj.save(ctx.onSaveSuccess, ctx.onSaveFailure);
	};

	// callback from loadApi.post()
	var fnLoadSuccess = function() {
		var response = ctx.loadApi.getResponse().query;

		if (!fnCheckPageName(response, ctx.onLoadFailure)) {
			return; // abort
		}

		var page = response.pages[0], rev;
		ctx.pageExists = !page.missing;
		if (ctx.pageExists) {
			rev = page.revisions[0];
			ctx.lastEditTime = rev.timestamp;
			ctx.pageText = rev.content;
			ctx.pageID = page.pageid;
		} else {
			ctx.pageText = '';  // allow for concatenation, etc.
			ctx.pageID = 0; // nonexistent in response, matches wgArticleId
		}
		ctx.csrfToken = response.tokens.csrftoken;
		if (!ctx.csrfToken) {
			ctx.statusElement.error('Failed to retrieve edit token.');
			ctx.onLoadFailure(this);
			return;
		}
		ctx.loadTime = ctx.loadApi.getResponse().curtimestamp;
		if (!ctx.loadTime) {
			ctx.statusElement.error('Failed to retrieve current timestamp.');
			ctx.onLoadFailure(this);
			return;
		}

		ctx.contentModel = page.contentmodel;
		ctx.watched = page.watchlistexpiry || page.watched;

		// extract protection info, to alert admins when they are about to edit a protected page
		// Includes cascading protection
		if (MorebitsGlobal.userIsSysop) {
			var editProt = page.protection.filter(function(pr) {
				return pr.type === 'edit' && pr.level === 'sysop';
			}).pop();
			if (editProt) {
				ctx.fullyProtected = editProt.expiry;
			} else {
				ctx.fullyProtected = false;
			}
		}

		ctx.revertCurID = page.lastrevid;

		var testactions = page.actions;
		ctx.testActions = []; // was null
		Object.keys(testactions).forEach(function(action) {
			if (testactions[action]) {
				ctx.testActions.push(action);
			}
		});

		if (ctx.editMode === 'revert') {
			ctx.revertCurID = rev && rev.revid;
			if (!ctx.revertCurID) {
				ctx.statusElement.error('Failed to retrieve current revision ID.');
				ctx.onLoadFailure(this);
				return;
			}
			ctx.revertUser = rev && rev.user;
			if (!ctx.revertUser) {
				if (rev && rev.userhidden) {  // username was RevDel'd or oversighted
					ctx.revertUser = '<username hidden>';
				} else {
					ctx.statusElement.error('Failed to retrieve user who made the revision.');
					ctx.onLoadFailure(this);
					return;
				}
			}
			// set revert edit summary
			ctx.editSummary = '[[Help:Revert|Reverted]] to revision ' + ctx.revertOldID + ' by ' + ctx.revertUser + ': ' + ctx.editSummary;
		}

		ctx.pageLoaded = true;

		// alert("Generate edit conflict now");  // for testing edit conflict recovery logic
		ctx.onLoadSuccess(this);  // invoke callback
	};

	// helper function to parse the page name returned from the API
	var fnCheckPageName = function(response, onFailure) {
		if (!onFailure) {
			onFailure = emptyFunction;
		}

		var page = response.pages && response.pages[0];
		if (page) {
			// check for invalid titles
			if (page.invalid) {
				ctx.statusElement.error('The page title is invalid: ' + ctx.pageName);
				onFailure(this);
				return false; // abort
			}

			// retrieve actual title of the page after normalization and redirects
			var resolvedName = page.title;

			if (response.redirects) {
				// check for cross-namespace redirect:
				var origNs = new mw.Title(ctx.pageName).namespace;
				var newNs = new mw.Title(resolvedName).namespace;
				if (origNs !== newNs && !ctx.followCrossNsRedirect) {
					ctx.statusElement.error(ctx.pageName + ' is a cross-namespace redirect to ' + resolvedName + ', aborted');
					onFailure(this);
					return false;
				}

				// only notify user for redirects, not normalization
				new MorebitsGlobal.status('Note', 'Redirected from ' + ctx.pageName + ' to ' + resolvedName);
			}

			ctx.pageName = resolvedName; // update to redirect target or normalized name

		} else {
			// could be a circular redirect or other problem
			ctx.statusElement.error('Could not resolve redirects for: ' + ctx.pageName);
			onFailure(this);

			// force error to stay on the screen
			++MorebitsGlobal.wiki.numberOfActionsLeft;
			return false; // abort
		}
		return true; // all OK
	};

	// callback from saveApi.post()
	var fnSaveSuccess = function() {
		ctx.editMode = 'all';  // cancel append/prepend/newSection/revert modes
		var response = ctx.saveApi.getResponse();

		// see if the API thinks we were successful
		if (response.edit.result === 'Success') {

			// real success
			// default on success action - display link for edited page
			var link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(ctx.pageName));
			link.appendChild(document.createTextNode(ctx.pageName));
			ctx.statusElement.info(['completed (', link, ')']);
			if (ctx.onSaveSuccess) {
				ctx.onSaveSuccess(this);  // invoke callback
			}
			return;
		}

		// errors here are only generated by extensions which hook APIEditBeforeSave within MediaWiki,
		// which as of 1.34.0-wmf.23 (Sept 2019) should only encompass captcha messages
		if (response.edit.captcha) {
			ctx.statusElement.error('Could not save the page because the wiki server wanted you to fill out a CAPTCHA.');
		} else {
			ctx.statusElement.error('Unknown error received from API while saving page');
		}

		// force error to stay on the screen
		++MorebitsGlobal.wiki.numberOfActionsLeft;

		ctx.onSaveFailure(this);
	};

	// callback from saveApi.post()
	var fnSaveError = function() {
		var errorCode = ctx.saveApi.getErrorCode();

		// check for edit conflict
		if (errorCode === 'editconflict' && ctx.conflictRetries++ < ctx.maxConflictRetries) {

			// edit conflicts can occur when the page needs to be purged from the server cache
			var purgeQuery = {
				action: 'purge',
				titles: ctx.pageName  // redirects are already resolved
			};

			var purgeApi = new MorebitsGlobal.wiki.api('Edit conflict detected, purging server cache', purgeQuery, function() {
				--MorebitsGlobal.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds

				ctx.statusElement.info('Edit conflict detected, reapplying edit');
				if (fnCanUseMwUserToken('edit')) {
					ctx.saveApi.post(); // necessarily append, prepend, or newSection, so this should work as desired
				} else {
					ctx.loadApi.post(); // reload the page and reapply the edit
				}
			}, ctx.statusElement);
			purgeApi.post();

		// check for network or server error
		} else if ((errorCode === null || errorCode === undefined) && ctx.retries++ < ctx.maxRetries) {

			// the error might be transient, so try again
			ctx.statusElement.info('Save failed, retrying in 2 seconds ...');
			--MorebitsGlobal.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds

			// wait for sometime for client to regain connnectivity
			sleep(2000).then(function() {
				ctx.saveApi.post(); // give it another go!
			});

		// hard error, give up
		} else {

			switch (errorCode) {

				case 'protectedpage':
					// non-admin attempting to edit a protected page - this gives a friendlier message than the default
					ctx.statusElement.error('Failed to save edit: Page is protected');
					break;

				case 'abusefilter-disallowed':
					ctx.statusElement.error('The edit was disallowed by the edit filter: "' + ctx.saveApi.getResponse().error.abusefilter.description + '".');
					break;

				case 'abusefilter-warning':
					ctx.statusElement.error([ 'A warning was returned by the edit filter: "', ctx.saveApi.getResponse().error.abusefilter.description, '". If you wish to proceed with the edit, please carry it out again. This warning will not appear a second time.' ]);
					// We should provide the user with a way to automatically retry the action if they so choose -
					// I can't see how to do this without creating a UI dependency on MorebitsGlobal.wiki.page though -- TTO
					break;

				case 'spamblacklist':
					// If multiple items are blacklisted, we only return the first
					var spam = ctx.saveApi.getResponse().error.spamblacklist.matches[0];
					ctx.statusElement.error('Could not save the page because the URL ' + spam + ' is on the spam blacklist');
					break;

				default:
					ctx.statusElement.error('Failed to save edit: ' + ctx.saveApi.getErrorText());
			}

			ctx.editMode = 'all';  // cancel append/prepend/newSection/revert modes
			if (ctx.onSaveFailure) {
				ctx.onSaveFailure(this);  // invoke callback
			}
		}
	};

	var fnLookupCreationSuccess = function() {
		var response = ctx.lookupCreationApi.getResponse().query;

		if (!fnCheckPageName(response, ctx.onLookupCreationFailure)) {
			return; // abort
		}

		var rev = response.pages[0].revisions && response.pages[0].revisions[0];
		if (!rev) {
			ctx.statusElement.error('Could not find any revisions of ' + ctx.pageName);
			ctx.onLookupCreationFailure(this);
			return;
		}

		if (!ctx.lookupNonRedirectCreator || !/^\s*#redirect/i.test(rev.content)) {

			ctx.creator = rev.user;
			if (!ctx.creator) {
				ctx.statusElement.error('Could not find name of page creator');
				ctx.onLookupCreationFailure(this);
				return;
			}
			ctx.timestamp = rev.timestamp;
			if (!ctx.timestamp) {
				ctx.statusElement.error('Could not find timestamp of page creation');
				ctx.onLookupCreationFailure(this);
				return;
			}
			ctx.onLookupCreationSuccess(this);

		} else {
			ctx.lookupCreationApi.query.rvlimit = 50; // modify previous query to fetch more revisions
			ctx.lookupCreationApi.query.titles = ctx.pageName; // update pageName if redirect resolution took place in earlier query

			ctx.lookupCreationApi = new MorebitsGlobal.wiki.api('Retrieving page creation information', ctx.lookupCreationApi.query, fnLookupNonRedirectCreator, ctx.statusElement, ctx.onLookupCreationFailure);
			ctx.lookupCreationApi.setParent(this);
			ctx.lookupCreationApi.post();
		}

	};

	var fnLookupNonRedirectCreator = function() {
		var response = ctx.lookupCreationApi.getResponse().query;
		var revs = response.pages[0].revisions;

		for (var i = 0; i < revs.length; i++) {
			if (!/^\s*#redirect/i.test(revs[i].content)) { // inaccessible revisions also check out
				ctx.creator = revs[i].user;
				ctx.timestamp = revs[i].timestamp;
				break;
			}
		}

		if (!ctx.creator) {
			// fallback to give first revision author if no non-redirect version in the first 50
			ctx.creator = revs[0].user;
			ctx.timestamp = revs[0].timestamp;
			if (!ctx.creator) {
				ctx.statusElement.error('Could not find name of page creator');
				ctx.onLookupCreationFailure(this);
				return;
			}

		}
		if (!ctx.timestamp) {
			ctx.statusElement.error('Could not find timestamp of page creation');
			ctx.onLookupCreationFailure(this);
			return;
		}

		ctx.onLookupCreationSuccess(this);

	};

	/**
	 * Common checks for action methods. Used for move, undelete, delete,
	 * protect, stabilize.
	 *
	 * @param {string} action - The action being checked.
	 * @param {string} onFailure - Failure callback.
	 * @returns {boolean}
	 */
	var fnPreflightChecks = function(action, onFailure) {
		// if a non-admin tries to do this, don't bother
		if (!MorebitsGlobal.userIsSysop && action !== 'move') {
			ctx.statusElement.error('Cannot ' + action + 'page : only admins can do that');
			onFailure(this);
			return false;
		}

		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: ' + action + ' reason not set (use setEditSummary function)!');
			onFailure(this);
			return false;
		}
		return true; // all OK
	};

	/**
	 * Common checks for fnProcess functions (`fnProcessDelete`, `fnProcessMove`, etc.
	 * Used for move, undelete, delete, protect, stabilize.
	 *
	 * @param {string} action - The action being checked.
	 * @param {string} onFailure - Failure callback.
	 * @param {string} response - The response document from the API call.
	 * @returns {boolean}
	 */
	var fnProcessChecks = function(action, onFailure, response) {
		var missing = response.pages[0].missing;

		// No undelete as an existing page could have deleted revisions
		var actionMissing = missing && ['delete', 'stabilize', 'move'].indexOf(action) !== -1;
		var protectMissing = action === 'protect' && missing && (ctx.protectEdit || ctx.protectMove);
		var saltMissing = action === 'protect' && !missing && ctx.protectCreate;

		if (actionMissing || protectMissing || saltMissing) {
			ctx.statusElement.error('Cannot ' + action + ' the page because it ' + (missing ? 'no longer' : 'already') + ' exists');
			onFailure(this);
			return false;
		}

		// Delete, undelete, move
		// extract protection info
		var editprot;
		if (action === 'undelete') {
			editprot = response.pages[0].protection.filter(function(pr) {
				return pr.type === 'create' && pr.level === 'sysop';
			}).pop();
		} else if (action === 'delete' || action === 'move') {
			editprot = response.pages[0].protection.filter(function(pr) {
				return pr.type === 'edit' && pr.level === 'sysop';
			}).pop();
		}
		if (editprot && !ctx.suppressProtectWarning &&
			!confirm('You are about to ' + action + ' the fully protected page "' + ctx.pageName +
			(editprot.expiry === 'infinity' ? '" (protected indefinitely)' : '" (protection expiring ' + new MorebitsGlobal.date(editprot.expiry).calendar('utc') + ' (UTC))') +
			'.  \n\nClick OK to proceed with ' + action + ', or Cancel to skip.')) {
			ctx.statusElement.error('Aborted ' + action + ' on fully protected page.');
			onFailure(this);
			return false;
		}

		if (!response.tokens.csrftoken) {
			ctx.statusElement.error('Failed to retrieve token.');
			onFailure(this);
			return false;
		}
		return true; // all OK
	};

	var fnProcessMove = function() {
		var pageTitle, token;

		if (fnCanUseMwUserToken('move')) {
			token = mw.user.tokens.get('csrfToken');
			pageTitle = ctx.pageName;
		} else {
			var response = ctx.moveApi.getResponse().query;

			if (!fnProcessChecks('move', ctx.onMoveFailure, response)) {
				return; // abort
			}

			token = response.tokens.csrftoken;
			var page = response.pages[0];
			pageTitle = page.title;
			ctx.watched = page.watchlistexpiry || page.watched;
		}

		var query = {
			action: 'move',
			from: pageTitle,
			to: ctx.moveDestination,
			token: token,
			reason: ctx.editSummary,
			watchlist: ctx.watchlistOption,
			format: 'json'
		};
		if (ctx.changeTags) {
			query.tags = ctx.changeTags;
		}

		if (ctx.watchlistExpiry && ctx.watched !== true) {
			query.watchlistexpiry = ctx.watchlistExpiry;
		}
		if (ctx.moveTalkPage) {
			query.movetalk = 'true';
		}
		if (ctx.moveSubpages) {
			query.movesubpages = 'true';
		}
		if (ctx.moveSuppressRedirect) {
			query.noredirect = 'true';
		}

		ctx.moveProcessApi = new MorebitsGlobal.wiki.api('moving page...', query, ctx.onMoveSuccess, ctx.statusElement, ctx.onMoveFailure);
		ctx.moveProcessApi.setParent(this);
		ctx.moveProcessApi.post();
	};

	var fnProcessPatrol = function() {
		var query = {
			action: 'patrol',
			format: 'json'
		};

		// Didn't need to load the page
		if (ctx.rcid) {
			query.rcid = ctx.rcid;
			query.token = mw.user.tokens.get('patrolToken');
		} else {
			var response = ctx.patrolApi.getResponse().query;

			// Don't patrol if not unpatrolled
			if (!response.recentchanges[0].unpatrolled) {
				return;
			}

			var lastrevid = response.pages[0].lastrevid;
			if (!lastrevid) {
				return;
			}
			query.revid = lastrevid;

			var token = response.tokens.csrftoken;
			if (!token) {
				return;
			}
			query.token = token;
		}
		if (ctx.changeTags) {
			query.tags = ctx.changeTags;
		}

		var patrolStat = new MorebitsGlobal.status('Marking page as patrolled');

		ctx.patrolProcessApi = new MorebitsGlobal.wiki.api('patrolling page...', query, null, patrolStat);
		ctx.patrolProcessApi.setParent(this);
		ctx.patrolProcessApi.post();
	};

	// Ensure that the page is curatable
	var fnProcessTriageList = function() {
		if (ctx.pageID) {
			ctx.csrfToken = mw.user.tokens.get('csrfToken');
		} else {
			var response = ctx.triageApi.getResponse().query;

			ctx.pageID = response.pages[0].pageid;
			if (!ctx.pageID) {
				return;
			}

			ctx.csrfToken = response.tokens.csrftoken;
			if (!ctx.csrfToken) {
				return;
			}
		}

		var query = {
			action: 'pagetriagelist',
			page_id: ctx.pageID,
			format: 'json'
		};

		ctx.triageProcessListApi = new MorebitsGlobal.wiki.api('checking curation status...', query, fnProcessTriage);
		ctx.triageProcessListApi.setParent(this);
		ctx.triageProcessListApi.post();
	};

	// callback from triageProcessListApi.post()
	var fnProcessTriage = function() {
		var responseList = ctx.triageProcessListApi.getResponse().pagetriagelist;
		// Exit if not in the queue
		if (!responseList || responseList.result !== 'success') {
			return;
		}
		var page = responseList.pages && responseList.pages[0];
		// Do nothing if page already triaged/patrolled
		if (!page || !parseInt(page.patrol_status, 10)) {
			var query = {
				action: 'pagetriageaction',
				pageid: ctx.pageID,
				reviewed: 1,
				// tags: ctx.changeTags, // pagetriage tag support: [[phab:T252980]]
				// Could use an adder to modify/create note:
				// summaryAd, but that seems overwrought
				token: ctx.csrfToken,
				format: 'json'
			};
			var triageStat = new MorebitsGlobal.status('Marking page as curated');
			ctx.triageProcessApi = new MorebitsGlobal.wiki.api('curating page...', query, null, triageStat);
			ctx.triageProcessApi.setParent(this);
			ctx.triageProcessApi.post();
		}
	};

	var fnProcessDelete = function() {
		var pageTitle, token;

		if (fnCanUseMwUserToken('delete')) {
			token = mw.user.tokens.get('csrfToken');
			pageTitle = ctx.pageName;
		} else {
			var response = ctx.deleteApi.getResponse().query;

			if (!fnProcessChecks('delete', ctx.onDeleteFailure, response)) {
				return; // abort
			}

			token = response.tokens.csrftoken;
			var page = response.pages[0];
			pageTitle = page.title;
			ctx.watched = page.watchlistexpiry || page.watched;
		}

		var query = {
			action: 'delete',
			title: pageTitle,
			token: token,
			reason: ctx.editSummary,
			watchlist: ctx.watchlistOption,
			format: 'json'
		};
		if (ctx.changeTags) {
			query.tags = ctx.changeTags;
		}

		if (ctx.watchlistExpiry && ctx.watched !== true) {
			query.watchlistexpiry = ctx.watchlistExpiry;
		}

		ctx.deleteProcessApi = new MorebitsGlobal.wiki.api('deleting page...', query, ctx.onDeleteSuccess, ctx.statusElement, fnProcessDeleteError);
		ctx.deleteProcessApi.setParent(this);
		ctx.deleteProcessApi.post();
	};

	// callback from deleteProcessApi.post()
	var fnProcessDeleteError = function() {

		var errorCode = ctx.deleteProcessApi.getErrorCode();

		// check for "Database query error"
		if (errorCode === 'internal_api_error_DBQueryError' && ctx.retries++ < ctx.maxRetries) {
			ctx.statusElement.info('Database query error, retrying');
			--MorebitsGlobal.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			ctx.deleteProcessApi.post(); // give it another go!

		} else if (errorCode === 'missingtitle') {
			ctx.statusElement.error('Cannot delete the page, because it no longer exists');
			if (ctx.onDeleteFailure) {
				ctx.onDeleteFailure.call(this, ctx.deleteProcessApi);  // invoke callback
			}
		// hard error, give up
		} else {
			ctx.statusElement.error('Failed to delete the page: ' + ctx.deleteProcessApi.getErrorText());
			if (ctx.onDeleteFailure) {
				ctx.onDeleteFailure.call(this, ctx.deleteProcessApi);  // invoke callback
			}
		}
	};

	var fnProcessUndelete = function() {
		var pageTitle, token;

		if (fnCanUseMwUserToken('undelete')) {
			token = mw.user.tokens.get('csrfToken');
			pageTitle = ctx.pageName;
		} else {
			var response = ctx.undeleteApi.getResponse().query;

			if (!fnProcessChecks('undelete', ctx.onUndeleteFailure, response)) {
				return; // abort
			}

			token = response.tokens.csrftoken;
			var page = response.pages[0];
			pageTitle = page.title;
			ctx.watched = page.watchlistexpiry || page.watched;
		}

		var query = {
			action: 'undelete',
			title: pageTitle,
			token: token,
			reason: ctx.editSummary,
			watchlist: ctx.watchlistOption,
			format: 'json'
		};
		if (ctx.changeTags) {
			query.tags = ctx.changeTags;
		}

		if (ctx.watchlistExpiry && ctx.watched !== true) {
			query.watchlistexpiry = ctx.watchlistExpiry;
		}

		ctx.undeleteProcessApi = new MorebitsGlobal.wiki.api('undeleting page...', query, ctx.onUndeleteSuccess, ctx.statusElement, fnProcessUndeleteError);
		ctx.undeleteProcessApi.setParent(this);
		ctx.undeleteProcessApi.post();
	};

	// callback from undeleteProcessApi.post()
	var fnProcessUndeleteError = function() {

		var errorCode = ctx.undeleteProcessApi.getErrorCode();

		// check for "Database query error"
		if (errorCode === 'internal_api_error_DBQueryError') {
			if (ctx.retries++ < ctx.maxRetries) {
				ctx.statusElement.info('Database query error, retrying');
				--MorebitsGlobal.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds
				ctx.undeleteProcessApi.post(); // give it another go!
			} else {
				ctx.statusElement.error('Repeated database query error, please try again');
				if (ctx.onUndeleteFailure) {
					ctx.onUndeleteFailure.call(this, ctx.undeleteProcessApi);  // invoke callback
				}
			}
		} else if (errorCode === 'cantundelete') {
			ctx.statusElement.error('Cannot undelete the page, either because there are no revisions to undelete or because it has already been undeleted');
			if (ctx.onUndeleteFailure) {
				ctx.onUndeleteFailure.call(this, ctx.undeleteProcessApi);  // invoke callback
			}
		// hard error, give up
		} else {
			ctx.statusElement.error('Failed to undelete the page: ' + ctx.undeleteProcessApi.getErrorText());
			if (ctx.onUndeleteFailure) {
				ctx.onUndeleteFailure.call(this, ctx.undeleteProcessApi);  // invoke callback
			}
		}
	};

	var fnProcessProtect = function() {
		var response = ctx.protectApi.getResponse().query;

		if (!fnProcessChecks('protect', ctx.onProtectFailure, response)) {
			return; // abort
		}

		var token = response.tokens.csrftoken;
		var page = response.pages[0];
		var pageTitle = page.title;
		ctx.watched = page.watchlistexpiry || page.watched;

		// Fetch existing protection levels
		var prs = response.pages[0].protection;
		var editprot, moveprot, createprot;
		prs.forEach(function(pr) {
			// Filter out protection from cascading
			if (pr.type === 'edit' && !pr.source) {
				editprot = pr;
			} else if (pr.type === 'move') {
				moveprot = pr;
			} else if (pr.type === 'create') {
				createprot = pr;
			}
		});


		// Fall back to current levels if not explicitly set
		if (!ctx.protectEdit && editprot) {
			ctx.protectEdit = { level: editprot.level, expiry: editprot.expiry };
		}
		if (!ctx.protectMove && moveprot) {
			ctx.protectMove = { level: moveprot.level, expiry: moveprot.expiry };
		}
		if (!ctx.protectCreate && createprot) {
			ctx.protectCreate = { level: createprot.level, expiry: createprot.expiry };
		}

		// Default to pre-existing cascading protection if unchanged (similar to above)
		if (ctx.protectCascade === null) {
			ctx.protectCascade = !!prs.filter(function(pr) {
				return pr.cascade;
			}).length;
		}
		// Warn if cascading protection being applied with an invalid protection level,
		// which for edit protection will cause cascading to be silently stripped
		if (ctx.protectCascade) {
			// On move protection, this is technically stricter than the MW API,
			// but seems reasonable to avoid dumb values and misleading log entries (T265626)
			if (((!ctx.protectEdit || ctx.protectEdit.level !== 'sysop') ||
				(!ctx.protectMove || ctx.protectMove.level !== 'sysop')) &&
				!confirm('You have cascading protection enabled on "' + ctx.pageName +
				'" but have not selected uniform sysop-level protection.\n\n' +
				'Click OK to adjust and proceed with sysop-level cascading protection, or Cancel to skip this action.')) {
				ctx.statusElement.error('Cascading protection was aborted.');
				ctx.onProtectFailure(this);
				return;
			}

			ctx.protectEdit.level = 'sysop';
			ctx.protectMove.level = 'sysop';
		}

		// Build protection levels and expirys (expiries?) for query
		var protections = [], expirys = [];
		if (ctx.protectEdit) {
			protections.push('edit=' + ctx.protectEdit.level);
			expirys.push(ctx.protectEdit.expiry);
		}

		if (ctx.protectMove) {
			protections.push('move=' + ctx.protectMove.level);
			expirys.push(ctx.protectMove.expiry);
		}

		if (ctx.protectCreate) {
			protections.push('create=' + ctx.protectCreate.level);
			expirys.push(ctx.protectCreate.expiry);
		}

		var query = {
			action: 'protect',
			title: pageTitle,
			token: token,
			protections: protections.join('|'),
			expiry: expirys.join('|'),
			reason: ctx.editSummary,
			watchlist: ctx.watchlistOption,
			format: 'json'
		};
		// Only shows up in logs, not page history [[phab:T259983]]
		if (ctx.changeTags) {
			query.tags = ctx.changeTags;
		}

		if (ctx.watchlistExpiry && ctx.watched !== true) {
			query.watchlistexpiry = ctx.watchlistExpiry;
		}
		if (ctx.protectCascade) {
			query.cascade = 'true';
		}

		ctx.protectProcessApi = new MorebitsGlobal.wiki.api('protecting page...', query, ctx.onProtectSuccess, ctx.statusElement, ctx.onProtectFailure);
		ctx.protectProcessApi.setParent(this);
		ctx.protectProcessApi.post();
	};

	var fnProcessStabilize = function() {
		var pageTitle, token;

		if (fnCanUseMwUserToken('stabilize')) {
			token = mw.user.tokens.get('csrfToken');
			pageTitle = ctx.pageName;
		} else {
			var response = ctx.stabilizeApi.getResponse().query;

			// 'stabilize' as a verb not necessarily well understood
			if (!fnProcessChecks('stabilize', ctx.onStabilizeFailure, response)) {
				return; // abort
			}

			token = response.tokens.csrftoken;
			var page = response.pages[0];
			pageTitle = page.title;
			// Doesn't support watchlist expiry [[phab:T263336]]
			// ctx.watched = page.watchlistexpiry || page.watched;
		}

		var query = {
			action: 'stabilize',
			title: pageTitle,
			token: token,
			protectlevel: ctx.flaggedRevs.level,
			expiry: ctx.flaggedRevs.expiry,
			// tags: ctx.changeTags, // flaggedrevs tag support: [[phab:T247721]]
			reason: ctx.editSummary,
			watchlist: ctx.watchlistOption,
			format: 'json'
		};

		/* Doesn't support watchlist expiry [[phab:T263336]]
		if (ctx.watchlistExpiry && ctx.watched !== true) {
			query.watchlistexpiry = ctx.watchlistExpiry;
		}
		*/

		ctx.stabilizeProcessApi = new MorebitsGlobal.wiki.api('configuring stabilization settings...', query, ctx.onStabilizeSuccess, ctx.statusElement, ctx.onStabilizeFailure);
		ctx.stabilizeProcessApi.setParent(this);
		ctx.stabilizeProcessApi.post();
	};

	var sleep = function(milliseconds) {
		var deferred = $.Deferred();
		setTimeout(deferred.resolve, milliseconds);
		return deferred;
	};

}; // end MorebitsGlobal.wiki.page

/* MorebitsGlobal.wiki.page TODO: (XXX)
* - Should we retry loads also?
* - Need to reset current action before the save?
* - Deal with action.completed stuff
* - Need to reset all parameters once done (e.g. edit summary, move destination, etc.)
*/


/* **************** MorebitsGlobal.wiki.preview **************** */
/**
 * Use the API to parse a fragment of wikitext and render it as HTML.
 *
 * The suggested implementation pattern (in {@link MorebitsGlobal.simpleWindow} and
 * {@link MorebitsGlobal.quickForm} situations) is to construct a
 * `MorebitsGlobal.wiki.preview` object after rendering a `MorebitsGlobal.quickForm`, and
 * bind the object to an arbitrary property of the form (e.g. |previewer|).
 * For an example, see twinklewarn.js.
 *
 * @memberof MorebitsGlobal.wiki
 * @class
 * @param {HTMLElement} previewbox - The element that will contain the rendered HTML,
 * usually a <div> element.
 */
MorebitsGlobal.wiki.preview = function(previewbox) {
	this.previewbox = previewbox;
	$(previewbox).addClass('morebitsglobal-previewbox').hide();

	/**
	 * Displays the preview box, and begins an asynchronous attempt
	 * to render the specified wikitext.
	 *
	 * @param {string} wikitext - Wikitext to render; most things should work, including `subst:` and `~~~~`.
	 * @param {string} [pageTitle] - Optional parameter for the page this should be rendered as being on, if omitted it is taken as the current page.
	 * @param {string} [sectionTitle] - If provided, render the text as a new section using this as the title.
	 * @returns {jQuery.promise}
	 */
	this.beginRender = function(wikitext, pageTitle, sectionTitle) {
		$(previewbox).show();

		var statusspan = document.createElement('span');
		previewbox.appendChild(statusspan);
		MorebitsGlobal.status.init(statusspan);

		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',  // PST = pre-save transform; this makes substitution work properly
			text: wikitext,
			title: pageTitle || mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};
		if (sectionTitle) {
			query.section = 'new';
			query.sectiontitle = sectionTitle;
		}
		var renderApi = new MorebitsGlobal.wiki.api('loading...', query, fnRenderSuccess, new MorebitsGlobal.status('Preview'));
		return renderApi.post();
	};

	var fnRenderSuccess = function(apiobj) {
		var html = apiobj.getResponse().parse.text;
		if (!html) {
			apiobj.statelem.error('failed to retrieve preview, or template was blanked');
			return;
		}
		previewbox.innerHTML = html;
		$(previewbox).find('a').attr('target', '_blank'); // this makes links open in new tab
	};

	/** Hides the preview box and clears it. */
	this.closePreview = function() {
		$(previewbox).empty().hide();
	};
};


/* **************** MorebitsGlobal.wikitext **************** */

/**
 * Wikitext manipulation.
 *
 * @namespace MorebitsGlobal.wikitext
 * @memberof Morebits
 */
MorebitsGlobal.wikitext = {};

/**
 * Get the value of every parameter found in the wikitext of a given template.
 *
 * @memberof MorebitsGlobal.wikitext
 * @param {string} text - Wikitext containing a template.
 * @param {number} [start=0] - Index noting where in the text the template begins.
 * @returns {object} `{name: templateName, parameters: {key: value}}`.
 */
MorebitsGlobal.wikitext.parseTemplate = function(text, start) {
	start = start || 0;

	var level = []; // Track of how deep we are ({{, {{{, or [[)
	var count = -1;  // Number of parameters found
	var unnamed = 0; // Keep track of what number an unnamed parameter should receive
	var equals = -1; // After finding "=" before a parameter, the index; otherwise, -1
	var current = '';
	var result = {
		name: '',
		parameters: {}
	};
	var key, value;

	/**
	 * Function to handle finding parameter values.
	 *
	 * @param {boolean} [final=false] - Whether this is the final
	 * parameter and we need to remove the trailing `}}`.
	 */
	function findParam(final) {
		// Nothing found yet, this must be the template name
		if (count === -1) {
			result.name = current.substring(2).trim();
			++count;
		} else {
			// In a parameter
			if (equals !== -1) {
				// We found an equals, so save the parameter as key: value
				key = current.substring(0, equals).trim();
				value = final ? current.substring(equals + 1, current.length - 2).trim() : current.substring(equals + 1).trim();
				result.parameters[key] = value;
				equals = -1;
			} else {
				// No equals, so it must be unnamed; no trim since whitespace allowed
				var param = final ? current.substring(equals + 1, current.length - 2) : current;
				if (param) {
					result.parameters[++unnamed] = param;
					++count;
				}
			}
		}
	}

	for (var i = start; i < text.length; ++i) {
		var test3 = text.substr(i, 3);
		if (test3 === '{{{' || (test3 === '}}}' && level[level.length - 1] === 3)) {
			current += test3;
			i += 2;
			if (test3 === '{{{') {
				level.push(3);
			} else {
				level.pop();
			}
			continue;
		}
		var test2 = text.substr(i, 2);
		// Entering a template (or link)
		if (test2 === '{{' || test2 === '[[') {
			current += test2;
			++i;
			if (test2 === '{{') {
				level.push(2);
			} else {
				level.push('wl');
			}
			continue;
		}
		// Either leaving a link or template/parser function
		if ((test2 === '}}' && level[level.length - 1] === 2) ||
			(test2 === ']]' && level[level.length - 1] === 'wl')) {
			current += test2;
			++i;
			level.pop();

			// Find the final parameter if this really is the end
			if (test2 === '}}' && level.length === 0) {
				findParam(true);
				break;
			}
			continue;
		}

		if (text.charAt(i) === '|' && level.length === 1) {
			// Another pipe found, toplevel, so parameter coming up!
			findParam();
			current = '';
		} else if (equals === -1 && text.charAt(i) === '=' && level.length === 1) {
			// Equals found, toplevel
			equals = current.length;
			current += text.charAt(i);
		} else {
			// Just advance the position
			current += text.charAt(i);
		}
	}

	return result;
};

/**
 * Adjust and manipulate the wikitext of a page.
 *
 * @class
 * @memberof MorebitsGlobal.wikitext
 * @param {string} text - Wikitext to be manipulated.
 */
MorebitsGlobal.wikitext.page = function mediawikiPage(text) {
	this.text = text;
};

MorebitsGlobal.wikitext.page.prototype = {
	text: '',

	/**
	 * Removes links to `link_target` from the page text.
	 *
	 * @param {string} link_target
	 * @returns {MorebitsGlobal.wikitext.page}
	 */
	removeLink: function(link_target) {
		// Rempve a leading colon, to be handled later
		if (link_target.indexOf(':') === 0) {
			link_target = link_target.slice(1);
		}
		var link_re_string = '', ns = '', title = link_target;

		var idx = link_target.indexOf(':');
		if (idx > 0) {
			ns = link_target.slice(0, idx);
			title = link_target.slice(idx + 1);

			link_re_string = MorebitsGlobal.namespaceRegex(mw.config.get('wgNamespaceIds')[ns.toLowerCase().replace(/ /g, '_')]) + ':';
		}
		link_re_string += MorebitsGlobal.pageNameRegex(title);

		// Allow for an optional leading colon, e.g. [[:User:Test]]
		// Files and Categories become links with a leading colon, e.g. [[:File:Test.png]]
		var colon = new RegExp(MorebitsGlobal.namespaceRegex([6, 14])).test(ns) ? ':' : ':?';

		var link_simple_re = new RegExp('\\[\\[' + colon + '(' + link_re_string + ')\\]\\]', 'g');
		var link_named_re = new RegExp('\\[\\[' + colon + link_re_string + '\\|(.+?)\\]\\]', 'g');
		this.text = this.text.replace(link_simple_re, '$1').replace(link_named_re, '$1');
		return this;
	},

	/**
	 * Comments out images from page text; if used in a gallery, deletes the whole line.
	 * If used as a template argument (not necessarily with `File:` prefix), the template parameter is commented out.
	 *
	 * @param {string} image - Image name without `File:` prefix.
	 * @param {string} [reason] - Reason to be included in comment, alongside the commented-out image.
	 * @returns {MorebitsGlobal.wikitext.page}
	 */
	commentOutImage: function(image, reason) {
		var unbinder = new MorebitsGlobal.unbinder(this.text);
		unbinder.unbind('<!--', '-->');

		reason = reason ? reason + ': ' : '';
		var image_re_string = MorebitsGlobal.pageNameRegex(image);

		// Check for normal image links, i.e. [[File:Foobar.png|...]]
		// Will eat the whole link
		var links_re = new RegExp('\\[\\[' + MorebitsGlobal.namespaceRegex(6) + ':\\s*' + image_re_string + '\\s*[\\|(?:\\]\\])]');
		var allLinks = MorebitsGlobal.string.splitWeightedByKeys(unbinder.content, '[[', ']]');
		for (var i = 0; i < allLinks.length; ++i) {
			if (links_re.test(allLinks[i])) {
				var replacement = '<!-- ' + reason + allLinks[i] + ' -->';
				unbinder.content = unbinder.content.replace(allLinks[i], replacement);
			}
		}
		// unbind the newly created comments
		unbinder.unbind('<!--', '-->');

		// Check for gallery images, i.e. instances that must start on a new line,
		// eventually preceded with some space, and must include File: prefix
		// Will eat the whole line.
		var gallery_image_re = new RegExp('(^\\s*' + MorebitsGlobal.namespaceRegex(6) + ':\\s*' + image_re_string + '\\s*(?:\\|.*?$|$))', 'mg');
		unbinder.content = unbinder.content.replace(gallery_image_re, '<!-- ' + reason + '$1 -->');

		// unbind the newly created comments
		unbinder.unbind('<!--', '-->');

		// Check free image usages, for example as template arguments, might have the File: prefix excluded, but must be preceeded by an |
		// Will only eat the image name and the preceeding bar and an eventual named parameter
		var free_image_re = new RegExp('(\\|\\s*(?:[\\w\\s]+\\=)?\\s*(?:' + MorebitsGlobal.namespaceRegex(6) + ':\\s*)?' + image_re_string + ')', 'mg');
		unbinder.content = unbinder.content.replace(free_image_re, '<!-- ' + reason + '$1 -->');
		// Rebind the content now, we are done!
		this.text = unbinder.rebind();
		return this;
	},

	/**
	 * Converts uses of [[File:`image`]] to [[File:`image`|`data`]].
	 *
	 * @param {string} image - Image name without File: prefix.
	 * @param {string} data - The display options.
	 * @returns {MorebitsGlobal.wikitext.page}
	 */
	addToImageComment: function(image, data) {
		var image_re_string = MorebitsGlobal.pageNameRegex(image);
		var links_re = new RegExp('\\[\\[' + MorebitsGlobal.namespaceRegex(6) + ':\\s*' + image_re_string + '\\s*[\\|(?:\\]\\])]');
		var allLinks = MorebitsGlobal.string.splitWeightedByKeys(this.text, '[[', ']]');
		for (var i = 0; i < allLinks.length; ++i) {
			if (links_re.test(allLinks[i])) {
				var replacement = allLinks[i];
				// just put it at the end?
				replacement = replacement.replace(/\]\]$/, '|' + data + ']]');
				this.text = this.text.replace(allLinks[i], replacement);
			}
		}
		var gallery_re = new RegExp('^(\\s*' + image_re_string + '.*?)\\|?(.*?)$', 'mg');
		var newtext = '$1|$2 ' + data;
		this.text = this.text.replace(gallery_re, newtext);
		return this;
	},

	/**
	 * Remove all transclusions of a template from page text.
	 *
	 * @param {string} template - Page name whose transclusions are to be removed,
	 * include namespace prefix only if not in template namespace.
	 * @returns {MorebitsGlobal.wikitext.page}
	 */
	removeTemplate: function(template) {
		var template_re_string = MorebitsGlobal.pageNameRegex(template);
		var links_re = new RegExp('\\{\\{(?:' + MorebitsGlobal.namespaceRegex(10) + ':)?\\s*' + template_re_string + '\\s*[\\|(?:\\}\\})]');
		var allTemplates = MorebitsGlobal.string.splitWeightedByKeys(this.text, '{{', '}}', [ '{{{', '}}}' ]);
		for (var i = 0; i < allTemplates.length; ++i) {
			if (links_re.test(allTemplates[i])) {
				this.text = this.text.replace(allTemplates[i], '');
			}
		}
		return this;
	},

	/**
	 * Smartly insert a tag atop page text but after specified templates,
	 * such as hatnotes, short description, or deletion and protection templates.
	 * Notably, does *not* insert a newline after the tag.
	 *
	 * @param {string} tag - The tag to be inserted.
	 * @param {string|string[]} regex - Templates after which to insert tag,
	 * given as either as a (regex-valid) string or an array to be joined by pipes.
	 * @param {string} [flags=i] - Regex flags to apply.  `''` to provide no flags;
	 * other falsey values will default to `i`.
	 * @param {string|string[]} [preRegex] - Optional regex string or array to match
	 * before any template matches (i.e. before `{{`), such as html comments.
	 * @returns {MorebitsGlobal.wikitext.page}
	 */
	insertAfterTemplates: function(tag, regex, flags, preRegex) {
		if (typeof tag === 'undefined') {
			throw new Error('No tag provided');
		}

		// .length is only a property of strings and arrays so we
		// shouldn't need to check type
		if (typeof regex === 'undefined' || !regex.length) {
			throw new Error('No regex provided');
		} else if (Array.isArray(regex)) {
			regex = regex.join('|');
		}

		if (typeof flags !== 'string') {
			flags = 'i';
		}

		if (!preRegex || !preRegex.length) {
			preRegex = '';
		} else if (Array.isArray(preRegex)) {
			preRegex = preRegex.join('|');
		}


		// Regex is extra complicated to allow for templates with
		// parameters and to handle whitespace properly
		this.text = this.text.replace(
			new RegExp(
				// leading whitespace
				'^\\s*' +
				// capture template(s)
				'(?:((?:\\s*' +
				// Pre-template regex, such as leading html comments
				preRegex + '|' +
				// begin template format
				'\\{\\{\\s*(?:' +
				// Template regex
				regex +
				// end main template name, optionally with a number
				// Probably remove the (?:) though
				')\\d*\\s*' +
				// template parameters
				'(\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?' +
				// end template format
				'\\}\\})+' +
				// end capture
				'(?:\\s*\\n)?)' +
				// trailing whitespace
				'\\s*)?',
				flags), '$1' + tag
		);
		return this;
	},

	/**
	 * Get the manipulated wikitext.
	 *
	 * @returns {string}
	 */
	getText: function() {
		return this.text;
	}
};


/* *********** MorebitsGlobal.userspaceLogger ************ */
/**
 * Handles logging actions to a userspace log.
 * Used in CSD, PROD, and XFD.
 *
 * @memberof Morebits
 * @class
 * @param {string} logPageName - Title of the subpage of the current user's log.
 */
MorebitsGlobal.userspaceLogger = function(logPageName) {
	if (!logPageName) {
		throw new Error('no log page name specified');
	}
	/**
	 * The text to prefix the log with upon creation, defaults to empty.
	 *
	 * @type {string}
	 */
	this.initialText = '';
	/**
	 * The header level to use for months, defaults to 3 (`===`).
	 *
	 * @type {number}
	 */
	this.headerLevel = 3;
	this.changeTags = '';

	/**
	 * Log the entry.
	 *
	 * @param {string} logText - Doesn't include leading `#` or `*`.
	 * @param {string} summaryText - Edit summary.
	 * @returns {JQuery.Promise}
	 */
	this.log = function(logText, summaryText) {
		var def = $.Deferred();
		if (!logText) {
			return def.reject();
		}
		var page = new MorebitsGlobal.wiki.page('User:' + mw.config.get('wgUserName') + '/' + logPageName,
			'Adding entry to userspace log'); // make this '... to ' + logPageName ?
		page.load(function(pageobj) {
			// add blurb if log page doesn't exist or is blank
			var text = pageobj.getPageText() || this.initialText;

			// create monthly header if it doesn't exist already
			var date = new MorebitsGlobal.date(pageobj.getLoadTime());
			if (!date.monthHeaderRegex().exec(text)) {
				text += '\n\n' + date.monthHeader(this.headerLevel);
			}

			pageobj.setPageText(text + '\n' + logText);
			pageobj.setEditSummary(summaryText);
			pageobj.setChangeTags(this.changeTags);
			pageobj.setCreateOption('recreate');
			pageobj.save(def.resolve, def.reject);
		}.bind(this));
		return def;
	};
};


/* **************** MorebitsGlobal.status **************** */
/**
 * Create and show status messages of varying urgency.
 * {@link MorebitsGlobal.status.init|MorebitsGlobal.status.init()} must be called before
 * any status object is created, otherwise those statuses won't be visible.
 *
 * @memberof Morebits
 * @class
 * @param {string} text - Text before the the colon `:`.
 * @param {string} stat - Text after the colon `:`.
 * @param {string} [type=status] - Determine the font color of the status
 * line, allowable values are: `status` (blue), `info` (green), `warn` (red),
 * or `error` (bold red).
 */

MorebitsGlobal.status = function Status(text, stat, type) {
	this.textRaw = text;
	this.text = this.codify(text);
	this.type = type || 'status';
	this.generate();
	if (stat) {
		this.update(stat, type);
	}
};

/**
 * Specify an area for status message elements to be added to.
 *
 * @memberof MorebitsGlobal.status
 * @param {HTMLElement} root - Usually a div element.
 * @throws If `root` is not an `HTMLElement`.
 */
MorebitsGlobal.status.init = function(root) {
	if (!(root instanceof Element)) {
		throw new Error('object not an instance of Element');
	}
	while (root.hasChildNodes()) {
		root.removeChild(root.firstChild);
	}
	MorebitsGlobal.status.root = root;
	MorebitsGlobal.status.errorEvent = null;
};

MorebitsGlobal.status.root = null;

/**
 * @memberof MorebitsGlobal.status
 * @param {Function} handler - Function to execute on error.
 * @throws When `handler` is not a function.
 */
MorebitsGlobal.status.onError = function(handler) {
	if (typeof handler === 'function') {
		MorebitsGlobal.status.errorEvent = handler;
	} else {
		throw 'MorebitsGlobal.status.onError: handler is not a function';
	}
};

MorebitsGlobal.status.prototype = {
	stat: null,
	statRaw: null,
	text: null,
	textRaw: null,
	type: 'status',
	target: null,
	node: null,
	linked: false,

	/** Add the status element node to the DOM. */
	link: function() {
		if (!this.linked && MorebitsGlobal.status.root) {
			MorebitsGlobal.status.root.appendChild(this.node);
			this.linked = true;
		}
	},

	/** Remove the status element node from the DOM. */
	unlink: function() {
		if (this.linked) {
			MorebitsGlobal.status.root.removeChild(this.node);
			this.linked = false;
		}
	},

	/**
	 * Create a document fragment with the status text, parsing as HTML.
	 * Runs upon construction for text (part before colon) and upon
	 * render/update for status (part after colon).
	 *
	 * @param {(string|Element|Array)} obj
	 * @returns {DocumentFragment}
	 */
	codify: function(obj) {
		if (!Array.isArray(obj)) {
			obj = [ obj ];
		}
		var result;
		result = document.createDocumentFragment();
		for (var i = 0; i < obj.length; ++i) {
			if (obj[i] instanceof Element) {
				result.appendChild(obj[i]);
			} else {
				$.parseHTML(obj[i]).forEach(function(elem) {
					result.appendChild(elem);
				});
			}
		}
		return result;

	},

	/**
	 * Update the status.
	 *
	 * @param {string} status - Part of status message after colon.
	 * @param {string} type - 'status' (blue), 'info' (green), 'warn'
	 * (red), or 'error' (bold red).
	 */
	update: function(status, type) {
		this.statRaw = status;
		this.stat = this.codify(status);
		if (type) {
			this.type = type;
			if (type === 'error') {
				// hack to force the page not to reload when an error is output - see also MorebitsGlobal.status() above
				MorebitsGlobal.wiki.numberOfActionsLeft = 1000;

				// call error callback
				if (MorebitsGlobal.status.errorEvent) {
					MorebitsGlobal.status.errorEvent();
				}

				// also log error messages in the browser console
				console.error(this.textRaw + ': ' + this.statRaw); // eslint-disable-line no-console
			}
		}
		this.render();
	},

	/** Produce the html for first part of the status message. */
	generate: function() {
		this.node = document.createElement('div');
		this.node.appendChild(document.createElement('span')).appendChild(this.text);
		this.node.appendChild(document.createElement('span')).appendChild(document.createTextNode(': '));
		this.target = this.node.appendChild(document.createElement('span'));
		this.target.appendChild(document.createTextNode('')); // dummy node
	},

	/** Complete the html, for the second part of the status message. */
	render: function() {
		this.node.className = 'morebitsglobal_status_' + this.type;
		while (this.target.hasChildNodes()) {
			this.target.removeChild(this.target.firstChild);
		}
		this.target.appendChild(this.stat);
		this.link();
	},
	status: function(status) {
		this.update(status, 'status');
	},
	info: function(status) {
		this.update(status, 'info');
	},
	warn: function(status) {
		this.update(status, 'warn');
	},
	error: function(status) {
		this.update(status, 'error');
	}
};
/**
 * @memberof MorebitsGlobal.status
 * @param {string} text - Before colon
 * @param {string} status - After colon
 * @returns {MorebitsGlobal.status} - `status`-type (blue)
 */
MorebitsGlobal.status.status = function(text, status) {
	return new MorebitsGlobal.status(text, status);
};
/**
 * @memberof MorebitsGlobal.status
 * @param {string} text - Before colon
 * @param {string} status - After colon
 * @returns {MorebitsGlobal.status} - `info`-type (green)
 */
MorebitsGlobal.status.info = function(text, status) {
	return new MorebitsGlobal.status(text, status, 'info');
};
/**
 * @memberof MorebitsGlobal.status
 * @param {string} text - Before colon
 * @param {string} status - After colon
 * @returns {MorebitsGlobal.status} - `warn`-type (red)
 */
MorebitsGlobal.status.warn = function(text, status) {
	return new MorebitsGlobal.status(text, status, 'warn');
};
/**
 * @memberof MorebitsGlobal.status
 * @param {string} text - Before colon
 * @param {string} status - After colon
 * @returns {MorebitsGlobal.status} - `error`-type (bold red)
 */
MorebitsGlobal.status.error = function(text, status) {
	return new MorebitsGlobal.status(text, status, 'error');
};

/**
 * For the action complete message at the end, create a status line without
 * a colon separator.
 *
 * @memberof MorebitsGlobal.status
 * @param {string} text
 */
MorebitsGlobal.status.actionCompleted = function(text) {
	var node = document.createElement('div');
	node.appendChild(document.createElement('b')).appendChild(document.createTextNode(text));
	node.className = 'morebitsglobal_status_info';
	if (MorebitsGlobal.status.root) {
		MorebitsGlobal.status.root.appendChild(node);
	}
};

/**
 * Display the user's rationale, comments, etc. Back to them after a failure,
 * so that they may re-use it.
 *
 * @memberof MorebitsGlobal.status
 * @param {string} comments
 * @param {string} message
 */
MorebitsGlobal.status.printUserText = function(comments, message) {
	var p = document.createElement('p');
	p.innerHTML = message;
	var div = document.createElement('div');
	div.className = 'toccolours';
	div.style.marginTop = '0';
	div.style.whiteSpace = 'pre-wrap';
	div.textContent = comments;
	p.appendChild(div);
	MorebitsGlobal.status.root.appendChild(p);
};



/**
 * Simple helper function to create a simple node.
 *
 * @param {string} type - Type of HTML element.
 * @param {string} content - Text content.
 * @param {string} [color] - Font color.
 * @returns {HTMLElement}
 */
MorebitsGlobal.htmlNode = function (type, content, color) {
	var node = document.createElement(type);
	if (color) {
		node.style.color = color;
	}
	node.appendChild(document.createTextNode(content));
	return node;
};



/**
 * Add shift-click support for checkboxes. The wikibits version
 * (`window.addCheckboxClickHandlers`) has some restrictions, and doesn't work
 * with checkboxes inside a sortable table, so let's build our own.
 *
 * @param jQuerySelector
 * @param jQueryContext
 */
MorebitsGlobal.checkboxShiftClickSupport = function (jQuerySelector, jQueryContext) {
	var lastCheckbox = null;

	function clickHandler(event) {
		var thisCb = this;
		if (event.shiftKey && lastCheckbox !== null) {
			var cbs = $(jQuerySelector, jQueryContext); // can't cache them, obviously, if we want to support resorting
			var index = -1, lastIndex = -1, i;
			for (i = 0; i < cbs.length; i++) {
				if (cbs[i] === thisCb) {
					index = i;
					if (lastIndex > -1) {
						break;
					}
				}
				if (cbs[i] === lastCheckbox) {
					lastIndex = i;
					if (index > -1) {
						break;
					}
				}
			}

			if (index > -1 && lastIndex > -1) {
				// inspired by wikibits
				var endState = thisCb.checked;
				var start, finish;
				if (index < lastIndex) {
					start = index + 1;
					finish = lastIndex;
				} else {
					start = lastIndex;
					finish = index - 1;
				}

				for (i = start; i <= finish; i++) {
					if (cbs[i].checked !== endState) {
						cbs[i].click();
					}
				}
			}
		}
		lastCheckbox = thisCb;
		return true;
	}

	$(jQuerySelector, jQueryContext).click(clickHandler);
};



/* **************** MorebitsGlobal.batchOperation **************** */
/**
 * Iterates over a group of pages (or arbitrary objects) and executes a worker function
 * for each.
 *
 * `setPageList(pageList)`: Sets the list of pages to work on. It should be an
 * array of page names strings.
 *
 * `setOption(optionName, optionValue)`: Sets a known option:
 * - `chunkSize` (integer): The size of chunks to break the array into (default
 * 50). Setting this to a small value (<5) can cause problems.
 * - `preserveIndividualStatusLines` (boolean): Keep each page's status element
 * visible when worker is complete? See note below.
 *
 * `run(worker, postFinish)`: Runs the callback `worker` for each page in the
 * list.  The callback must call `workerSuccess` when succeeding, or
 * `workerFailure` when failing.  If using {@link MorebitsGlobal.wiki.api} or
 * {@link MorebitsGlobal.wiki.page}, this is easily done by passing these two
 * functions as parameters to the methods on those objects: for instance,
 * `page.save(batchOp.workerSuccess, batchOp.workerFailure)`.  Make sure the
 * methods are called directly if special success/failure cases arise.  If you
 * omit to call these methods, the batch operation will stall after the first
 * chunk!  Also ensure that either workerSuccess or workerFailure is called no
 * more than once.  The second callback `postFinish` is executed when the
 * entire batch has been processed.
 *
 * If using `preserveIndividualStatusLines`, you should try to ensure that the
 * `workerSuccess` callback has access to the page title.  This is no problem for
 * {@link MorebitsGlobal.wiki.page} objects.  But when using the API, please set the
 * |pageName| property on the {@link MorebitsGlobal.wiki.api} object.
 *
 * There are sample batchOperation implementations using MorebitsGlobal.wiki.page in
 * twinklebatchdelete.js, twinklebatchundelete.js, and twinklebatchprotect.js.
 *
 * @memberof Morebits
 * @class
 * @param {string} [currentAction]
 */
MorebitsGlobal.batchOperation = function(currentAction) {
	var ctx = {
		// backing fields for public properties
		pageList: null,
		options: {
			chunkSize: 50,
			preserveIndividualStatusLines: false
		},

		// internal counters, etc.
		statusElement: new MorebitsGlobal.status(currentAction || 'Performing batch operation'),
		worker: null, // function that executes for each item in pageList
		postFinish: null, // function that executes when the whole batch has been processed
		countStarted: 0,
		countFinished: 0,
		countFinishedSuccess: 0,
		currentChunkIndex: -1,
		pageChunks: [],
		running: false
	};

	// shouldn't be needed by external users, but provided anyway for maximum flexibility
	this.getStatusElement = function() {
		return ctx.statusElement;
	};

	/**
	 * Sets the list of pages to work on.
	 *
	 * @param {Array} pageList - Array of objects over which you wish to execute the worker function
	 * This is usually the list of page names (strings).
	 */
	this.setPageList = function(pageList) {
		ctx.pageList = pageList;
	};

	/**
	 * Sets a known option.
	 *
	 * @param {string} optionName - Name of the option:
	 * - chunkSize (integer): The size of chunks to break the array into
	 * (default 50). Setting this to a small value (<5) can cause problems.
	 * - preserveIndividualStatusLines (boolean): Keep each page's status
	 * element visible when worker is complete?
	 * @param {number|boolean} optionValue - Value to which the option is
	 * to be set. Should be an integer for chunkSize and a boolean for
	 * preserveIndividualStatusLines.
	 */
	this.setOption = function(optionName, optionValue) {
		ctx.options[optionName] = optionValue;
	};

	/**
	 * Runs the first callback for each page in the list.
	 * The callback must call workerSuccess when succeeding, or workerFailure when failing.
	 * Runs the optional second callback when the whole batch has been processed.
	 *
	 * @param {Function} worker
	 * @param {Function} [postFinish]
	 */
	this.run = function(worker, postFinish) {
		if (ctx.running) {
			ctx.statusElement.error('Batch operation is already running');
			return;
		}
		ctx.running = true;

		ctx.worker = worker;
		ctx.postFinish = postFinish;
		ctx.countStarted = 0;
		ctx.countFinished = 0;
		ctx.countFinishedSuccess = 0;
		ctx.currentChunkIndex = -1;
		ctx.pageChunks = [];

		var total = ctx.pageList.length;
		if (!total) {
			ctx.statusElement.info('no pages specified');
			ctx.running = false;
			if (ctx.postFinish) {
				ctx.postFinish();
			}
			return;
		}

		// chunk page list into more manageable units
		ctx.pageChunks = MorebitsGlobal.array.chunk(ctx.pageList, ctx.options.chunkSize);

		// start the process
		MorebitsGlobal.wiki.addCheckpoint();
		ctx.statusElement.status('0%');
		fnStartNewChunk();
	};

	/**
	 * To be called by worker before it terminates succesfully.
	 *
	 * @param {(MorebitsGlobal.wiki.page|MorebitsGlobal.wiki.api|string)} arg -
	 * This should be the `MorebitsGlobal.wiki.page` or `MorebitsGlobal.wiki.api` object used by worker
	 * (for the adjustment of status lines emitted by them).
	 * If no MorebitsGlobal.wiki.* object is used (e.g. you're using `mw.Api()` or something else), and
	 * `preserveIndividualStatusLines` option is on, give the page name (string) as argument.
	 */
	this.workerSuccess = function(arg) {

		var createPageLink = function(pageName) {
			var link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(pageName));
			link.appendChild(document.createTextNode(pageName));
			return link;
		};

		if (arg instanceof MorebitsGlobal.wiki.api || arg instanceof MorebitsGlobal.wiki.page) {
			// update or remove status line
			var statelem = arg.getStatusElement();
			if (ctx.options.preserveIndividualStatusLines) {
				if (arg.getPageName || arg.pageName || (arg.query && arg.query.title)) {
					// we know the page title - display a relevant message
					var pageName = arg.getPageName ? arg.getPageName() : arg.pageName || arg.query.title;
					statelem.info(['completed (', createPageLink(pageName), ')']);
				} else {
					// we don't know the page title - just display a generic message
					statelem.info('done');
				}
			} else {
				// remove the status line automatically produced by MorebitsGlobal.wiki.*
				statelem.unlink();
			}

		} else if (typeof arg === 'string' && ctx.options.preserveIndividualStatusLines) {
			new MorebitsGlobal.status(arg, ['done (', createPageLink(arg), ')']);
		}

		ctx.countFinishedSuccess++;
		fnDoneOne();
	};

	this.workerFailure = function() {
		fnDoneOne();
	};

	// private functions

	var thisProxy = this;

	var fnStartNewChunk = function() {
		var chunk = ctx.pageChunks[++ctx.currentChunkIndex];
		if (!chunk) {
			return;  // done! yay
		}

		// start workers for the current chunk
		ctx.countStarted += chunk.length;
		chunk.forEach(function(page) {
			ctx.worker(page, thisProxy);
		});
	};

	var fnDoneOne = function() {
		ctx.countFinished++;

		// update overall status line
		var total = ctx.pageList.length;
		if (ctx.countFinished < total) {
			ctx.statusElement.status(parseInt(100 * ctx.countFinished / total, 10) + '%');

			// start a new chunk if we're close enough to the end of the previous chunk, and
			// we haven't already started the next one
			if (ctx.countFinished >= (ctx.countStarted - Math.max(ctx.options.chunkSize / 10, 2)) &&
				Math.floor(ctx.countFinished / ctx.options.chunkSize) > ctx.currentChunkIndex) {
				fnStartNewChunk();
			}
		} else if (ctx.countFinished === total) {
			var statusString = 'Done (' + ctx.countFinishedSuccess +
				'/' + ctx.countFinished + ' actions completed successfully)';
			if (ctx.countFinishedSuccess < ctx.countFinished) {
				ctx.statusElement.warn(statusString);
			} else {
				ctx.statusElement.info(statusString);
			}
			if (ctx.postFinish) {
				ctx.postFinish();
			}
			MorebitsGlobal.wiki.removeCheckpoint();
			ctx.running = false;
		} else {
			// ctx.countFinished > total
			// just for giggles! (well, serious debugging, actually)
			ctx.statusElement.warn('Done (overshot by ' + (ctx.countFinished - total) + ')');
			MorebitsGlobal.wiki.removeCheckpoint();
			ctx.running = false;
		}
	};
};

/**
 * Given a set of asynchronous functions to run along with their dependencies,
 * figure out an efficient sequence of running them so that multiple functions
 * that don't depend on each other are triggered simultaneously. Where
 * dependencies exist, it ensures that the dependency functions finish running
 * before the dependent function runs. The values resolved by the dependencies
 * are made available to the dependant as arguments.
 *
 * @memberof Morebits
 * @class
 */
MorebitsGlobal.taskManager = function() {
	this.taskDependencyMap = new Map();
	this.deferreds = new Map();
	this.allDeferreds = []; // Hack: IE doesn't support Map.prototype.values

	/**
	 * Register a task along with its dependencies (tasks which should have finished
	 * execution before we can begin this one). Each task is a function that must return
	 * a promise. The function will get the values resolved by the dependency functions
	 * as arguments.
	 *
	 * @param {Function} func - A task.
	 * @param {Function[]} deps - Its dependencies.
	 */
	this.add = function(func, deps) {
		this.taskDependencyMap.set(func, deps);
		var deferred = $.Deferred();
		this.deferreds.set(func, deferred);
		this.allDeferreds.push(deferred);
	};

	/**
	 * Run all the tasks. Multiple tasks may be run at once.
	 *
	 * @returns {promise} - A jQuery promise object that is resolved or rejected with the api object.
	 */
	this.execute = function() {
		var self = this; // proxy for `this` for use inside functions where `this` is something else
		this.taskDependencyMap.forEach(function(deps, task) {
			var dependencyPromisesArray = deps.map(function(dep) {
				return self.deferreds.get(dep);
			});
			$.when.apply(null, dependencyPromisesArray).then(function() {
				task.apply(null, arguments).then(function() {
					self.deferreds.get(task).resolve.apply(null, arguments);
				});
			});
		});
		return $.when.apply(null, this.allDeferreds); // resolved when everything is done!
	};

};

/**
 * A simple draggable window, now a wrapper for jQuery UI's dialog feature.
 *
 * @memberof Morebits
 * @class
 * @requires jquery.ui.dialog
 * @param {number} width
 * @param {number} height - The maximum allowable height for the content area.
 */
MorebitsGlobal.simpleWindow = function SimpleWindow(width, height) {
	var content = document.createElement('div');
	this.content = content;
	content.className = 'morebitsglobal-dialog-content';
	content.id = 'morebitsglobal-dialog-content-' + Math.round(Math.random() * 1e15);

	this.height = height;

	$(this.content).dialog({
		autoOpen: false,
		buttons: { 'Placeholder button': function() {} },
		dialogClass: 'morebitsglobal-dialog',
		width: Math.min(parseInt(window.innerWidth, 10), parseInt(width ? width : 800, 10)),
		// give jQuery the given height value (which represents the anticipated height of the dialog) here, so
		// it can position the dialog appropriately
		// the 20 pixels represents adjustment for the extra height of the jQuery dialog "chrome", compared
		// to that of the old SimpleWindow
		height: height + 20,
		close: function(event) {
			// dialogs and their content can be destroyed once closed
			$(event.target).dialog('destroy').remove();
		},
		resizeStart: function() {
			this.scrollbox = $(this).find('.morebitsglobal-scrollbox')[0];
			if (this.scrollbox) {
				this.scrollbox.style.maxHeight = 'none';
			}
		},
		resizeStop: function() {
			this.scrollbox = null;
		},
		resize: function() {
			this.style.maxHeight = '';
			if (this.scrollbox) {
				this.scrollbox.style.width = '';
			}
		}
	});

	var $widget = $(this.content).dialog('widget');
	$widget.attr('lang', 'en');

	// delete the placeholder button (it's only there so the buttonpane gets created)
	$widget.find('button').each(function(key, value) {
		value.parentNode.removeChild(value);
	});

	// add container for the buttons we add, and the footer links (if any)
	var buttonspan = document.createElement('span');
	buttonspan.className = 'morebitsglobal-dialog-buttons';
	var linksspan = document.createElement('span');
	linksspan.className = 'morebitsglobal-dialog-footerlinks';
	$widget.find('.ui-dialog-buttonpane').append(buttonspan, linksspan);

	// resize the scrollbox with the dialog, if one is present
	$widget.resizable('option', 'alsoResize', '#' + this.content.id + ' .morebitsglobal-scrollbox, #' + this.content.id);
};

MorebitsGlobal.simpleWindow.prototype = {
	buttons: [],
	height: 600,
	hasFooterLinks: false,
	scriptName: null,

	/**
	 * Focuses the dialog. This might work, or on the contrary, it might not.
	 *
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	focus: function() {
		$(this.content).dialog('moveToTop');
		return this;
	},

	/**
	 * Closes the dialog. If this is set as an event handler, it will stop the event
	 * from doing anything more.
	 *
	 * @param {event} [event]
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	close: function(event) {
		if (event) {
			event.preventDefault();
		}
		$(this.content).dialog('close');
		return this;
	},

	/**
	 * Shows the dialog. Calling display() on a dialog that has previously been closed
	 * might work, but it is not guaranteed.
	 *
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	display: function() {
		if (this.scriptName) {
			var $widget = $(this.content).dialog('widget');
			$widget.find('.morebitsglobal-dialog-scriptname').remove();
			var scriptnamespan = document.createElement('span');
			scriptnamespan.className = 'morebitsglobal-dialog-scriptname';
			scriptnamespan.textContent = this.scriptName + ' \u00B7 ';  // U+00B7 MIDDLE DOT = &middot;
			$widget.find('.ui-dialog-title').prepend(scriptnamespan);
		}

		var dialog = $(this.content).dialog('open');
		if (window.setupTooltips && window.pg && window.pg.re && window.pg.re.diff) {  // tie in with NAVPOP
			dialog.parent()[0].ranSetupTooltipsAlready = false;
			window.setupTooltips(dialog.parent()[0]);
		}
		this.setHeight(this.height);  // init height algorithm
		return this;
	},

	/**
	 * Sets the dialog title.
	 *
	 * @param {string} title
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	setTitle: function(title) {
		$(this.content).dialog('option', 'title', title);
		return this;
	},

	/**
	 * Sets the script name, appearing as a prefix to the title to help users determine which
	 * user script is producing which dialog. For instance, Twinkle modules set this to "Twinkle".
	 *
	 * @param {string} name
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	setScriptName: function(name) {
		this.scriptName = name;
		return this;
	},

	/**
	 * Sets the dialog width.
	 *
	 * @param {number} width
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	setWidth: function(width) {
		$(this.content).dialog('option', 'width', width);
		return this;
	},

	/**
	 * Sets the dialog's maximum height. The dialog will auto-size to fit its contents,
	 * but the content area will grow no larger than the height given here.
	 *
	 * @param {number} height
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	setHeight: function(height) {
		this.height = height;

		// from display time onwards, let the browser determine the optimum height,
		// and instead limit the height at the given value
		// note that the given height will exclude the approx. 20px that the jQuery UI
		// chrome has in height in addition to the height of an equivalent "classic"
		// MorebitsGlobal.simpleWindow
		if (parseInt(getComputedStyle($(this.content).dialog('widget')[0], null).height, 10) > window.innerHeight) {
			$(this.content).dialog('option', 'height', window.innerHeight - 2).dialog('option', 'position', 'top');
		} else {
			$(this.content).dialog('option', 'height', 'auto');
		}
		$(this.content).dialog('widget').find('.morebitsglobal-dialog-content')[0].style.maxHeight = parseInt(this.height - 30, 10) + 'px';
		return this;
	},

	/**
	 * Sets the content of the dialog to the given element node, usually from rendering
	 * a {@link MorebitsGlobal.quickForm}.
	 * Re-enumerates the footer buttons, but leaves the footer links as they are.
	 * Be sure to call this at least once before the dialog is displayed...
	 *
	 * @param {HTMLElement} content
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	setContent: function(content) {
		this.purgeContent();
		this.addContent(content);
		return this;
	},

	/**
	 * Adds the given element node to the dialog content.
	 *
	 * @param {HTMLElement} content
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	addContent: function(content) {
		this.content.appendChild(content);

		// look for submit buttons in the content, hide them, and add a proxy button to the button pane
		var thisproxy = this;
		$(this.content).find('input[type="submit"], button[type="submit"]').each(function(key, value) {
			value.style.display = 'none';
			var button = document.createElement('button');
			button.textContent = value.hasAttribute('value') ? value.getAttribute('value') : value.textContent ? value.textContent : 'Submit Query';
			button.className = value.className || 'submitButtonProxy';
			// here is an instance of cheap coding, probably a memory-usage hit in using a closure here
			button.addEventListener('click', function() {
				value.click();
			}, false);
			thisproxy.buttons.push(button);
		});
		// remove all buttons from the button pane and re-add them
		if (this.buttons.length > 0) {
			$(this.content).dialog('widget').find('.morebitsglobal-dialog-buttons').empty().append(this.buttons)[0].removeAttribute('data-empty');
		} else {
			$(this.content).dialog('widget').find('.morebitsglobal-dialog-buttons')[0].setAttribute('data-empty', 'data-empty');  // used by CSS
		}
		return this;
	},

	/**
	 * Removes all contents from the dialog, barring any footer links.
	 *
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	purgeContent: function() {
		this.buttons = [];
		// delete all buttons in the buttonpane
		$(this.content).dialog('widget').find('.morebitsglobal-dialog-buttons').empty();

		while (this.content.hasChildNodes()) {
			this.content.removeChild(this.content.firstChild);
		}
		return this;
	},

	/**
	 * Adds a link in the bottom-right corner of the dialog.
	 * This can be used to provide help or policy links.
	 * For example, Twinkle's CSD module adds a link to the CSD policy page,
	 * as well as a link to Twinkle's documentation.
	 *
	 * @param {string} text - Display text.
	 * @param {string} wikiPage - Link target.
	 * @param {boolean} [prep=false] - Set true to prepend rather than append.
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	addFooterLink: function(text, wikiPage, prep) {
		var $footerlinks = $(this.content).dialog('widget').find('.morebitsglobal-dialog-footerlinks');
		if (this.hasFooterLinks) {
			var bullet = document.createElement('span');
			bullet.textContent = ' \u2022 ';  // U+2022 BULLET
			if (prep) {
				$footerlinks.prepend(bullet);
			} else {
				$footerlinks.append(bullet);
			}
		}
		var url;
		if (wikiPage.match(/^(https?:)?\/\//)) {
			url = wikiPage;
		} else {
			url = mw.util.getUrl(wikiPage);
		}
		var link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('title', wikiPage);
		link.setAttribute('target', '_blank');
		link.textContent = text;
		if (prep) {
			$footerlinks.prepend(link);
		} else {
			$footerlinks.append(link);
		}
		this.hasFooterLinks = true;
		return this;
	},

	/**
	 * Sets whether the window should be modal or not. Modal dialogs create
	 * an overlay below the dialog but above other page elements. This
	 * must be used (if necessary) before calling display().
	 *
	 * @param {boolean} [modal=false] - If set to true, other items on the
	 * page will be disabled, i.e., cannot be interacted with.
	 * @returns {MorebitsGlobal.simpleWindow}
	 */
	setModality: function(modal) {
		$(this.content).dialog('option', 'modal', modal);
		return this;
	}
};

/**
 * Enables or disables all footer buttons on all {@link MorebitsGlobal.simpleWindow}s in the current page.
 * This should be called with `false` when the button(s) become irrelevant (e.g. just before
 * {@link MorebitsGlobal.status.init} is called).
 * This is not an instance method so that consumers don't have to keep a reference to the
 * original `MorebitsGlobal.simpleWindow` object sitting around somewhere. Anyway, most of the time
 * there will only be one `MorebitsGlobal.simpleWindow` open, so this shouldn't matter.
 *
 * @memberof MorebitsGlobal.simpleWindow
 * @param {boolean} enabled
 */
MorebitsGlobal.simpleWindow.setButtonsEnabled = function(enabled) {
	$('.morebitsglobal-dialog-buttons button').prop('disabled', !enabled);
};


}(window, document, jQuery)); // End wrap with anonymous function


/**
 * If this script is being executed outside a ResourceLoader context, we add some
 * global assignments for legacy scripts, hopefully these can be removed down the line.
 *
 * IMPORTANT NOTE:
 * PLEASE DO NOT USE THESE ALIASES IN NEW CODE!
 * Thanks.
 */

if (typeof arguments === 'undefined') {  // typeof is here for a reason...
	/* global MorebitsGlobal */
	window.SimpleWindow = MorebitsGlobal.simpleWindow;
	window.QuickForm = MorebitsGlobal.quickForm;
	window.Wikipedia = MorebitsGlobal.wiki;
	window.Status = MorebitsGlobal.status;
}

// </nowiki>
