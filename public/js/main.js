$.ajax({
    url: "/api/user"
}).then(function(user) {
    var div = document.createElement("div");
    div.textContent = "Logged in as " + user.name;
    document.body.appendChild(div);
}, function() {
    $.ajax({
        url: "/api/oauth/uri"
    }).then(function(result) {
        var anchor = document.createElement("a");
        anchor.textContent = "Log in";
        anchor.href = result.uri;
        document.body.appendChild(anchor);
    });
    console.log('not logged in');
});