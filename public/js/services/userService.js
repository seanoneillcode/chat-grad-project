(function () {
    angular.module("ChatApp").factory("userService", userService);

    function userService($rootScope, errorService, $http, sessionService) {
        var users = [];
        var self = this;
        var deregisters = [];

        var service = {
            fetchUsers: fetchUsers,
            getUsers: getUsers
        };

        service.users = [];

        deregisters.push($rootScope.$on("authEvent", fetchUsers));
        if (sessionService.loggedIn()) {
            fetchUsers();
        }

        return service;

        ////////////////////////

        function fetchUsers() {
            $http.get("/api/users").success(function (result) {
                self.users = result;
                broadcastUsersEvent(self.users);
            }).error(errorService.broadcast);
        }

        function getUsers() {
            return self.users;
        }

        function broadcastUsersEvent(users) {
            $rootScope.$broadcast("usersEvent", users);
        }

    }
})();
