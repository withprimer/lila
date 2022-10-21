import { h } from 'snabbdom';
import { Position, MaybeVNodes } from '../interfaces';
import * as game from 'game';
import * as status from 'game/status';
import { renderClock } from '../clock/clockView';
import renderCorresClock from '../corresClock/corresClockView';
import * as replay from './replay';
import renderExpiration from './expiration';
import * as renderUser from './user';
import * as button from './button';
import RoundController from '../ctrl';
import { isPlayerTurn } from 'game';

export function renderPlayer(ctrl: RoundController, position: Position) {
  const player = ctrl.playerAt(position);
  return ctrl.nvui
    ? undefined
    : player.ai
    ? h('div.user-link.online.ruser.ruser-' + position, [h('name', renderUser.aiName(ctrl, player.ai))])
    : renderUser.userHtml(ctrl, player, position);
}

const isLoading = (ctrl: RoundController): boolean => ctrl.loading || ctrl.redirecting;

const loader = () => h('i.ddloader');

const renderTableWith = (ctrl: RoundController, buttons: MaybeVNodes) => [
  replay.render(ctrl),
  buttons.find(x => !!x) ? h('div.rcontrols', buttons) : null,
];

// note: we folded in the rematch/follow up logic inside of the table due to the styling restrictions
export const renderTableEnd = (ctrl: RoundController) => [replay.render(ctrl)];

export const renderTableWatch = (ctrl: RoundController) =>
  renderTableWith(ctrl, [
    isLoading(ctrl) ? loader() : game.playable(ctrl.data) ? undefined : button.watcherFollowUp(ctrl),
  ]);

export const renderTablePlay = (ctrl: RoundController) => {
  const d = ctrl.data,
    loading = isLoading(ctrl),
    submit = button.submitMove(ctrl),
    icons =
      loading || submit
        ? []
        : [
            game.abortable(d)
              ? button.standard(ctrl, undefined, '', 'abortGame', 'abort')
              : button.standard(ctrl, game.takebackable, '', 'proposeATakeback', 'takeback-yes', ctrl.takebackYes),
            ctrl.data.game.threefold
              ? button.claimThreefold(ctrl)
              : button.standard(ctrl, ctrl.canOfferDraw, '2', 'offerDraw', 'draw-yes', () =>
                  ctrl.offerDraw(true, true)
                ),
            button.standard(ctrl, game.moretimeable, '', 'giveMoreTime', 'moretime', () => ctrl.socket.moreTime()),
            button.standard(ctrl, game.resignable, '', 'resign', 'resign', () => ctrl.resign(true, true)),
          ],
    buttons: MaybeVNodes = loading
      ? [loader()]
      : submit
      ? [submit]
      : [
          button.opponentGone(ctrl),
          button.threefoldSuggestion(ctrl),
          button.cancelDrawOffer(ctrl),
          button.answerOpponentDrawOffer(ctrl),
          button.cancelTakebackProposition(ctrl),
          button.answerOpponentTakebackProposition(ctrl),
        ];

  return [
    replay.render(ctrl),
    h('div.rcontrols', [
      h(
        'div.ricons',
        {
          class: { confirm: !!(ctrl.drawConfirm || ctrl.resignConfirm) },
        },
        icons
      ),
      ...buttons,
    ]),
  ];
};

function whosTurn(ctrl: RoundController, color: Color, position: Position) {
  const d = ctrl.data;
  if (status.finished(d) || status.aborted(d)) return;
  return h('div.rclock.rclock-turn.rclock-' + position, [
    d.game.player === color
      ? h(
          'div.rclock-turn__text',
          d.player.spectator
            ? ctrl.trans(d.game.player + 'Plays')
            : ctrl.trans(d.game.player === d.player.color ? 'yourTurn' : 'waitingForOpponent')
        )
      : null,
  ]);
}

export function anyClock(ctrl: RoundController, position: Position) {
  const player = ctrl.playerAt(position);
  if (ctrl.clock) return renderClock(ctrl, player, position);
  else if (ctrl.data.correspondence && ctrl.data.game.turns > 1)
    return renderCorresClock(ctrl.corresClock!, ctrl.trans, player.color, position, ctrl.data.game.player);
  else return whosTurn(ctrl, player.color, position);
}

export const renderTable = (ctrl: RoundController): MaybeVNodes => [
  // isPlayerTurn(ctrl.data)
  //   ? h('div.round__app__table', [
  //       !ctrl.isInitialMobile ? anyClock(ctrl, 'top') : undefined,
  //       ...(ctrl.data.player.spectator
  //         ? renderTableWatch(ctrl)
  //         : game.playable(ctrl.data)
  //         ? renderTablePlay(ctrl)
  //         : renderTableEnd(ctrl)),
  //       !ctrl.isInitialMobile ? anyClock(ctrl, 'bottom') : undefined,
  //       renderExpiration(ctrl, 'bottom'),
  //     ])
  //   : h('div.round__app__table', [
  //       renderExpiration(ctrl, 'top'),
  //       !ctrl.isInitialMobile ? anyClock(ctrl, 'top') : undefined,
  //       ...(ctrl.data.player.spectator
  //         ? renderTableWatch(ctrl)
  //         : game.playable(ctrl.data)
  //         ? renderTablePlay(ctrl)
  //         : renderTableEnd(ctrl)),
  //       !ctrl.isInitialMobile ? anyClock(ctrl, 'bottom') : undefined,
  //     ]),
  h('div.round__app__table', [
    renderExpiration(ctrl),
    !ctrl.isInitialMobile ? anyClock(ctrl, 'top') : undefined,
    ...(ctrl.data.player.spectator
      ? renderTableWatch(ctrl)
      : game.playable(ctrl.data)
      ? renderTablePlay(ctrl)
      : renderTableEnd(ctrl)),
    !ctrl.isInitialMobile ? anyClock(ctrl, 'bottom') : undefined,
  ]),
];
