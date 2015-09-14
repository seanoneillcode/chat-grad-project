angular.module("ChatApp", ["ngRoute","ngMaterial"])
    .config(["$routeProvider", "$locationProvider",
        function ($routeProvider) {
            $routeProvider
                .when("/users", {
                    templateUrl: "views/users.html",
                    controller: "UsersController",
                    controllerAs: "um"
                })
                .when("/conversations", {
                    templateUrl: "views/conversations.html",
                    controller: "ConversationsController",
                    controllerAs: "cm"
                })
                .when("/conversations/:conversationId", {
                    templateUrl: "views/messages.html",
                    controller: "MessagesController",
                    controllerAs: "mm"
                });
        }]);
