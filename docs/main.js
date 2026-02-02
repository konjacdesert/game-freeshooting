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

    let repeat_kind = 0;
    let repeat_count = 0;

    let x = 0;
    let y = 0;
    let i = 0;
    let cell = 0x00;
    let adr = 0x0000;
    let bank = 0;

    let pInputs = 0;

    // ファイルマネージャー
    const fileManager = {
        /** @type {Uint8Array | null} */
        pendingData: null,

        /**
         * @param {Uint8Array} data
         */
        setData(data) {
            this.pendingData = data;
        },

        /**
         * @param {DataView} mem
         */
        applyIfReady(mem) {
            if (this.pendingData) {
                const dsc = new Uint8Array(mem.buffer, 0, this.pendingData.byteLength);
                dsc.set(this.pendingData);
                console.log("VRAM set");
                this.pendingData = null;
                return true;
            }
            return false;
        }
    };

    /**
     * @param {DataView} mem
     */
    function update(mem) {
        let redraw = false;

        // ファイルマネージャーから保留中のデータを適用
        if (fileManager.applyIfReady(mem)) {
            redraw = true;
        }

        if (!init) {
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0, 0b0_00000_00000_00000);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 1, 0b0_11111_11111_11111);

            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 0, 0x11000011);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 1, 0x10000001);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 2, 0x00000000);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 3, 0x00000000);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 5, 0x00000000);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 4, 0x00000000);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 6, 0x10000001);
            mem.setUint32(ADR_CHIP_HEAD + ADR_CHIP_SEEK * 0x3e0 + 4 * 7, 0x11000011);

            // バー表示
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 0, 0xe0);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 1, 0xe1);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 2, 0xe2);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 3, 0xf0);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 4, 0xf1);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 5, 0xf2);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 6, 0xf3);

            // for (let i = 0; i < CW; i++) {
            //     mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * i + 1, 0b0000_0001);
            // }

            // セル一覧表示
            for (let i = 0; i < 256; i++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x20) + 0, i);
                // mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x20) + 1, 0b0000_0001);
            }

            // セル編集表示
            for (let i = 0; i < 64; i++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x120) + 0, 0xf0);
                // mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x120) + 1, 0b0000_0001);
            }

            // メモリ編集
            for (let i = 0; i < 8 * 32; i++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x1C0) + 0, 0x00);
                // mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x1C0) + 1, 0b0000_0001);
            }


            // マスク
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 0, 0); // left
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 1, 0); // top
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 2, CW); // right
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 3, CH); // bottom

            // カーソル
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 0, 0b1100_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 6, 1); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 7, 1); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 8, 0); // cell offset

            // バー
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 0, 0b1100_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 4, HEIGHT - 8); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 6, CW); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 7, 1); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 8, 0); // cell offset

            // セル一覧
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 0, 0b0000_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 4, 64); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 6, 16); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 7, 16); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 8, 0x20); // cell offset

            // セル編集
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 3 + 0, 0b1100_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 3 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 3 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 3 + 6, 8); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 3 + 7, 8); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 3 + 8, 0x120); // cell offset

            // メモリ編集
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 4 + 0, 0b1100_0011); // mask_valid
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 4 + 2, WIDTH - CELL * 8); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 4 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 4 + 6, 8); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 4 + 7, 32); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 4 + 8, 0x1C0); // cell offset

            // base64ToDataView(DUMP, mem);

            init = true;
            redraw = true;
        }

        const inputs = mem.getUint8(ADR_INPUT);
        let down = inputs & (~pInputs);
        pInputs = inputs;

        if (inputs == 0) {
            repeat_kind = 0;
            repeat_count = 0;
            return;
        }

        if (repeat_count > 0) {
            repeat_count += 1;
        }

        if (down & PAD_FLAG.Left) {
            if (repeat_kind !== PAD_FLAG.Left) {
                repeat_kind = PAD_FLAG.Left;
                repeat_count = 1;
            }
        }
        if (down & PAD_FLAG.Right) {
            if (repeat_kind !== PAD_FLAG.Right) {
                repeat_kind = PAD_FLAG.Right;
                repeat_count = 1;
            }
        }
        if (down & PAD_FLAG.Up) {
            if (repeat_kind !== PAD_FLAG.Up) {
                repeat_kind = PAD_FLAG.Up;
                repeat_count = 1;
            }
        }
        if (down & PAD_FLAG.Down) {
            if (repeat_kind !== PAD_FLAG.Down) {
                repeat_kind = PAD_FLAG.Down;
                repeat_count = 1;
            }
        }
        if ((inputs & repeat_kind) == 0) {
            repeat_kind = 0;
            repeat_count = 0;
        }

        if (repeat_count >= 20 && (repeat_count % 2) == 0) {
            down |= repeat_kind;
        }

        if (inputs & PAD_FLAG.Start) {
            if (down & PAD_FLAG.Left) {
                i -= 1;
                redraw = true;
            }
            if (down & PAD_FLAG.Right) {
                i += 1;
                redraw = true;
            }
            if (down & PAD_FLAG.Up) {
                i -= 0x10;
                redraw = true;
            }
            if (down & PAD_FLAG.Down) {
                i += 0x10;
                redraw = true;
            }
            if (i < 0) i = 0;
            if (i >= 0xff) i = 0xff;
        } else {
            if (down & PAD_FLAG.Left) {
                x -= 1;
                redraw = true;
            }
            if (down & PAD_FLAG.Right) {
                x += 1;
                redraw = true;
            }
            if (down & PAD_FLAG.Up) {
                y -= 1;
                redraw = true;
            }
            if (down & PAD_FLAG.Down) {
                y += 1;
                redraw = true;
            }
            if (x < 0) x = 0;
            if (x >= CW) x = CW - 1;
            if (y < 0) y = 0;
            if (y >= CH) y = CH - 1;
        }

        if (down & PAD_FLAG.Z) {
            do {
                if (x === 2 && y === 35) {
                    // ファイル選択ダイアログを表示
                    const input /** @type {HTMLInputElement} */ = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (event) => {
                        if (!event.target) return;
                        const target = /** @type {HTMLInputElement} */ (event.target);
                        if (!target.files || target.files.length === 0) return;
                        const file = target.files[0];
                        const loadFile = new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                if (!e.target) { reject(new Error("File read error")); return; }
                                const result = e.target.result;
                                if (typeof result === 'string') {
                                    const bin = Uint8Array.fromBase64(result);
                                    resolve(bin);
                                } else {
                                    reject(new Error("Invalid file format"));
                                }
                            };
                            reader.readAsText(file);
                        });
                        loadFile.then(bin => {
                            fileManager.setData(bin);
                            console.log("VRAM loaded");
                        }).catch(error => {
                            console.error("Failed to load VRAM:", error);
                        });
                    };
                    input.click();
                    break;
                }
                if (x === 1 && y === 35) {
                    const src = new Uint8Array(mem.buffer, 0, ADR_CELL_HEAD);
                    const data = src.toBase64();
                    const blob = new Blob([data], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "vram.txt";
                    a.click();

                    URL.revokeObjectURL(url); // メモリ解放
                    break;
                }
                if (y === 0x23) {
                    if (x >= 3 && x <= 6) {
                        // バンク切り替え
                        bank = x - 3;
                        const f = (bank << 6) | 0b11;
                        mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 0, f);
                        break;
                    }
                }
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    const seek = (x >> 1) + y * 4;
                    mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * cell + seek, i);
                    redraw = true;
                    break;
                }
                if (x >= 0 && x < 16 && y >= 8 && y < 8 + 16) {
                    cell = x + (y - 8) * 16 + bank * 256;
                    redraw = true;
                    break;
                }
                if (x >= 0x14 && x < 0x16 && y >= 0 && y < 32) {
                    adr = (i << 8) | (adr & 0xff);
                    redraw = true;
                    break;
                }
                if (x >= 0x16 && x < 0x18 && y >= 0 && y < 32) {
                    adr = (adr & 0xff00) | (i & 0xff);
                    redraw = true;
                    break;
                }
                if (x >= 0x1a && x < 0x1c && y >= 0 && y < 32) {
                    const seek = adr + y;
                    mem.setUint8(seek, i);
                    redraw = true;
                    break;
                }
            } while (0);
        } else if (down & PAD_FLAG.X) {
            do {
                if (y === 0x23) {
                    if (x >= 3 && x <= 6) {
                        const from = (i >> 4) & 0b11;
                        const to = i & 0b11;
                        for (let idx = 0; idx < 256; idx++) {
                            for (let s = 0; s < 32; s++) {
                                const c = mem.getUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * (from * 256 + idx) + s);
                                mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * (to * 256 + idx) + s, c);
                            }
                        }
                        redraw = true;
                        break;
                    }
                }
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    const seek = (x >> 1) + y * 4;
                    i = mem.getUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * cell + seek);
                    redraw = true;
                    break;
                }
                if (x >= 0 && x < 16 && y >= 8 && y < 8 + 16) {
                    const from = cell;
                    const to = x + (y - 8) * 16 + bank * 256;
                    for (let s = 0; s < 32; s++) {
                        const c = mem.getUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * from + s);
                        mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * to + s, c);
                    }
                    redraw = true;
                    break;
                }
                if (x >= 0x14 && x < 0x16 && y >= 0 && y < 32) {
                    adr += 0x100;
                    redraw = true;
                    break;
                }
                if (x >= 0x16 && x < 0x18 && y >= 0 && y < 32) {
                    adr += 32;
                    redraw = true;
                    break;
                }
                if (x >= 0x1a && x < 0x1c && y >= 0 && y < 32) {
                    const seek = adr + y;
                    i = mem.getUint8(seek);
                    redraw = true;
                    break;
                }
            } while (0);
        }

        if (redraw) {
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, x * CELL);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, y * CELL);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, x * CELL);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, y * CELL);

            const drawtwo = (start, i) => {
                const hi = i >> 4;
                const low = i & 0xf;
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * start, 0xf0 + hi);
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (start + 1), 0xf0 + low);
            };
            drawtwo(22, x);
            drawtwo(24, y);
            drawtwo(26, i);

            for (let idx = 0; idx < 64; idx++) {
                drawtwo(0x120 + idx * 2, mem.getUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * cell + idx));
            }

            for (let idx = 0; idx < 32; idx++) {
                let a = adr + idx;
                if (a >= MEM_ALL_MAX) a = MEM_ALL_MAX - 1;
                drawtwo(0x1C0 + idx * 8 + 0, a >> 8);
                drawtwo(0x1C0 + idx * 8 + 2, a & 0xFF);
                drawtwo(0x1C0 + idx * 8 + 6, mem.getUint8(a));
                // drawtwo(0x1C0 + idx * 2, mem.getUint8(adr + idx));
            }
        }

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
const ADR_CHIP_NUM = 1024;

