import { CanvasScreen } from "./sccreen";

export const DbgConsole = (function () {
  const messagesPerFrame: string[] = [];
  const messages: string[] = [];

  function add(mes: string) {
    messagesPerFrame.push(mes);
  }
  function addPermanent(mes: string) {
    messages.unshift(mes);
    messages.splice(10);
  }
  function clear() {
    messages.splice(0);
  }
  function update() {
    const disp = CanvasScreen.getDsp();
    disp.save();
    disp.textAlign = "right"
    disp.textBaseline = "hanging";
    disp.font = "10px serif";
    disp.fillStyle = "#0f0a";

    messagesPerFrame.forEach((v, i) => {
      disp.fillText(v, CanvasScreen.info.WIDTH, i * 10);
    });
    messagesPerFrame.splice(0);

    //恒常ログ
    disp.textAlign = "left"
    messages.forEach((v, i) => {
      disp.fillText(v, 0, i * 10);
    });
    disp.restore();
  }

  return {
    add: process.env.NODE_ENV === "development" ? add : function () { },
    addp: process.env.NODE_ENV === "development" ? addPermanent : function () { },
    clearp: clear,
    update: update,
  };
})();
