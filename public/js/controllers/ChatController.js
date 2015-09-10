angular.module("ChatApp").controller("ChatController",
    function ($scope, $rootScope, $http, $filter, conversationService) {

        var vm = this;
        var deregisters = [];

        vm.conversations = [];
        vm.loggedIn = false;

        deregisters.push($rootScope.$on("conversationsChanged", reloadConversations));

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

        vm.getConversation = function (id) {
            conversationService.getConversation(id).success(function (data) {
                vm.currentConversation = data;
            });
        };
    });
