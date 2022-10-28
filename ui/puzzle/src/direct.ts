import { attributesModule, classModule, h, init } from 'snabbdom';
import makeCtrl from './ctrl';
import menuHover from 'common/menuHover';
// import view from './view/main';
import { Chessground } from 'chessground';
import { Controller, PuzzleOpts } from './interfaces';
import chessground from './view/chessground';
import { renderAnalyse } from './view/main';
// import {view as cevalView} from 'ceval';
// import feedbackView from './view/feedback';
// import {render as renderKeyboardMove} from 'keyboardMove';
import * as control from './control';

// const DOMAIN = 'http://test-page.local';
const DOMAIN = 'http://localhost:3000';

const patch = init([classModule, attributesModule]);

export default function (opts: PuzzleOpts): void {
  const element = document.querySelector('main.puzzle') as HTMLElement;
  const ctrl = makeCtrl(opts, redraw);

  const sendMsg = (msg: any) => {
    window.parent.postMessage(msg, DOMAIN);
  };

  const blueprint = renderBoard(ctrl, sendMsg);
  element.innerHTML = '';
  let vnode = patch(element, blueprint);

  window.addEventListener('message', msg => {
    if (msg.data.type === 'adjust-play-number') {
      const direction = msg.data.direction;

      if (direction === 'prev') control.prev(ctrl);
      else if (direction === 'next') control.next(ctrl);
      else if (direction === 'first') control.first(ctrl);
      else if (direction === 'last') control.last(ctrl);

      redraw();
    } else if (msg.data.type === 'user-move') {
      ctrl.userMove(msg.data.fromPos, msg.data.toPos);
    } else if (msg.data.type === 'set-play-number') {
      setPlayNumber(msg.data.playNumber);
      return;
    }
  });

  function setPlayNumber(ply: number) {
    const pathSteps = [];
    const max = Math.min(ply, ctrl.vm.nodeList.length);
    for (let i = 0; i < max; ++i) {
      pathSteps.push(ctrl.vm.nodeList[i].id);
    }
    ctrl.userJump(pathSteps.join(''));
    redraw();
  }

  function redraw() {
    vnode = patch(vnode, renderBoard(ctrl, sendMsg));
  }

  menuHover();
}

function renderBoard(ctrl: Controller, sendMsg: (msg: any) => void) {
  {
    const controlData = ctrl.getData();
    console.log(ctrl.vm.nodeList);
    console.log(ctrl);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    window.ctrl = ctrl;

    sendMsg({
      type: 'puzzle-state',
      playNumber: ctrl.vm.node.ply,
      maxPlayNumber: ctrl.vm.mainline.length - 1,
      boardFen: ctrl.vm.node.fen,
      pov: ctrl.vm.pov,
      puzzleState: ctrl.vm.lastFeedback,
      puzzle: controlData.puzzle,
      gameId: controlData.game.id,
    });
  }

  return h('div.split-view', [
    h('div.puzzle-chess-board', [chessground(ctrl)]),
    h('div.puzzle-chess-analysis', [renderAnalyse(ctrl)]),
  ]);
}

// that's for the rest of lichess to access chessground
// without having to include it a second time
window.Chessground = Chessground;
