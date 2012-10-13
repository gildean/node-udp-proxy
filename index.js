var dgram = require('dgram'),
    events = require('events');

UdpProxy.prototype = new events.EventEmitter;

function UdpProxy (options) {

    var self = this,
        server = dgram.createSocket('udp4'),
        client = dgram.createSocket('udp4'),
        host = options.address || 'localhost',
        port = options.port || 41235,
        PORT = options.localport || 41234,
        details = {
            target: {
                address: host,
                port: port,
            }
        };

    server.on('message', function (msg, rinfo) {
        self.emit('message', msg, rinfo);
        client.send(msg, 0, msg.length, port, host, function(err, bytes) {});
    });

    server.on('listening', function () {
        details.server = server.address();
        process.nextTick(function () {
            self.emit('listening', details);
        });
    });

    server.on('close', function () {
        self.emit('close');
        client.close();
    });

    server.on('error', function (err) {
        self.emit('error', err);
        server.close();
    });

    server.bind(PORT);
};

exports.createServer = function (options) {
    return new UdpProxy(options);
};

