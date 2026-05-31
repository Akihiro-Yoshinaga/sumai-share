var ALLOWED_EMAILS = [
  'akihiro.55594@gmail.com',
  'akari.4n@gmail.com'
];

var SPREADSHEET_ID   = '1yEtOotpg8UiVIshdAAUnrvnA3PWDOvHfA0rN_iGEbPQ';
var SHEET_CONDITIONS = '表_1';
var SHEET_PROPERTIES = '物件';
var SHEET_ROUTINES   = 'ルーティン';
var SHEET_TASKS      = 'タスク';

function doGet(e) {
  var email = Session.getActiveUser().getEmail();

  if (ALLOWED_EMAILS.indexOf(email) === -1) {
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'font-family:-apple-system,sans-serif;background:#f8fafc;}' +
      '.box{text-align:center;padding:40px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;max-width:360px;}' +
      '</style></head><body><div class="box"><div style="font-size:40px;margin-bottom:16px">🔒</div>' +
      '<h1 style="font-size:18px;color:#102a43">アクセスできません</h1>' +
      '<p style="font-size:13px;color:#64748b">' + email + '</p></div></body></html>'
    ).setTitle('アクセス拒否');
  }

  var action = e && e.parameter && e.parameter.action;
  var body = {};
  if (e && e.parameter && e.parameter.body) {
    try { body = JSON.parse(e.parameter.body); } catch (_) {}
  }

  if (action === 'getConditions')          { return jsonResponse(getConditions()); }
  if (action === 'saveConditions')         { return jsonResponse(saveConditions(body)); }
  if (action === 'getProperties')          { return jsonResponse(getProperties()); }
  if (action === 'saveProperties')         { return jsonResponse(saveProperties(Array.isArray(body) ? body : (body.properties || []))); }
  if (action === 'getRoutines')            { return jsonResponse(getJsonSheet(SHEET_ROUTINES)); }
  if (action === 'saveRoutines')           { return jsonResponse(saveJsonSheet(SHEET_ROUTINES, Array.isArray(body) ? body : body.data)); }
  if (action === 'getTasks')               { return jsonResponse(getJsonSheet(SHEET_TASKS)); }
  if (action === 'saveTasks')              { return jsonResponse(saveJsonSheet(SHEET_TASKS, Array.isArray(body) ? body : body.data)); }
  if (action === 'analyzePropertyImages')  { return jsonResponse(analyzePropertyImages(body.images || [])); }

  // 通常アクセス: React アプリを返す
  var js0 = HtmlService.createHtmlOutputFromFile('js_part_0').getContent();
  var js1 = HtmlService.createHtmlOutputFromFile('js_part_1').getContent();
  var js2 = HtmlService.createHtmlOutputFromFile('js_part_2').getContent();
  var js3 = HtmlService.createHtmlOutputFromFile('js_part_3').getContent();

  var html = '<!DOCTYPE html><html lang="ja"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>すまいシェア</title>'
    + '</head><body>'
    + '<div id="root"></div>'
    + '<script>' + js0 + js1 + js2 + js3 + '</script>'
    + '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('すまいシェア')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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

// ===== Gemini画像解析 =====
function analyzePropertyImages(images) {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) return { error: 'GEMINI_API_KEY not set in script properties' };

    var prompt = [
      'これらの画像は同じ物件のスクリーンショットです（SUUMO・アットホーム等）。',
      '複数の画像から情報を統合して、以下のJSON形式で物件情報を抽出してください。値が読み取れない場合は空文字にしてください。',
      '{ "name": "物件名", "rent": 家賃の数値(円単位・管理費除く), "layout": "間取り", "sqm": 専有面積の数値(m²), "address": "住所" }',
      'JSONのみ返してください。説明文は不要です。'
    ].join('\n');

    var parts = [{ text: prompt }];
    for (var i = 0; i < images.length; i++) {
      parts.push({ inline_data: { mime_type: images[i].mimeType, data: images[i].base64 } });
    }

    var res = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { temperature: 0 } }),
        muteHttpExceptions: true
      }
    );

    var json = JSON.parse(res.getContentText());
    if (json.error) return { error: json.error.message };

    var text = json.candidates[0].content.parts[0].text;
    var m = text.match(/\{[\s\S]*\}/);
    if (!m) return { error: 'JSON not found in response' };
    return { data: JSON.parse(m[0]) };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 条件: 取得 =====
function getConditions() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found: ' + SHEET_CONDITIONS };

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return { data: [] };

    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row      = rows[i];
      var category = row[0] ? String(row[0]).trim() : '';
      var item     = row[1] ? String(row[1]).trim() : '';
      var detail   = row[2] ? String(row[2]).trim() : '';
      var priority = row[3] ? String(row[3]).trim() : '';
      var note     = row[4] ? String(row[4]).trim() : '';

      if (!item && !detail) continue;

      result.push({
        id: 'row_' + i,
        category: category,
        item: item,
        detail: detail,
        priority: priority,
        note: note
      });
    }
    return { data: result };
  } catch (err) {
    return { error: err.toString() };
  }
}

// ===== 条件: 保存 =====
function saveConditions(rows) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found' };

    var header = sheet.getRange(1, 1, 1, 5).getValues()[0];
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 5).setValues([header]);

    if (rows.length > 0) {
      var writeData = rows.map(function(r) {
        return [r.category || '', r.item || '', r.detail || '', r.priority || '', r.note || ''];
      });
      sheet.getRange(2, 1, writeData.length, 5).setValues(writeData);
    }
    return { success: true };
  } catch (err) {
    return { error: err.toString() };
  }
}
