var dgram = require('dgram'),
    events = require('events'),
    net = require('net');

function UdpProxy(options) {

    var proxy = this,
        udp = 'udp4',
        localudp = 'udp4',
        family = 'IPv4',
        localfamily = 'IPv4',
        host = options.address || 'localhost',
        port = options.port || 41234,
        localPort = options.localport || 0,
        localHost = options.localaddress || '0.0.0.0',
        proxyHost = options.proxyaddress || '0.0.0.0';

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

    var details = {
            target: {
                address: host,
                family: family,
                port: port
            }
        },
        server = dgram.createSocket(localudp);

    server.on('listening', function () {

        details.server = server.address();
        process.nextTick(function () {
            proxy.emit('listening', details);
        });

    }).on('message', function (msg, sender) {
        
        var _client = dgram.createSocket(udp);
        
        _client.on('listening', function () {
            this.peer = sender;
            details.route = _client.address();
            details.peer = sender;
            process.nextTick(function () {
                proxy.emit('bound', details);
            });
        }).on('message', function (msg, sender) {
        
            server.send(msg, 0, msg.length, _client.peer.port, _client.peer.address, function (err, bytes) {
                if (err) {
                    proxy.emit('proxyError', err);
                }
            });
        
            proxy.emit('proxyMsg', msg, sender);
        
        }).on('error', function (err) {
            
            _client.close();
            proxy.emit('proxyError', err);

        }).bind(0, proxyHost);

        _client.send(msg, 0, msg.length, port, host, function (err, bytes) {
            if (err) {
                _client.close();
                proxy.emit('proxyError', err);
            }
        });
        proxy.emit('message', msg, sender);

    }).on('error', function (err) {
    
        server.close();
        proxy.emit('error', err);
    
    }).on('close', function () {
    
        proxy.emit('close');
    
    }).bind(localPort, localHost);
} ;

UdpProxy.prototype = new events.EventEmitter;

exports.createServer = function (options) {
    return new UdpProxy(options);
};
