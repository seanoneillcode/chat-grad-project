(function () {
    angular.module("ChatApp").factory("conversationService", conversationService);

    function conversationService($http, $rootScope, $interval, errorService, sessionService) {
        var service = {
            getConversations: getConversations,
            createConversation: createConversation
        };

        var conversations = [];
        var deregisters = [];
        var poll;
        var self = this;

        deregisters.push($rootScope.$on("authEvent", startService));
        if (sessionService.loggedIn()) {
            startService(null, true);
        }
        return service;

        //////////////////////////////////////////

        function createConversation(userList) {
            $http.post("/api/conversations", {
                users: userList
            }).success(pollConversations).error(errorService.broadcast);
        }

        function getConversations() {
            return self.conversations;
        }

        function startService(event, loggedIn) {
            if (loggedIn) {
                poll = $interval(pollConversations, 1000);
                pollConversations();
            } else {
                $interval.cancel(poll);
            }
        }

        function pollConversations() {
            return $http.get("/api/conversations")
                .success(function (data) {
                    if (data.length > conversations.length) {
                        self.conversations = data;
                        broadcastConversations(conversations);
                    }
                }).error(errorService.broadcast);
        }

        function broadcastConversations(data) {
            $rootScope.$broadcast("conversationsChanged");
            return data;
        }
    }
})();
