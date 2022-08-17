import { h } from 'snabbdom';
import { Player } from 'game';
import { RoundPosition } from './interfaces';
import AnalyseCtrl from './ctrl';

export const aiName = (ctrl: AnalyseCtrl, level: number) => `Computer level ${level}`;

export function userHtml(ctrl: AnalyseCtrl, player: Player, position: RoundPosition) {
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
                title: 'This account violated the Lichess Terms of Service',
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
    [h('name', player.name || 'Anonymous')]
  );
}

export function userTxt(ctrl: AnalyseCtrl, player: Player) {
  if (player.user) {
    return (player.user.title ? player.user.title + ' ' : '') + player.user.username;
  } else if (player.ai) return aiName(ctrl, player.ai);
  else return 'Anonymous';
}
