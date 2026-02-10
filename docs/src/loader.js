/**
 * @param {string[]} filePaths
 */
export const Loader = (filePaths) => {

    const paths = filePaths.slice();
    /** @type {("idle" | "loading" | "ready" | "error")[]} */
    const states = new Array(paths.length).fill("idle");
    /** @type {(Uint8Array | null)[]} */
    const data = new Array(paths.length).fill(null);
    /** @type {(Error | null)[]} */
    const errors = new Array(paths.length).fill(null);
    /** @type {(AbortController | null)[]} */
    const controllers = new Array(paths.length).fill(null);

    /**
     * @param {number} index
     */
    function isValidIndex(index) {
        return Number.isInteger(index) && index >= 0 && index < paths.length;
    }

    /**
     * @param {number} index
     */
    function requestLoad(index) {
        if (!isValidIndex(index)) return false;
        if (states[index] === "loading" || states[index] === "ready") return true;

        const controller = new AbortController();
        controllers[index] = controller;
        states[index] = "loading";
        errors[index] = null;
        data[index] = null;

        fetch(paths[index], { signal: controller.signal })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to load: ${paths[index]} (${res.status})`);
                }
                return res.arrayBuffer();
            })
            .then((buf) => {
                data[index] = new Uint8Array(buf);
                states[index] = "ready";
            })
            .catch((error) => {
                if (error && error.name === "AbortError") {
                    states[index] = "idle";
                } else {
                    states[index] = "error";
                    errors[index] = error instanceof Error ? error : new Error(String(error));
                }
            })
            .finally(() => {
                controllers[index] = null;
            });

        return true;
    }

    /**
     * @param {number} index
     */
    function requestRelease(index) {
        if (!isValidIndex(index)) return false;

        if (controllers[index]) {
            controllers[index].abort();
        }

        controllers[index] = null;
        states[index] = "idle";
        data[index] = null;
        errors[index] = null;
        return true;
    }

    /**
     * @param {number} index
     */
    function getState(index) {
        if (!isValidIndex(index)) return "invalid";
        return states[index];
    }

    /**
     * @param {number} index
     */
    function getData(index) {
        if (!isValidIndex(index)) return null;
        return data[index];
    }

    /**
     * @param {number} index
     */
    function getError(index) {
        if (!isValidIndex(index)) return null;
        return errors[index];
    }

    /**
     * @param {number} index
     */
    function getPath(index) {
        if (!isValidIndex(index)) return null;
        return paths[index];
    }

    return {
        requestLoad: requestLoad,
        requestRelease: requestRelease,
        getState: getState,
        getData: getData,
        getError: getError,
        getPath: getPath,
    };
};