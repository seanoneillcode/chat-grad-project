angular.module("ChatApp").controller("UsersController",
    function ($scope, $rootScope, $http, userService) {
        var um = this;
        var deregisters = [];
        um.users = userService.getUsers();

        deregisters.push($rootScope.$on("usersEvent", usersEvent));
        $scope.$on("$destroy", destroyThis);

        function usersEvent(event, users) {
            um.users = users;
        }

        function destroyThis() {
            deregisters.forEach(function (watch) {
                watch();
            });
        }

    });
