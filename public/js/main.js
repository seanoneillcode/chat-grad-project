$.ajax({
    url: "/api/user"
}).then(function(user) {
    console.log('logged in as ' + user.name);
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