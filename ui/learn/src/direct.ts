import m from './mithrilFix';
import * as stages from './stage/list';

import chessground from "chessground";
import * as ground from "./ground";
import makeLevel from './level';
import {Stage} from "./stage/list";

export default function (element: Element) {
    const render = (stageId: number, levelId: number, origin: string | null) => {
        const stage = stages.byId[stageId];
        makeLevel(stage.levels[levelId], {
            onComplete: () => {
                if (origin) {
                    window.parent.postMessage({type: 'level-done'}, 'http://test-page.local');
                }
            },
            onCompleteImmediate: () => {
                return;
            },
        });

        m.render(
            element,
            m('div.learn__main', [chessground.view(ground.instance)])
        );
    };

    window.addEventListener('message', (event) => {
        const message = event.data;

        if (message.type === 'get-stages') {
            window.parent.postMessage({
                type: 'stages',
                stages: Object.values(stages.byId).map((stage: Stage) => ({
                    id: stage.id,
                    key: stage.key,
                    levelCount: stage.levels.length
                })),
            }, event.origin);
        } else if (message.type === 'set-stage') {
            render(message.stageId, message.levelId, event.origin);
        }
    });

    window.parent.postMessage({
        type: 'page-ready'
    }, 'http://test-page.local');

    return {};
}
