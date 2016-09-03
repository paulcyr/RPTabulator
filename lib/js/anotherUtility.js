/*! AnotherUtility - v1.0.0 - 2016-09-02
 * https://github.com/thisispaulcyr/AnotherUtility
 * Paul Cyr <web@thisispaul.ca> (http://thisispaul.ca)
 * Licensed MIT */

"use strict";

define(['jquery'], function($) {

let anotherUtility = {};

anotherUtility.ArgumentError = class ArgumentError extends Error {
	constructor(argument, parameterName, methodName, constructorName) {
		super();

		this.name = 'ArgumentError';
		this.stack = (new Error()).stack;

		if (!anotherUtility.validator.isNotEmptyString(parameterName)) this.message = 'Function argument error. Invalid argument value: ' + argument;
		else if (!anotherUtility.validator.isNotEmptyString(methodName)) this.message = 'Invalid argument given for parameter \'' + parameterName + '\'. Value given: ' + argument;
		else if (!anotherUtility.validator.isNotEmptyString(constructorName)) this.message = 'Invalid argument given for parameter \'' + parameterName + '\' for function \'' + methodName + '\'. Value given: ' + argument;
		else this.message = 'Invalid argument given for parameter \'' + parameterName + '\' for method \'' + methodName + '\' for instance of \'' + constructorName + '\'. Value given: ' + argument;
	}
}

anotherUtility.ErrorMessage = class ErrorMessage {
	constructor(message, options) {
		if (!anotherUtility.validator.isString(message)) throw new anotherUtility.ArgumentError(message, 'message', 'constructor', Object.getPrototypeOf(this).constructor.name);
		if (['object', 'undefined'].indexOf(typeof options) === -1) throw new anotherUtility.ArgumentError(options, 'options', 'constructor', Object.getPrototypeOf(this).constructor.name);

		this.message = '<p class="message">' + message + '</p>';

		let errorDiv = document.createElement('div');
		
		errorDiv.classList.add('alert')
		errorDiv.setAttribute('role', 'alert');

		if (options) {
			if (options.type && anotherUtility.validator.isNotEmptyString(options.type)) errorDiv.classList.add('alert-' + options.type);
			if (options.details && anotherUtility.validator.isString(options.details)) {
				if (options.detailsContainerType && anotherUtility.validator.isNotEmptyString(options.detailsContainerType))
					this.message += '<' + options.detailsContainerType + ' class="details">' + options.details + '</' + options.detailsContainerType + '>';
				else this.message += '<p class="details">' + options.details + '</p>';
			}
			if (options.code && anotherUtility.validator.isString(options.code)) this.message += '<p class="code">' + options.code + '</p>';
		}
		else errorDiv.classList.add('alert-info');

		errorDiv.innerHTML = this.message;

		return errorDiv;
	}
}

anotherUtility.ExecTimer = class ExecTimer {
	constructor(context, delay, fn, args) {
		if (typeof context !== 'object') throw new Error('Invalid context provided for ExecTimer');
		this.context = context;

		if (typeof delay === 'function') {
			if (typeof fn === 'object') this.args = fn;
			this.fn = delay;
			this.delay = null;
		}
		else if (typeof delay === 'number' && typeof fn === 'function') {
			if (typeof args === 'object') this.args = args;
			this.fn = fn;
			this.delay = delay;
		}
		else throw new Error('Invalid arguments provided for ExecTimer');

		this.delay = this.delay || $.fx.interval;
		this.triggered = false;
	}

	exec() {
		if (this.triggered) return;
		this.triggered = true;
		setTimeout(function() {
				this.fn.call(this.context, args);
				this.triggered = false;
			},
			this.delay
		);
	}
}

anotherUtility.Form = class Form {
	constructor (inputs, options) {

		if (['object', 'undefined'].indexOf(typeof inputs) === -1)
			throw new anotherUtility.ArgumentError(inputs, 'inputs', 'constructor', Object.getPrototypeOf(this).constructor.name);
		if (['object', 'undefined'].indexOf(typeof options) === -1)
			throw new anotherUtility.ArgumentError(options, 'options', 'constructor', Object.getPrototypeOf(this).constructor.name);

		this.inputs = typeof inputs === 'object' ? inputs : {};
		this.options = typeof options === 'object' ? options : {};
		this.formContentTypes = ['input', 'select', 'textarea', 'button', 'legend', 'progress', 'meter', 'output'];
		this.labelable = ['input', 'select', 'textarea', 'progress', 'meter', 'output'];

		let defaultMessages = {
			form: {
				submitButton: 'Submit',
				sending: 'Sending...',
				sent: 'Message sent.',
			},
			error: {
				general: 'Please contact me at <a href="mailto:web@thisispaul.ca" target="_blank">web@thisispaul.ca</a>.',
				unknown: 'An unknown error occurred. It probably doesn\'t have anything to do with your submission and is likely just a technical issue.',
				authentication: {general: 'The username or password is incorrect.'},
				form: {
					captchaInvalid: 'Please complete the captcha before submitting. It\'s the "I\'m not a robot" box just above the Submit button',
					db: {
						connection: 'There was a internal technical error. It probably doesn\'t have anything to do with your submission.',
						insert: 'There was a internal technical error. It probably doesn\'t have anything to do with your submission.',
					},
					email: 'There was a internal technical error. It probably doesn\'t have anything to do with your submission.',
					type: {
						notProvided: 'There was an error with the form information that was submitted by your internet browser.',
						notRecognized: 'There was an error with the form information that was submitted by your internet browser.',
					}
				},
				validation: {
					general: 'There was an error with some of the information you entered. Please re-check your entries and try again.</p>'
						+ '<p style="font-size:small;">If you still receive this message after re-checking what you entered, please contact me at <a href="mailto:web@thisispaul.ca" target="_blank">web@thisispaul.ca</a></p>',
					fields: {
						'name-first': 'Enter your first name.',
						'name-last': 'Enter your last name.',
						'street-address': 'Enter a valid street address or leave blank.',
						'city': 'Enter a valid city name or leave blank.',
						'pcode': 'Enter a valid postal / ZIP code or leave blank.',
						'email': 'Enter your email address.',
						'tel': 'Enter a valid telephone number or leave blank.',
						'subject': 'Enter a message subject.',
						'message': 'Enter a message.'
					}
				}
			}
		}

		let defaultOptions = {
			messages: defaultMessages
			,validate: true
			,handleSubmit: false,
			attrs: {
				id: 'form-' + (Math.random()*0xFFFFFFFF<<0).toString(16)
				,method: 'post'
			}
			,
		}

		let loadValidate = () => {
			$(this.form).validate({
				errorClass: 'has-error',
				validClass: '',
				highlight: function(element, errorClass, validClass) {
					$(element).attr('aria-invalid', 'true');
					$(element).parent('.form-group').addClass(errorClass).removeClass(validClass);
				},
				unhighlight: function(element, errorClass, validClass) {
					$(element).attr('aria-invalid', 'false');
					$(element).parent('.form-group').addClass(validClass).removeClass(errorClass);
				},
				errorPlacement: function(error, element) {
					if (element.parent('.form-group').hasClass('has-error')) {
						error.hide();
						error.addClass('help-block');
						error.insertAfter($(element).siblings('.control-label').first());
						error.slideDown('fast');
					}
				},
				success: function(label) {
					label.slideUp('fast', function() { $(this).remove(); });
				},
				messages: this.options.messages.error.validation.fields,
				submitHandler: this.submit
			});
		}

		// Load defaults for any unspecified options.
		this.options = $.extend(true, defaultOptions, this.options);

		this.id = this.options.attrs.id

		// Form validation
		if (this.options.validate == true) {
			if (typeof $.fn.validate !== 'function') throw new Error('Unable to load jquery.validate');
			else loadValidate();
		}

		if (typeof options.submitHandler === 'function') submitHandler(options.submitHandler);

	}

	get form() {
		let form = document.createElement('form')
			,attributes = $.extend({}, this.options.attrs)

		$(form).attr(attributes);

		let itemGenerate = (formOptions, input) => {
			let item = [];

			// Optional label
			if (this.labelable.indexOf(input.type) !== -1
				&& input.type !== 'hidden'
				&& (input.required == true
					|| (anotherUtility.validator.isNotEmptyObject(input.label)
						|| anotherUtility.validator.isNotEmptyString(input.label)
			))) {
				if (typeof input.label === 'string') input.label = {content: input.label};
				if (input.required) {
					input.label = input.label || {};
					input.label.required = true;
				}
				item.push(itemLabel(formOptions.labels, input.label));
			}

			formOptions.items = formOptions.items || {};
			item.push(itemElement(formOptions.items, input));
			
			// Optional wrapper
			if (this.labelable.indexOf(input.type) !== -1
				&& (anotherUtility.validator.isNotEmptyObject(formOptions.wrapInputs) || anotherUtility.validator.isNotEmptyObject(input.wrap))
			) {
				formOptions.wrapInputs = formOptions.wrapInputs || {};
				input.wrap = input.wrap || {};
				let wrapper = itemWrap(formOptions.wrapInputs, input.wrap);
				item = $(wrapper).append(item)
			}
			
			return item;
		}

		let itemWrap = (formWrapOptions, itemWrapOptions) => {
			let wrapOptions = {};

			if(anotherUtility.validator.isNotEmptyString(formWrapOptions.class) || anotherUtility.validator.isNotEmptyString(itemWrapOptions.class)) {
				wrapOptions.class = '';
				if (anotherUtility.validator.isNotEmptyString(formWrapOptions.class)) wrapOptions.class += formWrapOptions.class;
				if (anotherUtility.validator.isNotEmptyString(itemWrapOptions.class)) wrapOptions.class += ' ' + itemWrapOptions.class;
			}

			if (anotherUtility.validator.isNotEmptyString(formWrapOptions.element) || anotherUtility.validator.isNotEmptyString(itemWrapOptions.element)) {
				wrapOptions.element = anotherUtility.validator.isNotEmptyString(itemWrapOptions.element)
					? itemWrapOptions.element
					: formWrapOptions.element
			}

			let inputWrap = anotherUtility.validator.isNotEmptyString(wrapOptions.element)
				? document.createElement(wrapOptions.element)
				: document.createElement('div');

			if (wrapOptions.class) $(inputWrap).addClass(wrapOptions.class);

			return inputWrap;
		}

		let itemLabel = (formLabelOptions, labelOptions) => {
			let label = document.createElement('label');
			
			formLabelOptions = formLabelOptions || {};

			if(labelOptions.required == true
				|| anotherUtility.validator.isNotEmptyString(formLabelOptions.class) || anotherUtility.validator.isNotEmptyString(labelOptions.class)) {
				let labelClass = '';
				if (anotherUtility.validator.isNotEmptyString(formLabelOptions.class)) labelClass += formLabelOptions.class;
				if (anotherUtility.validator.isNotEmptyString(labelOptions.class)) labelClass += ' ' + labelOptions.class;
				if (labelOptions.required == true) labelClass += ' required';
				$(label).addClass(labelClass)
			}

			label.innerHTML = labelOptions.content;

			return label;
		}

		let itemElement = (formItemOptions, elementOptions) => {
			let inputTypes = ['input', 'select', 'textarea', 'button', 'output']
				,itemElement
				,type = (anotherUtility.validator.isNotEmptyString(elementOptions.type)
					&& this.formContentTypes.indexOf(elementOptions.type) !== -1)
					? elementOptions.type : 'input'
			
			itemElement = document.createElement(type);

			if ((type) === 'input') $(itemElement).attr('type', elementOptions.type);

			if (elementOptions.readonly) $(itemElement).attr('aria-readonly', true);
			if (elementOptions.required) $(itemElement).attr('aria-required', true);

			if(anotherUtility.validator.isNotEmptyString(formItemOptions.class) || anotherUtility.validator.isNotEmptyString(elementOptions.class)) {
				let itemClass = '';
				if (anotherUtility.validator.isNotEmptyString(formItemOptions.class)) itemClass += formItemOptions.class;
				if (anotherUtility.validator.isNotEmptyString(elementOptions.class)) itemClass += ' ' + elementOptions.class;
				$(itemElement).addClass(itemClass)
			}
			

			$.each(elementOptions, (key, value) => {
				if (['class', 'type', 'label', 'wrap', 'value'].indexOf(key) === -1) $(itemElement).attr(key, value);
			});

			switch(type) {
				case 'select': $(itemElement).append(selectItems(elementOptions.items));
					break;
				case 'textarea':
				case 'legend':
				case 'button':
					if (elementOptions.value) $(itemElement).text(elementOptions.value);
					break;
				default: if (elementOptions.value) $(itemElement).attr('value', elementOptions.value);
			}

			return itemElement;
		}

		let selectItems = (items) => {
			let elements = [];
			$.each(items, (index, item) => {
				let element;
				if (typeof item === 'object' && !(anotherUtility.validator.isArray(item))) {
					if (item.optgroup) {
						element = document.createElement('optgroup');
						$.each(item, (key, value) => {
							if (key !== 'optgroup') $(element).attr(key, value);
						})
						$(element).append(selectItems(item.optgroup));
					}
					else {
						element = document.createElement('option');
						element.value = item.value;
						if ('content' in item) $(element).text(item.content);
						else $(element).text(item.value);
					}
				}
				else {
					element = document.createElement('option');
					$(element).val(item).text(item);
				}
				elements.push(element);
			});
			return elements;
		}

		if (this.hasRequired) $(form).append('<p class="note"><dfn class="required">*</dfn> indicates a required field.</p>');

		this.inputs.forEach((input) => {
			if (input.type === 'fieldset') {
				let fieldset = document.createElement('fieldset');
				if (anotherUtility.validator.isNotEmptyString(input.class)) $(fieldset).addClass(input.class);
				if (anotherUtility.validator.isNotEmptyObject(input.inputs))
				input.inputs.forEach((fieldsetInput) => {
					$(fieldset).append(itemGenerate(this.options, fieldsetInput));
				});
				form.appendChild(fieldset);
			}
			else $(form).append(itemGenerate(this.options, input));
		});

		return form;
	}

	get hasRequired() {
		let required = false;

		function checkForRequired(object) {
			if (object.required == true) return true;
			let keys = Object.keys(object)
				,result = false

			if (anotherUtility.validator.isArray(object)) {
				return object.some(function(value) {
					return (typeof value === 'object') ? checkForRequired(value) : false;
				});
			} else {
				let i = 0
					,keys = Object.keys(object);
				while (result === false && i < keys.length) {
					let key = keys[i]
						,value = object[key];
					if (key === 'required') return value;
					if (typeof value === 'object') return checkForRequired(value);
					i++;
				}
			}
		}

		return checkForRequired(this.inputs) === true ? true : false;
	}
	
	setSubmitHandler(fn) {
		if (typeof fn === 'function') {
			this.submitHander = fn;
			$('body').on('submit.' + this.options.attrs.id, '#' + this.options.attrs.id, (e) => {
				e.preventDefault();
				$('.errorMessage',  '#' + this.options.attrs.id).remove();
				$('.has-warning, .has-error, .has-success',  '#' + this.options.attrs.id).removeClass('has-warning, has-error, has-success');
				$(this.formContentTypes.join(', '), '#' + this.options.attrs.id).attr('disabled', true);
				$('body').on('formComplete.' + this.options.attrs.id, '#' + this.options.attrs.id, (e) => {
					$(this.formContentTypes.join(', '), '#' + this.options.attrs.id).attr('disabled', false);
				});
				this.submitHander(e);
			});
		}
		else {
			this.submitHandler = undefined;
			$('body').off('submit.' + this.attrs.options.id);
		}
	}

	showError(name, error) {
		if (anotherUtility.validator.isNotEmptyString(name)) {
			let $name = $('#' + this.options.attrs.id + ' [name="' + name + '"]')
				,div = document.createElement('div')

			div.classList.add('errorMessage');

			if (error.inputClass) $name.addClass(error.class);
			if (error.messageClass) $(div).addClass(error.messageClass);
			
			div.innerHTML = error.message;

			$(div)
				.hide()
				.insertAfter($name)
				.css('max-width', $('#' + this.id).width())
				.slideDown();
		}
		else if (anotherUtility.validator.isNotEmptyArray(name)) {
			name.forEach((arrayItem) => {
				this.showError(arrayItem.name, arrayItem.error);
			})
		}
		else throw new anotherUtility.ArgumentError(name, 'name', 'showError', Object.getPrototypeOf(this).constructor.name);
	}
}

anotherUtility.Menu = class Menu {

	constructor(items, settings) {
		this.items = (anotherUtility.validator.isNotEmptyArray(items)) ? items : [];
		this.settings = typeof settings === 'object' ? settings : {};
	}

	get(settings) {
		if (typeof settings === 'object') {
			this.settings = $.extend(this.settings, settings);
		}

		let make = (items, root) => {
			let output = document.createElement('ul');

			if (root) $(output).addClass('menu').attr('role', 'menu');
			else $(output).addClass('submenu').attr('role', 'menubar');

			items.forEach((item, i) => {
				let li = document.createElement('li')
					,liAttributes = {role: 'menuitem'}
					,aElm = document.createElement('a')
					,label

				if (!item.class) item.class = '';
				if (item.icon) {
					item.class += ' icon ' + item.icon;
					if (this.settings.svg === true) item.class += ' svg';
				}

				for (let attribute in item) {
					if (
						['items', 'href', 'target', 'label', 'icon'].indexOf(attribute) === -1
						&& item[attribute]
					) liAttributes[attribute] = item[attribute]; 
				};

				liAttributes.tabIndex = 1;

				$(li).attr(liAttributes);
				if (item.href) aElm.href = item.href;
				if (item.target) aElm.target = item.target;
				if (item.label) {
					label = document.createElement('span');
					$(label).addClass('label').html(item.label);
				}
				if (item.icon) {
					let div = $(document.createElement('div'))
						,alt

					if (item.alt) {
						alt =  $(document.createElement('span')).addClass('alt').html(item.alt);
					}

					if (item.label) {
						let image;
						image = $(document.createElement('div')).addClass('image');
						if (item.alt) image.appendChild(alt);		
						$(div).addClass('label-with-image').append(image, label);
					}
					else {
						$(div).addClass('image')
						if (item.alt) div.appendChild(alt);
					}

					aElm.appendChild(div);
				}
				else if (item.label) aElm.appendChild(label);

				li.appendChild(aElm);

				// Recursion for submenus
				if (item.items) li.appendChild(make(item.items));

				output.appendChild(li);
			});
			return output;
		}
		return make(this.items, true);
	}
}

anotherUtility.Records = class Records {
	
	constructor(type, id) {
		if (['string', 'number', 'symbol'].indexOf(typeof type) === -1
			|| (typeof type !== 'symbol' && !(type.length > 0))
		) throw new anotherUtility.ArgumentError(type, 'type', 'constructor', Object.getPrototypeOf(this).constructor.name);

		if (typeof id === 'undefined' || id === null) {
			this.id = type;
			this.type = 'record'
		}
		else {
			this.type = type;
			this.id = id;
		}

		try {
			this.records = JSON.parse(localStorage.getItem(this.type + '.' + this.id));
			if (typeof this.records !== 'object' || this.records === null) this.records = {};
		}
		catch (e) {  this.records = {}; }

		localStorage.setItem(this.type + '.' + this.id, JSON.stringify(this.records));
	}

	add (record, sort, overwrite) {
		if (typeof record !== 'object' || !(record.length > 0)) throw new anotherUtility.ArgumentError(record, 'record', 'add', Object.getPrototypeOf(this).constructor.name);

		overwrite = overwrite == true ? true : false;
		if (anotherUtility.validator.isArray(record)) {
			console.log(this.records.length);
			if (overwrite) this.records = record;
			else if (anotherUtility.validator.isNotEmptyArray(this.records)) 
				this.records = anotherUtility.arrayMergeUnique([this.records, record], sort);
			else this.records = $.extend(this.records, record);
		}
		else if (
			['string', 'number', 'symbol'].indexOf(typeof record.id) === -1
			|| (typeof record.id !== 'symbol' && !(record.id.length > 0))
		)
			throw new Error('Property \'id\' for argument \'record\' missing or invalid.');
		else if (this.records.hasOwnProperty(record.id) && overwrite !== true)
			throw new Error('Value for \'id\' already exists and argument \'overwrite\' not equal to true.');
		else this.records[record.id] = record.value; // Add record for non-array

		// Save to storage
		localStorage.setItem(this.type + '.' + this.id, JSON.stringify(this.records));
	}

	get(id) {
		return ['string', 'number', 'symbol'].indexOf(typeof id) === -1 ? this.records : this.records[id];
	}

	deleteRecord(id) {
		if (
			['string', 'number', 'symbol'].indexOf(typeof id) === -1
			|| (typeof id !== 'symbol' && !(id.length > 0))
		) throw new Error('Property \'id\' for argument \'record\' missing or invalid.');

		if (anotherUtility.validator.isArray(this.records)) {
			let index = this.records.indexOf(id);
			if (index !== -1) this.records.splice(index, 1);
		}
		else delete this.records[id];

		localStorage.setItem(this.type + '.' + this.id, JSON.stringify(this.records));
	}

	deleteAll() {
		localStorage.removeItem(this.type + '.' + this.id);
		this.records = {};
	}

}

// A modification of uuid.js by Robert Kieffer
// node.js & AMD support removed. Only UUIDv4 provided.
// Updated: 2016-08-21
anotherUtility.UUIDv4 = function() {
	// Unique ID creation requires a high quality random # generator.	We feature
	// detect to determine the best RNG source, normalizing to a function that
	// returns 128-bits of randomness, since that's what's usually required
	let _rng, _mathRNG, _previousGlobal;

	// Allow for MSIE11 msCrypto
	let _crypto = window.crypto || window.msCrypto;

	if (!_rng && _crypto && _crypto.getRandomValues) {
		try {
			let _rnds8 = new Uint8Array(16);
			_rng = function() {
				_crypto.getRandomValues(_rnds8);
				return _rnds8;
			}
		} catch(e) {}
	}

	if (!_rng) {
		// Math.random()-based (RNG)
		//
		// If all else fails, use Math.random().	It's fast, but is of unspecified quality.
		let _rnds = new Array(16);
		_mathRNG = _rng = function() {
			for (let i = 0, r; i < 16; i++) {
				if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
				_rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
			}

			return _rnds;
		}

		if ('undefined' !== typeof console && console.warn) {
			console.warn("[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()");
		}
	}

	// **`parse()` - Parse a UUID into it's component bytes**
	function parse(s) {
		// Maps for number <-> hex string conversion
		let _byteToHex = []
			,_hexToByte = {}
			,i = 0
			,ii = 0
			,buf = [];

		for (let i = 0; i < 256; i++) {
			_byteToHex[i] = (i + 0x100).toString(16).substr(1);
			_hexToByte[_byteToHex[i]] = i;
		}
		s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
			if (ii < 16) { // Don't overflow!
				buf[i + ii++] = _hexToByte[oct];
			}
		});

		// Zero out remaining bytes if string was short
		while (ii < 16) {
			buf[i + ii++] = 0;
		}

		return buf;
	}

	// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
	function unparse(buf) {
		// Maps for number <-> hex string conversion
		let _byteToHex = [];
		for (let i = 0; i < 256; i++) {
			_byteToHex[i] = (i + 0x100).toString(16).substr(1);
		}
		let i = 0, bth = _byteToHex;

		return	bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]];
	}

	let rnds = _rng();

	// Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	rnds[6] = (rnds[6] & 0x0f) | 0x40;
	rnds[8] = (rnds[8] & 0x3f) | 0x80;

	return unparse(rnds);
}

