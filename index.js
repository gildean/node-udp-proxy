var dgram = require('dgram'),
    events = require('events');

UdpProxy.prototype = new events.EventEmitter;

function UdpProxy (options) {
    var proxy = this,
        _server = dgram.createSocket('udp4'),
        _client = dgram.createSocket('udp4'),
        _host = options.address || 'localhost',
        _port = options.port || 41235,
        _PORT = options.localport || 41234,
        _HOST = options.localaddress || '0.0.0.0',
        details = {
            target: {
                address: _host,
                port: _port,
            }
        };

    _server.on('message', function (msg, rinfo) {
        _client.send(msg, 0, msg.length, _port, _host, function(err, bytes) {});
        proxy.emit('message', msg, rinfo);
    });

    _server.on('listening', function () {
        details.server = _server.address();
        process.nextTick(function () {
            proxy.emit('listening', details);
        });
    });

    _server.on('close', function () {
        _client.close();
        proxy.emit('close');
    });

    _server.on('error', function (err) {
        _server.close();
        proxy.emit('error', err);
    });

    _server.bind(_PORT, _HOST);
};


exports.createServer = function (options) {
    return new UdpProxy(options);
};
