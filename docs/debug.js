export const DebugTextArea = (() => {
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
    };
})();