// uses duck-typing via feature detection
anotherUtility.browser = {}

anotherUtility.browser.name = (function() {
	if (/*@cc_on!@*/false || !!document.documentMode) { return 'MSIE'; }
	else if (!!window.StyleMedia) { return 'Edge'; }
	else if (!!window.chrome) { return 'Chrome' }
	else if (typeof InstallTrigger !== 'undefined') { return 'Firefox';	}
	else if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) { return 'Opera' }
	else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) { return 'Safari'; }
	return undefined;
})()

anotherUtility.browser.version = (function() {
	switch (anotherUtility.browser.name) {
		case ('Blink'): return '[1,undefined)';
		case ('Chrome'):
			if (!!window.CSS) { return '[28,undefined)'; }
			else { return '[1,28)'; }
		case ('Edge'): return '[20,undefined)';
		case ('Firefox'): return '[1,undefined)';
		case ('MSIE'): return '[6,11]';
		case ('Opera'):
			if (!!window.opr && !!opr.addons) { return '[20,undefined)'; }
			else { return '[8,20)'; }
		case ('Safari'): return '[3,undefined)';
		default: return undefined;
	}
})();

anotherUtility.OS = (function() {
	let userAgent = window.navigator.userAgent,
		OSes = { 
			'Windows NT 10' : 'Windows 10 / Server 2016',
			'Windows NT 6.3' : 'Windows 8.1 / Server 2012 R2',
			'Windows NT 6.2' : 'Windows 8 / Server 2012',
			'Windows NT 6.1' : 'Windows 7 / Server 2008 R2',
			'Windows NT 6.0' : 'Windows Vista / Server 2008',
			'Windows NT 5.2' : 'Windows XP Pro x64 / Windows Server 2003',
			'Windows NT 5.1' : 'Windows XP',
			'Windows NT 5.0' : 'Windows 2000 / Server 2000',
			'Mac' : 'Mac/iOS',
			'X11' : 'UNIX',
			'Linux' : 'Linux'
		},
		OS = 'Unknown';
	$.each(OSes, function(index, element) {
		if (userAgent.indexOf(index) != -1) { OS = element; }
	});
	return OS;
})();

