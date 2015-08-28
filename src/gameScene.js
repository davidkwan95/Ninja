var gameScene = cc.Scene.extend({
    onEnter: function(){
        this._super();
        var gameLayer = new game();
        gameLayer.init();
        this.addChild(gameLayer);
    }
});

var game = cc.Layer.extend({
    map: null,
    player: null,
    walls: null,
    hazards: null,
    isGameOver: false,

    init: function(){
        this._super();

        this.isGameOver = false;
        Shuriken.active = 0;

        //Create the map and background
        var backgroundLayer = cc.LayerColor.create(new cc.Color(100, 100, 250, 255),480,320);
        this.addChild(backgroundLayer);
        this.map = new cc.TMXTiledMap(res.level1_tmx);
        this.addChild(this.map);

        //Add the player to the map
        this.player = new Player();
        this.player.setPosition(100,100);
        this.map.addChild(this.player, 15, TagOfMap.player); //set z to 15

        this.walls = this.map.getLayer("walls");
        this.hazards = this.map.getLayer("hazards");

        //Keyboard Input
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function(keyCode,event){
                var target = event.getCurrentTarget();
                if(keyCode === cc.KEY.right || keyCode === 68){
                    target.player.forwardMarch = true;
                }
                else if(keyCode === cc.KEY.up || keyCode === 87){
                    target.player.mightAsWellJump = true;
                }
            },
            onKeyReleased: function(keyCode, event){
                var target = event.getCurrentTarget();
                if(keyCode === cc.KEY.right || keyCode === 68){
                    target.player.forwardMarch = false;
                }
                else if(keyCode === cc.KEY.up || keyCode === 87){
                    target.player.mightAsWellJump = false;
                }
            }
        }, this);

        //Mouse click input
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: function(touch,event){
                var target = event.getCurrentTarget();
                if(Shuriken.active < 5){
                    var touchLocation = target.map.convertToNodeSpace(touch.getLocation());
                    var shuriken = new Shuriken(target.player.getPosition(), touchLocation);
                    target.map.addChild(shuriken);
                }

                return true;
            }
        },this)

        //Audio
        var audioEngine = cc.audioEngine.playMusic(res.level1_music_mp3, true);

        this.scheduleUpdate();
    },

    //get tile coordinate
    tileCoordForPosition: function(position){
        var x = Math.floor(position.x / this.map.getTileSize().width);
        var levelHeightInPixels = this.map.getMapSize().height * this.map.getTileSize().height;
        var y = Math.floor((levelHeightInPixels - position.y) / this.map.getTileSize().height);
        return cc.p(x,y);
    },

    //get position from tile
    tileRectFromTileCoords: function(tileCoords){
        var levelHeightInPixels = this.map.getMapSize().height * this.map.getTileSize().height;
        var origin = cc.p(tileCoords.x * this.map.getTileSize().width, levelHeightInPixels - ((tileCoords.y+1) * this.map.getTileSize().height));
        return cc.rect(origin.x, origin.y, this.map.getTileSize().width, this.map.getTileSize().height);
    },

    getSurroundingTilesAtPosition: function(position, layer){
        var plPos = this.tileCoordForPosition(position);
        var gids = [];

        for(var i=0; i<9; i++){
            var c= i%3;
            var r = Math.floor(i/3);
            var tilePos = cc.p(plPos.x + (c-1), plPos.y + (r-1));

            if(tilePos.y > this.map.getMapSize().height -1){
                //fallen to death!
                return null;
            }
            if(tilePos.x > this.map.getMapSize().width -1){
                //win
                return null;
            }

            var tgid = layer.getTileGIDAt(tilePos);

            var tileRect = this.tileRectFromTileCoords(tilePos);

            var tileDict = {
                gid: tgid,
                x: tileRect.x,
                y: tileRect.y,
                tilePos: tilePos
            };
            gids.push(tileDict);
        }

        //sorting the gids according to priority
        gids.splice(4,1);
        gids.splice(6,0, gids[2]);
        gids.splice(2,1);
        gids[4] = gids.splice(6, 1, gids[4])[0]; //exchange element 4 with 6, slower, will refactor using array.prototype
        gids[0] = gids.splice(4, 1, gids[0])[0];

        return gids;
    },

    checkForAndResolveCollisions: function(player){
        var tiles = this.getSurroundingTilesAtPosition(this.player.getPosition(), this.walls);

        player.onGround = false;

        for(var t in tiles){
            var pRect = player.collisionBoundingBox();
            var gid = tiles[t].gid;
            if(gid){
                var tileRect = cc.rect(tiles[t].x, tiles[t].y,
                                        this.map.getTileSize().width, this.map.getTileSize().height);

                //Check for a collision with the wall
                if(cc.rectIntersectsRect(pRect, tileRect)){
                    var intersection = cc.rectIntersection(pRect, tileRect);

                    var tileIndx = t;

                    if(tileIndx == 0){
                        //tile is directly below sprite
                        player.desiredPosition = cc.p(player.desiredPosition.x, player.desiredPosition.y+intersection.height);
                        player.velocity = cc.p(player.velocity.x, 0.0);
                        player.onGround = true;
                    }
                    else if(tileIndx == 1){
                        //tile is directly above sprite
                        player.desiredPosition = cc.p(player.desiredPosition.x, player.desiredPosition.y - intersection.height);
                        player.velocity = cc.p(player.velocity.x, 0.0);
                    }
                    else if(tileIndx == 2){
                        //tile is left of sprite
                        player.desiredPosition = cc.p(player.desiredPosition.x + intersection.width, player.desiredPosition.y);
                    }
                    else if(tileIndx == 3){
                        //tile is right of sprite
                        player.desiredPosition = cc.p(player.desiredPosition.x - intersection.width, player.desiredPosition.y);
                    }
                    else{
                        if(intersection.width > intersection.height){
                            //tile is diagonal, but resolving collision vertically
                            player.velocity = cc.p(player.velocity.x, 0.0);
                            var intersectionHeight;
                            if(tileIndx > 5){
                                intersectionHeight = intersection.height;
                                player.onGround = true;
                            }
                            else{
                                intersectionHeight = -intersection.height;
                            }
                            player.desiredPosition = cc.p(player.desiredPosition.x, player.desiredPosition.y + intersectionHeight);
                        }
                        else {
                            //tile is diagonal, but resolving collision horizontally
                            var intersectionWidth;
                            if(tileIndx === 6 || tileIndx === 4){
                                intersectionWidth = intersection.width;
                            }
                            else {
                                intersectionWidth = -intersection.width;
                            }
                            player.desiredPosition = cc.p(player.desiredPosition.x + intersectionWidth, player.desiredPosition.y);
                        }
                    }
                }
            }
        }
        player.setPosition(player.desiredPosition);
    },

    handleHazardCollisions: function(player){
        var tiles = this.getSurroundingTilesAtPosition(this.player, this.hazards);
        for(var t in tiles){
             var tileRect = cc.rect(tiles[t].x, tiles[t].y,
                                     this.map.getTileSize().width, this.map.getTileSize().height-11);
             var pRect = player.collisionBoundingBox();

             if(tiles[t].gid && cc.rectIntersectsRect(pRect,tileRect)){
                this.gameOver(0);
             }
        }
    },

    setViewpointCenter: function(position){
        var winSize = cc.director.getWinSize();

        var x = Math.max(position.x, winSize.width / 2);
        var y = Math.max(position.y, winSize.height / 2);
        x = Math.min(x, (this.map.getMapSize().width * this.map.getTileSize().width) - winSize.width / 2);
        y = Math.min(y, (this.map.getMapSize().height * this.map.getTileSize().height) - winSize.height / 2);
        var actualPosition = cc.p(x,y);

        var centerOfView = cc.p(winSize.width/2, winSize.height/2);
        var viewPoint = cc.pSub(centerOfView, actualPosition);
        this.map.setPosition(viewPoint);
    },

    gameOver: function(won){
        this.isGameOver = true;
        cc.audioEngine.stopMusic();
        if(won){
            cc.director.runScene(new winScene);
        }
        else{
            cc.director.runScene(new dieScene);
        }
    },

    checkOver: function(){
        if(this.player.getPositionX() > this.map.getMapSize().width * this.map.getTileSize().width -125)
            this.gameOver(1);
        if(this.player.getPositionY() < -20)
            this.gameOver(0);
    },

    update: function(dt){
        if(this.isGameOver){
            return ;
        }

        this.player.update();
        this.checkForAndResolveCollisions(this.player);
        this.handleHazardCollisions(this.player);
        this.checkOver();

        this.setViewpointCenter(this.player.getPosition());
    }
});