var express = require('express'),
    url = require('url');

var router = express.Router();

router.get('/', function(req, res, next) {
    res.redirect(url.resolve(req.app.get('IP_CAMERA_URL'), 'video'));
});

module.exports = router;