anotherUtility.ajax = {
	init: function(defaultContainer, ajaxOptions) {
		if ($(defaultContainer).length === 0) throw new anotherUtility.ArgumentError(defaultContainer, 'defaultContainer', 'ajax.init');
		if (['object', 'undefined'].indexOf(ajaxOptions) === -1) throw new anotherUtility.ArgumentError(ajaxOptions, 'ajaxOptions', 'ajax.init');
		ajaxOptions = ajaxOptions || {};

		// Defaults
		if (!('timeout' in ajaxOptions)) ajaxOptions.timeout = 7500;
		if (!('cache' in ajaxOptions)) ajaxOptions.cache = true;

		this.defaultContainer = defaultContainer;

		$.ajaxSetup(ajaxOptions);

		$(window).on('popstate', function() {
			let URL = window.location.href;
			if (!anotherUtility.isSameTarget(URL, anotherUtility.ajax.prevURL))
				anotherUtility.ajax.loadPage(URL);
		});

		(function attachListeners() {
			$('a').filter(function() {
				return this.href // ...and it has a URL...
					&& !this.href.match(/^.+\.\S{3,4}$/i) // ...but the URL does not include a file extention
					// ...and it does not have a "target" attribute or it does and that attribue is "_self", effectively excluding targets such as "_blank"
					&& (
						!$(this).attr('target')
						|| $(this).attr('target') == '_self'
					);
				})
				.off('click.ajax')
				.on('click.ajax', function(event){
					event.preventDefault();
					if (anotherUtility.isSameTarget(this.href)) history.pushState(null, document.title, this.href);
					else anotherUtility.ajax.loadPage(this);
				});
		})()
	},

	prevURL: (function() {
		return {protocol: window.location.protocol, hostname: window.location.hostname, pathname: window.location.pathname}
	})(),

	loadPage: function(linkObject) {
		let ajaxInProgress,
			$targetElement,
			overlayNav,
			url,
			nav,
			scrollPos = 0;

		if (ajaxInProgress) {
			nav.abort();
			anotherUtility.loadingAnimation.remove($targetElement);
		}

		url = typeof linkObject == 'string' ? linkObject : $(linkObject).attr('href');

		$targetElement =
			typeof linkObject == 'string'
			|| $(linkObject).parents(this.defaultContainer).length == 0
				? $(this.defaultContainer) : $(linkObject).closest('div').attr('class','container').parent();

		overlayNav = ('.overlay', $targetElement).first();

		if (url[url.length-1]=='/') url = url.slice(0,-1);

		if ($('> .overlay', $targetElement).length == 0) {
			anotherUtility.loadingAnimation.add(
				$targetElement,
				{speed: 200, classes: 'nav'},
				doAjax
			);
		}
		else doAjax();

		function doAjax() {
			if ($(window).scrollTop() > scrollPos) $('html, body').scrollTop(scrollPos);
			nav = $.ajax({
				url: url,
				dataType: 'json',
				cache: false,
				headers: {'X-Request-Type': 'ajax'},
				beforeSend: function() { ajaxInProgress = true; },
				error: error,
				success: success,
				complete: function(jqXHR, textStatus) { ajaxInProgress = false; }
			});
		}

		function error(jqXHR, textStatus, errorThrown) {
			let message = '<div class="ajax message">\
				<p style="font-weight:bold; font-size: 2em; margin-bottom:0.75em;">:(</p>\
				<p>An error occured.</p><p><a class="ajax retry" tabindex="0.1">Retry</a>&emsp;<a class="ajax cancel" tabindex="0.2">Cancel</a></p>\
				<p style="font-size:small;">Result: ' + errorThrown + '</p></div>';

			anotherUtility.loadingAnimation.message($targetElement, message);
			// Remove focus from clicked link
			if (typeof linkObject == 'object') { $(linkObject).blur(); }
			
			$('.ajax.cancel',overlayNav).click(function() {
				$(document).off('keydown.anotherUtility.ajax.loadPage');
				anotherUtility.loadingAnimation.remove($targetElement);
			});
			$('.ajax.retry',overlayNav).click(function() {
				$(document).off('keydown.anotherUtility.ajax.loadPage');
				$('.ajax.message', $targetElement).hide();
				anotherUtility.ajax.loadPage(url);
			});
			$(document).off('keydown.anotherUtility.ajax.loadPage');
			$(document).on('keydown.anotherUtility.ajax.loadPage', function(e) {
				switch (e.which) {
					case 13:
						$(document).off('keydown.anotherUtility.ajax.loadPage');
						anotherUtility.ajax.loadPage(url);
						break;
					case 27: 
						$(document).off('keydown.anotherUtility.ajax.loadPage');
						anotherUtility.loadingAnimation.remove($targetElement);
						break;
					}
			});
			
			if ($(window).scrollTop() > scrollPos) {
				$('html, body').animate({ scrollTop: scrollPos }, 500);
			}
		}	

		function success(data, textStatus, jqXHR) {
			let $animationContainer = $(document.createElement('div')).addClass('animation-container'),
				$container = $('> .container', $targetElement).first(),
				observer,
				location;

			function contentLoaded() {
				observer.disconnect();
				$container.unwrap();
				anotherUtility.pageLoad();
				$('#header .primary a.current-page').focus();
				$('#header .primary a.current-page').blur();
				$('title').text(data.title);
				$('body').removeClass().addClass(data.pageClass);
				$('body').css('overflow-y', '');
				$('body').css('overflow-x', '');
				anotherUtility.loadingAnimation.remove(
					$targetElement,
					{speed: 100},
					function() { $(window).trigger(window.onAjaxNavigateFinished); }
				);
			}
			
			history.pushState(null, data.title, url);
			$(window).trigger(window.onNavigate);
			location = anotherUtility.currentURL();
			$.each(anotherUtility.ajax.prevURL, function(i,e) {
				anotherUtility.ajax.prevURL[i] = location[i];
			});
			if ($('body').height() > window.innerHeight) $('body').css('overflow-y', 'scroll');
			if ($('body').width() > window.innerWidth) $('body').css('overflow-x', 'scroll');
			$container.wrapAll($animationContainer);
			observer = new MutationObserver(contentLoaded);
			observer.observe($container[0] , {childList: true, subtree: true });
			$animationContainer.fadeOut(
				100,
				function() { $container.html(data.contents); }
			);		
		}
	},
}

