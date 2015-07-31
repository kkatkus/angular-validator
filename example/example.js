(function() {
	'use strict';

	angular.module('ExampleApp', ['kk.validator'])

		.controller('MainCtrl', ["$scope", "$q", "$timeout", "kkVldService", function ($scope, $q, $timeout, kkVldService) {

			var onVldSubmit = function () {

					console.log('onVldSubmit');

					$scope.alert = undefined;
				},

				onVldError = function () {
					console.log('onVldError');
					$scope.errors = kkVldService.getFormErrors($scope.kkValidatorForm);
					$scope.alert = {
						type: 'danger',
						message: 'Form is Invalid.'
					};
				},

				onVldSuccess = function () {
					console.log('onVldSuccess');
					$scope.alert = {
						type: 'success',
						message: 'Form is Valid.'
					};
				},

				onReset = function (form) {
					kkVldService.resetForm(form);
					onInitialize();
				},

				onVldSubmit2 = function (data) {
					console.log('onVldSubmit', data);
					$scope.alert2 = undefined;
				},
				onVldSuccess2 = function (data) {
					console.log('onVldSuccess', data);
					$scope.alert2 = {
						type: 'success',
						message: 'Form is Valid.'
					};
				},
				onVldError2 = function (data) {
					console.log('onVldError', data);
					$scope.alert2 = {
						type: 'danger',
						message: 'Form is Invalid.'
					};
				},

				onInitialize = function () {
					$scope.alert = undefined;
					$scope.data = {
						required: {
							input: undefined,
							select: undefined,
							datalist: undefined,
							keygen: undefined,
							checkbox: undefined,
							radio: undefined
						},
						number: 'z',
						ranges: {
							min: '1',
							max: '123456',
							range: '1234'
						},
						email: 'any',
						custom1: 'a',
						custom2: 'b'
					};
					$scope.data2 = {
						required: {
							input: undefined
						}
					};

					$scope.data3 = {

					};

					$scope.dynamicForm = [
						{ label: "First Name", name: "firstName" },
						{ label: "Last Name", name: "lastName" }
					]

				},

				onCustomValidateFn1 = function (value) {
					return value === 'x';
				},

				onCustomValidateFn2 = function (value) {
					var defer = $q.defer();
					$timeout(function () {
						if (value === 'y') {
							defer.resolve();
						} else {
							defer.reject('Custom validation message');
						}
					}, 1000);
					return defer.promise;
				};

			$scope.customValidateFn1 = onCustomValidateFn1;
			$scope.customValidateFn2 = onCustomValidateFn2;

			$scope.vldSubmit = onVldSubmit;
			$scope.vldSuccess = onVldSuccess;
			$scope.vldError = onVldError;
			$scope.reset = onReset;

			$scope.vldSubmit2 = onVldSubmit2;
			$scope.vldSuccess2 = onVldSuccess2;
			$scope.vldError2 = onVldError2;

			onInitialize();
		}]);

})();
