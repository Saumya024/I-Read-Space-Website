/**
 * @OnlyCurrentDoc
 *
 * Google Apps Script Web App for Intake Form + Cal.com Booking
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1JAJh_uGHo6VBHtWtiiOMzWc0zTnSNX7DPKvbl5e2r68/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete ALL existing code in the editor, then paste this ENTIRE file
 *    (from line 1 through the end — including the SHEET_NAME constants at the top)
 * 4. Replace 'Sheet1' with your actual sheet tab name if different
 * 5. Project Settings (gear) > enable "Show appsscript.json manifest file in editor"
 *    - Open appsscript.json and paste the contents from appsscript.json in this repo
 *    - This fills oauthScopes + urlFetchWhitelist (the "security limitations" fields)
 * 6. Add your Cal.com API key as a Script Property:
 *    - Project Settings > Script properties
 *    - Add property: CAL_API_KEY = your key (never paste keys into this file)
 * 7. Deploy > New deployment > Web app
 *    - Execute as: Me (runs as you — required so anonymous visitors can write to your sheet)
 *    - Who has access: Anyone (required for ireadspace.com visitors without Google login)
 *    - Create a NEW version after every code or manifest change
 * 8. Copy the Web App URL into js/booking-shared.js (GOOGLE_SCRIPT_URL)
 *
 * SECURITY NOTE:
 * "Anyone" access cannot be restricted to ireadspace.com in the deploy dialog.
 * This script validates input, rate-limits by email, rejects honeypot spam,
 * and deduplicates Cal.com bookings via idempotency keys.
 * Optional later: Google reCAPTCHA v3 or Cloudflare Turnstile verification.
 */

const SHEET_NAME = 'Sheet1';
const CAL_USERNAME = 'i-read-space';
const RATE_LIMIT_WINDOW_SEC = 3600;
const IDEMPOTENCY_TTL_SEC = 86400;
const EVENT_SLUGS = {
  '30': '30min',
  '60': '60min',
  '90': '90min'
};
const ALLOWED_DURATIONS = ['30', '60', '90'];

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function isHoneypotTriggered_(data) {
  const trap = data && data.website;
  return typeof trap === 'string' && trap.trim() !== '';
}