anotherUtility.arrayMergeUnique = function(arrays, sort) {
	let newArray = [];
	$.each(arrays, function() {
		$.each(this, function(i, v) {
			if (newArray.indexOf(v) === -1) newArray.push(v);
		});
	});
	if (sort) newArray = newArray.sort();
	return newArray;
}


anotherUtility.currentPageClass = function() {
	$('a').each(function() {
		if (anotherUtility.isSameTarget(this.href)) { $(this).addClass('current-page'); }
		else { $(this).removeClass('current-page'); }
	});
}

anotherUtility.events = (function() {
	let eventNames = ['ajaxNavigateFinished', 'formComplete', 'navigate']
		,createEvents = (eventName) => {
			let onEventName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
			if (typeof CustomEvent === 'function')
				window[onEventName] = new CustomEvent(eventName, {bubbles: true});
			else { // IE compatibility.
				window[onEventName] = document.createEvent('Event');
				window[onEventName].initEvent(eventName, true, false);
			}
		}
	eventNames.forEach(createEvents);
})();

anotherUtility.getURLParam = function(param) {
	let queryString = window.location.search.substring(1)
		,queryVariables = queryString.split('&')
		,result;

	queryVariables.forEach((val, i) => {
		let queryParams = queryVariables[i].split('=');
		if (queryParams[0] == param) result = queryParams[1];
	});
	return result;
}

