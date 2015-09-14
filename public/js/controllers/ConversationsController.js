angular.module("ChatApp").controller("ConversationsController",
    function ($scope, $rootScope, $http, $filter, conversationService, userService, sessionService) {
        var cm = this;
        var deregisters = [];
        cm.conversations = conversationService.getConversations();
        cm.users = userService.getUsers();
        cm.user = sessionService.getUser();

        deregisters.push($rootScope.$on("conversationsChanged", reloadConversations));
        deregisters.push($rootScope.$on("usersEvent", usersEvent));

        function usersEvent(event, users) {
            cm.users = users;
            reloadConversations();
        }

        function reloadConversations() {
            var conversations = conversationService.getConversations();
            conversations.forEach(function (conversation) {
                conversation.users.forEach(function (user) {
                    if (userService.getUser(user.id)) {
                        user.name = userService.getUser(user.id).name;
                        user.avatarUrl = userService.getUser(user.id).avatarUrl;
                    }
                });
            });
            cm.conversations = conversations;
        }

        cm.createConversation = function () {
            var userList = cm.selectedUsers.slice();
            userList.push(cm.user._id);
            conversationService.createConversation(userList);
        };

    });
