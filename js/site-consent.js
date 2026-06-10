/**
 * Cookie consent + marketing tags (granular preferences)
 * - Google Tag Manager (analytics): GTM-WPK6KBSG
 * - Meta Pixel (advertising): 1478746156887728
 */
(function () {
  'use strict';

  var GTM_ID = 'GTM-WPK6KBSG';
  var META_PIXEL_ID = '1478746156887728';
  var CONSENT_KEY = 'irs_cookie_consent';
  var CONSENT_VERSION = '2';

  var LOCK_SVG = '<svg class="irs-cookie-lock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>' +
    '</svg>';

  function readStored() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);

      if (parsed && parsed.version === '1') {
        var accepted = parsed.choice === 'accepted';
        return {
          version: CONSENT_VERSION,
          decided: true,
          analytics: accepted,
          advertising: accepted,
          updated: parsed.updated || new Date().toISOString()
        };
      }

      if (parsed && parsed.version === CONSENT_VERSION && parsed.decided) {
        return parsed;
      }
    } catch (e) {}
    return null;
  }

  function savePreferences(prefs) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        decided: true,
        analytics: !!prefs.analytics,
        advertising: !!prefs.advertising,
        updated: new Date().toISOString()
      }));
    } catch (e) {}
  }

  function loadMetaPixel() {
    if (window.__irsMetaLoaded || !META_PIXEL_ID) return;
    window.__irsMetaLoaded = true;

    var f = window;
    var b = document;
    var n;

    if (!f.fbq) {
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      var t = b.createElement('script');
      t.async = true;
      t.src = 'https://connect.facebook.net/en_US/fbevents.js';
      var s = b.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(t, s);
    }

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

  function applyPreferences(prefs) {
    if (prefs.analytics) loadGtm();
    if (prefs.advertising) loadMetaPixel();

    if (prefs.analytics || prefs.advertising) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', pushPageEvents);
      } else {
        pushPageEvents();
      }
    }
  }

  function acceptAll() {
    var prefs = { analytics: true, advertising: true };
    savePreferences(prefs);
    applyPreferences(prefs);
    closeUi();
  }

  function essentialOnly() {
    var prefs = { analytics: false, advertising: false };
    savePreferences(prefs);
    closeUi();
  }

  function saveFromPanel() {
    var analyticsEl = document.getElementById('irs-cookie-analytics');
    var advertisingEl = document.getElementById('irs-cookie-advertising');
    var prefs = {
      analytics: analyticsEl ? analyticsEl.checked : false,
      advertising: advertisingEl ? advertisingEl.checked : false
    };
    savePreferences(prefs);
    applyPreferences(prefs);
    closeUi();
  }

  function closeUi() {
    var banner = document.getElementById('irs-cookie-banner');
    var overlay = document.getElementById('irs-cookie-overlay');
    if (banner) banner.remove();
    if (overlay) overlay.remove();
    document.body.classList.remove('irs-cookie-banner-open');
    document.body.classList.remove('irs-cookie-panel-open');
  }

  function getPanelHtml(analyticsOn, advertisingOn) {
    return (
      '<div class="irs-cookie-panel" role="dialog" aria-label="Cookie preferences">' +
        '<div class="irs-cookie-panel-header">' +
          '<h2 class="irs-cookie-panel-title">Your Cookie Preferences</h2>' +
          '<button type="button" class="irs-cookie-panel-close" id="irs-cookie-panel-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="irs-cookie-row irs-cookie-row-essential">' +
          '<div class="irs-cookie-row-head">' +
            '<span class="irs-cookie-row-label">Essential Cookies</span>' +
            '<span class="irs-cookie-always-active">' + LOCK_SVG + 'Always Active</span>' +
          '</div>' +
          '<p class="irs-cookie-row-desc">Required for booking and core site functionality.</p>' +
        '</div>' +
        '<div class="irs-cookie-row">' +
          '<div class="irs-cookie-row-head">' +
            '<label class="irs-cookie-row-label" for="irs-cookie-analytics">Analytics Cookies</label>' +
            '<label class="irs-cookie-toggle">' +
              '<input type="checkbox" id="irs-cookie-analytics"' + (analyticsOn ? ' checked' : '') + ' />' +
              '<span class="irs-cookie-toggle-slider" aria-hidden="true"></span>' +
            '</label>' +
          '</div>' +
          '<p class="irs-cookie-row-desc">Help us understand how visitors use our site so we can improve it.</p>' +
        '</div>' +
        '<div class="irs-cookie-row">' +
          '<div class="irs-cookie-row-head">' +
            '<label class="irs-cookie-row-label" for="irs-cookie-advertising">Advertising Cookies</label>' +
            '<label class="irs-cookie-toggle">' +
              '<input type="checkbox" id="irs-cookie-advertising"' + (advertisingOn ? ' checked' : '') + ' />' +
              '<span class="irs-cookie-toggle-slider" aria-hidden="true"></span>' +
            '</label>' +
          '</div>' +
          '<p class="irs-cookie-row-desc">Used to show relevant ads and measure their effectiveness.</p>' +
        '</div>' +
        '<div class="irs-cookie-panel-footer">' +
          '<button type="button" class="irs-cookie-btn irs-cookie-btn-accept irs-cookie-btn-block" id="irs-cookie-save">Save Preferences</button>' +
          '<button type="button" class="irs-cookie-btn irs-cookie-btn-manage irs-cookie-btn-block" id="irs-cookie-accept-all">Accept All</button>' +
        '</div>' +
      '</div>'
    );
  }

  function showPanel(analyticsOn, advertisingOn) {
    var existing = document.getElementById('irs-cookie-overlay');
    if (existing) existing.remove();

    var banner = document.getElementById('irs-cookie-banner');
    if (banner) banner.style.display = 'none';

    var overlay = document.createElement('div');
    overlay.id = 'irs-cookie-overlay';
    overlay.className = 'irs-cookie-overlay';
    overlay.innerHTML = getPanelHtml(analyticsOn, advertisingOn);
    document.body.appendChild(overlay);
    document.body.classList.add('irs-cookie-panel-open');

    document.getElementById('irs-cookie-save').addEventListener('click', saveFromPanel);
    document.getElementById('irs-cookie-accept-all').addEventListener('click', acceptAll);
    document.getElementById('irs-cookie-panel-close').addEventListener('click', function () {
      if (overlay) overlay.remove();
      document.body.classList.remove('irs-cookie-panel-open');
      if (banner && !readStored()) banner.style.display = '';
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.remove();
        document.body.classList.remove('irs-cookie-panel-open');
        if (banner && !readStored()) banner.style.display = '';
      }
    });
  }

  function showBanner() {
    if (document.getElementById('irs-cookie-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'irs-cookie-banner';
    banner.className = 'irs-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie notice');
    banner.innerHTML =
      '<button type="button" class="irs-cookie-banner-close" id="irs-cookie-banner-close" aria-label="Close and use essential cookies only">&times;</button>' +
      '<div class="irs-cookie-banner-inner">' +
        '<p class="irs-cookie-banner-text">' +
          'We use cookies to keep your booking running smoothly and to understand how people use our site. ' +
          '<a href="/privacy.html#cookies">Learn more</a>' +
        '</p>' +
        '<div class="irs-cookie-banner-actions">' +
          '<button type="button" class="irs-cookie-btn irs-cookie-btn-accept" id="irs-cookie-accept">Accept</button>' +
          '<button type="button" class="irs-cookie-btn irs-cookie-btn-manage" id="irs-cookie-manage">Manage Cookies</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    document.body.classList.add('irs-cookie-banner-open');

    document.getElementById('irs-cookie-accept').addEventListener('click', acceptAll);
    document.getElementById('irs-cookie-banner-close').addEventListener('click', essentialOnly);
    document.getElementById('irs-cookie-manage').addEventListener('click', function () {
      var stored = readStored();
      showPanel(
        stored ? stored.analytics : false,
        stored ? stored.advertising : false
      );
    });
  }

  function init() {
    var stored = readStored();
    if (stored) {
      applyPreferences(stored);
    } else {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
