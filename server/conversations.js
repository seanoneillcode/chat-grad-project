var Promise = require("promise");
var mongo = require("mongodb");
var UserService = require("./users.js");
var MessageService = require("./messages.js");

function ConversationService(db) {

    var conversations = db.collection("conversations");
    var uService = new UserService(db);
    var mService = new MessageService(db);
    var self = this;

    this.getConversations = function () {
        return new Promise(function (resolve, reject) {
            conversations.find().toArray(function (err, conversations) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    resolve(conversations);
                }
            });
        });
    };

    this.getConversation = function (id) {
        return new Promise(function (resolve, reject) {
            conversations.findOne({_id: mongo.ObjectID(id)}, function (err, conversation) {
                if (err) {
                    reject({code: 500, msg: err});
                } else if (conversation === null) {
                    reject({code: 404, msg: err});
                }
                else {
                    resolve(conversation);
                }
            });
        });
    };

    this.marshalConversationList = function (conversations) {
        return conversations.map(self.marshalConversation);
    };

    this.marshalConversation = function (conversation) {
        return {
            id: conversation._id,
            users: conversation.users,
            messages: conversation.messages
        };
    };

    this.validateNew = function (conversation) {
        return uService.userListExists(conversation.users);
    };

    this.insertOne = function (conversation) {
        return new Promise(function (resolve, reject) {
            conversations.insertOne(conversation, function (err, result) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    resolve(conversation);
                }
            });
        });
    };
}

module.exports = ConversationService;