const ADR_CELL_HEAD = ADR_CHIP_HEAD + ADR_CHIP_SEEK * ADR_CHIP_NUM;
const ADR_CELL_SEEK = 2;
const ADR_CELL_NUM = 4096;

const ADR_MASK_HEAD = ADR_CELL_HEAD + ADR_CELL_SEEK * ADR_CELL_NUM;
const ADR_MASK_SEEK = 4;
const ADR_MASK_NUM = 4;

const ADR_SPRITE_HEAD = ADR_MASK_HEAD + ADR_MASK_SEEK * ADR_MASK_NUM;
const ADR_SPRITE_SEEK = 10;
const ADR_SPRITE_NUM = 128;

const ADR_WORK_HEAD = ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * ADR_SPRITE_NUM;
const ADR_INPUT = ADR_WORK_HEAD + 0x00;

const MEM_ALL_MAX = ADR_WORK_HEAD + 0x100;

const VConsole = (/** @type {HTMLCanvasElement} */ canvas) => {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const _vPad = VPad();
    const _kPad = KPad();
    console.log("ADR_PALETTE_HEAD:", ADR_PALETTE_HEAD.toString(16));
    console.log("ADR_CHIP_HEAD:", ADR_CHIP_HEAD.toString(16));
    console.log("ADR_CELL_HEAD:", ADR_CELL_HEAD.toString(16));
    console.log("ADR_MASK_HEAD:", ADR_MASK_HEAD.toString(16));
    console.log("ADR_SPRITE_HEAD:", ADR_SPRITE_HEAD.toString(16));
    console.log("ADR_WORK_HEAD:", ADR_WORK_HEAD.toString(16));
    console.log("VRAM_MAX:", MEM_ALL_MAX);
    const vram_buf = new ArrayBuffer(MEM_ALL_MAX);
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
        const c = vram.getUint16(ADR_PALETTE_HEAD + p * 2) & 0x7fff;
        setPixel(x, y, precalc_color[c]);
        return true;
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

    /**
     * @param {number} index
     */
    function getSpriteInfo(index) {
        const sprite = ADR_SPRITE_HEAD + index * ADR_SPRITE_SEEK;
        const flags = vram_u8[sprite + 0];
        const valid = (flags & 0b0001) != 0;

        if (!valid) {
            return null;
        }

        const flipX = (flags & 0b0100) != 0;
        const flipY = (flags & 0b1000) != 0;
        const maskIndex = (flags >> 4) & 0b11;
        const bank = (flags >> 6) & 0b11;
        const drawX = vram.getInt16(sprite + 2);
        const drawY = vram.getInt16(sprite + 4);
        const tw = vram_u8[sprite + 6];
        const th = vram_u8[sprite + 7];
        const offset = vram.getUint16(sprite + 8);

        const mask = getMaskBound(maskIndex);

        const left = Math.max(0, drawX, mask.left);
        const top = Math.max(0, drawY, mask.top);
        const right = Math.min(WIDTH, drawX + tw * CELL, mask.right);
        const bottom = Math.min(HEIGHT, drawY + th * CELL, mask.bottom);

        return {
            flipX: flipX,
            flipY: flipY,
            // maskIndex: maskIndex,
            bank: bank,
            drawX: drawX,
            drawY: drawY,
            tw: tw,
            th: th,
            offset: offset,
            left: left,
            top: top,
            right: right,
            bottom: bottom,
        };
    }

    function drawSprites() {
        let cnt = 0;
        const s = performance.now();

        const sprites = [];
        let top = HEIGHT;
        let bottom = 0;
        let left = WIDTH;
        let right = 0;
        for (let i = 0; i < ADR_SPRITE_NUM; i++) {
            const info = getSpriteInfo(i);
            if (info != null) {
                sprites.push({
                    index: i,
                    ...info
                });
                if (info.top < top) top = info.top;
                if (info.bottom > bottom) bottom = info.bottom;
                if (info.left < left) left = info.left;
                if (info.right > right) right = info.right;
            }
        }

        for (let y = 0; y < HEIGHT; y++) {
            if (y >= bottom || y < top) {
                for (let x = 0; x < WIDTH; x++) {
                    drawPallete(x, y, 0);
                }
                continue;
            }
            const online = [];
            const cache = [];
            for (let i = 0; i < sprites.length; i++) {
                const el = sprites[i];
                if (y < el.bottom && y >= el.top) {
                    const ly = y - el.drawY;
                    const cy = (ly >> 3);
                    const dy = ly & 0b111;
                    const ccy = el.flipY ? (el.th - 1 - cy) : cy;
                    online.push({
                        ...el,
                        dy: dy,
                        ccy: ccy
                    });
                    cache.push({
                        ci: -1,
                        cell: -1,
                        palette: -1,
                        cellFlipX: false,
                        cellFlipY: false,
                        invalid: true,
                    });
                }
            }

            for (let x = 0; x < WIDTH; x++) {
                let drawn = false;
                for (let i = 0; i < online.length; i++) {
                    const el = online[i];
                    if (x >= el.left && x < el.right) {
                        const lx = x - el.drawX;
                        const cx = (lx >> 3);
                        const dx = lx & 0b111;
                        const ccx = el.flipX ? (el.tw - 1 - cx) : cx;

                        const c = el.offset + ccx + el.ccy * el.tw;

                        if (cache[i].ci !== c) {
                            const chip = vram_u8[ADR_CELL_HEAD + c * ADR_CELL_SEEK + 0];
                            const flag = vram_u8[ADR_CELL_HEAD + c * ADR_CELL_SEEK + 1];
                            const palette = flag & 0b1111;
                            const cellFlipX = ((flag & 0b00010000) != 0) != el.flipX;
                            const cellFlipY = ((flag & 0b00100000) != 0) != el.flipY;
                            const invalid = (flag & 0b10000000) != 0;

                            cache[i].ci = c;
                            cache[i].cell = chip;
                            cache[i].palette = palette;
                            cache[i].cellFlipX = cellFlipX;
                            cache[i].cellFlipY = cellFlipY;
                            cache[i].invalid = invalid;
                        }

                        const cdata = cache[i];
                        const chip = cdata.cell;
                        const palette = cdata.palette;
                        const cellFlipX = cdata.cellFlipX;
                        const cellFlipY = cdata.cellFlipY;
                        const invalid = cdata.invalid;

                        if (!invalid) {
                            const finalDx = cellFlipX ? 7 - dx : dx;
                            const finalDy = cellFlipY ? 7 - el.dy : el.dy;

                            const d = vram_u8[ADR_CHIP_HEAD + (chip + el.bank * 256) * ADR_CHIP_SEEK + finalDy * 4 + Math.floor(finalDx / 2)];
                            const d1 = (finalDx % 2) == 0 ? (d >> 4) & 0xf : (d >> 0) & 0xf;

                            const paletteIndex = d1 + palette * ADR_PALETTE_SEPARATE;

                            if (paletteIndex % 16 != 0) {
                                const color = vram.getUint16(ADR_PALETTE_HEAD + paletteIndex * 2) & 0x7fff;
                                setPixel(x, y, precalc_color[color]);
                                drawn = true;
                            }
                        }
                        if (drawn) break;
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

    /**
     * @param {DOMHighResTimeStamp} ts
     */
    function mainloop(ts) {

        const currentTime = ts;

        let count = 0;
        while (currentTime >= _nextGameTick) {
            if (count < k_maxFrame) {
                if (_vConsole && _vConsole.update) {
                    _vConsole.update();
                }
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
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        } else {
            if (animationFrameId === null) {
                _nextGameTick = performance.now();
                animationFrameId = requestAnimationFrame(mainloop);
            }
        }
    }

    StartLoop(pause.isBlur || pause.isHidden || pause.isUser);

})();
