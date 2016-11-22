/**
 *
 * Obscure Protocol Browser, lol
 *
 */

// load up external deps
const electron = require('electron');
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');
const markdown = require('markdown').markdown;

// require our helper modules for using the ONP and OTP protocols
const onp = require('../onp/');
const otp = require('../otp/');

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window objects, if you don't, the windows will
// be closed automatically when the JavaScript object is garbage collected.
let onpWindow;
let mainWindow;

// the current URL we're at
global.current_url = '';

// our main app's cache of ONP servers to use
let onp_cache = [];

/**
 * Helper function which creates the app's windows and sets up the start of everything.
 */
function createWindows() {
    console.log('creating windows');

    // create the ONP config management window
    onpWindow = new BrowserWindow({
        width: 200,
        height: 400,
        x: 10,
        y: 10,
        minWidth: 200,
        minHeight: 300,
    });

    // load up the ONP config page
    onpWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'onp_config.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // when the page is done loading, fetch what's in the ONP list to start
    onpWindow.webContents.on('did-finish-load', () => {
        onpWindow.webContents.send('get-onp-list');
    });

    // create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
    });

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // on window close
    onpWindow.on('closed', function() {
        onpWindow = null;
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindows);

// quit when all windows are closed
app.on('window-all-closed', function() {
    // if we're on a mac, don't quit when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

// on app activate, as in the dock icon was clicked or something
app.on('activate', function () {
    if (mainWindow === null && onpWindow === null) {
        createWindows();
    }
})

// when we're given an updated ONP server list, update our cache
ipcMain.on('update-onp-list', (event, list) => {
    console.log('updating cached onp list with: ', list);
    onp_cache = list;
});

// when we're told to browse somewhere, try to!
ipcMain.on('browse', (event, url) => {
    console.log('NEW BROWSE EVENT');
    console.log('gonna try to fetch ' + url);

    if (mainWindow === null) {
        return;
    }

    getResource(url);
});

/**
 * Helper function to get a resource at the given URL.
 * Does the hard work of using the ONP and OTP protocols.
 * @param {String} url The url to access.
 */
function getResource(url) {
    console.log('gonna use ONP servers:');
    console.log(onp_cache);
    global.current_url = url;

    let request_path;
    let request_host;
    let request_is_ip_already = false;

    const ip_regex = /^\d+\.\d+\.\d+\.\d+$/i;

    let slash_in_request = url.indexOf('/');
    if (slash_in_request === -1) {
        // no slash in the request
        request_path = '/'; // default
        request_host = url;
    } else {
        request_path = url.substring(slash_in_request);
        request_host = url.substring(0, slash_in_request);
    }

    // check to see if we already have the IP address and don't need to do a ONP lookup
    if (ip_regex.test(request_host)) {
        request_is_ip_already = true;
    }

    console.log('request host: ' + request_host);
    console.log('request path: ' + request_path);

    if (request_is_ip_already) {
        console.log('request is an IP already, no ONP lookup necessary');

        // do the OTP request then
        otp.req(request_host, request_path, request_host, function(page) {
            // console.log(page); // got it!
            parseResponse(page);
        });
    } else {
        console.log('request requires a ONP lookup first');
        onp.getRecord(request_host, function(onp_response) {
            // do some basic cleanup of the ONP response
            onp_response = onp_response.replace(/ {2,}/g, ' ');

            // break up the response into parts
            let onp_parts = onp_response.split(' ');

            if (onp_parts.length === 0) {
                console.log('cannot look up hostname, something wrong with the ONP response: ' + onp_response);
                return;
            }

            // analyze the ONP lookup response
            if (onp_parts[0] === 'nope') {
                // ONP lookup failed
                console.log('hostname not found');
            } else if (onp_parts[0] === 'here' && onp_parts.length === 2) {
                // we got it!
                let otp_ip = onp_parts[1];
                console.log('IP for hostname ' + request_host + ' is ' + otp_ip);

                // do the OTP request now
                otp.req(otp_ip, request_path, request_host, function(page) {
                    // console.log(page); // got it!
                    parseResponse(page);
                });
            } else if (onp_parts[0] === 'try' && onp_parts.length === 2) {
                // ONP lookup points to a different ONP server
                let onp_forward_ip = onp_parts[1]; // where to look
                console.log('hostname is maybe lookup-able on ' + onp_forward_ip + ', but this client is not set up to hop there');
            } else {
                // dunno what the ONP lookup gave us
                console.log('cannot look up hostname, ONP response is weird: ' + onp_response);
            }
        }, onp_cache[0]); // need to go down the list if the first one fails
    }
}

/**
 * Given a response string raw from a OTP server, parse it and show the result.
 *
 * @param {String} response The raw full OTP response to parse.
 */
function parseResponse(response) {
    console.log('got response:');
    console.log(response);

    // figure out if there's a breakpoint between the headers and the content body
    let response_breakpoint = response.indexOf('\n\n');
    let response_headers;

    // if there is no breakpoint, then we only parse headers
    if (response_breakpoint === -1) {
        response_headers = response.trim().split('\n');
        response_breakpoint = response.length - 1;
    } else {
        // if there was a breakpoint, separate the headers from the content body
        response_headers = response.substring(0, response_breakpoint).trim().split('\n');
    }

    // pull out the OTP status line
    let response_status = response_headers[0];
    response_headers = response_headers.slice(1); // get rid of that top line
    let response_status_pieces = response_status.split(' ');

    // what values these get depends on how things go
    let page_content_raw = '';
    let page_content_final = '';

    // get the OTP server version and parse
    let server_otp_version = response_status_pieces[0].trim().toLowerCase();
    if (server_otp_version === 'otp/1.0') {
        // cool, now we expect the rest to be in a certain format
        let response_status_code = response_status_pieces[1].trim().toLowerCase();
        console.log('response status code: ' + response_status_code);

        // parse through the response headers and make a friendly object with keys and values
        let response_headers_final = {};
        for (var i in response_headers) {
            let response_header_breakpoint = response_headers[i].indexOf(' ');
            let response_header_key = response_headers[i].substring(0, response_header_breakpoint).trim().toLowerCase();
            let response_header_value = response_headers[i].substring(response_header_breakpoint).trim();
            response_headers_final[response_header_key] = response_header_value;
        }
        console.log('response headers: ', response_headers_final);

        // show different results based on the response status code given
        if (response_status_code === 'okay') {
            // cool, resource was found and we got content back
            page_content_raw = response.substring(response_breakpoint).trim();

            // change display content based on what we were given
            if (page_content_raw === '') {
                // oops... nothing here? blank file?
                page_content_final = '<p class="otp-error">The server response contained no content.</p>';
            } else if (response_headers_final['data-type'] !== undefined && response_headers_final['data-type'] === 'plaintext') {
                // plain text file
                page_content_final = '<pre>' + page_content_raw + '</pre>';
            } else {
                // default is to try parsing as markdown
                page_content_final = markdown.toHTML(page_content_raw);
            }
        } else if (response_status_code === 'nope') {
            // resource doesn't exist, or otherwise something went wrong
            page_content_final = '<p class="otp-error">Resource not found, or not available, or something went wrong.</p>';
        } else {
            // uhhhhh not sure what to do here if this happens
            page_content_final = '<p class="otp-error">The server responded with an unsupported OTP status code.</p>';
        }
    } else {
        // server either wasn't a OTP server or responded with something we don't understand
        page_content_final = '<p class="otp-error">The server did not respond with a valid OTP response.</p>';
    }

    // one last check to see if we came up with anything to display in the UI
    if (page_content_final.trim() === '') {
        page_content_final = '<p class="otp-error">The server responded with something weird.</p>';
    }

    // give the UI the contents to display to the user
    mainWindow.webContents.send('show', page_content_final);
}
