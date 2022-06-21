import rollupProject from '@build/rollupProject';

export default rollupProject({
  main: {
    name: 'LichessRound',
    input: 'src/main.ts',
    output: 'round',
  },
  nvui: {
    name: 'LichessRoundNvui',
    input: 'src/plugins/nvui.ts',
    output: 'round.nvui',
  },
  direct: {
    name: 'LichessRound',
    input: 'src/direct.ts',
    output: 'round.direct',
  },
});
