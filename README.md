udp-proxy
=========
by: ok 2012

UDP-proxy for node.js

Installation
------------
`npm install udp-proxy`

Usage
------

Example:

```
var udpProxy = require('udp-proxy'),
	url = require('url'),
    target = process.argv[2] || 'udp://localhost:41235',
	local = process.argv[3] || 41237,
	options = {
		address: url.parse(target).hostname,
		port: url.parse(target).port,
		localport: local
	},
	udpProxyServer = udpProxy.createServer(options);

udpProxyServer.on('listening', function (details) {
	console.log('server ready on ' + details.server.address + ':' + details.server.port);
	console.log('forwarding to ' + details.target.address + ':' + details.target.port);
});

udpProxyServer.on('message', function (message, sender) {
	console.log('message from ' + sender.address + ':' + sender.port + '\n' + message);
});

udpProxyServer.on('error', function (err) {
	console.log('Error!' + err);
});
```
Methods
-------
_udpProxyServer = udpProxy.createServer(options);_

- `.createServer(options)` creates a new udp-proxy with the given options.

- `options` must be an object consisting of `address` *(string)* `port` *(number)* and `localport` *(number)*

Events
------
_udpProxyServer.on('`event`', function (*args*) {});_

- `listening` args: *details*
  - *details* is an object containing *target* and *server* objects (address and port)
- `message` args: *message*, *sender*
  - *message* is the actual payload
  - *sender* is an object containing details about the sender
- `error` args: *err*
  - in case of an error
