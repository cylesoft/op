# Obscure Protocol (OP)

## What...?

Obscure Protocol (OP) is an experiment in replacing HTTP and DNS with protocols that are drastically more secure by default. It (currently) has two primary features:

- **ONP**, AKA Obscure Name Protocol, a DNS-like service that expects hostnames and responds with IP addresses.
- **OTP**, AKA Obscure Transfer Protocol, an HTTP-like service that expects requests for resources and responds with the contents of those files.

Both are meant to be fully over-the-wire TLS-encrypted with strong (but decentralized) public key cryptography. For more information, and a general thoughts behind OP, check out [the INTENTION file](INTENTION.md).

## Why...?

Because why not.

## Requirements

- node.js 7.x or later (at least, that's what I built it with)

## How do I use this?

Right now it's all very, very basic. It's currently configured to work on _your own computer only_ (all localhost pretty much). And these instructions are written assuming you're on a Mac.

First of all, clone this repository somewhere on your computer.

Open three Terminal windows. Using one of them, you need to make some self-signed SSL certificates:

1. `cd` into the `op` folder you cloned.
1. Run `openssl genrsa -out op.key.pem 4096`
1. Next, run `openssl req -new -sha512 -key op.key.pem -out op.csr.pem`
1. Next, run `openssl x509 -req -in op.csr.pem -signkey op.key.pem -out op.crt.pem`

Yes, you just made a self-signed certificate. Since these certificates will always be transmitted in plain text over the wire for every ONP and OTP session, **certificates should never contain obviously personally identifiable information** in any of the certificate's metadata fields, unless you just don't care.

Create folders named `trusted` inside the `onp`, `otp`, and `browser-electron` folders. Copy your `op.crt.pem` into each of these new `trusted` folders to make sure your ONP service, OTP service, and browser trust the self-signed certificate you just made. This is needed for our tests to work, but in the wild you'd be collecting whatever certificates you trust and placing them in these folders (probably just the `browser-electron/trusted/` folder).

Now that you have your cert set up, here's what you do with the project to test this out and see it work:

1. in one Terminal window, go to the `onp` folder, and run `sudo node server.js`
1. in another Terminal window, go to the `otp` folder, and run `sudo node server.js`
1. in the final Terminal window, go to the `otp` folder, and run `node client.js "cyle.lol"`

That final step does the following...

1. uses my `onp` module to translate the desired server hostname "cyle.lol" to the IP "127.0.0.1"
1. sends the request `req cyle.lol/` to the `otp` server at that IP.
1. renders out the response, which should be a simple text file, in Markdown format, from the "otproot" folder.

## Getting Certificates

A big part of ONP/OTP are trusted certificates. The best, most secure way of getting these certificates is literally to meet the person you want to connect with and get their certificates in person, via thumbdrive or something like that.

However, this is not always easy. Packaged with ONP and OTP in this repo is also **OCP**, AKA Obscure Certificate Protocol, a simple socket server/client for fetching certificates over the wire.

The person who wants to give out their certificate uses `cert_server.js` to advertise their certificate in plain text over the wire, but specifying a specific command to use. The person who wants that certificate uses `cert_fetcher.js` to connect to the other person's server using the right command and then has the option to download the certificate locally and use it for ONP and OTP. The person on the receiving end will see the certificate's info and fingerprint, which they should verify with the owner before saving.

Certificates are saved to a `trusted` directory by default. Copy these certificates to your ONP and OTP `trusted` folders to include the certificates as valid for those services.

### Certificate Server Usage

1. Go to the `ocp` folder in this repo.
1. Run `npm install` to install dependencies.
1. Pick a port number and a one-word command, for this example I'll use port `9000` and the command `ello`
1. Run `node cert_server.js 9000 ello`

You are now running a server on the specified port. It'll wait for any clients, expecting them to use the command you specified. If a client connects and does not use the right command, it'll be disconnected immediately. If a client connects and does nothing for more than 3 seconds, it'll be disconnected.

Clients connecting to your server will be logged. You are strongly encouraged to NOT leave your certificate server running all the time; only have it running when you want to share your certificate with someone. Use CTRL+C to close your server when you are done sharing your certificate.

Be aware that all interactions with the certificate server are **unencrypted**, so expect everyone and anyone to know your command as soon as it's used by a client once.

### Certificate Fetcher Usage

1. Go to the `ocp` folder in this repo.
1. Run `npm install` to install dependencies.
1. Make sure you know the IP address, port number, and command the server expects.
1. Run `node cert_fetcher.js 127.0.0.1 9000 ello`

The script will connect to the specified IP, on the specified port, and run the specified command immediately upon opening the connection. If the command is accepted, you will automatically download the server's certificate. You will then be prompted with information about the certificate, which you should verify with the certificate owner. If the certificate is correct, you can save it locally when prompted. Otherwise, it will be discarded.

## The Browser

There's a OP GUI browser included here, but it's still in development, and it's [Electron](http://electron.atom.io/) based.

To use it, make sure you're running your `onp` and `otp` services locally. The browser mainly only works in local mode right now.

1. Go to the `browser-electron` folder in this repo.
1. Run `npm install` to install local dependencies.
1. Run `npm start` to open the browser.

It's very simple right now... there's a window to manage which `onp` servers you're using, but only the first one in the list is currently used. You can navigate anywhere you'd like using the address bar. If the response is in Markdown, it'll be rendered as markdown in the main browser window. If there's an error of some kind, it'll be shown.

## Technical crap

- `onp` runs on port 4 by default
- `otp` runs on port 6 by default
- all of this is still TCP-based... not sure how I feel about that part yet, if I want to dive deeper
- "real" TLS certificates still rely on old ideas, kind of, which I don't want, so I may accept the reality of self-signed certs
- `onp` and `otp` are standard specifications much like DNS and HTTP, and I've started documenting them in the `docs` folder.
- `otproot` is the folder the `otp` server uses as a base for requests. A "lol" file is the default "index" file equivalent.

## To-do list

- [ ] Add symmetric encryption of certificate to OCP.
- [ ] Loading/progress indicator in browser UI.
- [ ] Update browser to support multiple `onp` servers; add UI to show attempts and which one ended up working.
- [ ] Add to demo `onp` client support for following "try" responses.
- [ ] Update browser to use "try" `onp` responses.
- [ ] Add in some kind of memcache-based rate limiting to `otp` and `onp` ?
- [ ] Make the GUI browser run a `onp` and `otp` server, or make it a separate bundle.
- [ ] Add some kind of wildcard functionality to `onp` records? as in `* try 192.168.1.1` as a fallback at the end of a file?
- [ ] Add some kind of client-side caching of `onp` records? if so, add a TTL to the server and client...?
- [ ] Need to compress `otp` traffic with gzip or something.
- [ ] Add in client-side encryption certificates for mutual TLS.
