import * as keyboard from '../keyboard';
import * as util from '../util';
// import crazyView from '../crazy/crazyView';
import RoundController from '../ctrl';
import stepwiseScroll from 'common/wheel';
import {h, VNode} from 'snabbdom';
// import {plyStep} from '../round';
// import {read as readFen} from 'chessground/fen';
// import {render as renderKeyboardMove} from 'keyboardMove';
import {render as renderGround} from '../ground';
import {renderTable} from './table';
// import {renderMaterialDiffs} from 'game/view/material';

export function main(ctrl: RoundController): VNode {
    const d = ctrl.data;
    const cgState = ctrl.chessground && ctrl.chessground.state;

    if (window.parent !== window && cgState) {
        const msg = {
            type: 'chess-round-state',
            turnColor: cgState.turnColor,
            orientation: cgState.orientation,
            opponent: {
                color: ctrl.data.opponent?.color,
            },
            player: {
                color: ctrl.data.player?.color,
            },
            playNumber: ctrl.ply,
        };

        window.parent.postMessage(msg, '*');
    }

    // const topColor = d[ctrl.flip ? 'player' : 'opponent'].color;
    // bottomColor = d[ctrl.flip ? 'opponent' : 'player'].color,
    // const pieces = cgState ? cgState.pieces : readFen(plyStep(ctrl.data, ctrl.ply).fen);
    // const materialDiffs = renderMaterialDiffs(
    //     ctrl.data.pref.showCaptured,
    //     ctrl.flip ? ctrl.data.opponent.color : ctrl.data.player.color,
    //     pieces,
    //     !!(ctrl.data.player.checks || ctrl.data.opponent.checks), // showChecks
    //     ctrl.data.steps,
    //     ctrl.ply
    // );

    const table = renderTable(ctrl);

    /* filter out parts of the side table we don't want */
    const renderTableParts = [];
    for (let i = 0; i < table.length - 3; ++i) {
        const component = table[i];
        if (!component) {
            continue;
        }

        /* remove analysis button because that page hasn't been updated */
        if (component.sel === 'rm6') {
            const buttons = component.children?.[0] as VNode | null;
            if (buttons && buttons.sel === 'div.buttons') {
                buttons.children = buttons.children?.filter(c => {
                    const child = c as VNode | null;
                    return child?.sel?.indexOf('a.') !== 0;
                });
            }
        }

        /* remove rematch button because it breaks things */
        if (component.sel === 'div.rcontrols') {
            const firstChild = component?.children?.[0] as VNode;
            if (firstChild?.sel === 'div.follow-up') {
                continue;
            }
        }

        renderTableParts.push(component);
    }

    return ctrl.nvui
        ? ctrl.nvui.render(ctrl)
        : h('div.round__app.variant-' + d.game.variant.key, [
            h(
                'div.round__app__board.main-board' + (ctrl.data.pref.blindfold ? '.blindfold' : ''),
                {
                    hook:
                        'ontouchstart' in window || lichess.storage.get('scrollMoves') == '0'
                            ? undefined
                            : util.bind(
                                'wheel',
                                stepwiseScroll((e: WheelEvent, scroll: boolean) => {
                                    if (!ctrl.isPlaying()) {
                                        e.preventDefault();
                                        if (e.deltaY > 0 && scroll) keyboard.next(ctrl);
                                        else if (e.deltaY < 0 && scroll) keyboard.prev(ctrl);
                                        ctrl.redraw();
                                    }
                                }),
                                undefined,
                                false
                            ),
                },
                [renderGround(ctrl), ctrl.promotion.view(ctrl.data.game.variant.key === 'antichess')]
            ),
            h('div', renderTableParts),
            // crazyView(ctrl, topColor, 'top') || materialDiffs[0],
            // ctrl.keyboardHelp ? keyboard.view(ctrl) : null,
            // ctrl.keyboardMove ? renderKeyboardMove(ctrl.keyboardMove) : null,
            // h('div', [
            //     // ctrl.keyboardHelp ? keyboard.view(ctrl) : null,
            //     // crazyView(ctrl, topColor, 'top') || materialDiffs[0],
            //     ...renderTable(ctrl),
            //     // crazyView(ctrl, bottomColor, 'bottom') || materialDiffs[1],
            // ])
        ]);
}
