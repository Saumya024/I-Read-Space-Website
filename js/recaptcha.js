(function (global) {
  'use strict';

  var SITE_KEY = '6Lc8MhctAAAAAO9iyYadykdxz8BkwBYRVOQjhITu';
  var loadPromise = null;

  function loadRecaptcha() {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise(function (resolve, reject) {
      if (global.grecaptcha && typeof global.grecaptcha.execute === 'function') {
        resolve();
        return;
      }

      var script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(SITE_KEY);
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('reCAPTCHA failed to load')); };
      document.head.appendChild(script);
    });

    return loadPromise;
  }

  function getToken(action) {
    return loadRecaptcha().then(function () {
      return global.grecaptcha.execute(SITE_KEY, { action: action || 'submit' });
    });
  }

  global.IRSRecaptcha = {
    SITE_KEY: SITE_KEY,
    getToken: getToken
  };
})(window);
