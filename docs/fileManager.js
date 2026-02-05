import { CELL } from "./constants.js";
import { ADR_CHIP_SEEK } from "./memoryMap.js";

// ファイルマネージャー
export const FileManager = () => {

    /** @type {{ [key: string]: Uint8Array | null }} */
    const pendingData = {};

    /**
     * @param {string | number} key
     * @param {File} file
     */
    function requestLoadText(key, file) {
        delete pendingData[key];
        file.text()
            .then(result => {
                if (typeof result === 'string') {
                    /**@ts-ignore */
                    const bin = Uint8Array.fromBase64(result);
                    pendingData[key] = bin;
                } else {
                    throw new Error("Invalid file format");
                }
            })
            .catch(error => {
                console.error("Failed to load VRAM:", error);
            });
    }
    /**
     * @param {string | number} key
     * @param {File} file
     */
    function requestLoadImage(key, file) {
        delete pendingData[key];
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
                const data = new Uint8Array(ADR_CHIP_SEEK * 256);
                for (let i = 0; i < data.length; i++) {
                    const x = (((i >> 5) % 16) << 3) + (((i % ADR_CHIP_SEEK) % 4) << 1);
                    const y = ((i >> 9) << 3) + ((i % ADR_CHIP_SEEK) >> 2);
                    if (x >= w || y >= h) continue;
                    const pIndex = y * w + x;
                    const hd = imageData.data[pIndex * 4] >> 4;
                    const ld = imageData.data[pIndex * 4 + 4] >> 4;
                    data[i] = (hd << 4) | ld;
                }
                pendingData[key] = data;
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
    }

    return {
        requestLoadText: requestLoadText,
        requestLoadImage: requestLoadImage,
        pendingData: pendingData,
    };
};
