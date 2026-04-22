/**
 * ═══════════════════════════════════════════════════════════════
 * EdUHK SES6026 — Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to sheets.google.com → create a new blank spreadsheet
 * 2. Name it: "EdUHK SES6026 Responses"
 * 3. Click Extensions → Apps Script
 * 4. Delete any existing code and paste THIS entire file
 * 5. Click Save (Ctrl+S / disk icon)
 * 6. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone
 * 7. Click Deploy → Authorise access → allow permissions
 * 8. Copy the Web App URL and paste it into:
 *    - index.html  →  var SCRIPT_URL = 'YOUR_URL_HERE';
 *    - admin-dashboard.html  →  Data Management → Script URL field
 * ═══════════════════════════════════════════════════════════════
 */

var SHEET_NAME = 'Responses';

var FIELDS = [
  'submitted-at', 'consent-name', 'consent-date',
  'q1-mother-tongue', 'q2-age', 'q3-gender', 'q4-origin',
  'q5-university', 'q6-status', 'q7-degree-type', 'q7-year',
  'q8-grad-year', 'q9-subject', 'q10-full-part-time',
  'q11-study-mode', 'q12-ftf-pct', 'q12-online-pct',
  'q13-usage-freq', 'q14-reasons-not-using', 'q15-tool-used',
  'q16-reasons-using', 'q17-understanding', 'q18-understanding-factors',
  'q19-has-test', 'q20-test-taken', 'q21-test-result',
  'q22-preference', 'q23-online-bias', 'q24-bias-reasons', 'q25-accept-reasons'
];

var HEADERS = [
  'Submission ID', 'Submitted At', 'Consent Name', 'Consent Date',
  'Q1 Mother Tongue', 'Q2 Age', 'Q3 Gender', 'Q4 Origin',
  'Q5 University', 'Q6 Status', 'Q7 Degree Type', 'Q7 Year',
  'Q8 Grad Year', 'Q9 Subject', 'Q10 Full/Part-time',
  'Q11 Study Mode', 'Q12 FTF %', 'Q12 Online %',
  'Q13 Tool Usage', 'Q14 Reasons Not Using', 'Q15 Tool Used',
  'Q16 Reasons Using', 'Q17 Understanding', 'Q18 Understand Factors',
  'Q19 Has Test', 'Q20 Test Taken', 'Q21 Test Result',
  'Q22 Preference', 'Q23 Online Bias', 'Q24 Bias Reasons', 'Q25 Accept Reasons'
];

// ── ALL REQUESTS COME IN AS GET ──────────────────────────────────
// Survey submits via GET with action=submit&field=value&...
// Dashboard reads via GET with action=getAll

function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || 'submit';

  if (action === 'getAll') {
    var rows = getAllResponses();
    return jsonResponse(rows);
  }

  if (action === 'submit') {
    try {
      saveResponse(params);
      return jsonResponse({status: 'ok', message: 'Response saved successfully'});
    } catch(err) {
      return jsonResponse({status: 'error', message: err.toString()});
    }
  }

  return jsonResponse({status: 'ok', message: 'EdUHK SES6026 Script running'});
}

// Keep doPost as fallback
function doPost(e) {
  try {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch(x) {}
    saveResponse(data);
    return jsonResponse({status: 'ok'});
  } catch(err) {
    return jsonResponse({status: 'error', message: err.toString()});
  }
}

// ── SAVE RESPONSE ────────────────────────────────────────────────
function saveResponse(params) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    var hr = sheet.getRange(1, 1, 1, HEADERS.length);
    hr.setFontWeight('bold');
    hr.setBackground('#0d1b2a');
    hr.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  var row = [
    'resp_' + new Date().getTime(),
    params['submitted-at']            || new Date().toISOString(),
    params['consent-name']            || '',
    params['consent-date']            || '',
    params['q1-mother-tongue']        || '',
    params['q2-age']                  || '',
    params['q3-gender']               || '',
    params['q4-origin']               || '',
    params['q5-university']           || '',
    params['q6-status']               || '',
    params['q7-degree-type']          || '',
    params['q7-year']                 || '',
    params['q8-grad-year']            || '',
    params['q9-subject']              || '',
    params['q10-full-part-time']      || '',
    params['q11-study-mode']          || '',
    params['q12-ftf-pct']             || '',
    params['q12-online-pct']          || '',
    params['q13-usage-freq']          || '',
    params['q14-reasons-not-using']   || '',
    params['q15-tool-used']           || '',
    params['q16-reasons-using']       || '',
    params['q17-understanding']       || '',
    params['q18-understanding-factors'] || '',
    params['q19-has-test']            || '',
    params['q20-test-taken']          || '',
    params['q21-test-result']         || '',
    params['q22-preference']          || '',
    params['q23-online-bias']         || '',
    params['q24-bias-reasons']        || '',
    params['q25-accept-reasons']      || '',
  ];

  sheet.appendRow(row);
  try { sheet.autoResizeColumns(1, HEADERS.length); } catch(x) {}
}

// ── READ ALL RESPONSES ───────────────────────────────────────────
function getAllResponses() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var headerToField = {};
  HEADERS.forEach(function(h, i) { headerToField[h] = FIELDS[i] || h; });

  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var key = headerToField[h] || h;
      obj[key] = row[i] !== undefined && row[i] !== null ? row[i].toString() : '';
    });
    // Add submitted-at alias
    if (!obj['submitted-at'] && obj['Submitted At']) obj['submitted-at'] = obj['Submitted At'];
    return obj;
  });
}

// ── JSON RESPONSE WITH CORS HEADERS ─────────────────────────────
function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
