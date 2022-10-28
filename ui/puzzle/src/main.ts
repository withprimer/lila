import { attributesModule, classModule, init } from 'snabbdom';
import makeCtrl from './ctrl';
import menuHover from 'common/menuHover';
import view from './view/main';
import { Chessground } from 'chessground';
import { PuzzleOpts } from './interfaces';

const patch = init([classModule, attributesModule]);

export default function (opts: PuzzleOpts): void {
  console.log('!!! original game data', opts.data.game);
  const element = document.querySelector('main.puzzle') as HTMLElement;
  const ctrl = makeCtrl(opts, redraw);

  const blueprint = view(ctrl);
  element.innerHTML = '';
  let vnode = patch(element, blueprint);

  function redraw() {
    vnode = patch(vnode, view(ctrl));
  }

  menuHover();
}

// that's for the rest of lichess to access chessground
// without having to include it a second time
window.Chessground = Chessground;
