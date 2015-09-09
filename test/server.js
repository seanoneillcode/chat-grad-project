var server = require("../server/server");
var ConversationService = require("../server/conversations");
var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");
var mongo = require("mongodb");
var testPort = 52684;
var baseUrl = "http://localhost:" + testPort;
var oauthClientId = "1234clientId";

var testUser = {
    _id: "bob",
    name: "Bob Bilson",
    avatarUrl: "http://avatar.url.com/u=test"
};
var testUser2 = {
    _id: "charlie",
    name: "Charlie Colinson",
    avatarUrl: "http://avatar.url.com/u=charlie_colinson"
};
var testGithubUser = {
    login: "bob",
    name: "Bob Bilson",
    avatar_url: "http://avatar.url.com/u=test"
};

var testConversation = {
    _id: "55eeb2cce4b0966f47937878",
    users: ["bob", "charlie"],
    messages: ["testMsg1"]
};

var testMessage = {
    _id: "55eeb8c4e4b0966f47937928",
    content: "Test Message",
    timestamp: "1234"
};

var testToken = "123123";
var testExpiredToken = "987978";

describe("server", function () {
    var cookieJar;
    var db;
    var githubAuthoriser;
    var serverInstance;
    var dbCollections;
    beforeEach(function () {
        cookieJar = request.jar();
        dbCollections = {
            users: {
                find: sinon.stub(),
                findOne: sinon.stub(),
                insertOne: sinon.spy()
            },
            conversations: {
                find: sinon.stub(),
                findOne: sinon.stub(),
                insertOne: sinon.stub()
            },
            messages: {
                find: sinon.stub(),
                findOne: sinon.stub(),
                insertOne: sinon.spy()
            }
        };
        db = {
            collection: sinon.stub()
        };
        db.collection.withArgs("users").returns(dbCollections.users);
        db.collection.withArgs("conversations").returns(dbCollections.conversations);
        db.collection.withArgs("messages").returns(dbCollections.messages);

        githubAuthoriser = {
            authorise: function () {
            },
            oAuthUri: "https://github.com/login/oauth/authorize?client_id=" + oauthClientId
        };
        serverInstance = server(testPort, db, githubAuthoriser);
    });
    afterEach(function () {
        serverInstance.close();
    });
    function authenticateUser(user, token, callback) {
        sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
            authCallback(user, token);
        });

        dbCollections.users.findOne.callsArgWith(1, null, user);

        request(baseUrl + "/oauth", function (error, response) {
            cookieJar.setCookie(request.cookie("sessionToken=" + token), baseUrl);
            callback();
        });
    }

    describe("GET /oauth", function () {
        var requestUrl = baseUrl + "/oauth";

        it("responds with status code 400 if oAuth authorise fails", function (done) {
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, callback) {
                callback(null);
            });

            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 400);
                done();
            });
        });
        it("responds with status code 302 if oAuth authorise succeeds", function (done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, user);

            request({url: requestUrl, followRedirect: false}, function (error, response) {
                assert.equal(response.statusCode, 302);
                done();
            });
        });
        it("responds with a redirect to '/' if oAuth authorise succeeds", function (done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, user);

            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 200);
                assert.equal(response.request.uri.path, "/");
                done();
            });
        });
        it("add user to database if oAuth authorise succeeds and user id not found", function (done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, null);

            request(requestUrl, function (error, response) {
                assert(dbCollections.users.insertOne.calledOnce);
                assert.deepEqual(dbCollections.users.insertOne.firstCall.args[0], {
                    _id: "bob",
                    name: "Bob Bilson",
                    avatarUrl: "http://avatar.url.com/u=test"
                });
                done();
            });
        });
    });
    describe("GET /api/oauth/uri", function () {
        var requestUrl = baseUrl + "/api/oauth/uri";
        it("responds with status code 200", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 200);
                done();
            });
        });
        it("responds with a body encoded as JSON in UTF-8", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
                done();
            });
        });
        it("responds with a body that is a JSON object containing a URI to GitHub with a client id", function (done) {
            request(requestUrl, function (error, response, body) {
                assert.deepEqual(JSON.parse(body), {
                    uri: "https://github.com/login/oauth/authorize?client_id=" + oauthClientId
                });
                done();
            });
        });
    });
    describe("GET /api/user", function () {
        var requestUrl = baseUrl + "/api/user";
        it("responds with status code 401 if user not authenticated", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the user if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                request({url: requestUrl, jar: cookieJar}, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), {
                        _id: "bob",
                        name: "Bob Bilson",
                        avatarUrl: "http://avatar.url.com/u=test"
                    });
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function (done) {
            authenticateUser(testUser, testToken, function () {

                dbCollections.users.findOne.callsArgWith(1, {err: "Database error"}, null);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/users", function () {
        var requestUrl = baseUrl + "/api/users";
        var allUsers;
        beforeEach(function () {
            allUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(allUsers);
        });
        it("responds with status code 401 if user not authenticated", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allUsers.toArray.callsArgWith(0, null, [testUser]);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the user if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);

                request({url: requestUrl, jar: cookieJar}, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), [
                        {
                            id: "bob",
                            name: "Bob Bilson",
                            avatarUrl: "http://avatar.url.com/u=test"
                        },
                        {
                            id: "charlie",
                            name: "Charlie Colinson",
                            avatarUrl: "http://avatar.url.com/u=charlie_colinson"
                        }
                    ]);
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function (done) {
            authenticateUser(testUser, testToken, function () {
                allUsers.toArray.callsArgWith(0, {err: "Database failure"}, null);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/conversations", function () {
        var requestUrl = baseUrl + "/api/conversations";
        var allConversations;
        var allUsers;
        beforeEach(function () {
            allConversations = {
                toArray: sinon.stub()
            };
            dbCollections.conversations.find.returns(allConversations);
            allUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(allUsers);
        });
        it("responds with status code 401 if user not authenticated", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allConversations.toArray.callsArgWith(0, null, [testConversation]);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with empty list if no conversations present and user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allConversations.toArray.callsArgWith(0, null, []);

                request({url: requestUrl, jar: cookieJar}, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), []);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON of the conversations if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allConversations.toArray.callsArgWith(0, null, [testConversation]);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);

                request({url: requestUrl, jar: cookieJar}, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), [
                        {
                            id: "55eeb2cce4b0966f47937878",
                            users: [testUser, testUser2],
                            messages: ["testMsg1"]
                        }
                    ]);
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function (done) {
            authenticateUser(testUser, testToken, function () {
                allConversations.toArray.callsArgWith(0, {err: "Database failure"}, null);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("POST /api/conversations", function () {
        var requestUrl = baseUrl + "/api/conversations";
        var allConversations;
        var allUsers;
        var validConversation = {users : ["thullSL", "fakeTest"]};
        beforeEach(function () {
            allConversations = {
                toArray: sinon.stub()
            };
            dbCollections.conversations.find.returns(allConversations);
            allUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(allUsers);
        });
        it("responds with status code 401 if user not authenticated", function (done) {
            request.post({
                url: requestUrl,
                json: validConversation
            }, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request.post({url: requestUrl, json: validConversation, jar: cookieJar}, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 201 if user is authenticated && valid object", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgOnWith(1, null , null, testUser);
                dbCollections.conversations.insertOne.callsArgOnWith(1,
                    null , null, {insertedId : testConversation._id});

                request.post({url: requestUrl, json: validConversation, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 201);
                    done();
                });
            });
        });
        it("responds with status code 404 if user not found", function (done) {
            authenticateUser(testUser, testToken, function () {
                validConversation.users[0] = "not a user";
                dbCollections.users.findOne.callsArgOnWith(1, null , null, null);
                dbCollections.conversations.insertOne.callsArg(1);

                request.post({url: requestUrl, json: validConversation, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 404);
                    done();
                });
            });
        });
        it("responds with status code 500 user lookup fails", function (done) {
            authenticateUser(testUser, testToken, function () {
                validConversation.users[0] = "not a user";
                dbCollections.users.findOne.callsArgOnWith(1, null ,  {err: "Database failure"}, testUser);

                request.post({url: requestUrl, json: validConversation, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status code 500 if insert fails", function (done) {
            authenticateUser(testUser, testToken, function () {
                validConversation.users[0] = "not a user";
                dbCollections.users.findOne.callsArgOnWith(1, null , null, testUser);
                dbCollections.conversations.insertOne.callsArgOnWith(1, null , {err: "Database failure"}, null);

                request.post({url: requestUrl, json: validConversation, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/conversations/:id", function () {
        var allConversations;
        var allUsers;
        var allMessages;
        var requestUrl;
        beforeEach(function () {
            requestUrl = baseUrl + "/api/conversations/" + testConversation._id;
            allConversations = {
                toArray: sinon.stub()
            };
            dbCollections.conversations.find.returns(allConversations);
            allUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(allUsers);
            allMessages = {
                toArray: sinon.stub()
            };
            dbCollections.messages.find.returns(allMessages);
        });
        it("responds with status code 401 if user not authenticated", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with 400 if id is not valid and user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allConversations.toArray.callsArgWith(0, null, []);
                requestUrl = baseUrl + "/api/conversations/notvalid";
                request({url: requestUrl, jar: cookieJar}, function (error, response, body) {
                    assert.equal(response.statusCode, 400);
                    done();
                });
            });
        });
        it("responds with status code 200 if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.conversations.findOne.callsArgOnWith(1, null , null, testConversation);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);
                allMessages.toArray.callsArgWith(0, null, [testMessage]);
                mongo.ObjectID = sinon.stub();
                mongo.ObjectID.returnsArg(0);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });

        it("responds with a body that is a JSON of the conversations if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.conversations.findOne.callsArgOnWith(1, null , null, testConversation);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);
                allMessages.toArray.callsArgWith(0, null, [testMessage]);
                mongo.ObjectID = sinon.stub();
                mongo.ObjectID.returnsArg(0);

                request({url: requestUrl, jar: cookieJar}, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body),
                        {
                            id: "55eeb2cce4b0966f47937878",
                            users: [testUser, testUser2],
                            messages: [testMessage]
                        }
                    );
                    done();
                });
            });
        });
        it("responds with status code 500 if database on conversation find one", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.conversations.findOne.callsArgOnWith(1, null , {err: "Database failure"}, null);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);
                allMessages.toArray.callsArgWith(0, null, [testMessage]);
                mongo.ObjectID = sinon.stub();
                mongo.ObjectID.returnsArg(0);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status code 500 if database on users", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.conversations.findOne.callsArgOnWith(1, null , null, testConversation);
                allUsers.toArray.callsArgWith(0, "Database failure", null);
                allMessages.toArray.callsArgWith(0, null, [testMessage]);
                mongo.ObjectID = sinon.stub();
                mongo.ObjectID.returnsArg(0);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status code 500 if database on MESSAGES", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.conversations.findOne.callsArgOnWith(1, null , null, testConversation);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);
                allMessages.toArray.callsArgWith(0, "Database failure", null);
                mongo.ObjectID = sinon.stub();
                mongo.ObjectID.returnsArg(0);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status code 404 missing conversation", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.conversations.findOne.callsArgOnWith(1, null , null, null);
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);
                allMessages.toArray.callsArgWith(0, "Database failure", null);
                mongo.ObjectID = sinon.stub();
                mongo.ObjectID.returnsArg(0);

                request({url: requestUrl, jar: cookieJar}, function (error, response) {
                    assert.equal(response.statusCode, 404);
                    done();
                });
            });
        });
    });
});
