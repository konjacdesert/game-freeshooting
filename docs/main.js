const FPS = 60;
const WIDTH = 224;
const HEIGHT = 288;
const CELL = 8;
const CW = WIDTH / CELL;
const CH = HEIGHT / CELL;
const PAD_FLAG = {
    Left: 1 << 0,
    Right: 1 << 1,
    Up: 1 << 2,
    Down: 1 << 3,
    Z: 1 << 4,
    X: 1 << 5,
    Start: 1 << 6,
}

const DebugTextArea = (() => {
    const textarea = /** @type {HTMLPreElement} */ (document.getElementById("gd_debugtext"));

    const log = [...Array(3).fill("")];

    function update() {
        if (textarea) {
            textarea.innerText = log.join("\n");
        }
    }

    return {
        log: log,
        update: update,
    }
})();

const VCartridge = () => {
    let init = false;

    let x = 0;
    let y = 0;
    let spd = 0;

    /**
     * @param {DataView} mem
     */
    function update(mem) {
        if (!init) {
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * (ADR_PALETTE_SEPARATE + 0), 0b1_00000_00000_00000);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * (ADR_PALETTE_SEPARATE + 1), 0b0_11111_11111_11111);

            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 0, 0b00000011);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 1, 0b00001100);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 2, 0b00010000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 3, 0b00100000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 4, 0b01000000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 5, 0b01000000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 6, 0b10000000);
            mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x10 + 4 * 7, 0b10000000);

            for (let wh = 0; wh < CW * CH; wh++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * wh, 0x10);// chip index
                const x = wh % CW;
                const y = (wh / CW) | 0;
                const flag = ((x % 2) == 1 ? 0b00010000 : 0) | ((y % 2) == 1 ? 0b00100000 : 0) | 1;
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * wh + 1, flag);// palette 1
            }

            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 0, 0); // left
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 1, 0); // top
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 2, CW); // right
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 3, CH); // bottom

            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 0, 0b0000_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 6, CW); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 7, CH); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 8, 0); // cell offset

            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 0, 0b0000_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 6, CW); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 7, CH); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 8, 0); // cell offset

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
                vx -= 1;
            }
            if (inputs & PAD_FLAG.Right) {
                vx += 1;
            }
            if (inputs & PAD_FLAG.Up) {
                vy -= 1;
            }
            if (inputs & PAD_FLAG.Down) {
                vy += 1;
            }

            if (vx != 0 && vy != 0) {
                vx /= Math.SQRT2;
                vy /= Math.SQRT2;
            }

            if (vx != 0 || vy != 0) {
                spd++;
            } else {
                spd = 0;
            }

            x += vx * spd / 60;
            y += vy * spd / 60;
        }

        while (x < 0) x += WIDTH;
        while (x >= WIDTH) x -= WIDTH;

        mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, x | 0);
        mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, y | 0);

        mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 2, (x | 0) - WIDTH);
        mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 4, y | 0);

    }

    return {
        update: update,
    }
};

const VPad = () => {
    //スクロール禁止
    document.getElementById('gd_container')?.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
    document.getElementById('gd_container')?.addEventListener("scroll", function (e) { e.preventDefault(); }, { passive: false });
    //右クリックメニュー禁止
    document.getElementById('gd_main_container')?.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { passive: false });

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

const ADR_MASK_HEAD = ADR_CELL_HEAD + ADR_CELL_SEEK * ADR_CELL_NUM;
const ADR_MASK_SEEK = 4;
const ADR_MASK_NUM = 16;

const ADR_SPRITE_HEAD = ADR_MASK_HEAD + ADR_MASK_SEEK * ADR_MASK_NUM;
const ADR_SPRITE_SEEK = 10;
const ADR_SPRITE_NUM = 128;

const ADR_WORK_HEAD = ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * ADR_SPRITE_NUM;
const ADR_INPUT = ADR_WORK_HEAD + 0x00;

const MEM_MAX = ADR_WORK_HEAD + 0x100;

