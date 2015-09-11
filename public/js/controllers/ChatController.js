angular.module("ChatApp").controller("ChatController",
    function ($scope, $rootScope, sessionService) {

        var vm = this;
        var deregisters = [];

        deregisters.push($rootScope.$on("authEvent", authEvent));
        $scope.$on("$destroy", destroyThis);

        vm.loggedIn = false;

        sessionService.fetchUser();

        function authEvent(event, loggedIn, resultOb) {
            vm.loggedIn = loggedIn;
            if (loggedIn) {
                vm.user = resultOb;
            } else {
                vm.loginUri = resultOb;
            }
        }

        function destroyThis() {
            deregisters.forEach(function (watch) {
                watch();
            });
        }
    });
