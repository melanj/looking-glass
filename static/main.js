const SCOPE = 'user:read';
const TYPE = 'token';
const _url = CONFIG.get('OAUTH_URL') + '?scope=' + SCOPE + '&client_id=' + CONFIG.get('CLIENT_ID')
    + '&redirect_uri=' + CONFIG.get('AUTH_REDIRECT') + '&response_type=' + TYPE;
let loginWindow;
window.jwt = '';
window.authSuccess = false;

$(document).ready(function () {

    $("#tools").tabs();

    $.validator.addMethod('IPV4Checker', function (value) {
        return value.match(/^(25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[0-9]{2}|[0-9])(\.(25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[0-9]{2}|[0-9])){3}$/);
    }, 'Invalid IPv4 address');

    $.validator.addMethod('IPV4V6Checker', function (value) {
        return value.match(/^(25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[0-9]{2}|[0-9])(\.(25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[0-9]{2}|[0-9])){3}$/) || isIPv6(value);
    }, 'Invalid IP address');

    $.validator.addMethod('IPV6Checker', function (value) {
        return isIPv6(value);
    }, 'Invalid IPv6 address');

    $('#ping_form').validate({
        rules: {
            ping_ip: {
                required: true,
                IPV4V6Checker: true
            }
        },
        submitHandler: function (form) {
            const ping_url = CONFIG.get('BASE_URL') + "/api/v1/ping?ip=" + $('#ping_ip').val();
            getAndShowResults(ping_url, '#ping_results');
            return false;
        }
    });

    $('#ping_cmd').on('click', function () {
        $('#ping_form').submit();
    });

    $('#traceroute_form').validate({
        rules: {
            traceroute_ip: {
                required: true,
                IPV4V6Checker: true
            }
        },
        submitHandler: function (form) {
            const traceroute_url = CONFIG.get('BASE_URL') + "/api/v1/traceroute?ip=" + $('#traceroute_ip').val();
            getAndShowResults(traceroute_url, '#traceroute_results');
            return false;
        }
    });

    $('#traceroute_cmd').on('click', function () {
        $('#traceroute_form').submit();
    });

    $('#mtr_form').validate({
        rules: {
            mtr_ip: {
                required: true,
                IPV4V6Checker: true
            }
        },
        submitHandler: function (form) {
            const mtr_url = CONFIG.get('BASE_URL') + "/api/v1/mtr?ip=" + $('#mtr_ip').val();
            getAndShowResults(mtr_url, '#mtr_results');
            return false;
        }
    });

    $('#mtr_cmd').on('click', function () {
        $('#mtr_form').submit();
    });

    $('#route_form').validate({
        rules: {
            route_ip: {
                required: true,
                IPV4Checker: true
            }
        },
        submitHandler: function (form) {
            const bgp_route_url = CONFIG.get('BASE_URL') + "/api/v1/route?ip=" + $('#route_ip').val();
            getAndShowResults(bgp_route_url, '#route_results');
            return false;
        }
    });

    $('#route_cmd').on('click', function () {
        $('#route_form').submit();
    });

    $('#routev6_form').validate({
        rules: {
            routev6_ip: {
                required: true,
                IPV6Checker: true
            }
        },
        submitHandler: function (form) {
            const bgp_route6_url = CONFIG.get('BASE_URL') + "/api/v1/route-v6?ip=" + $('#routev6_ip').val();
            getAndShowResults(bgp_route6_url, '#routev6_results');
            return false;
        }
    });

    $('#routev6_cmd').on('click', function () {
        $('#routev6_form').submit();
    });

    $('#bgpsum_cmd').on('click', function () {
        const bgpsum_url = CONFIG.get('BASE_URL') + "/api/v1/bgp-summary";
        getAndShowResults(bgpsum_url, '#bgpsum_results');
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

function isIPv6(value)
{
    const components = value.split(":");
    if (components.length < 2 || components.length > 8)
        return false;
    if (components[0] !== "" || components[1] !== "")
    {
        if (!components[0].match(/^[\da-f]{1,4}/i))
        {
            return false;
        }
    }
    let numberOfZeroCompressions = 0;
    for (let i = 1; i < components.length; ++i)
    {
        if (components[i] === "")
        {
            ++numberOfZeroCompressions;
            if (numberOfZeroCompressions > 1)
            {
                return false;
            }
            continue;
        }
        if (!components[i].match(/^[\da-f]{1,4}/i))
        {
            return false;
        }
    }
    return true;
}
