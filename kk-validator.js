/*
 * kk-validator v0.0.1
 * (c) 2014 Kęstutis Katkus http://kkatkus.com
 * License: MIT
 */

(function() {
	'use strict';

	angular.module('kk.validator', [])

		.service("kkVldService", [ "$q", "$timeout", "$compile", function ($q, $timeout, $compile) {

			var /**
				 * @errors stores validation error messages
				 */
				errors = {},

				/**
				 * @popovers stores popover elements
				 */
				popovers = {},

				/**
				 * @popovers stores popover elements
				 */
				popovers2 = {},

				/**
				 * @popovers stores radios elements
				 */
				radios = {},

				/**
				 * @hasOwnProperty helper
				 */
				hasOwnProperty = Object.prototype.hasOwnProperty,

				/**
				 * Util to check if object is empty = {}
				 * @returns boolean
				 */
				isEmpty = function (obj) {

					// null and undefined are "empty"
					if (obj == null) return true;

					// Assume if it has a length property with a non-zero value
					// that that property is correct.
					if (obj.length > 0)    return false;
					if (obj.length === 0)  return true;

					// Otherwise, does it have any properties of its own?
					// Note that this doesn't handle
					// toString and valueOf enumeration bugs in IE < 9
					for (var key in obj) {
						if (hasOwnProperty.call(obj, key)) return false;
					}

					return true;
				},

				onGetOptions = function (scope, elementOptions, defaultOptions) {
					var __hasProp = {}.hasOwnProperty,
						option,
						options = angular.copy(defaultOptions || {}),
						value,
						_ref;

					if (elementOptions != null) {
						try {
							_ref = scope.$eval(elementOptions);
						} catch (e) {
							console.error('Options must be json object but found:', elementOptions);
							return;
						}

						for (option in _ref) {
							if (!__hasProp.call(_ref, option)) continue;
							value = _ref[option];
							options[option] = value;
						}
					}
					return options;
				},

				/**
				 * Util to make validations
				 * @returns function
				 */
				onMakeValidations = function (validations) {
					return function (val) {
						var i, _i, _ref;
						if (angular.isUndefined(val) || val === '' || val === null) {
							return true;
						}
						for (i = _i = 0, _ref = validations.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
							if (!validations[i](val)) {
								return false;
							}
						}
						return true;
					};
				},

				/**
				 * Util to check if element is checkbox
				 * @returns boolean
				 */
				onIsElementCheckbox = function (elem) {
					return elem[0].type === 'checkbox';
				},

				/**
				 * Util to check if element is radio
				 * @returns boolean
				 */
				onIsElementRadio = function (elem) {
					return elem[0].type === 'radio';
				},

				/**
				 * Util to get generate random id
				 * @returns string
				 */
				onGetRandomId = function () {
					var text = "";
					var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

					for( var i=0; i < 5; i++ )
						text += possible.charAt(Math.floor(Math.random() * possible.length));

					return text;
				},

				/**
				 * Util to get form name from element
				 * @returns string
				 */
				onGetFormNameFromElement = function (elem) {
					return elem.controller('form') ? elem.controller('form').$name : undefined;
				},

				/**
				 * Util to get form name form object of form name
				 * @returns string
				 */
				onGetFormName = function (frm) {
					return typeof frm === 'object' ? frm.$name : frm;
				},

				/**
				 * Util to get form id or create random and return
				 * @returns string
				 */
				onGetElementId = function (elem) {
					var formName = onGetFormNameFromElement(elem);

					elem[0].id = elem[0].id || 'kk-vld-fld-' + onGetRandomId();

					errors[formName] = errors[formName] || {};
					errors[formName][elem[0].id] = errors[formName][elem[0].id] || {};

					popovers[formName] = popovers[formName] || {};
					popovers[formName][elem[0].id] = popovers[formName][elem[0].id] || undefined;

					popovers2[formName] = popovers2[formName] || {};

					radios[formName] = radios[formName] || {};
					if (elem[0].name) {
						radios[formName][elem[0].name] = radios[formName][elem[0].name] || [];
					}

					return elem[0].id;
				},

				/**
				 * Util to store popover in bind list
				 */
				onAddPopoverToBindList = function (elem) {
					popovers[onGetFormNameFromElement(elem)][elem[0].id] = true;
				},

				/**
				 * Util to check if popover exist in bind list
				 * @returns boolean
				 */
				onIsPopoverInBindList = function (elem) {
					return popovers[onGetFormNameFromElement(elem)] && popovers[onGetFormNameFromElement(elem)][elem[0].id] === true;
				},

				/**
				 * Util to add spinner to element when async validation starts
				 */
				onAddAsyncSpinner = function (elem) {
					elem.parent().append('<i class="kk-vld-spinner"></i>');
				},

				/**
				 * Util to remove spinner from element when async validation stops
				 */
				onRemoveAsyncSpinner = function (elem) {
					angular.forEach(elem.parent().children(), function (i){
						var el = angular.element(i);
						if (el.hasClass('kk-vld-spinner')) {
							el.remove();
						}
					});
				},

				/**
				 * Util to add validation message and create popover
				 */
				onAddElementError = function (errorId, errorMessage, scope, elem, recursive) {

					var id = onGetElementId(elem),
						formName = onGetFormNameFromElement(elem);
					errors[formName][id][errorId] = errorMessage;

					elem.parent().addClass('kk-vld-error');

					if (onIsElementRadio(elem)) {
						if (radios[formName][elem[0].name].indexOf(elem) === -1) {
							radios[formName][elem[0].name].push(elem);
						}
					}
				},

				/**
				 * Util to remove validation error and destroy popover
				 * @returns boolean
				 */
				onRemoveElementError = function (errorId, scope, elem) {

					var id = onGetElementId(elem),
						formName = onGetFormNameFromElement(elem);
					if (errors[formName] && errors[formName][id] && errors[formName][id][errorId]) {
						delete errors[formName][id][errorId];
						if (isEmpty(errors[formName][id])) {
							elem.parent().removeClass('kk-vld-error');
						}
					}

					onDestroyPopover();
				},

				/**
				 * Util to get element validation errors
				 * @returns array
				 */
				onGetElementErrors = function (elem) {
					return errors[onGetFormNameFromElement(elem)][onGetElementId(elem)];
				},

				onDestroyPopover = function () {
					var popover = document.getElementsByClassName('kk-vld-popover');
					if (popover.length > 0) {
						popover[0].parentNode.removeChild(popover[0]);
					}
				},

				onCreatePopover = function (scope, elem) {

					var popover,
						errors = onGetElementErrors(elem);

					//delete popover if exists
					onDestroyPopover();

					if (!isEmpty(errors)) {

						var pl = elem.prop('offsetLeft'),
							pt = elem.prop('offsetTop'),
							tpl = '<div class="kk-vld-popover">' +
								'<div class="kk-vld-popover-arrow"></div>' +
								'<div class="kk-vld-popover-content">{{messages}}</div>' +
								'</div>',
							messages = '';
						popover = angular.copy(tpl),
							angular.forEach(errors, function (error) {
								messages = messages + '<span class="kk-vld-popover-message">' + error +'</span>';
							});

						popover = popover.replace('{{messages}}', messages);
						popover = angular.element(popover);

						elem.after(popover);
						$compile(popover)(scope);

						popover.css('bottom', popover[0].offsetHeight - pt + 22 + 'px');
						popover.css('left', pl + 'px');
					}
				},

				onProcess = function(errorId, isValid, errorMessage, scope, elem) {

					if (isValid) {
						onRemoveElementError(errorId, scope, elem);
					} else {
						onAddElementError(errorId, errorMessage, scope, elem);
					}

					// sync other radio buttons
					if (onIsElementRadio(elem)) {
						var formName = onGetFormNameFromElement(elem);
						angular.forEach(radios[formName][elem[0].name], function (e) {
							//if (id !== onGetElementId(e)) {
								$timeout(function () {
									if (isValid) {
										onRemoveElementError(errorId, scope, e);
										onResetProp(formName, e);
									} else {
										onAddElementError(errorId, errorMessage, scope, e);
										onResetProp(formName, e);
									}
								}, 0);
							//}
						});
					}

					// bind mouse events
					if (!onIsPopoverInBindList(elem)) {
						onAddPopoverToBindList(elem);

						if (onIsElementCheckbox(elem) || onIsElementRadio(elem)) {
							elem.parent()
								.bind('mouseover click', function () {
									onCreatePopover(scope, elem);
								})
								.bind('mouseleave', onDestroyPopover)
						} else {
							elem.bind('mouseover keyup', function () {
									onCreatePopover(scope, elem);
								})
								.bind('mouseleave', onDestroyPopover)
						}
					}
				},

				/**
				 * Util to reset element in given form
				 */
				onResetProp = function (form, prop) {

					// hack: modelValue is undefined if validators fail
					if (form.hasOwnProperty(prop) && prop.indexOf('$') < 0) {
						if (form[prop].$modelValue !== form[prop].$viewValue) {
							form[prop].$modelValue = null;
						}
					}

					// after reset form, re validate all form elements
					$timeout(function () {
						if (form.hasOwnProperty(prop) && prop.indexOf('$') < 0) {
							form[prop].$validate();
						}
					});
				},

				/**
				 * Util to clear form/all error messages
				 */
				onResetForm = function (form) {

					// bring back form in initial state
					if (form) {
						form.$setPristine();
						form.$setUntouched();
					}

					// reset all elements in given form
					for (var prop in form) {
						onResetProp(form, prop);
					}
				},

				/**
				 * Util to get form error messages
				 * @returns array
				 */
				onGetFormErrors = function (frm) {
					return frm ? errors[onGetFormName(frm)] : errors;
				};

			// Publish delegate instance/object with desired API
			return {
				process: onProcess,
				getOptions: onGetOptions,
				makeValidations: onMakeValidations,
				isElementCheckbox: onIsElementCheckbox,
				isElementRadio: onIsElementRadio,
				addElementError: onAddElementError,
				removeElementError: onRemoveElementError,
				getElementErrors: onGetElementErrors,
				getFormErrors: onGetFormErrors,
				resetForm: onResetForm,

				addAsyncSpinner: onAddAsyncSpinner,
				removeAsyncSpinner: onRemoveAsyncSpinner
			};
		}])

		.directive('kkVldRequired', [ "kkVldService", function (kkVldService) {
			return {
				require: 'ngModel',
				scope: false,
				link: function (scope, elem, attrs, ctrl) {

					var options = kkVldService.getOptions(scope, attrs.kkVldRequired, {}),
						errorMessage = options.message || 'Field is invalid' ;

					ctrl.$validators.kkVldRequired = function (value) {

						var result = false;

						if (kkVldService.isElementCheckbox(elem)) {
							result = elem[0].checked === true;
						} else if (kkVldService.isElementRadio(elem)) {
							if (elem[0].name) {
								var radios = document.getElementsByName(elem[0].name),
									i;
								for (i = 0; i < radios.length; i = i + 1) {
									if (radios[i].checked === true) {
										result = true;
									}
								}
							} else {
								console.error('Radio Inputs must have "name" attribute!!');
							}
						} else {
							result = angular.isDefined(value) && value !== '';
						}

						kkVldService.process("kkVldRequired", result, errorMessage, scope, elem);
						return result;
					};
				}
			};
		}])

		.directive('kkVldString', [ "kkVldService", function (kkVldService) {

			var makeMax = function(max) {
					return function(str) {
						return str.length <= max;
					};
				},
				makeMin = function(min) {
					return function(str) {
						return str.length >= min;
					};
				},
				makeIsValid = function (options) {
					var validations;
					validations = [];
					if (options.min != null) {
						validations.push(makeMin(options.min));
					}
					if (options.max != null) {
						validations.push(makeMax(options.max));
					}
					return kkVldService.makeValidations(validations);
				};

			return {
				require: 'ngModel',
				scope: false,
				link: function (scope, elem, attrs, ctrl) {

					var options = kkVldService.getOptions(scope, attrs.kkVldString, {}),
						isValid = makeIsValid(options),
						errorMessage = options.message || 'String is invalid' ;

					ctrl.$validators.kkVldString = function (value) {
						var result = isValid(value);
						kkVldService.process("kkVldString", result, errorMessage, scope, elem);
						return result;
					};
				}
			};
		}])

		.directive('kkVldNumber', [ "kkVldService", function (kkVldService) {

			var makeMax = function(max) {
					return function(num) {
						return parseInt(num, 10) <= max;
					};
				},
				makeMin = function(min) {
					return function(num) {
						return parseInt(num) >= min;
					};
				},
				makeIsValid = function (options) {
					var validations;
					validations = [];

					if (options.min != null) {
						validations.push(makeMin(options.min));
					}
					if (options.max != null) {
						validations.push(makeMax(options.max));
					}

					return kkVldService.makeValidations(validations);
				};

			return {
				require: 'ngModel',
				scope: false,
				link: function (scope, elem, attrs, ctrl) {

					var options = kkVldService.getOptions(scope, attrs.kkVldNumber, {}),
						isValid = makeIsValid(options),
						errorMessage = options.message || 'Number is invalid' ;

					ctrl.$validators.kkVldNumber = function (value) {
						var result = isValid(value);
						kkVldService.process("kkVldNumber", result, errorMessage, scope, elem);
						return result;
					};
				}
			};
		}])

		.directive('kkVldEmail', [ "kkVldService", function (kkVldService) {
			return {
				require: 'ngModel',
				scope: false,
				link: function (scope, elem, attrs, ctrl) {
					var options = kkVldService.getOptions(scope, attrs.kkVldEmail, {}),
						errorMessage = options.message || 'Field is invalid' ;

					ctrl.$validators.kkVldEmail = function (value) {
						var emailRegExp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
							result = true;

						if (angular.isDefined(value) && value !== '') {
							result = emailRegExp.test(value);
						}

						kkVldService.process("kkVldEmail", result, errorMessage, scope, elem);
						return result;
					};
				}
			};
		}])

		.directive('kkVldCustom', [ "$q", "kkVldService", function ($q, kkVldService) {
			return {
				require: 'ngModel',
				scope: false,
				link: function (scope, elem, attrs, ctrl) {

					var options = kkVldService.getOptions(scope, attrs.kkVldCustom, {}),
						errorMessage = options.message || 'Field is invalid';

					if (options.async) {
						ctrl.$asyncValidators.kkVldCustom = function(value) {

							var deferred = $q.defer();

							if (angular.isUndefined(value) || value === '') {
								kkVldService.process("kkVldCustom", true, errorMessage, scope, elem);
								deferred.resolve();
							} else {
								kkVldService.addAsyncSpinner(elem);

								scope[options.fn].call(this, value)
									.then(
									function () {
										kkVldService.process("kkVldCustom", true, errorMessage, scope, elem);
										kkVldService.removeAsyncSpinner(elem);
										deferred.resolve();
									},
									function (msg) {
										kkVldService.process("kkVldCustom", false, msg || errorMessage, scope, elem);
										kkVldService.removeAsyncSpinner(elem);
										return deferred.reject();
									}
								);
							}

							return deferred.promise;
						};
					} else {
						ctrl.$validators.kkVldCustom = function (value) {

							if (angular.isUndefined(value) || value === '') {
								kkVldService.process("kkVldCustom", true, errorMessage, scope, elem);
								return true;
							}

							var result = scope[options.fn].call(this, value);
							kkVldService.process("kkVldCustom", result, errorMessage, scope, elem);
							return result;
						};
					}
				}
			};
		}]);

})();