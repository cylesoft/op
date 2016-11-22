/**
 * ONP client module, for use in other node.js projects.
 */

const tls = require('tls');
const fs = require('fs');
const default_onp_server_port = 21335;

/**
 * A simple helper function that gets a record back for the given hostname from a ONP server.
 *
 * @param {String} hostname The domain name to look up.
 * @param {Function} callback The callback to perform when this gets the record, should expect a string as input.
 * @param {String} onp_server The ONP server address to look up on, defaults to localhost
 * @param {Number} onp_server_port The ONP port to use, defaults to the default 21335
 */
module.exports.getRecord = function(hostname, callback, onp_server, onp_server_port) {
    // make sure there's a server provided
    if (onp_server === undefined) {
        onp_server = '127.0.0.1'; // default to localhost
    }

    // make sure there's a port defined
    if (onp_server_port === undefined) {
        onp_server_port = default_onp_server_port; // default to the default, lol
    }

    // TLS client options
    let client_options = {
        rejectUnauthorized: false
    };

    // create our TLS stream and send along the given hostname
    let tls_stream = tls.connect(onp_server_port, onp_server, client_options, function() {
        tls_stream.write(hostname.trim() + '\n');
    });

    // set expected encoding back
    tls_stream.setEncoding('utf8');

    // on data back from the server, call the client's callback
    tls_stream.on('data', function(data) {
        callback(data.toString().trim());
    });
};
