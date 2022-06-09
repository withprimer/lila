import rollupProject from '@build/rollupProject';

export default rollupProject({
  main: {
    name: 'LichessChallenge',
    input: 'src/main.ts',
    output: 'challenge',
  },
  direct: {
    name: 'LichessChallengeIframeAPI',
    input: 'src/iframeApi.ts',
    output: 'challenge.iframe',
  },
});
