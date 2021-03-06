/**
 * OTP client module, for use in other node.js projects.
 * Note: does not include any ONP functionality.
 */
const fs = require('fs');
const tls = require('tls');

const default_otp_server_port = 6;
const OPUtils = require('../lib/utils.js');

// get our trusted certificates
const trust_directory = './trusted/';
const trusted_certificates = OPUtils.getCertificatesInDirectory(trust_directory);

// this'll hold our OTP helper functions
const OTP = {};

/**
 * A helper function to do a totally custom OTP request.
 *
 * @param {String} verb The OTP verb to use to send for the resource.
 * @param {String} ip The IP address to send the request to.
 * @param {String} path The resource path to request from the server.
 * @param {String} hostname The hostname of the OTP server you're sending a request to.
 * @param {String} data The data to pass along to the server in the request. Must be a string.
 * @param {Function} callback The function to call when the request has been completed; should expect a string.
 * @param {Number} otp_server_port Optional. The OTP server port to access.
 */
OTP.request = function(verb, ip, path, hostname, data, callback, otp_server_port) {
    // make sure we have a OTP server port to access
    if (otp_server_port === undefined) {
        otp_server_port = default_otp_server_port;
    }

    // make sure a path is specified of some kind
    if (path === undefined) {
        path = '/'; // default to the root
    }

    // our TLS client options
    let tls_client_options = {
        rejectUnauthorized: true, // specify here so it cannot be tampered with via process.env
        ca: trusted_certificates.raw,
        checkServerIdentity: (hostname, cert) => {
            OPUtils.ensureCertificateIsTrusted(cert, trusted_certificates.certs);
        },
    };

    // set up our TLS stream to the CTP server
    let tls_stream = tls.connect(otp_server_port, ip, tls_client_options, function() {
        console.log('Client connected to OTP service');
        console.log('Connection to OTP service is ' + (tls_stream.authorized ? 'trusted' : 'NOT trusted'));

        // build our request string
        let request_string = 'otp/1.0' + '\n' + verb + '\n' + hostname + path;

        // if we were given data, append it to the request
        if (data !== null && data !== undefined) {
            request_string += '\n\n' + data;
        }

        // send along the request to the CTP server
        console.log('Sending request: ' + request_string);
        tls_stream.write(request_string + '\n');
    });

    // set the expected encoding on the TLS stream
    tls_stream.setEncoding('utf8');

    // when the CTP server gives us back data, hit the callback with it
    tls_stream.on('data', function(data) {
        callback(data.toString().trim());
    });
}

// here you go, enjoy!
module.exports = OTP;
