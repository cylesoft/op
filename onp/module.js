/**
 * ONP client module, for use in other node.js projects.
 */

const tls = require('tls');
const fs = require('fs');
const default_onp_server_port = 4;
const trust_directory = './trusted/';
const expected_certificate_extension = '.crt.pem';
var trusted_certificates = [];
var trusted_certificates_raw = [];

// load our known, trusted, but self-signed certificates
let files_in_trust_directory = fs.readdirSync(trust_directory);
for (let i in files_in_trust_directory) {
    let filename = files_in_trust_directory[i];

    // only pay attention to *.crt.pem files
    if (filename.substr(-8) === expected_certificate_extension) {
        filename = trust_directory + filename;
        let cert = ('' + fs.readFileSync(filename)).trim();
        if (cert === '') {
            continue; // ignore any empty files
        }
        trusted_certificates.push(cert); // for use as a CA parameter to tsl.connect()
        trusted_certificates_raw.push(parsePEMCertString(cert));
    }
}

// a helper function that takes a Buffer or string with a PEM-formatted base64 certificate
// and converts it to just the base64 string with no newlines
function parsePEMCertString(input) {
    input = '' + input; // make sure it's a string, not a Buffer
    let input_pieces = input.split('\n');
    let output = '';
    for (let i in input_pieces) {
        let piece = input_pieces[i].trim();
        if (
            piece === '' ||
            piece === '-----BEGIN CERTIFICATE-----' ||
            piece === '-----END CERTIFICATE-----'
        ) {
            continue;
        }
        output += piece;
    }
    return output;
}

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
    let tls_client_options = {
        ca: trusted_certificates,
        checkServerIdentity: (servername, cert) => {
            // console.log('assessing trust for ONP service...');
            // console.log('ONP server name is: ' + servername);
            // console.log('ONP cert is: ', cert);
            // console.log('ONP raw cert is: ', cert.raw);
            console.log('testing ONP service\'s certificate (fingerprint: ' + cert.fingerprint + ')');
            var cert_base64 = cert.raw.toString('base64');

            // this is how we would save the certificate as a file
            var cert_file =
                '-----BEGIN CERTIFICATE-----' + '\n' +
                cert_base64 + '\n' +
                '-----END CERTIFICATE-----' + '\n';
            // console.log(cert_file);

            let found = false;
            for (let i in trusted_certificates) {
                // console.log('checking against: ', trusted_certificates_raw[i]);
                if (trusted_certificates_raw[i] === cert_base64) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new Error('Certificate not found in list of trusted certificates!');
            } else {
                console.log('ONP service\'s certificate has been verified.');
            }
        },
    };

    // create our TLS stream and send along the given hostname
    let tls_stream = tls.connect(onp_server_port, onp_server, tls_client_options, function() {
        console.log('client connected to ONP server');
        console.log('connection is ' + (tls_stream.authorized ? 'authorized' : 'unauthorized'));
        tls_stream.write(hostname.trim() + '\n');
    });

    // set expected encoding back
    tls_stream.setEncoding('utf8');

    // on data back from the server, call the client's callback
    tls_stream.on('data', function(data) {
        callback(data.toString().trim());
    });
};