function isValidEmail_(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidPhone_(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isValidName_(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 120;
}

function isValidSlotStart_(start) {
  if (!start || typeof start !== 'string') return false;
  const slotTime = new Date(start).getTime();
  if (isNaN(slotTime)) return false;
  return slotTime > Date.now() + (5 * 60 * 1000);
}

function isValidDuration_(duration) {
  return ALLOWED_DURATIONS.indexOf(String(duration)) !== -1;
}

function normalizeIdempotencyKey_(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length < 8 || trimmed.length > 64) return '';
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return '';
  return trimmed;
}

function getIdempotentBookingResult_(key) {
  const normalized = normalizeIdempotencyKey_(key);
  if (!normalized) return null;

  const cache = CacheService.getScriptCache();
  const cacheKey = 'idem_booking_' + normalized;
  const cached = cache.get(cacheKey);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch (error) {
    return null;
  }
}

function storeIdempotentBookingResult_(key, result) {
  const normalized = normalizeIdempotencyKey_(key);
  if (!normalized || !result || !result.success) return;

  const cache = CacheService.getScriptCache();
  cache.put('idem_booking_' + normalized, JSON.stringify(result), IDEMPOTENCY_TTL_SEC);
}

function createBookingWithIdempotency_(data) {
  const idemKey = data.idempotencyKey;
  const cached = getIdempotentBookingResult_(idemKey);
  if (cached) return cached;

  if (!normalizeIdempotencyKey_(idemKey)) {
    return createCalBooking_(data);
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    const retry = getIdempotentBookingResult_(idemKey);
    if (retry) return retry;
    return {
      success: false,
      error: 'Please wait a moment and try again.'
    };
  }

  try {
    const again = getIdempotentBookingResult_(idemKey);
    if (again) return again;

    const result = createCalBooking_(data);
    if (result && result.success) {
      storeIdempotentBookingResult_(idemKey, result);
    }
    return result;
  } finally {
    lock.releaseLock();
  }
}

function checkRateLimit_(email, action) {
  const normalized = normalizeEmail_(email);
  if (!normalized) {
    return { allowed: false, error: 'A valid email is required.' };
  }

  const limits = {
    createBooking: { max: 3, window: RATE_LIMIT_WINDOW_SEC },
    intake: { max: 5, window: RATE_LIMIT_WINDOW_SEC },
    emailCapture: { max: 5, window: RATE_LIMIT_WINDOW_SEC }
  };
  const config = limits[action] || limits.intake;

  const cache = CacheService.getScriptCache();
  const cacheKey = 'rl_' + action + '_' + Utilities.base64EncodeWebSafe(normalized).slice(0, 72);
  const current = cache.get(cacheKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= config.max) {
    return {
      allowed: false,
      error: 'Too many submissions from this email. Please try again in an hour.'
    };
  }

  cache.put(cacheKey, String(count + 1), config.window);
  return { allowed: true };
}

function validateBookingRequest_(data) {
  if (isHoneypotTriggered_(data)) {
    return { valid: false, isBot: true };
  }

  if (!isValidName_(data.name)) {
    return { valid: false, error: 'Please enter a valid name.' };
  }
  if (!isValidEmail_(data.email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (data.phone && !isValidPhone_(data.phone)) {
    return { valid: false, error: 'Please enter a valid phone number.' };
  }
  if (!isValidDuration_(data.duration)) {
    return { valid: false, error: 'Invalid session duration.' };
  }
  if (!isValidSlotStart_(data.start)) {
    return { valid: false, error: 'Please choose a valid upcoming time slot.' };
  }

  const rateLimit = checkRateLimit_(data.email, 'createBooking');
  if (!rateLimit.allowed) {
    return { valid: false, error: rateLimit.error };
  }

  return { valid: true };
}

function validateIntakeRequest_(data) {
  if (isHoneypotTriggered_(data)) {
    return { valid: false, isBot: true };
  }

  if (!isValidName_(data.name)) {
    return { valid: false, error: 'Please enter a valid name.' };
  }
  if (!isValidEmail_(data.email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (data.phone && !isValidPhone_(data.phone)) {
    return { valid: false, error: 'Please enter a valid phone number.' };
  }

  const rateLimit = checkRateLimit_(data.email, 'intake');
  if (!rateLimit.allowed) {
    return { valid: false, error: rateLimit.error };
  }

  return { valid: true };
}

function validateEmailCapture_(data) {
  if (isHoneypotTriggered_(data)) {
    return { valid: false, isBot: true };
  }
  if (!isValidEmail_(data.email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  const rateLimit = checkRateLimit_(data.email, 'emailCapture');
  if (!rateLimit.allowed) {
    return { valid: false, error: rateLimit.error };
  }

  return { valid: true };
}

function botSuccessResponse_() {
  return jsonResponse_({
    success: true,
    message: 'Data added successfully'
  });
}

function parseRequest_(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (jsonError) {
      if (e.parameter && e.parameter.data) {
        return JSON.parse(e.parameter.data);
      }
      return e.parameter || {};
    }
  }

  if (e.parameter) {
    if (e.parameter.data) {
      return JSON.parse(e.parameter.data);
    }
    return e.parameter;
  }

  return {};
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getCalApiKey_() {
  return PropertiesService.getScriptProperties().getProperty('CAL_API_KEY') || '';
}

function getEventSlug_(duration) {
  return EVENT_SLUGS[String(duration)] || EVENT_SLUGS['60'];
}

function createCalBooking_(data) {
  const payload = {
    eventTypeSlug: getEventSlug_(data.duration),
    username: CAL_USERNAME,
    start: data.start,
    attendee: {
      name: data.name || '',
      email: data.email || '',
      timeZone: data.timeZone || 'Asia/Kolkata'
    }
  };

  if (data.phone) {
    payload.attendee.phoneNumber = data.phone;
  }

  const headers = {
    'cal-api-version': '2024-08-13',
    'Content-Type': 'application/json'
  };

  const apiKey = getCalApiKey_();
  if (apiKey) {
    headers.Authorization = 'Bearer ' + apiKey;
  }

  const response = UrlFetchApp.fetch('https://api.cal.com/v2/bookings', {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  let parsed;

  try {
    parsed = JSON.parse(body);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid response from Cal.com'
    };
  }

  if (status >= 200 && status < 300 && parsed.status === 'success') {
    return {
      success: true,
      data: parsed.data
    };
  }

  const message = parsed && parsed.error && parsed.error.message
    ? parsed.error.message
    : 'Cal.com booking failed';

  return {
    success: false,
    error: message
  };
}

function saveIntake_(data) {
  const spreadsheetId = '1JAJh_uGHo6VBHtWtiiOMzWc0zTnSNX7DPKvbl5e2r68';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return {
      success: false,
      error: 'Sheet not found: ' + SHEET_NAME
    };
  }

  const lastRow = sheet.getLastRow();
  let headers = [];
  let rowData = [];

  if (lastRow === 0) {
    headers = [
      'Name', 'Email', 'Phone', 'Date of Birth', 'Time of Birth', 'Place of Birth',
      'Primary Area', 'Unclear Question', 'Session Type', 'Duration', 'Package',
      'Session Slot', 'Booking UID', 'Timezone', 'Timestamp'
    ];
    rowData = buildRowData_(headers, data);
    sheet.appendRow(headers);
    sheet.appendRow(rowData);
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    rowData = buildRowData_(headers, data);
    sheet.appendRow(rowData);
  }

  return {
    success: true,
    message: 'Data added successfully'
  };
}

function buildRowData_(headers, data) {
  return headers.map(function(header) {
    const normalizedHeader = header.toString().toLowerCase().trim();

    if (normalizedHeader.includes('name') && !normalizedHeader.includes('phone') && !normalizedHeader.includes('chart')) {
      return data.name || '';
    }
    if (normalizedHeader.includes('email')) return data.email || '';
    if (normalizedHeader.includes('phone')) return data.phone || '';
    if (normalizedHeader.includes('date of birth') || normalizedHeader === 'dob') return data.dob || '';
    if (normalizedHeader.includes('time of birth') || normalizedHeader === 'tob') return data.tob || '';
    if (normalizedHeader.includes('place of birth') || normalizedHeader === 'pob') return data.pob || '';
    if (normalizedHeader.includes('area') || normalizedHeader.includes('guidance')) return data.area || '';
    if (normalizedHeader.includes('unclear') || normalizedHeader.includes('question')) return data.unclear || '';
    if (normalizedHeader.includes('session type')) return data.sessionType || '';
    if (normalizedHeader.includes('duration') || normalizedHeader.includes('minutes')) return data.duration || '';
    if (normalizedHeader.includes('package')) return data.isPackage ? 'Yes' : 'No';
    if (normalizedHeader.includes('session slot') || normalizedHeader.includes('slot')) return data.slotLabel || data.slotStart || '';
    if (normalizedHeader.includes('booking uid') || normalizedHeader.includes('booking id')) return data.bookingUid || '';
    if (normalizedHeader.includes('timezone') || normalizedHeader.includes('time zone')) return data.timeZone || '';
    if (normalizedHeader.includes('timestamp') || normalizedHeader.includes('submitted')) return new Date();
    return '';
  });
}

function doPost(e) {
  try {
    const data = parseRequest_(e);
    const action = data.action || 'intake';

    if (action === 'createBooking') {
      const bookingCheck = validateBookingRequest_(data);
      if (!bookingCheck.valid) {
        if (bookingCheck.isBot) return botSuccessResponse_();
        return jsonResponse_({ success: false, error: bookingCheck.error });
      }
      return jsonResponse_(createBookingWithIdempotency_(data));
    }

    if (data.email && !data.name && !data.dob) {
      const captureCheck = validateEmailCapture_(data);
      if (!captureCheck.valid) {
        if (captureCheck.isBot) return botSuccessResponse_();
        return jsonResponse_({ success: false, error: captureCheck.error });
      }
      return jsonResponse_(saveIntake_(data));
    }

    const intakeCheck = validateIntakeRequest_(data);
    if (!intakeCheck.valid) {
      if (intakeCheck.isBot) return botSuccessResponse_();
      return jsonResponse_({ success: false, error: intakeCheck.error });
    }

    return jsonResponse_(saveIntake_(data));
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
}

function doGet(e) {
  return jsonResponse_({
    success: true,
    message: 'OK'
  });
}

function testDoPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'createBooking',
        duration: '60',
        start: '2026-06-12T18:00:00.000+05:30',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+919999999999',
        timeZone: 'Asia/Kolkata'
      })
    }
  };

  Logger.log(doPost(mockEvent).getContent());
}

