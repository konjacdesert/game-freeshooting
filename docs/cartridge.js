import { predata } from "./predata.js";
import { CELL, CH, CW, HEIGHT, PAD_FLAG, WIDTH } from "./constants.js";
import {
    ADR_CELL_HEAD,
    ADR_CELL_SEEK,
    ADR_CHIP_HEAD,
    ADR_CHIP_SEEK,
    ADR_INPUT,
    ADR_MASK_HEAD,
    ADR_MASK_SEEK,
    ADR_SPRITE_HEAD,
    ADR_SPRITE_SEEK,
    MEM_ALL_MAX,
} from "./memoryMap.js";
import { FileManager } from "./fileManager.js";

export const VCartridge = () => {
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
    const fileManager = FileManager();
    const fileName = "vram.txt";

    /**
     * @param {DataView} mem
     */
    function update(mem) {
        let redraw = false;

        // ファイルマネージャーから保留中のデータを適用
        if (fileName in fileManager.pendingData) {
            const data = fileManager.pendingData[fileName];
            if (data) {
                const dsc = new Uint8Array(mem.buffer, 0, data.byteLength);
                dsc.set(data);
                console.log("VRAM set");
                delete fileManager.pendingData[fileName];
                redraw = true;
            }
        }

        if (!init) {
            {
                const dsc = new Uint8Array(mem.buffer, 0, predata.byteLength);
                dsc.set(predata);
            }

            // バー表示
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 0, 0xe0);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 1, 0xe1);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 2, 0xe2);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 3, 0xf0);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 4, 0xf1);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 5, 0xf2);
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * 6, 0xf3);

            // セル一覧表示
            for (let i = 0; i < 256; i++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x20) + 0, i);
            }

            // セル編集表示
            for (let i = 0; i < 64; i++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x120) + 0, 0xf0);
            }

            // メモリ編集
            for (let i = 0; i < 8 * 32; i++) {
                mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * (i + 0x1C0) + 0, 0x00);
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
                if (y === 0x23) {
                    if (x === 1) {
                        const src = new Uint8Array(mem.buffer, 0, ADR_CELL_HEAD);
                        /**@ts-ignore */
                        const data = src.toBase64().replace(/(.{76})/g, '$1\n');
                        const blob = new Blob([data], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        a.click();

                        URL.revokeObjectURL(url); // メモリ解放
                        break;
                    }
                    if (x === 2) {
                        // ファイル選択ダイアログを表示
                        const input /** @type {HTMLInputElement} */ = document.createElement('input');
                        input.type = 'file';
                        input.onchange = (event) => {
                            if (!event.target) return;
                            const target = /** @type {HTMLInputElement} */ (event.target);
                            if (!target.files || target.files.length === 0) return;
                            const file = target.files[0];
                            fileManager.requestLoad(fileName, file);
                        };
                        input.click();
                        break;
                    }
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
                    const from = x + (y - 8) * 16 + bank * 256;
                    const to = cell;
                    for (let s = 0; s < 32; s++) {
                        const c = mem.getUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * from + s);
                        const t = mem.getUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * to + s);
                        const r = c ^ t;
                        mem.setUint8(ADR_CHIP_HEAD + ADR_CHIP_SEEK * to + s, r);
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

            const drawtwo = (/** @type {number} */ start, /** @type {number} */ i) => {
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
            }
        }

    }

    return {
        update: update,
    };
};
