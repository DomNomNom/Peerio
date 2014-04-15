var app = require('http').createServer(handler);
var io = require('socket.io').listen(app).set('log level', 1);
var fs = require('fs');

app.listen(8080);
// app.listen('0.0.0.0:8080');

var count = 0;

function handler (req, res) {
  fs.readFile(
    __dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    }
  );
}