anotherUtility.headerNavPrimary = function() {
	let $nav = $('#header-nav-primary'),
		$menu = $('.menu', $nav),
		$aElm = $('a', $menu),
		paddingInitial = parseInt($aElm.css('padding-top')),
		execTimer = new anotherUtility.ExecTimer(exec);

	function exec() {

		(function menuHeight() {
			if (window.matchMedia('(min-width: 1024px)').matches || window.matchMedia('print').matches) {
				if ($menu.css('min-height')) $menu.css('min-height', '');
			} else {
				let menuMinHeight = window.innerHeight - $menu.offset().top;
				$menu.css('min-height', menuMinHeight + 'px');
			}
		})();

		(function aElmHeight() {
			if($('body').hasClass('lightbox-visible')) return;

			let paddingDelta, paddingNew,
				navSuperHeight = $('#header-nav-super').height();
			
			if ($(window).scrollTop() >= navSuperHeight) {
				$nav.addClass('fixed');
				if (window.matchMedia('(min-width: 1024px)').matches || window.matchMedia('print').matches) {
					paddingDelta = (navSuperHeight - $(window).scrollTop())/2;
					paddingNew = paddingInitial + paddingDelta;
					if (paddingNew <= paddingInitial) {
						if (paddingNew < Math.ceil(paddingInitial/2)) paddingNew = Math.ceil(paddingInitial/2);
						if (paddingNew == parseInt($aElm.css('padding-top'))) return;
						let paddingNewPx = paddingNew + 'px';
						$aElm.css({
							'padding-top': paddingNewPx,
							'padding-bottom': paddingNewPx
						});
					}
				} else {
					$aElm.css({
						'padding-top': '',
						'padding-bottom': ''
					});
				}
			} else {
				$nav.removeClass('fixed');
				$aElm.css({
					'padding-top': '',
					'padding-bottom': ''
				});
			}
			if (
				$(window).scrollTop() >= navSuperHeight
				&& (window.matchMedia('(min-width: 1024px)').matches || window.matchMedia('print').matches)
				&& paddingNew < paddingInitial
				&& paddingNew > Math.ceil(paddingInitial/2)
			) $nav.addClass('height-variable');
			else $nav.removeClass('height-variable');
		})();
	}

	exec();
	$(window).on('resize.headerNavPrimary scroll.headerNavPrimary', execTimer.exec);


}

