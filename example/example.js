angular.module('ExampleApp', ['kk.validator'])

    .controller('MainCtrl', function ($scope, kkVldService) {

        var onVldSubmit = function () {

                console.log('onVldSubmit');

                $scope.alert = undefined;
            },

            onVldError = function () {

                console.log('onVldError');

                $scope.errors = kkVldService.getErrors($scope.kkValidatorForm.$name);

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
                        checkbox: undefined,
                        radio: undefined
                    },
                    number: 'z',
                    ranges: {
                        min: '1',
                        max: '123456',
                        range: '1234'
                    }
                };
                $scope.data2 = {
                    required: {
                        input: undefined
                    }
                };

                $scope.data2 = {

                };

                $scope.dynamicForm = [
                    { label: "First Name", name: "firstName" },
                    { label: "Last Name", name: "lastName" }
                ]

            };

        $scope.vldSubmit = onVldSubmit;
        $scope.vldSuccess = onVldSuccess;
        $scope.vldError = onVldError;
        $scope.reset = onReset;

        $scope.vldSubmit2 = onVldSubmit2;
        $scope.vldSuccess2 = onVldSuccess2;
        $scope.vldError2 = onVldError2;

        onInitialize();
    });
