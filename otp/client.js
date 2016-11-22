/**
 * A sample command line ONP+OTP client
 *
 * Usage:
 * node client.js something.lol/resource
 *
 * or:
 * node client.js 127.0.0.1/resource
 *
 * If you use an IP address, this skips the ONP lookup.
 */

// get IP of server from given hostname
const onp = require('../onp');

// load the CTP module
const otp = require('./module.js');

// what ONP server to use for lookups
const onp_ip = '127.0.0.1';

// this'll hold our full outgoing request
var request = '';

if (process.argv[2] === undefined) {
    console.log('no host given');
    process.exit(1);
} else {
    request = process.argv[2].trim();
}

console.log('request is for: ' + request);

var request_path;
var request_host;
var request_is_ip_already = false;

const ip_regex = /^\d+\.\d+\.\d+\.\d+$/i;

var slash_in_request = request.indexOf('/');
if (slash_in_request === -1) {
    // no slash in the request
    request_path = '/'; // default
    request_host = request;
} else {
    request_path = request.substring(slash_in_request);
    request_host = request.substring(0, slash_in_request);
}

// check to see if we already have the IP address and don't need to do a ONP lookup
if (ip_regex.test(request_host)) {
    request_is_ip_already = true;
}

console.log('request host: ' + request_host);
console.log('request path: ' + request_path);

if (request_is_ip_already) {
    console.log('request is an IP already, no ONP lookup necessary');

    // do the OTP request then
    otp.req(request_host, request_path, request_host, function(page) {
        console.log(page); // got it!
    });
} else {
    console.log('request requires a ONP lookup first');
    onp.getRecord(request_host, function(onp_response) {
        // do some basic cleanup of the ONP response
        onp_response = onp_response.replace(/ {2,}/g, ' ');

        // break up the response into parts
        let onp_parts = onp_response.split(' ');

        if (onp_parts.length === 0) {
            console.log('cannot look up hostname, something wrong with the ONP response: ' + onp_response);
            return;
        }

        // analyze the ONP lookup response
        if (onp_parts[0] === 'nope') {
            // ONP lookup failed
            console.log('hostname not found');
        } else if (onp_parts[0] === 'here' && onp_parts.length === 2) {
            // we got it!
            let otp_ip = onp_parts[1];
            console.log('IP for hostname ' + request_host + ' is ' + otp_ip);

            // do the OTP request now
            otp.req(otp_ip, request_path, request_host, function(page) {
                console.log(page); // got it!
            });
        } else if (onp_parts[0] === 'try' && onp_parts.length === 2) {
            // ONP lookup points to a different ONP server
            let onp_forward_ip = onp_parts[1]; // where to look
            console.log('hostname is maybe lookup-able on ' + onp_forward_ip + ', but this client is not set up to hop there');
        } else {
            // dunno what the ONP lookup gave us
            console.log('cannot look up hostname, ONP response is weird: ' + onp_response);
        }
    }, onp_ip);
}
