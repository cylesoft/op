/**
 * The job of this server is just to advertise your certificate for others to download,
 * making it easier to share.
 *
 * Arguments are file path, port, and command to expect from clients;
 * Example: node cert_server.js ./cert.pem 9000 ello
 * In that example, "./cert.pem" is the file path of certificate, 9000 is the port, and "ello" is the command you expect from clients.
 * If any other command is given on connect, the connection will be dropped immediately.
 */

// set up nodejs dependencies
const net = require('net');
const fs = require('fs');

// set up external dependencies
const x509 = require('x509');

// set up some variables
var certificate_filepath;
var accepted_command;
var cert_server_port;
var connection_timeout = 3000; // clients have 3 seconds before getting kicked

// make sure there is a certificate to send
if (process.argv[2] === undefined) {
    console.log('Please supply a certificate to advertise.');
    process.exit(1);
} else {
    certificate_filepath = process.argv[2].trim();
}

// make sure a file actually exists there
if (!fs.existsSync(certificate_filepath)) {
    console.log('A certificate does not exist at the given filepath.');
    process.exit(1);
}

// make sure there is a port to use
if (process.argv[3] === undefined) {
    console.log('Please supply a port to advertise on.');
    process.exit(1);
} else {
    cert_server_port = process.argv[3].trim() * 1;
}

// make sure there is a command to expect
if (process.argv[4] === undefined) {
    console.log('Please supply the command to expect from clients.');
    process.exit(1);
} else {
    accepted_command = process.argv[4].trim();
}

// try to get the certificate we'll be sending out
var certificate_raw = fs.readFileSync(certificate_filepath).toString();
var certificate = x509.parseCert(certificate_raw);

// show our own certificate info
console.log('===== Your OCP Certificate Info =====');
console.log('Info: ', certificate.subject);
console.log('Fingerprint: ', certificate.fingerPrint);
console.log(' ');

// set up our socket server to listen for connections
const server = net.createServer((c) => {
    // new connection handler
    console.log('Client connected from ' + c.remoteAddress);

    // set up a timeout on all clients
    c.setTimeout(connection_timeout, () => {
        console.error('Client timed out, disconnecting.');
        c.end();
    });

    // when the client sends us data, see if it's the command we expect
    c.on('data', (data) => {
        let command = data.toString('utf8');
        console.log('Incoming command: ' + command);
        if (command === accepted_command) {
            console.log(accepted_command + ' command accepted, sending certificate.');
            c.write(certificate_raw);
            c.end();
        } else {
            console.log('Unknown command, killing client.');
            c.end();
        }
    });

    // print out something when a client disconnects
    c.on('end', () => {
        console.log('Client disconnected.');
    });
});

// show errors when they happen
server.on('error', (err) => {
    throw err;
});

// listen for new connections
server.listen(cert_server_port, () => {
    console.log('Certificate server advertising on port ' + cert_server_port);
    console.log('Server will only respond to "' + accepted_command + '"');
});
