/**
 * A class for helper utils used by ONP and OTP modules.
 */

const fs = require('fs');

// this'll hold our common util helper functions
const OPUtils = {};

// the file extension to expect for PEM-formatted certificates
const expected_certificate_extension = '.crt.pem';

/**
 * A helper function to take a directory and get all certificates within it
 * using the expected_certificate_extension above.
 *
 * @param {String} directory_path The path to look inside. Does not search recursively.
 * @return {Object} An object with keys `certs` and `raw`, each arrays of strings;
 *   `certs` has the base64-encoded certificates, and `raw` has the full raw file strings.
 */
OPUtils.getCertificatesInDirectory = function(directory_path) {
    let trusted_certificates = []; // the base64-encoded certs
    let trusted_certificates_raw = []; // the raw strings from the files
    let files_in_trust_directory = fs.readdirSync(directory_path);
    for (let i in files_in_trust_directory) {
        let filename = files_in_trust_directory[i];

        // only pay attention to files with the right extension
        if (filename.substr(-8) === expected_certificate_extension) {
            filename = directory_path + filename;
            let cert = ('' + fs.readFileSync(filename)).trim();
            if (cert === '') {
                continue; // ignore any empty files
            }
            trusted_certificates.push(this.parsePEMCertString(cert));
            trusted_certificates_raw.push(cert);
        }
    }

    // give back both, because some things need one format or the other
    return {
        raw: trusted_certificates_raw,
        certs: trusted_certificates,
    };
}

/**
 * A helper function that takes a Buffer or string with a PEM-formatted base64 certificate
 * and converts it to just the base64 string with no newlines.
 *
 * @param {String} input The input string or buffer, usually from a file.
 * @return {String} The input transformed into a single line of base64 text.
 */
OPUtils.parsePEMCertString = function(input) {
    input = '' + input; // make sure it's a string, not a Buffer
    let input_pieces = input.split('\n');
    let output = '';
    for (let i in input_pieces) {
        let piece = input_pieces[i].trim();
        if (
            piece === '' ||
            piece === '-----BEGIN CERTIFICATE-----' ||
            piece === '-----END CERTIFICATE-----'
        ) {
            continue;
        }
        output += piece;
    }
    return output;
}

/**
 * A helper function to make sure the given Certificate is within our list of trusted certificates.
 *
 * @param {Object} cert The certificate object we've been asked to verify.
 * @param {Array} trusted_certificates The certificates we trust, as base64-encoded strings.
 * @return {undefined} When the certificate is in the list of trusted certificates.
 * @throws {Error} When the certificate is not among the trusted certificates.
 */
OPUtils.ensureCertificateIsTrusted = function(cert, trusted_certificates) {
    // console.log('assessing trust for ONP service...');
    // console.log('ONP server name is: ' + servername);
    // console.log('ONP cert is: ', cert);
    // console.log('ONP raw cert is: ', cert.raw);
    console.log('Testing service\'s certificate (fingerprint: ' + cert.fingerprint + ')');
    var cert_base64 = cert.raw.toString('base64');

    // this is how we would save the certificate as a file locally
    var cert_file =
        '-----BEGIN CERTIFICATE-----' + '\n' +
        cert_base64 + '\n' +
        '-----END CERTIFICATE-----' + '\n';
    // console.log(cert_file);

    let found = false;
    for (let i in trusted_certificates) {
        // console.log('checking against: ', trusted_certificates[i]);
        if (trusted_certificates[i] === cert_base64) {
            found = true;
            break;
        }
    }
    if (!found) {
        throw new Error('Certificate not found in the given list of trusted certificates!');
    } else {
        console.log('Service\'s certificate has been verified.');
    }
},

// here are our utils
module.exports = OPUtils;
