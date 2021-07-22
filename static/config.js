const CONFIG = (function () {
    const env = {
        'BASE_URL': 'http://localhost:8080',
        'OAUTH_URL': 'https://github.com/login/oauth/authorize',
        'CLIENT_ID': '<client_id>',
        'AUTH_REDIRECT': 'http://localhost:8080/login.html'
    };

    return {
        get: function (name) {
            return env[name];
        }
    };
})();
