(function (global) {
  'use strict';

  var SITE_KEY = '6Lc8MhctAAAAAO9iyYadykdxz8BkwBYRVOQjhITu';
  var loadPromise = null;
  var SCRIPT_ID = 'irs-recaptcha-script';
  var READY_TIMEOUT_MS = 10000;

  function hasRecaptchaApi() {
    return !!(
      global.grecaptcha &&
      typeof global.grecaptcha.ready === 'function' &&
      typeof global.grecaptcha.execute === 'function'
    );
  }

  function waitForReady() {
    return new Promise(function (resolve, reject) {
      if (!hasRecaptchaApi()) {
        reject(new Error('reCAPTCHA API unavailable'));
        return;
      }

      var done = false;
      var timeoutId = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('reCAPTCHA ready timeout'));
      }, READY_TIMEOUT_MS);

      global.grecaptcha.ready(function () {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        resolve();
      });
    });
  }

  function loadRecaptcha() {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise(function (resolve, reject) {
      if (hasRecaptchaApi()) {
        waitForReady().then(resolve).catch(function (err) {
          loadPromise = null;
          reject(err);
        });
        return;
      }

      var script = document.getElementById(SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(SITE_KEY);
        script.async = true;
        document.head.appendChild(script);
      }

      function onLoad() {
        waitForReady().then(resolve).catch(function (err) {
          loadPromise = null;
          reject(err);
        });
      }

      function onError() {
        loadPromise = null;
        reject(new Error('reCAPTCHA failed to load'));
      }

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    });

    return loadPromise;
  }

  function executeToken(action) {
    return global.grecaptcha.execute(SITE_KEY, { action: action || 'submit' });
  }

  function getToken(action) {
    return loadRecaptcha()
      .then(function () {
        return executeToken(action);
      })
      .catch(function (firstError) {
        // Retry once for transient init races/network flakiness.
        loadPromise = null;
        return loadRecaptcha().then(function () {
          return executeToken(action);
        }).catch(function () {
          throw firstError;
        });
      });
  }

  global.IRSRecaptcha = {
    SITE_KEY: SITE_KEY,
    getToken: getToken
  };
})(window);
