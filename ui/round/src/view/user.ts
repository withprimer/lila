import { h } from 'snabbdom';
import { Player } from 'game';
import { Position } from '../interfaces';
import RoundController from '../ctrl';

export const aiName = (ctrl: RoundController, level: number) => ctrl.trans('aiNameLevelAiLevel', 'Stockfish', level);

export function userHtml(ctrl: RoundController, player: Player, position: Position) {
  const user = player.user;

  if (user) {
    const connecting = !player.onGame && ctrl.firstSeconds && user.online;
    return h(
      `div.ruser-${position}.ruser.user-link`,
      {
        class: {
          online: player.onGame,
          offline: !player.onGame,
          long: user.username.length > 16,
          connecting,
        },
      },
      [
        h(
          'span.text.ulpt',
          user.title
            ? [
                h('span.utitle', user.title == 'BOT' ? { attrs: { 'data-bot': true } } : {}, user.title),
                ' ',
                user.username,
              ]
            : [user.username]
        ),
        player.engine
          ? h('span', {
              attrs: {
                'data-icon': '',
                title: ctrl.noarg('thisAccountViolatedTos'),
              },
            })
          : null,
      ]
    );
  }
  const connecting = !player.onGame && ctrl.firstSeconds;
  return h(
    `div.ruser-${position}.ruser.user-link`,
    {
      class: {
        online: player.onGame,
        offline: !player.onGame,
        connecting,
      },
    },
    [h('name', player.name || ctrl.noarg('anonymous'))]
  );
}

export function userTxt(ctrl: RoundController, player: Player) {
  if (player.user) {
    return (player.user.title ? player.user.title + ' ' : '') + player.user.username;
  } else if (player.ai) return aiName(ctrl, player.ai);
  else return ctrl.noarg('anonymous');
}