anotherUtility.icons = function(scope) {
	anotherUtility.icons.backgrounds = {};
	let icons = typeof scope === 'string' ? $('.icon .image', scope) : $('.icon .image');

	// Create object of backround image URLs and the elements that use it.
	icons.each(function() {
		let image = $(this).css('background-image');
		if (image == 'none') return;
		image = image.replace(/^url\("?/i, '').replace(/"?\)$/i, '');
		if (!anotherUtility.icons.backgrounds.hasOwnProperty(image)) anotherUtility.icons.backgrounds[image] = {
			loaded: null,
			elements: []
		};
		if ($.inArray(this, anotherUtility.icons.backgrounds[image].elements) === -1 ) anotherUtility.icons.backgrounds[image].elements.push(this);
	});

	// Attempt to load images. If successful, hide the alt element for the image div.
	$.each(anotherUtility.icons.backgrounds, function(url, obj) {
		if (obj.loaded !== null) return;
		$.ajax(url)
			.done(function() {
				obj.loaded = true;
				$(obj.elements).closest('.icon').addClass('alt-hidden');
				$('.alt', obj.elements).each(function() {
					$(this).closest('.icon').append($('<div class="tooltip">' + this.innerHTML + '</div>'));
					$(this).remove();
				});
				$(obj.elements).each(function() {
					anotherUtility.tooltips($(this).closest('.icon'));
				});
			})
			.fail(obj.loaded = false)
	});
}

anotherUtility.isSameTarget = function(url, currentURL) {
	let currentBaseURL,
		a = document.createElement('a'),				
		baseURL;

	if (currentURL) {
		if (!(currentURL.protocol && currentURL.hostname && currentURL.pathname))
			throw new Error('Invalid value for \'currentURL\'');

		currentBaseURL = currentURL.protocol + '//' + currentURL.hostname + currentURL.pathname;
		
		if (currentBaseURL.substr(-1) === '/')
			currentBaseURL = currentBaseURL.slice(0, -1);
	}
	else currentBaseURL = anotherUtility.currentURL().baseNoTrailingSlash;

	a.href = url;
	baseURL = a.protocol + '//' + a.hostname + a.pathname;
	baseURL = a.pathname.substr(-1) === '/' ? baseURL.slice(0, -1) : baseURL;
	
	return baseURL === currentBaseURL;
}

anotherUtility.jumpTo = function() {
	let hash = anotherUtility.currentURL().hash.slice(1);
	if (targetExists(hash)) doJump(hash);
	attachListeners();

	$(window).on('ajaxNavigateFinished.jumpTo', function() {
		doJump(anotherUtility.currentURL().hash.slice(1));
		attachListeners();
	});

	$(window).on('popstate', function() {
		doJump(anotherUtility.currentURL().hash.slice(1));
	});

	function targetExists(name) {
		return $('[name="' + name + '"]').length > 0; // Target exists
	}
	function attachListeners() {
		$('a[href^="#"]')
			.filter(function() {
				return targetExists($(this).attr('href').substr(1));
			})
			.off('click.jumpTo')
			.on('click.jumpTo', function(event){ doJump($(this).attr('href').substr(1)) });
				
	}
	function doJump(name) {
		if(!targetExists(name)) return false;

		let currentScroll = {x: window.scrollX, y: window.scrollY},
			$target = $('[name="' + name + '"]').first(),
			targetOffset = $target.offset(),
			viewport = {width: window.innerWidth, height: window.innerHeight},
			fontSize = parseInt($target.css('font-size')),
			scrollTo = {x: targetOffset.left - fontSize, y: targetOffset.top - fontSize},
			instantaneous;

		if (scrollTo.y > $('#header-nav-super').outerHeight()) scrollTo.y -= 34; // account for fixed primary header

		instantaneous = Math.abs(currentScroll.y - scrollTo.y) > viewport.height || Math.abs(currentScroll.x - scrollTo.x) > viewport.width; // use instantaneous scrolling if the amount to scroll is greater than the viewport width and/or height.

		if (instantaneous) window.scrollTo(scrollTo.x, scrollTo.y);
		else $('html, body').animate({
				scrollLeft: scrollTo.x,
				scrollTop: scrollTo.y
			}, 500);
	}
}

anotherUtility.keydownListener = function() {
	$(document).on('keydown.keydownListener', function(e) {
		switch (e.which) {
			// Enter
			case 13:
				document.activeElement.click();
				break;
			// Escape
			case 27: 
				break;
		}
	});
}

anotherUtility.mainMenu = function(selector) {

	if (!$(selector).length) throw new Error('Not a valid selector: ' + selector);

	let $menu = $('.menu', selector)
		,$toggle = $('.toggle', selector)
		,focusCheckIID
		,toggleEnabled
		,fixedHeight
		,resizeExecTimer = new anotherUtility.ExecTimer(resizeExec)
		,scrollExecTimer = new anotherUtility.ExecTimer(setHeight)

	$(window).on('resize.' + selector + '.menu', resizeExecTimer.exec);
	$(window).on('scroll.' + selector + '.menu', scrollExecTimer.exec);

	setHeight();
	enableToggle(true);

	function focusCheck() {
		if ($(selector).has(document.activeElement).length == 0 && focusCheckIID) {
			clearInterval(focusCheckIID);
			focusCheckIID = null;
			if (toggleEnabled && !(window.matchMedia('(min-width: 1024px)').matches || window.matchMedia('print').matches))
				$toggle.click();
		}
	}

	function toggle() {
		if ($menu.hasClass('visible')) {
			$menu.removeClass('visible')
			if (focusCheckIID) {
				clearInterval(focusCheckIID);
				focusCheckIID = null;
			}
		} else {
			$menu.addClass('visible')
			focusCheckIID = setInterval(focusCheck, $.fx.interval);
		}
	}

	function enableToggle(state) {
		toggleEnabled = state;
		if (state) $toggle.on('click.' + selector + '.menu', toggle);
		else $toggle.off('click.' + selector + '.menu');
	}

	function setHeight() {
		if ($(selector).hasClass('fixed') || $menu.css('display') == 'block') {
			fixedHeight = $(window).height() - $toggle.outerHeight() + 1
			if (!$(selector).hasClass('fixed')) {
				fixedHeight += -$(selector).position().top + $(window).scrollTop();
			}
			if ($menu.height() > fixedHeight) $menu.height(fixedHeight);
			else $menu.css('height', '');
		}
	}

	function resizeExec() {
		if ((window.matchMedia('(min-width: 1024px)').matches || window.matchMedia('print').matches)
			&& toggleEnabled
		) enableToggle(!toggleEnabled);
		else {
			if (!toggleEnabled) enableToggle(!toggleEnabled);
			setHeight();
		}
	}
}

