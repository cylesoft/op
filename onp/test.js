// load the onp module
const onp = require('./module.js');

// use it to fetch a record
onp.getRecord('cyle.lol', function(record) {
    // spit out the record info
    console.log(record);
});

// and fetch another funnier one
onp.getRecord('👌 dot 😘', function(record) {
    // spit out the record info
    console.log(record);
});
