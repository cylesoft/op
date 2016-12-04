# The Obscure Protocol Manifesto

The internet was originally created to be a dumb packet switching network, where anyone could build a protocol on top of it, as long as it adhered to a few simple rules. More importantly, the internet was created with many layers available for permutation, not just the "top layer" where the vast majority of our usage currently exists.

However, we've chosen convenience over all other priorities. This choice is what has given us the exponential growth of what we commonly refer to as "the internet". We chose to collectively use two simple protocols, which are easy to track, easy to trace, easy to surveil: [DNS](https://en.wikipedia.org/wiki/Dns) and [HTTP](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol). We then got worried about privacy and wrapped TLS around HTTP to make [HTTPS](https://en.wikipedia.org/wiki/HTTPS), but the problem still remains because the common standards for HTTPS are low and poorly implemented (if at all) to keep convenience high. Most of your online activity is still open for exploitation at key chokepoints in these two protocols: DNS is still completely unencrypted, for example.

This is bad. We can do better. The creators of the World Wide Web have said that [we have yet to discover the full breadth of what the internet will become](http://www.nytimes.com/2016/06/08/technology/the-webs-creator-looks-to-reinvent-it.html). In an effort to broaden "the internet", we have created the Obscure Protocol.

## Security through Obscurity (and Strong Encryption)

The intention behind the Obscure Protocol (AKA OP or the opnet) is twofold:

1. Encrypt everything over the wire to prevent surveillance.
2. Explicitly trust the name services you use and the sites you visit.

The first point is easy these days, thanks to open source development of strong cryptography, but it's not the whole solution. The second point is intentionally difficult: it inherently fights against the scale that made the internet, as it exists today, impossible to fully secure.

## Obscure Name Protocol Services

The basis for the opnet is the name service, which, like DNS, operates like an address book. We need easy-to-remember names for things, like how "google.com" is easier to remember than "216.58.219.238". By its simplest definition, it's simply a translation layer from a string of characters to a series of numbers.

OP has its own name service: the **Obscure Name Protocol** (ONP).

Unlike DNS, which handles internet domain names like "google.com" in a centralized-by-standard fashion, ONP has no central authority or global top level domains like ".com" and ".net". There's nothing to buy or control with ONP; anyone is free to use almost any string of UTF-8 characters with ONP.

It is the intention of the Obscure Name Protocol to create small rings of known services that trust each other. If the circle gets too big, you increase the likelihood of having name collisions, for which there is no central authority to regulate. This is intentional.

You, as an administrator of an ONP service, define the mapping between names and IP addresses. You are free to use whatever names you want (with small technical restrictions). Clients can choose to use your ONP service as a source of addresses. In doing so, they explicitly trust your ONP service by accepting its encryption certificate. Likewise, you are expected to trust (or more often, operate yourself) any name-to-IP mappings on your ONP service. You should keep your list of name-to-IP mappings as small as possible. You are encouraged to change the mappings as often as you'd like.

You, as a client of ONP services, specify which ONP services you trust. They should be run by people you know and trust; ideally, the ONP services you trust should own or know the owner of whatever names they know. However, understand that the further you are removed from the source of information, the faster this ring of trust becomes untrustworthy. You should keep your list of trusted ONP services short, and you should review them often.

## Obscure Transfer Protocol and its Verbs

Once you've translated an ONP name like "butts.lol" or "fun farmhouse 🍆" to its actual IP address, you can access resources on that server via the **Obscure Transfer Protocol** (OTP). OTP functions very similarly to HTTP, but with some important and strictly incompatible caveats.

You, as an OTP client, must know the correct verbs (which could be anything) to access the given OTP service's resources. In doing so, there is an expectation of trust between the client (you) and the service (someone you probably know). In HTTP, fetching a given resource (such as an HTML page or an image) is done via the `GET` verb as a standard across all servers and clients. However, in OTP, you must know what verbs to use to access the resources on a given site.

You, as an administrator of an OTP service, define the mapping of how verbs interact with resources on your server, from the most basic "fetch" kind of action to a more complicated client-to-server transfer. Administrators are encouraged to make their OTP verbs as unique as possible, and share them as carefully as one would define their ONP web of trust. When in doubt: change the verbs your server uses at any time.

## Encryption Certificates

ONP and OTP both operate over secure TLS sockets using public/private key cryptography. You, as a client, must explicitly trust the encryption certificates of any services that you use. You are expected to inspect these certificates and communicate with the owner of the certificate to ensure that it's valid and trustworthy and has not been tampered with. You are encouraged to share certificates by non-networked means if you can.

There is no central authority for certificate validation. Any such central authority would be a security risk. However, if you want, you are free to sign certificates that you trust with your own certificate, and act as your own authority to others. However, similarly to the ONP ring of trust, the further you are removed are from that authority and the larger the authority becomes, the faster it becomes untrustworthy.

Likewise, if you want to lock down your ONP and OTP services even further and only allow access to people you know, you are encouraged to employ Mutual TLS connections with client-side encryption certificates. The intention of these security measures is to explicitly not be convenient. Convenience can easily make things easy to surveil.
