/*
 * kk-validator v0.0.1
 * (c) 2014 Kęstutis Katkus http://kkatkus.com
 * License: MIT
 */

'use strict';

angular.module('kk.validator', [])
	
	.service("kkVldService", [ "$q", "$timeout", "$compile", function ($q, $timeout, $compile) {

        var /**
             * @errors stores validation error messages
             */
            errors = {},

            popovers = {},

            hasOwnProperty = Object.prototype.hasOwnProperty,

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

                return elem[0].id;
            },

            onMarkPopover = function (elem) {
                popovers[onGetFormNameFromElement(elem)][elem[0].id] = true;
            },

            onIsPopover = function (elem) {
                return popovers[onGetFormNameFromElement(elem)][elem[0].id] === true;
            },

            onAddElementError = function (errorId, errorMessage, scope, elem) {
                var id = onGetElementId(elem),
                    formName = onGetFormNameFromElement(elem);
                errors[formName][id][errorId] = errorMessage;
                onSyncPopover(scope, elem);
            },

            onRemoveElementError = function (errorId, scope, elem) {
                var id = onGetElementId(elem),
                    formName = onGetFormNameFromElement(elem);
                if (errors[formName] && errors[formName][id] && errors[formName][id][errorId]) {
                    delete errors[formName][id][errorId];
                }
                onSyncPopover(scope, elem);
            },

            onGetElementErrors = function (elem) {
                return errors[onGetFormNameFromElement(elem)][onGetElementId(elem)];
            },

            onProcess = function(errorId, result, errorMessage, scope, elem) {
                if (result) {
                    onRemoveElementError(errorId, scope, elem);
                } else {
                    onAddElementError(errorId, errorMessage, scope, elem);
                }
            },

            onSyncPopover = function (scope, elem) {

                var isPopover = onIsPopover(elem),
                    popover,

                    createPopover = function () {

                        //delete popover if exists
                        destroyPopover();

                        var errors = onGetElementErrors(elem);

                        if (!isEmpty(errors)) {

                            var positionLeft = elem.prop('offsetLeft'),
                                positionTop = elem.prop('offsetTop'),
                                popoverTpl = '<div class="kk-vld-popover">' +
                                    '<div class="kk-vld-popover-arrow"></div>' +
                                    '<div class="kk-vld-popover-content">{{messages}}</div>' +
                                    '</div>',
                                messages = '';

                            popover = angular.copy(popoverTpl),

                            angular.forEach(errors, function (error) {
                                messages = messages + '<span class="kk-vld-popover-message">' + error +'</span>';
                            });

                            popover = popover.replace('{{messages}}', messages);
                            popover = angular.element(popover);

                            elem.after(popover);
                            $compile(popover)(scope);

                            popover.css('bottom', popover[0].offsetHeight - positionTop + 22 + 'px');
                            popover.css('left', positionLeft + 'px');
                        }
                    },

                    destroyPopover = function () {
                        if (popover) {
                            //elem.parent().removeClass('kk-vld-error');
                            popover.remove();
                        }
                    },

                    changePopover = function () {
                        if (isEmpty(onGetElementErrors(elem))) {
                            destroyPopover(event);
                        } else {
                            createPopover(event);
                        }
                    };

                if (!isPopover) {
                    onMarkPopover(elem);
                    elem.bind('mouseover', createPopover)
                        .bind('mouseleave', destroyPopover)
                        .bind('keyup', changePopover);

                    elem.parent().addClass('kk-vld-error');
                }
            },

            /**
             * Util to clear form/all error messages
             */
            onResetForm = function (form) {

                if (form) {
                    form.$setPristine();
                    form.$setUntouched();
                }

                // hack: modelValue is undefined if validators fail
                for (var prop in form) {
                    if (form.hasOwnProperty(prop) && prop.indexOf('$') < 0) {
                        if (form[prop].$modelValue !== form[prop].$viewValue) {
                            form[prop].$modelValue = null;
                        }
                    }
                }

                // after reset form, re validate all form elements
                $timeout(function () {
                    for (var prop in form) {
                        if (form.hasOwnProperty(prop) && prop.indexOf('$') < 0) {
                            form[prop].$validate();
                        }
                    }
                });
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
            addElementError: onAddElementError,
            removeElementError: onRemoveElementError,
            getElementErrors: onGetElementErrors,

            getFormErrors: onGetFormErrors,
            resetForm: onResetForm
        };
    }])

    .directive('kkVldRequired', [ "kkVldService", function (kkVldService) {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {

                var errorMessage = attrs.kkVldRequired || 'Field is required',
                    isCheckbox = function () {
                        return elem[0].type === 'checkbox';
                    };

                ctrl.$validators.kkVldRequired = function (value) {
                    var result = angular.isDefined(value) && value !== '' || isCheckbox(elem) && elem[0].checked === true;
                    kkVldService.process("kkVldRequired", result, errorMessage, scope, elem);
                    return result;
                };
            }
        };
    }])

    .directive('kkVldString', [ "kkVldService", function (kkVldService) {

        var __hasProp = {}.hasOwnProperty,
            defaultOptions = {},
            getOptions = function (scope) {
                var option, options, value, _ref;
                options = angular.copy(defaultOptions);
                if (scope.options != null) {
                    _ref = scope.$eval(scope.options);
                    for (option in _ref) {
                        if (!__hasProp.call(_ref, option)) continue;
                        value = _ref[option];
                        options[option] = value;
                    }
                }
                return options;
            },
            makeMax = function(max) {
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

                return function(val) {
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
            }

        return {
            require: 'ngModel',
            scope: {
                options: '@kkVldString'
            },
            link: function (scope, elem, attrs, ctrl) {

                var options = getOptions(scope),
                    isValid = makeIsValid(options),
                    errorMessage = options.message || 'String is invalid' ;

                ctrl.$validators.kkVldString = function (value) {
                    var result = isValid(value);
                    kkVldService.process("kkVldString", result, errorMessage, scope, elem);
                    return result;
                };
            }
        };
    }]);

