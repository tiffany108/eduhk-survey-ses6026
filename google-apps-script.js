/**
 * EdUHK SES6026 — Google Apps Script Backend
 * 
 * SETUP:
 * 1. Go to sheets.google.com → create sheet named "EdUHK SES6026 Responses"
 * 2. Extensions → Apps Script → paste this code → Save
 * 3. Deploy → New deployment → Web app
 *    Execute as: Me | Who has access: Anyone
 * 4. Copy Web App URL → paste into index.html SCRIPT_URL and admin dashboard
 */

var SHEET_NAME = 'Responses';

// HEADERS and FIELDS must be same length and same order
var HEADERS = [
  'Submission ID',
  'Submitted At',
  'Consent Name',
  'Consent Date',
  'Q1 Mother Tongue',
  'Q2 Age',
  'Q3 Gender',
  'Q4 Origin',
  'Q5 University',
  'Q6 Status',
  'Q7 Degree Type',
  'Q7 Year of Study',
  'Q8 Degree Type (Alumni)',
  'Q8 Degree Other (Alumni)',
  'Q8 Graduation Year',
  'Q9 Subject',
  'Q10 Full/Part-time',
  'Q11 Study Mode',
  'Q12 Face-to-face %',
  'Q12 Online %',
  'Q13 Tool Usage Freq (1-7)',
  'Q14 Reasons NOT Using',
  'Q15 Tool Used',
  'Q16 Reasons FOR Using',
  'Q17 Understanding (1-7)',
  'Q18 Understanding Factors',
  'Q19 Has English Test',
  'Q20 Test Taken',
  'Q21 Test Result',
  'Q22 Mode Preference',
  'Q23 Online Bias',
  'Q24 Bias Reasons',
  'Q25 Accept Reasons'
];

var FIELDS = [
  'id',
  'submitted-at',
  'consent-name',
  'consent-date',
  'q1-mother-tongue',
  'q2-age',
  'q3-gender',
  'q4-origin',
  'q5-university',
  'q6-status',
  'q7-degree-type',
  'q7-year',
  'q8-degree-type',
  'q8-degree-type-other',
  'q8-grad-year',
  'q9-subject',
  'q10-full-part-time',
  'q11-study-mode',
  'q12-ftf-pct',
  'q12-online-pct',
  'q13-usage-freq',
  'q14-reasons-not-using',
  'q15-tool-used',
  'q16-reasons-using',
  'q17-understanding',
  'q18-understanding-factors',
  'q19-has-test',
  'q20-test-taken',
  'q21-test-result',
  'q22-preference',
  'q23-online-bias',
  'q24-bias-reasons',
  'q25-accept-reasons'
];

// All GET requests handled here
function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || 'submit';

  if (action === 'getAll') {
    return jsonResponse(getAllResponses());
  }
  if (action === 'submit') {
    try {
      saveResponse(params);
      return jsonResponse({status: 'ok', message: 'Response saved'});
    } catch(err) {
      return jsonResponse({status: 'error', message: err.toString()});
    }
  }
  if (action === 'deleteRow') {
    try {
      var rowId = params['id'] || '';
      deleteRowById(rowId);
      return jsonResponse({status: 'ok', message: 'Row deleted'});
    } catch(err) {
      return jsonResponse({status: 'error', message: err.toString()});
    }
  }
  if (action === 'clearAll') {
    try {
      clearAllResponses();
      return jsonResponse({status: 'ok', message: 'All responses cleared'});
    } catch(err) {
      return jsonResponse({status: 'error', message: err.toString()});
    }
  }
  return jsonResponse({status: 'ok', message: 'EdUHK SES6026 Script running'});
}

// POST fallback
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
    params['submitted-at']             || new Date().toISOString(),
    params['consent-name']             || '',
    params['consent-date']             || '',
    params['q1-mother-tongue']         || '',
    params['q2-age']                   || '',
    params['q3-gender']                || '',
    params['q4-origin']                || '',
    params['q5-university']            || '',
    params['q6-status']                || '',
    params['q7-degree-type']           || '',
    params['q7-year']                  || '',
    params['q8-degree-type']           || '',
    params['q8-degree-type-other']     || '',
    params['q8-grad-year']             || '',
    params['q9-subject']               || '',
    params['q10-full-part-time']       || '',
    params['q11-study-mode']           || '',
    params['q12-ftf-pct']              || '',
    params['q12-online-pct']           || '',
    params['q13-usage-freq']           || '',
    params['q14-reasons-not-using']    || '',
    params['q15-tool-used']            || '',
    params['q16-reasons-using']        || '',
    params['q17-understanding']        || '',
    params['q18-understanding-factors']|| '',
    params['q19-has-test']             || '',
    params['q20-test-taken']           || '',
    params['q21-test-result']          || '',
    params['q22-preference']           || '',
    params['q23-online-bias']          || '',
    params['q24-bias-reasons']         || '',
    params['q25-accept-reasons']       || '',
  ];

  sheet.appendRow(row);
  try { sheet.autoResizeColumns(1, HEADERS.length); } catch(x) {}
}

function getAllResponses() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var sheetHeaders = data[0];

  // Build header→field map from our HEADERS/FIELDS arrays
  var headerToField = {};
  HEADERS.forEach(function(h, i) {
    headerToField[h] = FIELDS[i];
  });

  return data.slice(1).map(function(row) {
    var obj = {};
    sheetHeaders.forEach(function(h, i) {
      var key = headerToField[h] || h;
      obj[key] = (row[i] !== undefined && row[i] !== null) ? row[i].toString() : '';
    });
    return obj;
  });
}

function deleteRowById(id) {
  if (!id) throw new Error('No ID provided');
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found');
  var data  = sheet.getDataRange().getValues();
  // Column 0 = Submission ID
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && data[i][0].toString() === id) {
      sheet.deleteRow(i + 1); // +1 because sheet rows are 1-indexed
      return;
    }
  }
  throw new Error('Row with ID ' + id + ' not found');
}

function clearAllResponses() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1); // keep header row
  }
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
