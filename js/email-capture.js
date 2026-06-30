// Shared helper to send simple email captures to the I Read Space Bookings sheet (Sheet2 tab)
(function() {
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwL-3NpOQHeVfwFjEUBvsFwqi3NNKsU773OuOy3YNLSLhogTD9q1GCr4KRwZaoWU061/exec';
  var SHEET_NAME = 'Sheet2';
  var TRACKER_PDF_PATH = '../../assets/43day-reset-tracker-FINAL.pptx.pdf';
  var honeypotCounter = 0;
  var recaptchaLoadPromise = null;

  function loadRecaptchaModule() {
    if (window.IRSRecaptcha) {
      return Promise.resolve();
    }
    if (recaptchaLoadPromise) {
      return recaptchaLoadPromise;
    }

    recaptchaLoadPromise = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = '/js/recaptcha.js?v=7';
      script.async = true;
      script.onload = function() { resolve(); };
      script.onerror = function() { reject(new Error('reCAPTCHA failed to load')); };
      document.head.appendChild(script);
    });

    return recaptchaLoadPromise;
  }

  function getRecaptchaToken(action) {
    return loadRecaptchaModule().then(function() {
      return window.IRSRecaptcha.getToken(action);
    });
  }

  function isValidEmail(value) {
    if (!value || typeof value !== 'string') return false;
    var trimmed = value.trim();
    if (trimmed.length === 0) return false;
    var at = trimmed.indexOf('@');
    if (at <= 0 || at === trimmed.length - 1) return false;
    var after = trimmed.slice(at + 1);
    if (after.indexOf('.') <= 0 || after.length < 3) return false;
    return true;
  }

  function ensureHoneypotField(container) {
    if (!container) return null;
    var existing = container.querySelector('input[name="website"]');
    if (existing) return existing;

    honeypotCounter += 1;
    var fieldId = 'email-capture-website-' + honeypotCounter;

    var wrap = document.createElement('div');
    wrap.className = 'intake-honeypot-wrap';
    wrap.setAttribute('aria-hidden', 'true');

    var label = document.createElement('label');
    label.setAttribute('for', fieldId);
    label.textContent = 'Website';

    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'website';
    input.id = fieldId;
    input.tabIndex = -1;
    input.autocomplete = 'off';

    wrap.appendChild(label);
    wrap.appendChild(input);
    container.insertBefore(wrap, container.firstChild);
    return input;
  }

  function readHoneypotValue(container) {
    if (!container) return '';
    var field = container.querySelector('input[name="website"]');
    return field ? (field.value || '').trim() : '';
  }

  function sendEmailToSheets(email, source, website, recaptchaToken) {
    if (!email) return;

    try {
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.name = 'email-capture-' + Date.now();
      document.body.appendChild(iframe);

      var form = document.createElement('form');
      form.method = 'POST';
      form.action = GOOGLE_SCRIPT_URL;
      form.target = iframe.name;
      form.style.display = 'none';

      var dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'data';
      dataInput.value = JSON.stringify({
        email: email,
        source: source || '',
        website: website || '',
        recaptchaToken: recaptchaToken || ''
      });
      form.appendChild(dataInput);

      var sheetInput = document.createElement('input');
      sheetInput.type = 'hidden';
      sheetInput.name = 'sheetName';
      sheetInput.value = SHEET_NAME;
      form.appendChild(sheetInput);

      document.body.appendChild(form);
      form.submit();

      setTimeout(function() {
        try {
          if (form.parentNode) form.parentNode.removeChild(form);
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        } catch (e) {}
      }, 3000);
    } catch (err) {
      console.error('Error submitting email to Google Sheets:', err);
    }
  }

  function handleInsightEmailForm() {
    var form = document.getElementById('email-form');
    if (!form) return;
    ensureHoneypotField(form);

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var input = form.querySelector('input[name="email"]');
      var btn = form.querySelector('button');
      if (!input || !btn || btn.disabled) return;

      var email = (input.value || '').trim();
      if (!email) {
        input.focus();
        return;
      }

      var source =
        (document.querySelector('article.insight-article h1') &&
          document.querySelector('article.insight-article h1').textContent) ||
        document.title ||
        'Insight';

      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');

      getRecaptchaToken('email_capture').then(function(recaptchaToken) {
        btn.textContent = 'Subscribed!';
        sendEmailToSheets(email, source, readHoneypotValue(form), recaptchaToken);
      }).catch(function() {
        btn.disabled = false;
        btn.removeAttribute('aria-disabled');
        alert('Security check failed. Please refresh the page and try again.');
      });
    });
  }

  function handleResetTrackerEmail() {
    var emailInput = document.getElementById('tracker-email');
    var trackerBtn = document.getElementById('get-tracker-btn');
    if (!emailInput || !trackerBtn) return;

    var trackerWrap = emailInput.closest('.field') || emailInput.parentElement;
    ensureHoneypotField(trackerWrap);

    function setButtonState(valid) {
      trackerBtn.disabled = !valid;
      trackerBtn.setAttribute('aria-disabled', valid ? 'false' : 'true');
    }

    setButtonState(false);

    emailInput.addEventListener('input', function() {
      setButtonState(isValidEmail(emailInput.value));
    });
    emailInput.addEventListener('blur', function() {
      setButtonState(isValidEmail(emailInput.value));
    });

    trackerBtn.addEventListener('click', function() {
      if (trackerBtn.disabled) return;

      var email = (emailInput.value || '').trim();
      if (!isValidEmail(email)) {
        emailInput.focus();
        emailInput.setAttribute('aria-invalid', 'true');
        return;
      }
      emailInput.setAttribute('aria-invalid', 'false');

      var source =
        (document.querySelector('main h1') && document.querySelector('main h1').textContent) ||
        'Ascendant Reset Tracker';

      trackerBtn.disabled = true;
      trackerBtn.setAttribute('aria-disabled', 'true');

      getRecaptchaToken('email_capture').then(function(recaptchaToken) {
        trackerBtn.textContent = 'Sent!';
        sendEmailToSheets(email, source, readHoneypotValue(trackerWrap), recaptchaToken);

        var a = document.createElement('a');
        a.href = TRACKER_PDF_PATH;
        a.download = '43-Day-Reset-Tracker.pdf';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }).catch(function() {
        trackerBtn.disabled = false;
        trackerBtn.removeAttribute('aria-disabled');
        alert('Security check failed. Please refresh the page and try again.');
      });
    });
  }

  function handleGenericEmailCaptureForms() {
    var forms = document.querySelectorAll('form[data-email-capture]');
    if (!forms || !forms.length) return;

    forms.forEach(function(form) {
      if (form.dataset.captureBound === 'true') return;
      form.dataset.captureBound = 'true';
      ensureHoneypotField(form);

      form.addEventListener('submit', function(e) {
        e.preventDefault();

        var input = form.querySelector('input[name="email"]');
        var btn = form.querySelector('button[type="submit"], button');
        if (!input || !btn || btn.disabled) return;

        var email = (input.value || '').trim();
        if (!isValidEmail(email)) {
          input.focus();
          input.setAttribute('aria-invalid', 'true');
          return;
        }
        input.setAttribute('aria-invalid', 'false');

        var source =
          form.getAttribute('data-source') ||
          document.title ||
          'Website Email Capture';
        var successText =
          form.getAttribute('data-success-text') ||
          'Subscribed!';

        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');

        getRecaptchaToken('email_capture').then(function(recaptchaToken) {
          btn.textContent = successText;
          sendEmailToSheets(email, source, readHoneypotValue(form), recaptchaToken);
        }).catch(function() {
          btn.disabled = false;
          btn.removeAttribute('aria-disabled');
          alert('Security check failed. Please refresh the page and try again.');
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      handleInsightEmailForm();
      handleResetTrackerEmail();
      handleGenericEmailCaptureForms();
    });
  } else {
    handleInsightEmailForm();
    handleResetTrackerEmail();
    handleGenericEmailCaptureForms();
  }
})();
