import { view as cevalView } from 'ceval';
import { read as readFen } from 'chessground/fen';
import { parseFen } from 'chessops/fen';
import { defined } from 'common';
import {
  bind,
  bindNonPassive,
  bindMobileMousedown,
  MaybeVNode,
  MaybeVNodes,
  onInsert,
  dataIcon,
} from 'common/snabbdom';
import { getPlayer } from 'game';
import * as materialView from 'game/view/material';
import statusView from 'game/view/status';
import { h, VNode } from 'snabbdom';
import { ops as treeOps, path as treePath } from 'tree';
import { view as actionMenu } from './actionMenu';
import renderClocks from './clocks';
import * as control from './control';
import crazyView from './crazy/crazyView';
import AnalyseCtrl from './ctrl';
import explorerView from './explorer/explorerView';
import { view as forkView } from './fork';
import * as gridHacks from './gridHacks';
import * as chessground from './ground';
import { ConcealOf, RoundPosition } from './interfaces';
import { view as keyboardView } from './keyboard';
import * as pgnExport from './pgnExport';
import practiceView from './practice/practiceView';
import retroView from './retrospect/retroView';
import * as gbEdit from './study/gamebook/gamebookEdit';
import * as gbPlay from './study/gamebook/gamebookPlayView';
import { StudyCtrl } from './study/interfaces';
import renderPlayerBars from './study/playerBars';
import relayManager from './study/relay/relayManagerView';
import relayTour from './study/relay/relayTourView';
import { findTag } from './study/studyChapters';
import * as studyView from './study/studyView';
import { render as renderTreeView } from './treeView/treeView';
import { spinnerVdom as spinner } from 'common/spinner';
import stepwiseScroll from 'common/wheel';
import * as renderUser from './user';

function renderResult(ctrl: AnalyseCtrl): VNode[] {
  const render = (result: string, status: MaybeVNodes) => [h('div.result', result), h('div.status', status)];
  if (ctrl.data.game.status.id >= 30) {
    let result;
    switch (ctrl.data.game.winner) {
      case 'white':
        result = '1-0';
        break;
      case 'black':
        result = '0-1';
        break;
      default:
        result = '½-½';
    }
    const winner = getPlayer(ctrl.data, ctrl.data.game.winner!);
    return render(result, [
      statusView(ctrl),
      winner ? ' • ' + ctrl.trans(winner.color == 'white' ? 'whiteIsVictorious' : 'blackIsVictorious') : null,
    ]);
  } else if (ctrl.study) {
    const result = findTag(ctrl.study.data.chapter.tags, 'result');
    if (!result || result === '*') return [];
    if (result === '1-0') return render(result, [ctrl.trans.noarg('whiteIsVictorious')]);
    if (result === '0-1') return render(result, [ctrl.trans.noarg('blackIsVictorious')]);
    return render('½-½', [ctrl.trans.noarg('draw')]);
  }
  return [];
}

function makeConcealOf(ctrl: AnalyseCtrl): ConcealOf | undefined {
  const conceal =
    ctrl.study && ctrl.study.data.chapter.conceal !== undefined
      ? {
          owner: ctrl.study.isChapterOwner(),
          ply: ctrl.study.data.chapter.conceal,
        }
      : null;
  if (conceal)
    return (isMainline: boolean) => (path: Tree.Path, node: Tree.Node) => {
      if (!conceal || (isMainline && conceal.ply >= node.ply)) return null;
      if (treePath.contains(ctrl.path, path)) return null;
      return conceal.owner ? 'conceal' : 'hide';
    };
  return undefined;
}

export const renderNextChapter = (ctrl: AnalyseCtrl) =>
  !ctrl.embed && ctrl.study?.hasNextChapter()
    ? h(
        'button.next.text',
        {
          attrs: {
            'data-icon': '',
            type: 'button',
          },
          hook: bind('click', ctrl.study.goToNextChapter),
          class: {
            highlighted: !!ctrl.outcome() || ctrl.node == treeOps.last(ctrl.mainline),
          },
        },
        ctrl.trans.noarg('nextChapter')
      )
    : null;

const renderAnalyse = (ctrl: AnalyseCtrl, concealOf?: ConcealOf) =>
  h('div.analyse__moves.areplay', [
    h('div', [
      ctrl.embed && ctrl.study ? h('div.chapter-name', ctrl.study.currentChapter().name) : null,
      renderTreeView(ctrl, concealOf),
      ...renderResult(ctrl),
    ]),
    !ctrl.practice && !gbEdit.running(ctrl) ? renderNextChapter(ctrl) : null,
  ]);

const jumpButton = (icon: string, effect: string, enabled: boolean): VNode =>
  h('button.fbt', {
    class: { disabled: !enabled },
    attrs: { 'data-act': effect, 'data-icon': icon },
  });

const dataAct = (e: Event): string | null => {
  const target = e.target as HTMLElement;
  return target.getAttribute('data-act') || (target.parentNode as HTMLElement).getAttribute('data-act');
};

