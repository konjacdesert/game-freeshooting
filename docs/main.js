const FPS = 60;
const WIDTH = 224;
const HEIGHT = 288;
const PAD_FLAG = {
    Left: 1 << 0,
    Right: 1 << 1,
    Up: 1 << 2,
    Down: 1 << 3,
    Z: 1 << 4,
    X: 1 << 5,
    Start: 1 << 6,
}

const VPad = (() => {
    const container = document.getElementById('gd_container');
    if (container) {
        //スクロール禁止
        container.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
        //右クリックメニュー禁止
        container.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { passive: false });
    }

    /** @type {{elm:HTMLElement|null,areas:{x:number,y:number,w:number,h:number,f:number}[]}[]} */
    const touchDatabase = [
        {
            elm: document.getElementById("gd_vpad_l"),
            areas: [
                { x: 10, y: 40, w: 30, h: 20, f: PAD_FLAG.Left },
                { x: 60, y: 40, w: 30, h: 20, f: PAD_FLAG.Right },
                { x: 40, y: 10, w: 20, h: 30, f: PAD_FLAG.Up },
                { x: 40, y: 60, w: 20, h: 30, f: PAD_FLAG.Down },
                { x: 10, y: 10, w: 30, h: 30, f: PAD_FLAG.Left | PAD_FLAG.Up },
                { x: 60, y: 10, w: 30, h: 30, f: PAD_FLAG.Right | PAD_FLAG.Up },
                { x: 10, y: 60, w: 30, h: 30, f: PAD_FLAG.Left | PAD_FLAG.Down },
                { x: 60, y: 60, w: 30, h: 30, f: PAD_FLAG.Right | PAD_FLAG.Down },
            ]
        },
        {
            elm: document.getElementById("gd_vpad_r"),
            areas: [
                { x: 60, y: 60, w: 30, h: 30, f: PAD_FLAG.Z },
                { x: 10, y: 60, w: 30, h: 30, f: PAD_FLAG.X },
                { x: 40, y: 60, w: 20, h: 30, f: PAD_FLAG.Z | PAD_FLAG.X },
                { x: 20, y: 10, w: 20, h: 10, f: PAD_FLAG.Start },
            ]
        },
    ];

    let inputRaw = 0;
    let inputOut = 0;

    const isTouch = 'ontouchstart' in window;

    if (isTouch) {
        window.addEventListener("touchstart", ParseEvent, { passive: false });
        window.addEventListener("touchmove", ParseEvent, { passive: false });
        window.addEventListener("touchend", ParseEvent, { passive: false });
        window.addEventListener("touchcancel", ParseEvent, { passive: false });
    } else {
        const overlay = document.getElementById("gd_vpad");
        overlay?.classList.add("hidden");
    }

    /**
     *
     * @param {TouchEvent} e
     */
    function ParseEvent(e) {
        const parea = document.getElementById("gd_overlay");
        let prevent = false;
        inputRaw = 0;
        const num = e.touches ? e.touches.length : 0;
        for (let i = 0; i < num; i++) {
            const touch = e.touches.item(i);
            if (touch) {
                const x = touch.clientX;
                const y = touch.clientY;

                if (!prevent) {
                    prevent = IsInElementRect(x, y, parea);
                }

                for (let j = 0; j < touchDatabase.length; j++) {
                    const data = touchDatabase[j];
                    if (IsInElementRect(x, y, data.elm)) {
                        for (let k = 0; k < data.areas.length; k++) {
                            const area = data.areas[k];
                            const pos = GetPosInElementRect(x, y, data.elm);
                            if (area.x <= pos.x && pos.x < area.x + area.w &&
                                area.y <= pos.y && pos.y < area.y + area.h) {
                                inputRaw |= area.f;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
        if (prevent) {
            e.preventDefault();
        }
    }

    /**
     *
     * @param {number} ex
     * @param {number} ey
     * @param {HTMLElement|null} elm
     */
    function IsInElementRect(ex, ey, elm) {
        if (elm == null) return false;
        const offset = elm.getBoundingClientRect();
        return offset.left <= ex && ex < offset.right && offset.top <= ey && ey < offset.bottom;
    }

    /**
     *
     * @param {number} ex
     * @param {number} ey
     * @param {HTMLElement|null} elm
     */
    function GetPosInElementRect(ex, ey, elm) {
        if (elm == null) return { x: -1, y: -1 };
        const offset = elm.getBoundingClientRect();
        const PX = 100;
        const PY = 100;
        return {
            x: (ex - offset.x) * PX / offset.width,
            y: (ey - offset.y) * PY / offset.height,
        }
    }

    function update() {
        inputOut = inputRaw;
    }

    function get() {
        return inputOut;
    }

    return {
        update: update,
        get: get,
    }
})();

const KPad = (() => {
    /** @type {{[key:string]:number}} */
    const keyDatabase = {
        ArrowLeft: PAD_FLAG.Left,
        ArrowRight: PAD_FLAG.Right,
        ArrowUp: PAD_FLAG.Up,
        ArrowDown: PAD_FLAG.Down,
        KeyZ: PAD_FLAG.Z,
        KeyX: PAD_FLAG.X,
        Space: PAD_FLAG.Start,
    };

    /** @type {{ [key: string]: boolean }} */
    let keyState = {};

    let inputOut = 0;

    window.addEventListener("keydown", function (e) {
        if (!keyDatabase.hasOwnProperty(e.code)) return;
        e.preventDefault();
        keyState[e.code] = true;
    });

    window.addEventListener("keyup", function (e) {
        if (!keyDatabase.hasOwnProperty(e.code)) return;
        e.preventDefault();
        keyState[e.code] = false;
    });

    window.addEventListener("blur", function (e) {
        keyState = {};
    });

    function update() {
        inputOut = 0;
        for (const code in keyDatabase) {
            if (keyState[code]) {
                inputOut |= keyDatabase[code];
            }
        }
    }

    function get() {
        return inputOut;
    }

    return {
        update: update,
        get: get,
    }
})();

const Game = (() => {
    const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('gd_main'));
    if (canvas == null) return;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');
    if (ctx == null) return;

    const imgData = ctx.createImageData(WIDTH, HEIGHT);

    let tx = 0, ty = 0;

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     */
    function setPixel(x, y, r, g, b) {
        const index = (y * WIDTH + x) * 4;
        imgData.data[index + 0] = r;
        imgData.data[index + 1] = g;
        imgData.data[index + 2] = b;
        imgData.data[index + 3] = 0xff;
    }

    const paletteTable = [...Array(64)].map((_, i) => (i % 4) << 4 | (((i / 4) % 4) << 2) | ((i / 16) % 4));

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} p
     */
    function setPixelAsPalette(x, y, p) {
        const c = paletteTable[p];
        const r = ((c >> 4) & 0x3) * 0x55;
        const g = ((c >> 2) & 0x3) * 0x55;
        const b = (c & 0x3) * 0x55;
        setPixel(x, y, r, g, b);
    }

    const update = () => {
        VPad.update();
        KPad.update();
        const vinputs = VPad.get();
        const kinputs = KPad.get();
        const inputs = vinputs | kinputs;
        if ((inputs & PAD_FLAG.Left) != 0) {
            tx -= 1;
        }
        if (inputs & PAD_FLAG.Right) {
            tx += 1;
        }
        if (inputs & PAD_FLAG.Up) {
            mem.setUint32(4 * 3, mem.getUint32(4 * 3) + 0xFFFC_0000);
        }
        if (inputs & PAD_FLAG.Down) {
            ty += 1;
        }
        if (inputs & PAD_FLAG.Z) {
            tx = 0;
        }
        if (inputs & PAD_FLAG.X) {
            ty = 0;
        }
    }

    // 毎フレーム描画ループ
    const draw = () => {
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const c = ((x + tx) >> 4 & 0x07) + (((y + ty) >> 4 & 0x07) << 3);
                setPixelAsPalette(x, y, c);
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    return {
        update: update,
        draw: draw,
    };
})();


(() => {
    const pause = {
        isBlur: !document.hasFocus(),
        isHidden: document.hidden,
        isUser: false,
    }

    /**
     * @param {string} type
     * @param {boolean} state
     */
    function SetPauseState(type, state) {
        switch (type) {
            case 'blur':
                pause.isBlur = state;
                break;
            case 'hidden':
                pause.isHidden = state;
                break;
            case 'user':
                pause.isUser = state;
                break;
        }
        const isPause = pause.isBlur || pause.isHidden || pause.isUser;
        StartLoop(isPause);
    }

    window.addEventListener("focus", (e) => { SetPauseState('blur', false); });
    window.addEventListener("blur", (e) => { SetPauseState('blur', true); });
    document.addEventListener("visibilitychange", (e) => { SetPauseState('hidden', document.hidden); });
    document.getElementById("gd_pause")?.addEventListener("change", (e) => {
        const checkbox = /** @type {HTMLInputElement} */ (e.target);
        SetPauseState('user', checkbox.checked);
    });

    const targetInterval = 1000 / FPS;
    const maxFrame = 3;
    let nextGameTick = performance.now();
    /**
     * @type {number | null}
     */
    let animationFrameId = null;

    /**
     * @param {DOMHighResTimeStamp} ts
     */
    function mainloop(ts) {
        const currentTime = ts;

        let count = 0;
        while (currentTime >= nextGameTick) {
            if (count < maxFrame) {
                Game?.update();
                count++;
            }
            nextGameTick += targetInterval;
        }

        if (count > 0) {
            Game?.draw();
        }

        animationFrameId = requestAnimationFrame(mainloop);
    }

    /**
     * @param {boolean} pause
     */
    function StartLoop(pause) {
        if (pause) {
            if (animationFrameId != null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        } else {
            if (animationFrameId == null) {
                nextGameTick = performance.now();
                animationFrameId = requestAnimationFrame(mainloop);
            }
        }
    }

    StartLoop(pause.isBlur || pause.isHidden || pause.isUser);

})();
