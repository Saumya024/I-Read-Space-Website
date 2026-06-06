/**
 * Google Apps Script Web App for Intake Form Submission
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1JAJh_uGHo6VBHtWtiiOMzWc0zTnSNX7DPKvbl5e2r68/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Replace 'YOUR_SHEET_NAME' with your actual sheet name (usually 'Sheet1' or the tab name)
 * 5. Click "Deploy" > "New deployment"
 * 6. Click the gear icon next to "Select type" and choose "Web app"
 * 7. Set:
 *    - Description: "Intake Form Web App"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy"
 * 9. Copy the Web App URL and use it in intake.html
 * 10. Click "Authorize access" and grant permissions
 */

// Must match the tab name in your Google Sheet.
var SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    // Allow overriding the target sheet via a `sheetName` parameter (e.g. 'Sheet2')
    var sheetNameFromParam = (e && e.parameter && e.parameter.sheetName) ? e.parameter.sheetName : null;
    var defaultSheetName = (typeof SHEET_NAME !== 'undefined' && SHEET_NAME) ? SHEET_NAME : 'Sheet1';
    var sheetName = sheetNameFromParam || defaultSheetName;
    let data;

    // Handle both JSON and form data
    if (e.postData && e.postData.contents) {
      var raw = e.postData.contents;
      // Try to parse as JSON first (e.g. fetch with JSON body)
      try {
        data = JSON.parse(raw);
      } catch (jsonError) {
        // Form-encoded body (e.g. form POST): data=...&sheetName=Sheet2
        if (e.parameter && e.parameter.data) {
          data = JSON.parse(e.parameter.data);
          if (e.parameter.sheetName) sheetName = e.parameter.sheetName;
        } else {
          // Manual parse form-encoded in case e.parameter not set
          try {
            var decoded = decodeURIComponent(raw.replace(/\+/g, ' '));
            var parts = decoded.split('&');
            var params = {};
            for (var i = 0; i < parts.length; i++) {
              var kv = parts[i].split('=');
              if (kv.length >= 2) {
                params[kv[0]] = kv.slice(1).join('=').trim();
              }
            }
            if (params.data) data = JSON.parse(params.data);
            if (params.sheetName) sheetName = params.sheetName;
          } catch (parseErr) {}
          if (!data) data = e.parameter || {};
        }
      }
    } else if (e.parameter) {
      // GET-style or form params only
      if (e.parameter.data) {
        data = JSON.parse(e.parameter.data);
      } else {
        data = e.parameter;
      }
      if (e.parameter.sheetName) sheetName = e.parameter.sheetName;
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Open the spreadsheet by ID
    const spreadsheetId = '1JAJh_uGHo6VBHtWtiiOMzWc0zTnSNX7DPKvbl5e2r68';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet not found: ' + sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Check if sheet is empty or has headers
    const lastRow = sheet.getLastRow();
    let headers = [];
    let rowData = [];

    // Simple email capture (e.g. tracker / insight) – only email and source.
    // When target is Sheet2, always treat as email+source if payload has email (so Sheet2 always fills).
    var isSheet2 = (sheetName === 'Sheet2');
    var hasEmailOnly = data && typeof data.email === 'string' && data.email.trim() !== '' && !data.name && !data.phone;
    var isSimpleCapture = hasEmailOnly || (isSheet2 && data && typeof data.email === 'string' && data.email.trim() !== '');
    if (isSimpleCapture && (lastRow === 0 || isSheet2)) {
      if (lastRow === 0) {
        headers = ['Email', 'Source', 'Timestamp'];
        sheet.appendRow(headers);
      } else {
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      }
      rowData = headers.map(function(header) {
        var h = header.toString().toLowerCase().trim();
        if (h.indexOf('email') !== -1) return (data.email || '').trim();
        if (h.indexOf('source') !== -1) return (data.source || '').trim();
        if (h.indexOf('timestamp') !== -1 || h.indexOf('date') !== -1) return new Date();
        return '';
      });
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Data added successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (lastRow === 0) {
      // Sheet is empty - create headers and add data
      headers = ['Name', 'Email', 'Phone', 'Date of Birth', 'Time of Birth', 'Time of Birth Accuracy', 'Place of Birth', 'Primary Area', 'Unclear Question', 'Session Type', 'Duration', 'Investment', 'Package', 'Timestamp', 'Chart 2 Name', 'Chart 2 Date of Birth', 'Chart 2 Time of Birth', 'Chart 2 Time of Birth Accuracy', 'Chart 2 Place of Birth', 'Chart 3 Name', 'Chart 3 Date of Birth', 'Chart 3 Time of Birth', 'Chart 3 Time of Birth Accuracy', 'Chart 3 Place of Birth'];
      rowData = [
        data.name || '',
        data.email || '',
        data.phone || '',
        data.dob || '',
        data.tob || '',
        data.timeOfBirthAccuracy || '',
        data.pob || '',
        data.area || '',
        data.unclear || '',
        data.sessionType || '',
        data.duration || '',
        data.investment || '',
        data.isPackage ? 'Yes' : 'No',
        new Date(),
        (data.chart2_name || ''),
        (data.chart2_dob || ''),
        (data.chart2_tob || ''),
        (data.chart2_tob_accuracy || ''),
        (data.chart2_pob || ''),
        (data.chart3_name || ''),
        (data.chart3_dob || ''),
        (data.chart3_tob || ''),
        (data.chart3_tob_accuracy || ''),
        (data.chart3_pob || '')
      ];

      // Add headers as first row
      sheet.appendRow(headers);
      // Add data as second row
      sheet.appendRow(rowData);

      Logger.log('Sheet was empty - created headers and added first row');
    } else {
      // Sheet has data - get headers from first row
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      // Prepare the row data in the same order as headers
      rowData = headers.map(header => {
        // Normalize header names (remove extra spaces, convert to lowercase for matching)
        const normalizedHeader = header.toString().toLowerCase().trim();

        // Map form fields to sheet headers (case-insensitive matching)
        if (normalizedHeader === 'name' || (normalizedHeader.includes('name') && !normalizedHeader.includes('chart') && !normalizedHeader.includes('phone'))) {
          return data.name || '';
        } else if (normalizedHeader.includes('email')) {
          return data.email || '';
        } else if (normalizedHeader.includes('source')) {
          return data.source || '';
        } else if (normalizedHeader.includes('phone')) {
          return data.phone || '';
        } else if ((normalizedHeader.includes('date of birth') || normalizedHeader.includes('dob')) && !normalizedHeader.includes('chart 2') && !normalizedHeader.includes('chart 3')) {
          return data.dob || '';
        } else if ((normalizedHeader.includes('time of birth') || normalizedHeader.includes('tob')) && !normalizedHeader.includes('chart 2') && !normalizedHeader.includes('chart 3')) {
          return data.tob || '';
        } else if ((normalizedHeader.includes('time of birth accuracy') || normalizedHeader.includes('time accuracy') || normalizedHeader.includes('time certainty')) && !normalizedHeader.includes('chart 2') && !normalizedHeader.includes('chart 3')) {
          return data.timeOfBirthAccuracy || '';
        } else if ((normalizedHeader.includes('place of birth') || normalizedHeader.includes('pob')) && !normalizedHeader.includes('chart 2') && !normalizedHeader.includes('chart 3')) {
          return data.pob || '';
        } else if (normalizedHeader.includes('area') || normalizedHeader.includes('primary area') || normalizedHeader.includes('guidance')) {
          return data.area || '';
        } else if (normalizedHeader.includes('unclear') || normalizedHeader.includes('what feels') || (normalizedHeader.includes('question') && !normalizedHeader.includes('chart'))) {
          return data.unclear || '';
        } else if (normalizedHeader.includes('session type') || (normalizedHeader === 'type')) {
          return data.sessionType || '';
        } else if (normalizedHeader.includes('duration') && !normalizedHeader.includes('chart')) {
          return data.duration || '';
        } else if (normalizedHeader.includes('investment') || normalizedHeader.includes('investement') || normalizedHeader.includes('price') || normalizedHeader.includes('amount')) {
          return data.investment || data.price || data.amount || '';
        } else if (normalizedHeader.includes('package')) {
          return data.isPackage ? 'Yes' : 'No';
        } else if (normalizedHeader.includes('timestamp') || normalizedHeader.includes('date submitted') || normalizedHeader.includes('submitted')) {
          return new Date();
        } else if (normalizedHeader.includes('chart 2') && normalizedHeader.includes('name')) {
          return data.chart2_name || '';
        } else if (normalizedHeader.includes('chart 2') && (normalizedHeader.includes('date') || normalizedHeader.includes('dob'))) {
          return data.chart2_dob || '';
        } else if (normalizedHeader.includes('chart 2') && (normalizedHeader.includes('time of birth accuracy') || normalizedHeader.includes('time accuracy') || normalizedHeader.includes('time certainty'))) {
          return data.chart2_tob_accuracy || '';
        } else if (normalizedHeader.includes('chart 2') && (normalizedHeader.includes('time') || normalizedHeader.includes('tob'))) {
          return data.chart2_tob || '';
        } else if (normalizedHeader.includes('chart 2') && (normalizedHeader.includes('place') || normalizedHeader.includes('pob'))) {
          return data.chart2_pob || '';
        } else if (normalizedHeader.includes('chart 3') && normalizedHeader.includes('name')) {
          return data.chart3_name || '';
        } else if (normalizedHeader.includes('chart 3') && (normalizedHeader.includes('date') || normalizedHeader.includes('dob'))) {
          return data.chart3_dob || '';
        } else if (normalizedHeader.includes('chart 3') && (normalizedHeader.includes('time of birth accuracy') || normalizedHeader.includes('time accuracy') || normalizedHeader.includes('time certainty'))) {
          return data.chart3_tob_accuracy || '';
        } else if (normalizedHeader.includes('chart 3') && (normalizedHeader.includes('time') || normalizedHeader.includes('tob'))) {
          return data.chart3_tob || '';
        } else if (normalizedHeader.includes('chart 3') && (normalizedHeader.includes('place') || normalizedHeader.includes('pob'))) {
          return data.chart3_pob || '';
        } else {
          // If header doesn't match any known field, return empty string
          return '';
        }
      });

      // Append the row to the sheet
      sheet.appendRow(rowData);
    }

    // Log the data being processed (for debugging - check Apps Script execution log)
    Logger.log('Received data: ' + JSON.stringify(data));
    Logger.log('Headers: ' + JSON.stringify(headers));
    Logger.log('Row data: ' + JSON.stringify(rowData));
    Logger.log('Sheet last row before append: ' + lastRow);

    // Log success
    Logger.log('Row appended successfully');

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data added successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log error details
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);

    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// doGet function for testing (when accessing URL directly in browser)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script is working. Use POST to submit form data.',
    sheetName: 'Sheet1',
    spreadsheetId: '1JAJh_uGHo6VBHtWtiiOMzWc0zTnSNX7DPKvbl5e2r68'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function (optional - for testing in Apps Script editor)
function testDoPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        dob: '1990-01-01',
        tob: '10:00',
        pob: 'New York, USA',
        timeOfBirthAccuracy: 'Approximate time of birth',
        area: 'Career & Finances',
        unclear: 'Test question',
        sessionType: 'audio',
        duration: '60',
        investment: '₹2,400',
        isPackage: false,
        chart2_name: '',
        chart2_dob: '',
        chart2_tob: '',
        chart2_tob_accuracy: '',
        chart2_pob: '',
        chart3_name: '',
        chart3_dob: '',
        chart3_tob: '',
        chart3_tob_accuracy: '',
        chart3_pob: ''
      })
    }
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
