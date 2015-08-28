//Our player weapon will be a shuriken,
//with gravity?

Shuriken = cc.Sprite.extend({
    velocity: null,
    timer: 0,
    maxSpeed: 8.0,

    ctor: function(position, location){
        this._super();
        Shuriken.active++;
        this.initWithFile(res.shuriken_png);
        this.setPosition(position.x, position.y);
        this.init(location);
    },

    init: function(location){
        var direction = cc.pSub(location, this.getPosition());
        var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        this.velocity = cc.p(direction.x/length * this.maxSpeed, direction.y/length * this.maxSpeed);

        this.scheduleUpdate();
    },

    checkForRemoval: function(){
        var remove = this.getPositionY() < 0;
        var player = this.getParent().getChildByTag(TagOfMap.player);

        //Hit by Shuriken after 1s, died
        if(cc.rectIntersectsRect(this.getBoundingBox(), player.collisionBoundingBox()) && this.timer>1.0)
            this.getParent().getParent().gameOver(0);

        if(remove){
            this.getParent().removeChild(this);
            Shuriken.active--;
        }
    },

    getPosition: function(){
        return cc.p(this.getPositionX(), this.getPositionY());
    },

    update: function(dt){
        this.timer+=dt;
        var gravity = cc.p(0.0, -0.15);
        this.velocity = cc.pAdd(this.velocity, gravity);

        var minVelocity = cc.p(-this.maxSpeed, -this.maxSpeed);
        var maxVelocity = cc.p(this.maxSpeed, this.maxSpeed);
        this.velocity = cc.pClamp(this.velocity, minVelocity, maxVelocity);

        this.setPosition(cc.pAdd(this.getPosition(), this.velocity));
        this.checkForRemoval();
    }
});

Shuriken.active = 0;