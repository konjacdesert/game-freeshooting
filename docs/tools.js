import { CELL } from "./src/constants.js";
import { ADR_CELL_SEEK } from "./src/memoryMap.js";

(() => {
    const cellInput =  /** @type {HTMLInputElement} */ (document.getElementById("cellInput"));
    cellInput?.addEventListener("change", (e) => {
        if (!e.target) return;
        const target = /** @type {HTMLInputElement} */ (e.target);
        if (!target.files || target.files.length === 0) return;
        const file = target.files[0];
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const w = CELL * 16;
                const h = CELL * 16;
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) {
                    throw new Error("Failed to get 2D context");
                }
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, w, h);
                const data = new Uint8Array(ADR_CELL_SEEK * 256);
                for (let i = 0; i < data.length; i++) {
                    const x = (((i >> 5) % 16) << 3) + (((i % ADR_CELL_SEEK) % 4) << 1);
                    const y = ((i >> 9) << 3) + ((i % ADR_CELL_SEEK) >> 2);
                    if (x >= w || y >= h) continue;
                    const pIndex = y * w + x;
                    const hd = imageData.data[pIndex * 4] >> 4;
                    const ld = imageData.data[pIndex * 4 + 4] >> 4;
                    data[i] = (hd << 4) | ld;
                }
                {
                    const blob = new Blob([data], { type: "application/octet-stream" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = file.name + ".bin";
                    a.innerHTML = `${file.name}.bin</br>`;
                    document.body.appendChild(a);
                }
            } catch (error) {
                console.error("Failed to load image:", error);
            } finally {
                URL.revokeObjectURL(url);
            }
        };

        img.onerror = (error) => {
            console.error("Failed to load image:", error);
            URL.revokeObjectURL(url);
        };

        img.src = url;
    });

    const colorPicker = /** @type {HTMLInputElement} */ (document.getElementById("colorPicker"));
    const colorHex = /** @type {HTMLInputElement} */ (document.getElementById("colorHex"));
    colorPicker?.addEventListener("input", (e) => {
        if (!e.target) return;
        const target = /** @type {HTMLInputElement} */ (e.target);
        const color = target.value;
        const r = parseInt(color.slice(1, 3), 16) >> 3;
        const g = parseInt(color.slice(3, 5), 16) >> 3;
        const b = parseInt(color.slice(5, 7), 16) >> 3;
        const v = (r << 10) | (g << 5) | (b << 0);
        colorHex.value = `0x${v.toString(16).padStart(4, "0")}`;
    });
    const colorPicker2 = /** @type {HTMLInputElement} */ (document.getElementById("colorPicker2"));
    const colorHex2 = /** @type {HTMLInputElement} */ (document.getElementById("colorHex2"));
    colorPicker2?.addEventListener("input", (e) => {
        if (!e.target) return;
        const target = /** @type {HTMLInputElement} */ (e.target);
        const color = target.value;
        const r = parseInt(color.slice(1, 3), 16) >> 4;
        const g = parseInt(color.slice(3, 5), 16) >> 4;
        const b = parseInt(color.slice(5, 7), 16) >> 4;
        const rr = (r << 1) | (r & 0b1);
        const gg = (g << 1) | (g & 0b1);
        const bb = (b << 1) | (b & 0b1);
        const v = (rr << 10) | (gg << 5) | (bb << 0);
        colorHex2.value = `0x${v.toString(16).padStart(4, "0")}`;
    });
})();
