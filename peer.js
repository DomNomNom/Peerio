var portfinder = require('portfinder');
var ioClient = require('socket.io-client');


var io = null; // where we broadcast to peers
function broadcast(name, value) {
  if (io) {
    // broadcast to anyone interested in this
    var data = {name: name, value: value };
    // console.log('broadcasting: ');
    // console.log(data)
    io.sockets.in(name).emit('data', data);
  }
}


// ====== here we have an instrument that toggles state between 1 and 0 ======
var name = 'oscilator'; // used to identify this host

var state = 1; //              exposed
var period;    // miliseconds. exposed, settable
setPeriod(2000.0);

function setState(newState) {
  state = newState;
  broadcast('state', state);
}

var intervalID = null;
function setPeriod(newPeriod) {
  period = newPeriod;
  clearInterval(intervalID);
  intervalID = setInterval(function(){ setState(1-state); }, period); // here we oscilate
  broadcast('period', period);
}


var getters = {
  state:  function() { return state;  },
  period: function() { return period; },
}
var setters = {
  period: setPeriod,
}


// some assersions
for (setterName in setters) { // there should be a getter for all setters
  console.assert(setterName in getters);
}

// ====== end of instrument ======


// create a server on a free port
portfinder.getPort(function (err, port) {

  var master = ioClient.connect('http://localhost:9000');

  // ====== do this if your want to retrieve/set variables ======
  var peers = {};
  master.on('connect', function () {
    console.log("connected to master");
    master.emit('reqestPeers', {});
  });
  master.on('replyPeers', function (data){
    peers = data;
  });



  // ====== do this if you want to be a  host (expose variables)  ======
  master.emit('registerHost', {
    name: name,
    address: 'http://localhost:'+port
  });

  io = require('socket.io').listen(port).set('log level', 1);
  io.sockets.on('connection', function (socket) {
    console.log('got a peer connection');

    socket.on('subscribe', function (data) {
      console.log('subscribe');
      if (!(data.name in getters)) {
        console.error('bad subscription name: ' + data.name);
        return;  // we should probably send something in response
      }

      // join the room for that variable broadcast
      // https://github.com/LearnBoost/socket.io/wiki/Rooms
      socket.join(data.name);

      socket.emit('data', {'name': data.name, 'value': getters[data.name]() });
    });

    socket.on('unsubscribe', function (data) {
      socket.leave(data.name);
    });


    socket.on('get', function (data) {
      console.log('get');
      if (!(data.name in getters)) {
        console.error('bad variable name: ' + data.name);
        return; // we should probably send something in response
      }

      socket.emit('response_get', { 'name': data.name, 'value': getters[data.name]() });
    });

    socket.on('set', function (data) {  // data is a dict from variable name to value
      console.log('set');
      for (varname in data) {
        if (!(varname in getters)) {
          console.error('variable has no setter: ' + varname);
          return; // we should probably send something in response
        }

        setters[varname](data[varname]);
      }
      console.log(data);
    })

  });


  console.log('running on port ' + port)
});
