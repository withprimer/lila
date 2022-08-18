(function (window, undefined) {
  let LichessCookieInjector = {};

  if (typeof window !== 'undefined') {
    return;
  }

  if (window.LichessCookieInjector) {
    return;
  }
  LichessCookieInjector.injectCookie = function (cookie, secure) {
    console.log('about to set lichess cookie, cookie, secure', cookie, secure);
    console.log('hostname=', window.location.hostname);
    const fullCookie = `lila2=${cookie || ''} ` + '; Path=/ ' + '; SameSite=None ' + `; Secure=${secure} `;

    document.cookie = fullCookie;
  };

  window.LichessCookieInjector = LichessCookieInjector;
})(this);

console.log('!! initialization hostname=', window.location.hostname);
