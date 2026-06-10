/**
 * Cookie consent + marketing tags (loads only after Accept)
 * - Google Tag Manager: GTM-WPK6KBSG
 * - Meta Pixel: 1478746156887728 (Facebook + Instagram ads)
 */
(function () {
  'use strict';

  var GTM_ID = 'GTM-WPK6KBSG';
  var META_PIXEL_ID = '1478746156887728';
  var CONSENT_KEY = 'irs_cookie_consent';
  var CONSENT_VERSION = '1';

  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === CONSENT_VERSION) return parsed.choice;
    } catch (e) {}
    return null;
  }

  function setConsent(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        choice: choice,
        version: CONSENT_VERSION,
        updated: new Date().toISOString()
      }));
    } catch (e) {}
  }

  function loadMetaPixel() {
    if (window.__irsMetaLoaded || !META_PIXEL_ID) return;
    window.__irsMetaLoaded = true;

    var f = window;
    var b = document;
    var e = 'script';
    var v = 'https://connect.facebook.net/en_US/fbevents.js';
    var n, t, s;

    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);

    f.fbq('init', META_PIXEL_ID);
    f.fbq('track', 'PageView');

    if (document.body && !document.getElementById('irs-meta-noscript')) {
      var noscript = document.createElement('noscript');
      noscript.id = 'irs-meta-noscript';
      var img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = 'https://www.facebook.com/tr?id=' + META_PIXEL_ID + '&ev=PageView&noscript=1';
      noscript.appendChild(img);
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }

  function loadGtm() {
    if (window.__irsGtmLoaded) return;
    window.__irsGtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(script);

    if (document.body && !document.getElementById('irs-gtm-noscript')) {
      var noscript = document.createElement('noscript');
      noscript.id = 'irs-gtm-noscript';
      noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID +
        '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }

  function loadMarketingTags() {
    loadGtm();
    loadMetaPixel();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', pushPageEvents);
    } else {
      pushPageEvents();
    }
  }

  function pushPageEvents() {
    var path = (window.location.pathname || '').toLowerCase();

    if (window.dataLayer) {
      if (path.indexOf('schedule') !== -1) {
        window.dataLayer.push({ event: 'view_schedule', page_type: 'schedule' });
      } else if (path.indexOf('intake') !== -1) {
        window.dataLayer.push({ event: 'begin_checkout', page_type: 'intake' });
      } else if (path.indexOf('reserved') !== -1) {
        window.dataLayer.push({ event: 'purchase', page_type: 'reserved' });
      } else if (path === '/' || path.indexOf('index.html') !== -1) {
        window.dataLayer.push({ event: 'view_home', page_type: 'home' });
      }
    }

    if (typeof window.fbq === 'function') {
      if (path.indexOf('schedule') !== -1) {
        window.fbq('track', 'ViewContent', { content_name: 'Session scheduling' });
      } else if (path.indexOf('intake') !== -1) {
        window.fbq('track', 'InitiateCheckout');
      } else if (path.indexOf('reserved') !== -1) {
        window.fbq('track', 'Lead');
      }
    }
  }

  function hideBanner() {
    var banner = document.getElementById('irs-cookie-banner');
    if (banner) banner.remove();
    document.body.classList.remove('irs-cookie-banner-open');
  }

  function showBanner() {
    if (document.getElementById('irs-cookie-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'irs-cookie-banner';
    banner.className = 'irs-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML =
      '<div class="irs-cookie-banner-inner">' +
        '<p class="irs-cookie-banner-text">' +
          'We use cookies for analytics and advertising so we can measure what works. ' +
          'Essential cookies for booking always run. ' +
          '<a href="/privacy.html#cookies">Learn more</a>' +
        '</p>' +
        '<div class="irs-cookie-banner-actions">' +
          '<button type="button" class="irs-cookie-btn irs-cookie-btn-accept" id="irs-cookie-accept">Accept</button>' +
          '<button type="button" class="irs-cookie-btn irs-cookie-btn-reject" id="irs-cookie-reject">Reject non-essential</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    document.body.classList.add('irs-cookie-banner-open');

    document.getElementById('irs-cookie-accept').addEventListener('click', function () {
      setConsent('accepted');
      hideBanner();
      loadMarketingTags();
    });

    document.getElementById('irs-cookie-reject').addEventListener('click', function () {
      setConsent('rejected');
      hideBanner();
    });
  }

  function init() {
    var consent = getConsent();
    if (consent === 'accepted') {
      loadMarketingTags();
    } else if (consent === null) {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
