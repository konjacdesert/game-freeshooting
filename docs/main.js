const FPS = 60;
const WIDTH = 256;
const HEIGHT = 240;

const VPad = (() => {
    const canvas = document.getElementById('gd_container');
    if (canvas) {
        //スクロール禁止
        canvas.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
        //右クリックメニュー禁止
        canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { passive: false });
    }

    /** @type {(HTMLElement|null)[]} */
    const touchElements = [];
    touchElements.push(document.getElementById("gd_vpad_l"));
    touchElements.push(document.getElementById("gd_vpad_r"));


    /** @type {{ elm: number, x: number, y: number, w: number, h: number }[]} */
    const touchArea = [];
    touchArea.push({ elm: 0, x: 0, y: 0, w: 100, h: 100 });
    touchArea.push({ elm: 1, x: 0, y: 0, w: 100, h: 100 });

    /** @type {{ [id: number]: {x: number, y: number} }} */
    let touchInfo = {};

    /** @type {boolean[]} */
    const inputList = [...Array(touchArea.length)].map(() => false);

    const isTouch = 'ontouchstart' in window;
    document.getElementById("gd_overlay").hidden = !isTouch;
    if (isTouch) {
        window.addEventListener("touchstart", function (e) {
            e.preventDefault();

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches.item(i);
                if (touch) {
                    for (let j = 0; j < touchElements.length; j++) {
                        touchInfo[touch.identifier] = { x: touch.clientX, y: touch.clientY };
                    }
                }
            }
        }, { passive: false });
        window.addEventListener("touchmove", function (e) {
            e.preventDefault();

            for (let index = 0; index < e.changedTouches.length; index++) {
                const touch = e.changedTouches.item(index);
                if (touch) {
                    if (touch.identifier in touchInfo) {
                        touchInfo[touch.identifier].x = touch.clientX;
                        touchInfo[touch.identifier].y = touch.clientY;
                    }
                }
            }
        }, { passive: false });
        window.addEventListener("touchend", function (e) {
            e.preventDefault();
            for (let index = 0; index < e.changedTouches.length; index++) {
                const touch = e.changedTouches.item(index);
                if (touch) {
                    delete touchInfo[touch.identifier];
                }
            }
        }, { passive: false });
        window.addEventListener("touchcancel", function (e) {
            e.preventDefault();
            touchInfo = {};
        }, { passive: false });
    }

    /**
     * 
     * @param {number} ex 
     * @param {number} ey 
     * @param {HTMLElement|null} elm 
     */
    function IsInElementRect(ex, ey, elm) {
        if (elm == null) return false;
        const offset = elm.getBoundingClientRect();
        return offset.left <= ex && ex < offset.right && offset.top <= ey && ey < offset.bottom;
    }

    /**
     * 
     * @param {number} ex 
     * @param {number} ey 
     * @param {HTMLElement|null} elm 
     */
    function GetPosInElementRect(ex, ey, elm) {
        if (elm == null) return { x: -1, y: -1 };
        const offset = elm.getBoundingClientRect();
        const PX = 100;
        const PY = 100;
        return {
            x: (ex - offset.x) * PX / offset.width,
            y: (ey - offset.y) * PY / offset.height,
        }
    }

    function update() {
        inputList.fill(false);
        for (let i = 0; i < inputList.length; i++) {
            if (inputList[i]) continue;
            const element = touchArea[i];
            for (const key in touchInfo) {
                if (touchInfo.hasOwnProperty(key)) {
                    const info = touchInfo[key];
                    if (IsInElementRect(info.x, info.y, touchElements[element.elm])) {
                        const pos = GetPosInElementRect(info.x, info.y, touchElements[element.elm]);
                        if (element.x <= pos.x && pos.x < element.x + element.w &&
                            element.y <= pos.y && pos.y < element.y + element.h) {
                            inputList[i] = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    function get() {
        return inputList;
    }

    return {
        update: update,
        get: get,
    }
})();

const KPad = (() => {
    /** @type {string[]} */
    const keyName = [];
    keyName.push("ArrowLeft");
    keyName.push("ArrowRight");

    /** @type {boolean[]} */
    const inputList = [...Array(keyName.length)].map(() => false);

    /** @type {{ [key: string]: boolean }} */
    let keyState = {};

    window.addEventListener("keydown", function (e) {
        e.preventDefault();
        keyState[e.key] = true;
    });

    window.addEventListener("keyup", function (e) {
        e.preventDefault();
        keyState[e.key] = false;
    });

    window.addEventListener("blur", function (e) {
        keyState = {};
    });

    function update() {
        inputList.fill(false);
        for (let i = 0; i < inputList.length; i++) {
            if (inputList[i]) continue;
            const key = keyName[i];
            if (keyState[key]) {
                inputList[i] = true;
            }
        }
    }

    function get() {
        return inputList;
    }

    return {
        update: update,
        get: get,
    }
})();

const Game = (() => {
    const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('gd_main'));
    if (canvas == null) return;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');
    if (ctx == null) return;

    let t = 0;

    const update = () => {
        VPad.update();
        KPad.update();
        const vinputs = VPad.get();
        const kinputs = KPad.get();
        const inputs = [];
        for (let i = 0; i < vinputs.length; i++) {
            inputs.push(vinputs[i] || kinputs[i]);
        }

        if (inputs[0]) {
            t -= 1;
        }
        if (inputs[1]) {
            t += 1;
        }
    }

    // 毎フレーム描画ループ
    const draw = () => {
        // 背景色を塗る
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 動く円の座標計算
        const time = t * (Math.PI * 2) / 60;
        const x = WIDTH / 2 + Math.cos(time) * 64;
        const y = HEIGHT / 2 + Math.sin(time) * 64;

        // 円を描画
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#113';
        ctx.fill();
    }

    return {
        update: update,
        draw: draw,
    };
})();


(() => {
    const targetInterval = 1000 / FPS;
    const maxFrame = 3;
    let nextGameTick = performance.now();

    /**
     * @param {DOMHighResTimeStamp} ts
     */
    function mainloop(ts) {
        const currentTime = ts;

        let count = 0;
        while (currentTime >= nextGameTick) {
            if (count < maxFrame) {
                Game?.update();
                count++;
            }
            nextGameTick += targetInterval;
        }

        if (count > 0) {
            Game?.draw();
        }

        requestAnimationFrame(mainloop);
    }

    requestAnimationFrame(mainloop);
})();
