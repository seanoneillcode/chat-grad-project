angular.module("ChatApp", ["ngRoute", "ngMaterial", "ngAnimate"])
    .config(["$routeProvider", "$locationProvider",
        function ($routeProvider) {
            $routeProvider
                .when("/", {
                    redirectTo: "/conversations"
                })
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
        }])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme("default")
            .primaryPalette("blue-grey")
            .accentPalette("deep-orange");
    });
