import rollupProject from '@build/rollupProject';

export default rollupProject({
  // main: {
  //   name: 'LichessLearn',
  //   input: 'src/main.ts',
  //   output: 'learn',
  // },
  main: {
    name: 'LichessLearnDirect',
    input: 'src/direct.ts',
    output: 'learn',
  },
});
