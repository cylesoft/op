/**
 * The job of this script is just to connect to something and try to get a certificate from it,
 * given the correct command.
 *
 * Arguments are IP, port, and command;
 * Example: node cert_fetcher.js 192.168.1.100 9000 ello
 * In that example, "ello" is the command we'll send to the server.
 */

// set up nodejs dependencies
const fs = require('fs');
const net = require('net');
const readline = require('readline');

// set up external dependencies
const x509 = require('x509');

// set up some variables
var fetch_command;
var cert_server_ip;
var cert_server_port;
var fetched_cert;
var fetched_cert_raw;

// check for IP in command line
if (process.argv[2] === undefined) {
    console.log('Please supply an IP to connect to.');
    process.exit(1);
} else {
    cert_server_ip = process.argv[2].trim();
}

// check for port
if (process.argv[3] === undefined) {
    console.log('Please supply a port to connect to.');
    process.exit(1);
} else {
     cert_server_port = process.argv[3].trim() * 1;
}

// check for fetch command
if (process.argv[4] === undefined) {
    console.log('Please supply a fetch command to use once connected.');
    process.exit(1);
} else {
     fetch_command = process.argv[4].trim();
}

// create a socket connection to the server
var client = net.connect(cert_server_port, cert_server_ip, () => {
    console.log('Connected to server! Asking for certificate using fetch command...');
    client.write(fetch_command);
});

// throw errors on errors
client.on('error', (err) => {
    throw err;
});

// when the server gives us back data, try to parse it
client.on('data', (data) => {
    console.log('Parsing certificate from server...');
    fetched_cert_raw = data.toString();
    fetched_cert = x509.parseCert(fetched_cert_raw);
    console.log('Parsed certificate, closing connection to server.');
    client.end();
});

// when the server connection is done, see what we can do with the data we got
client.on('end', () => {
    console.log('Disconnected from server.');

    // make sure we got a certificate
    if (fetched_cert === undefined) {
        console.error('Did not get a valid certificate!');
        process.exit(1);
    }

    // show some info about the certificate
    console.log(' ');
    console.log('===== Fetched OCP Certificate Info =====')
    console.log('Info: ', fetched_cert.subject);
    console.log('Fingerprint: ', fetched_cert.fingerPrint);
    console.log(' ');

    // set up readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // prompt the user to save the certificate locally
    console.log('===== BE CAREFUL =====');
    rl.question('That look like what you want? Want to save it? (please answer "yes" or "no") ', (answer) => {
        if (answer.trim() === 'yes') {
            console.log('Saving...');
            // create a decent unique filename, and save the cert
            let filename = fingerprintToHex(fetched_cert.fingerPrint);
            filename = './trusted/' + filename + '.crt.pem';
            fs.writeFileSync(filename, fetched_cert_raw);
            console.log('Saved to file "' + filename + '"');
            console.log('All done!');
        } else {
            console.log('You did not say "yes", aborting...');
        }
        rl.close();
    });
});

/**
 * Convert the weird fingerprint string to a regular old valid hex string.
 * @param {String} fingerprint_string
 * @return {String}
 */
function fingerprintToHex(fingerprint_string) {
    const fingerprint_hex = fingerprint_string.replace(/:/g, ''); // this is the weirdness
    const fingerprint_buffer = new Buffer(fingerprint_hex, 'hex');
    return fingerprint_buffer.toString('hex');
}
