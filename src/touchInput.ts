import { DbgConsole } from "./debugconsole";
import { CanvasScreen } from "./sccreen";

export const TouchInput = (function () {
  const mouseInfo: { isDown: boolean, x: number, y: number, sx: number, sy: number } = { isDown: false, x: 0, y: 0, sx: 0, sy: 0 };
  let touchInfo: { [id: number]: { x: number, y: number, sx: number, sy: number } } = {};

  function init() {
    const canvas = CanvasScreen.getDsp().canvas;

    // canvas.addEventListener("pointerdown", function (e) { updateDown(e, this); });
    // canvas.addEventListener("pointermove", function (e) { updateDown(e, this); });
    // canvas.addEventListener("pointerup", function (e) { updateUp(e); });
    // canvas.addEventListener("pointercancel", function (e) { updateCancel(e); })
    window.addEventListener("mousedown", function (e) {
      e.preventDefault();
      if (e.buttons == 0) return;
      const pos = getVirtualPosition(e.offsetX, e.offsetY, canvas);
      mouseInfo.isDown = true;
      mouseInfo.x = pos.x;
      mouseInfo.y = pos.y;
      mouseInfo.sx = pos.x;
      mouseInfo.sy = pos.y;
    });
    window.addEventListener("mousemove", function (e) {
      e.preventDefault();
      if (e.buttons == 0) return;
      const pos = getVirtualPosition(e.offsetX, e.offsetY, canvas);
      mouseInfo.x = pos.x;
      mouseInfo.y = pos.y;
    });
    window.addEventListener("mouseup", function (e) {
      e.preventDefault();
      const pos = getVirtualPosition(e.offsetX, e.offsetY, canvas);
      mouseInfo.x = pos.x;
      mouseInfo.y = pos.y;
      mouseInfo.isDown = false;
    });

    window.addEventListener("touchstart", function (e) {
      e.preventDefault();
      DbgConsole.addp(`s${e.changedTouches.length}`);

      for (let index = 0; index < e.changedTouches.length; index++) {
        const touch = e.changedTouches.item(index);
        // DbgConsole.addp(`${touch.identifier}`);
        const pos = getVirtualPosition(touch.clientX, touch.clientY, canvas);
        touchInfo[touch.identifier] = { x: pos.x, y: pos.y, sx: pos.x, sy: pos.y };
      }
    });
    window.addEventListener("touchmove", function (e) {
      e.preventDefault();
      DbgConsole.addp(`m${e.changedTouches.length}`);

      for (let index = 0; index < e.changedTouches.length; index++) {
        const touch = e.changedTouches.item(index);
        // DbgConsole.addp(`${touch.identifier}`);
        const pos = getVirtualPosition(touch.clientX, touch.clientY, canvas);
        if (touch.identifier in touchInfo) {
          touchInfo[touch.identifier].x = pos.x;
          touchInfo[touch.identifier].y = pos.y;
        }
      }
    });
    window.addEventListener("touchend", function (e) {
      e.preventDefault();
      DbgConsole.addp(`e${e.changedTouches.length}`);

      for (let index = 0; index < e.changedTouches.length; index++) {
        const touch = e.changedTouches.item(index);
        // DbgConsole.addp(`${touch.identifier}`);
        delete touchInfo[touch.identifier];
      }
    });
    window.addEventListener("touchcancel", function (e) {
      e.preventDefault();

      DbgConsole.addp(`c${e.changedTouches.length}`);

      touchInfo = {};
    });

    //スクロール禁止
    canvas.addEventListener("wheel", function (e) { e.preventDefault(); });
    //右クリックメニュー禁止
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  function getVirtualPosition(ex: number, ey: number, c: HTMLElement): { x: number, y: number } {
    // ページ上のオフセット位置取得
    const offset = c.getBoundingClientRect();

    const eW = offset.width;
    const eH = offset.height;
    const eA = eW / eH;

    const sW = CanvasScreen.info.WIDTH;
    const sH = CanvasScreen.info.HEIGHT;
    const sA = sW / sH;

    const vW = Math.min(eH * sA, eW);
    const vH = Math.min(eW / sA, eH);

    const oW = (eW - vW) / 2;
    const oH = (eH - vH) / 2;

    //asp<1 → 縦に余白
    //asp>1 → 横に余白
    const asp = eA / sA;

    const scale = asp < 1 ? sW / eW : sH / eH;

    const vx = (ex - oW) * scale;
    const vy = (ey - oH) * scale;

    return { x: vx, y: vy };
  }
  function debug() {
    if (mouseInfo.isDown)
      DbgConsole.add(`M:${Math.floor(mouseInfo.x)},${Math.floor(mouseInfo.y)}/${Math.floor(mouseInfo.sx)},${Math.floor(mouseInfo.sy)}`);
    for (let [key, value] of Object.entries(touchInfo)) {
      DbgConsole.add(`${key}:${Math.floor(value.x)},${Math.floor(value.y)}/${Math.floor(value.sx)},${Math.floor(value.sy)}`);
    }
  }

  return {
    init: init,
    debug: debug
  };

})();
