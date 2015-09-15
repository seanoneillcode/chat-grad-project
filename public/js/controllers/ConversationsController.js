angular.module("ChatApp").controller("ConversationsController",
    function ($scope, $rootScope, $http, $filter, conversationService, userService, sessionService) {
        var cm = this;
        var deregisters = [];
        cm.conversations = conversationService.getConversations();
        //cm.users = userService.getUsers();
        cm.user = sessionService.getUser();
        cm.filterSeleceted = true;
        cm.selectedUsers = [];

        usersEvent(null, userService.getUsers());

        deregisters.push($rootScope.$on("conversationsChanged", reloadConversations));
        deregisters.push($rootScope.$on("usersEvent", usersEvent));

        function usersEvent(event, users) {
            cm.users = users.map(function (user, index) {
                user.email = user.id + "@github.com";
                user._lowername = user.name.toLowerCase();
                return user;
            });

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
            var userList = cm.selectedUsers.map(function (user) {
                return user.id;
            });
            conversationService.createConversation(userList);
        };

        cm.querySearch = function (query) {
            var results = query ?
                cm.users.filter(createFilterFor(query)) : [];
            return results;
        };

        function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(contact) {
                return (contact.name.toLowerCase().indexOf(lowercaseQuery) !== -1);
            };
        }

    });
