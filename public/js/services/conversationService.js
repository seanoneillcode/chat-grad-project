(function() {
    angular.module("ChatApp").factory("conversationService", conversationService);

    function conversationService($http, $rootScope, $interval) {
        var service = {
            getConversations: getConversations,
            pollConversations: pollConversations
        };

        var conversations = [];
        $interval(pollConversations, 1000);
        pollConversations();

        return service;

        //////////////////////////////////////////

        function getConversations() {
            return conversations;
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
