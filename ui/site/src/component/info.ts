/// <reference types="../../types/info" />
import LogRocket from 'logrocket';

console.info('Lichess is open source! https://lichess.org/source');

LogRocket.init('uqsxya/live-primer', {
  mergeIframes: true,
  parentDomain: 'https://primer.com',
  rootHostname: 'https://primer.com',
});
console.info('initialized logrocket for all components; in info.ts; 3');

const info = __info__;

export default info;
