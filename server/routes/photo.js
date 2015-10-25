var express = require('express'),
    dateformat = require('dateformat'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    request = require('request'),
    url = require('url');

var router = express.Router();

router.get('/', function(req, res, next) {
    var now = new Date;
    var photoFilename = path.join(
        req.app.get('PHOTO_PATH'),
        dateformat(now, 'yyyy-mm-dd') + 'T' + dateformat(now, 'HH.MM.ss') + '.jpg'
    );

    mkdirp(req.app.get('PHOTO_PATH'), function() {
        request.get(url.resolve(req.app.get('IP_CAMERA_URL'), 'photo.jpg'))
            .on('error', function(err) {
                res.status(500).send('Error fetching photo');
            })
            .on('end', function() {
                res.setHeader('Content-Type', 'image/jpeg');
                fs.createReadStream(photoFilename).pipe(res);
            })
            .pipe(fs.createWriteStream(photoFilename));
    });
});

module.exports = router;
