angular.module("ChatApp").controller("MessagesController",
    function ($scope, $rootScope, $http, $filter, $routeParams, messageService, sessionService, userService) {
        var mm = this;
        var deregisters = [];
        var conversationId = $routeParams.conversationId;
        mm.user = sessionService.getUser();

        deregisters.push($rootScope.$on("authEvent", updateUser));
        deregisters.push($rootScope.$on("currentConversation", reloadCurrentConversation));
        //deregisters.push($rootScope.$on("usersEvent", reloadCurrentConversation()));
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
            mm.currentConversation.messages.forEach(function (message) {
                var senderId = message.sender;
                message.sender = {};
                if (userService.getUser(senderId)) {
                    message.sender.id = senderId;
                    message.sender.name = userService.getUser(senderId).name;
                    message.sender.avatarUrl = userService.getUser(senderId).avatarUrl;
                }
            });
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

        function getUserAvatarUrl(id) {
            return userService.getUser(id).avatarUrl;
        }

        function getUserName(id) {
            return userService.getUser(id).name;
        }

    });
