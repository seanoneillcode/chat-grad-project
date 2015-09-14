var Promise = require("promise");

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

    this.userListExists = function (userList) {
        return new Promise.all(userList.map(function(user) {
            self.getUser(user.id);
        }));
    };

    this.getUser = function (userId) {
        return new Promise(function (resolve, reject) {
            users.findOne({_id: userId}, function (err, user) {
                if (err) {
                    reject({code: 500, msg: err});
                } else if (user === null) {
                    reject({code: 404, msg: "User not found " + userId});
                } else {
                    resolve(user);
                }
            });
        });
    };
}

module.exports = UserService;
