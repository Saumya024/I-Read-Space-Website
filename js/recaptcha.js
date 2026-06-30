(function (global) {
  'use strict';

  var SITE_KEY = '6Lc8MhctAAAAAO9iyYadykdxz8BkwBYRVOQjhITu';
  var loadPromise = null;
  var SCRIPT_ID = 'irs-recaptcha-script';
  var LOAD_TIMEOUT_MS = 10000;
  var READY_TIMEOUT_MS = 10000;
  var EXECUTE_TIMEOUT_MS = 10000;

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

      // Guard the script download itself. The Google API script can stall
      // indefinitely (slow network, ad-blocker, throttled region) and fire
      // neither `load` nor `error`, which would otherwise hang this promise
      // forever and freeze the booking flow on the "Redirecting" overlay.
      var settled = false;
      var timeoutId = setTimeout(function () {
        if (settled) return;
        settled = true;
        loadPromise = null;
        reject(new Error('reCAPTCHA failed to load (timeout)'));
      }, LOAD_TIMEOUT_MS);

      var script = document.getElementById(SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(SITE_KEY);
        script.async = true;
        document.head.appendChild(script);
      }

      function onLoad() {
        if (settled) return;
        waitForReady().then(function () {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve();
        }).catch(function (err) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          loadPromise = null;
          reject(err);
        });
      }

      function onError() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        loadPromise = null;
        reject(new Error('reCAPTCHA failed to load'));
      }

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    });

    return loadPromise;
  }

  function executeToken(action) {
    var executePromise = global.grecaptcha.execute(SITE_KEY, { action: action || 'submit' });
    var timeoutPromise = new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error('reCAPTCHA execution timeout'));
      }, EXECUTE_TIMEOUT_MS);
    });
    return Promise.race([executePromise, timeoutPromise]);
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
