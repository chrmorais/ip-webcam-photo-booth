io = io.connect();

var flashLed = {
    phaseDuration: 1250,

    start: function() {
        if (flashLed._timeout) return;
        flashLed._on = true;
        flashLed._tick();
    },

    stop: function() {
        if (!flashLed._timeout) return;
        clearTimeout(flashLed._timeout);
        flashLed._timeout = null;
    },

    _tick: function() {
        io.emit('led:set', flashLed._on);
        flashLed._on = !flashLed._on;
        flashLed._timeout = setTimeout(flashLed._tick, flashLed.phaseDuration);
    }
};

flashLed.start();

io.on('button:press', function() {
    takePhoto();
});

$('body').on('keypress', function(e) {
    if (String.fromCharCode(e.keyCode) === ' ') {
        takePhoto();
    }
});

function takePhoto() {
    if (takePhoto._active) {
        return;
    }

    takePhoto._active = true;

    flashLed.stop();
    io.emit('led:set', true);

    $('.photo-bar').show();

    var remaining = 7;

    function tick() {
        remaining--;

        $('.photo-bar .remaining').removeClass('active');
        $('.photo-bar .remaining-' + remaining).addClass('active');

        if (remaining > 0) {
            setTimeout(tick, 1000);
            return;
        }

        $('.photo-bar').hide();

        $('.flash').fadeIn(150, function() {
            var $img = $('<img>');

            $img.on('load', function() {
                $('.flash').hide();
                takePhoto._active = false;
                flashLed.start();
            });

            $img.on('error', function() {
                $('.flash').hide();
                $('.error').show();
                setTimeout(function() {
                    $('.error').fadeOut(250, function() {
                        takePhoto._active = false;
                        flashLed.start();
                    });
                }, 2000);
            });

            $img.attr('src', 'photo?' + Math.random());
        });
    }

    tick();
}
