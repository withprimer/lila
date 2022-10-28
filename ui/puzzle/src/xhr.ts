import * as xhr from 'common/xhr';
import PuzzleStreak from './streak';
import throttle from 'common/throttle';
import { defined } from 'common';
import { PuzzleReplay, PuzzleResult, ThemeKey } from './interfaces';
import { StoredBooleanProp } from 'common/storage';
import { readNdJson, CancellableStream } from 'common/ndjson';
import { sync } from 'common/sync';

export const complete = (
  puzzleId: string,
  theme: ThemeKey,
  win: boolean,
  rated: StoredBooleanProp,
  replay?: PuzzleReplay,
  streak?: PuzzleStreak
): Promise<PuzzleResult> =>
  xhr.json(`/training/complete/${theme}/${puzzleId}`, {
    method: 'POST',
    body: xhr.form({
      win,
      ...(replay ? { replayDays: replay.days } : {}),
      ...(streak ? { streakId: streak.nextId(), streakScore: streak.data.index } : {}),
      rated: rated(),
    }),
  });

export const vote = (puzzleId: string, vote: boolean): Promise<void> =>
  xhr.json(`/training/${puzzleId}/vote`, {
    method: 'POST',
    body: xhr.form({ vote }),
  });

export const voteTheme = (puzzleId: string, theme: ThemeKey, vote: boolean | undefined): Promise<void> =>
  xhr.json(`/training/${puzzleId}/vote/${theme}`, {
    method: 'POST',
    body: defined(vote) ? xhr.form({ vote }) : undefined,
  });

export const setZen = throttle(1000, zen =>
  xhr.text('/pref/zen', {
    method: 'post',
    body: xhr.form({ zen: zen ? 1 : 0 }),
  })
);
const explorerError = (err: Error) => ({
  cancel() {},
  end: sync(Promise.resolve(err)),
});

export const getPuzzleGame = async (gameId: string): Promise<void> => {
  try {
    const res = await fetch(`https://lichess.org/game/export/${gameId}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'default',
    });
    // const saveAndShow = (html: string) => {
    //   cache.set(path, html);
    //   show(html);
    // };
    if (res.ok) {
      const json = await res.json();
      // const page = json.query.pages[0];
      // if (page.missing) saveAndShow('');
      // else if (page.invalid) show('invalid request: ' + page.invalidreason);
      // else if (!page.extract) show('error: unexpected API response:<br><pre>' + JSON.stringify(page) + '</pre>');
      // else saveAndShow(transform(page.extract, title));
      console.log('!!! game RETRIEVED', res);
      console.log('!!! json RETRIEVED', json);
    } //else saveAndShow('');
  } catch (err) {
    console.log('error: ' + err);
  }

  // const data = await response.json();
  // console.log('retrieved', data);
  // if (data) {
  //   const puzzleGame: PuzzleGame = {
  //     id: data.id;
  //   };
  //   }
  // }
  // return data || PuzzleGame;
  // return data;
};
