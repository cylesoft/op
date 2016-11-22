const tls = require('tls');
const fs = require('fs');

if (process.argv[2] == undefined) {
    console.log('no request given');
    process.exit(1);
} else {
    var ask_for = process.argv[2];
}

const onp_server_port = 21335;

const client_options = {
    rejectUnauthorized: false
};

var tls_stream = tls.connect(onp_server_port, client_options, function() {
    console.log('client connected');
    console.log('connection is', tls_stream.authorized ? 'authorized' : 'unauthorized');
    console.log('request: ' + ask_for);
    tls_stream.write(ask_for + '\n');
});

tls_stream.setEncoding('utf8');

tls_stream.on('data', function(data) {
    console.log('got back: ' + data.toString().trim());
    process.exit(0);
});

tls_stream.on('end', function() {
    console.log('client disconnected');
});
