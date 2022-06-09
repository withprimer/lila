import LichessChat from 'chat';
import {Chessground} from 'chessground';

export function setup() {
  window.addEventListener('message', (msg) => {
    if (msg.data.type === 'challenge-setup') {
      const formData = new FormData();

      formData.append('variant', msg.data.variant || '1');
      formData.append('fen', msg.data.fen || '');
      formData.append('timeMode', msg.data.timeMode || '0');
      formData.append('time', msg.data.time || '5');
      formData.append('time_range', msg.data.time_range || '9');
      formData.append('increment', msg.data.increment || '3');
      formData.append('increment_range', msg.data.increment_range || '3');
      formData.append('days', msg.data.days || '2');
      formData.append('days_range', msg.data.days_range || '2');
      formData.append('mode', msg.data.mode || '0');
      formData.append('ratingRange', msg.data.ratingRange || '');
      formData.append('ratingRange_range_min', msg.data.ratingRange_range_min || '-500');
      formData.append('ratingRange_range_max', msg.data.ratingRange_range_max || '500');
      formData.append('level', msg.data.level || '1');
      formData.append('color', msg.data.color || 'white');

      (async () => {
        try {
          const challengeId = await setupChallenge(formData);
          window.parent.postMessage({ type: 'challenge-setup-result', result: 'success', challengeId }, msg.origin);
        } catch (e) {
          window.parent.postMessage({ type: 'challenge-setup-result', result: 'error' }, msg.origin);
        }
      })();

      return;
    }

    if (msg.data.type === 'challenge-accept') {
      (async () => {
        try {
          const challengeId = await acceptChallenge(msg.data.challengeId);
          window.parent.postMessage({ type: 'challenge-accept-result', result: 'success', challengeId }, msg.origin);
        } catch (e) {
          window.parent.postMessage({ type: 'challenge-accept-result', result: 'error' }, msg.origin);
        }
      })();

      return;
    }

    if (msg.data.type === 'challenge-set-listen') {
      if ((window as any).waitingForChallengeId === msg.data.challengeId) {
        return;
      }
      (window as any).waitingForChallengeId = msg.data.challengeId;

      if (lichess.socket) {
        lichess.socket.disconnect();
      }

      lichess.socket = new lichess.StrongSocket(`/challenge/${msg.data.challengeId}/socket/v6`, 1, {
        events: {
          reload() {
            (async () => {
              const res = await fetch(`/challenge/${msg.data.challengeId}`);
              const text = await res.text();

              /* flag that challenge should redirect means that challenge has strated */
              if (text.indexOf('id="challenge-redirect"') !== -1) {
                window.parent.postMessage({
                  type: 'challenge-event',
                  eventType: 'challenge-started',
                  challengeId: msg.data.challengeId,
                }, msg.origin);
              }
            })();
          },
        },
      });

      return;
    }
  });
}

const acceptChallenge = async (challengeId: string) => {
  const res = await fetch(`/challenge/${challengeId}/accept`, {
    method: 'POST',
  });

  /* submit redirects request to page with status */
  if (res.status === 200) {
    const parts = res.url.split('/');
    return parts[parts.length - 1];
  }

  console.log(res);
  throw new Error('failed to accept challenge');
};

const setupChallenge = async (formData: FormData) => {
  const res = await fetch('/setup/friend', {
    method: 'POST',
    body: formData,
  });

  /* submit redirects request to page with status */
  if (res.status === 200) {
    const parts = res.url.split('/');
    return parts[parts.length - 1];
  }

  console.log(res);
  throw new Error('failed to setup game');
};

window.LichessChat = LichessChat;
window.Chessground = Chessground;
