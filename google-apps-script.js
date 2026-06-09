/**
 * Google Apps Script Web App for Intake Form + Cal.com Booking
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1JAJh_uGHo6VBHtWtiiOMzWc0zTnSNX7DPKvbl5e2r68/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete ALL existing code in the editor, then paste this ENTIRE file
 *    (from line 1 through the end — including the SHEET_NAME constants at the top)
 * 4. Replace 'Sheet1' with your actual sheet tab name if different
 * 5. Add your Cal.com API key as a Script Property:
 *    - Apps Script editor > Project Settings (gear) > Script properties
 *    - Add property: CAL_API_KEY = cal_live_...
 *    OR run setupCalApiKey() once from the editor (see bottom of file)
 * 6. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the Web App URL into intake.html / js/booking-shared.js
 */

const SHEET_NAME = 'Sheet1';
const CAL_USERNAME = 'i-read-space';
const EVENT_SLUGS = {
  '30': '30min',
  '60': '60min',
  '90': '90min'
};

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
      error: 'Invalid response from Cal.com',
      raw: body
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
    error: message,
    details: parsed
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
      return jsonResponse_(createCalBooking_(data));
    }

    return jsonResponse_(saveIntake_(data));
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'ping') {
    return jsonResponse_({
      success: true,
      message: 'Google Apps Script is working',
      hasCalApiKey: !!getCalApiKey_()
    });
  }

  return jsonResponse_({
    success: true,
    message: 'Google Apps Script is working. Use POST to submit form data or create bookings.',
    sheetName: SHEET_NAME
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

/**
 * Run once from the Apps Script editor to store your Cal.com API key.
 * After running successfully, remove your key from this function.
 */
function setupCalApiKey() {
  PropertiesService.getScriptProperties().setProperty('CAL_API_KEY', 'PASTE_YOUR_KEY_HERE');
  Logger.log('CAL_API_KEY saved to Script Properties');
}
