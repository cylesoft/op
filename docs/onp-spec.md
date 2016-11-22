# ONP Specification

This is the baseline specification for ONP (Obscure Name Protocol) requests and responses.

ONP is based heavily on DNS, but made _specifically incompatible_.

## Overview

The idea of ONP is very simple: it's a service that you ask "what IP is domain.lol?" and it either gives you the IP, says it doesn't have the IP, or tells you to try looking somewhere else.

## ONP Domain Name Specification

There is only one rule for ONP domain names: they must be shorter than 512 bytes. That's 512 ASCII characters, or a bunch of emoji, or other UTF-8 multibyte characters.

## Requests

A standard ONP request is simply a domain name string, such as `domain.lol` or `somebody's website`. That's all. Nothing else.

The connection to the ONP server happens over a TLS-secured TCP request to port 21335.

## Responses

A standard ONP response is a one-liner containing at least a response status string and hopefully the information requested, if available.

### Response Status Strings

Here are the standard response code strings that you may be given from a ONP server in its response to your request:

- `here` followed by an IP address is a success response when the requested domain name is found and has an IP associated with it.
- `nope` is a failure response when the requested domain name is not found on the server you asked.
- `try` followed by an IP address means that this server does not have the answer, but this other ONP server probably does, so try there. It's up to the client to try that suggested server.

### Examples

Asking for an address and getting a successful response:

Request: `domain.lol`
Response: `here 192.168.1.20`

Asking for an address and getting a failure response:

Request: `domain.lol`
Response: `nope`

Asking for an address and being told to try somewhere else:

Request: `domain.lol`
Response: `try 192.168.1.5`

## ONP Record Format

Internally, a ONP server holds onto these address records in a plain text file in the following format.

When a domain name maps to a known IP address:

    domain.lol here 192.168.1.20

When a domain name's record is probably on another server:

    domain.lol try 192.168.1.5
