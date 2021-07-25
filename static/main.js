const SCOPE = 'user:read';
const TYPE = 'token';
const _url = CONFIG.get('OAUTH_URL') + '?scope=' + SCOPE + '&client_id=' + CONFIG.get('CLIENT_ID')
    + '&redirect_uri=' + CONFIG.get('AUTH_REDIRECT') + '&response_type=' + TYPE;
let loginWindow;
window.jwt = '';
window.authSuccess = false;

$(function () {
    $("#tools").tabs();
    $("#ping_cmd").click(function (event) {
        event.preventDefault();
        const ping_url = CONFIG.get('BASE_URL') + "/api/v1/ping?ip=" + $('#ping_ip').val();
        getAndShowResults(ping_url, '#ping_results');
    });
    $("#traceroute_cmd").click(function (event) {
        event.preventDefault();
        const ping_url = CONFIG.get('BASE_URL') + "/api/v1/traceroute?ip=" + $('#traceroute_ip').val();
        getAndShowResults(ping_url, '#traceroute_results');
    });
    $("#mtr_cmd").click(function (event) {
        event.preventDefault();
        const ping_url = CONFIG.get('BASE_URL') + "/api/v1/mtr?ip=" + $('#mtr_ip').val();
        getAndShowResults(ping_url, '#mtr_results');
    });
    $("#bgpsum_cmd").click(function (event) {
        event.preventDefault();
        const ping_url = CONFIG.get('BASE_URL') + "/api/v1/bgp-summary";
        getAndShowResults(ping_url, '#bgpsum_results');
    });
    $("#route_cmd").click(function (event) {
        event.preventDefault();
        const ping_url = CONFIG.get('BASE_URL') + "/api/v1/route?ip=" + $('#route_ip').val();
        getAndShowResults(ping_url, '#route_results');
    });
    $("#routev6_cmd").click(function (event) {
        event.preventDefault();
        const ping_url = CONFIG.get('BASE_URL') + "/api/v1/route-v6?ip=" + $('#routev6_ip').val();
        getAndShowResults(ping_url, '#routev6_results');
    });
});

function getAndShowResults(ping_url, result) {
    $(result).html("<pre>pending</pre>");
    $.ajax({
        url: ping_url,
        headers: {"Authorization": "Bearer " + window.jwt}
    }).done(function (data) {
        $(result).html("<pre>" + data + "</pre>");
    }).fail(function (data) {
        console.log("error..... ", data.responseText)
        alert("error: " + data.responseText);
    });
}

function login() {
    window.authSuccess = false;
    loginWindow = window.open(_url, "login", 'width=800, height=600');

    const pollTimer = window.setInterval(function () {
        try {
            if (window.authSuccess) {
                window.clearInterval(pollTimer);
                loginWindow.close();
                $(".unauthenticated").hide()
                $(".authenticated").show()
                $("#user").html(parseJwt(window.jwt)['name']);
            }
        } catch (e) {
            console.log("error ", e);
        }
    }, 500);
}

function logout() {
    window.authSuccess = false;
    window.jwt = '';
    $(".authenticated").hide();
    $(".unauthenticated").show();
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
