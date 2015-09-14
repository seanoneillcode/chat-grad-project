var Promise = require("promise");
var mongo = require("mongodb");

function ConversationService(db) {

    var conversations = db.collection("conversations");
    var self = this;

    this.getConversations = function (user) {
        return new Promise(function (resolve, reject) {
            conversations.find({"users.id": user}).toArray(function (err, conversations) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    resolve(conversations);
                }
            });
        });
    };

    this.updateLastRead = function (conversationId, userId) {
        return new Promise(function (resolve, reject) {
            conversations.update({
                _id: mongo.ObjectID(conversationId),
                users: {$elemMatch: {id: userId}}
            }, {$currentDate: {"users.$.lastRead": true}}, function (err, conversation) {
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
