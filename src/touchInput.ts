import { DbgConsole } from "./debugconsole";
import { CanvasScreen } from "./sccreen";

export const TouchInput = (function () {
  let touchInfo: { [id: number]: { x: number, y: number, sx: number, sy: number } } = {};

  function init() {
    const canvas = CanvasScreen.getDsp().canvas;

    canvas.addEventListener("pointerdown", function (e) { updateDown(e, this); });
    canvas.addEventListener("pointermove", function (e) { updateDown(e, this); });
    canvas.addEventListener("pointerup", function (e) { updateUp(e); });
    canvas.addEventListener("pointercancel", function (e) { updateCancel(e); })

    //スクロール更新防止
    canvas.addEventListener("touchmove", function (e) { e.preventDefault(); });
    //右クリックメニュー防止
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  function updateDown(e: PointerEvent, c: HTMLCanvasElement) {
    e.preventDefault();
    if (e.buttons == 0) return;
    const pos = getVirtualPosition(e, c);
    // DbgConsole.addp(`[${e.pointerId}]${e.type}(${Math.floor(pos.x)},${Math.floor(pos.y)})`);
    if (e.type == "pointerdown") {
      touchInfo[e.pointerId] = { x: pos.x, y: pos.y, sx: pos.x, sy: pos.y };
    } else {
      touchInfo[e.pointerId].x = pos.x;
      touchInfo[e.pointerId].y = pos.y;
    }
  }
  function updateUp(e: PointerEvent) {
    e.preventDefault();
    // const pos = getVirtualPosition(e, c);
    // DbgConsole.addp(`[${e.pointerId}](${Math.floor(pos.x)},${Math.floor(pos.y)})`);
    // DbgConsole.addp(`[${e.pointerId}]up`);
    delete touchInfo[e.pointerId];
  }
  function updateCancel(e: PointerEvent) {
    e.preventDefault();
    // const pos = getVirtualPosition(e, c);
    // DbgConsole.addp(`[${e.pointerId}](${Math.floor(pos.x)},${Math.floor(pos.y)})`);
    // DbgConsole.addp(`[-]cancel`);
    touchInfo = {};
  }

  function getVirtualPosition(e: MouseEvent, c: HTMLElement): { x: number, y: number } {
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

    const ex = e.offsetX;
    const ey = e.offsetY;

    const vx = (ex - oW) * scale;
    const vy = (ey - oH) * scale;

    return { x: vx, y: vy };
  }
  function debug() {
    for (let [key, value] of Object.entries(touchInfo)) {
      DbgConsole.add(`${key}:${Math.floor(value.x)},${Math.floor(value.y)}/${Math.floor(value.sx)},${Math.floor(value.sy)}`);
    }
  }

  return {
    init: init,
    debug: debug
  };

})();