function repeater(ctrl: AnalyseCtrl, action: 'prev' | 'next', e: Event) {
  const repeat = () => {
    control[action](ctrl);
    ctrl.redraw();
    delay = Math.max(100, delay - delay / 15);
    timeout = setTimeout(repeat, delay);
  };
  let delay = 350;
  let timeout = setTimeout(repeat, 500);
  control[action](ctrl);
  const eventName = e.type == 'touchstart' ? 'touchend' : 'mouseup';
  document.addEventListener(eventName, () => clearTimeout(timeout), { once: true });
}

function controls(ctrl: AnalyseCtrl) {
  const canJumpPrev = ctrl.path !== '',
    canJumpNext = !!ctrl.node.children[0],
    menuIsOpen = ctrl.actionMenu.open,
    noarg = ctrl.trans.noarg;
  return h(
    'div.analyse__controls.analyse-controls',
    {
      hook: onInsert(el => {
        bindMobileMousedown(
          el,
          e => {
            const action = dataAct(e);
            if (action === 'prev' || action === 'next') repeater(ctrl, action, e);
            else if (action === 'first') control.first(ctrl);
            else if (action === 'last') control.last(ctrl);
            else if (action === 'explorer') ctrl.toggleExplorer();
            else if (action === 'practice') ctrl.togglePractice();
            else if (action === 'menu') ctrl.actionMenu.toggle();
            else if (action === 'analysis' && ctrl.studyPractice)
              window.open(ctrl.studyPractice.analysisUrl(), '_blank', 'noopener');
          },
          ctrl.redraw
        );
      }),
    },
    [
      // ctrl.embed
      //   ? null
      //   : h(
      //       'div.features',
      //       ctrl.studyPractice
      //         ? [
      //             h('button.fbt', {
      //               attrs: {
      //                 title: noarg('analysis'),
      //                 'data-act': 'analysis',
      //                 'data-icon': '',
      //               },
      //             }),
      //           ]
      //         : [
      //             // h('button.fbt', {
      //             //   attrs: {
      //             //     title: noarg('openingExplorerAndTablebase'),
      //             //     'data-act': 'explorer',
      //             //     'data-icon': '',
      //             //   },
      //             //   class: {
      //             //     hidden: menuIsOpen || !ctrl.explorer.allowed() || !!ctrl.retro,
      //             //     active: ctrl.explorer.enabled(),
      //             //   },
      //             // }),
      //             ctrl.ceval.possible && ctrl.ceval.allowed() && !ctrl.isGamebook()
      //               ? h('button.fbt', {
      //                   attrs: {
      //                     title: noarg('practiceWithComputer'),
      //                     'data-act': 'practice',
      //                     'data-icon': '',
      //                   },
      //                   class: {
      //                     hidden: menuIsOpen || !!ctrl.retro,
      //                     active: !!ctrl.practice,
      //                   },
      //                 })
      //               : null,
      //           ]
      // ),
      h('div.jumps', [
        jumpButton('', 'first', canJumpPrev),
        jumpButton('', 'prev', canJumpPrev),
        jumpButton('', 'next', canJumpNext),
        jumpButton('', 'last', canJumpNext),
      ]),
    ]
  );
}

function forceInnerCoords(ctrl: AnalyseCtrl, v: boolean) {
  if (ctrl.data.pref.coords === Prefs.Coords.Outside) {
    $('body').toggleClass('coords-in', v).toggleClass('coords-out', !v);
  }
}

const addChapterId = (study: StudyCtrl | undefined, cssClass: string) =>
  cssClass + (study && study.data.chapter ? '.' + study.data.chapter.id : '');

const analysisDisabled = (ctrl: AnalyseCtrl): MaybeVNode =>
  ctrl.ceval.possible && ctrl.ceval.allowed()
    ? h('div.comp-off__hint', [
        h('span', ctrl.trans.noarg('computerAnalysisDisabled')),
        h(
          'button',
          {
            hook: bind('click', ctrl.toggleComputer, ctrl.redraw),
            attrs: { type: 'button' },
          },
          ctrl.trans.noarg('enable')
        ),
      ])
    : undefined;

export function renderMaterialDiffs(ctrl: AnalyseCtrl): [VNode, VNode] {
  const cgState = ctrl.chessground?.state,
    pieces = cgState ? cgState.pieces : readFen(ctrl.node.fen);

  return materialView.renderMaterialDiffs(
    !!ctrl.data.pref.showCaptured,
    ctrl.bottomColor(),
    pieces,
    !!(ctrl.data.player.checks || ctrl.data.opponent.checks), // showChecks
    ctrl.nodeList,
    ctrl.node.ply
  );
}

const renderPlayerStrip = (cls: string, materialDiff: VNode, clock?: VNode): VNode =>
  h('div.analyse__player_strip.' + cls, [materialDiff, clock]);

