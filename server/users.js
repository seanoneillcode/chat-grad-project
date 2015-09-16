var Promise = require("promise");

function UserService(db) {

    var users = db.collection("users");
    var self = this;

    this.getUsers = function () {
        return new Promise(function (resolve, reject) {
            users.find().toArray(function (err, users) {
                if (err) {
                    reject({code: 500, msg: err});
                } else {
                    resolve(users);
                }
            });
        });
    };

    this.userListExists = function (userList) {
        return new Promise.all(userList.map(function (user) {
            return self.getUser(user.id);
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

    this.marshalUserList = function (users) {
        return users.map(self.marshalUser);
    };

    this.marshalUser = function (user) {
        return {
            id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl
        };
    };
}

module.exports = UserService;
