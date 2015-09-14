(function () {
    angular.module("ChatApp").factory("userService", userService);

    function userService($rootScope, errorService, $http, sessionService) {
        var self = this;
        self.users = [];
        self.userIndexes = new Map();
        var deregisters = [];

        var service = {
            fetchUsers: fetchUsers,
            getUsers: getUsers,
            getUser: getUser
        };

        //service.users = [];

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

        function getUser(id) {
            var u;
            if (self.userIndexes.get(id) !== undefined) {
                u =  self.users[self.userIndexes.get(id)];
            } else {
                for (var i in self.users) {
                    if (self.users[i].id === id) {
                        self.userIndexes.set(self.users[i].id, i);
                        u = self.users[i];
                        break;
                    }
                }
            }
            return u;
        }

        function broadcastUsersEvent(users) {
            $rootScope.$broadcast("usersEvent", users);
        }

    }
})();
