var express = require("express");
var cookieParser = require("cookie-parser");
var request = require("request");
var URI = require("URIjs");

module.exports = function(port, db, oauthClientId, oauthSecret) {
    var app = express();

    app.use("/bower_components", express.static("bower_components"));
    app.use(express.static("public"));
    app.use(cookieParser());

    var users = db.collection("users");
    var sessions = {};

    app.get("/oauth", function(req, res) {
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
                res.sendStatus(400);
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
                    users.findOne({
                        _id: githubUser.login
                    }, function(err, user) {
                        if (!user) {
                            // TODO: Wait for this operation to complete
                            users.insertOne({
                                _id: githubUser.login,
                                name: githubUser.name,
                                avatarUrl: githubUser.avatar_url
                            });
                        }
                        sessions[token] = {
                            user: githubUser.login
                        };
                        res.cookie("sessionToken", token);
                        res.header("Location", "/");
                        res.sendStatus(302);
                    });
                });
            }
        });
    });

    app.get("/api/oauth/uri", function(req, res) {
        res.json({
            uri: URI("https://github.com/login/oauth/authorize").query({
                client_id: oauthClientId
            }).toString()
        });
    });

    app.use(function(req, res, next) {
        if (req.cookies.sessionToken) {
            req.session = sessions[req.cookies.sessionToken];
            if (req.session) {
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.get("/api/user", function(req, res) {
        users.findOne({
            _id: req.session.user
        }, function(err, user) {
            if (!err) {
                res.json(user);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/users", function(req, res) {
        users.find().toArray(function(err, docs) {
            if (!err) {
                res.json(docs.map(function(user) {
                    return {
                        id: user._id,
                        name: user.name,
                        avatarUrl: user.avatarUrl
                    };
                }));
            } else {
                res.sendStatus(500);
            }
        });
    });

    return app.listen(port);
};