export function renderPlayer(ctrl: AnalyseCtrl, position: RoundPosition) {
  const player = ctrl.playerAt(position);
  return ctrl.nvui
    ? undefined
    : player.ai
    ? h('div.user-link.online.ruser.ruser-' + position, [h('name', renderUser.aiName(ctrl, player.ai))])
    : renderUser.userHtml(ctrl, player, position);
}

export default function (ctrl: AnalyseCtrl): VNode {
  if (ctrl.nvui) return ctrl.nvui.render(ctrl);
  const concealOf = makeConcealOf(ctrl),
    study = ctrl.study,
    showCevalPvs = !(ctrl.retro && ctrl.retro.isSolving()) && !ctrl.practice,
    menuIsOpen = ctrl.actionMenu.open,
    gamebookPlay = ctrl.gamebookPlay(),
    gamebookPlayView = gamebookPlay && gbPlay.render(gamebookPlay),
    gamebookEditView = gbEdit.running(ctrl) ? gbEdit.render(ctrl) : undefined,
    playerBars = renderPlayerBars(ctrl),
    gaugeOn = ctrl.showEvalGauge(),
    needsInnerCoords = !!gaugeOn || !!playerBars,
    tour = relayTour(ctrl),
    materialDiffs = renderMaterialDiffs(ctrl),
    clocks = renderClocks(ctrl),
    whitePov = ctrl.bottomIsWhite();

  return h(
    'main.analyse.variant-' + ctrl.data.game.variant.key,
    {
      hook: {
        insert: vn => {
          const elm = vn.elm as HTMLElement;
          forceInnerCoords(ctrl, needsInnerCoords);
          if (!!playerBars != $('body').hasClass('header-margin')) {
            requestAnimationFrame(() => {
              $('body').toggleClass('header-margin', !!playerBars);
              ctrl.redraw();
            });
          }
          gridHacks.start(elm);
        },
        update(_, _2) {
          forceInnerCoords(ctrl, needsInnerCoords);
        },
        postpatch(old, vnode) {
          if (old.data!.gaugeOn !== gaugeOn) document.body.dispatchEvent(new Event('chessground.resize'));
          vnode.data!.gaugeOn = gaugeOn;
        },
      },
      class: {
        'comp-off': !ctrl.showComputer(),
        'gauge-on': gaugeOn,
        'has-players': !!playerBars,
        'gamebook-play': !!gamebookPlayView,
        'has-relay-tour': !!tour,
        'analyse-hunter': ctrl.opts.hunter,
        'analyse--wiki': !!ctrl.wiki && !ctrl.study,
      },
    },
    [
      ctrl.keyboardHelp ? keyboardView(ctrl) : null,
      study ? studyView.overboard(study) : null,

      h('div.left', [
        h('div.user-info.user-info-top', [
          renderPlayer(ctrl, 'top'),
          renderPlayerStrip('top', materialDiffs[0], clocks?.[whitePov ? 1 : 0]),
        ]),
        tour ||
          h(
            addChapterId(study, 'div.analyse__board.main-board'),
            {
              hook:
                'ontouchstart' in window || lichess.storage.get('scrollMoves') == '0'
                  ? undefined
                  : bindNonPassive(
                      'wheel',
                      stepwiseScroll((e: WheelEvent, scroll: boolean) => {
                        if (ctrl.gamebookPlay()) return;
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'PIECE' && target.tagName !== 'SQUARE' && target.tagName !== 'CG-BOARD')
                          return;
                        e.preventDefault();
                        if (e.deltaY > 0 && scroll) control.next(ctrl);
                        else if (e.deltaY < 0 && scroll) control.prev(ctrl);
                        ctrl.redraw();
                      })
                    ),
            },
            [chessground.render(ctrl), ctrl.promotion.view(ctrl.data.game.variant.key === 'antichess')]
          ),
        h('div.user-info.user-info-bottom', [
          renderPlayer(ctrl, 'bottom'),
          renderPlayerStrip('bottom', materialDiffs[1], clocks?.[whitePov ? 0 : 1]),
        ]),
      ]),
      h('div.right.analyse__table', [
        menuIsOpen || tour ? null : crazyView(ctrl, ctrl.topColor(), 'top'),
        gamebookPlayView || tour ? null : controls(ctrl),
        gamebookPlayView ||
          (tour
            ? null
            : h(addChapterId(study, 'div.analyse__tools'), [
                ...(menuIsOpen
                  ? [actionMenu(ctrl)]
                  : [
                      renderAnalyse(ctrl, concealOf),
                      gamebookEditView || forkView(ctrl, concealOf),
                      retroView(ctrl) || practiceView(ctrl) || explorerView(ctrl),
                    ]),
              ])),
        menuIsOpen || tour ? null : crazyView(ctrl, ctrl.bottomColor(), 'bottom'),
      ]),
      study && study.relay && relayManager(study.relay),
    ]
  );
}
