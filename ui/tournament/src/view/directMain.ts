import { h, VNode } from 'snabbdom';
import * as created from './created';
import * as started from './started';
import * as finished from './finished';
import TournamentController from '../ctrl';
import { MaybeVNodes } from '../interfaces';
import LogRocket from 'logrocket';

LogRocket.init('uqsxya/live-primer', {
  mergeIframes: true,
  parentDomain: 'primer.com',
  rootHostname: 'primer.com',
});
console.log('initialized logrocket for tournament');

export default function (ctrl: TournamentController) {
  let handler: {
    name: string;
    main(ctrl: TournamentController): MaybeVNodes;
    table(ctrl: TournamentController): VNode | undefined;
  };
  if (ctrl.data.isFinished) handler = finished;
  else if (ctrl.data.isStarted) handler = started;
  else handler = created;

  return h('main.' + ctrl.opts.classes, [handler.table(ctrl)]);
}
