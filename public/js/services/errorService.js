(function () {
    angular.module("ChatApp").factory("errorService", errorService);

    function errorService($rootScope) {
        var service = {
            broadcast: broadcastError
        };
        return service;

        //////////////////
        function convert(method) {
            switch (method.toUpperCase()){
                case "POST": return "create";
                case "GET": return "read";
                case "PUT": return "update";
                case "DELETE": return "delete";
            }
        }

        function broadcastError(text, status, x, req) {
            var reqAction = convert(req.method);

            var words  = req.url.split("/");
            var reqOb = words.pop().split("?")[0];
            reqOb = words.pop() + " " + reqOb;

            $rootScope.$broadcast("errorResponse", text, status, reqAction, reqOb);
        }

    }
})();
