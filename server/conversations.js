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

    this.conversationExists = function (conversationId) {
        return new Promise(function (resolve, reject) {
            conversations.findOne({_id: conversationId}, function (err, user) {
                if (err) {
                    reject({code: 500, msg: err});
                } else if (user === null) {
                    reject({code: 404, msg: "Conversation not found " + conversationId});
                } else {
                    resolve();
                }
            });
        });
    };

    this.update = function (conversation) {
        return new Promise(function (resolve, reject) {
            var id = mongo.ObjectID(conversation.id);
            conversations.update({_id: id}, conversation, function (err, count, status) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    resolve(conversations);
                }
            });
        });
    };

    this.addMessage = function (conversation, message) {
        return self.getConversation(conversation.id)
            .then(function (remoteCon) {
                remoteCon.messages.add(message.id);
                return remoteCon;
            })
            .then(self.update);
    };

    this.insertOne = function (conversation) {
        return new Promise(function (resolve, reject) {
            conversations.insertOne(conversation, function (err, result) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    conversation.id = result.insertedId;
                    resolve(conversation);
                }
            });
        });
    };
}

module.exports = ConversationService;
