var Promise = require("promise");
var mongo = require("mongodb");

function ConversationService(db) {

    var users = db.collection("users");
    var conversations = db.collection("conversations");
    var messages = db.collection("messages");
    var self = this;

    this.getConversations = function() {
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

    this.allExpandUsers = function(conversations) {
        return new Promise.all(conversations.map(self.expandUsers));
    };

    this.expandUsers = function(conversation) {
        return new Promise(function (resolve, reject) {
            users.find({_id: {$in: conversation.users}}).toArray(function (err, fullUsers) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    conversation.users = fullUsers;
                    resolve(conversation);
                }
            });
        });
    };

    this.getConversation = function(id) {
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

    this.expandMessages = function(conversation) {
        return new Promise(function (resolve, reject) {
            var messageIds = conversation.messages.map(mongo.ObjectID);
            messages.find({_id: {$in: messageIds}}).toArray(function (err, fullMessages) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    conversation.messages = fullMessages;
                    resolve(conversation);
                }
            });
        });
    };

    this.allMarshalConversation = function(conversations) {
        return conversations.map(self.marshalConversation);
    };

    this.marshalConversation = function(conversation) {
        return {
            id: conversation._id,
            users: conversation.users,
            messages: conversation.messages
        };
    };
}

module.exports = ConversationService;
