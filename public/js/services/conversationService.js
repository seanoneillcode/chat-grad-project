(function() {
    angular.module("ChatApp").factory("conversationService", conversationService);

    function conversationService($http, $rootScope, $interval) {
        var service = {
            getConversations: getConversations,
            getConversation: getConversation,
            pollConversations: pollConversations,
            startService: startService
        };

        var conversations = [];
        var serviceStarted = false;
        return service;

        //////////////////////////////////////////

        function getConversations() {
            return conversations;
        }

        function getConversation(id) {
            return $http.get("/api/conversations/" + id);
        }
        function startService() {
            if (!serviceStarted) {
                $interval(pollConversations, 1000);
                pollConversations();
            }
        }

        function pollConversations() {
            return $http.get("/api/conversations").success(function(data) {
                if (data.length > conversations.length) {
                    conversations = data;
                    broadcastConversations(conversations);
                }
            }).error(function(text, status) {
                console.log("ERROR", text, status);
            });
        }

        function broadcastConversations(data) {
            $rootScope.$broadcast("conversationsChanged");
            return data;
        }
    }
})();
