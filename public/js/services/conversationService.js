(function() {
    angular.module("ChatApp").factory("conversationService", conversationService);

    function conversationService($http, $rootScope, $interval, errorService) {
        var service = {
            getConversations: getConversations,
            getCurrentConversation: getCurrentConversation,
            pollConversations: pollConversations,
            startService: startService,
            watchConversation: watchConversation
        };

        var conversations = [];
        var serviceStarted = false;
        var currentConversation;
        var currentWatchPromise;
        return service;

        //////////////////////////////////////////

        function getConversations() {
            return conversations;
        }

        function getCurrentConversation() {
            return currentConversation;
        }

        function pollConversation(id) {
            return $http.get("/api/conversations/" + id).success(function(data) {
                if (currentConversation === undefined ||
                data.messages.length > currentConversation.messages.length ||
                data.id !== currentConversation.id) {
                    currentConversation = data;
                    broadcastMessage(currentConversation);
                }
            }).error(errorService.broadcast);
        }
        function startService() {
            if (!serviceStarted) {
                $interval(pollConversations, 10000);
                pollConversations();
            }
        }

        function watchConversation(conversationId) {
            if (currentWatchPromise !== undefined) {
                $interval.cancel(currentWatchPromise);
            }
            currentWatchPromise = $interval(function() {
                pollConversation(conversationId);
            }, 1000);
            pollConversation(conversationId);
        }

        function pollConversations() {
            return $http.get("/api/conversations")
                .success(function(data) {
                    if (data.length > conversations.length) {
                        conversations = data;
                        broadcastConversations(conversations);
                    }
                }).error(errorService.broadcast);
        }

        function broadcastConversations(data) {
            $rootScope.$broadcast("conversationsChanged");
            return data;
        }

        function broadcastMessage(data) {
            $rootScope.$broadcast("currentConversation");
        }
    }
})();
