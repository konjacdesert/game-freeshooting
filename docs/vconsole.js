import { DebugTextArea } from "./debug.js";
import { CELL, HEIGHT, WIDTH } from "./constants.js";
import {
    ADR_CELL_HEAD,
    ADR_CELL_SEEK,
    ADR_CHIP_HEAD,
    ADR_CHIP_SEEK,
    ADR_INPUT,
    ADR_MASK_HEAD,
    ADR_MASK_SEEK,
    ADR_PALETTE_HEAD,
    ADR_PALETTE_SEEK,
    ADR_PALETTE_SEPARATE,
    ADR_SPRITE_HEAD,
    ADR_SPRITE_NUM,
    ADR_SPRITE_SEEK,
    ADR_WORK_HEAD,
    MEM_ALL_MAX,
} from "./memoryMap.js";
import { VPad } from "./vpad.js";
import { KPad } from "./kpad.js";
import { VCartridge } from "./cartridge.js";

export const VConsole = (/** @type {HTMLCanvasElement} */ canvas) => {
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

    const ctx = canvas.getContext("2d", { alpha: false });
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
        const palxor = vram_u8[sprite + 1] & 0b1111;
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
            bank: bank,
            drawX: drawX,
            drawY: drawY,
            tw: tw,
            th: th,
            palxor: palxor,
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
                            const palette = (flag & 0b1111) ^ el.palxor;
                            const cellFlipX = ((flag & 0b00010000) != 0) != el.flipX;
                            const cellFlipY = ((flag & 0b00100000) != 0) != el.flipY;
                            const invalid = (flag & 0b10000000) != 0;

                            cache[i].ci = c;
                            cache[i].cell = chip;
                            cache[i].palette = palette;
                            cache[i].cellFlipX = cellFlipX;
                            cache[i].cellFlipY = cellFlipY;
                            cache[i].invalid = invalid;
                        } else {
                            cnt++;
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
                            const d1 = (finalDx % 2) === 0 ? (d >> 4) & 0xf : (d >> 0) & 0xf;

                            const paletteIndex = d1 + palette * ADR_PALETTE_SEPARATE;

                            if (paletteIndex % 16 !== 0) {
                                const color = vram.getUint16(ADR_PALETTE_HEAD + paletteIndex * ADR_PALETTE_SEEK) & 0x7fff;
                                setPixel(x, y, precalc_color[color]);
                                drawn = true;
                                break;
                            }
                        }
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
    };
};
