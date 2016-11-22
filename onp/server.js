/**
 * Obscure Name Protocol server.
 */

// load our node dependencies
const tls = require('tls');
const fs = require('fs');

// set up some basics for server config
const onp_server_port = 21335;
const definition_regex = /^(.+) ([a-z]+) ([a-z0-9\.]+)$/i;
var onp_addresses = {};

// get our supported domain names!
const obscurity_file_contents = fs.readFileSync('obscurity', { encoding: 'UTF-8' });

// let's go through our supported domain names list and parse em
const obscurity_entries = obscurity_file_contents.split('\n');
for (let i in obscurity_entries) {
    // ignore any blank lines
    if (obscurity_entries[i].trim() === '') {
        continue;
    }

    // split up the line into pieces
    let pieces = obscurity_entries[i].trim().match(definition_regex);

    // reject anything that doesn't fit our regex
    if (pieces === null || pieces.length < 4) {
        continue;
    }

    // get the domain name part
    let onp_domain = pieces[1].trim();

    // ignore any domain names that have already been defined
    if (onp_addresses[onp_domain] !== undefined) {
        continue;
    }

    // get the verb part
    let onp_verb = pieces[2].trim().toLowerCase();

    // ignore anything using an unsupported verb
    if (onp_verb !== 'here' && onp_verb !== 'try') {
        continue;
    }

    // okay, finally get the IP address of the thing
    let onp_ip = pieces[3].trim();

    // ignore any line that doesn't actually have an IP at the end
    if (onp_ip === '') {
        continue;
    }

    // cool. add it to our list of supported addresses.
    onp_addresses[onp_domain] = {
        type: onp_verb,
        ip: onp_ip,
    };
}

// load our TLS server options
const server_options = {
    key: fs.readFileSync('../op.key.pem'),
    cert: fs.readFileSync('../op.crt.pem'),
};

// create our TLS server to listen for new ONP requests
const server = tls.createServer(server_options, function(c) {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' client connected');
    console.log(currentTime.toString() + ' connection is ', c.authorized ? 'authorized' : 'unauthorized');

    // set our connection encoding
    c.setEncoding('utf8');

    // do this when a client disconnects
    c.on('end', function() {
        let currentTime = new Date();
        console.log(currentTime.toString() + ' client disconnected');
    });

    // do this on incoming data from our connected client
    c.on('data', function(data) {
        let currentTime = new Date();
        let request_string = data.toString().trim();
        let new_response = 'nope'; // default, in case all else fails here

        console.log(currentTime.toString() + ' new request: ' + request_string);

        // check and see if we have an address for the thing they're asking for
        let address = onp_addresses[request_string];
        if (address !== undefined && address.type !== undefined && address.ip !== undefined) {
            // we got it -- now send back the info we have
            new_response = address.type + ' ' + address.ip;
        }

        currentTime = new Date();
        console.log(currentTime.toString() + ' new response: ' + new_response);
        c.write(new_response + '\n');
        c.end(); // we're done
    });
});

// listen up!
server.listen(onp_server_port, function() {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' ONP server bound and ready at port ' + onp_server_port);
});
