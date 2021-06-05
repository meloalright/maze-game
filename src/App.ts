import * as PIXI from './lib/pixi';

const app = new PIXI.Application();

const maze = {
    textures: {} as any,
    width: -1,
    height: -1,
    cw: -1,
    ch: -1,
    scale: 0.04,
    array2d: [] as any,
    brick2d: [] as any,
    exit: [[0, 0], [0, 1]],
    init() {
        return new Promise(res => {
            app.loader.add('brick', './brick.jpg').load((loader, resources) => {
                maze.textures.brick = resources.brick.texture;
                this.cw = resources.brick.texture.width * this.scale;
                this.ch = resources.brick.texture.height * this.scale;
                this.width = app.renderer.width / this.cw;
                this.height = app.renderer.height / this.ch;
                this.array2d = this.create2dArray();
                this.brick2d = this.createWalls();
                this.createExit();
                res(true);
            });
        })
    },
    create2dArray(): number[][] {
        const { width, height } = this;
        const array2d = [];
        for (let h = 0; h < height; h++) {
            let buffer = [];
            for (let w = 0; w < width; w++) {
                buffer.push(Math.random() > 0.6 ? 1 : 0);
            }
            array2d.push(buffer);
        }
        this.exit.forEach((exit) => {
            array2d[exit[0]][exit[1]] = 0;
        })
        console.log('[maze]: create2dArray', array2d);
        return array2d;
    },
    createWalls() {
        const brick2d = [];
        this.array2d.forEach((row1d, h) => {
            let buffer = [];
            row1d.forEach((item, w) => {
                let brick = null;
                if (item) {
                    brick = this.createBrick(w, h);
                }
                buffer.push(brick);
            })
            brick2d.push(buffer);
        })
        return brick2d;
    },
    createBrick(left, top) {
        const brick = new PIXI.Sprite(maze.textures.brick);

        brick.x = this.cw * left;
        brick.y = this.ch * top;

        brick.scale.x = this.scale;
        brick.scale.y = this.scale;

        app.stage.addChild(brick);
        return brick;
    },
    createExit() {
        const { cw, ch } = this;

        this.exit.forEach((exitItem) => {
            const exitsq = new PIXI.Graphics();
            exitsq.beginFill(0x60C3FF);
            exitsq.drawRect(exitItem[1] * ch, exitItem[0] * cw, cw, ch);
            exitsq.endFill();
            app.stage.addChild(exitsq);
        })
    },

    hitTest(h, w) {
        if (h < 0 || h >= this.height || w < 0 || w >= this.width || this.array2d[h][w]) {
            console.log('[hitTest]: hit the wall');
            return true;
        }
        return false;
    }
}

const hero = {
    texture: null,
    position: [-1, -1],
    scale: -1,
    ref: null,
    init() {
        return new Promise(res => {
            app.loader.add('bunny', './bunny.png').load((loader, resources) => {
                const texture = resources.bunny.texture;
                const hero = new PIXI.Sprite(texture);
                this.scale = 1;
                this.position[0] = Math.floor(Math.random() * maze.height);
                this.position[1] = Math.floor(Math.random() * maze.width);
                hero.scale.x = this.scale;
                hero.scale.y = this.scale;
                this.ref = hero;
                this.texture = texture;
                this.draw()
                res(true)
            })
        })
    },
    draw() {
        const hero = this.ref;
        const texture = this.texture;
        hero.x = this.position[1] * maze.cw;
        hero.y = this.position[0] * maze.ch - texture.height + maze.ch * 0.7;
        app.stage.addChild(hero);
    },
    moveLeft() {
        const nextPosition = [this.position[0], this.position[1] - 1];
        if (maze.hitTest(nextPosition[0], nextPosition[1])) {
            return;
        }
        this.position = nextPosition;
        this.draw()
    },
    moveTop() {
        const nextPosition = [this.position[0] - 1, this.position[1]];
        if (maze.hitTest(nextPosition[0], nextPosition[1])) {
            return;
        }
        this.position = nextPosition;
        this.draw()
    },
    moveRight() {
        const nextPosition = [this.position[0], this.position[1] + 1];
        if (maze.hitTest(nextPosition[0], nextPosition[1])) {
            return;
        }
        this.position = nextPosition;
        this.draw()
    },
    moveDown() {
        const nextPosition = [this.position[0] + 1, this.position[1]];
        if (maze.hitTest(nextPosition[0], nextPosition[1])) {
            return;
        }
        this.position = nextPosition;
        this.draw()
    },

    bomb() {
        controller.createBomb(this.position[0], this.position[1])
    },

    rotate() {
        const hero = this.ref;
        hero.x = app.renderer.width / 2;
        hero.y = app.renderer.height / 2;
        hero.anchor.set(0.5);

        // Listen for animate update
        app.ticker.add((delta) => {
            // rotate the container!
            // use delta to create frame-independent transform
            hero.rotation -= 0.5 * delta;
        });
    }
};

