import { predata } from "./predata.js";
import { CELL, CH, CW, HEIGHT, PAD_FLAG, WIDTH } from "./constants.js";
import {
    ADR_CELL_HEAD,
    ADR_CELL_NUM,
    ADR_CELL_SEEK,
    ADR_CHIP_HEAD,
    ADR_INPUT,
    ADR_MASK_HEAD,
    ADR_MASK_SEEK,
    ADR_SPRITE_HEAD,
    ADR_SPRITE_SEEK,
} from "./memoryMap.js";
import { FileManager } from "./fileManager.js";

export const VCartridge = () => {
    let init = false;

    let pInputs = 0;

    let rep_dir = 0;
    let rep_count = 0;

    let x = 0;
    let y = 0;

    // ファイルマネージャー
    const fileManager = FileManager();
    const vramtxt = "vram.txt";
    const impimg = "chip.png";

    const ADR_CELL_SP1 = ADR_CELL_NUM - 0x100;

    /**
     * @param {DataView} mem
     */
    function update(mem) {
        let redraw = false;

        if (!init) {
            {
                const dsc = new Uint8Array(mem.buffer, 0, predata.byteLength);
                dsc.set(predata);
            }

            // カーソル用セル
            mem.setUint8(ADR_CELL_HEAD + ADR_CELL_SEEK * ADR_CELL_SP1, 0xe0);

            // マスク
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 0, 0); // left
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 1, 0); // top
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 2, CW); // right
            mem.setUint8(ADR_MASK_HEAD + ADR_MASK_SEEK * 0 + 3, CH); // bottom

            // カーソル
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 0, 0b0000_00_1_1); // mask_flip_mode_valid
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 1, 0b0011_0011); // chip_palette
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, 0); // x
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, 0); // y
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 6, 1); // cw
            mem.setUint8(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 7, 1); // ch
            mem.setUint16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 8, ADR_CELL_SP1); // cell offset

            init = true;
            redraw = true;
        }

        // ファイルマネージャーから保留中のデータを適用
        if (vramtxt in fileManager.pendingData) {
            const data = fileManager.pendingData[vramtxt];
            if (data) {
                const dsc = new Uint8Array(mem.buffer, 0, data.byteLength);
                dsc.set(data);
                console.log("VRAM set");
                delete fileManager.pendingData[vramtxt];
                redraw = true;
            }
        }
        if (impimg in fileManager.pendingData) {
            const data = fileManager.pendingData[impimg];
            if (data) {
                const dsc = new Uint8Array(mem.buffer, ADR_CHIP_HEAD, data.byteLength);
                dsc.set(data);
                console.log("CELL set");
                delete fileManager.pendingData[impimg];
                redraw = true;
            }
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

        {
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

        if (redraw) {
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 2, x * CELL);
            mem.setInt16(ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * 0 + 4, y * CELL);
        }

    }

    return {
        update: update,
    };
};
