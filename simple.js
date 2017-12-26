var express = require('express')
var app = express()
const differ = require('sonic_differ');
const fs = require('fs');

var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync( __dirname + '/node_nopass.key', 'utf8');
var certificate = fs.readFileSync( __dirname + '/node.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

var PORT = 18080;
var SSLPORT = 18081;

httpServer.listen(PORT, function() {
    console.log('HTTP Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen(SSLPORT, function() {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});


let sonic = {
    buffer: [],
    write: function (chunk, encoding) {
        let buffer = chunk;
        let ecode = encoding || 'utf8';
        if (!Buffer.isBuffer(chunk)) {
            buffer = new Buffer(chunk, ecode);
        }
        sonic.buffer.push(buffer);
    }
};

app.get('/test.html', function (request, response) {


    console.log("in request")

    var filename = __dirname + '/page/test.html';

    fs.readFile(filename, 'utf8', (err, data) => {

        console.log("in readfile")

        sonic.write(data)

        console.log("after write data")

        let result = differ( request, response, Buffer.concat(sonic.buffer));

        //console.log("end: " + result.data)

        sonic.buffer = [];
        if (result.cache) {
            response.send('').end();
        } else {
            response.send(result.data).end();
        }
    });

})

app.get('/sw.js', function (request, response) {
    var filename = __dirname + '/page/sw.js';

    fs.readFile(filename, 'utf8', (err, data) => {
        response.set("content-type","text/javascript")
        response.send(data).end();
    });

});

app.listen(8090, function () {
  console.log('Example app listening on port 8090!')
})
