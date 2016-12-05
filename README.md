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

Yes, you just made a self-signed certificate, which isn't great for "verified" authorized encrypted traffic, but for now it'll have to do until I come with an OP HTTPS/SSL alternative.

Create folders named `trusted` inside the `onp`, `otp`, and `browser-electron` folders. Copy your `op.crt.pem` into each of these new `trusted` folders to make sure your ONP service, OTP service, and browser trust the self-signed certificate you just made. This is needed for our tests to work, but in the wild you'd be collecting whatever certificates you trust and placing them in these folders (probably just the `browser-electron/trusted/` folder).

Now that you have your cert set up, here's what you do with the project to test this out and see it work:

1. in one Terminal window, go to the `onp` folder, and run `sudo node server.js`
1. in another Terminal window, go to the `otp` folder, and run `sudo node server.js`
1. in the final Terminal window, go to the `otp` folder, and run `node client.js "cyle.lol"`

That final step does the following...

1. uses my `onp` module to translate the desired server hostname "cyle.lol" to the IP "127.0.0.1"
1. sends the request `req cyle.lol/` to the `otp` server at that IP.
1. renders out the response, which should be a simple text file, in Markdown format, from the "otproot" folder.

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
