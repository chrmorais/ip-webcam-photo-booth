$(function() {
    $('body').on('keypress', function(e) {
        if (String.fromCharCode(e.keyCode) === ' ') {
            takePhoto();
        }
    });
});

function takePhoto() {
    if (takePhoto._active) {
        return;
    }

    takePhoto._active = true;

    $('.photo-bar').show();

    var remaining = 5;

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
            });

            $img.on('error', function() {
                $('.flash').hide();
                $('.error').show();
                setTimeout(function() {
                    $('.error').fadeOut(250, function() {
                        takePhoto._active = false;
                    });
                }, 2000);
            });

            $img.attr('src', 'photo?' + Math.random());
        });
    }

    tick();
}
