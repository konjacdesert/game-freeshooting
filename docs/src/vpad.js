import { PAD_FLAG } from "./constants.js";

export const VPad = () => {
    //スクロール禁止
    document.getElementById('gd_container')?.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
    document.getElementById('gd_container')?.addEventListener("scroll", function (e) { e.preventDefault(); }, { passive: false });
    //右クリックメニュー禁止
    document.getElementById('gd_main_container')?.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { passive: false });

    /** @type {{elm:HTMLElement|null,areas:{x:number,y:number,w:number,h:number,f:number}[]}[]} */
    const touchDatabase = [
        {
            elm: document.getElementById("gd_vpad_l"),
            areas: [
                { x: 10, y: 40, w: 30, h: 20, f: PAD_FLAG.Left },
                { x: 60, y: 40, w: 30, h: 20, f: PAD_FLAG.Right },
                { x: 40, y: 10, w: 20, h: 30, f: PAD_FLAG.Up },
                { x: 40, y: 60, w: 20, h: 30, f: PAD_FLAG.Down },
                { x: 10, y: 10, w: 30, h: 30, f: PAD_FLAG.Left | PAD_FLAG.Up },
                { x: 60, y: 10, w: 30, h: 30, f: PAD_FLAG.Right | PAD_FLAG.Up },
                { x: 10, y: 60, w: 30, h: 30, f: PAD_FLAG.Left | PAD_FLAG.Down },
                { x: 60, y: 60, w: 30, h: 30, f: PAD_FLAG.Right | PAD_FLAG.Down },
            ]
        },
        {
            elm: document.getElementById("gd_vpad_r"),
            areas: [
                { x: 60, y: 60, w: 30, h: 30, f: PAD_FLAG.Z },
                { x: 10, y: 60, w: 30, h: 30, f: PAD_FLAG.X },
                { x: 40, y: 60, w: 20, h: 30, f: PAD_FLAG.Z | PAD_FLAG.X },
                { x: 20, y: 10, w: 20, h: 10, f: PAD_FLAG.Start },
            ]
        },
    ];

    let inputRaw = 0;
    let inputOut = 0;

    const isTouch = 'ontouchstart' in window;

    if (isTouch) {
        window.addEventListener("touchstart", ParseEvent, { passive: false });
        window.addEventListener("touchmove", ParseEvent, { passive: false });
        window.addEventListener("touchend", ParseEvent, { passive: false });
        window.addEventListener("touchcancel", ParseEvent, { passive: false });
    } else {
        const overlay = document.getElementById("gd_vpad");
        overlay?.classList.add("hidden");
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
        };
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
    };
};
