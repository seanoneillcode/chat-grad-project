(function () {
    angular.module("ChatApp").factory("messageService", messageService);

    function messageService($rootScope, $http, $interval, errorService) {

        var currentConversation;
        var currentWatchPromise;

        var service = {
            watchConversation: watchConversation,
            addMessage: addMessage,
            getCurrentConversation: getCurrentConversation
        };

        return service;

        ///////////////////////////////

        function addMessage(conversationId, message) {
            $http.post("/api/conversations/" + conversationId + "/messages", message)
                .success(function () {
                    pollConversation(currentConversation.id);
                })
                .error(errorService.broadcast);
        }

        function getCurrentConversation() {
            return currentConversation;
        }

        function watchConversation(conversationId) {
            if (currentConversation !== undefined &&
                currentConversation.id === conversationId) {

                broadcastMessage(currentConversation);
            } else {
                if (currentConversation !== undefined) {
                    $interval.cancel(currentWatchPromise);
                }

                currentWatchPromise = $interval(function () {
                    pollConversation(conversationId);
                }, 1000);
                pollConversation(conversationId);
            }

        }

        function pollConversation(id) {
            return $http.get("/api/conversations/" + id).success(function (data) {
                if (currentConversation === undefined ||
                    data.messages.length > currentConversation.messages.length ||
                    data.id !== currentConversation.id) {
                    currentConversation = data;
                    broadcastMessage(currentConversation);
                }
            }).error(errorService.broadcast);
        }

        function broadcastMessage(data) {
            $rootScope.$broadcast("currentConversation", data);
        }
    }
})();