anotherUtility.msie = function() {
	if ($.inArray(anotherUtility.browser.name, ['MSIE', 'Edge']) != -1)
		$('html').addClass(anotherUtility.browser.name.toLowerCase());
	
	if ($('html.ie-old').length && !Cookies.get('ie-warn-close')) {
		let alert, string;
		switch (anotherUtility.OS) {
			case 'Windows 2000 / Server 2000':
			case 'Windows XP':
			case 'Windows XP Pro x64 / Windows Server 2003':
				let osText, supportEnd;
				switch (anotherUtility.OS) {
					case 'Windows 2000 / Server 2000':
						osText = 'Windows 2000';
						supportEnd = '2010';
						break;
					case 'Windows XP':
					case 'Windows XP Pro x64 / Windows Server 2003':
						osText = 'Windows XP';
						supportEnd = '2014';
						break;
				}
				string = '<p style="font-size: 4em; margin-bottom:0.5em;" aria-hidden="true">&#9888;</p><p>It appears that you are using an old version of Internet Explorer on ' + osText + ', which may cause this site to not work correctly.</p><p><b>Using ' + osText + ' creates a <em>serious</em> security risk for you</b> as security updates for ' + osText + ' ended in ' + supportEnd + '. Just by connecting your computer to the internet, you may be exposing yourself to viruses and identity theft.</p><p>Please <a href="https://microsoft.com/windows/" target="_blank">upgrade to your computer to a current version of Windows</a>.</p>';
				break;
			case 'Windows Vista / Server 2008':
				string = '<p style="font-weight:bold; font-size: 2em; margin-bottom:0.75em;">:(</p><p>It appears that you are using a version of Internet Explorer that has been depreciated (i.e. discontinued). <b>This creates a security risk for you</b> and it may cause this site to not work correctly.</p><p>Unfortunately, the version of Windows that you are using does not support the latest version of Internet Explorer. Please either <a href="https://microsoft.com/windows/" target="_blank">upgrade to your computer to a newer version of Windows</a> or use another modern web browser such as <a href="https://www.google.com/chrome/" target="_blank">Google Chrome</a>, <a href="https://www.mozilla.org/firefox/" target="_blank">Mozilla Firefox</a>, or <a href="https://opera.com/" target="_blank">Opera</a>.';
				break;
			default:
				string = '<p style="font-weight:bold; font-size: 2em; margin-bottom:0.75em;">:(</p><p>It appears that you are using a version of Internet Explorer that has been depreciated (i.e. discontinued). <b>This creates a security risk for you</b> and it may cause this site to not work correctly.</p><p>Please <a href="https://microsoft.com/ie/" target="_blank">upgrade to the latest version of Internet Explorer</a>, or use another modern web browser such as <a href="https://www.google.com/chrome/" target="_blank">Google Chrome</a>, <a href="https://www.mozilla.org/firefox/" target="_blank">Mozilla Firefox</a>, or <a href="https://opera.com/" target="_blank">Opera</a>.';
				break;
		}
		string += '<p style="margin-bottom:0;"><a href="#" id="ie-warn-close" onClick="event.preventDefault(); document.getElementById(\'ie-warn\').remove();Cookies.set(\'ie-warn-close\', true);">Close</a></p>';
		alert = $(document.createElement('div')).attr({
				id: 'ie-warn',
				role: 'alert'
			})
			.addClass('alert alert-warning')
			.html(string);
		$('body').prepend(alert);
	}
}

anotherUtility.page = {
	create: function(page, navigateOff) {
		if (!page.length) throw new Error('No page name provided.');

		anotherUtility.page[page] = anotherUtility.page[page] || {};

		anotherUtility.page[page].name = page;
		anotherUtility.page[page].navigateOff = navigateOff;
		anotherUtility.page[page].onNavigate = function(page, navigateOff) {
			// Check for whether navigate events are active. If not, add a listener for this page.
			if(!$._data(window, 'events').navigate || !$._data(window, 'events').navigate[page]) {
				$(window).on('navigate.' + page,
					function (e) {
						// If the window navigates away from current page, stop listening for navigate events from this page and remove the top level function for cleanup.
						if (e.target.location.href != window.url.ROOT + page) {
							$(window).off('navigate.' + page);
							if (typeof navigateOff === 'function') navigateOff.call();
							delete anotherUtility.page[page];
						}
				});
			}
		}(page, navigateOff);
	}
}

anotherUtility.pageCSS = function(page) {

	page = page || '';

	let $link,
		identifier = page || 'front',
		filePath = window.url.ROOT + 'assets/css/' + identifier + '.min.css';

	if (!$('link[rel="stylesheet"][href="' + filePath + '"]', 'head')) return false;

	$link = $(document.createElement('link')).attr({
		rel: 'stylesheet',
		href: filePath
	})

	$('head').append($link);

	// Check for whether navigate events are active. If not, add a listener for this page.
	if(!$._data(window, 'events').navigate || !$._data(window, 'events').navigate['css'] || !$._data(window, 'events').navigate.css[identifier]) {
		$(window).on('navigate.css.' + identifier,
			function (e) {
				// If the window navigates away from current page, stop listening for navigate events from this page and remove the top level function for cleanup.
				if([window.url.ROOT + page, window.url.ROOT.substr(0, window.url.ROOT.length-1)].indexOf(e.target.location.href) === -1) {
					$(window).off('navigate.css.' + identifier);
					$link.remove();
				}
		});
	}
}

anotherUtility.preloadImages = function(imgs) {
	if (typeof imgs == 'object') {
		for (let i = 0; i < imgs.length; i++) {
			$("<img />").attr("src", imgs[i]);
		}
	} else {
		$("<img />").attr("src", imgs);
	}
}

anotherUtility.setTabIndicies = function() {
	let tabIndicies = $("[tabindex]").map(function() {
			return $(this).attr('tabindex')
		}),
		tabIndexGreatest = Math.max.apply(Math, tabIndicies),
		focusable = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [contentEditable=true]',
		noTabIndex = $(focusable).not('[tabindex]');

	$(noTabIndex).each(function() {
		tabIndexGreatest++;
		$(this).attr('tabindex', tabIndexGreatest);
	});
	$(focusable, '#header .super').each(function(){
		tabIndexGreatest++;
		$(this).attr('tabindex', tabIndexGreatest);
	})
}

