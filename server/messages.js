var Promise = require("promise");
var mongo = require("mongodb");

function MessageService(db) {

    var messages = db.collection("messages");
    var self = this;

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
}

module.exports = MessageService;
