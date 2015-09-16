(function() {
    angular.module("ChatApp").factory("sessionService", sessionService);

    function sessionService($http, $rootScope, $interval, errorService) {
        var user;
        var self = this;
        var isLoggedIn = false;

        var service = {
            fetchUser: fetchUser,
            getUser: getUser,
            loggedIn: loggedIn
        };

        return service;

        ////////////////////////////////

        function fetchUser() {
            $http.get("/api/user").then(function (userResult) {
                self.user = userResult.data;
                broadcastAuthEvent(true, self.user);

            }, function () {
                $http.get("/api/oauth/uri").then(function (result) {
                    broadcastAuthEvent(false, result.data.uri);
                });
            });
        }

        function getUser() {
            return self.user;
        }

        function loggedIn() {
            return isLoggedIn;
        }

        function broadcastAuthEvent(loggedIn, resultOb) {
            isLoggedIn = loggedIn;
            $rootScope.$broadcast("authEvent", loggedIn, resultOb);
        }
    }
})();