anotherUtility.tableGenerator = function(arg1, arg2, arg3) {
	let columns, rows, options;

	if (typeof arg3 === 'undefined') {
		if (typeof arg2 === 'undefined') { // Only rows. No columns or options.
			
			if (anotherUtility.validator.isArray(arg1)) rows = arg1;
			else throw new anotherUtility.ArgumentError(arg1, 'rows (argument 1)', 'tableGenerator');

		} else { // Rows and options. No columns.
			if (!(anotherUtility.validator.isArray(arg1))) throw new anotherUtility.ArgumentError(arg1, 'rows (argument 1)', 'tableGenerator');
			if (!(anotherUtility.validator.isObject(arg2))) throw new anotherUtility.ArgumentError(arg2, 'options (argument 2)', 'tableGenerator');

			options = arg2;
			rows = arg1;
		}
	}
	else { // Columns, rows and options.
		if (!(anotherUtility.validator.isNotEmptyArray(arg1))) throw new anotherUtility.ArgumentError(arg1, 'columns (argument 1)', 'tableGenerator');
		if (!(typeof arg2 === 'undefined' || anotherUtility.validator.isArray(arg2))) throw new anotherUtility.ArgumentError(arg2, 'rows (argument 2)', 'tableGenerator');
		if (!(typeof arg3 === 'undefined' || anotherUtility.validator.isObject(arg3))) throw new anotherUtility.ArgumentError(arg3, 'options (argument 3)', 'tableGenerator');

		options = arg3;
		rows = arg2;
		columns = arg1;
	}
	

	let table = document.createElement('table')
		,thead = document.createElement('thead')
		,ths = document.createDocumentFragment()
		,tbody = document.createElement('tbody')
		,trs = document.createDocumentFragment()
		,tr = document.createElement('tr')

	if (anotherUtility.validator.isNotEmptyArray(columns)) {
		columns.forEach(function(column) {
			let th = document.createElement('th');
			th.innerHTML = column;
			ths.appendChild(th);
		});
		tr.appendChild(ths);
		thead.appendChild(tr);
	}
	table.appendChild(thead);

	if (anotherUtility.validator.isNotEmptyArray(rows)) {
		rows.forEach(function(row) {
			let properties = Object.getOwnPropertyNames(row);

			function cellContent(content) {
				return content instanceof HTMLElement ? content.outerHTML : content;
			}

			tr = document.createElement('tr');

			if (anotherUtility.validator.arraysEqual(['values'], properties) || anotherUtility.validator.arraysEqual(['values', 'href'], properties, false)) {

				if (anotherUtility.validator.isNotEmptyString(row.href) || anotherUtility.validator.isNumber(row.href)) tr.setAttribute('data-href', row.href);

				if (anotherUtility.validator.isNotEmptyArray(columns)) {
					columns.forEach(function(column) {
						let td = document.createElement('td')
							,aElm = document.createElement('a')

						aElm.href = row.href;

						if (column.toLowerCase() in row.values) {
							let cell = row.values[column.toLowerCase()];
							aElm.innerHTML = cellContent(cell);
						}
						
						td.appendChild(aElm);	
						tr.appendChild(td);
					});
				}
				else {
					row.values.forEach(function(cell) {
						let td = document.createElement('td')
							,aElm = document.createElement('a')

						aElm.href = row.href;
						aElm.innerHTML = cellContent(cell);						
						td.appendChild(aElm);	
						tr.appendChild(td);
					});
				}
			}
			else {
				if (anotherUtility.validator.isNotEmptyArray(columns)) {
					columns.forEach(function(column) {
						let td = document.createElement('td');

						if (column.toLowerCase() in row) {
							let cell = row[column.toLowerCase()];
							
							td.innerHTML = cellContent(cell);
						}

						tr.appendChild(td);
					});
				}
				else {
					row.forEach(function(cell) {
						let td = document.createElement('td');

						td.innerHTML = cellContent(cell);
						tr.appendChild(td);
					});
				}
			}
		
			trs.appendChild(tr);
		});
		tbody.appendChild(trs);
	}
	table.appendChild(tbody);

	if (options && 'tableClass' in options) $(table).addClass(options.tableClass);

	return table;
}

anotherUtility.tooltips = function(context) {
	if (anotherUtility.validator.isNotEmptyArray(context)) {
		$(context).each(function() {
			anotherUtility.tooltips(this);
		});
		return;
	}
	
	let selector = typeof context === 'object' && context instanceof jQuery ? $('.tooltip', context) : $('.tooltip');
	selector.closest('.icon').each(function() {
		if (typeof $._data(this, 'events') !== 'object' || !$._data(this, 'events').hasOwnProperty('mouseenter.tooltip')) {
			$(this).on('mouseenter.tooltip', function() {
				this.mouseover = true;
				let self = this;
				setTimeout(function() {
					if (self.mouseover) $('.tooltip', self).fadeIn(200);
				}, 1000);
			});
		}
		if (!$._data(this, 'events').hasOwnProperty('mouseleave.tooltip')) {
			$(this).on('mouseleave.tooltip', function() {
				this.mouseover = false;
				$('.tooltip', this).fadeOut(100);
			});
		}
	});
}

anotherUtility.currentURL = function() {
	let location = window.location,
		currentURL = {
			protocol: location.protocol,
			hostname: location.hostname,
			pathname: location.pathname,
			hash: location.hash
		}
	currentURL.base = currentURL.protocol + '//' + currentURL.hostname + currentURL.pathname;
	currentURL.baseNoTrailingSlash = currentURL.pathname.substr(-1) === '/'
		? currentURL.base.slice(0, -1)
		: currentURL.base;
	return currentURL;
}

anotherUtility.validator = {
	arraysEqual: function(array1, array2, sameOrder) {
		sameOrder = sameOrder === false ? false : true;
		return sameOrder
			? array1.length == array2.length && array1.every(function(element, index) {
					return element === array2[index]; 
				})
			: array1.length == array2.length
				&& array1.every(function(element, index) {
					return array2.indexOf(element) !== -1
				})
				&& array2.every(function(element, index) {
					return array1.indexOf(element) !== -1
				})
	}
	,isArray: function(subject) { return this.isNotEmptyObject(subject) && subject instanceof Array; }
	,isNotEmptyArray: function(subject) { return this.isArray(subject) && subject.length > 0 }
	,isBoolean: function(subject) { return typeof subject === 'boolean'; }
	,isNumber: function(subject, strict) {
		strict = strict || false;
		return strict
			? typeof subject === 'number'
			: typeof +subject === 'number'
	}
	,isNumeric: function(subject, strict) {
		strict = strict || false;
		return this.isNumber(subject, strict) && isFinite(subject)
	}
	,isObject: function (subject) { return typeof subject === 'object'; }
	,isNotEmptyObject: function(subject) { return this.isObject(subject) && Object.keys(subject).length > 0; }
	,isPrimitive: function(subject) { return isString(subject)
		|| isNumber(subject)
		|| isBoolean(subject)
		|| isSymbol(subject)
		|| typeof subject === 'undefined'
		|| typeof subject === 'null';
	}
	,isNotEmptyPrimitive: function(subject) { return isNotEmptyString(subject) || isNumeric(subject) || isBoolean(subject) || isSymbol(subject); }
	,isString: function (subject) { return typeof subject === 'string'; }
	,isNotEmptyString: function(subject) { return this.isString(subject) && subject.length > 0; }
	,isSymbol: function(subject) { return typeof subject === 'symbol'; }
}

return anotherUtility;

});