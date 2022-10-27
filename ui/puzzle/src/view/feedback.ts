import { bind } from 'common/snabbdom';
import { h, VNode } from 'snabbdom';
import { Controller, MaybeVNode } from '../interfaces';
import afterView from './after';

const viewSolution = (ctrl: Controller): VNode =>
  ctrl.streak
    ? h(
        'div.view_solution.skip',
        {
          class: { show: !!ctrl.streak?.data.skip },
        },
        [
          h(
            'a.button.button-empty',
            {
              hook: bind('click', ctrl.skip),
              attrs: {
                title: ctrl.trans.noarg('streakSkipExplanation'),
              },
            },
            ctrl.trans.noarg('skip')
          ),
        ]
      )
    : h(
        'div.view_solution',
        {
          class: { show: ctrl.vm.canViewSolution },
        },
        [
          h(
            'a.button.button-empty',
            {
              hook: bind('click', ctrl.viewSolution),
            },
            'Reveal Solution'
          ),
          // h(
          //   'a.button.button-empty',
          //   {
          //     hook: bind('click', ctrl.skip),
          //   },
          //   'Skip'
          // ),
        ]
      );

const initial = (ctrl: Controller): VNode =>
  h('div.puzzle__feedback.play', [
    h('div.player', [
      // h('div.no-square', h('piece.king.' + ctrl.vm.pov)),
      h('div.instruction', [
        // h('strong', ctrl.trans.noarg('yourTurn')),
        h('em', ctrl.vm.pov === 'white' ? 'White to move.' : 'Black to move.'),
      ]),
    ]),
    viewSolution(ctrl),
  ]);

const good = (ctrl: Controller): VNode =>
  h('div.puzzle__feedback.good', [
    h('div.player', [
      h('div.icon', '✓'),
      h('div.instruction', [h('strong', ctrl.trans.noarg('bestMove')), h('em', ctrl.trans.noarg('keepGoing'))]),
    ]),
    viewSolution(ctrl),
  ]);

const fail = (ctrl: Controller): VNode =>
  h('div.puzzle__feedback.fail', [
    h('div.player', [
      h('div.icon', '✗'),
      h('div.instruction', [
        h('strong', ctrl.trans.noarg('notTheMove')),
        h('em', ctrl.trans.noarg('trySomethingElse')),
      ]),
    ]),
    viewSolution(ctrl),
  ]);

export default function (ctrl: Controller): MaybeVNode {
  if (ctrl.vm.mode === 'view') return afterView(ctrl);
  switch (ctrl.vm.lastFeedback) {
    case 'init':
      return initial(ctrl);
    case 'good':
      return good(ctrl);
    case 'fail':
      return fail(ctrl);
  }
  return;
}
