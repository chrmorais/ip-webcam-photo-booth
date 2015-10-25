var App = Backbone.Model.extend({
    defaults: {
        // State. One of:
        //     * error
        //     * attract
        //     * countdown
        //     * takePhoto
        //     * photo
        state: undefined,

        countdownTime: undefined,

        $photo: undefined
    },

    initialize: function() {
        this.on('change:state', this.didChangeState);
    },

    takePhoto: function() {
        if (this.get('state') === 'attract') {
            this.set('state', 'countdown');
        }
    },

    capturePhoto: function(img) {
        $(img).attr('src', '/photo?' + Math.random());
    },

    didChangeState: function(_, state) {
        console.log('App: state=' + state);
    }
});

var ArduinoButtonView = Backbone.View.extend({
    initialize: function(options) {
        this.blinkOnDuration = options.blinkOnDuration;
        this.blinkOffDuration = options.blinkOffDuration;

        this.listenTo(this.model, 'change:state', this.didChangeState);

        io.on('button:press', this.didPressButton.bind(this));
    },

    didChangeState: function(_, state) {
        clearTimeout(this.blinkTimeout);

        switch (state) {
            case 'attract':
                this.setLEDOn(true);
                this.scheduleBlinkTick();
                break;

            case 'takePhoto':
                this.setLEDOn(true);
                break;

            default:
                this.setLEDOn(false);
                break;
        }
    },

    didPressButton: function() {
        this.model.takePhoto();
    },

    getLEDOn: function() {
        return this._ledOn;
    },

    setLEDOn: function(value) {
        if (value !== this._ledOn) {
            this._ledOn = value;
            io.emit('led:set', value);
        }
    },

    scheduleBlinkTick: function() {
        if (this.getLEDOn()) {
            this.blinkTimeout = setTimeout(this.blinkTick.bind(this), this.blinkOnDuration);
        } else {
            this.blinkTimeout = setTimeout(this.blinkTick.bind(this), this.blinkOffDuration);
        }
    },

    blinkTick: function() {
        this.setLEDOn(!this.getLEDOn());
        this.scheduleBlinkTick();
    }
});

var AppView = Backbone.View.extend({
    el: 'body',

    events: {
        'keypress': 'onKeyPress'
    },

    initialize: function(options) {
        this.takePhotoKeyCode = options.takePhotoKeyCode;
    },

    onKeyPress: function(e) {
        if (e.keyCode === this.takePhotoKeyCode) {
            this.model.takePhoto();
        }
    }
});

var ErrorView = Backbone.View.extend({
    el: '.error',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.render);
    },

    render: function() {
        if (this.model.get('state') === 'error') {
            this.$el.slideDown(200);
            setTimeout(this.model.set.bind(this.model, 'state', 'attract'), 3000);
        } else {
            this.$el.slideUp(200);
        }
    }
});

var AttractView = Backbone.View.extend({
    el: '.attract',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.render);
    },

    render: function() {
        if (this.model.get('state') === 'attract') {
            this.$el.slideDown(200);
        } else {
            this.$el.slideUp(200);
        }
    }
});

var CountdownView = Backbone.View.extend({
    el: '.countdown',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.didChangeState);

        this.listenTo(this.model, 'change:state', this.render);
        this.listenTo(this.model, 'change:countdownTime', this.render);
    },

    render: function() {
        var $numbers = this.$el.find('.numbers');

        if (this.model.get('countdownTime') !== $numbers.find('.remaining').length) {
            $numbers.empty();

            for (var i = this.model.get('countdownTime') - 1; i > 0; i--) {
                $('<span>').addClass('remaining').text(i).appendTo($numbers);
            }
        }

        $numbers.find('.remaining').removeClass('active')

        var activeNumberIndex = this.model.get('countdownTime') - this.remaining - 1;
        if (activeNumberIndex >= 0) {
            $numbers.find('.remaining').eq(activeNumberIndex).addClass('active');
        }

        if (this.model.get('state') === 'countdown') {
            this.$el.slideDown(200);
        } else {
            this.$el.slideUp(200);
        }
    },

    didChangeState: function() {
        if (this.model.get('state') === 'countdown') {
            this.remaining = this.model.get('countdownTime');
            this.scheduleTick();
        } else {
            clearTimeout(this.timeout);
        }
    },

    scheduleTick: function() {
        this.timeout = setTimeout(this.tick.bind(this), 1000);
    },

    tick: function() {
        this.remaining--;
        this.render();

        console.log('Countdown: remaining=' + this.remaining);

        if (this.remaining > 0) {
            this.scheduleTick();
            return;
        }

        this.model.set('state', 'takePhoto');
    }
});

var TakePhotoView = Backbone.View.extend({
    el: '.take-photo',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.render);
    },

    render: function() {
        if (this.model.get('state') === 'takePhoto') {
            this.$el.show();

            this.$photo = $('<img>')
                .on('load', this.onPhotoLoad.bind(this))
                .on('error', this.onPhotoError.bind(this));

            this.model.capturePhoto(this.$photo);
        } else {
            this.$el.fadeOut(1000);
        }
    },

    onPhotoLoad: function() {
        this.model.set('$photo', this.$photo.clone());
        this.$photo.remove();
        delete this.$photo;

        this.model.set('state', 'photo');
    },

    onPhotoError: function() {
        this.$photo.remove();
        delete this.$photo;

        this.model.set('state', 'error');
    }
});

var PhotoView = Backbone.View.extend({
    el: '.photo',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.render);
    },

    render: function() {
        if (this.model.get('state') === 'photo') {
            var $image = this.$el.find('.image');
            var $photo = this.model.get('$photo');

            $image.empty().append($photo);
            $image.css({ transform: 'rotate(' + ((Math.random() * 20) - 10) + 'deg)' });

            this.$el.show();

            setTimeout(this.model.set.bind(this.model, 'state', 'attract'), 3000);
        } else {
            this.$el.fadeOut(200);
        }
    }
});

io = io.connect();

var app = new App({ countdownTime: 6 });

new AppView({ model: app, takePhotoKeyCode: ' '.charCodeAt(0) });
new ArduinoButtonView({ model: app, blinkOnDuration: 1000, blinkOffDuration: 1000 });
new ErrorView({ model: app });
new AttractView({ model: app });
new CountdownView({ model: app });
new TakePhotoView({ model: app });
new PhotoView({ model: app });

app.set('state', 'attract');
