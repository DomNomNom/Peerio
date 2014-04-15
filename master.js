
var io = require('socket.io').listen(9000).set('log level', 1);

hosts = {};

io.sockets.on('connection', function (socket) {
  console.log('got a peer');

  socket.on('requestPeers', function (data) {
    console.log('giving peers');
    socket.emit('replyPeers', hosts);  // could use zmq to subscribe to the peer list
  });

  var name = null;
  socket.on('registerHost', function (data) {
    name = data.name;
    if (name in hosts) {
      console.error('Duplicate host name!');
      return;
    }

    hosts[name] = data.address;
    console.log('a new host! ' + name);
    console.log(hosts);
  });

  socket.on('disconnect', function (data) {
    delete hosts[name];
    console.log('gubai host: ' + name);
    console.log(hosts);
  });
});

console.log('running')
