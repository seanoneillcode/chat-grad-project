angular.module("ChatApp").controller("MessagesController",
    function ($scope, $rootScope, $http, $filter, $routeParams, messageService, sessionService) {
        var mm = this;
        var deregisters = [];
        var conversationId = $routeParams.conversationId;
        mm.user = sessionService.getUser();

        deregisters.push($rootScope.$on("authEvent", updateUser));
        deregisters.push($rootScope.$on("currentConversation", reloadCurrentConversation));
        $scope.$on("$destroy", destroyThis);

        if (sessionService.loggedIn()) {
            messageService.watchConversation(conversationId);
        }
        mm.sendMessage = function () {
            messageService.addMessage(mm.currentConversation.id, mm.message);
            mm.message = {};
        };

        function reloadCurrentConversation() {
            mm.currentConversation = messageService.getCurrentConversation();
        }

        function destroyThis() {
            deregisters.forEach(function (watch) {
                watch();
            });
        }

        function updateUser(event, loggedIn, ob) {
            if (loggedIn) {
                mm.user = sessionService.getUser();
                messageService.watchConversation(conversationId);
            } else {
                mm.user = undefined;
            }
        }

    });
