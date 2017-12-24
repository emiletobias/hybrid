var express = require('express')
var app = express()
const differ = require('sonic_differ');
const fs = require('fs');
const https = require('https');

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



/*    var filename = __dirname + '/page/test.html';

    var readStream = fs.createReadStream(filename);

    readStream.on('data', (chunk) => {
        console.log(chunk)
        sonic.write("data: " + chunk)
    });

    response.on('end', () => {

        console.log("In end:") 

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
        readStream.pipe(response);
    });*/

    const options = {
        hostname: 'www.iqiyi.com',
        port: 443,
        path: '/kszt_phone/schseason20170224.html',
        method: 'GET',
        headers: {
            'User-Agent' : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1 IqiyiVersion/8.12.0 ImallVersion/8.12.0',
            'Connection' : 'keep-alive',
            'Pragma' : 'no-cache'

        }
    };

    var req = https.request(options, (res) => {

        res.on('data', (chunk) => {
            sonic.write(chunk)
        });

        res.on('end', () => {

            let result = differ( request, response, Buffer.concat(sonic.buffer));

            sonic.buffer = [];
            if (result.cache) {
                //304 Not Modified, return nothing.
                response.send('').end();
            } else {

                //other Sonic status.
                response.send(result.data).end();
            }


        });

    })

    req.on('error', (e) => {
        console.error(e);
    });

    req.end();

})

app.listen(8090, function () {
  console.log('Example app listening on port 8090!')
})
