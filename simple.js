var express = require('express')
var app = express()
const differ = require('sonic_differ');
const fs = require('fs');

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

app.listen(8090, function () {
  console.log('Example app listening on port 8090!')
})
