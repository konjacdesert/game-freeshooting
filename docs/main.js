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

const VCartridge = () => {
    let init = false;

    let x = 0;
    let y = 0;

    /**
     * @param {DataView} mem
     */
    function update(mem) {
        if (!init) {
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * (ADR_PALETTE_SEPARATE + 0), 0b1_00000_00000_00000);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * (ADR_PALETTE_SEPARATE + 1), 0b0_11111_11111_11111);

            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 0, 0b10101010);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 1, 0b00000001);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 2, 0b10000000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 3, 0b00000001);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 4, 0b10000000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 5, 0b00000001);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 6, 0b10000000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0xf + 4 * 7, 0b01010101);

            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 0, 0xf);// chip index
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 0 + 1, 0b0000_0001);// palette 1
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 1 + 1, 0b1000_0000);//
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 2 + 1, 0b1000_0000);//
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 3 + 1, 0b1000_0000);//

            mem.setUint8(ADR_TABLE_HEAD + 2, 2);
            mem.setUint8(ADR_TABLE_HEAD + 3, 2);

            mem.setInt16(ADR_SPRITE_HEAD + 0, 0);
            mem.setInt16(ADR_SPRITE_HEAD + 2, 0);
            mem.setInt16(ADR_SPRITE_HEAD + 4, 0);
            mem.setInt16(ADR_SPRITE_HEAD + 6, 0);
            mem.setUint8(ADR_SPRITE_HEAD + 8, 8);
            mem.setUint8(ADR_SPRITE_HEAD + 9, 8);
            mem.setUint8(ADR_SPRITE_HEAD + 10, 0b00000000);

            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 0, 0);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 2, 0);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 4, 0);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 6, 0);
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 8, 8);
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 9, 8);
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 10, 0b00000000);

            init = true;
        }

        const inputs = mem.getUint8(ADR_INPUT);

        if (inputs & PAD_FLAG.Start) {
            x = 0;
            y = 0;
        } else {
            let vx = 0;
            let vy = 0;
            if (inputs & PAD_FLAG.Left) {
                vx -= 2;
            }
            if (inputs & PAD_FLAG.Right) {
                vx += 2;
            }
            if (inputs & PAD_FLAG.Up) {
                vy -= 2;
            }
            if (inputs & PAD_FLAG.Down) {
                vy += 2;
            }

            if (vx != 0 && vy != 0) {
                vx /= Math.SQRT2;
                vy /= Math.SQRT2;
            }

            x += vx;
            y += vy;
        }
        mem.setInt16(ADR_SPRITE_HEAD + 4, x);
        mem.setInt16(ADR_SPRITE_HEAD + 6, y);
    }

    return {
        update: update,
    }
};

const VPad = () => {
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
};

const KPad = () => {
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
};

const ADR_PALETTE_HEAD = 0x0000;
const ADR_PALETTE_SEEK = 2;
const ADR_PALETTE_NUM = 256;
const ADR_PALETTE_SEPARATE = 16;

const ADR_CHIP_HEAD = ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * ADR_PALETTE_NUM;
const ADR_CHIP_SEEK = 32;
const ADR_CHIP_NUM = 256;

const ADR_CELL_HEAD = ADR_CHIP_HEAD + ADR_CHIP_SEEK * ADR_CHIP_NUM;
const ADR_CELL_SEEK = 2;
const ADR_CELL_NUM = 4096;

const ADR_TABLE_HEAD = ADR_CELL_HEAD + ADR_CELL_SEEK * ADR_CELL_NUM;
const ADR_TABLE_SEEK = 6;
const ADR_TABLE_NUM = 4;

const ADR_SPRITE_HEAD = ADR_TABLE_HEAD + ADR_TABLE_SEEK * ADR_TABLE_NUM;
const ADR_SPRITE_SEEK = 16;
const ADR_SPRITE_NUM = 128;

const ADR_WORK_HEAD = ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * ADR_SPRITE_NUM;
const ADR_INPUT = ADR_WORK_HEAD + 0x00;

const MEM_MAX = ADR_WORK_HEAD + 0x100;

const mod = (/** @type {number} */ a, /** @type {number} */ n) => ((a % n) + n) % n;

