// load the otp module
const otp = require('./module.js');

// do a basic test
otp.request('gimme', '127.0.0.1', '/lol', 'some mega dicks', null, (response_string) => {
    console.log('got back:');
    console.log(response_string);
});
