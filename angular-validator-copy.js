/*
 * angular-validator v0.0.1
 * (c) 2014 Kęstutis Katkus http://kkatkus.com
 * License: MIT
 */

'use strict';

angular.module('kk.validator', [])
	
	.factory("kkVldUtils", [

		function () {

            /**
             * Util to create random string
             * @returns string
             */
			var onRandomString = function (length, numbers, chars, lower, upper) {

                    length = length || 10;
		            numbers = numbers === true ? '0123456789' : (numbers || '');
		            chars = chars === true ? '$&/()!|\\><;,:.-_*?^=+[]{}' : (chars || '');
		            lower = lower === true ? 'abcdefghijklmnopqrstuvwxyz' : (lower || '');
		            upper = upper === true ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : (upper || '');

		            var result = '',
		                seed = upper + lower + numbers + chars,
		                i;

		            seed = seed === '' ? 'abcdefghijklmnopqrstuvwxyz0123456789' : seed;

		            for (i = 0; i < length; i = i + 1) {
		                result += seed[Math.floor(Math.random() * (seed.length - 1))];
		            }

		            return result;
                };

            // Publish delegate instance/object with desired API
			return {
				randomString: onRandomString
			};
		}
	])

	.service("kkVldPopover", [ "kkVldUtils", function (kkVldUtils) {

        var /**
             * @messages stores validation messages
             */
            messages = [],

            /**
             * Util to get form name from element
             * @returns string
             */
            onGetFormNameFromElement = function (elem) {
                return elem.controller('form').$name;
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
                elem[0].id = elem[0].id || 'id-' + kkVldUtils.randomString(6, true, false, true);
                var id = elem[0].id || elem[0].name || elem.scope().$id;
                if (!messages[onGetFormNameFromElement(elem)]) {
                    messages[onGetFormNameFromElement(elem)] = {};
                }
                if (!messages[onGetFormNameFromElement(elem)][id]) {
                    messages[onGetFormNameFromElement(elem)][id] = [];
                }
                return id;
            },

            /**
             * Util to create popover
             * @returns boolean
             */
            onCreate = function (elem, hidden) {
                var id = onGetElementId(elem);
                elem.popover({
                    html: true,
                    content: '<ul><li>' + _.pluck(messages[onGetFormNameFromElement(elem)][id], "msg").join("</li><li>") + '</li></ul>',
                    placement: 'top',
                    trigger: 'hover',
                    template:
                        '<div class="kk-vld-popover popover">' +
                            '<div class="arrow"></div>' +
                            '<div class="popover-inner">' +
                                '<div class="popover-content"></div>' +
                            '</div>' +
                        '</div>'
                });
                if (!hidden) {
                    elem.popover('show');
                }
            },

            /**
             * Util to create & show popover
             * @returns boolean
             */
            onShow = function (name, elem, msg, hidden) {
                var id = onGetElementId(elem),
                    i = _.where(messages[onGetFormNameFromElement(elem)][id], { id: name });

                msg = msg || "Invalid field";
                if (i.length === 0) {
                    messages[onGetFormNameFromElement(elem)][id].push({ id: name, msg: msg });
                    onCreate(elem, hidden);
                }
                return true;
            },

            /**
             * Util to destroy popover
             * @returns boolean
             */
            onDestroy = function (name, elem) {
                var id = onGetElementId(elem),
                    i = _.where(messages[onGetFormNameFromElement(elem)][id], { id: name });
                if (!name) {
                    elem.popover('destroy');
                    messages[onGetFormNameFromElement(elem)][id] = [];
                }
                if (i.length !== 0) {
                    elem.popover('destroy');
                    _.remove(messages[onGetFormNameFromElement(elem)][id], function (obj) { return obj.id === name; });
                    if (messages[onGetFormNameFromElement(elem)][id].length !== 0) {
                        onCreate(elem);
                    }
                }
            },

            /**
             * Util to clear all validation messages
             */
            onClear = function (frm) {
                if (frm) {
                    messages[onGetFormName(frm)] = [];
                } else {
                    messages = [];
                }
            },

            /**
             * Util to get validation messages
             * @returns array
             */
            onGetErrors = function (frm) {
                return frm ? messages[onGetFormName(frm)] : messages;
            };

        // Publish delegate instance/object with desired API
        return {
            getElementId: onGetElementId,
            create: onCreate,
            show: onShow,
            destroy: onDestroy,
            clear: onClear,
            getErrors: onGetErrors
        };
    }])

    .service("kkVldService", [ "$q", "$timeout", "kkVldPopover", "kkVldUtils", function ($q, $timeout, kkVldPopover, kkVldUtils) {

        var /**
             * @submittingForm form witch is in submit process
             */
            submittingForm,

            /**
             * @serverErrorName category name of server error
             */
            serverErrorName = 'kkVldServerError',

            /**
             * @radioButtons
             */
            radioButtons = {},

            onIsFormSubmitted = function (elem) {
                var form = elem.controller('form');
                return form.$submitted === true;
            },

            /**
             * Get Form Elements
             * @form form object to get elements from
             * @type optional param to filter elements by type
             * @returns array
             */
            onGetFormElements = function (form, type) {

                angular.forEach(form, function (value, key) {
                    if (angular.isDefined(value) && value.hasOwnProperty('$modelValue')) {
                        //console.log('field', key);
                    }
                });
            },

            onPushRadioElement = function (name, message, elem, ctrl) {
                var formName = elem.controller('form').$name,
                    groupName = elem[0].name;

                if (!radioButtons[formName]) {
                    radioButtons[formName] = {};
                }
                if (!radioButtons[formName][groupName]) {
                    radioButtons[formName][groupName] = {};
                }
                radioButtons[formName][groupName][kkVldPopover.getElementId(elem)] = {
                    name: name,
                    message: message,
                    elem: elem,
                    ctrl: ctrl
                };
            },

            onEnableRadioElements = function (elem) {
                var form = elem.controller('form');
                angular.forEach(radioButtons[form.$name][elem[0].name], function(obj) {
                    onSetValid(obj.name, obj.message, obj.elem, obj.ctrl);

                    console.log(obj);

                });
            },

            /**
             * Mark a form in submit status
             * @returns string
             */
            onSetSubmittingForm = function (form) {
                submittingForm = form;
            },

            /**
             * Remove validation messages and statuses in a form
             * @returns string
             */
            onResetForm = function (form) {
                var id,
                    elem;

                if (!form) {
                    form = submittingForm;
                }

                if (form) {
                    form.$submitted = false;
                    form.$setPristine();
                    var formElem = angular.element(document.getElementsByName(form.$name));
                    if (formElem) {
                        formElem.removeClass('kk-vld-submitted');
                    }
                    var messages = kkVldPopover.getErrors(form.$name);
                    kkVldPopover.clear(form.$name);
                    for (id in messages) {
                        elem = angular.element(document.getElementById(id));
                        elem.popover('destroy');
                    }
                }
            },

            /**
             * Set error message to a field by name
             * @returns string
             */
            onSetInValidByName = function (name, message) {

                var elem = angular.element(document.getElementsByName(name)),
                    isPopup = true;

                if (angular.isDefined(submittingForm) && angular.isDefined(submittingForm[name]) && elem.length > 0) {
                    submittingForm[name].$setValidity(serverErrorName, false);
                    kkVldPopover.show(serverErrorName, elem, message, true);
                    elem.bind('keydown keypress', function () {
                        if (isPopup) {
                            kkVldPopover.destroy(serverErrorName, elem, message);
                            submittingForm[name].$setValidity(serverErrorName, true);
                            isPopup = false;
                        }
                    });
                }
            },

            /**
             * Clear error message from a field name and message
             * @returns string
             */
            onSetValidByName = function (name, message) {

                var elem = angular.element(document.getElementsByName(name));

                if (elem.length > 0) {
                    kkVldPopover.destroy(serverErrorName, elem, message);
                }
            },

            /**
             * Clear all error messages from a field by name
             * @returns string
             */
            onClearByName = function (name) {
                var domElem = document.getElementsByName(name);
                if (domElem.length > 0) {
                    kkVldPopover.destroy(undefined, angular.element(domElem));
                }
            },

            /**
             * Util to set element as invalid and create popover for that element
             * @returns null
             */
            onSetInValid = function (name, message, elem, ctrl) {
                // set invalid
                ctrl.$setValidity(name, false);
                // create popover
                kkVldPopover.show(name, elem, message, true);
            },

            /**
             * Util to set element as valid and destroy popover for that element
             * @returns null
             */
            onSetValid = function (name, message, elem, ctrl) {
                // set valid
                ctrl.$setValidity(name, true);
                // destroy popover
                kkVldPopover.destroy(name, elem, message);
            },

            /**
             * Util to show popover on element focus
             * @returns null
             */
            onShowPopoverOnFocus = function (name, message, elem, ctrl) {
                var form = elem.controller('form');
                elem.bind('focus', function () {
                    if ((ctrl.$dirty || form.$submitted) && ctrl.$error[name]) {
                        kkVldPopover.show(name, elem, message, false);
                    }
                });
            },

            /**
             * Util to initialize validation functionality for element
             * @returns null
             */
            onInitialize = function (name, defaultMessage, elem, attr, ctrl, validationFunc, isCustom) {

                kkVldPopover.clear();

                var message = attr[name] || defaultMessage,
                    promise;

                if (!attr.name) {
                    attr.name = 'kkVldFld-' + kkVldUtils.randomString(6, true, false, true);
                }

                onShowPopoverOnFocus(name, message, elem, ctrl);

                // add a parser that will process each time the value is modified by user.
                ctrl.$parsers.unshift(function (value) {
                    promise = isCustom ? validationFunc({value: value}) : validationFunc(value, false);
                    promise.then(
                        function (response) {
                            // valid
                            onSetValid(name, response || message, elem, ctrl);
                            return value;
                        },
                        function (response) {
                            // invalid
                            onSetInValid(name, response || message, elem, ctrl);
                            return undefined;
                        }
                    );

                    return value;
                });

                // add a formatter that will process each time the value is modified from the code.
                ctrl.$formatters.unshift(function (value) {
                    promise = isCustom ? validationFunc({value: value}) : validationFunc(value, true);
                    promise.then(
                        function (response) {
                            // valid
                            onSetValid(name, response || message, elem, ctrl);
                            return value;
                        },
                        function (response) {
                            // invalid
                            onSetInValid(name, response || message, elem, ctrl);
                            return undefined;
                        }
                    );

                    // return the value or nothing will be written to the DOM.
                    return value;
                });
            },

            onGetErrors = function (frm) {

                return kkVldPopover.getErrors(frm);
            },

            onGetErrorMessages = function(frm) {

            },

            onValidateForm = function (form) {

                var deferred = $q.defer(),
                    field,
                    errors;

                if (!form) {
                    form = submittingForm;
                }

                if (form) {

                    form.$submitted = true;

                    if (form.$name) {
                        angular.element(document.getElementsByName(form.$name)).addClass('kk-submitted');
                    }

                    angular.forEach(form, function(field, key) {
                        if (angular.isDefined(field) && field.hasOwnProperty('$modelValue')) {
                            field.$$runValidators(field.$modelValue, field.$modelValue, function (result) {
                                console.log(result);
                            })

                            field.$validate();
                        }
                    });

                    for (field in form) {
                        if (form.hasOwnProperty(field)) {
                            if (field[0] !== '$') {
                                form[field].$setViewValue(form[field].$modelValue);
                            }
                        }
                    }

                    onSetSubmittingForm(form);

                    $timeout(function () {

                        errors = onGetErrors(form.$name);

                        if (form.$valid) {
                            // form valid
                            deferred.resolve();
                            form.$submitted = false;
                        } else {
                            // form invalid
                            deferred.reject(errors);
                        }
                    }, 0);
                } else {
                    deferred.reject("Form is undefined");
                }

                return deferred.promise;
            };

        // Publish Public Functions
        return {

            isFormSubmitted: onIsFormSubmitted,
            getFormElements: onGetFormElements,
            pushRadioElement: onPushRadioElement,
            enableRadioElements: onEnableRadioElements,
            resetForm: onResetForm,
            setValid: onSetValid,
            setValidByName: onSetValidByName,
            setInValid: onSetInValid,
            setInValidByName: onSetInValidByName,
            clearByName: onClearByName,
            setSubmittingForm: onSetSubmittingForm,
            getErrors: onGetErrors,
            validateForm: onValidateForm,
            initialize: onInitialize
        };
    }])

    .directive("kkVldSubmit", [ "$parse", "$timeout", "kkVldUtils", "kkVldService", function ($parse, $timeout, kkVldUtils, kkVldService) {
        // Return configured, directive instance
        return {
            link: function (scope, elem, attr) {
                var
                    nameNovalidate = 'novalidate',
                    nameSubmit = 'kkVldSubmit',
                    nameSuccess = 'kkVldSubmitSuccess',
                    nameError = 'kkVldSubmitError',
                    form = elem.controller('form'),
                    fnSubmit = $parse(attr[nameSubmit]),
                    fnSuccess = $parse(attr[nameSuccess]),
                    fnError = $parse(attr[nameError]);

                form.$submitted = false;

                if (angular.isUndefined(attr[nameNovalidate])) {
                    attr.$set('novalidate', 'novalidate');
                }

                if (angular.isUndefined(attr.name) || attr.name === '') {
                    form.$name = 'kk-vld-' + kkVldUtils.randomString(6, true, false, true);
                    attr.$set('name', form.$name);
                }

                elem.bind('submit', function (event) {
                    event.preventDefault();
                    scope.$apply(function () {
                        fnSubmit(scope, { $event : event });
                        kkVldService.validateForm(form).then(
                            function () {
                                fnSuccess(scope, { $event : event });
                            },
                            function () {
                                fnError(scope, { $event: event });
                            }
                        );
                    });
                });
            }
        };
    }])

	.directive("kkVldRequired", [ "$q", "kkVldService", function ($q, kkVldService) {

        // Return configured, directive instance
        return {
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                var name = 'kkVldRequired',
                    message = 'Field is required.',
                    isValid = function (value, isFormatter) {

                        console.log(value, isFormatter);
                        var deferred = $q.defer();

                        //console.log(elem.attr('name'), 'value: ', value, ' type: ', elem[0].type, ' checked: ', elem[0].checked, ' isFormatter: ', isFormatter);

                        if (elem[0].type === 'radio') {
                            kkVldService.pushRadioElement(name, message, elem, ctrl);
                            if (elem[0].checked !== true) {
                                deferred.reject();
                            } else {
                                kkVldService.enableRadioElements(elem);
                                deferred.resolve();
                            }
                        } else if (elem[0].type === 'checkbox') {
                            if (elem[0].checked !== true ) {
                                deferred.reject();
                            } else {
                                deferred.resolve();
                            }
                        } else if (angular.isUndefined(value) && isFormatter) {
                            deferred.reject();
                        } else if (value !== '') {
                            deferred.resolve();
                        } else {
                            deferred.reject();
                        }
                        return deferred.promise;
                    };
                kkVldService.initialize(name, message, elem, attr, ctrl, isValid);
            }
        };
    }])

    .directive("kkVldLengthMin", [ "$q", "kkVldService", function ($q, kkVldService) {
        // Return configured, directive instance
        return {
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                var name = 'kkVldLengthMin',
                    minValue = parseInt(attr.kkVldMinValue, 10),
                    message = 'Field length must be more than ' + minValue,
                    isValid = function (value) {
                        var deferred = $q.defer();
                        if (angular.isUndefined(value) || value === '') {
                            deferred.resolve();
                        } else {
                            if (value.length < minValue) {
                                deferred.reject();
                            } else {
                                deferred.resolve();
                            }
                        }
                        return deferred.promise;
                    };
                kkVldService.initialize(name, message, elem, attr, ctrl, isValid);
            }
        };
    }])

    .directive("kkVldLengthMax", [ "$q", "kkVldService", function ($q, kkVldService) {
        // Return configured, directive instance
        return {
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                var name = 'kkVldLengthMax',
                    maxValue = parseInt(attr.kkVldMaxValue, 10),
                    message = 'Field length must be less than ' + maxValue,
                    isValid = function (value) {
                        var deferred = $q.defer();
                        if (angular.isUndefined(value) || value === '') {
                            deferred.resolve();
                        } else {
                            if (value.length > maxValue) {
                                deferred.reject();
                            } else {
                                deferred.resolve();
                            }
                        }
                        return deferred.promise;
                    };
                kkVldService.initialize(name, message, elem, attr, ctrl, isValid);
            }
        };
    }])

    .directive("kkVldLengthRange", [ "$q", "kkVldService", function ($q, kkVldService) {
        // Return configured, directive instance
        return {
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                var name = 'kkVldLengthRange',
                    minValue = parseInt(attr.kkVldMinValue, 10),
                    maxValue = parseInt(attr.kkVldMaxValue, 10),
                    message = 'Field length must be between ' + minValue + ' and ' + maxValue,
                    isValid = function (value) {
                        var deferred = $q.defer();
                        console.log('is submitted', kkVldService.isFormSubmitted(elem));
                        if (!kkVldService.isFormSubmitted(elem)) {
                            deferred.resolve();
                        }
                        else if (angular.isUndefined(value) || value === '') {
                            deferred.resolve();
                        } else {
                            if (value.length > maxValue || value.length < minValue) {
                                deferred.reject();
                            } else {
                                deferred.resolve();
                            }
                        }
                        return deferred.promise;
                    };
                kkVldService.initialize(name, message, elem, attr, ctrl, isValid);
            }
        };
    }])

    .directive('kkVldNumber', function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {

                console.log('sssssssssssss');

                console.log(ctrl);

                // valid number
                ctrl.$parsers.push(function (value) {

                    console.log('$parsers', value);

                    if(value === '') return value;
                    return isFinite(value) ? Number(value) : undefined;
                });

                ctrl.$formatters.push(function (value) {

                    console.log('$formatters', value);

                    return value;
                });

                ctrl.$validators.kkVldMinNumber = function (value) {

                    console.log('kkVldMinNumber', value);

                    return !value || !angular.isDefined(attrs.kkVldMinNumber) || (value >= Number(attrs.kkVldMinNumber));
                };

                ctrl.$validators.kkVldMaxNumber = function (value) {

                    console.log('kkVldMaxNumber', value);

                    return !value || !angular.isDefined(attrs.kkVldMaxNumber) || (value <= Number(attrs.kkVldMaxNumber));
                };
            }
        };
    })
