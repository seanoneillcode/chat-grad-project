var express = require("express");
var cookieParser = require("cookie-parser");
var ConversationService = require("./conversations.js");

var ObjectId = require("mongodb").ObjectID;

module.exports = function (port, db, githubAuthoriser) {
    var app = express();
    var router = express.Router();

    app.use(express.static("public"));

    app.use(cookieParser());
    var users = db.collection("users");
    var conversations = db.collection("conversations");
    var messages = db.collection("messages");
    var sessions = {};

    var cService = new ConversationService(db);

    app.get("/oauth", function (req, res) {
        githubAuthoriser.authorise(req, function (githubUser, token) {
            if (githubUser) {
                users.findOne({
                    _id: githubUser.login
                }, function (err, user) {
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
            }
            else {
                res.sendStatus(400);
            }

        });
    });

    app.get("/api/oauth/uri", function (req, res) {
        res.json({
            uri: githubAuthoriser.oAuthUri
        });
    });

    app.use(function (req, res, next) {
        if (req.cookies.sessionToken) {
            req.session = sessions[req.cookies.sessionToken];
            if (req.session) { ////////////////////////////////////
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.get("/api/user", function (req, res) {
        users.findOne({
            _id: req.session.user
        }, function (err, user) {
            if (!err) {
                res.json(user);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/users", function (req, res) {
        users.find().toArray(function (err, docs) {
            if (!err) {
                res.json(docs.map(function (user) {
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

    router.route("/conversations")
        .get(function (req, res) {
            cService.getConversations()
                .then(cService.allExpandUsers)
                .then(cService.allMarshalConversation)
                .then(
                function (conversations) {
                    res.json(conversations);
                },
                function (err) {
                    res.sendStatus(500);
                }
            );
        });

    router.route("/conversations/:id")
        .get(function (req, res) {
            var id = req.params.id;
            if (!ObjectId.isValid(id)) {
                res.set("responseText", "Invalid ID");
                res.sendStatus(400);
            } else {
                cService.getConversation(id)
                .then(cService.expandUsers)
                .then(cService.expandMessages)
                .then(cService.marshalConversation)
                .then(
                    function (conversation) {
                        res.json(conversation);
                    })
                    .catch(
                    function (err) {
                        res.sendStatus(err.code);
                    }
                );
            }
        });

    app.use("/api", router);

    return app.listen(port);
};
