import { CELL, CH, CW, HEIGHT, PAD_FLAG, WIDTH } from "./constants.js";
import {
    ADR_INPUT,
    ADR_MASK_HEAD,
    ADR_MASK_SEEK,
    ADR_SPRITE_HEAD,
    ADR_SPRITE_SEEK,
    ADR_PALETTE_HEAD,
    ADR_PALETTE_SEEK,
} from "./memoryMap.js";
import { Loader } from "./loader.js";

export const VCartridge = () => {
    let init = false;

    let pInputs = 0;

    let rep_dir = 0;
    let rep_count = 0;

    let x = 0;
    let y = 0;

    let i = 0;

    const loader = Loader(["./bin/hex.bin", "./bin/debug.bin"]);

    const ADR_CELL_PAGE0 = 0x0000;// 1ページは32*256バイト
    const ADR_CELL_PAGE1 = 0x2000;
    const ADR_CELL_PAGE2 = 0x4000;
    const ADR_CELL_PAGE3 = 0x6000;
    const ADR_TABLE_BG0 = 0x8000;// 1ページは28*36*2が収まるサイズ
    const ADR_TABLE_BG1 = 0x8800;

    /**
     * @param {DataView} mem
     */
    function update(mem) {
        if (!init) {
            if (loader.getState(0) == "idle") loader.requestLoad(0);
            if (loader.getState(1) == "idle") loader.requestLoad(1);
            const loadded = [0, 1].map(i => loader.getState(i)).filter(s => s == "ready").length;
            if (loadded < 2) { console.log("loading"); return; }
        }

        let redraw = false;

        if (!init) {
            // カラー
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x0, 0x0000);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x1, 0x0c63);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x2, 0x1084);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x3, 0x1ce7);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x4, 0x2108);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x5, 0x2d6b);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x6, 0x318c);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x7, 0x3def);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x8, 0x4210);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0x9, 0x4e73);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0xa, 0x5294);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0xb, 0x5ef7);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0xc, 0x6318);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0xd, 0x6f7b);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0xe, 0x739c);
            mem.setUint16(ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * 0xf, 0x7fff);

            // セル
            {
                const dsc = new Uint8Array(mem.buffer, ADR_CELL_PAGE3, 0x2000);
                const d = loader.getData(0);
                if (d) dsc.set(d);
                loader.requestRelease(0);
            }
            // デバッグ用セル
            {
                const dsc = new Uint8Array(mem.buffer, ADR_CELL_PAGE2, 0x2000);
                const d = loader.getData(1);
                if (d) dsc.set(d);
                loader.requestRelease(1);
            }

            mem.setUint8(0xff12, 0x00);
            mem.setUint8(0xff12, 0x00);
            mem.setUint8(0xff12, 0x00);

            // マスク
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 0, 0); // left
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 1, 0); // top
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 2, CW); // right
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 3, CH); // bottom

            // カーソルスプライト
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 0, 0b0000_00_01); // mask_flip_mode
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 1, 0b0010_0000); // page_palette
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 6, 1); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 7, 1); // ch
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 8, 0xe0); // 

            // 
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 0, 0b0000_00_10); // mask_flip_mode
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 1, 0b0011_0000); // page_palette
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 2, 16); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 6, 10); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 7, 16); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 1 + 8, ADR_SPRITE_HEAD); // 

            // 
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 0, 0b0000_00_10); // mask_flip_mode
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 1, 0b0011_0000); // page_palette
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 4, HEIGHT - CELL); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 6, 3); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 7, 1); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 2 + 8, 0xff12); // 

            init = true;
            redraw = true;
        }

        const inputs = mem.getUint8(ADR_INPUT);
        const down = inputs & (~pInputs);
        const up = (~inputs) & pInputs;
        pInputs = inputs;

        if (inputs == 0) {
            rep_dir = 0;
            rep_count = 0;
            return;
        }

        let dir = inputs & (PAD_FLAG.Left | PAD_FLAG.Right | PAD_FLAG.Up | PAD_FLAG.Down);

        if (dir & rep_dir) {
            dir = rep_dir;
        }

        dir = dir & -dir;

        if (dir != rep_dir) {
            rep_count = 0;
            rep_dir = dir;
        } else {
            rep_count++;
        }

        if (rep_count == 0 || (rep_count >= 15 && (rep_count & 1))) {
            // console.log(rep_count);
        }
        else {
            dir = 0;
        }

        if (inputs & PAD_FLAG.Start) {
            if (dir & PAD_FLAG.Left) {
                i -= 1;
                redraw = true;
            }
            if (dir & PAD_FLAG.Right) {
                i += 1;
                redraw = true;
            }
            if (dir & PAD_FLAG.Up) {
                i -= 0x10;
                redraw = true;
            }
            if (dir & PAD_FLAG.Down) {
                i += 0x10;
                redraw = true;
            }
            if (i < 0) i = 0;
            if (i > 0xff) i = 0xff;
        }
        else {
            if (dir & PAD_FLAG.Left) {
                x -= 1;
                redraw = true;
            }
            if (dir & PAD_FLAG.Right) {
                x += 1;
                redraw = true;
            }
            if (dir & PAD_FLAG.Up) {
                y -= 1;
                redraw = true;
            }
            if (dir & PAD_FLAG.Down) {
                y += 1;
                redraw = true;
            }
            if (x < 0) x = 0;
            if (x >= CW) x = CW - 1;
            if (y < 0) y = 0;
            if (y >= CH) y = CH - 1;
        }
        if (down & PAD_FLAG.X) {
            if (x >= 0x02 && x <= 0x0b && y >= 0x00 && y <= 0x0f) {
                const addr = ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * y + (x - 0x02);
                mem.setUint8(addr, i);
            }
        }

        if (redraw) {
            mem.setUint8(0xff12, x);
            mem.setUint8(0xff13, y);
            mem.setUint8(0xff14, i);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, x * CELL);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, y * CELL);
        }

    }

    return {
        update: update,
    };
};
