var Promise = require("promise");
var mongo = require("mongodb");

function ConversationService(db) {

    var conversations = db.collection("conversations");
    var self = this;

    this.getConversations = function (user) {
        return new Promise(function (resolve, reject) {
            conversations.find({users: user}).toArray(function (err, conversations) {
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
                console.log(err, conversation);
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
        if (conversation.messages !== undefined) {
            conversation.messages.forEach(function (message) {
                message.sender = findUser(conversation.users, message.sender);
            });
        }
        return {
            id: conversation._id,
            users: conversation.users,
            messages: conversation.messages
        };
    };

    function findUser(userList, userId) {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i]._id === userId) {
                return userList[i];
            }
        }
    }

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
