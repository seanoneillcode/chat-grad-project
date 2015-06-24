/* global $, document */
$.ajax({
    url: "/api/user"
}).then(function(user) {
    var div = document.createElement("div");
    div.textContent = "Logged in as " + user.name;
    document.body.appendChild(div);

    $.ajax({
        url: "/api/users"
    }).then(function(users) {
        var usersLabel = document.createElement("h2");
        usersLabel.textContent = "List of registered users";
        document.body.appendChild(usersLabel);
        var ul = document.createElement("ul");
        users.map(makeLi).forEach(function (li) {
            ul.appendChild(li);
        });
        document.body.appendChild(ul);
    });
}, function() {
    $.ajax({
        url: "/api/oauth/uri"
    }).then(function(result) {
        var anchor = document.createElement("a");
        anchor.textContent = "Log in";
        anchor.href = result.uri;
        document.body.appendChild(anchor);
    });
    console.log("not logged in");
});

function makeLi(user) {
    var li = document.createElement("li");
    li.textContent = user.name;
    return li;
}
