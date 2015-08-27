var dieScene = cc.Scene.extend({
    onEnter: function(){
        this._super();
        var gameOverLayer = new died();
        gameOverLayer.init();
        this.addChild(gameOverLayer);
    }
});

var died = cc.Layer.extend({
    init: function(){
        this._super();

        var winsize = cc.director.getWinSize();
        var label = new cc.LabelTTF("You DIED!", "Lobster", 40);
        label.setColor(new cc.Color(255,0,0));
        label.setPosition(winsize.width/2, winsize.height/2);

        this.addChild(label);
        setTimeout(function(){
            cc.director.runScene(new menuScene());
        }, 4000);
    }
});

var winScene = cc.Scene.extend({
    onEnter: function(){
        this._super();
        var winLayer = new win();
        winLayer.init();
        this.addChild(winLayer);
    }
});

var win = cc.Layer.extend({
    init: function(){
        this._super();

        var winsize = cc.director.getWinSize();
        var label = new cc.LabelTTF("Level CLEARED!", "Lobster", 40);
        label.setColor(new cc.Color(46,242,16));
        label.setPosition(winsize.width/2, winsize.height/2);

        this.addChild(label);
        setTimeout(function(){
            cc.director.runScene(new menuScene());
        }, 4000);
    }
});