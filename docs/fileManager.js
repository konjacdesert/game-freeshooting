// ファイルマネージャー
export const FileManager = () => {

    /** @type {{ [key: string]: Uint8Array | null }} */
    const pendingData = {};

    /**
     * @param {string | number} key
     * @param {File} file
     */
    function requestLoad(key, file) {
        delete pendingData[key];
        const loadFile = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!e.target) { reject(new Error("File read error")); return; }
                const result = e.target.result;
                if (typeof result === 'string') {
                    /**@ts-ignore */
                    const bin = Uint8Array.fromBase64(result);
                    resolve(bin);
                } else {
                    reject(new Error("Invalid file format"));
                }
            };
            reader.readAsText(file);
        });
        loadFile.then(bin => {
            pendingData[key] = bin;
            console.log("VRAM loaded");
        }).catch(error => {
            console.error("Failed to load VRAM:", error);
        });
    }

    return {
        requestLoad: requestLoad,
        pendingData: pendingData,
    };
};
