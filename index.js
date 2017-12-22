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



    var filename = __dirname + '/page/test.html';

    var readStream = fs.createReadStream(filename);

    readStream.on('data', (chunk) => {
        console.log(chunk)
        sonic.write("data: " + chunk)
    });

    readStream.on('end', () => {

        let result = differ( request, response, Buffer.concat(sonic.buffer));

        console.log("end: " + result.data)

        sonic.buffer = [];
        if (result.cache) {
            //304 Not Modified, return nothing.
            return ''
        } else {

            //other Sonic status.
            return result.data
        }
    });

    readStream.on('open', function () {
        console.log("readStream open");

        readStream.pipe(response,{end : false});
    });


})

app.listen(8090, function () {
  console.log('Example app listening on port 8090!')
})
