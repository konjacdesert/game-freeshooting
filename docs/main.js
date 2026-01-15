const FPS = 60;
const WIDTH = 256;
const HEIGHT = 240;

const PAD_FLAG = {
    Left: 1 << 0,
    Right: 1 << 1,
    Up: 1 << 2,
    Down: 1 << 3,
    A: 1 << 4,
    B: 1 << 5,
    Start: 1 << 6,
}

const VPad = (() => {
    const canvas = document.getElementById('gd_container');
    if (canvas) {
        //スクロール禁止
        canvas.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
        //右クリックメニュー禁止
        canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { passive: false });
    }

    /** @type {{elm:HTMLElement|null,areas:{x:number,y:number,w:number,h:number,f:number}[]}[]} */
    const touchDatabase = [
        {
            elm: document.getElementById("gd_vpad_l"),
            areas: [{ x: 0, y: 0, w: 100, h: 100, f: PAD_FLAG.Left }],
        },
        {
            elm: document.getElementById("gd_vpad_r"),
            areas: [{ x: 0, y: 0, w: 100, h: 100, f: PAD_FLAG.Right }],
        },
    ];

    let inputRaw = 0;
    let inputOut = 0;

    const isTouch = 'ontouchstart' in window;

    const overlay = document.getElementById("gd_overlay");
    if (overlay) {
        overlay.hidden = !isTouch;
    }

    if (isTouch) {
        window.addEventListener("touchstart", ParseEvent, { passive: false });
        window.addEventListener("touchmove", ParseEvent, { passive: false });
        window.addEventListener("touchend", ParseEvent, { passive: false });
        window.addEventListener("touchcancel", ParseEvent, { passive: false });
    }

    /**
     *
     * @param {TouchEvent} e
     */
    function ParseEvent(e) {
        const parea = document.getElementById("gd_overlay");
        let prevent = false;
        inputRaw = 0;
        const num = e.touches ? e.touches.length : 0;
        for (let i = 0; i < num; i++) {
            const touch = e.touches.item(i);
            if (touch) {
                const x = touch.clientX;
                const y = touch.clientY;

                if (!prevent) {
                    prevent = IsInElementRect(x, y, parea);
                }

                for (let j = 0; j < touchDatabase.length; j++) {
                    const data = touchDatabase[j];
                    if (IsInElementRect(x, y, data.elm)) {
                        for (let k = 0; k < data.areas.length; k++) {
                            const area = data.areas[k];
                            const pos = GetPosInElementRect(x, y, data.elm);
                            if (area.x <= pos.x && pos.x < area.x + area.w &&
                                area.y <= pos.y && pos.y < area.y + area.h) {
                                inputRaw |= area.f;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
        if (prevent) {
            e.preventDefault();
        }
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
        inputOut = inputRaw;
    }

    function get() {
        return inputOut;
    }

    return {
        update: update,
        get: get,
    }
})();

const KPad = (() => {
    /** @type {{code:string,f:number}[]} */
    const keyDatabase = [
        { code: "ArrowLeft", f: PAD_FLAG.Left },
        { code: "ArrowRight", f: PAD_FLAG.Right },
    ];

    /** @type {{ [key: string]: boolean }} */
    let keyState = {};

    let inputOut = 0;

    window.addEventListener("keydown", function (e) {
        e.preventDefault();
        keyState[e.code] = true;
    });

    window.addEventListener("keyup", function (e) {
        e.preventDefault();
        keyState[e.code] = false;
    });

    window.addEventListener("blur", function (e) {
        keyState = {};
    });

    function update() {
        inputOut = 0;
        for (let i = 0; i < keyDatabase.length; i++) {
            const code = keyDatabase[i].code;
            if (keyState[code]) {
                inputOut |= keyDatabase[i].f;
            }
        }
    }

    function get() {
        return inputOut;
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
        const inputs = vinputs | kinputs;
        if ((inputs & PAD_FLAG.Left) != 0) {
            t -= 1;
        }
        if (inputs & PAD_FLAG.Right) {
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
