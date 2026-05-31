var ALLOWED_EMAILS = [
  'akihiro.55594@gmail.com',
  'akari.4n@gmail.com'
];

var SPREADSHEET_ID = '1yEtOotpg8UiVIshdAAUnrvnA3PWDOvHfA0rN_iGEbPQ';
var SHEET_CONDITIONS = '表_1';

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

  // action パラメータで API モードに切り替え
  var action = e && e.parameter && e.parameter.action;

  if (action === 'getConditions') {
    return jsonResponse(getConditions());
  }
  if (action === 'saveConditions') {
    var body = e && e.parameter && e.parameter.body ? JSON.parse(e.parameter.body) : [];
    return jsonResponse(saveConditions(body));
  }

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

function getConditions() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found: ' + SHEET_CONDITIONS };

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return { data: [] };

    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var category  = row[0] ? String(row[0]).trim() : '';
      var item      = row[1] ? String(row[1]).trim() : '';
      var detail    = row[2] ? String(row[2]).trim() : '';
      var priority  = row[3] ? String(row[3]).trim() : '';
      var note      = row[4] ? String(row[4]).trim() : '';

      if (!item && !detail) continue;

      result.push({
        id: 'row_' + i,
        category: category,
        item: item,
        detail: detail,
        priority: priority,  // MUST / WANT / -
        note: note
      });
    }
    return { data: result };
  } catch (err) {
    return { error: err.toString() };
  }
}

function saveConditions(rows) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found' };

    // ヘッダー行を保持して2行目以降を書き直す
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
