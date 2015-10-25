/*
TODO:
    * Arduino button integration (socket.io)
*/

var App = Backbone.Model.extend({
    defaults: {
        // State. One of:
        //     * attract
        //     * countdown
        //     * takePhoto
        //     * photo
        //     * error
        state: undefined,

        countdownTime: undefined,
        countdownRemaining: undefined,

        photo: undefined
    },

    initialize: function() {
        this.on('change:state', this.didChangeState);
    },

    didChangeState: function(_, state) {
        switch (state) {
            case 'countdown':
                this.set('countdownRemaining', this.get('countdownTime'));
                this._scheduleCountdownTick();
                break;

            case 'takePhoto':
                this._$photo = $('<img>')
                    .on('load', this.onImgLoad.bind(this))
                    .on('error', this.onImgError.bind(this))
                    .attr('src', '/photo?' + Math.random());
                break;

            case 'photo':
                setTimeout(this.set.bind(this, 'state', 'attract'), 3000);
                break;

            case 'error':
                setTimeout(this.set.bind(this, 'state', 'attract'), 3000)
                break;
        }
    },

    onImgLoad: function() {
        this.set('$photo', this._$photo.clone());
        this._$photo.remove();
        delete this._$photo;

        this.set('state', 'photo');
    },

    onImgError: function() {
        this._$photo.remove();
        delete this._$photo;

        this.set('state', 'error');
    },

    _scheduleCountdownTick: function() {
        this._countdownTimeout = setTimeout(this._countdownTick.bind(this), 1000);
    },

    _countdownTick: function() {
        var remaining = this.get('countdownRemaining') - 1;

        console.log('Countdown: ' + remaining);

        if (remaining > 0) {
            this.set('countdownRemaining', remaining);
            this._scheduleCountdownTick();
            return;
        }

        this.set('state', 'takePhoto');
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
        if (e.keyCode === this.takePhotoKeyCode && this.model.get('state') === 'attract') {
            this.model.set('state', 'countdown');
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
        this.listenTo(this.model, 'change:state', this.render);
        this.listenTo(this.model, 'change:countdownTime', this.render);
        this.listenTo(this.model, 'change:countdownRemaining', this.render);
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

        var activeNumberIndex = this.model.get('countdownTime') - this.model.get('countdownRemaining') - 1;
        if (activeNumberIndex >= 0) {
            $numbers.find('.remaining').eq(activeNumberIndex).addClass('active');
        }

        if (this.model.get('state') === 'countdown') {
            this.$el.slideDown(200);
        } else {
            this.$el.slideUp(200);
        }
    }
});

var FlashView = Backbone.View.extend({
    el: '.flash',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.render);
    },

    render: function() {
        if (this.model.get('state') === 'takePhoto') {
            this.$el.show();
        } else {
            this.$el.fadeOut(1000);
        }
    }
});

var PhotoView = Backbone.View.extend({
    el: '.photo',

    initialize: function() {
        this.listenTo(this.model, 'change:state', this.render);
    },

    render: function() {
        if (this.model.get('state') === 'photo') {
            var $photo = this.model.get('$photo');

            this.$el.find('.image').empty().append($photo);
            this.$el.show();
        } else {
            this.$el.fadeOut(200);
        }
    }
});

//

var app = new App({ countdownTime: 6 });

new AppView({ model: app, takePhotoKeyCode: ' '.charCodeAt(0) });
new ErrorView({ model: app });
new AttractView({ model: app });
new CountdownView({ model: app });
new FlashView({ model: app });
new PhotoView({ model: app });

app.set('state', 'attract');
