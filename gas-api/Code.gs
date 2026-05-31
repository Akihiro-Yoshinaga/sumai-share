// ===== 設定 =====
var SPREADSHEET_ID   = '1yEtOotpg8UiVIshdAAUnrvnA3PWDOvHfA0rN_iGEbPQ';
var SHEET_CONDITIONS = '表_1';
var SHEET_PROPERTIES = '物件';
var SHEET_ROUTINES   = 'ルーティン';
var SHEET_TASKS      = 'タスク';

// ===== エントリポイント =====
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    // GETのbodyパラメータ（JSON文字列）またはPOSTボディを解析
    var body = {};
    if (params.body) {
      try { body = JSON.parse(params.body); } catch (_) {}
    } else if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (_) {}
    }
    var action = params.action || body.action || '';

    if (action === 'getConditions')   { output.setContent(JSON.stringify(getConditions()));                   return output; }
    if (action === 'saveConditions')  { output.setContent(JSON.stringify(saveConditions(body.rows || []))); return output; }
    if (action === 'getProperties')   { output.setContent(JSON.stringify(getProperties()));                   return output; }
    if (action === 'saveProperties')  { output.setContent(JSON.stringify(saveProperties(Array.isArray(body) ? body : (body.properties || [])))); return output; }
    if (action === 'getRoutines')     { output.setContent(JSON.stringify(getJsonSheet(SHEET_ROUTINES)));      return output; }
    if (action === 'saveRoutines')    { output.setContent(JSON.stringify(saveJsonSheet(SHEET_ROUTINES, Array.isArray(body) ? body : body.data))); return output; }
    if (action === 'getTasks')        { output.setContent(JSON.stringify(getJsonSheet(SHEET_TASKS)));         return output; }
    if (action === 'saveTasks')       { output.setContent(JSON.stringify(saveJsonSheet(SHEET_TASKS, Array.isArray(body) ? body : body.data)));    return output; }

    output.setContent(JSON.stringify({ error: 'unknown action: ' + action }));
    return output;
  } catch (err) {
    output.setContent(JSON.stringify({ error: err.toString() }));
    return output;
  }
}

// ===== 物件: 取得 =====
function getProperties() {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_PROPERTIES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PROPERTIES);
      sheet.getRange(1, 1).setValue('json');
      return { data: [] };
    }
    var val = sheet.getRange(2, 1).getValue();
    if (!val) return { data: [] };
    return { data: JSON.parse(String(val)) };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 物件: 保存 =====
function saveProperties(properties) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_PROPERTIES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PROPERTIES);
      sheet.getRange(1, 1).setValue('json');
    }
    sheet.getRange(2, 1).setValue(JSON.stringify(properties));
    return { success: true };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 汎用JSONシート: 取得 =====
function getJsonSheet(sheetName) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1).setValue('json');
      return { data: null };
    }
    var val = sheet.getRange(2, 1).getValue();
    if (!val) return { data: null };
    return { data: JSON.parse(String(val)) };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 汎用JSONシート: 保存 =====
function saveJsonSheet(sheetName, data) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1).setValue('json');
    }
    sheet.getRange(2, 1).setValue(JSON.stringify(data));
    return { success: true };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 条件: 取得 =====
function getConditions() {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found: ' + SHEET_CONDITIONS };
    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return { data: [] };
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row    = rows[i];
      var item   = row[1] ? String(row[1]).trim() : '';
      var detail = row[2] ? String(row[2]).trim() : '';
      if (!item && !detail) continue;
      result.push({
        id:       'row_' + i,
        category: row[0] ? String(row[0]).trim() : '',
        item:     item,
        detail:   detail,
        priority: row[3] ? String(row[3]).trim() : '',
        note:     row[4] ? String(row[4]).trim() : ''
      });
    }
    return { data: result };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 条件: 保存 =====
function saveConditions(rows) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found' };
    var header = sheet.getRange(1, 1, 1, 5).getValues()[0];
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 5).setValues([header]);
    if (rows.length > 0) {
      var writeData = rows.map(function(r) {
        return [r.category||'', r.item||'', r.detail||'', r.priority||'', r.note||''];
      });
      sheet.getRange(2, 1, writeData.length, 5).setValues(writeData);
    }
    return { success: true };
  } catch (err) { return { error: err.toString() }; }
}
