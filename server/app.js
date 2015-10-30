var express = require('express.io');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var SerialPort = require('serialport').SerialPort;

var indexRoutes = require('./routes/index');
var previewRoutes = require('./routes/preview');
var photoRoutes = require('./routes/photo');

var app = express();
app.http().io();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRoutes);
app.use('/preview', previewRoutes);
app.use('/photo', photoRoutes);

app.set('IP_CAMERA_URL', 'http://192.168.1.198:8080');
app.set('PHOTO_PATH', __dirname + '/photos');

app.set('BUTTON_SERIAL_PORT', '/dev/cu.usbmodemfd121');

if (app.get('BUTTON_SERIAL_PORT')) {
    var serialPort = new SerialPort(app.get('BUTTON_SERIAL_PORT'));

    serialPort.on('data', function(data) {
        data = data.toString();
        data = data.replace(/\r?\n$/, '');

        console.log('Button: incoming serial: ' + JSON.stringify(data));

        if (data === 'b') {
            app.io.broadcast('button:press');
        }
    });

    app.io.route('led', {
        setMode: function(req) {
            var ledMode = req.data;

            console.log('Button: set LED mode: ' + ledMode);

            switch (ledMode) {
                case 'off':
                    serialPort.write('0');
                    break;

                case 'on':
                    serialPort.write('1');
                    break;

                case 'fade':
                    serialPort.write('f');
                    break;
            }
        }
    });
}

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
