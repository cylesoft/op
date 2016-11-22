// load the onp module
const onp = require('./module.js');

// use it to fetch a record
onp.getRecord('cyle.lol', function(record) {
    // spit out the record info
    console.log(record);
});