const VConsole = () => {
    const _vPad = VPad();
    const _kPad = KPad();
    console.log("VRAM_MAX:", MEM_MAX);
    const buffer = new ArrayBuffer(MEM_MAX);
    const mem = new DataView(buffer);
    const cart = typeof VCartridge !== 'undefined' ? VCartridge() : null;

    const imgData = new ImageData(WIDTH, HEIGHT);

    /**
     * ImageDataに書き込み
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

    /**
     * パレットから色を取得してセット
     * @param {number} x
     * @param {number} y
     * @param {number} p
     */
    function drawPallete(x, y, p) {
        const c = mem.getUint16(ADR_PALETTE_HEAD + p * 2);
        const meta = (c >> 15) & 0x1;
        if (p != 0 && meta == 1) {
            return false;
        }
        const r = ((c >> 0xa) & 0b11111);
        const g = ((c >> 0x5) & 0b11111);
        const b = ((c >> 0x0) & 0b11111);

        /**
         * @param {number} v
         */
        function bit5to8(v) {
            return (v << 3) | (v >> 2);
        }

        setPixel(x, y, bit5to8(r), bit5to8(g), bit5to8(b));
        return true;
    }



    /**
     * チップからパレットを取得してセット
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {number} p
     * @param {number} sx
     * @param {number} sy
     */
    function drawChip(sx, sy, index, x, y, p) {
        const d1 = mem.getUint8(ADR_CHIP_HEAD + index * ADR_CHIP_SEEK + y * 4 + 0);
        const d2 = mem.getUint8(ADR_CHIP_HEAD + index * ADR_CHIP_SEEK + y * 4 + 1);
        const d3 = mem.getUint8(ADR_CHIP_HEAD + index * ADR_CHIP_SEEK + y * 4 + 2);
        const d4 = mem.getUint8(ADR_CHIP_HEAD + index * ADR_CHIP_SEEK + y * 4 + 3);

        const c1 = (d1 >> (7 - x)) & 0x1;
        const c2 = (d2 >> (7 - x)) & 0x1;
        const c3 = (d3 >> (7 - x)) & 0x1;
        const c4 = (d4 >> (7 - x)) & 0x1;

        const c = (c4 << 3) | (c3 << 2) | (c2 << 1) | (c1 << 0);
        return drawPallete(sx, sy, c + p * ADR_PALETTE_SEPARATE);
    }

    /**
     * セルからチップ情報を取得してセット
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {any} sx
     * @param {any} sy
     */
    function drawCell(sx, sy, index, x, y) {
        const chip = mem.getUint8(ADR_CELL_HEAD + index * ADR_CELL_SEEK);
        const flag = mem.getUint8(ADR_CELL_HEAD + index * ADR_CELL_SEEK + 1);
        const palette = flag & 0b1111;
        const flipX = (flag & 0b00010000) != 0;
        const flipY = (flag & 0b00100000) != 0;
        const invalid = (flag & 0b10000000) != 0;

        if (invalid) {
            return false;
        }

        const dx = flipX ? 7 - x : x;
        const dy = flipY ? 7 - y : y;

        return drawChip(sx, sy, chip, dx, dy, palette);
    }

    /**
     * テーブルからセル情報を取得してセット
     * @param {number} index
     * @param {number} cx
     * @param {number} cy
     * @param {number} x
     * @param {number} y
     * @param {any} sx
     * @param {any} sy
     */
    function drawTable(sx, sy, index, cx, cy, x, y) {
        const startOffset = mem.getUint16(ADR_TABLE_HEAD + index * ADR_TABLE_SEEK);
        const width = mem.getUint8(ADR_TABLE_HEAD + index * ADR_TABLE_SEEK + 2);
        const height = mem.getUint8(ADR_TABLE_HEAD + index * ADR_TABLE_SEEK + 3);

        cx = mod(cx, width);
        cy = mod(cy, height);
        const cell = startOffset + cx + cy * width;

        return drawCell(sx, sy, cell, x, y);
    }

    /**
     * スプライトからテーブル情報を取得してセット
     * @param {number} sx
     * @param {number} sy
     * @param {number} index
     */
    function drawSprite(sx, sy, index) {
        const sprite = ADR_SPRITE_HEAD + index * ADR_SPRITE_SEEK;
        const drawX = mem.getInt16(sprite + 0);
        const drawY = mem.getInt16(sprite + 2);
        const copyX = mem.getInt16(sprite + 4);
        const copyY = mem.getInt16(sprite + 6);
        const tw = mem.getUint8(sprite + 8);
        const th = mem.getUint8(sprite + 9);
        const flag = mem.getUint8(sprite + 10);
        const tableIndex = (flag & 0b00000011);
        // const flipX = (flag & 0b00010000) != 0;
        // const flipY = (flag & 0b00100000) != 0;

        const lx = sx - drawX;
        const ly = sy - drawY;
        if (lx < 0 || ly < 0 || lx >= tw * 8 || ly >= th * 8) {
            return false;
        }

        const cx = mod(((lx + copyX) >> 3), tw);
        const cy = mod(((ly + copyY) >> 3), th);
        const dx = mod(lx + copyX, 8);
        const dy = mod(ly + copyY, 8);

        return drawTable(sx, sy, tableIndex, cx, cy, dx, dy);
    }

    function drawSprites() {
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                let drawn = false;
                for (let i = 0; i < ADR_SPRITE_NUM; i++) {
                    drawn = drawSprite(x, y, i);
                    if (drawn) {
                        break;
                    }
                }
                if (!drawn) {
                    drawPallete(x, y, 0);
                }
            }
        }
    }

    function update() {
        _vPad.update();
        _kPad.update();
        const vinputs = _vPad.get();
        const kinputs = _kPad.get();
        const inputs = vinputs | kinputs;
        mem.setUint8(ADR_INPUT, inputs);

        cart?.update(mem);
    }

    function draw() {

        drawSprites();

        // for (let y = 0; y < HEIGHT; y++) {
        //     for (let x = 0; x < WIDTH; x++) {
        //         drawPallete(x, y, 0);
        //         const xx = (x + mem.getUint16(0)) / 8 | 0;
        //         const yy = (y + mem.getUint16(4)) / 8 | 0;
        //         const c = (xx + yy) % 0x80;
        //         drawPallete(x, y, c);
        //     }
        // }
    }

    function getImageData() {
        return imgData;
    }

    return {
        update: update,
        draw: draw,
        getImageData: getImageData,
    }
};

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

    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("gd_main"));
    const ctx = canvas.getContext("2d");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const k_targetInterval = 1000 / FPS;
    const k_maxFrame = 3;

    const _vConsole = typeof VConsole !== 'undefined' ? VConsole() : null;
    let _nextGameTick = performance.now();

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
        while (currentTime >= _nextGameTick) {
            if (count < k_maxFrame) {
                _vConsole?.update();
                count++;
            }
            _nextGameTick += k_targetInterval;
        }

        if (count > 0) {
            _vConsole?.draw();
            const imgData = _vConsole?.getImageData();
            if (imgData) {
                ctx?.putImageData(imgData, 0, 0);
            }
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
                _nextGameTick = performance.now();
                animationFrameId = requestAnimationFrame(mainloop);
            }
        }
    }

    StartLoop(pause.isBlur || pause.isHidden || pause.isUser);

})();
