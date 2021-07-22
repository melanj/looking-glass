const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

$.get(CONFIG.get('BASE_URL') + "/login/oauth2?code=" + code, function(data, status){
    if(status === 'success') {
        window.opener.jwt = data['token'];
        window.opener.authSuccess = true;
    }
});
