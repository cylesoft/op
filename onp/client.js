/**
 * A simple command-line ONP client.
 *
 * Takes at least one argument, being what to look up.
 * Usage: node client.js "right okay 👌"
 *
 * By default, this will look up the address via localhost.
 * To specify an ONP server to use, use the next argument:
 * Usage: node client.js "right okay 👌" 192.168.1.1
 *
 * By default, this will look up on the default ONP port.
 * To specify which port to use, use the next argument:
 * Usage: node client.js "right okay 👌" 192.168.1.1 420
 */

// load the onp module
const onp = require('./module.js');

// make sure we have a string to even look up
if (process.argv[2] === undefined) {
    console.log('no request given');
    process.exit(1);
}

// here's the string that we're asking for
const ask_for = process.argv[2];

// check to see if the CLI provided a specific ONP service IP to use
const onp_server =
    (process.argv[3] !== undefined && process.argv[3].trim() !== '') ?
        process.argv[3].trim() :
        undefined;

// check to see if the CLI provided a specific ONP port to use
const onp_server_port =
    (process.argv[4] !== undefined && process.argv[4].trim() !== '') ?
        process.argv[4].trim() :
        undefined;

// ok, good to try now
console.log('looking up: ' + ask_for);

// try looking up what IP matches
onp.getRecord(ask_for, function(record) {
    // spit out the record info
    console.log('looked up "' + ask_for + '", result: ' + record);
}, onp_server, onp_server_port);
