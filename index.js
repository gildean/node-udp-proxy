var dgram = require('dgram'),
    events = require('events'),
    util = require('util'),
    net = require('net');

var UdpProxy = function (options) {
    "use strict";
    var proxy = this,
        udp = 'udp4',
        localudp = 'udp4',
        family = 'IPv4',
        localfamily = 'IPv4',
        host = options.address || 'localhost',
        port = options.port || 41234,
        localPort = options.localport || 0,
        localHost = options.localaddress || '0.0.0.0',
        proxyHost = options.proxyaddress || '0.0.0.0',
        tOutTime = options.timeOutTime || 10000,
        connections = {};

    if (options.ipv6) {
        udp = 'udp6';
        family = 'IPv6';
        proxyHost = '::0';
    }

    if (options.localipv6) {
        localudp = 'udp6';
        if (net.isIPv6(options.localaddress)) {
            localHost = options.localaddress;
        } else {
            localHost = '::0';
        }
    }

    function getDetails() {
        return {
            target: {
                address: host,
                family: family,
                port: port
            }
        };
    }

    function hashD(address) {
        return (address.address + address.port).replace(/\./g, '');
    }

    var _server = dgram.createSocket(localudp);

    _server.on('listening', function () {
        
        var details = getDetails();
        details.server = _server.address();
        process.nextTick(function() {
            proxy.emit('listening', details);
        });

    }).on('message', function (msg, sender) {
        var details = getDetails(),
            senderD = hashD(sender),
            _client, _clientport;
        if (senderD in connections) {
            _client = connections[senderD];
            clearTimeout(_client.t);
        } else {
            _client = dgram.createSocket(udp);
            connections[senderD] = _client;
        }
        
        _client.on('listening', function () {
        
            var details = getDetails();
            this.peer = sender;
            details.route = _client.address();
            details.peer = sender;
        
            proxy.emit('bound', details);
            
         //client
         }).on('message', function (msg, sender) {
        
            _server.send(msg, 0, msg.length, _client.peer.port, _client.peer.address, function (err, bytes) {
                if (err) {
                    proxy.emit('proxyError', err);
                }
            });
        
            proxy.emit('proxyMsg', msg, sender);
        
        //client
        }).on('close', function () {
            proxy.emit('proxyClose', connections[senderD]);
            delete connections[senderD];
        
        //client
        }).on('error', function (err) {
            
            _client.close();
        
            proxy.emit('proxyError', err);

        //client
        }).bind(0, proxyHost);

        _client.send(msg, 0, msg.length, port, host, function (err, bytes) {
            
            if (err) {
                proxy.emit('proxyError', err);
            }
            this.t = setTimeout(function () {
                _client.close();
            }, tOutTime);
        
        });
        
        proxy.emit('message', msg, sender);

    }).on('error', function (err) {
    
        _server.close();
        proxy.emit('error', err);
    
    }).on('close', function () {
    
        proxy.emit('close');
    
    }).bind(localPort, localHost);
};

util.inherits(UdpProxy, events.EventEmitter);

exports.createServer = function (options) {
    return new UdpProxy(options);
};
