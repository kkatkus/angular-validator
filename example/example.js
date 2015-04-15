angular.module('ExampleApp', ['kk.angular-validator'])

    .controller('MainCtrl', function ($scope, kkValidatorService) {

        var onVldSubmit = function (data) {
                console.log('onVldSubmit', data);
                $scope.alert = undefined;
            },
            onVldSuccess = function (data) {
                console.log('onVldSuccess', data);
                $scope.alert = {
                    type: 'success',
                    message: 'Form is Valid.'
                };
            },
            onVldError = function (data) {

                var msg = kkValidatorService.getErrors($scope.vldFrm);
                console.log($scope.vldFrm);

                console.log('onVldError', data);
                $scope.alert = {
                    type: 'danger',
                    message: 'Form is Invalid.'
                };
            },

            onReset = function () {
                kkValidatorService.resetForm($scope.vldFrm);
                $scope.alert = undefined;
                $scope.data = {};
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
                $scope.data = {};
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
