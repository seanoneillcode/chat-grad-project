angular.module("ChatApp").controller("ChatController",
    function ($scope, $rootScope, $http, $filter, conversationService) {

        var vm = this;
        var deregisters = [];

        vm.conversations = [];
        vm.loggedIn = false;

        deregisters.push($rootScope.$on("conversationsChanged", reloadConversations));
        deregisters.push($rootScope.$on("currentConversation", reloadCurrentConversation));

        $http.get("/api/user").then(function (userResult) {
            vm.loggedIn = true;
            vm.user = userResult.data;
            conversationService.startService();
            $http.get("/api/users").then(function (result) {
                vm.users = result.data;
            });
        }, function () {
            $http.get("/api/oauth/uri").then(function (result) {
                vm.loginUri = result.data.uri;
            });
        });

        function reloadConversations() {
            vm.conversations = conversationService.getConversations();
        }

        vm.setConversation = function (id) {
            conversationService.watchConversation(id);
        };

        vm.createConversation = function() {
            var userList = vm.selectedUsers.splice();
            userList.push(vm.user._id);
            conversationService.createConversation(userList);
        };

        function reloadCurrentConversation() {
            vm.currentConversation = conversationService.getCurrentConversation();
        }

    });