const VConsole = (/** @type {HTMLCanvasElement} */ canvas) => {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const _vPad = VPad();
    const _kPad = KPad();
    console.log("VRAM_MAX:", MEM_MAX);
    const vram_buf = new ArrayBuffer(MEM_MAX);
    const vram = new DataView(vram_buf);
    const vram_u8 = new Uint8Array(vram_buf);
    const cart = typeof VCartridge !== 'undefined' ? VCartridge() : null;

    const /** @type {CanvasRenderingContext2D} */ ctx = canvas.getContext("2d", { alpha: false });
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const frame_u32 = new Uint32Array(imageData.data.buffer);
    frame_u32.fill(0xff000000);

    const precalc_color = new Uint32Array(32768);
    for (let i = 0; i < precalc_color.length; i++) {
        const r = ((i >> 0xa) & 0b11111);
        const g = ((i >> 0x5) & 0b11111);
        const b = ((i >> 0x0) & 0b11111);

        /**
         * @param {number} v
         */
        function bit5to8(v) {
            return (v << 3) | (v >> 2);
        }

        precalc_color[i] = 0xff000000 | (bit5to8(r) << 0x0) | (bit5to8(g) << 0x8) | (bit5to8(b) << 0x10);
    }

    /**
     * ImageDataに書き込み
     * @param {number} x
     * @param {number} y
     * @param {number} c
     */
    function setPixel(x, y, c) {
        frame_u32[y * WIDTH + x] = c;
    }

    /**
     * パレットから色を取得してセット
     * @param {number} x
     * @param {number} y
     * @param {number} p
     */
    function drawPallete(x, y, p) {
        const c = vram.getUint16(ADR_PALETTE_HEAD + p * 2);
        setPixel(x, y, precalc_color[c]);
        return true;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} p
     */
    function drawPalleteF(x, y, p) {
        if (p % 16 == 0) {
            return false;
        }
        return drawPallete(x, y, p);
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
        const adr = ADR_CHIP_HEAD + index * ADR_CHIP_SEEK + y * 4;
        const d1 = vram_u8[adr + 0];
        const d2 = vram_u8[adr + 1];
        const d3 = vram_u8[adr + 2];
        const d4 = vram_u8[adr + 3];

        const c1 = (d1 >> (7 - x)) & 0x1;
        const c2 = (d2 >> (7 - x)) & 0x1;
        const c3 = (d3 >> (7 - x)) & 0x1;
        const c4 = (d4 >> (7 - x)) & 0x1;

        const c = (c4 << 3) | (c3 << 2) | (c2 << 1) | (c1 << 0);
        return drawPalleteF(sx, sy, c + p * ADR_PALETTE_SEPARATE);
    }

    /**
     * セルからチップ情報を取得してセット
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {any} sx
     * @param {any} sy
     * @param {boolean} fx
     * @param {boolean} fy
     */
    function drawCell(sx, sy, index, x, y, fx, fy) {
        const chip = vram_u8[ADR_CELL_HEAD + index * ADR_CELL_SEEK + 0];
        const flag = vram_u8[ADR_CELL_HEAD + index * ADR_CELL_SEEK + 1];
        const palette = flag & 0b1111;
        const flipX = ((flag & 0b00010000) != 0) != fx;
        const flipY = ((flag & 0b00100000) != 0) != fy;
        const invalid = (flag & 0b10000000) != 0;

        if (invalid) {
            return false;
        }

        const dx = flipX ? 7 - x : x;
        const dy = flipY ? 7 - y : y;

        return drawChip(sx, sy, chip, dx, dy, palette);
    }

    /**
     * @param {number} index
     */
    function getMaskBound(index) {
        const mask = ADR_MASK_HEAD + index * ADR_MASK_SEEK;
        const left = vram_u8[mask + 0] * CELL;
        const top = vram_u8[mask + 1] * CELL;
        const right = vram_u8[mask + 2] * CELL;
        const bottom = vram_u8[mask + 3] * CELL;
        return { left: left, top: top, right: right, bottom: bottom };
    }

    /**
     * スプライトからテーブル情報を取得してセット
     * @param {number} sx
     * @param {number} sy
     * @param {number} index
     */
    function drawSprite(sx, sy, index) {
        const sprite = ADR_SPRITE_HEAD + index * ADR_SPRITE_SEEK;
        const flags = vram_u8[sprite + 0];
        const valid = (flags & 0b0001) != 0;

        if (!valid) {
            return false;
        }

        const flipX = (flags & 0b0100) != 0;
        const flipY = (flags & 0b1000) != 0;

        const drawX = vram.getInt16(sprite + 2);
        const drawY = vram.getInt16(sprite + 4);
        const tw = vram_u8[sprite + 6];
        const th = vram_u8[sprite + 7];

        const offset = vram_u8[sprite + 8];

        const lx = sx - drawX;
        const ly = sy - drawY;
        const cx = (lx >> 3);
        const cy = (ly >> 3);
        const ccx = flipX ? (tw - 1 - cx) : cx;
        const ccy = flipY ? (th - 1 - cy) : cy;

        const c = offset + ccx + ccy * tw;
        const dx = lx & 0b111;
        const dy = ly & 0b111;

        return drawCell(sx, sy, c, dx, dy, flipX, flipY);
    }

    /**
     * @param {number} index
     */
    function getSpriteBound(index) {
        const sprite = ADR_SPRITE_HEAD + index * ADR_SPRITE_SEEK;
        const flags = vram_u8[sprite + 0];
        const valid = (flags & 0b0001) != 0;

        if (!valid) {
            return { left: 0, top: 0, right: 0, bottom: 0 };
        }

        // const mode = (flags & 0b0010) != 0;
        const maskIndex = (flags >> 4) & 0b1111;

        const drawX = vram.getInt16(sprite + 2);
        const drawY = vram.getInt16(sprite + 4);
        const tw = vram_u8[sprite + 6];
        const th = vram_u8[sprite + 7];

        const mask = getMaskBound(maskIndex);

        const left = Math.max(0, drawX, mask.left);
        const top = Math.max(0, drawY, mask.top);
        const right = Math.min(WIDTH, drawX + tw * CELL, mask.right);
        const bottom = Math.min(HEIGHT, drawY + th * CELL, mask.bottom);

        // console.log(tw, th);

        return { left: left, top: top, right: right, bottom: bottom };
    }

    function drawSprites() {
        let cnt = 0;
        const s = performance.now();

        const active = [];
        let top = HEIGHT;
        let bottom = 0;
        let left = WIDTH;
        let right = 0;

        for (let i = 0; i < ADR_SPRITE_NUM; i++) {
            const bound = getSpriteBound(i);
            if (bound.left >= bound.right || bound.top >= bound.bottom) {
                continue;
            }
            active.push({
                index: i,
                top: bound.top,
                bottom: bound.bottom,
                left: bound.left,
                right: bound.right,
            });
            cnt++;
            if (bound.top < top) top = bound.top;
            if (bound.bottom > bottom) bottom = bound.bottom;
            if (bound.left < left) left = bound.left;
            if (bound.right > right) right = bound.right;
        }

        for (let y = 0; y < HEIGHT; y++) {
            if (y >= bottom || y < top) {
                for (let x = 0; x < WIDTH; x++) {
                    drawPallete(x, y, 0);
                }
                continue;
            }

            const online = [];
            let lleft = WIDTH;
            let lright = 0;
            for (let i = 0; i < active.length; i++) {
                const el = active[i];
                if (y < el.bottom && y >= el.top) {
                    online.push({
                        index: el.index,
                        left: el.left,
                        right: el.right,
                        progressX: 0,
                        currentX: 0,
                    });
                    if (el.left < lleft) lleft = el.left;
                    if (el.right > lright) lright = el.right;
                }
            }

            for (let x = 0; x < WIDTH; x++) {
                if (x >= lright || x < lleft) {
                    drawPallete(x, y, 0);
                    continue;
                }

                let drawn = false;
                for (let i = 0; i < online.length; i++) {
                    const el = online[i];
                    if (x < el.left || x >= el.right) {
                        continue;
                    }
                    drawn = drawSprite(x, y, el.index);
                    if (drawn) {
                        break;
                    }
                }
                if (!drawn) {
                    drawPallete(x, y, 0);
                }
            }
        }
        DebugTextArea.log[0] = `pf:${(performance.now() - s).toFixed(5)}`;
        DebugTextArea.log[1] = `ct:${cnt}`;
        DebugTextArea.log[2] = `t:${top} b:${bottom} l:${left} r:${right}`;
    }

    function update() {
        _vPad.update();
        _kPad.update();
        const vinputs = _vPad.get();
        const kinputs = _kPad.get();
        const inputs = vinputs | kinputs;
        vram.setUint8(ADR_INPUT, inputs);

        cart?.update(vram);
    }

    function draw() {

        drawSprites();

        ctx.putImageData(imageData, 0, 0);

    }

    return {
        update: update,
        draw: draw,
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

    const k_targetInterval = 1000 / FPS;
    const k_maxFrame = 1;

    const _vConsole = typeof VConsole !== 'undefined' ? VConsole(canvas) : null;
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

        DebugTextArea.update();

        if (count > 0) {
            _vConsole?.draw();
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
