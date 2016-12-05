/**
 * Obscure Transfer Protocol server
 */

// import standard libs
const tls = require('tls');
const fs = require('fs');
const path = require('path');

// set up some OTP server stuff
const otp_server_port = 6;
const otp_file_root = '../otproot'; // the local file path that represents the file root
const index_path = '/lol'; // the default file to look up for root requests
const otp_server_type = 'Obscure Transfer Protocol Basic Server'; // lol
const definition_regex = /^(.+) ([a-z]+)$/i;
const otp_verbs = {};

// get our supported domain names!
const obscurity_file_contents = fs.readFileSync('obscurity', { encoding: 'UTF-8' });

// let's go through our supported domain names list and parse em
const obscurity_entries = obscurity_file_contents.split('\n');
for (let i in obscurity_entries) {
    // ignore any blank lines
    if (obscurity_entries[i].trim() === '') {
        continue;
    }

    // cut the definition up into pieces
    let pieces = obscurity_entries[i].trim().match(definition_regex);

    // ignore any line that doesn't fit our expectations
    if (pieces === null || pieces.length < 3) {
        continue;
    }

    // grab the custom verb part
    let otp_custom_verb = pieces[1].trim();

    // ignore any custom verbs that collapse to nothing, or have already been defined
    if (otp_custom_verb === '' || otp_verbs[otp_custom_verb] !== undefined) {
        continue;
    }

    // grab the real verb we're mapping to
    let otp_real_verb = pieces[2].trim();

    // if the real verb isn't supported, ignore this line
    if (
        otp_real_verb !== 'hey' &&
        otp_real_verb !== 'req' &&
        otp_real_verb !== 'takethis'
    ) {
        continue;
    }

    // map our custom verb to the real verb
    otp_verbs[otp_custom_verb] = otp_real_verb;
}

// set up TLS server options
const server_options = {
    key: fs.readFileSync('../op.key.pem'),
    cert: fs.readFileSync('../op.crt.pem'),
};

// set up our OTP server on a TLS socket
var server = tls.createServer(server_options, function(c) {
    let unique_socket_id = Math.floor(Math.random() * 100000000); // not really very unique, i know
    let currentTime = new Date();
    console.log(currentTime.toString() + ' [' + unique_socket_id + '] client connected');
    console.log(currentTime.toString() + ' [' + unique_socket_id + '] client connection is ' + (c.authorized ? 'trusted' : 'NOT trusted'));

    // set the proper encoding
    c.setEncoding('utf8');

    // on client socket close
    c.on('end', function() {
        let currentTime = new Date();
        console.log(currentTime.toString() + ' [' + unique_socket_id + '] client disconnected');
    });

    // on incoming client request data
    c.on('data', function(data) {
        let currentTime = new Date();
        let new_response_status = '';
        let new_response_body = '';

        // the incoming request string
        let request_string = data.toString().trim();
        console.log(currentTime.toString() + ' [' + unique_socket_id + '] new request: ' + request_string.replace(/\n/g, ' \\n '));

        // separate request line from headers
        let request_headers = request_string.split('\n');

        // the incoming request must have at least 3 lines
        if (request_headers.length < 3) {
            c.write('otp/1.0 wat'); // dunno what to do with the incoming request, it's already wrong
            c.end();
            return;
        }

        // the request's OTP version should be on the first line by itself
        let otp_version = request_headers[0].trim();

        // bail out when protocol doesn't work
        if (otp_version !== 'otp/1.0') {
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] unsupported protocol');
            c.write('otp/1.0 nope');
            c.end();
            return;
        }

        // the OTP verb being used in the request should be the second line
        let otp_verb = request_headers[1].trim();

        // make sure the verb isn't empty
        if (otp_verb === '') {
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] verb was empty');
            c.write('otp/1.0 nope');
            c.end();
            return;
        }

        console.log(currentTime.toString() + ' [' + unique_socket_id + '] incoming verb is: ' + otp_verb);

        // look up the real verb that maps to the given custom verb
        let otp_real_verb = otp_verbs[otp_verb];

        // make sure the mapping exists
        if (otp_real_verb === undefined) {
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] verb is unsupported');
            c.write('otp/1.0 nope');
            c.end();
            return;
        }

        console.log(currentTime.toString() + ' [' + unique_socket_id + '] real verb is: ' + otp_real_verb);

        // the OTP domain name and resource path should be the third line
        let otp_domain_and_path = request_headers[2].trim();

        // make sure the domain and path part isn't empty
        if (otp_domain_and_path === '') {
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] domain and path line was empty');
            c.write('otp/1.0 nope');
            c.end();
            return;
        }

        request_headers.splice(0, 3); // reset headers to not include the first 3 lines

        console.log(currentTime.toString() + ' [' + unique_socket_id + '] request headers: ', request_headers.join(', '));

        // get the incoming host and path piece, parse em
        let otp_path_breakpoint = otp_domain_and_path.indexOf('/');
        let otp_domain;
        let otp_path;
        if (otp_path_breakpoint === -1) {
            otp_domain = otp_domain_and_path;
            otp_path = '/';
        } else {
            otp_domain = otp_domain_and_path.substring(0, otp_path_breakpoint);
            otp_path = otp_domain_and_path.substring(otp_path_breakpoint);
            otp_path = path.normalize(otp_path);
        }

        // oh cool
        console.log(currentTime.toString() + ' [' + unique_socket_id + '] request host: ' + otp_domain);
        console.log(currentTime.toString() + ' [' + unique_socket_id + '] request path: ' + otp_path);

        // set up actual file path
        let file_path = '';
        if (otp_path === '/') {
            file_path = otp_file_root + index_path;
        } else {
            file_path = otp_file_root + otp_path;
        }

        // do something based on the OTP method
        if (otp_real_verb === 'hey') {
            // HEY requests just check for a file
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] new HEY request for ' + otp_path);
            if (fs.existsSync(file_path)) {
                new_response_status = 'otp/1.0 sure';
            } else {
                new_response_status = 'otp/1.0 nope';
            }
        } else if (otp_real_verb == 'req') {
            // REQ requests want the actual contents of a file
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] new REQ request for ' + otp_path);
            if (fs.existsSync(file_path)) {
                new_response_status = 'otp/1.0 okay';
                new_response_body = fs.readFileSync(file_path, { encoding: 'utf8' });
            } else {
                new_response_status = 'otp/1.0 nope';
            }
        } else if (otp_real_verb == 'takethis') {
            // TAKETHIS requests are like POST requests, they have data included for parsing
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] new TAKETHIS request for ' + otp_path);

            // not supported yet

            new_response_status = 'otp/1.0 nope';
            new_response_body = 'TAKETHIS method not supported yet.'
        } else {
            // welp. dunno what to do.
            console.log(currentTime.toString() + ' [' + unique_socket_id + '] error: no valid OTP method/verb given');
            new_response_status = 'otp/1.0 nope';
        }

        // send back the response
        currentTime = new Date();
        console.log(currentTime.toString() + ' [' + unique_socket_id + '] new response: ' + new_response_status);
        c.write(new_response_status + '\n' + 'server-type ' + otp_server_type + '\n\n' + new_response_body + '\n');
        c.end();
    });

});

server.listen(otp_server_port, function() {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' OTP server bound and ready on port ' + otp_server_port);
});
