# udp-proxy

by: ok 2012

UDP-proxy for [node.js](http://nodejs.org/)

## Installation

`npm install udp-proxy`


udp-proxy has no dependencies beyond node.js itself

## Usage


#### Example:

```javascript
var udpProxy = require('udp-proxy');
var url = require('url');
var target = process.argv[2] || 'udp://localhost:41235';
var local = process.argv[3] || 'udp://127.0.0.1:41237';
var options = {
		address: url.parse(target).hostname,
		port: url.parse(target).port,
		localaddress: url.parse(local).hostname,
		localport: url.parse(local).port
	};
var udpProxyServer = udpProxy.createServer(options);

// the listening event is fired on the tick following it's startup
udpProxyServer.on('listening', function (details) {
	console.log('server ready on ' + details.server.address + ':' + details.server.port);
	console.log('forwarding to ' + details.target.address + ':' + details.target.port);
});

// note that inspecting heavy flow of udp-packets makes you lose some in the transit
udpProxyServer.on('message', function (message, sender) {
	console.log('message from ' + sender.address + ':' + sender.port + '\n' + message);
});

udpProxyServer.on('error', function (err) {
	console.log('Error!' + err);
});
```
### Methods

__udpProxyServer = udpProxy.createServer(__*options*__);__

* __.createServer(__*options*__)__ creates an instance of udp-proxy with the given *options*
	* *options* must be an *object* consisting of:
	  * `address`: __*string*__ (the address you want to proxy to)
	    * default: __*'localhost'*__
	  * `port`: __*number*__ (the port you want to proxy to)
	    * default: __*41235*__
	  * `localaddress`: __*string*__ (the interface-addresses to use for the server)
	    * default: __*'0.0.0.0'*__
	  * `localport`: __*number*__ (the port for the server to listen on)
	    * default: __*41237*__

### Events

__udpProxyServer.on(__`'event'`__, function (__*args*__) { });__

* `'listening'`, *details*
  * *details* is an object containing *target* and *server* *objects* both with:
    * `address`: __*string*__
    * `port`: __*number*__
* `'message'`, *message*, *sender*
  * *message* is the actual payload
  * *sender* is an *object* containing
    * `address`: __*string*__
    * `port`: __*number*__
* `'error'`, *err*
  * in case of an error *err* has the error-messages
* `'close'`
  * self-explanatory
