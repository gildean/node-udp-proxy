# udp-proxy

by: ok 2012

UDP-proxy for node.js

## Installation

`npm install udp-proxy`

## Usage


#### Example:

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
### Methods

__udpProxyServer = udpProxy.createServer(__*options*__);__

- .createServer(*options*) 
  - creates an instance of udp-proxy with the given *options*
    - *options* must be an *object* consisting of:
      - `address`: __*string*__
      - `port`: __*number*__
      - `localport`: __*number*__

### Events

__udpProxyServer.on(__`'event'`__, function (__*args*__) { });__

- `'listening'`, *details*
  - *details* is an object containing *target* and *server* *objects* both with:
    - `address`: __*string*__
    - `port`: __*number*__
- `'message'`, *message*, *sender*
  - *message* is the actual payload
  - *sender* is an object containing
    - `address`: __*string*__
    - `port`: __*number*__
- `'error'`, *err*
  - in case of an error *err* has the error-messages
- `'close'`
  - self-explanatory
