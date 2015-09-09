var Promise = require("promise");
var mongo = require("mongodb");
var UserService = require("./users.js");
var ConversationService = require("./conversations.js");

function MessageService(db) {

    var messages = db.collection("messages");
    var uService = new UserService(db);
    var self = this;

    this.expandMessages = function(conversation) {
        return new Promise(function (resolve, reject) {
            var conversationId = mongo.ObjectID(conversation._id);
            messages.find({conversation: conversationId}).toArray(function (err, fullMessages) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    conversation.messages = fullMessages;
                    resolve(conversation);
                }
            });
        });
    };

    //this.validateNew = function (message) {
    //    return uService.userExists(message.sender).then(function() {
    //        return cService.conversationExists(message.conversation);
    //    });
    //};

    this.insertOne = function (message) {
        return new Promise(function (resolve, reject) {
            messages.insertOne(message, function (err, result) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    message._id = result.insertedId;
                    resolve(message);
                }
            });
        });
    };
}

module.exports = MessageService;
