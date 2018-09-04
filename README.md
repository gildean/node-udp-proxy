# udp-proxy

UDP-proxy for [node.js](http://nodejs.org/) version >= 0.10.x (for eariler node versions, use version 0.2.1)


Supports both IPv6 and IPv4, and bridging in between (see example below).

## Installation

`npm install udp-proxy`


udp-proxy has no dependencies beyond node.js itself

## Usage


### Example:

```javascript
// Let's create a DNS-proxy that proxies IPv4 udp-requests to googles IPv6 DNS-server
var proxy = require('udp-proxy'),
	options = {
		address: '2001:4860:4860::8888',
		port: 53,
		ipv6: true,
		localaddress: '0.0.0.0',
		localport: 53535,
		localipv6: false,
		proxyaddress: '::0',
		timeOutTime: 10000
	};

// This is the function that creates the server, each connection is handled internally
var server = proxy.createServer(options);

// this should be obvious
server.on('listening', function (details) {
	console.log('DNS - IPv4 to IPv6 proxy }>=<{ by: ok 2012');
	console.log('udp-proxy-server ready on ' + details.server.family + '  ' + details.server.address + ':' + details.server.port);
	console.log('traffic is forwarded to ' + details.target.family + '  ' + details.target.address + ':' + details.target.port);
});

// 'bound' means the connection to server has been made and the proxying is in action
server.on('bound', function (details) {
	console.log('proxy is bound to ' + details.route.address + ':' + details.route.port);
	console.log('peer is bound to ' + details.peer.address + ':' + details.peer.port);
});

// 'message' is emitted when the server gets a message
server.on('message', function (message, sender) {
	console.log('message from ' + sender.address + ':' + sender.port);
});

// 'proxyMsg' is emitted when the bound socket gets a message and it's send back to the peer the socket was bound to
server.on('proxyMsg', function (message, sender, peer) {
	console.log('answer from ' + sender.address + ':' + sender.port);
});

// 'proxyClose' is emitted when the socket closes (from a timeout) without new messages
server.on('proxyClose', function (peer) {
	console.log('disconnecting socket from ' + peer.address);
});

server.on('proxyError', function (err) {
	console.log('ProxyError! ' + err);
});

server.on('error', function (err) {
	console.log('Error! ' + err);
});
```
## Methods
__var proxy = require('udp-proxy');__

* requires the proxy-module

__var server = proxy.createServer(__ *options* __);__

* __.createServer(__ *options* __)__ creates an instance of udp-proxy with the given *options*
	* *options* must be an *object* consisting of:
	  * `address`: __*string*__ (the address you want to proxy to)
	     - default: __*'localhost'*__
	  * `port`: __*number*__ (the port you want to proxy to)
	     - default: __*41234*__
	  * `ipv6`: __*boolean*__ (if the target uses IPv6)
	     - default: __*false*__
	  * `localaddress`: __*string*__ (the interface-addresses to use for the server)
	     - default: __*'0.0.0.0'*__ ( __*::0*__ if `localipv6` is set to true)
	  * `localport`: __*number*__ (the port for the server to listen on)
	     - default: __*0*__ (random)
	  * `localipv6`: __*boolean*__ (if you want the server to use IPv6)
	     - default: __*false*__
	  * `proxyaddress`: __*string*__ (if you want to set on which interface the proxy connects out)
	     - default: __*0.0.0.0*__ ( __*::0*__ if `ipv6` is set to true)
	  * `timeOutTime`: __*number*__ the time it takes for socket to time out (in ms)
	     - default: __*10000*__ (10s)
	  * `timeOutTime`: __*number*__ the time it takes for socket to time out (in ms)
	     - default: __*10000*__ (10s)
	  * `middleware`: __*object*__ apply a middleware to the proxy, see Middleware section below.
	     - default: __*none*__
               
*the proxy always connects outwards with a random port*

__server.close(callback)__ closes proxy server.

## Events

__server.on(__ `'event'` __, function (__ *args* __) { });__

* `'listening'`, *details*
  * *details* is an *object* with two objects:
     * *target* __address__
     * *server* __address__
* `'bound'`, *details*
  * *details* is an *object* with two objects:
     * *route* __address__
     * *peer* __address__
* `'message'`, *message*, *sender*
  * *message* is the payload from user using the proxy
  * *sender* is the user __address__
* `'proxyMsg'`, *message*, *sender*, *peer*
  * *message* is the answer to the message from the user
  * *sender* is the answerer __address__
  * *peer* is the requesting __address__
* `'error'`, *err*
  * in case of an error *err* has the error-messages
* `'proxyError'`, *err*
  * if the message could not be proxied *err* has the error-messages
* `'proxyClose'`, *peer*
  * when a socket is closed after no new messages in set timeout
  * *peer* is the __address__ of the disconnected client
* `'close'`
  * self-explanatory


__address__ *object* contains:

* `address`: __*string*__ ip-address
* `family`: __*string*__ IPv6 or IPv4
* `port`: __*number*__ udp-port

## Middleware
Add a middleware object to the proxy to intercept any incoming or outgoing message. Use this if you need to potentially change the message content before it is relayed, or prevent it from sending altogether.

The `middleware` object must contain the following functions:

__message(__ `msg`, `sender`__, function `next` (__ *msg, sender* __) { });__

* will be invoked with every message from a peer `sender`  to the server.
* proxy will only relay the message when `next`is invoked.

__proxyMsg(__ `msg`, `sender`, `peer`__, function `next` (__ *msg, sender, peer* __) { });__

* will be invoked with every message from the server `sender` to a `peer`.
* proxy will only relay the message when `next`is invoked.

### Example:
The following example will block any message going from the client to the server that has length > 120.
```javascript
// Following the first example, let's create a DNS-proxy that proxies IPv4 udp-requests to googles IPv6 DNS-server and provide a middleware.
var proxy = require('udp-proxy'),
   options = {
      address: '2001:4860:4860::8888',
      port: 53,
      ipv6: true,
      localaddress: '0.0.0.0',
      localport: 53535,
      localipv6: false,
      proxyaddress: '::0',
      timeOutTime: 10000,
      middleware: {
         message: function(msg, sender, next) {
           // messages with longer length will not be relayed, because 'next' will not be invoked.
           if (msg.length <= 120) {
              next(msg, sender);
           }
         },
         proxyMsg: function(msg, sender, peer, next) {
           next(msg, sender, peer);
         }
      }
   };

var server = proxy.createServer(options);

// ..
```

## Tests

Run `node testIPv4` or `node testIPv6` to run the tests.

## License

MIT
