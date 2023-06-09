import { DbgConsole } from "./debugconsole";

export const CanvasScreen = (function () {
  const INFO = {
    WIDTH: 16 * 14,
    HEIGHT: 16 * (18 + 10),
  } as const;
  // Object.freeze(INFO);

  let display: CanvasRenderingContext2D;
  let buffer: CanvasRenderingContext2D;

  function init() {
    // 生成
    display = document.createElement("canvas").getContext("2d");
    // 外画面の画面サイズ
    display.canvas.width = INFO.WIDTH;
    display.canvas.height = INFO.HEIGHT;

    // バッファのサイズ
    buffer = document.createElement("canvas").getContext("2d");
    buffer.canvas.width = INFO.WIDTH;
    buffer.canvas.height = INFO.HEIGHT;
    buffer.imageSmoothingEnabled = false;

    //リセット用
    update();

    // ページに貼り付け
    document.body.appendChild(display.canvas);
  }

  function getBuf() {
    return buffer;
  }
  function getDsp() {
    return display;
  }
  function update() {
    // display.resetTransform();
    // getImageDataが遅い
    display.drawImage(buffer.canvas, 0, 0);
    // display.putImageData(buffer.getImageData(0, 0, display.canvas.width, display.canvas.height), 0, 0);
    buffer.resetTransform();
    buffer.clearRect(0, 0, buffer.canvas.width, buffer.canvas.height);
    buffer.fillStyle = "#000";
    buffer.fillRect(0, 0, buffer.canvas.width, buffer.canvas.height);
  }

  return {
    info: INFO,
    init: init,
    getBuf: getBuf,
    getDsp: getDsp,
    update: update,
  };
})();
