function Button(io) {
    this.io = io;
}
heir.inherit(Button, EventEmitter);

Button.prototype.setLED = function(state) {
    this.io.emit('led:set', state);
};

/**/

function ButtonBlink(button) {
    this.button = button;
    this.phaseDuration = 1250;
}

ButtonBlink.prototype.start = function() {
    if (this._timeout) return;
    this._on = true;
    this._tick();
};

ButtonBlink.prototype.stop = function() {
    if (!this._timeout) return;
    clearTimeout(this._timeout);
    this._timeout = null;
};

ButtonBlink.prototype._tick = function() {
    this.button.setLED(this._on);
    this._on = !this._on;
    this._timeout = setTimeout(this._tick.bind(this), this.phaseDuration);
}

/**/

io = io.connect();

var button = new Button(io);
var buttonBlink = new ButtonBlink(button);

buttonBlink.start();

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

    buttonBlink.stop();
    io.emit('led:set', true);

    $('.attract').slideUp(200);
    $('.photo-bar').slideDown(200);

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
                $('.attract').show();
                buttonBlink.start();
            });

            $img.on('error', function() {
                $('.flash').hide();
                $('.error').show();
                setTimeout(function() {
                    $('.error').fadeOut(250, function() {
                        takePhoto._active = false;
                        $('.attract').show();
                        buttonBlink.start();
                    });
                }, 2000);
            });

            $img.attr('src', 'photo?' + Math.random());
        });
    }

    tick();
}
