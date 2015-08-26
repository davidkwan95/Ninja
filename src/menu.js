var menuLayer = cc.Layer.extend({
    init: function(){
        this._super();

        var winsize = cc.director.getWinSize();
        var centerpos = cc.p(winsize.width / 2, winsize.height / 2);

        //start button
        var startMenu= new cc.MenuItemSprite(
            new cc.Sprite(res.start_n_png), // normal state image
            new cc.Sprite(res.start_s_png), //select state image
        this.onPlay, this);
        var start = new cc.Menu(startMenu);
        this.addChild(start);

        start.setPosition(centerpos);
    },

    onPlay: function(){
        console.log("Start Clicked!");
        cc.director.runScene(new gameScene());
    }
})

var menuScene = cc.Scene.extend({
    onEnter: function(){
        this._super();

        var layer = new menuLayer();
        layer.init();
        this.addChild(layer);
    }
});