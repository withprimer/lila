import { h } from 'snabbdom';
import { MaybeVNode, Position } from '../interfaces';
import RoundController from '../ctrl';
import { isPlayerTurn, playable } from 'game';

let rang = false;

export default function (ctrl: RoundController, position: Position): MaybeVNode {
  const d = playable(ctrl.data) && ctrl.data.expiration;
  if (!d) return;
  const timeLeft = Math.max(0, d.movedAt - Date.now() + d.millisToMove),
    secondsLeft = Math.floor(timeLeft / 1000),
    myTurn = isPlayerTurn(ctrl.data),
    emerg = myTurn && timeLeft < 8000;
  if (!rang && emerg) {
    lichess.sound.play('lowTime');
    rang = true;
  }
  const side = 'top'; //myTurn != ctrl.flip ? 'bottom' : 'top';
  return h(
    'div.expiration.expiration-' + position,
    {
      class: {
        emerg,
        'bar-glider': myTurn,
      },
    },
    ctrl.trans.vdomPlural('nbSecondsToPlayTheFirstMove', secondsLeft, h('strong', '' + secondsLeft))
  );
}
