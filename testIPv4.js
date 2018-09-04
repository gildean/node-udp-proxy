'use strict';
// Let's create a DNS-proxy that proxies IPv4 udp-requests to googles IPv6 DNS-server
var proxy = require('./index');
var util = require('util');
var platform = require('os').platform();
var exec = require('child_process').exec;
var testTimes = 10;
var parallelism = 2;
var allTestsComplete = 0;
var expectedComplete = testTimes * parallelism;
var options = {
    address: '8.8.8.8',
    port: 53,
    ipv6: false,
    localaddress: '127.0.0.1',
    localport: 5354,
    localipv6: false,
    proxyaddress: '0.0.0.0',
    timeOutTime: 10000
};
var mitmOptions = {
    address: '127.0.0.1',
    port: 5354,
    ipv6: false,
    localaddress: '0.0.0.0',
    localport: 5355,
    localipv6: false,
    proxyaddress: '127.0.0.1',
    timeOutTime: 10000
};

// This is the function that creates the server, each connection is handled internally
var server = proxy.createServer(options);
var mitm = proxy.createServer(mitmOptions);
// Show some info when the server starts
server.on('listening', function (details) {
    util.log(' * IPv4 to IPv4  proxy * | by : | ok:2012');
    util.log('              running on | os : | ' + platform);
    util.log('   proxy-server ready on | ' + details.server.family + ' | ' + details.server.address + ':' + details.server.port);
    util.log(' traffic is forwarded to | ' + details.target.family + ' | ' + details.target.address + ':' + details.target.port);
});

mitm.on('listening', function (details) {
    util.log('           mitm ready on | ' + details.server.family + ' | ' + details.server.address + ':' + details.server.port);
});

// 'bound' means the connection to server has been made and the proxying is in action
server.on('bound', function (details) {
    util.log('       proxy is bound to | ' + details.route.family + ' | ' + details.route.address + ':' + details.route.port);
    util.log('        peer is bound to | ' + details.peer.family + ' | ' + details.peer.address + ':' + details.peer.port);
});

mitm.on('bound', function (details) {
    util.log('   mitmproxy is bound to | ' + details.route.family + ' | ' + details.route.address + ':' + details.route.port);
    util.log('    mitmpeer is bound to | ' + details.peer.family + ' | ' + details.peer.address + ':' + details.peer.port);
});

// 'message' is emitted when the server gets a message
server.on('message', function (message, sender) {
    util.log('            message from | ' + sender.family + ' | ' + sender.address + ':' + sender.port);
});

mitm.on('message', function (message, sender) {
    util.log('        mitmmessage from | ' + sender.family + ' | ' + sender.address + ':' + sender.port);
});

// 'proxyMsg' is emitted when the bound socket gets a message and it's send back to the peer the socket was bound to
server.on('proxyMsg', function (message, sender) {
    util.log('             answer from | ' + sender.family + ' | ' + sender.address + ':' + sender.port);
});

mitm.on('proxyMsg', function (message, sender) {
    util.log('     answer to mitm from | ' + sender.family + ' | ' + sender.address + ':' + sender.port);
});

server.on('proxyClose', function (peer) {
    util.log('      disconnecting from | ' + peer.family + ' | ' + peer.address + ':' + peer.port);
});

mitm.on('proxyClose', function (peer) {
    util.log(' mitm disconnecting from | ' + peer.family + ' | ' + peer.address + ':' + peer.port);
});

server.on('proxyError', function (err) {
    util.log('             ProxyError! | ' + err.message);
});

server.on('close', function () {
    util.log('    server disconnected! | ');
});

server.on('error', function (err) {
    util.log('                  Error! | ' + err.message);
});

mitm.on('proxyError', function (err) {
    util.log('         mitmProxyError! | ' + err.message);
});

mitm.on('close', function () {
    util.log('      mitm disconnected! | ');
});

mitm.on('error', function (err) {
    util.log('              mitmError! | ' + err.message);
});

function testIt(times) {
    var query;
    var printOut = function (err, stdout, stderr) {
        allTestsComplete += 1;
        if (err) {
            util.log(err);
        } else if (stdout) {
            util.log('                  output | ' + stdout);
        } else if (stderr) {
            util.log('            error output | ' + stderr);
        }
        if (times < testTimes) {
            testIt(times + 1);
        }
        if (allTestsComplete === expectedComplete) {
            mitm.close();
            server.close(function () {
                util.log('      test Complete!     | ');
            });
        }
    };
    if (platform === 'win32') {
        query = exec('nslookup -p=5355 /server 127.0.0.1 –q=aaaa google.com', printOut);
    } else {
        query = exec('dig -p 5355 +short @127.0.0.1 google.com aaaa', printOut);
    }
}
while (parallelism) {
    testIt(1);
    parallelism -= 1;
}
