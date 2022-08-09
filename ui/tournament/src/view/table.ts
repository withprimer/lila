import { h, VNode } from 'snabbdom';
import { onInsert } from 'common/snabbdom';
import { FeaturedGame, TournamentOpts } from '../interfaces';
import TournamentController from '../ctrl';

function featured(game: FeaturedGame, opts: TournamentOpts): VNode {
  return h(
    `div.tour__featured.mini-game.mini-game-${game.id}.mini-game--init.is2d`,
    {
      attrs: {
        'data-state': `${game.fen},${game.orientation},${game.lastMove}`,
        'data-live': game.id,
      },
      hook: onInsert(lichess.powertip.manualUserIn),
    },
    [h('div.cg-wrap')]
  );
}

const initMiniGame = (node: VNode) => lichess.miniGame.initAll(node.elm as HTMLElement);

export default function (ctrl: TournamentController): VNode {
  return h(
    'div.tour__table',
    {
      hook: {
        insert: initMiniGame,
        postpatch: initMiniGame,
      },
    },
    [ctrl.data.featured ? featured(ctrl.data.featured, ctrl.opts) : null]
  );
}
