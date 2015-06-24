var server = require("./server/server");
var MongoClient = require("mongodb").MongoClient;

var port = process.env.PORT || 8080;
var dbUri = process.env.DB_URI || "mongodb://test:test@ds027491.mongolab.com:27491/chat-grad-project";
var oauthClientId = process.env.OAUTH_CLIENT_ID || "fa4a22095c46dfc1d832";
var oauthSecret = process.env.OAUTH_SECRET || "4bbf1b48173c3cbc35917fad9f94ef2b584cbaa4";

MongoClient.connect(dbUri, function(err, db) {
    if (err) {
        console.log("Failed to connect to db", err);
        return;
    }
    server(port, db, oauthClientId, oauthSecret);
    console.log("Server running on port " + port);
});
