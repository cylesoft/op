// load the onp module
const onp = require('./module.js');

console.log('looking up some test ONP addresses...');

// use it to fetch a record
onp.getRecord('cyle.lol', function(record) {
    // spit out the record info
    console.log('looked up "cyle.lol", result: ' + record);
});

// and fetch another funnier one
onp.getRecord('👌 dot 😘', function(record) {
    // spit out the record info
    console.log('looked up "👌 dot 😘", result: ' + record)
});
