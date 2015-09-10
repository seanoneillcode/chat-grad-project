var Promise = require("promise");
var mongo = require("mongodb");

function UserService(db) {

    var users = db.collection("users");
    var self = this;

    this.expandUsersForList = function (conversations) {
        return new Promise.all(conversations.map(self.expandUsers));
    };

    this.expandUsers = function (conversation) {
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

}

module.exports = UserService;
