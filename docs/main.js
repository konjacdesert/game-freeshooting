import { FPS } from "./constants.js";
import { DebugTextArea } from "./debug.js";
import { VConsole } from "./vconsole.js";

(() => {
    const pause = {
        isBlur: !document.hasFocus(),
        isHidden: document.hidden,
        isUser: false,
    };

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
