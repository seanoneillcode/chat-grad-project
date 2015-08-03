var request = require("request");
var URI = require("URIjs");

module.exports = function(oauthClientId, oauthSecret) {
    var oAuthUri = URI("https://github.com/login/oauth/authorize").query({
        client_id: oauthClientId
    }).toString();

    function authorise(req, callback) {
        var code = req.query.code;
        request({
            url: URI("https://github.com/login/oauth/access_token")
                .query({
                    "client_id": oauthClientId,
                    "client_secret": oauthSecret,
                    "code": code
                }).toString(),
            headers: {
                "Accept": "application/json"
            }
        }, function(error, response, body) {
            body = JSON.parse(body);
            if (body.error) {
                callback(null);
            } else {
                var token = body.access_token;
                request({
                    url: "https://api.github.com/user",
                    headers: {
                        "User-Agent": "chat-grad-project",
                        "Authorization": "token " + token
                    }
                }, function(e2, r2, b2) {
                    var githubUser = JSON.parse(b2);
                    callback(githubUser, token);
                });
            }
        });
    }

    return {
        authorise: authorise,
        oAuthUri: oAuthUri
    };
};
