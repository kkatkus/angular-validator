/*
 * angular-validator v0.0.1
 * (c) 2014 Kęstutis Katkus http://kkatkus.com
 * License: MIT
 */

'use strict';

angular.module('kk.angular-validator', [])
	
	.factory("kkValidatorUtils", [

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

	.service("kkValidatorPopover", [ "kkValidatorUtils", function (kkValidatorUtils) {

        var /**
             * @messages stores validation messages
             */
            messages = [],

            /**
             * Util to get form name
             * @returns string
             */
            getFormName = function (elem) {
                return elem.controller('form').$name;
            },

            /**
             * Util to get form id or create random and return
             * @returns string
             */
            getId = function (elem) {
                elem[0].id = elem[0].id || 'id-' + kkValidatorUtils.randomString(6, true, false, true);
                var id = elem[0].id || elem[0].name || elem.scope().$id;
                if (!messages[getFormName(elem)]) {
                    messages[getFormName(elem)] = {};
                }
                if (!messages[getFormName(elem)][id]) {
                    messages[getFormName(elem)][id] = [];
                }
                return id;
            },

            /**
             * Util to create popover
             * @returns boolean
             */
            onCreate = function (elem, hidden) {
                var id = getId(elem);
                elem.popover({
                    html: true,
                    content: '<ul><li>' + _.pluck(messages[getFormName(elem)][id], "msg").join("</li><li>") + '</li></ul>',
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
                var id = getId(elem),
                    i = _.where(messages[getFormName(elem)][id], { id: name });

                msg = msg || "Invalid field";
                if (i.length === 0) {
                    messages[getFormName(elem)][id].push({ id: name, msg: msg });
                    onCreate(elem, hidden);
                }
                return true;
            },

            /**
             * Util to destroy popover
             * @returns boolean
             */
            onDestroy = function (name, elem) {
                var id = getId(elem),
                    i = _.where(messages[getFormName(elem)][id], { id: name });
                if (!name) {
                    elem.popover('destroy');
                    messages[getFormName(elem)][id] = [];
                }
                if (i.length !== 0) {
                    elem.popover('destroy');
                    _.remove(messages[getFormName(elem)][id], function (obj) { return obj.id === name; });
                    if (messages[getFormName(elem)][id].length !== 0) {
                        onCreate(elem);
                    }
                }
            },

            /**
             * Util to clear all validation messages
             */
            onClear = function (frm) {
                if (frm) {
                    messages[frm] = [];
                } else {
                    messages = [];
                }
            },

            /**
             * Util to get validation messages
             * @returns array
             */
            onGetErrors = function (frm) {
                return frm ? messages[frm] : messages;
            };

        // Publish delegate instance/object with desired API
        return {
            create: onCreate,
            show: onShow,
            destroy: onDestroy,
            clear: onClear,
            getErrors: onGetErrors
        };
    }])

    .service("kkValidatorService", [ "$q", "$timeout", "kkValidatorPopover", "kkValidatorUtils", function ($q, $timeout, kkValidatorPopover, kkValidatorUtils) {

        var /**
             * @submittingForm form witch is in submit process
             */
            submittingForm,

            /**
             * @serverErrorName category name of server error
             */
            serverErrorName = 'kkVldServerError',

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
                        formElem.removeClass('kk-submitted');
                    }
                    var messages = kkValidatorPopover.getErrors(form.$name);
                    kkValidatorPopover.clear(form.$name);
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
                    kkValidatorPopover.show(serverErrorName, elem, message, true);
                    elem.bind('keydown keypress', function () {
                        if (isPopup) {
                            kkValidatorPopover.destroy(serverErrorName, elem, message);
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
                    kkValidatorPopover.destroy(serverErrorName, elem, message);
                }
            },

            /**
             * Clear all error messages from a field by name
             * @returns string
             */
            onClearByName = function (name) {
                var domElem = document.getElementsByName(name);
                if (domElem.length > 0) {
                    kkValidatorPopover.destroy(undefined, angular.element(domElem));
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
                kkValidatorPopover.show(name, elem, message, true);
            },

            /**
             * Util to set element as valid and destroy popover for that element
             * @returns null
             */
            onSetValid = function (name, message, elem, ctrl) {
                // set valid
                ctrl.$setValidity(name, true);
                // destroy popover
                kkValidatorPopover.destroy(name, elem, message);
            },

            /**
             * Util to show popover on element focus
             * @returns null
             */
            onShowPopoverOnFocus = function (name, message, elem, ctrl) {
                var form = elem.controller('form');
                elem.bind('focus', function () {
                    if ((ctrl.$dirty || form.$submitted) && ctrl.$error[name]) {
                        kkValidatorPopover.show(name, elem, message, false);
                    }
                });
            },

            /**
             * Util to initialize validation functionality for element
             * @returns null
             */
            onInitialize = function (name, defaultMessage, elem, attr, ctrl, validationFunc, isCustom) {

                kkValidatorPopover.clear();

                var message = attr[name] || defaultMessage,
                    promise;

                if (!attr.name) {
                    attr.name = 'kkFldName' + kkValidatorUtils.randomString(6, true, false, true);
                }

                onShowPopoverOnFocus(name, message, elem, ctrl);

                // add a parser that will process each time the value is
                // parsed into the model when the user updates it.
                ctrl.$parsers.unshift(function (value) {
                    //console.log('$parsers', elem, value);
                    // set it to true here, otherwise it will not
                    // clear out when previous validators fail.

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

                    return value;
                });

                // add a formatter that will process each time the value
                // is updated on the DOM element.
                ctrl.$formatters.unshift(function (value) {

                    promise = isCustom ? validationFunc({value: value}) : validationFunc(value, true);
                    promise.then(
                        function () {
                            // valid
                            ctrl.$setValidity(name, true);
                        },
                        function () {
                            // invalid
                            ctrl.$setValidity(name, false);
                        }
                    );

                    // return the value or nothing will be written to the DOM.
                    return value;
                });
            },

            onGetErrorMessages = function(frm) {

            },

            onGetErrors = function (frm) {

                return kkValidatorPopover.getErrors(frm);
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

            initialize: onInitialize,
            resetForm: onResetForm,
            setValid: onSetValid,
            setValidByName: onSetValidByName,
            setInValid: onSetInValid,
            setInValidByName: onSetInValidByName,
            clearByName: onClearByName,
            setSubmittingForm: onSetSubmittingForm,
            getErrors: onGetErrors,
            validateForm: onValidateForm
        };
    }])

    .directive("kkVldSubmit", [ "$parse", "$timeout", "kkValidatorUtils", "kkValidatorService", function ($parse, $timeout, kkValidatorUtils, kkValidatorService) {
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
                    form.$name = 'kk-validator-' + kkValidatorUtils.randomString(6, true, false, true);
                    attr.$set('name', form.$name);
                }

                elem.bind('submit', function (event) {

                    event.preventDefault();

                    scope.$apply(function () {

                        fnSubmit(scope, { $event : event });

                        kkValidatorService.validateForm(form).then(
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

	.directive("kkVldRequired", [ "$q", "kkValidatorService", function ($q, kkValidatorService) {

        // Return configured, directive instance
        return {
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                var name = 'kkVldRequired',
                    defaultMessage = 'Field is required.',
                    isValid = function (value, isFormatter) {
                        var deferred = $q.defer();
                        if (angular.isUndefined(value) && isFormatter) {
                            deferred.reject();
                        } else if (elem[0].type === 'checkbox' && value === false) {
                            deferred.reject();
                        } else if (value !== '') {
                            deferred.resolve();
                        } else {
                            deferred.reject();
                        }
                        return deferred.promise;
                    };
                kkValidatorService.initialize(name, defaultMessage, elem, attr, ctrl, isValid);
            }
        };
    }]);
