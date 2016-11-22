const tls = require('tls');
const fs = require('fs');

const onp_server_port = 21335;
var onp_addresses = {};

const obscurity_file_contents = fs.readFileSync('obscurity', { encoding: 'UTF-8' });
console.log(obscurity_file_contents);

const obscurity_entries = obscurity_file_contents.split("\n");
for (let i in obscurity_entries) {
    if (obscurity_entries[i].trim() === '') {
        continue;
    }

    let pieces = obscurity_entries[i].trim().split(' ');

    if (pieces.length < 2) {
        continue;
    }

    let onp_domain = pieces[0].trim();

    if (onp_addresses[onp_domain] !== undefined) {
        continue;
    }

    let onp_verb = pieces[1].trim().toLowerCase();

    if (pieces.length === 2) {
        if (onp_verb === 'nope') {
            onp_addresses[onp_domain] = {
                type: 'nope',
            };
        }
    } else if (pieces.length === 3) {
        let onp_ip = pieces[2].trim();
        if (onp_verb === 'here') {
            onp_addresses[onp_domain] = {
                type: 'here',
                ip: onp_ip,
            };
        } else if (onp_verb === 'try') {
            onp_addresses[onp_domain] = {
                type: 'try',
                ip: onp_ip,
            };
        }
    }
}

// console.log(onp_addresses);

const server_options = {
    key: fs.readFileSync('../op.key.pem'),
    cert: fs.readFileSync('../op.crt.pem'),
};

const server = tls.createServer(server_options, function(c) {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' client connected');
    console.log(currentTime.toString() + ' connection is ', c.authorized ? 'authorized' : 'unauthorized');

    c.setEncoding('utf8');

    c.on('end', function() {
        let currentTime = new Date();
        console.log(currentTime.toString() + ' client disconnected');
    });

    c.on('data', function(data) {
        let currentTime = new Date();
        let request_string = data.toString().trim();
        let new_response = '';

        console.log(currentTime.toString() + ' new request: ' + request_string);

        let address = onp_addresses[request_string];
        if (address !== undefined) {
            if (address.type === undefined) {
                // what the fuck ... ?
                new_response = 'nope'; // fallback
            } else if (address.type !== undefined && address.ip !== undefined) {
                new_response = address.type + ' ' + address.ip;
            } else {
                new_response = address.type;
            }
        } else {
            new_response = 'nope';
        }

        currentTime = new Date();
        console.log(currentTime.toString() + ' new response: ' + new_response);
        c.write(new_response + '\n');
        c.end();
    });

});

server.listen(onp_server_port, function() {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' ONP server bound and ready at port ' + onp_server_port);
});
