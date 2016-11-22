/**
 * OTP server
 */

// import standard libs
const tls = require('tls');
const fs = require('fs');
const path = require('path');

// set up some OTP server stuff
const otp_server_port = 21337;
const otp_file_root = '../otproot'; // the local file path that represents the file root
const index_path = '/lol'; // the default file to look up for root requests
const otp_server_type = 'Obscure Transfer Protocol Basic Server'; // lol

// set up TLS server options
const server_options = {
    key: fs.readFileSync('../op.key.pem'),
    cert: fs.readFileSync('../op.crt.pem'),
};

// set up our OTP server on a TLS socket
var server = tls.createServer(server_options, function(c) {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' client connected');
    console.log(currentTime.toString() + ' connection is' + (c.authorized ? 'authorized' : 'unauthorized'));

    // set the proper encoding
    c.setEncoding('utf8');

    // on client socket close
    c.on('end', function() {
        let currentTime = new Date();
        console.log(currentTime.toString() + ' client disconnected');
    });

    // on incoming client request data
    c.on('data', function(data) {
        let currentTime = new Date();
        let new_response_status = '';
        let new_response_body = '';

        // the incoming request string
        let request_string = data.toString().trim();
        console.log(currentTime.toString() + ' new request: ' + request_string);

        // separate request line from headers
        let request_headers = request_string.split("\n");

        // get the request line itself
        let otp_request = request_headers[0];
        request_headers.splice(0, 1); // reset headers to not include it

        console.log(currentTime.toString() + ' request headers: ', request_headers.join(', '));

        // clear out and compress excess white space
        otp_request = otp_request.replace(/ {2,}/g, ' ');
        console.log(currentTime.toString() + ' cleaned OTP request: ' + otp_request);

        // break down the request string
        let request_parts = otp_request.split(' ');
        console.log(currentTime.toString() + ' request pieces: ' + request_parts.join(', '));

        // get OTP request version
        var request_version = request_parts[0].toLowerCase();

        // bail out when protocol doesn't work
        if (request_version !== 'otp/1.0') {
            console.log(currentTime.toString() + ' unsupported protocol');
            c.write('otp/1.0 nope');
            c.end();
            return;
        }

        // get the incoming method type
        let otp_method = request_parts[1].toLowerCase();

        // get the incoming host and path piece, parse em
        let otp_path = request_parts[2];
        otp_path = path.normalize(otp_path);
        let otp_path_parts = /^([-_a-z0-9\.]+)\//i.exec(otp_path);
        console.log(currentTime.toString() + ' request path parts: ' + otp_path_parts.join(', '));
        let otp_host = otp_path_parts[1];
        otp_path = otp_path.replace(otp_host, '');

        // oh cool
        console.log(currentTime.toString() + ' request host: ' + otp_host);
        console.log(currentTime.toString() + ' request path: ' + otp_path);

        // bad path string? bail out
        if (otp_path.charAt(0) !== '/') {
            c.write('otp/1.0 nope');
            c.end();
            return;
        }

        // set up actual file path
        let file_path = '';
        if (otp_path === '/') {
            file_path = otp_file_root + index_path;
        } else {
            file_path = otp_file_root + otp_path;
        }

        // do something based on the OTP method
        if (otp_method === 'hey') {
            // HEY requests just check for a file
            console.log(currentTime.toString() + ' new HEY request for ' + otp_path);
            if (fs.existsSync(file_path)) {
                new_response_status = 'otp/1.0 sure';
            } else {
                new_response_status = 'otp/1.0 nope';
            }
        } else if (otp_method == 'req') {
            // REQ requests want the actual contents of a file
            console.log(currentTime.toString() + ' new REQ request for ' + otp_path);
            if (fs.existsSync(file_path)) {
                new_response_status = 'otp/1.0 okay';
                new_response_body = fs.readFileSync(file_path, { encoding: 'utf8' });
            } else {
                new_response_status = 'otp/1.0 nope';
            }
        } else if (otp_method == 'takethis') {
            // TAKETHIS requests are like POST requests, they have data included for parsing
            console.log(currentTime.toString() + ' new TAKETHIS request for ' + otp_path);

            // not supported yet

            new_response_status = 'otp/1.0 nope';
            new_response_body = 'TAKETHIS method not supported yet.'
        } else {
            // welp. dunno what to do.
            console.log(currentTime.toString() + ' error: no OTP method/verb given');
            new_response_status = 'otp/1.0 nope';
        }

        // send back the response
        currentTime = new Date();
        console.log(currentTime.toString() + ' new response: ' + new_response_status);
        c.write(new_response_status + '\n' + 'server-type ' + otp_server_type + '\n\n' + new_response_body + '\n');
        c.end();
    });

});

server.listen(otp_server_port, function() {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' OTP server bound and ready on port ' + otp_server_port);
});