const controller = {
    isLock: false,
    listen() {
        document.addEventListener('keydown', this.handleKeyCode.bind(this));
    },

    handleKeyCode(e) {
        if (this.isLock) {
            return;
        }
        switch (e.keyCode) {
            case 37: {
                hero.moveLeft();
                break;
            }
            case 38: {
                hero.moveTop();
                break;
            }
            case 39: {
                hero.moveRight();
                break;
            }
            case 40: {
                hero.moveDown();
                break;
            }
            case 32: {
                hero.bomb();
                break;
            }
            default: {
                break;
            }
        }
        this.checkStatus();
    },

    createBomb(h, w) {
        [-1, 0, 1].forEach(offsetH => {
            [-1, 0, 1].forEach(offsetW => {
                const brick = maze.brick2d[h + offsetH]?.[w + offsetW];
                brick && app.stage.removeChild(brick)
                brick && (maze.array2d[h + offsetH][w + offsetW] = 0);
                brick && (delete maze.brick2d[h + offsetH][w + offsetW]);
            })
        })
    },

    renderBomb(h, w) {
        // TODO
    },

    checkStatus() {
        maze.exit.forEach(exit => {
            if (hero.position[0] === exit[0] && hero.position[1] === exit[1]) {
                this.win();
            }
        })
    },

    checkDesktop() {
        if (!tool.isPC()) {
            hero.rotate();
            this.lock();

            const style = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 24,
                fontStyle: 'italic',
                fontWeight: 'bold',
                fill: ['#ffffff', '#00ff99'], // gradient
                stroke: '#4a1850',
                strokeThickness: 5,
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 4,
                dropShadowAngle: Math.PI / 6,
                dropShadowDistance: 6,
                wordWrap: true,
                wordWrapWidth: 440,
                lineJoin: 'round',
            });

            const richText = new PIXI.Text('Not Working in Mobile Browser', style);
            richText.x = app.renderer.width / 2 + 10;
            richText.y = app.renderer.height / 2 + 10;
            app.stage.addChild(richText);


            const richTextZh = new PIXI.Text('仅支持在桌面端玩哦', style);
            richTextZh.x = app.renderer.width / 2 + 10;
            richTextZh.y = app.renderer.height / 2 + 40;
            app.stage.addChild(richTextZh);

            return false
        }
        return true
    },

    win() {
        hero.rotate();
        this.lock();

        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 36,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });

        const richText = new PIXI.Text('YOU WIN', style);
        richText.x = app.renderer.width / 2 + 10;
        richText.y = app.renderer.height / 2 + 10;
        app.stage.addChild(richText);

        hero.ref.interactive = true;
        hero.ref.buttonMode = true;
        hero.ref.on('click', () => {
            location.reload()
        });
    },

    lock() {
        this.isLock = true;
    }
}

const tool = {
    isPC() {
        var userAgentInfo = navigator.userAgent;
        var Agents = new Array(
            "Android",
            "iPhone",
            "SymbianOS",
            "Windows Phone",
            "iPad",
            "iPod"
        );
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    }
}

function run() {
    document.body.appendChild(app.view);
    app.view.interactive = true;

    maze.init()
        .then(() => hero.init())
        .then(() => {
            if (controller.checkDesktop()) {
                controller.listen();
                hero.bomb();
            }
        })
}

export default run