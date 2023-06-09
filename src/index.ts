import "@acab/reset.css";
import "./style.css"

import { CanvasScreen } from "./sccreen";
import { TouchInput } from "./touchInput";
import { Cps } from "./cps";
import { DbgConsole } from "./debugconsole";

const Game = (function () {
  const fps_update = new Cps();

  let pause = false;

  function start() {
    CanvasScreen.init();
    TouchInput.init();
    window.requestAnimationFrame(setLoop);
  }

  function setLoop() {
    // 自分自身を呼ぶ
    window.requestAnimationFrame(setLoop);
    // 中身も呼ぶ
    loop();
    // if (ImgData.isLoaded()) loop();
    // else console.log("ImgData inLoad");
  }

  function loop() {
    // 入力のデータ更新
    // Input.update();

    // ポーズとフレームアドバンス処理
    // if (Input.down(10)) {
    //   pause = !pause;
    // }
    // if (!Input.down(11) && pause) return;

    // fps測る
    fps_update.tick();
    DbgConsole.add(`fps:${fps_update.get}`);

    TouchInput.debug();

    // ゲームオブジェクト処理
    // GameObjectController.update();

    // 描画処理
    // Zdraw.update(CanvasScreen.getBuf());

    // ドローコールの数を数える
    // ImgData.debugLog();

    // 画面の更新
    CanvasScreen.update();

    // デバッグ情報描画
    DbgConsole.update();
  }
  return {
    start: start,
  };
})();
window.addEventListener("load", Game.start);
